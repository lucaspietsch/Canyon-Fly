# PROGRESSO — CanyonFly (prompt mestre em `docs/PROMPT-MESTRE.md`)

Atualizado em 28/10/2026 · entregues: **P0** e o **AJUSTE (login, tempo antigo, transformação, Krig)** — aguardando teste do Lucas.

## Como foi testado nesta sessão
Sessão em nuvem sem GPU: o jogo rodou headless (Chromium + SwiftShader) servido por `python3 -m http.server`, capturando `pageerror`, `console.error/warn`, requisições falhas e exercitando as teclas F3, P, 1–5/`.` (horas), F6/F7/F8 (fauna), F9/F10 (aviões), F11 (meteoros), F12 (emergência), M, J, N, `;`, V. **Nada visual (colisão, paredes, FPS real) pôde ser conferido aqui** — está marcado abaixo como "testar no seu PC".

## P0 — Estabilidade e carregamento
| Item | Estado | Observação |
|---|---|---|
| Console sem erros | ✅ feito | Antes: ao abrir o F3 saíam 14 erros `a.depurando is not a function` (F3 sobrescrevia a função `M.depurando` com um booleano). Corrigido; 3 recargas + todas as teclas de debug sem erro. Efeito colateral corrigido: a tecla **V** (poder do personagem) nunca funcionava sem F3, porque `poderes.js` testava `M.depurando` (função, sempre verdadeira). |
| Tela inicial sem vídeo; jogo só carrega ao clicar, com barra de progresso | ✅ feito (neste repositório) | `index.html` agora tem a tela "▶ CanyonFly": antes do clique nada do jogo é baixado. Medido: **primeira visita = 1,55 MB (pacote) + 1,12 MB (elevação) + 0,06 MB (KML) ≈ 2,7 MB**; tempos saem no console (`CanyonFly: pacote … em X s`, `tela inicial fechada em Y s`). ⚠️ O vídeo e o menu do **Gestão de Operações** ficam no repositório `gest-otirolesa`, que não estava nesta sessão. |
| Gestão de Operações com seções reais; CanyonFly antes das bloqueadas | ⏸ depende | Repositório `gest-otirolesa` (não anexado nesta sessão). Abra a próxima sessão com os dois repositórios ou diga onde fica a página. |
| Leitor de KML por tipo e depois palavra-chave | ✅ já existia, conferido | `resgate/kml.js` → `classifica()`: geometria primeiro, depois regex em ordem de prioridade, nomes normalizados (acentos, maiúsculas, letras repetidas). Console lista as 32 marcas com a regra que casou; nomes desconhecidos só no F3. Praça = `praca`, estradas = `estrada`. |
| Alinhamento real | ✅ conferido · ⚠️ desnível pendente | Calculado a partir do KML: lançamento em x=2050 z=19 u, no jogo x=2049 z≈25 u (≈2 m de diferença); recebimento em x≈0. Distância horizontal **700 m**. Novo relatório no console (`Tirolesa (KML × jogo)`) com DEM: lançamento 1.089 m, recebimento 1.026 m → **desnível 63 m, cabo reto esperado ≈ 703 m**. No jogo o cabo tem **712 m e é quase plano** (0,8 m, e no sentido inverso): aplicar os ~55–63 m de desnível mexe em pórtico, plataforma, câmera da descida e terreno do platô — **não fiz** (decisão sua: entra no P4 "ambiente real"?). |
| Elevação real (SRTM 30 m) | ✅ feito | `tools/baixar_elevacao.py` rodou aqui: `data/terrain/elevacao.json` + `elevacao.bin` (1,1 MB). Parque 1.025 m, cidade ~1.000 m, mínimo 110 m (fundo do cânion), máximo 1.195 m. F3 mostra "Elevação real: 110–1195 m". |
| Colisão e terreno (10 paredões, 3 trilhas, câmera) | 🔲 testar no seu PC | Não verificável sem GPU. Teste: correr contra paredões e montanhas; subir/descer Trilha do Mirante, da Borda e do Recebimento; girar a câmera junto ao relevo. Use **P** para me mandar a posição de cada problema. |
| Varredura de paredes (buracos, faces invertidas, z-fighting) | 🔲 testar no seu PC | Idem: mande prints + posição (P). |
| Tecla P copia posição + lat/long + direção | ✅ feito | `P` (fora do modo construir) copia `pos x y z u · lat lon · rumo ° · terreno real m · hora · zona` para a área de transferência, mostra na tela e no console. O debug "urutu" que usava P passou para **Ctrl+Y** (Y = jararaca, V = coral com F3 aberto). |
| Desempenho (FPS ≥ 45 em média) | 🔲 testar no seu PC | Headless não mede. Abra o F3 e anote o FPS no estacionamento, trilha, mirante, turfeira, cidade e floresta. |

### Como testar o P0 no seu PC
1. `git pull`, Live Server em `index.html` (raiz). Clique em **▶ CanyonFly** e veja a barra e os tempos no console (F12 do navegador).
2. Recarregue 3 vezes: nenhum erro vermelho no console. Abra o **F3**, troque a hora com `1`–`5` e `.`, aperte F6/F7/F8, F9, F10, F11, F12, M, J: continua sem erro.
3. Aperte **P** andando: a posição aparece na tela e já está copiada (Ctrl+V num texto).
4. No console, procure `Tirolesa (KML × jogo)` (aparece 2×: antes e depois do DEM chegar).
5. Anote o FPS do F3 nos 6 lugares e me mande junto com qualquer posição de bug (P).

## AJUSTE (28/10) — Login dos operadores, tempo antigo, transformação automática, Krig coordenador
| Item | Estado | Observação |
|---|---|---|
| Login + senha por operador (PBKDF2) | ✅ feito | `data/seguranca/senhas.js` → `OPERADORES` (login + salt + iter + hash PBKDF2-SHA-256, mín. 100.000 iterações; a Vila Santana usa o mesmo método em `SENHAS`). Tela de login com 2 campos; erro único "Login ou senha incorretos"; 3 erros = 30 s, 60, 120… (contagem única para qualquer login); sessão em `sessionStorage` (fecha com a aba) com botão **Sair** na tela 👤. `tools/gerar-hash.html` e `tools/gerar_hash.mjs` pedem id + login + senha e devolvem a linha pronta. **Nenhuma senha real cadastrada**: todas as vagas aparecem "em breve" até você colar as linhas. |
| Login de teste (debug) | ✅ feito | `LOGIN_TESTE` em senhas.js: login `teste` (senha a que você pediu, só o hash está no arquivo), entra como **Krig**; só funciona em `localhost`/`127.0.0.1` ou com `?debug` na URL — no site publicado não vale. |
| Acesso ao tempo antigo | ✅ feito | Operador logado: pórtico da Vila Santana abre com [E] sem senha (e abre sozinho ao chegar por viagem rápida); destinos **Vila Santana 1950 / Antiga Floresta da Olaria / Área industrial (Cambará S/A)** aparecem na viagem rápida só com login. Sepé/Tupã/Atiara seguem as regras anteriores. |
| Transformação automática | ✅ feito (visual + velocidade) · ⚠️ poderes a definir | `personagens/transformacao.js`: ao entrar em 1950 com operador logado em uso → clarão da cor dele + roupa de poder (recolore camisa/manga, calça e capacete; cores em `dados/personagens.js` → `transformacao`) + velocidade (Krig 2×). Ao voltar a 2026 (ou sair/trocar de personagem) → uniforme de volta, efeitos desligados. **Poderes específicos (fúria com fogo, voo, aura, cabelo reluzente) não existem neste repositório** — o sistema de poderes atual só tem Lábia (Pit), Raio (Tupã), Arco (Sepé) e Olhos (Atiara). Ficam "a definir"; quando você descrever cada poder eu implemento em `data/poderes.js`. Tecla de transformação (H / L3+R3) e controle de PS3 **não existem aqui** (nada foi removido). |
| Krig coordenador | ✅ já era assim | Neste repositório o Krig já é o coordenador NPC do lançamento (`jogo3d.js`, `trolley3d.js`) e o bombeiro civil é um NPC separado (`resgate/quadriciclo.js`). Feito: Krig virou a 1ª vaga de operador com login (função "Coordenador da equipe", barba). Falas de rádio/cobrança de horário nas missões: pendente (P5). |
| Kauling | ✅ dados | Normal (foto): capacete laranja da equipe, óculos, fleece verde com zíper laranja, barba (ligada no boneco). Transformação (foto do palco): chapéu preto de aba larga, roupa escura, clarão azul/magenta. Modelos 3D específicos (chapéu, óculos) ficam para o P2. |

Testado headless (sem erros): login errado ×3 → espera 30 s (até a senha certa é bloqueada durante a espera); login de teste → Krig; viagem rápida → Vila Santana → época 1950 → transformado (velocidade 2×); viagem → estacionamento → 2026, uniforme de volta; Sair → volta ao Pit e os destinos do tempo antigo somem.

**Como testar no seu PC**: Live Server em `localhost` → ▶ CanyonFly → botão 👤 → clique em **Krig** → login `teste` + a senha combinada → marco de viagem rápida ([E] no estacionamento) → "Vila Santana, 1950" → veja o clarão e a roupa viking; volte por viagem rápida ou a pé pelo pórtico → uniforme de volta. Erre a senha 3 vezes para ver a espera. Tela 👤 → **Sair**.

## RECONSTRUÇÃO — Diully e Mary (28/10)
| Item | Estado |
|---|---|
| Base feminina (rosto suave, olhos com íris/pupila/reflexo/cílios, sobrancelhas finas, blush, batom, cabelo volumoso com fios, brincos, colar, pulseira, anéis, piscar, balanço do cabelo) | ✅ `constroiOperadora` em `modelos.js` |
| Diully: loira, rabo de cavalo (dias pares) / solto (ímpares); Sombra Dourada = preto, cabelo reluzente, partículas douradas, flutua a 2 m | ✅ |
| Mary: castanho escuro, coque com laço + duas tranças, argolas, prata; Violeta = jaqueta violeta, calça escura, fogo na mão direita e gelo na esquerda (efeitos visuais) | ✅ |
| Lábia | ✅ passou do Pit para a Diully |
| Telecinese (Diully), fogo/gelo jogáveis (Mary), animações de personalidade (ajeitar cabelo, selfie, acenar), expressões nas falas, LOD de rosto/cabelo, luz de recorte | 🔲 a definir / próximo passo — o boneco base continua o `pessoa3d` (o rosto ainda é estilizado) |
| Retratos | `M.personagens.retrato(id, graus, { transformado, rosto })`; folhas enviadas no chat |

## PODERES DOS OPERADORES (29/10) — todos só na forma de poder, no tempo antigo
| Operador | Forma | V (poder) | Y | U | I | Outros |
|---|---|---|---|---|---|---|
| Krig | Viking (aura de fogo) | investida em chamas | golpe no chão | voo 5 m, 2× | rugido (atordoa sem ferir) | — |
| Jackão | Camuflado (óculos RA, fuzil) | tiro (balas infinitas, pente 30) | granada (3/zona) | óculos de RA | munição de choque | botão direito = mirar |
| Mohr | Rubro (linhas vermelhas) | onda (1,6× perto de água) | avalanche (só em declive) | — | lama (prende sem ferir) | som grave, tremor |
| Mary | Violeta | bola de fogo (apaga na mata) | vapor (só em alvo congelado) | gelo (congela 5 s) | — | — |
| Diully | Sombra Dourada (flutua 2 m) | ergue / arremessa | bate no chão | Lábia (chance 65%) | — | botão direito = erguer e segurar |
| Pit | — | **pendente** (armadura, CardPuter, parar o tempo, hologramas, hackear) | | | | |
| Kauling | Peão gaúcho (chapéu, lenço, guaiaca) | grito em anéis (arremessa, rajada de vento) | — | crescer 2,5× / encolher | grito curto (atordoa sem ferir) | passos tremem a câmera; encolhe na mata |
| Carlão | Reggae (camisa 4 cores, chuteiras douradas, bola dourada) | chute: toque = bola volta e encadeia · segurar = explode e nasce outra | capoeira (ginga → meia-lua → martelo → armada) | — | rasteira (derruba 4 s sem ferir) | falas no campo de futebol: pendente (campo vem com o OSM) |

Teclas E/Q/F não foram usadas: já são interagir, câmera e foto. Tudo configurável em `data/poderes.js` → `teclas`. Controle de PS3 não existe neste repositório.
Testado headless em cada um (login `teste.<id>` em localhost, viagem rápida → Vila Santana → transformação → poderes contra espantalhos). Em headless o relógio roda devagar: recargas parecem longas; no navegador real é normal.

## FILA (ordem combinada)
1. **Pit** — visual próprio, login, poderes (armadura preta com luzes azul/violeta, CardPuter, parar o tempo, hologramas, hackear). Registrado; não iniciado.
2. **OSM (8 arquivos)** — bloqueado: nenhum .osm chegou ao servidor. Coloque-os em `data/osm/` no repositório e dê push.
3. Fotos restantes (Krig, Jackão, Mohr, Carlão transformado) e P1 em diante.

## Pendências que dependem do Lucas
- **Cadastrar os logins reais** dos 8 operadores e a senha da Vila Santana (`tools/gerar-hash.html` → colar em `senhas.js`). Nunca me mande as senhas.
- **Descrever os poderes** de cada operador no tempo antigo (o que fazem, alcance, recarga) para eu implementar em `data/poderes.js`.
- Decidir sobre o **desnível real do cabo** (55–63 m): aplicar agora (grande) ou manter o cabo plano.
- Repositório **gest-otirolesa** na próxima sessão (vídeo da tela inicial e menu do Gestão de Operações).
- Fotos de referência só quando o item correspondente for feito (P2/P3/P6).
- **Onde encaixar o COMPLEMENTO** (missões 9–20 + mira automática + download, em `PROMPT-MESTRE.md`): antes do P1 ou depois do P6?

## Próximos blocos (ordem do prompt mestre)
- **P1** — fauna nascendo (causa), aviões (causa), visitantes variados com perguntas, SAMU corrigido, Dia 1 completo.
- **P2** humanos realistas · **P3** animais realistas · **P4** ambiente real · **P5** polimento das missões · **P6** áreas especiais e míticos.
- **COMPLEMENTO** (28/10): mira automática + download de fotos; missões 9 a 20 (um commit por missão).

## Observações técnicas para a próxima sessão
- Há etapa de build: `cd t3d && npm install && npm run build` gera `t3d/dist/trolley3d.min.js` (commitado, é o que o `index.html` carrega). O `jogo/index.html` ("Operar Tirolesa") tem o marcador `/*__T3D__*/` onde o `gest-otirolesa` injeta o pacote.
- Teste headless reutilizável: script Playwright que abre `index.html`, clica em ▶, aperta teclas e lista erros (ficou fora do repositório; recriar é rápido: `pageerror` + `console` + `requestfailed`).
- `t3d/package-lock.json` muda o campo `name` ao rodar `npm install` (t3d → canyonfly): cosmético, descartado.
- Avisos esperados em headless (não são erros): `AudioContext was not allowed to start` e `requestFullscreen` sem gesto do usuário — no navegador real o clique em ▶ CanyonFly é o gesto.
