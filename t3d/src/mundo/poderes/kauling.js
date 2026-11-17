import { hostil, descarta } from './combate.js';
import { Group, Mesh, TorusGeometry, MeshBasicMaterial, AdditiveBlending } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO KAULING (forma Peão gaúcho, só no tempo antigo): GRITO forte (tecla do poder, V) — anéis de som visíveis saem da boca e
   ARREMESSAM os inimigos no cone à frente, e a vegetação balança (rajada de vento); CRESCER (E/L1) — fica crescerX vezes maior por crescerSeg s:
   a câmera se afasta, cada passo treme a câmera, os gritos ficam mais fortes; dentro da mata (copas baixas) ele encolhe sozinho;
   GRITO CURTO (F/Triângulo) — atordoa animais enfeitiçados e sombras sem ferir. Falas gaúchas no terminal a cada uso.
   ============================================================================================================ */
export function criarKauling(M, X){
  const S = { ativo: false, dono: null, escalaBase: null, cdPisao: 0, esc: 1, alvoEsc: 1, tCresc: 0, aneis: [], voando: [], tremor: 0, cdCurto: 0, ultX: 0, ultZ: 0, passo: 0, g: new Group() };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.kauling, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "kauling" && T() && T().ativa();
  const fala = () => { const F = d().falas; X.msg("info", "Kauling: “" + F[Math.floor(Math.random() * F.length)] + "”"); };
  const avatar = () => { const am = M.H && M.H.andarMod; const A = am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); return A && A.av ? A.av : null; };
  function aoTransformar(id,on){if(id!=="kauling")return;S.ativo=on;if(on){S.dono=avatar();S.escalaBase=S.dono?.scale.clone();S.ultX=M.jogador()?.x||0;S.ultZ=M.jogador()?.z||0;S.passo=0;}else{S.tremor=0;limpaVoos();encolhe(true);if(S.dono&&S.escalaBase)S.dono.scale.copy(S.escalaBase);S.dono=null;S.escalaBase=null;S.esc=1;}}
  const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  function copaBaixa(J,esc=d().crescerX){const altura=5.9*.92*esc,terreno=X.chao(J.x,J.z),arvores=M.vegetacao?.arvores?.T;for(const [nome,t]of Object.entries(arvores||{})){if(nome==='arbusto')continue;for(let i=0;i<t.n;i++){const copa=t.h[i]*(nome==='araucaria'?.70:.40),raio=Math.max(t.r[i]||0,t.h[i]*.22);if(Math.hypot(J.x-t.x[i],J.z-t.z[i])<raio+.8*U*esc&&X.chao(t.x[i],t.z[i])+copa<terreno+altura)return true;}}
    return (M.kml?.S?.poligonos||[]).some(p=>p.tipo==='mataBaixa'&&emPoli(p.mundoPts||p.pts||[],J.x,J.z));}
  const mira=J=>({...J,yaw:Number.isFinite(J.camYaw)?J.camYaw+Math.PI:J.yaw});
  /* ---- anéis de som ---- */
  function aneis(J, n, raioMax, cor){ J=mira(J); const f = [Math.sin(J.yaw), Math.cos(J.yaw)], bx = J.x + f[0] * .6 * .92 * S.esc, by = J.y + 4.65 * .92 * S.esc, bz = J.z + f[1] * .6 * .92 * S.esc;
    for(let k = 0; k < n; k++){ const m = new Mesh(new TorusGeometry(.22 * U, .035 * U, 8, 36), new MeshBasicMaterial({ color: cor, transparent: true, opacity: .75, blending: AdditiveBlending, depthWrite: false })); m.position.set(bx, by, bz); m.lookAt(bx + f[0], by, bz + f[1]); m.visible=k===0;S.g.add(m); S.aneis.push({ m, t: -k * .12, vida: .9, f, raioMax, o: [bx, by, bz] }); } }
  function empurra(J,raioM,forca,dano){J=mira(J);const f=[Math.sin(J.yaw),Math.cos(J.yaw)],cos=Math.cos(d().cone*Math.PI/180/2);let n=0;for(const a of X.S.alvos){if(!hostil(a))continue;const p=a.pos(),dx=p.x-J.x,dz=p.z-J.z,dist=Math.hypot(dx,dz);if(dist>raioM*U||(dist>.01&&(dx*f[0]+dz*f[1])/dist<cos))continue;n++;const ant=S.voando.find(v=>v.a===a);if(ant){restaura(ant);S.voando=S.voando.filter(v=>v!==ant);}if(a.g){const v=(1-dist/(raioM*U)*.5)*d().empurraM*U*forca;S.voando.push({a,vx:(dist>.01?dx/dist:f[0])*v,vz:(dist>.01?dz/dist:f[1])*v,vy:8*U,t:0,enc0:a.encantado||0,rot:a.g.rotation.clone()});a.encantado=999;}a.dano?.(dano);}return n;}
  function restaura(v){v.a.encantado=v.enc0;v.a.g.rotation.copy(v.rot);const p=v.a.g.position;p.y=X.chao(p.x,p.z);}
  function limpaVoos(){S.voando.forEach(restaura);S.voando=[];}
  /* ---- GRITO forte ---- */
  function grito(J, dd=d()){ if(!ativo())return false;som(false); const forte = S.esc > 1.5 ? 1.7 : 1; aneis(J, 5, dd.empurraM * U, 0xf0f0e0); const n = empurra(J, dd.alcanceM * forte, forte, dd.danoInimigo * forte);
    if(M.vento && M.vento.forca) M.vento.forca("rajada"); X.luzFx(J.x, J.y + 4 * U, J.z, 0xfff2d0, 6, 20 * U, .4); S.tremor = .35 * forte; fala();
    X.msg("sobrenatural", "O grito ensurdecedor do Kauling arremessa " + n + " alvo(s) e sacode o capim e as copas." + (forte > 1 ? " (gigante: ainda mais forte)" : "")); if(M.ctx) M.ctx.mostraAviso(n ? "Grito! " + n + " arremessado(s)" : "Grito!"); }
  /* ---- GRITO curto: atordoa sem ferir ---- */
  function curto(J){ if(!ativo()||S.cdCurto > 0)return false; const dd = d();som(true); S.cdCurto = 6; aneis(J, 3, dd.gritoCurtoM * U, 0xcfe8ff); let n = 0; const R = dd.gritoCurtoM * U;
    ((M.fauna && M.fauna.animais) || []).forEach(a => { if(Math.hypot(a.x - J.x, a.z - J.z) < R){ a.atordoado = dd.atordoaSeg; n++; } });
    for(const a of X.S.alvos){ if(!a.morto && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < R){ a.encantado = Math.max(a.encantado || 0, dd.atordoaSeg); n++; } }
    fala(); X.msg("sobrenatural", "Grito curto: " + n + " alvo(s) param no lugar por " + dd.atordoaSeg + " s, sem ferir."); if(M.ctx) M.ctx.mostraAviso("Grito curto: " + n + " atordoado(s)"); }
  /* ---- CRESCER ---- */
  function cresce(){if(!ativo())return false;const J=M.jogador();if(J&&copaBaixa(J)){M.ctx?.mostraAviso("Copas baixas: sem espaço para crescer");return false;} const dd = d(); S.alvoEsc = dd.crescerX; S.tCresc = dd.crescerSeg; fala(); X.msg("sobrenatural", "Kauling cresce " + dd.crescerX + "× por " + dd.crescerSeg + " s: passos pesados, gritos mais fortes."); if(M.ctx) M.ctx.mostraAviso("Gigante! (" + dd.crescerSeg + " s · E encolhe)"); }
  function encolhe(silencio){ if(S.alvoEsc === 1 && S.esc === 1) return; S.alvoEsc = 1; S.tCresc = 0; if(!silencio){ X.msg("info", "Kauling volta ao tamanho normal."); if(M.ctx) M.ctx.mostraAviso("Tamanho normal"); } }
  function tecla(e){ if(!podeControlar() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.crescer){ e.preventDefault(); if(S.alvoEsc > 1) encolhe(false); else cresce(); return true; } if(e.code === k.curto){ e.preventDefault(); curto(J); return true; } return false; }
  function tick(dt){ controle(); S.cdPisao=Math.max(0,S.cdPisao-dt); S.cdCurto = Math.max(0, S.cdCurto - dt);
    if(S.tCresc > 0){ S.tCresc -= dt; if(S.tCresc <= 0) encolhe(false); }
    const J = M.jogador();
    if(S.alvoEsc > 1 && J && copaBaixa(J)){ encolhe(true); X.msg("info", "Copas baixas: Kauling encolhe para passar pela mata."); if(M.ctx) M.ctx.mostraAviso("Copas baixas: encolheu"); }
    if(!ativo() && S.alvoEsc > 1) S.alvoEsc = 1;
    S.esc += (S.alvoEsc - S.esc) * Math.min(1, dt * (S.alvoEsc===1?10:2.5));if(Math.abs(S.esc-S.alvoEsc)<.001)S.esc=S.alvoEsc; if(S.dono&&S.escalaBase)S.dono.scale.copy(S.escalaBase).multiplyScalar(S.esc);
    if(S.esc > 1.3 && J){ const mov = Math.hypot(J.x - S.ultX, J.z - S.ultZ); S.passo += mov; if(S.passo > 3 * U * S.esc){ S.passo = 0; S.tremor = Math.max(S.tremor, .18 * S.esc); if(ativo()&&S.cdPisao===0){S.cdPisao=d().pisaoRecarga;X.pulso(J.x,J.z,0xf0e0b0,d().pisaoM);for(const a of X.S.alvos){if(!a.morto&&Math.hypot(a.pos().x-J.x,a.pos().z-J.z)<d().pisaoM*U)a.encantado=Math.max(a.encantado||0,d().pisaoSeg);}for(const a of M.fauna?.animais||[]){if(Math.hypot(a.x-J.x,a.z-J.z)<d().pisaoM*U)a.atordoado=Math.max(a.atordoado||0,d().pisaoSeg);}} } } S.ultX = J ? J.x : 0; S.ultZ = J ? J.z : 0;
    S.tremor=Math.max(0,S.tremor-dt);
    S.voando=S.voando.filter(v=>{if(!v.a.g||v.a.morto){restaura(v);return false;}v.t+=dt;const p=v.a.g.position;v.vy-=20*U*dt;p.x+=v.vx*dt;p.z+=v.vz*dt;p.y+=v.vy*dt;v.a.encantado=999;const y=X.chao(p.x,p.z);if(p.y<=y||v.t>5){restaura(v);return false;}return true;});
    S.aneis = S.aneis.filter(a => { a.t += dt; if(a.t < 0) return true;a.m.visible=true; const k = a.t / a.vida, r = .22 * U + k * a.raioMax * .5; a.m.scale.setScalar(r / (.22 * U)); a.m.position.set(a.o[0] + a.f[0] * k * a.raioMax * .9, a.o[1], a.o[2] + a.f[1] * k * a.raioMax * .9); a.m.material.opacity = .75 * (1 - k); if(k >= 1){ S.g.remove(a.m); a.m.geometry.dispose();a.m.material.dispose(); return false; } return true; }); }
  function podeControlar(){return ativo()&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'');}
  let audio=null;
  function som(curto){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio||=new AC();audio.resume().catch(()=>{});const t=audio.currentTime,dur=curto?.22:.65,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(curto?160:105,t);osc.frequency.exponentialRampToValueAtTime(curto?75:48,t+dur);const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=curto?650:900;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(curto?.035:.06,t+.03);gain.gain.exponentialRampToValueAtTime(.001,t+dur);osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(t+dur);}catch(_){}}
  const el=M.renderer?.domElement;let inicio=null,botoes=[],ligado=false;
  const down=e=>{if(e.button===0&&e.pointerType!=='touch'&&podeControlar())inicio={x:e.clientX,y:e.clientY,t:performance.now()};};
  const up=e=>{const p=inicio;inicio=null;if(p&&e.button===0&&podeControlar()&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<6&&performance.now()-p.t<500)M.poderes?.usa();};
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];if(pad&&podeControlar()){if(next[7]&&!botoes[7])M.poderes?.usa();for(const [i,code]of [[4,d().teclas.crescer],[3,d().teclas.curto]])if(next[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=next;}
  function liga(){if(ligado)return;ligado=true;el?.addEventListener('pointerdown',down);el?.addEventListener('pointerup',up);}
  function dispose(){audio?.close().catch(()=>{});audio=null;aoTransformar('kauling',false);ligado=false;inicio=null;botoes=[];el?.removeEventListener('pointerdown',down);el?.removeEventListener('pointerup',up);S.g.children.slice().forEach(descarta);S.aneis=[];}
  liga();
  const escala = () => S.esc;
  const info = () => (ativo() ? "Kauling: V grito · " + d().teclas.crescer.replace("Key", "") + (S.esc > 1.3 ? " encolher (gigante " + S.esc.toFixed(1) + "×, " + Math.ceil(S.tCresc) + " s)" : " crescer") + " · " + d().teclas.curto.replace("Key", "") + " grito curto" + (S.cdCurto > 0 ? " (" + S.cdCurto.toFixed(0) + ")" : "") : "");
  return { liga, dispose, controle, copaBaixa, grito, curto, cresce, encolhe, tecla, tick, aoTransformar, info, escala, S };
}
