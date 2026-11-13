import test from 'node:test';
import assert from 'node:assert/strict';
import { criarGeometriasPessoas } from '../src/mundo/gente/geometrias.js';

const geos = criarGeometriasPessoas();

test('NPCs têm contornos suaves e normais externas no tronco e nos membros', () => {
  for(const tipo of ['tronco','colete','perna','canela','braco','antebraco']){
    const g=geos[tipo],p=g.attributes.position,n=g.attributes.normal;
    assert.notEqual(g.type,'BoxGeometry');
    let frontais=0;
    for(let i=0;i<p.count;i++){
      assert.ok([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite));
      if(p.getZ(i)>.1 && Math.abs(p.getX(i))<.001){assert.ok(n.getZ(i)>0,'normal frontal de '+tipo);frontais++;}
    }
    assert.ok(frontais>5);
  }
});

test('botas apoiam no chão com as novas articulações e o rosto preserva suas cores', () => {
  geos.bota.computeBoundingBox();
  assert.ok(Math.abs(2.35-1.14+geos.bota.boundingBox.min.y)<.001);
  const rosto=geos.rosto;
  assert.equal(rosto.attributes.color.count,rosto.attributes.position.count);
  assert.ok([...rosto.attributes.color.array].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  geos.cabeca.computeBoundingBox();
  assert.ok(geos.cabeca.boundingBox.max.y-geos.cabeca.boundingBox.min.y<1.1);
});
