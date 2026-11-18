import {Group,Mesh,BoxGeometry,CylinderGeometry,SphereGeometry,TorusGeometry,MeshStandardMaterial,Float32BufferAttribute} from 'three';
import {U} from '../config.js';
export const CARGAS_MADEIRA={toras:{diametrosM:[1.8,1.7,1.44],comprimentoM:10.5},gigante:{diametrosM:[2.5],comprimentoM:10.5},tabuas:{camadas:35,larguraM:2.5,alturaM:3.64,comprimentoM:7.8}};
/** Caminhão de cabine arredondada, capô longo e seis rodas; medidas em metros. */
export function criarCaminhaoMadeira(tipo='toras',cor=0x6c786d){
 if(!CARGAS_MADEIRA[tipo])throw Error('Carga desconhecida: '+tipo);
 const g=new Group(),carga=new Group(),rodas=[];g.name='caminhao-1950-'+tipo;g.scale.setScalar(U);g.userData.carga=tipo;g.userData.medidas=CARGAS_MADEIRA[tipo];g.add(carga);
 const mat=(color,extra={})=>new MeshStandardMaterial({color,roughness:.85,...extra}),pintura=mat(cor),metal=mat(0x8b918b,{metalness:.6,roughness:.5}),pneu=mat(0x222522),vidro=mat(0x233941,{metalness:.2,roughness:.3}),madeira=mat(0x806345),casca=mat(0x655b49,{vertexColors:true}),corte=mat(0xc7a977),cinta=mat(0x352d26);
 const box=(p,w,h,d,m,x,y,z)=>{const o=new Mesh(new BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
 const oval=(p,m,x,y,z,a,b,c)=>{const o=new Mesh(new SphereGeometry(1,20,14),m);o.position.set(x,y,z);o.scale.set(a,b,c);p.add(o);return o;};
 box(g,1.1,.24,10.8,pneu,0,.86,-.7);box(g,2.45,.20,8.0,madeira,0,1.30,-2.15);box(g,2.34,1.22,1.90,pintura,0,1.90,2.50);oval(g,pintura,0,2.48,2.49,1.17,.61,.96);box(g,2.0,.62,.08,vidro,0,2.53,3.36);box(g,.055,.66,.12,metal,0,2.54,3.42);
 for(const s of [-1,1]){box(g,.055,.65,.93,vidro,s*1.177,2.56,2.50);box(g,.08,.06,.34,metal,s*1.22,1.95,2.37);oval(g,pintura,s*.99,1.23,3.67,.39,.33,.91);box(g,.48,.14,1.5,metal,s*1.14,.94,2.35);}
 oval(g,pintura,0,1.65,3.90,.88,.50,1.31);box(g,1.55,.73,.16,metal,0,1.39,4.89);for(let i=0;i<5;i++)box(g,1.43,.045,.04,pneu,0,1.17+i*.13,4.99);box(g,2.6,.17,.24,metal,0,.91,4.98);
 for(const s of [-1,1])oval(g,mat(0xe7dcb2,{emissive:0x413a26,emissiveIntensity:.2}),s*.91,1.54,4.65,.19,.19,.12);
 for(const z of [3.76,-3.25,-4.80])for(const s of [-1,1]){const wheel=new Group();wheel.position.set(s*1.1,.65,z);g.add(wheel);const tire=new Mesh(new CylinderGeometry(.65,.65,.40,24),pneu);tire.rotation.z=Math.PI/2;wheel.add(tire);const hub=new Mesh(new CylinderGeometry(.34,.34,.42,20),metal);hub.rotation.z=Math.PI/2;wheel.add(hub);rodas.push(wheel);}
 if(tipo==='tabuas'){
  for(let y=0;y<35;y++)for(let x=0;x<6;x++){const p=box(carga,.395,.082,7.8-(x%3)*.07,mat(0x9b805d+y%4*0x030302),-.99+x*.40,1.49+y*.104,-2.15);p.position.x+=Math.sin(y*2.3)*.025;}
  for(const z of [-5.3,-2.2,1.0]){box(carga,2.55,.055,.10,cinta,0,5.08,z);for(const s of [-1,1])box(carga,.055,3.69,.10,cinta,s*1.26,3.26,z);}
 }else{
  const specs=tipo==='gigante'?[[0,2.73,1.25]]:[[-.87,2.24,.90],[.90,2.19,.85],[0,3.65,.72]];
  for(const [i,[x,y,r]]of specs.entries()){
   const trunk=new Mesh(new CylinderGeometry(r*.95,r,10.5,24),casca);const attr=trunk.geometry.attributes.position,colors=[];for(let k=0;k<attr.count;k++){const x=attr.getX(k),y=attr.getY(k),z=attr.getZ(k),a=Math.atan2(z,x),f=1+.025*Math.sin(a*7)+.012*Math.sin(a*13+y*.4);attr.setX(k,x*f);attr.setZ(k,z*f);const c=.76+.20*Math.abs(Math.sin(a*11+y*.7));colors.push(c,c*.98,c*.91);}trunk.geometry.setAttribute('color',new Float32BufferAttribute(colors,3));trunk.geometry.computeVertexNormals();trunk.rotation.x=Math.PI/2;trunk.position.set(x,y,-2.0);carga.add(trunk);
   for(const side of [-1,1]){const disc=new Mesh(new CylinderGeometry(r*.97,r*.97,.025,28),corte);disc.rotation.x=Math.PI/2;disc.position.set(x,y,-2.0+side*5.265);carga.add(disc);for(let k=1;k<=8;k++){const ring=new Mesh(new TorusGeometry(r*k/9,.008,4,36),madeira);ring.position.set(x,y,disc.position.z+side*.016);carga.add(ring);}}
   for(let k=0;k<12;k++){const a=k/12*Math.PI*2;box(carga,.035,.035,10.4,madeira,x+Math.sin(a)*r,y+Math.cos(a)*r,-2);}
  }
  for(const z of [-5.4,.7]){for(const s of [-1,1])box(carga,.10,3.1,.12,cinta,s*1.77,2.78,z);box(carga,3.55,.10,.12,cinta,0,4.25,z);}
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return{g,carga,rodas,tipo,tick(dt,velMS=0){for(const w of rodas)w.rotation.x+=velMS*dt/.65;},dispose(){g.removeFromParent();const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());}};
}
