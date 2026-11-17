import {visualNatural} from './visual-natural.js';
export function criarLontra(S){
 const V=visualNatural(S,'lontra','Lontra longicaudis'),{corpo,mat,group,oval}=V;
 const marrom=mat(0x4b4232),creme=mat(0xb6aa85),escuro=mat(0x302f26),nariz=mat(0x171e19,false);
 V.body(.118,.13,.33,0x443e32,0x94876a,2100,.004);const pernas=V.legs({x:.079,z:.205,upper:marrom,lower:escuro,hoof:escuro,toes:5});
 for(const p of pernas)p.pata.userData.palmada=true;
 const pesc=group(corpo,0,.068,.24);const neck=oval(pesc,marrom,0,.045,.017,.077,.12,.105);V.tint(neck,0x4b4232,0xb6aa85);
 const cab=group(pesc,0,.115,.047);oval(cab,marrom,0,.008,.01,.077,.068,.092);
 for(const s of [-1,1])oval(cab,creme,s*.031,-.022,.081,.039,.033,.046);oval(cab,creme,0,-.045,.067,.049,.017,.065);oval(cab,nariz,0,.002,.120,.024,.016,.018);
 const olhos=V.eyes(cab,.061,.029,.070,0x141c16),orelhas=V.ears(cab,{x:.061,y:.037,z:-.043,h:.037,w:.020,outer:marrom,inner:escuro});
 V.whiskers(cab,.035,-.013,.094,.085);
 oval(corpo,marrom,0,.006,-.255,.077,.09,.125);
 const cauda=V.tail(.47,.069,marrom,marrom,{z:.26,taperTip:true});return V.finish({pesc,cab,orelhas,olhos,cauda,pernas});
}
