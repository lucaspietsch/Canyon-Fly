/* ============================================================================================================
   CONSTANTES AJUSTÁVEIS DO MUNDO VIVO
   Tudo que dá para "afinar" fica aqui: distâncias, probabilidades, horários, zonas, tamanhos dos grupos e do minimapa.
   Distâncias em METROS (o 3D usa 1 m = 2,94 u; a conversão é feita no código). Horas em horas do relógio do jogo (0–24).
   ============================================================================================================ */

/* ESCALA DO TEMPO: 1 hora de jogo = 30 s reais (1 dia = 12 min). Mude aqui. */
export const GAME_TIME_CONFIG = { realSecondsPerGameHour: 30, saltoSeg: 1.5 };

export const U = 2.94;
export const m2u = (m) => m * U;

/* curva de horário: pares [hora, peso 0–1], interpolada em volta do dia (0 h = 24 h) */
export const pesoHora = (curva, h) => {
  const c = curva; for(let i = 0; i < c.length - 1; i++){ if(h >= c[i][0] && h <= c[i + 1][0]){ const t = (h - c[i][0]) / (c[i + 1][0] - c[i][0] || 1); return c[i][1] + (c[i + 1][1] - c[i][1]) * t; } }
  return c[c.length - 1][1];
};

export const FAUNA = {
  /* distâncias de comportamento, iguais para todas as espécies (cada espécie multiplica por `fatorDist`) */
  distancias: { natural: 20, alerta: 12, fuga: 8 },
  spawnMax: 20,                // o animal surge a no máximo 20 m de um grupo de visitantes (ou do jogador)
  raioAtivo: 90,               // m: só se simula/sorteia animal perto do jogador; mais longe que isso ele some
  intervaloSorteio: 5,         // s (tempo real) entre um sorteio de avistamento e outro
  corridaFuga: 11,             // u/s: o jogador "correndo na direção" do animal acima dessa velocidade assusta
  distSegura: 40,              // m: o animal que fugiu some quando passa dessa distância (ou sai do campo de visão a mais de 20 m)
  lod: { longe: 45, muitoLonge: 90 },     // m: animação simplificada / atualização a cada N quadros
  conquistas: { respeitosa: 12 }          // m (× fatorDist): foto a esta distância ou mais conta como "respeitosa"
};

/* espécies: zona de ocorrência (ver fauna/zonas.js), horários, chance, cooldown e duração do avistamento (tempo real, em segundos) */
export const ESPECIES = {
  capivara: { id: "capivara", nome: "Capivara", zona: "agua", max: 4, fatorDist: 1, chance: .22, cooldown: [150, 320], duracao: [150, 260], horas: [[0, .15], [4.5, .5], [6, 1], [9, .7], [11, .25], [15, .25], [16.5, .8], [18.5, 1], [20, .4], [24, .15]], anda: 1.0, trota: 3.4 },
  lobo: {
    id: "lobo", nome: "Lobo-guará", zona: "recebimento", max: 1, fatorDist: 1,
    chance: .10,                                         // probabilidade por sorteio (já multiplicada pelo peso da hora)
    cooldown: [180, 360],                                // s entre avistamentos da espécie
    duracao: [55, 110],                                  // s que ele fica por perto antes de ir embora sozinho
    horas: [[0, .7], [4.5, .85], [5.5, 1], [7, .55], [8.5, .1], [16, .1], [17, .6], [18, 1], [20, 1], [22, .85], [24, .7]],
    anda: 1.25, trota: 4.6                               // m/s
  },
  puma: {
    id: "puma", nome: "Leão-baio", zona: "agua", max: 1, fatorDist: 1,
    chance: .022,                                        // evento RARO: mude aqui
    cooldown: [600, 1200], duracao: [15, 40],            // avistamento curto
    horas: [[0, .6], [4.5, .7], [5.8, .9], [7.5, .05], [16.5, .05], [17.5, .8], [19.5, 1], [22, .7], [24, .6]],
    anda: .9, trota: 5
  },
  graxaim: {
    id: "graxaim", nome: "Graxaim", zona: "estacionamento", max: 2, fatorDist: .7,
    chance: .2, cooldown: [100, 220], duracao: [60, 120], dupla: .3,
    horas: [[0, .75], [4.5, .6], [6, .3], [8, .18], [15, .22], [17, .7], [19, 1], [22, .9], [24, .75]],
    anda: 1.5, trota: 5.4
  },
  /* ---- mais bichos de Cambará do Sul (Aparados da Serra). Cada um tem zona, horas e chance próprias: ajuste aqui ---- */
  veado: {
    id: "veado", nome: "Veado-campeiro", zona: "recebimento", max: 1, fatorDist: 1.3,
    chance: .07, cooldown: [200, 420], duracao: [50, 100],
    horas: [[0, .2], [4.5, .6], [6, 1], [8, .45], [15, .2], [17, 1], [19, .6], [22, .2], [24, .2]],
    anda: 1.1, trota: 7
  },
  quati: {
    id: "quati", nome: "Quati", zona: "estacionamento", max: 3, fatorDist: .6,
    chance: .16, cooldown: [120, 260], duracao: [60, 130], dupla: .65,
    horas: [[0, 0], [6, .25], [8, 1], [12, .75], [16, 1], [18, .3], [19, 0], [24, 0]],
    anda: 1.3, trota: 5
  },
  gamba: {
    id: "gamba", nome: "Gambá-de-orelha-branca", zona: "estacionamento", max: 1, fatorDist: .5,
    chance: .14, cooldown: [150, 300], duracao: [40, 90],
    horas: [[0, .8], [4.5, .4], [6, 0], [18, 0], [19.5, .7], [21, 1], [24, .8]],
    anda: .8, trota: 3.2
  },
  lontra: {
    id: "lontra", nome: "Lontra", zona: "agua", max: 1, fatorDist: .8,
    chance: .05, cooldown: [300, 600], duracao: [30, 70],
    horas: [[0, .3], [5, .7], [7, .4], [16, .4], [18, .8], [20, .5], [24, .3]],
    anda: 1, trota: 4.4
  }
};

/* família de capivaras (1 adulta + 3 filhotes) */
export const CAPIVARAS = {
  chance: .22, cooldown: [150, 320], duracao: [150, 260],
  horas: [[0, .15], [4.5, .5], [6, 1], [9, .7], [11, .25], [15, .25], [16.5, .8], [18.5, 1], [20, .4], [24, .15]],   // mais ativas no início da manhã e no fim da tarde
  alerta: 8, observa: 20,              // m: observa até 20, o latido e a fuga para a água a menos de 8
  percepcao: 40, saiAlcance: 60,       // m: o leão-baio a 40 m (perto do rio) faz a família se esconder; só volta quando ele passa de 60 m
  escondidaSeg: [20, 40],              // s de jogo escondida depois que o perigo passou
  chanceEncontro: 1,                   // probabilidade do encontro quando o leão-baio nasce com a família por perto (0–1)
  anda: 1.0, trota: 3.4                // m/s
};

/* HORÁRIO DO PARQUE: ninguém entra depois de `voltaIni`; cada grupo escolhe uma hora de saída entre `voltaIni` e `fecha`; quem ainda estiver à vista depois disso
   continua a caminho do estacionamento (o bombeiro espera o último sair) e acelera um pouco. `limiteSaida` (h): depois disso, retardatários longe do jogador somem. */
export const PARQUE = { abre: 6, voltaIni: 17, fecha: 18, limiteSaida: 1.5, aceleraAposFechar: 1.35 };

/* visitantes, guias e grupos escolares */
export const GENTE = {
  max: 96,                                               // capacidade do pool (instâncias)
  populacao: [[0, 0], [4.5, 0], [5.6, 2], [6.5, 6], [8, 16], [9.5, 26], [11, 36], [13, 36], [14.5, 28], [16, 16], [17, 8], [17.6, 3], [18, 0], [24, 0]],   // pessoas-alvo por hora
  fimDeSemana: 1.3,                                      // multiplicador sáb/dom
  escolar: { dias: [1, 2, 3, 4, 5], de: 8.5, ate: 16, max: 2, tamanho: [8, 14] },
  guiado: { tamanho: [4, 12], chance: .35 },
  velocidade: [3.2, 4.2],                                // u/s a pé (≈ 1,1–1,4 m/s)
  falaPerto: 8,                                          // m: balões de conversa aparecem quando o jogador está a até 8 m
  falaGuiaAnimal: 15,                                    // m: balões do guia no avistamento (legíveis até 15 m)
  balaoSeg: 4,                                           // s por balão
  atualizaLonge: [4, 10]                                 // IA a cada N quadros: longe / muito longe
};

export const MAPA = { tamanho: 176, zoom: [.18, .3, .5, .8, 1.3], zoomInicial: 2, hz: 10, avistadoSeg: 8, raioVisao: 45 };

/* camionetes do ICMBio (estacionamento) */
export const CAMIONETES = {
  giroflexNoite: false,                     // true: o sinalizador do teto pisca à noite
  faroisNoite: true,
  // posições no sistema local do estacionamento (lx, lz), giro (rad) e variações
  vagas: [{ numero: "01", placa: "SGV1A23", lx: 100, lz: 26, giro: -Math.PI / 2 + .16, aberta: true }, { numero: "02", placa: "SGV2B34", lx: 100.5, lz: 36, giro: -Math.PI / 2 - .06, suja: true }, { numero: "03", placa: "SGV3C45", lx: 102, lz: 46, giro: -Math.PI / 2 + .3 }],
  saemNoite: false                          // true: somem às 18h junto com a equipe
};

/* VIA LÁCTEA: visível de 21:30 (tênue) até ~4:30; pico às 3:00; curva suave (expoente > 1 = começa devagar). `forca` multiplica o brilho. */
export const VIA_LACTEA = { ini: 21.5, pico: 3, fim: 4.5, expoente: 1.7, forca: 1.15 };

/* HORIZONTE DE MONTANHAS (paisagem distante, até 90 km): tudo ajustável aqui */
export const HORIZONTE = {
  ativo: true, distMaxKm: 90, distMinU: 5000, entradaU: 5200,           // alcance máximo e onde começa a malha distante (antes disso vale o cenário real)
  aneis: 112, setores: 960,                              // número de "camadas" radiais e resolução angular
  seed: 1977, picos: 320,                                // semente fixa: sempre a mesma vista
  alturaPicos: [1300, 5600], raioPicos: [2800, 13000],    // u
  hazeKm: 24,                                            // distância em que a perspectiva atmosférica já tomou ~60 % da cor
  cores: { rocha: [.46, .42, .37], mata: [.16, .31, .17], campo: [.62, .56, .33] }
};

/* SERPENTES cruzando a trilha: frequência (chance por segundo com o jogador por perto), horários, velocidade (m/s) e distâncias (m) */
export const SERPENTES = {
  especies: {
    jararaca: { id: "jararaca", nome: "Jararaca", comp: 1.0, raio: .03, v: .42, chance: .012, horas: [[0, .35], [6, .3], [11, .5], [15, .8], [17, 1], [20, 1], [24, .4]], zona: "água / borda da mata" },
    urutu: { id: "urutu", nome: "Urutu-cruzeiro", comp: 1.05, raio: .032, v: .38, chance: .012, horas: [[0, .2], [7, .4], [10, 1], [14, 1], [17.5, .9], [19, .3], [24, .2]], zona: "campos abertos" },
    coral: { id: "coral", nome: "Cobra-coral", comp: .7, raio: .012, v: .65, chance: .01, horas: [[0, .2], [6, .6], [9, .8], [16, 1], [19, .5], [24, .2]], zona: "borda da mata / perto do estacionamento" }
  },
  dist: { espera: 6, alerta: 2.5, fotoMin: 3, fotoMax: 10, cacaPessoas: 15 },     // m
  intervalo: 3, cooldown: [45, 110], maxAtivas: 2,                                    // s entre sorteios · s de pausa entre travessias · no máximo 1 por trecho de trilha
  defensivaVolta: 1.8                                                                // velocidade ×1,8 depois que a pessoa se afasta
};

/* ============================================================================================================
   BOMBEIRO CIVIL · QUADRICICLO · AMBULÂNCIA · EMERGÊNCIA DAS 10H  (tudo ajustável aqui; tempos em segundos REAIS, distâncias em metros)
   Observação sobre o tempo: o relógio do jogo anda 120× mais rápido que a vida real (1 h = 30 s) e as pessoas andam em tempo real. Para o resgate caber numa manhã,
   enquanto a emergência corre o relógio anda a `relogioFator` da velocidade normal (0,1 = 1 h de jogo vira 5 min reais). Use 1 para deixar o relógio correr solto.
   ============================================================================================================ */
export const EMERGENCIA = {
  ativo: true, horarios: [9 + 50 / 60], chance: 1,          // todo dia às 9:50 (queda); o chamado sai ~10:00
  relogioFator: .08,
  chamadoSeg: 9,                                           // s depois da queda: o bombeiro recebe o chamado no rádio e sai
  quad: { velSobe: 9, velDesvio: 3.6, velCaminhada: 1.3, detectaPessoas: 28, folgaPessoas: 6.5, aviso: true },   // m/s e m
  equipe: { velRapidos: 7.6, velMaca: 5.6, esperaMaca: 6 },
  atendimentoSeg: [30, 40],                                // exame/imobilização antes de chamar a equipe
  embarqueSeg: 16,                                         // transferência para a maca
  comboio: { vel: 1.25, quadAfasta: [6, 10], descanso: { ativo: true, em: .5, seg: 14 }, falaCada: [9, 16] },
  serpente: { folga: 5.5, avisaA: 30, esperaMax: 45 },     // m de folga ao desviar, m de distância em que o bombeiro avisa, s de espera máxima quando não há desvio seguro
  ambulancia: { vel: 14, rotaM: 260, sirene: "saida", sireneM: 220, retornoHoras: 1 },     // some ao sair do mapa (rotaM da estrada); volta 1 h de jogo depois de sair
  fimExpediente: { ativo: true, equipeSaiTambem: false, volta: 7.3 },    // h: o bombeiro volta antes da abertura
  conquista: { de: 12, ate: 60, seg: 20 }                  // "Socorro em Ação": assistiu de 12 a 60 m, sem atrapalhar, por 20 s
};
export const QUADRICICLO = { velMax: 10, acel: 3.2, freio: 6, giroMax: 1.6, ruidoVol: .5, poeira: true, rastroSeg: 45 };

/* ESTRADA provisória (do estacionamento, no sentido oposto ao mirante, em direção a Cambará do Sul). Será substituída pela do KML (ver resgate/kml.js). */
export const ESTRADA = {
  largura: 6, comprimentoM: 900, rumoGraus: 0, nome: "Estrada para Cambará do Sul",     // largura da pista (m): dois veículos · comprimentoM/rumoGraus: só da rota provisória (sem KML)
  compressao: .5,                  // 1 = comprimento real do KML · .5 = metade (a partir dos primeiros realM metros); tecla de depuração alterna 1× / 0,5×
  realM: 200,                      // m iniciais em escala real (saída do estacionamento e trecho ao lado da turfeira)
  raioMinM: 24, passoM: 9.5, passoMalhaU: 14,     // curva mínima p/ veículos (m) · espaçamento dos pontos da rota (m) · da malha da pista (u)
  acostamentoM: 1.2, valetaLarguraM: 1.6, valetaProfM: .4,   // acostamento de terra e valetas laterais
  corredorU: 450, bordaU: 250, quedaU: 14, ondulacaoM: 2.5,  // meia-largura do terreno em volta da estrada · descida até o horizonte · ondulação do chão (fora do platô)
  aterro: { alturaM: .75, distTurfU: 60 },                    // aterro elevado (com taludes) onde a pista chega a menos de distTurfU da turfeira
  bueiros: { espacoM: 36, diametroM: .8, comprimentoExtraM: 1.6 },   // tubos de concreto sob o aterro: a água passa de um lado para o outro
  cercas: { ativo: true, ladoM: 8.5, posteEspM: 5.5, fios: 3, portaoACadaM: 700, portaoLarguraM: 4.2 },   // cerca de arame com moirões de madeira, porteiras de tempos em tempos
  capoes: { ativo: true, espacoM: [260, 560], afastaM: [26, 130], raioM: [24, 56] },                    // capões de mata que acompanham a estrada (viram mata para as árvores)
  placa: { texto: "CAMBARÁ DO SUL", distanciaKm: 12 }       // placa na saída do estacionamento (distância real, escrita na placa)
};

/* KML do Google Earth: ponto de referência (lat/lon) que vira a origem do mundo (plataforma de chegada, "marcador" dos KML de trilhas); `rotacao` = rotação do mundo em relação ao norte (rad) */
export const KML = {
  ref: { lat: -29.06593937, lon: -49.96361203 }, rotacao: 1.14838, escala: 2.92723,       // ref = origem do mundo (calibrada com os KML do estacionamento/trilhas); rotacao (rad) e escala (u/m) já alinham o KML ao jogo
  /* ajuste fino opcional do KML inteiro: desloca (u) e gira (graus, sentido horário visto de cima) em volta do 1º ponto da estrada, sem mexer nos objetos do jogo */
  ajuste: { dx: 0, dz: 0, giroGraus: 0 },
  arquivoPadrao: "data/kml/parque.kml", arquivoDetalhes: "data/kml/parque-detalhes.kml",                                                    // lido em segundo plano ao iniciar (se o servidor entregar); o KML embutido (dados/kml-vegetacao.js) serve de reserva
  /* o TIPO vem de palavras-chave no nome da marca (ou da pasta). O nome é normalizado antes: minúsculas, sem acentos, letras repetidas viram uma ("mataaaa" = "mata", "aarea" = "area").
     A 1ª regra que casar vence (a ordem importa). Mande outros KML sem mexer no código: novos elementos completam ou substituem os de mesmo nome. */
  tipos: [
    /* ordem de prioridade (a 1ª que casar vence): lugares específicos antes dos genéricos — sequoia → urna → praça → cambará s/a (fábrica) → vila → olaria → parque industrial → turfeira/banhado → mata → estrada/rua → cidade.
       Cada tipo só vale para certas geometrias (KML.geom): L = linha, P = polígono, T = ponto — a geometria é conferida ANTES do nome ("estrada" nunca vira polígono, "mata" nunca vira linha). */
    ["sequoia", /sequoia/], ["urna", /\burna\b/], ["praca", /praca|plaza|largo/], ["fabrica", /cambara s a|\bfabrica|\bpapel\b|celulose cambara s a/], ["vila", /\bvila\b|vilarejo|\bvilla\b/],
    ["olaria", /olaria/], ["industrial", /industrial|celulose/],
    ["ponte", /ponte|bridge/], ["banhado", /turfe|banhad|brejo|alagad|wetland|varzea|pantan|umida|umido/], ["mataBaixa", /median|baix|capoeira|arbust/], ["mata", /mata|floresta|forest|bosque|capao/],
    ["trilha", /trilha|caminho|\bpath\b/], ["borda", /\bbord[ao]|\bbora\b/], ["lancamento", /lancamento/], ["recebimento", /recebimento/], ["estacionamento", /estacionamento|parking/], ["marcador", /marcador|local sem titulo/],
    ["rua", /\brua\b|\bruas\b|avenida|\bav\b/], ["estrada", /estrada|rodovia|road|\brota\b/], ["cidade", /cidade|cambara|area urbana|urbana|centro urbano/],
    ["nascente", /nascente|spring|olho d?agua|fonte/], ["riacho", /riacho|aroio|\brio\b|corego|ribeirao|stream|river/], ["lago", /lago|acude|represa|lagoa|lake/], ["campo", /campo|pasto|grass/]
  ],
  geom: { trilha: "L", borda: "L", lancamento: "P", recebimento: "P", estacionamento: "P", marcador: "T", sequoia: "P", urna: "P", praca: "P", fabrica: "P", vila: "P", olaria: "P", industrial: "P", banhado: "P", mataBaixa: "P", mata: "P", cidade: "P", campo: "P", lago: "P", ponte: "LP", rua: "L", estrada: "L", riacho: "L", nascente: "PT" }
};

/* ============================================================================================================
   QUALIDADE (baixa / média / alta): densidade de capim, árvores, samambaias, partículas da cascata e de aves, resolução dos paredões.
   Troque com ?q=baixa|media|alta no endereço, pela tecla F3 + Q (ciclo) ou gravando localStorage "sgv:qualidade". Padrão: média.
   ============================================================================================================ */
export const QUALIDADE = {
  baixa: { capimRaio: 70, capimDens: .45, capimMax: 90000, samambaia: .5, arvores: .55, particulasCascata: 90, aves: .5, paredeFator: 1.6, xaxim: .5 },
  media: { capimRaio: 110, capimDens: 1, capimMax: 220000, samambaia: 1, arvores: 1, particulasCascata: 220, aves: 1, paredeFator: 1.15, xaxim: 1 },
  alta: { capimRaio: 150, capimDens: 1.6, capimMax: 420000, samambaia: 1.5, arvores: 1.5, particulasCascata: 420, aves: 1.6, paredeFator: 1, xaxim: 1.5 }
};
export function qualidade(){
  let n = "media"; try{ const q = new URLSearchParams(location.search).get("q") || localStorage.getItem("sgv:qualidade"); if(q && QUALIDADE[q]) n = q; }catch(_){ /* sem URL/armazenamento */ }
  return { nome: n, ...QUALIDADE[n] };
}

/* ============================================================================================================
   VENTO GLOBAL (direção + intensidade + tempo, enviado como UM uniform a todos os shaders: capim, samambaias, copas, juncos, névoa, poeira...)
   Brisa leve na maior parte do tempo; de vez em quando a brisa sobe aos poucos até vento moderado, dura um tempo e volta; rajadas curtas dentro dos períodos de vento.
   ============================================================================================================ */
export const VENTO = {
  brisa: .22,                        // intensidade base (0–1)
  maximo: .78,                       // intensidade do vento moderado (0–1); rajadas passam disso até `rajadaMax`
  rajadaMax: 1,
  periodoSeg: [120, 420],            // entre períodos de vento (s reais)
  duracaoSeg: [20, 120],             // duração de cada período de vento (s reais)
  subidaSeg: [8, 25],                // quanto a brisa leva para virar vento (e para voltar)
  rajadaChance: .05,                 // chance por segundo de uma rajada durante o vento
  rajadaSeg: [1.5, 4],
  deriva: .02,                       // rad/s: a direção muda devagar
  tardeMais: .12,                    // soma de intensidade à tarde (13–18 h)
  bordaMais: .18,                    // a borda do cânion é mais ventosa
  mataMenos: .6                      // dentro da mata o vento chega com 40 % da força
};

/* ============================================================================================================
   TURFEIRAS (banhados), NASCENTES, PASSARELAS, PLACAS INTERPRETATIVAS — áreas vindas do KML ("turfeira"/"banhado"); sem KML: 2 turfeiras provisórias nos campos
   ============================================================================================================ */
export const TURFEIRA = {
  ativo: true,
  celulaMask: 4,                      // u por texel do mapa de poças/umidade
  almofada: .5, afunda: .3,           // u: altura das almofadas de musgo · quanto o pé afunda (câmera baixa um pouco)
  velFator: .5,                       // velocidade do jogador dentro da turfeira
  pegadaSeg: 80,                      // s para a pegada sumir
  nascentes: [1, 3],                  // por turfeira, na parte mais alta (se o KML não tiver pontos)
  nascenteNome: /nasc|fonte|olho/i,   // pontos do KML com esse nome são nascentes
  arroioGraxaim: /graxa/i,            // nome do curso d'água do KML que é o Arroio Graxaim (senão: o arroio do cenário)
  passarela: { largura: 4, altura: 1.35, margem: 14 },
  placaDist: 30,                      // m: placas onde a trilha passa a até 30 m de uma turfeira
  placaLeitura: 3,                    // m: "[E] Ler placa"
  guiaDist: 20,                       // m: o guia explica ao passar
  provisorias: 2
};

/* ============================================================================================================
   SAPINHOS Melanophryniscus (2–3 cm) nas turfeiras e no Arroio Graxaim — espécies, zonas e densidades configuráveis (trocar a espécie depois é só mexer aqui)
   Os sapinhos reais são minúsculos: `escalaVisual` os aumenta para poderem ser vistos (e fotografados) no jogo.
   ============================================================================================================ */
export const SAPINHOS = {
  ativo: true, raio: 25, max: 22, escalaVisual: 3.2, intervaloSpawn: .9,        // m: só existem e são simulados nesse raio · máximo de sapinhos ativos
  especies: {
    cambaraensis: { ativo: true, peso: .7, nome: "Sapinho-de-Cambará", cientifico: "Melanophryniscus cambaraensis", dorso: [.06, .045, .04], listra: null, vermelho: [.86, .16, .08] },
    dorsalis: { ativo: true, peso: .3, nome: "Sapinho Melanophryniscus dorsalis", cientifico: "Melanophryniscus dorsalis", dorso: [.1, .09, .05], listra: [.72, .52, .1], vermelho: [.9, .26, .06] }
  },
  zonas: { meio: { ativo: true, peso: .5, casal: .65 }, borda: { ativo: true, peso: .25, casal: .8, ateM: 15 }, arroio: { ativo: true, peso: .25, casal: .15 } },
  arroioNome: /graxa/i,                                   // linha do KML que é o Arroio Graxaim; sem ela, vale o arroio do cenário
  alerta: 3, foge: 1.6,                                   // u (≈ 1 m): arqueia e mostra a barriga · sai do caminho
  vidaSeg: [60, 160],
  peregrecas: { ativo: true, max: 5 }                      // pererecas verdes que aparecem pulando nas poças ao entardecer e à noite
};

/* ============================================================================================================
   AVES DA MATA E DO CAMPO (gralha-azul, papagaios, pica-pau, sabiá, passarinhos, tucano, quero-quero, curicaca, gavião) + coro do amanhecer
   Só existem num raio em volta do jogador. Quantidade e densidade × QUALIDADE.aves. Tudo em metros / segundos reais.
   ============================================================================================================ */
export const AVES = {
  ativo: true,
  raio: 95,                    // m: só se simula e se vê gente emplumada até aqui
  max: 46,                     // aves ao mesmo tempo (× qualidade.aves)
  intervaloSpawn: .6,          // s entre tentativas de aparecer uma ave/bando
  volume: .6,                  // volume geral das vozes (0–1)
  coro: { alvorada: 1, dia: .45, meioDia: .1, entardecer: .7, noite: 0 },   // intensidade do canto ao fundo por período (meio-dia fica quieto)
  fuga: { gralha: 16, papagaio: 20, picapau: 11, sabia: 9, passarinho: 6, tucano: 18, queroquero: 7, curicaca: 15, gaviao: 30 },   // m: distância em que levantam voo
  pesos: { gralha: 30, picapau: 9, sabia: 16, passarinho: 22, tucano: 2.2, queroquero: 20, curicaca: 11 },                         // sorteio de espécie no lugar (mata/campo)
  papagaios: { porMinuto: .7, grupo: [4, 9], alturaM: [26, 60], velocidade: 17 },    // revoadas de passagem ao amanhecer e ao entardecer
  gaviao: { porMinuto: .22, duracaoSeg: [14, 24] },                                  // gavião sobrevoa; se há gralhas por perto elas o expulsam
  quero: { raioNinhoM: 13, mergulhoSeg: [3.2, 5.5], mostraNinho: true },             // defesa do ninho: rasantes sobre quem chegar perto
  fotoDistM: 7,                // m: foto "respeitosa" de ave a partir daqui (conquista)
  noite: { coruja: true, anfibios: true }
};

/* ============================================================================================================
   CONFLITOS NATURAIS (sem violência, sem sangue): quem é maior avança e o outro se afasta; a mata fica em silêncio quando o leão-baio passa.
   ============================================================================================================ */
export const CONFLITOS = {
  ativo: true,
  chance: { pumaLobo: .35, graxaimLobo: .45, gralhaGaviao: .4 },    // chance de acontecer quando as duas partes existem por perto (0–1)
  cooldownSeg: [180, 420],     // entre conflitos
  silencio: { alcanceM: 90, duracaoSeg: [22, 38], raioAlarmeM: 70 },   // quando o leão-baio passa: aves dão alarme e a mata silencia
  aproximaM: 15,               // m: distância em que o menor percebe o maior
  fugaSeg: 8                   // duração da cena depois que o menor foge
};

/* ============================================================================================================
   CIDADE DE CAMBARÁ DO SUL (zona urbana em escala REAL) e zonas do mundo grande
   A cidade (e a vila) vêm do KML ("cidade"/"cambara", "vila"): o polígono é DESLOCADO para o fim da estrada comprimida, sem girar nem escalar (a rotação única do KML já vale).
   Até chegar o trecho real entre o fim do KML da estrada e a cidade, uma estrada PROVISÓRIA reta liga os dois (com a mesma compressão).
   ============================================================================================================ */
export const CIDADE = {
  ruas: { larguraM: 9, quadraM: 110, calcadaM: 2.2 },                   // ruas provisórias em grade (até chegarem as ruas do KML)
  praca: { nome: "Praça central (em construção)", ladoM: 48 },
  cargaU: 4200, descargaU: 6000,                                        // a cidade só existe (malha, ruas) quando o jogador está a menos de cargaU do polígono
  margemU: 500                                                          // terreno em volta do polígono; o jogador pode andar até aí
};
export const ZONAS = {
  parque: { nome: "Parque Nacional da Serra Geral" }, estrada: { nome: "Estrada para Cambará do Sul" }, cidade: { nome: "Cambará do Sul" }, vila: { nome: "Vila" },
  /* quem é simulado só na zona do jogador (NPCs, fauna, partículas, sons): as outras zonas ficam paradas e sem desenhar; eventos agendados seguem só por tempo/estado */
  simulaSoNaZona: true
};

/* ELEVAÇÃO REAL: o terreno de fora do platô (corredor da estrada, cidade) segue o DEM de data/terrain (gerado por tools/baixar_elevacao.py) */
export const DEM = {
  pasta: "data/terrain/",
  escalaVertical: 1,               // 1 = relevo na altura real (1 m = 2,94 u); a estrada comprimida mantém o perfil de subidas e descidas, só mais curto (declives ficam maiores)
  inclinacaoMaxPct: 14,            // inclinação máxima da pista (veículos): cortes e aterros leves onde o terreno é mais íngreme
  rampaU: 800,                     // distância (u) além da borda do platô desenhado à mão em que o terreno passa a seguir 100 % o DEM (sem degraus)
  suavizaPistaU: 70,               // largura (u) em que o terreno se funde ao perfil liso da pista
  ruidoFinoM: .35                  // ruído fino por cima do DEM de 30 m (não muda o relevo geral; some perto de pistas, trilhas e praças)
};

/* ============================================================================================================
   VIAGEM RÁPIDA: marco no estacionamento ([E] Viagem rápida), marco de volta na praça da cidade e ícones clicáveis no mapa grande (M).
   Para acrescentar um destino: um objeto na lista. `ref` pode ser um dos nomes conhecidos (estacionamento, recebimento, lancamento, cidade, vila),
   ou { x, z, yaw? } em unidades do mundo, ou { kml: "nome do ponto no KML" }.
   O tempo de jogo avança proporcional à distância (percurso pela estrada), como num salto do relógio clicável: o ciclo de 24 h, os eventos e as pessoas se ajustam.
   ============================================================================================================ */
export const VIAGEM = {
  velocidadeKmh: 38,                       // estacionamento → cidade ≈ 15 min de jogo (a estrada tem ~9,5 km comprimida)
  minimoMin: 1, fadeSeg: .5, cartaoSeg: 1.5,
  destinos: [
    { id: "estacionamento", nome: "Estacionamento", ref: "estacionamento", ilus: "estacionamento" },
    { id: "recebimento", nome: "Recebimento (início da tirolesa)", ref: "recebimento", ilus: "recebimento" },
    { id: "lancamento", nome: "Mirante / Lançamento da tirolesa", ref: "lancamento", ilus: "lancamento" },
    { id: "cidade", nome: "Cambará do Sul (cidade)", ref: "cidade", ilus: "cidade" },
    { id: "vila", nome: "Vila Oswaldo Kroeff (em construção)", ref: "vila", ilus: "vila" }
  ]
};

/* ============================================================================================================
   REVOADA DE ANDORINHAS (boids) NO VÃO DO CÂNION
   ~300 aves (× qualidade, mín. 150) voando em bando sobre o vão, sempre entre `cabosMin` e `cabosMax` metros dos cabos da tirolesa (repulsão abaixo do mínimo, atração acima do máximo),
   desviando do relevo e do monomotor. Separação/alinhamento/coesão, ondas de virada que atravessam o bando, divisão e junção de subgrupos. Asas em foice batendo no shader.
   ============================================================================================================ */
export const ANDORINHAS = {
  ativo: true, quantidade: 300, escala: 3.4,                      // escala visual do corpo (a andorinha real tem ~17 cm; de longe precisa ser maior para ler no céu)
  velocidadeM: [10, 16],                                          // m/s
  percepcaoM: 14, separacaoM: 3.4,
  pesos: { separacao: 2.4, alinhamento: 1.1, coesao: .7, rumo: .9, cabos: 2.2, relevo: 3.2, aviao: 4 },
  cabosMin: 50, cabosMax: 200,                                    // m: faixa de distância dos cabos
  subgrupos: 3, junta: [18, 40], separa: [30, 70],                // quantos subgrupos · a cada quantos s eles se juntam / se separam
  ondaCada: [7, 14], ondaVelocidadeM: 55,                         // s entre ondas de virada · velocidade da onda no bando
  distanciaAviaoM: 160,                                           // m: quando o monomotor chega perto elas abrem caminho
  presenca: { subidaSeg: 6, descidaSeg: 10 }                      // entrada/saída do bando (s)
};

/* ============================================================================================================
   LUGARES DO MUNDO (praça de Cambará do Sul, Sequoia Lunar, Urna do Tempo, fábrica Cambará S/A, Vila Ouro Verde): constantes ajustáveis. Medidas em metros (× U no código).
   Os polígonos vêm do KML (tipos "praca", "sequoia", "urna", "fabrica", "vila"); aqui só vai o que o KML não diz.
   ============================================================================================================ */
export const LUGARES = {
  cargaU: { praca: 3200, fabrica: 4200, vila: 3600 }, descargaFator: 1.35,           // distância (u) até o polígono para o lugar existir; descarrega a descargaFator × isso
  praca: {
    calcadaM: 3, caminhoM: 3, concavoM: 12,                                          // calçada ao redor, largura dos caminhos, raio do piso em volta da Sequoia
    ruaLarguraM: 9, ruaCalcadaM: 2.2,                                                // ruas provisórias dos 4 lados
    lampadaCadaM: 24, bancos: 14, arvores: 10,
    npcs: { manha: 4, dia: 10, tarde: 8, noite: 2 }                                  // pessoas passeando (6–9 h · 9–17 h · 17–22 h · resto)
  },
  sequoia: { alturaM: 38, raioCopaM: 9.5, canteiroPedrasM: 1.1 },
  urna: { alturaM: 1.1, aberturaSeg: 8, poeiraQtd: 180, repeteSempre: true },       // a urna pode ser aberta quantas vezes o jogador quiser
  raio: { esperaS: 5, aoEntrar: true, repete: true, intervaloS: 240, desbloqueia: "tupa" },     // raio na Sequoia: ao entrar na praça (1ª vez sempre; depois a cada intervaloS s, se repete)
  fabrica: { muroM: 4.2, portaoM: 16, chamineM: 80, galpoes: 7, fumacaQtd: 26, ruidoVol: .5 },
  vila: { casasPorLado: 12, larguraUM: 120, campoM: [90, 55] }
};
