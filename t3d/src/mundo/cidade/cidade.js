import { Group, Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, BoxGeometry, CylinderGeometry, ConeGeometry, Shape, ExtrudeGeometry } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U, CIDADE as C, DEM as CD } from "../config.js";
import { normaliza } from "../resgate/kml.js";

/* ============================================================================================================
   ÁREA URBANA (Cambará do Sul e vilas): terreno em escala real em volta do polígono do KML, ruas provisórias em grade simples (até chegarem as ruas do KML) e o marcador
   "Praça central (em construção)". A zona só é construída quando o jogador está perto (cargaU) e é descartada ao se afastar (descargaU): longe, só resta o polígono.
   Substituir depois: ruas do KML ("rua"), praças ("praca") e vilas ("vila") entram pelo leitor de KML; a grade provisória some quando há ruas no KML.
   ============================================================================================================ */

const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const dentroPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

export function criarCidade(M){
  const { cen } = M, Z = M.zonas, grupo = new Group(); cen.grupo.add(grupo);
  const S = { t: 0, zonas: new Map() };                                                         // zonas construídas (por nome)
  const matAsfalto = (() => { const t = canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#4b4c4f"; c.fillRect(0, 0, w, h); for(let i = 0; i < 500; i++){ c.fillStyle = "rgba(" + (80 + Math.random() * 40 | 0) + "," + (80 + Math.random() * 40 | 0) + "," + (84 + Math.random() * 40 | 0) + ",.4)"; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } c.fillStyle = "#d9d3a0"; c.fillRect(w / 2 - 1.5, 0, 3, h * .5); }, { repeat: [1, 1] }); t.wrapS = t.wrapT = 1000; return new MeshStandardMaterial({ map: t, roughness: .95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); })();
  const matCalcada = new MeshStandardMaterial({ color: 0xb9b5aa, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const matChao = (() => { const t = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#86975a"; c.fillRect(0, 0, w, h); for(let i = 0; i < 1500; i++){ const k = Math.random(); c.fillStyle = "rgba(" + (105 + k * 70 | 0) + "," + (125 + k * 60 | 0) + "," + (55 + k * 30 | 0) + ",.35)"; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); } }, { repeat: [1, 1] }); t.wrapS = t.wrapT = 1000; return new MeshStandardMaterial({ map: t, vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }); })();
  matChao.polygonOffset = true; matChao.polygonOffsetFactor = 1; matChao.polygonOffsetUnits = 1;                                  // terrenos de zonas que se sobrepõem (parque industrial × vila) não brigam entre si
  const matPedra = new MeshStandardMaterial({ color: 0xcfc8b8, roughness: .9 }), matMadeira = new MeshStandardMaterial({ color: 0x6b4a2c, roughness: .95 }), matLaranja = new MeshStandardMaterial({ color: 0xe8741c, roughness: .8 }), matFita = new MeshStandardMaterial({ color: 0xf2d21e, roughness: .8 });

  /* ---------- relevo ---------- */
  /* elevação do terreno urbano: DEM real (média de 5 pontos = suave) relativa à altitude de referência da estrada; sem DEM, só a ondulação suave da estrada */
  const elevBruta = (x, z) => { const D = M.dem && M.dem.pronto ? M.dem : null, E = M.estrada; if(D && E.S.altRef !== undefined){ const T = Z.Tde(x, z), a = (dx, dz) => D.altReal(x - T[0] + dx, z - T[1] + dz); return ((a(0, 0) * 2 + a(45, 0) + a(-45, 0) + a(0, 45) + a(0, -45)) / 6 - E.S.altRef) * U * CD.escalaVertical; } return E.onda(x, z) * .5; };
  const correcao = () => 0;                                                                              // (a pista é que se funde ao terreno urbano nos últimos 2 km — ver estrada.calcPerfil)
  const ondaCid = (x, z) => { let v = elevBruta(x, z) + correcao(x, z);
    for(const u of Z.urbano){ if(u.pracaPoli) continue; const L = C.praca.ladoM * U / 2, d = Math.max(Math.abs(x - u.praca[0]), Math.abs(z - u.praca[1])); if(d < L + 90){ const v0 = elevBruta(u.praca[0], u.praca[1]); v = v0 + (v - v0) * sst(L * .9, L + 90, d); } }       // praça provisória (sem polígono no KML)
    for(const p of Z.platos){ const d = Math.hypot(x - p.c[0], z - p.c[1]); if(d < p.R + p.borda){ if(p.y === undefined) p.y = elevBruta(p.c[0], p.c[1]); v = p.y + (v - p.y) * sst(p.R, p.R + p.borda, d); } }       // platôs da praça e da fábrica (polígonos do KML)
    return v; };       // aplaina em volta
  function peso(x, z){ const u = Z.urbanoEm(x, z, C.margemU); if(!u) return 0; const b = u.bb, dx = Math.max(b[0] - x, 0, x - b[1]), dz = Math.max(b[2] - z, 0, z - b[3]), d = Math.hypot(dx, dz); return 1 - sst(0, C.margemU, d); }
  const rel = (x, z) => { const w = peso(x, z); return w > 0 ? ondaCid(x, z) : 0; };

  /* ---------- ruas provisórias em grade ---------- */
  function gradeRuas(u){
    const P = u.poli, c = u.centro; let sxx = 0, szz = 0, sxz = 0; P.forEach(p => { const dx = p[0] - c[0], dz = p[1] - c[1]; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; });
    const ang = .5 * Math.atan2(2 * sxz, sxx - szz), ca = Math.cos(ang), sa = Math.sin(ang), Q = C.ruas.quadraM * U, ruas = [], R = Math.max(u.bb[1] - u.bb[0], u.bb[3] - u.bb[2]);
    for(const eixo of [0, 1]) for(let k = -Math.ceil(R / Q); k <= Math.ceil(R / Q); k++){
      let run = []; const passo = 40;
      for(let t = -R; t <= R; t += passo){ const a = eixo ? k * Q : t, b = eixo ? t : k * Q, x = c[0] + a * ca - b * sa, z = c[1] + a * sa + b * ca;
        if(dentroPoli(P, x, z)) run.push([x, z]); else { if(run.length > 2) ruas.push(run); run = []; } }
      if(run.length > 2) ruas.push(run); }
    return ruas;
  }
  function fitaRuas(ruas){
    const W = C.ruas.larguraM * U / 2, K = C.ruas.calcadaM * U, pos = [], uv = [], idx = [], pc = [], ic = []; let base = 0, baseC = 0;
    ruas.forEach(L => { let acc = 0;
      for(let i = 0; i < L.length; i++){ const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l; if(i) acc += Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]);
        for(const s of [-1, 1]){ const x = L[i][0] + nx * W * s, z = L[i][1] + nz * W * s; pos.push(x, cen.relevo(x, z) + .12, z); uv.push(s < 0 ? 0 : 1, acc / (10 * U)); }
        for(const s of [-1, 1]) for(const o of [W, W + K]){ const x = L[i][0] + nx * o * s, z = L[i][1] + nz * o * s; pc.push(x, cen.relevo(x, z) + .22, z); }
        if(i){ const a0 = base + (i - 1) * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); const c0 = baseC + (i - 1) * 4; ic.push(c0 + 1, c0, c0 + 5, c0, c0 + 4, c0 + 5, c0 + 2, c0 + 3, c0 + 6, c0 + 3, c0 + 7, c0 + 6); } }
      base += L.length * 2; baseC += L.length * 4; });
    const g1 = new BufferGeometry(); g1.setAttribute("position", new Float32BufferAttribute(pos, 3)); g1.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g1.setIndex(idx); g1.computeVertexNormals();
    const g2 = new BufferGeometry(); g2.setAttribute("position", new Float32BufferAttribute(pc, 3)); g2.setIndex(ic); g2.computeVertexNormals();
    return [new Mesh(g1, matAsfalto), new Mesh(g2, matCalcada)];
  }
  /* ---------- terreno ---------- */
  function terreno(u){
    const m = C.margemU, x0 = u.bb[0] - m, x1 = u.bb[1] + m, z0 = u.bb[2] - m, z1 = u.bb[3] + m, cel = 120, nx = Math.ceil((x1 - x0) / cel), nz = Math.ceil((z1 - z0) / cel), pos = [], col = [], uv = [], idx = [];
    for(let j = 0; j <= nz; j++) for(let i = 0; i <= nx; i++){ const x = x0 + i * cel, z = z0 + j * cel, y = cen.relevo(x, z), k = .85 + .25 * hash(Math.floor(x / 90), Math.floor(z / 90), 5); pos.push(x, y - .03, z); col.push(k * .95, k, k * .8); uv.push(x / 160, z / 160);
      if(i && j){ const a = (j - 1) * (nx + 1) + i - 1, b = a + 1, c = j * (nx + 1) + i - 1, d = c + 1; idx.push(a, c, b, b, c, d); } }
    const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("color", new Float32BufferAttribute(col, 3)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const me = new Mesh(g, matChao); me.receiveShadow = true; return me;
  }
  /* ---------- praça central provisória ---------- */
  function praca(u){
    const g = new Group(), [px, pz] = u.praca, L = C.praca.ladoM * U, y = cen.relevo(px, pz);
    g.position.set(px, y, pz);
    const piso = new Mesh(new BoxGeometry(L, .35, L), matPedra); piso.position.y = .15; g.add(piso);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]){ const po = new Mesh(new CylinderGeometry(.18, .18, 3, 6), matLaranja); po.position.set(sx * L / 2, 1.5, sz * L / 2); g.add(po); }
    for(const [ax, az, w, d] of [[0, -L / 2, L, .1], [0, L / 2, L, .1], [-L / 2, 0, .1, L], [L / 2, 0, .1, L]]){ const f = new Mesh(new BoxGeometry(w, .35, d), matFita); f.position.set(ax, 2.6, az); g.add(f); }
    const mon = new Mesh(new BoxGeometry(2.2, 8, 2.2), matPedra); mon.position.y = 4.2; g.add(mon); const topo = new Mesh(new BoxGeometry(3.2, .7, 3.2), matPedra); topo.position.y = 8.5; g.add(topo);
    for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2, c = new Mesh(new ConeGeometry(.5, 1.5, 8), matLaranja); c.position.set(Math.cos(a) * L * .25, .95, Math.sin(a) * L * .25); g.add(c); }
    for(const [bx, bz, r] of [[-L * .32, 0, 0], [L * .32, 0, Math.PI], [0, -L * .32, Math.PI / 2], [0, L * .32, -Math.PI / 2]]){ const b = new Mesh(new BoxGeometry(5, .5, 1.3), matMadeira); b.position.set(bx, .7, bz); b.rotation.y = r; g.add(b); }
    const tex = texPlacaHD(512, 256, (c, w, h) => { c.fillStyle = "#1f4f7a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f4f4ea"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#f4f4ea"; c.textAlign = "center"; c.font = "bold 40px Arial"; c.fillText(u.tipo === "vila" ? (u.nome || "VILA").toUpperCase() : "CAMBARÁ DO SUL", w / 2, 86); c.font = "bold 30px Arial"; c.fillText(C.praca.nome, w / 2, 150); c.font = "22px Arial"; c.fillText("(provisória: as ruas e a praça reais virão por KML)", w / 2, 205); });
    const pl = placaLegivel(tex, 8, 4, { verso: null, cor: 0x1c3a58 }); pl.position.set(0, 5.4, L / 2 + 2); g.add(pl);
    for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.4, 5.4, .4), matMadeira); po.position.set(sx * 3.4, 2.7, L / 2 + 1.7); g.add(po); }
    return g;
  }
  /* ---------- carga/descarga por proximidade ---------- */
  const comGrade = (u) => u.tipo === "cidade" || /oswaldo/.test(normaliza(u.nome));                           // só a cidade e a Vila Oswaldo Kroeff ganham grade provisória de ruas e praça de obra
  function constroi(u){
    const g = new Group(); g.add(terreno(u));
    if(comGrade(u)){
      const comRuasKML = M.kml.lista("rua").length > 0; let ruas = comRuasKML ? M.kml.lista("rua").filter(e => e.geom === "LineString").map(e => Z.mundoPts(e)) : gradeRuas(u);
      const L = M.lugares;
      if(u.pracaPoli && L){                                                                                  // praça real: a grade não cruza a praça; ruas nos 4 lados fecham o quarteirão
        const cortadas = []; ruas.forEach(run => { let at = []; run.forEach(p => { if(L.naPraca(u, p[0], p[1])){ if(at.length > 2) cortadas.push(at); at = []; } else at.push(p); }); if(at.length > 2) cortadas.push(at); });
        ruas = [...cortadas, ...L.ruasEntorno(u)];
      }
      fitaRuas(ruas).forEach(m => g.add(m)); if(!u.pracaPoli) g.add(praca(u)); u.ruas = ruas;
    }
    return g;
  }
  function descarta(g){ g.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
  function atualiza(J){
    Z.urbano.forEach(u => { const b = u.bb, dx = Math.max(b[0] - J.x, 0, J.x - b[1]), dz = Math.max(b[2] - J.z, 0, J.z - b[3]), d = Math.hypot(dx, dz), c = S.zonas.get(u.nome);
      if(!c && d < C.cargaU){ const g = constroi(u); S.zonas.set(u.nome, g); grupo.add(g); } else if(c && d > C.descargaU){ grupo.remove(c); descarta(c); S.zonas.delete(u.nome); } });
  }
  /* silhueta de baixíssimo detalhe (massa urbana) para a cidade vista de longe; some quando a cidade de verdade é construída */
  const sil = new Map(), matSil = new MeshStandardMaterial({ color: 0xb9ad98, roughness: 1 });
  function silhuetas(){ sil.forEach(m => { grupo.remove(m); m.geometry.dispose(); }); sil.clear();
    Z.urbano.forEach(u => { const sh = new Shape(); u.poli.forEach((p, i) => (i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1]))); const g = new ExtrudeGeometry(sh, { depth: 16, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      const m = new Mesh(g, matSil); m.position.y = elevBruta(u.centro[0], u.centro[1]) + (cen.campo.chao || -8.35) - 2; m.frustumCulled = true; sil.set(u.nome, m); grupo.add(m); }); }
  const refaz = () => { Z.platos.forEach(p => { p.y = undefined; }); S.zonas.forEach(g => { grupo.remove(g); descarta(g); }); S.zonas.clear(); silhuetas(); if(M.horizonte && M.horizonte.recalcula) M.horizonte.recalcula(); };
  Z.aoMudar(refaz);
  function tick(dt, J){ S.t += dt; if(!J || S.t < .6) return; S.t = 0; atualiza(J); sil.forEach((m, n) => { m.visible = !S.zonas.has(n); }); }
  const pontosHorizonte = () => { const L = []; Z.urbano.forEach(u => { u.poli.forEach((p, i) => { if(i % 2 === 0) L.push([p[0], p[1], elevBruta(p[0], p[1])]); }); L.push([u.centro[0], u.centro[1], elevBruta(u.centro[0], u.centro[1])]); }); return L; };
  const destino = (u) => [u.praca[0], u.praca[1] - 0];
  return { tick, refaz, rel, peso, elevBruta, pontosHorizonte, destino, info: () => "Cidade: " + Z.urbano.map(u => u.nome + (S.zonas.has(u.nome) ? " (carregada)" : "")).join(" · "), S };
}
