import {visualNatural} from './visual-natural.js';
export function criarQuati(S){
 const V=visualNatural(S,'quati','Nasua nasua'),{corpo,mat,group,oval,tube}=V;
 const marrom=mat(0x78603c),claro=mat(0xd0bf8f),preto=mat(0x302c22),pele=mat(0x514331),nariz=mat(0x26241e,false);
 V.body(.108,.122,.235,0x71603e,0xa08b5b,1900,.008);
 const pernas=V.legs({x:.072,z:.143,upper:marrom,lower:preto,hoof:preto,toes:5});
 const pesc=group(corpo,0,.005,.18);oval(pesc,marrom,0,.012,.02,.062,.080,.092);const cab=group(pesc,0,.018,.059);
 oval(cab,marrom,0,.006,.01,.060,.068,.080);tube(cab,[[0,-.005,.045],[0,-.022,.12],[0,-.035,.204]],.045,marrom,.012);oval(cab,nariz,0,-.035,.208,.017,.011,.014);
 for(const s of [-1,1]){oval(cab,preto,s*.047,.019,.058,.016,.014,.012);oval(cab,claro,s*.048,.037,.06,.018,.004,.010);oval(cab,claro,s*.047,.001,.055,.016,.004,.012);tube(cab,[[s*.015,-.03,.15],[s*.031,-.027,.095]],.004,claro,.005);}
 const olhos=V.eyes(cab,.056,.022,.066,0x1b1c14),orelhas=V.ears(cab,{x:.047,y:.039,z:-.035,h:.048,w:.024,outer:marrom,inner:pele});
 V.whiskers(cab,.028,-.03,.145,.045);
 const cauda=V.tail(.52,.039,marrom,preto,{z:.18,rings:true});return V.finish({pesc,cab,orelhas,olhos,cauda,pernas});
}
