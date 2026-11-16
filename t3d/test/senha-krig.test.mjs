import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERADORES, LOGIN_TESTE } from '../../data/seguranca/senhas.js';
import { hashSenha, confereLogin, temLogin } from '../src/mundo/seguranca/senha.js';
const dados=new Map();globalThis.localStorage={getItem:k=>dados.get(k),setItem:(k,v)=>dados.set(k,v)};
test('Krig: hash próprio PBKDF2 e login de teste exclusivo do debug',async()=>{
 globalThis.location={hostname:'jogo.example',search:''};assert.equal(OPERADORES.krig.login,'krig');assert.equal(temLogin('krig'),false);
 const original={...LOGIN_TESTE},entrada={...OPERADORES.krig},senha='credencial efemera do teste';
 try{LOGIN_TESTE.hash=await hashSenha(senha,LOGIN_TESTE.salt,100000);
 assert.equal((await confereLogin('teste.krig',senha)).ok,false);dados.clear();location.hostname='localhost';
 assert.equal((await confereLogin('teste.krig',senha)).id,'krig');location.hostname='jogo.example';
 Object.assign(OPERADORES.krig,{salt:'salt-exclusivo-krig',iter:100000,hash:await hashSenha(senha,'salt-exclusivo-krig',100000)});
 assert.equal((await confereLogin('krig',senha)).id,'krig');assert.equal((await confereLogin('pit',senha)).ok,false);
 }finally{Object.assign(LOGIN_TESTE,original);Object.assign(OPERADORES.krig,entrada);dados.clear();}
});
