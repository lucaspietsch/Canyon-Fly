import { Group, Mesh, Shape, ExtrudeGeometry, SphereGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { criarRosto, geometriaCabeca } from './rosto.js';
import { perfilCorpo } from '../gente/geometrias.js';

// Modelo próprio do Pit. O esqueleto público é mantido para caminhada, missões e resgate.
const VISUAIS = new WeakMap();
export const visualPitDe = av => VISUAIS.get(av) || null;
const mat = (color, roughness=.72, metalness=0) => new MeshStandardMaterial({color,roughness,metalness});
const caixa = (w,h,d,r=.04) => new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3));
function chapa(pontos,prof=.06){const s=new Shape();pontos.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new ExtrudeGeometry(s,{depth:prof,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:2,curveSegments:12});g.translate(0,0,-prof/2);return g;}

export function personalizaPit(rig, modelo={}){
  if(VISUAIS.has(rig.av))return VISUAIS.get(rig.av);
  // As malhas antigas ficam ocultas; os pivôs, equipamentos de missão e API do rig continuam válidos.
  rig.av.traverse(o=>{if(o.isMesh)o.visible=false;});
  const normais=[],armaduras=[],luzes=[],verde=mat(modelo.camisa??0x182c29),laranja=mat(0xb77537),calca=mat(0x172823),borracha=mat(0x111619,.92),couro=mat(0x161c1d,.83),aco=mat(0x959da5,.28,.85),barba=mat(0x211c18,.96),pele=mat(modelo.pele??0xc39b7e,.8),preto=mat(0x0a1018,.38,.6),grafite=mat(0x1c2630,.32,.72);
  const azul=new MeshStandardMaterial({color:0x53bfff,emissive:0x238dff,emissiveIntensity:1.8,roughness:.3,metalness:.35});
  const violeta=new MeshStandardMaterial({color:0xba68ff,emissive:0x8e35ff,emissiveIntensity:1.7,roughness:.3,metalness:.35});luzes.push(azul,violeta);
  const grupo=(pai,forma)=>{const g=new Group();g.name='pit-'+forma;g.userData.pitForma=forma;pai.add(g);(forma==='normal'?normais:armaduras).push(g);return g;};
  const mk=(pai,g,m,x=0,y=0,z=0)=>{const o=new Mesh(g,m);o.position.set(x,y,z);pai.add(o);return o;};
  const oval=(pai,m,x,y,z,rx,ry,rz)=>mk(pai,new SphereGeometry(1,24,16).scale(rx,ry,rz),m,x,y,z);
  const linha=(pai,pts,m,raio=.025)=>mk(pai,new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,raio,7,false),m);
  const faixa=(pai,a,b,w,m)=>{const v=new Vector3(...b).sub(new Vector3(...a)),o=mk(pai,caixa(w,v.length(),.045,.012),m,...new Vector3(...a).addScaledVector(v,.5).toArray());o.quaternion.setFromUnitVectors(new Vector3(0,1,0),v.normalize());return o;};
  const painel=(pai,pts,m,z=.43,prof=.065)=>mk(pai,chapa(pts,prof),m,0,0,z);
  const contorno=(pai,pts,m,z)=>linha(pai,[...pts,pts[0]].map(([x,y])=>[x,y,z]),m,.018);
  rig.av.userData.personagem='pit';rig.av.name='pit';rig.tronco.position.y=2.7;rig.tronco.scale.set(1,1,1);rig.cab.position.set(0,5.28,0);rig.cab.scale.set(.47,.46,.51);
  rig.bD.pv.position.set(-.88,1.78,0);rig.bE.pv.position.set(.88,1.78,0);
  for(const b of [rig.bD,rig.bE]){b.co.position.set(0,-.99,0);b.mao.position.set(0,-1.03,0);b.pv.rotation.set(.04,0,b===rig.bD?-.08:.08);b.co.rotation.set(-.1,0,0);if(b.rock)b.rock.visible=false;}
  const corpo=grupo(rig.tronco,'normal'),arm=grupo(rig.tronco,'armadura');
  const perfil=[[0,0,0],[.08,.55,.34],[.35,.57,.34],[1,.72,.40],[1.55,.81,.43],[1.85,.68,.35],[2.06,.29,.22],[2.1,0,0]];
  mk(corpo,perfilCorpo(perfil,28),verde);
  painel(corpo,[[-.50,.25],[.50,.25],[.65,1.63],[.40,1.80],[-.40,1.80],[-.65,1.63]],laranja,.40,.035);
  mk(corpo,new CylinderGeometry(.22,.27,.38,24),pele,0,2.21,0);
  const capuz=mk(corpo,new TorusGeometry(.37,.14,12,36),verde,0,1.98,-.13);capuz.rotation.x=Math.PI/2;capuz.scale.set(1.15,1,.8);
  const forro=mk(corpo,new TorusGeometry(.34,.065,10,32),laranja,0,2.03,-.08);forro.rotation.x=Math.PI/2;
  faixa(corpo,[0,.2,.49],[0,1.81,.49],.045,couro);
  for(const s of [-1,1]){
    faixa(corpo,[s*.53,1.87,.39],[s*.14,.24,.52],.14,couro);
    const f=mk(corpo,caixa(.22,.25,.07),aco,s*.39,1.27,.50);f.rotation.z=s*.23;
    mk(corpo,caixa(.13,.17,.08),couro,s*.39,1.27,.54);
    const mos=mk(corpo,new TorusGeometry(.15,.035,10,24),aco,s*.62,-.10,.17);mos.scale.y=1.5;mos.rotation.z=s*.3;
    linha(corpo,[[s*.52,.12,.26],[s*.82,-.35,.30],[s*.65,-.57,.39],[s*.40,-.32,.37]],mat(0xa69878,.95),.045);
  }
  const cinta=mk(corpo,new CylinderGeometry(.64,.65,.15,32),couro,0,.12,0);cinta.scale.z=.67;
  mk(corpo,caixa(.28,.17,.08),aco,0,.12,.47);
  const central=mk(corpo,new TorusGeometry(.19,.036,10,32),aco,0,.54,.55);central.scale.y=1.4;
  mk(corpo,caixa(.23,.54,.15),borracha,.52,1.35,.48);mk(corpo,caixa(.15,.13,.02),mat(0x5c796d,.45),.52,1.42,.57);mk(corpo,new CylinderGeometry(.017,.017,.43,8),borracha,.58,1.82,.48);
  for(let i=0;i<5;i++)mk(corpo,caixa(.12,.014,.015,.002),aco,.52,1.19+i*.035,.56);
  // Peitorais, abdômen e coluna da armadura; todas as placas seguem o tronco.
  mk(arm,perfilCorpo(perfil,28),preto);
  for(const s of [-1,1]){
    const pec=[[.055,1.67],[.61,1.79],[.78,1.45],[.64,1.02],[.08,1.14]].map(([x,y])=>[x*s,y]);painel(arm,pec,grafite,.44,.12);contorno(arm,pec,s<0?azul:violeta,.525);
    for(let k=0;k<3;k++){const y=.31+k*.24,pts=[[.07,y],[.41,y-.025],[.49,y+.10],[.37,y+.20],[.07,y+.20]].map(([x,y])=>[s*x,y]);painel(arm,pts,preto,.38,.09);}
    ligne(s);
  }
  function ligne(s){linha(arm,[[s*.64,1.7,.45],[s*.73,1.28,.42],[s*.53,.87,.39],[s*.46,.24,.34]],s<0?azul:violeta,.019);}
  painel(arm,[[-.15,1.88],[.15,1.88],[.12,1.35],[0,1.17],[-.12,1.35]],preto,.47,.10);
  faixa(arm,[0,1.77,.55],[0,1.37,.55],.025,azul);
  const dos=mk(arm,caixa(1.12,1.28,.18,.11),grafite,0,1.18,-.40);linha(arm,[[0,1.8,-.51],[0,.55,-.51]],azul,.025);void dos;
  mk(arm,new CylinderGeometry(.25,.31,.38,24),preto,0,2.19,0);
  // Cabeça normal, própria: mandíbula mais marcada, barba escura, olhos castanhos e sobrancelhas sérias.
  const rostoG=grupo(rig.cab,'normal');const rosto=criarRosto(rostoG,{pele,cabelo:barba,olhos:0x493c2c});rig.rosto=rosto;
  const pos=rosto.cabeca.geometry.attributes.position;for(let i=0;i<pos.count;i++)if(pos.getY(i)<-.28)pos.setX(i,pos.getX(i)*1.07);pos.needsUpdate=true;rosto.cabeca.geometry.computeVertexNormals();
  mk(rostoG,geometriaCabeca(false,-.25).scale(1.035,1.06,1.035),barba);
  for(const s of [-1,1]){oval(rostoG,barba,s*.12,-.32,.73,.15,.045,.06);linha(rostoG,[[s*.13,.23,.72],[s*.30,.28,.73],[s*.51,.24,.65]],barba,.049);}
  const cabelo=mk(rostoG,new SphereGeometry(.88,28,20,0,Math.PI*2,0,Math.PI*.46),barba,0,.08,-.06);cabelo.scale.set(1,1.08,.95);
  const brinco=mk(rostoG,new TorusGeometry(.075,.026,10,22),borracha,.92,-.18,-.04);brinco.rotation.y=Math.PI/2;
  const casco=mat(0xd98432,.42,.08);mk(rostoG,new SphereGeometry(1.03,36,24,0,Math.PI*2,0,Math.PI*.48),casco,0,.15,0);
  const aro=mk(rostoG,new TorusGeometry(1.0,.045,10,40),borracha,0,.22,0);aro.rotation.x=Math.PI/2;
  for(const s of [-1,1]){mk(rostoG,caixa(.23,.13,.04,.015),mat(0xa72c2b),s*.52,.40,.87);linha(rostoG,[[s*.92,.13,.08],[s*.93,-.25,.09],[s*.54,-.98,.36],[s*.10,-1,.55]],borracha,.025);}
  for(let k=0;k<3;k++)mk(rostoG,caixa(.26,.09,.04,.01),mat(0xd0d1c7),0,.35+k*.11,.99-k*.04);
  // Capacete integral: nenhuma parte do rosto normal permanece exposta.
  const elmo=grupo(rig.cab,'armadura');mk(elmo,geometriaCabeca().scale(1.16,1.14,1.18),preto);
  const visor=[[-.64,.37],[.64,.37],[.55,-.10],[.25,-.62],[-.25,-.62],[-.55,-.10]];
  painel(elmo,visor,new MeshStandardMaterial({color:0x08283d,emissive:0x1267af,emissiveIntensity:.65,metalness:.65,roughness:.2}),.84,.08);contorno(elmo,visor,azul,.91);
  painel(elmo,[[-.48,.85],[0,1.08],[.48,.85],[.59,.48],[0,.42],[-.59,.48]],grafite,.77,.11);
  painel(elmo,[[-.32,-.66],[.32,-.66],[.25,-.93],[-.25,-.93]],grafite,.72,.12);
  for(const s of [-1,1]){linha(elmo,[[s*.62,.14,.86],[s*.69,-.24,.77],[s*.38,-.72,.77]],violeta,.029);const o=mk(elmo,new CylinderGeometry(.21,.23,.12,24),grafite,s*1.02,-.16,-.04);o.rotation.z=Math.PI/2;}
  // Braços, mãos e CardPuter articulados.
  for(const [b,s] of [[rig.bD,-1],[rig.bE,1]]){
    for(const forma of ['normal','armadura']){const sup=grupo(b.pv,forma),inf=grupo(b.co,forma),mao=grupo(b.mao,forma),m=forma==='normal'?verde:preto;
      mk(sup,perfilCorpo([[-1.04,0,0],[-.99,.17,.18],[-.4,.23,.24],[0,.29,.26],[.13,.20,.20],[.18,0,0]],24),m);
      mk(inf,perfilCorpo([[-1.02,0,0],[-.95,.13,.15],[-.55,.18,.20],[0,.19,.20],[.06,0,0]],24),m);
      oval(mao,couro,0,-.07,0,.14,.23,.10);for(let k=0;k<4;k++)oval(mao,couro,(k-1.5)*.07,-.29,.025,.039,.12-Math.abs(k-1)*.015,.044);const pol=oval(mao,couro,-s*.16,-.06,.05,.06,.15,.06);pol.rotation.z=s*.4;
      if(forma==='normal'){mk(inf,caixa(.28,.12,.05),laranja,0,-.88,.17);}
      else{oval(sup,grafite,0,.025,0,.35,.34,.34);const pts=[[-.23,.20],[.23,.20],[.29,-.16],[.16,-.36],[-.19,-.34]];painel(sup,pts,grafite,.27,.08);contorno(sup,pts,s<0?azul:violeta,.33);painel(inf,[[-.18,-.07],[.18,-.07],[.15,-.78],[-.12,-.86],[-.21,-.5]],grafite,.19,.08);linha(inf,[[s*.17,-.10,.24],[s*.18,-.58,.24],[0,-.85,.20]],s<0?violeta:azul,.018);for(let k=0;k<3;k++)oval(mao,violeta,(k-1)*.08,-.12,.105,.021,.035,.01);}
    }
  }
  function perna(q,j,forma){const g=grupo(q,forma),h=grupo(j,forma),m=forma==='normal'?calca:preto;
    mk(g,perfilCorpo([[-1.43,0,0],[-1.35,.20,.22],[-.75,.25,.28],[-.16,.30,.29],[.10,0,0]],24),m);
    oval(h,m,0,-.02,0,.21,.24,.22);
    mk(h,perfilCorpo([[-1.26,0,0],[-1.15,.16,.17],[-.56,.21,.23],[0,.22,.23],[.07,0,0]],24),m);
    const pe=new Group();pe.position.y=-1.5;h.add(pe);mk(pe,caixa(.50,.12,.94,.045),borracha,0,.06,.16);oval(pe,forma==='normal'?couro:grafite,0,.25,.15,.24,.19,.43);mk(pe,new CylinderGeometry(.19,.21,.40,20),m,0,.40,-.08);
    if(forma==='normal'){const bolso=mk(g,caixa(.13,.57,.36,.04),verde,q.position.x<0?-.29:.29,-.58,.06);void bolso;for(let k=0;k<4;k++)faixa(pe,[-.12,.31+k*.04,.35-k*.065],[.12,.31+k*.04,.35-k*.065],.016,mat(0x5e5d4f));}
    else{const pts=[[-.19,-.14],[.21,-.14],[.26,-.73],[.13,-1.1],[-.20,-.98]];painel(g,pts,grafite,.27,.08);const joelho=[[-.22,.15],[.22,.15],[.25,-.15],[0,-.34],[-.25,-.15]];painel(h,joelho,grafite,.25,.10);contorno(h,joelho,violeta,.32);linha(h,[[.19,-.35,.24],[.15,-1.13,.23],[-.10,-1.22,.22]],azul,.02);}
  }
  // Conjuntos estático e animado com as mesmas medidas; trocar de pose não troca de identidade.
  rig.estat=[];
  for(let i=0;i<2;i++){const x=i? .37:-.37,q=rig.pernasA.quadril[i],j=rig.pernasA.joelho[i];q.position.set(x,2.85,0);j.position.set(0,-1.35,0);
    const sq=new Group(),sj=new Group();sq.position.copy(q.position);sj.position.copy(j.position);sq.add(sj);rig.av.add(sq);rig.estat.push(sq);for(const forma of ['normal','armadura']){perna(q,j,forma);perna(sq,sj,forma);}}
  for(const forma of ['normal','armadura']){const p=grupo(rig.av,forma);oval(p,forma==='normal'?calca:preto,0,2.81,-.02,.62,.31,.35);}
  const cpG=grupo(rig.bE.mao,'armadura');cpG.name='pit-cardputer';cpG.position.set(0,-.06,.22);cpG.rotation.x=1.9;
  mk(cpG,caixa(.70,.09,.52,.045),grafite);const canvas=document.createElement('canvas');canvas.width=256;canvas.height=160;const ctx=canvas.getContext('2d'),tex=new CanvasTexture(canvas);tex.colorSpace=SRGBColorSpace;
  const tela=mk(cpG,caixa(.56,.012,.31,.005),new MeshBasicMaterial({map:tex}),0,.055,-.06);for(let k=0;k<5;k++)mk(cpG,caixa(.08,.012,.04,.004),borracha,(k-2)*.105,.055,.19);
  let ultimo='',armado=false,t=0;
  function screen(energia=100,tipo='lobo'){const txt=Math.round(energia)+'|'+tipo;if(txt===ultimo)return;ultimo=txt;ctx.fillStyle='#03141e';ctx.fillRect(0,0,256,160);ctx.strokeStyle='#2385ac';for(let y=0;y<160;y+=12){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}ctx.fillStyle='#6bdbff';ctx.font='bold 22px monospace';ctx.fillText('PIT / CARDPUTER',12,28);ctx.font='16px monospace';ctx.fillText('ENERGIA '+Math.round(energia)+'%',12,66);ctx.fillRect(12,78,Math.max(0,Math.min(100,energia))*2.2,10);ctx.fillText(tipo.toUpperCase(),12,120);ctx.fillText('SISTEMA ATIVO',12,147);tex.needsUpdate=true;}
  function forma(on){armado=!!on;normais.forEach(g=>g.visible=!armado);armaduras.forEach(g=>g.visible=armado);if(!armado){rig.bE.pv.rotation.set(.04,0,.08);rig.bE.co.rotation.set(-.1,0,0);}screen();}
  function tick(dt,energia,tipo){t+=dt;if(!armado)return;azul.emissiveIntensity=1.4+.7*(.5+.5*Math.sin(t*3.2));violeta.emissiveIntensity=1.1+.8*(.5+.5*Math.sin(t*3.2+1.7));rig.bE.pv.rotation.set(-.48,0,.16);rig.bE.co.rotation.set(-1.05,0,0);screen(energia,tipo);}
  const visual={forma,tick,screen,normais,armaduras,luzes,cardputer:cpG,tela,get armado(){return armado;}};rig.pitVisual=visual;VISUAIS.set(rig.av,visual);forma(false);return visual;
}

export function constroiPit(H,def,pose={}){
  const m=def?.modelo||{},r=H.pessoa3d({nome:'Pit',x:0,y:-50,z:0,yaw:0,camisa:H.M(m.camisa??0x182c29),manga:H.M(m.camisa??0x182c29),calca:H.M(0x172823),pele:H.M(m.pele??0xc39b7e),cabelo:m.cabelo??0x211c18,barba:true,oculos:false,...pose});
  const visual=personalizaPit(r,m);return{id:'pit',nome:'Pit',p:r,tick:dt=>visual.tick(dt),fx:{liga:()=>visual.forma(true),desliga:()=>visual.forma(false),tick:dt=>visual.tick(dt)}};
}
