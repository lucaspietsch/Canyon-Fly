import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, CanvasTexture, RepeatWrapping, AdditiveBlending, PointLight, SRGBColorSpace } from "three";
import { visualPitDe } from "../personagens/pit-visual.js";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";
import { criarQuadrupede, SPEC } from "../fauna/modelos.js";

// CardPuter: hologramas autônomos, hack na mira e tempo parado.
export function criarPit(M, X){
  const S = { ativo: false, foco: null, focoT: 0, cdHack: 0, tipo: "lobo", holos: [], energia: 100, cdTempo: 0, parado: 0, g: new Group(), arm: null, linhas: [], t: 0, hacks: [], fraco: 0, hackeaveis: new Map() };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.pit, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "pit" && T() && T().ativa();
  const avatar = () => { const am = M.H && M.H.andarMod; return am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); };
  /* ---- material holográfico: cor aditiva + linhas de varredura + tremulação ---- */
  const scan = (() => { const c = document.createElement("canvas"); c.width = 8; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#ffffff"; x.fillRect(0, 0, 8, 64); x.fillStyle = "#5a5a5a"; for(let k = 0; k < 64; k += 4) x.fillRect(0, k, 8, 2); const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(1, 6); t.colorSpace = SRGBColorSpace; return t; })();
  const holoMat = (cor) => new MeshBasicMaterial({ color: cor, map: scan, transparent: true, opacity: .6, blending: AdditiveBlending, depthWrite: false });
  function corpoLobo(cor){ const r = criarQuadrupede(SPEC.lobo, { clonar: true }); const m = holoMat(cor); r.root.traverse(o => { if(o.isMesh) o.material = m; }); return { root: r.root, mat: m, pernas: r.pernas, cauda: r.cauda, alturaM: 1.0, raioM: .8 }; }
  function corpoAssombracao(cor){ const g = new Group(), m = holoMat(cor), e = (rx, ry, rz, x, y, z) => { const o = new Mesh(new SphereGeometry(1, 14, 10), m); o.scale.set(rx, ry, rz); o.position.set(x, y, z); g.add(o); return o; };
    e(.45, 1.3, .32, 0, 1.9, 0); e(.3, .4, .3, 0, 3.2, .05); for(const sx of [-1, 1]){ const b = new Mesh(new CylinderGeometry(.07, .06, 2.4, 6), m); b.position.set(sx * .45, 1.8, 0); b.rotation.z = sx * .25; g.add(b); const p = new Mesh(new CylinderGeometry(.1, .08, 1.7, 6), m); p.position.set(sx * .18, .85, 0); g.add(p); }
    const capuz = new Mesh(new SphereGeometry(.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * .6), m); capuz.position.set(0, 3.35, 0); g.add(capuz); g.scale.setScalar(U); return { root: g, mat: m, pernas: [], cauda: [], alturaM: 1.7, raioM: .6 }; }
  function corpoHumano(cor){
    const tecido=new MeshStandardMaterial({color:cor});
    const p = M.H?.pessoa3d?.({nome:"Holograma",x:0,y:0,z:0,yaw:0,camisa:tecido,manga:tecido,calca:tecido});
    tecido.dispose();
    if(!p) return corpoAssombracao(cor);
    const m=holoMat(cor); p.av.removeFromParent();
    p.av.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=m;}});
    if(p.nome)p.nome.visible=false;if(p.capG)p.capG.visible=false;if(p.ocG)p.ocG.visible=false;
    p.equip?.forEach(o=>o.visible=false);p.estat?.forEach(o=>o.visible=false);
    if(p.pernasA)p.pernasA.grupo.visible=true;
    return {root:p.av,mat:m,pernas:p.pernasA?.quadril||[],cauda:[],alturaM:1.8,raioM:.6};
  }
  /* ---- hologramas ---- */
  function projeta(J, dd){ if(!ativo())return false; const tipo = S.tipo === "assombracao" ? "assombracao" : S.tipo === "humano" ? "humano" : (S.fraco++ % 2 ? "humano" : "lobo"), forte = tipo === "assombracao", custo = dd.holoCusto * (forte ? 1.5 : 1);
    const foco=X.naMira(J,{cone:dd.cone,alcanceM:dd.focoM},["inimigo"]);
    if(foco){S.foco=foco;S.focoT=dd.focoSeg;const p=foco.pos();X.pulso(p.x,p.z,0xb44cff,2);}
    if(S.holos.length>=dd.maxHolos && foco){M.ctx?.mostraAviso("Hologramas: foco em "+foco.nome);return true;}
    if(S.holos.length >= dd.maxHolos){ if(M.ctx) M.ctx.mostraAviso("Limite de " + dd.maxHolos + " hologramas"); return false; } if(S.energia < custo){ if(M.ctx) M.ctx.mostraAviso("Energia do CardPuter insuficiente (" + Math.round(S.energia) + "%)"); return false; }
    S.energia -= custo; const cor = forte ? 0xb44cff : 0x4fd8ff, c = forte ? corpoAssombracao(cor) : tipo === "humano" ? corpoHumano(cor) : corpoLobo(cor), f = [Math.sin(J.yaw), Math.cos(J.yaw)], x = J.x + f[0] * 4 * U + f[1] * (S.holos.length - 1) * 2.5 * U, z = J.z + f[1] * 4 * U - f[0] * (S.holos.length - 1) * 2.5 * U;
    c.root.position.set(x, X.chao(x, z), z); c.root.rotation.y = J.yaw; S.g.add(c.root); const luz = new PointLight(cor, 3, 8 * U); luz.position.set(0, 2 * U, 0); c.root.add(luz);
    S.holos.push({ ...c, luz, tipo, t: 0, vida: dd.holoSeg, cdAtaque: 0, fase: Math.random() * 6, alvo: null, nome: forte ? "assombração holográfica" : tipo === "humano" ? "pessoa holográfica" : "lobo-guará holográfico" });
    X.luzFx(x, X.chao(x, z) + 2 * U, z, cor, 8, 12 * U, .4); X.msg("sobrenatural", "O CardPuter projeta " + (forte ? "uma assombração VIOLETA (forte)" : (tipo === "humano" ? "uma pessoa AZUL (fraco)" : "um lobo-guará AZUL (fraco)")) + ": linhas de varredura tremulam no ar."); if(M.ctx) M.ctx.mostraAviso("Holograma: " + (forte ? "assombração (forte)" : (tipo === "humano" ? "pessoa (fraco)" : "lobo-guará (fraco)")) + (S.foco?" · foco "+S.foco.nome:"") + " · energia " + Math.round(S.energia) + "%"); }
  function some(h, motivo){ S.g.remove(h.root); h.root.traverse(o => { if(o.isMesh && o.geometry) o.geometry.dispose(); }); h.mat.dispose(); if(motivo) X.msg("info", "O holograma " + h.nome.split(" ")[0] + " se desfaz (" + motivo + ")."); }
  function tickHolos(dt, J){ const dd = d(); const foco=S.focoT>0&&S.foco&&!S.foco.morto&&X.S.alvos.includes(S.foco)?S.foco:null; const hostil = !!foco || X.S.alvos.some(a => !a.morto && (a.tipo === "inimigo" || a.tipo === "guardiao") && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < dd.holoAlcanceM * U);
    S.holos = S.holos.filter((h, i) => { h.t += dt; h.cdAtaque -= dt; if(h.t > h.vida){ some(h, "tempo esgotado"); return false; } if(S.energia <= 0){ some(h, "energia acabou"); return false; }
      h.mat.opacity = .45 + .2 * Math.sin(h.t * 23 + h.fase) + (Math.random() < .04 ? .3 : 0); h.root.position.y = X.chao(h.root.position.x, h.root.position.z) + .15 * U + Math.sin(h.t * 3 + h.fase) * .08 * U; scan.offset.y = (scan.offset.y + dt * .6) % 1;
      let alvo = foco; if(hostil&&!alvo){ let md = 1e9; for(const a of X.S.alvos){ if(a.morto || !(a.tipo === "inimigo" || a.tipo === "guardiao")) continue; const p = a.pos(), dist = Math.hypot(p.x - h.root.position.x, p.z - h.root.position.z); if(dist < md && dist < dd.holoAlcanceM * 1.5 * U){ md = dist; alvo = a; } } }
      const dest = alvo ? alvo.pos() : { x: J.x + Math.sin(J.yaw + Math.PI + (i - 1) * .7) * 3.5 * U, z: J.z + Math.cos(J.yaw + Math.PI + (i - 1) * .7) * 3.5 * U };
      const dx = dest.x - h.root.position.x, dz = dest.z - h.root.position.z, dist = Math.hypot(dx, dz), parar = alvo ? 1.6 * U : 1.5 * U;
      if(dist > parar){ const v = dd.holoVelMS * U * (alvo ? 1.4 : 1) * dt, k = Math.min(1, v / dist); h.root.position.x += dx * k; h.root.position.z += dz * k; h.root.rotation.y = Math.atan2(dx, dz); h.pernas.forEach((p, q) => { if(p && p.rotation) p.rotation.x = Math.sin(h.t * 10 + q * Math.PI / 2) * .5; }); }
      else if(alvo && h.cdAtaque <= 0){ h.cdAtaque = .8; if(alvo.dano) alvo.dano(dd.holoDano[h.tipo]*(alvo===foco?dd.focoBonus:1)); X.luzFx(alvo.pos().x, alvo.pos().y + 2 * U, alvo.pos().z, h.tipo === "lobo" ? 0x4fd8ff : 0xb44cff, 5, 8 * U, .2); }
      return true; }); }
  /* ---- hackear ---- */
  // Missões podem cadastrar portões/máquinas sem acoplar o poder ao módulo da missão.
  function registraHackeavel(id, alvo){ S.hackeaveis.set(id,alvo); return ()=>S.hackeaveis.delete(id); }
  function alvoHack(J){
    const yaw=Number.isFinite(J.camYaw)?J.camYaw+Math.PI:J.yaw;
    const candidatos=[...S.hackeaveis].map(([id,o])=>({id,o,pos:typeof o.pos==="function"?o.pos():o.pos}));
    M.lugares?.S?.vivos?.forEach((v,id)=>{
      const o=v.o;if(!o)return;
      if(o.abre && !o.S?.aberta && o.entrada)candidatos.push({id,o,pos:{x:o.entrada[0],z:o.entrada[1]},portao:true});
      else if(["fabrica","vila-ouro-verde"].includes(id)&&o.g&&v.it?.centro)candidatos.push({id,o,pos:{x:v.it.centro[0],z:v.it.centro[1]}});
    });
    return candidatos.filter(c=>{if(!c.pos||c.o.g?.userData.hack)return false;const dx=c.pos.x-J.x,dz=c.pos.z-J.z;c.dist=Math.hypot(dx,dz);return c.dist<=d().hackM*U && (c.dist<.01 || (dx*Math.sin(yaw)+dz*Math.cos(yaw))/c.dist>=Math.cos(d().cone*Math.PI/180));}).sort((a,b)=>a.dist-b.dist)[0];
  }
  function hackeia(J){
    if(!ativo())return false;
    if(S.cdHack>0){M.ctx?.mostraAviso("Hack recarregando: "+Math.ceil(S.cdHack)+" s");return false;}
    const c=alvoHack(J);if(!c){M.ctx?.mostraAviso("Mire um portão, máquina ou luz hackeável");return false;}
    const o=c.o,luzes=[];
    if(c.portao)o.abre();else {
      o.g?.traverse(n=>{if(n.isLight){luzes.push([n,n.intensity]);n.intensity=0;}const mats=Array.isArray(n.material)?n.material:[n.material];for(const m of mats){if(m?.emissive&&m.emissiveIntensity>0){luzes.push([m,m.emissiveIntensity,"em"]);m.emissiveIntensity=0;}}});
      if(o.g)o.g.userData.hack=true;
      o.hackear?.();o.pausar?.(true);
      S.hacks.push({g:o.g,luzes,t:d().hackSeg,restaura:()=>{o.pausar?.(false);o.religar?.();}});
    }
    S.cdHack=d().hackRecarga;M.missoes?.emite?.("poder:hack",{alvo:c.id});
    X.luzFx(J.x,J.y+3*U,J.z,0x4fd8ff,8,14*U,.5);X.msg("sobrenatural","CardPuter: "+c.id+" hackeado.");M.ctx?.mostraAviso("Hackeado: "+c.id);return true;
  }
  /* ---- parar o tempo ---- */
  const el = () => M.renderer && M.renderer.domElement;
  function paraTempo(){ if(!ativo())return false; if(S.cdTempo > 0 || S.parado > 0){ if(M.ctx) M.ctx.mostraAviso("Parar o tempo: recarga " + Math.ceil(S.cdTempo) + " s"); return; } S.parado = d().pararSeg; S.cdTempo = d().pararRecarga; M.congelado = true; S.filtro0=el()?.style.filter||""; S.transform0=el()?.style.transform||""; if(el()) el().style.filter = "saturate(.35) contrast(1.12)"; X.msg("sobrenatural", "O CardPuter congela o tempo por " + d().pararSeg + " s: aves, água, partículas e inimigos param — só o Pit se move."); if(M.ctx) M.ctx.mostraAviso("TEMPO PARADO"); }
  function liberaTempo(){ M.congelado = false; S.parado = 0; const e = el(); if(e){ e.style.filter = S.filtro0 || ""; e.style.transform = S.transform0 || ""; } X.msg("info", "O tempo volta a correr."); }
  /* A armadura substitui as malhas do uniforme, mantendo o esqueleto de animação. */
  function veste(A0){const A=A0||avatar();if(!A?.av)return;const v=visualPitDe(A.av);v?.forma(true);if(!A0)S.arm=v;}
  function despe(){S.arm?.forma(false);S.arm=null;}
  const vesteEm=av=>{const v=visualPitDe(av);v?.forma(true);v?.tick(.4,S.energia,S.tipo);};
  const despeEm=av=>visualPitDe(av)?.forma(false);
  const corpo=tipo=>tipo==="assombracao"?corpoAssombracao(0xb44cff):tipo==="humano"?corpoHumano(0x4fd8ff):corpoLobo(0x4fd8ff);
  function aoTransformar(id, on){ if(id !== "pit") return; S.ativo = on; if(on){ S.energia = 100; veste(); } else { S.foco=null;S.focoT=0;despe(); S.holos.forEach(h => some(h, null)); S.holos = []; if(M.congelado) liberaTempo(); } }
  function tecla(e){ if(!podeControlar() || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if([k.tipo,"KeyY"].includes(e.code)){ e.preventDefault(); S.tipo = S.tipo === "lobo" ? "assombracao" : "lobo"; if(M.ctx) M.ctx.mostraAviso("Holograma: " + (S.tipo === "lobo" ? "pessoa/animal AZUL (fraco)" : "assombração VIOLETA (forte)")); return true; }
    if([k.hack,"KeyU"].includes(e.code)){ if(!alvoHack(J))return false;e.preventDefault(); hackeia(J); return true; } if([k.tempo,"KeyI"].includes(e.code)){ e.preventDefault(); paraTempo(); return true; } return false; }
  function tick(dt){ S.t += dt; S.cdHack=Math.max(0,S.cdHack-dt);S.focoT=Math.max(0,S.focoT-dt);if(S.focoT===0||S.foco?.morto)S.foco=null; S.cdTempo = Math.max(0, S.cdTempo - dt); if(S.parado > 0){ S.parado -= dt; const e = el(); if(e) e.style.transform = Math.random() < .12 ? "translateX(" + ((Math.random() - .5) * 4).toFixed(1) + "px)" : ""; if(S.parado <= 0) liberaTempo(); }
    S.hacks = S.hacks.filter(h => { h.t -= M.congelado ? 0 : dt; if(h.t <= 0){ h.luzes.forEach(([n, v, em]) => { if(em) n.emissiveIntensity = v; else n.intensity = v; }); if(h.g) h.g.userData.hack = false; h.restaura?.(); X.msg("info", "Os sistemas hackeados voltam a funcionar."); return false; } return true; });
    controle();
    if(!S.ativo) return;
    const J=M.jogador();
    if(!M.congelado){S.energia=Math.max(0,Math.min(100,S.energia+(S.holos.length?-d().holoConsumoSeg*S.holos.length:d().holoRecarga)*dt));if(J)tickHolos(dt,J);}
    if(!S.arm&&ativo())veste();S.arm?.tick(dt,S.energia,S.tipo);

  }

  const info = () => (ativo() ? "Pit: clique/R2/V holograma (" + (S.tipo === "lobo" ? "lobo azul" : "assombração violeta") + ") " + S.holos.length + "/" + d().maxHolos + (S.foco?" · foco "+S.foco.nome:"") + " · energia " + Math.round(S.energia) + "% · " + d().teclas.tipo.replace("Key", "") + " tipo · " + d().teclas.hack.replace("Key", "") + " hackear · " + d().teclas.tempo.replace("Key", "") + " parar tempo" + (S.parado > 0 ? " (PARADO " + S.parado.toFixed(1) + ")" : S.cdTempo > 0 ? " (" + Math.ceil(S.cdTempo) + ")" : "") : "");
  function podeControlar(){return ativo() && (!M.andando || M.andando()) && !M.personagens?.S?.tela && !M.gente?.dialogoAberto?.() && !M.ctx?.construindo?.() && !M.H?.andarMod?.emCinema?.() && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||"");}
  let inicio=null, botoes=[];
  const down=e=>{if(e.button===0&&e.pointerType!=="touch"&&podeControlar())inicio={x:e.clientX,y:e.clientY,t:performance.now()};};
  const up=e=>{const p=inicio;inicio=null;if(p&&e.button===0&&podeControlar()&&performance.now()-p.t<500&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<6)M.poderes?.usa();};
  const canvas=el();canvas?.addEventListener("pointerdown",down);canvas?.addEventListener("pointerup",up);
  function controle(){const pad=typeof navigator!=="undefined"?navigator.getGamepads?.()?.find(p=>p?.connected && p.mapping==="standard"):null;const novos=pad?pad.buttons.map(b=>b.pressed):[];if(podeControlar()&&pad){const J=M.jogador();if(novos[7]&&!botoes[7])M.poderes?.usa();for(const [i,code]of [[5,d().teclas.tipo],[4,d().teclas.hack],[3,d().teclas.tempo]])if(novos[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=novos;}
  function dispose(){aoTransformar("pit",false);canvas?.removeEventListener("pointerdown",down);canvas?.removeEventListener("pointerup",up);S.hacks.forEach(h=>{h.luzes.forEach(([n,v,em])=>{if(em)n.emissiveIntensity=v;else n.intensity=v;});if(h.g)h.g.userData.hack=false;h.restaura?.();});S.hacks=[];S.hackeaveis.clear();scan.dispose();}
  return { projeta, hackeia, alvoHack, registraHackeavel, paraTempo, liberaTempo, tecla, tick, aoTransformar, info, S, vesteEm, despeEm, corpo, controle, dispose };
}
