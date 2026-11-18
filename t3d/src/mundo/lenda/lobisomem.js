import {U} from '../config.js';
import {criarVisualLobisomem} from './lobisomem-visual.js';
export const LOBISOMEM={alcanceM:2.8,velocidadeMS:5,impactos:[.20,.44],fimCombo:.72,recarga:1.15,limiteM:32};
/** Dois impactos por combo, um por mão. O alvo precisa continuar ao alcance. */
export function criarLobisomem(M,guardiao){
 const visual=criarVisualLobisomem(),g=visual.g;g.scale.setScalar(U);M.cen.grupo.add(g);
 const S={estado:'guarda',t:0,combo:-1,impacto:0,recarga:0,golpes:0,lados:[],encantado:0};
 const msg=s=>M.terminal?.msg('sobrenatural',s);
 function provoca(){if(M.personagens.ativo!=='tupa')return false;if(S.estado==='guarda')msg('O lobisomem avança para defender Anhangá de Tupã!');S.estado='defende';return true;}
 const a={id:'lobisomem-olaria',nome:'Lobisomem da Olaria',tipo:'guardiao',raioM:1,alturaM:2.5,g,S,pos:()=>g.position,aoRaio:provoca,aoFlecha(){},aoLabia(){S.estado='guarda';S.combo=-1;return true;},aoOlhos(d){S.encantado=d.duracaoS||3;}};
 M.poderes.registra(a);
 function coloca(x,z){g.position.set(x,M.cen.chao(x,z,1e9),z);}
 function tick(dt,J){
  if(!J)return;S.t+=dt;S.recarga=Math.max(0,S.recarga-dt);S.encantado=Math.max(0,S.encantado-dt);const P=guardiao(),p=g.position,dx=J.x-p.x,dz=J.z-p.z,d=Math.hypot(dx,dz),longe=Math.hypot(J.x-P.x,J.z-P.z)>LOBISOMEM.limiteM*U;
  if(M.personagens.ativo!=='tupa'||longe){S.estado='guarda';S.combo=-1;}
  let movendo=false;
  if(S.encantado<=0){
   if(S.estado==='defende'){
    g.rotation.y=Math.atan2(dx,dz);
    if(S.combo<0&&d>LOBISOMEM.alcanceM*U*.85){const step=Math.min(d,LOBISOMEM.velocidadeMS*U*dt);p.x+=dx/d*step;p.z+=dz/d*step;movendo=true;}
    else if(S.combo<0&&S.recarga===0){S.combo=0;S.impacto=0;}
    if(S.combo>=0){S.combo+=dt;while(S.impacto<2&&S.combo>=LOBISOMEM.impactos[S.impacto]){const lado=S.impacto++;if(Math.hypot(J.x-p.x,J.z-p.z)<=LOBISOMEM.alcanceM*U){S.golpes++;S.lados.push(lado);if(S.lados.length>12)S.lados.shift();const norm=Math.hypot(J.x-p.x,J.z-p.z)||1;M.ctx.teleporta(J.x+(J.x-p.x)/norm*.32*U,J.z+(J.z-p.z)/norm*.32*U);M.ctx.mostraAviso(lado?'Arranhão da garra direita!':'Arranhão da garra esquerda!');M.missoes?.emite('lobisomem:golpe',{lado:lado?'direita':'esquerda'});}}if(S.combo>=LOBISOMEM.fimCombo){S.combo=-1;S.recarga=LOBISOMEM.recarga;}}
   }else{const x=P.x+4*U,z=P.z+2*U,dist=Math.hypot(x-p.x,z-p.z);if(dist>U){const step=Math.min(dist,2*U*dt);p.x+=(x-p.x)/dist*step;p.z+=(z-p.z)/dist*step;g.rotation.y=Math.atan2(x-p.x,z-p.z);movendo=true;}}
  }
  p.y=M.cen.chao(p.x,p.z,1e9);const lado=S.combo<0?-1:S.combo<.32?0:1,phase=lado===0?S.combo/.32:(S.combo-.32)/.4;visual.tick(S.t,lado,phase,movendo);
 }
 return{...a,visual,provoca,coloca,tick,dispose(){M.poderes.remove(a);g.removeFromParent();visual.dispose();}};
}
