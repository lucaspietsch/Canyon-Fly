import { Vector4 } from "three";
import { VENTO } from "./config.js";

/* ============================================================================================================
   SISTEMA DE VENTO GLOBAL
   Um único estado (direção, intensidade, tempo) vira um único uniform: `M.vento.U.uVento = (dirX, dirZ, intensidade, tempo)`. Nada é calculado por objeto na CPU:
   os shaders de capim, samambaias, copas, juncos e névoa leem esse uniform e deslocam o ruído no tempo (ondas que percorrem o campo na direção do vento).
   Estados: brisa → (sobe) → vento → (desce) → brisa, com rajadas curtas dentro do vento. A direção deriva devagar (mais a tarde).
   Som: brisa constante + vento que cresce com a intensidade, assobio leve perto da borda do cânion, farfalhar perto das árvores (WebAudio, sintetizado).
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => Math.max(a, Math.min(b, v));

export function criarVento(M){
  const U = { uVento: { value: new Vector4(.8, .6, VENTO.brisa, 0) }, uVentoMata: { value: .4 } };      // uVentoMata: fator de abrigo (usado por quem estiver na mata)
  const S = { estado: "brisa", t: 0, prox: rnd(VENTO.periodoSeg[0] * .3, VENTO.periodoSeg[1]), alvo: VENTO.brisa, atual: VENTO.brisa, dur: 0, rajada: 0, rajT: 0, dir: Math.random() * 6.28, forcado: null, tempo: 0, subida: 12 };
  /* som */
  let ac = null, g1 = null, g2 = null, f2 = null, g3 = null, fonte = null;
  function audio(){ if(ac !== null) return ac; try{ ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let l = 0; for(let i = 0; i < n; i++){ l = l * .96 + (Math.random() * 2 - 1) * .1; d[i] = l; }
      fonte = ac.createBufferSource(); fonte.buffer = buf; fonte.loop = true; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; g1 = ac.createGain(); g1.gain.value = 0; fonte.connect(lp); lp.connect(g1); g1.connect(ac.destination);
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 9; f2 = bp; g2 = ac.createGain(); g2.gain.value = 0; fonte.connect(bp); bp.connect(g2); g2.connect(ac.destination);        // assobio da borda
      const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2200; g3 = ac.createGain(); g3.gain.value = 0; fonte.connect(hp); hp.connect(g3); g3.connect(ac.destination);                                  // farfalhar das folhas
      fonte.start(); }catch(_){ ac = false; } return ac; }
  const sorteiaPeriodo = () => rnd(VENTO.periodoSeg[0], VENTO.periodoSeg[1]);
  function forca(modo){                                                           // depuração: "brisa" | "vento" | "rajada"
    S.forcado = modo; if(modo === "brisa"){ S.estado = "brisa"; S.alvo = VENTO.brisa; S.rajada = 0; S.prox = sorteiaPeriodo(); S.t = 0; S.subida = 3; }
    else if(modo === "vento"){ S.estado = "vento"; S.alvo = VENTO.maximo; S.dur = rnd(VENTO.duracaoSeg[0], VENTO.duracaoSeg[1]); S.t = 0; S.subida = 4; }
    else if(modo === "rajada"){ if(S.estado !== "vento"){ S.estado = "vento"; S.alvo = VENTO.maximo; S.dur = 40; S.t = 0; S.subida = 3; } S.rajada = 1; S.rajT = rnd(VENTO.rajadaSeg[0], VENTO.rajadaSeg[1]); }
    return modo;
  }
  function tick(dt, J, E){
    S.tempo += dt; S.t += dt; const h = E ? E.h : 12;
    if(S.estado === "brisa"){ S.prox -= dt; if(S.prox <= 0){ S.estado = "vento"; S.alvo = VENTO.maximo * rnd(.75, 1); S.dur = rnd(VENTO.duracaoSeg[0], VENTO.duracaoSeg[1]); S.t = 0; S.subida = rnd(VENTO.subidaSeg[0], VENTO.subidaSeg[1]); M.gente && M.gente.reageVento && M.gente.reageVento(); } }
    else { if(S.t > S.dur){ S.estado = "brisa"; S.alvo = VENTO.brisa; S.prox = sorteiaPeriodo(); S.t = 0; S.subida = rnd(VENTO.subidaSeg[0], VENTO.subidaSeg[1]); S.rajada = 0; }
      else if(S.rajada <= 0 && Math.random() < VENTO.rajadaChance * dt){ S.rajada = 1; S.rajT = rnd(VENTO.rajadaSeg[0], VENTO.rajadaSeg[1]); } }
    if(S.rajada > 0){ S.rajT -= dt; if(S.rajT <= 0) S.rajada = 0; }
    /* tendência: mais vento à tarde; a direção deriva devagar (e um pouco mais à tarde) */
    const tarde = Math.exp(-Math.pow((h - 15.5) / 3, 2)) * VENTO.tardeMais; S.dir += (VENTO.deriva * (.5 + .5 * Math.sin(S.tempo * .013)) + .004 * Math.sin(S.tempo * .031)) * dt;
    const alvoI = cl(S.alvo + tarde + (S.rajada > 0 ? (VENTO.rajadaMax - S.alvo) * .8 * Math.sin(Math.PI * cl(1 - S.rajT / Math.max(.1, VENTO.rajadaSeg[1]), 0, 1)) : 0), 0, 1.1);
    const tx = S.rajada > 0 ? 1.4 : 1 / Math.max(2, S.subida); S.atual += (alvoI - S.atual) * Math.min(1, dt * tx);
    /* abrigo: borda do cânion mais ventosa; mata abriga */
    let local = S.atual; if(J && M.fauna && M.fauna.zonas){ const d = M.fauna.zonas.distBorda ? M.fauna.zonas.distBorda(J.x, J.z) : 999; local += VENTO.bordaMais * Math.exp(-d / 140); }
    const mata = J && M.vegetacao ? M.vegetacao.fatorMata(J.x, J.z) : 0; U.uVentoMata.value = 1 - VENTO.mataMenos * mata; local *= 1 - VENTO.mataMenos * mata * .6;
    U.uVento.value.set(Math.cos(S.dir), Math.sin(S.dir), cl(S.atual, 0, 1.1), S.tempo);
    S.local = local; S.mata = mata;
    /* som */
    if(J && audio()){ const t = ac.currentTime, gb = .035 + .26 * local * local; g1.gain.setTargetAtTime(gb, t, .25); const d = M.fauna.zonas.distBorda(J.x, J.z) / 2.94; g2.gain.setTargetAtTime(local > .3 ? .05 * Math.max(0, 1 - d / 22) * (local - .2) : 0, t, .3); f2.frequency.setTargetAtTime(1300 + 520 * Math.sin(S.tempo * .6) + 700 * local, t, .2); g3.gain.setTargetAtTime(mata * local * .09, t, .3); }
  }
  /* vetor de vento (x,z) em u/s aproximado, para poeira e partículas */
  const vec = (k = 1) => [U.uVento.value.x * U.uVento.value.z * 6 * k, U.uVento.value.y * U.uVento.value.z * 6 * k];
  const parar = () => { try{ if(fonte) fonte.stop(); }catch(_){ /* */ } ac = null; fonte = null; };
  return { U, S, tick, forca, vec, parar, get intensidade(){ return S.atual; }, get dir(){ return S.dir; }, get estado(){ return S.estado + (S.rajada > 0 ? "+rajada" : ""); }, info: () => "Vento: " + S.estado + (S.rajada > 0 ? "+rajada" : "") + " " + S.atual.toFixed(2) + " · dir " + ((S.dir * 57.3 % 360 + 360) % 360).toFixed(0) + "°" };
}

/* injeta o vento num material (vertex shader): `snippet` recebe `float vwind` (força local) e `vec2 wdir`; helper `ondaVento(xz, k)` devolve deslocamento (-1…1) já em ondas que andam na direção do vento */
export const GLSL_VENTO = `
uniform vec4 uVento; uniform float uVentoMata;
float ondaVento(vec2 xz, float k){
  vec2 d = normalize(uVento.xy + 1e-4); float v = uVento.z, t = uVento.w;
  float fase = dot(xz, d) * (0.011 + 0.01 * v) - t * (0.9 + 2.6 * v) + dot(xz, vec2(-d.y, d.x)) * 0.004;
  float a = sin(fase) * 0.6 + sin(fase * 2.17 + 1.3) * 0.28 + sin(fase * 0.43 + dot(xz, vec2(0.002, 0.003)) * 7.0) * 0.45;
  return a * (0.22 + 0.9 * v) * k;
}`;
