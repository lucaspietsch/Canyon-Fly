import { Group, Mesh, Sprite, SpriteMaterial, CanvasTexture, SRGBColorSpace, PlaneGeometry, MeshBasicMaterial, RingGeometry, AdditiveBlending, DoubleSide, Vector3, Color, CircleGeometry } from "three";
import { U, qualidade } from "./config.js";

/* ============================================================================================================
   CASCATA GRAVATÁ DO NOIVO — o que acontece em volta da água que cai
   • mais água: véus lado a lado (cenario.js), com shader de fios de velocidades diferentes, fios soltos nas bordas e leve balanço com o vento global;
   • borrifo e vapor: pool de partículas macias (sprites sem borda dura) que nascem nos ressaltos e na base, sobem, se espalham pelo paredão e se dissolvem; quantidade por qualidade
     (90/220/420) e por distância (LOD: nada além de ~3000 u);
   • poço de queda com espuma branca, ondas e turbulência (textura animada);
   • arco-íris sutil na névoa quando o sol está no ângulo certo (CASCATA.arcoIris);
   • som: queda forte que cresce com a proximidade, com eco no cânion.
   ============================================================================================================ */

export const CASCATA = { arcoIris: true, volumeSom: .55, alcanceSom: 2600, vaporAlpha: .16 };
const rnd = (a, b) => a + Math.random() * (b - a);

export function criarCascata(M, vento){
  const { cen } = M, C = cen.cascata, Q = qualidade(), grupo = new Group(); cen.grupo.add(grupo);
  const NP = Q.particulasCascata, S = { t: 0, emit: 0, d: 1e9, arco: 0 };
  /* sprite macio */
  const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 31); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const P = []; for(let i = 0; i < NP; i++){ const m = new SpriteMaterial({ map: tex, color: 0xf2f8fb, transparent: true, depthWrite: false, opacity: 0, fog: true }), s = new Sprite(m); s.visible = false; s.renderOrder = 7; grupo.add(s); P.push({ s, t: 9, dur: 1, vx: 0, vy: 0, vz: 0, e0: 1, e1: 2, a: .2 }); }
  let pk = 0;
  const emite = (x, y, z, tipo) => { const p = P[pk++ % P.length]; p.t = 0;
    if(tipo === "vapor"){ p.dur = rnd(5, 9); p.vx = rnd(1, 7); p.vy = rnd(3, 9); p.vz = rnd(-6, 6); p.e0 = rnd(18, 34); p.e1 = rnd(70, 130); p.a = CASCATA.vaporAlpha * rnd(.6, 1); }
    else { p.dur = rnd(1.2, 2.8); p.vx = rnd(3, 16); p.vy = rnd(4, 20); p.vz = rnd(-9, 9); p.e0 = rnd(2, 5); p.e1 = rnd(9, 22); p.a = rnd(.25, .5); }
    p.s.position.set(x, y, z); p.s.visible = true; };
  /* espuma do poço: duas camadas de textura girando em sentidos opostos + ondas em anel */
  const foamTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"); x.clearRect(0, 0, 256, 256); const g = x.createRadialGradient(128, 128, 20, 128, 128, 126); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.6, "rgba(235,245,250,.7)"); g.addColorStop(1, "rgba(235,245,250,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for(let i = 0; i < 520; i++){ const a = Math.random() * 6.283, r = Math.pow(Math.random(), .7) * 120; x.fillStyle = "rgba(255,255,255," + (.2 + Math.random() * .5) + ")"; x.beginPath(); x.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2 + Math.random() * 9, 0, 7); x.fill(); } for(let i = 0; i < 180; i++){ const a = Math.random() * 6.283, r = Math.pow(Math.random(), .7) * 120; x.fillStyle = "rgba(120,160,185,.18)"; x.beginPath(); x.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3 + Math.random() * 7, 0, 7); x.fill(); } const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const qB = C.quedas[2], yB = C.yBase + .6, xB = qB.x + 16, zB = C.z, espumas = [];
  [[46, 1], [30, -1]].forEach(([r, sg], i) => { const m = new Mesh(new CircleGeometry(r, 36), new MeshBasicMaterial({ map: foamTex, transparent: true, depthWrite: false, opacity: .85 - i * .15, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); m.rotation.x = -Math.PI / 2; m.position.set(xB, yB + i * .15, zB); m.renderOrder = 5; grupo.add(m); espumas.push({ m, sg }); });
  const ondas = []; for(let i = 0; i < 4; i++){ const m = new Mesh(new RingGeometry(.9, 1, 48), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(xB, yB + .3, zB); grupo.add(m); ondas.push(m); }
  /* arco-íris: faixa em arco (aditiva) dentro do vapor, do lado oposto ao sol */
  const arcoTex = (() => { const c = document.createElement("canvas"); c.width = 8; c.height = 128; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 128); [[0, "rgba(255,60,60,.0)"], [.12, "rgba(255,70,60,.55)"], [.3, "rgba(255,200,60,.55)"], [.5, "rgba(80,220,100,.5)"], [.72, "rgba(70,140,255,.55)"], [.9, "rgba(150,80,220,.45)"], [1, "rgba(150,80,220,0)"]].forEach(([k, col]) => g.addColorStop(k, col)); x.fillStyle = g; x.fillRect(0, 0, 8, 128); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const arco = new Mesh(new RingGeometry(60, 74, 64, 1, 0, Math.PI), new MeshBasicMaterial({ map: arcoTex, transparent: true, depthWrite: false, opacity: 0, blending: AdditiveBlending, side: DoubleSide, fog: false })); (() => { const g = arco.geometry, p = g.attributes.position, uv = g.attributes.uv; for(let i = 0; i < p.count; i++){ const r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, 0, (r - 60) / 14); } })(); arco.renderOrder = 8; grupo.add(arco);
  /* som: ruído filtrado + eco (delay realimentado) */
  let ac = null, ganho = null, eco = null;
  function audio(){ if(ac !== null) return ac; try{ ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let l = 0; for(let i = 0; i < n; i++){ l = l * .985 + (Math.random() * 2 - 1) * .09; d[i] = l + (Math.random() * 2 - 1) * .05; }
      const fonte = ac.createBufferSource(); fonte.buffer = buf; fonte.loop = true; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1200; const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 90; ganho = ac.createGain(); ganho.gain.value = 0;
      const dl = ac.createDelay(1); dl.delayTime.value = .34; const fb = ac.createGain(); fb.gain.value = .38; const lpd = ac.createBiquadFilter(); lpd.type = "lowpass"; lpd.frequency.value = 700; eco = ac.createGain(); eco.gain.value = 0;
      fonte.connect(hp); hp.connect(lp); lp.connect(ganho); ganho.connect(ac.destination); ganho.connect(dl); dl.connect(lpd); lpd.connect(fb); fb.connect(dl); lpd.connect(eco); eco.connect(ac.destination); fonte.start(); }catch(_){ ac = false; } return ac; }
  function tick(dt, J, E){
    S.t += dt; const cam = M.cam.position, dx = cam.x - C.x, dz = cam.z - C.z, d = Math.hypot(dx, dz, Math.max(0, cam.y - C.yBase) * .3); S.d = d;
    /* uniformes dos véus */
    C.quedaMeshes.forEach(w => { const u = w.material.uniforms; u.uVento.value = vento.U.uVento.value; });
    /* partículas */
    const lod = Math.max(0, Math.min(1, 1 - (d - 500) / 2500)); const alvoEmit = lod * NP * .35;
    S.emit += dt * alvoEmit; while(S.emit >= 1){ S.emit -= 1; const r = Math.random();
      if(r < .45){ const q = C.quedas[Math.floor(Math.random() * 3)], dz2 = rnd(-16, 16); emite(q.x + 3, q.y1 + rnd(0, 6), C.z + dz2, "gota"); }
      else if(r < .72){ const q = C.quedas[Math.floor(Math.random() * 3)], h = q.y0 + (q.y1 - q.y0) * Math.random(); emite(q.x + 2.5, h, C.z + rnd(-14, 14), "gota"); }
      else emite(xB + rnd(-14, 6), yB + rnd(1, 6), zB + rnd(-26, 26), "vapor"); }
    const w = vento.vec(.5);
    P.forEach(p => { if(!p.s.visible) return; p.t += dt; const u = p.t / p.dur; if(u >= 1){ p.s.visible = false; return; } p.vx += w[0] * dt * .6; p.vz += w[1] * dt * .6; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vy *= 1 - dt * .28; const e = p.e0 + (p.e1 - p.e0) * Math.pow(u, .6); p.s.scale.set(e, e, 1); p.s.material.opacity = p.a * Math.min(1, u * 6) * (1 - u); });
    /* espuma e ondas */
    espumas.forEach(({ m, sg }, i) => { m.rotation.z += sg * dt * (.35 + i * .2); const k = 1 + Math.sin(S.t * 2.1 + i) * .04; m.scale.set(k, k, 1); m.visible = lod > 0.02; });
    ondas.forEach((m, i) => { const t = (S.t * .5 + i / 4) % 1; m.scale.setScalar(8 + t * 58); m.material.opacity = (1 - t) * .5 * (t < .08 ? t / .08 : 1) * (lod > .02 ? 1 : 0); });
    /* arco-íris: sol 5°–40° de altura, câmera do lado oposto ao sol, perto da queda */
    let alvoA = 0; if(CASCATA.arcoIris && E && E.alt > 5 && E.alt < 40 && d < 2600){ const sd = E.sunDir; const vx = xB - cam.x, vz = zB - cam.z, l = Math.hypot(vx, vz) || 1, dir = (vx * -sd.x + vz * -sd.z) / l / Math.max(.01, Math.hypot(sd.x, sd.z)); alvoA = Math.max(0, dir) * Math.min(1, (2600 - d) / 1200) * Math.min(1, (E.alt - 5) / 8) * Math.min(1, (40 - E.alt) / 8) * (1 - Math.min(1, (M.nevoa.estado.n || 0) * .4)); }
    S.arco += (alvoA - S.arco) * Math.min(1, dt * .6); arco.material.opacity = S.arco * .38; arco.visible = S.arco > .01;
    if(arco.visible){ const sd = E.sunDir, ax = -sd.x, az = -sd.z, l = Math.hypot(ax, az) || 1; arco.position.set(xB + ax / l * 30, yB + 40, zB + az / l * 30); arco.lookAt(cam.x, arco.position.y, cam.z); arco.scale.setScalar(1.4); }
    /* som */
    if(audio()){ const t = ac.currentTime, alc = CASCATA.alcanceSom * 1.0, v = Math.pow(Math.max(0, 1 - d / alc), 1.6); ganho.gain.setTargetAtTime(CASCATA.volumeSom * v * .55, t, .3); eco.gain.setTargetAtTime(CASCATA.volumeSom * Math.pow(Math.max(0, 1 - d / (alc * 1.2)), 2.2) * .3, t, .4); }
  }
  return { tick, S, info: () => "Cascata: " + Math.round(S.d / U) + " m · arco-íris " + S.arco.toFixed(2), desliga(){ try{ if(ac) ac.close(); }catch(_){ /* */ } ac = null; } };
}
