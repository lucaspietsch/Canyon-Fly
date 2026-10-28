import { Group, Mesh, SphereGeometry, CylinderGeometry, MeshStandardMaterial, MeshBasicMaterial, PointLight, AdditiveBlending, Color } from "three";
import { U } from "../config.js";

/* ============================================================================================================
   CRIATURAS DAS LENDAS DA MATA (aparência provisória, até chegarem as referências do usuário):
   • O GRITADOR — vulto alto e escuro, braços longos, boca branca escancarada. Aproxima-se devagar; NUNCA responda ao grito. Inimigo: o raio de Tupã e as flechas o ferem.
   • O BOITATÁ — serpente de fogo que guarda a mata: corpo de brasas, dois olhos enormes. Guardião (não é inimigo): quem o ataca é punido.
   Ambos se registram em M.poderes como alvos. Ajustes: GRITADOR e BOITATA abaixo.
   ============================================================================================================ */
export const GRITADOR = { hp: 3, velMS: 1.1, velCorridaMS: 7, distGritoM: 14, alturaM: 3.1 };
export const BOITATA = { segmentos: 22, espacoM: .75, velMS: 6, raioM: .42, alturaM: 1.5, cor: 0xff6a1a };
const rnd = Math.random;

/** Som espacial do grito (síntese Web Audio, sem arquivo): sai mais pelo lado em que o Gritador está. */
export function gritoSom(pan = 0, intens = 1){
  try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; const c = gritoSom.ctx || (gritoSom.ctx = new AC()); if(c.state === "suspended") c.resume();
    const t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = "sawtooth"; o2.type = "square"; o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(1150, t + .7); o.frequency.exponentialRampToValueAtTime(420, t + 1.9); o2.frequency.setValueAtTime(190, t); o2.frequency.exponentialRampToValueAtTime(575, t + .7); o2.frequency.exponentialRampToValueAtTime(210, t + 1.9);
    f.type = "bandpass"; f.frequency.value = 1100; f.Q.value = .8; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16 * intens, t + .15); g.gain.exponentialRampToValueAtTime(.0008, t + 2.1);
    o.connect(f); o2.connect(f); f.connect(g); if(p){ p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(c.destination); } else g.connect(c.destination); o.start(t); o2.start(t); o.stop(t + 2.2); o2.stop(t + 2.2); }catch(_){ /* sem áudio */ }
}

export function criaGritador(M){
  const C = GRITADOR, g = new Group(), preto = new MeshStandardMaterial({ color: 0x050507, roughness: 1 }), branco = new MeshBasicMaterial({ color: 0xf2f4ff });
  const e = (m, rx, ry, rz, x, y, z) => { const o = new Mesh(new SphereGeometry(1, 14, 10), m); o.scale.set(rx, ry, rz); o.position.set(x, y, z); g.add(o); return o; };
  e(preto, .42, 1.25, .3, 0, 1.9, 0); const cab = e(preto, .3, .42, .3, 0, 3.15, .05);
  const boca = e(branco, .13, .22, .06, 0, 3.0, .31); for(const sx of [-1, 1]){ const o = e(branco, .04, .06, .03, sx * .12, 3.28, .3); o.userData.olho = 1; }
  const bracos = [-1, 1].map(sx => { const a = new Group(); a.position.set(sx * .42, 2.9, 0); g.add(a); const o = new Mesh(new CylinderGeometry(.06, .05, 2.5, 6), preto); o.position.y = -1.25; a.add(o); const mao = new Mesh(new SphereGeometry(.12, 8, 6), preto); mao.scale.set(1, 1.8, .5); mao.position.y = -2.55; a.add(mao); return a; });
  for(const sx of [-1, 1]){ const p = new Mesh(new CylinderGeometry(.09, .07, 1.7, 6), preto); p.position.set(sx * .17, .85, 0); g.add(p); }
  const luz = new PointLight(0xaabbff, .5, 9 * U); luz.position.set(0, 3, .6); g.add(luz);
  g.scale.setScalar(U); g.visible = false;
  const a = { id: "gritador", tipo: "inimigo", nome: "o Gritador", raioM: 1.1, alturaM: 1.6, hp: C.hp, g, x: 0, z: 0, estado: "parado", t: 0, vel: C.velMS, encantado: 0, mortoCb: null,
    pos: () => g.position,
    dano(q){ if(a.morto) return; a.hp -= q; luz.intensity = 3; a.estado = "ferido"; a.t = 0; if(a.hp <= 0){ a.morto = true; a.t = 0; if(M.terminal) M.terminal.msg("sobrenatural", "O Gritador se desfaz num último grito, que o vento leva embora."); gritoSom(0, .7); if(a.mortoCb) a.mortoCb(); } },
    aoRaio(d){ a.dano(2); }, aoFlecha(d){ a.dano(1); }, aoOlhos(d){ a.encantado = d.duracaoS; if(M.terminal) M.terminal.msg("sobrenatural", "O Gritador congela, preso ao olhar de Atiara."); }, aoLabia(){ return false; },
    coloca(x, z){ g.position.set(x, M.cen.chao(x, z, 1e9), z); g.visible = true; },
    tick(dt, J){
      a.t += dt; if(luz.intensity > .5) luz.intensity -= dt * 4; if(!g.visible || !J || a.morto) return; const p = g.position;
      bracos.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * (.12 + Math.sin(a.t * 2.2 + i) * .1); }); g.children.forEach(o => { if(o.userData.olho) o.scale.y = .06 + Math.abs(Math.sin(a.t * 3)) * .05; }); boca.scale.y = .2 + Math.abs(Math.sin(a.t * 1.7)) * .12;
      const dx = J.x - p.x, dz = J.z - p.z, d = Math.hypot(dx, dz); g.rotation.y = Math.atan2(dx, dz);
      if(a.estado === "aproxima" && a.encantado <= 0 && d > 3 * U){ const v = a.vel * U * dt; p.x += dx / d * v; p.z += dz / d * v; p.y = M.cen.chao(p.x, p.z, 1e9) + Math.sin(a.t * 14) * .05 * U; if(rnd() < dt * .8){ p.x += (rnd() - .5) * 1.2 * U; p.z += (rnd() - .5) * 1.2 * U; } }
      if(a.encantado > 0){ a.encantado -= dt; g.rotation.z = Math.sin(a.t * 30) * .02; } else g.rotation.z = 0;
    },
    some(){ g.visible = false; if(g.parent) g.parent.remove(g); M.poderes.remove(a); }
  };
  M.cen.grupo.add(g); M.poderes.registra(a); return a;
}

export function criaBoitata(M){
  const C = BOITATA, g = new Group(), seg = [], corpo = new MeshBasicMaterial({ color: C.cor }), halo = (r) => new MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: .22, blending: AdditiveBlending, depthWrite: false });
  for(let i = 0; i < C.segmentos; i++){ const k = 1 - i / C.segmentos, r = C.raioM * (i === 0 ? 1.35 : .45 + .55 * Math.pow(k, .6)) * U, m = new Mesh(new SphereGeometry(r, 12, 8), new MeshBasicMaterial({ color: i === 0 ? 0xffd25a : new Color(C.cor).lerp(new Color(0xb01c0a), i / C.segmentos) })); const h = new Mesh(new SphereGeometry(r * 2.1, 10, 6), halo()); m.add(h); g.add(m); seg.push(m); }
  const cabeca = seg[0], olhoM = new MeshBasicMaterial({ color: 0xffffff });
  for(const sx of [-1, 1]){ const o = new Mesh(new SphereGeometry(.14 * U, 8, 6), olhoM); o.position.set(sx * .28 * U, .2 * U, .42 * U); cabeca.add(o); const pu = new Mesh(new SphereGeometry(.07 * U, 6, 4), new MeshBasicMaterial({ color: 0x220800 })); pu.position.set(0, 0, .1 * U); o.add(pu); }
  const luz = new PointLight(0xff7a2a, 2.2, 26 * U); cabeca.add(luz);
  const a = { id: "boitata", tipo: "guardiao", nome: "o Boitatá", raioM: 1.6, alturaM: 1.2, g, hp: 99, alvoXZ: null, t: 0, ponto: 0, rota: [], encantado: 0, brava: false, pos: () => cabeca.position,
    aoRaio(){ a.fere(); }, aoFlecha(){ a.fere(); }, aoOlhos(){ if(M.terminal) M.terminal.msg("sobrenatural", "O Boitatá encara de volta. Seus olhos enormes não piscam."); }, aoLabia(){ if(M.terminal) M.terminal.msg("sobrenatural", "O Boitatá escuta. Não responde com palavras: o fogo se acalma um pouco."); return true; },
    fere(){ if(a.feriu) return; a.feriu = true; if(M.terminal) M.terminal.msg("emergencia", "Você feriu o guardião da mata! O fogo do Boitatá se enfurece."); if(a.aoFerido) a.aoFerido(); },
    coloca(x, z){ for(let i = 0; i < seg.length; i++) seg[i].position.set(x - i * C.espacoM * U, M.cen.chao(x, z, 1e9) + 1.2 * U, z); g.visible = true; },
    vaiPara(x, z){ a.alvoXZ = { x, z }; },
    tick(dt, J){
      a.t += dt; if(!g.visible) return; const h = seg[0].position;
      if(a.alvoXZ){ const dx = a.alvoXZ.x - h.x, dz = a.alvoXZ.z - h.z, d = Math.hypot(dx, dz); if(d > .5 * U){ const v = Math.min(d, C.velMS * U * dt * (a.brava ? 2 : 1)); h.x += dx / d * v; h.z += dz / d * v; } }
      h.y = M.cen.chao(h.x, h.z, 1e9) + (1.4 + Math.sin(a.t * 2.4) * .35) * U;
      for(let i = 1; i < seg.length; i++){ const p = seg[i - 1].position, q = seg[i].position, dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, d = Math.hypot(dx, dy, dz) || 1, esp = C.espacoM * U * (1 - i / seg.length * .35); q.x = p.x + dx / d * esp; q.z = p.z + dz / d * esp; q.y = p.y + dy / d * esp; q.y = Math.max(q.y, M.cen.chao(q.x, q.z, 1e9) + .4 * U) + Math.sin(a.t * 5 - i * .6) * .02 * U; }
      seg.forEach((m, i) => { const s = 1 + Math.sin(a.t * 9 + i) * .08; m.scale.setScalar(s); }); luz.intensity = 1.8 + Math.sin(a.t * 7) * .4;
      const dir = seg[0].position.clone().sub(seg[1].position); cabeca.rotation.y = Math.atan2(dir.x, dir.z);
    },
    some(){ g.visible = false; if(g.parent) g.parent.remove(g); M.poderes.remove(a); }
  };
  g.visible = false; M.cen.grupo.add(g); M.poderes.registra(a); return a;
}
