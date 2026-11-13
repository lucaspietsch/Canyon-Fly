import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, MeshStandardMaterial } from 'three';
import { criarRosto, geometriaCabeca } from '../src/mundo/personagens/rosto.js';

test('cabeça e barba têm superfícies finitas e normais voltadas para fora', () => {
  for(const feminina of [false, true]) for(const limite of [Infinity, -.25]){
    const g = geometriaCabeca(feminina, limite);
    const p = g.attributes.position, n = g.attributes.normal;
    assert.ok(g.index.count > 0);
    for(let i = 0; i < p.count; i++){
      for(const attr of [p,n]) for(const value of [attr.getX(i),attr.getY(i),attr.getZ(i)]) assert.ok(Number.isFinite(value));
      if(p.getZ(i) > .4 && Math.abs(p.getX(i)) < .05) assert.ok(n.getZ(i) > .5, 'a frente do rosto deve receber luz externa');
      assert.ok(p.getY(i) <= limite + 1e-6);
    }
    g.dispose();
  }
});

test('pele respeita o tom de cada personagem sem alterar os materiais compartilhados', () => {
  for(const cor of [0x8a5a3c, 0xf0c9b2, 0xe9bfa4]){
    const pele = new MeshStandardMaterial({color:cor,roughness:.55,metalness:.25});
    const cabelo = new MeshStandardMaterial({color:0x201208});
    const cab = new Group(), r = criarRosto(cab,{pele,cabelo,feminina:true});
    assert.equal(r.pele.color.getHex(),cor);
    assert.equal(r.pele.metalness,0);
    assert.equal(pele.metalness,.25);
    assert.equal(pele.roughness,.55);
    assert.equal(r.olhos.length,2);
    assert.ok(r.olhos.every(o=>o.isGroup && o.parent===cab));
    assert.ok(cab.children.includes(r.cabeca));
  }
});
