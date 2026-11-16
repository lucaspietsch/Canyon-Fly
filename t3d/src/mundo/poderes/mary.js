import { alvosEmCone, descarta, hostil, impactoSegmento } from "./combate.js";
import { Group, Mesh, OctahedronGeometry, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, CanvasTexture, Vector3, SphereGeometry } from "three";
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
  const S = { ativo: false, g: new Group(), bolas: [], nuvens: [], gelos: [], cdGelo: 0, cdCombo: 0, rajadas: [], ultimaOrigem: {}, ultimoFogo: null };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.mary, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "mary" && T() && T().ativa();
  const miraDe=J=>Number.isFinite(J.camYaw)?{...J,yaw:J.camYaw+Math.PI}:J;
  const sprite=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'white');g.addColorStop(.35,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new CanvasTexture(c);})();
  function aoTransformar(id, on){ if(id !== "mary") return; S.ativo = on; }
  const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const polis=()=>M.kml?.S?.poligonos?.filter(p=>['mata','mataBaixa'].includes(p.tipo)).map(p=>p.mundoPts||p.pts).filter(p=>p?.length>2)||[];
  const naMata=(x,z)=>['mata','mataBaixa'].includes(M.vegetacao?.tipoEm?.(x,z))||polis().some(p=>emPoli(p,x,z));
  function segmentoVegetacao(de,ate){
    if(naMata(de.x,de.z)||naMata(ate.x,ate.z))return true;
    const vx=ate.x-de.x,vz=ate.z-de.z;
    for(const p of polis())for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[j],b=p[i],wx=b[0]-a[0],wz=b[1]-a[1],den=vx*wz-vz*wx;if(Math.abs(den)<1e-10)continue;const dx=a[0]-de.x,dz=a[1]-de.z,t=(dx*wz-dz*wx)/den,u=(dx*vz-dz*vx)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return true;}
    const n=Math.max(1,Math.ceil(Math.hypot(vx,vz)/(.5*U)));for(let i=1;i<n;i++)if(naMata(de.x+vx*i/n,de.z+vz*i/n))return true;
    for(const t of Object.values(M.vegetacao?.arvores?.T||{}))for(let i=0;i<t.n;i++){const y=M.cen.relevo(t.x[i],t.z[i]);if(impactoSegmento(de,ate,{x:t.x[i],z:t.z[i]},(t.r[i]||.3*U)+.20*U,y,y+t.h[i])!==null)return true;}
    return false;
  }
  function nuvem(n, cor, tam, x, y, z, esp, vy, vida, add){ const g = new BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for(let k = 0; k < n; k++){ const a = Math.random() * Math.PI * 2, r = Math.random() * esp; pos[k * 3] = x + Math.cos(a) * r; pos[k * 3 + 1] = y + Math.random() * esp * .5; pos[k * 3 + 2] = z + Math.sin(a) * r; vel[k * 3] = Math.cos(a) * esp * 1.2; vel[k * 3 + 1] = vy * (.5 + Math.random()); vel[k * 3 + 2] = Math.sin(a) * esp * 1.2; }
    g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: cor, size: tam, map:sprite, transparent: true, opacity: .9, depthWrite: false, blending: add ? AdditiveBlending : undefined })); p.frustumCulled = false; S.g.add(p); S.nuvens.push({ p, pos, vel, t: 0, vida }); }
  const mao=(J,direita)=>{const A=M.ctx?.avatar?.(),b=direita?A?.bD:A?.bE;if(b?.mao&&A.av?.getObjectById(b.mao.id)){const p=b.mao.getWorldPosition(new Vector3());p.x+=Math.sin(J.yaw)*.12*U;p.z+=Math.cos(J.yaw)*.12*U;return{x:p.x,y:p.y,z:p.z};}const lado=direita?-1:1;return{x:J.x+Math.sin(J.yaw)*.8*U+Math.cos(J.yaw)*lado*.45*U,y:J.y+1.3*U,z:J.z+Math.cos(J.yaw)*.8*U-Math.sin(J.yaw)*lado*.45*U};};
  /* ---- FOGO ---- */
  function fogo(J, dd){ if(!ativo())return false;J=miraDe(J);const alvo = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    const dest = alvo ? { x: alvo.pos().x, z: alvo.pos().z } : { x: J.x + f[0] * 30 * U, z: J.z + f[1] * 30 * U }; dest.y = X.chao(dest.x, dest.z) + 1.2 * U;
    const o = mao(J, true), n = 40, g = new BufferGeometry(), pos = new Float32Array(n * 3); g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: 0xff8a2a, size: .24 * U, map:sprite, transparent: true, opacity: .95, depthWrite: false, blending: AdditiveBlending, CanvasTexture, Vector3, SphereGeometry })); p.frustumCulled = false; S.g.add(p);
    for(let i=0;i<n;i++){pos[i*3]=o.x;pos[i*3+1]=o.y;pos[i*3+2]=o.z;}
    S.ultimaOrigem.fogo={...o};S.ultimoFogo="lancado";const core=new Mesh(new SphereGeometry(.20*U,16,12),new MeshStandardMaterial({color:0xffbc46,emissive:0xff6b13,emissiveIntensity:1.4,roughness:.5}));core.position.set(o.x,o.y,o.z);S.g.add(core);
    S.bolas.push({ p, pos, n, o, core, prev:{...o}, dest, t: 0, dur: Math.max(.25, Math.hypot(dest.x - o.x, dest.z - o.z) / (60 * U)), dd }); X.luzFx(o.x, o.y, o.z, 0xff8a2a, 5, 8 * U, .2); X.msg("sobrenatural", "Uma bola de fogo sai da mão direita de Mary."); }
  function explode(b){ const { dest, dd } = b;
    if(naMata(dest.x, dest.z)){ nuvem(30, 0xffb070, .3 * U, dest.x, dest.y, dest.z, 1.2 * U, 1.5 * U, .7, true); X.msg("sobrenatural", "O fogo toca a mata e se apaga sozinho: a floresta é protegida (regra do Boitatá)."); if(M.ctx) M.ctx.mostraAviso("O fogo se apaga na mata"); return; }
    X.luzFx(dest.x, dest.y, dest.z, 0xff7a1a, 22, 30 * U, .5); nuvem(120, 0xff6a1a, .55 * U, dest.x, dest.y, dest.z, 2.5 * U, 4 * U, .9, true); nuvem(60, 0xffd27a, .25 * U, dest.x, dest.y, dest.z, 3 * U, 6 * U, .8, true); nuvem(50, 0x55504a, 1.1 * U, dest.x, dest.y + U, dest.z, 2 * U, 2 * U, 2.2, false);
    S.ultimoFogo="explosao";const congelado=X.S.alvos.find(a=>hostil(a) && a.congelado>0 && Math.hypot(a.pos().x-dest.x,a.pos().z-dest.z)<=dd.fogoRaioM*U);
    if(congelado){vapor(congelado,dd);return;}
    for(const a of X.S.alvos){ if(!hostil(a)) continue; const q = a.pos(), dist = Math.hypot(q.x - dest.x, q.z - dest.z); if(dist > dd.fogoRaioM * U) continue; if(a.congelado > 0){ vapor(a, dd); continue; } if(a.dano) a.dano(dd.danoInimigo * (1 - dist / (dd.fogoRaioM * U) * .5)); }
    X.msg("sobrenatural", "A bola de fogo explode em área."); }
  /* ---- GELO ---- */
  function cristaliza(x, y, z, raioU, seg, alvo){ if(alvo)S.gelos=S.gelos.filter(g=>{if(g.alvo!==alvo)return true;descarta(g.grp);return false;}); const grp = new Group(); const mat = new MeshStandardMaterial({ color: 0xd8f3ff, emissive: 0x7fd0ff, emissiveIntensity: .7, roughness: .1, metalness: .2, transparent: true, opacity: .8 });
    for(let k = 0; k < 9; k++){ const c = new Mesh(new OctahedronGeometry(raioU * (.35 + Math.random() * .35), 0), mat); const a = k / 9 * Math.PI * 2; c.position.set(Math.cos(a) * raioU * .8, raioU * (.2 + Math.random() * 1.4), Math.sin(a) * raioU * .8); c.rotation.set(Math.random() * 3, Math.random() * 3, 0); grp.add(c); }
    grp.position.set(x, y, z); S.g.add(grp); S.gelos.push({ grp, t: 0, vida: seg, alvo }); nuvem(40, 0xcfefff, .2 * U, x, y + raioU, z, raioU, 1.5 * U, 1.2, true); }
  function gelo(J){ if(!ativo()||S.cdGelo > 0) return false;J=miraDe(J); const dd = d(); S.cdGelo = 2.2; const o = mao(J, false), f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    S.ultimaOrigem.gelo={...o};S.rajadas.push({o,f,t:0,proximo:0});
    const alvos=alvosEmCone(X.S.alvos,J,dd.geloM*U,dd.coneGelo,["inimigo","guardiao"]).slice(0,dd.geloAlvos);let n=0;
    for(const a of alvos){a.congelado=dd.geloSeg;a.encantado=Math.max(a.encantado||0,dd.geloSeg);const q=a.pos();cristaliza(q.x,q.y??X.chao(q.x,q.z),q.z,(a.raioM||1)*U*1.2,dd.geloSeg,a);n++;}
    const cos = Math.cos(dd.coneGelo * Math.PI / 180); ((M.fauna && M.fauna.animais) || []).forEach(an => { const dx = an.x - J.x, dz = an.z - J.z, dist = Math.hypot(dx, dz); if(dist < dd.geloM * U && dist > .1 && (dx * f[0] + dz * f[1]) / dist > cos && n < dd.geloAlvos){ an.atordoado = dd.geloSeg; cristaliza(an.x, an.y || X.chao(an.x, an.z), an.z, .9 * U, dd.geloSeg, an); n++; } });
    X.luzFx(o.x, o.y, o.z, 0x9fd8ff, 6, 14 * U, .4); X.msg("sobrenatural", n ? "A rajada de gelo congela " + n + " alvo(s) em cristais por " + dd.geloSeg + " s, sem ferir." : "A rajada de gelo cruza o ar e não acerta ninguém."); if(M.ctx) M.ctx.mostraAviso(n ? "Congelado!" : "Gelo (sem alvo)"); }
  /* ---- COMBINAÇÃO: vapor ---- */
  function vapor(a, dd){ const q = a.pos(); X.luzFx(q.x, (q.y??X.chao(q.x,q.z)) + 2 * U, q.z, 0xeaf6ff, 18, 26 * U, .5); nuvem(140, 0xf0f6ff, .9 * U, q.x, (q.y??X.chao(q.x,q.z)) + U, q.z, 3 * U, 3 * U, 1.8, false); a.congelado = 0; S.gelos.filter(g => g.alvo === a).forEach(g => { g.t = g.vida; });
    for(const b of X.S.alvos){ if(!hostil(b)) continue; const p = b.pos(), dx = p.x - q.x, dz = p.z - q.z, dist = Math.hypot(dx, dz); if(dist > dd.vaporRaioM * U) continue; if(b.congelado>0){b.congelado=0;S.gelos.filter(g=>g.alvo===b).forEach(g=>{g.t=g.vida;});} if(b.g && dist > .01){ const k = (1 - dist / (dd.vaporRaioM * U)) * 6 * U; b.g.position.x += dx / dist * k; b.g.position.z += dz / dist * k; b.g.position.y = X.chao(b.g.position.x, b.g.position.z); } if(b.dano) b.dano(b === a ? dd.vaporDano : dd.danoInimigo); }
    X.msg("sobrenatural", "Gelo + fogo: explosão de vapor! Dano e empurrão extras."); if(M.ctx) M.ctx.mostraAviso("Explosão de vapor!"); }
  function combo(J){ if(!ativo()||S.cdCombo > 0) return false;J=miraDe(J); const dd = d(), a = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]); if(!a || !(a.congelado > 0)){ if(M.ctx) M.ctx.mostraAviso("A combinação só funciona num alvo CONGELADO (E/L1 primeiro)"); return false; } S.cdCombo = 3; vapor(a, dd);return true; }
  function tecla(e){ if(!podeControlar() || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if([k.gelo,"KeyU"].includes(e.code)){ e.preventDefault(); gelo(J); return true; } if([k.combo,"KeyY"].includes(e.code)){ e.preventDefault(); combo(J); return true; } return false; }
  function tick(dt){
    controle();S.rajadas=S.rajadas.filter(r=>{r.t+=dt;while(r.proximo<12&&r.proximo*.025<=r.t){const k=r.proximo++;nuvem(5,0xbfe9ff,.15*U,r.o.x+r.f[0]*k*3*U,r.o.y,r.o.z+r.f[1]*k*3*U,.45*U,.6*U,.5,true);}return r.proximo<12;}); S.cdGelo = Math.max(0, S.cdGelo - dt); S.cdCombo = Math.max(0, S.cdCombo - dt);
    S.bolas = S.bolas.filter(b => { b.t += dt; const k = Math.min(1, b.t / b.dur), x = b.o.x + (b.dest.x - b.o.x) * k, y = b.o.y + (b.dest.y - b.o.y) * k + Math.sin(k * Math.PI) * 3 * U, z = b.o.z + (b.dest.z - b.o.z) * k;
      const agora={x,y,z};if(segmentoVegetacao(b.prev,agora)){S.ultimoFogo='vegetacao';nuvem(16,0xe8d7c0,.15*U,x,y,z,.5*U,U,.45,false);descarta(b.p);descarta(b.core);M.ctx?.mostraAviso('O fogo se apaga na vegetação');return false;}b.prev=agora;b.core.position.set(x,y,z);
      for(let i = 0; i < b.n; i++){ b.pos[i * 3] = x + (Math.random() - .5) * .9 * U; b.pos[i * 3 + 1] = y + (Math.random() - .5) * .9 * U; b.pos[i * 3 + 2] = z + (Math.random() - .5) * .9 * U; } b.p.geometry.attributes.position.needsUpdate = true; if(k >= 1){ descarta(b.p);descarta(b.core); explode(b); return false; } return true; });
    S.nuvens = S.nuvens.filter(n => { n.t += dt; const a = n.pos, v = n.vel; for(let k = 0; k < a.length; k += 3){ a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; v[k] *= (1 - dt * 1.5); v[k + 2] *= (1 - dt * 1.5); } n.p.geometry.attributes.position.needsUpdate = true; n.p.material.opacity = .9 * Math.max(0, 1 - n.t / n.vida); if(n.t > n.vida){ S.g.remove(n.p); n.p.geometry.dispose();n.p.material.dispose(); return false; } return true; });
    S.gelos = S.gelos.filter(g => { g.t += dt; if(g.alvo){const q=g.alvo.pos?g.alvo.pos():g.alvo;g.grp.position.set(q.x,q.y??X.chao(q.x,q.z),q.z);} g.grp.children.forEach(c => { c.material.opacity = .8 * Math.max(0, 1 - Math.max(0, g.t - g.vida + .6) / .6); });  if(g.t > g.vida){ if(g.alvo&&"congelado" in g.alvo)g.alvo.congelado=0;descarta(g.grp); return false; } return true; }); }
  const info = () => (ativo() ? "Mary: V fogo · " + d().teclas.gelo.replace("Key", "") + " gelo" + (S.cdGelo > 0 ? " (" + S.cdGelo.toFixed(1) + ")" : "") + " · " + d().teclas.combo.replace("Key", "") + " vapor" + (S.gelos.length ? " · " + S.gelos.length + " congelado(s)" : "") : "");
  function podeControlar(){return ativo()&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'');}
  const el=M.renderer?.domElement;let inicio=null,botoes=[],ligado=false;
  const down=e=>{if(e.button===0&&e.pointerType!=='touch'&&podeControlar())inicio={x:e.clientX,y:e.clientY,t:performance.now()};};
  const up=e=>{const p=inicio;inicio=null;if(p&&e.button===0&&podeControlar()&&performance.now()-p.t<500&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<6)M.poderes?.usa();};
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];if(pad&&podeControlar()){if(next[7]&&!botoes[7])M.poderes?.usa();for(const [i,code]of [[4,d().teclas.gelo],[5,d().teclas.combo]])if(next[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=next;}
  function liga(){if(ligado)return;ligado=true;el?.addEventListener('pointerdown',down);el?.addEventListener('pointerup',up);}
  function dispose(){ligado=false;inicio=null;el?.removeEventListener('pointerdown',down);el?.removeEventListener('pointerup',up);S.g.children.slice().forEach(descarta);S.bolas=[];S.nuvens=[];S.gelos=[];S.rajadas=[];S.ativo=false;}
  liga();
  return { fogo, gelo, combo, tecla, tick, aoTransformar, info, S, naMata, segmentoVegetacao, liga, controle, dispose };
}
