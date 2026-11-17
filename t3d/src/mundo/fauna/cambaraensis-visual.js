import {Group,InstancedMesh,SphereGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute,MeshStandardMaterial,Matrix4,Quaternion,Euler,DynamicDrawUsage} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const cor=(g,hex)=>{g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col,detail=16)=>cor(new SphereGeometry(1,detail,Math.max(4,Math.floor(detail*.7))).scale(a,b,c).translate(x,y,z),col);
const junta=p=>{const g=mergeGeometries(p);p.forEach(x=>x.dispose());return g;};
export const COMPRIMENTO_CAMBARAENSIS=.95;
export function geometriasCambaraensis(){
 const verde=0x647538,vermelho=0xb72726,claro=0xdad5ac;
 const body=[oval(0,.09,0,.30,.22,.40,verde),oval(0,-.075,.015,.273,.125,.355,vermelho)];
 // Distribuição fixa: a textura de verrugas e pintas não muda a cada quadro.
 for(let i=0;i<110;i++){const a=i*2.399963,v=.1+.85*((i+.5)/110),rr=Math.sqrt(1-v*v),x=Math.cos(a)*rr*.30,y=.09+v*.22,z=Math.sin(a)*rr*.40,r=.008+(i%3)*.002;body.push(oval(x,y,z,r,r*.7,r,i%5===0?claro:i%2?0x89904d:0x4f622d,7));}
 for(let i=0;i<76;i++){const a=i*2.399963,v=.16+.82*((i+.5)/76),rr=Math.sqrt(1-v*v);body.push(oval(Math.cos(a)*rr*.274,-.075-v*.126,.015+Math.sin(a)*rr*.356,.0065,.004,.0065,i%9===0?0x353f2c:claro,6));}
 const head=[oval(0,0,0,.257,.145,.225,verde),oval(0,-.075,.03,.22,.075,.19,vermelho)];
 for(const s of [-1,1])head.push(oval(s*.185,.09,.07,.083,.089,.085,0x7d8847),oval(s*.207,.106,.125,.046,.051,.034,0xa4a789));
 for(let i=0;i<34;i++){const a=i*2.399963,v=.2+.75*((i+.5)/34),rr=Math.sqrt(1-v*v);head.push(oval(Math.cos(a)*rr*.258,v*.146,Math.sin(a)*rr*.225,.008,.007,.008,i%3===0?claro:0x85914e,7));}
 const mouth=new CatmullRomCurve3([new Vector3(-.21,-.045,.10),new Vector3(-.12,-.053,.205),new Vector3(0,-.055,.228),new Vector3(.12,-.053,.205),new Vector3(.21,-.045,.10)]);head.push(cor(new TubeGeometry(mouth,28,.004,5,false),0x36432a));
 for(let i=-5;i<=5;i++)head.push(oval(i*.033,-.064,.223-Math.abs(i)*.009,.006,.006,.005,claro,6));
 const eyes=[];for(const s of [-1,1])eyes.push(oval(s*.215,.11,.147,.036,.044,.027,0x101b18),oval(s*.224,.125,.169,.009,.012,.007,0xf0edce));
 const arm=[oval(.055,-.035,.03,.08,.07,.13,verde),oval(.11,-.11,.07,.050,.105,.065,verde)];
 const leg=[oval(.075,-.025,-.035,.115,.10,.17,verde),oval(.14,-.105,.045,.055,.075,.15,verde)];
 for(const [parts,n]of [[arm,4],[leg,5]]){parts.push(oval(.14,-.18,.16,.07,.025,.075,vermelho));for(let j=0;j<n;j++)parts.push(oval(.09+j*.025,-.19,.21+(j%2)*.02,.012,.012,.068,vermelho));for(let j=0;j<8;j++)parts.push(oval(.07+(j%3)*.035,-.023-Math.floor(j/3)*.025,.04,.007,.006,.006,j%2?claro:0x8a9553,6));}
 return{corpo:junta(body),cabeca:junta(head),olhos:junta(eyes),braco:junta(arm),coxa:junta(leg)};
}
export function criarCambaraensis(pai,max=22){
 const geo=geometriasCambaraensis(),group=new Group();group.name='sapinho-verde-de-barriga-vermelha';group.userData.especie='Melanophryniscus cambaraensis';pai.add(group);
 const mat=new MeshStandardMaterial({vertexColors:true,roughness:.57,metalness:0}),G={};
 const make=(g,n=max)=>{const im=new InstancedMesh(g,mat,n);im.count=0;im.frustumCulled=false;im.instanceMatrix.setUsage(DynamicDrawUsage);group.add(im);return im;};
 G.corpo=make(geo.corpo);G.cabeca=make(geo.cabeca);G.olhos=make(geo.olhos);
 // Geometria espelhada com faces corrigidas permite instâncias sem escala negativa.
 const espelho=g=>{const e=g.clone().scale(-1,1,1);for(const a of Object.values(e.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const p=(i+1)*a.itemSize+k,q=(i+2)*a.itemSize+k;[a.array[p],a.array[q]]=[a.array[q],a.array[p]];}return e;};
 G.bracoD=make(geo.braco);G.bracoE=make(espelho(geo.braco));G.coxaD=make(geo.coxa);G.coxaE=make(espelho(geo.coxa));
 const B=new Matrix4(),L=new Matrix4(),O=new Matrix4(),q=new Quaternion(),e=new Euler(),v=new Vector3(),s=new Vector3();let n=0;
 const put=(im,i,x,y,z,rx=0,ry=0,rz=0,sy=1)=>{q.setFromEuler(e.set(rx,ry,rz,'YXZ'));L.compose(v.set(x,y,z),q,s.set(1,sy,1));im.setMatrixAt(i,O.multiplyMatrices(B,L));};
 function escreve(f){if(n>=max)return;const i=n++,al=Math.max(0,Math.min(1,f.alerta||0)),esc=f.esc||1,move=f.estado==='anda'?.30:f.estado==='foge'?.48:0,sw=Math.sin((f.fase||0)*1.7)*move;
 q.setFromEuler(e.set(f.pitch||0,f.yaw||0,0,'YXZ'));B.compose(v.set(f.x,f.y+.30*esc,f.z),q,s.setScalar(esc));put(G.corpo,i,0,al*.08,0);put(G.cabeca,i,0,.12+al*.18,.32,-al*.15,f.cabeca||0);const pis=f.piscada<0&&f.piscada>-.12?.15:1;put(G.olhos,i,0,.12+al*.18,.32,-al*.15,f.cabeca||0,0,pis);
 for(const side of [-1,1]){put(side>0?G.bracoD:G.bracoE,i,side*.20,-.08+al*.18,.20,sw*side-al*.8,side*.12,side*al*.85);put(side>0?G.coxaD:G.coxaE,i,side*.20,-.08+al*.10,-.22,-sw*side-al*.25,side*-.35,side*al*.28);}}
 return{group,G,inicia(){n=0;},escreve,fim(){for(const im of Object.values(G)){im.count=n;im.instanceMatrix.needsUpdate=true;}},get quantidade(){return n;},dispose(){group.removeFromParent();for(const im of Object.values(G))im.dispose();new Set(Object.values(G).map(im=>im.geometry)).forEach(g=>g.dispose());mat.dispose();}};
}
