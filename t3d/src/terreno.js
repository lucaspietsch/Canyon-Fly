import { CatmullRomCurve3, Vector3, Mesh, PlaneGeometry, CircleGeometry, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, DoubleSide, InstancedMesh, CylinderGeometry, SphereGeometry, Object3D, Color } from "three";
import { canvasTex, rng } from "./lib.js";

/* ============================================================================================================
   TERRENO DO LADO DO VÃO: do cercado até a borda do cânion o campo de altitude desce até um vale (onde corre o riacho) e sobe de novo.
   O riacho vem da DIREITA de quem olha do recebimento para o lançamento (de fora do cercado, lado +z), corre pelo fundo do vale no sentido -z,
   faz uma curva de 80° para a direita (sentido +x) por uma garganta aberta na subida e cai no cânion, de frente para o lançamento.
   1 m = 2,94 u. O terreno é uma malha com alturas calculadas (a mesma função serve para o chão onde o Pit anda).
   ============================================================================================================ */
/* x0 = início da malha do vale; vx0 = onde o vale (descida e subida antes da borda) começa */
export const TERR = { x0: -320, vx0: 110, profundidade: -6.5, tv: .32 };

const sm = (s) => { s = Math.max(0, Math.min(1, s)); return s * s * (3 - 2 * s); };

export function criarTerreno({ g, chao, borda, caminho, texCampo, texRocha, texAgua, evitar = [] }){
  /* caminho do arroio (KML do usuário), suavizado e cortado onde chega ao lábio do cânion (x = borda) */
  const cv = new CatmullRomCurve3(caminho.map(([x, z]) => new Vector3(x, 0, z)), false, "centripetal");
  let P = cv.getSpacedPoints(Math.round(cv.getLength() / 14)).map(v => [v.x, v.z]);
  { const k = P.findIndex(q => q[0] >= borda); if(k > 0){ const a = P[k - 1], b = P[k], t = (borda - a[0]) / (b[0] - a[0]); P = P.slice(0, k); P.push([borda, a[1] + (b[1] - a[1]) * t]); } }
  const zq = P[P.length - 1][1];
  /* comprimento acumulado e altura do fundo do canal (sempre descendo no sentido da água) */
  const S = [0]; for(let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const Ltot = S[S.length - 1], F0 = -3.0, F1 = -9.2;
  const fundoEm = (s) => F0 + (F1 - F0) * (Math.min(s, Ltot) / Ltot);

  const base = (x) => { const t = (x - TERR.vx0) / (borda - TERR.vx0); if(t <= 0 || t >= 1) return 0; return t < TERR.tv ? TERR.profundidade * sm(t / TERR.tv) : TERR.profundidade * (1 - sm((t - TERR.tv) / (1 - TERR.tv))); };
  /* ponto mais próximo do eixo do riacho: devolve distância e posição ao longo dele */
  const perto = (x, z) => {
    let md = 1e9, ms = 0;
    for(let i = 1; i < P.length; i++){
      const ax = P[i - 1][0], az = P[i - 1][1], bx = P[i][0], bz = P[i][1], vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
      let u = l2 ? ((x - ax) * vx + (z - az) * vz) / l2 : 0; u = Math.max(0, Math.min(1, u));
      const d = Math.hypot(x - (ax + vx * u), z - (az + vz * u)); if(d < md){ md = d; ms = S[i - 1] + (S[i] - S[i - 1]) * u; }
    }
    return { d: md, s: ms };
  };
  const alturaBruta = (x, z) => {
    if(x <= TERR.x0 || x > borda + 1) return 0;
    const b = base(x), q = perto(x, z), f = fundoEm(q.s);
    return Math.min(b, f + .5 * Math.max(0, q.d - 5)) * sm((z + 330) / 70) * sm((1020 - z) / 70) * sm((x - TERR.x0) / 70);         // a malha se acomoda ao campo nas bordas
  };

  /* trilhas aplainadas: perto do eixo da trilha o terreno é "cortado" na altura do próprio eixo (largura da trilha + borda suave de 7 u) */
  const planas = []; let extra = null;
  const altura = (x, z) => {
    let h = alturaBruta(x, z);
    if(planas.length && x > TERR.x0 + 20 && x <= borda + 1){
      for(let k = 0; k < planas.length; k++){ const { L, hw } = planas[k]; let md = 1e9, px = 0, pz = 0;
        for(let i = 0; i < L.length - 1; i++){ const ax = L[i][0], az = L[i][1], vx = L[i + 1][0] - ax, vz = L[i + 1][1] - az, l2 = vx * vx + vz * vz || 1; let u = ((x - ax) * vx + (z - az) * vz) / l2; u = u < 0 ? 0 : u > 1 ? 1 : u; const qx = ax + vx * u, qz = az + vz * u, d = Math.hypot(x - qx, z - qz); if(d < md){ md = d; px = qx; pz = qz; } }
        if(md < hw + 7){ const w = (1 - sm((md - hw) / 7)) * sm((perto(x, z).d - 6) / 7); h = h + (base(px) * sm((px - TERR.x0) / 70) - h) * w; } }
    }
    if(pocos.length && x > TERR.x0 && x <= borda + 1) h -= pocoProf(x, z);
    return h;
  };
  /* poços (remansos): três bacias mais fundas no leito, com água, onde a família de capivaras pode se esconder (mergulhada até os olhos) */
  const pocos = [];
  { for(const f of [.2, .5, .74]){ let k = P.findIndex((_, i) => S[i] >= Ltot * f); if(k < 1) k = 1;
      for(let tent = 0; tent < 12; tent++){ const kk = Math.min(P.length - 2, Math.max(1, k + (tent % 2 ? 1 : -1) * Math.ceil(tent / 2))), q = P[kk]; if(evitar.every(e => Math.hypot(e[0] - q[0], e[1] - q[1]) > 62) && pocos.every(o => Math.hypot(o.x - q[0], o.z - q[1]) > 120)){ pocos.push({ x: q[0], z: q[1], s: S[kk], R: 15, prof: 4.2 }); break; } } } }
  const pocoProf = (x, z) => { let d = 0; for(let i = 0; i < pocos.length; i++){ const p = pocos[i], r = Math.hypot(x - p.x, z - p.z); if(r < p.R) d = Math.max(d, p.prof * (1 - sm(r / p.R))); } return d; };
  const alturaTotal = (x, z) => altura(x, z) + (extra ? extra(x, z) : 0);

  /* malha */
  const larg = borda - TERR.x0, prof = 1350, ZC = 345, geo = new PlaneGeometry(larg, prof, Math.round(larg / 5), Math.round(prof / 5)); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for(let i = 0; i < pos.count; i++){ const x = pos.getX(i) + TERR.x0 + larg / 2, z = pos.getZ(i) + ZC; pos.setXYZ(i, x, chao + altura(x, z), z); }
  geo.computeVertexNormals();
  const atualizaMalha = () => { const p = geo.attributes.position; for(let i = 0; i < p.count; i++){ const x = p.getX(i), z = p.getZ(i); p.setY(i, chao + altura(x, z)); } p.needsUpdate = true; geo.computeVertexNormals(); };
  const mapa = texCampo(); mapa.repeat.set(larg / 9, prof / 9);
  const terreno = new Mesh(geo, new MeshStandardMaterial({ map: mapa, roughness: 1 })); g.add(terreno);

  /* água: faixa que acompanha o canal, com a textura de água correndo */
  const wtex = texAgua(); wtex.repeat.set(1, 1);
  const w = 9, pts = [], uv = [], idx = []; let vacc = 0;
  for(let i = 0; i < P.length; i++){
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = -tz, nz = tx, y = chao + fundoEm(S[i]) + .55, lw = i === P.length - 1 ? 7 : w;
    pts.push(P[i][0] + nx * lw / 2, y, P[i][1] + nz * lw / 2, P[i][0] - nx * lw / 2, y, P[i][1] - nz * lw / 2); vacc = S[i] / 18; uv.push(0, vacc, 1, vacc);
    if(i) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
  }
  const rg = new BufferGeometry(); rg.setAttribute("position", new Float32BufferAttribute(pts, 3)); rg.setAttribute("uv", new Float32BufferAttribute(uv, 2)); rg.setIndex(idx); rg.computeVertexNormals();
  wtex.wrapS = wtex.wrapT = 1000;
  const rio = new Mesh(rg, new MeshBasicMaterial({ map: wtex, color: 0xcfe6f2, transparent: true, opacity: .9, side: DoubleSide, depthWrite: false })); g.add(rio);
  /* água dos poços: disco com a mesma textura da água corrente */
  pocos.forEach(p => { const d = new Mesh(new CircleGeometry(p.R * .93, 28), rio.material); d.rotation.x = -Math.PI / 2; d.position.set(p.x, chao + fundoEm(p.s) + .57, p.z); g.add(d); });
  /* nível da água e se (x,z) está dentro d'água: leito do riacho (4,2 u de cada lado do eixo) ou poço */
  const agua = (x, z) => { const q = perto(x, z); let y = chao + fundoEm(q.s) + .57, dentro = q.d < 4.0, poco = false; for(const p of pocos){ if(Math.hypot(x - p.x, z - p.z) < p.R * .85){ dentro = true; poco = true; y = chao + fundoEm(p.s) + .57; } } return { dentro, y, poco, d: q.d, s: q.s }; };
  /* pedras nas margens */
  { const rd = rng(5), pedra = new MeshStandardMaterial({ map: texRocha(), roughness: 1 });
    for(let i = 0; i < 46; i++){ const k = 2 + Math.floor(rd() * (P.length - 3)), lado = rd() > .5 ? 1 : -1; const p = new Mesh(new SphereGeometry(.7 + rd() * 1.6, 7, 5), pedra); p.scale.y = .6;
      const x = P[k][0] + lado * (5 + rd() * 3), z = P[k][1] + (rd() - .5) * 6; p.position.set(x, chao + altura(x, z) + .2, z); g.add(p); } }

  /* trilha ondulada: faixa de terra que segue o terreno (pontos [x,z]); suaviza com ondas */
  const trilha = (pts0, larg0 = 5, cor = 0x8a7658) => {
    const C = []; for(let i = 0; i < pts0.length - 1; i++){ const a = pts0[i], b = pts0[i + 1]; for(let u = 0; u < 1; u += .125) C.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); } C.push(pts0[pts0.length - 1]);
    const q = [], ii = []; let acc = 0;
    for(let i = 0; i < C.length; i++){
      const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const ond = Math.sin(i * .55) * 1.6, cx = C[i][0] - tz * ond, cz = C[i][1] + tx * ond, nx = -tz, nz = tx, hw = larg0 / 2 * (1 + Math.sin(i * .9) * .12);
      const x1 = cx + nx * hw, z1 = cz + nz * hw, x2 = cx - nx * hw, z2 = cz - nz * hw;
      q.push(x1, chao + alturaTotal(x1, z1) + .35, z1, x2, chao + alturaTotal(x2, z2) + .35, z2); if(i) idx2(ii, i - 1);
      acc += 1;
    }
    function idx2(arr, k){ arr.push(k * 2, k * 2 + 1, (k + 1) * 2, k * 2 + 1, (k + 1) * 2 + 1, (k + 1) * 2); }
    const tg = new BufferGeometry(); tg.setAttribute("position", new Float32BufferAttribute(q, 3)); tg.setIndex(ii); tg.computeVertexNormals();
    const m = new Mesh(tg, new MeshStandardMaterial({ color: cor, roughness: 1, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })); g.add(m); return m;
  };

  const troncos = [];                                                                                      // capões (centro + raio): viram colisores no cenário
  /* árvores: araucárias em capões pequenos e unidos (nada espalhado) */
  const capoes = (centros, rd = rng(12)) => {
    const N = centros.reduce((s, c) => s + c[2], 0);
    const tronco = new InstancedMesh(new CylinderGeometry(.42, .6, 1, 6), new MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 }), N);
    const copa1 = new InstancedMesh(new CylinderGeometry(4.6, 1.4, 3.2, 9), new MeshStandardMaterial({ color: 0x24512b, roughness: 1 }), N);
    const copa2 = new InstancedMesh(new CylinderGeometry(3.0, 1.0, 2.6, 9), new MeshStandardMaterial({ color: 0x2c6232, roughness: 1 }), N);
    const dm = new Object3D(); let n = 0;
    centros.forEach(([cx, cz, num]) => { for(let j = 0; j < num; j++){
      const a = rd() * 6.283, r = Math.sqrt(rd()) * 12, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, e = .8 + rd() * .55, h = 24 * e, y = chao + alturaTotal(x, z);
      troncos.push([x, z]); dm.rotation.y = rd() * 6; dm.scale.set(e, h, e); dm.position.set(x, y + h / 2, z); dm.updateMatrix(); tronco.setMatrixAt(n, dm.matrix);
      dm.scale.set(e, e, e); dm.position.set(x, y + h - 1.2 * e, z); dm.updateMatrix(); copa1.setMatrixAt(n, dm.matrix);
      dm.position.set(x, y + h + 1.7 * e, z); dm.updateMatrix(); copa2.setMatrixAt(n, dm.matrix); n++; } });
    tronco.count = copa1.count = copa2.count = n; g.add(tronco, copa1, copa2);
  };

  const aplana = (L, larg0) => { planas.push({ L, hw: larg0 / 2 }); atualizaMalha(); };
  return { zq, altura, alturaTotal, agua, pocos, perto, aplana, setExtra: (f) => { extra = f; }, troncos, base, caminho: P, fundoEm, trilha, capoes, rio, wtex, borda, zq };
}

export const texAguaCorrente = () => canvasTex(64, 128, (c, w, h) => {
  const r = rng(77); c.fillStyle = "rgba(190,222,238,.9)"; c.fillRect(0, 0, w, h);
  for(let i = 0; i < 70; i++){ c.fillStyle = `rgba(255,255,255,${.2 + r() * .45})`; c.fillRect(r() * w, r() * h, 1 + r() * 3, 8 + r() * 36); }
  for(let i = 0; i < 24; i++){ c.fillStyle = `rgba(90,140,170,${.15 + r() * .2})`; c.fillRect(r() * w, r() * h, 1 + r() * 3, 10 + r() * 30); }
});
