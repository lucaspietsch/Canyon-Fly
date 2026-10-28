# PROGRESSO — CanyonFly (prompt mestre em `docs/PROMPT-MESTRE.md`)

Atualizado em 28/10/2026 · bloco atual: **P0 — Estabilidade e carregamento** (entregue, aguardando teste do Lucas).

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

## Pendências que dependem do Lucas
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
