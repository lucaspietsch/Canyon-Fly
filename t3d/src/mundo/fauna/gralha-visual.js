import {Group,Mesh,SphereGeometry,ConeGeometry,CylinderGeometry,MeshStandardMaterial,MeshBasicMaterial,BufferGeometry,Float32BufferAttribute,Color,InstancedMesh,DynamicDrawUsage,Matrix4,Vector3,Quaternion,Euler,AdditiveBlending} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function tamanhoBando(epoca,r=Math.random()){return epoca==='1950'?12:epoca==='1689-1700'?20+Math.floor(Math.max(0,Math.min(.999999,r))*21):6;}
const oval=(x,y,z,rx,ry,rz)=>new SphereGeometry(1,20,14).scale(rx,ry,rz).translate(x,y,z);
function cor(g,hex){g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;}
const junta=(p)=>mergeGeometries(p);
export function geometriasGralha(){
 const azul=0x2467c5,preto=0x111820,pena=0x1751a6;
 const corpo=junta([cor(oval(0,0,0,.23,.28,.43),azul),cor(oval(0,.10,.24,.20,.27,.22),preto),cor(oval(0,-.13,.04,.19,.15,.32),azul)]);
 const h=[cor(oval(0,0,0,.17,.19,.19),preto),cor(new ConeGeometry(.085,.27,12).rotateX(Math.PI/2).scale(1,.60,1).translate(0,-.045,.25),0x303b43)];
 for(const s of [-1,1]){h.push(cor(oval(s*.147,.027,.083,.014,.040,.043),0x97aab7),cor(oval(s*.159,.027,.086,.014,.030,.033),0x080d12),cor(oval(s*.167,.04,.105,.006,.010,.011),0xe4efff));}
 for(let i=0;i<5;i++)h.push(cor(oval((i-2)*.024,.145+(.04-i*.005),-.075,.022,.13-i*.009,.033),preto));
 const asa=[];for(let i=0;i<10;i++){const g=oval(.22+i*.052,0,-.05-i*.018,.044,.018,.23+i*.016);g.rotateY(-i*.035);asa.push(cor(g,i>5?0x172c49:pena));}asa.push(cor(oval(.22,.015,.03,.24,.04,.25),azul));
 const cauda=[];for(let i=-2;i<=2;i++)cauda.push(cor(oval(i*.045,0,-.30-Math.abs(i)*.025,.027,.018,.33-Math.abs(i)*.02),i%2?pena:azul));
 const pernas=[];for(const s of [-1,1]){pernas.push(cor(new CylinderGeometry(.014,.012,.19,7).translate(s*.092,-.10,0),0x343b3e));for(let i=-1;i<=1;i++){pernas.push(cor(oval(s*.092+i*.024,-.20,.044,.008,.008,.07),0x252e32));}pernas.push(cor(oval(s*.092,-.20,-.05,.008,.008,.055),0x252e32));}
 return {corpo,cab:junta(h),asa:junta(asa),cauda:junta(cauda),pernas:junta(pernas)};
}
// Partes instanciadas: o bando de quarenta mantém o mesmo número de chamadas de desenho.
export function criarGralhas(pai,max=96,opcao={}){
 const geo=opcao.geo||geometriasGralha(),group=new Group();group.name=opcao.nome||'gralhas-azuis-sagradas';pai.add(group);const mat=new MeshStandardMaterial({vertexColors:true,roughness:.85,emissive:0x153c89,emissiveIntensity:.10}),haloMat=new MeshBasicMaterial({color:0x8bbdff,transparent:true,opacity:.075,depthWrite:false,blending:AdditiveBlending}),goldMat=new MeshBasicMaterial({color:0xffdf88,transparent:true,opacity:.45,depthWrite:false,blending:AdditiveBlending});
 const make=(g,m=mat)=>{const a=new InstancedMesh(g,m,max);a.count=0;a.frustumCulled=false;a.instanceMatrix.setUsage(DynamicDrawUsage);group.add(a);return a;};
 const espelhada=geo.asa.clone().scale(-1,1,1);if(espelhada.index){const a=espelhada.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}else{for(const a of Object.values(espelhada.attributes)){for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const p=(i+1)*a.itemSize+k,q=(i+2)*a.itemSize+k,v=a.array[p];a.array[p]=a.array[q];a.array[q]=v;}}}
 const G={corpo:make(geo.corpo),cab:make(geo.cab),asaD:make(geo.asa),asaE:make(espelhada),cauda:make(geo.cauda),pernas:make(geo.pernas),halo:make(new SphereGeometry(.57,12,8),haloMat),fagulha:make(new SphereGeometry(.018,6,4),goldMat)};
 const base=new Matrix4(),local=new Matrix4(),out=new Matrix4(),q=new Quaternion(),v=new Vector3(),scale=new Vector3(),e=new Euler();let n=0;
 const put=(im,i,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{q.setFromEuler(e.set(rx,ry,rz,'YXZ'));local.compose(v.set(x,y,z),q,scale.set(sx,sy,sz));im.setMatrixAt(i,out.multiplyMatrices(base,local));};
 function inicia(){n=0;}
 function escreve(b,t=0,sagrado=.15){if(n>=max)return;const i=n++,flying=['voa','sobrevoo','plana','foge','assedia','mergulha','guia'].includes(b.estado),s=b.s||1;
 q.setFromEuler(e.set((b.pitch||0)+(flying?0:(opcao.pousoPitch??-.52)),b.yaw||0,b.roll||0,'YXZ'));base.compose(v.set(b.x,b.y,b.z),q,scale.setScalar(s));put(G.corpo,i,0,0,0);put(G.cab,i,0,.25+(flying?-.05:0),.28,b.cabP||0,b.cabY||0);put(G.cauda,i,0,-.02,-.28,.12);put(G.pernas,i,0,-.18,.08,flying?1.3:.15,0,0,1,flying?.4:1,1);
 const bat=flying&&!(opcao.planaSemBater&&b.estado==='plana')?Math.sin((b.fase||t*8)*6.283)*.75:0;for(const side of [-1,1])put(side>0?G.asaD:G.asaE,i,side*.13,.03,0,0,side*(flying?.15:1.4),side*bat,flying?1:(opcao.asaDobradaEscala??1),1,1);
 const pulse=.9+.1*Math.sin(t*2+i);put(G.halo,i,0,.08,0,0,0,0,pulse,1.2*pulse,pulse);const a=t*.65+i*2.4;put(G.fagulha,i,Math.cos(a)*.43,.1+((t*.12+i*.23)%1)*.65,Math.sin(a)*.43,0,0,0,sagrado*2,sagrado*2,sagrado*2);
 }
 function fim(epoca='2026'){Object.values(G).forEach(g=>{g.count=n;g.instanceMatrix.needsUpdate=true;});haloMat.opacity=epoca==='1689-1700'?.15:epoca==='1950'?.085:.05;mat.emissiveIntensity=epoca==='1689-1700'?.24:.10;if(opcao.sagrado===false){G.halo.count=G.fagulha.count=0;mat.emissiveIntensity=0;}}
 function dispose(){group.removeFromParent();new Set([...Object.values(geo),...Object.values(G).map(g=>g.geometry)]).forEach(g=>g.dispose());[mat,haloMat,goldMat].forEach(m=>m.dispose());}
 return {group,G,inicia,escreve,fim,dispose,get quantidade(){return n;}};
}
