import {Group} from 'three';
import {criarPessoas} from '../gente/pessoas.js';
import {U} from '../config.js';
export const NPCS_CENTRO=[
 {id:'lurdes',nome:'Dona Lurdes',papel:'Moradora',camisa:0x874c78,pele:0xc68a62,cabelo:0xaaa39b,fala:'Esta praça guarda muitas memórias de Cambará. E, à noite, lembre do conselho antigo: se ouvir o Gritador nos campos, não responda.'},
 {id:'raul',nome:'Raul',papel:'Comerciante',camisa:0x416e98,pele:0xd9a37a,cabelo:0x302319,fala:'Bem-vindo ao centro! A praça é um bom ponto para começar a conhecer a cidade.'},
 {id:'lia',nome:'Lia',papel:'Guia local',camisa:0x447b58,pele:0x9a6a46,cabelo:0x201610,fala:'Antes de seguir às vilas, confira as missões do centro. As gralhas e os pinheirais fazem parte dessa história.'},
 {id:'bento',nome:'Bento',papel:'Artesão',camisa:0xb6773d,pele:0x95603f,cabelo:0x493326,fala:'Gosto de observar os desenhos da natureza: as sementes, as folhas e as cores das aves.'},
 {id:'iris',nome:'Íris',papel:'Estudante',camisa:0xc34f48,pele:0xe0ac86,cabelo:0x251917,fala:'Estou registrando os animais da região. Você já usou o modo de fotografia?'},
 {id:'vitor',nome:'Vítor',papel:'Visitante',camisa:0x578b91,pele:0xb57c52,cabelo:0x1b1512,fala:'Vim conhecer os cânions e parei para passear pelo centro. A cidade também merece uma visita.'}
];
export function aparenciaNpcCentro(d){return{role:d.id==='lurdes'?'idoso':'adulto',esc:d.id==='lurdes'?.94:1,cor:{pele:d.pele,cabelo:d.cabelo,camisa:d.camisa,manga:d.camisa,calca:0x424b50,bota:0x40342a,chapeu:0x80704d,mochila:0x6b775b},acess:{cabelo:true,rabo:['lia','iris'].includes(d.id),mochila:d.id==='iris',chapeu:d.id==='bento'?1:0}};}
export function criarNpcsCentro(M){
 const g=new Group();g.name='moradores-do-centro';M.cen.grupo.add(g);const R=criarPessoas(g,NPCS_CENTRO.length),S={t:0,origem:null,pessoas:[],hotspots:[]};R.setSombras(false);
 const pose=()=>({legL:0,legR:0,armL:0,armR:0,armLz:.08,armRz:.08,lean:0,sit:0,lie:0,bob:0,headYaw:0,headPitch:0});
 function limpa(){for(const h of S.hotspots){const i=M.cen.hotspots.indexOf(h);if(i>=0)M.cen.hotspots.splice(i,1);}S.hotspots=[];S.pessoas=[];S.origem=null;R.inicia();R.fim();}
 function centro(J){const L=[...(M.lugares?.S.vivos?.values()||[])].filter(v=>v.o?.hub&&v.it?.tipo==='praca');let best=L.sort((a,b)=>Math.hypot(a.o.hub[0]-J.x,a.o.hub[1]-J.z)-Math.hypot(b.o.hub[0]-J.x,b.o.hub[1]-J.z))[0];if(best)return best.o.hub;const u=M.zonas.urbano?.find(u=>/cidade|cambar[aá]|centro/i.test(u.nome));return u?.praca||null;}
 function cria(p){S.origem=p;NPCS_CENTRO.forEach((d,i)=>{const a=i*Math.PI/3,r=(10+i%2*3)*U,b={...aparenciaNpcCentro(d),id:d.id,nome:d.nome,x:p[0]+Math.sin(a)*r,z:p[1]+Math.cos(a)*r,y:0,yaw:a+Math.PI,pose:pose(),fase:i,home:[p[0]+Math.sin(a)*r,p[1]+Math.cos(a)*r]};S.pessoas.push(b);const h={id:'centro-npc-'+d.id,x:b.x,z:b.z,r:2.5*U,rotulo:()=>d.nome+' · '+d.papel,acao:()=>M.terminal.msg('info',d.nome+': “'+d.fala+'”')};S.hotspots.push(h);M.cen.hotspots.push(h);});}
 function tick(dt,J){S.t+=dt;const hora=M.ciclo.hora();if(!J||hora<6||hora>=22||M.lugares?.epoca?.()!=='2026'){if(S.origem)limpa();return;}const p=centro(J);if(!p||Math.hypot(p[0]-J.x,p[1]-J.z)>180*U){if(S.origem)limpa();return;}if(!S.origem||p!==S.origem){limpa();cria(p);}R.inicia();S.pessoas.forEach((b,i)=>{const a=S.t*.12+i,x=b.home[0]+Math.sin(a)*U,z=b.home[1]+Math.cos(a)*U;b.x=x;b.z=z;b.y=M.cen.chao(x,z);const d=Math.hypot(x-J.x,z-J.z);b.yaw=d<5*U?Math.atan2(J.x-x,J.z-z):a+Math.PI/2;const po=b.pose;po.legL=Math.sin(S.t*2+i)*.18;po.legR=-po.legL;po.armL=-po.legL*.5;po.armR=-po.legR*.5;R.escreve(b,true);S.hotspots[i].x=x;S.hotspots[i].z=z;});R.fim();}
 return{g,S,tick,desliga:limpa};
}
