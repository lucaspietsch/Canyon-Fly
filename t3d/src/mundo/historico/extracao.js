import {pisoHistorico} from './chao.js';
import {Group,Mesh,CylinderGeometry,SphereGeometry,Vector3,BoxGeometry,MeshStandardMaterial} from 'three';
import {U} from '../config.js';
import {criarGaucho,GAUCHOS_1950} from './gauchos.js';
import {criarCaminhaoMadeira} from './caminhao-madeira.js';
/** Preencher somente com locais enviados pelo usuário. Coordenadas do mundo em unidades do jogo. */
export const LOCAIS_EXTRACAO_1950=[];
export function rotaParaFabrica(M,local){
 if(local.rota?.length>=2)return local.rota;
 const fab=M.kml?.S.poligonos.find(p=>p.tipo==='fabrica');if(!fab)return null;const chegada=M.lugares?.item?.('fabrica')?.chegada;const P=M.zonas.mundoPts(fab)||fab.pts,centro=P.reduce((a,p)=>[a[0]+p[0]/P.length,a[1]+p[1]/P.length],[0,0]),f=chegada?[chegada.x,chegada.z]:centro,E=M.estrada,a=E?.proximo(local.x,local.z),b=E?.proximo(...f);if(!a||!b)return null;
 const pts=[[local.x,local.z],[a.x,a.z]],n=Math.max(1,Math.ceil(Math.abs(b.s-a.s)/(35*U)));for(let i=1;i<=n;i++){const p=E.amostra(a.s+(b.s-a.s)*i/n);pts.push([p.x,p.z]);}pts.push(f);return pts;
}
export function criarFrenteExtracao(M,local,{preview=false}={}){
 const g=new Group();g.name='extracao-1950-'+local.id;M.cen.grupo.add(g);const chao=(x,z)=>pisoHistorico(M,x,z),cor=c=>new MeshStandardMaterial({color:c,roughness:1});
 const arvore=new Group(),casca=cor(0x665543),copa=cor(0x394c35),rotas=preview?null:rotaParaFabrica(M,local),caminhao=criarCaminhaoMadeira('toras');g.add(caminhao.g);caminhao.g.position.set(local.x+9*U,chao(local.x+9*U,local.z),local.z);caminhao.carga.visible=preview;
 arvore.position.set(local.x,chao(local.x,local.z),local.z);g.add(arvore);const trunk=new Mesh(new CylinderGeometry(.92*U,1.10*U,25*U,24),casca);trunk.position.y=12.5*U;arvore.add(trunk);for(let j=0;j<3;j++)for(let k=0;k<8;k++){const a=k/8*Math.PI*2+j*.3,r=(7-j*1.4)*U,h=(22+j*2)*U,end=new Vector3(Math.sin(a)*r,h+1.4*U,Math.cos(a)*r),start=new Vector3(0,h,0),dir=end.clone().sub(start),branch=new Mesh(new CylinderGeometry(.08*U,.18*U,dir.length(),7),casca);branch.position.copy(start).add(end).multiplyScalar(.5);branch.quaternion.setFromUnitVectors(new Vector3(0,1,0),dir.normalize());arvore.add(branch);const crown=new Mesh(new SphereGeometry(1,12,8),copa);crown.scale.set(2.8*U,.85*U,2.2*U);crown.position.copy(end);arvore.add(crown);}
 const workers=[];for(let i=0;i<2;i++){const w=criarGaucho(M.H,{...GAUCHOS_1950[i+3],id:local.id+'-lenhador-'+i,nome:'Lenhador',poncho:null});g.add(w.g);w.g.position.set(local.x+(i?-1:1)*2*U,chao(local.x,local.z),local.z+.25*U);w.g.rotation.y=i?Math.PI/2:-Math.PI/2;
  const axe=new Group(),handle=new Mesh(new CylinderGeometry(.045,.045,1.25,8),cor(0x876545));handle.position.y=.20;axe.add(handle);const blade=new Mesh(new BoxGeometry(.5,.35,.09),cor(0x929592));blade.position.set(.16,.78,0);axe.add(blade);w.rig.bD.mao.add(axe);workers.push(w);
 }
 const S={fase:'cortando',t:0,viagens:0,indice:1,rota:rotas,pendenteRota:!rotas,arvoresRestantes:local.arvores||3,entregas:0};
 function tick(dt){S.t+=dt;for(const [i,w]of workers.entries()){w.tick(S.t+i);if(S.fase==='cortando'){w.rig.bD.pv.rotation.x=-.8-Math.sin(S.t*4+i*Math.PI)*.9;w.rig.bD.co.rotation.x=-.6;}}
  if(preview)return;
  if(S.fase==='cortando'&&S.t>=10){S.fase='tombando';S.t=0;workers.forEach(w=>w.g.position.z=arvore.position.z-3*U);}
  else if(S.fase==='tombando'){arvore.rotation.z=Math.min(1,S.t/3)*Math.PI*.48;if(S.t>=3){S.fase='carregando';S.t=0;}}
  else if(S.fase==='carregando'&&S.t>=5){if(!S.rota)return;arvore.visible=false;caminhao.carga.visible=true;S.fase='transportando';S.indice=1;S.t=0;}
  else if(S.fase==='transportando'||S.fase==='retornando'){
   const target=S.rota[S.indice],p=caminhao.g.position,dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,8*U*dt);if(d>.01){p.x+=dx/d*step;p.z+=dz/d*step;caminhao.g.rotation.y=Math.atan2(dx,dz);if(!S.pisoT||S.t-S.pisoT>.2){S.yAlvo=chao(p.x,p.z);S.pisoT=S.t;}p.y+=(S.yAlvo-p.y)*Math.min(1,dt*10);caminhao.tick(dt,8);}if(d<2*U){S.indice+=S.fase==='retornando'?-1:1;if(S.indice>=S.rota.length){S.fase='descarregando';S.t=0;}else if(S.indice<0){S.arvoresRestantes--;if(S.arvoresRestantes<=0)S.fase='concluido';else{arvore.visible=true;arvore.rotation.z=0;arvore.position.z+=5*U;workers.forEach(w=>w.g.position.z=arvore.position.z+.25*U);S.fase='cortando';S.t=0;}}}
  }else if(S.fase==='descarregando'&&S.t>=5){S.entregas++;M.missoes?.emite('madeira:entregue',{local:local.id});caminhao.carga.visible=false;S.fase='retornando';S.indice=S.rota.length-2;S.t=0;}
 }
 return{g,S,arvore,caminhao,workers,tick,dispose(){g.removeFromParent();caminhao.dispose();workers.forEach(w=>w.dispose());const gs=new Set(),ms=new Set();arvore.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());}};
}
export function criarExtracao1950(M){const S={locais:LOCAIS_EXTRACAO_1950,frentes:[],ativo:false,tabuas:null};function limpa(){S.frentes.forEach(f=>f.dispose());S.frentes=[];S.ativo=false;if(S.tabuas)S.tabuas.g.visible=false;}function defineLocais(locais){const ids=new Set();for(const p of locais){if(!p.id||!Number.isFinite(p.x)||!Number.isFinite(p.z)||ids.has(p.id))throw Error('Local de extração requer id único, x e z válidos');if(p.rota&&(p.rota.length<2||p.rota.some(q=>!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite))))throw Error('Rota requer ao menos dois pares de coordenadas válidas');ids.add(p.id);}limpa();S.locais=locais.map(p=>({...p}));}
 function tick(dt,J){const ativo=M.lugares.epoca()==='1950';if(!ativo){if(S.ativo)limpa();return;}if(!S.ativo){S.frentes=S.locais.map(p=>criarFrenteExtracao(M,p));S.ativo=true;}for(const f of S.frentes)f.tick(dt);const fab=M.lugares?.item?.('fabrica'),p=fab?.chegada;if(p&&J&&Math.hypot(J.x-p.x,J.z-p.z)<170*U){if(!S.tabuas){S.tabuas=criarCaminhaoMadeira('tabuas');M.cen.grupo.add(S.tabuas.g);}S.tabuas.g.visible=true;if(!S.patioT||performance.now()-S.patioT>3000){S.patioY=pisoHistorico(M,p.x+5*U,p.z);S.patioT=performance.now();}S.tabuas.g.position.set(p.x+5*U,S.patioY,p.z);S.tabuas.g.rotation.y=p.yaw||0;}else if(S.tabuas)S.tabuas.g.visible=false;}
 return{S,tick,defineLocais,desliga:limpa};}
