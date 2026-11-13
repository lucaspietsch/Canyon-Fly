import { alvosEmCone, descarta } from "./combate.js";
import { Group, Mesh, OctahedronGeometry, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DA MARY (forma Violeta, só no tempo antigo): FOGO (tecla do poder, V) — bola de fogo laranja sai da mão direita, voa até o alvo
   mirado (ou ~30 m à frente) e EXPLODE em área; se o ponto de impacto cai dentro de um polígono de mata, o fogo some sem queimar nada
   (regra do Boitatá). GELO (U) — rajada azul-clara da mão esquerda que congela o alvo em cristais por alguns segundos (imobiliza animais
   enfeitiçados e sombras sem ferir). COMBINAÇÃO (Y) — só em alvo congelado: explosão de vapor com dano e empurrão extras.
   Efeitos: faíscas, flocos e cristais, sem exagero. Teclas em data/poderes.js → mary.
   ============================================================================================================ */
export function criarMary(M, X){
  const S = { ativo: false, g: new Group(), bolas: [], nuvens: [], gelos: [], cdGelo: 0, cdCombo: 0 };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.mary, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "mary" && T() && T().ativa();
  function aoTransformar(id, on){ if(id !== "mary") return; S.ativo = on; }
  const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const naMata = (x, z) => { const K = M.kml && M.kml.S; if(!K) return false; return K.poligonos.some(p => (p.tipo === "mata" || p.tipo === "mataBaixa") && emPoli(p.mundoPts || p.pts, x, z)); };
  function nuvem(n, cor, tam, x, y, z, esp, vy, vida, add){ const g = new BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for(let k = 0; k < n; k++){ const a = Math.random() * Math.PI * 2, r = Math.random() * esp; pos[k * 3] = x + Math.cos(a) * r; pos[k * 3 + 1] = y + Math.random() * esp * .5; pos[k * 3 + 2] = z + Math.sin(a) * r; vel[k * 3] = Math.cos(a) * esp * 1.2; vel[k * 3 + 1] = vy * (.5 + Math.random()); vel[k * 3 + 2] = Math.sin(a) * esp * 1.2; }
    g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: cor, size: tam, transparent: true, opacity: .9, depthWrite: false, blending: add ? AdditiveBlending : undefined })); p.frustumCulled = false; S.g.add(p); S.nuvens.push({ p, pos, vel, t: 0, vida }); }
  const mao = (J, lado) => { const f = [Math.sin(J.yaw), Math.cos(J.yaw)], l = [f[1], -f[0]]; return { x: J.x + f[0] * .8 * U + l[0] * lado * .45 * U, y: J.y + 1.3 * U, z: J.z + f[1] * .8 * U + l[1] * lado * .45 * U }; };
  /* ---- FOGO ---- */
  function fogo(J, dd){ const alvo = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    const dest = alvo ? { x: alvo.pos().x, z: alvo.pos().z } : { x: J.x + f[0] * 30 * U, z: J.z + f[1] * 30 * U }; dest.y = X.chao(dest.x, dest.z) + 1.2 * U;
    const o = mao(J, 1), n = 40, g = new BufferGeometry(), pos = new Float32Array(n * 3); g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: 0xff8a2a, size: .5 * U, transparent: true, opacity: .95, depthWrite: false, blending: AdditiveBlending })); p.frustumCulled = false; S.g.add(p);
    S.bolas.push({ p, pos, n, o, dest, t: 0, dur: Math.max(.25, Math.hypot(dest.x - o.x, dest.z - o.z) / (60 * U)), dd }); X.luzFx(o.x, o.y, o.z, 0xff8a2a, 5, 8 * U, .2); X.msg("sobrenatural", "Uma bola de fogo sai da mão direita de Mary."); }
  function explode(b){ const { dest, dd } = b;
    if(naMata(dest.x, dest.z)){ nuvem(30, 0xffb070, .3 * U, dest.x, dest.y, dest.z, 1.2 * U, 1.5 * U, .7, true); X.msg("sobrenatural", "O fogo toca a mata e se apaga sozinho: a floresta é protegida (regra do Boitatá)."); if(M.ctx) M.ctx.mostraAviso("O fogo se apaga na mata"); return; }
    X.luzFx(dest.x, dest.y, dest.z, 0xff7a1a, 22, 30 * U, .5); nuvem(120, 0xff6a1a, .55 * U, dest.x, dest.y, dest.z, 2.5 * U, 4 * U, .9, true); nuvem(60, 0xffd27a, .25 * U, dest.x, dest.y, dest.z, 3 * U, 6 * U, .8, true); nuvem(50, 0x55504a, 1.1 * U, dest.x, dest.y + U, dest.z, 2 * U, 2 * U, 2.2, false);
    const congelado=X.S.alvos.find(a=>!a.morto && a.congelado>0 && Math.hypot(a.pos().x-dest.x,a.pos().z-dest.z)<=dd.fogoRaioM*U);
    if(congelado){vapor(congelado,dd);return;}
    for(const a of X.S.alvos){ if(a.morto) continue; const q = a.pos(), dist = Math.hypot(q.x - dest.x, q.z - dest.z); if(dist > dd.fogoRaioM * U) continue; if(a.congelado > 0){ vapor(a, dd); continue; } if(a.dano) a.dano(dd.danoInimigo * (1 - dist / (dd.fogoRaioM * U) * .5)); }
    X.msg("sobrenatural", "A bola de fogo explode em área."); }
  /* ---- GELO ---- */
  function cristaliza(x, y, z, raioU, seg, alvo){ if(alvo)S.gelos=S.gelos.filter(g=>{if(g.alvo!==alvo)return true;descarta(g.grp);return false;}); const grp = new Group(); const mat = new MeshStandardMaterial({ color: 0xd8f3ff, emissive: 0x7fd0ff, emissiveIntensity: .7, roughness: .1, metalness: .2, transparent: true, opacity: .8 });
    for(let k = 0; k < 9; k++){ const c = new Mesh(new OctahedronGeometry(raioU * (.35 + Math.random() * .35), 0), mat); const a = k / 9 * Math.PI * 2; c.position.set(Math.cos(a) * raioU * .8, raioU * (.2 + Math.random() * 1.4), Math.sin(a) * raioU * .8); c.rotation.set(Math.random() * 3, Math.random() * 3, 0); grp.add(c); }
    grp.position.set(x, y, z); S.g.add(grp); S.gelos.push({ grp, t: 0, vida: seg, alvo }); nuvem(40, 0xcfefff, .2 * U, x, y + raioU, z, raioU, 1.5 * U, 1.2, true); }
  function gelo(J){ if(S.cdGelo > 0) return; const dd = d(); S.cdGelo = 2.2; const o = mao(J, -1), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    for(let k = 0; k < 12; k++) setTimeout(() => nuvem(10, 0xbfe9ff, .25 * U, o.x + f[0] * k * 3 * U, o.y, o.z + f[1] * k * 3 * U, .6 * U, .6 * U, .5, true), k * 25);
    const alvos=alvosEmCone(X.S.alvos,J,dd.geloM*U,dd.coneGelo,["inimigo","guardiao"]).slice(0,dd.geloAlvos);let n=0;
    for(const a of alvos){a.congelado=dd.geloSeg;a.encantado=Math.max(a.encantado||0,dd.geloSeg);const q=a.pos();cristaliza(q.x,q.y??X.chao(q.x,q.z),q.z,(a.raioM||1)*U*1.2,dd.geloSeg,a);n++;}
    const cos = Math.cos(dd.coneGelo * Math.PI / 180); ((M.fauna && M.fauna.animais) || []).forEach(an => { const dx = an.x - J.x, dz = an.z - J.z, dist = Math.hypot(dx, dz); if(dist < dd.geloM * U && dist > .1 && (dx * f[0] + dz * f[1]) / dist > cos && n < dd.geloAlvos){ an.atordoado = dd.geloSeg; cristaliza(an.x, an.y || X.chao(an.x, an.z), an.z, .9 * U, dd.geloSeg, null); n++; } });
    X.luzFx(o.x, o.y, o.z, 0x9fd8ff, 6, 14 * U, .4); X.msg("sobrenatural", n ? "A rajada de gelo congela " + n + " alvo(s) em cristais por " + dd.geloSeg + " s, sem ferir." : "A rajada de gelo cruza o ar e não acerta ninguém."); if(M.ctx) M.ctx.mostraAviso(n ? "Congelado!" : "Gelo (sem alvo)"); }
  /* ---- COMBINAÇÃO: vapor ---- */
  function vapor(a, dd){ const q = a.pos(); X.luzFx(q.x, (q.y??X.chao(q.x,q.z)) + 2 * U, q.z, 0xeaf6ff, 18, 26 * U, .5); nuvem(140, 0xf0f6ff, .9 * U, q.x, (q.y??X.chao(q.x,q.z)) + U, q.z, 3 * U, 3 * U, 1.8, false); a.congelado = 0; S.gelos.filter(g => g.alvo === a).forEach(g => { g.t = g.vida; });
    for(const b of X.S.alvos){ if(b.morto) continue; const p = b.pos(), dx = p.x - q.x, dz = p.z - q.z, dist = Math.hypot(dx, dz); if(dist > dd.vaporRaioM * U) continue; if(b.congelado>0){b.congelado=0;S.gelos.filter(g=>g.alvo===b).forEach(g=>{g.t=g.vida;});} if(b.g && dist > .01){ const k = (1 - dist / (dd.vaporRaioM * U)) * 6 * U; b.g.position.x += dx / dist * k; b.g.position.z += dz / dist * k; b.g.position.y = X.chao(b.g.position.x, b.g.position.z); } if(b.dano) b.dano(b === a ? dd.vaporDano : dd.danoInimigo); }
    X.msg("sobrenatural", "Gelo + fogo: explosão de vapor! Dano e empurrão extras."); if(M.ctx) M.ctx.mostraAviso("Explosão de vapor!"); }
  function combo(J){ if(S.cdCombo > 0) return; const dd = d(), a = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]); if(!a || !(a.congelado > 0)){ if(M.ctx) M.ctx.mostraAviso("A combinação só funciona num alvo CONGELADO (U primeiro)"); return; } S.cdCombo = 3; vapor(a, dd); }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.gelo){ e.preventDefault(); gelo(J); return true; } if(e.code === k.combo){ e.preventDefault(); combo(J); return true; } return false; }
  function tick(dt){ S.cdGelo = Math.max(0, S.cdGelo - dt); S.cdCombo = Math.max(0, S.cdCombo - dt);
    S.bolas = S.bolas.filter(b => { b.t += dt; const k = Math.min(1, b.t / b.dur), x = b.o.x + (b.dest.x - b.o.x) * k, y = b.o.y + (b.dest.y - b.o.y) * k + Math.sin(k * Math.PI) * 3 * U, z = b.o.z + (b.dest.z - b.o.z) * k; for(let i = 0; i < b.n; i++){ b.pos[i * 3] = x + (Math.random() - .5) * .9 * U; b.pos[i * 3 + 1] = y + (Math.random() - .5) * .9 * U; b.pos[i * 3 + 2] = z + (Math.random() - .5) * .9 * U; } b.p.geometry.attributes.position.needsUpdate = true; if(k >= 1){ S.g.remove(b.p); b.p.geometry.dispose(); explode(b); return false; } return true; });
    S.nuvens = S.nuvens.filter(n => { n.t += dt; const a = n.pos, v = n.vel; for(let k = 0; k < a.length; k += 3){ a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; v[k] *= (1 - dt * 1.5); v[k + 2] *= (1 - dt * 1.5); } n.p.geometry.attributes.position.needsUpdate = true; n.p.material.opacity = .9 * Math.max(0, 1 - n.t / n.vida); if(n.t > n.vida){ S.g.remove(n.p); n.p.geometry.dispose(); return false; } return true; });
    S.gelos = S.gelos.filter(g => { g.t += dt; if(g.alvo && g.alvo.pos){ const q = g.alvo.pos(); g.grp.position.set(q.x, q.y, q.z); } g.grp.children.forEach(c => { c.material.opacity = .8 * Math.max(0, 1 - Math.max(0, g.t - g.vida + .6) / .6); });  if(g.t > g.vida){ if(g.alvo) g.alvo.congelado = 0; S.g.remove(g.grp); g.grp.children.forEach(c => c.geometry.dispose()); return false; } return true; }); }
  const info = () => (ativo() ? "Mary: V fogo · " + d().teclas.gelo.replace("Key", "") + " gelo" + (S.cdGelo > 0 ? " (" + S.cdGelo.toFixed(1) + ")" : "") + " · " + d().teclas.combo.replace("Key", "") + " vapor" + (S.gelos.length ? " · " + S.gelos.length + " congelado(s)" : "") : "");
  return { fogo, gelo, combo, tecla, tick, aoTransformar, info, S, naMata };
}
