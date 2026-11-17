# Publicar o jogo no GitHub Pages (grátis)

Endereço do jogo: **https://lucaspietsch.github.io/Canyon-Fly/**

## Ligar (uma vez só, ~1 minuto)
1. Abra o repositório no GitHub: **github.com/lucaspietsch/Canyon-Fly**
2. Clique em **Settings** (engrenagem, no alto) → no menu da esquerda, **Pages**.
3. Em **Build and deployment → Source**, escolha **GitHub Actions**. (Não precisa escolher branch nem pasta.)
4. Pronto. A partir daí, **cada vez que o `main` for atualizado** o jogo é publicado sozinho em 1–2 minutos.

## Publicar na hora (sem mudar nada)
- Aba **Actions** → **Publicar no GitHub Pages** → botão **Run workflow** → **Run workflow**.
- Quando ficar com o ✔ verde, o jogo está no ar no endereço acima.

## O que vai para o site
Só o que o jogo usa: `index.html`, `manifest.webmanifest`, `icones/`, `data/`, `jogo/` e `t3d/dist/` (o jogo compilado). Código-fonte, documentos e ferramentas não vão.

## Netlify
Continua desligado. Quando quiser publicar lá também, peça "zip para o Netlify" e é só arrastar o arquivo na área de deploy (deploy manual não usa build).
