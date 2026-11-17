import { Group, PerspectiveCamera } from 'three';
import { criarPoderes } from '../../src/mundo/poderes/poderes.js';
import { PERSONAGENS } from '../../src/mundo/dados/personagens.js';
import { PODERES } from '../../../data/poderes.js';
import { U } from '../../src/mundo/config.js';
const J={x:0,y:0,z:0,yaw:0},av=new Group(),tronco=new Group(),mao=new Group();av.scale.setScalar(.92);av.add(tronco);tronco.position.y=2.2;
const A={av,tronco,bD:{mao}},canvas=document.createElement('canvas'),ui=document.createElement('div');document.body.append(ui);
const M={cam:new PerspectiveCamera(38,1,.1,1000),renderer:{domElement:canvas},ui,cen:{grupo:new Group(),chao:()=>0,relevo:x=>x*.2,colisores:[]},fauna:{animais:[]},kml:{S:{poligonos:[]}},lugares:{S:{vivos:new Map()}},zonas:{atual:'teste',aoMudar:()=>{},profAgua:()=>0},H:{},andando:()=>true,jogador:()=>J,depurando:()=>false,terminal:{msg:()=>{}},missoes:{emite:()=>{}},ctx:{avatar:()=>A,mostraAviso:t=>{M.aviso=t},teleporta:(x,z)=>{J.x=x;J.z=z}},personagens:{ativo:'tupa',S:{tela:null},def:id=>PERSONAGENS.find(p=>p.id===id),rig:()=>({p:A,fx:{pulsa:()=>{}}})},transformacao:{S:{id:'tupa',velMultExtra:1},on:true,ativa:()=>M.transformacao.on}};
const P=criarPoderes(M);M.poderes=P;
function activate(id,on=true){if(M.personagens.ativo)P.aoTransformar(M.personagens.ativo,false);M.personagens.ativo=id;M.transformacao.S.id=id;M.transformacao.on=on;if(on)P.aoTransformar(id,true);}
function target(id,x,z,tipo='inimigo',statico=false){const g=new Group();g.position.set(x*U,0,z*U);M.cen.grupo.add(g);const a={id,nome:id,tipo,g:statico?null:g,hp:100,raioM:.45,alturaM:1.4,encantado:0,congelado:0,pos:()=>g.position,dano(n){if(!Number.isFinite(n))throw Error('Invalid damage');this.hp-=n;},aoRaio(d){this.dano(d.danoInimigo*3)},aoFlecha(d){this.dano(d.danoInimigo)},aoOlhos(d){this.encantado=d.duracaoS}};P.registra(a);return a;}
function step(t,dt=.05){for(let left=t;left>1e-8;left-=dt)P.tick(Math.min(dt,left),J);}
window.test={M,P,J,A,U,D:PODERES,activate,target,step};window.ready=true;
