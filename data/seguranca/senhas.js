/* ============================================================================================================
   SENHAS DO JOGO (portões e personagens): SÓ HASH, nunca a senha.
   Cada entrada guarda { salt, hash }: hash = SHA-256 em hexadecimal de  salt + ":" + senha  (com um salt próprio, aleatório, por entrada).
   Como cadastrar uma senha SEM escrevê-la em lugar nenhum:
     1) abra tools/gerar-hash.html no seu computador (arquivo local, não envia nada para a internet) ou rode  node tools/gerar_hash.mjs <id>  (a senha é digitada no terminal e não aparece);
     2) cole a linha gerada abaixo, no id certo. Entrada ausente ou vazia = "em breve" (ninguém consegue abrir).
   ATENÇÃO: por ser um site estático, o hash vai junto com o jogo. Isto é uma proteção do JOGO (impede o acesso casual) e NÃO substitui autenticação de servidor.
   ============================================================================================================ */
export const SENHAS = {
  /* "vila-santana": { salt: "…", hash: "…" },       portão da Vila Santana (anos 50) */
  /* "operador-1": { salt: "…", hash: "…" },         personagens dos operadores 1 a 8 (cada um com a sua senha) */
};

/* tentativas: depois de cada erro além do limite o jogador espera mais (segundos), por entrada. 3 erros = 30 s. */
export const SENHA_CFG = { erros: 3, esperaSeg: [30, 60, 120, 300, 900], guardaChave: "canyonfly:senha:" };
