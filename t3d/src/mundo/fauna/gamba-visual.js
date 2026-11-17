import {visualNatural} from './visual-natural.js';
export function criarGamba(S){
 const V=visualNatural(S,'gamba','Didelphis albiventris'),{corpo,mat,group,oval,tube}=V;
 const cinza=mat(0x6b6a60),creme=mat(0xd5d0b9),preto=mat(0x292b25),pele=mat(0xa48c78,false),rosa=mat(0xc98d85,false),orelha=mat(0xe0d8c1);
 V.body(.095,.098,.205,0x4c4d46,0xb5b3a2,2200,.015);V.hair(corpo,.097,.10,.20,0,.002,0,0xc9c8b7,0x74746b,1100,.021);
 const pernas=V.legs({x:.065,z:.13,upper:preto,lower:preto,hoof:pele,toes:5});
 const pesc=group(corpo,0,-.007,.16);oval(pesc,cinza,0,.006,.02,.063,.065,.072);const cab=group(pesc,0,.013,.045);
 oval(cab,creme,0,.006,.005,.059,.066,.075);tube(cab,[[0,-.008,.04],[0,-.027,.09],[0,-.038,.154]],.039,creme,.011);oval(cab,rosa,0,-.038,.160,.015,.011,.012);
 for(const s of [-1,1]){oval(cab,preto,s*.047,.022,.051,.014,.023,.012);tube(cab,[[s*.016,.069,-.02],[s*.018,.058,.035],[s*.013,.008,.09]],.008,preto,.004);}
 const olhos=V.eyes(cab,.056,.023,.062,0x111713),orelhas=V.ears(cab,{x:.049,y:.042,z:-.037,h:.063,w:.028,outer:orelha,inner:rosa});
 V.whiskers(cab,.025,-.024,.114,.06);
 const cauda=V.tail(.39,.016,cinza,pele,{z:.17,skin:true,taperTip:true});return V.finish({pesc,cab,orelhas,olhos,cauda,pernas});
}
