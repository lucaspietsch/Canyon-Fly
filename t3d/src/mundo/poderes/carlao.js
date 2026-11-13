import { Group, Mesh, SphereGeometry, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, PointLight } from "three";
import { U } from "../config.js";
import { PODERES, PODERES_CFG } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO CARLÃO (forma Reggae, só no tempo antigo): BOLA DOURADA — V (tecla do poder) começa o chute; ao soltar: toque rápido = a bola
   voa até o alvo, acerta e VOLTA para o pé (dá para encadear); segurando ≥ segurarSeg = a bola EXPLODE no impacto (dano em área) e outra
   nasce no pé na hora. A bola deixa rastro de luz. CAPOEIRA (Y) — golpes encadeados (ginga → meia-lua de compasso → martelo → armada) com
   giro/inclinação do tronco, acertam quem está perto à frente. RASTEIRA (I) — derruba e deixa no chão por alguns segundos (imobiliza animais
   enfeitiçados sem ferir). Falas especiais no campo da Vila Ouro Verde: pendente (o campo vem com o OSM).
   ============================================================================================================ */
export function criarCarlao(M, X){
  const S = { ativo: false, g: new Group(), bola: null, luz: null, voo: null, carregando: null, rastro: [], golpe: 0, comboT: 0, anim: null, cdCap: 0, cdRast: 0, caidos: [] };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.carlao, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "carlao" && T() && T().ativa();
  const rig = () => { const am = M.H && M.H.andarMod; return am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); };
  const ouro = new MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffb020, emissiveIntensity: .7, roughness: .25, metalness: .8 });
  function aoTransformar(id, on){ if(id !== "carlao") return; S.ativo = on; if(on){ if(!S.bola){ S.bola = new Mesh(new SphereGeometry(.36 * U, 18, 14), ouro); S.g.add(S.bola); S.luz = new PointLight(0xffc040, 4, 8 * U); S.g.add(S.luz); } S.bola.visible = true; S.luz.visible = true; } else { if(S.bola){ S.bola.visible = false; S.luz.visible = false; } S.voo = null; S.carregando = null; } }
  const pe = (J) => { const f = [Math.sin(J.yaw), Math.cos(J.yaw)], l = [f[1], -f[0]]; return { x: J.x + f[0] * .9 * U + l[0] * .35 * U, y: J.y + .36 * U, z: J.z + f[1] * .9 * U + l[1] * .35 * U }; };
  function faisca(x, y, z, n, cor, esp){ const g = new BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for(let k = 0; k < n; k++){ pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI; vel[k * 3] = Math.sin(b) * Math.cos(a) * esp; vel[k * 3 + 1] = Math.abs(Math.cos(b)) * esp; vel[k * 3 + 2] = Math.sin(b) * Math.sin(a) * esp; }
    g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: cor, size: .3 * U, transparent: true, opacity: .95, depthWrite: false, blending: AdditiveBlending })); p.frustumCulled = false; S.g.add(p); S.rastro.push({ p, pos, vel, t: 0, vida: .9, grav: 8 * U }); }
  /* ---- chute: começa ao apertar, dispara ao soltar ---- */
  function inicia(J){ if(S.voo || S.carregando)return false; S.carregando = { t0: performance.now(), J }; if(M.ctx) M.ctx.mostraAviso("Segure para explodir · solte rápido para a bola voltar"); return true; }
  function chuta(J, explode){ const dd = d(), alvo = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao", "pessoa"]), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    const dest = alvo ? { x: alvo.pos().x, y: (alvo.pos().y || X.chao(alvo.pos().x, alvo.pos().z)) + 1.2 * U, z: alvo.pos().z } : { x: J.x + f[0] * 25 * U, y: X.chao(J.x + f[0] * 25 * U, J.z + f[1] * 25 * U) + 1.2 * U, z: J.z + f[1] * 25 * U };
    const o = pe(J); S.voo = { o, dest, alvo, explode, t: 0, dur: Math.max(.2, Math.hypot(dest.x - o.x, dest.z - o.z) / (dd.bolaMS * U)), fase: "ida" }; faisca(o.x, o.y, o.z, 20, 0xffe08a, 3 * U);
    X.msg("sobrenatural", explode ? "Carlão chuta a bola dourada com força: ela vai explodir no impacto." : "Carlão toca a bola dourada: ela acerta e volta para o pé."); }
  function impacto(){ const v = S.voo, dd = d(), p = v.dest;
    if(v.explode){ X.luzFx(p.x, p.y, p.z, 0xffc040, 24, 30 * U, .5); faisca(p.x, p.y, p.z, 120, 0xffd24a, 9 * U); for(const a of X.S.alvos){ if(a.morto) continue; const q = a.pos(), dist = Math.hypot(q.x - p.x, q.z - p.z); if(dist > dd.explosaoRaioM * U) continue; if(a.g && dist > .01){ const k = (1 - dist / (dd.explosaoRaioM * U)) * 5 * U; a.g.position.x += (q.x - p.x) / dist * k; a.g.position.z += (q.z - p.z) / dist * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } if(a.dano) a.dano(dd.danoExplosao); }
      X.msg("sobrenatural", "A bola dourada explode! Outra já surge no pé do Carlão."); S.voo = null; if(M.ctx) M.ctx.mostraAviso("Explosão dourada — nova bola no pé"); }
    else { if(v.alvo && !v.alvo.morto){ if(v.alvo.dano) v.alvo.dano(dd.danoInimigo); if(v.alvo.g){ v.alvo.g.rotation.z = (Math.random() - .5) * .8; } faisca(p.x, p.y, p.z, 40, 0xffe08a, 5 * U); X.msg("sobrenatural", "A bola acerta " + (v.alvo.nome || "o alvo") + " e volta para o Carlão."); } else { faisca(p.x, p.y, p.z, 20, 0xffe08a, 3 * U); }
      v.fase = "volta"; v.t = 0; } }
  /* ---- capoeira ---- */
  function capoeira(J){ if(S.cdCap > 0) return; const dd = d();if(S.comboT<=0)S.golpe=0;const nome=dd.golpes[S.golpe%dd.golpes.length];S.golpe++;S.comboT=dd.comboJanelaSeg;const finalizador=S.golpe%dd.golpes.length===0; S.cdCap = .55; const f = [Math.sin(J.yaw), Math.cos(J.yaw)]; let n = 0;
    for(const a of X.S.alvos){ if(a.morto) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > (finalizador?dd.finalizadorM:dd.capoeiraM)*U || dist<.01 || (dx * f[0] + dz * f[1]) / dist < .3) continue; n++; if(a.g){ a.g.position.x += dx / dist * 2.5 * U; a.g.position.z += dz / dist * 2.5 * U; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); a.g.rotation.z = (Math.random() - .5) * .9; } if(a.dano && nome !== "ginga") a.dano(finalizador?dd.finalizadorDano:dd.capoeiraDano); }
    if(finalizador){X.pulso(J.x,J.z,0xffd24a,dd.finalizadorM);M.ctx?.mostraAviso("Finalizador dourado!");}
    S.anim = { nome, t: 0, dur: nome === "ginga" ? .6 : .7, giro: nome === "meia-lua de compasso" || nome === "armada" ? (nome === "armada" ? -1 : 1) : 0, incl: nome === "martelo" ? 1 : nome === "ginga" ? .4 : .6 };
    faisca(J.x + f[0] * 1.5 * U, J.y + 2 * U, J.z + f[1] * 1.5 * U, 14, 0xffe08a, 2 * U); X.msg("sobrenatural", "Capoeira: " + nome + (n ? " — acertou " + n + "." : ".")); if(M.ctx) M.ctx.mostraAviso(nome.charAt(0).toUpperCase() + nome.slice(1)); }
  /* ---- rasteira ---- */
  function rasteira(J){ if(S.cdRast > 0) return; const dd = d(), R = dd.rasteiraM * U; S.cdRast = 5; let n = 0;
    for(const a of X.S.alvos){ if(a.morto) continue; const p = a.pos(); if(Math.hypot(p.x - J.x, p.z - J.z) > R) continue; n++; a.encantado = Math.max(a.encantado || 0, dd.rasteiraSeg); if(a.g){ a.g.rotation.z = 1.35; S.caidos.push({ a, t: dd.rasteiraSeg }); } }
    ((M.fauna && M.fauna.animais) || []).forEach(an => { if(Math.hypot(an.x - J.x, an.z - J.z) < R){ an.atordoado = dd.rasteiraSeg; n++; } });
    S.anim = { nome: "rasteira", t: 0, dur: .6, giro: 1, incl: .9, baixo: 1 }; X.msg("sobrenatural", n ? "Rasteira! " + n + " alvo(s) no chão por " + dd.rasteiraSeg + " s, sem ferir." : "Rasteira no ar: ninguém por perto."); if(M.ctx) M.ctx.mostraAviso(n ? "Rasteira: " + n + " no chão" : "Rasteira"); }
  /* ---- teclas: soltar o V dispara o chute ---- */
  function cancela(){S.carregando=null;}
  function finaliza(){if(!S.carregando||!ativo())return false;const seg=(performance.now()-S.carregando.t0)/1000,J=M.jogador()||S.carregando.J;S.carregando=null;chuta(J,seg>=d().segurarSeg);return true;}
  window.addEventListener("keyup",e=>{if(e.code===PODERES_CFG.tecla)finaliza();});
  window.addEventListener("blur",cancela);
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.capoeira){ e.preventDefault(); capoeira(J); return true; } if(e.code === k.rasteira){ e.preventDefault(); rasteira(J); return true; } return false; }
  function tick(dt){ S.comboT=Math.max(0,S.comboT-dt);if(S.comboT===0)S.golpe=0; S.cdCap = Math.max(0, S.cdCap - dt); S.cdRast = Math.max(0, S.cdRast - dt); const J = M.jogador();
    if(S.bola && S.bola.visible && J){ if(S.voo){ const v = S.voo; v.t += dt; const k = Math.min(1, v.t / v.dur), a = v.fase === "ida" ? v.o : v.dest, b = v.fase === "ida" ? v.dest : pe(J); S.bola.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 2 * U, a.z + (b.z - a.z) * k); S.bola.rotation.x += dt * 12; if(Math.random() < .8) faisca(S.bola.position.x, S.bola.position.y, S.bola.position.z, 2, 0xffe08a, .6 * U);
        if(k >= 1){ if(v.fase === "ida") impacto(); else { S.voo = null; if(M.ctx) M.ctx.mostraAviso("Bola de volta no pé — chute de novo"); } } }
      else { const p = pe(J); S.bola.position.set(p.x, p.y, p.z); S.bola.rotation.y += dt * 2; }
      if(S.luz){ S.luz.position.copy(S.bola.position); S.luz.position.y += .5 * U; S.luz.intensity = 3 + Math.sin(performance.now() / 180) * 1.2; } }
    if(S.anim){ const A = S.anim, r = rig(); A.t += dt; const k = Math.min(1, A.t / A.dur), s = Math.sin(k * Math.PI); if(r && r.tronco){ r.tronco.rotation.y = A.giro * k * Math.PI * 2 * (k < 1 ? 1 : 0); r.tronco.rotation.x = A.incl * s * .9; if(A.baixo) r.tronco.position.y = 2.2 - s * .9; } if(k >= 1){ if(r && r.tronco){ r.tronco.rotation.y = 0; r.tronco.rotation.x = 0; r.tronco.position.y = 2.2; } S.anim = null; } }
    S.caidos = S.caidos.filter(c => { c.t -= dt; if(c.t <= 0){ if(c.a.g) c.a.g.rotation.z = 0; return false; } return true; });
    S.rastro = S.rastro.filter(q => { q.t += dt; const a = q.pos, v = q.vel; for(let k = 0; k < a.length; k += 3){ v[k + 1] -= q.grav * dt; a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; } q.p.geometry.attributes.position.needsUpdate = true; q.p.material.opacity = .95 * Math.max(0, 1 - q.t / q.vida); if(q.t > q.vida){ S.g.remove(q.p); q.p.geometry.dispose(); return false; } return true; }); }
  const info = () => (ativo() ? "Carlão: V chute (toque volta · segurar explode)" + (S.voo ? " · bola " + S.voo.fase : "") + " · " + d().teclas.capoeira.replace("Key", "") + " capoeira (" + d().golpes[S.golpe % d().golpes.length] + ") · " + d().teclas.rasteira.replace("Key", "") + " rasteira" + (S.cdRast > 0 ? " (" + S.cdRast.toFixed(0) + ")" : "") : "");
  return { inicia, finaliza, cancela, chuta, capoeira, rasteira, tecla, tick, aoTransformar, info, S };
}
