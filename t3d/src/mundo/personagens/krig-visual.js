import { Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector3, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending, DoubleSide } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { geometriaCabeca } from './rosto.js';
import { perfilCorpo } from '../gente/geometrias.js';

// Uma identidade para o operador jogável, o coordenador das cenas e o NPC do lançamento.
export function personalizaKrig(r){
 if(r.krigVisual)return r.krigVisual;
 const mat=(color,roughness=.85,metalness=0)=>new MeshStandardMaterial({color,roughness,metalness});
 const couro=mat(0x492b22),metal=mat(0x72777d,.35,.85),ferro=mat(0x363e45,.42,.8),ruivo=mat(0xa85429,.96),pelo=mat(0x807261,.98),escuro=mat(0x1a2025),laranja=mat(0xc17a32);
 const normal=new Group(),viking=new Group(),cabN=new Group(),cabV=new Group();r.av.add(normal,viking);r.cab.add(cabN,cabV);
 const caixa=(pai,w,h,d,m,x,y,z,rad=.04)=>{const o=new Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(rad,w/3,h/3,d/3)),m);o.position.set(x,y,z);pai.add(o);return o;};
 const oval=(pai,m,x,y,z,rx,ry,rz)=>{const o=new Mesh(new SphereGeometry(1,24,16),m);o.position.set(x,y,z);o.scale.set(rx,ry,rz);pai.add(o);return o;};
 const linha=(pai,pts,m,rad=.025)=>{const o=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,rad,7,false),m);pai.add(o);return o;};
 // Oculta a barba antiga e os óculos escuros. Os materiais compartilhados da equipe são preservados.
 r.cab.traverse(o=>{if(o.isMesh&&o.material?.map&&o.material.roughness===1&&o.material.map.repeat.x===4)o.visible=false;});r.ocG.visible=false;const cap0=r.capG.children[0]?.material;if(cap0){const cap=cap0.clone();cap.color.setHex(0xe8731a);r.capG.traverse(o=>{if(o.isMesh&&o.material===cap0)o.material=cap;});}
 r.av.name='krig';r.av.userData.personagem='krig';r.cab.scale.set(.53,.52,.56);r.tronco.scale.x=.96;
 const roupas=[],originais=new Map(),maos=[];r.av.traverse(o=>{if(o.isMesh&&o.material?.map&&o.material.roughness===.92){roupas.push([o,o.material]);if(!originais.has(o.material)){const m=o.material.clone();m.color.setHex([0x1c262c,0x56642d,0x4a5729,0x1d272c].includes(o.material.color.getHex())?0x1c262c:0xc17a32);originais.set(o.material,m);o.material=m;}}});
 roupas.forEach(([o,m])=>o.material=originais.get(m));
 const camisa=r.tronco.children[0];camisa.geometry=perfilCorpo([[0,0,0],[.08,.75,.47],[.4,.78,.50],[1.3,.93,.63],[1.7,.95,.64],[1.96,.64,.42],[2.10,.26,.23],[2.12,0,0]],32);camisa.position.y=0;camisa.scale.set(1,1,1);r.tronco.children[1].visible=false;
 // Jaqueta escura nos ombros e mangas, laranja no peito, como a referência.
 caixa(normal,1.50,.25,.10,escuro,0,4.02,.53,.10);linha(normal,[[0,2.35,.55],[0,3.45,.68],[0,4.08,.54]],escuro,.035);
 const capuz=oval(normal,escuro,0,4.13,-.34,.52,.28,.42);void capuz;
 const face=r.rosto.cabeca.geometry.attributes.position;for(let i=0;i<face.count;i++)if(face.getY(i)<-.25)face.setX(i,face.getX(i)*1.12);face.needsUpdate=true;r.rosto.cabeca.geometry.computeVertexNormals();
 const barbaNormal=new Mesh(geometriaCabeca(false,-.25).scale(1.06,1.10,1.05),ruivo);r.cab.add(barbaNormal);
 for(const s of [-1,1])oval(r.cab,ruivo,s*.16,-.33,.74,.20,.065,.08);
 // Óculos de grau claros; somente na forma normal.
 const vidro=new MeshStandardMaterial({color:0xc1d4dc,roughness:.12,metalness:.1,transparent:true,opacity:.13});
 for(const s of [-1,1]){const aro=new Mesh(new TorusGeometry(.27,.026,10,32),escuro);aro.position.set(s*.33,.08,.82);aro.scale.y=.74;cabN.add(aro);oval(cabN,vidro,s*.33,.08,.815,.255,.185,.02);caixa(cabN,.05,.065,.85,escuro,s*.86,.1,.32);}
 caixa(cabN,.17,.045,.07,escuro,0,.10,.82);
 // Textura frontal única e duas faces com rotação positiva: texto legível, nunca espelhado.
 const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#e4dfce';ctx.fillRect(0,0,768,160);ctx.strokeStyle='#232b2f';ctx.lineWidth=12;ctx.strokeRect(6,6,756,148);ctx.fillStyle='#192027';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 82px Arial,sans-serif';ctx.fillText('COORDENAÇÃO',384,83,722);const tx=new CanvasTexture(c);tx.colorSpace=SRGBColorSpace;
 const badgeM=new MeshBasicMaterial({map:tx}),frente=new Mesh(new PlaneGeometry(1.18,.246),badgeM),costas=new Mesh(new PlaneGeometry(1.65,.344),badgeM);frente.name='krig-coordenacao-peito';costas.name='krig-coordenacao-costas';frente.position.set(-.12,3.43,.80);costas.position.set(0,3.65,-.66);costas.rotation.y=Math.PI;normal.add(frente,costas);
 // Rádio com antena e LED, preso ao ombro.
 caixa(normal,.25,.48,.18,escuro,.68,3.85,.66);caixa(normal,.12,.10,.025,laranja,.68,3.91,.76);linha(normal,[[.75,4.05,.67],[.75,4.48,.67]],escuro,.016);
 const quadril=r.av.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry'&&Math.abs(o.position.y-2.55)<.01);if(quadril){quadril.scale.set(.75,.35,.50);quadril.position.y=2.45;}
 const equip=r.equip.map(o=>[o,o.visible]);
 r.estat.forEach(g=>g.visible=false);r.estat=r.pernasA.quadril.map(q=>{const g=q.clone(true);r.av.add(g);return g;});
 const botasEstaticas=r.estat.map(q=>q.children.find(g=>g.isGroup&&g.position.y<0));
 r.estat.forEach(g=>g.traverse(o=>{if(o.isMesh){const m=[...originais.entries()].find(([,v])=>v===o.material);if(m)roupas.push([o,m[0]]);}}));
 r.av.traverse(o=>{if(!o.isMesh)return;const p=o.geometry?.parameters;if(o.geometry.type==='BoxGeometry'&&!(o.geometry instanceof RoundedBoxGeometry)&&p.width>.2&&p.height>.2&&p.depth>.08)o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,2,.04);if(o.material?.color?.getHex()===0x5a3a22)o.material=escuro;});
 for(const b of [r.bD,r.bE])b.mao.traverse(o=>{if(o.isMesh){maos.push(o);o.material=r.rosto.pele;}});

 // Capacete Viking SEM CHIFRES: casco de ferro, nervura, rebites e nasal.
 const elmo=new Mesh(new SphereGeometry(1.045,32,20,0,Math.PI*2,0,Math.PI*.47),ferro);elmo.position.y=.12;elmo.name='krig-elmo-sem-chifres';cabV.add(elmo);
 const aba=new Mesh(new TorusGeometry(.99,.075,12,40),metal);aba.rotation.x=Math.PI/2;aba.position.y=.22;cabV.add(aba);linha(cabV,[[0,.23,1.02],[0,.75,.73],[0,1.17,0],[0,.75,-.73]],metal,.065);caixa(cabV,.13,.64,.09,metal,0,-.06,.94);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;oval(cabV,metal,Math.sin(a)*1.0,.25,Math.cos(a)*1.0,.035,.035,.035);}
 const beard=new Group();cabV.add(beard);const volume=new Mesh(geometriaCabeca(false,-.25).scale(1.19,1.36,1.18),ruivo);beard.add(volume);
 const trancas=[];for(const s of [-1,1]){const g=new Group();g.position.set(s*.32,-.55,.66);beard.add(g);trancas.push(g);for(let i=0;i<12;i++)for(const k of [-1,1])oval(g,ruivo,k*.06*Math.cos(i*Math.PI),-i*.18,.025*Math.sin(i*Math.PI),.125-i*.006,.13,.11);const anel=new Mesh(new TorusGeometry(.105,.03,8,22),metal);anel.rotation.x=Math.PI/2;anel.position.y=-1.85;g.add(anel);}
 const pelos=[];for(const s of [-1,1]){
  const ombro=oval(viking,pelo,s*.96,3.96,-.06,.55,.32,.54);void ombro;
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2;pelos.push(oval(viking,i%3? pelo:escuro,s*.96+Math.sin(a)*.48,3.91+(i%4)*.025,Math.cos(a)*.48,.055,.18,.055));}
  const ombreira=oval(viking,metal,s*1.02,3.73,.02,.44,.24,.46);void ombreira;
  for(let j=0;j<3;j++)linha(viking,[[s*.70,3.77-j*.08,.36],[s*1.04,3.82-j*.08,.45],[s*1.32,3.67-j*.08,.24]],ferro,.035);
 }
 caixa(viking,1.48,1.37,.17,couro,0,3.18,.62,.12);caixa(viking,1.42,1.45,.16,couro,0,3.18,-.58,.12);
 for(const s of [-1,1]){const faixa=caixa(viking,.16,1.65,.09,escuro,s*.37,3.35,.76);faixa.rotation.z=s*.35;for(let i=0;i<5;i++)oval(viking,metal,s*.55,2.70+i*.25,.735,.035,.035,.025);}
 const fivela=new Mesh(new TorusGeometry(.26,.055,12,32),metal);fivela.position.set(0,2.32,.71);viking.add(fivela);
 const bracos=[];for(const b of [r.bD,r.bE]){const g=new Group();b.co.add(g);bracos.push(g);caixa(g,.58,.62,.24,ferro,0,-.52,.20,.12);for(let k=0;k<3;k++)linha(g,[[-.24,-.3-k*.18,.34],[.1,-.3-k*.18,.36],[.25,-.36-k*.18,.28]],metal,.02);}
 const botas=[];for(const [pai,x,y,z]of [[r.pernasA.joelho[0],0,-.65,0],[r.pernasA.joelho[1],0,-.65,0],[botasEstaticas[0],0,-.65,0],[botasEstaticas[1],0,-.65,0]]){const g=new Group();g.position.set(x,y,z);pai.add(g);botas.push(g);for(let i=0;i<32;i++){const a=i/32*Math.PI*2;oval(g,pelo,Math.sin(a)*.37,0,Math.cos(a)*.36,.045,.22,.045);}}
 // Fogo vermelho e faíscas. A textura radial evita quadrados nas partículas.
 const fc=document.createElement('canvas');fc.width=fc.height=64;const fx=fc.getContext('2d'),grad=fx.createRadialGradient(32,32,2,32,32,32);grad.addColorStop(0,'rgba(255,230,120,1)');grad.addColorStop(.25,'rgba(255,80,30,.95)');grad.addColorStop(.65,'rgba(240,0,0,.5)');grad.addColorStop(1,'rgba(160,0,0,0)');fx.fillStyle=grad;fx.fillRect(0,0,64,64);const fireTx=new CanvasTexture(fc);
 const n=110,pos=new Float32Array(n*3),geo=new BufferGeometry();geo.setAttribute('position',new BufferAttribute(pos,3));const fire=new Points(geo,new PointsMaterial({color:0xff301a,map:fireTx,size:.30,transparent:true,opacity:.75,blending:AdditiveBlending,depthWrite:false}));fire.name='krig-furia-vermelha';fire.frustumCulled=false;r.av.add(fire);
 const sparks=new Points(geo,new PointsMaterial({color:0xffb94d,map:fireTx,size:.11,transparent:true,opacity:.9,blending:AdditiveBlending,depthWrite:false}));r.av.add(sparks);
 // Lâminas de chama translúcidas ao redor do corpo, além das faíscas.
 const fl=document.createElement('canvas');fl.width=64;fl.height=128;const fctx=fl.getContext('2d'),fg=fctx.createLinearGradient(0,128,0,0);fg.addColorStop(0,'rgba(255,70,10,.75)');fg.addColorStop(.45,'rgba(255,20,0,.55)');fg.addColorStop(1,'rgba(220,0,0,0)');fctx.fillStyle=fg;fctx.beginPath();fctx.moveTo(13,128);fctx.bezierCurveTo(0,95,27,76,23,58);fctx.bezierCurveTo(44,75,24,28,42,0);fctx.bezierCurveTo(28,48,69,86,51,128);fctx.closePath();fctx.fill();const fltx=new CanvasTexture(fl),flamas=[];
 for(let i=0;i<18;i++){const a=i*2.399,m=new Mesh(new PlaneGeometry(.85,1.8),new MeshBasicMaterial({map:fltx,color:0xff4821,transparent:true,opacity:.65,depthWrite:false,side:DoubleSide,blending:AdditiveBlending}));m.position.set(Math.sin(a)*1.10,.6+(i%4)*1.05,Math.cos(a)*.76);m.rotation.y=a;flamas.push(m);r.av.add(m);}
 let on=false,t=0,radioT=0;const materiais=[...roupas].map(([o,m])=>[o,originais.get(m)]),couroRoupa=mat(0x493025),calcaPoder=mat(0x2b2420);
 function forma(v){on=!!v;normal.visible=cabN.visible=!on;viking.visible=cabV.visible=fire.visible=sparks.visible=on;barbaNormal.visible=!on;r.capG.visible=!on;bracos.concat(botas).forEach(g=>g.visible=on);equip.forEach(([o,b])=>o.visible=!on&&b);maos.forEach(o=>o.material=on?couro:r.rosto.pele);flamas.forEach(m=>m.visible=on);materiais.forEach(([o,m])=>{o.material=on?(o.parent===r.av||o.parent?.parent===r.pernasA.grupo?calcaPoder:couroRoupa):m;});if(!on)materiais.forEach(([,m])=>{m.color.setHex(m.userData.krigCor);m.map=m.userData.krigMap;m.needsUpdate=true;});}
 materiais.forEach(([,m])=>{m.userData.krigCor=m.color.getHex();m.userData.krigMap=m.map;});
 function tick(dt){t+=dt;radioT=Math.max(0,radioT-dt);if(radioT>0&&!on){r.bD.pv.rotation.set(-.35,0,-.5);r.bD.co.rotation.set(0,0,-2.2);}if(!on)return;flamas.forEach((m,i)=>{m.scale.y=.75+.30*Math.sin(t*7+i);m.material.opacity=.38+.20*Math.sin(t*11+i);});for(let i=0;i<n;i++){const fase=(t*(.4+(i%7)*.035)+i/n)%1,a=i*2.399+t*.2,R=.83+(i%9)*.045;pos[i*3]=Math.sin(a)*R;pos[i*3+1]=.1+fase*5.2;pos[i*3+2]=Math.cos(a)*R*.65;}geo.attributes.position.needsUpdate=true;trancas.forEach((g,i)=>g.rotation.x=-.13+Math.sin(t*11+i)*.035);beard.rotation.x=-.06-Math.sin(t*8)*.014;fire.material.opacity=.52+.12*Math.sin(t*13);}
 const visual={forma,tick,radio:dur=>radioT=Math.max(radioT,dur),badges:{frente,costas,texto:'COORDENAÇÃO'},fire,get on(){return on;}};r.krigVisual=visual;forma(false);return visual;
}
export function constroiKrig(H,def,pose={}){const M=H.M,r=H.pessoa3d({nome:def?.nome||'Krig',x:0,y:-50,z:0,yaw:0,camisa:M(0xc17a32),manga:M(0x1c262c),calca:M(0x1d272c),pele:M(0xd2a480),capacete:M(0xe8731a,{roughness:.45,metalness:.1}),cabelo:0x8a4a22,barba:false,oculos:false,...pose});const v=personalizaKrig(r);return{id:'krig',nome:'Krig',p:r,tick:v.tick,fx:{liga:()=>v.forma(true),desliga:()=>v.forma(false),tick:v.tick}};}
