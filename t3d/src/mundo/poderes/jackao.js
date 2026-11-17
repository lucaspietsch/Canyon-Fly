import { encadeia } from "./combate.js";
import { Group, Mesh, Sprite, SpriteMaterial, CanvasTexture, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, SRGBColorSpace, EdgesGeometry, LineSegments, LineBasicMaterial, Matrix4, CylinderGeometry, Vector3 } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO JACKÃO (forma camuflada, só no tempo antigo): fuzil de balas infinitas (recarga só como animação), mira com o botão direito
   (zoom da câmera), 3 granadas por zona (fumaça + empurrão + dano em sombras; nada na mata), óculos de realidade aumentada (contorno e
   distância dos inimigos através de vegetação e névoa) e munição de choque (atordoa animais e sombras sem ferir). Teclas: data/poderes.js → jackao.
   Sem sangue: os alvos só piscam e recuam.
   ============================================================================================================ */
export function criarJackao(M, X){
  const S = { ativo: false, mirando: false, foco: 0, choque: false, oculos: false, balas: 0, recarregando: 0, granadas: 0, zona: null, fov0: null, marcas: new Map(), fumacas: [], projeteis: [], tremor: 0, gatilho: false, mouseFire: false, mouseAim: false, g: new Group() };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.jackao, T = () => M.transformacao;
  const visual = () => S.ativo ? M.personagens?.rig?.("jackao")?.p?.jackaoVisual : null;
  const miraDe = J => Number.isFinite(J.camYaw) ? {...J,yaw:J.camYaw+Math.PI} : J;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "jackao" && T() && T().ativa();
  const rotulo = (txt) => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "rgba(6,20,30,.72)"; x.fillRect(0, 0, 256, 64); x.strokeStyle = "#4fd8ff"; x.lineWidth = 3; x.strokeRect(2, 2, 252, 60); x.fillStyle = "#bff3ff"; x.font = "bold 26px ui-monospace, monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 128, 33); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; };
  function aoTransformar(id,on){if(id!=="jackao")return;S.ativo=on;if(on){S.balas=d().pente;S.recarregando=0;atualizaZona();}else{mira(false);oculos(false);S.mouseFire=S.gatilho=S.mouseAim=false;}}
  function atualizaZona(){const zona=M.zonas?.atual??"parque";if(S.zona!==zona){S.zona=zona;S.granadas=d().granadasPorZona;}}
  M.zonas?.aoMudar?.(()=>{const antiga=S.zona;atualizaZona();if(S.ativo&&antiga!==S.zona)X.msg("info","Granadas recarregadas ao trocar de zona ("+S.granadas+").");});
  /* ---- mira (botão direito) ---- */
  function mira(on){ if(on&&!ativo())return false; const cam = M.cam; if(!cam) return; if(on && !S.mirando){ S.fov0 = cam.fov; cam.fov = Math.max(18, cam.fov * .5); cam.updateProjectionMatrix(); } else if(!on && S.mirando && S.fov0){ cam.fov = S.fov0; cam.updateProjectionMatrix(); } S.mirando = on; if(!on) S.foco=0; }
  const el = M.renderer && M.renderer.domElement;
  /* ---- tiro (tecla do poder) ---- */
  function animaisNaMira(J, coneG, alcM){ const f = [Math.sin(J.yaw), Math.cos(J.yaw)], cos = Math.cos(coneG * Math.PI / 180), L = []; ((M.fauna && M.fauna.animais) || []).forEach(a => { const dx = a.x - J.x, dz = a.z - J.z, dist = Math.hypot(dx, dz); if(dist < alcM * U && dist > .1 && (dx * f[0] + dz * f[1]) / dist > cos) L.push(a); }); return L; }
  function tiro(J, dd){
    if(!ativo())return false;J=miraDe(J);
    if(S.recarregando > 0) return false; if(S.balas <= 0){ S.recarregando = dd.recargaSeg; X.msg("info", "Recarregando o fuzil…"); if(M.ctx) M.ctx.mostraAviso("Recarregando"); return false; }
    somTiro();visual()?.recuo();S.balas--; const cone = S.mirando ? dd.coneMira : dd.cone, f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    const origem=new Vector3(J.x+f[0]*2.2,J.y+4,J.z+f[1]*2.2);visual()?.bocarra.getWorldPosition(origem);
    X.luzFx(origem.x, origem.y, origem.z, 0xffd27a, 7, 9 * U, .08); S.tremor = S.mirando ? .08 : .16;      // clarão do cano e recuo
    const a = X.naMira(J, { cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]);
    if(S.choque){ const L = animaisNaMira(J, cone, dd.alcanceM); L.slice(0, 1).forEach(an => { an.atordoado = dd.choqueSeg; }); for(const q of encadeia(X.S.alvos,a,dd.choqueSaltoM*U,dd.choqueSaltos)){q.encantado=Math.max(q.encantado||0,dd.choqueSeg);const p=q.pos();X.pulso(p.x,p.z,0x7ee5ff,2);} if(L.length || a) X.msg("sobrenatural", "Munição de choque: " + (L.length ? "animal imobilizado sem ferir" : "sombra atordoada") + "."); }
    else if(a && a.dano){ const preciso=S.mirando&&S.foco>=dd.focoSeg; a.dano(dd.danoInimigo*(preciso?dd.danoPrecisao:1)); if(preciso){const p=a.pos();X.pulso(p.x,p.z,0x4fd8ff,2.5);M.ctx?.mostraAviso("Tiro preciso!");} }
    S.foco=0;
    if(S.balas === 0){ S.recarregando = dd.recargaSeg; X.msg("info", "Pente vazio: recarregando…"); }
  }
  /* ---- granada ---- */
  function fumaca(x, y, z){ const n = 90, pos = new Float32Array(n * 3), g = new BufferGeometry(); for(let k = 0; k < n; k++){ pos[k * 3] = x + (Math.random() - .5) * 4 * U; pos[k * 3 + 1] = y + Math.random() * 2 * U; pos[k * 3 + 2] = z + (Math.random() - .5) * 4 * U; } g.setAttribute("position", new BufferAttribute(pos, 3));
    const p = new Points(g, new PointsMaterial({ color: 0x9a9a92, size: 1.6 * U, transparent: true, opacity: .55, depthWrite: false })); p.frustumCulled = false; S.g.add(p); S.fumacas.push({ p, pos, t: 0, vida: 7 }); }
  function granada(J){ if(!ativo())return false;J=miraDe(J); if(S.granadas <= 0){ if(M.ctx) M.ctx.mostraAviso("Sem granadas nesta zona (recarregam ao trocar de zona)"); return false; } S.granadas--; const dd = d(), f = [Math.sin(J.yaw), Math.cos(J.yaw)], gx = J.x + f[0] * dd.granadaM * U, gz = J.z + f[1] * dd.granadaM * U, gy = X.chao(gx, gz);
    X.msg("info", "Granada lançada (" + S.granadas + " restante(s))."); if(M.ctx) M.ctx.mostraAviso("Granada! (" + S.granadas + " restantes)");
    const mesh=new Group(),metal=new MeshStandardMaterial({color:0x4a5038,roughness:.6,metalness:.3}),corpo=new Mesh(new SphereGeometry(.15*U,16,12),metal);corpo.scale.y=1.25;mesh.add(corpo);const topo=new Mesh(new CylinderGeometry(.065*U,.08*U,.12*U,12),new MeshBasicMaterial({color:0x202321}));topo.position.y=.21*U;mesh.add(topo);mesh.position.set(J.x,J.y+3*U,J.z);S.g.add(mesh);
    S.projeteis.push({mesh,t:0,vida:dd.granadaSeg,x0:J.x,y0:J.y+3*U,z0:J.z,gx,gy,gz});return true;
  }
  function explode(p){const {gx,gy,gz}=p,dd=d();X.luzFx(gx,gy+2*U,gz,0xffa040,26,40*U,.5);fumaca(gx,gy,gz);S.tremor=.5;somTiro(true);const R=dd.granadaRaioM*U;
    for(const a of X.S.alvos){if(a.morto||!["inimigo","guardiao"].includes(a.tipo))continue;const q=a.pos(),dx=q.x-gx,dz=q.z-gz,dist=Math.hypot(dx,dz);if(dist>R)continue;const k=(1-dist/R)*8*U,inv=dist>.01?1/dist:0;const obj=a.rig?.av||a.g;if(obj){obj.position.x+=(inv?dx*inv:1)*k;obj.position.z+=dz*inv*k;obj.position.y=X.chao(obj.position.x,obj.position.z);if(typeof a.x==="number")a.x=obj.position.x;if(typeof a.z==="number")a.z=obj.position.z;}a.dano?.(dd.danoInimigo*3);}
    descarta(p.mesh);X.msg("sobrenatural","A explosão empurra as ameaças; a mata fica intacta.");
  }
  function descarta(g){g.removeFromParent();g.traverse(o=>{if(!o.isSprite)o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});}
  /* ---- óculos de realidade aumentada ---- */
  function oculos(on){ if(on&&!ativo())return false; S.oculos = on; if(!on){ S.marcas.forEach(limpaMarca); S.marcas.clear(); } X.msg("info", on ? "Óculos de RA ligados: inimigos marcados através da mata e da névoa." : "Óculos de RA desligados."); if(M.ctx) M.ctx.mostraAviso(on ? "Óculos de RA ligados" : "Óculos de RA desligados"); }
  function atualizaMarcas(J,dt){ const R = d().oculosM * U, vivos = new Set();
    for(const a of X.S.alvos){ if(a.morto || !(a.tipo === "inimigo" || a.tipo === "guardiao")) continue; const p = a.pos(), dist = Math.hypot(p.x - J.x, p.z - J.z); if(dist > R) continue; vivos.add(a);
      let m = S.marcas.get(a); const txt = (a.nome || "alvo").toUpperCase().slice(0, 14) + " " + Math.round(dist / U) + " m";
      if(!m){const sp=new Sprite(new SpriteMaterial({map:rotulo(txt),depthTest:false,depthWrite:false,transparent:true,fog:false}));sp.scale.set(4.2*U,1.05*U,1);sp.renderOrder=1001;S.g.add(sp);
        const aro=new Group(),linhas=[],raiz=a.rig?.av||a.g,material=new LineBasicMaterial({color:0x4fd8ff,depthTest:false,depthWrite:false,transparent:true,opacity:.90,fog:false});S.g.add(aro);raiz?.traverse(o=>{if(o.isMesh){const l=new LineSegments(new EdgesGeometry(o.geometry,8),material);l.matrixAutoUpdate=false;l.renderOrder=1000;aro.add(l);linhas.push({src:o,line:l});}});
        if(!linhas.length){const l=new Mesh(new SphereGeometry((a.raioM||1)*U*1.3,16,12),new MeshBasicMaterial({color:0x4fd8ff,wireframe:true,depthTest:false,depthWrite:false,transparent:true,opacity:.8,fog:false}));l.renderOrder=1000;aro.add(l);}
        m={sp,aro,linhas,material,txt,t:0};S.marcas.set(a,m);
      }
      m.t+=dt;if(m.txt!==txt&&m.t>=.15){m.t=0;m.txt=txt;m.sp.material.map.dispose();m.sp.material.map=rotulo(txt);m.sp.material.needsUpdate=true;}
      m.sp.position.set(p.x,(p.y||0)+((a.alturaM||1.5)+1.6)*U,p.z);
      if(m.linhas.length){S.g.updateWorldMatrix(true,false);const inv=new Matrix4().copy(S.g.matrixWorld).invert();for(const l of m.linhas){l.src.updateWorldMatrix(true,false);l.line.matrix.copy(inv).multiply(l.src.matrixWorld);}}
      else m.aro.position.set(p.x,(p.y||0)+(a.alturaM||1.5)*U*.5,p.z);
    }
    S.marcas.forEach((m, a) => { if(!vivos.has(a)){ limpaMarca(m); S.marcas.delete(a); } }); }
  function limpaMarca(m){descarta(m.sp);descarta(m.aro);m.material.dispose();}
  function tecla(e){ if(!podeControlar() || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if([k.granada,"KeyY"].includes(e.code)){ e.preventDefault(); granada(J); return true; } if([k.oculos,"KeyU"].includes(e.code)){ e.preventDefault(); oculos(!S.oculos); return true; }
    if([k.choque,"KeyI"].includes(e.code)){ e.preventDefault(); S.choque = !S.choque; X.msg("info", S.choque ? "Munição de choque: atordoa sem ferir." : "Munição comum."); if(M.ctx) M.ctx.mostraAviso(S.choque ? "Munição de choque" : "Munição comum"); return true; } return false; }
  function tick(dt){
    atualizaZona();controle();if(podeControlar()&&(S.gatilho||S.mouseFire))M.poderes?.usa();
    S.projeteis=S.projeteis.filter(p=>{p.t+=dt;const k=Math.min(1,p.t/p.vida);p.mesh.position.set(p.x0+(p.gx-p.x0)*k,p.y0+(p.gy-p.y0)*k+Math.sin(k*Math.PI)*3*U,p.z0+(p.gz-p.z0)*k);p.mesh.rotation.x+=dt*6;if(k>=1){explode(p);return false;}return true;});
    visual()?.recarregar(S.recarregando>0?1-S.recarregando/d().recargaSeg:0); S.foco=ativo()&&S.mirando?Math.min(d().focoSeg,S.foco+dt):0; if(S.recarregando > 0){ S.recarregando -= dt; if(S.recarregando <= 0){ S.balas = d().pente; X.msg("info", "Fuzil recarregado."); } }
    if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .4; c.position.y += (Math.random() - .5) * S.tremor * .4; } }
    S.fumacas = S.fumacas.filter(f => { f.t += dt; const a = f.pos; for(let k = 0; k < a.length; k += 3){ a[k + 1] += dt * .9 * U; a[k] += (Math.random() - .5) * dt * U; } f.p.geometry.attributes.position.needsUpdate = true; f.p.material.opacity = .55 * Math.max(0, 1 - f.t / f.vida); if(f.t > f.vida){ S.g.remove(f.p); f.p.geometry.dispose(); f.p.material.dispose(); return false; } return true; });
    if(S.oculos){ const J = M.jogador(); if(J && ativo()) atualizaMarcas(J,dt); else oculos(false); } }
  const info = () => (ativo() ? "Jackão: " + (S.recarregando > 0 ? "recarregando" : S.balas + " balas") + (S.mirando ? (S.foco>=d().focoSeg?" · PRECISÃO PRONTA":" · estabilizando mira") : "") + (S.choque ? " · CHOQUE" : "") + " · granadas " + S.granadas + " · óculos RA " + (S.oculos ? "ON (" + S.marcas.size + " marcado(s))" : "off") : "");
  function podeControlar(){return ativo()&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||"");}
  let audio=null,volume=null,buttons=[];
  function somTiro(explosao=false){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audio){audio=new AC();volume=audio.createGain();volume.gain.value=.20;volume.connect(audio.destination);}audio.resume().catch(()=>{});const t=audio.currentTime,dur=explosao?.65:.16,n=audio.sampleRate*dur|0,buf=audio.createBuffer(1,n,audio.sampleRate),out=buf.getChannelData(0);let smooth=0;for(let i=0;i<n;i++){smooth=smooth*.55+(Math.random()*2-1)*.45;out[i]=smooth*Math.exp(-i/n*6);}const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buf;filter.type='lowpass';filter.frequency.value=explosao?600:2400;gain.gain.setValueAtTime(explosao?1:.65,t);gain.gain.exponentialRampToValueAtTime(.001,t+dur);source.connect(filter);filter.connect(gain);gain.connect(volume);source.start();const osc=audio.createOscillator(),mech=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(explosao?65:180,t);osc.frequency.exponentialRampToValueAtTime(40,t+.12);mech.gain.setValueAtTime(.4,t);mech.gain.exponentialRampToValueAtTime(.001,t+.15);osc.connect(mech);mech.connect(volume);osc.start();osc.stop(t+.16);}catch(_){/* áudio indisponível: mantém a partida */}}
  const context=e=>{if(podeControlar())e.preventDefault();};
  const down=e=>{if(!podeControlar()||e.pointerType==='touch')return;if(e.button===2){e.preventDefault();S.mouseAim=true;mira(true);}if(e.button===0){S.mouseFire=true;M.poderes?.usa();}};
  const up=e=>{if(e.button===2){S.mouseAim=false;mira(false);}if(e.button===0)S.mouseFire=false;};
  const blur=()=>{S.mouseFire=S.gatilho=S.mouseAim=false;mira(false);};
  let ligado=false;
  function liga(){if(ligado)return;ligado=true;el?.addEventListener('contextmenu',context);el?.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',blur);window.addEventListener('blur',blur);}
  liga();
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];S.gatilho=podeControlar()&&!!next[7];if(pad&&podeControlar()){mira(!!next[6]||S.mouseAim);for(const [i,code]of [[5,d().teclas.granada],[4,d().teclas.oculos],[3,d().teclas.choque]])if(next[i]&&!buttons[i])tecla({code,preventDefault(){}});}else if(buttons[6])mira(S.mouseAim);buttons=next;}
  function dispose(){ligado=false;aoTransformar('jackao',false);S.projeteis.forEach(p=>descarta(p.mesh));S.projeteis=[];S.fumacas.forEach(f=>descarta(f.p));S.fumacas=[];el?.removeEventListener('contextmenu',context);el?.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',blur);window.removeEventListener('blur',blur);audio?.close().catch(()=>{});audio=null;}
  return { tiro, granada, oculos, mira, tecla, tick, aoTransformar, info, S, controle, dispose, liga };
}
