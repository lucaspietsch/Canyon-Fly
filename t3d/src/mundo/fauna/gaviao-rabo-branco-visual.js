import {SphereGeometry,CylinderGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas} from './gralha-visual.js';
const cor=(g,hex)=>{g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>cor(new SphereGeometry(1,20,14).scale(a,b,c).translate(x,y,z),col);
const junta=parts=>{const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;};
export function geometriasGaviaoRaboBranco(){
 const body=[oval(0,0,0,.24,.31,.43,0x515c5e),oval(0,-.02,.25,.215,.28,.25,0xe3e0cf),oval(0,.12,.24,.175,.19,.17,0xd7d7c9)];for(const s of [-1,1])body.push(oval(s*.19,.10,-.05,.065,.13,.23,0x796054));
 const h=[oval(0,0,0,.17,.18,.19,0x667071),oval(0,-.045,.171,.075,.065,.06,0xa2a26b)];
 const curve=new CatmullRomCurve3([new Vector3(0,-.03,.20),new Vector3(0,-.065,.28),new Vector3(0,-.15,.255)]),hook=new TubeGeometry(curve,20,1,12,false),p=hook.attributes.position;for(let j=0;j<=20;j++){const t=j/20,c=curve.getPointAt(t),r=.043*(1-t)+.002;for(let k=0;k<=12;k++){const i=j*13+k;p.setXYZ(i,c.x+(p.getX(i)-c.x)*r,c.y+(p.getY(i)-c.y)*r,c.z+(p.getZ(i)-c.z)*r);}}hook.computeVertexNormals();h.push(cor(hook,0x343d3b));for(const s of [-1,1])h.push(oval(s*.146,.028,.079,.015,.033,.037,0x766e45),oval(s*.158,.028,.083,.010,.024,.026,0x172324),oval(s*.16,.066,.077,.024,.016,.056,0x485453),oval(s*.165,.036,.095,.004,.007,.008,0xf3edcd));
 const wing=[];for(let i=0;i<11;i++){const g=oval(.22+i*.084,0,-.045-i*.019,.064,.022,.24+i*.017,i>6?0x343f40:0xb9bcb0);const c=g.attributes.color,pos=g.attributes.position;for(let j=0;j<c.count;j++){if(pos.getY(j)<0&&i<8){const v=new Color(Math.sin(pos.getZ(j)*90)>.55?0x747b76:0xc9cbbd);c.setXYZ(j,v.r,v.g,v.b);}}wing.push(g);}for(let i=0;i<7;i++)wing.push(oval(.18+i*.105,.027,.01,.085,.028,.18,i<2?0x7d6356:0x596361));
 const tail=[];for(let i=-3;i<=3;i++){const g=oval(i*.049,0,-.23,.035,.020,.25-Math.abs(i)*.015,0xe7e5d7),c=g.attributes.color,pos=g.attributes.position;for(let j=0;j<c.count;j++)if(pos.getZ(j)<-.37&&pos.getZ(j)>-.44){const v=new Color(0x35413e);c.setXYZ(j,v.r,v.g,v.b);}tail.push(g);}
 const feet=[];for(const s of [-1,1]){feet.push(cor(new CylinderGeometry(.021,.018,.17,9).translate(s*.10,-.085,0),0xc2a94e));for(let i=-1;i<=1;i++){feet.push(oval(s*.10+i*.028,-.18,.045,.013,.013,.067,0xbda04c),oval(s*.10+i*.028,-.19,.104,.010,.016,.025,0x39413a));}feet.push(oval(s*.10,-.18,-.055,.013,.013,.065,0xbda04c));}
 return{corpo:junta(body),cab:junta(h),asa:junta(wing),cauda:junta(tail),pernas:junta(feet)};
}
export function criarGavioesRaboBranco(pai,max=96){const r=criarGralhas(pai,max,{geo:geometriasGaviaoRaboBranco(),nome:'gaviao-de-rabo-branco',sagrado:false,pousoPitch:0,planaSemBater:true,asaDobradaEscala:.55});r.group.userData.especie='Geranoaetus albicaudatus';return r;}
