import { Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, Color, Float32BufferAttribute } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { perfilCorpo } from '../gente/geometrias.js';

export function constroiMohr(H,def){
 const mat=(color,roughness=.85,metalness=0)=>new MeshStandardMaterial({color,roughness,metalness});
 const r=H.pessoa3d({nome:def.nome,x:0,y:-50,z:0,yaw:0,camisa:mat(0xc37c36),manga:mat(0x1b2427),calca:mat(0x39432b),pele:mat(0xc6a17f),capacete:mat(0xe48b31,.48,.1),cabelo:0x30251d,barba:false,oculos:false,olhos:0x493c2d});
 r.av.name='mohr';r.av.userData.personagem='mohr';r.cab.scale.set(.48,.51,.52);r.tronco.scale.x=.91;
 const normal=new Group(),power=new Group(),hair=new Group();r.av.add(normal);r.tronco.add(power);r.cab.add(hair);
 const preto=mat(0x141a20),cabelo=mat(0x30251d,.98),couro=mat(0x29231e);
 const brilho=new MeshStandardMaterial({color:0xdc3834,emissive:0xe82921,emissiveIntensity:.20,roughness:.5});
 const mk=(pai,g,m,x=0,y=0,z=0)=>{const o=new Mesh(g,m);o.position.set(x,y,z);pai.add(o);return o;};
 const caixa=(pai,w,h,d,m,x,y,z,rad=.04)=>mk(pai,new RoundedBoxGeometry(w,h,d,2,Math.min(rad,w/3,h/3,d/3)),m,x,y,z);
 const oval=(pai,m,x,y,z,rx,ry,rz)=>{const o=mk(pai,new SphereGeometry(1,24,16),m,x,y,z);o.scale.set(rx,ry,rz);return o;};
 const linha=(pai,pts,m,rad=.018)=>mk(pai,new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),28,rad,7,false),m);
 // Corpo com cintura, rosto próprio de mandíbula mais estreita e cabelo curto castanho.
 const corpo=r.tronco.children[0];corpo.geometry=perfilCorpo([[0,0,0],[.06,.70,.44],[.40,.73,.47],[1.2,.84,.58],[1.7,.86,.60],[1.97,.58,.41],[2.07,.27,.23],[2.12,0,0]],32);corpo.position.y=0;corpo.scale.set(1,1,1);r.tronco.children[1].visible=false;
 const f=r.rosto.cabeca.geometry.attributes.position;for(let i=0;i<f.count;i++)if(f.getY(i)<-.28)f.setX(i,f.getX(i)*.95);f.needsUpdate=true;r.rosto.cabeca.geometry.computeVertexNormals();
 oval(hair,cabelo,0,.62,-.12,.77,.46,.68);for(const s of [-1,1])oval(hair,cabelo,s*.75,.12,-.23,.065,.30,.42);
 const sombra=r.rosto.pele.clone();sombra.color.multiplyScalar(.73);for(const s of [-1,1])linha(r.cab,[[s*.48,-.11,.66],[s*.58,-.23,.55],[s*.60,-.40,.48]],sombra,.009);
 const quadril=r.av.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry'&&Math.abs(o.position.y-2.55)<.01);if(quadril){quadril.scale.set(.70,.34,.48);quadril.position.y=2.45;}
 r.estat.forEach(g=>g.visible=false);r.estat=r.pernasA.quadril.map(q=>{const g=q.clone(true);r.av.add(g);return g;});
 r.av.traverse(o=>{if(!o.isMesh)return;const p=o.geometry?.parameters;if(o.geometry.type==='BoxGeometry'&&p.width===.5&&p.height===.5){o.scale.set(.65,.85,1);o.position.x*=.70;}if(o.geometry.type==='BoxGeometry'&&p.width>.2&&p.height>.2&&p.depth>.08)o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,2,.04);});
 const roupas=[],originais=new Map();r.av.traverse(o=>{if(o.isMesh&&o.material?.map&&o.material.roughness===.92){roupas.push([o,o.material]);if(!originais.has(o.material))originais.set(o.material,{color:o.material.color.clone(),map:o.material.map});}});
 const dobras=r.tronco.children.filter(o=>o.isMesh&&o.geometry?.parameters?.height===.018),botas=[],wrist=[];r.av.traverse(o=>{if(o.isMesh&&o.material?.color?.getHex()===0x5a3a22)botas.push([o,o.material]);});for(const b of [r.bD,r.bE])b.co.children.forEach(o=>{if(o.isMesh&&o.geometry?.parameters?.width===.28&&o.geometry.parameters.height===.06)wrist.push(o);});
 const equip=r.equip.map(o=>[o,o.visible]),maos=[];for(const b of [r.bD,r.bE])b.mao.traverse(o=>{if(o.isMesh){maos.push(o);o.material=r.rosto.pele;}});
 caixa(normal,1.45,.27,.13,preto,0,4.05,.52,.10);linha(normal,[[0,2.3,.56],[0,3.4,.66],[0,4.1,.56]],preto,.026);
 mk(normal,new CylinderGeometry(.27,.34,.30,24),mat(0x39432b),0,4.26,0);
 const capuz=mk(normal,new TorusGeometry(.36,.11,12,32),preto,0,4.18,-.18);capuz.rotation.x=Math.PI/2;
 // Os recortes fazem parte do tecido: cores por vértice, sem placas afastadas do corpo.
 const pretoC=new Color(0x141a20),rubroC=new Color(0x9d202a),tecidoPoder=new MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.88});
 const largura=y=>y<.8?.47:y<1.2?.35:y<1.7?.76:.58;
 for(const [o,m]of roupas){o.geometry=o.geometry.clone();o.geometry.computeBoundingBox();const a=o.geometry.attributes.position,cores=[],rx=Math.max(.01,o.geometry.boundingBox.max.x);for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i)+o.position.y,z=a.getZ(i);let red=false;if(o===corpo)red=y>.10&&y<1.98&&Math.abs(x)> .035&&Math.abs(x)<largura(y)&&Math.abs(z)>.15;else if([r.bD.pv,r.bE.pv,r.bD.co,r.bE.co].includes(o.parent))red=y<-.15&&y>-.92&&z>.10;else if(m.color.getHex()===0x39432b)red=Math.abs(x)>rx*.55&&z>-.06;const c=red?rubroC:pretoC;cores.push(c.r,c.g,c.b);}o.geometry.setAttribute('color',new Float32BufferAttribute(cores,3));}
 function superficie(x,y){const a=corpo.geometry.attributes.position;let dif=Infinity,ry=0,rx=0,rz=0;for(let i=0;i<a.count;i++){const d=Math.abs(a.getY(i)-y);if(d<dif){dif=d;ry=a.getY(i);}}for(let i=0;i<a.count;i++)if(Math.abs(a.getY(i)-ry)<.001){rx=Math.max(rx,Math.abs(a.getX(i)));rz=Math.max(rz,Math.abs(a.getZ(i)));}return Math.sqrt(Math.max(0,1-(x/(rx||1))**2))*rz+.018;}
 for(const s of [-1,1]){const pts=[[s*.03,.12],[s*.45,.12],[s*.50,.72],[s*.35,1.18],[s*.70,1.43],[s*.55,1.82],[s*.04,1.94]];linha(power,pts.map(([x,y])=>[x,y,superficie(x,y)]),brilho,.012);}
 linha(power,Array.from({length:16},(_,i)=>{const y=.12+i/15*1.82;return[0,y,superficie(0,y)];}),preto,.022);
 const extras=[];
 for(const [b,s]of [[r.bD,-1],[r.bE,1]]){const g=new Group(),h=new Group();b.pv.add(g);b.co.add(h);extras.push(g,h);linha(g,[[s*.20,-.12,.25],[s*.22,-.82,.22]],brilho,.012);linha(h,[[s*.17,-.20,.20],[s*.16,-.88,.19]],brilho,.012);}
 const qs=[...r.pernasA.quadril,...r.estat];for(const q of qs){const j=q.children.find(g=>g.isGroup&&g.position.y<0),s=q.position.x<0?-1:1,g=new Group(),h=new Group();q.add(g);j.add(h);extras.push(g,h);linha(g,[[s*.35,-.18,.25],[s*.36,-.77,.25],[s*.19,-1.03,.30]],brilho,.012);linha(h,[[s*.24,-.05,.27],[s*.28,-.63,.22],[s*.13,-.85,.20]],brilho,.012);}
 let on=false,pulso=0,t=0;
 function forma(v){on=!!v;normal.visible=r.capG.visible=!on;power.visible=hair.visible=on;extras.forEach(g=>g.visible=on);equip.forEach(([o,vis])=>o.visible=!on&&vis);roupas.forEach(([o,m])=>o.material=on?tecidoPoder:m);maos.forEach(o=>o.material=on?couro:r.rosto.pele);dobras.concat(wrist).forEach(o=>o.visible=!on);botas.forEach(([o,m])=>o.material=on?preto:m);if(!on){originais.forEach((s,m)=>{m.color.copy(s.color);m.map=s.map;m.emissive?.setHex(0);m.emissiveIntensity=0;m.needsUpdate=true;});pulso=0;brilho.emissiveIntensity=.20;}}
 function tick(dt){if(!on)return;t+=dt;pulso=Math.max(0,pulso-dt*1.6);brilho.emissiveIntensity=.16+pulso*1.45+.025*Math.sin(t*3);}
 const visual={forma,tick,normal,pulsa:()=>{pulso=1;},brilho,get on(){return on;}};r.mohrVisual=visual;forma(false);
 return {id:def.id,nome:def.nome,p:r,tick,fx:{liga:()=>forma(true),desliga:()=>forma(false),tick,pulsa:visual.pulsa}};
}
