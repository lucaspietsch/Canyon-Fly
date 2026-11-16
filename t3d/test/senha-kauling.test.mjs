import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERADORES, LOGIN_TESTE } from '../../data/seguranca/senhas.js';
import { hashSenha, confereLogin, temLogin } from '../src/mundo/seguranca/senha.js';
const dados=new Map();globalThis.localStorage={getItem:k=>dados.get(k),setItem:(k,v)=>dados.set(k,v)};
test('Kauling: hash próprio PBKDF2 e login de teste exclusivo do debug',async()=>{
 globalThis.location={hostname:'jogo.example',search:''};assert.equal(OPERADORES.kauling.login,'kauling');assert.equal(temLogin('kauling'),false);
 const original={...LOGIN_TESTE},entrada={...OPERADORES.kauling},senha='credencial efemera do teste';
 try{LOGIN_TESTE.hash=await hashSenha(senha,LOGIN_TESTE.salt,100000);
 assert.equal((await confereLogin('teste.kauling',senha)).ok,false);dados.clear();location.hostname='localhost';
 assert.equal((await confereLogin('teste.kauling',senha)).id,'kauling');location.hostname='jogo.example';
 Object.assign(OPERADORES.kauling,{salt:'salt-exclusivo-kauling',iter:100000,hash:await hashSenha(senha,'salt-exclusivo-kauling',100000)});
 assert.equal((await confereLogin('kauling',senha)).id,'kauling');assert.equal((await confereLogin('pit',senha)).ok,false);
 }finally{Object.assign(LOGIN_TESTE,original);Object.assign(OPERADORES.kauling,entrada);dados.clear();}
});
