import { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, CircleGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, Sprite, SpriteMaterial, CanvasTexture, Vector3, MathUtils, DoubleSide, AdditiveBlending } from "three";
import { U } from "../config.js";
import { EVENTOS } from "./config.js";
import { canvasTex } from "../../lib.js";

/* ============================================================================================================
   AERONAVES
   • Monomotor de asa alta (estilo Cessna genérico, matrícula fictícia): passa às 10:00 numa rota levemente curva; às vezes faz um trecho baixo (conduta irregular no jogo).
     Hélice girando (disco translúcido quando rápida), trem fixo, luzes de navegação. Som de motor a pistão com atenuação por distância, Doppler e eco nos paredões.
   • Jato comercial bimotor genérico a ~3 000 m: pequeno no céu, LOD mínimo, luzes de navegação/strobes/beacon à noite, sem rastro, som grave e distante que chega atrasado
     (vem de onde o avião ESTAVA), reflete a luz dourada/rosada do amanhecer e do entardecer mesmo com o chão em sombra.
   ============================================================================================================ */

const m = (v) => v * U, c = 340;
const geo = {}; const G = (k, f) => (geo[k] = geo[k] || f());
const sstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const caixa = (pai, mat, w, h, d, x, y, z) => { const o = new Mesh(G("b", () => new BoxGeometry(1, 1, 1)), mat); o.scale.set(m(w), m(h), m(d)); o.position.set(m(x), m(y), m(z)); pai.add(o); return o; };
const cil = (pai, mat, r1, r2, l, x, y, z, eixo = "z", seg = 14) => { const o = new Mesh(new CylinderGeometry(m(r1), m(r2), m(l), seg), mat); if(eixo === "z") o.rotation.x = Math.PI / 2; else if(eixo === "x") o.rotation.z = Math.PI / 2; o.position.set(m(x), m(y), m(z)); pai.add(o); return o; };

const glow = (() => { let t = null; return () => t || (t = canvasTex(64, 64, (c2, w, h) => { const g = c2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)"); c2.fillStyle = g; c2.fillRect(0, 0, w, h); }, { cor: false })); })();
const luz = (pai, cor, tam, x, y, z) => { const s = new Sprite(new SpriteMaterial({ map: glow(), color: cor, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false })); s.scale.setScalar(tam); s.position.set(x, y, z); pai.add(s); return s; };

/* ---------------- monomotor ---------------- */
export function criaMonomotor(matricula){
  const A = new Group(), br = new MeshStandardMaterial({ color: 0xf2f2ee, roughness: .45, metalness: .2 }), az = new MeshStandardMaterial({ color: 0x1c4a9a, roughness: .5 }), vm = new MeshStandardMaterial({ color: 0xc02a24, roughness: .5 }), cz = new MeshStandardMaterial({ color: 0x2a2e33, roughness: .6 }), vd = new MeshStandardMaterial({ color: 0x1b2a38, roughness: .1, metalness: .8 });
  cil(A, br, .62, .62, 3.8, 0, 0, -.7);                                 // fuselagem
  cil(A, br, .62, .5, 1.3, 0, -.02, 1.9); cil(A, br, .5, .25, .35, 0, 0, 2.7);          // capô
  cil(A, br, .62, .13, 2.9, 0, .03, -3.9);                                   // cone de cauda
  caixa(A, vd, 1.28, .34, 1.6, 0, .28, .3);                              // janelas
  [-1, 1].forEach(s => { caixa(A, vd, .02, .32, 1.1, s * .625, .28, .35); caixa(A, az, .04, .1, 6.4, s * .62, .02, -.9); caixa(A, vm, .04, .08, 6.4, s * .62, -.12, -.9); });
  caixa(A, vd, 1.25, .38, .02, 0, .3, 1.1);                              // para-brisa
  caixa(A, br, 10.9, .1, 1.55, 0, .98, .3); caixa(A, az, 10.9, .02, .28, 0, .98, 1.1);           // asa alta
  [-1, 1].forEach(s => { const e = new Mesh(new CylinderGeometry(m(.04), m(.04), m(2.4), 6), br); e.position.set(m(s * 1.8), m(.35), m(.2)); e.rotation.z = -s * .78; A.add(e); });          // montantes
  caixa(A, br, .08, 1.5, 1.4, 0, .75, -3.9); caixa(A, az, .09, 1.3, .35, 0, .8, -3.95);                  // deriva
  caixa(A, br, 3.5, .08, 1.0, 0, .18, -3.9);                                            // estabilizador
  [-1, 1].forEach(s => { caixa(A, cz, .06, .06, .06, s * 1.6, .98, .3); cil(A, cz, .035, .035, 1.2, s * .95, -.62, .35, "y", 6); cil(A, cz, .2, .2, .13, s * .95, -1.15, .35, "x", 10); });   // trem principal
  cil(A, cz, .03, .03, .85, 0, -.55, 1.75, "y", 6); cil(A, cz, .16, .16, .1, 0, -.9, 1.75, "x", 10);   // trem do nariz
  /* hélice (grupo que gira) */
  const H = new Group(); H.position.set(0, 0, m(2.95)); A.add(H);
  const lam = new Mesh(new BoxGeometry(m(.14), m(2.0), m(.03)), cz); H.add(lam); const lam2 = lam.clone(); lam2.rotation.z = Math.PI / 2; H.add(lam2);
  const disco = new Mesh(new CircleGeometry(m(1.0), 24), new MeshBasicMaterial({ color: 0x444a50, transparent: true, opacity: 0, side: DoubleSide, depthWrite: false })); H.add(disco);
  const esp = new Mesh(new ConeGeometry(m(.2), m(.4), 12), vm); esp.rotation.x = Math.PI / 2; esp.position.z = m(.1); H.add(esp);
  /* matrícula (fictícia) nas laterais da cauda e embaixo da asa: planos de 1 face, legíveis dos dois lados do avião */
  const tx = canvasTex(256, 64, (c2, w, h) => { c2.clearRect(0, 0, w, h); c2.fillStyle = "#1c2a5a"; c2.font = "bold 46px Arial"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(matricula, w / 2, h / 2 + 2); }, { hd: 2, aniso: 4 });
  [-1, 1].forEach(s => { const p = new Mesh(new PlaneGeometry(m(1.7), m(.42)), new MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); p.rotation.y = s < 0 ? -Math.PI / 2 : Math.PI / 2; p.position.set(m(s * .46), m(.1), m(-2.9)); A.add(p); });
  /* luzes: vermelha (asa esquerda), verde (direita), branca (cauda) + strobe */
  const L = { e: luz(A, 0xff2a1a, m(.9), m(-5.45), m(.98), m(.3)), d: luz(A, 0x22ff55, m(.9), m(5.45), m(.98), m(.3)), r: luz(A, 0xffffff, m(.9), 0, m(.9), m(-4.9)), s: luz(A, 0xffffff, m(1.8), m(5.4), m(1.05), m(.2)) };
  A.userData = { helice: H, disco, luzes: L, tam: 24, mats: [br, az, vm] };
  A.traverse(o => { if(o.isMesh && o.material.isMeshStandardMaterial) o.castShadow = false; });
  return A;
}

/* ---------------- jato bimotor genérico (LOD baixo: é visto de longe) ---------------- */
export function criaJato(){
  const J = new Group(), br = new MeshStandardMaterial({ color: 0xf4f6f8, roughness: .35, metalness: .3 }), cz = new MeshStandardMaterial({ color: 0x9aa1a8, roughness: .5, metalness: .4 }), az = new MeshStandardMaterial({ color: 0x23456e, roughness: .5 });
  cil(J, br, 2.0, 2.0, 30, 0, 0, 0, "z", 10); cil(J, br, 2.0, .6, 5, 0, .1, 17.5, "z", 10); cil(J, br, 2.0, .35, 9, 0, .35, -19.5, "z", 10); cil(J, az, 2.02, 2.02, 30.2, 0, -.5, 0, "z", 6).scale.y *= .1;
  [-1, 1].forEach(s => { const a = caixa(J, br, 15, .35, 5, s * 8.5, -.6, -1.5); a.rotation.y = -s * .55; cil(J, cz, 1.0, .9, 4.4, s * 7.5, -2.0, 1.4, "z", 8); caixa(J, br, 6, .2, 2.6, s * 3.6, 1.8, -18.5).rotation.y = -s * .5; });
  caixa(J, az, .3, 7.5, 5.5, 0, 5.5, -18.2).rotation.x = .12;
  const L = { e: luz(J, 0xff2a1a, m(7), m(-16.3), m(-.5), m(-8.8)), d: luz(J, 0x22ff55, m(7), m(16.3), m(-.5), m(-8.8)), r: luz(J, 0xffffff, m(6), 0, m(1.5), m(-27)), s1: luz(J, 0xffffff, m(14), m(-16.3), m(-.5), m(-9)), s2: luz(J, 0xffffff, m(14), m(16.3), m(-.5), m(-9)), b: luz(J, 0xff2a1a, m(10), 0, m(2.1), m(2)) };
  J.userData = { luzes: L, mats: [br, cz, az] }; return J;
}

/* ---------------- som ---------------- */
let AC = null;
const contexto = () => { if(AC) return AC; try{ AC = new (window.AudioContext || window.webkitAudioContext)(); const retoma = () => { if(AC && AC.state === "suspended") AC.resume(); }; ["pointerdown", "keydown", "touchstart"].forEach(e => window.addEventListener(e, retoma, { passive: true })); }catch(_){ AC = null; } return AC; };
function criaSom(tipo){
  const ac = contexto(); if(!ac) return null;
  const mestre = ac.createGain(); mestre.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = tipo === "jato" ? 320 : 1100; lp.connect(mestre);
  const seco = ac.createGain(), eco = ac.createGain(), atraso = ac.createDelay(1), fb = ac.createGain(); seco.gain.value = 1; eco.gain.value = 0; atraso.delayTime.value = .34; fb.gain.value = .38;
  mestre.connect(seco); seco.connect(ac.destination); mestre.connect(atraso); atraso.connect(fb); fb.connect(atraso); atraso.connect(eco); eco.connect(ac.destination);
  const oscs = [];
  const osc = (t, f, g) => { const o = ac.createOscillator(); o.type = t; o.frequency.value = f; const gg = ac.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(lp); o.start(); oscs.push([o, f]); return o; };
  if(tipo === "jato"){ osc("sawtooth", 58, .25); osc("triangle", 87, .22); }
  else { osc("sawtooth", 82, .3); osc("square", 164, .12); osc("sawtooth", 41, .22); }
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ru = ac.createBufferSource(); ru.buffer = buf; ru.loop = true; const bp = ac.createBiquadFilter(); bp.type = tipo === "jato" ? "lowpass" : "bandpass"; bp.frequency.value = tipo === "jato" ? 260 : 520; const gr = ac.createGain(); gr.gain.value = tipo === "jato" ? .55 : .1; ru.connect(bp); bp.connect(gr); gr.connect(lp); ru.start();
  return { ac, mestre, eco, oscs, parar(){ try{ oscs.forEach(([o]) => o.stop()); ru.stop(); mestre.disconnect(); }catch(_){ /* já parado */ } } };
}

/* ============================================================================================================ */
export function criarAeronaves(M){
  const { cen, ciclo } = M, g = new Group(); cen.grupo.add(g);
  const voos = [], chao = cen.campo.chao, BORDA = cen.campo.BORDA;
  let relogio = 0;

  const dirMundo = (rumo) => { const r = rumo * Math.PI / 180, th = 1.15; return [Math.cos(r - th), Math.sin(r - th)]; };

  /* ---------- monomotor ---------- */
  function iniciaMonomotor(baixo, info = {}){
    const C = EVENTOS.monomotor, obj = criaMonomotor(C.matricula); g.add(obj);
    const sentido = Math.random() < .5 ? 1 : -1, curva = (Math.random() < .5 ? 1 : -1) * rnd(500, 900), xc = 1150 + rnd(-200, 200), Z = 6800;
    const path = (t) => { const z = sentido * (t * 2 - 1) * Z, s = Math.sin(Math.PI * t); return [xc + curva * s + 120 * (t - .5), z]; };
    const altN = C.altNormal, altL = rnd(C.altBaixa[0], C.altBaixa[1]);
    const alt = (t) => (baixo ? altN - (altN - altL) * sstep(.22, .48, t) * (1 - sstep(.56, .82, t)) : altN) + 8 * Math.sin(t * 9);
    const comp = 2 * Z + Math.abs(curva) * 1.6, dur = comp / (C.velocidade * U);
    const v = { tipo: "monomotor", obj, t: 0, dur, path, alt, baixo, som: criaSom("monomotor"), pos: new Vector3(), vel: new Vector3(), proximo: false, reagiu: false, perturbou: false, yaw: 0, roll: 0, tPerto: 0 };
    voos.push(v); atualizaMonomotor(v, 0); return v;
  }
  function atualizaMonomotor(v, dt){
    v.t += dt / v.dur; const t = Math.min(1, v.t), p = v.path(t), p2 = v.path(Math.min(1, t + .004)), y = chao + m(v.alt(t)), y2 = chao + m(v.alt(Math.min(1, t + .004)));
    const dx = p2[0] - p[0], dz = p2[1] - p[1], dy = y2 - y, yaw = Math.atan2(dx, dz), dyaw = ((yaw - v.yaw + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const novaPos = new Vector3(p[0], y, p[1]); if(dt > 0) v.vel.copy(novaPos).sub(v.pos).divideScalar(dt); v.pos.copy(novaPos);
    const roll = MathUtils.clamp(-dyaw / Math.max(dt, 1e-3) * 2.4, -.5, .5); v.roll += (roll - v.roll) * Math.min(1, dt * 1.5); if(dt === 0) v.roll = 0; v.yaw = yaw;
    v.obj.position.copy(v.pos); v.obj.rotation.set(0, 0, 0); v.obj.rotation.order = "YXZ"; v.obj.rotation.y = yaw; v.obj.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)) * .9; v.obj.rotation.z = v.roll;
    const u = v.obj.userData; u.helice.rotation.z += dt * 95; u.disco.material.opacity = .22;
    /* luzes de navegação e strobe */
    const noite = ciclo.estado.noite, tt = relogio * 1000; Object.values(u.luzes).forEach(s => { s.visible = noite > .2 || s === u.luzes.s; }); u.luzes.s.visible = (tt % 1200) < 90 || (tt % 1200 > 160 && tt % 1200 < 240); u.luzes.s.material.opacity = noite > .15 ? 1 : .35;
    /* luz do dia sobre o avião acompanha o céu (as luzes da cena já iluminam) */
    return t >= 1;
  }

  /* ---------- jato ---------- */
  function iniciaJato(info = {}){
    const C = EVENTOS.jato, obj = criaJato(); g.add(obj);
    const rumo = C.rumos[Math.floor(Math.random() * C.rumos.length)] + rnd(-12, 12), d = dirMundo(rumo), dur = rnd(C.duracaoSeg[0], C.duracaoSeg[1]), vel = C.velocidade * U, comp = vel * dur, alt = C.altitude * U;
    const J = M.jogador(), cx = (J ? J.x : 300) + rnd(-3500, 3500) * d[1], cz = (J ? J.z : 0) - rnd(-3500, 3500) * d[0];
    const pos = (t) => { const s = (t - .5) * comp; return new Vector3(cx + d[0] * s, (J ? J.y : -6) + alt, cz + d[1] * s); };
    const v = { tipo: "jato", obj, t: 0, dur, pos0: pos, yaw: Math.atan2(d[0], d[1]), som: criaSom("jato"), pos: new Vector3(), d, vel: vel, reagiu: false };
    obj.userData.luzes.s1.visible = obj.userData.luzes.s2.visible = false; voos.push(v); return v;
  }
  function atualizaJato(v, dt, camPos, E){
    v.t += dt / v.dur; if(v.t >= 1) return true;
    const real = v.pos0(v.t); v.pos.copy(real);
    /* posiciona a 7000 u da câmera, na mesma direção, com escala que mantém o tamanho angular real (dentro do plano de corte e do céu) */
    const rel = real.clone().sub(camPos), dist = rel.length(), D = 7000, esc = D / dist;
    v.obj.position.copy(camPos).addScaledVector(rel.normalize(), D); v.obj.scale.setScalar(esc); v.obj.rotation.set(0, v.yaw, 0);
    const elev = Math.asin(rel.y); v.obj.visible = elev > .02;
    /* cor: reflete o sol (dourado/rosado) mesmo com o chão em sombra; de noite fica escuro com as luzes */
    const alt = E.alt + 1.7, lit = sstep(-9, -.5, alt), tom = E.hor, dia = sstep(0, 8, E.alt);
    v.obj.userData.mats.forEach((mt, i) => { const base = i === 2 ? [.14, .27, .43] : i === 1 ? [.6, .63, .66] : [.96, .97, .98]; mt.emissive.setRGB(...[0, 1, 2].map(k => (base[k] * (1 - dia) + tom[k] * .55 * (1 - dia)) * lit * .55)); mt.color.setRGB(...base.map((b, k) => b * (dia * 1 + (1 - dia) * (.25 + .75 * lit * (.6 + .4 * tom[k]))))); mt.needsUpdate = false; });
    const noite = E.noite, tt = relogio, u = v.obj.userData.luzes; [u.e, u.d, u.r].forEach(s => { s.visible = noite > .3; });
    u.s1.visible = u.s2.visible = noite > .3 && ((tt * 1000) % 1300) < 80; u.b.visible = noite > .15 && ((tt * 1000) % 1800) < 140;
    return false;
  }

  /* ---------- som: atenuação, Doppler, eco, atraso do jato ---------- */
  function atualizaSom(v, J, camPos){
    if(!v.som || !J) return; const ac = v.som.ac, t = ac.currentTime;
    let fonte = v.pos, atraso = 0;
    if(v.tipo === "jato"){ const d0 = fonte.distanceTo(camPos) / U; atraso = d0 / c / v.dur; fonte = v.pos0(Math.max(0, v.t - atraso)); }
    const rel = fonte.clone().sub(camPos), dm = rel.length() / U;
    let vr = 0; { const vel = v.tipo === "jato" ? v.d.map(x => x * EVENTOS.jato.velocidade) : [v.vel.x / U, v.vel.z / U]; const dirSource = [rel.x / (rel.length() || 1), rel.z / (rel.length() || 1)]; vr = -(vel[0] * dirSource[0] + vel[1] * dirSource[1]) * (v.tipo === "jato" ? 1 : 1); }
    const f = MathUtils.clamp(c / (c - MathUtils.clamp(vr, -c * .8, c * .8)), .6, 1.6);
    v.som.oscs.forEach(([o, f0]) => { o.frequency.setTargetAtTime(f0 * f, t, .08); });
    const C = v.tipo === "jato" ? EVENTOS.jato : EVENTOS.monomotor, ref = v.tipo === "jato" ? 2500 : 120;
    let gain = C.somVolume / (1 + Math.pow(dm / ref, 1.7)); gain *= Math.min(1, v.t * 20) * Math.min(1, (1 - v.t) * 20);
    v.som.mestre.gain.setTargetAtTime(Math.min(.7, gain), t, .12);
    /* eco nos paredões: mais forte quando o avião está dentro do vão, perto e baixo */
    const sobreVao = !cen.campo.emPoli(cen.campo.terraPoli, fonte.x, fonte.z) || fonte.x > BORDA - 60, alto = (fonte.y - chao) / U;
    const eco = v.tipo === "monomotor" && sobreVao ? MathUtils.clamp(.55 - (alto - 120) / 500, 0, .5) * (dm < 1200 ? 1 : .4) : 0; v.som.eco.gain.setTargetAtTime(eco, t, .2);
  }

  /* ---------- reações dos NPCs e da fauna ---------- */
  function reacoes(v, J, dt){
    if(!J) return; const dh = Math.hypot(v.pos.x - J.x, v.pos.z - J.z), altRim = (v.pos.y - chao) / U;
    if(v.tipo === "monomotor"){
      if(!v.reagiu && dh < 2000 && M.gente){ v.reagiu = true; M.gente.reageCeu(v.baixo ? "monomotorBaixo" : "monomotor", { dur: 14 }); }
      if(v.baixo && altRim < 230 && dh < EVENTOS.monomotor.raioFaunaBaixo * U){ v.tPerto += dt; if(v.tPerto > .4){ M.fauna.perturbaTodos(dh < 250 * U ? 2 : 1); } }
    } else if(!v.reagiu && Math.random() < dt * .3 && v.t > .25 && M.gente){ v.reagiu = true; if(Math.random() < .6) M.gente.reageCeu("aviao", { dur: 9 }); }
  }

  function tick(dt, J, E){
    relogio += dt;
    const camPos = M.cam.getWorldPosition(new Vector3());
    for(let i = voos.length - 1; i >= 0; i--){
      const v = voos[i]; let fim = false;
      if(v.tipo === "monomotor"){ fim = atualizaMonomotor(v, dt); } else fim = atualizaJato(v, dt, camPos, E);
      atualizaSom(v, J, camPos); reacoes(v, J, dt);
      if(fim){ v.obj.parent && v.obj.parent.remove(v.obj); v.som && v.som.parar(); voos.splice(i, 1); }
    }
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const limpa = () => { voos.forEach(v => { v.obj.parent && v.obj.parent.remove(v.obj); v.som && v.som.parar(); }); voos.length = 0; };
  return { tick, iniciaMonomotor, iniciaJato, voos, limpa, info: () => (voos.length ? "Aeronave: " + voos.map(v => v.tipo + (v.baixo ? " (baixo)" : "") + " " + (v.t * 100).toFixed(0) + "%").join(", ") : "") };
}
