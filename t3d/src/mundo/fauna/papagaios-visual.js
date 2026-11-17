import {SphereGeometry,ConeGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute,CylinderGeometry} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {criarGralhas} from './gralha-visual.js';
const oval=(x,y,z,a,b,c)=>new SphereGeometry(1,20,14).scale(a,b,c).translate(x,y,z);
const pinta=(g,c)=>{g=g.index?g.toNonIndexed():g;const col=new Color(c),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(col.r,col.g,col.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
export function geometriasPapagaio(tipo='charao'){
 const roxo=tipo==='peito-roxo',verde=0x518a28,asaVerde=0x417d28,peito=roxo?0x806176:0x7fa342;
 const body=[pinta(oval(0,0,0,.255,.31,.39),verde),pinta(oval(0,-.04,.21,.23,.29,.20),peito)];
 for(let j=0;j<7;j++)for(let i=0;i<7;i++){const x=(i-3)*.055,y=-.22+j*.068,z=.30-Math.abs(i-3)*.012;body.push(pinta(oval(x,y,z,.043,.054,.012),roxo?(j%2?0x766174:0x8f7180):(j%2?0x719532:0x7d9e3b)));}
 const head=[pinta(oval(0,.005,0,.188,.22,.19),verde),pinta(oval(0,.073,.152,roxo?.125:.175,roxo?.055:.13,.045),0xc72e29),pinta(oval(0,-.055,.188,.072,.070,.033),0xbfc1a0)];
 const curve=new CatmullRomCurve3([new Vector3(0,-.03,.20),new Vector3(0,-.07,.274),new Vector3(0,-.168,.252)]),hook=new TubeGeometry(curve,20,1,14,false),pos=hook.attributes.position;for(let j=0;j<=20;j++){const t=j/20,c=curve.getPointAt(t),r=.059*(1-t)+.002;for(let k=0;k<=14;k++){const i=j*15+k;pos.setXYZ(i,c.x+(pos.getX(i)-c.x)*r,c.y+(pos.getY(i)-c.y)*r,c.z+(pos.getZ(i)-c.z)*r);}}hook.computeVertexNormals();head.push(pinta(hook,roxo?0xc69b91:0xd6b680),pinta(oval(0,-.13,.197,.044,.041,.050),0x705840));
 for(const s of [-1,1])head.push(pinta(oval(s*.167,.033,.080,.014,.047,.043),0xd4d4bf),pinta(oval(s*.179,.033,.083,.012,.034,.032),0xad702a),pinta(oval(s*.188,.034,.086,.007,.023,.023),0x101711));
 const wings=[];for(let i=0;i<11;i++)wings.push(pinta(oval(.18+i*.047,-.004,-.04-i*.018,.043,.022,.22+i*.014),i>5?0x244486:i<3?0xb12b29:asaVerde));for(let i=0;i<6;i++)wings.push(pinta(oval(.12+i*.075,.02,.04,.059,.027,.17),i<2?0xc2392b:verde));
 const tail=[];for(let i=-2;i<=2;i++)tail.push(pinta(oval(i*.048,0,-.29,.033,.020,.25-Math.abs(i)*.015),i%2?0x77983d:asaVerde));
 const feet=[];for(const s of [-1,1]){feet.push(pinta(new CylinderGeometry(.019,.017,.16,7).translate(s*.11,-.095,0),0x747564));for(const f of [-1,1])for(const k of [-1,1])feet.push(pinta(oval(s*.11+k*.025,-.18,f*.04,.012,.010,.067),0x656c5f));}
 return{corpo:mergeGeometries(body),cab:mergeGeometries(head),asa:mergeGeometries(wings),cauda:mergeGeometries(tail),pernas:mergeGeometries(feet)};
}
export function criarPapagaios(pai,max,tipo){const R=criarGralhas(pai,max,{geo:geometriasPapagaio(tipo),nome:'papagaio-'+tipo,sagrado:false});R.group.userData.especie=tipo==='peito-roxo'?'Amazona vinacea':'Amazona pretrei';return R;}
