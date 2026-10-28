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
  /* pit:     { login: "", salt: "", iter: 100000, hash: "" }, */
  /* krig:    { login: "", salt: "", iter: 100000, hash: "" }, */
  /* carlao:  { login: "", salt: "", iter: 100000, hash: "" }, */
  /* jackao:  { login: "", salt: "", iter: 100000, hash: "" }, */
  /* diully:  { login: "", salt: "", iter: 100000, hash: "" }, */
  /* mary:    { login: "", salt: "", iter: 100000, hash: "" }, */
  /* mohr:    { login: "", salt: "", iter: 100000, hash: "" }, */
  /* kauling: { login: "", salt: "", iter: 100000, hash: "" }, */
};

/* LOGIN DE TESTE (pedido pelo Lucas): só vale em MODO DEBUG — página aberta em localhost/127.0.0.1 ou com ?debug na URL.
   Entra como o operador `como` sem precisar das senhas reais. Login: "teste"; a senha é a combinada (também só hash aqui). */
export const LOGIN_TESTE = { login: "teste", como: "krig", salt: "acdf93170b10a7588ad32181408b6db1", iter: 100000, hash: "f3e44fa5ffbbf03a5ab925e2bb764e8a3a538a9df44e28ebe3ff78b62b5921a1" };

/* PORTÕES com senha única (sem login): portão da Vila Santana. Mesmo método PBKDF2. */
export const SENHAS = {
  /* "vila-santana": { salt: "…", iter: 100000, hash: "…" }, */
};

/* tentativas: depois de `erros` erros seguidos o jogador espera (segundos), crescente a cada novo erro. 3 erros = 30 s. */
export const SENHA_CFG = { erros: 3, esperaSeg: [30, 60, 120, 300, 900], guardaChave: "canyonfly:senha:", sessaoChave: "canyonfly:operador", iterMin: 100000 };
