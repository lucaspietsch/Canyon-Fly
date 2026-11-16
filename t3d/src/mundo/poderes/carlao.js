import { hostil, impactoSegmento, descarta } from './combate.js';
import { Group, Mesh, SphereGeometry, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, PointLight } from "three";
import { U } from "../config.js";
import { PODERES, PODERES_CFG } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO CARLÃO (forma Reggae, só no tempo antigo): BOLA DOURADA — V (tecla do poder) começa o chute; ao soltar: toque rápido = a bola
   voa até o alvo, acerta e VOLTA para o pé (dá para encadear); segurando ≥ segurarSeg = a bola EXPLODE no impacto (dano em área) e outra
   nasce no pé na hora. A bola deixa rastro de luz. CAPOEIRA (Q/R1) — golpes encadeados (ginga → meia-lua de compasso → martelo → armada) com
   giro/inclinação do tronco, acertam quem está perto à frente. RASTEIRA (F/Triângulo) — derruba e deixa no chão por alguns segundos (imobiliza animais
   enfeitiçados sem ferir). Falas especiais com os operários do campo da Vila Ouro Verde em lugares/vila.js.
   ============================================================================================================ */
export function criarCarlao(M, X){
  const S = { ativo: false, g: new Group(), bola: null, luz: null, voo: null, carregando: null, rastro: [], golpe: 0, comboT: 0, anim: null, cdCap: 0, cdRast: 0, caidos: [] };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.carlao, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "carlao" && T() && T().ativa();
  const rig = () => { const am = M.H && M.H.andarMod; return am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); };
  const ouro = new MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffb020, emissiveIntensity: .7, roughness: .25, metalness: .8 });
  function aoTransformar(id, on){ if(id !== "carlao") return; S.ativo = on; if(on){ if(!S.bola){ S.bola = new Mesh(new SphereGeometry(.14 * U, 18, 14), ouro); S.g.add(S.bola); S.luz = new PointLight(0xffc040, 4, 8 * U); S.g.add(S.luz); } S.bola.visible = true; S.luz.visible = true; } else { if(S.bola){ S.bola.visible = false; S.luz.visible = false; } S.voo = null; S.carregando = null;limpaCaidos();resetPose();S.anim=null;S.golpe=0;S.comboT=0; } }
  const mira=J=>({...J,yaw:Number.isFinite(J.camYaw)?J.camYaw+Math.PI:J.yaw});
  const pe = (J) => {J=mira(J); const f = [Math.sin(J.yaw), Math.cos(J.yaw)], l = [f[1], -f[0]]; return { x: J.x + f[0] * .40 * U + l[0] * .20 * U, y: J.y + .14 * U, z: J.z + f[1] * .40 * U + l[1] * .20 * U }; };
  function faisca(x, y, z, n, cor, esp){ const g = new BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for(let k = 0; k < n; k++){ pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI; vel[k * 3] = Math.sin(b) * Math.cos(a) * esp; vel[k * 3 + 1] = Math.abs(Math.cos(b)) * esp; vel[k * 3 + 2] = Math.sin(b) * Math.sin(a) * esp; }
    g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: cor, size: .3 * U, transparent: true, opacity: .95, depthWrite: false, blending: AdditiveBlending })); p.frustumCulled = false; S.g.add(p); S.rastro.push({ p, pos, vel, t: 0, vida: .9, grav: 8 * U }); }
  /* ---- chute: começa ao apertar, dispara ao soltar ---- */
  function inicia(J){ if(!ativo())return false;if(S.voo || S.carregando)return false; S.carregando = { t0: performance.now(), J }; if(M.ctx) M.ctx.mostraAviso("Segure para explodir · solte rápido para a bola voltar"); return true; }
  function chuta(J, explode){if(!ativo()||S.voo)return false;J=mira(J); const dd = d(), alvo = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    const dest = alvo ? { x: alvo.pos().x, y: (alvo.pos().y || X.chao(alvo.pos().x, alvo.pos().z)) + 1.2 * U, z: alvo.pos().z } : { x: J.x + f[0] * 25 * U, y: X.chao(J.x + f[0] * 25 * U, J.z + f[1] * 25 * U) + 1.2 * U, z: J.z + f[1] * 25 * U };
    const o = pe(J); S.bola?.position.set(o.x,o.y,o.z);S.voo = { o, dest, alvo, explode, t: 0, dur: Math.max(.2, Math.hypot(dest.x - o.x, dest.z - o.z) / (dd.bolaMS * U)), fase: "ida" }; faisca(o.x, o.y, o.z, 20, 0xffe08a, 3 * U);
    X.msg("sobrenatural", explode ? "Carlão chuta a bola dourada com força: ela vai explodir no impacto." : "Carlão toca a bola dourada: ela acerta e volta para o pé."); }
  function impacto(){ const v = S.voo, dd = d(), p = v.dest;
    if(v.explode){ X.luzFx(p.x, p.y, p.z, 0xffc040, 24, 30 * U, .5); faisca(p.x, p.y, p.z, 120, 0xffd24a, 9 * U); for(const a of X.S.alvos){ if(!hostil(a)) continue; const q = a.pos(), dist = Math.hypot(q.x - p.x, q.z - p.z); if(dist > dd.explosaoRaioM * U) continue; if(a.g && dist > .01){ const k = (1 - dist / (dd.explosaoRaioM * U)) * 5 * U; a.g.position.x += (q.x - p.x) / dist * k; a.g.position.z += (q.z - p.z) / dist * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } if(a.dano) a.dano(dd.danoExplosao); }
      X.msg("sobrenatural", "A bola dourada explode! Outra já surge no pé do Carlão."); S.voo = null;const J=M.jogador();if(J){const pe0=pe(J);S.bola?.position.set(pe0.x,pe0.y,pe0.z);} if(M.ctx) M.ctx.mostraAviso("Explosão dourada — nova bola no pé"); }
    else { if(hostil(v.alvo)&&Math.hypot(v.alvo.pos().x-p.x,v.alvo.pos().z-p.z)<2*U){ if(v.alvo.dano) v.alvo.dano(dd.danoInimigo); if(v.alvo.g){ v.alvo.g.rotation.z = (Math.random() - .5) * .8; } faisca(p.x, p.y, p.z, 40, 0xffe08a, 5 * U); X.msg("sobrenatural", "A bola acerta " + (v.alvo.nome || "o alvo") + " e volta para o Carlão."); } else { faisca(p.x, p.y, p.z, 20, 0xffe08a, 3 * U); }
      v.fase = "volta"; v.t = 0; } }
  /* ---- capoeira ---- */
  function capoeira(J){ if(!ativo()||S.cdCap > 0)return false;J=mira(J); const dd = d();if(S.comboT<=0)S.golpe=0;const nome=dd.golpes[S.golpe%dd.golpes.length];S.golpe++;S.comboT=dd.comboJanelaSeg;const finalizador=S.golpe%dd.golpes.length===0; S.cdCap = .55; const f = [Math.sin(J.yaw), Math.cos(J.yaw)]; let n = 0;
    for(const a of X.S.alvos){ if(!hostil(a)) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > (finalizador?dd.finalizadorM:dd.capoeiraM)*U || dist<.01 || (dx * f[0] + dz * f[1]) / dist < .3) continue; n++; if(a.g){ a.g.position.x += dx / dist * 2.5 * U; a.g.position.z += dz / dist * 2.5 * U; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); a.g.rotation.z = (Math.random() - .5) * .9; } if(a.dano && nome !== "ginga") a.dano(finalizador?dd.finalizadorDano:dd.capoeiraDano); }
    if(finalizador){X.pulso(J.x,J.z,0xffd24a,dd.finalizadorM);M.ctx?.mostraAviso("Finalizador dourado!");}
    S.anim = { nome, t: 0, dur: nome === "ginga" ? .6 : .7, giro: nome === "meia-lua de compasso" || nome === "armada" ? (nome === "armada" ? -1 : 1) : 0, incl: nome === "martelo" ? 1 : nome === "ginga" ? .4 : .6 };
    faisca(J.x + f[0] * 1.5 * U, J.y + 2 * U, J.z + f[1] * 1.5 * U, 14, 0xffe08a, 2 * U); X.msg("sobrenatural", "Capoeira: " + nome + (n ? " — acertou " + n + "." : ".")); if(M.ctx) M.ctx.mostraAviso(nome.charAt(0).toUpperCase() + nome.slice(1)); }
  /* ---- rasteira ---- */
  function rasteira(J){ if(!ativo()||S.cdRast > 0)return false; const dd = d(), R = dd.rasteiraM * U; S.cdRast = 5; let n = 0;
    for(const a of X.S.alvos){ if(!hostil(a)) continue; const p = a.pos(); if(Math.hypot(p.x - J.x, p.z - J.z) > R) continue; n++; a.encantado = Math.max(a.encantado || 0, dd.rasteiraSeg); if(a.g){ const rot=a.g.rotation.clone();a.g.rotation.z = 1.35; const c=S.caidos.find(c=>c.a===a);if(c)c.t=dd.rasteiraSeg;else S.caidos.push({a,t:dd.rasteiraSeg,rot}); } }
    ((M.fauna && M.fauna.animais) || []).forEach(an => { if(Math.hypot(an.x - J.x, an.z - J.z) < R){ an.atordoado = dd.rasteiraSeg; n++; } });
    S.anim = { nome: "rasteira", t: 0, dur: .6, giro: 1, incl: .9, baixo: 1 }; X.msg("sobrenatural", n ? "Rasteira! " + n + " alvo(s) no chão por " + dd.rasteiraSeg + " s, sem ferir." : "Rasteira no ar: ninguém por perto."); if(M.ctx) M.ctx.mostraAviso(n ? "Rasteira: " + n + " no chão" : "Rasteira"); }
  /* ---- teclas: soltar o V dispara o chute ---- */
  function cancela(){S.carregando=null;}
  function finaliza(){if(!S.carregando||!ativo()||M.congelado)return false;const seg=(performance.now()-S.carregando.t0)/1000,J=M.jogador()||S.carregando.J;S.carregando=null;chuta(J,d().modoBola==="explode"?true:d().modoBola==="volta"?false:seg>=d().segurarSeg);return true;}
  function tecla(e){ if(!podeControlar() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.capoeira){ e.preventDefault(); capoeira(J); return true; } if(e.code === k.rasteira){ e.preventDefault(); rasteira(J); return true; } return false; }
  function tick(dt){ controle(); S.comboT=Math.max(0,S.comboT-dt);if(S.comboT===0)S.golpe=0; S.cdCap = Math.max(0, S.cdCap - dt); S.cdRast = Math.max(0, S.cdRast - dt); const J = M.jogador();
    if(S.bola && S.bola.visible && J){ if(S.voo){ const v = S.voo,prev=S.bola.position.clone(); v.t += dt; const k = Math.min(1, v.t / v.dur), a = v.fase === "ida" ? v.o : v.dest, b = v.fase === "ida" ? v.dest : pe(J); S.bola.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * 2 * U, a.z + (b.z - a.z) * k); S.bola.rotation.x += dt * 12; if(Math.random() < .8) faisca(S.bola.position.x, S.bola.position.y, S.bola.position.z, 2, 0xffe08a, .6 * U);
        let colidiu=false;if(v.fase==='ida'){let alvo=null,menor=Infinity;for(const a of X.S.alvos){if(!hostil(a))continue;const p=a.pos(),gy=p.y??X.chao(p.x,p.z),hit=impactoSegmento(prev,S.bola.position,p,((a.raioM||.5)+.14)*U,gy-.2*U,gy+4.5*U);if(hit!==null&&hit<menor){menor=hit;alvo=a;}}if(alvo){S.bola.position.lerpVectors(prev,S.bola.position,menor);v.dest={x:S.bola.position.x,y:S.bola.position.y,z:S.bola.position.z};v.alvo=alvo;impacto();colidiu=true;}}
        if(k >= 1&&!colidiu){ if(v.fase === "ida") impacto(); else { S.voo = null; if(M.ctx) M.ctx.mostraAviso("Bola de volta no pé — chute de novo"); } } }
      else { const p = pe(J); S.bola.position.set(p.x, p.y, p.z); S.bola.rotation.y += dt * 2; }
      if(S.luz){ S.luz.position.copy(S.bola.position); S.luz.position.y += .5 * U; S.luz.intensity = 3 + Math.sin(performance.now() / 180) * 1.2; } }
    if(S.anim){S.anim.t+=dt;if(S.anim.t>=S.anim.dur){resetPose();S.anim=null;}}
    S.caidos = S.caidos.filter(c => { c.t -= dt; if(c.t <= 0){ if(c.a.g)c.a.g.rotation.copy(c.rot); return false; } return true; });
    S.rastro = S.rastro.filter(q => { q.t += dt; const a = q.pos, v = q.vel; for(let k = 0; k < a.length; k += 3){ v[k + 1] -= q.grav * dt; a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; } q.p.geometry.attributes.position.needsUpdate = true; q.p.material.opacity = .95 * Math.max(0, 1 - q.t / q.vida); if(q.t > q.vida){ S.g.remove(q.p); q.p.geometry.dispose();q.p.material.dispose(); return false; } return true; }); }
  function limpaCaidos(){S.caidos.forEach(c=>c.a.g?.rotation.copy(c.rot));S.caidos=[];}
  function resetPose(){const r=rig();if(!r)return;if(r.tronco){r.tronco.rotation.set(0,0,0);r.tronco.position.y=2.2;}for(const q of r.pernasA?.quadril||[])q.rotation.z=0;if(r.pernasA?.grupo){r.pernasA.grupo.rotation.set(0,0,0);r.pernasA.grupo.position.y=0;}}
  // Executada depois da caminhada: a pose das pernas não é sobrescrita pelo ciclo de passos.
  function pose(){if(!ativo()||!S.anim)return;const r=rig(),A=S.anim;if(!r?.pernasA||!r.bD?.pv||!r.bE?.pv)return;const k=Math.min(1,A.t/A.dur),s=Math.sin(k*Math.PI),[qD,qE]=r.pernasA.quadril,[jD,jE]=r.pernasA.joelho;r.av.rotation.y+=A.giro*k*Math.PI*2;r.tronco.rotation.x=A.incl*s*.9;
    r.bD.pv.rotation.set(-.5*s,0,-.7*s);r.bE.pv.rotation.set(-.7*s,0,.65*s);r.bD.co.rotation.x=-.9*s;r.bE.co.rotation.x=-.6*s;
    if(A.nome==='ginga'){qD.rotation.x=-.65*s;qE.rotation.x=.50*s;jD.rotation.x=.7*s;jE.rotation.x=.5*s;r.tronco.rotation.z=Math.sin(k*Math.PI*2)*.15;}
    else if(A.nome==='meia-lua de compasso'){r.tronco.rotation.x=1.30*s;r.bD.pv.rotation.x=-2.45*s;r.bD.co.rotation.x=-.1*s;qD.rotation.x=-1.75*s;qD.rotation.z=-.45*s;jD.rotation.x=.12*s;qE.rotation.x=.25*s;jE.rotation.x=.5*s;}
    else if(A.nome==='martelo'){qD.rotation.x=-1.65*s;qD.rotation.z=-.7*s;jD.rotation.x=Math.sin(k*Math.PI*2)*1.1*s;qE.rotation.x=.15*s;jE.rotation.x=.2*s;r.tronco.rotation.z=.18*s;}
    else if(A.nome==='armada'){qE.rotation.x=-1.50*s;qE.rotation.z=.7*s;jE.rotation.x=.15*s;qD.rotation.x=.20*s;jD.rotation.x=.25*s;}
    else if(A.nome==='rasteira'){r.tronco.position.y=2.2-s*.8;r.tronco.rotation.x=.55*s;qD.rotation.z=-1.35*s;qD.rotation.x=-.25*s;jD.rotation.x=.1*s;qE.rotation.x=-1.1*s;jE.rotation.x=1.9*s;r.bE.pv.rotation.x=-2.1*s;r.bE.co.rotation.x=0;}
  }
  function podeControlar(){return ativo()&&!M.congelado&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'');}
  const el=M.renderer?.domElement;let inicio=null,botoes=[],ligado=false;
  const down=e=>{if(e.button===0&&e.pointerType!=='touch'&&podeControlar()){inicio={x:e.clientX,y:e.clientY};M.poderes?.usa();}};
  const up=e=>{if(e.button!==0)return;const p=inicio;inicio=null;if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>=6)cancela();else if(p&&podeControlar())finaliza();};
  const keyup=e=>{if(e.code===PODERES_CFG.tecla)finaliza();},blur=()=>{inicio=null;cancela();botoes=[];};
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];if(podeControlar()){if(next[7]&&!botoes[7])M.poderes?.usa();if(!next[7]&&botoes[7])finaliza();for(const [i,code]of [[5,d().teclas.capoeira],[3,d().teclas.rasteira]])if(next[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=next;}
  function liga(){if(ligado)return;ligado=true;window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);el?.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',blur);}
  function dispose(){aoTransformar('carlao',false);ligado=false;window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);el?.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',blur);S.g.children.slice().forEach(descarta);S.bola=S.luz=null;S.rastro=[];}
  liga();
  const info = () => (ativo() ? "Carlão: V chute (toque volta · segurar explode)" + (S.voo ? " · bola " + S.voo.fase : "") + " · " + d().teclas.capoeira.replace("Key", "") + " capoeira (" + d().golpes[S.golpe % d().golpes.length] + ") · " + d().teclas.rasteira.replace("Key", "") + " rasteira" + (S.cdRast > 0 ? " (" + S.cdRast.toFixed(0) + ")" : "") : "");
  return { liga, dispose, controle, pose, inicia, finaliza, cancela, chuta, capoeira, rasteira, tecla, tick, aoTransformar, info, S };
}
