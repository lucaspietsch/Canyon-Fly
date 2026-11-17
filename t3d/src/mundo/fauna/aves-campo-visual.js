import {SphereGeometry,ConeGeometry,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas,geometriasGralha} from './gralha-visual.js';
const pinta=(g,c)=>{g=g.index?g.toNonIndexed():g;const v=new Color(c),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(v.r,v.g,v.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>pinta(new SphereGeometry(1,18,12).scale(a,b,c).translate(x,y,z),col);
export function geometriasAveCampo(tipo){
 const pica=tipo==='picapau',geo=geometriasGralha();
 for(const [key,g]of Object.entries(geo)){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let hex=pica?0x34372f:0x72604c;if(key==='corpo')hex=pica?(y>.09&&z>.1?0xe3bd36:0xc1bda5):(y<.03?0xc66b2d:0x8b7a60);if(key==='asa')hex=pica?(Math.sin(z*110+x*45)>.6?0xc7c2a7:0x35382f):(Math.sin(x*95)>.75?0x9b8769:0x6c5b45);if(key==='pernas')hex=0x817b6c;const v=new Color(hex);c.setXYZ(i,v.r,v.g,v.b);} }
 geo.cab.dispose();const h=[oval(0,0,0,.16,.18,.19,pica?0xdbcb8f:0x897b66),pinta(new ConeGeometry(pica?.047:.039,pica?.36:.25,14).rotateX(Math.PI/2).translate(0,-.025,pica?.30:.26),pica?0x62665c:0xd3b665)];
 if(pica)h.push(oval(0,.13,-.025,.148,.064,.165,0x252a25));
 for(const s of [-1,1]){if(pica)h.push(oval(s*.132,-.04,.055,.035,.09,.14,0xe9ba32),oval(s*.146,-.094,.08,.029,.024,.14,0x38362e));h.push(oval(s*.145,.027,.09,.018,.039,.043,pica?0xd1c5a0:0xc79b38),oval(s*.160,.027,.095,.012,.027,.030,0x151c18),oval(s*.167,.038,.105,.005,.009,.01,0xefead5));}
 geo.cab=mergeGeometries(h);h.forEach(g=>g.dispose());
 const additions=[];
 if(pica){additions.push(oval(0,.15,.28,.15,.16,.105,0xe3b92d));for(let j=0;j<8;j++)for(let i=-3;i<=3;i++){const x=i*.047,y=-.20+j*.045,z=.43*Math.sqrt(Math.max(.03,1-(x/.24)**2-(y/.30)**2));additions.push(oval(x,y,z,.013,.009,.008,0x34362e));}}
 else {additions.push(oval(0,.15,.30,.12,.13,.06,0xc1b79c));for(let i=-2;i<=2;i++)additions.push(oval(i*.033,.16,.35-Math.abs(i)*.009,.006,.08,.008,0x685f4d));}
 const old=geo.corpo;geo.corpo=mergeGeometries([old,...additions]);[old,...additions].forEach(g=>g.dispose());return geo;
}
export function criarAveCampo(pai,max,tipo){const r=criarGralhas(pai,max,{geo:geometriasAveCampo(tipo),nome:tipo==='picapau'?'pica-pau-do-campo':'sabia-laranjeira',sagrado:false});r.group.userData.especie=tipo==='picapau'?'Colaptes campestris':'Turdus rufiventris';return r;}
