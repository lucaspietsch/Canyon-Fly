import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERADORES, LOGIN_TESTE } from '../../data/seguranca/senhas.js';
import { hashSenha, confereLogin, temLogin } from '../src/mundo/seguranca/senha.js';
const dados=new Map();globalThis.localStorage={getItem:k=>dados.get(k),setItem:(k,v)=>dados.set(k,v)};
test('Diully: hash próprio PBKDF2 e login de teste exclusivo do debug',async()=>{
 globalThis.location={hostname:'jogo.example',search:''};assert.equal(OPERADORES.diully.login,'diully');assert.equal(temLogin('diully'),false);
 const original={...LOGIN_TESTE},entrada={...OPERADORES.diully},senha='credencial efemera do teste';
 try{LOGIN_TESTE.hash=await hashSenha(senha,LOGIN_TESTE.salt,100000);
 assert.equal((await confereLogin('teste.diully',senha)).ok,false);dados.clear();location.hostname='localhost';
 assert.equal((await confereLogin('teste.diully',senha)).id,'diully');location.hostname='jogo.example';
 Object.assign(OPERADORES.diully,{salt:'salt-exclusivo-diully',iter:100000,hash:await hashSenha(senha,'salt-exclusivo-diully',100000)});
 assert.equal((await confereLogin('diully',senha)).id,'diully');assert.equal((await confereLogin('pit',senha)).ok,false);
 }finally{Object.assign(LOGIN_TESTE,original);Object.assign(OPERADORES.diully,entrada);dados.clear();}
});
