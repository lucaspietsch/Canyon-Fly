import {Color,Fog,Group,Mesh,CylinderGeometry,ConeGeometry,MeshStandardMaterial,PointLight,Points,PointsMaterial,BufferGeometry,Float32BufferAttribute} from 'three';
import {U} from '../config.js';
import {canvasTex} from '../../lib.js';
import {criaAnhanga} from './anhanga.js';
import {criarLobisomem} from './lobisomem.js';
import {criaGritador,criaBoitata} from './criaturas.js';
/** Clareira assombrada ancorada ao polígono real da Olaria, no passado. */
export function criarFlorestaOlaria(M){
 const S={ativo:false,g:null,anhanga:null,lobo:null,gritador:null,boitata:null,alvos:[],t:0};
 function centro(){const p=M.kml?.S.poligonos.find(p=>p.tipo==='olaria'||/antiga floresta da olaria/i.test(p.nome));if(!p)return null;const pts=M.zonas.mundoPts(p)||p.pts;return pts.reduce((a,p)=>({x:a.x+p[0]/pts.length,z:a.z+p[1]/pts.length}),{x:0,z:0});}
 function monta(c){
  S.baseY=M.cen.chao(c.x,c.z,1e9);const antes=new Set(M.poderes.alvos),g=S.g=new Group();g.name='floresta-sombria-olaria';M.cen.grupo.add(g);
  const casca=new MeshStandardMaterial({color:0x181d20,roughness:1}),copa=new MeshStandardMaterial({color:0x111e20,roughness:1});
  for(let i=0;i<48;i++){const angle=i*2.39996,r=(18+i%5*4)*U,x=c.x+Math.sin(angle)*r,z=c.z+Math.cos(angle)*r,y=M.cen.chao(x,z,1e9),h=(13+i%7)*U;const trunk=new Mesh(new CylinderGeometry(.20*U,.44*U,h,7),casca);trunk.position.set(x,y+h/2,z);g.add(trunk);for(let j=0;j<2;j++){const crown=new Mesh(new ConeGeometry((4.2-j)*U,5*U,8),copa);crown.position.set(x,y+h-j*3*U,z);g.add(crown);}}
  const pos=[];for(let i=0;i<140;i++){const a=i*2.39996,r=Math.sqrt(i/140)*24*U,x=c.x+Math.sin(a)*r,z=c.z+Math.cos(a)*r;pos.push(x,M.cen.chao(x,z,1e9)+(.4+i%5*.16)*U,z);}const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(pos,3));const mist=new Points(geo,new PointsMaterial({color:0x66888e,map:canvasTex(64,64,(ctx,w,h)=>{const r=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=r;ctx.fillRect(0,0,w,h);}),size:2.8*U,transparent:true,opacity:.12,depthWrite:false}));mist.name='nevoa-olaria';g.add(mist);
  for(const side of [-1,1]){const l=new PointLight(0x83b4d9,55,50*U,1);l.position.set(c.x+side*12*U,M.cen.chao(c.x,c.z,1e9)+12*U,c.z+9*U);g.add(l);}
  const A=S.anhanga=criaAnhanga(M.H);A.coloca(c.x,M.cen.chao(c.x,c.z,1e9),c.z,0);M.cen.grupo.add(A.g);
  const target=M.poderes.registra({id:'anhanga-olaria',tipo:'guardiao',nome:'Anhangá da Olaria',raioM:2,alturaM:2.8,pos:()=>A.g.position,aoRaio(){S.lobo.provoca();},aoFlecha(){},aoLabia(){return true;},aoOlhos(){}});
  S.lobo=criarLobisomem(M,()=>A.g.position);S.lobo.coloca(c.x+4*U,c.z+2*U);
  S.gritador=criaGritador(M,{id:'olaria-gritador'});S.gritador.coloca(c.x-9*U,c.z-5*U);S.gritador.estado='parado';
  S.boitata=criaBoitata(M,{id:'olaria-boitata'});S.boitata.coloca(c.x+11*U,c.z-8*U);
  S.alvos=M.poderes.alvos.filter(a=>!antes.has(a));
 }
 function visivel(on){if(!S.g)return;if(on&&!S.ativo){S.ambiente={bg:M.cena.background,fog:M.cena.fog,ceu:M.cen.ceu.visible};}if(on){M.cen.ceu.visible=false;M.cena.background=new Color(0x08111b);M.cena.fog=new Fog(0x08111b,14*U,70*U);}else if(S.ambiente){M.cena.background=S.ambiente.bg;M.cena.fog=S.ambiente.fog;M.cen.ceu.visible=S.ambiente.ceu;S.ambiente=null;}S.g.visible=S.anhanga.g.visible=S.lobo.g.visible=S.gritador.g.visible=S.boitata.g.visible=on;for(const a of S.alvos){if(on){if(!M.poderes.alvos.includes(a))M.poderes.registra(a);}else M.poderes.remove(a);}S.ativo=on;if(!on){S.lobo.S.estado='guarda';S.lobo.S.combo=-1;}}
 function entra(){const c=centro();if(!c)return false;if(!S.g)monta(c);visivel(true);return true;}
 function tick(dt,J){const c=centro();if(!c||!J)return;const perto=Math.hypot(J.x-c.x,J.z-c.z)<75*U,on=M.lugares.epoca()==='1950'&&perto;if(on&&!S.ativo)entra();else if(!on&&S.ativo)visivel(false);if(!S.ativo)return;M.cen.ceu.visible=false;M.cena.background.set(0x08111b);M.cena.fog.color.set(0x08111b);S.t+=dt;S.g.position.y=M.cen.chao(c.x,c.z,1e9)-S.baseY;for(const p of [S.anhanga.g.position,S.gritador.pos()])p.y=M.cen.chao(p.x,p.z,1e9);S.anhanga.tick(dt);S.lobo.tick(dt,J);S.gritador.tick(dt,J);S.boitata.tick(dt,J);}
 function desliga(){visivel(false);}
 return{S,centro,entra,tick,defende(){if(S.ativo)return S.lobo.provoca();return false;},desliga};
}
