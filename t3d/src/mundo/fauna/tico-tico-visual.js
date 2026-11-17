import {SphereGeometry,ConeGeometry,Color,Float32BufferAttribute} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas,geometriasGralha} from './gralha-visual.js';
const paint=(g,c)=>{g=g.index?g.toNonIndexed():g;const a=[],v=new Color(c);for(let i=0;i<g.attributes.position.count;i++)a.push(v.r,v.g,v.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>paint(new SphereGeometry(1,16,12).scale(a,b,c).translate(x,y,z),col);
export function geometriasTicoTico(){
 const geo=geometriasGralha();
 for(const [key,g]of Object.entries(geo)){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i),z=p.getZ(i);let hex=0x89704e;if(key==='corpo')hex=y<.07?0xc7bda5:0xa06635;if(key==='asa')hex=Math.sin(x*115+z*18)>.1?0x514638:0xb59769;if(key==='cauda')hex=0x74664d;if(key==='pernas')hex=0xa57a71;const v=new Color(hex);c.setXYZ(i,v.r,v.g,v.b);} }
 geo.cab.dispose();const h=[oval(0,0,0,.17,.18,.19,0xa9aaa2),paint(new ConeGeometry(.065,.16,12).rotateX(Math.PI/2).translate(0,-.04,.23),0x6f7470),oval(0,.171,-.025,.048,.035,.16,0x30332d)];
 for(const s of [-1,1]){h.push(oval(s*.11,.119,.015,.027,.037,.15,0x30332d),oval(s*.151,.017,.04,.022,.029,.15,0x34372f),oval(s*.145,-.080,.025,.023,.027,.12,0x34372f),oval(s*.164,.04,.085,.012,.026,.028,0xeee1c4),oval(s*.175,.04,.089,.01,.019,.022,0x171c17),oval(s*.180,.047,.098,.004,.007,.008,0xffffff));}
 geo.cab=mergeGeometries(h);h.forEach(g=>g.dispose());
 const throat=oval(0,.14,.285,.145,.14,.09,0xd6d2be),back=[];
 for(let i=-2;i<=2;i++)back.push(oval(i*.06,.22-Math.abs(i)*.025,-.10,.018,.025,.22,0x514535));
 const old=geo.corpo;geo.corpo=mergeGeometries([old,throat,...back]);[old,throat,...back].forEach(g=>g.dispose());return geo;
}
export function criarTicoTicos(pai,max=96){const r=criarGralhas(pai,max,{geo:geometriasTicoTico(),nome:'tico-tico',sagrado:false});r.group.userData.especie='Zonotrichia capensis';return r;}
