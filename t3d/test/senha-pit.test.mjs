import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { OPERADORES, LOGIN_TESTE } from '../../data/seguranca/senhas.js';
import { hashSenha, confereLogin, modoDebug, temLogin } from '../src/mundo/seguranca/senha.js';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('Pit: placeholder bloqueia produção; PBKDF2 próprio e teste restrito ao debug',async()=>{
  globalThis.location={hostname:'jogo.example',search:''};
  assert.equal(modoDebug(),false);assert.equal(temLogin('pit'),false);
  assert.equal((await confereLogin('pit','qualquer')).ok,false);
  const original={...LOGIN_TESTE},pit={...OPERADORES.pit};
  try{
    const pass='credencial temporaria do teste';
    LOGIN_TESTE.hash=await hashSenha(pass,LOGIN_TESTE.salt,LOGIN_TESTE.iter);
    assert.equal((await confereLogin('teste.pit',pass)).ok,false);
    data.clear();location.hostname='localhost';assert.equal(temLogin('pit'),true);
    assert.equal((await confereLogin('teste.pit',pass)).id,'pit');
    assert.equal((await confereLogin('teste',pass)).id,'pit');
    assert.equal((await confereLogin('teste.inexistente',pass)).ok,false);
    data.clear();location.hostname='jogo.example';
    Object.assign(OPERADORES.pit,{salt:'salt-exclusivo-do-pit',hash:await hashSenha(pass,'salt-exclusivo-do-pit',100000)});
    assert.equal((await confereLogin('pit',pass)).id,'pit');
    assert.notEqual(OPERADORES.pit.hash,await hashSenha(pass,'outro-salt',100000));
  }finally{Object.assign(LOGIN_TESTE,original);Object.assign(OPERADORES.pit,pit);data.clear();}
});
