/* ============================================================================================================
   EVENTOS AGENDADOS — tudo num lugar só (horários do relógio do jogo, recorrência, chance, altitudes, duração).
   Para criar um evento novo (eclipse lunar, eclipse solar...): acrescente um bloco aqui e registre uma classe em eventos/agenda.js com `dispara(info)`.
   Altitudes em METROS acima da borda do cânion (monomotor) ou acima do jogador (jato). 1 m = 2,94 u.
   ============================================================================================================ */

export const EVENTOS = {
  monomotor: {
    ativo: true, horarios: [10],                      // todo dia às 10:00
    chance: 1,                                        // chance de ocorrer no dia
    chanceBaixo: 1 / 3,                               // ≈ 1 a cada 3 dias de jogo faz o trecho baixo (conduta irregular dentro do jogo)
    altNormal: 300, altBaixa: [120, 150],             // m acima da borda
    velocidade: 55,                                   // m/s (≈ 200 km/h)
    matricula: "PR-SGV",                              // fictícia
    raioFaunaBaixo: 520,                              // m: fauna e visitantes reagem se o voo baixo passa a menos disso
    somVolume: .5
  },
  jato: {
    ativo: true, horarios: [7, 9, 11, 13, 15, 17, 19, 21, 23, 1, 3, 5],     // a cada 2 h, começando às 7h
    chance: 1, altitude: 3000, velocidade: 240,       // m acima do jogador · m/s
    duracaoSeg: [40, 60],                             // s reais para atravessar o céu
    rumos: [20, 70, 130, 200, 250, 310],              // graus: rotas variam (litoral, Porto Alegre, norte...)
    somVolume: .12, rastro: false                     // sem condensação nessa altitude
  },
  meteoros: {
    ativo: true, horarios: [21],                      // todo dia às 21:00
    chance: 1, duracaoMin: [30, 40],                  // min de jogo
    picoEm: .35,                                      // fração da duração em que a chuva atinge o máximo (≈ 21:15)
    porSegPico: 1.7, porSegBase: .1,                  // meteoros por segundo REAL no pico e no começo/fim
    bolidos: [1, 2],                                  // por noite
    radiante: { az: 60, alt: 50 },                    // graus (de norte, e altura): de onde parecem partir
    limpaCeu: [20.5, 22]                              // as nuvens diminuem nesta janela
  },
  andorinhas: {
    ativo: true, horarios: [6.4, 9.5, 14.2, 17.2],      // o bando aparece nesses horários do dia (nascer do sol, manhã, tarde, fim de tarde)
    chance: .95, duracaoSeg: [110, 220]                  // s reais de permanência
  },
  /* já preparados, desligados */
  eclipseLunar: { ativo: false, horarios: [], chance: 0 },
  eclipseSolar: { ativo: false, horarios: [], chance: 0 }
};
