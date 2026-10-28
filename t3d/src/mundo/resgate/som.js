/* ============================================================================================================
   SONS DO RESGATE (WebAudio, tudo sintetizado): motor do quadriciclo (varia com velocidade e aceleração), sirene da ambulância (ulular lento), buzina curta de aviso, rádio (estática curta).
   Cada fonte tem volume por distância à câmera. Sem áudio disponível, tudo vira no-op.
   ============================================================================================================ */

let ac = null;
const ctx = () => { try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === "suspended") ac.resume(); return ac; }catch(_){ return null; } };
const atenua = (d, ref = 30) => 1 / (1 + (d / ref) * (d / ref) * .6);

export function criarMotor({ tipo = "quad", vol = .5 } = {}){
  const a = ctx(); if(!a) return { set(){}, para(){} };
  const o1 = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(), g2 = a.createGain(); o1.type = "sawtooth"; o2.type = "square"; f.type = "lowpass"; f.frequency.value = 600; g.gain.value = 0;
  g2.gain.value = .35; o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(a.destination); o1.start(); o2.start();
  /* ruído de escapamento */
  const buf = a.createBuffer(1, a.sampleRate * 1, a.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const nz = a.createBufferSource(); nz.buffer = buf; nz.loop = true; const nf = a.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 220; const ng = a.createGain(); ng.gain.value = 0; nz.connect(nf); nf.connect(ng); ng.connect(g); nz.start();
  let vivo = true;
  return {
    /* v: 0–1 velocidade relativa · acel: 0–1 aceleração · dist: m até a câmera */
    set(v, acel, dist, ligado = true){ if(!vivo) return; const t = a.currentTime, base = tipo === "quad" ? 42 : 55, fr = base + v * 70 + acel * 22, gv = ligado ? vol * atenua(dist) * (.25 + .5 * v + .3 * acel) : 0;
      o1.frequency.setTargetAtTime(fr, t, .08); o2.frequency.setTargetAtTime(fr * .5, t, .08); f.frequency.setTargetAtTime(380 + v * 700 + acel * 500 - Math.min(dist, 200) * 2, t, .1); g.gain.setTargetAtTime(Math.max(0, gv) * .16, t, .12); ng.gain.setTargetAtTime(gv * .8, t, .12); },
    para(){ vivo = false; try{ const t = a.currentTime; g.gain.setTargetAtTime(0, t, .05); setTimeout(() => { try{ o1.stop(); o2.stop(); nz.stop(); }catch(_){} }, 400); }catch(_){} }
  };
}

export function criarSirene({ vol = .5 } = {}){
  const a = ctx(); if(!a) return { set(){}, para(){} };
  const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain(); o.type = "triangle"; o.frequency.value = 900; f.type = "lowpass"; f.frequency.value = 3200; g.gain.value = 0;
  lfo.type = "sawtooth"; lfo.frequency.value = .42; lg.gain.value = 380; lfo.connect(lg); lg.connect(o.frequency); o.connect(f); f.connect(g); g.connect(a.destination); o.start(); lfo.start();
  let vivo = true;
  return { set(dist, ligada = true){ if(!vivo) return; const t = a.currentTime; g.gain.setTargetAtTime(ligada ? vol * atenua(dist, 70) * .1 : 0, t, .15); f.frequency.setTargetAtTime(Math.max(900, 3600 - dist * 6), t, .2); },
    para(){ vivo = false; try{ g.gain.setTargetAtTime(0, a.currentTime, .05); setTimeout(() => { try{ o.stop(); lfo.stop(); }catch(_){} }, 400); }catch(_){} } };
}

export function buzina(dist = 5, vol = .4){
  const a = ctx(); if(!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = "square"; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(520, t + .12); g.gain.setValueAtTime(vol * atenua(dist, 25) * .08, t); g.gain.exponentialRampToValueAtTime(.0005, t + .34); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .36);
}
export function radio(dist = 5, vol = .3){
  const a = ctx(); if(!a) return; const t = a.currentTime, n = Math.floor(a.sampleRate * .22), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (i < n * .6 ? 1 : (1 - i / n) * 2) * .5;
  const s = a.createBufferSource(); s.buffer = buf; const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 1.2; const g = a.createGain(); g.gain.value = vol * atenua(dist, 14) * .25; s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
}
