import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, MeshStandardMaterial, BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Euler, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { placaLegivel, texPlacaHD } from "../../lib.js";
import { U } from "../config.js";
import { latLonParaMundo } from "../resgate/kml.js";

/* ============================================================================================================
   RAIA (hípica antiga, anos 1950) — dentro da antiga "Vila Santana", que no jogo passa a se chamar RAIA (raia = hípica, pedido do Lucas).
   Linha da raia do KML do Lucas (docs/cidade/kml/raia-hipica.kml): pista RETA de ~476 m, de leste para oeste.
   Fotos de referência: pista de terra entre cercas brancas de madeira, tapume alto de tábuas atrás do público, poste de chegada listrado,
   público de chapéu e roupa de época encostado na cerca, cavalos com jóqueis correndo em dupla.
   Montagem: pista + cercas + tapume + poste de chegada + torre dos juízes + arquibancada de madeira + público (blocos) + 2 cavalos com jóquei
   que correm a raia de ponta a ponta, voltam a trote pela lateral e largam de novo (quem ganha muda a cada páreo).
   ============================================================================================================ */
export const RAIA = { linha: [[-28.97058280124434, -50.05583938985868], [-28.97252156369331, -50.06020832545227]],   // [lat, lon] leste → oeste (chegada no leste)
  larguraM: 11, cercaAltM: 1.15, tapumeAltM: 3, tapumeCompM: 140, velGaloteM: 15, velTroteM: 4.5 };

export function criarHipica(M){
  const { cen } = M, G = new Group(), Y = (x, z) => cen.relevo(x, z);
  const u = M.zonas && M.zonas.S && M.zonas.S.urbano && M.zonas.S.urbano.find(q => /santana/i.test(q.nome)), T = (u && u.T) || [0, 0];
  const mundo = ([la, lo]) => { const p = latLonParaMundo(la, lo); return [p[0] + T[0], p[1] + T[1]]; };
  const A = mundo(RAIA.linha[0]), B = mundo(RAIA.linha[1]), Lw = Math.hypot(B[0] - A[0], B[1] - A[1]), tx = (B[0] - A[0]) / Lw, tz = (B[1] - A[1]) / Lw, nx = -tz, nz = tx;
  const Lm = Lw / U, W = RAIA.larguraM * U, yaw = Math.atan2(tx, tz);
  const P = (s, o) => [A[0] + tx * s + nx * o, A[1] + tz * s + nz * o];                                      // s = ao longo da raia (u, 0 = chegada), o = lateral (u)
  const geos = new Map(), add = (cor, g) => { if(!geos.has(cor)) geos.set(cor, []); geos.get(cor).push(g); };
  const m4 = new Matrix4(), q = new Quaternion(), e = new Euler(), sc = new Vector3(), po = new Vector3();
  const caixa = (cor, s, o, h, comp, larg, alt, giro = 0) => { const [x, z] = P(s, o); const g = new BoxGeometry(larg, alt, comp); e.set(0, yaw + giro, 0); q.setFromEuler(e); po.set(x, Y(x, z) + h + alt / 2, z); sc.set(1, 1, 1); m4.compose(po, q, sc); g.applyMatrix4(m4); add(cor, g); };
  const colisores = [];

  /* pista de terra (fita que acompanha o relevo) */
  { const pos = [], idx = []; const N = Math.ceil(Lm / 4); for(let i = 0; i <= N; i++){ const s = Lw * i / N; for(const o of [-W / 2, W / 2]){ const [x, z] = P(s, o); pos.push(x, Y(x, z) + .12, z); } if(i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
    const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); add(0x9b7b55, g);
    /* faixa de grama gasta entre a pista e a cerca */
    for(const lado of [-1, 1]){ const p2 = [], i2 = []; for(let i = 0; i <= N; i++){ const s = Lw * i / N; for(const o of [lado * W / 2, lado * (W / 2 + 2.2 * U)]){ const [x, z] = P(s, o); p2.push(x, Y(x, z) + .1, z); } if(i){ const k = i * 2; i2.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
      const g2 = new BufferGeometry(); g2.setAttribute("position", new Float32BufferAttribute(p2, 3)); g2.setIndex(i2); g2.computeVertexNormals(); add(0x8a8a52, g2); } }

  /* cercas brancas dos dois lados: postes a cada 3 m + 2 réguas */
  const cAlt = RAIA.cercaAltM * U, oc = W / 2 + 2.4 * U;
  for(const lado of [-1, 1]){ for(let s = 0; s <= Lw; s += 3 * U){ caixa(0xf2efe6, s, lado * oc, 0, .16 * U, .16 * U, cAlt); }
    for(let s = 0; s < Lw; s += 12 * U){ const comp = Math.min(12 * U, Lw - s); for(const h of [.45, 1.0]) caixa(0xf6f3ea, s + comp / 2, lado * oc, h * U, comp, .1 * U, .14 * U); } }

  /* tapume alto de tábuas (atrás do público, lado norte) perto da chegada */
  const oTap = oc + 9 * U, compTap = Math.min(RAIA.tapumeCompM * U, Lw);
  for(let s = 0; s < compTap; s += .32 * U){ const tom = [0xd9d4c4, 0xcfc8b6, 0xe3ddcc][Math.floor(s / (.32 * U)) % 3]; caixa(tom, s + .15 * U, oTap, 0, .3 * U, .1 * U, RAIA.tapumeAltM * U * (.96 + .08 * ((s * 7.3) % 1))); }
  for(const h of [.6, 2.2]) caixa(0xb7ae98, compTap / 2, oTap - .1 * U, h * U, compTap, .08 * U, .18 * U);

  /* poste de chegada listrado (preto e branco) + espelho */
  for(let k = 0; k < 8; k++) caixa(k % 2 ? 0x161616 : 0xf4f4f0, 0, oc + .6 * U, k * .45 * U, .3 * U, .3 * U, .45 * U);
  caixa(0xf4f4f0, 0, oc + .6 * U, 3.6 * U, .9 * U, .1 * U, .9 * U);

  /* torre dos juízes (casinha de madeira sobre pilares) do outro lado, na chegada */
  { const o = -(oc + 5 * U); for(const [ds, dd] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) caixa(0x5b4128, ds * U, o + dd * U, 0, .3 * U, .3 * U, 3.2 * U);
    caixa(0xe8dcc0, 0, o, 3.2 * U, 3.2 * U, 3.2 * U, 2.4 * U); caixa(0x6f2a20, 0, o, 5.6 * U, 3.8 * U, 3.8 * U, .3 * U); caixa(0x23282c, 0, o + 1.62 * U, 4.1 * U, 2.2 * U, .05 * U, .9 * U);
    const [x, z] = P(0, o); colisores.push({ x0: x - 2 * U, x1: x + 2 * U, z0: z - 2 * U, z1: z + 2 * U, peca: "torre dos juízes" }); }

  /* arquibancada de madeira (4 degraus) no lado sul, perto da chegada */
  { const o0 = -(oc + 3.5 * U), comp = 34 * U; for(let k = 0; k < 4; k++) caixa(0x7a5a38, 40 * U, o0 - k * 1.1 * U, 0, comp, 1.1 * U, (k + 1) * .55 * U);
    caixa(0x5b4128, 40 * U, o0 - 4.6 * U, 0, comp, .2 * U, 3.6 * U); caixa(0x6f2a20, 40 * U, o0 - 2.4 * U, 3.6 * U, comp + 1 * U, 5.4 * U, .2 * U);
    const [x, z] = P(40 * U, o0 - 2 * U), r = comp / 2; colisores.push({ x0: x - r, x1: x + r, z0: z - r * .25, z1: z + r * .25, peca: "arquibancada" }); }

  /* público de época: figuras simples (corpo + cabeça + chapéu) encostadas nas cercas perto da chegada */
  { const roupas = [0x2c2c30, 0x4a3b2a, 0x5c5c62, 0xe8e4d8, 0x3b4a5c, 0x6b4a3a, 0xd8d0b8], chapeus = [0x1c1c1c, 0x3a2e22, 0xd8cfb4];
    let sem = 17; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    for(const [o, s0, s1, dens] of [[oc + 1.1 * U, 2 * U, 120 * U, .55], [oc + 7.5 * U, 4 * U, 130 * U, .35], [-(oc + 1.1 * U), 8 * U, 90 * U, .4]]){
      for(let s = s0; s < s1; s += 1.3 * U){ if(rnd() > dens) continue; const oo = o + (rnd() - .5) * 1.2 * U, alt = (1.55 + rnd() * .3) * U, cr = roupas[Math.floor(rnd() * roupas.length)];
        caixa(cr, s, oo, 0, .45 * U, .35 * U, alt * .82); caixa(0xd9b38c, s, oo, alt * .82, .26 * U, .24 * U, alt * .14);
        if(rnd() < .7){ caixa(chapeus[Math.floor(rnd() * chapeus.length)], s, oo, alt * .96, .5 * U, .5 * U, .05 * U); caixa(0x1c1c1c, s, oo, alt * .98, .28 * U, .28 * U, .14 * U); } } } }

  /* placa RAIA na cabeceira oeste (largada) */
  { const tex = texPlacaHD(512, 160, (c, w, h) => { c.fillStyle = "#3d2a17"; c.fillRect(0, 0, w, h); c.strokeStyle = "#d9c08a"; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#f0dca8"; c.textAlign = "center"; c.font = "bold 78px Georgia"; c.fillText("RAIA", w / 2, 96); c.font = "italic 26px Georgia"; c.fillText("corridas de cavalo · 1950", w / 2, 136); });
    const pl = placaLegivel(tex, 5 * U, 1.6 * U, { verso: tex, cor: 0x2a1c0e }); const [x, z] = P(Lw + 6 * U, oc + 3 * U); pl.position.set(x, Y(x, z) + 2.6 * U, z); pl.rotation.y = yaw + Math.PI / 2; G.add(pl);
    for(const d of [-2.3, 2.3]) caixa(0x5b4128, Lw + 6 * U + d * U * Math.cos(0), oc + 3 * U, 0, .25 * U, .25 * U, 2.6 * U); }

  geos.forEach((lista, cor) => { const g = mergeGeometries(lista); lista.forEach(x => x.dispose()); const m = new Mesh(g, new MeshStandardMaterial({ color: cor, roughness: .92 })); m.castShadow = cor !== 0x9b7b55 && cor !== 0x8a8a52; m.receiveShadow = true; G.add(m); });

  /* cavalos com jóquei (low-poly) */
  function cavalo(pelo, blusa, bone){
    const g = new Group(), mP = new MeshStandardMaterial({ color: pelo, roughness: .8 }), mE = new MeshStandardMaterial({ color: 0x1a120c, roughness: .8 });
    const corpo = new Mesh(new BoxGeometry(.75 * U, .8 * U, 2.1 * U), mP); corpo.position.y = 1.45 * U; g.add(corpo);
    const pesc = new Mesh(new BoxGeometry(.42 * U, 1.0 * U, .5 * U), mP); pesc.position.set(0, 2.0 * U, 1.05 * U); pesc.rotation.x = .55; g.add(pesc);
    const cab = new Mesh(new BoxGeometry(.34 * U, .36 * U, .85 * U), mP); cab.position.set(0, 2.38 * U, 1.55 * U); cab.rotation.x = .35; g.add(cab);
    const crina = new Mesh(new BoxGeometry(.1 * U, .9 * U, .25 * U), mE); crina.position.set(0, 2.1 * U, .9 * U); crina.rotation.x = .55; g.add(crina);
    const rabo = new Mesh(new BoxGeometry(.14 * U, .9 * U, .2 * U), mE); rabo.position.set(0, 1.3 * U, -1.15 * U); rabo.rotation.x = -.5; g.add(rabo);
    const pernas = []; for(const [px, pz] of [[-.25, .8], [.25, .8], [-.25, -.8], [.25, -.8]]){ const piv = new Group(); piv.position.set(px * U, 1.15 * U, pz * U); const p = new Mesh(new BoxGeometry(.16 * U, 1.15 * U, .18 * U), mP); p.position.y = -.57 * U; piv.add(p); const casco = new Mesh(new BoxGeometry(.18 * U, .14 * U, .2 * U), mE); casco.position.y = -1.12 * U; piv.add(casco); g.add(piv); pernas.push(piv); }
    const j = new Group(); j.position.set(0, 1.95 * U, .15 * U); g.add(j);
    const tronco = new Mesh(new BoxGeometry(.42 * U, .6 * U, .3 * U), new MeshStandardMaterial({ color: blusa, roughness: .7 })); tronco.position.y = .3 * U; tronco.rotation.x = .7; j.add(tronco);
    const cabeca = new Mesh(new SphereGeometry(.15 * U, 8, 6), new MeshStandardMaterial({ color: 0xd9b38c })); cabeca.position.set(0, .62 * U, .3 * U); j.add(cabeca);
    const bon = new Mesh(new SphereGeometry(.17 * U, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ color: bone })); bon.position.copy(cabeca.position); bon.position.y += .03 * U; j.add(bon);
    for(const sx of [-1, 1]){ const perna = new Mesh(new BoxGeometry(.14 * U, .5 * U, .16 * U), new MeshStandardMaterial({ color: 0xeeeae0 })); perna.position.set(sx * .3 * U, -.05 * U, .05 * U); perna.rotation.x = -1; j.add(perna); }
    g.traverse(o => { if(o.isMesh) o.castShadow = true; }); G.add(g); return { g, pernas, j };
  }
  const corredores = [cavalo(0x6b3a1e, 0xc0302a, 0xf2f2f2), cavalo(0x2a1c14, 0x2a4fa0, 0xf2d040)];
  const S = { t: 0, fase: "largada", espera: 4, s: [Lw, Lw], v: [0, 0], vmax: [1, 1], raia: [-W * .22, W * .22], passo: [0, 0], vencedor: -1 };
  const sorteia = () => { S.vmax = [RAIA.velGaloteM * (0.93 + Math.random() * .14), RAIA.velGaloteM * (0.93 + Math.random() * .14)].map(v => v * U); };
  sorteia();
  function poe(k, s, o, dir, dt, vel){
    const c = corredores[k], [x, z] = P(s, o); c.g.position.set(x, Y(x, z) + .12, z); c.g.rotation.y = yaw + (dir < 0 ? Math.PI : 0);
    const ritmo = vel / U; S.passo[k] += dt * (ritmo > 8 ? 9 : 4.2); const amp = ritmo > 8 ? .75 : (ritmo > .3 ? .35 : 0);
    c.pernas.forEach((p, i) => { p.rotation.x = Math.sin(S.passo[k] + (i < 2 ? 0 : Math.PI) + (i % 2) * .9) * amp; });
    c.j.position.y = 1.95 * U + Math.abs(Math.sin(S.passo[k])) * (ritmo > 8 ? .12 : .04) * U;
  }
  function tick(dt, J){
    if(!J || Math.hypot(J.x - (A[0] + B[0]) / 2, J.z - (A[1] + B[1]) / 2) > Lw * 1.4 + 300 * U){ return; }           // longe: não anima
    S.t += dt;
    if(S.fase === "largada"){ S.espera -= dt; for(let k = 0; k < 2; k++) poe(k, Lw, S.raia[k], -1, dt, 0); if(S.espera <= 0){ S.fase = "pareo"; S.v = [0, 0]; S.vencedor = -1; if(M.terminal && Math.hypot(J.x - (A[0] + B[0]) / 2, J.z - (A[1] + B[1]) / 2) < Lw) M.terminal.msg("info", "Raia: foi dada a largada!"); } }
    else if(S.fase === "pareo"){ for(let k = 0; k < 2; k++){ S.v[k] = Math.min(S.vmax[k], S.v[k] + 6 * U * dt); S.s[k] = Math.max(0, S.s[k] - S.v[k] * dt); poe(k, S.s[k], S.raia[k], -1, dt, S.v[k]); if(S.s[k] <= 0 && S.vencedor < 0){ S.vencedor = k; } }
      if(S.s[0] <= 0 && S.s[1] <= 0){ S.fase = "volta"; if(M.terminal && Math.hypot(J.x - A[0], J.z - A[1]) < 160 * U) M.terminal.msg("info", "Raia: chegou na frente o " + (S.vencedor === 0 ? "alazão de blusa vermelha" : "preto de blusa azul") + "!"); } }
    else if(S.fase === "volta"){ let ok = 0; for(let k = 0; k < 2; k++){ const v = RAIA.velTroteM * U; S.s[k] = Math.min(Lw, S.s[k] + v * dt); poe(k, S.s[k], S.raia[k] * 1.6, 1, dt, S.s[k] < Lw ? v : 0); if(S.s[k] >= Lw) ok++; }
      if(ok === 2){ S.fase = "largada"; S.espera = 6; sorteia(); } }
  }
  colisores.forEach(k => cen.colisores.push(k));
  /* sem capim/samambaia/árvore na pista, entre as cercas, no público e na arquibancada: faixa de ±(cerca + 16 m) ao longo da raia */
  const VB = M.vegetacao && M.vegetacao.base, faixa = oc + 16 * U, semMato = (x, z) => { const dx = x - A[0], dz = z - A[1], s = dx * tx + dz * tz, o = dx * nx + dz * nz; return s > -20 * U && s < Lw + 20 * U && Math.abs(o) < faixa; };
  if(VB && VB.excluir){ VB.excluir.push(semMato); try{ ["capim", "samambaias", "arvores"].forEach(k => { const p = M.vegetacao[k]; if(p && p.regenera) p.regenera(); }); }catch(err){ console.warn("raia: mato", err); } }
  const dispose = () => { colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); if(VB && VB.excluir){ const i = VB.excluir.indexOf(semMato); if(i >= 0) VB.excluir.splice(i, 1); } G.traverse(o => { if(o.geometry) o.geometry.dispose(); }); };
  return { g: G, tick, dispose, S, chegada: A, largada: B };
}
