import { emCone, hostil } from "./combate.js";
import { Group, Mesh, SphereGeometry, CircleGeometry, MeshStandardMaterial, MeshBasicMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, CanvasTexture, PlaneGeometry, TubeGeometry, CatmullRomCurve3, Vector3, DoubleSide } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO MOHR (forma Rubro, só no tempo antigo): ONDA (tecla do poder, V) puxa água de rio/arroio/poça por perto (mais forte) ou do chão
   úmido e lança uma onda com espuma e respingos que empurra e derruba; AVALANCHE (Y) faz terra e pedras descerem a encosta à frente com física
   simples (só onde há declive; avisa se não houver); LAMA (I) prende os pés de sombras e imobiliza animais enfeitiçados sem ferir.
   Som grave de terra deslizando por Web Audio (ruído filtrado). As linhas da roupa brilham a cada uso (rig.fx.pulsa).
   ============================================================================================================ */
export function criarMohr(M, X){
  const S = { ativo: false, g: new Group(), ondas: [], pedras: [], poeiras: [], lamas: [], tremor: 0, cdAval: 0, cdLama: 0, audio: null, cristas: [], captacoes: [], ultimaOnda: null, ultimaAvalanche: null };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.mohr, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "mohr" && T() && T().ativa();
  const pulsa = () => { const r = M.personagens.rig("mohr"); if(r && r.fx && r.fx.pulsa) r.fx.pulsa(); };
  function aoTransformar(id, on){ if(id !== "mohr") return; S.ativo = on; }
  const relevo = (x, z) => M.cen.relevo(x, z);
  const sprite=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,1,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.65)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new CanvasTexture(c);})();
  const miraDe=J=>Number.isFinite(J.camYaw)?{...J,yaw:J.camYaw+Math.PI}:J;
  function particulas(n, cor, tam, add){ const g = new BufferGeometry(), pos = new Float32Array(n * 3); g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: cor, size: tam, map:sprite, transparent: true, opacity: .9, depthWrite: false, blending: add ? AdditiveBlending : undefined })); p.frustumCulled = false; S.g.add(p); return { p, pos, n, vel: new Float32Array(n * 3) }; }
  /* ---- som grave (ruído filtrado), criado só no primeiro uso ---- */
  function somTerra(dur = 1.6, vol = .35, freq = 110){ try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; S.audio = S.audio || new AC(); const ac = S.audio; if(ac.state === "suspended") ac.resume().catch(()=>{});
      const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0); for(let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ac.createBufferSource(); src.buffer = buf; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq; const g = ac.createGain(); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(ac.destination); src.start(); }catch(_){ /* sem áudio */ } }
  /* ---- água por perto? ---- */
  function fonteAgua(J){const R=d().aguaPertoM*U,candidatos=[];
    const confere=(x,z)=>{const a=M.cen.agua?.(x,z);if(a?.dentro||(M.zonas?.profAgua?.(x,z)||0)>.05){const dist=Math.hypot(x-J.x,z-J.z);if(dist<=R)candidatos.push({x,z,y:a?.y??X.chao(x,z),tipo:a?.poco?'poca':'rio',dist});}};
    confere(J.x,J.z);
    for(const pts of [M.cen.terreno?.caminho,...['ARROIO','TIGRE','FORT'].map(k=>M.cen.rios?.[k])].filter(Array.isArray)){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],q=Math.max(0,Math.min(1,((J.x-a[0])*dx+(J.z-a[1])*dz)/(dx*dx+dz*dz||1)));confere(a[0]+dx*q,a[1]+dz*q);}}
    for(const p of M.cen.pocos||[])confere(p.x,p.z);
    for(let r=1;r<=4;r++)for(let k=0;k<32;k++){const a=k/32*Math.PI*2;confere(J.x+Math.cos(a)*R*r/4,J.z+Math.sin(a)*R*r/4);}
    candidatos.sort((a,b)=>a.dist-b.dist);return candidatos[0]||null;
  }
  const aguaPerto=J=>!!fonteAgua(J);
  function empurra(cx, cz, f, raioM, forca, dano, terrestre=false){ for(const a of X.S.alvos){ if(!hostil(a)) continue; const p = a.pos(), dx = p.x - cx, dz = p.z - cz, dist = Math.hypot(dx, dz); if(dist > raioM * U) continue; if(f && dist>.01 && (dx * f[0] + dz * f[1]) / dist < Math.cos(d().cone*Math.PI/180)) continue; const k = (1 - dist / (raioM * U)) * forca * 7 * U; if(a.g){ a.g.position.x += (f ? f[0] : (dist>.01?dx/dist:1)) * k; a.g.position.z += (f ? f[1] : (dist>.01?dz/dist:0)) * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); a.g.rotation.z = (Math.random() - .5) * .9; } if(dano && a.dano && hostil(a)) a.dano(dano*(terrestre&&a.encharcado>0?d().bonusEncharcado:1)); } }
  /* ---- ONDA ---- */
  function onda(J, dd){ if(!ativo())return false;J=miraDe(J);const fonte=fonteAgua(J),agua=!!fonte, forca = agua ? dd.fatorAgua : 1, f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    for(const a of X.S.alvos){if(hostil(a)&&emCone(J,a.pos(),dd.empurraM*forca*U,dd.cone)){a.encharcado=dd.encharcadoSeg;a.encantado=Math.max(a.encantado||0,dd.quedaSeg);const p=a.pos();X.pulso(p.x,p.z,0x72c8ff,2);}}
    S.ultimaOnda={fonte:fonte?.tipo||'umidade',forca,alcanceM:dd.empurraM*forca};
    const crista=new Group(),geo=new PlaneGeometry(7*U,2.3*U,28,14),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i)/U+1.15;p.setZ(i,Math.sin(y/2.3*Math.PI)*.65*U);p.setY(i,y*U);}geo.computeVertexNormals();
    crista.add(new Mesh(geo,new MeshBasicMaterial({color:agua?0x57b5de:0x8baeb9,transparent:true,opacity:.36,depthWrite:false,side:DoubleSide})));
    const espuma=new Mesh(new TubeGeometry(new CatmullRomCurve3(Array.from({length:20},(_,i)=>new Vector3((i/19-.5)*7*U,(2.2-Math.abs(i/19-.5)*.3)*U,Math.sin(i*.8)*.10*U))),40,.08*U,8,false),new MeshBasicMaterial({color:0xecfaff,transparent:true,opacity:.8,depthWrite:false}));crista.add(espuma);crista.position.set(J.x+f[0]*2*U,J.y+.2*U,J.z+f[1]*2*U);crista.rotation.y=J.yaw;S.g.add(crista);S.cristas.push({g:crista,t:0,vida:1.4,vx:f[0]*9*U*forca,vz:f[1]*9*U*forca});
    if(fonte){const tubo=new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(fonte.x,fonte.y+.1,fonte.z),new Vector3((fonte.x+J.x)/2,Math.max(fonte.y,J.y)+2*U,(fonte.z+J.z)/2),new Vector3(J.x,J.y+2*U,J.z)]),32,.12*U,7,false),new MeshBasicMaterial({color:0x8dd9f0,transparent:true,opacity:.55,depthWrite:false}));S.g.add(tubo);S.captacoes.push({g:tubo,t:0,vida:.7});}
    const P = particulas(160, agua ? 0x8fd4ff : 0x9ab8c8, .32 * U, true), esp = particulas(90, 0xffffff, .22 * U, true);
    for(let k = 0; k < P.n; k++){ const s = (k / P.n - .5) * 7 * U, h = Math.random() * 2.2 * U; P.pos[k * 3] = J.x + f[0] * 2 * U - f[1] * s; P.pos[k * 3 + 1] = J.y + .3 * U + h; P.pos[k * 3 + 2] = J.z + f[1] * 2 * U + f[0] * s; P.vel[k * 3] = f[0] * 9 * U * forca; P.vel[k * 3 + 1] = 1.5 * U + Math.random() * U; P.vel[k * 3 + 2] = f[1] * 9 * U * forca; }
    for(let k = 0; k < esp.n; k++){ esp.pos[k * 3] = J.x + f[0] * 3 * U + (Math.random() - .5) * 5 * U; esp.pos[k * 3 + 1] = J.y + Math.random() * 3 * U; esp.pos[k * 3 + 2] = J.z + f[1] * 3 * U + (Math.random() - .5) * 5 * U; esp.vel[k * 3] = f[0] * 7 * U; esp.vel[k * 3 + 1] = 3 * U + Math.random() * 2 * U; esp.vel[k * 3 + 2] = f[1] * 7 * U; }
    S.ondas.push({ P, t: 0, vida: 1.4 }, { P: esp, t: 0, vida: 1.1 });
    X.luzFx(J.x + f[0] * 4 * U, J.y + 2 * U, J.z + f[1] * 4 * U, 0x9fd8ff, 6, 18 * U, .5); empurra(J.x, J.z, f, dd.empurraM * forca, forca, dd.danoInimigo*forca); somTerra(1.1, .25, 400); pulsa(); S.tremor = .2;
    X.msg("sobrenatural", agua ? "Mohr puxa a água do arroio e lança uma onda com espuma: mais forte perto de água de verdade." : "Mohr arranca a umidade do chão e lança uma onda."); if(M.ctx) M.ctx.mostraAviso(agua ? "Onda forte (água por perto)" : "Onda"); }
  /* ---- AVALANCHE ---- */
  function avalanche(J){ if(!ativo()||S.cdAval > 0) return false;J=miraDe(J); const dd = d(), f = [Math.sin(J.yaw), Math.cos(J.yaw)], ax = J.x + f[0] * dd.avalancheM * U, az = J.z + f[1] * dd.avalancheM * U, e = 4 * U;
    const gx = (relevo(ax + e, az) - relevo(ax - e, az)) / (2 * e), gz = (relevo(ax, az + e) - relevo(ax, az - e)) / (2 * e), decl = Math.hypot(gx, gz);
    if(decl < dd.declivMin){ if(M.ctx) M.ctx.mostraAviso("Sem encosta aqui: a avalanche precisa de um declive (" + (decl * 100).toFixed(0) + "% < " + (dd.declivMin * 100).toFixed(0) + "%)"); X.msg("info", "Avalanche: sem declive suficiente à frente."); return false; }
    S.cdAval = 6; const desce = [-gx / decl, -gz / decl], sx = ax + gx / decl * 10 * U, sz = az + gz / decl * 10 * U;              // nasce encosta acima e desce no sentido da queda
    S.ultimaAvalanche={decl,sx,sz};
    const pedra = new MeshStandardMaterial({ color: 0x6e6a60, roughness: .95 });
    for(let k = 0; k < dd.pedras; k++){ const r = (.25 + Math.random() * .55) * U, m = new Mesh(new SphereGeometry(r, 7, 5), pedra); m.scale.set(1, .8 + Math.random() * .4, 1); const ox = (Math.random() - .5) * 8 * U, oz = (Math.random() - .5) * 8 * U; m.position.set(sx + ox, relevo(sx + ox, sz + oz) + r, sz + oz); S.g.add(m); S.pedras.push({ m, r, vx: desce[0] * (4 + Math.random() * 5) * U, vz: desce[1] * (4 + Math.random() * 5) * U, vy: 0, t: 0, vida: 4.5, rot: (Math.random() - .5) * 6 }); }
    const po = particulas(120, 0xb8a98a, .9 * U, false); for(let k = 0; k < po.n; k++){ po.pos[k * 3] = sx + (Math.random() - .5) * 10 * U; po.pos[k * 3 + 1] = relevo(sx, sz) + Math.random() * 2 * U; po.pos[k * 3 + 2] = sz + (Math.random() - .5) * 10 * U; po.vel[k * 3] = desce[0] * 5 * U; po.vel[k * 3 + 1] = 1.2 * U; po.vel[k * 3 + 2] = desce[1] * 5 * U; } S.poeiras.push({ P: po, t: 0, vida: 4 });
    somTerra(2.4, .45, 90); pulsa(); S.tremor = .7; X.msg("sobrenatural", "A encosta desaba: terra e pedras rolam contra o que estiver embaixo (declive " + (decl * 100).toFixed(0) + "%)."); if(M.ctx) M.ctx.mostraAviso("Avalanche!");return true; }
  /* ---- LAMA ---- */
  function lama(J){ if(!ativo()||S.cdLama > 0) return false; const dd = d(), R = dd.lamaM * U; S.cdLama = 7; let n = 0; const marca = (x, z) => { const c = new Mesh(new CircleGeometry(1.2 * U, 16), new MeshBasicMaterial({ color: 0x4a3418, transparent: true, opacity: .8, depthWrite: false })); c.rotation.x = -Math.PI / 2; c.position.set(x, relevo(x, z) + .06, z); S.g.add(c); S.lamas.push({ m: c, t: 0, vida: dd.lamaSeg }); };
    for(const a of X.S.alvos){ if(!hostil(a)) continue; const p = a.pos(); if(Math.hypot(p.x - J.x, p.z - J.z) < R){ a.encantado = Math.max(a.encantado || 0, dd.lamaSeg+(a.encharcado>0?dd.lamaBonusSeg:0)); marca(p.x, p.z); n++; } }
    ((M.fauna && M.fauna.animais) || []).forEach(an => { if(Math.hypot(an.x - J.x, an.z - J.z) < R){ an.atordoado = dd.lamaSeg; marca(an.x, an.z); n++; } });
    somTerra(.9, .2, 160); pulsa(); X.msg("sobrenatural", n ? "A lama sobe e prende os pés de " + n + " alvo(s) por " + dd.lamaSeg + " s, sem ferir." : "A lama borbulha, mas não há ninguém por perto para prender."); if(M.ctx) M.ctx.mostraAviso(n ? "Lama: " + n + " preso(s)" : "Lama (ninguém por perto)"); }
  function tecla(e){ if(!podeControlar() || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if([k.avalanche,"KeyY"].includes(e.code)){ e.preventDefault(); avalanche(J); return true; } if([k.lama,"KeyI"].includes(e.code)){ e.preventDefault(); lama(J); return true; } return false; }
  function tick(dt){
    controle();S.cristas=S.cristas.filter(c=>{c.t+=dt;c.g.position.x+=c.vx*dt;c.g.position.z+=c.vz*dt;c.g.position.y=X.chao(c.g.position.x,c.g.position.z)+.2*U;c.g.children.forEach(o=>o.material.opacity=(o===c.g.children[0] ? .36 : .8)*Math.max(0,1-c.t/c.vida));if(c.t>=c.vida){descarta(c.g);return false;}return true;});
    S.captacoes=S.captacoes.filter(c=>{c.t+=dt;c.g.material.opacity=.55*Math.max(0,1-c.t/c.vida);if(c.t>=c.vida){descarta(c.g);return false;}return true;});
 S.cdAval = Math.max(0, S.cdAval - dt); S.cdLama = Math.max(0, S.cdLama - dt);
    if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .5; c.position.y += (Math.random() - .5) * S.tremor * .5; } }
    const mov = (L, grav, chaoMin) => L.filter(o => { o.t += dt; const a = o.P.pos, v = o.P.vel; for(let k = 0; k < a.length; k += 3){ v[k + 1] -= grav * dt; a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; if(chaoMin){ const ch = relevo(a[k], a[k + 2]); if(a[k + 1] < ch + .2){ a[k + 1] = ch + .2; v[k + 1] = Math.abs(v[k + 1]) * .2; } } } o.P.p.geometry.attributes.position.needsUpdate = true; o.P.p.material.opacity = .9 * Math.max(0, 1 - o.t / o.vida); if(o.t > o.vida){ S.g.remove(o.P.p); o.P.p.geometry.dispose();o.P.p.material.dispose(); return false; } return true; });
    S.ondas = mov(S.ondas, 14 * U, true); S.poeiras = mov(S.poeiras, 1.5 * U, true);
    S.pedras = S.pedras.filter(p => { p.t += dt; const m = p.m, e = 2 * U, gx = (relevo(m.position.x + e, m.position.z) - relevo(m.position.x - e, m.position.z)) / (2 * e), gz = (relevo(m.position.x, m.position.z + e) - relevo(m.position.x, m.position.z - e)) / (2 * e);
      p.vx += -gx * 22 * U * dt; p.vz += -gz * 22 * U * dt; p.vx *= (1 - dt * .6); p.vz *= (1 - dt * .6); m.position.x += p.vx * dt; m.position.z += p.vz * dt; const ch = relevo(m.position.x, m.position.z) + p.r; p.vy -= 30 * U * dt; m.position.y += p.vy * dt; if(m.position.y < ch){ m.position.y = ch; p.vy = Math.abs(p.vy) * .25; } m.rotation.x += p.rot * dt; m.rotation.z += p.rot * .6 * dt;
      if(p.t < 3) empurra(m.position.x, m.position.z, null, 4, .6, d().danoInimigo * dt * .8, true);
      if(p.t > p.vida){ S.g.remove(m); m.geometry.dispose();m.material.dispose(); return false; } return true; });
    S.lamas = S.lamas.filter(l => { l.t += dt; l.m.material.opacity = .8 * Math.max(0, 1 - l.t / l.vida); if(l.t > l.vida){ S.g.remove(l.m); l.m.geometry.dispose();l.m.material.dispose(); return false; } return true; }); }
  const info = () => (ativo() ? "Mohr: V onda · " + d().teclas.avalanche.replace("Key", "") + " avalanche" + (S.cdAval > 0 ? " (" + S.cdAval.toFixed(0) + ")" : "") + " · " + d().teclas.lama.replace("Key", "") + " lama" + (S.cdLama > 0 ? " (" + S.cdLama.toFixed(0) + ")" : "") + (S.pedras.length ? " · pedras " + S.pedras.length : "") : "");
  function podeControlar(){return ativo()&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'');}
  function descarta(g){g.removeFromParent();g.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  const el=M.renderer?.domElement;let inicio=null,botoes=[],ligado=false;
  const down=e=>{if(e.button===0&&e.pointerType!=='touch'&&podeControlar())inicio={x:e.clientX,y:e.clientY,t:performance.now()};};
  const up=e=>{const p=inicio;inicio=null;if(p&&e.button===0&&podeControlar()&&performance.now()-p.t<500&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<6)M.poderes?.usa();};
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];if(pad&&podeControlar()){if(next[7]&&!botoes[7])M.poderes?.usa();for(const [i,code]of [[5,d().teclas.avalanche],[3,d().teclas.lama]])if(next[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=next;}
  function liga(){if(ligado)return;ligado=true;el?.addEventListener('pointerdown',down);el?.addEventListener('pointerup',up);}
  function dispose(){ligado=false;inicio=null;el?.removeEventListener('pointerdown',down);el?.removeEventListener('pointerup',up);S.g.children.slice().forEach(descarta);S.ondas=[];S.cristas=[];S.captacoes=[];S.pedras=[];S.poeiras=[];S.lamas=[];S.audio?.close().catch(()=>{});S.audio=null;S.ativo=false;}
  liga();
  return { onda, avalanche, lama, tecla, tick, aoTransformar, info, S, aguaPerto, fonteAgua, controle, liga, dispose };
}
