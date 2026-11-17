import {SphereGeometry,CylinderGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas,geometriasGralha} from './gralha-visual.js';
const cor=(g,hex)=>{g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>cor(new SphereGeometry(1,20,14).scale(a,b,c).translate(x,y,z),col);
const junta=parts=>{const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;};
export function geometriaBicoCuricaca(){
 const curve=new CatmullRomCurve3([new Vector3(0,-.025,.15),new Vector3(0,-.065,.36),new Vector3(0,-.19,.62),new Vector3(0,-.39,.80)]),steps=36,sides=12;
 const g=new TubeGeometry(curve,steps,1,sides,false),p=g.attributes.position;
 for(let j=0;j<=steps;j++){const t=j/steps,c=curve.getPointAt(t),r=.037*(1-t)**.9+.0015;for(let k=0;k<=sides;k++){const i=j*(sides+1)+k;p.setXYZ(i,c.x+(p.getX(i)-c.x)*r,c.y+(p.getY(i)-c.y)*r,c.z+(p.getZ(i)-c.z)*r);}}
 g.computeVertexNormals();return cor(g,0x464d45);
}
export function geometriasCuricaca(){
 const geo=geometriasGralha();geo.corpo.dispose();const body=[oval(0,0,0,.24,.28,.42,0x79796b),oval(0,-.12,.09,.215,.17,.31,0xb3a787),oval(0,.27,.20,.115,.31,.14,0xddc99c),oval(0,.16,.25,.14,.17,.13,0xc38c43),oval(0,.34,.25,.108,.22,.105,0xe4d6af)];
 for(let j=0;j<3;j++)for(let i=-2;i<=2;i++)body.push(oval(i*.065,.22-j*.026,-.19+j*.12,.047,.032,.105,(i+j)%2?0x62675f:0x929283));geo.corpo=junta(body);
 geo.cab.dispose();const h=[oval(0,0,0,.14,.16,.17,0xd9cca7),oval(0,.115,-.025,.125,.055,.14,0xa96d32),geometriaBicoCuricaca()];
 for(const s of [-1,1])h.push(oval(s*.12,-.01,.078,.028,.073,.085,0x3b4540),oval(s*.144,.024,.073,.014,.036,.039,0xb43e36),oval(s*.155,.024,.077,.010,.024,.027,0x202823),oval(s*.162,.034,.089,.004,.007,.008,0xe6debf));geo.cab=junta(h);geo.cab.translate(0,.27,0);
 const wing=[];for(let i=0;i<10;i++)wing.push(oval(.22+i*.052,0,-.05-i*.018,.044,.019,.23+i*.016,i>5?0x3d4743:0x676f66));
 for(let row=0;row<3;row++)for(let i=0;i<6;i++){const x=.12+i*.075,y=.028+row*.019,z=.11-row*.10;wing.push(oval(x,y,z,.065,.019,.12,0xb0ad97),oval(x,y+.012,z+.005,.055,.014,.107,(row+i)%2?0x6a7067:0x7d8173));}geo.asa.dispose();geo.asa=junta(wing);
 const tail=geo.cauda.attributes.color;for(let i=0;i<tail.count;i++){const c=new Color(0x323d36);tail.setXYZ(i,c.r,c.g,c.b);}geo.cauda.scale(1,1,.70);
 geo.pernas.dispose();const feet=[];for(const s of [-1,1]){feet.push(cor(new CylinderGeometry(.016,.012,.22,9).translate(s*.105,-.11,0),0xab6063),cor(new CylinderGeometry(.012,.010,.21,9).translate(s*.105,-.325,0),0xa66b68));for(let i=-1;i<=1;i++)feet.push(oval(s*.105+i*.031,-.435,.045,.010,.009,.083,0x805852));feet.push(oval(s*.105,-.435,-.057,.010,.009,.060,0x805852));}geo.pernas=junta(feet);return geo;
}
export function criarCuricacas(pai,max=96){const r=criarGralhas(pai,max,{geo:geometriasCuricaca(),nome:'curicaca',sagrado:false,pousoPitch:0,asaDobradaEscala:.7});r.group.userData.especie='Theristicus caudatus';return r;}
