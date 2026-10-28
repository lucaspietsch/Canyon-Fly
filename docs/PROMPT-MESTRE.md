# CanyonFly — Prompt mestre para o Fable 5.1

> Cópia do documento original (Claude Docs), salva em `/docs/PROMPT-MESTRE.md` para a continuação do trabalho. O estado atual está em `/docs/PROGRESSO.md`.
2026-10-27 · LUCAS

## Como usar com R$ 50
Copie da seção "Prompt mestre" até o fim deste documento e cole numa sessão NOVA do Claude Code com o Fable 5.1. O prompt trabalha em ordem de prioridade (P0 a P6) e para no fim de cada bloco para você testar.
O custo exato de cada tarefa não dá para prever: depende do tamanho do código e de quantas tentativas cada correção exige. É provável que R$ 50 não cubram tudo, por isso o que mais importa vem primeiro e o progresso fica salvo num arquivo para a segunda metade do investimento continuar de onde parou.
Dicas para render mais:

- Comece sempre numa sessão nova. Uma conversa longa fica mais cara a cada mensagem.

- Não peça "refaça tudo". Peça a próxima prioridade da lista.

- Responda as perguntas dele de forma curta e direta.

- Anexe só as fotos do item que está sendo feito naquele momento (lobo-guará, leão-baio, graxaim, Tupã, Anhangá, Gritador, Boitatá, quadriciclo, camionetes do ICMBio, Unos da Serra Geral Vertical, Sphagnum).

- Se o crédito estiver acabando, mande: "Pare agora, faça commit e atualize o PROGRESSO.md".

- Para a segunda metade dos créditos, use o prompt curto de continuação no fim do documento.

## Prompt mestre — contexto e regras
CONTEXTO DO PROJETO

- Site "Gestão de Operações" da Tirolesa Mais Alta das Américas, com o jogo de mundo aberto "CanyonFly" dentro dele. Código no GitHub; eu testo com git pull no VS Code e Live Server no navegador. Sem etapa de build.

- O jogo já tem (feito em sessões anteriores, confira no código e no histórico de commits): ciclo de 24h com sol, lua, nuvens, neblina no fundo do cânion, Via Láctea e meteoros; vento; terreno com elevação real e KMLs do Google Earth (parque, trilhas, bordas do cânion, rios e arroios, cascata Gravatá do Noivo, turfeira, matas, estradas, cidade de Cambará do Sul, praça com Sequoia Lunar e Urna do Tempo, Vila Oswaldo Kroeff, Vila Santana anos 50, Antiga Floresta da Olaria, área industrial com Cambará S/A e Vila Ouro Verde); fauna (lobo-guará, leão-baio, graxaim-do-campo, capivaras, serpentes, gaviões, andorinhas, sapinhos Melanophryniscus); NPCs (visitantes, guias, escolas, ICMBio, bombeiro com quadriciclo, SAMU, Pit e equipe da tirolesa); aviões; minimapa, terminal de mensagens, modo foto, sistema de missões (Dia 1 com Pit, Missões 1 a 8) e personagens especiais (Tupã, Sepé Tiarajú, Atiara, Anhangá, Gritador, Boitatá) com ganchos de missões futuras.

- Se algo desta lista não existir no código, NÃO crie agora: anote no relatório como "faltando".
REGRAS DE TRABALHO E ECONOMIA (créditos limitados)

- Antes de codar, mapeie a estrutura com buscas direcionadas. Não leia arquivos grandes inteiros: leia só os trechos necessários.

- Edite trechos. Não reescreva arquivos inteiros nem refatore o que funciona.

- Siga a ordem P0 → P6. Termine um bloco, faça commit, atualize /docs/PROGRESSO.md e PARE para eu testar. Só siga para o próximo bloco quando eu disser "continue".

- Commits pequenos, um por item, mensagens em português. Push no GitHub ao fim de cada bloco.

- Teste rodando o jogo e lendo o console antes de marcar um item como feito.

- Se um item for grande demais ou depender de algo que eu precise enviar (fotos, modelos, posição de bug), registre no PROGRESSO.md e passe para o próximo.

- Modelos 3D novos: só com licença livre (CC0, como Quaternius ou Kenney), em GLB, com licenças em /assets/LICENSES.md. Se não conseguir baixar, me diga o que baixar e onde colocar.

- Nunca escreva senhas em texto puro. Senhas do jogo ficam só como hash SHA-256 com salt.

- O jogo nunca grava, altera ou apaga registros reais do Gestão de Operações.

- Meta de desempenho: 60 fps no desktop, jogável em notebook comum, carregamento do site sem nada do jogo até clicar em CanyonFly.

## Especificação A — mapa real, terreno e KML
Use esta especificação como referência do que já foi pedido. Se o código divergir, corrija para ficar igual a ela.
Arquivos e leitura

- KMLs em /data/kml/ (parque.kml, parque-detalhes.kml e os seguintes). Todos carregados juntos; um novo completa ou substitui elementos de mesmo nome.

- Classificação: primeiro pelo tipo (LineString = estrada, rua, trilha, rio, arroio, borda, ponte; Polygon = áreas; Point = marcos), depois por palavra-chave, sem diferenciar maiúsculas, acentos e letras repetidas ("mataaaa" = mata, "bora" = borda, "praça" = "praca").

- Ordem das palavras-chave, da mais específica para a mais genérica: sequoia → urna → praça → cambara s/a / fábrica / papel → vila → floresta → industrial / celulose / serraria → turfeira / banhado / úmida → mata → lançamento → recebimento → estacionamento → trilha → borda → estrada / rua → rio / arroio → cidade / cambara.

- Nomes desconhecidos ("Marcador de local sem título", "Caminho sem título"): carregar só no debug e listar no console.

- Conversão lat/long → metros por projeção local equirretangular com cosseno da latitude (~-29,07°).
Âncoras e escala

- Lançamento = centro do polígono "deck e casinha lançamento" (~-49,9570 / -29,0634, ~1.083 m).

- Recebimento = ponto "Marcador de local sem título" dentro de "area do recebimento" (~-49,9636 / -29,0660, 1.027,7 m).

- Distância horizontal ~700 m, desnível ~55 m, cabo esperado ~700–720 m com a flecha atual. Informar o comprimento final.

- Parque, cidade, praça e conjunto das vilas em escala real.

- Estradas rurais comprimidas 2x (fator configurável): parque → cidade (primeiros ~200 m em escala real) e cidade → Vila Oswaldo Kroeff. O perfil de elevação é comprimido junto.
Elevação

- Heightmap real SRTM/Copernicus 30 m em /data/terrain/, gerado por script em /tools/ (rodar localmente se a sessão não tiver internet).

- Referências: borda do cânion ~1.000–1.080 m; fundo (Rio Tigre Preto) ~480–500 m; cidade ~995 m.

- Ruído fino por cima do DEM, sem mudar o relevo geral. Suavizar estradas, trilhas e praças.
Cânion

- Borda real = linhas "parte da bora do canion", "borda continuidade" e "continuação borda fortaleza". Onde a linha se dobra sobre si, decidir o lado do vão pelo heightmap e mostrar no debug.

- Paredões com deformação natural (fBm + ridged), camadas horizontais de basalto, fraturas verticais, balanços, tálus na base, liquens brancos e verde-claros por shader triplanar.

- Paisagem distante até 90 km na direção da abertura do cânion, em camadas, com perspectiva atmosférica esverdeada/azulada; far plane e logarithmicDepthBuffer.

- Diminuir algumas montanhas perto do recebimento (30–60%) com transição suave.
Água

- Arroio do Graxaim → encontro com o Arroio Gravatá do Noivo sobre a linha da borda = CASCATA GRAVATÁ DO NOIVO → Gravatá do Noivo desce o cânion → Rio Tigre Preto. Arroio Fortaleza → Rio Tigre Preto.

- A água sempre desce pela elevação real. Se KML e heightmap discordarem, priorizar o heightmap (ajuste de poucos metros).

- Cascata: mais volume, vários véus, aceleração na queda, respingos nos ressaltos, névoa densa na base, poço com espuma, rocha molhada, arco-íris sutil, som forte com eco.
Vegetação e áreas

- Mata = só dentro dos polígonos de mata (capões: árvores grandes e araucárias no centro, médias no meio, pequenas na periferia; sub-bosque com samambaias e xaxins).

- Sem polígono = campo: capim até a canela (~30–45 cm) em tudo que não é trilha, inclusive ralo dentro da mata; samambaias raras no campo.

- Turfeira: polígono "turfeira", com prioridade sobre a mata; Sphagnum em almofadas, poças cor de chá, nascentes ligadas aos arroios, passarelas onde a trilha cruza, placas interpretativas.

- Estacionamento, área do recebimento, deck do lançamento, três trilhas (Mirante, Borda, Recebimento) e mirante no fim da Trilha do Mirante, todos nas posições do KML.
Superfícies

- Firmes: campo, trilha, estrada, calçada, praça, piso, passarela, ponte, rocha. Não firmes: turfeira (lento, pé afunda, aviso), rios e lagos (só raso, nunca veículos fora de ponte), encostas acima de ~40° (não caminháveis).

## Especificação B — tempo, céu, clima e vento
Relógio

- Escala normal: 1 hora de jogo = 30 s reais (constante realSecondsPerGameHour). Modo jornada no Dia 1: 1 minuto de jogo = 2 s reais, com opção "Avançar até [horário]".

- Relógio da HUD clicável: grade de 00:00 a 23:00, salto com transição de ~1,5 s, pausar e voltar à velocidade normal. Eventos do horário escolhido disparam logo em seguida.

- Agendador de eventos único (horário, recorrência, chance, variações) num arquivo de configuração.
Sol, lua e céu

- Latitude ~-29,2°, primavera: sol nasce ~5h50 e se põe ~19h. Fases com transição suave: madrugada (0h–4h30), amanhecer (4h30–7h), dia (7h–17h), entardecer (17h–19h30), noite (19h30–0h).

- Lua com fase, nascente e poente, luz azulada fraca; lua cheia/alta reduz estrelas e Via Láctea.

- Céu por shader de atmosfera, estrelas com cintilação, rotação da abóbada.

- Via Láctea com núcleo creme e faixas de poeira: surge às 21h30, melhora até o pico às 3h, some até ~4h30.

- Meteoros todo dia às 21h (30–40 min, pico ~21h15), radiante único, 1 ou 2 bólidos por noite, nuvens reduzidas entre 20h30 e 22h.

- Ganchos prontos (não implementar): eclipse lunar e solar.
Nuvens e neblina

- Nuvens com vento e cor por horário. Sombras de nuvem nas encostas distantes.

- Neblina ("viração") concentrada no FUNDO do cânion, nunca fog global: estados sem neblina, leve, e cânion cheio (mar de nuvens). Mais provável de madrugada e no amanhecer, dissipa pela manhã, às vezes volta no fim da tarde. Cor acompanha a luz.

- Neblina rasteira sobre as turfeiras nas manhãs frias.
Vento

- Vento global (direção + intensidade) enviado como uniform aos shaders: brisa constante, períodos aleatórios de vento moderado (20 s a 2 min reais) e rajadas, direção mudando devagar.

- Capim em ondas suaves que percorrem o campo (nunca "elástico"), menos dentro da mata. O mesmo vento move samambaias, copas, juncos, nuvens, neblina, névoa da cascata, poeira, aves.

- Som de brisa e vento proporcional, assobio leve na borda.
Critério de aceite: pular pelas 24 horas no relógio e ver cada fase sem saltos de cor, com a neblina, a Via Láctea às 3h e os meteoros às 21h funcionando.

## Especificação C — fauna
Regras gerais

- WildlifeManager com uma classe por espécie, zonas por KML e horários preferenciais.

- Animais surgem a no máximo 20 m de um grupo ou do jogador, entrando pela vegetação fora do campo de visão.

- Distâncias: 20–12 m natural, menos de 12 m alerta, menos de 8 m (ou alguém correndo) se afasta e some. Serpentes e sapinhos têm distâncias próprias.

- Ninguém alimenta, toca ou chama animal. Interação só por foto (galeria com espécie, data e hora do jogo; conquistas por distância respeitosa).

- Quando há guia, o grupo para e o guia explica em 3 a 5 balões: que animal é, como vive, habitat e alimentação, uma regra de conduta.

- Painel F3 com espécies ativas e motivo quando uma não nasce. Garantia de avistamento nos primeiros minutos perto de cada zona.

- Sem predação visível entre mamíferos. Única predação permitida: gaviões capturando serpentes, sem sangue.
Espécies

| Espécie | Zona | Horário | Comportamento-chave |
|---|---|---|---|
| Lobo-guará | Arredores do recebimento | Mais no crepúsculo e noite, também de dia | Solitário, andar alto, fareja, foge trotando; várias aparições por dia |
| Leão-baio (onça-parda) | Margens de rios e arroios, fundo do cânion | Crepúsculo e noite | Raro, mas 1 aparição garantida por dia; bebe água, encara 1–2 s, some na mata ciliar; espanta o lobo-guará se cruzar com ele |
| Graxaim-do-campo | Dentro e ao redor do estacionamento | Fim de tarde, noite, também de dia | 1 a 3 ativos, zigue-zague, fareja lixeiras, menos arisco; 2 variações de cor |
| Capivara + 3 filhotes | Seguindo o curso dos rios | Manhã e fim de tarde | Pastam, nadam; ao ver o leão-baio a mãe late e a família se esconde na água só com a cabeça para fora |
| Jararaca | Trilha perto de água e mata | Fim de tarde e noite | Cruza a trilha nos dois sentidos; pessoas param e esperam |
| Urutu-cruzeiro | Trilha no campo e banhado | Horas quentes | Cruz clara na cabeça; mesma regra de travessia |
| Cobra-coral | Borda de mata e perto do estacionamento | Dia | Anéis vermelho, preto e branco; esconde a cabeça e levanta a cauda |
| Gavião-tesoura | Céu sobre o cânion | Horas quentes | Casal ou dois casais em círculos; paira e captura serpente, leva para a encosta |
| Gavião-de-cauda-curta | Céu | Dia | Solitário, rápido, poucas curvas; rasante e leva a serpente ao fundo do cânion |
| Gavião-de-rabo-branco | Céu e placas longe de visitantes | Dia | Mais rápido; pousa em placa, decola se alguém chega a 25 m |
| Andorinhas (300) | Vão do cânion, 50–200 m dos cabos | Manhã e fim de tarde | Revoada em ondas (boids); fogem do monomotor; à noite nas fendas |
| Sapinhos M. cambaraensis e M. dorsalis | Turfeira (mais no meio) e margens do Arroio do Graxaim | Dias úmidos | Casais, andam mais do que pulam, mostram a barriga vermelha |
| Aves da mata e do campo | Capões e campos | Coro ao amanhecer | Gralha-azul, papagaios, pica-pau, quero-quero, curicacas; silêncio quando há predador |

Conflitos (sem violência): leão-baio espanta o lobo-guará; graxaim cede ao lobo-guará; gralhas acossam gaviões; quero-quero dá rasantes perto do ninho.
Realismo: silhuetas fiéis, pelagem e penas por textura, esqueleto animado, patas sem deslizar, corpo acompanhando a inclinação. Andorinhas por InstancedMesh com asa no vertex shader e grade espacial.

## Especificação D — pessoas e NPCs
Visual de todos os humanos

- Rostos com olhos, sobrancelhas, nariz, boca e orelhas; piscar, olhar, boca mexendo ao falar. Variedade de pele, idade, cabelo e barba.

- Corpos arredondados com proporções reais, roupas com caimento, esqueleto animado (andar, parado, gestos, apontar, sentar, ajoelhar com o joelho no chão, carregar maca, fotografar).

- Uniformes e logos nunca espelhados. LOD em 3 níveis e animação espaçada de longe.
Visitantes

- Famílias (avós e carrinho de bebê em trechos planos), grupos escolares (dias úteis, 8h30–16h, com professores e guia), mochileiros solitários, casais de idosos (passo lento, bastão), casais jovens (selfies).

- Quantidade pelo horário: quase nenhum de madrugada, pico de manhã e início da tarde. Todos saem até 18h (a partir das 17h voltam ao estacionamento).

- Falas sobre a beleza do Cânion Fortaleza, variando com hora e neblina. Reações a vento, aviões, meteoros, fauna.

- Perguntas ao jogador: "[E] Responder" abre 2 a 4 opções (uma melhor). Exemplos: distância ao mirante, banheiro, segurança da tirolesa, duração da descida, que bicho é, alimentar graxaim, neblina, pacote de fotos, ir até a borda. Reação conforme a resposta e pontuação "Atendimento ao Visitante".
Guias e condutores

- Colete ou camiseta de identificação, chapéu, rádio. Grupos de 4 a 12 em formação natural, paradas interpretativas (basalto, Aparados da Serra, Mata de Araucárias, turfeira, nascentes, Sphagnum, fauna, segurança).

- Param o grupo para fauna, serpentes e passagem de emergência.
Equipe ICMBio (10)

- 3 camionetes com textos "Parque Nacional da Serra Geral" e logos ICMBio (fotos de referência). No estacionamento: 2 de colete preto e chapéu (homem e mulher), 1 de camiseta preta, 4 de camiseta verde. Na trilha: 3 de camiseta verde em ronda contínua das 8h às 17h30.

- Logo grande nas costas e pequena no peito esquerdo, em todos.

- "[E] Conversar": O que é o ICMBio, regras, fauna, turfeiras e Sphagnum, sapinhos, melhor horário, segurança. Conquista "Amigo do Parque".
Bombeiro civil

- Uniforme vermelho, faixas refletivas; capacete de moto VERMELHO ao embarcar, rosto visível. Quadriciclo vermelho e preto (fotos de referência).

- Ao lado da ambulância; espera o último visitante sair para encerrar o turno.
SAMU 192 (5 socorristas)

- Ambulância nunca entra na trilha. Maca de resgate tipo "Mamute".

- Vítima deitada de barriga para cima: perna do pé torcido RETA e enfaixada, a outra dobrada com o pé no chão. Socorristas ajoelhados dos dois lados. Faixa branca visível até a ambulância.

- Descida bem devagar, 4 carregam, 1 atrás consolando a vítima; desvio de animais peçonhentos.
Pit e equipe da tirolesa

- Pit (resgatista): companheiro do jogador no Dia 1, fala o tempo todo, flechinha vermelha quando visto de longe. Operadores com flechinhas laranja.

- 2 Fiat Uno brancos (estilo, sem logos de montadora) da Serra Geral Vertical no estacionamento.

## Especificação E — veículos, aviões e eventos

| Evento | Quando | Como deve acontecer |
|---|---|---|
| Monomotor | Todo dia 10:00 | Asa alta, sem marcas reais; ~300 m acima da borda; ~1 a cada 3 dias desce até 120–150 m (irregular, NPCs e ICMBio comentam e registram); som com Doppler e eco; andorinhas e fauna fogem |
| Avião de passageiros | A cada 2 h a partir das 7:00 | ~3.000 m, sem rastro de condensação, luzes de navegação e strobe à noite, som atrasado e distante |
| Meteoros | 21:00 | Ver Especificação B |
| Emergência com bombeiro + SAMU | 9:50 torção, 10:00 saída (desligada no Dia 1) | Torção no mirante perto do lançamento → bombeiro sai de quadriciclo (desvia de pessoas pelo campo, nunca por mata, banhado ou borda) → atende e chama o SAMU → SAMU sobe a pé correndo (3 na frente, 2 com a maca), ~4 min → atendimento ~3 min → descida bem lenta em comboio com o quadriciclo na frente → ambulância sai pela estrada para Cambará e volta 1 h depois |
| Fim do dia | 17:00–18:00 | Visitantes saem; bombeiro espera o último sair |
| Boitatá | Meia-noite, só com a missão ativa | Ver Especificação G |

Localização dos aviões (obrigatório)

- Rotas visíveis da trilha, do mirante, do lançamento e do recebimento.

- Ícone no minimapa e no mapa grande com direção de voo; aviso no terminal ~1 min real antes; seta na borda da tela quando fora da visão.
Veículos

- Camionetes do ICMBio (3), Unos da Serra Geral Vertical (2), quadriciclo, ambulância SAMU, carros de visitantes, carroças e caminhões antigos só depois do pórtico da Vila Santana.

- Todos apoiados no terreno, rodas girando, faróis à noite, colisão, rotas pela estrada do KML.
Terminal de mensagens (embaixo do minimapa)

- Verde: missões. Laranja: ações na tirolesa. Vermelho: emergências e resgates. Azul: clima e natureza. Roxo: sobrenatural. Branco: geral.

- Últimas 4 a 6 mensagens com horário do jogo, histórico expansível.
Teclas de debug esperadas: F3 painel, F6/F7/F8 fauna, F9/Shift+F9 monomotor, F10 passageiros, F11 meteoros, F12 emergência, P copiar posição, M mapa grande, J missões.

## Especificação F — Dia 1 com Pit e Missões 1 a 8
O jogador é o novo Líder de Operações da Tirolesa Mais Alta das Américas no primeiro dia de trabalho. Pit acompanha todas as missões. Sistema de missões orientado a dados (/data/missoes/), tecla J, marcador do objetivo no mundo e no minimapa, salvamento do progresso. Reaproveitar os checklists e procedimentos REAIS que já existem no projeto, sem inventar procedimento técnico; o que faltar fica "a definir".

| Missão | Horário | O que acontece | Conclui quando |
|---|---|---|---|
| 1 — Descer na tirolesa | 6:00 | Carona com Pit da praça de Cambará num Uno da Serra Geral Vertical → estacionamento → Trilha do Mirante até o lançamento → botão "Realizar Atividade" → ouve o procedimento dos operadores e desce com a câmera do pacote mídia (modo foto com "Salvar foto") | Chega ao recebimento; libera "Operar na Tirolesa" |
| 2 — Treinamento no recebimento | 7:00 | Instrutor + Pit, todos os checklists do recebimento | Todos os checklists feitos |
| 3 — Treinamento no lançamento | 7:40 | Caminhar até o lançamento, todos os checklists | Libera viagem rápida aos locais de missão |
| 4 — Inspeção diária | 8:00–8:55 | Pintura dos clips, inclinômetro em todos os cabos, checklist do trolley, capacetes, cadeirinhas, mosquetões, deck do recebimento, documentos da inspeção do lançamento | Operação liberada até 8:55 (falha se passar; repete outro dia) |
| 5 — Receber clientes | 9:00 | Cliente 1 sem vento; cliente 2 com vento e extração simples; cliente 3 com vento forte para no vão e Pit faz extração moderada com o cinto | Fim do procedimento do cliente 3 |
| 6 — Almoço | 12:00 | Refeitório (provisório perto da base se não existir) | Interagir com a mesa |
| 7 — Operar o lançamento | 13:00 | Tela "Iniciar Turno" no lançamento; lançar 3 clientes; câmera de trás com o cliente comemorando depois de ~30 m; flechinhas laranja (operadores) e vermelha (Pit) visíveis a ~720 m; terminal narrando; cliente 2 para perto do cercado (extração simples); cliente 3 extração moderada | Fim do procedimento do cliente 3 |
| 8 — Ir embora | ~17:30 | Descer a trilha, encontrar o SAMU com 3 carregando, assumir um canto da maca (ritmo bem lento, nível da maca, pausas), ajudar a colocar na ambulância, voltar com a equipe num Uno até a praça | Chegada à praça; Pit faz o resumo do dia |

Regras do Dia 1

- Modo jornada (relógio lento) e "Avançar até" nos intervalos.

- Emergência das 10h desligada só no Dia 1. Monomotor, fauna e visitantes continuam e Pit comenta.

- Ajustes futuros (não fazer): formato real da plataforma de lançamento (desenho) e animação do gatilho (vídeo).

- Missões 9 e 10 e as das vilas: cadastradas como "em breve".

## Especificação G — áreas especiais, personagens míticos e senhas
Cidade e praça

- Praça = polígono "área praça da cidade" (~75 × 110 m), com Sequoia Lunar (árvore mais alta, casca avermelhada, canteiro, placa) e Urna do Tempo (pedestal, brilho pelas frestas) nas posições do KML. Ponto de carona para o cânion na borda da praça.

- Pisar na praça → raio na Sequoia → libera Tupã. Abrir a Urna → libera Sepé Tiarajú.
O "outro tempo" (anos 50)

- Estrada da cidade → Vila Oswaldo Kroeff (tempo atual, livre) → PÓRTICO com portão trancado na entrada da Vila Santana → Vila Santana 1950 → Antiga Floresta da Olaria → área industrial → fábrica Cambará S/A (papel) → Vila Ouro Verde.

- Passar do pórtico exige personagem autorizado (Sepé ou Tupã; Atiara na área industrial) + senha. Depois do pórtico: só elementos de época (carroças, caminhões antigos, roupas da década de 50).

- Floresta: araucárias centenárias gigantes, pontos encantados (vaga-lumes, fungos luminosos) e 3 a 5 pontos amaldiçoados (árvores mortas, névoa arroxeada, silêncio), ruínas da olaria, Árvore Anciã, minimapa só do que foi explorado.

- Área industrial: serrarias a vapor, pátio de toras de araucária, fábrica de papel da Cambará S/A (toras → polpa → máquina de papel → bobinas), frente de desmatamento com estágios, Vila Ouro Verde em "U" em volta da fábrica.

- Referência histórica: a Cambará S/A aparece registrada desde 1942. A Cachoeira Ouro Verde (~15 m, piscina natural) fica logo depois da fábrica de papel: candidata a entrar no cenário quando eu confirmar a posição.

- Fotos de época: vou anexar fotos que eu conseguir (grupo "História do Ouro Verde", museu municipal). Usar só como referência de forma, nunca como textura dentro do jogo.
Personagens míticos (representação respeitosa, sem caricatura; fotos de referência)

- Tupã: o deus criador; desceu num redemoinho, moldou o primeiro humano do barro; força nos raios, trovões e chuva. Poder supremo após o tesouro (proposta: trovão que imobiliza sem ferir, redemoinho, Chuva da Vida).

- Anhangá: "espírito, sombra, alma" em tupi; nem bom nem mau; veado branco gigante com olhos de brasa; vira tatu, boi, peixe grande ou figura humana; pune a ganância com ilusões.

- Gritador: alma do homem que marcava no grito os tesouros enterrados pelos jesuítas; grito agudo com cascos e cães; nunca responder (tecla G de gritar; se responder, ele vem rápido e causa desorientação). Proposta: respostas dele servem de pista do tesouro; "eliminar" = libertar a alma.

- Boitatá: "cobra de fogo", guardião contra queimadas e lenhadores; cai como bola de fogo à meia-noite na mata fechada da olaria; olhar nos olhos cega e confunde; vira tronco em chamas; fogo-fátuo raro sobre a turfeira do parque no tempo atual.

- Atiara: semideusa, bloqueada até o tesouro; missão contra as serrarias e contra o Capa Preta.

- Nesta rodada: só visual, comportamento ambiente e ganchos. Combate e cenas finais ficam fora.
Senhas

- Vila Santana e os 8 operadores (vagas bloqueadas): só hash SHA-256 com salt próprio, página local para gerar o hash, limite de tentativas com espera crescente, nada em texto puro. Avisar que é proteção de jogo em site estático.

## Prioridades P0 a P6 (com critério de aceite)
Cada item só conta como feito quando o critério de aceite (→) for verificado com o jogo rodando.
P0 — ESTABILIDADE E CARREGAMENTO

- Console sem erros no site e no jogo. → Recarregar 3 vezes e abrir o jogo sem nenhum erro vermelho.

- Tela inicial sem vídeo; jogo só carrega ao clicar em CanyonFly, com barra de progresso. → Tamanho baixado na primeira visita e tempo de abertura medidos antes e depois.

- Gestão de Operações com as seções reais ativas; CanyonFly antes das opções bloqueadas (APR, Procedimento etc.). → Menu conferido.

- Leitor de KML por tipo e depois palavra-chave (Especificação A). → Console lista todos os Placemarks com a classe certa; praça não vira cidade; estrada não vira vila.

- Alinhamento real. → Lançamento, recebimento, estacionamento e trilhas sobre os pontos do KML; comprimento do cabo informado (~700–720 m).

- Colisão e terreno. → Correr contra 10 paredões e montanhas sem atravessar; subir e descer as 3 trilhas sem flutuar nem afundar; câmera nunca dentro do relevo.

- Varredura de paredes (buracos, faces invertidas, z-fighting, emendas). → Lista do que foi corrigido.

- Tecla P copia posição + lat/long + direção. → Colar num texto funciona.

- Desempenho. → FPS medido no estacionamento, trilha, mirante, turfeira, cidade e floresta; nenhum abaixo de 45 no desktop em qualidade média.
P1 — O QUE NÃO APARECE

- Fauna nascendo. → Causa explicada; F3 mostra espécies ativas; em 5 minutos reais perto de cada zona aparecem graxaim, lobo-guará e, no rio, leão-baio (forçar horário se preciso).

- Aviões. → Causa explicada; monomotor visto do mirante às 10h e jato às 7h, 9h, 11h; ícone no minimapa, aviso no terminal e seta funcionando.

- Visitantes variados com perguntas. → Os 5 tipos vistos na trilha em 1 dia de jogo; pelo menos 3 perguntas respondidas com reação diferente para resposta boa e ruim.

- SAMU corrigido. → Tempos ~4 e ~3 min; joelhos no chão; vítima com a perna lesionada reta e enfaixada até a ambulância.

- Dia 1 completo. → Jogar Missões 1 a 8 sem travar, com Pit junto e inspeção dentro do prazo das 8:55.
P2 — HUMANOS REALISTAS

- Rostos e corpos novos (Especificação D). → Print de perto de um visitante, um ICMBio, o bombeiro de capacete e o Pit, sem formas quadradas.

- Animações. → Andar, parar, gesticular, sentar, ajoelhar e carregar maca sem pés deslizando.

- Licenças. → /assets/LICENSES.md com a origem de cada modelo.
P3 — ANIMAIS REALISTAS

- Silhuetas fiéis (Especificação C). → Print de cada espécie reconhecível sem legenda.

- Locomoção. → Patas apoiadas, corpo inclinando no terreno, transições suaves andar → trotar → correr → parar.
P4 — AMBIENTE REAL

- Cânion na borda real com paredões naturais e liquens. → Vista do mirante e do lançamento sem blocos retos.

- Cascata Gravatá do Noivo no ponto real com água conectada até o Rio Tigre Preto. → Seguir a água do Arroio do Graxaim até o fundo sem cortes.

- Vegetação e vento. → Capim em ondas suaves, capões em camadas, turfeira com Sphagnum, sem queda de FPS.

- Céu. → Pular as 24 horas sem saltos; Via Láctea às 3h; meteoros às 21h; neblina no fundo do cânion.
P5 — POLIMENTO DAS MISSÕES

- Falas do Pit, cores do terminal, flechinhas, câmera do cliente comemorando, salvar foto. → Missão 7 mostra tudo isso.
P6 — SE SOBRAR CRÉDITO

- Visual das áreas especiais e dos personagens míticos com as fotos de referência (Especificação G). → Prints da Vila Santana, floresta, área industrial, Tupã, Anhangá, Gritador e Boitatá.

## Fora do escopo, entrega e continuação
FORA DO ESCOPO DESTA RODADA (não fazer, só manter funcionando)

- Combate, imobilização e cenas finais das missões de Tupã, Sepé, Atiara, Gritador, Lobisomem e Boitatá.

- Reconstrução detalhada da Vila Santana anos 50, das ruas da cidade e da praça real.

- Os 8 personagens dos operadores (vagas bloqueadas continuam como estão).

- Formato real da plataforma de lançamento e animação do gatilho (vou enviar desenho e vídeo).

- Missões novas além das já cadastradas.
ENTREGA AO FIM DE CADA BLOCO

- Commits pequenos e push no GitHub.

- Atualizar /docs/PROGRESSO.md com: itens feitos, itens pendentes, o que falta eu enviar, problemas encontrados e o próximo passo.

- Me responder em até 10 linhas: o que mudou, como testar (teclas de debug), FPS medido e qualquer causa de bug que descobriu (fauna, aviões, paredes).

- Parar e esperar meu "continue".
PROMPT DE CONTINUAÇÃO (para a segunda metade dos créditos)

```

```
Para o prompt de continuação funcionar, peça na primeira sessão: "Salve este prompt mestre em /docs/PROMPT-MESTRE.md".

---

## COMPLEMENTO (recebido em 28/10/2026) — Missões 9 a 20 no Cânion Fortaleza + câmera com mira automática e download

(Use o sistema de missões, o terminal, o vento, a neblina, a fauna, os NPCs, o ICMBio, o modo foto e o controle de PS3 já criados. Procedimentos técnicos da tirolesa: reaproveitar os que JÁ EXISTEM no projeto; o que faltar fica "a definir" e me avise. Limites de vento e neblina para pausar a operação: constantes configuráveis, eu defino os valores reais depois.)

### PARTE 1 — Câmera: mira automática e download

**Mira automática ao abrir o modo foto**
- Ao abrir a câmera (F / Quadrado), o jogo escolhe automaticamente o alvo mais relevante no campo de visão e gira a câmera suavemente (~0,4 s) para centralizá-lo, ajustando o zoom para enquadrar o alvo inteiro com margem.
- Prioridade de alvos: animal mais próximo do centro da tela → aeronave → evento (meteoro, revoada, Boitatá, fogo-fátuo) → ponto marcante (cascata, Sequoia Lunar, Urna do Tempo, mirante) → NPC com quem o jogador está interagindo. Só alvos visíveis (sem obstáculo na frente) e dentro de ~150 m (aviões e céu sem limite).
- Alvos em movimento: a mira acompanha suavemente enquanto o modo foto estiver aberto.
- Trocar de alvo: Q / E no teclado, L1 / R1 no controle. Um contorno discreto e o nome do alvo aparecem no canto ("Lobo-guará — 18 m").
- Mira livre: tecla T / R3 liga e desliga a mira automática. Com ela desligada, o jogador mira com o mouse ou analógico como antes. A preferência fica salva.
- Respeitar as regras de distância da fauna: a mira nunca aproxima o jogador do animal, só o zoom.

**Baixar a foto no dispositivo**
- Depois de tirar a foto, aparece uma prévia com os botões: "Baixar no dispositivo", "Salvar na galeria do jogo" e "Descartar".
- "Baixar no dispositivo": gera um PNG em alta resolução (sem a HUD) e baixa pelo navegador com nome descritivo, ex.: `canyonfly_lobo-guara_2026-10-28_06h40.png` (data e hora do jogo).
- No celular, se o navegador suportar, usar o compartilhamento nativo (Web Share API) para salvar na galeria; senão, download comum.
- Na galeria do jogo, cada foto também tem o botão "Baixar".
- Controle de PS3: X confirma, Triângulo baixa, Círculo descarta.

### PARTE 2 — Missões 9 a 20

Todas no Cânion Fortaleza, depois do Dia 1, com o jogador como Líder de Operações. Cada missão começa num dia de jogo novo (Dia 2 em diante), usa o modo jornada quando precisar e libera viagem rápida aos locais.

**MISSÃO 9 — Dia de neblina**
- O dia começa com o cânion cheio de neblina (viração). Clientes chegam ao recebimento e esperam.
- O jogador consulta o terminal e decide: manter a operação parada, informar os clientes (diálogo com opções) e reorganizar a fila.
- A neblina abre no meio da manhã (evento), o jogador libera a operação e lança os clientes que esperaram.
- Conclui quando todos os clientes da fila forem atendidos ou remarcados.

**MISSÃO 10 — O vento muda à tarde**
- Operação normal à tarde, com o vento crescendo aos poucos (sistema de vento).
- O jogador acompanha o terminal e as extrações no recebimento e decide o momento de suspender os lançamentos quando o vento passa do limite configurado.
- Decisão cedo demais ou tarde demais tem consequência (clientes insatisfeitos ou mais extrações). Pit comenta a decisão.

**MISSÃO 11 — Dia de lotação**
- Feriado: grupos escolares, famílias, excursões e casais ao mesmo tempo.
- Objetivos: manter a fila andando, responder pelo menos 8 perguntas de visitantes, organizar a espera no recebimento e no lançamento.
- Pontuação pelo tempo médio de espera e pelo "Atendimento ao Visitante".

**MISSÃO 12 — Treinar um operador novo**
- Agora o jogador é o instrutor: acompanha um operador novo (NPC) nos checklists do recebimento e do lançamento, corrigindo quando ele erra (escolhas de diálogo).
- O operador novo comete 2 ou 3 erros sorteados nos checklists. O jogador precisa perceber e orientar.

**MISSÃO 13 — Ronda com o ICMBio**
- Acompanhar os 3 de camiseta verde na ronda pela trilha.
- Orientar visitantes perto da borda, recolher lixo (3 pontos), registrar uma placa danificada.
- Termina no mirante com a equipe agradecendo.

**MISSÃO 14 — Censo de fauna**
- Fotografar, em um dia de jogo, lobo-guará, leão-baio, graxaim-do-campo, capivaras e um gavião, todos a distância respeitosa (a mira automática ajuda).
- Cada foto entra num "caderno de campo" na galeria, com espécie, hora e local.

**MISSÃO 15 — Proteger a turfeira**
- Um grupo de visitantes sai da trilha e entra no banhado.
- O jogador vai até eles, conversa com calma (diálogo com opções, as rudes pioram a situação) e leva o grupo de volta pela passarela, explicando o Sphagnum e as nascentes.

**MISSÃO 16 — Graxaim no lixo**
- Visitantes estão alimentando o graxaim no estacionamento.
- O jogador conversa com eles (explicando atropelamento e doenças), avisa o ICMBio e ajuda a trocar duas lixeiras abertas por lixeiras fechadas.

**MISSÃO 17 — Monomotor voando baixo**
- Às 10h o monomotor passa em voo baixo.
- O jogador fotografa a aeronave (mira automática), anota horário e direção e entrega o registro para a equipe do ICMBio no estacionamento.

**MISSÃO 18 — Visitante perdido na neblina**
- Fim de tarde com neblina. Um visitante se afastou da trilha e não voltou.
- O jogador organiza a busca com Pit e a equipe pelo rádio, procura pistas (pegadas, objeto caído), encontra o visitante e o traz de volta pela trilha.
- Regras: ninguém se aproxima da borda; a busca segue pelos caminhos seguros.

**MISSÃO 19 — Serpente no deck**
- Uma jararaca aparece perto do recebimento durante a operação.
- O jogador pausa a operação, afasta as pessoas, mantém distância e espera a serpente sair sozinha para a vegetação. Guia ou ICMBio explica a espécie.
- Conclui quando a serpente sai e a operação volta.

**MISSÃO 20 — Noite de meteoros**
- Evento especial do parque à noite, com grupo autorizado de visitantes no mirante (exceção à regra das 18h, só nesta missão).
- O jogador conduz o grupo com lanterna pela trilha, apresenta a Via Láctea e acompanha a chuva de meteoros às 21h.
- Objetivo extra: fotografar um bólido.
- Termina com todos de volta ao estacionamento em segurança.

**Regras gerais das missões**
- Cadastrar todas no sistema de missões, em sequência, com objetivos em etapas e mensagens no terminal (verde missão, laranja tirolesa, vermelho emergência, azul natureza).
- Pit acompanha quando fizer sentido e comenta o desempenho no fim de cada uma.
- Debug: tecla para iniciar cada missão direto.

### ENTREGA do complemento
- Commits separados: mira automática, download de fotos, e um commit por missão. Push no GitHub.
- Teste: abrir a câmera perto de um animal, de um avião e da cascata e ver a mira automática; baixar uma foto no computador; jogar pelo menos as Missões 9, 14 e 18 do começo ao fim.
- Console sem erros e FPS estável.
