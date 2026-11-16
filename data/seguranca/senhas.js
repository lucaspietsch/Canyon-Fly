/* ============================================================================================================
   LOGINS E SENHAS DO JOGO (operadores e portão da Vila Santana): SÓ HASH, nunca a senha.
   Método: PBKDF2 (Web Crypto) com SHA-256, salt próprio por entrada e `iter` iterações (mínimo 100.000). Resistente a força bruta
   muito além de um SHA-256 simples. hash = hex de PBKDF2(senha, salt, iter, 256 bits).
   Como cadastrar SEM escrever a senha em lugar nenhum:
     1) abra tools/gerar-hash.html no seu computador (arquivo local, não envia nada) ou rode  node tools/gerar_hash.mjs <id> <login>  (a senha é digitada no terminal e não aparece);
     2) cole a linha gerada no lugar certo abaixo. Entrada ausente = "em breve" (ninguém consegue entrar).
   ATENÇÃO: por ser um site estático, salt e hash vão junto com o jogo. Isto é uma proteção do JOGO (impede o acesso casual)
   e NÃO substitui autenticação de servidor.
   ============================================================================================================ */

/* OPERADORES: a chave é o id do personagem (dados/personagens.js). `login` é o nome de login que a pessoa digita.
   Formato:  pit: { login: "…", salt: "…", iter: 100000, hash: "…" },   */
export const OPERADORES = {
  pit: { login: "pit", salt: "", iter: 100000, hash: "" }, // Cole aqui o salt e hash gerados para o Pit.
  krig: { login: "krig", salt: "", iter: 100000, hash: "" }, // Cole o salt e o hash próprios do coordenador.
  carlao: { login: "carlao", salt: "", iter: 100000, hash: "" }, // Cole salt e hash próprios do Carlão.
  jackao: { login: "jackao", salt: "", iter: 100000, hash: "" }, // Cole o salt e o hash próprios do Jackão.
  diully: { login: "diully", salt: "", iter: 100000, hash: "" }, // Cole salt e hash próprios da Diully.
  mary: { login: "mary", salt: "", iter: 100000, hash: "" }, // Cole o salt e o hash próprios da Mary.
  mohr: { login: "mohr", salt: "", iter: 100000, hash: "" }, // Cole o salt e o hash próprios do Mohr.
  kauling: { login: "kauling", salt: "", iter: 100000, hash: "" }, // Cole salt e hash próprios do Kauling.
};

/* LOGIN DE TESTE (pedido pelo Lucas): só vale em MODO DEBUG — página aberta em localhost/127.0.0.1 ou com ?debug na URL.
   Entra como o operador `como` sem precisar das senhas reais. Login: "teste"; a senha é a combinada (também só hash aqui). */
export const LOGIN_TESTE = { login: "teste", como: "pit", salt: "acdf93170b10a7588ad32181408b6db1", iter: 100000, hash: "f3e44fa5ffbbf03a5ab925e2bb764e8a3a538a9df44e28ebe3ff78b62b5921a1" };

/* PORTÕES com senha única (sem login): portão da Vila Santana. Mesmo método PBKDF2. */
export const SENHAS = {
  /* "vila-santana": { salt: "…", iter: 100000, hash: "…" }, */
};

/* tentativas: depois de `erros` erros seguidos o jogador espera (segundos), crescente a cada novo erro. 3 erros = 30 s. */
export const SENHA_CFG = { erros: 3, esperaSeg: [30, 60, 120, 300, 900], guardaChave: "canyonfly:senha:", sessaoChave: "canyonfly:operador", iterMin: 100000 };
