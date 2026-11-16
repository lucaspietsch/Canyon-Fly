import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Group, Mesh, SphereGeometry, TubeGeometry, CatmullRomCurve3, Vector3, CanvasTexture, MeshStandardMaterial, MeshPhysicalMaterial, PlaneGeometry, DoubleSide, BufferAttribute } from 'three';
import { constroiOperadora } from './modelos.js';
import { perfilCorpo } from '../gente/geometrias.js';

// Mantém os mesmos eixos das duas tranças frontais já existentes no jogo.
export const TRANCAS_MARY=[[.31,4.83,.06],[.52,4.41,.27],[.68,3.75,.48],[.65,3.40,.68],[.60,3.0,.72]];
export function constroiOperadoraDetalhada(H,def,op={}){
 const loira=!!op.loira;
 const base=constroiOperadora(H,{...def,modelo:{...def.modelo,labios:loira?0xc28d87:0xb47d73,pele:loira?0xf0c9b2:0xe5bda0}}),r=base.p,fxBase=base.fx,normal=new Group(),solto=new Group(),poder=new Group();r.av.add(normal,poder);r.cab.add(solto);
 r.av.name=def.id;r.av.userData.personagem=def.id;r.cab.scale.set(.49,.51,.52);r.tronco.scale.x=.77;
 const pais=new Set(base.mechas.map(m=>m.parent));pais.forEach(g=>g.visible=false);r.av.traverse(o=>{if(o.name==='tranca')o.visible=false;});
 const roupa=[],snap=new Map(),powerMats=new Map(),equip=r.equip.map(o=>[o,o.visible]),botas=[],maos=[];
 r.estat.forEach(g=>g.visible=false);r.estat=r.pernasA.quadril.map(q=>{const g=q.clone(true);r.av.add(g);return g;});
 // Joelhos fechados evitam frestas entre os segmentos durante o voo e a caminhada.
 const calcaMat=r.pernasA.quadril[0].children.find(o=>o.isMesh).material;for(const q of [...r.pernasA.quadril,...r.estat]){const j=q.children.find(o=>o.isGroup&&o.position.y<0);if(j){const joelho=new Mesh(new SphereGeometry(.38,24,16),calcaMat);joelho.scale.z=.96;j.add(joelho);}}
 const torso=r.tronco.children[0];torso.geometry=perfilCorpo([[0,0,0],[.07,.66,.43],[.45,.70,.46],[1.25,.82,.57],[1.7,.83,.58],[1.96,.55,.38],[2.08,.26,.22],[2.11,0,0]],32);torso.position.y=0;torso.scale.set(1,1,1);r.tronco.children[1].visible=false;
 const quadril=r.av.children.find(o=>o.isMesh&&o.geometry?.type==='SphereGeometry'&&Math.abs(o.position.y-2.55)<.01);if(quadril){quadril.scale.set(.70,.34,.48);quadril.position.y=2.45;}
 r.av.traverse(o=>{if(!o.isMesh)return;const m=o.material,p=o.geometry?.parameters;o.userData.dobraMary=p?.height===.018;if(o.geometry?.type==='BoxGeometry'&&p.width===.5&&p.height===.5){o.scale.set(.60,.85,1);o.position.x*=.70;}
  if(m?.map&&m.roughness===.92){const calca=m.color.getHex()===0x4a5729;roupa.push([o,m]);if(!snap.has(m)){m.color.setHex(calca?0x3c4834:0xc77a35);snap.set(m,{color:m.color.clone(),map:m.map});const pm=m.clone();pm.color.setHex(calca?0x191d2a:(loira?0x17171c:0x652789));pm.roughness=.84;powerMats.set(m,pm);}}
  if(m?.color?.getHex()===0x5a3a22)botas.push([o,m]);if(o.geometry?.type==='BoxGeometry'&&!(o.geometry instanceof RoundedBoxGeometry)){o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,3,Math.min(.07,p.width/4,p.height/4,p.depth/4));}
 });
 for(const b of [r.bD,r.bE])b.mao.traverse(o=>{if(o.isMesh&&o.material?.color?.getHex()===0x0d0d0f){maos.push([o,o.material]);o.material=r.rosto.pele;}});
 const mat=(color,roughness=.8,metalness=0)=>new MeshStandardMaterial({color,roughness,metalness});
 const violeta=mat(0x652789,.7),lilas=mat(loira?0x9c844b:0xb29bcd,.65),prata=mat(loira?0xc1a153:0xbec5d4,.28,.65),preto=mat(0x171d27),presilha=mat(0xab4973,.55);
 const mk=(pai,geo,m,x=0,y=0,z=0)=>{const o=new Mesh(geo,m);o.position.set(x,y,z);pai.add(o);return o;};
 const oval=(pai,m,x,y,z,sx,sy,sz)=>{const o=mk(pai,new SphereGeometry(1,24,16),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const linha=(pai,pts,m,raio=.012)=>mk(pai,new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),32,raio,7,false),m);
 // Fibras contínuas e tons próximos de castanho: brilho natural sem aparência metálica.
 const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');x.fillStyle=loira?'#c4a675':'#2a1b16';x.fillRect(0,0,512,96);for(let i=0;i<96;i++){x.strokeStyle=(loira?['#e9d4a6','#d9be8c','#f0dfbc','#b59b6d']:['#38251d','#422c22','#50372a','#261812'])[i%4];x.globalAlpha=.6;x.lineWidth=.6+(i%3)*.3;x.beginPath();x.moveTo(0,i);x.bezierCurveTo(180,i+2,330,i-2,512,i);x.stroke();}x.globalAlpha=1;const fiosTx=new CanvasTexture(c);
 const cabelo=new MeshPhysicalMaterial({color:0xffffff,map:fiosTx,roughness:.43,metalness:0,clearcoat:.13,clearcoatRoughness:.5,sheen:.22});
 function mecha(pai,pts,raio=.10){const curve=new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),geo=new TubeGeometry(curve,48,1,8,false),p=geo.attributes.position;for(let i=0;i<=48;i++){const t=i/48,center=curve.getPointAt(t),k=raio*(.96-.70*t*t);for(let j=0;j<=8;j++){const n=i*9+j;p.setXYZ(n,center.x+(p.getX(n)-center.x)*k,center.y+(p.getY(n)-center.y)*k,center.z+(p.getZ(n)-center.z)*k);}}geo.computeVertexNormals();return mk(pai,geo,cabelo);}
 const scalp=new Group();r.cab.add(scalp);const topo=mk(scalp,new SphereGeometry(1.07,32,20,0,Math.PI*2,0,Math.PI*.43),cabelo,0,.05,-.08);topo.scale.z=1.0;
 // Mechas sobrepostas saindo da risca quebram a borda da calota e cobrem as têmporas.
 for(const s of [-1,1])for(let k=0;k<5;k++){const z=.68-k*.14;mecha(scalp,[[s*.10,1.07,z*.48],[s*.48,.96,z*.83],[s*.83,.59,z],[s*1.01,.10,z*.86],[s*1.02,-.55,z*.70]],.15-k*.009);}
 // Coque baixo e laço discretos, com as duas tranças na posição original.
 const preso=new Group();r.cab.add(preso);oval(preso,cabelo,0,-.32,-.83,.42,.30,.34);for(const s of [-1,1]){const asa=oval(preso,presilha,s*.13,-.3,-1.12,.16,.09,.045);asa.rotation.z=s*.3;}
 const trancas=[];for(const s of [-1,1]){const eixo=TRANCAS_MARY.map(([x,y,z])=>new Vector3(s*x,y,z)),curva=new CatmullRomCurve3(eixo),g=new Group();g.name=s<0?'mary-tranca-direita':'mary-tranca-esquerda';normal.add(g);trancas.push(g);
  for(let fio=0;fio<3;fio++){const pts=[];for(let i=0;i<=96;i++){const t=i/96,p=curva.getPoint(t),a=t*Math.PI*14+fio*Math.PI*2/3,R=.055*(1-.25*t);pts.push([p.x+Math.sin(a)*R,p.y,p.z+Math.cos(a)*R]);}mecha(g,pts,.048);}
  for(let fio=0;fio<9;fio++){const pts=[];for(let i=0;i<=48;i++){const t=i/48,p=curva.getPoint(t),a=t*Math.PI*14+fio*2.399;pts.push([p.x+Math.sin(a)*.075,p.y,p.z+Math.cos(a)*.067]);}linha(g,pts,cabelo,.0025);}
  const fim=eixo.at(-1);oval(g,presilha,fim.x,fim.y+.05,fim.z,.09,.035,.075);
 }
 // Ondas médias soltas, para trás e nas laterais, sem cobrir o rosto.
 const ondas=[],ondasNormais=[],soltoNormal=new Group();r.cab.add(soltoNormal);for(let i=0;i<14;i++){const a=-Math.PI*.70+i/13*Math.PI*1.40,s=Math.sin(a),z=-Math.cos(a),pts=[[s*.72,.65,z*.68-.10],[s*.91,-.05,z*.82-.10],[s*1.03+Math.sin(i)*.06,-.75,z*.93-.18],[s*.94+Math.cos(i)*.08,-1.5,z*.96-.23],[s*.80,-2.15+Math.abs(s)*.15,z*.89-.30]];if(loira)pts.forEach((p,k)=>{if(k>1){p[1]-=(k-1)*.42;p[0]+=Math.sin(i+k)*.07;}});const onda=mecha(solto,pts,loira?.17:.13);ondas.push(onda);if(loira){const n=onda.clone();n.geometry=onda.geometry.clone();const p=n.geometry.attributes.position;for(let k=0;k<p.count;k++)p.setY(k,Math.min(.23,p.getY(k)));n.geometry.computeVertexNormals();soltoNormal.add(n);ondasNormais.push(n);}}
 // Maquiagem leve; argolas e anéis delicados vêm do rig da operadora.
 const blush=new MeshStandardMaterial({color:0xb87970,transparent:true,opacity:.10,roughness:.9});for(const s of [-1,1])oval(r.cab,blush,s*.49,-.18,.61,.16,.065,.020);
 // Jaqueta fechada e capa curta confortável; detalhes em lilás e prata.
 const capeGeo=new PlaneGeometry(1.65,1.35,16,14),cp=capeGeo.attributes.position;for(let i=0;i<cp.count;i++){const yy=cp.getY(i);cp.setZ(i,-.06-Math.sin((yy+.675)/1.35*Math.PI)*.16);cp.setX(i,cp.getX(i)*(1.03-yy*.22));}capeGeo.computeVertexNormals();const capa=mk(poder,capeGeo,new MeshStandardMaterial({color:loira?0x17171c:0x5d237c,roughness:.72,side:DoubleSide}),0,2.92,-.62);
 linha(poder,[[-.82,2.28,-.65],[-.40,2.23,-.64],[0,2.25,-.63],[.4,2.23,-.64],[.82,2.28,-.65]],prata,.016);
 for(const s of [-1,1])linha(poder,[[s*.20,4.18,.24],[s*.49,3.97,.45],[s*.54,3.56,.52],[s*.43,3.0,.50],[s*.52,2.45,.44]],lilas,.018);
 linha(poder,[[0,4.16,.27],[0,3.8,.60],[0,3.2,.63],[0,2.42,.48]],prata,.013);
 const pins=[r.bD,r.bE].flatMap(b=>b.pv.children.filter(o=>o.geometry?.type==='PlaneGeometry'));
 const detalhes=[];for(const [b,s]of [[r.bD,-1],[r.bE,1]]){const g=new Group();b.co.add(g);detalhes.push(g);linha(g,[[s*.18,-.16,.20],[s*.19,-.73,.20],[0,-.90,.24]],lilas,.013);}
 const dobras=r.tronco.children.filter(o=>o.isMesh&&o.userData.dobraMary);
 // Faíscas e flocos menores; mantém cada efeito na mão correta.
 const soft=document.createElement('canvas');soft.width=soft.height=48;const sc=soft.getContext('2d'),grad=sc.createRadialGradient(24,24,1,24,24,24);grad.addColorStop(0,'white');grad.addColorStop(1,'rgba(255,255,255,0)');sc.fillStyle=grad;sc.fillRect(0,0,48,48);const softTx=new CanvasTexture(soft);
 fxBase.itens.forEach(({P,tipo})=>{P.p.material.map=softTx;P.p.material.size=tipo==='fogo'?.10:.07;P.p.geometry.setDrawRange(0,tipo==='ouro'?54:tipo==='fogo'?24:18);P.p.material.needsUpdate=true;});
 let on=false,t=0;
 function forma(v){on=!!v;scalp.visible=on||!loira;normal.visible=!on&&!loira;preso.visible=!on&&!loira;r.capG.visible=!on;solto.visible=on;soltoNormal.visible=loira&&!on;poder.visible=on;detalhes.forEach(g=>g.visible=on);pins.forEach(o=>o.visible=!on);equip.forEach(([o,vis])=>o.visible=!on&&vis);dobras.forEach(o=>o.visible=!on);roupa.forEach(([o,m])=>o.material=on?powerMats.get(m):m);botas.forEach(([o,m])=>o.material=on?preto:m);if(!on)snap.forEach((s,m)=>{m.color.copy(s.color);m.map=s.map;m.emissive.setHex(0);m.emissiveIntensity=0;m.needsUpdate=true;});}
 function tick(dt){t+=dt;base.tick(dt);ondasNormais.forEach((o,i)=>o.rotation.z=Math.sin(t*1.4+i)*.009);ondas.forEach((o,i)=>o.rotation.z=Math.sin(t*1.4+i)*.009);if(loira){cabelo.emissive.setHex(on?0x806124:0);cabelo.emissiveIntensity=on?.12:0;ondas.forEach((o,i)=>{o.rotation.x=Math.sin(t*1.1+i)*.012;o.rotation.z=Math.sin(t*1.4+i)*(on?.035:.009);});fxBase.itens.forEach(({P,tipo})=>{if(tipo==='ouro'){for(let k=0;k<P.n;k++){P.pos[k*3]=Math.cos(t*.7+P.seed[k]*31)*.75;P.pos[k*3+1]=4.45+P.seed[k]*1.1;P.pos[k*3+2]=Math.sin(t*.7+P.seed[k]*31)*.65-.20;}P.p.geometry.attributes.position.needsUpdate=true;}});if(fxBase.luz)fxBase.luz.intensity=0;}if(on){capa.rotation.x=Math.sin(t*1.8)*.025;if(fxBase.luzD)fxBase.luzD.intensity*=.30;if(fxBase.luzE)fxBase.luzE.intensity*=.35;}}
 const fx={liga(){fxBase.liga();forma(true);},desliga(){fxBase.desliga();forma(false);},tick};
 r.operadoraVisual={forma,tick,trancas,ondas,solto,normal,soltoNormal,cabelo,braidAnchors:TRANCAS_MARY.map(p=>p.slice()),get on(){return on;}};forma(false);
 return{id:def.id,nome:def.nome,p:r,tick,fx};
}
