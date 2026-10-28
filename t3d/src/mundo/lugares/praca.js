import { Group, Mesh, InstancedMesh, BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, LatheGeometry, TorusGeometry, CircleGeometry, IcosahedronGeometry, MeshStandardMaterial, MeshBasicMaterial, Matrix4, Vector3, Quaternion, Euler, Color, Sprite, SpriteMaterial, Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, AdditiveBlending, DynamicDrawUsage } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U, LUGARES as C } from "../config.js";
import { criarPessoas } from "../gente/pessoas.js";
import { aberto, centroide, quadro, inset, malhaPoli, anel, fitaReta, mat, semente, dentroPoli } from "./util.js";

/* ============================================================================================================
   PRAÇA CENTRAL DE CAMBARÁ DO SUL (polígono "área praça da cidade" do KML) + SEQUOIA LUNAR + URNA DO TEMPO.
   • Praça: gramado, calçada em volta, caminhos que saem da Sequoia até os 4 cantos e os 4 lados, piso circular em volta da árvore, bancos e postes (acesos de noite), árvores pequenas,
     pessoas passeando (instanciadas), ponto de carona (viagem rápida) na borda mais próxima da estrada e ruas provisórias nos 4 lados (ruasDoEntorno → cidade.js).
   • Sequoia Lunar: tronco avermelhado afunilado, copa cônica em camadas, canteiro com pedras, arbustos e placa. Raio: ao entrar na praça (ou tecla de depuração) cai um raio nela.
   • Urna do Tempo: pedestal + urna de bronze com brilho suave; [E] abre (tampa sobe, pó dourado, feixe de luz) e depois mostra a escolha de personagem; a 1ª abertura libera Sepé Tiarajú.
   ============================================================================================================ */

/* interseção de um raio (origem o, direção unitária d) com o contorno do polígono: a mais distante à frente */
function raioPoli(P, o, d){
  let melhor = null;
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ez = b[1] - a[1], den = d[0] * ez - d[1] * ex; if(Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - o[0]) * ez - (a[1] - o[1]) * ex) / den, s = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den; if(t > 0 && s >= 0 && s <= 1 && (!melhor || t > melhor.t)) melhor = { t, p: [o[0] + d[0] * t, o[1] + d[1] * t] }; }
  return melhor ? melhor.p : null;
}

/** ruas provisórias dos 4 lados da praça: linhas (pontos do mundo) em volta do polígono, a (largura/2 + calçada) de distância da borda */
export function ruasDoEntorno(poli){
  const P = aberto(poli), W = C.praca.ruaLarguraM * U / 2, K = C.praca.ruaCalcadaM * U, O = inset(P, -(W + K)), runs = [];
  for(let i = 0; i < O.length; i++){ const a = O[i], b = O[(i + 1) % O.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(L / 40)), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
    const run = []; for(let k = -1; k <= n + 1; k++){ const t = Math.max(-W * 3, Math.min(L + W * 3, L * k / n)); run.push([a[0] + tx * t, a[1] + tz * t]); } runs.push(run); }
  return runs;
}
/** a rua não pode cruzar a praça: o x,z está dentro da praça mais a faixa da rua? */
export const naPracaOuRua = (poli, x, z) => { const P = aberto(poli); return dentroPoli(inset(P, -(C.praca.ruaLarguraM * U / 2 + C.praca.ruaCalcadaM * U + 2 * U)), x, z); };

const PELES = [0xf1c9a5, 0xe0ac86, 0xc68a62, 0x9a6a46, 0x6f4a2f, 0xf7d8bf], CAMISAS = [0xd9d4c4, 0x3a6aa8, 0xb0402c, 0x4a8a58, 0xe8c24a, 0x7a4a8a, 0x2a2e38, 0xe8e0d0, 0x8aa8c8], CALCAS = [0x2a3a58, 0x3a3a3a, 0x5a4a38, 0x4a5a6a, 0x1c1c22, 0x6a6a5a], CABELOS = [0x1a120c, 0x3a2414, 0x6a4a2a, 0x8a8a8a, 0xc8a050, 0x0c0c10];

export function criarPraca(M, { poli, seq, urna, carona }){
  const { cen } = M, G = new Group(), P = aberto(poli), q = quadro(P), Y = (x, z) => cen.relevo(x, z), pi = Math.PI;
  const cal = C.praca.calcadaM * U, camL = C.praca.caminhoM * U;
  const matGrama = mat(0x6f9440), matCalc = mat(0xc9c4b6, { roughness: 1 }), matPiso = mat(0xb4ad9c, { roughness: .95 }), matPedra = mat(0x8c877b), matTerra = mat(0x4a3322), matMadeira = mat(0x6b4a2c), matFerro = mat(0x24282c, { roughness: .6, metalness: .4 });
  for(const m of [matGrama, matCalc, matPiso]){ m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  const hub = seq ? centroide(aberto(seq)) : q.c, In = inset(P, cal + .3 * U), S = { t: 0, caminhos: [], bancos: [], lampadas: null, npc: [], urna: null, raio: null, colisores: [], hotspots: [] };
  const topo = (x, z) => Y(x, z);

  /* ---------- chão: gramado, calçada, caminhos, piso da Sequoia ---------- */
  G.add(malhaPoli(P, Y, .12, matGrama));
  G.add(anel(P, 0, cal, Y, .22, matCalc));
  const pontasCam = [];
  In.forEach(p => pontasCam.push(p));                                                                          // 4 cantos internos
  const Pm = inset(P, cal * .5);
  [[q.ux, q.uz], [-q.ux, -q.uz], [q.vx, q.vz], [-q.vx, -q.vz]].forEach(d => { const p = raioPoli(Pm, hub, d); if(p) pontasCam.push(p); });
  pontasCam.forEach(p => { G.add(fitaReta(hub, p, camL, Y, .2, matPiso)); S.caminhos.push([hub, p]); });
  { const g = new CircleGeometry(C.praca.concavoM * U, 36); g.rotateX(-pi / 2); const m = new Mesh(g, matPiso); m.position.set(hub[0], Y(hub[0], hub[1]) + .24, hub[1]); m.receiveShadow = true; G.add(m); }
  if(urna){ const U0 = centroide(aberto(urna)); G.add(malhaPoli(urna, Y, .26, matPiso)); G.add(fitaReta(hub, U0, camL, Y, .21, matPiso)); S.caminhos.push([hub, U0]); }

  /* ---------- bancos (instanciados) ---------- */
  {
    const b = new BoxGeometry(5.2, .35, 1.5); b.translate(0, 1.15, 0); const enc = new BoxGeometry(5.2, 1.2, .3); enc.translate(0, 1.85, -.65); const pe1 = new BoxGeometry(.4, 1.1, 1.3); pe1.translate(-2.2, .55, 0); const pe2 = pe1.clone(); pe2.translate(4.4, 0, 0);
    const geo = mergeGeometries([b, enc, pe1, pe2]); geo.userData.compartilhada = false;
    const alvos = []; S.caminhos.forEach(([a, c], ic) => { const L = Math.hypot(c[0] - a[0], c[1] - a[1]), tx = (c[0] - a[0]) / L, tz = (c[1] - a[1]) / L; if(L < 14 * U) return;
      for(const t of [.38, .7]) for(const lado of [-1, 1]){ if(alvos.length >= C.praca.bancos) break; const nx = -tz * lado, nz = tx * lado, off = camL / 2 + 1.7 * U; alvos.push({ x: a[0] + tx * L * t + nx * off, z: a[1] + tz * L * t + nz * off, yaw: Math.atan2(-nx, -nz) }); } });
    const im = new InstancedMesh(geo, matMadeira, Math.max(1, alvos.length)); const mm = new Matrix4(), qq = new Quaternion(), e = new Euler();
    alvos.forEach((a, i) => { qq.setFromEuler(e.set(0, a.yaw, 0)); mm.compose(new Vector3(a.x, Y(a.x, a.z) + .22, a.z), qq, new Vector3(1, 1, 1)); im.setMatrixAt(i, mm); S.bancos.push(a); }); im.castShadow = true; G.add(im);
  }
  /* ---------- postes de luz (acesos de noite) ---------- */
  {
    const pole = new CylinderGeometry(.16, .22, 7.2, 8); pole.translate(0, 3.6, 0); const braco = new BoxGeometry(1.6, .14, .14); braco.translate(.7, 7.1, 0);
    const poleG = mergeGeometries([pole, braco]), cab = new SphereGeometry(.62, 10, 8); cab.translate(1.35, 6.9, 0);
    const matLamp = new MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd890, emissiveIntensity: .1, roughness: .4 }), L = [];
    const passo = C.praca.lampadaCadaM * U, O = inset(P, cal * .5);
    O.forEach((a, i) => { const b = O[(i + 1) % O.length], Ls = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Ls / passo)); for(let k = 0; k < n; k++){ const t = (k + .5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; L.push({ x, z, yaw: Math.atan2(hub[0] - x, hub[1] - z) - pi / 2 }); } });
    S.caminhos.slice(0, 4).forEach(([a, c]) => { const t = .55, x = a[0] + (c[0] - a[0]) * t + 2 * U, z = a[1] + (c[1] - a[1]) * t; L.push({ x, z, yaw: 0 }); });
    const im1 = new InstancedMesh(poleG, matFerro, L.length), im2 = new InstancedMesh(cab, matLamp, L.length), mm = new Matrix4(), qq = new Quaternion(), e = new Euler();
    L.forEach((l, i) => { qq.setFromEuler(e.set(0, l.yaw, 0)); mm.compose(new Vector3(l.x, Y(l.x, l.z), l.z), qq, new Vector3(1, 1, 1)); im1.setMatrixAt(i, mm); im2.setMatrixAt(i, mm); }); im1.castShadow = true; G.add(im1, im2); S.lampadas = matLamp;
  }
  /* ---------- árvores pequenas (ipês, jacarandás) nos cantos ---------- */
  {
    const rnd = semente(7), tr = new CylinderGeometry(.25, .35, 4.2, 7), cp = new SphereGeometry(2.6, 10, 8); tr.translate(0, 2.1, 0); cp.translate(0, 5.8, 0);
    const n = C.praca.arvores, imT = new InstancedMesh(tr, matMadeira, n), imC = new InstancedMesh(cp, mat(0x5f8f3a, { roughness: 1 }), n), mm = new Matrix4();
    for(let i = 0; i < n; i++){ const k = i % In.length, a = In[k], b = In[(k + 1) % In.length], t = .08 + rnd() * .84, x0 = a[0] + (b[0] - a[0]) * t, z0 = a[1] + (b[1] - a[1]) * t, x = x0 + (hub[0] - x0) * (.14 + rnd() * .2), z = z0 + (hub[1] - z0) * (.14 + rnd() * .2), s = .8 + rnd() * .55;
      mm.compose(new Vector3(x, Y(x, z), z), new Quaternion(), new Vector3(s, s, s)); imT.setMatrixAt(i, mm); imC.setMatrixAt(i, mm); imC.setColorAt(i, new Color().setHSL(.25 + rnd() * .08, .45, .3 + rnd() * .1)); }
    imT.castShadow = imC.castShadow = true; G.add(imT, imC);
  }

  /* ---------- Sequoia Lunar ---------- */
  let sequoia = null;
  if(seq){
    const Q = aberto(seq), sc = hub, s = new Group(); s.position.set(sc[0], Y(sc[0], sc[1]), sc[1]); G.add(s);
    const alt = C.sequoia.alturaM * U, bark = canvasTex(128, 256, (c, w, h) => { c.fillStyle = "#8c4128"; c.fillRect(0, 0, w, h); for(let i = 0; i < 140; i++){ const x = Math.random() * w, k = Math.random(); c.fillStyle = k < .5 ? "rgba(60,20,10," + (.15 + Math.random() * .3) + ")" : "rgba(200,110,70," + (.1 + Math.random() * .22) + ")"; c.fillRect(x, 0, 1 + Math.random() * 3, h); } for(let i = 0; i < 90; i++){ c.fillStyle = "rgba(40,15,8,.25)"; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 3 + Math.random() * 10); } }, { repeat: [3, 5] });
    const f = alt / (38 * U), prof = [[4.9, 0], [4.2, 2.5], [3.7, 8], [3.2, 26], [2.5, 62], [1.6, 95], [.8, alt * .9 / f], [.18, alt / f]].map(([r, y]) => ({ x: r * f, y: y * f }));
    const tronco = new Mesh(new LatheGeometry(prof, 18), new MeshStandardMaterial({ map: bark, roughness: 1, color: 0xffffff })); tronco.castShadow = true; s.add(tronco);
    const folha = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#2c5a2c"; c.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ const k = Math.random(); c.fillStyle = "rgba(" + (30 + k * 40 | 0) + "," + (80 + k * 70 | 0) + "," + (36 + k * 30 | 0) + ",.55)"; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 4 + Math.random() * 6); } }, { repeat: [2, 2] });
    const matF = new MeshStandardMaterial({ map: folha, roughness: 1, color: 0xffffff }), n = 16, y0 = alt * .16, R0 = C.sequoia.raioCopaM * U * 1.05, rnd = semente(11);
    for(let i = 0; i < n; i++){ const t = i / n, R = R0 * Math.pow(1 - t, .85) + .9 * U, h = (alt - y0) / n * 3.3, y = y0 + t * (alt - y0 - h * .35);
      const c = new Mesh(new ConeGeometry(R, h, 14, 1, true), matF); c.position.y = y + h / 2; c.rotation.y = rnd() * pi; c.castShadow = true; s.add(c);
      const c2 = new Mesh(new ConeGeometry(R * .86, h * .75, 14, 1, true), matF); c2.position.y = y + h / 2 - h * .3; c2.rotation.y = rnd() * pi; s.add(c2); }
    const pico = new Mesh(new ConeGeometry(.9 * U, 2.6 * U, 8), matF); pico.position.y = alt + .3 * U; s.add(pico);
    sequoia = { g: s, alt, topo: new Vector3(sc[0], Y(sc[0], sc[1]) + alt + 1.5 * U, sc[1]), mats: [matF], tronco };
    /* canteiro: terra, pedras em volta, arbustos floridos e placa */
    G.add(malhaPoli(Q, Y, .3, matTerra));
    { const rnd2 = semente(3), pg = new IcosahedronGeometry(1, 0), pe = [], bu = []; for(let i = 0; i < Q.length; i++){ const a = Q[i], b = Q[(i + 1) % Q.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n2 = Math.max(3, Math.round(L / (C.sequoia.canteiroPedrasM * U * 1.6)));
        for(let k = 0; k < n2; k++){ const t = k / n2, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; pe.push({ x, z, r: (.45 + rnd2() * .5) * U * C.sequoia.canteiroPedrasM, rot: rnd2() * pi });
          if(k % 2 === 0){ const ix = x + (sc[0] - x) * .2, iz = z + (sc[1] - z) * .2; bu.push({ x: ix, z: iz, r: (.6 + rnd2() * .5) * U }); } } }
      const imP = new InstancedMesh(pg, matPedra, pe.length), imB = new InstancedMesh(new SphereGeometry(1, 8, 6), mat(0x4d7f3a, { roughness: 1 }), bu.length), mm = new Matrix4();
      pe.forEach((p, i) => { mm.compose(new Vector3(p.x, Y(p.x, p.z) + p.r * .35, p.z), new Quaternion().setFromEuler(new Euler(0, p.rot, 0)), new Vector3(p.r, p.r * .7, p.r)); imP.setMatrixAt(i, mm); });
      bu.forEach((p, i) => { mm.compose(new Vector3(p.x, Y(p.x, p.z) + p.r * .55, p.z), new Quaternion(), new Vector3(p.r, p.r * .8, p.r)); imB.setMatrixAt(i, mm); imB.setColorAt(i, new Color().setHSL(.9 + rnd2() * .08, .5, .5 + rnd2() * .15 - .1).lerp(new Color(0x4d7f3a), .55)); });
      imP.castShadow = imB.castShadow = true; G.add(imP, imB); }
    { /* placa "Sequoia Lunar" na borda do canteiro voltada para o lado da carona */
      const dir = carona ? [carona.x - sc[0], carona.z - sc[1]] : [q.vx, q.vz], dl = Math.hypot(dir[0], dir[1]) || 1, dx = dir[0] / dl, dz = dir[1] / dl; const hit = raioPoli(Q, sc, [dx, dz]) || [sc[0] + dx * 8 * U, sc[1] + dz * 8 * U]; const px = hit[0] + dx * 1.2 * U, pz = hit[1] + dz * 1.2 * U;
      const g = new Group(); g.position.set(px, Y(px, pz), pz); g.rotation.y = Math.atan2(dx, dz);
      for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.22, 2.4, .22), matMadeira); po.position.set(sx * 1.5, 1.2, 0); g.add(po); }
      const tex = texPlacaHD(512, 256, (c, w, h) => { c.fillStyle = "#2d3f2a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e9dcb0"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#f3ecd0"; c.textAlign = "center"; c.font = "bold 58px Georgia"; c.fillText("SEQUOIA LUNAR", w / 2, 118); c.font = "italic 28px Georgia"; c.fillStyle = "#c9c19a"; c.fillText("a árvore da praça", w / 2, 170); });
      const pl = placaLegivel(tex, 3.8, 1.9, { verso: tex, cor: 0x3a2a1a }); pl.position.set(0, 2.2, 0); g.add(pl); G.add(g); }
    S.colisores.push({ x0: sc[0] - 4.6, x1: sc[0] + 4.6, z0: sc[1] - 4.6, z1: sc[1] + 4.6 });
    S.hotspots.push({ id: "sequoia", x: sc[0], z: sc[1], r: 11 * U, rotulo: () => "Sequoia Lunar", acao: () => { if(M.terminal) M.terminal.msg("info", "Sequoia Lunar: a árvore símbolo da praça de Cambará do Sul. A casca avermelhada é macia e a copa é um cone perfeito."); M.ctx.mostraAviso("Sequoia Lunar — a árvore da praça"); } });
  }

  /* ---------- Urna do Tempo ---------- */
  if(urna){
    const uc = centroide(aberto(urna)), g = new Group(), h = C.urna.alturaM * U; g.position.set(uc[0], Y(uc[0], uc[1]), uc[1]); G.add(g);
    const ped = new Mesh(new CylinderGeometry(.62 * U, .78 * U, h, 8), mat(0x9b968a, { roughness: .85 })); ped.position.y = h / 2; ped.castShadow = true; g.add(ped);
    const tampaP = new Mesh(new CylinderGeometry(.82 * U, .82 * U, .1 * U, 8), mat(0xb4afa2)); tampaP.position.y = h + .05 * U; g.add(tampaP);
    const y0 = h + .1 * U;                                                                  // perfil da urna em metros × U
    const perfil = [[0, 0], [.2, 0], [.25, .04], [.19, .1], [.17, .2], [.3, .36], [.36, .52], [.33, .68], [.2, .82], [.15, .9], [.2, .96], [.22, 1], [.18, 1.02], [0, 1.02]].map(([r, y]) => ({ x: r * U * .75, y: y * U * .75 }));
    const bronze = new MeshStandardMaterial({ color: 0xb98a3c, metalness: .85, roughness: .32, emissive: 0x4a2a06, emissiveIntensity: .35 });
    const corpo = new Mesh(new LatheGeometry(perfil.slice(0, -2), 22), bronze); corpo.position.y = y0; corpo.castShadow = true; g.add(corpo);
    const faixa = new Mesh(new TorusGeometry(.355 * U * .75, .012 * U, 6, 28), new MeshStandardMaterial({ color: 0xffd36a, metalness: .9, roughness: .25, emissive: 0x7a4a08, emissiveIntensity: .6 })); faixa.rotation.x = pi / 2; faixa.position.y = y0 + .52 * U * .75; g.add(faixa);
    const tampa = new Group(); tampa.position.set(0, y0 + .94 * U * .75, 0); const dome = new Mesh(new LatheGeometry([[0.001, 0], [.2, 0], [.17, .06], [.08, .11], [.001, .13]].map(([r, y]) => ({ x: r * U * .75, y: y * U * .75 })), 18), bronze); tampa.add(dome);
    const bot = new Mesh(new SphereGeometry(.035 * U, 8, 6), bronze); bot.position.y = .15 * U * .75; tampa.add(bot); g.add(tampa);
    const halo = new Sprite(new SpriteMaterial({ map: canvasTex(128, 128, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(255,226,140,.95)"); r.addColorStop(.35, "rgba(255,196,80,.35)"); r.addColorStop(1, "rgba(255,170,40,0)"); c.fillStyle = r; c.fillRect(0, 0, w, h); }), blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: .35 }));
    halo.scale.set(5.5 * U, 5.5 * U, 1); halo.position.y = y0 + .55 * U * .75; g.add(halo);
    const feixe = new Mesh(new CylinderGeometry(.5 * U, 1.1 * U, 14 * U, 20, 1, true), new MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: 2 })); feixe.position.y = y0 + 7 * U; g.add(feixe);
    const NP = C.urna.poeiraQtd, pg = new BufferGeometry(), pos = new Float32Array(NP * 3), vel = new Float32Array(NP * 4); pg.setAttribute("position", new Float32BufferAttribute(pos, 3));
    const poeira = new Points(pg, new PointsMaterial({ color: 0xffd36a, size: .55 * U, transparent: true, opacity: .9, blending: AdditiveBlending, depthWrite: false, sizeAttenuation: true })); poeira.frustumCulled = false; poeira.visible = false; g.add(poeira);
    const placa = (() => { const tex = texPlacaHD(384, 160, (c, w, hh) => { c.fillStyle = "#3a3126"; c.fillRect(0, 0, w, hh); c.strokeStyle = "#e0c27a"; c.lineWidth = 5; c.strokeRect(8, 8, w - 16, hh - 16); c.fillStyle = "#ffe2a0"; c.textAlign = "center"; c.font = "bold 44px Georgia"; c.fillText("URNA DO TEMPO", w / 2, 96); }); const pl = placaLegivel(tex, 2.6, 1.08, { verso: tex, cor: 0x2a2018 }); const dd = carona ? [carona.x - uc[0], carona.z - uc[1]] : [q.vx, q.vz], dl = Math.hypot(dd[0], dd[1]) || 1; pl.position.set(dd[0] / dl * .86 * U, h * .5, dd[1] / dl * .86 * U); pl.rotation.y = Math.atan2(dd[0], dd[1]); pl.scale.setScalar(.8); g.add(pl); return pl; })(); void placa;
    S.urna = { g, tampa, halo, feixe, poeira, pos, vel, y0, fase: "fechada", t: 0, bronze, u: uc, escolheu: false };
    S.colisores.push({ x0: uc[0] - 2.4, x1: uc[0] + 2.4, z0: uc[1] - 2.4, z1: uc[1] + 2.4 });
    S.hotspots.push({ id: "urna", x: uc[0], z: uc[1], r: 5.5 * U, rotulo: () => (S.urna.fase === "fechada" ? "Abrir a Urna do Tempo" : "Urna do Tempo"), acao: () => abreUrna() });
  }

  /* ---------- NPCs passeando ---------- */
  const R = criarPessoas(G, 14); R.setSombras(false);
  {
    const rnd = semente(21), N = 14;
    for(let i = 0; i < N; i++){
      const camisa = CAMISAS[Math.floor(rnd() * CAMISAS.length)], kid = i % 6 === 5, p = { x: 0, y: 0, z: 0, yaw: 0, esc: kid ? .7 : .92 + rnd() * .16, vel: 3.3 * (.7 + rnd() * .5), alvo: null, de: null, tPausa: rnd() * 5, sentado: -1, fase: rnd() * 6, ativo: false,
        pose: { legL: 0, legR: 0, armL: 0, armR: 0, armLz: .08, armRz: .08, lean: 0, sit: 0, lie: 0, bob: 0, headYaw: 0, headPitch: 0, celular: false, binoculo: false, prancheta: false },
        cor: { pele: PELES[Math.floor(rnd() * PELES.length)], camisa, manga: camisa, calca: CALCAS[Math.floor(rnd() * CALCAS.length)], cabelo: CABELOS[Math.floor(rnd() * CABELOS.length)], bota: 0x2a1f18, chapeu: 0x4a5a35 },
        acess: { cabelo: true, rabo: rnd() < .2, chapeu: rnd() < .2 ? 2 : 0, mochila: !kid && rnd() < .3, garrafa: rnd() < .2, bastao: !kid && rnd() < .08 } };
      S.npc.push(p);
    }
  }
  const ponto = () => { const c = S.caminhos[Math.floor(Math.random() * S.caminhos.length)], t = Math.random(); return [c[0][0] + (c[1][0] - c[0][0]) * t, c[0][1] + (c[1][1] - c[0][1]) * t]; };
  function npcsAlvo(h){ const N = C.praca.npcs; return h >= 6 && h < 9 ? N.manha : h >= 9 && h < 17 ? N.dia : h >= 17 && h < 22 ? N.tarde : N.noite; }
  function atualizaNpcs(dt, J){
    const h = M.ciclo.hora(), alvo = Math.min(S.npc.length, npcsAlvo(h)); S.npc.forEach((p, i) => { if(i < alvo && !p.ativo){ p.ativo = true; const b = S.bancos.length && Math.random() < .35 ? Math.floor(Math.random() * S.bancos.length) : -1;
        if(b >= 0 && !S.npc.some(o => o.sentado === b)){ p.sentado = b; p.x = S.bancos[b].x; p.z = S.bancos[b].z; p.yaw = S.bancos[b].yaw + pi; } else { const pt = ponto(); p.x = pt[0]; p.z = pt[1]; p.sentado = -1; p.alvo = ponto(); } } else if(i >= alvo && p.ativo && p.sentado < 0){ p.ativo = false; } });
    R.inicia();
    S.npc.forEach(p => {
      if(!p.ativo) return; p.fase += dt; const po = p.pose;
      if(p.sentado >= 0){ po.sit = 1; po.legL = po.legR = -1.35; po.armL = po.armR = -.45; po.lean = .05; po.celular = (Math.floor(p.fase / 9) % 2) === 0; p.y = Y(p.x, p.z) + .85; const b = S.bancos[p.sentado]; p.yaw = b.yaw + pi; }
      else {
        po.sit = 0; po.celular = false;
        if(p.tPausa > 0){ p.tPausa -= dt; po.legL = po.legR = po.armL = po.armR = 0; po.bob = 0; }
        else if(p.alvo){ const dx = p.alvo[0] - p.x, dz = p.alvo[1] - p.z, d = Math.hypot(dx, dz); if(d < 2 * U){ p.alvo = Math.random() < .6 ? ponto() : null; p.tPausa = 1 + Math.random() * 7; } else { const v = p.vel; p.x += dx / d * v * dt; p.z += dz / d * v * dt; const ya = Math.atan2(dx, dz); let da = ya - p.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); p.yaw += da * Math.min(1, dt * 5); const f = p.fase * 6.2; po.legL = Math.sin(f) * .6; po.legR = -po.legL; po.armL = -po.legL * .8; po.armR = -po.legR * .8; po.bob = Math.abs(Math.sin(f)) * .1; } }
        else p.tPausa = 2 + Math.random() * 5;
        p.y = Y(p.x, p.z);
      }
      R.escreve(p, Math.hypot(p.x - J.x, p.z - J.z) < 120 * U);
    });
    R.fim();
  }
  /* o boneco tem os pés em y=0 + altura da perna (2,35·esc): a base da struct é o chão */
  /* ---------- Urna: abertura animada ---------- */
  function abreUrna(){
    const u = S.urna; if(!u || u.fase !== "fechada") return false;
    u.fase = "abrindo"; u.t = 0; u.escolheu = false; u.poeira.visible = true; M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    if(M.terminal) M.terminal.msg("sobrenatural", "A Urna do Tempo começa a brilhar…"); som("abre"); return true;
  }
  let ac = null; const audio = () => { try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === "suspended") ac.resume(); return ac; }catch(_){ return null; } };
  function som(tipo){
    const a = audio(); if(!a) return; const t = a.currentTime;
    if(tipo === "abre"){ [392, 523.25, 659.25, 783.99].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t + i * .5); g.gain.linearRampToValueAtTime(.05, t + i * .5 + .4); g.gain.exponentialRampToValueAtTime(.0008, t + i * .5 + 3); o.connect(g); g.connect(a.destination); o.start(t + i * .5); o.stop(t + i * .5 + 3.2); }); }
    if(tipo === "trovao"){ const n = a.sampleRate * 3, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); let s = 0; for(let i = 0; i < n; i++){ s = s * .985 + (Math.random() * 2 - 1) * .1; d[i] = s * Math.pow(1 - i / n, 1.4) * (i < a.sampleRate * .05 ? 4 : 1); }
      const src = a.createBufferSource(), lp = a.createBiquadFilter(), g = a.createGain(); src.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 520; g.gain.value = 1.5; src.connect(lp); lp.connect(g); g.connect(a.destination); src.start(t); }
  }
  function tickUrna(dt){
    const u = S.urna; if(!u) return; u.t += dt; const T = C.urna.aberturaSeg, pulso = .35 + .12 * Math.sin(S.t * 1.6); u.bronze.emissiveIntensity = .35 + (pulso - .35);
    if(u.fase === "fechada"){ u.halo.material.opacity += (pulso - u.halo.material.opacity) * Math.min(1, dt * 2); u.feixe.material.opacity *= Math.max(0, 1 - dt * 3); }
    else if(u.fase === "abrindo"){
      const k = u.t / T, subida = Math.min(1, Math.max(0, (u.t - 1.2) / 1.8)); u.halo.material.opacity = .35 + .6 * Math.min(1, u.t / 2.5); u.halo.scale.setScalar((5.5 + 3 * Math.min(1, u.t / 3)) * U);
      u.tampa.position.y = u.y0 + .94 * U * .75 + subida * 1.6 * U; u.tampa.position.x = subida * .55 * U; u.tampa.rotation.z = -subida * .9;
      u.feixe.material.opacity = Math.min(.32, Math.max(0, (u.t - 1.6) / 1.4) * .32) * (k > .82 ? Math.max(0, (1 - k) / .18) : 1);
      if(u.t > 1.6 && u.t < T - 1.5){ for(let i = 0; i < 3; i++){ const j = Math.floor(Math.random() * C.urna.poeiraQtd); if(u.vel[j * 4 + 3] <= 0){ const a = Math.random() * pi * 2, r = Math.random() * .22 * U; u.pos[j * 3] = Math.cos(a) * r; u.pos[j * 3 + 1] = u.y0 + 1 * U * .75; u.pos[j * 3 + 2] = Math.sin(a) * r; u.vel[j * 4] = Math.cos(a) * .6; u.vel[j * 4 + 1] = (2.2 + Math.random() * 3) * U * .5; u.vel[j * 4 + 2] = Math.sin(a) * .6; u.vel[j * 4 + 3] = 2.2 + Math.random() * 1.8; } } }
      if(u.t > T){ u.fase = "escolhendo"; u.t = 0; const novo = M.personagens && M.personagens.desbloqueia("sepe", "Urna do Tempo"); if(M.terminal) M.terminal.msg("sobrenatural", novo ? "A Urna libera um nome do passado: Sepé Tiarajú." : "A Urna do Tempo oferece os que já responderam ao seu chamado."); if(M.personagens) M.personagens.abreTela({ titulo: "A Urna do Tempo — escolha o personagem", destaque: novo ? "sepe" : undefined }); u.escolheu = true; }
    } else if(u.fase === "escolhendo"){ if(!M.personagens || !M.personagens.S.tela){ u.fase = "fechando"; u.t = 0; } }
    else if(u.fase === "fechando"){ const f = Math.min(1, u.t / 2); u.tampa.position.y = u.y0 + .94 * U * .75 + (1 - f) * 1.6 * U; u.tampa.position.x = (1 - f) * .55 * U; u.tampa.rotation.z = -(1 - f) * .9; u.halo.material.opacity += (.35 - u.halo.material.opacity) * Math.min(1, dt * 2); u.halo.scale.setScalar((5.5 + 3 * (1 - f)) * U); u.feixe.material.opacity = 0; if(f >= 1){ u.fase = "fechada"; u.poeira.visible = false; u.halo.scale.setScalar(5.5 * U); } }
    if(u.poeira.visible){ for(let i = 0; i < C.urna.poeiraQtd; i++){ if(u.vel[i * 4 + 3] > 0){ u.vel[i * 4 + 3] -= dt; const ang = S.t * 1.3 + i; u.pos[i * 3] += (u.vel[i * 4] * Math.cos(ang) - u.vel[i * 4 + 2] * Math.sin(ang) * .3) * dt * U * .35; u.pos[i * 3 + 1] += u.vel[i * 4 + 1] * dt; u.pos[i * 3 + 2] += (u.vel[i * 4 + 2] * Math.cos(ang) + u.vel[i * 4] * Math.sin(ang) * .3) * dt * U * .35; } else { u.pos[i * 3 + 1] = -9999; } }
      u.poeira.geometry.attributes.position.needsUpdate = true; }
  }

  /* ---------- Raio na Sequoia ---------- */
  const flash = (() => { const d = document.createElement("div"); d.style.cssText = "position:absolute;inset:0;z-index:55;background:#eaf2ff;opacity:0;pointer-events:none;"; return d; })();
  let bolt = null;
  function raio(opc = {}){
    if(!sequoia || !M.ui) return false; if(!flash.parentNode) M.ui.appendChild(flash);
    const top = sequoia.topo, pts = [], n = 18, alvoTopo = new Vector3(top.x, top.y, top.z), ini = new Vector3(top.x + (Math.random() - .5) * 120, top.y + 520, top.z + (Math.random() - .5) * 120);
    for(let i = 0; i <= n; i++){ const t = i / n, p = ini.clone().lerp(alvoTopo, t); if(i > 0 && i < n){ p.x += (Math.random() - .5) * 38 * (1 - t * .6); p.z += (Math.random() - .5) * 38 * (1 - t * .6); } pts.push(p); }
    const geos = []; for(let i = 0; i < n; i++){ const a = pts[i], b = pts[i + 1], L = a.distanceTo(b), c = new CylinderGeometry(.55, .55, L, 5); c.translate(0, L / 2, 0); c.rotateX(pi / 2); const m = new Matrix4().lookAt(a, b, new Vector3(0, 1, 0)); void m;
      const dir = b.clone().sub(a).normalize(), qq = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), dir); const mm = new Matrix4().compose(a, qq, new Vector3(1, 1, 1)); c.applyMatrix4(mm); geos.push(c); }
    if(bolt){ cen.grupo.remove(bolt); bolt.geometry.dispose(); }
    bolt = new Mesh(mergeGeometries(geos), new MeshBasicMaterial({ color: 0xe8f2ff, transparent: true, opacity: 1, blending: AdditiveBlending, depthWrite: false })); bolt.frustumCulled = false; cen.grupo.add(bolt);
    geos.forEach(g => g.dispose());
    S.raio = { t: 0, bolt, ceu: false }; flash.style.opacity = "1"; som("trovao");
    sequoia.mats.forEach(m => { m.emissive = new Color(0x9fc0ff); m.emissiveIntensity = 1.2; }); S.raioVisto = (S.raioVisto || 0) + 1;
    if(M.terminal) M.terminal.msg("sobrenatural", "Um raio atinge a Sequoia Lunar!"); if(M.ctx) M.ctx.mostraAviso("⚡ Um raio cai sobre a Sequoia Lunar");
    const novo = M.personagens && M.personagens.desbloqueia(C.raio.desbloqueia, "Raio da Sequoia"); if(novo && M.terminal) M.terminal.msg("sobrenatural", "A tempestade responde: o personagem Tupã agora pode ser escolhido.");
    if(M.missoes && M.missoes.emite) M.missoes.emite("praca:raio", { origem: opc.origem || "praca" });
    return true;
  }
  function tickRaio(dt){
    const r = S.raio; if(!r) return; r.t += dt;
    flash.style.opacity = String(Math.max(0, .85 - r.t * 3.2) * (r.t < .12 ? 1 : (Math.sin(r.t * 38) > 0 ? 1 : .35)));
    if(bolt) bolt.material.opacity = Math.max(0, 1 - r.t * 2.2) * (Math.sin(r.t * 50) > -.3 ? 1 : .4);
    sequoia.mats.forEach(m => { m.emissiveIntensity = Math.max(0, 1.2 - r.t * 1.3); });
    if(r.t > 1.2){ if(bolt){ cen.grupo.remove(bolt); bolt.geometry.dispose(); bolt = null; } sequoia.mats.forEach(m => { m.emissiveIntensity = 0; }); flash.style.opacity = "0"; S.raio = null; }
  }

  /* ---------- tick ---------- */
  function tick(dt, J){
    S.t += dt; if(!J) return;
    if(S.lampadas){ const h = M.ciclo.hora(), noite = h < 5.8 || h >= 18, alvo = noite ? 2.4 : .08; S.lampadas.emissiveIntensity += (alvo - S.lampadas.emissiveIntensity) * Math.min(1, dt * 1.5); }
    atualizaNpcs(dt, J); tickUrna(dt); tickRaio(dt);
    if(sequoia){ sequoia.g.rotation.z = Math.sin(S.t * .6) * .0035; sequoia.g.rotation.x = Math.cos(S.t * .5) * .003; }
    /* gatilho do raio: dentro do polígono da praça por esperaS (a 1ª vez sempre; depois a cada intervaloS, se repete) */
    const dentro = dentroPoli(P, J.x, J.z); S.dentro = dentro;
    if(dentro && C.raio.aoEntrar && sequoia){ S.noPoli = (S.noPoli || 0) + dt; S.semRaio = (S.semRaio === undefined ? 1e9 : S.semRaio) + dt;
      const livre = !S.raioVisto || (C.raio.repete && S.semRaio > C.raio.intervaloS);
      if(livre && S.noPoli > C.raio.esperaS && !S.raio){ S.semRaio = 0; S.noPoli = 0; raio({ origem: "entrada" }); } }
    else S.noPoli = 0;
  }
  const dispara = () => abreUrna();
  const dispose = () => { cen.colisores && S.colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); S.hotspots.forEach(h => { const i = cen.hotspots.indexOf(h); if(i >= 0) cen.hotspots.splice(i, 1); }); if(bolt){ cen.grupo.remove(bolt); bolt = null; } flash.style.opacity = "0"; };
  S.colisores.forEach(k => cen.colisores.push(k)); S.hotspots.forEach(h => cen.hotspots.push(h));
  return { g: G, tick, dispose, raio, abreUrna: dispara, S, sequoia, hub, estado: () => ({ urna: S.urna && S.urna.fase, raioVisto: S.raioVisto || 0, dentro: !!S.dentro, npcs: S.npc.filter(p => p.ativo).length }) };
}
