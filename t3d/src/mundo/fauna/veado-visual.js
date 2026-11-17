import {Color} from 'three';
import {visualNatural} from './visual-natural.js';
export function criarVeado(S){
 const V=visualNatural(S,'veado-campeiro','Ozotoceros bezoarticus'),{corpo,mat,group,oval,tube}=V;
 const pelo=mat(0xb38b52),claro=mat(0xe4d9bd),castanho=mat(0x9b7545),escuro=mat(0x33312b,false),osso=mat(0xb6a382);
 const body=V.body(.135,.16,.43,0xa67c43,0xe5dcc2,1900,.004),pos=body.geometry.attributes.position,col=body.geometry.attributes.color;for(let i=0;i<pos.count;i++){const k=Math.max(0,Math.min(1,(-pos.getZ(i)-.73)/.15))*Math.max(0,Math.min(1,(.72-Math.abs(pos.getY(i)))/.25)),c=new Color().fromBufferAttribute(col,i).lerp(new Color(0xe4d9bd),k);col.setXYZ(i,c.r,c.g,c.b);}
 oval(corpo,pelo,0,.015,.25,.112,.17,.16);oval(corpo,claro,0,-.08,0,.095,.074,.26);

 const pernas=V.legs({x:.084,z:.27,upper:pelo,lower:claro,hoof:escuro,toes:2,slender:true});
 const pesc=group(corpo,0,.085,.31);const neck=oval(pesc,pelo,0,.105,.015,.065,.19,.085);V.tint(neck,0xb38b52,0xe0d0ad);
 const cab=group(pesc,0,.265,.015);oval(cab,castanho,0,.008,.015,.064,.080,.11);oval(cab,pelo,0,-.027,.104,.046,.048,.11);oval(cab,claro,0,-.057,.105,.033,.019,.091);oval(cab,escuro,0,-.026,.207,.025,.018,.014);
 for(const s of [-1,1]){oval(cab,claro,s*.060,.032,.07,.006,.021,.020);}
 const olhos=V.eyes(cab,.061,.033,.085),orelhas=V.ears(cab,{x:.056,y:.045,z:-.041,h:.17,w:.046,outer:pelo,inner:claro,leaf:true});
 // Um ramo frontal + duas pontas da haste principal: três pontas por galhada.
 const galhadas=[];for(const s of [-1,1]){const g=group(cab,s*.035,.068,-.025);tube(g,[[0,0,0],[s*.038,.10,-.025],[s*.055,.22,-.055],[s*.041,.31,-.069]],.013,osso,.0013);tube(g,[[s*.019,.055,-.01],[s*.035,.105,.065],[s*.027,.16,.097]],.009,osso,.001);tube(g,[[s*.049,.17,-.043],[s*.095,.215,-.020],[s*.10,.27,.008]],.008,osso,.001);g.userData.pontas=3;galhadas.push(g);}
 const cauda=V.tail(.13,.034,pelo,claro,{z:.41});return V.finish({pesc,cab,orelhas,olhos,cauda,pernas,galhadas});
}
