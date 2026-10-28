#!/usr/bin/env node
/* Gera a linha de data/seguranca/senhas.js (PBKDF2-SHA-256, 100.000 iterações) para UM login ou portão, sem escrever a senha em lugar nenhum.
   Uso:  node tools/gerar_hash.mjs krig krig.silva       → operador (id do personagem + nome de login)
         node tools/gerar_hash.mjs vila-santana           → portão (só senha)
   A senha é pedida no terminal e não aparece na tela nem fica no histórico. */
import { webcrypto, randomBytes } from "node:crypto";
import readline from "node:readline";
const [id, login] = process.argv.slice(2); if(!id){ console.error("Uso: node tools/gerar_hash.mjs <id> [login]   (ex.: krig krig.silva · vila-santana)"); process.exit(1); }
const ITER = 100000;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => { if(s.includes("\n")) process.stdout.write("\n"); };      // não ecoa o que é digitado
process.stdout.write("Senha para '" + (login ? login + " (" + id + ")" : id) + "': ");
rl.question("", async (senha) => {
  rl.close(); if(!senha){ console.error("Senha vazia."); process.exit(1); }
  const salt = randomBytes(16).toString("hex"), enc = new TextEncoder();
  const k = await webcrypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const h = Buffer.from(await webcrypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITER }, k, 256)).toString("hex");
  if(login){ console.log("\nCole em data/seguranca/senhas.js, dentro de OPERADORES:\n"); console.log("  " + id + ': { login: "' + login + '", salt: "' + salt + '", iter: ' + ITER + ', hash: "' + h + '" },'); }
  else { console.log("\nCole em data/seguranca/senhas.js, dentro de SENHAS:\n"); console.log('  "' + id + '": { salt: "' + salt + '", iter: ' + ITER + ', hash: "' + h + '" },'); }
});
