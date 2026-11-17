import test from 'node:test';
import assert from 'node:assert/strict';
import { alvosEmCone, encadeia, impactoSegmento } from '../src/mundo/poderes/combate.js';
const alvo=(id,x,z,tipo='inimigo')=>({id,tipo,pos:()=>({x,y:0,z})});
test('raios e choque encadeiam sem repetir alvos, respeitando distância e tipos',()=>{
 const a=alvo('a',0,5),b=alvo('b',3,5),c=alvo('c',6,5),p=alvo('civil',1,5,'pessoa'),m={...alvo('morto',2,5),morto:true},longe=alvo('longe',30,5);
 assert.deepEqual(encadeia([a,b,c,p,m,longe],a,4,4).map(x=>x.id),['a','b','c']);
 assert.deepEqual(encadeia([a,b,c],a,4,2).map(x=>x.id),['a','b']);
 assert.deepEqual(encadeia([],null,4,3),[]);
});
test('mira respeita cone, alcance, mortos e alvos sobrepostos sem gerar NaN',()=>{
 const a=alvo('frente',0,5),b=alvo('lado',5,0),c=alvo('costas',0,-2),d=alvo('longe',0,15),e=alvo('sobreposto',0,0);
 assert.deepEqual(alvosEmCone([a,b,c,d,e],{x:0,z:0,yaw:0},10,20).map(x=>x.id),['sobreposto','frente']);
});
test('flecha veloz acerta o primeiro ponto da colisão entre quadros',()=>{
 const t=impactoSegmento({x:0,y:2,z:0},{x:0,y:2,z:100},{x:0,z:40},2,0,5);
 assert.ok(Math.abs(t-.38)<1e-8);
 assert.equal(impactoSegmento({x:0,y:8,z:0},{x:0,y:8,z:100},{x:0,z:40},2,0,5),null);
 assert.equal(impactoSegmento({x:10,y:2,z:0},{x:10,y:2,z:100},{x:0,z:40},2,0,5),null);
 assert.equal(impactoSegmento({x:0,y:10,z:40},{x:0,y:-10,z:40},{x:0,z:40},2,0,5),.25);
 assert.equal(impactoSegmento({x:0,y:2,z:40},{x:0,y:2,z:40},{x:0,z:40},2,0,5),0);
});
