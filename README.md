# CanyonFly

Jogo 3D de mundo aberto da **Serra Geral Vertical** (Cânion Fortaleza e Cambará do Sul), feito em Three.js.
Você joga como o Líder de Operações (e, depois, outros personagens), com missões, fauna, clima, fenômenos do céu, lendas da mata e poderes.

> A versão enxuta (checklist do Trolley, "Operar Tirolesa" e missões no Cânion Fortaleza) vive no sistema **Gestão de Operações** (repositório `gest-otirolesa`). Este repositório é o **jogo completo**.

## Como rodar
```bash
cd t3d
npm install
npm run build          # gera t3d/dist/trolley3d.min.js (já vem um build pronto)
cd ..
npx serve .            # ou Live Server do VS Code, abrindo index.html
```
Abra `index.html` por um servidor (não direto do arquivo): o jogo lê `data/kml/*.kml` e `data/terrain/*`.

## Estrutura
- `t3d/src/` — código do jogo (módulos em `t3d/src/mundo/**`: personagens, poderes, missões, fauna, lugares, lendas, portal…)
- `data/missoes/` — missões e falas orientadas a dados · `data/poderes.js` — poderes dos personagens · `data/seguranca/` — senhas (só hash)
- `data/kml/` — mapa real do parque (KML) · `data/terrain/` — elevação (rode `python3 tools/baixar_elevacao.py` para gerar)
- `tools/` — geração de dados (KML → mundo, elevação, hash de senha)
- `jogo/` — página do jogo "Operar Tirolesa"
- `docs/` — `LUGARES.md` (KML, lugares, estrada) e `PERSONAGENS-PODERES-LENDAS.md` (personagens, poderes, missões de Tupã, portal violeta, passado de 1950)

## Teclas principais
Mover: WASD/setas · correr: Shift · interagir: E · missões: J · mapa: M · poder do personagem: V · personagens: botão 👤 · F3: painel de depuração.
Depuração completa (horas, fauna, lugares, Anhangá, treino de poderes…): veja `docs/`.

## Segurança
Os 8 operadores (Pit, Krig, Carlão, Jackão, Diully, Mary, Mohr, Kauling) entram com **login + senha**; o portão da Vila Santana tem senha única. O jogo guarda **somente salt + hash PBKDF2 (SHA-256, 100.000 iterações)** em `data/seguranca/senhas.js` — nunca a senha. Gere as linhas com `tools/gerar-hash.html` (local) ou `node tools/gerar_hash.mjs <id> <login>`. Erro de login mostra sempre "Login ou senha incorretos"; 3 erros = 30 s de espera, crescente. A sessão do operador vale até fechar a aba (botão **Sair** na tela 👤). Em modo debug (localhost ou `?debug`) existe o login de teste `teste`. Operador logado entra na Vila Santana, na Olaria e na área industrial (viagem rápida liberada) e **se transforma sozinho** ao cruzar o pórtico (roupa de poder; volta ao uniforme ao sair). Por ser site estático, isso protege o jogo, não substitui autenticação de servidor.
