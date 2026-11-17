import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO KRIG (forma Viking, só no tempo antigo): investida em chamas (tecla do poder, V), golpe no chão que empurra o que está
   em volta, voo a `vooM` metros com velocidade `velocidadeVoo`× (pouso com impacto leve e tremor da câmera) e rugido que atordoa
   animais enfeitiçados e sombras sem ferir (fauna: `atordoado` em animal.js; alvos: `encantado`). Teclas em data/poderes.js → krig.teclas.
   ============================================================================================================ */
export function criarKrig(M, X){
  const S = { ativo: false, voando: false, cdGolpe: 0, cdRugido: 0, tremor: 0, pousando: false, golpePendente: false };
  const d = () => PODERES.krig, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "krig" && T() && T().ativa();
  function aoTransformar(id, on){ if(id !== "krig") return; S.ativo = on; if(on){S.tremor=.22;}else{S.voando=S.pousando=S.golpePendente=false;if(T()){T().S.alt=0;T().S.alvoAlt=0;T().S.velMultExtra=1;}} }
  function empurra(J, raioM, forca, dano=true){
    for(const a of X.S.alvos){ if(a.morto || !["inimigo","guardiao"].includes(a.tipo)) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > raioM * U) continue;
      const k = (1 - dist / (raioM * U)) * forca * 6 * U; if(a.g){ a.g.position.x += (dist>.01?dx/dist:1)*k; a.g.position.z += (dist>.01?dz/dist:0)*k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } if(dano && a.dano) a.dano(d().danoInimigo); }
  }
  function voo(on){if(!ativo())return false;S.voando=!!on;S.pousando=!on;S.golpePendente=false;T().S.alvoAlt=on?Math.min(5,d().vooM)*U:0;T().S.velMultExtra=on?d().velocidadeVoo:1;
    X.msg("sobrenatural",on?"Krig alça voo: até 5 m, ao dobro da velocidade de corrida.":"Krig inicia o pouso.");M.ctx?.mostraAviso(on?"Voo ligado (E/L1 desliga)":"Pousando");return true;
  }
  function aterrissa(J){if(S.golpePendente){S.golpePendente=false;impacto(J);}else{X.pulso(J.x,J.z,0xff4a25,3);empurra(J,4,.35,false);S.tremor=.18;}S.pousando=false;}
  function investida(J,dd){
    if(!ativo())return false;J=Number.isFinite(J.camYaw)?{...J,yaw:J.camYaw+Math.PI}:J;
    const f=[Math.sin(J.yaw),Math.cos(J.yaw)],dist=(S.voando?14:9)*U;let livre=0;
    // Usa os mesmos retângulos e raio de colisão do modo andar.
    for(let s=.35*U;s<=dist;s=Math.min(dist,s+.35*U)){
      const x=J.x+f[0]*s,z=J.z+f[1]*s,y=X.chao(x,z)+(S.voando?(T().S.alt??Math.min(5,d().vooM)*U):0);
      if((M.cen.colisores||[]).some(c=>(!c.ativo||c.ativo())&&(c.y1===undefined||y<c.y1-.05)&&x>c.x0-.85&&x<c.x1+.85&&z>c.z0-.85&&z<c.z1+.85))break;
      livre=s;if(s===dist)break;
    }
    if(livre<.5*U){M.ctx?.mostraAviso("Caminho bloqueado para a investida");return false;}
    for(const a of X.S.alvos){if(a.morto||!["inimigo","guardiao"].includes(a.tipo))continue;const p=a.pos(),dx=p.x-J.x,dz=p.z-J.z,t=Math.max(0,Math.min(livre,dx*f[0]+dz*f[1]));
      if(Math.hypot(dx-f[0]*t,dz-f[1]*t)<=dd.trilhaRaioM*U){a.dano?.(dd.trilhaDano);a.encantado=Math.max(a.encantado||0,.5);}}
    M.ctx.teleporta(J.x+f[0]*livre,J.z+f[1]*livre);const J2=M.jogador()||J;
    X.pulso(J.x,J.z,0xff6a2a,2);X.pulso(J2.x,J2.z,0xff3b1f,dd.empurraM);empurra(J2,dd.empurraM,1);S.tremor=.25;X.msg("sobrenatural","Krig deixa um rastro de impacto e avança até o último ponto livre.");return true;
  }
  function impacto(J){X.luzFx(J.x,X.chao(J.x,J.z)+.5,J.z,0xff4a20,16,24*U,.6);X.pulso(J.x,J.z,0xff3b1f,d().empurraM);empurra(J,d().empurraM,1.4);S.tremor=.4;X.msg("sobrenatural","Golpe no chão: os inimigos são empurrados.");M.ctx?.mostraAviso("Golpe no chão");}
  function golpe(J){if(!ativo()||S.cdGolpe>0)return false;S.cdGolpe=2.5;if(S.voando||(T().S.alt||0)>.05*U){voo(false);S.golpePendente=true;}else impacto(J);return true;}
  function rugido(J){ if(!ativo() || S.cdRugido > 0) return false; S.cdRugido = 8; let n = 0; const R = d().rugidoM * U;
    ((M.fauna && M.fauna.animais) || []).forEach(a => { if(Math.hypot(a.x - J.x, a.z - J.z) < R){ a.atordoado = d().rugidoSeg; n++; } });
    for(const a of X.S.alvos){ if(!a.morto && ["inimigo","guardiao"].includes(a.tipo) && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < R) a.encantado = Math.max(a.encantado || 0, d().rugidoSeg); }
    X.luzFx(J.x, J.y + 2, J.z, 0xff2a2a, 20, 40 * U, .7); S.tremor = .6; X.msg("sobrenatural", "O rugido de Krig atordoa " + n + " animal(is) e as sombras ao redor — sem ferir ninguém."); if(M.ctx) M.ctx.mostraAviso("Rugido"); }
  function tecla(e){ if(!podeControlar() || e.repeat || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if([k.voo,"KeyU"].includes(e.code)){ e.preventDefault(); voo(!S.voando); return true; } if([k.golpe,"KeyY"].includes(e.code)){ e.preventDefault(); golpe(J); return true; } if([k.rugido,"KeyI"].includes(e.code)){ e.preventDefault(); rugido(J); return true; } return false; }
  function tick(dt){
    controle();if(S.voando&&ativo()){T().S.alvoAlt=Math.min(5,d().vooM)*U;T().S.alt=Math.min(5*U,Math.max(0,T().S.alt||0));}
    if(S.pousando&&ativo()&&(T().S.alt||0)<=.05*U){T().S.alt=0;const J=M.jogador();if(J)aterrissa(J);}
 S.cdGolpe = Math.max(0, S.cdGolpe - dt); S.cdRugido = Math.max(0, S.cdRugido - dt); if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .5; c.position.y += (Math.random() - .5) * S.tremor * .5; } } }
  const info = () => (ativo() ? "Krig: " + (S.voando ? "voando (" + d().vooM + " m, " + d().velocidadeVoo + "×)" : "no chão") + " · " + d().teclas.golpe.replace("Key", "") + " golpe" + (S.cdGolpe > 0 ? " (" + S.cdGolpe.toFixed(1) + ")" : "") + " · " + d().teclas.voo.replace("Key", "") + " voo · " + d().teclas.rugido.replace("Key", "") + " rugido" + (S.cdRugido > 0 ? " (" + S.cdRugido.toFixed(0) + ")" : "") : "");
  function podeControlar(){return ativo()&&(!M.andando||M.andando())&&!M.personagens?.S?.tela&&!M.gente?.dialogoAberto?.()&&!M.ctx?.construindo?.()&&!M.H?.andarMod?.emCinema?.()&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||"");}
  const el=M.renderer?.domElement;let inicio=null,botoes=[],ligado=false;
  const down=e=>{if(e.button===0&&e.pointerType!=="touch"&&podeControlar())inicio={x:e.clientX,y:e.clientY,t:performance.now()};};
  const up=e=>{const p=inicio;inicio=null;if(p&&e.button===0&&podeControlar()&&performance.now()-p.t<500&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<6)M.poderes?.usa();};
  function controle(){const pad=navigator.getGamepads?.()?.find(p=>p?.connected&&p.mapping==='standard'),next=pad?pad.buttons.map(b=>b.pressed):[];if(pad&&podeControlar()){if(next[7]&&!botoes[7])M.poderes?.usa();for(const [i,code]of [[5,d().teclas.golpe],[4,d().teclas.voo],[3,d().teclas.rugido]])if(next[i]&&!botoes[i])tecla({code,preventDefault(){}});}botoes=next;}
  function liga(){if(ligado)return;ligado=true;el?.addEventListener('pointerdown',down);el?.addEventListener('pointerup',up);}
  function dispose(){ligado=false;inicio=null;el?.removeEventListener('pointerdown',down);el?.removeEventListener('pointerup',up);aoTransformar('krig',false);}
  liga();
  return { investida, golpe, rugido, voo, tecla, tick, aoTransformar, info, S, voando: () => S.voando && ativo(), controle, liga, dispose };
}
