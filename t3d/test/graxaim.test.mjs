import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3} from 'three';
import {criarQuadrupede,SPEC} from '../src/mundo/fauna/modelos.js';
test('graxaim: rig próprio em ambas as variantes, geometria finita e pés apoiados',()=>{for(const id of ['graxaimCinza','graxaimRuivo']){const r=criarQuadrupede(SPEC[id]);assert.equal(r.root.userData.especie,'Lycalopex gymnocercus');assert.equal(r.pernas.length,4);assert.equal(r.cauda.length,3);assert.equal(r.orelhas.length,2);r.root.updateMatrixWorld(true);const box=new Box3().setFromObject(r.root);assert.ok(box.min.y>=-.001);r.root.traverse(o=>{if(o.geometry){for(const attr of ['position','normal'])if(o.geometry.attributes[attr])assert.ok(o.geometry.attributes[attr].array.every(Number.isFinite));}});r.dispose();}});
test('graxaim: materiais isolados e outros animais preservados',()=>{const a=criarQuadrupede(SPEC.graxaimCinza),b=criarQuadrupede(SPEC.graxaimCinza),l=criarQuadrupede(SPEC.lobo);assert.equal(l.root.userData.visual,undefined);const cor=b.materiais[0].color.getHex();a.materiais[0].color.setHex(0xff0000);assert.equal(b.materiais[0].color.getHex(),cor);a.dispose();b.dispose();});
