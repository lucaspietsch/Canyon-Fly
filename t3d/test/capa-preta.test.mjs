import test from 'node:test';
import assert from 'node:assert/strict';
import {capaPretaAparece} from '../src/mundo/lenda/capa-preta.js';
import {U} from '../src/mundo/config.js';
test('Capa Preta: assombração próxima da fábrica à noite em 1950',()=>{assert.ok(capaPretaAparece('1950',22,10*U));assert.ok(capaPretaAparece('1950',0,90*U));assert.equal(capaPretaAparece('1950',12,10),false);assert.equal(capaPretaAparece('1950',5,10),false);assert.equal(capaPretaAparece('1950',22,100*U),false);for(const epoca of ['2026','2071','1689-1700'])assert.equal(capaPretaAparece(epoca,22,10),false);assert.equal(capaPretaAparece('1950',22,NaN),false);});
