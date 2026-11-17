import {SphereGeometry,ConeGeometry,CylinderGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas,geometriasGralha} from './gralha-visual.js';
const cor=(g,c)=>{g=g.index?g.toNonIndexed():g;const v=new Color(c),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(v.r,v.g,v.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>cor(new SphereGeometry(1,18,12).scale(a,b,c).translate(x,y,z),col);
const junta=p=>{const g=mergeGeometries(p);p.forEach(x=>x.dispose());return g;};
export function geometriasQueroQuero(){
 const geo=geometriasGralha();geo.corpo.dispose();geo.corpo=junta([oval(0,0,0,.22,.25,.40,0x8d8873),oval(0,-.13,.11,.20,.15,.32,0xe4dfc8),oval(0,.02,.28,.15,.25,.15,0x1e2928),oval(0,.22,.23,.12,.14,.10,0xb5af98)]);
 geo.cab.dispose();const head=[oval(0,0,0,.14,.16,.17,0xaaa999),cor(new ConeGeometry(.035,.19,12).rotateX(Math.PI/2).translate(0,-.018,.23),0x292d29),oval(0,-.017,.155,.035,.027,.075,0xb27a83),oval(0,.009,.154,.043,.10,.025,0x232d2d)];for(const s of [-1,1]){head.push(oval(s*.125,.018,.07,.018,.036,.038,0x953e40),oval(s*.140,.018,.075,.01,.023,.026,0x111d1e),oval(s*.145,.026,.085,.004,.006,.007,0xf8e8cf));for(let i=0;i<2;i++){const line=new CatmullRomCurve3([new Vector3(s*.035,.10,-.11),new Vector3(s*.045,.11,-.26),new Vector3(s*.025,.17+i*.045,-.43-i*.06)]);head.push(cor(new TubeGeometry(line,16,.0035,5,false),0x24302c));}}geo.cab=junta(head);
 for(const key of ['asa','cauda']){const g=geo[key],p=g.attributes.position,c=g.attributes.color;for(let i=0;i<c.count;i++){const x=p.getX(i),z=p.getZ(i),v=new Color(key==='cauda'?0x26312f:x<.42?(z>.02?0xac7842:0x5d7865):0x5f6558);c.setXYZ(i,v.r,v.g,v.b);}}
 geo.pernas.dispose();const feet=[];for(const s of [-1,1]){feet.push(cor(new CylinderGeometry(.012,.010,.24,8).translate(s*.092,-.12,0),0xaf6a73),cor(new CylinderGeometry(.010,.008,.21,8).translate(s*.092,-.345,0),0x454e47));for(let i=-1;i<=1;i++)feet.push(oval(s*.092+i*.029,-.453,.044,.008,.008,.065,0x444c42));}geo.pernas=junta(feet);return geo;
}
export function criarQueroQueros(pai,max=96){const r=criarGralhas(pai,max,{geo:geometriasQueroQuero(),nome:'quero-quero',sagrado:false,pousoPitch:0});r.group.userData.especie='Vanellus chilensis';return r;}
