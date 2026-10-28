import { Group, InstancedMesh, IcosahedronGeometry, SphereGeometry, BoxGeometry, CylinderGeometry, MeshStandardMaterial, DynamicDrawUsage, Color, Matrix4, Quaternion, Vector3, Euler } from "three";
import { U, SAPINHOS as C } from "../config.js";

/* ============================================================================================================
   SAPINHOS Melanophryniscus nas turfeiras (e pererecas ao entardecer) + libélulas
   • Só existem num raio pequeno (~25 m) em volta do jogador; fora disso nada é processado. Máximo de ativos configurável. Instancing: 1 mesh por parte do corpo.
   • Corpo arredondado, verrugas (pontinhos), pernas curtas, dorso escuro; barriga, palmas e plantas dos pés vermelhas/alaranjadas (aparecem na postura de alerta).
   • Locomoção: andam devagar, passo a passo, intercalando pulinhos curtos; param, levantam o corpo, piscam, viram a cabeça. Casais ficam juntos, um seguindo o outro.
   • Alerta (~1 m): arqueiam o corpo e levantam as patas mostrando o vermelho, depois se afastam caminhando ou com pulinhos. Nunca são esmagados nem tocados: saem antes.
   • Ativos de dia, sobretudo em dias úmidos (neblina/chuva); escondidos à noite. Coro curto e agudo nos dias úmidos, mais forte no meio da turfeira.
   • Zonas: meio da turfeira (mais, perto de poças), borda (até 15 m para fora), margens do Arroio Graxaim (aparições aleatórias).
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => Math.max(a, Math.min(b, v)), ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };
const pick = (L) => L[Math.floor(Math.random() * L.length)];

export function criarSapinhos(M){
  const { cen } = M, V = M.vegetacao, base = V.base, T = V.turfeira, Z = M.fauna.zonas, grupo = new Group(); cen.grupo.add(grupo);
  const CAP = C.max + (C.peregrecas.ativo ? C.peregrecas.max : 0), PARTES = 14;
  const mat = new MeshStandardMaterial({ roughness: .65, metalness: 0, vertexColors: false });
  const mk = (geo, n = CAP) => { const im = new InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.setColorAt(0, new Color(1, 1, 1)); im.instanceColor.setUsage(DynamicDrawUsage); im.castShadow = false; grupo.add(im); return im; };
  const G = {
    corpo: mk(new IcosahedronGeometry(.5, 1)), cabeca: mk(new IcosahedronGeometry(.3, 1)), barriga: mk(new IcosahedronGeometry(.44, 1)), olho: mk(new IcosahedronGeometry(.075, 0), CAP * 2), listra: mk(new BoxGeometry(.1, .03, .8)),
    perna: mk(new BoxGeometry(.16, .12, .46), CAP * 4), pe: mk(new IcosahedronGeometry(.1, 0), CAP * 4), pontos: mk(new IcosahedronGeometry(.04, 0), CAP * 6)
  };
  /* libélulas */
  const lib = { corpo: mk(new CylinderGeometry(.05, .03, 1.2, 5), 8), asa: mk(new BoxGeometry(.9, .01, .22), 16) }; const dr = []; for(let i = 0; i < 6; i++) dr.push({ x: 0, y: 0, z: 0, yaw: 0, ativo: false, t: Math.random() * 6, alvo: [0, 0], alt: 1 });
  const lista = [], S = { umido: 0, forcaUmido: false, t: 0, spawn: 0, canto: 0, coaxa: 0, ac: null };
  const M4 = new Matrix4(), Qn = new Quaternion(), Vt = new Vector3(), Sc = new Vector3(), E = new Euler(), col = new Color(), loc = new Matrix4();
  const parte = (im, k, base_, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, cor = null) => { E.set(rx, ry, rz); Qn.setFromEuler(E); Vt.set(x, y, z); Sc.set(sx, sy, sz); loc.compose(Vt, Qn, Sc); M4.multiplyMatrices(base_, loc); im.setMatrixAt(k, M4); if(cor) im.setColorAt(k, cor); };

  /* ---------- aparência de cada espécie ---------- */
  const ESP = { ...C.especies, perereca: { ativo: true, nome: "Perereca", dorso: [.2, .45, .18], listra: null, vermelho: [.9, .85, .5], grande: 1.5 } };
  const sorteiaEsp = () => { const L = Object.entries(C.especies).filter(([, e]) => e.ativo); if(!L.length) return null; let t = Math.random() * L.reduce((s, [, e]) => s + e.peso, 0); for(const [k, e] of L){ t -= e.peso; if(t <= 0) return k; } return L[0][0]; };

  /* ---------- onde nascem ---------- */
  const arroioPts = () => { const A = cen.rios.ARROIO; const kml = M.kml && M.kml.S.linhas.find(l => C.arroioNome.test(l.nome)); return kml ? kml.pts : A; };
  function pontoArroio(J){
    const L = arroioPts(), cand = []; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / 18)); for(let k = 0; k < n; k++){ const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; const d = Math.hypot(x - J.x, z - J.z) / U; if(d > 6 && d < C.raio) cand.push([x, z, b[0] - a[0], b[1] - a[1]]); } }
    if(!cand.length) return null; const c = pick(cand), l = Math.hypot(c[2], c[3]) || 1, lado = Math.random() < .5 ? 1 : -1, off = rnd(4.2, 7.5);
    const x = c[0] - c[3] / l * lado * off, z = c[1] + c[2] / l * lado * off; const ag = cen.agua(x, z); if(ag && ag.dentro) return null; return [x, z];
  }
  function pontoMeio(J){
    let best = null; for(let k = 0; k < 14; k++){ const a = Math.random() * 6.283, d = rnd(6, C.raio) * U, x = J.x + Math.cos(a) * d, z = J.z + Math.sin(a) * d; const p = T.emTurfeira(x, z); if(!p) continue; const m = T.amostra(p, x, z); if(!m || m.a < .6 || m.r > .55) continue; const sc = m.r + Math.random() * .3 + m.b * .4; if(!best || sc > best.s) best = { x, z, s: sc }; } return best ? [best.x, best.z] : null;
  }
  function pontoBorda(J){
    for(let k = 0; k < 24; k++){ const a = Math.random() * 6.283, d = rnd(6, C.raio) * U, x = J.x + Math.cos(a) * d, z = J.z + Math.sin(a) * d; if(T.emTurfeira(x, z)) continue; const dt = T.distTurfeira(x, z) / U; if(dt > 0.3 && dt < C.zonas.borda.ateM && base.livreBase(x, z, 2) && base.distTrilha(x, z) > 5) return [x, z]; } return null;
  }
  const chao = (x, z) => base.alturaNo(x, z);
  function novo(esp, x, z, zona, par){
    const e = ESP[esp], f = { esp, zona, x, z, y: chao(x, z), yaw: Math.random() * 6.283, estado: "para", t: rnd(1, 3), fase: Math.random() * 6, hop: 0, hopV: 0, pitch: 0, alerta: 0, vida: rnd(C.vidaSeg[0], C.vidaSeg[1]), par: par || null, alvo: null, esc: C.escalaVisual * .12 * (e.grande || 1) * rnd(.9, 1.1), piscada: rnd(1, 4), cabeca: 0, vis: 1, tem: false };
    lista.push(f); return f;
  }
  function tentaSpawn(J, alvoN, E){
    const Zs = C.zonas, opc = []; if(Zs.meio.ativo && T.polis().length) opc.push(["meio", Zs.meio.peso]); if(Zs.borda.ativo && T.polis().length) opc.push(["borda", Zs.borda.peso]); if(Zs.arroio.ativo) opc.push(["arroio", Zs.arroio.peso]);
    if(!opc.length) return; let t = Math.random() * opc.reduce((s, o) => s + o[1], 0), zona = opc[0][0]; for(const [k, w] of opc){ t -= w; if(t <= 0){ zona = k; break; } }
    const p = zona === "meio" ? pontoMeio(J) : zona === "borda" ? pontoBorda(J) : pontoArroio(J); if(!p) return;
    const esp = sorteiaEsp(); if(!esp) return; const casal = Math.random() < Zs[zona].casal; const a = novo(esp, p[0], p[1], zona); if(casal && lista.length < alvoN + 1){ const b = novo(esp, p[0] + rnd(-.5, .5) * U * .3, p[1] + rnd(-.5, .5) * U * .3, zona, a); a.par = b; }
  }
  /* pererecas ao entardecer/noite (poças e nascentes) */
  function tentaPerereca(J){ if(lista.filter(f => f.esp === "perereca").length >= C.peregrecas.max) return; const ns = T.nascentes(); let p = null; if(ns.length && Math.random() < .5){ const n = pick(ns); if(Math.hypot(n.x - J.x, n.z - J.z) < 40 * U) p = [n.x + rnd(-6, 6), n.z + rnd(-6, 6)]; } if(!p) p = pontoMeio(J); if(!p) return; if(Math.hypot(p[0] - J.x, p[1] - J.z) / U > 24) return; novo("perereca", p[0], p[1], "meio"); }

  /* ---------- comportamento ---------- */
  function atualiza(f, dt, J){
    const dj = Math.hypot(f.x - J.x, f.z - J.z), dm = dj / U; f.vida -= dt; f.fase += dt * (f.estado === "anda" ? 7 : 2); f.piscada -= dt;
    const prox = dj < C.alerta * U;
    if(f.estado !== "foge" && prox && f.esp !== "perereca"){ f.estado = "alerta"; f.t = rnd(1.6, 3.2); f.yawAlvo = Math.atan2(J.x - f.x, J.z - f.z); }
    if(f.esp === "perereca" && dj < 5 * U && f.estado !== "foge"){ f.estado = "foge"; f.t = rnd(1.2, 2.2); f.yawAlvo = Math.atan2(f.x - J.x, f.z - J.z); }
    f.t -= dt;
    switch(f.estado){
      case "para": f.pitch += (rnd(.0, .0) + (Math.sin(f.fase * .4) > .85 ? .22 : 0) - f.pitch) * Math.min(1, dt * 4); f.cabeca += (Math.sin(f.fase * .31) * .5 - f.cabeca) * Math.min(1, dt * 3); if(f.t <= 0){ f.estado = "anda"; f.t = rnd(2, 6); f.yawAlvo = f.yaw + rnd(-1.2, 1.2); if(f.par && lista.includes(f.par)){ f.yawAlvo = Math.atan2(f.par.x - f.x, f.par.z - f.z) + (Math.random() < .5 ? Math.PI * .8 : 0); } } break;
      case "anda": { const v = (f.esp === "perereca" ? 1.8 : .55) * f.esc * 7, hopT = f.esp === "perereca" ? 1.5 : 3.4; f.yaw += ang((f.yawAlvo !== undefined ? f.yawAlvo : f.yaw) - f.yaw) * Math.min(1, dt * 3);
        f.hop -= dt; if(f.hop <= 0 && Math.random() < dt * (hopT * .25)){ f.hop = .3; f.hopV = 1; } const k = f.hop > 0 ? 2.6 : 1; f.x += Math.sin(f.yaw) * v * dt * k; f.z += Math.cos(f.yaw) * v * dt * k;
        if(!base.livreBase(f.x, f.z, 0) || (f.zona !== "arroio" && f.esp !== "perereca" && !T.emTurfeira(f.x, f.z) && T.distTurfeira(f.x, f.z) / U > (f.zona === "borda" ? C.zonas.borda.ateM + 4 : 3))){ f.yawAlvo = f.yaw + Math.PI; }
        { const ag = cen.agua(f.x, f.z); if(ag && ag.dentro && f.esp !== "perereca"){ f.yawAlvo = f.yaw + Math.PI * .8; f.x -= Math.sin(f.yaw) * v * dt * 2; f.z -= Math.cos(f.yaw) * v * dt * 2; } }
        if(f.t <= 0){ f.estado = "para"; f.t = rnd(1.5, 5); } break; }
      case "alerta": { f.yaw += ang(f.yawAlvo - f.yaw) * Math.min(1, dt * 6); f.alerta += (1 - f.alerta) * Math.min(1, dt * 7); if(f.t <= 0 && !prox){ f.estado = "foge"; f.t = rnd(1.5, 3); f.yawAlvo = Math.atan2(f.x - J.x, f.z - J.z) + rnd(-.5, .5); } break; }
      case "foge": { f.alerta *= 1 - Math.min(1, dt * 3); f.yaw += ang(f.yawAlvo - f.yaw) * Math.min(1, dt * 6); const v = (f.esp === "perereca" ? 6 : 1.5) * f.esc * 7; f.hop -= dt; if(f.hop <= 0){ f.hop = .26; f.hopV = 1; } f.x += Math.sin(f.yaw) * v * dt * (f.hop > 0 ? 2.8 : 1); f.z += Math.cos(f.yaw) * v * dt * (f.hop > 0 ? 2.8 : 1); if(f.t <= 0){ f.estado = "para"; f.t = rnd(1, 3); } break; }
    }
    if(f.estado !== "alerta") f.alerta *= 1 - Math.min(1, dt * 4);
    f.hopV = Math.max(0, f.hopV - dt * 3.4); f.y = chao(f.x, f.z) + f.hopV * (1 - f.hopV) * 4 * f.esc * (f.esp === "perereca" ? 3.4 : 1.4) * U * .12;
    if(f.estado === "anda" || f.estado === "foge") f.pitch += (-.04 - f.pitch) * Math.min(1, dt * 5); else if(f.estado === "alerta") f.pitch += (-.62 - f.pitch) * Math.min(1, dt * 7);
    f.tem = true; return dm;
  }
  /* ---------- desenho ---------- */
  const corD = new Color(), corV = new Color(), corP = new Color();
  function desenha(){
    let n = 0, ne = 0, nl = 0, nPt = 0; const B = new Matrix4();
    lista.forEach(f => { const e = ESP[f.esp], ci = n; Qn.setFromEuler(E.set(f.pitch, f.yaw, 0, "YXZ")); Vt.set(f.x, f.y + .3 * f.esc * 1.0, f.z); Sc.set(f.esc, f.esc, f.esc); B.compose(Vt, Qn, Sc); const al = f.alerta, abre = al * .55;
      corD.setRGB(...e.dorso); corV.setRGB(...e.vermelho); corP.setRGB(...(e.listra || e.dorso));
      const dorso = corD.clone().multiplyScalar(.85 + .3 * ((f.fase * 7) % 1 > 2 ? 1 : 1));
      parte(G.corpo, n, B, 0, .25 + al * .2, 0, 1, .62, .85, 0, 0, 0, dorso);
      parte(G.barriga, n, B, 0, .06 + al * .1, .02, 1.02 - al * .1, .5 + al * .4, .98, 0, 0, 0, corV);
      parte(G.cabeca, n, B, 0, .3 + al * .38, .54 + al * .1, 1, .8, 1.1, -al * .3 + f.cabeca * .0, f.cabeca, 0, dorso);
      const pis = f.piscada < 0 && f.piscada > -.12 ? .15 : 1; if(f.piscada < -.12) f.piscada = rnd(1.5, 5);
      for(const s of [-1, 1]){ parte(G.olho, ne, B, s * .17, .42 + al * .38, .68 + al * .1, 1, pis, 1, 0, 0, 0, corP.setRGB(.9, .9, .85).multiplyScalar(f.esp === "perereca" ? 1 : .08)); ne++; }
      if(e.listra){ parte(G.listra, n, B, 0, .52 + al * .2, -.02, 1, 1, 1, 0, 0, 0, corP.setRGB(...e.listra)); } else G.listra.setMatrixAt(n, new Matrix4().makeScale(0, 0, 0));
      /* pernas: 2 dianteiras e 2 traseiras; no alerta, as patas sobem e abrem mostrando as palmas vermelhas */
      const sw = Math.sin(f.fase * 1.7) * (f.estado === "anda" ? .5 : f.estado === "foge" ? .8 : .05), idx = [[1, .44, .3, 1], [-1, .44, .3, -1], [1, -.5, -.3, -1], [-1, -.5, -.3, 1]];
      idx.forEach(([s, lx, lz, ph], q) => { const frente = lz > 0; const lev = frente ? al * 1.2 : al * .5, rx = sw * ph * (frente ? .9 : .6) - lev; const lxw = (frente ? lx : lx * 1.2) * s * (frente ? 1 : 1), px = lxw * (1 + al * .45), py = .12 + lev * .6, pz = lz + sw * ph * .15;
        parte(G.perna, ne * 0 + n * 4 + q, B, px, py, pz, .9, 1, frente ? .9 : 1.1, rx, s * .3 * (1 + al), s * (.35 + al * .5), dorso);
        parte(G.pe, n * 4 + q, B, px + s * (.05 + al * .12), py - .08 + lev * .3, pz + (frente ? .26 : .3), 1.2 + al * .5, .7, 1.7, rx * .5, 0, 0, corV); });
      for(let k = 0; k < 6; k++){ const a = k * 1.9, rr = .3 + (k % 3) * .08; parte(G.pontos, n * 6 + k, B, Math.cos(a) * rr * .8, .5 + al * .2, Math.sin(a) * rr * .6 - .05, 1, 1, 1, 0, 0, 0, e.listra ? corP.setRGB(.9, .8, .5) : corP.setRGB(.55, .5, .42)); }
      n++; nPt += 6; void ci; });
    G.corpo.count = G.cabeca.count = G.barriga.count = G.listra.count = n; G.olho.count = n * 2; G.perna.count = G.pe.count = n * 4; G.pontos.count = n * 6;
    Object.values(G).forEach(im => { im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; }); void ne; void nl; void nPt;
  }
  /* ---------- libélulas (horas quentes, sobre poças e nascentes) ---------- */
  function libelulas(dt, J, E){
    const quente = E.h > 10 && E.h < 17 && E.alt > 20 && S.umido < .9; let nl = 0, na = 0; const B = new Matrix4();
    const alvos = []; T.nascentes().forEach(n => { if(Math.hypot(n.x - J.x, n.z - J.z) < 70 * U) alvos.push([n.x, n.z]); }); const pm = T.polis(); if(pm.length && !alvos.length){ const b = T.meio(pm[0]); if(b && Math.hypot(b.x - J.x, b.z - J.z) < 80 * U) alvos.push([b.x, b.z]); }
    dr.forEach(d => { if(!d.ativo && quente && alvos.length && Math.random() < dt * .08){ const a = pick(alvos); d.x = a[0] + rnd(-20, 20); d.z = a[1] + rnd(-20, 20); d.y = chao(d.x, d.z) + 4; d.alvo = [a[0], a[1]]; d.ativo = true; d.t = 0; d.vida = rnd(30, 80); }
      if(!d.ativo) return; d.vida -= dt; d.t += dt; if(d.vida < 0 || !quente){ d.ativo = false; return; } const dx = d.alvo[0] - d.x, dz = d.alvo[1] - d.z; if(Math.random() < dt * .8) d.alvo = [d.alvo[0] + rnd(-14, 14), d.alvo[1] + rnd(-14, 14)];
      const ya = Math.atan2(dx, dz) + Math.sin(d.t * 2) * .6; d.yaw += ang(ya - d.yaw) * Math.min(1, dt * 3); const v = 9 + Math.sin(d.t * 1.3) * 5; d.x += Math.sin(d.yaw) * v * dt; d.z += Math.cos(d.yaw) * v * dt; d.y += (chao(d.x, d.z) + 3.5 + Math.sin(d.t * 1.7) * 1.5 - d.y) * Math.min(1, dt * 2);
      Qn.setFromEuler(E.set(0, d.yaw + Math.PI / 2 * 0, 0, "YXZ")); Vt.set(d.x, d.y, d.z); Sc.set(1, 1, 1); B.compose(Vt, Qn, Sc); E.set(Math.PI / 2, 0, 0); const q2 = new Quaternion().setFromEuler(E); const l2 = new Matrix4().compose(new Vector3(0, 0, 0), q2, new Vector3(1, 1, 1)); lib.corpo.setMatrixAt(nl, B.clone().multiply(l2)); lib.corpo.setColorAt(nl, corP.setRGB(.1, .35, .5)); nl++;
      for(const s of [-1, 1]){ const bat = Math.sin(d.t * 55) * .5; const lw = new Matrix4().compose(new Vector3(s * .5, .05, .2), new Quaternion().setFromEuler(E.set(0, 0, s * bat)), new Vector3(1, 1, 1)); lib.asa.setMatrixAt(na, B.clone().multiply(lw)); lib.asa.setColorAt(na, corP.setRGB(.8, .9, .95)); na++; lw.compose(new Vector3(s * .5, .05, -.2), new Quaternion().setFromEuler(E.set(0, 0, s * bat)), new Vector3(1, 1, 1)); lib.asa.setMatrixAt(na, B.clone().multiply(lw)); lib.asa.setColorAt(na, corP.setRGB(.8, .9, .95)); na++; } });
    lib.corpo.count = nl; lib.asa.count = Math.min(na, 16); [lib.corpo, lib.asa].forEach(m => { m.instanceMatrix.needsUpdate = true; if(m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  /* ---------- sons: coro de sapinhos (agudo, curto) e coaxar de sapos à noite ---------- */
  const audio = () => { try{ return S.ac = S.ac || new (window.AudioContext || window.webkitAudioContext)(); }catch(_){ return null; } };
  function chilro(vol){ const a = audio(); if(!a || vol < .01) return; const t = a.currentTime, n = 2 + Math.floor(Math.random() * 3); for(let i = 0; i < n; i++){ const o = a.createOscillator(), g = a.createGain(), f = 2600 + Math.random() * 900; o.type = "sine"; o.frequency.setValueAtTime(f, t + i * .11); o.frequency.exponentialRampToValueAtTime(f * 1.12, t + i * .11 + .06); g.gain.setValueAtTime(0, t + i * .11); g.gain.linearRampToValueAtTime(.05 * vol, t + i * .11 + .012); g.gain.exponentialRampToValueAtTime(.0005, t + i * .11 + .07); o.connect(g); g.connect(a.destination); o.start(t + i * .11); o.stop(t + i * .11 + .08); } }
  function coaxo(vol){ const a = audio(); if(!a || vol < .01) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(); o.type = "sawtooth"; o.frequency.setValueAtTime(190 + Math.random() * 60, t); o.frequency.linearRampToValueAtTime(150, t + .35); f.type = "bandpass"; f.frequency.value = 520; f.Q.value = 2.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09 * vol, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .42); o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .45); }

  function tick(dt, J, E){
    if(!J || !C.ativo){ if(lista.length){ lista.length = 0; desenha(); } return; }
    S.t += dt; const nv = M.nevoa && M.nevoa.estado ? M.nevoa.estado.n : 0, nubl = cen.climaAtual && cen.climaAtual() === "nublado" ? .22 : 0, manha = E.h < 10 ? .18 : 0;
    S.umido = S.forcaUmido ? 1 : cl(nv * .55 + nubl + manha, 0, 1); const dia = E.alt > -1, crepusculo = E.alt < 6 && E.alt > -18;
    const alvoN = dia ? Math.round(C.max * (.1 + .9 * S.umido)) : 0;
    S.spawn += dt; if(S.spawn > C.intervaloSpawn){ S.spawn = 0; const nS = lista.filter(f => f.esp !== "perereca").length; if(nS < alvoN) tentaSpawn(J, alvoN, E); if(C.peregrecas.ativo && crepusculo && Math.random() < .4) tentaPerereca(J); }
    for(let i = lista.length - 1; i >= 0; i--){ const f = lista[i]; const dm = atualiza(f, dt, J) / U; const fora = dm > C.raio * 1.15, seco = f.esp !== "perereca" && (!dia || (!S.forcaUmido && S.umido < .06)), noite = f.esp === "perereca" && !crepusculo; if(fora || f.vida < 0 || seco || noite){ lista.splice(i, 1); } }
    desenha(); libelulas(dt, J, E);
    /* coros */
    const nPerto = lista.filter(f => f.esp !== "perereca").length; S.canto -= dt;
    if(S.canto <= 0 && nPerto && S.umido > .35 && dia){ S.canto = rnd(.5, 1.7) / Math.sqrt(nPerto); const meio = lista.filter(f => f.zona === "meio"), mp = meio.length ? Math.min(...meio.map(f => Math.hypot(f.x - J.x, f.z - J.z) / U)) : 20; chilro(cl(1 - mp / 24, .1, 1) * (.4 + .6 * S.umido) * (meio.length ? 1 : .5)); }
    S.coaxa -= dt; if(S.coaxa <= 0 && crepusculo){ const dt_ = T.distTurfeira(J.x, J.z) / U, dn = Math.min(1e9, ...T.nascentes().map(n => Math.hypot(n.x - J.x, n.z - J.z) / U)); const d = Math.min(dt_, dn); if(d < 60){ S.coaxa = rnd(.5, 2.2); coaxo(cl(1 - d / 60, .08, 1)); } else S.coaxa = 2; }
  }
  const maisPerto = (x, z) => { let b = null, bd = 1e18; lista.forEach(f => { if(f.esp === "perereca") return; const d = Math.hypot(f.x - x, f.z - z) / U; if(d < bd){ bd = d; b = f; } }); return b ? { x: b.x, z: b.z, d: bd * U, f: b } : null; };
  const info = () => "Sapinhos " + lista.filter(f => f.esp !== "perereca").length + " · pererecas " + lista.filter(f => f.esp === "perereca").length + " · umidade " + S.umido.toFixed(2) + (S.forcaUmido ? " (forçada)" : "");
  return { lista, S, tick, maisPerto, info, forcaUmido(on){ S.forcaUmido = on === undefined ? !S.forcaUmido : on; return S.forcaUmido; }, ESP, desliga(){ lista.length = 0; } };
}
