# Para o Codex — o que mudou no branch `feat/cidade-ruas-reais`

> Escrito pelo Claude para quem for juntar este branch com outro trabalho (ex.: `codex/personagens-mais-realistas`).
> Base: `main` em `23a4cf5`. **Nada foi publicado no `main`** — o Netlify ainda roda a versão antiga.

## Resumo em 1 parágrafo
A cidade de Cambará do Sul deixou de ser uma grade provisória: agora tem **15 ruas reais** (KML), uma **praça no tamanho real** com calçada em **favo de mel**, a **Rua Coberta com 10 arcos hexagonais**, e **87 prédios em blocos** montados a partir de um catálogo de prints do Street View/satélite feito com o Lucas. Três lojas têm **interior visitável** (Du Perau, Brentano mercado + material de construção, Thewes). O personagem pisa numa **superfície caminhável** própria da cidade (não afunda no piso). Só a cidade-sede mudou; vilas, parque, personagens, HUD e mapa não foram tocados.

## Arquivos de código alterados (11) — onde pode dar conflito
| Arquivo | O que mudou | Risco de conflito |
|---|---|---|
| `t3d/src/mundo/cidade/centro.js` | **NOVO.** Monta os prédios (blocos + telhado + fachada em textura de canvas), igreja com torre, Rua Coberta (10 `TorusGeometry` de 6 lados), interiores, colisores e a superfície caminhável. Tudo é juntado em poucas malhas (uma por cor/textura) com `mergeGeometries`. | nenhum (arquivo novo) |
| `t3d/src/mundo/dados/cidade-centro.js` | **NOVO, GERADO.** Lista `PREDIOS_CENTRO` = `[nome, x, y, largura, fundo, altura, tipo, ânguloRua, ruaX, ruaY]` em metros locais. | nenhum |
| `t3d/src/mundo/dados/kml-cidade.js` | **NOVO, GERADO.** `KML_CIDADE`: as 15 ruas como `LineString` com nomes "rua …"/"avenida …" (o classificador do KML já reconhece como tipo `rua`). | nenhum |
| `t3d/src/mundo/index.js` | importa `KML_CIDADE` e o inclui nas duas chamadas `M.kml.carrega([...])`. | **baixo** — 3 linhas |
| `t3d/src/mundo/cidade/cidade.js` | (1) ruas do KML só na sede (`u.tipo === "cidade"`; vilas seguem com a grade); (2) com ruas reais a praça não corta/duplica ruas; (3) chama `criarCentro(M, u)` ao construir a sede; (4) `descarta()` chama `userData.descartar` (tira colisores/superfície); (5) ruas a +0,15 / calçada a +0,25 do relevo. | **médio** se alguém mexeu em `constroi()`/`fitaRuas()` |
| `t3d/src/mundo/zonas.js` | `blocoDe`: tipo `"rua"` usa o deslocamento da **cidade** (antes caía no da vila — as ruas apareciam no lugar errado). | baixo — 1 linha |
| `t3d/src/mundo/config.js` | `CIDADE.ruas.larguraM` 9→12 (2 pistas + estacionamento, regra do Lucas); `LUGARES.praca`: `calcadaM` 3→4, `favoM: .45` (novo), `ruaLarguraM` 9→12. | baixo |
| `t3d/src/mundo/lugares/praca.js` | calçada e caminhos da praça ganham textura de **favo de mel** (canvas). | baixo |
| `t3d/src/mundo/lugares/util.js` | `anel()` e `fitaReta()` ganharam UV pela posição no mundo (`uvMundo`), igual a `malhaPoli`. Não muda nada para materiais sem textura. | baixo |
| `t3d/src/mundo/dados/kml-vegetacao.js` e `data/kml/parque.kml` | polígono **"área praça da cidade"** refeito no tamanho real (antes englobava o quarteirão da igreja). Os dois arquivos têm o **mesmo** polígono. | baixo — só as coordenadas desse Placemark |
| `t3d/dist/trolley3d.min.js` | build. **Depois do merge, rode `npm run build` de novo** em vez de resolver conflito no `.min.js`. | resolver = rebuild |

## Como o centro é montado (para não quebrar)
- **Coordenadas:** metros locais com origem na câmera da "Ref 01" (−29.0491915, −50.1451915), x = leste, y = norte. `centro.js` converte com `latLonParaMundo(lat, lon)` + `u.T` (o deslocamento da cidade calculado em `zonas.js`).
- **Frente do prédio:** paralela à rua real mais próxima (ângulo e ponto da rua vêm do gerador). Igreja: frente forçada para a praça (sul). Thewes: frente para a avenida.
- **Superfície caminhável:** `centro.js` registra uma função em `cen.extraChao.superficies` (o mesmo gancho das passarelas): piso das lojas com interior, rampa de 3 m na porta e relevo + 0,3 nas ruas/calçadas da área da cidade. É removida quando a cidade descarrega.
- **Colisores:** cada prédio empurra uma caixa em `cen.colisores` (`peca: "predio:<nome>"`); lojas com interior têm colisores por parede/balcão/mesa e porta livre. Removidos no `descartar`.
- **Interiores:** regex no nome — `Du Perau` (pub), `Supermercado` (mercado), `Material` (material de construção), resto `Thewes` (loja). Layout provisório até as fotos do Lucas.

## Gerador (não edite os arquivos GERADOS à mão)
```
python3 docs/cidade/mapa_progresso.py   # lista de lugares (LUGARES) → MAPA-PROGRESSO.svg, PROGRESSO.md, previa-3d-dados.json
python3 docs/cidade/gera_cidade.py      # RUAS + LUGARES → t3d/src/mundo/dados/kml-cidade.js e cidade-centro.js
cd t3d && npm run build
```
- Para mudar/adicionar um prédio: edite `LUGARES` em `docs/cidade/mapa_progresso.py` (nome, x, y, largura, fundo, status, refs) e rode os dois scripts. **Detalhes por prédio** (varandas, escadas, chaminés…) ficam em `centro.js`, escolhidos por regex no **nome** — se renomear um lugar, confira as regex.
- Ruas: `RUAS` em `docs/cidade/gera_cidade.py`.

## Regras do Lucas que o código segue (não desfazer)
- Ruas/estradas **todas asfaltadas, 2 pistas + faixa de estacionamento**, mesmo onde a real é de terra/paralelepípedo.
- Estradas **entre** lugares e **trilhas** ficam com **metade** do comprimento; a cidade fica em escala real.
- Rua Coberta: **exatamente 10 arcos em favo de mel**, só na frente da praça.
- **Sem nomes de comércio reais nas placas** sem autorização (placas genéricas); redes nacionais com letreiro genérico.
- **Sem pinguins** no pórtico/letreiro de entrada.
- Futuro: o jogo vai **voltar no tempo** nesta região 2 vezes (o catálogo guarda o que é antigo).

## Documentação de apoio (só leitura)
- `docs/cidade/REFERENCIAS-STREET-VIEW.md` — catálogo completo (prints, posições, descrições, regras).
- `docs/MISSOES-PARCEIROS.md` — parceiros e ideias de missões.
- `docs/cidade/kml/*.kml` — arquivos do Google Earth do Lucas (avenida principal, estrada e trilhas do Itaimbezinho, borda do cânion).
- `docs/cidade/PROGRESSO.md` / `MAPA-PROGRESSO.svg` — o que já está montado.

## Como testar depois do merge
1. `cd t3d && npm run build`, servir a raiz (`python3 -m http.server`), abrir `index.html`.
2. Viajar para **Cambará do Sul (cidade)** — no console: `ctl.mundo.viagem.viajar('cidade')`.
3. Conferir: sem erros no console; `ctl.mundo.cidade.info()` mostra a sede "(carregada)"; ruas no minimapa; prédios, arcos e calçada de favo na praça; entrar no Du Perau (lado leste da Rua Laurindo, em frente à igreja).

## Pendências conhecidas
- Prédios são blocos (sem degraus de verdade); posições de satélite com erro de ~15 m; não foi verificado se algum prédio encosta em outro.
- Interiores provisórios; nomes reais só com autorização.

## Música da Atiara (só no branch `integracao/cidade-e-codex`)
- `audio/atiara.mp3` — faixa enviada pelo Lucas (indígena instrumental, 1689–1700), reafinada para A = 432 Hz (−24,8 cents; a original estava em ~438 Hz).
- `audio/trilha.js`: `nomes.atiara`. `t3d/src/mundo/trilha.js`: `personagem==='atiara'` → `'atiara'` (mesma prioridade de Tupã/Sepé: terror, tirolesa e eventos continuam acima).
- Testes: `t3d/test/trilha.test.mjs` e `t3d/test/browser/musica-mobile.cjs` incluem a nova faixa.
- `audio/anhanga.mp3` — faixa do Anhangá (espírito da mata), reafinada para 432 Hz (−6,5 cents; original ~433,6 Hz). `trilha.js`: novo contexto `anhanga` (= `M.anhanga.S.vivo`) com prioridade **acima de terror** e abaixo de tirolesa/eventos Tupã/Sepé/tela de personagens. `terror` agora = Gritador ou mata à noite. `musica-mobile.cjs` espera `'anhanga'` quando ele aparece.
