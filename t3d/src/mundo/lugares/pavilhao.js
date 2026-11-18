import { Group, Mesh, BoxGeometry, CylinderGeometry, CircleGeometry, ConeGeometry, SphereGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, PointLight, DoubleSide } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U } from "../config.js";
import { latLonParaMundo } from "../resgate/kml.js";

/* ============================================================================================================
   PAVILHÃO DE PEDRA da Cambará S/A (Street View de jul/2025, RS-020 nº 160, mandado pelo Lucas) — galpão comprido de PEDRA com
   TELHADO EM ARCO (abóbada) coberto de musgo/grama, empena em arco com janelinhas, fileira de janelas basculantes, guarita "BALANÇA" na frente.
   Aqui acontece a 1ª missão da série de assombrações, lendas e seres mitológicos: O CAPA PRETA, que voava por dentro do pavilhão
   e assustava os trabalhadores do turno da noite. Ele só aparece de NOITE (19h–5h), voando em círculos sob a abóbada.
   Por dentro: piso de concreto, portão aberto na ponta sul. [E] no portão: o vigia conta a história.
   ============================================================================================================ */
export const PAVILHAO = { centro: [-28.95721, -50.05330], rumoEixo: 331, compM: 70, largM: 22, paredeM: 8, arcoM: 3.6 };   // posição tirada de 4 Street Views (RS-020 nº 160); eixo comprido ~NNO, frente comprida (porta verde) para a RS-020 a oeste
export const HISTORIA_CAPA = {
  titulo: "O Capa Preta do pavilhão de pedra",
  texto: "Os trabalhadores do turno da noite da Cambará S/A juravam: depois que as máquinas silenciavam, um vulto de capa preta voava por dentro do pavilhão de pedra, rente à abóbada, e a capa estalava como pano molhado ao vento.",
  itens: [
    "Ele aparece só de noite, entre as sete da noite e as cinco da manhã.",
    "Dizem que apagava os lampiões com um bater de capa e ria do alto, onde ninguém alcançava.",
    "Os mais velhos contam que ele não gosta de quem trabalha sozinho no escuro.",
    "Primeira missão da série de assombrações, lendas e seres mitológicos — em breve.",
  ],
};

export function criarPavilhao(M, fab){
  const { cen } = M, G = new Group(), Y = (x, z) => cen.relevo(x, z);
  const K = M.kml && M.kml.S, e = K && K.poligonos.find(q => q.tipo === "fabrica"), T = (e && e.T) || [0, 0];
  const c0 = latLonParaMundo(...PAVILHAO.centro), cx = c0[0] + T[0], cz = c0[1] + T[1];
  const ref = latLonParaMundo(PAVILHAO.centro[0] + Math.cos(PAVILHAO.rumoEixo * Math.PI / 180) / 110540, PAVILHAO.centro[1] + Math.sin(PAVILHAO.rumoEixo * Math.PI / 180) / 97316);
  let fx = ref[0] - c0[0], fz = ref[1] - c0[1]; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;            // eixo comprido (ponta norte)
  const rx = -fz, rz = fx;
  const L = PAVILHAO.compM * U, W = PAVILHAO.largM * U, HP = PAVILHAO.paredeM * U, R = W / 2, yaw = Math.atan2(fx, fz);
  let y0 = -1e9; for(const a of [-.5, 0, .5]) for(const b of [-.5, 0, .5]) y0 = Math.max(y0, Y(cx + fx * L * a + rx * W * b, cz + fz * L * a + rz * W * b)); y0 += .05;
  const g = new Group(); g.position.set(cx, y0, cz); g.rotation.y = yaw; G.add(g);                            // local: z = comprimento (frente = norte), x = largura
  const pedra = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#6e6a62"; c.fillRect(0, 0, w, h); for(let r = 0; r < 16; r++){ let x = -(r % 2) * 12; while(x < w){ const bw = 18 + Math.random() * 22; c.fillStyle = ["#7d786e", "#625e57", "#8a8478", "#57534c", "#736d63"][Math.floor(Math.random() * 5)]; c.fillRect(x + 1, r * 16 + 1, bw - 2, 14); x += bw; } } }, { repeat: [6, 1] });
  pedra.wrapS = pedra.wrapT = 1000;
  const matPedra = new MeshStandardMaterial({ map: pedra, roughness: .95, side: DoubleSide });
  const janelas = canvasTex(512, 128, (c, w, h) => { c.fillStyle = "#6e6a62"; c.fillRect(0, 0, w, h); for(let k = 0; k < 8; k++){ const x = 14 + k * 62; c.fillStyle = "#3a3e40"; c.fillRect(x, 30, 44, 60); c.strokeStyle = "#9aa0a0"; c.lineWidth = 2; for(let i = 1; i < 4; i++){ c.beginPath(); c.moveTo(x, 30 + i * 15); c.lineTo(x + 44, 30 + i * 15); c.stroke(); } c.beginPath(); c.moveTo(x + 22, 30); c.lineTo(x + 22, 90); c.stroke(); } }, { repeat: [Math.round(L / (30 * U)), 1] });
  janelas.wrapS = 1000;
  const matJan = new MeshStandardMaterial({ map: janelas, roughness: .9, side: DoubleSide });
  const colisores = [], esp = .5 * U;
  const parede = (mat, w, h, d, x, y, z) => { const m = new Mesh(new BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  /* paredes laterais (com janelas) e empenas; portão aberto na ponta sul (z −L/2), 6 m de largura */
  /* parede leste inteira; parede oeste (frente para a RS-020) com o PORTÃO VERDE de correr, aberto, a 1/4 da ponta sul */
  const wv = latLonParaMundo(PAVILHAO.centro[0], PAVILHAO.centro[1] - 1 / 97316), sO = ((wv[0] - c0[0]) * Math.cos(yaw) - (wv[1] - c0[1]) * Math.sin(yaw)) >= 0 ? 1 : -1;   // lado local que dá para o OESTE (RS-020)
  const vao = 5 * U, zp = -L / 4;
  parede(matJan, esp, HP, L, 1 * (W / 2 - esp / 2), HP / 2, 0);
  parede(matJan, esp, HP, (L / 2 + zp - vao / 2), sO * (W / 2 - esp / 2), HP / 2, (-L / 2 + zp - vao / 2) / 2);
  parede(matJan, esp, HP, (L / 2 - zp - vao / 2), sO * (W / 2 - esp / 2), HP / 2, (L / 2 + zp + vao / 2) / 2);
  parede(matPedra, esp, HP * .35, vao, sO * (W / 2 - esp / 2), HP * .825, zp);
  const verde = new MeshStandardMaterial({ color: 0x3f6a4a, roughness: .7, metalness: .2 }); parede(verde, .15 * U, HP * .62, vao, sO * (W / 2 + .2 * U), HP * .31, zp + vao * .9);   // folha de correr, aberta
  const marq = parede(new MeshStandardMaterial({ color: 0x7a7e80 }), 1.6 * U, .12 * U, vao + 1.4 * U, sO * (W / 2 + .8 * U), HP * .68, zp);
  for(const s of [-1, 1]) parede(matPedra, W, HP, esp, 0, HP / 2, s * (L / 2 - esp / 2));                   // empenas
  /* abóbada (meio cilindro) com musgo e grama por cima */
  const musgo = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#6a665c"; c.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ c.fillStyle = ["#5d7a3a", "#6f8a44", "#4e6a30", "#7a7a62"][Math.floor(Math.random() * 4)]; c.globalAlpha = .55; c.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 7, 2 + Math.random() * 4); } c.globalAlpha = 1; c.strokeStyle = "rgba(0,0,0,.25)"; for(let y = 0; y < h; y += 16){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } }, { repeat: [3, 6] });
  musgo.wrapS = musgo.wrapT = 1000;
  const ab = new Mesh(new CylinderGeometry(R, R, L, 28, 1, true, -Math.PI / 2, Math.PI), new MeshStandardMaterial({ map: musgo, roughness: 1, side: DoubleSide }));
  ab.rotation.x = -Math.PI / 2; ab.scale.set(1, 1, PAVILHAO.arcoM * U / R); ab.position.y = HP; ab.castShadow = true; g.add(ab);
  /* empenas em arco (meio disco), com janelinhas, nas duas pontas */
  const empTex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = "#6e6a62"; c.fillRect(0, 0, w, h); for(let r = 0; r < 8; r++) for(let k = 0; k < 16; k++){ c.fillStyle = (r + k) % 3 ? "#3a3e40" : "#7a766c"; c.fillRect(k * 16 + 2, h - (r + 1) * 16 + 2, 12, 12); } });
  for(const s of [-1, 1]){ const d = new Mesh(new CircleGeometry(R, 28, 0, Math.PI), new MeshStandardMaterial({ map: empTex, roughness: .95, side: DoubleSide })); d.scale.y = PAVILHAO.arcoM * U / R; d.position.set(0, HP, s * (L / 2 - .05 * U)); g.add(d); }
  /* piso de concreto */
  const piso = new Mesh(new BoxGeometry(W - esp * 2, .3 * U, L - esp * 2), new MeshStandardMaterial({ color: 0x8a867c, roughness: 1 })); piso.position.y = .15 * U - .25 * U; piso.receiveShadow = true; g.add(piso);
  /* guarita "BALANÇA" na frente do portão + rampa da balança de caminhões */
  { const gb = new Group(); gb.position.set(sO * (W / 2 + 5 * U), 0, L / 2 - 6 * U); g.add(gb);
    const casa = new Mesh(new BoxGeometry(4 * U, 3 * U, 3.5 * U), new MeshStandardMaterial({ color: 0xe8e4da, roughness: .9 })); casa.position.y = 1.5 * U; casa.castShadow = true; gb.add(casa);
    const tel = new Mesh(new BoxGeometry(4.6 * U, .2 * U, 4.2 * U), new MeshStandardMaterial({ color: 0x8a8e90 })); tel.position.y = 3.1 * U; gb.add(tel);
    const tx = texPlacaHD(512, 64, (c, w, h) => { c.fillStyle = "#e8e4da"; c.fillRect(0, 0, w, h); c.fillStyle = "#222"; c.font = "bold 40px sans-serif"; c.textAlign = "center"; c.fillText("Cambará S.A.  BALANÇA", w / 2, 44); });
    const pl = placaLegivel(tx, 3.2 * U, .8 * U, { verso: tx, cor: 0xe8e4da }); pl.position.set(sO * 2.05 * U, 2.6 * U, 0); pl.rotation.y = -Math.PI / 2; gb.add(pl);
    const rampa = new Mesh(new BoxGeometry(3.5 * U, .4 * U, 14 * U), new MeshStandardMaterial({ color: 0x9a968c, roughness: 1 })); rampa.position.set(sO * 5 * U, .2 * U, -6 * U); gb.add(rampa);
    for(let k = 0; k < 14; k++){ const f = new Mesh(new BoxGeometry(.12 * U, .42 * U, 1 * U), new MeshStandardMaterial({ color: k % 2 ? 0x1a1a1a : 0xe0b020 })); f.position.set(sO * 5 * U - sO * 1.8 * U, .21 * U, -12.5 * U + k * U); gb.add(f); } }
  /* lampiões internos (acendem à noite) */
  const lamp = new MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffb050, emissiveIntensity: .1 }); const lamps = [];
  for(let k = -2; k <= 2; k++){ const m = new Mesh(new SphereGeometry(.35 * U, 8, 6), lamp); m.position.set(0, HP + PAVILHAO.arcoM * U * .8, k * L / 5.5); g.add(m); lamps.push(m); }
  const luz = new PointLight(0xffb060, 0, 40 * U); luz.position.set(0, HP, 0); g.add(luz);

  /* O CAPA PRETA: vulto de chapéu e capa que voa em elipse sob a abóbada (só de noite) */
  const capa = new Group(); g.add(capa); capa.visible = false;
  const preto = new MeshStandardMaterial({ color: 0x0c0c10, roughness: .8, side: DoubleSide });
  const corpo = new Mesh(new ConeGeometry(.55 * U, 2.0 * U, 8), preto); corpo.rotation.x = Math.PI / 2; capa.add(corpo);
  const cab = new Mesh(new SphereGeometry(.28 * U, 10, 8), new MeshStandardMaterial({ color: 0x1a1a1e })); cab.position.set(0, .25 * U, .95 * U); capa.add(cab);
  const aba = new Mesh(new CylinderGeometry(.55 * U, .55 * U, .05 * U, 16), preto); aba.position.set(0, .48 * U, .95 * U); capa.add(aba);
  const copa = new Mesh(new CylinderGeometry(.24 * U, .28 * U, .35 * U, 12), preto); copa.position.set(0, .66 * U, .95 * U); capa.add(copa);
  for(const s of [-1, 1]){ const o = new Mesh(new SphereGeometry(.05 * U, 6, 4), new MeshBasicMaterial({ color: 0xff3020 })); o.position.set(s * .1 * U, .28 * U, 1.2 * U); capa.add(o); }
  const asas = [-1, 1].map(s => { const piv = new Group(); piv.position.set(0, .1 * U, .5 * U); const pano = new Mesh(new PlaneGeometry(2.2 * U, 2.4 * U, 4, 4), preto); pano.position.set(s * 1.1 * U, 0, -1.1 * U); pano.rotation.x = -Math.PI / 2; piv.add(pano); capa.add(piv); return { piv, s }; });
  /* hotspot no portão: o vigia conta a história */
  const lxW = (W / 2 + 4 * U) * sO, portao = [cx + Math.cos(yaw) * lxW + Math.sin(yaw) * zp, cz - Math.sin(yaw) * lxW + Math.cos(yaw) * zp];
  const hot = { id: "pavilhao-capa-preta", x: portao[0], z: portao[1], r: 8 * U, rotulo: () => "Pavilhão de pedra — ouvir o vigia", acao: async () => { const { abrePainel } = await import("./sequoia-lunar.js"); abrePainel(M, { titulo: HISTORIA_CAPA.titulo, texto: HISTORIA_CAPA.texto, subtitulo: "O que o vigia conta", itens: HISTORIA_CAPA.itens, borda: "#1a1a20" }); } };
  cen.hotspots.push(hot);
  /* colisores (paredes) e piso caminhável dentro */
  const caixa = (lx0, lx1, lz0, lz1, peca) => { const pts = [[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]].map(([a, b]) => [cx + rx * -a + fx * b, cz + rz * -a + fz * b]); const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]); colisores.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), peca }); };
  void caixa;   /* paredes inclinadas em relação aos eixos: colisor por segmentos curtos */
  const seg = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / (3 * U)); for(let i = 0; i <= n; i++){ const t = i / n, lx = ax + (bx - ax) * t, lz = az + (bz - az) * t, wx = cx + Math.cos(yaw) * lx + Math.sin(yaw) * lz, wz = cz - Math.sin(yaw) * lx + Math.cos(yaw) * lz; colisores.push({ x0: wx - 1.6 * U, x1: wx + 1.6 * U, z0: wz - 1.6 * U, z1: wz + 1.6 * U, peca: "pavilhão de pedra" }); } };
  seg(-sO * W / 2, -L / 2, -sO * W / 2, L / 2); seg(-W / 2, L / 2, W / 2, L / 2); seg(-W / 2, -L / 2, W / 2, -L / 2); seg(sO * W / 2, -L / 2, sO * W / 2, zp - vao / 2 - 1.2 * U); seg(sO * W / 2, zp + vao / 2 + 1.2 * U, sO * W / 2, L / 2);
  colisores.forEach(k => cen.colisores.push(k));
  const dentro = (x, z) => { const dx = x - cx, dz = z - cz, lz = dx * fx + dz * fz, lx = dx * rx + dz * rz; return Math.abs(lz) < L / 2 && Math.abs(lx) < W / 2; };
  const EX = cen.extraChao, sup = (x, z) => dentro(x, z) ? y0 + .05 * U : null; if(EX && EX.superficies) EX.superficies.push(sup);
  const S = { t: 0, avisou: false };
  function tick(dt, J){
    S.t += dt; const h = M.ciclo ? M.ciclo.hora() : 12, noite = h >= 19 || h < 5;
    lamp.emissiveIntensity += ((noite ? 1.6 : .1) - lamp.emissiveIntensity) * Math.min(1, dt); luz.intensity = noite ? 1.2 + .3 * Math.sin(S.t * 7) * (Math.sin(S.t * .7) > .6 ? 1 : 0) : 0;
    capa.visible = noite;
    if(noite){ const a = S.t * .55, ex = W * .28, ez = L * .38; capa.position.set(Math.cos(a) * ex, HP + PAVILHAO.arcoM * U * .45 + Math.sin(S.t * 1.3) * .6 * U, Math.sin(a) * ez);
      capa.rotation.y = Math.atan2(-Math.sin(a) * ex, Math.cos(a) * ez); capa.rotation.z = -.35;
      asas.forEach(({ piv, s }) => { piv.rotation.z = s * (.25 + .45 * Math.sin(S.t * 6)); });
      if(J && !S.avisou && dentro(J.x, J.z)){ S.avisou = true; if(M.terminal) M.terminal.msg("sobrenatural", "Uma capa estala no alto da abóbada… algo voa no escuro do pavilhão."); if(M.ctx) M.ctx.mostraAviso("O Capa Preta!"); } }
    if(!noite) S.avisou = false;
  }
  const dispose = () => { colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); const i = cen.hotspots.indexOf(hot); if(i >= 0) cen.hotspots.splice(i, 1); if(EX && EX.superficies){ const j = EX.superficies.indexOf(sup); if(j >= 0) EX.superficies.splice(j, 1); } };
  return { g: G, tick, dispose, centro: [cx, cz], portao, capa, S };
}
