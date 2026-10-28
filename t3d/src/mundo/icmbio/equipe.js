/* ============================================================================================================
   EQUIPE DO ICMBio (10 pessoas fictícias) e DIÁLOGOS
   perfil: "preto" (colete preto e chapéu: servidores/analistas) · "coord" (camiseta preta: coordenação) · "campo" (camiseta verde: brigada/campo) · "ronda" (verde, na trilha)
   ============================================================================================================ */

export const TEMAS = [["oque", "O que é o ICMBio?"], ["regras", "Regras do parque"], ["fauna", "Fauna do parque"], ["horario", "Melhor horário para visitar"], ["seguranca", "Segurança na trilha"], ["turfeira", "O que são as turfeiras e o Sphagnum?"], ["sapinho", "O que são os sapinhos-de-barriga-vermelha?"], ["aves", "Aves e bichos da mata: quem manda?"], ["tchau", "Tchau"]];

/* aparência: pele/cabelo/escala + acessórios. cor da camisa vem do perfil */
export const EQUIPE = [
  { id: "helena", nome: "Helena Rocha", funcao: "Analista ambiental · fiscalização", perfil: "preto", sexo: "f", pele: 0xd9a37a, cabelo: 0x3a2412, esc: .97, rabo: true, acess: { chapeu: 1, colete: true, radio: true, prancheta: false }, onde: "est", modos: ["conversa", "radio", "prancheta", "idle"], tique: "Olha, " },
  { id: "rogerio", nome: "Rogério Tavares", funcao: "Analista ambiental · uso público", perfil: "preto", sexo: "m", pele: 0xe8bf9a, cabelo: 0x2a1a10, esc: 1.04, acess: { chapeu: 1, colete: true, binoculo: true }, onde: "est", modos: ["conversa", "binoculo", "apontar", "idle"], tique: "Então, " },
  { id: "marcio", nome: "Márcio Bittencourt", funcao: "Coordenador da equipe de campo", perfil: "coord", sexo: "m", pele: 0xb27a52, cabelo: 0x16100c, esc: 1.06, acess: { cabelo: true, radio: true }, onde: "est", modos: ["conversa", "prancheta", "apontar", "radio"], tique: "Bom, " },
  { id: "joana", nome: "Joana Prestes", funcao: "Brigadista", perfil: "campo", sexo: "f", pele: 0xe6b996, cabelo: 0x8a5a2a, esc: .95, rabo: true, acess: { cabelo: true }, onde: "est", modos: ["conversa", "idle", "apontar"], tique: "Ó, " },
  { id: "tiago", nome: "Tiago Fagundes", funcao: "Brigadista · prevenção de incêndio", perfil: "campo", sexo: "m", pele: 0xa8714a, cabelo: 0x1a1410, esc: 1.02, acess: { chapeu: 2, cabelo: false }, onde: "est", modos: ["conversa", "idle", "radio"], tique: "Tá, " },
  { id: "camila", nome: "Camila Dorneles", funcao: "Agente de campo · manejo", perfil: "campo", sexo: "f", pele: 0x8a5a3a, cabelo: 0x120c08, esc: .93, acess: { cabelo: true, mochila: true }, onde: "est", modos: ["conversa", "prancheta", "idle"], tique: "Veja bem, " },
  { id: "jair", nome: "Jair Scheffer", funcao: "Brigadista · trilhas", perfil: "campo", sexo: "m", pele: 0xf1cfae, cabelo: 0x9a9a9a, esc: 1.08, acess: { cabelo: true, garrafa: true }, onde: "est", modos: ["conversa", "idle", "apontar"], tique: "Escuta, " },
  { id: "luciana", nome: "Luciana Meirelles", funcao: "Ronda · trilha do mirante", perfil: "ronda", sexo: "f", pele: 0xc88a5e, cabelo: 0x1a120c, esc: .98, rabo: true, acess: { cabelo: true, radio: true }, onde: "trilha", tique: "Oi! " },
  { id: "edu", nome: "Eduardo Zanella", funcao: "Ronda · mochila e hidratação", perfil: "ronda", sexo: "m", pele: 0xe0ac82, cabelo: 0x4a3220, esc: 1.03, acess: { cabelo: true, mochila: true, garrafa: true, chapeu: 2 }, onde: "trilha", tique: "E aí, " },
  { id: "patricia", nome: "Patrícia Mondadori", funcao: "Ronda · observação e registro", perfil: "ronda", sexo: "f", pele: 0xf1c9a5, cabelo: 0xc8a050, esc: .96, acess: { cabelo: true, binoculo: true, prancheta: true }, onde: "trilha", tique: "Pois é, " }
];

export const COR_PERFIL = { preto: { camisa: 0x2a3228, manga: 0x4a5a3a, calca: 0x4a4d38, colete: 0x141517, chapeu: 0x4a5a35 }, coord: { camisa: 0x16171a, manga: 0x16171a, calca: 0x464a36, chapeu: 0x1b1b1d }, campo: { camisa: 0x2f7a3a, manga: 0x2f7a3a, calca: 0x464a36, chapeu: 0x2a4a2a }, ronda: { camisa: 0x2f7a3a, manga: 0x2f7a3a, calca: 0x4a4d38, chapeu: 0x2a4a2a } };

const P = {
  oque: {
    preto: ["O ICMBio é o Instituto Chico Mendes de Conservação da Biodiversidade, órgão federal ligado ao Ministério do Meio Ambiente. Ele cria, protege e fiscaliza as unidades de conservação federais, como este Parque Nacional da Serra Geral. Nosso trabalho vai da pesquisa e do manejo até a fiscalização de crimes ambientais.", "Somos o órgão federal responsável pelas unidades de conservação do país. Aqui, no Parque Nacional da Serra Geral, cuidamos dos cânions, dos campos de altitude e da Mata de Araucárias, recebemos visitantes e fiscalizamos o cumprimento das regras."],
    coord: ["É o órgão federal que cuida das unidades de conservação, incluindo o Parque Nacional da Serra Geral. Eu coordeno a equipe de campo: brigada, trilhas, manejo e apoio ao uso público.", "ICMBio é o Instituto Chico Mendes: o governo federal cuidando das áreas protegidas. Aqui no Parque Nacional da Serra Geral a equipe de campo é a que fica no dia a dia com a trilha, o fogo e o visitante."],
    campo: ["É o órgão do governo federal que cuida das unidades de conservação, como o Parque Nacional da Serra Geral. A gente aqui no campo faz a manutenção das trilhas, o manejo e a prevenção de incêndios.", "O ICMBio cuida dos parques nacionais e outras áreas protegidas do Brasil, incluindo o Parque Nacional da Serra Geral. Nós, da equipe de campo, somos os braços do órgão aqui dentro."],
    ronda: ["É o órgão federal que cuida das unidades de conservação, incluindo o Parque Nacional da Serra Geral. Eu faço ronda na trilha: oriento, observo e registro o que acontece.", "ICMBio é o Instituto Chico Mendes de Conservação da Biodiversidade. A gente anda a trilha todo dia cuidando do parque e dos visitantes."]
  },
  regras: {
    preto: ["As regras principais: não alimentar nem tocar nos animais, não sair das trilhas, levar todo o lixo embora, não fazer fogo e respeitar os limites dos mirantes e das bordas do cânion. Quem descumpre pode ser advertido ou multado, a fiscalização é nossa função.", "Cinco coisas: nada de comida para os bichos, fiquem na trilha, o lixo volta com você, fogo é proibido e ninguém ultrapassa a linha dos mirantes. É para a sua segurança e para a conservação do parque."],
    coord: ["Trilha demarcada sempre, lixo de volta na mochila, fogo nem pensar, nada de alimentar bicho e respeito total às bordas e aos mirantes. Se algo parecer errado, procurem qualquer um de nós.", "As regras são simples: fica na trilha, não faz fogo, não alimenta os animais, leva o lixo embora e não passa da linha dos mirantes."],
    campo: ["Sem fogo, que é o que mais preocupa a gente no campo seco. Também não saiam da trilha, levem o lixo e não deem comida aos bichos. Nos mirantes, atrás da linha.", "Trilha é trilha: sair dela pisoteia a vegetação e é perigoso. Lixo volta com vocês, não alimentem animais e nunca façam fogo."],
    ronda: ["Na ronda eu vejo muita coisa: lixo, gente na borda... As regras: fica na trilha, sem fogo, sem alimentar bicho, lixo na mochila e atrás da linha dos mirantes.", "Sem sair da trilha, sem fogo, sem alimentar animais e com o lixo de volta. E sempre atrás da linha dos mirantes, por favor."]
  },
  fauna: {
    preto: ["Aqui vivem o lobo-guará, o leão-baio (a onça-parda), o graxaim e muitos outros, como veados, quatis e aves. Se encontrar um: mantenha distância, fale baixo, não corra e não ofereça comida. Com o lobo-guará e o graxaim, só observe; com o leão-baio, não dê as costas, fique grande e recue devagar.", "A fauna aqui é rica: lobo-guará, leão-baio, graxaim, tatus, cutias, tucanos. Regra de ouro: observar de longe, em silêncio, sem alimentar e sem perseguir. Foto, sim, mas respeitando a distância."],
    coord: ["Temos lobo-guará nos campos, graxaim no estacionamento e, raramente, o leão-baio perto da água. Para todos: distância, silêncio e nada de comida.", "O parque tem lobo-guará, leão-baio, graxaim e muita ave. Nossa orientação é a mesma para todos: observar de longe e deixar o bicho seguir a vida dele."],
    campo: ["O graxaim é o mais comum, aparece no estacionamento. O lobo-guará anda nos campos, mais no fim do dia, e o leão-baio é raríssimo, perto da água. Nunca alimentar: o bicho perde o medo e acaba morrendo.", "A gente vê rastro de tudo: lobo-guará, graxaim, veado. Se vocês virem um animal, parem, falem baixo e deixem ele passar."],
    ronda: ["Hoje na ronda eu fiquei de olho: lobo-guará só de manhãzinha e no fim da tarde, graxaim perto do estacionamento. Se virem um bicho, afastem-se com calma e não deem comida.", "Os rastros que a gente acha na margem do arroio às vezes são do leão-baio. É difícil ver, mas ele está aqui. Respeito e distância."]
  },
  horario: {
    preto: ["Para a neblina, cheguem de manhã cedo: ela sobe do cânion e some por volta das dez. Para o pôr do sol, fiquem até o fim da tarde, a luz nos paredões é linda. E à noite, longe das luzes, dá para ver a Via Láctea, mas só com autorização e acompanhados.", "Manhã cedo para ver o cânion cheio de névoa, fim de tarde para o pôr do sol. Em noites sem lua o céu estrelado é espetacular."],
    coord: ["Cedo, de manhã, tem neblina e menos gente. No fim da tarde, o pôr do sol. E em noite sem lua, o céu é de outro mundo.", "Se der, venham logo cedo: a névoa, o silêncio, os bichos mais ativos. À tarde também é lindo, mas vai ter mais gente."],
    campo: ["De manhã bem cedo é o melhor: neblina subindo e quase ninguém. Fim de tarde também vale muito. Só cuidado com o tempo, que muda rápido.", "Eu gosto do amanhecer, com a névoa. E o pôr do sol, claro. À noite, o céu é lindo, mas a trilha fica escura: só com lanterna e acompanhado."],
    ronda: ["Da trilha eu vejo: de manhã a neblina enche o cânion; no fim da tarde, o paredão fica avermelhado. À noite, quem vier com lanterna vê um céu cheio de estrelas.", "Melhor hora? Amanhecer e entardecer. A luz muda tudo. E em noite limpa, a Via Láctea aparece inteira."]
  },
  seguranca: {
    preto: ["Levem água, usem calçado fechado, protetor solar e capa de chuva: o tempo muda muito rápido. Se a neblina fechar, parem e esperem. Avisem alguém do roteiro e nunca ultrapassem a borda do cânion.", "Segurança: água, calçado de trilha, roupa para frio e chuva, lanterna se anoitecer. Fiquem na trilha, longe das bordas, e avisem alguém do seu roteiro e horário de volta."],
    coord: ["Água, calçado fechado, agasalho e atenção ao clima. Neblina fecha rápido: parou, espera. E sempre avisem alguém do roteiro.", "Trilha segura é trilha planejada: água, calçado bom, clima checado e alguém sabendo por onde você vai."],
    campo: ["Água sempre, calçado fechado, e atenção: o tempo vira rápido aqui no alto. Na neblina, não andem sem ver o chão. Avisem alguém do roteiro.", "Levem bastante água e algo para comer. Na seca, cuidado com fogo e cigarro. E avisem alguém do seu roteiro."],
    ronda: ["Na ronda, o que mais vejo é gente sem água e de chinelo. Levem água, calçado fechado, e se a neblina vier, parem e esperem. Avisem alguém do roteiro.", "Cuidado nas bordas e nos horários: voltem antes de escurecer. Água, calçado bom e aviso ao pessoal do seu roteiro."]
  },
  turfeira: {
    preto: ["Turfeira é um banhado de altitude coberto de Sphagnum, um musgo que funciona como esponja: guarda a água da chuva e da neblina e a solta aos poucos, alimentando as nascentes o ano inteiro. Cresce cerca de um milímetro por ano e guarda muito carbono. Por isso é área frágil: sempre pela trilha ou pela passarela.", "É a caixa d'água da serra. O Sphagnum retém muitas vezes o próprio peso em água. Pisotear destrói em segundos o que levou séculos para formar."],
    coord: ["As turfeiras são a caixa d'água do parque: o Sphagnum guarda a água e abastece as nascentes que viram rio. A gente protege com passarela e sinalização, e pede sempre para ninguém pisar.", "Turfeira é o banhado de musgo. Frágil demais: só se olha de longe, da trilha."],
    campo: ["Turfeira é aquele banhado com musgo fofo, o Sphagnum. Segura água feito esponja e alimenta as nascentes. Se pisar, estraga. A gente até fez passarela onde a trilha chega perto.", "Daqui da turfeira nascem os riachos. Por isso a gente cuida de não deixar ninguém pisar."],
    ronda: ["Na ronda eu fico de olho nas turfeiras: ninguém pode pisar, é tudo musgo Sphagnum, que guarda água como esponja. Quando alguém sai da trilha, eu aviso na hora.", "As turfeiras são a caixa d'água da serra. Sempre pela trilha ou pela passarela, por favor."]
  },
  sapinho: {
    preto: ["São os Melanophryniscus, sapinhos de 2 a 3 centímetros com a barriga vermelha. O de Cambará, o cambaraensis, só existe por aqui. Dependem das turfeiras e banhados. Quando ameaçados, mostram a barriga vermelha: é aviso de que têm toxina. Nunca toquem.", "Sapinho-de-barriga-vermelha: espécie ameaçada, vive nas turfeiras e na beira dos arroios. Menor que um polegar, anda mais do que pula."],
    coord: ["São sapinhos minúsculos de barriga vermelha, que dependem das turfeiras. Se o banhado some, eles somem. Olhem com cuidado onde pisam.", "O sapinho de Cambará é raríssimo. A barriga vermelha é aviso: tem toxina na pele."],
    campo: ["Sapinho-de-barriga-vermelha: menor que um polegar. Vive no banhado e na beira do arroio. Se ficar bravo, levanta as patinhas e mostra o vermelho. Não toca!", "Quando chove ou tem neblina eles aparecem mais. Cuidado onde pisa."],
    ronda: ["Já vi vários na ronda, nos dias úmidos, perto do banhado. São minúsculos e ameaçados. Quando mostram a barriga vermelha, é só se afastar com calma.", "O sapinho só existe por aqui. Olhar onde pisa é protegê-lo."]
  },
  aves: {
    preto: ["A gralha-azul planta as araucárias: enterra pinhões e esquece alguns. O quero-quero defende o ninho com rasantes, mas é só susto. E quando o leão-baio passa, a mata inteira fica em silêncio: as aves dão o alarme. O lobo-guará, bem maior que o graxaim, é quem cede lugar só ao leão-baio. Cada um no seu espaço.", "Ouvir a mata calar de repente é sinal de que um predador grande passou por perto. Fiquem tranquilos e em silêncio que dá para ver de longe."],
    coord: ["Aqui a mata tem muita ave: gralha-azul, papagaio, pica-pau, tucano de vez em quando, quero-quero e curicaca no campo. Se o quero-quero fizer rasante, é só se afastar com calma. Não há risco.", "Quando o leão-baio passa, os passarinhos calam. É o jeito da mata avisar. O lobo-guará se afasta dele sem briga."],
    campo: ["Escutou a algazarra? É o bando de gralhas-azuis. Elas expulsam até gavião. O quero-quero grita porque tem ninho no chão, é só dar a volta.", "Se a mata ficar quieta de repente, pode ser que o leão-baio esteja passando. Silêncio e calma."],
    ronda: ["Na ronda eu percebo tudo pelo som: quando os passarinhos calam, tem predador grande por perto. Quero-quero fazendo rasante, é só se afastar do ninho.", "As gralhas são as plantadoras de araucárias. Cuidar delas é cuidar do pinheiro."]
  },
  tchau: ["Até mais! Aproveite o parque e cuide dele.", "Tchau! Qualquer dúvida é só chamar.", "Boa visita! E lembre: lixo na mochila.", "Valeu! Se cuida na trilha."]
};

/* resposta de um tema para um membro da equipe (com o jeito de falar dele). `extra` = texto do dia (só quem faz ronda) */
export function resposta(npc, tema, extra){
  if(tema === "tchau") return P.tchau[Math.floor(Math.random() * P.tchau.length)];
  const L = P[tema][npc.perfil], t = L[Math.floor(Math.random() * L.length)];
  let r = npc.tique + t.charAt(0).toLowerCase() + t.slice(1);
  if(npc.perfil === "ronda" && extra) r += " " + extra;
  return r;
}
