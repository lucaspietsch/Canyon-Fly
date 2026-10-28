/* ============================================================================================================
   FALAS (balões de diálogo). Pools variados; tudo em português. As funções sorteiam sem repetir a última.
   ============================================================================================================ */
const sorteia = (L) => L[Math.floor(Math.random() * L.length)];
const ult = new WeakMap();
export const fala = (L) => { let t = sorteia(L); if(L.length > 1 && ult.get(L) === t) t = sorteia(L); ult.set(L, t); return t; };

export const VISITANTE = {
  geral: ["Olha o tamanho desses paredões!", "Dá pra ver o mar daqui num dia limpo!", "Escuta o barulho da cachoeira lá embaixo.", "Que silêncio bom aqui em cima.", "Isso aqui não cabe em foto, tem que ver ao vivo.", "Nunca imaginei que fosse tão grande.", "Os campos de cima são lindos, olha esse horizonte!", "Dá até um friozinho na barriga olhando lá pra baixo.", "Tira uma foto minha com o cânion atrás?", "Respira esse ar, parece de outro mundo.", "Essas araucárias são lindas, né?", "A trilha foi mais tranquila do que eu pensava.", "Olha a cor do paredão, parece pintado.", "Já valeu a viagem só por essa vista.", "Que lugar incrível, hein?", "Aqui o céu parece mais perto."],
  neblina: ["A neblina subindo é a coisa mais linda que já vi.", "Parece um mar de nuvens lá embaixo!", "Olha a névoa enchendo o cânion, que cena!", "Gente, o cânion está cheio de nuvem!", "A neblina vai e vem, não dá pra tirar os olhos.", "Que bom que a gente chegou cedo, olha esse espetáculo."],
  manha: ["Que bom chegar cedo, a luz está linda.", "O ar da manhã aqui é outra coisa.", "Ainda bem que vim de manhã, sem muita gente.", "Olha como o sol bate nos paredões!"],
  tarde: ["Daqui a pouco o sol começa a descer, vamos esperar?", "A luz da tarde deixa tudo dourado.", "Dá pra ficar aqui até o pôr do sol?"],
  poente: ["O pôr do sol aqui é de arrepiar.", "Olha o paredão ficando avermelhado!", "Que luz dourada, gente!", "Esse céu laranja é inacreditável."],
  noite: ["Quanta estrela!", "Dá pra ver tudo a olho nu, que céu.", "Nunca vi tanta estrela junta.", "Está friozinho, mas que céu lindo."],
  aviao: ["Olha o avião lá em cima, deve estar indo pra Porto Alegre.", "Que altura, quase nem dá pra ver.", "Esse deve estar indo pro litoral.", "Olha lá o avião cruzando o céu."],
  monomotor: ["Olha o avião!", "Nossa, passou bem baixo!", "Filma, filma, passando agora!", "Que barulho, olha lá!"],
  meteoro: ["Fiz um pedido!", "Viu esse?! Que enorme!", "Olha, outra estrela cadente!", "Ali, ali! Viu aquela?", "Gente, é uma chuva de meteoros!", "Já fiz três pedidos!"],
  viaLactea: ["Aquele clarão é a Via Láctea!", "Dá pra ver a Via Láctea a olho nu, aqui longe das luzes da cidade.", "Que faixa linda no céu, é a nossa galáxia!", "Olha o centro da galáxia, aquele brilho mais forte."],
  fauna: { veado: ["Olha um veado ali no campo!", "Que lindo, um veado-campeiro!", "Shhh, não se mexam, é um veado!"], quati: ["Olha os quatis!", "Que cauda listrada, é um quati!", "Ai, que fofo, mas não pode dar comida, né?"], gamba: ["Olha ali, um gambá!", "É um gambá de orelha branca!", "Ele só sai à noite, que sorte!"], lontra: ["Uma lontra! Olha na beira da água!", "Gente, é uma lontra?!", "Que bicho lindo, tão ligeiro!"], capivara: ["Olha os bebês!", "Que fofura, olha os filhotinhos!", "É uma capivara com os filhotes!", "Gente, são quatro capivaras!"], lobo: ["Gente, é um lobo-guará?!", "Olha o lobo-guará ali, shhh!", "Que bicho alto e lindo!"], puma: ["Meu Deus, é um puma?!", "Olha ali, perto da água, é uma onça-parda!", "Não faz barulho, olha aquilo!"], graxaim: ["Olha a raposinha ali!", "Um graxaim! Será que tem fome?", "Que fofo, mas ninguém dá comida, hein?"] },
  casal: ["Vem cá, tira uma selfie comigo.", "Olha que lindo, amor.", "Vamos sentar um pouquinho aqui?"],
  crianca: ["Mãe, olha lá embaixo!", "Pai, posso ir mais perto?", "Tem peixe lá no rio?", "Quanto falta pra chegar?", "Olha a cachoeira, olha!", "Eu quero ver a tirolesa!"],
  idoso: ["Subi devagarinho, mas valeu cada passo.", "Faz tempo que eu queria ver isso.", "No meu tempo não tinha nada disso, só mato."],
  tirolesa: ["Olha, o pessoal descendo na tirolesa!", "Eu tenho coragem de descer, você tem?", "Dá um frio na barriga só de olhar."]
};

export const GUIA = {
  geologia: ["Esses paredões são de basalto, rocha vulcânica de uns 130 milhões de anos.", "As faixas horizontais que vocês veem são camadas de antigos derrames de lava.", "Aqui é o Parque Nacional da Serra Geral, um dos maiores conjuntos de cânions do Brasil.", "A Mata de Araucárias é uma das formações mais ameaçadas da Mata Atlântica.", "O vento úmido do litoral sobe pelo cânion e forma essa neblina que vocês estão vendo.", "O cânion foi esculpido pela água e pelo tempo, são milhões de anos de erosão.", "Esses campos de altitude guardam muitas plantas que só existem aqui no alto da serra."],
  seguranca: ["Fiquem sempre atrás da linha do mirante, a borda não tem proteção.", "Se a neblina fechar, parem e esperem o grupo; nunca saiam da trilha.", "Ninguém dá comida pros bichos, combinado?", "Levem o lixo embora, tudo o que entra aqui sai com a gente."],
  vento: ["Segurem os chapéus, o vento sobe forte pela borda.", "Notem como o vento muda quando a neblina sobe."],
  noite: ["Sem poluição luminosa, a Via Láctea aparece inteira.", "Aquele clarão é o centro da nossa galáxia, a uns 26 mil anos-luz daqui.", "Aqui no alto da serra, longe das luzes da cidade, dá pra ver a Via Láctea a olho nu."],
  meteoro: ["São pequenas partículas de poeira espacial entrando na atmosfera a dezenas de quilômetros por segundo e queimando lá em cima, a uns 80 a 100 km de altura.", "Cada risco desses é um grãozinho de poeira de cometa se desfazendo no céu."],
  aviaoBaixo: ["Esse aí está voando baixo demais, isso nem é permitido aqui no parque.", "Barulho assim perto dos paredões assusta a fauna."],
  aviaoAlto: ["Aquele é um avião comercial, a uns 10 mil metros de altura."]
};

export const ESCOLAR = {
  aluno: ["Professora, olha lá embaixo!", "É verdade que tem lobo aqui?", "Posso tirar foto, professora?", "Que alto!", "Eu não vou chegar perto da beirada, prometo!", "Tem cobra aqui?", "A gente vai ver a cachoeira?", "Olha o tamanho dos paredões!", "Moço, quantos anos tem esse cânion?", "Estou com sede!"],
  professor: ["Gente, fiquem juntos e atrás da linha!", "Sem correr perto da borda, por favor.", "Vamos fazer silêncio pra ele não se assustar!", "Quem está com a garrafa d'água?", "Escutem o guia, vai cair na prova!", "Pessoal, em fila indiana na trilha."],
  guia: ["Aqui vocês estão num parque nacional: é uma área protegida pelo governo para cuidar da natureza.", "Essas rochas foram lava de vulcão há muito, muito tempo.", "Quem sabe o nome dessa árvore? É a araucária, o pinheiro-do-paraná!", "Reparem como a neblina sobe do fundo do cânion."]
};

/* fauna: 5 balões na ordem (1 que animal é, 2 como vive, 3 habitat e alimentação, 4 conduta). Cada passo tem variações. */
export const ANIMAL = {
  capivara: [["Olhem ali na beira do rio: uma capivara com três filhotes!", "Pessoal, olhem na beira do rio: a capivara e os filhotinhos!"],
    ["É o maior roedor do mundo. Vive sempre perto da água e come capim, plantas aquáticas e brotos.", "É o maior roedor do planeta, vive coladinha na água e se alimenta de capim, plantas aquáticas e brotos."],
    ["Os olhos, as orelhas e as narinas ficam no alto da cabeça. Assim ela consegue ficar quase toda debaixo d'água e continuar vendo, ouvindo e respirando.", "Reparem: olhos, orelhas e narinas ficam no topo da cabeça, para ela ficar quase toda mergulhada e ainda ver, ouvir e respirar."],
    ["Quando sente perigo, a mãe dá um latido de alerta e a família toda se esconde na água.", "Se a mãe sente perigo, ela late e todos entram na água para se esconder."],
    ["Vamos olhar daqui, sem chegar perto da margem. Filhote assustado se perde da mãe.", "Vamos ficar aqui, bem quietinhos, longe da margem: filhote assustado se perde da mãe."]],
  capivaraPuma: [["Pessoal, silêncio... olhem as capivaras: só as cabecinhas para fora. Tem um leão-baio passando ali na margem."], ["É exatamente isso que elas fazem na natureza: a água é o esconderijo delas."]],
  lobo: [["Pessoal, devagar... olhem ali: um lobo-guará!", "Calma, gente, atenção ali: um lobo-guará!", "Shhh, parem um instante: olhem, um lobo-guará!"],
    ["É o maior canídeo da América do Sul. Apesar do nome, não é lobo nem raposa, é uma espécie única.", "Ele é o maior canídeo sul-americano e não é parente próximo nem do lobo nem da raposa: é único."],
    ["Ele vive sozinho e anda mais ao entardecer e à noite. Essas pernas longas ajudam a enxergar por cima do capim alto dos campos.", "É solitário e mais ativo no crepúsculo e à noite. As pernas longas servem para ver por cima do capim."],
    ["Come de tudo um pouco: frutos, pequenos roedores, aves e insetos. Ajuda a espalhar sementes pelo campo.", "Come frutos, roedores, aves e insetos, e espalha sementes pelos campos. Gosta da lobeira, uma fruta típica."],
    ["É uma espécie ameaçada. Nada de chegar perto ou oferecer comida. Só fotos e silêncio.", "Está ameaçado de extinção. Mantenham distância, sem comida e sem barulho: só foto."]],
  puma: [["Grupo, juntos e calmos. Ali perto da água: um leão-baio, a onça-parda.", "Atenção, todo mundo parado: ali na margem, um leão-baio, que também chamam de puma."],
    ["É o maior felino que ainda vive aqui na serra. Solitário, discreto e muito difícil de ver. Vocês tiveram sorte.", "É o maior felino daqui: solitário, arisco e raríssimo de ver. É sorte demais!"],
    ["Ele usa os rios e riachos como corredores, onde encontra água e caça presas como veados, cutias e capivaras.", "Segue os cursos d'água, onde bebe e caça veados, cutias e capivaras."],
    ["Precisa de áreas enormes de mata preservada. Por isso é ameaçado: a perda de habitat empurra ele pra longe.", "Precisa de muita mata preservada; o desmatamento é a maior ameaça."],
    ["Se um dia encontrarem um sozinho: não corram, não deem as costas, fiquem grandes e se afastem devagar. Agora, só observem daqui.", "Se algum dia cruzarem com um: não corram, não deem as costas, fiquem grandes e recuem devagar. Agora, só observem daqui."]],
  veado: [["Pessoal, vejam: um veado-campeiro no campo!", "Olhem devagar, ali no campo: um veado-campeiro!"],
    ["É um dos veados mais raros do Brasil. Vive em campos abertos como estes, e o macho tem chifres de três pontas.", "Vive nos campos abertos e o macho tem chifres pequenos de três pontas. É raro e ameaçado."],
    ["Ele é muito tímido, pasta de manhãzinha e no fim da tarde, e foge a qualquer barulho. Por isso: silêncio.", "É tímido, pasta no começo e no fim do dia, e se assusta fácil. Falem baixo."],
    ["Os campos de altitude daqui são o lar dele. Cuidar do campo é cuidar do veado.", "Ele depende dos campos de altitude: proteger o campo é proteger o veado."]],
  quati: [["Olhem os quatis ali perto do estacionamento!", "Pessoal, quatis! Olhem a cauda listrada."],
    ["O quati é parente do guaxinim. Anda de dia, em bando, com a cauda para cima, cheirando o chão com aquele focinho comprido.", "É parente do guaxinim, anda de dia, e levanta a cauda listrada enquanto fareja o chão."],
    ["Come frutas, insetos e minhocas. Revira folhas e até desce de cabeça para baixo das árvores.", "Come frutas, insetos e minhocas, e desce das árvores de cabeça para baixo."],
    ["Mas não deem comida: ele perde o medo, fica agressivo e pode morder. Lixo sempre bem fechado, combinado?", "Nada de comida! Ele perde o medo, pode morder e adoece. Lixo bem fechado."]],
  gamba: [["Vejam só: um gambá-de-orelha-branca!", "Olha quem apareceu: um gambá de orelhas brancas."],
    ["Ele é um marsupial, como o canguru: as fêmeas carregam os filhotes numa bolsa.", "É marsupial, parente do canguru: a fêmea carrega os filhotes na bolsa."],
    ["Anda à noite, come frutas, insetos e até pequenos bichos. Ajuda a espalhar sementes e a controlar pragas.", "Anda à noite, come de tudo e espalha sementes. É um aliado da mata."],
    ["Se assustado, ele se faz de morto. Não é perigoso: só deixem ele seguir o caminho.", "Se assustado, finge de morto. Não é perigoso: é só deixar ele passar."]],
  lontra: [["Silêncio! Uma lontra na beira do arroio!", "Olhem ali na margem: é uma lontra!"],
    ["A lontra-neotropical é uma ótima nadadora. Só existe onde a água é limpa, por isso ela é um termômetro do rio.", "Nada muito bem e só vive onde o rio é limpo: ela mostra que a água está saudável."],
    ["Come peixes, caranguejos e rãs. Tem o pelo tão denso que a água nem chega à pele.", "Come peixes e caranguejos, e o pelo é tão denso que a água não chega à pele."],
    ["Ela é arisca e precisa das margens com mata. Fiquem aqui e só observem.", "É arisca e precisa de mata nas margens. Só observem de longe."]],
  graxaim: [["Olhem o graxaim ali no estacionamento!", "Pessoal, olha quem apareceu: um graxaim!"],
    ["É um canídeo pequeno e esperto, parente das raposas. Aqui ocorrem o graxaim-do-campo e o graxaim-do-mato.", "Parente das raposas, esperto e pequeno. Aqui vivem o graxaim-do-campo e o graxaim-do-mato."],
    ["Come de tudo: frutos, insetos, pequenos animais. Se adapta bem perto das pessoas, por isso aparece aqui.", "Come frutos, insetos e bichinhos, e se acostuma com gente por perto, por isso vem ao estacionamento."],
    ["Mas atenção: nunca deem comida. Ele perde o medo, se aproxima de carros, é atropelado e pode pegar doenças de animais domésticos.", "Nada de comida! Ele perde o medo, chega perto dos carros, é atropelado e adoece."],
    ["Lixo sempre na lixeira fechada, combinado?", "Lixo só na lixeira fechada, combinado?"]]
};
export const ANIMAL_ESCOLAR = {
  veado: ["Crianças, olhem devagar no campo: um veado-campeiro!", "Ele é muito tímido, então ninguém grita.", "O papai veado tem chifrinhos de três pontas."],
  quati: ["Crianças, olhem os quatis com a cauda listradinha!", "Eles andam de dia, em bando, cheirando tudo com o focinho comprido.", "Mas ninguém dá comida pra eles, ouviram?"],
  gamba: ["Crianças, um gambá de orelha branca!", "Ele é parente do canguru: a mamãe carrega os filhotes numa bolsinha.", "Ele só sai à noite e é bonzinho: vamos deixar ele passar."],
  lontra: ["Crianças, silêncio: uma lontra na beira da água!", "Ela nada super bem e come peixinhos.", "Ela só vive em rio limpinho!"],
  capivara: ["Crianças, olhem na beira do rio: uma capivara com três filhotinhos!", "Ela é o maior roedor do mundo e adora ficar na água.", "Come capim e plantinhas da beira do rio. Os olhinhos e as narinas ficam no alto da cabeça, para ela se esconder na água.", "Se ela sentir medo, late e entra na água com os filhotes. Vamos olhar de longe, sem gritar, combinado?"],
  lobo: ["Crianças, olhem devagar: aquele bicho laranja de perna comprida é o lobo-guará!", "Ele é o maior cachorro-do-mato da América do Sul e vive sozinho.", "Ele gosta de campo aberto e come frutinhas, ratinhos e insetos.", "Ele é arisquinho e está em perigo. Ninguém grita nem chega perto, tá?"],
  puma: ["Crianças, silêncio total: ali na beira da água está um leão-baio, a onça-parda!", "É o maior gato do mato daqui e quase ninguém consegue ver.", "Ele mora na mata e caminha pertinho dos rios, procurando água e comida.", "Ele precisa de mata preservada. Agora só olhem, sem gritar, combinado?"],
  graxaim: ["Crianças, olhem quem apareceu no estacionamento: um graxaim!", "É um cachorrinho-do-mato, parente da raposa, bem esperto.", "Ele come frutinhas e bichinhos, mas ninguém pode dar comida pra ele.", "Se der comida, ele perde o medo e pode se machucar. Lixo só na lixeira!"]
};
export const PROFESSOR_ANIMAL = ["Vamos fazer silêncio pra ele não se assustar!", "Fiquem paradinhos, olhando de longe.", "Ninguém corre, ninguém grita, ouviram?"];
export const REACAO_ANIMAL = (esp) => VISITANTE.fauna[esp];

export const ICMBIO_RONDA = {
  radio: ["Ronda no mirante, tudo tranquilo por aqui.", "Central, ronda em andamento, trilha liberada.", "Mirante sem ocorrências, seguimos a ronda.", "Câmbio, chegando ao mirante, condições normais."],
  saudacao: ["Bom dia! Aproveitem a vista, e fiquem sempre na trilha.", "Boa tarde! Cuidado na borda e levem o lixo de volta.", "Olá! Qualquer coisa estamos por aqui.", "Bom passeio! Fiquem atrás da linha dos mirantes."],
  borda: ["Pessoal, voltem para a trilha, longe da borda!", "Por favor, afastem-se da borda, é perigoso.", "Ali não! Voltem para a trilha, por favor."],
  lixo: ["Lixo no chão, vou recolher.", "Alguém esqueceu isso aqui, vou guardar na mochila."],
  neblina: ["A neblina subiu cedo hoje.", "O cânion está cheio de nuvem."],
  fauna: ["Pessoal, mantenham distância e falem baixo.", "Sem se aproximar do animal, por favor, só observar.", "Calma, não corram, deixem ele passar."],
  graxaim: ["Lembrando: não é para alimentar o graxaim.", "Nada de comida pra ele, hein? Isso faz mal."],
  aviaoBaixo: ["Registrando a aeronave em voo baixo sobre o cânion.", "Anota aí: aeronave baixa sobre o cânion, horário e sentido."],
  aviaoAnota: ["Anotado: horário, rumo e altura aproximada.", "Já registrei na prancheta."]
};

/* serpentes: sequência do guia (identificação, comportamento/habitat, conduta, dieta/curiosidade) + fala comum de segurança no fim */
export const SERPENTE = {
  jararaca: ["Pessoal, parem aqui. Uma jararaca atravessando a trilha.", "É uma serpente peçonhenta, típica da Mata Atlântica. Gosta de lugares úmidos, perto de água e dentro da mata.", "Ela não ataca: só se defende quando é tocada ou pisada. Por isso a gente espera ela passar com calma.", "Come principalmente roedores, então ajuda a controlar ratos e doenças que eles transmitem.", "E tem mais: estudos com o veneno da jararaca deram origem a um remédio usado no mundo inteiro para pressão alta."],
  urutu: ["Atenção, grupo: um urutu-cruzeiro cruzando ali.", "Vejam a cruz desenhada no alto da cabeça. Por isso o nome.", "É uma serpente peçonhenta dos campos do Sul. Vive no meio do capim, perto de banhados.", "Fica parada e camuflada a maior parte do tempo. O risco é pisar sem ver, por isso calçado fechado e olhar sempre onde pisa.", "Ela também controla roedores no campo. É importante pro equilíbrio daqui."],
  coral: ["Parem, pessoal: uma cobra-coral.", "Ela é peçonhenta, mas muito tímida. Passa a maior parte da vida escondida no chão, entre as folhas.", "Existem corais verdadeiras e falsas muito parecidas. Na dúvida, trate sempre como verdadeira e não chegue perto.", "Ela come outras serpentes e pequenos animais. Vejam: quando se sente ameaçada, esconde a cabeça e levanta a cauda pra enganar."],
  comum: "Lembrem: nunca toquem nem tentem matar uma serpente. Se alguém for picado: mantenha a calma, não faça torniquete, não corte e não chupe o local, e procure atendimento médico o quanto antes. O tratamento é o soro antiofídico. Liguem 192."
};
export const SERPENTE_ESCOLAR = {
  jararaca: ["Crianças, parem! Uma jararaca vai atravessar a trilha.", "Ela é uma cobra com veneno e gosta de lugar úmido, perto da água.", "Ela não ataca ninguém: só se defende se alguém pisar nela. Por isso a gente espera, bem quietinho.", "Ela come ratinhos e até ajuda a gente. O veneno dela virou remédio para pressão alta!"],
  urutu: ["Crianças, parem! Olhem o urutu-cruzeiro atravessando.", "Vejam a cruz no alto da cabeça: é por isso que ele tem esse nome.", "Ele mora no meio do capim e fica camuflado. Por isso a gente sempre olha onde pisa e usa calçado fechado.", "Ele também ajuda, comendo ratinhos do campo."],
  coral: ["Crianças, parem! Uma cobra-coral.", "Ela é bem tímida e vive escondida entre as folhas.", "Tem corais verdadeiras e falsas muito parecidas, então ninguém chega perto, combinado?", "Quando ela se assusta, esconde a cabeça e levanta a cauda."],
  comum: "Lembrem: nunca toquem numa cobra. Se alguém for picado, mantenha a calma e procure um médico rápido. O tratamento é o soro antiofídico. Liguem 192."
};
VISITANTE.serpente = ["Calma, deixa ela passar.", "Ninguém chega perto!", "Que bonita... de longe.", "Para, para, olha a cobra!", "Fica parado, ela já vai embora.", "Cuidado, não pisa!"];
ESCOLAR.serpente = ["Ela é venenosa?", "Professora, olha a cobra!", "Eu não vou chegar perto, prometo!", "Será que ela morde?"];
ESCOLAR.professorSerpente = ["Ninguém se mexe! Vamos esperar ela passar.", "Silêncio, pessoal, deixem a cobrinha seguir o caminho dela.", "Todo mundo atrás de mim, sem correr."];
VISITANTE.fauna.jararaca = VISITANTE.serpente; VISITANTE.fauna.urutu = VISITANTE.serpente; VISITANTE.fauna.coral = VISITANTE.serpente;

/* ---------- EMERGÊNCIA (bombeiro civil, equipe de resgate, vítima, acompanhantes, reações) ---------- */
export const EMERG = {
  guia: ["É o bombeiro civil do parque indo atender alguém. Por isso é importante usar calçado adequado e andar com atenção na trilha.", "Pessoal, vamos abrir espaço para a equipe passar.", "Encosta todo mundo na lateral, é uma equipe de resgate."],
  guiaEscolar: ["Crianças, para o lado, vamos deixar a equipe de resgate passar. Sem correr!", "Todo mundo encostado na beirada da trilha, vai passar um socorro.", "Quem pisa com cuidado, de calçado fechado, evita acidentes. Agora, para o lado."],
  visitante: ["Deve ser uma emergência lá em cima.", "Nossa, será que alguém se machucou?", "Abre espaço, abre espaço!", "Espero que não seja grave.", "É o resgate, vamos dar passagem."],
  vitimaCai: ["Ai! Meu pé!", "Ai, torci o pé!", "Ai ai ai, que dor!"],
  acompanhanteCai: ["Calma, não mexe! Vou chamar ajuda.", "Fica parado, eu ligo para o resgate!", "Alô? Alguém se machucou no mirante, por favor!"],
  bombeiroRadioSai: ["Entendido, saindo para o mirante."],
  bombeiroChega: ["Boa tarde! Sou o bombeiro civil do parque. Onde dói?", "Calma, eu cuido de você. Pode ficar sentado.", "Vamos ver esse tornozelo. Respira fundo."],
  bombeiroExame: ["Consegue mexer os dedos do pé? Sente formigamento?", "Vou imobilizar para não piorar, tá?", "Gelo instantâneo e uma bandagem firme. Vai aliviar."],
  bombeiroRadioMaca: "Vítima com entorse no tornozelo, consciente. Solicito equipe com maca no mirante.",
  bombeiroAcalma: ["A equipe já está subindo, fica tranquilo.", "Você está bem, foi só o tornozelo. Respira.", "Logo eles chegam com a maca."],
  equipeCorre: ["Maca vindo, pessoal, licença!", "Abre passagem, resgate subindo!", "Com licença, emergência!"],
  equipeChega: ["Boa tarde, vamos te ajudar a descer.", "Vamos passar você para a maca com cuidado, combinado?", "Um, dois, três... isso, devagar."],
  consola: ["Vai ficar tudo bem, tá? Já já você vai estar melhor.", "Respira fundo comigo. Isso, devagar.", "Tá doendo muito? Se doer mais, me avisa.", "Fica tranquilo, a gente já tá chegando na ambulância.", "Você foi muito bem até agora.", "Logo você tá de volta curtindo o cânion.", "Já avisamos sua família, eles estão vindo junto."],
  vitimaResp: ["Obrigado...", "Tá doendo um pouco.", "Tá bom.", "Tô melhor, obrigado.", "Desculpa o trabalho."],
  abrePassagem: ["Licença, pessoal, emergência! Por favor, abram espaço.", "Atenção, passagem, por favor!", "Abram espaço, vamos descendo com a maca."],
  serpente: ["Atenção, serpente à frente! Vamos desviar.", "Pessoal, cobra na trilha! Desviando pelo lado, sem encostar."],
  serpenteEspera: ["Sem como desviar com segurança. Vamos esperar ela sair.", "Parados. Deixa ela passar, ninguém chega perto."],
  quadPessoas: ["Com licença, passando pelo lado!", "Atenção, quadriciclo passando!"],
  ambulanciaCarrega: ["Prontos? Subindo a maca.", "Cuidado com a cabeça, vai entrar.", "Pronto, segura firme, vamos para o hospital."],
  vitimaAmb: ["Tô indo, obrigado a todos.", "Obrigado, de verdade."],
  bombeiroNao: ["Agora não posso, estamos em atendimento!", "Depois a gente conversa, tem uma ocorrência!"],
  icmRadio: ["Câmbio, recebido. Estou abrindo caminho na trilha.", "Recebido, bombeiro. Vou orientar os visitantes a abrir espaço."]
};

/* ---------- TURFEIRAS, SPHAGNUM, NASCENTES, SAPINHOS (guias, escolares, equipe ICMBio) ---------- */
export const TURFEIRA = {
  intro: ["Pessoal, olhem esse banhado aqui do lado: é uma turfeira.", "Reparem nesse banhado: o que parece só um charco é uma turfeira."],
  explica: ["Esse musgo é o Sphagnum. Ele funciona como uma esponja gigante: guarda a água da chuva e da neblina e vai soltando devagar, o ano inteiro.", "Por isso os rios daqui não secam mesmo quando fica tempo sem chover.", "Uma turfeira leva milhares de anos pra se formar. Ela cresce cerca de um milímetro por ano.", "Além de guardar água, ela guarda muito carbono no solo, ajudando a segurar as mudanças climáticas."],
  conduta: ["Por isso a gente nunca pisa aqui dentro: uma pegada pode durar anos e o pisoteio destrói o musgo."],
  placa: ["Vejam ali na placa: o Sphagnum segura muitas vezes o próprio peso em água."],
  escolar: ["Essa é a 'caixa d'água' da natureza!", "Esse musguinho segura água igual uma esponja. Mas ninguém pisa, combinado?", "Daqui nasce o rio!"],
  icm: ["Turfeira é área frágil. Sempre pela trilha ou pela passarela."]
};
export const NASCENTE = {
  intro: ["Estão ouvindo esse barulhinho de água? É uma nascente.", "Parem um pouquinho e escutem: essa água que brota aqui é uma nascente."],
  explica: ["É aqui que nascem os riachos que descem pelo cânion e formam a cascata que vocês viram.", "Essa água vai seguir até os rios lá embaixo e abastecer cidades, lavouras e muitos animais.", "Se a nascente for destruída ou poluída, o rio inteiro sente. Proteger uma nascente é proteger tudo que vem depois dela."],
  conduta: ["Nunca joguem lixo, sabão ou protetor solar na água aqui em cima."],
  escolar: ["Olha, a água saindo do chão!", "Daqui nasce o rio! Vamos cuidar dela?"]
};
export const SAPINHO = {
  intro: ["Pessoal, olhem bem aqui no chão, com cuidado... um sapinho-de-barriga-vermelha!"],
  explica: ["Esse é o Melanophryniscus cambaraensis. O nome vem daqui mesmo, de Cambará do Sul. Ele é encontrado em pouquíssimos lugares no mundo.", "Ele é bem pequeno, menor que um polegar, e anda mais do que pula.", "Quando se sente ameaçado, mostra a barriga vermelha. É um aviso: tem toxinas na pele, então nada de tocar.", "Esses sapinhos dependem das turfeiras e dos banhados para viver e se reproduzir. Se o banhado some, eles somem junto."],
  conduta: ["É uma espécie ameaçada. Olhar onde pisa aqui é proteger um animal que só existe nesta região."],
  escolar: ["Olha que pequenininho!", "Ele mostra a barriga vermelha pra dizer: não me toca!"]
};
export const VENTO = { visitante: ["Que vento!", "Segura o boné!", "Nossa, o vento está forte hoje.", "Fecha o casaco, esfriou!"] };

/* ---------- AVES E CONFLITOS NATURAIS (guias, escolares, visitantes) — pools no formato dos lugares: intro / explica / conduta / escolar ---------- */
export const AVES = {
  silencio: {
    intro: ["Ouviram o silêncio da mata? Os passarinhos pararam de cantar de uma hora pra outra.", "Pessoal, escutem... a mata ficou em silêncio de repente."],
    explica: ["Isso acontece quando um predador grande passa, como o leão-baio. As aves dão o alarme e todo mundo fica quieto, escondido.", "Os bichos da mata percebem o perigo muito antes da gente. Quando o canto some de repente, é sinal de que tem alguém grande por perto."],
    conduta: ["Fiquem calmos e em silêncio. O leão-baio não é perigoso para quem o respeita, mas é muito arisco. Se aparecer, a gente só observa de longe."],
    escolar: ["Por que os passarinhos pararam?", "Shhh, a mata ficou quietinha!"]
  },
  lobo: {
    intro: ["Olhem lá: o lobo-guará está se afastando do leão-baio!", "Pessoal, vejam a cena: um leão-baio e um lobo-guará no mesmo campo."],
    explica: ["O leão-baio é bem maior e mais forte, então o lobo-guará prefere sair de fininho, sem briga. Na natureza ninguém quer se machucar à toa: cada um respeita o espaço do outro.", "O lobo-guará é tímido e come até frutas, como a lobeira. Ele evita confusão com o leão-baio."],
    conduta: ["Sem gritar e sem correr, pessoal. Se a gente fizer barulho, estraga a cena e assusta os dois."],
    escolar: ["O lobo está fugindo!", "O leão-baio é maior, né, professora?"]
  },
  graxaim: {
    intro: ["Olhem o graxaim saindo do caminho do lobo-guará.", "Vejam só: o lobo-guará chegando e o graxaim dando passagem."],
    explica: ["O lobo-guará é maior que o graxaim, então o graxaim cede o lugar. Eles dividem o mesmo campo, mas cada um no seu espaço.", "É assim: o maior avança, o menor se afasta, e ninguém sai ferido."],
    conduta: ["Fiquem parados, só observando, pra eles continuarem tranquilos."],
    escolar: ["O graxaim saiu correndo!", "Ele deu passagem pro lobo!"]
  },
  gralha: {
    intro: ["Vejam a gralha-azul! Ela é a plantadora de araucárias.", "Pessoal, olha o bando de gralhas-azuis ali nas araucárias, fazendo aquela algazarra!"],
    explica: ["Ela enterra pinhões no chão para comer no inverno e esquece alguns. Muitos desses pinhões viram novas araucárias, por isso ela é a plantadora de araucárias.", "A gralha-azul é o símbolo do Paraná e vive junto com as araucárias. Sem uma, a outra sofre.", "E quando um gavião aparece, elas se juntam e expulsam o bicho gritando. Olhem como são unidas."],
    conduta: ["Dá pra fotografar de longe. Se chegar muito perto, o bando levanta voo."],
    escolar: ["Que bando barulhento!", "Ela planta pinheiro?!"]
  },
  queroquero: {
    intro: ["Cuidado, pessoal: aqui perto tem um ninho de quero-quero.", "Escutem esse grito: é o quero-quero avisando que a gente chegou perto do ninho."],
    explica: ["O quero-quero defende o ninho. Ele faz voos rasantes e grita bastante, mas é só para afastar a gente. Ele não machuca ninguém.", "O ninho fica direto no chão, no meio do campo, com uns quatro ovinhos manchados. Por isso ele se defende assim."],
    conduta: ["O melhor é se afastar com calma e dar a volta pelo outro lado. Sem correr e sem tentar chegar perto dos ovos."],
    escolar: ["Ele vai me bicar?!", "Ele só quer proteger os ovinhos!"]
  },
  visitante: {
    silencio: ["Nossa, ficou tudo quieto de repente.", "Escuta... não tem um passarinho cantando.", "Que silêncio estranho."],
    lobo: ["Olha lá, o lobo está saindo de perto!", "Será que o lobo viu o leão-baio?", "Que cena, nunca vi isso!"],
    graxaim: ["Olha o graxaim dando passagem!", "O lobo chegou e o graxaim saiu."],
    gralha: ["Que barulheira de gralha!", "Olha o azul das penas, que lindo.", "As gralhas estão atrás do gavião!"],
    queroquero: ["Ai, ele vem na minha cabeça!", "Calma, é só o quero-quero defendendo o ninho.", "Vamos dar a volta, ele está bravo."]
  }
};
VISITANTE.andorinhas = ["Olha as andorinhas, quantas!", "Parece uma nuvem de passarinhos.", "Elas voam juntinhas, que lindo!", "Como elas viram todas ao mesmo tempo?", "Dá até tontura de olhar!"];
GUIA.andorinhas = ["Vejam a revoada de andorinhas sobre o vão! Elas caçam insetos no ar, voando em bando.", "Cada uma só olha para as vizinhas: separação, alinhamento e coesão. Por isso o bando vira inteiro, como uma onda.", "Elas ficam longe dos cabos da tirolesa; a faixa ali é delas."];
VISITANTE.fauna.queroquero = AVES.visitante.queroquero; VISITANTE.fauna.gralha = AVES.visitante.gralha; VISITANTE.fauna.picapau = ["Ouve o pica-pau batendo!", "Olha a cabecinha vermelha!"]; VISITANTE.fauna.tucano = ["Um tucano! Olha o bico!", "Gente, tucano ali em cima!"]; VISITANTE.fauna.papagaio = ["Olha a revoada de papagaios!", "Que barulheira verde passando!"];
