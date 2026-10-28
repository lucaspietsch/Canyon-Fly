# Lugares do mundo lidos do KML

Tudo aqui vem de `data/kml/parque.kml` (cópia embutida em `t3d/src/mundo/dados/kml-vegetacao.js`; regenerar com `python3 build/kml_embutido.py`).

## Regras do leitor de KML (`t3d/src/mundo/config.js` → `KML.tipos` / `KML.geom`, `resgate/kml.js` → `classifica`)

1. **A geometria vem primeiro.** Cada tipo só vale para certas geometrias (`KML.geom`): `estrada`/`rua` só linhas, `mata`/`banhado`/`cidade`/`praca`/`vila`… só polígonos, `ponte` linha ou polígono, `nascente` polígono ou ponto.
2. **Depois o nome**, normalizado (minúsculas, sem acento, letras repetidas viram uma: `mataaaa` = `mata`, `aarea` = `area`, `praça` = `praca`). A 1ª regra que casar vence — ordem de prioridade:

   `sequoia → urna → praça → cambará s/a (fábrica) → vila → olaria → parque industrial → ponte → turfeira/banhado → mata baixa → mata → rua → estrada → cidade → nascente → rio/arroio → lago → campo`

   Por isso `cambara s/a` e `fabrica` ganham de `cambara` (que é a cidade), `área praça da cidade` é praça (não cidade) e `AREA A ANTIGA FLORESTA DA OLARIA` é Olaria (não mata).
3. **A classificação de cada marca sai no console** (`KML: classificação de N marcas …`): geometria, tipo e a regra que casou. Marcas sem regra viram `outro` (só aparecem no F3, tecla `;`).
4. Vários KML: marcas de mesmo nome e tipo substituem as antigas; as novas são acrescentadas.

## Lugares (módulo `t3d/src/mundo/lugares/`)

Cada lugar só é construído quando o jogador chega perto (`LUGARES.cargaU` em `config.js`) e é descartado ao se afastar. A zona urbana/industrial anda junto com a cidade (deslocamento `T` de `zonas.js`).

| Lugar | KML | O que existe |
|---|---|---|
| Praça central | polígono `área praça da cidade` | gramado, calçada, caminhos até os 4 cantos e os 4 lados, piso em volta da Sequoia, bancos, postes (acesos de noite), árvores, 2–10 pessoas passeando (conforme a hora), ruas provisórias nos 4 lados, ponto de carona (viagem rápida) na borda mais perto da estrada |
| Sequoia Lunar | polígono `sequoia lunar` | árvore cônica alta (38 m) de casca avermelhada, canteiro com pedras e arbustos, placa; raio ao entrar na praça (ou Numpad7) |
| Urna do Tempo | polígono `urna do tempo` | pedestal, urna de bronze com brilho; `[E]` abre (tampa sobe, pó dourado, feixe de luz) e mostra a escolha de personagem; a 1ª abertura libera Sepé Tiarajú; o raio libera Tupã |
| Cambará S/A | polígono `cambara s/a` | muro com portão e letreiro voltados para a Vila Ouro Verde, guarita, escritório, galpões, tanques, pátio de toras, caldeira + chaminé com fumaça, postes, ruído de máquinas |
| Vila Ouro Verde | polígono `vila ouro verde` | ruas em U abertas para a fábrica, ~100–200 casas, armazém, capela, escola, campo de futebol, placa de entrada, postes |

| Vila Santana (1950) | polígono `vila santana` | pórtico de pedra no ponto onde a estrada entra no polígono, portão de duas folhas trancado, área fechada a pé enquanto trancada, passagem de época (tom sépia, `M.lugares.epoca()` = `"1950"` dentro, `"2026"` fora) |

**Senha do portão da Vila Santana** (e dos operadores): só o hash SHA-256 com salt fica no jogo (`data/seguranca/senhas.js`, id `vila-santana`). Gere a linha com `tools/gerar-hash.html` (abra no seu computador) ou `node tools/gerar_hash.mjs vila-santana` e cole no arquivo. Sem hash cadastrado o portão mostra "em breve". 3 erros = 30 s de espera, crescente. Por ser um site estático, isto protege o JOGO e não substitui segurança de servidor.

Constantes ajustáveis: `LUGARES` em `config.js` (calçada, caminhos, bancos, NPCs por hora, altura da Sequoia, espera/intervalo/repetição do raio, duração da abertura da Urna, muro/portão/chaminé da fábrica, casas da vila).

## Teclas de depuração (com F3 aberto)

`Numpad1` Sequoia · `Numpad2` Urna · `Numpad3` praça · `Numpad4` fábrica · `Numpad5` Vila Ouro Verde · `Numpad6` pórtico da Vila Santana · `Numpad7` raio na Sequoia · `Numpad8` abrir a Urna · `Numpad9` ou `;` contornos dos polígonos.
Sem teclado numérico: `Shift+1…5`, `Shift+7`, `Shift+8`.

## Estrada completa e blocos urbanos (branch `kml-parque-real`)

- `data/kml/parque-detalhes.kml` (trilhas, bordas, rios, lançamento, recebimento, estacionamento, estradas) soma-se a `parque.kml`; marcas de mesmo tipo e nome do arquivo de detalhes substituem as do outro.
- `python3 tools/gera_parque_real.py` regera `t3d/src/mundo/dados/parque-real.js` (trilhas, borda, rios/arroios em coordenadas do jogo) a partir de `parque-detalhes.kml`; `cenario.js` usa esses dados.
- A estrada é uma **cadeia** (`kml.cadeiaEstrada()`): "parte da estrada para a cidade" (detalhada, até −50,0585 / −29,0610) → "estrada até a cidade" (resto até a cidade) → "estrada do centro até o fim da vila ouro verde". Fora das áreas urbanas ela é comprimida 2× (`ESTRADA.compressao`); perto da cidade e do complexo (Vila Oswaldo Kroeff, Vila Santana, Olaria, Parque Industrial, Cambará S/A, Vila Ouro Verde) fica em escala real. Cada bloco urbano é deslocado, sem girar nem escalar, para encostar na estrada comprimida (`zonas.blocos`, `Z.Tde(x,z)`).
- Elevação: `python3 tools/baixar_elevacao.py` agora cobre todos os `data/kml/*.kml`; rode de novo para ter o relevo real em toda a estrada.
