import { Group, Mesh, InstancedMesh, BoxGeometry, CylinderGeometry, ExtrudeGeometry, Shape, Sprite, SpriteMaterial, MeshStandardMaterial, MeshBasicMaterial, Matrix4, Vector3, Quaternion, Euler, Color, AdditiveBlending } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U, LUGARES as C } from "../config.js";
import { aberto, centroide, inset, malhaPoli, fitaReta, mat, semente, dentroPoli } from "./util.js";

/* ============================================================================================================
   FÁBRICA CAMBARÁ S/A (papel e celulose) — dentro do polígono "cambara s/a" do KML.
   Muro de concreto em todo o perímetro com portão e letreiro "CAMBARÁ S/A" voltados para a Vila Ouro Verde; dentro: rua principal e rua transversal, guarita, escritório, galpões, tanques,
   pátio de toras, casa de caldeiras com a chaminé (fumaça subindo), esteira e postes (acesos de noite). Ruído de máquinas que cresce quando o jogador se aproxima.
   ============================================================================================================ */

const pi = Math.PI;

/* galpão de duas águas: perfil em casinha extrudado ao longo do comprimento */
function galpaoGeo(w, d, hp, hc){
  const s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hp); s.lineTo(0, hc); s.lineTo(-w / 2, hp); s.closePath();
  const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
}

export function criarFabrica(M, { poli, ref }){
  const { cen } = M, G = new Group(), P = aberto(poli), Y = (x, z) => cen.relevo(x, z), c0 = centroide(P), rnd = semente(5);
  const S = { colisores: [], hotspots: [], fumaca: [], t: 0, lampadas: null, ruido: null };
  const metal = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#b9bdc0"; c.fillRect(0, 0, w, h); for(let x = 0; x < w; x += 4){ c.fillStyle = (x / 4) % 2 ? "rgba(0,0,0,.14)" : "rgba(255,255,255,.12)"; c.fillRect(x, 0, 2, h); } }, { repeat: [10, 1] });
  const matMuro = mat(0xcfcac0, { roughness: .95 }), matGalpao = new MeshStandardMaterial({ map: metal, roughness: .6, metalness: .35, color: 0xd8dce0 }), matTelha = mat(0x7d8488, { roughness: .6, metalness: .4 }), matPiso = mat(0x8d8a82, { roughness: 1 }), matRua = mat(0x3c3d40, { roughness: 1 }), matTanque = mat(0xc2c8cc, { roughness: .5, metalness: .5 }), matTijolo = mat(0xa8553a, { roughness: .9 }), matTora = mat(0x8a5f3a, { roughness: 1 }), matFerro = mat(0x24282c, { roughness: .6, metalness: .4 });
  matPiso.polygonOffset = matRua.polygonOffset = true; matPiso.polygonOffsetFactor = -2; matRua.polygonOffsetFactor = -4; matPiso.polygonOffsetUnits = -2; matRua.polygonOffsetUnits = -4;

  /* portão: aresta cujo meio fica mais perto da referência (vila) */
  let gi = 0, melhor = 1e18; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(m[0] - ref[0], m[1] - ref[1]); if(d < melhor){ melhor = d; gi = i; } }
  const ga = P[gi], gb = P[(gi + 1) % P.length], gm = [(ga[0] + gb[0]) / 2, (ga[1] + gb[1]) / 2], gl = Math.hypot(gb[0] - ga[0], gb[1] - ga[1]), gtx = (gb[0] - ga[0]) / gl, gtz = (gb[1] - ga[1]) / gl;
  let inx = -gtz, inz = gtx; if((c0[0] - gm[0]) * inx + (c0[1] - gm[1]) * inz < 0){ inx = -inx; inz = -inz; }                               // normal para dentro
  const L = (s, t) => [gm[0] + gtx * s * U + inx * t * U, gm[1] + gtz * s * U + inz * t * U];                                                // (s lateral m, t para dentro m) → mundo
  const dentro = (s, t, m = 12) => dentroPoli(inset(P, m * U), ...L(s, t));

  /* ---------- chão e ruas ---------- */
  G.add(malhaPoli(P, Y, .18, matPiso));
  const rua = (a, b, w) => { const n = 60, ok = []; for(let i = 0; i <= n; i++){ const s0 = a[0] + (b[0] - a[0]) * i / n, t0 = a[1] + (b[1] - a[1]) * i / n; if(dentro(s0, t0, 4)) ok.push(i); }       // a rua só existe dentro do polígono
    if(ok.length < 2) return; const i0 = ok[0], i1 = ok[ok.length - 1]; G.add(fitaReta(L(a[0] + (b[0] - a[0]) * i0 / n, a[1] + (b[1] - a[1]) * i0 / n), L(a[0] + (b[0] - a[0]) * i1 / n, a[1] + (b[1] - a[1]) * i1 / n), w * U, Y, .4, matRua)); };
  rua([0, -6], [0, 300], 14); rua([-230, 300], [230, 300], 11); rua([-210, 120], [210, 120], 8); rua([-210, 225], [210, 225], 8);

  /* ---------- muro com portão ---------- */
  {
    const H = C.fabrica.muroM * U, esp = .7 * U, seg = 6 * U, porta = C.fabrica.portaoM * U, n = P.length, mur = [];
    for(let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n], Ls = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / Ls, tz = (b[1] - a[1]) / Ls, k = Math.max(1, Math.ceil(Ls / seg)), cs = Ls / k;
      for(let j = 0; j < k; j++){ const cx = a[0] + tx * cs * (j + .5), cz = a[1] + tz * cs * (j + .5); if(i === gi && Math.hypot(cx - gm[0], cz - gm[1]) < porta / 2 + cs * .5) continue;
        mur.push({ x: cx, z: cz, yaw: Math.atan2(tx, tz) - pi / 2 * 0, len: cs * 1.02 });
        const hw = Math.abs(tx) * cs / 2 + esp / 2, hh = Math.abs(tz) * cs / 2 + esp / 2; S.colisores.push({ x0: cx - hw - .3, x1: cx + hw + .3, z0: cz - hh - .3, z1: cz + hh + .3 }); } }
    const geo = new BoxGeometry(1, H, esp), im = new InstancedMesh(geo, matMuro, mur.length), mm = new Matrix4();
    mur.forEach((m, i) => { mm.compose(new Vector3(m.x, Y(m.x, m.z) + H / 2 - .2, m.z), new Quaternion().setFromEuler(new Euler(0, m.yaw + pi / 2, 0)), new Vector3(m.len, 1, 1)); im.setMatrixAt(i, mm); }); im.castShadow = true; G.add(im);
    /* pilares do portão, viga e letreiro */
    const pil = (s) => { const [x, z] = L(s, 0), m = new Mesh(new BoxGeometry(2 * U, 9 * U, 2 * U), matMuro); m.position.set(x, Y(x, z) + 4.5 * U, z); m.rotation.y = Math.atan2(gtx, gtz) + 0; m.castShadow = true; G.add(m); };
    pil(-C.fabrica.portaoM / 2 - 1); pil(C.fabrica.portaoM / 2 + 1);
    const tex = texPlacaHD(1024, 192, (c, w, h) => { c.fillStyle = "#14366a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f0f0e6"; c.lineWidth = 8; c.strokeRect(12, 12, w - 24, h - 24); c.fillStyle = "#f6f6ee"; c.textAlign = "center"; c.font = "bold 104px Arial"; c.fillText("CAMBARÁ S/A", w / 2, 128); });
    const pl = placaLegivel(tex, (C.fabrica.portaoM + 6) * U, 3.4 * U, { verso: tex, cor: 0x10284c }); const [px, pz] = L(0, 0); pl.position.set(px, Y(px, pz) + 10.6 * U, pz); pl.rotation.y = Math.atan2(inx, inz); G.add(pl);
    const placa2 = texPlacaHD(512, 160, (c, w, h) => { c.fillStyle = "#e6e2d4"; c.fillRect(0, 0, w, h); c.fillStyle = "#14366a"; c.textAlign = "center"; c.font = "bold 40px Arial"; c.fillText("CAMBARÁ S/A", w / 2, 66); c.font = "28px Arial"; c.fillText("Papel e celulose", w / 2, 112); });
    const p2 = placaLegivel(placa2, 5 * U, 1.55 * U, { verso: placa2, cor: 0x3a3a3a }), [qx, qz] = L(C.fabrica.portaoM / 2 + 5, -1.2); p2.position.set(qx, Y(qx, qz) + 3.4 * U, qz); p2.rotation.y = Math.atan2(-inx, -inz); G.add(p2);
  }

  /* ---------- guarita, escritório, galpões, tanques ---------- */
  const caixaEm = (s, t, w, d, h, mt, yaw = 0) => { const [x, z] = L(s, t), m = new Mesh(new BoxGeometry(w * U, h * U, d * U), mt); m.position.set(x, Y(x, z) + h * U / 2, z); m.rotation.y = Math.atan2(inx, inz) + yaw; m.castShadow = m.receiveShadow = true; G.add(m);
    const R = Math.hypot(w, d) * U / 2 * .85; S.colisores.push({ x0: x - R, x1: x + R, z0: z - R, z1: z + R }); return m; };
  caixaEm(-14, 14, 4, 4, 3.4, mat(0xe8e0cc));                                                                  // guarita
  { const [x, z] = L(-2, 14), b = new Mesh(new BoxGeometry(7 * U, .3 * U, .3 * U), mat(0xf0c020)); b.position.set(x, Y(x, z) + 1.1 * U, z); b.rotation.y = Math.atan2(gtx, gtz) + pi / 2; G.add(b); }  // cancela
  caixaEm(48, 48, 36, 16, 10, matTijolo);                                                                      // escritório
  const galp = [[-100, 115, 100, 42, 7, 15], [100, 115, 100, 42, 7, 15], [-100, 205, 110, 50, 8, 17], [100, 205, 96, 50, 8, 17], [-100, 385, 100, 56, 9, 18], [100, 385, 100, 56, 9, 18]];
  galp.forEach(([s, t, w, d, hp, hc]) => { if(!dentro(s, t, 8)) return; const [x, z] = L(s, t), g = new Mesh(galpaoGeo(w * U, d * U, hp * U, hc * U), matGalpao); g.position.set(x, Y(x, z), z); g.rotation.y = Math.atan2(inx, inz) + pi / 2; g.castShadow = g.receiveShadow = true; G.add(g);
    const R = Math.hypot(w, d) * U / 2 * .9; S.colisores.push({ x0: x - R * .72, x1: x + R * .72, z0: z - R * .72, z1: z + R * .72 }); });
  [[-190, 70], [-190, 100], [-190, 130], [190, 70], [190, 100], [190, 130]].forEach(([s, t], i) => { if(!dentro(s, t, 10)) return; const [x, z] = L(s, t), r = 6 * U, h = (13 + (i % 3) * 2) * U, m = new Mesh(new CylinderGeometry(r, r, h, 18), matTanque); m.position.set(x, Y(x, z) + h / 2, z); m.castShadow = true; G.add(m);
    const tp = new Mesh(new CylinderGeometry(r * .98, r * .5, 1.4 * U, 18), matTelha); tp.position.set(x, Y(x, z) + h + .7 * U, z); G.add(tp); S.colisores.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r }); });

  /* ---------- pátio de toras ---------- */
  {
    const geo = new CylinderGeometry(.55 * U, .55 * U, 7 * U, 8); geo.rotateZ(pi / 2); const lista = [];
    [[-205, 330, 1], [205, 330, 1], [-205, 390, 1], [205, 390, 1]].forEach(([s, t]) => { if(!dentro(s, t, 8)) return; for(let fila = 0; fila < 6; fila++) for(let k = 0; k < 11 - fila; k++){ const a = (k - (10 - fila) / 2) * 1.12 * U, h = (.55 + fila * .95) * U; const [x, z] = L(s + a / U, t + (fila % 2 ? .3 : 0)); lista.push({ x, z, h, rot: rnd() * .08 }); }
      const [x, z] = L(s, t), R = 6.6 * U; S.colisores.push({ x0: x - R, x1: x + R, z0: z - R * .5, z1: z + R * .5 }); });
    if(lista.length){ const im = new InstancedMesh(geo, matTora, lista.length), mm = new Matrix4(); lista.forEach((l, i) => { mm.compose(new Vector3(l.x, Y(l.x, l.z) + l.h, l.z), new Quaternion().setFromEuler(new Euler(0, Math.atan2(inx, inz) + l.rot, 0)), new Vector3(1, 1, 1)); im.setMatrixAt(i, mm); im.setColorAt(i, new Color(0x8a5f3a).offsetHSL(0, 0, (rnd() - .5) * .12)); }); im.castShadow = true; G.add(im); }
  }
  /* ---------- casa de caldeiras + chaminé + esteira ---------- */
  {
    caixaEm(0, 385, 26, 26, 20, matTijolo);
    const [cx, cz] = L(30, 385), alt = C.fabrica.chamineM * U, tex = canvasTex(64, 256, (c, w, h) => { for(let i = 0; i < 8; i++){ c.fillStyle = i % 2 ? "#e8e4dc" : "#c4352a"; c.fillRect(0, i * h / 8, w, h / 8); } });
    const ch = new Mesh(new CylinderGeometry(2.4 * U, 3.6 * U, alt, 18), new MeshStandardMaterial({ map: tex, roughness: .9 })); ch.position.set(cx, Y(cx, cz) + alt / 2, cz); ch.castShadow = true; G.add(ch); S.colisores.push({ x0: cx - 3.8 * U, x1: cx + 3.8 * U, z0: cz - 3.8 * U, z1: cz + 3.8 * U });
    S.topo = new Vector3(cx, Y(cx, cz) + alt, cz);
    const tex2 = canvasTex(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(235,235,235,.85)"); r.addColorStop(.6, "rgba(200,200,200,.4)"); r.addColorStop(1, "rgba(180,180,180,0)"); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    for(let i = 0; i < C.fabrica.fumacaQtd; i++){ const sp = new Sprite(new SpriteMaterial({ map: tex2, transparent: true, depthWrite: false, opacity: 0 })); sp.userData = { t: i / C.fabrica.fumacaQtd * 9 }; G.add(sp); S.fumaca.push(sp); }
    /* esteira entre o pátio e a caldeira */
    const a = L(-205, 360), b = L(-14, 385); const e = fitaReta(a, b, 2.2 * U, (x, z) => Y(x, z) + 3 * U, .3, matFerro); G.add(e);
  }
  /* ---------- postes ---------- */
  {
    const pole = new CylinderGeometry(.3, .42, 20, 6), lamp = new BoxGeometry(3, .8, 1.6), pos = []; pole.translate(0, 10, 0); lamp.translate(1.2, 20.4, 0);
    for(let t = 20; t <= 290; t += 45) for(const s of [-9, 9]) if(dentro(s, t, 6)) pos.push(L(s, t));
    const matLamp = new MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe0a0, emissiveIntensity: .1 }), im1 = new InstancedMesh(pole, matFerro, pos.length), im2 = new InstancedMesh(lamp, matLamp, pos.length), mm = new Matrix4();
    pos.forEach((p, i) => { mm.compose(new Vector3(p[0], Y(p[0], p[1]), p[1]), new Quaternion(), new Vector3(1, 1, 1)); im1.setMatrixAt(i, mm); im2.setMatrixAt(i, mm); }); G.add(im1, im2); S.lampadas = matLamp;
  }

  /* ---------- ruído de máquinas ---------- */
  let ac = null, gain = null;
  function ligaRuido(){
    if(ac) return; try{ ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * 3, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let s = 0; for(let i = 0; i < n; i++){ s = s * .96 + (Math.random() * 2 - 1) * .04; d[i] = s * (.8 + .2 * Math.sin(i / ac.sampleRate * 2 * pi * 1.7)); }
      const src = ac.createBufferSource(), lp = ac.createBiquadFilter(); gain = ac.createGain(); gain.gain.value = 0; src.buffer = buf; src.loop = true; lp.type = "lowpass"; lp.frequency.value = 260; src.connect(lp); lp.connect(gain); gain.connect(ac.destination); src.start(); }catch(_){ ac = null; }
  }
  function tick(dt, J){
    S.t += dt;
    if(S.lampadas){ const h = M.ciclo.hora(), noite = h < 5.8 || h >= 18; S.lampadas.emissiveIntensity += ((noite ? 2.2 : .08) - S.lampadas.emissiveIntensity) * Math.min(1, dt * 1.5); }
    if(S.topo){ const vx = M.vento && M.vento.dir ? M.vento.dir : [1, 0]; S.fumaca.forEach(sp => { const u = sp.userData; u.t += dt; const k = (u.t % 9) / 9, e = 1 + k * 9; sp.position.set(S.topo.x + (vx[0] || 1) * k * 140, S.topo.y + k * 150, S.topo.z + (vx[1] || 0) * k * 140 + Math.sin(u.t) * 3); sp.scale.setScalar(10 + e * 7); sp.material.opacity = Math.sin(k * pi) * .5; }); }
    if(J){ const d = Math.hypot(J.x - c0[0], J.z - c0[1]) / U; if(d < 900){ ligaRuido(); } if(gain){ const k = Math.max(0, 1 - d / 700) * C.fabrica.ruidoVol; gain.gain.value += (k * (J && ac ? 1 : 0) - gain.gain.value) * Math.min(1, dt * 2); } }
  }
  const dispose = () => { S.colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); S.hotspots.forEach(h => { const i = cen.hotspots.indexOf(h); if(i >= 0) cen.hotspots.splice(i, 1); }); if(gain) gain.gain.value = 0; if(ac){ try{ ac.close(); }catch(_){ /* já fechado */ } ac = null; gain = null; } };
  S.colisores.forEach(k => cen.colisores.push(k));
  return { g: G, tick, dispose, S, portao: { x: gm[0], z: gm[1], dentro: [inx, inz] }, centro: c0 };
}
