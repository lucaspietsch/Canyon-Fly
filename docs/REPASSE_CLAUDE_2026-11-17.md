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
