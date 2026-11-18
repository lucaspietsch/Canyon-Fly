import test from 'node:test';
import assert from 'node:assert/strict';
import {Group} from 'three';
import {criarLobisomem} from '../src/mundo/lenda/lobisomem.js';
import {U} from '../src/mundo/config.js';
function setup(){const J={x:0,z:2*U},alvos=[],eventos=[],M={cen:{grupo:new Group(),chao:()=>0},personagens:{ativo:'tupa'},poderes:{registra:a=>{alvos.push(a);return a;},remove:a=>alvos.splice(alvos.indexOf(a),1)},ctx:{teleporta(x,z){J.x=x;J.z=z;},mostraAviso(){}},missoes:{emite:(tipo,d)=>eventos.push({tipo,...d})}};const L=criarLobisomem(M,()=>({x:0,z:0}));L.coloca(0,0);return{M,J,L,alvos,eventos};}
test('lobisomem: duas garras alternadas, pausa entre combos e recuo real do alvo',()=>{const{L,J,eventos}=setup();assert.ok(L.provoca());for(let i=0;i<42;i++)L.tick(.02,J);assert.equal(L.S.golpes,2);assert.deepEqual(L.S.lados,[0,1]);assert.deepEqual(eventos.map(e=>e.lado),['esquerda','direita']);assert.ok(J.z>2*U);assert.ok(L.S.recarga>0);L.tick(.1,J);assert.equal(L.S.golpes,2);assert.equal(L.visual.arms.length,2);L.dispose();});
test('lobisomem: não atinge fora do alcance, não persegue fora da clareira e ignora outros personagens',()=>{const{M,L,J,alvos}=setup();L.provoca();L.tick(.02,J);J.z=20*U;for(let i=0;i<40;i++)L.tick(.02,J);assert.equal(L.S.golpes,0);J.z=40*U;L.tick(.02,J);assert.equal(L.S.estado,'guarda');M.personagens.ativo='atiara';assert.equal(L.provoca(),false);L.dispose();assert.equal(alvos.length,0);});
