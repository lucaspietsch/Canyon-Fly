import { Mesh, BoxGeometry, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending } from 'three';
import { constroiOperadoraDetalhada } from './operadora-detalhada.js';
export function constroiDiully(H,def){
 const base=constroiOperadoraDetalhada(H,def,{loira:true}),r=base.p,v=r.operadoraVisual;delete r.operadoraVisual;r.diullyVisual=v;
 const tela=new Mesh(new BoxGeometry(.25,.43,.025),new MeshStandardMaterial({color:0x26242b,roughness:.4}));tela.position.set(0,-.10,.21);r.bD.mao.add(tela);tela.visible=false;
 const screen=new Mesh(new BoxGeometry(.21,.35,.007),new MeshStandardMaterial({color:0x9ac4cf,emissive:0x486575,emissiveIntensity:.35}));screen.position.z=.018;tela.add(screen);
 const brilhos=[];for(const b of [r.bD,r.bE]){const pos=new Float32Array(24*3),g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(pos,3));const p=new Points(g,new PointsMaterial({color:0xffd273,size:.045,transparent:true,opacity:.65,depthWrite:false,blending:AdditiveBlending}));b.mao.add(p);brilhos.push({p,pos});}
 let t=0,gesto=null,proximo=8;
 function pertoMirante(J=H.andarMod?.estado?.()){if(!J)return false;const pontos=(H.cen?.hotspots||[]).filter(h=>/mirante/i.test(h.nome||h.id||'')),L=H.cen?.lancamento;if(L)pontos.push({x:L.x,z:L.zs?.[0]||0});return pontos.some(h=>Math.hypot(h.x-J.x,h.z-J.z)<24);}
 function anima(tipo){if(v.on||gesto)return false;gesto={tipo,t:0};return true;}
 function encerra(){gesto=null;tela.visible=false;r.bD.pv.rotation.z=0;r.bD.pv.rotation.x=0;r.bD.co.rotation.x=0;}
 function tick(dt){base.tick(dt);t+=dt;brilhos.forEach(({p,pos},j)=>{p.visible=v.on;if(v.on){for(let k=0;k<24;k++){const a=t*2.2+k*2.4;pos[k*3]=Math.cos(a)*.22;pos[k*3+1]=Math.sin(a*.7)*.17;pos[k*3+2]=Math.sin(a)*.22;}p.geometry.attributes.position.needsUpdate=true;}});
   const ativo=H.mundo?.ctx?.avatar?.()===r;const estado=H.andarMod?.estado?.();if(!ativo||v.on||Math.abs(estado?.vel||0)>.3){if(gesto)encerra();return;}proximo-=dt;
   if(!gesto&&proximo<=0){const perto=pertoMirante();anima(perto?'selfie':Math.floor(t/8)%2?'cabelo':'acenar');proximo=12;}
   if(gesto){gesto.t+=dt;const k=Math.min(1,gesto.t/.4,(2.8-gesto.t)/.4);if(k<=0){encerra();return;}r.bD.pv.rotation.x=(gesto.tipo==='selfie'?-1.1:-.25)*k;r.bD.pv.rotation.z=(gesto.tipo==='cabelo'?-1.8:-2.2)*k;r.bD.co.rotation.x=(-.7+Math.sin(t*7)*(gesto.tipo==='acenar'?.3:.03))*k;tela.visible=gesto.tipo==='selfie';}
 }
 v.pertoMirante=pertoMirante;v.anima=anima;v.gesto=()=>gesto?.tipo||null;v.encerra=encerra;
 return{...base,tick,fx:{liga(){encerra();base.fx.liga();},desliga(){base.fx.desliga();},tick}};
}
