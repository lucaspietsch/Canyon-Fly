import {Group,InstancedMesh,SphereGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Color,Float32BufferAttribute,MeshStandardMaterial,Matrix4,Quaternion,Euler,DynamicDrawUsage,DoubleSide} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {U,qualidade} from '../config.js';
export const CORES_LIBELULAS={azul:0x278fce,verde:0x4eaf59,vermelha:0xd84d3e,amarela:0xe5bd3f};
const cor=(g,hex)=>{g=g.index?g.toNonIndexed():g;const c=new Color(hex),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);g.setAttribute('color',new Float32BufferAttribute(a,3));return g;};
const oval=(x,y,z,a,b,c,col)=>cor(new SphereGeometry(1,12,8).scale(a,b,c).translate(x,y,z),col);
const junta=p=>{const g=mergeGeometries(p);p.forEach(x=>x.dispose());return g;};
const linha=(pts,r,col)=>cor(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),12,r,4,false),col);
export function criarVisualLibelulas(pai,max=24){
 const group=new Group();group.name='libelulas-quatro-cores';pai.add(group);const body=[oval(0,0,0,.075,.07,.12,0xffffff),oval(0,.018,.14,.075,.065,.065,0xb4c5b9)];
 for(const s of [-1,1]){body.push(oval(s*.045,.045,.17,.043,.045,.04,0x202f28));for(let i=0;i<3;i++)body.push(linha([[s*.045,-.02,.07-i*.05],[s*.15,-.07,.09-i*.04],[s*.19,-.09,.15-i*.04]],.005,0x29372d));}
 for(let i=0;i<10;i++)body.push(oval(0,-.003,-.13-i*.071,.027*(1-i*.06),.025*(1-i*.06),.041,i%2?0xdce8df:0x9eafa4));
 const parts=[oval(.27,0,0,.26,.0017,.065,0xbdd1c6)];for(let i=0;i<5;i++)parts.push(linha([[.025,0,0],[.22,.002,(i-2)*.024],[.49,.002,(i-2)*.014]],.0012,0x465d50));const wing=junta(parts),mirror=wing.clone().scale(-1,1,1);for(const a of Object.values(mirror.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const p=(i+1)*a.itemSize+k,q=(i+2)*a.itemSize+k;[a.array[p],a.array[q]]=[a.array[q],a.array[p]];}
 const mat=new MeshStandardMaterial({vertexColors:true,roughness:.40,metalness:.18}),wm=new MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.48,roughness:.4,side:DoubleSide,depthWrite:false});
 const make=(g,m)=>{const im=new InstancedMesh(g,m,max);im.count=0;im.frustumCulled=false;im.instanceMatrix.setUsage(DynamicDrawUsage);group.add(im);return im;};const G={corpo:make(junta(body),mat),frenteD:make(wing,wm),frenteE:make(mirror,wm),trasD:make(wing,wm),trasE:make(mirror,wm)},B=new Matrix4(),L=new Matrix4(),O=new Matrix4(),q=new Quaternion(),v=new Vector3(),s=new Vector3(),e=new Euler();let n=0;
 return{group,G,inicia(){n=0;},escreve(b,t=0){if(n>=max)return;const i=n++;q.setFromEuler(e.set(b.pitch||0,b.yaw||0,0));B.compose(v.set(b.x,b.y,b.z),q,s.setScalar(b.esc||1));G.corpo.setMatrixAt(i,B);G.corpo.setColorAt(i,new Color(CORES_LIBELULAS[b.cor]||CORES_LIBELULAS.azul));for(const side of [-1,1])for(const front of [true,false]){const bat=Math.sin(t*55+(front?0:1.3))* .34;q.setFromEuler(e.set(0,side*(front?-.10:.30),side*bat));L.compose(v.set(0,.015,front?.03:-.08),q,s.set(1,1,front?1:1.2));G[(front?'frente':'tras')+(side>0?'D':'E')].setMatrixAt(i,O.multiplyMatrices(B,L));}},fim(){for(const im of Object.values(G)){im.count=n;im.instanceMatrix.needsUpdate=true;}if(G.corpo.instanceColor)G.corpo.instanceColor.needsUpdate=true;},dispose(){group.removeFromParent();for(const im of Object.values(G))im.dispose();new Set(Object.values(G).map(im=>im.geometry)).forEach(g=>g.dispose());mat.dispose();wm.dispose();}};
}
export function criarLibelulas(M){
 const cap=qualidade().aves<.7?12:24,R=criarVisualLibelulas(M.cen.grupo,cap),lista=[],S={t:0,spawn:0,cor:0};
 function habitat(x,z){if(M.ancestral?.ativo())return true;const b=M.vegetacao.base,t=b.tipoEm(x,z);return t==='mata'||t==='mataBaixa'||t==='turfeira';}
 function spawn(J){for(let k=0;k<30;k++){const a=Math.random()*Math.PI*2,d=(3+Math.random()*22)*U,x=J.x+Math.cos(a)*d,z=J.z+Math.sin(a)*d;if(!habitat(x,z))continue;lista.push({x,z,y:M.cen.chao(x,z)+( .5+Math.random()*1.8)*U,cx:x,cz:z,yaw:a,cor:Object.keys(CORES_LIBELULAS)[S.cor++%4],esc:.065*U,vida:35+Math.random()*40,fase:Math.random()*6});return true;}return false;}
 function desenha(){R.inicia();lista.forEach(b=>R.escreve(b,S.t));R.fim();}
 function tick(dt,J,E){S.t+=dt;if(!J||E.h<7||E.h>19||E.alt<0){desliga();return;}for(let i=lista.length-1;i>=0;i--){const b=lista[i];b.vida-=dt;if(b.vida<=0||Math.hypot(b.x-J.x,b.z-J.z)>48*U){lista.splice(i,1);continue;}b.fase+=dt;b.x=b.cx+Math.sin(b.fase*.8)*2.3*U;b.z=b.cz+Math.cos(b.fase*.65)*1.8*U;b.y=M.cen.chao(b.x,b.z)+(1.1+Math.sin(b.fase*1.7)*.35)*U;b.yaw=Math.atan2(Math.cos(b.fase*.8)*.8,-Math.sin(b.fase*.65)*.65);}S.spawn+=dt;if(S.spawn>.7&&lista.length<cap){S.spawn=0;spawn(J);}desenha();}
 function desliga(){lista.length=0;desenha();}
 return{R,lista,S,tick,spawn,habitat,desenha,desliga,info:()=>`Libélulas ${lista.length} · azul, verde, vermelha e amarela`};
}
