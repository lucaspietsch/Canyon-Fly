/* ============================================================================================================
   DIA 1 — O jogador é o novo LÍDER DE OPERAÇÕES da Tirolesa Mais Alta das Américas, no primeiro dia de trabalho, sempre acompanhado pelo PIT (resgatista da equipe).
   Tudo configurável aqui: agenda, ritmo do relógio (modo jornada), falas do Pit, nome padrão do jogador.
   ============================================================================================================ */
export const DIA1 = {
  nomePadrao: "Líder de Operações",
  titulo: "Dia 1 — Tirolesa Mais Alta das Américas",
  boasVindas: "Bem-vindo à Tirolesa Mais Alta das Américas! Eu sou o Pit, resgatista da equipe. Hoje eu fico do seu lado em cada passo.",
  /* agenda do dia (hora do jogo): quando cada missão "começa". Fora do horário o jogo oferece "Avançar até …". */
  agenda: { "m01-descer": 6, "m02-treino-recebimento": 7, "m03-treino-lancamento": 7 + 40 / 60, "m04-inspecao": 8, "m05-receber-clientes": 9, "m06-almoco": 12, "m07-operar-lancamento": 13, "m08-em-breve": 17.5 },
  /* MODO JORNADA: durante o Dia 1 o relógio corre mais devagar. 1 minuto de jogo = `segPorMinuto` segundos reais (a escala normal é 1 h = 30 s, ou seja 0,5 s por minuto). */
  jornada: { ativo: true, segPorMinuto: 2 },
  emergencia10hDesligada: true,                          // a emergência diária das 10 h (bombeiro + SAMU) só volta no Dia 2: o SAMU aparece na Missão 8
  /* acompanhamento do Pit */
  pit: { velocidadeM: 6.2, distSegueM: 3.6, distChamaM: 140, chamaCadaSeg: 70, esperaSeg: 4 },
  falas: {
    inicio: ["Bom dia, chefe! Vamos? O carro está aqui na praça.", "O parque fica a uns 9 km daqui, por estrada de terra. Eu vou te mostrando tudo no caminho."],
    carro: ["A tirolesa tem 720 metros de extensão e uns 900 de profundidade no vão. Chega a 35 km/h, então é bom ficar de olho no vento.", "Aquele é o Parque Nacional da Serra Geral: os cânions aqui são de tirar o fôlego.", "Chegamos! Vamos subir a trilha até o mirante: é lá que fica o lançamento."],
    trilha: ["Respire fundo: a subida é tranquila. Se ver fauna, pare e observe de longe, combinado?", "Olha o clima: dá pra ver o vento mexendo no capim. Isso a gente sempre confere antes de operar."],
    lancamento: ["Esse é o lançamento. Hoje você vai descer como cliente, pra sentir o que o nosso visitante sente."],
    chegada: ["Bem-vindo ao recebimento! Agora vem o treinamento de verdade."],
    m02: ["Esse é o Renato, líder do recebimento. Ele vai te explicar tudo, e eu fico por perto.", "Cada item do checklist existe por um motivo. Vai com calma."],
    m03: ["Agora a caminhada até o lançamento. É daqui que a emoção começa!", "Boa! Agora você já conhece o recebimento e o lançamento. Daqui pra frente a viagem rápida leva ao local de cada missão."],
    m04: ["Hoje a inspeção é sua. Fica de olho no relógio: a operação tem que estar liberada até 8:55."],
    m05: ["Chegou a hora dos clientes! Qualquer coisa fora do normal, eu pego o cinto e vou buscar."],
    m06: ["Hora do almoço! Senta aqui comigo.", "A manhã foi puxada, hein? Mas você se saiu bem. À tarde é você quem opera o lançamento."],
    m07: ["Agora você no lançamento e eu no recebimento. Eu faço as extrações, fica tranquilo."],
    aviso: ["Faltam {min} minutos pra liberar a operação!"],
    longe: ["Ei, o objetivo é pro outro lado!", "Ei, chefe! Não era por ali!"],
    monomotor: ["Olha lá o monomotor! Esse passa todo dia por volta das 10 h.", "Lá vai o avião: dá pra ver bem daqui."],
    jato: ["Olha o avião de passageiros lá em cima, a uns 3.000 metros."],
    vento: ["O vento aumentou, hein. Fica de olho: com mais de 40 km/h o peso mínimo do cliente sobe pra 60 kg."],
    neblina: ["A neblina está subindo pelo cânion. Ela some tão rápido quanto aparece."],
    fauna: ["Olha ali! Fique longe, e só fotografe."]
  }
};
