import { Group, InstancedMesh, SphereGeometry, ConeGeometry, BoxGeometry, CylinderGeometry, MeshStandardMaterial, DynamicDrawUsage, Color, Matrix4, Quaternion, Vector3, Euler } from "three";
import { U, AVES as C, CONFLITOS, qualidade } from "../config.js";

/* ============================================================================================================
   AVES: gralha-azul (bandos barulhentos, saltam de árvore em árvore), papagaios (revoadas ao amanhecer/entardecer), pica-pau (no tronco), sabiá e passarinhos
   (chão e arbustos), tucano (raro, topo das árvores), quero-quero (ninho no campo, rasantes em quem chegar perto), curicacas (casais no campo) e gavião
   (sobrevoa; as gralhas o expulsam). Coro forte ao amanhecer, mata quieta ao meio-dia, corujas e anfíbios à noite. Levantam voo quando alguém se aproxima.
   • Só existem num raio em volta do jogador (C.raio); quantidade × qualidade.aves. Instancing: um mesh por parte do corpo.
   • Sons sintetizados (WebAudio), com distância, abafamento e panorâmica. `silencio()` = alarme e mata calada quando o leão-baio passa.
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => Math.max(a, Math.min(b, v)), pick = (L) => L[Math.floor(Math.random() * L.length)];
const ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };
const sorteia = (L) => { let t = Math.random() * L.reduce((s, o) => s + o[1], 0); for(const [k, w] of L){ t -= w; if(t <= 0) return k; } return L[0][0]; };

/* aparência e voz de cada espécie. c = comprimento do corpo (m); p = cores por parte; asa = envergadura de cada asa (em comprimentos de corpo) */
const ESP = {
  gralha: { nome: "Gralha-azul", c: .42, p: { corpo: [.12, .22, .72], peito: [.2, .3, .8], cab: [.04, .05, .1], asa: [.1, .2, .66], cauda: [.08, .16, .56], bico: [.03, .03, .03], crista: [.03, .04, .08] }, crista: .2, bico: .13, perna: .13, vo: 12, bat: 9, voz: "gralha", cad: [3, 8] },
  papagaio: { nome: "Papagaio", c: .34, p: { corpo: [.1, .55, .17], peito: [.35, .66, .2], cab: [.1, .5, .18], asa: [.08, .46, .16], cauda: [.1, .4, .17], bico: [.88, .76, .45] }, bico: .1, perna: .08, vo: 17, bat: 14, voz: "papagaio", cad: [2, 5] },
  picapau: { nome: "Pica-pau", c: .27, p: { corpo: [.07, .07, .08], peito: [.86, .85, .8], cab: [.1, .1, .1], asa: [.07, .07, .08], cauda: [.05, .05, .05], bico: [.38, .38, .4], crista: [.82, .1, .08] }, crista: .2, bico: .17, perna: .06, vo: 10, bat: 12, voz: "picapau", cad: [6, 14] },
  sabia: { nome: "Sabiá", c: .22, p: { corpo: [.42, .32, .22], peito: [.82, .5, .25], cab: [.34, .26, .18], asa: [.38, .29, .2], cauda: [.3, .23, .16], bico: [.9, .7, .2] }, bico: .09, perna: .15, vo: 9, bat: 15, voz: "sabia", cad: [6, 16] },
  passarinho: { nome: "Passarinho", c: .13, p: { corpo: [.55, .42, .28], peito: [.86, .8, .7], cab: [.5, .35, .22], asa: [.4, .3, .2], cauda: [.35, .27, .2], bico: [.35, .3, .25] }, bico: .08, perna: .14, vo: 8, bat: 22, voz: "passarinho", cad: [3, 9] },
  tucano: { nome: "Tucano", c: .48, p: { corpo: [.04, .04, .05], peito: [.96, .95, .88], cab: [.04, .04, .05], asa: [.04, .04, .06], cauda: [.04, .04, .05], bico: [.95, .66, .1] }, bico: .36, bicoR: 2.3, perna: .11, vo: 10, bat: 8, voz: "tucano", cad: [9, 18] },
  queroquero: { nome: "Quero-quero", c: .35, p: { corpo: [.52, .45, .34], peito: [.95, .95, .92], cab: [.3, .28, .26], asa: [.5, .45, .34], cauda: [.1, .1, .1], bico: [.8, .35, .3], crista: [.07, .07, .07] }, crista: .16, bico: .09, perna: .34, vo: 13, bat: 10, voz: "queroquero", cad: [5, 12] },
  curicaca: { nome: "Curicaca", c: .72, p: { corpo: [.5, .48, .43], peito: [.82, .62, .36], cab: [.82, .66, .4], asa: [.34, .33, .31], cauda: [.2, .2, .2], bico: [.1, .1, .1] }, bico: .24, perna: .46, pescoco: .2, vo: 13, bat: 5, voz: "curicaca", cad: [8, 18] },
  gaviao: { nome: "Gavião", c: .52, p: { corpo: [.34, .24, .16], peito: [.86, .8, .72], cab: [.3, .22, .15], asa: [.3, .22, .15], cauda: [.38, .32, .24], bico: [.1, .1, .1] }, bico: .1, perna: .12, vo: 11, bat: 4, asa: 2.2, voz: "gaviao", cad: [6, 12] }
};
const ALC = { gralha: 170, papagaio: 280, picapau: 120, sabia: 95, passarinho: 55, tucano: 160, queroquero: 170, curicaca: 230, gaviao: 250, coruja: 170, alarme: 130, ra: 90 };
const PARTES = ["corpo", "peito", "cab", "bico", "cauda", "asaD", "asaE", "crista", "perna", "pescoco"];

export function criarAves(M){
  const { cen } = M, V = M.vegetacao, base = V.base, Q = qualidade(), grupo = new Group(); cen.grupo.add(grupo);
  const CAP = Math.round(C.max * Q.aves) + 26, lista = [], ninhos = [], S = { t: 0, spawn: 0, papa: 0, gav: 0, hawk: null, sil: null, fundoT: 0, corujaT: 8, raT: 3, ultSom: 0, ac: null, ameacas: [], ameacaT: 0, forcaQuero: null };
  const mat = new MeshStandardMaterial({ roughness: .85, metalness: 0 });
  const mk = (geo, n) => { const im = new InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.setColorAt(0, new Color(1, 1, 1)); im.instanceColor.setUsage(DynamicDrawUsage); im.castShadow = false; grupo.add(im); return im; };
  const alongaZ = (g, ini) => { g.rotateX(Math.PI / 2); g.translate(0, 0, ini); return g; };
  const G = {
    corpo: mk(new SphereGeometry(.5, 10, 8), CAP), peito: mk(new SphereGeometry(.5, 9, 7), CAP), cab: mk(new SphereGeometry(.5, 9, 7), CAP), bico: mk(alongaZ(new ConeGeometry(.5, 1, 6), .5), CAP),
    cauda: mk(new BoxGeometry(1, 1, 1).translate(0, 0, -.5), CAP), asaD: mk(new BoxGeometry(1, 1, 1).translate(.5, 0, 0), CAP), asaE: mk(new BoxGeometry(1, 1, 1).translate(-.5, 0, 0), CAP),
    crista: mk(new ConeGeometry(.5, 1, 5).translate(0, .5, 0), CAP), perna: mk(new BoxGeometry(1, 1, 1).translate(0, -.5, 0), CAP * 2), pescoco: mk(new CylinderGeometry(.5, .5, 1, 7).translate(0, .5, 0), CAP)
  };
  /* ninhos do quero-quero (cova rasa com ovos manchados) */
  const nin = { cova: mk(new CylinderGeometry(.5, .6, .12, 10), 6), ovo: mk(new SphereGeometry(.5, 7, 6), 18) };
  const M4 = new Matrix4(), L4 = new Matrix4(), B4 = new Matrix4(), Qn = new Quaternion(), Vt = new Vector3(), Sc = new Vector3(), Eu = new Euler(), col = new Color();
  const ctxF = () => M.fauna.ctx;
  const chao = (x, z) => base.alturaNo(x, z);

  /* ---------- tempo: período do dia → intensidade do canto ---------- */
  function periodo(E){ if(E.alt < -8) return "noite"; if(E.h < 10 && E.alt < 14) return "alvorada"; if(E.h >= 10.5 && E.h < 15.3) return "meioDia"; if(E.h >= 16 && E.alt < 18) return "entardecer"; return "dia"; }
  const silF = () => { const s = S.sil; if(!s) return 0; return cl(Math.min(s.t, 3) / 3, 0, 1) * cl((s.T - s.t) / 1.2, 0, 1); };       // 0 = mata normal · 1 = silêncio total

  /* ---------- sons sintetizados ---------- */
  const audio = () => { try{ if(!S.ac){ S.ac = new (window.AudioContext || window.webkitAudioContext)(); S.mestre = S.ac.createGain(); S.mestre.gain.value = C.volume; S.mestre.connect(S.ac.destination); const n = S.ac.sampleRate * .3, b = S.ac.createBuffer(1, n, S.ac.sampleRate), d = b.getChannelData(0); for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; S.ruido = b; } if(S.ac.state === "suspended") S.ac.resume(); return S.ac; }catch(_){ return null; } };
  function nota(a, dest, t0, tipo, f0, f1, dur, vol, bp = 0, q = 1, vib = 0){
    const o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f1, t0 + dur);
    if(vib){ const lf = a.createOscillator(), lg = a.createGain(); lf.frequency.value = vib; lg.gain.value = f0 * .045; lf.connect(lg); lg.connect(o.frequency); lf.start(t0); lf.stop(t0 + dur + .05); }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(.025, dur * .3)); g.gain.exponentialRampToValueAtTime(.0005, t0 + dur);
    if(bp){ const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = bp; f.Q.value = q; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(dest); o.start(t0); o.stop(t0 + dur + .05);
  }
  function toque(a, dest, t0, f, dur, vol){ const s = a.createBufferSource(), g = a.createGain(), fl = a.createBiquadFilter(); s.buffer = S.ruido; fl.type = "bandpass"; fl.frequency.value = f; fl.Q.value = 1.6; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t0, Math.random() * .1, dur + .02); }
  const VOZ = {
    gralha: (a, d, t, k) => { const n = 2 + Math.floor(rnd(0, 2 + k * 2)); for(let i = 0; i < n; i++) nota(a, d, t + i * .29, "sawtooth", rnd(820, 980), 600, .24, .3, 1250, 1.2, 30); },
    papagaio: (a, d, t, k) => { const n = 3 + Math.floor(rnd(0, 3)); for(let i = 0; i < n; i++) nota(a, d, t + i * .15, "square", rnd(1400, 1700), 1000, .12, .17, 1800, 1.6, 42); },
    picapau: (a, d, t, k) => { if(k > .5){ for(let i = 0; i < 9; i++) toque(a, d, t + i * .046, 1700 + rnd(-200, 200), .03, .5); } else for(let i = 0; i < 3; i++) nota(a, d, t + i * .11, "sawtooth", 2400, 1900, .09, .09, 2600, 2); },
    sabia: (a, d, t) => { const n = 5 + Math.floor(rnd(0, 4)); let tt = t; for(let i = 0; i < n; i++){ const f = rnd(1800, 3200); nota(a, d, tt, "sine", f, f * rnd(.8, 1.25), rnd(.12, .3), .17, 0, 1, 7); tt += rnd(.14, .28); } },
    passarinho: (a, d, t) => { const n = 2 + Math.floor(rnd(0, 3)); for(let i = 0; i < n; i++) nota(a, d, t + i * .09, "sine", rnd(4200, 5800), rnd(4800, 6200), .06, .1); },
    tucano: (a, d, t) => { for(let i = 0; i < 3; i++){ nota(a, d, t + i * .42, "sawtooth", 430, 270, .28, .3, 720, .8); nota(a, d, t + i * .42, "square", 215, 135, .28, .1, 400, .8); } },
    queroquero: (a, d, t, k) => { const n = k > .7 ? 5 : 3; for(let i = 0; i < n; i++){ nota(a, d, t + i * (k > .7 ? .17 : .26), "sawtooth", 2300, 1950, .1, .2, 2100, 2); nota(a, d, t + i * (k > .7 ? .17 : .26) + .09, "sawtooth", 1850, 1450, .11, .22, 1900, 2); } },
    curicaca: (a, d, t) => { for(let i = 0; i < 3; i++) nota(a, d, t + i * .62, "sawtooth", 1250 - i * 60, 720, i ? .5 : .36, .28, 1000, 1.1, 18); },
    gaviao: (a, d, t) => { nota(a, d, t, "sine", 3100, 2050, .9, .16, 0, 1, 22); },
    coruja: (a, d, t) => { for(let i = 0; i < 2; i++) nota(a, d, t + i * .55, "sine", 390, 320, .42, .26, 0, 1, 5); },
    alarme: (a, d, t) => { for(let i = 0; i < 4; i++) nota(a, d, t + i * .07, "sawtooth", 3300, 2800, .05, .13, 3200, 2); },
    ra: (a, d, t) => { const n = 7 + Math.floor(rnd(0, 7)); for(let i = 0; i < n; i++) nota(a, d, t + i * .075, "square", 430, 380, .05, .07, 820, 4); }
  };
  const fw = new Vector3();
  function som(voz, x, y, z, vol = 1, k = .4){
    if(S.mudo) return; const dist = Math.hypot(x - M.cam.position.x, y - M.cam.position.y, z - M.cam.position.z) / U, alc = ALC[voz]; if(dist > alc) return;
    const g = vol * Math.pow(1 - dist / alc, 1.7); if(g < .02) return; const agora = performance.now(); if(agora - S.ultSom < 40 || (S.vozes || 0) > 14) return; S.ultSom = agora;
    const a = audio(); if(!a) return; const gn = a.createGain(), lp = a.createBiquadFilter(); gn.gain.value = g; lp.type = "lowpass"; lp.frequency.value = Math.max(2400, 15000 - dist * 55); gn.connect(lp);
    let fim = lp; if(a.createStereoPanner){ const pn = a.createStereoPanner(); M.cam.getWorldDirection(fw); const dx = x - M.cam.position.x, dz = z - M.cam.position.z, l = Math.hypot(dx, dz) || 1; pn.pan.value = cl((dx * -fw.z + dz * fw.x) / l * .85, -1, 1); lp.connect(pn); fim = pn; }
    fim.connect(S.mestre); S.vozes = (S.vozes || 0) + 1; setTimeout(() => { S.vozes--; }, 1600);
    try{ VOZ[voz](a, gn, a.currentTime + .005, k); }catch(_){ /* sem áudio */ }
  }

  /* ---------- poleiros (árvores do mundo) ---------- */
  const ARV = () => V.arvores.T;
  /* devolve um ponto de pouso numa árvore perto de (x,z): espécies de árvore, faixa de altura (fração do tronco) e se é no tronco (pica-pau) */
  function achaPouso(x, z, r, tipos, f0, f1, tronco){
    const T = ARV(), r2 = r * r, cand = [];
    for(const k of tipos){ const t = T[k]; if(!t) continue; for(let i = 0; i < t.n; i++){ const dx = t.x[i] - x, dz = t.z[i] - z; if(dx * dx + dz * dz < r2){ cand.push([k, i]); if(cand.length > 70) break; } } if(cand.length > 70) break; }
    if(!cand.length) return null; const [k, i] = pick(cand), t = T[k], px = t.x[i], pz = t.z[i], y0 = chao(px, pz), h = t.h[i];
    if(tronco){ const a = rnd(0, 6.283), rr = Math.max(.6 * U, t.r[i] * 1.0); return { x: px + Math.cos(a) * rr, z: pz + Math.sin(a) * rr, y: y0 + h * rnd(.12, .4), tronco: true, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) }; }
    const a = rnd(0, 6.283), rr = rnd(0, Math.min(2.2 * U, h * .12)); return { x: px + Math.cos(a) * rr, z: pz + Math.sin(a) * rr, y: y0 + h * rnd(f0, f1), tronco: false, arv: k };
  }
  const CHAVES_ALTAS = ["araucaria", "folhosa", "podocarpo", "medio"], CHAVES_BAIXAS = ["medio", "pequeno", "arbusto", "podocarpo"];
  const habitat = (x, z) => base.tipoEm(x, z);
  const planoOk = (x, z, J) => Math.abs(chao(x, z) - J.y) < 26 * U && !base.naAgua(x, z);

  /* ---------- criação de uma ave ---------- */
  function nova(esp, x, y, z, estado, ex){
    if(lista.length >= CAP) return null; const e = ESP[esp];
    const b = { esp, e, x, y, z, yaw: rnd(0, 6.283), pitch: 0, roll: 0, vel: 0, estado, t: rnd(1, 4), fase: rnd(0, 6), s: e.c * U * rnd(.94, 1.06), j: rnd(.92, 1.08), g: null, alvo: null, pouso: null, casa: null, cabY: 0, cabP: 0, asa: 0, bate: 0, voz: rnd(...e.cad) * rnd(.3, 1), vida: rnd(70, 200), hop: 0, vm: 1, alvoCab: 0, alvoCabP: 0, ...ex };
    lista.push(b); return b;
  }
  const yPouso = (b, p) => p.y + (.15 + b.e.perna) * b.s * (p.tronco ? .7 : 1);
  function pousaEm(b, p){ b.pouso = p; b.estado = "pousa"; b.x = p.x; b.z = p.z; b.y = yPouso(b, p); b.vel = 0; b.t = rnd(2, 6); if(p.tronco) b.yaw = p.yaw; }
  function paraChao(b){ b.estado = "chao"; b.pouso = null; b.casa = b.casa || { x: b.x, z: b.z }; b.y = chao(b.x, b.z) + (.15 + b.e.perna) * b.s; b.vel = 0; b.t = rnd(1, 3); b.modo = "para"; }

  /* ---------- spawns por espécie ---------- */
  function ponto(J, dMin, dMax){ const a = rnd(0, 6.283), d = rnd(dMin, dMax) * U; return [J.x + Math.cos(a) * d, J.z + Math.sin(a) * d]; }
  function bando(esp, n, J, mkPouso, hab){
    let p0 = null; for(let k = 0; k < 40 && !p0; k++){ const q = ponto(J, 24, C.raio * .92); if(hab.includes(habitat(q[0], q[1])) && planoOk(q[0], q[1], J)) p0 = q; } if(!p0) return null;
    const g = { esp, mem: [], alarme: 0, id: Math.random() }; const base0 = mkPouso(p0[0], p0[1], 0); if(!base0) return null;
    for(let i = 0; i < n; i++){ const p = i === 0 ? base0 : mkPouso(base0.x, base0.z, i); if(!p) continue; const b = nova(esp, p.x, p.y, p.z, "pousa", { g }); if(!b) break; if(p.chao){ b.x = p.x; b.z = p.z; paraChao(b); b.casa = { x: p.x, z: p.z }; } else pousaEm(b, p); g.mem.push(b); }
    return g.mem.length ? g : null;
  }
  const spawnGralha = (J) => bando("gralha", 4 + Math.floor(rnd(0, 5)), J, (x, z, i) => { if(i > 1 && Math.random() < .3){ const a = rnd(0, 6.283), d = rnd(2, 8) * U; return { x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, y: chao(x, z), chao: true }; } return achaPouso(x, z, 14 * U, CHAVES_ALTAS, .5, .96); }, ["mata"]);
  const spawnPica = (J) => bando("picapau", 1, J, (x, z) => achaPouso(x, z, 16 * U, ["araucaria", "folhosa", "medio"], 0, 0, true), ["mata"]);
  const spawnSabia = (J) => bando("sabia", Math.random() < .4 ? 2 : 1, J, (x, z, i) => { const t = habitat(x, z); if(t === "campo" || Math.random() < .35){ const a = rnd(0, 6.283), d = rnd(0, 5) * U; return { x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, y: chao(x, z), chao: true }; } return achaPouso(x, z, 14 * U, CHAVES_BAIXAS, .55, .98); }, ["mata", "mataBaixa", "campo"]);
  const spawnPasserinho = (J) => bando("passarinho", 3 + Math.floor(rnd(0, 4)), J, (x, z) => { const a = rnd(0, 6.283), d = rnd(0, 5) * U; return { x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, y: chao(x, z), chao: true }; }, ["campo", "mataBaixa", "turfeira"]);
  const spawnTucano = (J) => { if(lista.some(b => b.esp === "tucano")) return null; const g = bando("tucano", 1, J, (x, z) => achaPouso(x, z, 18 * U, ["araucaria", "folhosa"], .9, 1), ["mata"]); if(g) g.mem[0].vida = rnd(50, 110); return g; };
  function spawnQuero(J, forca){
    if(ninhos.length >= 2 && !forca) return null; let p0 = null;
    for(let k = 0; k < 12 && !p0; k++){ const q = forca || ponto(J, 26, C.raio * .9); if(habitat(q[0], q[1]) !== "campo" || !planoOk(q[0], q[1], J) || !base.livreBase(q[0], q[1], 3) || base.distTrilha(q[0], q[1]) < 3 * U || V.turfeira.distTurfeira(q[0], q[1]) < 3 * U) continue; if(ninhos.some(n => Math.hypot(n.x - q[0], n.z - q[1]) < 40 * U)) continue; p0 = q; if(forca) break; }
    if(!p0) return null; const n = { x: p0[0], z: p0[1], y: chao(p0[0], p0[1]), vida: 600 }; ninhos.push(n); const g = { esp: "queroquero", mem: [], alarme: 0, ninho: n };
    for(let i = 0; i < 2; i++){ const a = rnd(0, 6.283), d = rnd(3, 8) * U, b = nova("queroquero", n.x + Math.cos(a) * d, 0, n.z + Math.sin(a) * d, "chao", { g, casa: { x: n.x, z: n.z } }); if(!b) break; paraChao(b); g.mem.push(b); }
    return g;
  }
  function spawnCuricaca(J){ return bando("curicaca", 2, J, (x, z, i) => ({ x: x + rnd(-3, 3) * U, z: z + rnd(-3, 3) * U, y: chao(x, z), chao: true }), ["campo", "turfeira"]); }
  const SPAWN = { gralha: spawnGralha, picapau: spawnPica, sabia: spawnSabia, passarinho: spawnPasserinho, tucano: spawnTucano, queroquero: spawnQuero, curicaca: spawnCuricaca };

  /* revoada de papagaios passando alto (ao amanhecer e ao entardecer) */
  function revoada(J, forca){
    const P = C.papagaios, n = Math.round(rnd(P.grupo[0], P.grupo[1])), a = rnd(0, 6.283), d = (C.raio + 25) * U, ox = J.x + Math.cos(a) * d, oz = J.z + Math.sin(a) * d, ya = a + Math.PI + rnd(-.35, .35), alt = rnd(P.alturaM[0], P.alturaM[1]) * U, g = { esp: "papagaio", mem: [], alarme: 0 };
    for(let i = 0; i < n; i++){ const lat = rnd(-6, 6) * U, at = rnd(0, 10) * U, b = nova("papagaio", ox - Math.sin(ya) * at + Math.cos(ya) * lat, J.y + alt + rnd(-3, 3) * U, oz - Math.cos(ya) * at - Math.sin(ya) * lat, "sobrevoo", { g, rumo: ya, vm: rnd(.92, 1.08), vida: 90, alt }); if(!b) break; b.yaw = ya; b.asa = 1; g.mem.push(b); }
    if(g.mem.length && forca) g.mem.forEach(b => { b.x = J.x - Math.sin(ya) * 70 * U + (Math.random() - .5) * 10 * U; b.z = J.z - Math.cos(ya) * 70 * U + (Math.random() - .5) * 10 * U; });
    return g.mem.length ? g : null;
  }

  /* ---------- ameaças (quem faz a ave levantar voo) ---------- */
  function atualizaAmeacas(J){
    const L = S.ameacas; L.length = 0; L.push({ x: J.x, z: J.z, corre: Math.abs(J.vel) > 11, jogador: true });
    const px = ctxF().pessoasRaw; for(let i = 1; i < px.length; i++) L.push(px[i]);
    M.fauna.animais.forEach(a => { if(!a.fam) L.push({ x: a.x, z: a.z, animal: a.id }); });
  }
  const maisPertoAmeaca = (x, z) => { let d = 1e18, m = null; for(const p of S.ameacas){ const q = Math.hypot(p.x - x, p.z - z); if(q < d){ d = q; m = p; } } return m ? { d: d / U, m } : { d: 1e9, m: null }; };

  /* ---------- levantar voo: o bando inteiro vai junto para longe da ameaça ---------- */
  function espanta(b, de, alarme = true){
    const g = b.g, mem = g ? g.mem.filter(q => q.estado === "pousa" || q.estado === "chao") : (b.estado === "pousa" || b.estado === "chao" ? [b] : []); if(!mem.length) return;
    const dir = Math.atan2(b.x - de.x, b.z - de.z) + rnd(-.8, .8), dist = rnd(26, 52) * U, dx = b.x + Math.sin(dir) * dist, dz = b.z + Math.cos(dir) * dist;
    mem.forEach((q, i) => {
      let p = null; if(q.esp !== "queroquero" && q.esp !== "curicaca" && q.esp !== "passarinho"){ const tp = q.esp === "picapau" ? ["araucaria", "folhosa", "medio"] : q.esp === "tucano" ? ["araucaria", "folhosa"] : (q.esp === "sabia" ? CHAVES_BAIXAS : CHAVES_ALTAS); p = achaPouso(dx, dz, 16 * U, tp, q.esp === "tucano" ? .9 : .5, .96, q.esp === "picapau"); }
      if(!p){ const px = dx + rnd(-4, 4) * U, pz = dz + rnd(-4, 4) * U; p = { x: px, z: pz, y: chao(px, pz), chao: true }; }
      q.pouso = null; q.alvo = p; q.estado = "voa"; q.vm = rnd(1.1, 1.4); q.t = i * rnd(.05, .25); q.espera = q.t; q.yaw = dir + rnd(-.4, .4); q.asa = 1; q.q = null;
    });
    if(alarme && Math.random() < .85) som(b.esp === "passarinho" ? "passarinho" : "alarme", b.x, b.y, b.z, .9);
  }

  /* ---------- atualização de cada ave ---------- */
  const alturaTerreno = (b) => chao(b.x, b.z);
  function voo(b, dt, vel, a){
    const dx = a.x - b.x, dz = a.z - b.z, dy = (a.y - b.y), dh = Math.hypot(dx, dz), yawT = Math.atan2(dx, dz);
    b.yaw += ang(yawT - b.yaw) * Math.min(1, dt * (dh < 5 * U ? 9 : 3.6)); const v = vel * (dh < 4 * U ? cl(.35 + dh / (6 * U), .35, 1) : 1);
    b.x += Math.sin(b.yaw) * v * dt; b.z += Math.cos(b.yaw) * v * dt; const vy = cl(dy * 1.4, -v * .55, v * .6); b.y += vy * dt; b.pitch += (cl(-vy / (v + 1) * 1.1, -.6, .6) - b.pitch) * Math.min(1, dt * 5);
    b.roll += (cl(ang(yawT - b.yaw) * .9, -.7, .7) - b.roll) * Math.min(1, dt * 4); b.vel = v;
    b.fase += dt * b.e.bat * (b.esp === "tucano" || b.esp === "gaviao" || b.esp === "curicaca" ? (Math.sin(S.t * 1.3 + b.j * 9) > -.2 ? 1 : .15) : 1) * (vy > 1 ? 1.2 : 1); b.asa += (1 - b.asa) * Math.min(1, dt * 12);
    return { dh, dy };
  }

  function atualiza(b, dt, J, E, per){
    const e = b.e; b.vida -= dt; b.fase += dt * .2; b.bate = Math.max(0, b.bate - dt);
    const A = maisPertoAmeaca(b.x, b.z), fuga = (C.fuga[b.esp] || 10) * (A.m && A.m.corre ? 1.5 : 1), dj = Math.hypot(b.x - J.x, b.z - J.z) / U;
    const sf = silF();
    /* canto */
    b.voz -= dt; if(b.voz <= 0 && dj < ALC[e.voz] * .95){ const nv = C.coro[per] * (1 - sf * .97) * (b.g && b.g.mem.length > 1 && b.esp === "gralha" ? 1.6 : 1); b.voz = rnd(e.cad[0], e.cad[1]) / Math.max(.15, nv);
      if((nv > .05 && b.estado !== "voa") || b.estado === "mergulha" || b.estado === "assedia"){ const k = b.estado === "mergulha" ? 1 : .4; if(b.esp === "picapau" && b.estado === "pousa"){ b.bate = 1.3; som("picapau", b.x, b.y, b.z, .8, 1); } else som(e.voz, b.x, b.y, b.z, b.esp === "tucano" ? .9 : 1, k); } }
    switch(b.estado){
      case "pousa": {
        b.t -= dt; b.cabY += (b.alvoCab - b.cabY) * Math.min(1, dt * 5); if(!b.tc || (b.tc -= dt) < 0){ b.tc = rnd(.7, 2.6); b.alvoCab = rnd(-1.1, 1.1); b.alvoCabP = rnd(-.25, .3); } b.cabP += (b.alvoCabP - b.cabP) * Math.min(1, dt * 5);
        if(A.d < fuga && b.esp !== "gaviao") { espanta(b, A.m); break; }
        b.y = yPouso(b, b.pouso); b.pitch += ((b.pouso.tronco ? -1.45 : .32) - b.pitch) * Math.min(1, dt * 6); b.roll *= 1 - Math.min(1, dt * 6); b.asa *= 1 - Math.min(1, dt * 10);
        if(b.pouso.tronco && b.bate <= 0 && Math.random() < dt * .25){ b.pouso.y += rnd(.1, .45) * U; b.pouso.y = Math.min(b.pouso.y, chao(b.x, b.z) + 7 * U); b.y = yPouso(b, b.pouso); }
        if(b.t <= 0){ b.t = rnd(3, 9); if(b.g && b.esp === "gralha" ? Math.random() < .55 : Math.random() < .2){                       // salta para outra árvore
            const tp = b.esp === "picapau" ? ["araucaria", "folhosa", "medio"] : b.esp === "tucano" ? ["araucaria", "folhosa"] : b.esp === "sabia" ? CHAVES_BAIXAS : CHAVES_ALTAS, p = achaPouso(b.x + rnd(-1, 1) * 8 * U, b.z + rnd(-1, 1) * 8 * U, 12 * U, tp, b.esp === "tucano" ? .9 : .5, .96, b.esp === "picapau");
            if(p){ b.alvo = p; b.estado = "voa"; b.vm = .8; b.asa = 1; b.pouso = null; b.espera = rnd(0, .6); b.t = b.espera; } } }
        break; }
      case "chao": {
        b.t -= dt; const cas = b.casa || { x: b.x, z: b.z };
        if(A.d < fuga && b.esp !== "gaviao"){ if(b.esp === "queroquero" && b.g && b.g.ninho && Math.hypot(A.m.x - b.g.ninho.x, A.m.z - b.g.ninho.z) / U < C.quero.raioNinhoM){ iniciaMergulho(b); break; } espanta(b, A.m); break; }
        if(b.modo === "para"){ b.cabY += ((Math.sin(S.t * .7 + b.j * 9)) * .7 - b.cabY) * Math.min(1, dt * 3); b.cabP += ((b.esp === "sabia" || b.esp === "gralha" || b.esp === "curicaca") && Math.sin(S.t * 1.9 + b.j * 7) > .7 ? .5 : 0 - b.cabP) * Math.min(1, dt * 6); if(b.t <= 0){ b.modo = "anda"; b.t = rnd(1.5, 4.5); b.yawA = b.yaw + rnd(-1.4, 1.4); } b.vel *= 1 - Math.min(1, dt * 6); }
        else { const v = (b.esp === "passarinho" ? .5 : b.esp === "curicaca" ? .5 : b.esp === "queroquero" ? .7 : b.esp === "gralha" ? .55 : .45) * U; const dc = Math.hypot(b.x - cas.x, b.z - cas.z); if(dc > (b.esp === "curicaca" ? 22 : 11) * U) b.yawA = Math.atan2(cas.x - b.x, cas.z - b.z); b.yaw += ang(b.yawA - b.yaw) * Math.min(1, dt * 4); const nx = b.x + Math.sin(b.yaw) * v * dt, nz = b.z + Math.cos(b.yaw) * v * dt;
          if(base.naAgua(nx, nz) || V.turfeira.dentro(nx, nz) && b.esp !== "curicaca"){ b.yawA = b.yaw + Math.PI * .7; } else { b.x = nx; b.z = nz; } b.vel = v; b.cabP += (.05 - b.cabP) * Math.min(1, dt * 4); if(b.t <= 0){ b.modo = "para"; b.t = rnd(1, 3.5); } }
        const hop = b.esp === "passarinho" || b.esp === "sabia" ? Math.abs(Math.sin(S.t * 9 + b.j * 20)) * (b.modo === "anda" ? .5 : 0) * b.s : 0;
        b.y = chao(b.x, b.z) + (.15 + e.perna) * b.s + hop; b.pitch += ((b.modo === "para" ? .12 : .02) - b.pitch) * Math.min(1, dt * 5); b.roll *= 1 - Math.min(1, dt * 6); b.asa *= 1 - Math.min(1, dt * 10);
        break; }
      case "voa": {
        if(b.espera > 0){ b.espera -= dt; b.asa += (.5 - b.asa) * Math.min(1, dt * 8); break; }
        const a = b.alvo, ay = a.chao ? chao(a.x, a.z) + (.15 + e.perna) * b.s : yPouso(b, a), r = voo(b, dt, e.vo * U * b.vm, { x: a.x, z: a.z, y: ay });
        if(r.dh < 1.1 * U && Math.abs(r.dy) < 1.6 * U){ if(a.chao){ b.x = a.x; b.z = a.z; paraChao(b); b.casa = { x: a.x, z: a.z }; } else pousaEm(b, a); b.estado = a.chao ? "chao" : "pousa"; }
        else if(b.vida < -60) b.fim = true;
        break; }
      case "sobrevoo": {
        const rumo = b.rumo; b.yaw += ang(rumo - b.yaw) * Math.min(1, dt * 2); const v = C.papagaios.velocidade * U * b.vm; b.x += Math.sin(b.yaw) * v * dt; b.z += Math.cos(b.yaw) * v * dt; b.y += Math.sin(S.t * 1.4 + b.j * 9) * .5 * U * dt; b.fase += dt * e.bat; b.asa = 1; b.vel = v; b.pitch *= 1 - Math.min(1, dt * 4); b.roll = Math.sin(S.t * .9 + b.j * 7) * .12;
        if(dj > C.raio * 1.45 && (b.x - J.x) * Math.sin(rumo) + (b.z - J.z) * Math.cos(rumo) > 0) b.fim = true;
        break; }
      case "plana": {                                                                // gavião girando alto
        const c = b.centro; b.ang += dt * (b.vgiro || .22); const R = (b.raio || 30) * U; const tx = c.x + Math.cos(b.ang) * R, tz = c.z + Math.sin(b.ang) * R; const nx = tx - b.x, nz = tz - b.z; const yawT = Math.atan2(nx, nz); b.yaw += ang(yawT - b.yaw) * Math.min(1, dt * 3);
        const v = e.vo * U * .9; b.x += Math.sin(b.yaw) * v * dt; b.z += Math.cos(b.yaw) * v * dt; b.y += ((c.y + Math.sin(S.t * .3) * 2 * U) - b.y) * Math.min(1, dt * .8); b.asa = 1; b.fase += dt * 1.2; b.roll += (-.35 - b.roll) * Math.min(1, dt * 2); b.pitch *= 1 - Math.min(1, dt * 3); b.vel = v;
        break; }
      case "foge": {                                                                  // gavião expulso: se afasta rápido
        const v = e.vo * U * 1.6; b.yaw += ang(b.rumo - b.yaw) * Math.min(1, dt * 3); b.x += Math.sin(b.yaw) * v * dt; b.z += Math.cos(b.yaw) * v * dt; b.y += 1.2 * U * dt; b.asa = 1; b.fase += dt * 5; b.roll *= 1 - Math.min(1, dt * 3); b.pitch += (-.2 - b.pitch) * Math.min(1, dt * 3); b.vel = v;
        if(dj > C.raio * 1.3) b.fim = true; break; }
      case "assedia": {                                                               // gralhas atrás do gavião
        const h = S.hawk && S.hawk.b; if(!h || h.fim){ b.estado = "voa"; b.alvo = achaPouso(b.x, b.z, 30 * U, CHAVES_ALTAS, .5, .95) || { x: b.x, z: b.z, y: chao(b.x, b.z), chao: true }; b.vm = 1; break; }
        const o = b.orb || (b.orb = { a: rnd(0, 6.283), r: rnd(1.5, 5) * U }); o.a += dt * 3.2; voo(b, dt, e.vo * U * 1.35, { x: h.x + Math.cos(o.a) * o.r, z: h.z + Math.sin(o.a) * o.r, y: h.y + Math.sin(o.a * 1.7) * 2.5 * U });
        break; }
      case "mergulha": mergulho(b, dt, J); break;
    }
    b.y = Math.max(b.y, chao(b.x, b.z) + .4 * U * (b.estado === "voa" || b.estado === "mergulha" ? 1 : 0));
    if(b.estado === "pousa" || b.estado === "chao"){ if(b.vida < 0){ b.vida = 40; if(dj > C.raio * .55) b.fim = true; } }
    if(dj > C.raio * 1.18 && b.estado !== "sobrevoo") b.fim = true;
    if(per === "noite" && b.estado !== "plana" && b.estado !== "foge"){ b.vida = Math.min(b.vida, 6); if(b.vida < 0) b.fim = true; }
  }

  /* ---------- quero-quero: rasantes sobre quem chega perto do ninho ---------- */
  function iniciaMergulho(b){ const g = b.g; g.mem.forEach((q, i) => { if(q.estado === "mergulha") return; q.estado = "mergulha"; q.q = { fase: "sobe", t: 0, atraso: i * 1.1, alvo: null, fim: rnd(...C.quero.mergulhoSeg) }; q.pouso = null; q.asa = 1; q.vm = 1; }); som("queroquero", b.x, b.y, b.z, 1, 1); }
  function mergulho(b, dt, J){
    const q = b.q, n = b.g && b.g.ninho; if(!q || !n){ b.estado = "voa"; b.alvo = { x: b.x, z: b.z, y: chao(b.x, b.z), chao: true }; return; }
    q.t += dt; if(q.atraso > 0){ q.atraso -= dt; b.asa = .3; return; }
    const R = C.quero.raioNinhoM * U; let A = null, dm = 1e18; S.ameacas.forEach(p => { const d = Math.hypot(p.x - n.x, p.z - n.z); if(d < R + 6 * U && d < dm){ dm = d; A = p; } });
    if(!A){ q.livre = (q.livre || 0) + dt; if(q.livre > 4){ b.estado = "voa"; b.alvo = { x: n.x + rnd(-4, 4) * U, z: n.z + rnd(-4, 4) * U, y: n.y, chao: true }; b.vm = .9; b.q = null; return; } } else q.livre = 0;
    const alvoY = (A && A.jogador ? J.y : chao(A ? A.x : n.x, A ? A.z : n.z)) + 1.9 * U;
    if(q.fase === "sobe"){ const a = A || { x: n.x, z: n.z }; if(!q.p){ const aa = rnd(0, 6.283); q.p = { x: a.x + Math.cos(aa) * 13 * U, z: a.z + Math.sin(aa) * 13 * U, y: chao(a.x, a.z) + rnd(7, 11) * U }; }
      const r = voo(b, dt, ESP.queroquero.vo * U * 1.05, q.p); if(r.dh < 3 * U || q.t > 6){ q.fase = "mergulha"; q.t = 0; q.p = null; if(A) som("queroquero", b.x, b.y, b.z, 1, 1); } }
    else if(q.fase === "mergulha"){ const a = A || { x: n.x, z: n.z }; const r = voo(b, dt, ESP.queroquero.vo * U * 2.4, { x: a.x, z: a.z, y: alvoY }); b.pitch += (.55 - b.pitch) * Math.min(1, dt * 5); if(Math.random() < dt * 2.2) som("queroquero", b.x, b.y, b.z, 1, 1); if(r.dh < 2.2 * U || q.t > 3){ q.fase = "passa"; q.t = 0; q.dir = b.yaw; } }
    else { const dirx = Math.sin(q.dir), dirz = Math.cos(q.dir); const alvo = { x: b.x + dirx * 12 * U, z: b.z + dirz * 12 * U, y: chao(b.x, b.z) + 7 * U }; voo(b, dt, ESP.queroquero.vo * U * 2, alvo); b.yaw = q.dir; if(q.t > 1.3){ q.fase = "sobe"; q.t = 0; q.p = null; } }
  }

  /* ---------- gavião × gralhas (conflito natural, sem violência) ---------- */
  function iniciaGaviao(J, forca){
    if(S.hawk) return false; let g = lista.filter(b => b.esp === "gralha" && b.g && b.estado !== "voa").map(b => b.g)[0];
    if(!g || !g.mem.some(b => Math.hypot(b.x - J.x, b.z - J.z) / U < C.raio * .8)){ if(!forca) return false; g = spawnGralha(J); if(!g) return false; }
    const cx = g.mem[0].x, cz = g.mem[0].z, a = rnd(0, 6.283), h = nova("gaviao", cx + Math.cos(a) * 60 * U, chao(cx, cz) + rnd(17, 26) * U, cz + Math.sin(a) * 60 * U, "plana", { centro: { x: cx, z: cz, y: chao(cx, cz) + rnd(17, 24) * U }, ang: a, raio: rnd(20, 30), vgiro: rnd(.2, .28), vida: 120 }); if(!h) return false; h.asa = 1; h.mudo = false;
    S.hawk = { b: h, g, t: 0, dur: rnd(...C.gaviao.duracaoSeg), est: "chega", cx, cz }; return true;
  }
  function tickGaviao(dt, J){
    const H = S.hawk; if(!H) return; H.t += dt; const h = H.b;
    if(h.fim){ S.hawk = null; return; }
    if(H.est === "chega" && Math.hypot(h.x - H.cx, h.z - H.cz) / U < 36 && H.t > 3){ H.est = "expulsa"; H.t0 = H.t; som("gaviao", h.x, h.y, h.z, 1); H.g.mem.forEach((b, i) => { if(b.estado === "pousa" || b.estado === "chao"){ b.estado = "assedia"; b.pouso = null; b.q = null; b.orb = null; b.asa = 1; b.voz = rnd(0, .8); b.vm = 1; } });
      if(M.fauna.conflitos) M.fauna.conflitos.avisaGuias("gralha", H.cx, H.cz, "Gralhas expulsam o gavião"); }
    if(H.est === "expulsa" && H.t - H.t0 > H.dur){ H.est = "foge"; h.estado = "foge"; h.rumo = Math.atan2(h.x - H.cx, h.z - H.cz) + rnd(-.4, .4); }
    if(H.est === "foge" && S.t % 1 < dt) { /* gralhas voltam sozinhas quando o gavião some (ver estado assedia) */ }
  }

  /* ---------- silêncio da mata (o leão-baio passou) ---------- */
  function silencio(x, z, seg){
    const s = seg || rnd(...CONFLITOS.silencio.duracaoSeg); S.sil = { T: s, t: s, x, z };
    /* uns poucos dão o alarme antes de calar */
    const L = lista.filter(b => (b.estado === "pousa" || b.estado === "chao") && Math.hypot(b.x - x, b.z - z) / U < CONFLITOS.silencio.raioAlarmeM).sort(() => Math.random() - .5).slice(0, 5);
    L.forEach((b, i) => setTimeout(() => som(b.esp === "passarinho" ? "passarinho" : "alarme", b.x, b.y, b.z, 1), i * 220 + 120));
    const G = {}; L.forEach(b => { if(b.g && !G[b.g.id]){ G[b.g.id] = 1; if(b.esp !== "queroquero") espanta(b, { x, z }, false); } });
  }
  const alarme = (x, z, r) => { lista.forEach(b => { if((b.estado === "pousa" || b.estado === "chao") && Math.hypot(b.x - x, b.z - z) / U < r) espanta(b, { x, z }, true); }); };

  /* ---------- desenho ---------- */
  function parte(im, k, x, y, z, rx, ry, rz, sx, sy, sz, cor){ Eu.set(rx, ry, rz, "YXZ"); Qn.setFromEuler(Eu); Vt.set(x, y, z); Sc.set(sx, sy, sz); L4.compose(Vt, Qn, Sc); M4.multiplyMatrices(B4, L4); im.setMatrixAt(k, M4); if(cor) im.setColorAt(k, cor); }
  function desenha(){
    let n = 0, np = 0;
    lista.forEach(b => {
      if(b.fim) return; const e = b.e, P = e.p, s = b.s; Eu.set(b.pitch, b.yaw, b.roll, "YXZ"); Qn.setFromEuler(Eu); Vt.set(b.x, b.y, b.z); Sc.set(s, s, s); B4.compose(Vt, Qn, Sc);
      const cj = (c) => col.setRGB(c[0] * b.j, c[1] * b.j, c[2] * b.j);
      const voando = b.estado === "voa" || b.estado === "sobrevoo" || b.estado === "plana" || b.estado === "foge" || b.estado === "assedia" || b.estado === "mergulha";
      const pesc = e.pescoco || 0, hp = b.cabP * .5 + (b.bate > 0 ? Math.sin(S.t * 38) * .35 : 0), cabH = .2 + pesc * (voando ? .2 : 1);
      parte(G.corpo, n, 0, 0, 0, 0, 0, 0, .5, .46, .92, cj(P.corpo));
      parte(G.peito, n, 0, -.05, .12, 0, 0, 0, .46, .4, .6, cj(P.peito));
      parte(G.cab, n, 0, cabH, .46 + pesc * .2, hp, b.cabY * .5, 0, .3, .3, .33, cj(P.cab));
      if(pesc > 0) parte(G.pescoco, n, 0, .08, .36, voando ? -1.0 : -.15, 0, 0, .1, pesc * (voando ? 1.1 : 1.3), .1, cj(P.peito)); else parte(G.pescoco, n, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
      parte(G.bico, n, 0, cabH - .01, .6 + pesc * .2, hp + (e.bicoR ? .12 : 0), b.cabY * .5, 0, .07 * (e.bicoR || 1), .07 * (e.bicoR || 1), e.bico, cj(P.bico));
      parte(G.cauda, n, 0, .02, -.38, voando ? .08 : .45, 0, 0, .22, .03, .42, cj(P.cauda));
      if(e.crista) parte(G.crista, n, 0, cabH + .1, .42, -.6 + hp, b.cabY * .5, 0, .09, e.crista, .1, cj(P.crista || P.cab)); else parte(G.crista, n, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
      /* asas: abertas (bater) ou dobradas ao longo do corpo */
      const ab = voando ? b.asa : b.asa * .0, bat = voando ? (b.estado === "plana" || (b.estado === "voa" && b.vm < .7 && b.esp !== "passarinho") ? Math.sin(b.fase * 1.1) * .15 : Math.sin(b.fase * 6.283) * .85) : 0, sp = (e.asa || 1.55) * (voando ? 1 : 0), fold = (1 - Math.min(1, ab)) * Math.PI / 2;
      for(const lado of [1, -1]){ const im = lado === 1 ? G.asaD : G.asaE, lo = voando ? Math.max(.4, sp * .9) : .55;
        parte(im, n, lado * .12, .07, .06, 0, lado * fold * .98, lado * (voando ? bat : -.35), lo, .03, .5 + (e.asa ? .15 : 0), cj(P.asa)); }
      /* pernas: penduradas do corpo; quando voam, encolhidas */
      const pl = voando ? .1 : e.perna; for(const lado of [1, -1]){ parte(G.perna, np++, lado * .08, -.15, .05, voando ? .8 : 0, 0, 0, .04, pl, .04, col.setRGB(.2, .17, .14)); }
      n++;
    });
    PARTES.forEach(k => { const im = G[k]; im.count = k === "perna" ? np : n; im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; });
    /* ninhos */
    let nn = 0, ne = 0; if(C.quero.mostraNinho) ninhos.forEach(nt => { Eu.set(0, 0, 0); Qn.identity(); Vt.set(nt.x, chao(nt.x, nt.z) + .03 * U, nt.z); Sc.set(.8 * U, .8 * U, .8 * U); M4.compose(Vt, Qn, Sc); nin.cova.setMatrixAt(nn, M4); nin.cova.setColorAt(nn, col.setRGB(.32, .26, .18)); nn++;
      for(let i = 0; i < 3; i++){ const a = i * 2.1; Vt.set(nt.x + Math.cos(a) * .18 * U, chao(nt.x, nt.z) + .1 * U, nt.z + Math.sin(a) * .18 * U); Sc.set(.18 * U, .24 * U, .18 * U); M4.compose(Vt, Qn, Sc); nin.ovo.setMatrixAt(ne, M4); nin.ovo.setColorAt(ne, col.setRGB(.62, .58, .42)); ne++; } });
    nin.cova.count = nn; nin.ovo.count = ne; [nin.cova, nin.ovo].forEach(im => { im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; });
  }

  /* ---------- sons de fundo: coro do amanhecer, silêncio do meio-dia, corujas e anfíbios à noite ---------- */
  function fundo(dt, J, E, per){
    const sf = silF(), nv = C.coro[per] * (1 - sf * .98);
    S.fundoT -= dt; if(S.fundoT <= 0 && nv > .03){ S.fundoT = rnd(.35, 1.2) / nv; const a = rnd(0, 6.283), d = rnd(24, 110) * U, x = J.x + Math.cos(a) * d, z = J.z + Math.sin(a) * d, t = habitat(x, z), L = t === "mata" ? [["gralha", 12], ["sabia", 24], ["passarinho", 20], ["picapau", 8], ["tucano", per === "alvorada" ? 3 : 1]] : [["sabia", 18], ["passarinho", 24], ["queroquero", 12], ["curicaca", 8]]; if(per === "alvorada" || per === "entardecer") L.push(["papagaio", 10]); som(sorteia(L), x, J.y + rnd(2, 10) * U, z, .55 + .35 * nv, .2); }
    if(per === "noite"){
      S.corujaT -= dt; if(C.noite.coruja && S.corujaT <= 0){ S.corujaT = rnd(7, 18); const a = rnd(0, 6.283), d = rnd(35, 120) * U; som("coruja", J.x + Math.cos(a) * d, J.y + 8 * U, J.z + Math.sin(a) * d, .9); }
      S.raT -= dt; if(C.noite.anfibios && S.raT <= 0){ S.raT = rnd(.8, 2.6); const T = V.turfeira, nas = T.nascentes(), ref = nas.length && Math.random() < .5 ? pick(nas) : (() => { const A = cen.rios.ARROIO, q = A[Math.floor(Math.random() * A.length)]; return { x: q[0], z: q[1] }; })(); som("ra", ref.x + rnd(-10, 10) * U, chao(ref.x, ref.z), ref.z + rnd(-10, 10) * U, .8); }
    }
  }

  /* ---------- laço principal ---------- */
  function tick(dt, J, E){
    if(!C.ativo || !J){ if(lista.length){ lista.length = 0; desenha(); } return; }
    S.t += dt; const per = periodo(E); S.per = per; if(S.sil){ S.sil.t -= dt; if(S.sil.t <= 0) S.sil = null; }
    S.ameacaT -= dt; if(S.ameacaT <= 0){ S.ameacaT = .1; atualizaAmeacas(J); }
    /* leão-baio por perto: alarme e mata calada */
    M.fauna.animais.forEach(a => { if(a.id === "puma" && !a.sil && Math.hypot(a.x - J.x, a.z - J.z) / U < CONFLITOS.silencio.alcanceM){ a.sil = true; silencio(a.x, a.z); if(M.fauna.conflitos) M.fauna.conflitos.avisaGuias("silencio", a.x, a.z, "Silêncio da mata"); } });
    /* nasce */
    const Qx = qualidade(), alvoN = Math.round(C.max * Qx.aves * (per === "noite" ? 0 : .25 + .75 * C.coro[per] / Math.max(.01, C.coro.alvorada)));
    S.spawn += dt; if(S.spawn > C.intervaloSpawn && per !== "noite"){ S.spawn = 0; if(lista.length < alvoN) { const op = Object.entries(C.pesos).filter(([k]) => k !== "tucano" || (E.alt > 4)).map(([k, w]) => [k, w * (k === "queroquero" || k === "curicaca" || k === "passarinho" ? 1 : 1)]); const k = sorteia(op); const fn = SPAWN[k]; if(fn) fn(J); } }
    /* revoadas de papagaios */
    S.papa -= dt; if(S.papa <= 0){ S.papa = 6; const janela = (per === "alvorada" && E.h > 5) || per === "entardecer"; if(janela && Math.random() < C.papagaios.porMinuto / 10) revoada(J); }
    /* gavião sobrevoando (expulso pelas gralhas) */
    S.gav -= dt; if(S.gav <= 0){ S.gav = 6; if(per !== "noite" && !S.hawk && Math.random() < C.gaviao.porMinuto / 10 * (CONFLITOS.ativo ? CONFLITOS.chance.gralhaGaviao * 2 : 0)) iniciaGaviao(J, false); }
    for(let i = lista.length - 1; i >= 0; i--){ const b = lista[i]; atualiza(b, dt, J, E, per); if(b.fim){ lista.splice(i, 1); } }
    for(let i = ninhos.length - 1; i >= 0; i--){ const n = ninhos[i], d = Math.hypot(n.x - J.x, n.z - J.z) / U; if(d > C.raio * 1.25 && !lista.some(b => b.g && b.g.ninho === n)) ninhos.splice(i, 1); }
    tickGaviao(dt, J); fundo(dt, J, E, per); desenha();
  }

  /* ---------- depuração ---------- */
  function forcaQuero(J){ const a = (J.yaw !== undefined ? J.yaw : 0), x = J.x + Math.sin(a) * 18 * U, z = J.z + Math.cos(a) * 18 * U; lista.filter(b => b.esp === "queroquero").forEach(b => { b.fim = true; }); ninhos.length = 0; for(let i = 0; i < 12; i++){ const q = [x + rnd(-6, 6) * U, z + rnd(-6, 6) * U]; if(habitat(q[0], q[1]) === "campo"){ const g = spawnQuero(J, q); if(g){ g.mem.forEach(b => { b.x = q[0] + rnd(-2, 2) * U; b.z = q[1] + rnd(-2, 2) * U; }); return true; } } } return false; }
  /* para os guias: bando de gralhas pousado ou ninho de quero-quero a ~22 m */
  function lugarPerto(x, z){
    const g = lista.filter(b => b.esp === "gralha" && (b.estado === "pousa" || b.estado === "chao") && Math.hypot(b.x - x, b.z - z) / U < 22); if(g.length >= 2) return { tipo: "gralha", x: g[0].x, z: g[0].z };
    const n = ninhos.find(q => Math.hypot(q.x - x, q.z - z) / U < C.quero.raioNinhoM + 8); if(n) return { tipo: "queroquero", x: n.x, z: n.z };
    return null;
  }
  const info = () => { const c = {}; lista.forEach(b => { c[b.esp] = (c[b.esp] || 0) + 1; }); return "Aves " + lista.length + " (" + Object.keys(c).map(k => k[0] + c[k]).join(" ") + ") · " + S.per + (S.sil ? " · silêncio " + S.sil.t.toFixed(0) + " s" : "") + (S.hawk ? " · gavião×gralhas" : ""); };
  const maisPerto = (x, z) => { let m = null, d = 1e18; lista.forEach(b => { const q = Math.hypot(b.x - x, b.z - z); if(q < d){ d = q; m = b; } }); return m ? { b: m, d } : null; };
  return { lista, ninhos, S, ESP, tick, info, somExt: som, silencio, alarme, iniciaGaviao, lugarPerto, revoada: (J) => revoada(J, true), forcaQuero, maisPerto, spawn: (k, J) => (SPAWN[k] ? SPAWN[k](J) : null), desliga(){ lista.length = 0; ninhos.length = 0; S.hawk = null; S.sil = null; desenha(); } };
}
