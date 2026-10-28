import { Sprite, SpriteMaterial, CanvasTexture, SRGBColorSpace, Mesh, PlaneGeometry, MeshBasicMaterial } from "three";
import { U, QUADRICICLO } from "../config.js";
import { criarQuadriciclo } from "./quadriciclo.js";
import { criarAmbulancia } from "./ambulancia.js";
import { criarMotor, criarSirene } from "./som.js";

/* ============================================================================================================
   VEÍCULOS DINÂMICOS: quadriciclo e ambulância
   • Chassi sobre o terreno: a altura sob as 4 rodas dá altura, arfagem e rolagem; uma mola amortecida faz a suspensão reagir a degraus e inclinações.
   • Rodas giram com a distância andada (raio real); as dianteiras esterçam; no quadriciclo o guidão acompanha.
   • Quadriciclo: poeira nas partes de terra, rastro de pneus no campo (some com o tempo), motor (WebAudio), faróis e giroflex, colisor móvel.
   • Ambulância: portas traseiras, barra de luz alternada, sirene (ulular), faróis/lanternas.
   ============================================================================================================ */

const ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

class Mola {
  constructor(){ this.x = [0, 0, 0]; this.v = [0, 0, 0]; this.ini = false; }
  passo(dt, alvo, k = 95, c = 12){ if(!this.ini){ this.x = alvo.slice(); this.ini = true; return; } const n = Math.max(1, Math.ceil(dt / .016)), h = dt / n; for(let s = 0; s < n; s++) for(let i = 0; i < 3; i++){ this.v[i] += (k * (alvo[i] - this.x[i]) - c * this.v[i]) * h; this.x[i] += this.v[i] * h; } }
}
/* altura/arfagem/rolagem sob as 4 rodas: [x local, z local] */
function sobTerreno(cen, x, z, yaw, rodas){
  const s = Math.sin(yaw), c = Math.cos(yaw), h = rodas.map(([xw, zw]) => cen.chao(x + s * zw + c * xw, z + c * zw - s * xw, 1e9));
  const f = (h[0] + h[1]) / 2, t = (h[2] + h[3]) / 2, dir = (h[1] + h[3]) / 2, esq = (h[0] + h[2]) / 2, L = Math.abs(rodas[0][1] - rodas[2][1]) || 1, W = Math.abs(rodas[0][0] - rodas[1][0]) || 1;
  return { y: (f + t) / 2, pitch: Math.atan2(f - t, L), roll: Math.atan2(dir - esq, W), h };
}

/* ---------- poeira e rastros compartilhados ---------- */
function criarPoeira(cen){
  const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, "rgba(176,146,108,.9)"); g.addColorStop(.6, "rgba(176,146,108,.35)"); g.addColorStop(1, "rgba(176,146,108,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const L = []; for(let i = 0; i < 40; i++){ const m = new SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: true }), s = new Sprite(m); s.visible = false; s.renderOrder = 6; cen.grupo.add(s); L.push({ s, t: 9, dur: 1, vx: 0, vy: 0, vz: 0, e0: 1, e1: 4 }); }
  let k = 0;
  return { emite(x, y, z, v, vx, vz){ const p = L[k++ % L.length]; p.t = 0; p.dur = .9 + Math.random() * .8; p.vx = -vx * .25 + (Math.random() - .5) * 2; p.vz = -vz * .25 + (Math.random() - .5) * 2; p.vy = 1.5 + Math.random() * 2; p.e0 = .5 + v * .1; p.e1 = 2.2 + v * .45 + Math.random(); p.s.position.set(x, y + .4, z); p.s.visible = true; },
    tick(dt){ L.forEach(p => { if(p.t >= p.dur){ p.s.visible = false; return; } p.t += dt; const u = p.t / p.dur; p.s.position.x += p.vx * dt; p.s.position.z += p.vz * dt; p.s.position.y += p.vy * dt * (1 - u); const e = (p.e0 + (p.e1 - p.e0) * u) * U * .5; p.s.scale.set(e, e, 1); p.s.material.opacity = .55 * (1 - u) * Math.min(1, u * 8); }); } };
}
function criarRastros(cen){
  const geo = new PlaneGeometry(.2 * U, .7 * U), mats = [.5, .38, .26, .14].map(o => new MeshBasicMaterial({ color: 0x4a3524, transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  const L = []; for(let i = 0; i < 160; i++){ const m = new Mesh(geo, mats[0]); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3; cen.grupo.add(m); L.push({ m, t: 1e9 }); }
  let k = 0;
  return { marca(x, z, yaw){ const r = L[k++ % L.length]; r.t = 0; r.m.position.set(x, cen.chao(x, z, 1e9) + .1, z); r.m.rotation.set(-Math.PI / 2, 0, -yaw); r.m.rotation.order = "YXZ"; r.m.rotation.y = yaw; r.m.rotation.x = -Math.PI / 2; r.m.visible = true; r.m.material = mats[0]; },
    tick(dt){ L.forEach(r => { if(!r.m.visible) return; r.t += dt; const u = r.t / QUADRICICLO.rastroSeg; if(u >= 1){ r.m.visible = false; return; } r.m.material = mats[Math.min(3, Math.floor(u * 4))]; }); } };
}

/* ============================================================================================================ QUADRICICLO */
export function criarQuad(M){
  const { cen } = M, mod = criarQuadriciclo(), T = mod.obj; cen.grupo.add(T);
  const S = { x: 0, z: 0, yaw: 0, v: 0, a: 0, esterc: 0, giroRoda: 0, mola: new Mola(), spin: 0, terra: true, campo: false, ligado: false, luzes: false, giroflex: false, visivel: true, tr: 0, acum: 0 };
  const poeira = criarPoeira(cen), rastros = criarRastros(cen); let motor = null, tt = 0, ultRast = [0, 0];
  const rodasLoc = [[-mod.via, mod.eixoF], [mod.via, mod.eixoF], [-mod.via, mod.eixoT], [mod.via, mod.eixoT]];
  const col = { x0: 0, x1: 0, z0: 0, z1: 0, ativo: () => S.visivel }; cen.colisores.push(col);
  const dirV = () => [Math.sin(S.yaw), Math.cos(S.yaw)];
  function colocar(x, z, yaw){ S.x = x; S.z = z; S.yaw = yaw; S.v = 0; S.mola.ini = false; atualiza(0); }
  /* ctrl: { vAlvo (m/s), yawAlvo (rad) | null } */
  function tick(dt, ctrl, J){
    tt += dt;
    const vAlvo = ctrl ? ctrl.vAlvo * U : 0, dv = vAlvo - S.v, antes = S.v;
    S.v += cl(dv, -QUADRICICLO.freio * U * dt, QUADRICICLO.acel * U * dt); S.a = (S.v - antes) / Math.max(dt, 1e-3) / (QUADRICICLO.acel * U);
    let rate = 0; if(ctrl && ctrl.yawAlvo != null && Math.abs(S.v) > .05 * U){ const d = ang(ctrl.yawAlvo - S.yaw); rate = cl(d * 2.4, -QUADRICICLO.giroMax, QUADRICICLO.giroMax) * Math.min(1, Math.abs(S.v) / (1.6 * U)); S.yaw += rate * dt; }
    S.x += Math.sin(S.yaw) * S.v * dt; S.z += Math.cos(S.yaw) * S.v * dt;
    S.esterc += (cl(rate * .42, -.55, .55) - S.esterc) * Math.min(1, dt * 8); S.spin += S.v * dt / mod.raio;
    atualiza(dt, J);
  }
  function atualiza(dt, J){
    const ter = sobTerreno(cen, S.x, S.z, S.yaw, rodasLoc);
    S.mola.passo(dt, [ter.y, -ter.pitch, ter.roll]);
    T.position.set(S.x, S.mola.x[0], S.z); T.rotation.set(0, S.yaw, 0); mod.corpo.rotation.set(S.mola.x[1], 0, S.mola.x[2], "ZXY");
    mod.rodas.forEach(r => { r.giro.rotation.x = S.spin; if(r.frente) r.ester.rotation.y = S.esterc; });
    mod.guidao.rotation.y = S.esterc * 1.1;
    /* luzes */
    const lz = mod.luzes, piscaV = Math.sin(tt * 14) > 0, piscaA = Math.sin(tt * 14 + Math.PI) > 0;
    lz.farol.emissiveIntensity = S.luzes ? 2.1 : 0; lz.lanterna.emissiveIntensity = S.luzes ? 1.2 : 0; lz.giroV.emissiveIntensity = S.giroflex && piscaV ? 3 : 0; lz.giroA.emissiveIntensity = S.giroflex && piscaA ? 3 : 0;
    /* colisor móvel (caixa que envolve o retângulo girado) */
    const cs = Math.abs(Math.cos(S.yaw)), sn = Math.abs(Math.sin(S.yaw)), hx = (cs * .62 + sn * 1.1) * U, hz = (sn * .62 + cs * 1.1) * U; col.x0 = S.x - hx; col.x1 = S.x + hx; col.z0 = S.z - hz; col.z1 = S.z + hz;
    if(dt <= 0) return;
    /* poeira e rastros */
    const sp = Math.abs(S.v) / U; if(QUADRICICLO.poeira && S.visivel && sp > 1.2){ S.acum += dt * (S.terra ? sp * 1.6 : sp * .7); while(S.acum >= 1){ S.acum -= 1; const s = Math.sin(S.yaw), c = Math.cos(S.yaw), lado = Math.random() < .5 ? -1 : 1; poeira.emite(S.x + s * mod.eixoT + c * lado * mod.via, S.mola.x[0], S.z + c * mod.eixoT - s * lado * mod.via, sp, Math.sin(S.yaw) * S.v, Math.cos(S.yaw) * S.v); } }
    if(S.campo && S.visivel && sp > .8 && Math.hypot(S.x - ultRast[0], S.z - ultRast[1]) > .7 * U){ ultRast = [S.x, S.z]; const s = Math.sin(S.yaw), c = Math.cos(S.yaw); [-1, 1].forEach(l => [mod.eixoT, mod.eixoF].forEach(zw => rastros.marca(S.x + s * zw + c * l * mod.via, S.z + c * zw - s * l * mod.via, S.yaw))); }
    poeira.tick(dt); rastros.tick(dt);
    /* som */
    if(S.ligado){ motor = motor || criarMotor({ tipo: "quad", vol: QUADRICICLO.ruidoVol }); const d = J ? Math.hypot(S.x - J.x, S.z - J.z) / U : 80; motor.set(cl(sp / QUADRICICLO.velMax, 0, 1.2), cl(S.a, 0, 1), d, true); }
    else if(motor){ motor.para(); motor = null; }
  }
  const api = {
    S, mod, obj: T, colocar, tick, atualiza,
    get x(){ return S.x; }, get z(){ return S.z; }, get yaw(){ return S.yaw; }, get v(){ return S.v / U; },
    liga(on){ S.ligado = on; }, luzes(on){ S.luzes = on; }, giroflex(on){ S.giroflex = on; }, capacete(on){ mod.capacete.visible = on; }, mostra(on){ S.visivel = on; T.visible = on; },
    /* ponto do assento (mundo) para o piloto */
    assento(){ const s = Math.sin(S.yaw), c = Math.cos(S.yaw), a = mod.assento; return [S.x + s * a[2] + c * a[0], S.mola.x[0] + a[1], S.z + c * a[2] - s * a[0]]; },
    frenteXZ(d){ const [fx, fz] = dirV(); return [S.x + fx * d * U, S.z + fz * d * U]; },
    pose(){ return { pitch: S.mola.x[1], roll: S.mola.x[2] }; },
    desliga(){ if(motor){ motor.para(); motor = null; } }
  };
  return api;
}

/* ============================================================================================================ AMBULÂNCIA */
export function criarAmb(M){
  const { cen } = M, mod = criarAmbulancia(), T = mod.obj; cen.grupo.add(T);
  const S = { x: 0, z: 0, yaw: 0, v: 0, esterc: 0, spin: 0, mola: new Mola(), sirene: false, giro: false, visivel: true, porta: 0, portaAlvo: 0 };
  let sirene = null, tt = 0;
  const rodasLoc = [[-.93 * U, 2.0 * U], [.93 * U, 2.0 * U], [-.93 * U, -1.95 * U], [.93 * U, -1.95 * U]];
  const col = { x0: 0, x1: 0, z0: 0, z1: 0, ativo: () => S.visivel }; cen.colisores.push(col);
  function colocar(x, z, yaw){ S.x = x; S.z = z; S.yaw = yaw; S.v = 0; S.mola.ini = false; atualiza(0); }
  function atualiza(dt, J){
    tt += dt; const ter = sobTerreno(cen, S.x, S.z, S.yaw, rodasLoc); S.mola.passo(dt, [ter.y, -ter.pitch, ter.roll], 70, 11);
    T.position.set(S.x, S.mola.x[0], S.z); T.rotation.set(0, S.yaw, 0); mod.corpo.rotation.set(S.mola.x[1], 0, S.mola.x[2], "ZXY");
    mod.rodas.forEach(r => { r.giro.rotation.x = S.spin; if(r.frente) r.ester.rotation.y = S.esterc; });
    S.porta += cl(S.portaAlvo - S.porta, -dt * 1.6, dt * 1.6); mod.abre(S.porta);
    const lz = mod.luzes, ph = Math.floor(tt * 7) % 2, on = S.giro;
    lz.barraV.emissiveIntensity = on && ph === 0 ? 3.2 : on ? .3 : 0; lz.barraB.emissiveIntensity = on && ph === 1 ? 3.2 : on ? .3 : 0; lz.barraA.emissiveIntensity = on && ph === 1 ? 3 : 0; lz.pisca.emissiveIntensity = on && ph === (Math.floor(tt * 3.5) % 2) ? 3 : on ? .2 : 0;
    lz.farol.emissiveIntensity = on ? 1.8 : 0; lz.lanterna.emissiveIntensity = on ? 1.3 : 0;
    const cs = Math.abs(Math.cos(S.yaw)), sn = Math.abs(Math.sin(S.yaw)), hx = (cs * 1.05 + sn * 3.1) * U, hz = (sn * 1.05 + cs * 3.1) * U; col.x0 = S.x - hx; col.x1 = S.x + hx; col.z0 = S.z - hz; col.z1 = S.z + hz;
    if(dt <= 0) return;
    if(S.sirene){ sirene = sirene || criarSirene({ vol: .55 }); const d = J ? Math.hypot(S.x - J.x, S.z - J.z) / U : 120; sirene.set(d, true); } else if(sirene){ sirene.para(); sirene = null; }
  }
  /* anda sobre uma lista de pontos [x,z] com velocidade vAlvo (m/s): devolve true quando chega ao fim */
  function segue(dt, rota, estado, vAlvo, J){
    const al = rota.amostra(Math.min(rota.len, estado.s + 14 * U)), dy = ang(Math.atan2(al.tx, al.tz) - S.yaw);
    const dv = vAlvo * U - S.v; S.v += cl(dv, -5 * U * dt, 2.2 * U * dt); estado.s += S.v * dt; const q = rota.amostra(estado.s);
    const yawAlvo = Math.atan2(q.tx, q.tz); S.yaw += ang(yawAlvo - S.yaw) * Math.min(1, dt * 3); S.x = q.x; S.z = q.z; S.esterc += (cl(dy * .5, -.4, .4) - S.esterc) * Math.min(1, dt * 4); S.spin += S.v * dt / mod.raio;
    atualiza(dt, J); return estado.s >= rota.len - 1;
  }
  return { S, mod, obj: T, colocar, atualiza, segue, get x(){ return S.x; }, get z(){ return S.z; }, get yaw(){ return S.yaw; }, sirene(on){ S.sirene = on; }, giro(on){ S.giro = on; }, portas(abertas){ S.portaAlvo = abertas ? 1.9 : 0; }, mostra(on){ S.visivel = on; T.visible = on; if(!on && sirene){ sirene.para(); sirene = null; } },
    pontoTras(d = 0){ const s = Math.sin(S.yaw), c = Math.cos(S.yaw); return [S.x - s * (3.4 * U + d), S.z - c * (3.4 * U + d)]; }, parar(){ if(sirene){ sirene.para(); sirene = null; } } };
}
