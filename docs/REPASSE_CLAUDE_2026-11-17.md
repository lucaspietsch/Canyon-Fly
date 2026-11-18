# Repasse para Claude Code — Canyon-Fly

Data: 17/11/2026. Branch: `codex/personagens-mais-realistas`.
Base desta entrega: `4bdc2cb`. O commit final pode ser consultado com `git log -1`.

## Estado da integração

O usuário informou que enviaria um arquivo com as alterações do Claude Code até 9h36. Esse arquivo **não foi recebido**. Portanto, esta entrega foi feita sobre a branch existente; não representa uma conferência ou merge das alterações locais do Claude. Antes de aplicar o patch em outra cópia, conferir a base e eventuais conflitos. O pacote inclui o patch da entrega e as capturas.

## Solicitações atendidas nesta entrega

### Fauna

- **Perereca:** geometria própria castanho-dourada, ventre creme, olhos grandes, pernas traseiras alongadas e discos nas pontas dos dedos. Identificação para fotografia e conquista `perereca`. Mantida a aparição no crepúsculo junto a poças/nascentes. Escala nominal de jogo: 3,5–5,5 cm; não foi atribuída espécie científica a partir das duas fotos.
- **Libélulas:** novo módulo independente, quatro cores (azul, verde, vermelha, amarela), corpo segmentado e quatro asas com nervuras e transparência. Aparecem em matas, mata baixa e turfeiras próximas ao jogador, incluindo matas antigas e cenário ancestral. População local limitada a 12/24 por qualidade; desaparecem à noite e longe do jogador. A distribuição é feita conforme a vegetação do mapa, não em todas as coordenadas simultaneamente. O desenho antigo de libélulas foi retirado de `sapinhos.js`.
- **Jararaca e urutu-cruzeiro:** texturas próprias, escamas em losangos, padrões distintos, cabeça destacada do pescoço, olhos/fossetas e cauda afilada. Malha dinâmica passa a 68 seções × 16 lados. A postura defensiva e travessia continuam; não foi acrescentado ataque ao jogador.
- **Corais:** quatro famílias visuais de anéis, com variações estáveis de largura/deslocamento por nome do ponto/local do mapa. O registro inclui pontos KML, polígonos nomeados e lugares. `M.fauna.serp.coraisPorPonto()` permite inspecionar o registro. A textura escolhida é exposta em `serpente.variante`. Há geração também nas matas fora da zona do parque; respeita limite de serpentes e cooldown. Isso representa variações visuais do jogo, não uma classificação taxonômica das fotos. A existência de um perfil por local não mantém uma cobra ativa em cada ponto ao mesmo tempo.
- **Andorinha:** dorso azul, garganta/ventre claros, bico curto, asas estreitas e cauda bifurcada. O bando mantém o sistema de boids e um único InstancedMesh. A máscara `aAsa` limita o batimento às asas, preservando o corpo.

### Centro da cidade

Novo módulo `cidade/npcs-centro.js` com seis NPCs identificados e interativos: Dona Lurdes (moradora), Raul (comerciante), Lia (guia local), Bento (artesão), Íris (estudante) e Vítor (visitante). São adicionais aos passeantes já existentes na praça. Usam corpos instanciados, movimentação local e hotspots de diálogo; aparecem de dia nas proximidades da praça e são removidos ao sair da área ou mudar de época.

### Atiara

Modelo substituído conforme os prints do vídeo: jovem homem Kaingang, cabelo longo liso, pinturas geométricas no rosto/braços, torso descoberto, vestimenta curta de fibras, arco, aljava e pés descalços. Foram retirados os adereços do modelo anterior: cabelo crespo, cocar grande, bandana vermelha, olhos luminosos, osso no nariz e colar de cobra.

Arquivo principal: `personagens/atiara-visual.js`. `modelos.js` reexporta o construtor. O método `rig.epoca('2071')` ativa casaco, calças, faixa e pequena pena azul; `rig.epoca('1689')` restaura a roupa ancestral. As duas formas aparecem na galeria.

As pinturas e vestimentas são uma adaptação dos prints recebidos, sem atribuição de significado tradicional específico.

### Passagem para 2071

- Missão nova `a01-passagem-2071`, após `v04-atiara`.
- A cena `atiara.passagem` narra o encontro interrompido com Góan, a disputa dos pinheirais e a intervenção da mãe, uma kujá. Depois abre um portal dourado interativo.
- O portal conduz ao cenário separado **2071**, registrado em `M.futuro` e reconhecido por `M.lugares.epoca()`.
- Cenário-base explorável: estrada, carros abandonados, ruínas, entulho e araucárias. A chegada começa à noite. O diálogo seguinte equipa as roupas encontradas e avança para o amanhecer.
- Entrada salva em `canyonfly:2071:v1`; o cenário restaura/limpa seus hooks de terreno. `M.futuro.volta()` é uma API para retornar e limpar o cenário, útil na revisão.

**Limites explícitos:** é um epílogo jogável inicial, com narrativa em diálogos e cenário procedural. A invasão, a atuação da kujá e o desmaio ainda não têm uma cinemática completa, batalhas ou os personagens específicos Góan/mãe modelados. Não há campanha extensa de sobrevivência em 2071; o minimapa ainda usa a infraestrutura anterior. A arte usa o estilo 3D do projeto; não reproduz o realismo fotográfico do vídeo. A narrativa de conflito pertence à ficção do jogo.

### Gritador e Boitatá

- **Gritador:** modelo com silhueta esquelética, roupas rasgadas, boca aberta e olhos/luz de fogo. Preservados os poderes, dano, encantamento e missão existentes. `responde()` registra respostas e acelera a aproximação; a escolha de responder no diálogo chama essa API. A missão continua falhando quando o jogador responde. O diálogo passou a mencionar as duas versões fornecidas: maldição da mãe/cavalo Malacara e guardião do tesouro. Dona Lurdes também transmite o aviso. A fonte citada pelo usuário foi [a coluna “A lenda do Gritador”, A Folha Torres](https://afolhatorres.com.br/colunas/lendas-do-sul-a-lenda-do-gritador/); não foi feita nova verificação externa dessa fonte.
- **Boitatá:** modelo existente atualizado com escamas/placas, focinho, olhos dourados, olhos adicionais ao longo do corpo, chamas animadas e halo menos opaco. Mantido como guardião, não como inimigo comum. A reação ao ataque e as cenas existentes continuam. Os textos históricos/etimológicos enviados pelo usuário são contexto de referência; não foi acrescentado um verbete científico novo.

## Entregas anteriores desta mesma conversa já presentes na base

- `159755a`: capivaras e filhotes, veado, quati, gambá e lontra.
- `0a6177b` / `42b8b30`: gralhas por época (6 / 12 / 20–40), rainha ancestral, seis protetoras em três casais, aparições persistidas, papagaios, tico-tico, pica-pau-do-campo, sabiá-laranjeira e arco dos pinheirais.
- `569b2ac`: tucano-de-bico-verde e quero-quero.
- `d37d973`: curicaca e gavião-de-rabo-branco.
- `e623d60`: sapinho-verde-de-barriga-vermelha, M. cambaraensis.
- `4bdc2cb`: sapinho-de-barriga-vermelha, M. dorsalis.

Detalhes complementares estão em `docs/pinheirais.md`, `docs/sapinho-cambaraensis.md` e `docs/sapinho-dorsalis.md`. A Pedra do Segredo continua usando um marco provisório porque o ponto não está identificado no KML atual. O Itaimbezinho ancestral é um cenário procedural separado, não uma cópia topográfica em escala 1:1.

## Capturas

`docs/media/elenco-atual/indice.json` relaciona todos os arquivos e nomes: 20 vistas de personagens/formas, 46 de NPCs/criaturas e 35 de animais/variantes (101 no total). As galerias reúnem personagens/formas, NPCs/tipos/criaturas e animais/variantes. Pessoas aleatórias são representadas por seus tipos visuais, não por cada indivíduo gerado. As capturas ajustam o enquadramento e não representam escala comparável entre espécies.

- `personagens.jpg`
- `npcs.jpg`
- `animais.jpg`
- `centro-no-jogo.png`
- `atiara-2071-no-jogo.png`

## Validação e reprodução

- `npm --prefix t3d test`: 67 testes passaram.
- `npm --prefix t3d run build`: bundle atualizado; permanecem os avisos preexistentes de chaves duplicadas `ceu` e `zq`.
- Regressão dos 11 personagens/poderes: passou.
- `node t3d/test/browser/perereca.cjs`: quatro capturas sem erros.
- `node t3d/test/browser/elenco.cjs`: captura os modelos atuais e verifica erros JavaScript; o HTML de teste exporta constantes privadas de resgate apenas na compilação da fixture.
- `node t3d/test/browser/natureza-centro-game.cjs`: verifica seis NPCs e interação, registro de corais, entrada de Atiara em 2071, troca de roupa, ruínas e limpeza/retorno. Os pré-requisitos são preparados pelo teste; não é uma campanha manual completa.

Os scripts de navegador aceitam `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Os testes do mundo usam o repositório servido em `http://127.0.0.1:8062/`. Não há dependências novas. O bundle `t3d/dist/trolley3d.min.js` foi regenerado e deve acompanhar os fontes.

## Para continuar

1. Receber o arquivo prometido do Claude Code das 9h36 e comparar sua base antes de aplicar o patch.
2. Planejar/produzir a cinemática detalhada da passagem de Atiara e os modelos específicos de Góan e da kujá, se forem parte da próxima etapa.
3. Expandir e dar acabamento artístico a 2071; definir objetivos e extensão da campanha futura.
4. Substituir o marco provisório da Pedra do Segredo quando houver posição no KML.

## Ajuste complementar — aparência do Pit

Após o repasse inicial, o usuário enviou novas referências para o rosto do Pit. A barba cheia foi substituída por bigode marcado com pontas levantadas e cavanhaque curto. Foram adicionados óculos escuros de armação preta, lentes arredondadas e barra superior reta. Os acessórios ficam no grupo da cabeça normal, preservando o capacete integral da armadura. Arquivos: `pit-barba.js`, `pit-oculos.js` e integração em `pit-visual.js`. O bundle foi reconstruído e as capturas do modelo real foram conferidas sem erros JavaScript.

Revisão seguinte dos óculos: altura reduzida, largura ampliada e contorno reforçado com aro mais espesso e filete frontal de realce, conforme solicitado. Capturas e galeria atualizadas.

## Atualização complementar — Anhangá humano, cervo e híbrido

Referências adicionais enviadas pelo usuário: humano de cabelo branco comprido, pinturas vermelhas, cocar vermelho com pena central amarela; cervo branco marcado de vermelho; humanoide com crânio e galhada de cervo.

- `t3d/src/mundo/lenda/anhanga-humano.js`: modelo humano dedicado, cabelos e cocar animados, pinturas no rosto e tronco, colares e pés descalços.
- `t3d/src/mundo/lenda/anhanga-cervo-humano.js`: forma híbrida própria, crânio alongado, olhos luminosos, galhada ramificada e manto branco nos ombros.
- `t3d/src/mundo/lenda/anhanga.js`: cervo quadrúpede continua sendo a forma principal; recebeu galhada maior e marcas vermelhas. A nova chave `cervoHumano` entra no ciclo de metamorfoses depois de `humano`. Tatu, boi e pirarucu continuam disponíveis. A mudança ocorre pela mesma transição de névoa já existente.
- Bundle reconstruído em `t3d/dist/trolley3d.min.js`. Galeria e fixture de elenco incluem a sexta forma.

Validação: 67 testes unitários passaram; captura no navegador verifica as seis metamorfoses, retorno ao cervo e coordenadas finitas das geometrias, sem erros JavaScript. Prints reais em `docs/media/anhanga/`; galeria completa em `docs/media/elenco-atual/index.html`. Script reproduzível: `t3d/test/browser/anhanga-humano.cjs`.

Os modelos usam a linguagem visual procedural atual do jogo. As referências orientam silhueta e acessórios; não foram transformadas em modelos fotorrealistas. Esta atualização é visual e de registro de formas, sem novas missões do Anhangá. As pendências de narrativa/cinemática indicadas acima continuam abertas.

## Clipes para o timelapse de produção

Adicionado `t3d/test/browser/clipes-laterais.cjs`: ferramenta de captura cinematográfica das cenas reais do jogo, com câmera lateral e exportação quadro a quadro. Produz três clipes MP4/H.264 sem áudio, em 1280 × 720, 24 fps e 4 s: praça central/NPCs, Anhangá cervo humanoide e Atiara em 2071. O script pausa o loop normal de renderização e configura os enquadramentos apenas na sessão de captura. Não altera a câmera nem o comportamento do jogo distribuído. `PREVIEW=1` gera enquadramentos; `VIDEO_OUT` escolhe a pasta. Requer Playwright, Chromium e ffmpeg.

Arquivos de vídeo entregues separadamente em `/workspace/artifacts/videos-jogo/`, evitando incluir os quadros intermediários e os vídeos no bundle/repositório. A sequência para edição usa cortes secos e tem 12 s, sem títulos nem trilha.

## Lobisomem e floresta sombria da Olaria

O tatu foi retirado das metamorfoses do Anhangá, inclusive da demonstração na conversa de Tupã. Permanecem cervo, boi, pirarucu, humano e cervo humanoide. O lobisomem é um aliado separado do Anhangá, conforme o papel de defensor solicitado.

- `lenda/lobisomem-visual.js`: modelo lupino escuro, focinho, orelhas, olhos luminosos, mãos com garras, pernas digitígradas e animação alternada dos braços.
- `lenda/lobisomem.js`: guarda Anhangá; ao ataque de Tupã, aproxima-se e executa dois arranhões, com impactos a 0,20 s e 0,44 s. Alcance de 2,8 m, recuperação entre combos e limite de perseguição de 32 m a partir do guardião. Cada acerto provoca pequeno recuo e emite `lobisomem:golpe`. Não foi criado um sistema global de vida: o efeito sobre o jogador é recuo/aviso, compatível com a base atual. Outros personagens não são perseguidos; encantamento de Atiara interrompe temporariamente o movimento.
- `lenda/olaria.js`: clareira vinculada ao polígono real da Olaria, ativa em 1950 a até 75 m do centro. Árvores, névoa circular e luz fria local; reúne Anhangá, lobisomem, Gritador e Boitatá. Alvos saem do registro dos poderes ao sair da área e retornam sem duplicação. A geometria da clareira é reutilizada entre visitas.
- `lenda/criaturas.js`: IDs opcionais permitem instâncias locais de Gritador/Boitatá sem colidir com os IDs das missões. A narrativa das missões continua independente da presença na clareira.
- Integração em `mundo/index.js`; fontes e bundle atualizados. A resposta ao raio do Anhangá aciona o defensor.

Validação: 69 testes unitários passaram, incluindo alternância/intervalo dos ataques, recuo, alcance, limite de perseguição e limpeza do alvo. `t3d/test/browser/olaria-game.cjs` verifica a defesa após o raio, os dois golpes e a saída/retorno sem duplicação; produz prints reais em `docs/media/olaria/`. O teste espera o carregamento do relevo e prepara o cenário/horário para as capturas; não representa uma campanha manual completa.

O teste de navegador confirmou proteção ao ataque de Tupã, dois impactos distintos (`esquerda`, `direita`), interrupção da perseguição, ausência de agressão a Atiara e retorno à floresta sem duplicar alvos, sem erros JavaScript. Os prints incluem a clareira, as três formas principais do Anhangá, lobisomem, Gritador, Boitatá e as duas poses de arranhão, em `docs/media/olaria/index.html`. A atmosfera escura e a neblina local são restauradas ao sair. A galeria geral substitui a imagem do tatu pela do lobisomem. Montagem reproduzível: `scripts/montar-olaria.py`.

## Pit — transformação imediata, mobilidade e resolução

Pedido seguinte: permitir transformar Pit já no presente, aumentar caminhada/corrida em 70%, voar rapidamente pelo mapa e oferecer resolução reduzida.

- `T` e o botão “Transformar Pit” no painel **Pit / Desempenho** ativam a armadura do Pit inicial sem exigir o portal/1950 nem sessão de operador. Essa liberação é intencional, a pedido do usuário. `T` novamente destransforma. A transformação manual permanece ao mudar de época; trocar de personagem ou sair da partida a encerra. A autenticação/transformação automática dos demais operadores foi preservada.
- Caminhada e corrida de Pit usam multiplicador **1,7**: velocidades base de 6,3/17 passaram a 10,71/28,9 unidades/s. O bônus vale no corpo normal e na armadura; os outros personagens mantêm suas velocidades.
- `G` ou o botão **Voar rápido / Pousar** liga/desliga o voo da armadura. Velocidade de 90 m/s; Shift ou corrida ligada por R ativa 150 m/s. Setas movem e giram; Espaço sobe, Ctrl desce. Começa a 35 m do chão, com ajuste de 8 a 180 m e acompanhamento do relevo. O voo cruza os limites dos corredores terrestres para permitir travessias diretas pelo mapa. No pouso, retorna à área caminhável próxima e para o movimento; água funda exige buscar terra firme. A destransformação força um retorno seguro se necessário.
- Resolução na tela inicial e no painel da partida: **Automática, Alta (100%), Média (75%), Baixa (50%), Mínima (35%)**. Os percentuais se referem à densidade máxima de pixels do aparelho. Os modos manuais não são sobrescritos pelo ajuste automático. Preferência salva em `canyonfly:resolucao`. A interface permanece em resolução normal; o mundo 3D usa a escala escolhida.

Arquivos principais: `t3d/src/ajustes-jogador.js`, `resolucao.js`, `mundo/poderes/pit-mobilidade.js`, integrações em `andar.js`, `trolley3d.js`, `mundo/index.js`, `mundo/poderes/pit.js`, `mundo/personagens/transformacao.js` e `index.html`. Bundle reconstruído. Documentação de uso atualizada em `docs/pit.md`.

Validação: 72 testes unitários passaram; a regressão de poderes dos 11 personagens passou sem erros JavaScript, incluindo hologramas, hack, congelamento do tempo e controles do Pit. `t3d/test/browser/pit-mobilidade-game.cjs` verifica no bundle real o início em 2026 sem login, transformação manual, caminhada/corrida, voo/turbo/altura, pouso, limpeza ao destransformar, bloqueio para outro personagem, resolução real do canvas e preferência após recarregar. No teste, 1280 px de largura viraram 448 px no modo Mínima. Prints e relatório em `docs/media/pit-mobilidade/`.

## Gaúchos em 1950 e transporte de madeira

Referências novas do usuário: trajes gaúchos históricos com chapéu, lenço, guaiaca, bombachas, botas, barba/bigode e ponchos; caminhões de cabine arredondada com toras muito grossas e pilhas altas de tábuas. Os moradores são personagens fictícios e as medidas dos veículos/cargas são escolhas de modelagem inspiradas nas fotos.

### Moradores

Nove NPCs, três em cada vila: Santana (Anselmo, Pedro, Joaquim), Ouro Verde (Ernesto, Vicente, Antônio) e Oswaldo Kroeff (Francisco, Manuel, Sebastião). Aparecem apenas em 1950, carregam por proximidade, têm poses/animação leve e conversa por interação. Locais derivados dos polígonos reais do KML; a busca evita colisores/água e o apoio dos pés usa as faces desenhadas do terreno. Os modelos são mantidos em cache para reutilização e os hotspots são removidos ao sair. A regra de reconhecimento de 1950 inclui Oswaldo Kroeff, após o acesso ao passado, sem modificar o login do portão. A arquitetura/cronologia geral dos lugares permanece a existente no projeto.

Fontes: `t3d/src/mundo/historico/gauchos.js`, `moradores.js`, `chao.js`; integração em `mundo/index.js`, ajustes de área antiga em `lugares/lugares.js` e `lugares/santana.js`.

### Caminhões e extração

`historico/caminhao-madeira.js` cria três cargas: várias toras (diâmetros de 1,44 a 1,80 m), uma tora gigante (2,50 m) ou tábuas em 35 camadas, com amarrações. Toras com casca irregular e anéis nas seções cortadas; cabine arredondada, capô longo e seis rodas. A versão com tábuas fica próxima à chegada conhecida da fábrica durante 1950, quando o jogador se aproxima.

`historico/extracao.js` prepara dois lenhadores com serrote traçador, araucária de tronco espesso/copa em guarda-chuva e ciclo de corte → queda → carregamento → transporte → descarga → retorno vazio. Trabalha com um número finito de árvores próprias da frente, sem editar a distribuição global da vegetação. Caminhões seguem a rota fornecida, ou um trajeto de acesso à estrada existente até a chegada da fábrica. O acesso entre a frente e a estrada deve ser conferido quando chegarem as localizações reais.

**Pendente por informação do usuário:** as coordenadas de corte ainda não foram enviadas. `LOCAIS_EXTRACAO_1950` está vazio; nenhuma frente foi colocada arbitrariamente no mapa. Os modelos/ciclo estão prontos e a captura de extração é uma prévia técnica. Para ativar, preencher a lista no fonte ou chamar `M.extracao1950.defineLocais([{id:'frente-01',x:...,z:...,arvores:3,rota:[[x0,z0],...,[xf,zf]]}])`. Coordenadas/rotas são do mundo do jogo; a fábrica continua na posição KML existente. O caminhão com tábuas é estático no acesso da fábrica; destinos de expedição das tábuas ainda não foram definidos.

### Validação e prints

76 testes unitários passaram. `historico-1950.test.mjs` cobre cargas/geometrias, rodas, validação de locais, construção de rota e presença/ocultação do caminhão de tábuas. O teste do bundle real `test/browser/historico-game.cjs` verificou três moradores e três interações em cada vila de 1950, retirada no presente, geometrias finitas e um ciclo de entrega/retorno concluído em rota sintética, sem erros JavaScript. Esse trajeto curto valida a máquina de estados; não é uma extração já ativada em local real.

Galeria: `docs/media/historico-1950/index.html`; retratos individuais, prints nas três vilas, três caminhões e prévia de lenhadores. Montagem reproduzível: `scripts/montar-historico.py`. A galeria geral também inclui os nove moradores. Build regenerado com os dois avisos preexistentes de chaves duplicadas.


## Correção do corte com traçador e Capa Preta

A referência seguinte do usuário esclareceu que o corte das centenárias era feito por duas pessoas, uma em cada extremidade de um serrote traçador, com duração média de quatro dias inteiros. A cena foi corrigida: o traçador horizontal tem lâmina dentada e duas pegas de madeira; os trabalhadores ficam em lados opostos, alternam a puxada e mantêm as mãos nas pegas por cinemática inversa. Os machados foram retirados da cena.

`historico/tracador.js` define os quatro dias como **96 horas do jogo / 345.600 segundos simulados**. Na escala padrão (30 segundos reais por hora do jogo), são 48 minutos de simulação com o relógio rodando. Pausar o relógio ou manter o ciclo de tempo desativado interrompe o avanço do corte; o ajuste manual da hora não substitui o trabalho acumulado. É uma representação de jogo baseada no relato do usuário, não uma nova verificação histórica independente. O corte só libera queda e carregamento depois desse progresso completo. Cada nova árvore começa outro período de corte.

A frente ganha interação com dia/progresso do trabalho. Estado do corte e da produção é salvo a cada cinco segundos e ao sair do passado/partida, em `canyonfly:extracao1950:v2`, identificado pelo id e pelas coordenadas da frente. Retomar a frente restaura fase, progresso, árvore, carga, posição do caminhão e entregas. A lista de locais de extração continua vazia, aguardando as coordenadas prometidas; os testes usam uma frente sintética somente na sessão de captura.

O **Capa Preta**, solicitado como assombração da Cambará S/A, foi integrado ao capítulo de 1950. Tem cartola alta, traje formal preto, rosto sombreado, capa longa com deformação animada e leve flutuação. Aparece próximo ao acesso da fábrica, ancorado ao lugar KML existente, das 19h às 5h, a até 100 m do jogador. Some de dia ou ao sair do período/área. Possui interação ambiental sobre sua presença; combate próprio ainda não faz parte desse personagem.

Fontes: `lenda/capa-preta.js`, `historico/tracador.js`, alterações em `historico/extracao.js` e registro em `mundo/index.js`. Galeria geral inclui o Capa Preta. Prints próprios em `docs/media/capa-preta/`; a prévia dos lenhadores em `docs/media/historico-1950/` agora mostra o traçador.

Validação atual: 80 testes unitários passaram. O teste do histórico no navegador confirmou o limite de quatro dias, a retomada pelo snapshot e pelo localStorage, as mãos nas pegas durante fases diferentes do movimento e uma entrega/retorno após o corte. A verificação do Capa Preta cobre aparecimento noturno, desaparecimento diurno, animação da capa, retorno sem duplicar interação e limpeza ao sair da área. Capturas usam o bundle real; as pré-condições de acesso ao passado são preparadas pelo teste.
