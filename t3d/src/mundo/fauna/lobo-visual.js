import {Group,Mesh,SphereGeometry,MeshStandardMaterial,MeshBasicMaterial,Color,DataTexture,RGBAFormat,RepeatWrapping,BufferGeometry,Float32BufferAttribute,TubeGeometry,CatmullRomCurve3,Vector3,LineSegments,LineBasicMaterial,DoubleSide} from 'three';
import {U} from '../config.js';

// Anatomia própria do Chrysocyon brachyurus; mesmas articulações da classe Animal.
export function criarLoboGuara(S){
 const root=new Group();root.name='lobo-guara';root.userData.especie='Chrysocyon brachyurus';root.userData.visual='lobo-guara-referencia';
 const materiais=[],hip=S.perna.sup+S.perna.inf+S.tronco.alt*.25+.025;
 const grupo=(pai,x=0,y=0,z=0)=>{const g=new Group();g.position.set(x*U,y*U,z*U);pai?.add(g);return g;};
 const dados=new Uint8Array(128*128*4);let seed=179;for(let i=0;i<128*128;i++){seed=seed*16807%2147483647;const v=218+seed%38;dados.set([v,v,v,255],i*4);}const fur=new DataTexture(dados,128,128,RGBAFormat);fur.wrapS=fur.wrapT=RepeatWrapping;fur.repeat.set(4,3);fur.needsUpdate=true;
 const mat=(c,pelo=true)=>{const m=new MeshStandardMaterial({color:c,roughness:pelo?.96:.32,map:pelo?fur:null,bumpMap:pelo?fur:null,bumpScale:pelo?.0012*U:0});materiais.push(m);return m;};
 const ruivo=mat(0xbf652d),dourado=mat(0xca813f),claro=mat(0xd39a5c),creme=mat(0xddd1ad),escuro=mat(0x24211d),preto=mat(0x151716),nariz=mat(0x141513,false),orelhaInt=mat(0x9c8b70);
 const oval=(pai,m,x,y,z,rx,ry,rz)=>{const o=new Mesh(new SphereGeometry(1,28,20),m);o.position.set(x*U,y*U,z*U);o.scale.set(rx*U,ry*U,rz*U);o.castShadow=true;pai.add(o);return o;};
 const gradiente=(o,baixo,alto)=>{const m=o.material.clone();m.vertexColors=true;m.color.setHex(0xffffff);materiais.push(m);o.material=m;const a=o.geometry.attributes.position,c=[];for(let i=0;i<a.count;i++){const t=Math.max(0,Math.min(1,(a.getY(i)+.45)*.9)),k=new Color(baixo).lerp(new Color(alto),t);c.push(k.r,k.g,k.b);}o.geometry.setAttribute('color',new Float32BufferAttribute(c,3));};
 const corpo=grupo(root,0,hip,0);
 const tronco=oval(corpo,ruivo,0,.01,-.015,.155,.175,.415);gradiente(tronco,0xbb8750,0xb95927);
 oval(corpo,ruivo,0,.035,.25,.130,.195,.195);oval(corpo,ruivo,0,.025,-.295,.137,.15,.15);
 oval(corpo,claro,0,-.09,.20,.092,.15,.13);
 // Pernas altas, finas e contínuas, com joelhos e jarretes articulados.
 const pernas=[];for(const [sx,sz]of [[1,1],[-1,1],[1,-1],[-1,-1]]){
  const q=grupo(corpo,sx*.107,-S.tronco.alt*.25,sz>0?.255:-.295),j=grupo(q,0,-S.perna.sup,0);
  const upper=oval(q,ruivo,0,-S.perna.sup*.42,0,sz>0?.047:.065,S.perna.sup*.61,sz>0?.051:.075);gradiente(upper,0x24241f,0xbf7037);
  oval(j,preto,0,-S.perna.inf*.46,-.006,.025,S.perna.inf*.60,.030);oval(j,escuro,0,.006,0,.033,.040,.035);
  const pata=oval(j,preto,0,-S.perna.inf,.025,.036,.025,.063);for(let k=-1;k<=1;k++){oval(j,preto,k*.019,-S.perna.inf-.002,.069,.013,.020,.026);oval(j,nariz,k*.019,-S.perna.inf-.005,.089,.004,.005,.010);}
  pernas.push({quadril:q,joelho:j,pata});
 }
 const pesc=grupo(corpo,0,.10,.31);oval(pesc,ruivo,0,.045,0,.095,.145,.115);oval(pesc,dourado,0,.065,.071,.070,.13,.055);
 // A crina segue o pescoço e a cernelha, sem blocos rígidos.
 const mane=oval(pesc,escuro,0,.09,-.072,.047,.155,.052);mane.rotation.x=-.16;
 oval(corpo,escuro,0,.168,.17,.042,.055,.19);
 const cab=grupo(pesc,0,.19,.07);oval(cab,ruivo,0,.005,.01,.085,.091,.108);
 for(const s of [-1,1])oval(cab,dourado,s*.052,-.025,.046,.041,.049,.069);
 oval(cab,escuro,0,-.026,.135,.046,.041,.107);oval(cab,escuro,0,-.005,.096,.043,.047,.083);
 oval(cab,creme,0,-.064,.108,.033,.017,.085);oval(cab,nariz,0,-.020,.225,.028,.021,.021);
 const linha=(pai,pts,m,r)=>{const g=new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p).multiplyScalar(U))),18,r*U,5,false);const o=new Mesh(g,m);pai.add(o);};
 for(const s of [-1,1])linha(cab,[[0,-.049,.226],[s*.031,-.054,.173],[s*.045,-.049,.105]],nariz,.0014);
 // Orelhas grandes e estreitas, com borda espessa e interior claro.
 const orelhas=[];for(const s of [-1,1]){
  const o=grupo(cab,s*.058,.061,-.027);o.rotation.z=-s*.17;
  const v=[],idx=[],n=16;for(let face=0;face<2;face++)for(let i=0;i<=n;i++){const t=i/n,w=Math.sin(Math.PI*Math.pow(t,.72))*.057,y=t*.235,z=(face?-.014:.014)*(1-t*.94);v.push(-w*U,y*U,z*U,w*U,y*U,z*U);}
  const stride=2*(n+1);for(let i=0;i<n;i++){const a=i*2,b=a+2,c=a+stride,d=b+stride;idx.push(a,a+1,b,a+1,b+1,b,c,d,c+1,c+1,d,d+1,a,b,c,b,d,c,a+1,c+1,b+1,b+1,c+1,d+1);}
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();const m=ruivo.clone();m.side=DoubleSide;materiais.push(m);o.add(new Mesh(geo,m));
  const inner=new Mesh(geo.clone(),orelhaInt);inner.material.side=DoubleSide;inner.scale.set(.76,.85,.3);inner.position.set(0,.012*U,.017*U);o.add(inner);oval(o,creme,0,.065,.023,.024,.06,.006);orelhas.push(o);
 }
 // Olhos pequenos, laterais; mantém a reflexão noturna prevista pela IA.
 const olhos=[];for(const s of [-1,1]){oval(cab,escuro,s*.067,.024,.072,.023,.016,.017);const m=new MeshBasicMaterial({color:0x684322}),e=oval(cab,m,s*.074,.025,.082,.012,.010,.009);e.userData.escuro=new Color(0x684322);e.userData.brilho=new Color(0xa28c52);const pupil=new Mesh(new SphereGeometry(.55,16,12),new MeshBasicMaterial({color:0x0c1010}));pupil.position.z=.65;e.add(pupil);const dot=new Mesh(new SphereGeometry(.13,8,6),new MeshBasicMaterial({color:0xf8eedb}));dot.position.set(-.18,.25,1);e.add(dot);olhos.push(e);}
 // Cauda relativamente curta, pendente, com a ponta esbranquiçada.
 const cauda=[],lens=[.16,.15,.12];let parent=corpo;for(let i=0;i<3;i++){const len=lens[i],t=grupo(parent,0,i?0:.02,i?-lens[i-1]:-.4),curve=new CatmullRomCurve3([new Vector3(),new Vector3(0,0,-len*U)]),geo=new TubeGeometry(curve,16,1,16,false),p=geo.attributes.position,start=lens.slice(0,i).reduce((a,b)=>a+b,0);for(let j=0;j<=16;j++){const f=j/16,c=curve.getPointAt(f),r=Math.max(.002,.051*Math.sin(Math.PI*(.2+(start+f*len)/.43*.8)))*U;for(let k=0;k<=16;k++){const q=j*17+k;p.setXYZ(q,c.x+(p.getX(q)-c.x)*r,c.y+(p.getY(q)-c.y)*r,c.z+(p.getZ(q)-c.z)*r);}}geo.computeVertexNormals();t.add(new Mesh(geo,i===2?creme:ruivo));cauda.push(t);parent=t;}
 // Fibras curtas do corpo e fibras mais longas da crina; uma só chamada de desenho.
 const fios=[],cores=[];const fibras=(rx,ry,rz,cy,cz,n,cor,tam)=>{for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,a=i*2.399963,r=Math.sqrt(1-y*y),x=Math.cos(a)*r,z=Math.sin(a)*r,p=new Vector3(x*rx,y*ry+cy,z*rz+cz),normal=new Vector3(x/rx,y/ry,z/rz).normalize(),end=p.clone().addScaledVector(normal,tam*(.6+i%7*.08)),c=new Color(cor).multiplyScalar(.8+i%11*.025);fios.push(...p.multiplyScalar(U),...end.multiplyScalar(U));cores.push(c.r,c.g,c.b,c.r,c.g,c.b);}};
 fibras(.155,.175,.415,.01,-.015,2200,0xc17a3e,.012);fibras(.045,.045,.18,.175,.17,260,0x22231d,.035);
 const fg=new BufferGeometry();fg.setAttribute('position',new Float32BufferAttribute(fios,3));fg.setAttribute('color',new Float32BufferAttribute(cores,3));corpo.add(new LineSegments(fg,new LineBasicMaterial({vertexColors:true,transparent:true,opacity:.55})));
 return {root,corpo,pesc,cab,orelhas,olhos,cauda,pernas,materiais,hip,ombro:hip+.2,comprimento:S.tronco.comp,dispose(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());fur.dispose();}};
}
