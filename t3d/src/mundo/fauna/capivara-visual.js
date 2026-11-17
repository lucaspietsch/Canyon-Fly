import {Group,Mesh,SphereGeometry,MeshStandardMaterial,Color,DataTexture,RGBAFormat,RepeatWrapping,BufferGeometry,Float32BufferAttribute,Vector3,LineSegments,LineBasicMaterial,TubeGeometry,CatmullRomCurve3} from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {U} from '../config.js';

// Hydrochoerus hydrochaeris: corpo robusto, sem cauda externa e focinho rombudo.
export function criarCapivaraVisual(S){
 const root=new Group();root.name=S.juvenil?'capivara-filhote':'capivara-adulta';root.userData.especie='Hydrochoerus hydrochaeris';root.userData.visual='capivara-referencia';root.userData.juvenil=!!S.juvenil;
 const materiais=[],hip=S.perna.sup+S.perna.inf+S.tronco.alt*.25+.026;
 const grupo=(pai,x=0,y=0,z=0)=>{const g=new Group();g.position.set(x*U,y*U,z*U);pai?.add(g);return g;};
 const pixels=new Uint8Array(128*128*4);let seed=863;for(let i=0;i<128*128;i++){seed=seed*16807%2147483647;const v=210+seed%46;pixels.set([v,v,v,255],i*4);}const fur=new DataTexture(pixels,128,128,RGBAFormat);fur.wrapS=fur.wrapT=RepeatWrapping;fur.repeat.set(4,3);fur.needsUpdate=true;
 const mat=(color,pelo=true)=>{const m=new MeshStandardMaterial({color,roughness:pelo?.97:.38,map:pelo?fur:null,bumpMap:pelo?fur:null,bumpScale:pelo?.0015*U:0});materiais.push(m);return m;};
 const marrom=mat(S.juvenil?0x9e713e:0x85613e),dourado=mat(S.juvenil?0xae8150:0x96724a),ventre=mat(0x9c8057),pataMat=mat(0x4b4130),unha=mat(0x37372d,false),escuro=mat(0x342e22,false),narina=mat(0x262922,false),orelhaMat=mat(0x5c4d35);
 const oval=(pai,m,x,y,z,rx,ry,rz)=>{const o=new Mesh(new SphereGeometry(1,32,24),m);o.position.set(x*U,y*U,z*U);o.scale.set(rx*U,ry*U,rz*U);o.castShadow=true;pai.add(o);return o;};
 const corpo=grupo(root,0,hip,0),body=oval(corpo,marrom,0,.02,-.02,.265,.275,.49);
 // Dorso e ventre em gradação, preservando a cor multiplicativa do pelo molhado.
 const m=marrom.clone();m.vertexColors=true;m.color.setHex(0xffffff);materiais.push(m);body.material=m;const pos=body.geometry.attributes.position,colors=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i),c=new Color(S.juvenil?0xb08d56:0x9c8055).lerp(new Color(S.juvenil?0x946a3a:0x795734),Math.max(0,Math.min(1,(y+.4)*.9)));colors.push(c.r,c.g,c.b);}body.geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
 const pernas=[];for(const[sx,sz]of [[1,1],[-1,1],[1,-1],[-1,-1]]){const q=grupo(corpo,sx*.178,-S.tronco.alt*.25,sz>0?.285:-.29),j=grupo(q,0,-S.perna.sup,0);oval(q,marrom,0,-S.perna.sup*.37,0,sz>0?.067:.086,S.perna.sup*.83,.076);oval(j,pataMat,0,-S.perna.inf*.38,.007,.046,S.perna.inf*.67,.050);oval(j,marrom,0,.005,0,.054,.044,.055);const pata=oval(j,pataMat,0,-S.perna.inf,.035,.061,.026,.087);
  const dedos=sz>0?4:3;for(let k=0;k<dedos;k++){const x=(k-(dedos-1)/2)*.028;oval(j,pataMat,x,-S.perna.inf-.002,.09,.016,.018,.040);oval(j,unha,x,-S.perna.inf-.004,.123,.012,.009,.016);}pernas.push({quadril:q,joelho:j,pata});}
 const pesc=grupo(corpo,0,.085,.32);oval(pesc,marrom,0,.035,.025,.158,.17,.18);
 const cab=grupo(pesc,0,.095,.085),headScale=S.juvenil?1.10:1;
 const caixa=(pai,m,w,h,d,x,y,z,r)=>{const o=new Mesh(new RoundedBoxGeometry(w*U,h*U,d*U,5,r*U),m);o.position.set(x*U,y*U,z*U);o.castShadow=true;pai.add(o);return o;};
 caixa(cab,dourado,.255*headScale,.245*headScale,.35,0,.012,.055,.09);caixa(cab,dourado,.255*headScale,.185,.23,0,-.023,.22,.074);
 oval(cab,ventre,0,-.096,.16,.107,.032,.139);
 // Narinas e olhos ficam altos: a cabeça continua visível na imersão.
 for(const s of [-1,1]){oval(cab,escuro,s*.069,.029,.331,.022,.012,.005);oval(cab,narina,s*.065,.034,.336,.009,.005,.003);}
 const olhos=[];for(const s of [-1,1]){oval(cab,escuro,s*.124,.076,.125,.017,.015,.022);const e=oval(cab,mat(0x1b2019,false),s*.136,.081,.13,.009,.010,.014);e.userData.escuro=new Color(0x1b2019);e.userData.brilho=new Color(0x7b7951);olhos.push(e);}
 const orelhas=[];for(const s of [-1,1]){const o=grupo(cab,s*.104,.127,-.058);o.rotation.z=-s*.25;oval(o,marrom,0,.012,0,.037,.044,.024);oval(o,orelhaMat,0,.015,.018,.025,.031,.009);oval(o,dourado,0,.003,.021,.015,.018,.005);orelhas.push(o);}
 const linha=(pts,r=.0013)=>{const geo=new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p).multiplyScalar(U))),16,r*U,5,false);cab.add(new Mesh(geo,escuro));};
 linha([[-.09,-.073,.285],[0,-.079,.335],[.09,-.073,.285]]);linha([[0,-.079,.335],[0,-.045,.339]],.001);
 // Cauda sem malha: os três pivôs mantêm o contrato de animação sem criar uma cauda visível.
 const cauda=[grupo(corpo,0,0,-.46)];cauda.push(grupo(cauda[0]));cauda.push(grupo(cauda[1]));
 const fios=[],tons=[];const fibra=(rx,ry,rz,cx,cy,cz,count,cor,tam)=>{for(let i=0;i<count;i++){const yy=1-2*(i+.5)/count,a=i*2.399963,r=Math.sqrt(1-yy*yy),xx=Math.cos(a)*r,zz=Math.sin(a)*r,p=new Vector3(xx*rx+cx,yy*ry+cy,zz*rz+cz),n=new Vector3(xx/rx,yy/ry,zz/rz).normalize(),end=p.clone().addScaledVector(n,tam*(.7+i%7*.08));end.z-=tam*.5;const c=new Color(cor).multiplyScalar(.78+i%13*.024);fios.push(...p.multiplyScalar(U),...end.multiplyScalar(U));tons.push(c.r,c.g,c.b,c.r,c.g,c.b);}};
 fibra(.265,.275,.49,0,.02,-.02,S.juvenil?1700:2600,S.juvenil?0xa98550:0x937044,S.juvenil?.010:.016);
 const fg=new BufferGeometry();fg.setAttribute('position',new Float32BufferAttribute(fios,3));fg.setAttribute('color',new Float32BufferAttribute(tons,3));const fm=new LineBasicMaterial({vertexColors:true,transparent:true,opacity:.62});materiais.push(fm);corpo.add(new LineSegments(fg,fm));
 // Bigodes discretos; materiais expostos para o recorte do corpo abaixo da água.
 const whiskers=[],wm=new LineBasicMaterial({color:0x74654c,transparent:true,opacity:.5});materiais.push(wm);for(const s of [-1,1])for(let i=0;i<5;i++){whiskers.push(s*.09*U,(-.035-i*.005)*U,.28*U,s*(.17+i*.007)*U,(-.04-i*.012)*U,(.33-i*.018)*U);}const wg=new BufferGeometry();wg.setAttribute('position',new Float32BufferAttribute(whiskers,3));cab.add(new LineSegments(wg,wm));
 return {root,corpo,pesc,cab,orelhas,olhos,cauda,pernas,materiais,hip,ombro:hip+.23,comprimento:S.tronco.comp,dispose(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());fur.dispose();}};
}
