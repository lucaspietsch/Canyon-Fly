import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERADORES, LOGIN_TESTE } from '../../data/seguranca/senhas.js';
import { hashSenha, confereLogin, temLogin } from '../src/mundo/seguranca/senha.js';
const dados=new Map();globalThis.localStorage={getItem:k=>dados.get(k),setItem:(k,v)=>dados.set(k,v)};
test('Mohr: hash próprio PBKDF2 e login de teste exclusivo do debug',async()=>{
 globalThis.location={hostname:'jogo.example',search:''};assert.equal(OPERADORES.mohr.login,'mohr');assert.equal(temLogin('mohr'),false);
 const original={...LOGIN_TESTE},entrada={...OPERADORES.mohr},senha='credencial efemera do teste';
 try{LOGIN_TESTE.hash=await hashSenha(senha,LOGIN_TESTE.salt,100000);
 assert.equal((await confereLogin('teste.mohr',senha)).ok,false);dados.clear();location.hostname='localhost';
 assert.equal((await confereLogin('teste.mohr',senha)).id,'mohr');location.hostname='jogo.example';
 Object.assign(OPERADORES.mohr,{salt:'salt-exclusivo-mohr',iter:100000,hash:await hashSenha(senha,'salt-exclusivo-mohr',100000)});
 assert.equal((await confereLogin('mohr',senha)).id,'mohr');assert.equal((await confereLogin('pit',senha)).ok,false);
 }finally{Object.assign(LOGIN_TESTE,original);Object.assign(OPERADORES.mohr,entrada);dados.clear();}
});
