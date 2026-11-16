import { Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { perfilCorpo } from '../gente/geometrias.js';

// Visual exclusivo; nenhuma bandeira, brasão ou insígnia militar real.
export function constroiJackao(H, def){
  const mat=(color,roughness=.82,metalness=0)=>new MeshStandardMaterial({color,roughness,metalness});
  const r=H.pessoa3d({nome:def.nome,x:0,y:-50,z:0,yaw:0,camisa:mat(0xc47734),manga:mat(0xc47734),calca:mat(0x344131),pele:mat(0xb08361),capacete:mat(0xeb943d,.48,.08),cabelo:0x201b17,barba:false,oculos:false,olhos:0x3c3326});
  r.av.name='jackao';r.av.userData.personagem='jackao';r.cab.scale.set(.45,.46,.48);r.cab.position.y=4.91;
  const branco=mat(0xc7c6b7),vermelho=mat(0x98342b),tan=mat(0x777453),escuro=mat(0x202321,.5,.5),tecido=mat(0x625e42);
  const gNormal=new Group(),gCab=new Group(),gRa=new Group();r.av.add(gNormal);r.cab.add(gCab,gRa);
  const caixa=(pai,w,h,d,m,x,y,z,raio=.05)=>{const o=new Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(raio,w/3,h/3,d/3)),m);o.position.set(x,y,z);pai.add(o);return o;};
  const oval=(pai,m,x,y,z,rx,ry,rz)=>{const o=new Mesh(new SphereGeometry(1,24,16),m);o.position.set(x,y,z);o.scale.set(rx,ry,rz);pai.add(o);return o;};
  const linha=(pai,pts,m,raio=.025)=>{const o=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,raio,8,false),m);pai.add(o);return o;};
  // Tronco com cintura e ombros suaves; rosto com mandíbula e nariz próprios.
  const tronco=r.tronco.children[0];tronco.geometry=perfilCorpo([[0,0,0],[.06,.69,.47],[.42,.73,.49],[1.25,.88,.62],[1.7,.88,.63],[1.95,.60,.43],[2.07,.27,.22],[2.11,0,0]],32);tronco.position.y=0;tronco.scale.set(1,1,1);r.tronco.children[1].visible=false;
  const face=r.rosto.cabeca.geometry.attributes.position;for(let i=0;i<face.count;i++)if(face.getY(i)<-.25)face.setX(i,face.getX(i)*1.10);face.needsUpdate=true;r.rosto.cabeca.geometry.computeVertexNormals();
  // Cabelo curto com volume no alto, costeletas e barba rala visível na transformação.
  const cabelo=mat(0x201b17,.98);oval(gCab,cabelo,0,.57,-.12,.77,.51,.70);for(const s of [-1,1])oval(gCab,cabelo,s*.75,.15,-.17,.075,.30,.46);

  const barba=oval(gRa,mat(0x554536,.97),0,-.67,.34,.43,.19,.30);barba.name='jackao-barba-curta';
  const lenco=new Group();r.cab.add(lenco);const pano=new Mesh(perfilCorpo([[-1,.40,.42],[-.84,.53,.52],[-.50,.73,.75],[-.16,.78,1.02],[-.04,.73,.87],[-.025,.68,.82]],32),vermelho);lenco.add(pano);
  for(let i=0;i<3;i++)linha(lenco,[[-.62,-.37-i*.16,.62],[0,-.47-i*.13,.78],[.62,-.38-i*.15,.62]],mat(i%2?0x7d2924:0xad4936),.012);
  caixa(lenco,.34,.75,.07,vermelho,.18,-.48,-.76).rotation.z=-.2;
  const equip=r.equip.map(o=>[o,o.visible]);
  const quadril=r.av.children.find(o=>o.isMesh&&o.geometry.type==='SphereGeometry'&&Math.abs(o.position.y-2.55)<.01);if(quadril){quadril.scale.set(.70,.35,.52);quadril.position.y=2.45;}
  // Mesmas pernas e botas em repouso e na caminhada; sem os bolsos enormes da base.
  r.estat.forEach(g=>g.visible=false);const estaticos=[],joelhosParados=[];
  for(let i=0;i<2;i++){const q=r.pernasA.quadril[i].clone(true);q.position.x=i?.52:-.52;const j=q.children.find(g=>g.isGroup&&g.position.y<0);r.av.add(q);estaticos.push(q);joelhosParados.push(j);}
  r.estat=estaticos;
  r.av.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry'&&o.geometry.parameters.width===.5&&o.geometry.parameters.height===.5){o.scale.set(.65,.85,1);o.position.x*=.70;}});

  // Luvas claras e antebraços expostos na forma normal; mangas camufladas no poder.
  const maos=[],antebracos=[],roupas=[];
  r.av.traverse(o=>{if(o.isMesh){if(o.material?.map&&o.material.roughness===.92)roupas.push([o,o.material]);const p=o.geometry?.parameters;if(o.geometry?.type==='BoxGeometry'&&p.width>.2&&p.height>.2&&p.depth>.08)o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,2,.04);}});
  for(const b of [r.bD,r.bE]){b.mao.traverse(o=>{if(o.isMesh){maos.push([o,o.material]);o.material=branco;}});b.co.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.position.y<-.2&&o.material?.map&&o.material.roughness===.92){antebracos.push([o,o.material]);o.material=r.rosto.pele;}});}
  for(const s of [-1,1]){
    const mos=new Mesh(new TorusGeometry(.15,.035,10,26),mat(0x9ba1a0,.25,.85));mos.position.set(s*.88,2.05,.43);mos.scale.y=1.6;gNormal.add(mos);
    linha(gNormal,[[s*.78,2.29,.40],[s*1.02,1.82,.48],[s*.78,1.48,.53],[s*.63,1.94,.51]],mat(s<0?0xcf6e2c:0xafa04e),.045);
  }
  // Camuflagem procedural de manchas orgânicas, sem identificação de forças reais.
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#aaa086';ctx.fillRect(0,0,256,256);let seed=59;const rand=()=>((seed=seed*16807%2147483647)/2147483647);
  for(let k=0;k<210;k++){ctx.fillStyle=['#686b4d','#837d60','#4b503b','#bdb08b','#a29774'][k%5];ctx.beginPath();const x=rand()*256,y=rand()*256;for(let j=0;j<9;j++){const a=j/8*Math.PI*2,rx=8+rand()*30,ry=4+rand()*12;const px=x+Math.cos(a)*rx,py=y+Math.sin(a)*ry;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.fill();}
  const tx=new CanvasTexture(c);tx.wrapS=tx.wrapT=RepeatWrapping;tx.repeat.set(2,2);tx.colorSpace=SRGBColorSpace;const camo=new MeshStandardMaterial({color:0xffffff,map:tx,roughness:.89,bumpMap:tx,bumpScale:.007});
  const vest=new Group();r.tronco.add(vest);caixa(vest,1.48,1.39,.30,tecido,0,1.05,.63,.12);caixa(vest,1.42,1.32,.25,tecido,0,1.05,-.58,.12);
  for(const s of [-1,1]){caixa(vest,.23,.37,.15,tan,s*.58,1.84,.44);caixa(vest,.36,.56,.28,tan,s*.91,.75,.02);}
  for(let k=0;k<4;k++){const x=(k-1.5)*.31;caixa(vest,.27,.51,.19,tan,x,.65,.87);caixa(vest,.27,.08,.21,tecido,x,.92,.88);}
  for(let i=0;i<3;i++)for(let j=0;j<5;j++)caixa(vest,.20,.035,.025,tan,(j-2)*.25,1.14+i*.14,.80,.008);
  caixa(vest,.26,.45,.18,escuro,-.54,1.5,.86);linha(vest,[[-.5,1.7,.8],[-.55,2,.45],[-.75,1.95,-.15]],escuro,.018);
  for(const j of [...r.pernasA.joelho,...joelhosParados]){const b=j.children.find(g=>g.isGroup&&g.position.y<-.9);if(b)b.scale.set(.82,.9,.85);}
  const joelhos=[];for(let i=0;i<2;i++){
    for(const [pai,x,y,z]of [[r.pernasA.joelho[i],0,0,.36],[joelhosParados[i],0,0,.36]]){const g=new Group();pai.add(g);joelhos.push(g);caixa(g,.50,.48,.18,tan,x,y,z,.12);caixa(g,.36,.29,.04,tecido,x,y,z+.11,.06);}
  }
  const lente=new MeshStandardMaterial({color:0x6abbd2,emissive:0x319cc8,emissiveIntensity:.7,transparent:true,opacity:.63,roughness:.14,metalness:.3});
  for(const s of [-1,1]){caixa(gRa,.57,.30,.13,escuro,s*.32,.08,.84);caixa(gRa,.50,.23,.04,lente,s*.32,.08,.925);caixa(gRa,.075,.12,.9,escuro,s*.86,.10,.33);}
  caixa(gRa,.21,.06,.11,escuro,0,.10,.88);linha(gRa,[[.83,-.1,.12],[1.04,-.34,.48],[.62,-.48,.94]],escuro,.03);
  // Fuzil detalhado, preso à mão. Recuo, carregador e pose são animados pelo módulo de poderes.
  const arma=new Group();arma.name='jackao-fuzil';r.bD.mao.add(arma);arma.rotation.set(Math.PI/2,.6,0);arma.position.set(0,-.1,.20);
  caixa(arma,.17,.25,.72,escuro,0,0,.15);caixa(arma,.14,.18,.73,tan,0,.01,.80);caixa(arma,.17,.28,.50,tan,0,-.01,-.45);
  const cano=new Mesh(new CylinderGeometry(.035,.042,.65,16),escuro);cano.rotation.x=Math.PI/2;cano.position.set(0,.04,1.48);arma.add(cano);
  caixa(arma,.13,.47,.25,escuro,0,-.29,.23).rotation.x=-.18;const carregador=arma.children.at(-1);caixa(arma,.10,.31,.18,escuro,0,-.24,-.14).rotation.x=-.25;
  for(let i=0;i<8;i++)caixa(arma,.16,.03,.045,escuro,0,.13,.44+i*.085,.005);
  caixa(arma,.12,.14,.27,escuro,0,.22,.20);caixa(arma,.06,.15,.045,escuro,0,.19,1.07);
  const bocarra=new Group();bocarra.position.set(0,.04,1.81);arma.add(bocarra);
  const originais=new Map(roupas.map(([,m])=>[m,{cor:m.color.clone(),map:m.map,em:m.emissive.clone(),int:m.emissiveIntensity}]));
  let on=false,recuo=0,recarga=0;
  function forma(v){on=!!v;if(!on)originais.forEach((s,m)=>{m.color.copy(s.cor);m.map=s.map;m.emissive.copy(s.em);m.emissiveIntensity=s.int;m.needsUpdate=true;});gNormal.visible=!on;lenco.visible=!on;r.capG.visible=!on;gCab.visible=on;gRa.visible=on;vest.visible=on;arma.visible=on;joelhos.forEach(g=>g.visible=on);equip.forEach(([o,vis])=>o.visible=!on&&vis);roupas.forEach(([o,m])=>o.material=on?camo:m);antebracos.forEach(([o,m])=>o.material=on?camo:r.rosto.pele);maos.forEach(([o])=>o.material=on?tan:branco);if(!on){r.bD.pv.rotation.set(.08,0,-.12);r.bD.co.rotation.set(-.12,0,0);r.bE.pv.rotation.set(.08,0,.12);r.bE.co.rotation.set(-.12,0,0);}}
  function tick(dt){if(!on)return;recuo=Math.max(0,recuo-dt*7);r.bD.pv.rotation.set(.12-recuo*.12,0,-.10);r.bD.co.rotation.set(-1.90+Math.sin(recarga*Math.PI)*.7,0,0);r.bE.pv.rotation.set(-.05,0,-.38);r.bE.co.rotation.set(-1.65,0,0);arma.position.z=.20-recuo*.10;carregador.position.y=-.29-Math.sin(Math.min(1,recarga)*Math.PI)*.30;}
  const visual={forma,tick,arma,bocarra,lente,recuo:()=>recuo=1,recarregar:k=>recarga=k,get on(){return on;}};r.jackaoVisual=visual;forma(false);
  return {id:def.id,nome:def.nome,p:r,tick,fx:{liga:()=>forma(true),desliga:()=>forma(false),tick}};
}
