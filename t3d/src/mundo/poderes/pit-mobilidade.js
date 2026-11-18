import {U} from '../config.js';
export const PIT_MOBILIDADE={terra:1.7,vooMS:90,turboMS:150,alturaM:35,minAlturaM:8,maxAlturaM:180,verticalMS:22};
export function criarVooPit(M,ativo){
 const S={voando:false,alturaM:PIT_MOBILIDADE.alturaM,origem:null};
 function pousa(forca=false){const J=M.jogador();if(!J)return false;let q=M.cen.extraChao?.limite?.(J.x,J.z)||[J.x,J.z];if(M.cen.extraChao?.bloqueado?.(...q)){if(!forca){M.ctx?.mostraAviso('Procure terra firme para pousar');return false;}q=S.origem||q;}if(Math.hypot(q[0]-J.x,q[1]-J.z)>.1)M.ctx.teleporta(...q);S.voando=false;M.H?.andarMod?.parar?.();const T=M.transformacao;if(T){T.S.alvoAlt=0;if(forca)T.S.alt=0;}M.ctx?.mostraAviso('Pit pousando');return true;}
 function voo(on=!S.voando){if(!ativo()||M.H?.andarMod?.emCinema?.()||M.ctx?.construindo?.())return false;if(!on)return pousa();const J=M.jogador();if(!J)return false;S.origem=[J.x,J.z];S.voando=true;S.alturaM=PIT_MOBILIDADE.alturaM;M.transformacao.S.alvoAlt=S.alturaM*U;M.ctx?.mostraAviso('Voo rápido · setas para mover · Shift acelera · Espaço sobe · Ctrl desce · G pousa');return true;}
 function altura(dt,subir=0){if(!S.voando||!ativo())return;S.alturaM=Math.max(PIT_MOBILIDADE.minAlturaM,Math.min(PIT_MOBILIDADE.maxAlturaM,S.alturaM+subir*PIT_MOBILIDADE.verticalMS*dt));M.transformacao.S.alvoAlt=S.alturaM*U;}
 function desliga(){if(S.voando)pousa(true);S.voando=false;}
 return{S,voo,altura,desliga,voando:()=>S.voando&&ativo(),velocidade:turbo=>(turbo?PIT_MOBILIDADE.turboMS:PIT_MOBILIDADE.vooMS)*U};
}
