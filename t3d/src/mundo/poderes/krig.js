import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO KRIG (forma Viking, só no tempo antigo): investida em chamas (tecla do poder, V), golpe no chão que empurra o que está
   em volta, voo a `vooM` metros com velocidade `velocidadeVoo`× (pouso com impacto leve e tremor da câmera) e rugido que atordoa
   animais enfeitiçados e sombras sem ferir (fauna: `atordoado` em animal.js; alvos: `encantado`). Teclas em data/poderes.js → krig.teclas.
   ============================================================================================================ */
export function criarKrig(M, X){
  const S = { ativo: false, voando: false, cdGolpe: 0, cdRugido: 0, tremor: 0 };
  const d = () => PODERES.krig, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "krig" && T() && T().ativa();
  function aoTransformar(id, on){ if(id !== "krig") return; S.ativo = on; if(!on && S.voando){ S.voando = false; if(T()){ T().S.alvoAlt = 0; T().S.velMultExtra = 1; } } }
  function empurra(J, raioM, forca){
    for(const a of X.S.alvos){ if(a.morto) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > raioM * U || dist < .01) continue;
      const k = (1 - dist / (raioM * U)) * forca * 6 * U; if(a.g){ a.g.position.x += dx / dist * k; a.g.position.z += dz / dist * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } if(a.dano) a.dano(d().danoInimigo); }
  }
  function voo(on){
    S.voando = on; T().S.alvoAlt = on ? d().vooM * U : 0; T().S.velMultExtra = on ? d().velocidadeVoo : 1;
    X.msg("sobrenatural", on ? "Krig alça voo: até " + d().vooM + " m de altura, velocidade dobrada." : "Krig pousa com um baque."); if(M.ctx) M.ctx.mostraAviso(on ? "Voo ligado (U desliga)" : "Pouso");
    if(!on){ const J = M.jogador(); if(J){ X.luzFx(J.x, J.y + 1, J.z, 0xff5a1e, 12, 20 * U, .5); empurra(J, 4, .6); } S.tremor = .4; }
  }
  function investida(J,dd){
    const f=[Math.sin(J.yaw),Math.cos(J.yaw)],dist=(S.voando?14:9)*U;let livre=0;
    // Usa os mesmos retângulos e raio de colisão do modo andar.
    for(let s=.35*U;s<=dist;s=Math.min(dist,s+.35*U)){
      const x=J.x+f[0]*s,z=J.z+f[1]*s,y=X.chao(x,z)+(S.voando?dd.vooM||d().vooM:0)*U;
      if((M.cen.colisores||[]).some(c=>(!c.ativo||c.ativo())&&(c.y1===undefined||y<c.y1-.05)&&x>c.x0-.85&&x<c.x1+.85&&z>c.z0-.85&&z<c.z1+.85))break;
      livre=s;if(s===dist)break;
    }
    if(livre<.5*U){M.ctx?.mostraAviso("Caminho bloqueado para a investida");return false;}
    for(const a of X.S.alvos){if(a.morto||!["inimigo","guardiao"].includes(a.tipo))continue;const p=a.pos(),dx=p.x-J.x,dz=p.z-J.z,t=Math.max(0,Math.min(livre,dx*f[0]+dz*f[1]));
      if(Math.hypot(dx-f[0]*t,dz-f[1]*t)<=dd.trilhaRaioM*U){a.dano?.(dd.trilhaDano);a.encantado=Math.max(a.encantado||0,.5);}}
    M.ctx.teleporta(J.x+f[0]*livre,J.z+f[1]*livre);const J2=M.jogador()||J;
    X.pulso(J.x,J.z,0xff6a2a,2);X.pulso(J2.x,J2.z,0xff3b1f,dd.empurraM);empurra(J2,dd.empurraM,1);S.tremor=.25;X.msg("sobrenatural","Krig deixa um rastro de impacto e avança até o último ponto livre.");return true;
  }
  function golpe(J){ if(S.cdGolpe > 0) return; S.cdGolpe = 2.5; if(S.voando) voo(false); X.luzFx(J.x, J.y + .5, J.z, 0xff6a2a, 16, 24 * U, .6); empurra(J, d().empurraM, 1.4); S.tremor = .5; X.msg("sobrenatural", "Golpe no chão: tudo em volta é empurrado."); if(M.ctx) M.ctx.mostraAviso("Golpe no chão"); }
  function rugido(J){ if(S.cdRugido > 0) return; S.cdRugido = 8; let n = 0; const R = d().rugidoM * U;
    ((M.fauna && M.fauna.animais) || []).forEach(a => { if(Math.hypot(a.x - J.x, a.z - J.z) < R){ a.atordoado = d().rugidoSeg; n++; } });
    for(const a of X.S.alvos){ if(!a.morto && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < R) a.encantado = Math.max(a.encantado || 0, d().rugidoSeg); }
    X.luzFx(J.x, J.y + 2, J.z, 0xff2a2a, 20, 40 * U, .7); S.tremor = .6; X.msg("sobrenatural", "O rugido de Krig atordoa " + n + " animal(is) e as sombras ao redor — sem ferir ninguém."); if(M.ctx) M.ctx.mostraAviso("Rugido"); }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.voo){ e.preventDefault(); voo(!S.voando); return true; } if(e.code === k.golpe){ e.preventDefault(); golpe(J); return true; } if(e.code === k.rugido){ e.preventDefault(); rugido(J); return true; } return false; }
  function tick(dt){ S.cdGolpe = Math.max(0, S.cdGolpe - dt); S.cdRugido = Math.max(0, S.cdRugido - dt); if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .5; c.position.y += (Math.random() - .5) * S.tremor * .5; } } }
  const info = () => (ativo() ? "Krig: " + (S.voando ? "voando (" + d().vooM + " m, " + d().velocidadeVoo + "×)" : "no chão") + " · " + d().teclas.golpe.replace("Key", "") + " golpe" + (S.cdGolpe > 0 ? " (" + S.cdGolpe.toFixed(1) + ")" : "") + " · " + d().teclas.voo.replace("Key", "") + " voo · " + d().teclas.rugido.replace("Key", "") + " rugido" + (S.cdRugido > 0 ? " (" + S.cdRugido.toFixed(0) + ")" : "") : "");
  return { investida, golpe, rugido, voo, tecla, tick, aoTransformar, info, S, voando: () => S.voando };
}
