#!/usr/bin/env node
/* Gera a linha de data/seguranca/senhas.js para UMA senha, sem escrevê-la em lugar nenhum.
   Uso:  node tools/gerar_hash.mjs operador-1        (a senha é pedida no terminal e não aparece na tela nem fica no histórico) */
import { webcrypto, randomBytes } from "node:crypto";
import readline from "node:readline";
const id = process.argv[2]; if(!id){ console.error("Uso: node tools/gerar_hash.mjs <id>   (ex.: vila-santana, operador-1)"); process.exit(1); }
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => { if(s.includes("\n")) process.stdout.write("\n"); };      // não ecoa o que é digitado
process.stdout.write("Senha para '" + id + "': ");
rl.question("", async (senha) => {
  rl.close(); if(!senha){ console.error("Senha vazia."); process.exit(1); }
  const salt = randomBytes(16).toString("hex"), d = new TextEncoder().encode(salt + ":" + senha), h = Buffer.from(await webcrypto.subtle.digest("SHA-256", d)).toString("hex");
  console.log("\nCole em data/seguranca/senhas.js, dentro de SENHAS:\n");
  console.log('  "' + id + '": { salt: "' + salt + '", hash: "' + h + '" },');
});
