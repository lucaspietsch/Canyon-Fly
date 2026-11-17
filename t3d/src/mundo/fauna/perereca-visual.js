import {SphereGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarCambaraensis} from './cambaraensis-visual.js';
export const COMPRIMENTO_PERERECA=.96;
const cor=(g,hex)=>{g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col,detail=18)=>cor(new SphereGeometry(1,detail,Math.max(4,Math.floor(detail*.7))).scale(a,b,c).translate(x,y,z),col);
const junta=p=>{const g=mergeGeometries(p);p.forEach(x=>x.dispose());return g;};
// Referência visual de perereca; as fotos não fixam uma identificação taxonômica.
export function geometriasPerereca(){
 const castanho=0x94703d,ventre=0xd0bb91,creme=0xe2cfaa;
 const body=[oval(0,.09,0,.245,.17,.405,castanho),oval(0,-.035,.02,.23,.12,.36,ventre)];
 for(const s of [-1,1])body.push(oval(s*.226,.04,-.01,.023,.045,.32,creme));
 for(let i=0;i<92;i++){const a=i*2.399963,v=.1+.86*(i+.5)/92,rr=Math.sqrt(1-v*v);body.push(oval(Math.cos(a)*rr*.246,.09+v*.171,Math.sin(a)*rr*.406,.004,.003,.004,i%3?0xb49358:0x71522e,6));}
 const head=[oval(0,0,0,.245,.125,.23,castanho),oval(0,-.066,.025,.226,.071,.205,creme)];
 for(const s of [-1,1]){head.push(oval(s*.177,.106,.052,.097,.112,.09,0xa4864c),oval(s*.19,.12,.115,.077,.089,.035,0xbca16b),oval(s*.22,-.01,.025,.018,.027,.17,0x6f4c2d));}
 const mouth=new CatmullRomCurve3([new Vector3(-.22,-.035,.10),new Vector3(-.11,-.041,.218),new Vector3(0,-.043,.235),new Vector3(.11,-.041,.218),new Vector3(.22,-.035,.10)]);head.push(cor(new TubeGeometry(mouth,28,.0035,5,false),0x594931));
 const eyes=[];for(const s of [-1,1])eyes.push(oval(s*.195,.124,.141,.064,.077,.029,0x111c19),oval(s*.207,.151,.166,.015,.020,.008,0xf6ebd0));
 const arm=[oval(.045,-.03,.025,.055,.064,.16,castanho),oval(.12,-.10,.09,.037,.10,.10,0x9e803f)];
 const leg=[oval(.09,-.02,-.085,.094,.083,.245,castanho),oval(.17,-.10,.015,.044,.064,.225,0x9e803f)];
 for(const [parts,n]of [[arm,4],[leg,5]]){parts.push(oval(.16,-.175,.18,.059,.023,.085,0xb99d59));for(let j=0;j<n;j++){const x=.07+j*.04,z=.25+(j%2)*.038;const curve=new CatmullRomCurve3([new Vector3(.15,-.175,.17),new Vector3(x,-.185,z-.025),new Vector3(x+(j-2)*.01,-.185,z+.055)]);parts.push(cor(new TubeGeometry(curve,10,.009,6,false),0xb9a266),oval(x+(j-2)*.01,-.184,z+.055,.022,.012,.024,0xd4b66b,10));}}
 return{corpo:junta(body),cabeca:junta(head),olhos:junta(eyes),braco:junta(arm),coxa:junta(leg)};
}
export function criarPererecas(pai,max=5){return criarCambaraensis(pai,max,{geo:geometriasPerereca(),nome:'perereca-castanha-dourada',especie:'perereca',rugosidade:.46});}
