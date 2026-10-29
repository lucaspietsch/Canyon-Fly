/* PODERES DOS PERSONAGENS (CanyonFly). Tecla V (ou o botão na tela) usa o poder do personagem em uso. Tudo ajustável aqui.
   recarga: segundos entre usos · alcanceM: alcance em metros · cone: abertura da mira em graus (de cada lado da frente do personagem) */
export const PODERES = {
  tupa:   { id: "raio",  nome: "Raio de Tupã", texto: "Faz cair um raio do céu sobre os inimigos.", recarga: 3.2, alcanceM: 70, cone: 28, raioM: 5, danoInimigo: 1, alturaCeuM: 90 },
  sepe:   { id: "arco",  nome: "Arco e flechas infinitas", texto: "Dispara flechas sem fim (nunca acabam).", recarga: 0.45, alcanceM: 120, cone: 18, velocidadeMS: 85, gravidade: 9, danoInimigo: 1 },
  /* Diully (só transformada): V = TELECINESE — ergue o inimigo/objeto mirado com brilho dourado e segura no ar; V de novo = ARREMESSA longe · botão direito = erguer e
     segurar (solta ao largar) · teclas.chao = BATE no chão · teclas.labia = LÁBIA com o alvo mirado (pessoas: diálogo com chance de sucesso; se convence, desiste ou muda de lado). */
  diully: { id: "telecinese", nome: "Telecinese de Diully", texto: "Ergue e segura com brilho dourado; V de novo arremessa; Y bate no chão; U Lábia.", recarga: .5, alcanceM: 30, cone: 25, alturaM: 2.5, arremessoMS: 24, danoArremesso: 2, danoChao: 3, teclas: { chao: "KeyY", labia: "KeyU" },
    labia: { recarga: 4, alcanceM: 18, cone: 40, chance: .65 } },
  /* Krig (só transformado, no tempo antigo): V = investida em chamas · teclas.golpe = golpe no chão (empurra) · teclas.voo = liga/desliga o voo (vooM de altura, velocidadeVoo × a corrida) · teclas.rugido = rugido que atordoa animais e sombras sem ferir.
     (E, Q e F já são interagir, câmera e foto no jogo; por isso Y / U / I — troque aqui.) */
  krig:   { id: "investida", nome: "Fúria de Krig", texto: "Investida em chamas; Y golpe no chão, U voo, I rugido.", recarga: 1.2, alcanceM: 12, cone: 30, empurraM: 6, danoInimigo: 1, vooM: 5, velocidadeVoo: 2, rugidoM: 25, rugidoSeg: 4, teclas: { golpe: "KeyY", voo: "KeyU", rugido: "KeyI" } },
  /* Jackão (só transformado): V = tiro do fuzil (balas infinitas; recarga só animação a cada `pente` tiros) · botão direito do mouse = mirar (zoom) ·
     teclas.granada = granada (granadasPorZona por zona; recarregam ao trocar de zona; fumaça + empurrão, sem dano à mata) · teclas.oculos = óculos de RA
     (contorno e distância de inimigos escondidos até oculosM, através de mata e névoa) · teclas.choque = alterna munição de choque (atordoa animais e sombras sem ferir). */
  jackao: { id: "tiro", nome: "Fuzil do Jackão", texto: "Tiro (balas infinitas); botão direito mira; Y granada, U óculos de RA, I munição de choque.", recarga: .18, alcanceM: 140, cone: 5, coneMira: 2.5, pente: 30, recargaSeg: 1.6, danoInimigo: 1, granadasPorZona: 3, granadaM: 14, granadaRaioM: 7, granadaSeg: 1.6, oculosM: 150, choqueSeg: 4, teclas: { granada: "KeyY", oculos: "KeyU", choque: "KeyI" } },
  /* Mohr (só transformado): V = onda (puxa água de rio/arroio/poça num raio aguaPertoM — 1,6× mais forte — ou do chão úmido; empurra e derruba) ·
     teclas.avalanche = pedras e terra descem a encosta à frente (só com declive ≥ declivMin, senão avisa) · teclas.lama = lama prende os pés (imobiliza sombras e animais sem ferir). */
  mohr:   { id: "onda", nome: "Onda de Mohr", texto: "Onda d'água que empurra; Y avalanche na encosta, I lama que prende.", recarga: 3, alcanceM: 16, cone: 45, empurraM: 12, danoInimigo: 1, aguaPertoM: 25, fatorAgua: 1.6, avalancheM: 18, declivMin: .12, pedras: 16, lamaM: 10, lamaSeg: 4, teclas: { avalanche: "KeyY", lama: "KeyI" } },
  /* Mary (só transformada): V = bola de FOGO (mão direita) que explode em área — some ao tocar a mata (regra do Boitatá) · teclas.gelo = rajada de GELO (mão esquerda)
     que congela o alvo em cristais por geloSeg (imobiliza animais e sombras sem ferir) · teclas.combo = só em alvo congelado: explosão de VAPOR com dano e empurrão extras. */
  mary:   { id: "fogo", nome: "Fogo e Gelo de Mary", texto: "Bola de fogo que explode; U rajada de gelo que congela; Y vapor (só em alvo congelado).", recarga: 1.4, alcanceM: 45, cone: 22, fogoRaioM: 5, danoInimigo: 1, geloM: 40, coneGelo: 18, geloSeg: 5, vaporRaioM: 8, vaporDano: 3, teclas: { gelo: "KeyU", combo: "KeyY" } },
  /* Kauling (só transformado): V = GRITO forte — anéis de som visíveis que ARREMESSAM os inimigos no cone e balançam a vegetação (rajada de vento) ·
     teclas.crescer = CRESCER crescerX vezes por crescerSeg s (câmera se afasta, passos pesados tremem a câmera, golpes mais fortes; encolhe sozinho dentro da mata = copas baixas) ·
     teclas.curto = grito curto que atordoa animais enfeitiçados e sombras sem ferir. Falas gaúchas ao usar. */
  kauling: { id: "grito", nome: "Grito do Kauling", texto: "Grito que arremessa; U cresce 2,5×; I grito curto que atordoa.", recarga: 2.5, alcanceM: 22, cone: 60, empurraM: 16, danoInimigo: 1, crescerX: 2.5, crescerSeg: 20, gritoCurtoM: 18, atordoaSeg: 4, teclas: { crescer: "KeyU", curto: "KeyI" },
    falas: ["Bah, tchê!", "Se aprochega!", "Mas que barbaridade!", "Capaz, índio velho!", "Tri legal, bah!"] },
  /* Carlão (só transformado): V = CHUTE da bola dourada — toque rápido: a bola acerta e VOLTA para o pé (encadeia chutes); segurar ≥ segurarSeg: a bola EXPLODE no impacto e
     outra nasce no pé na hora (infinito) · teclas.capoeira = golpes encadeados (ginga → meia-lua de compasso → martelo → armada) · teclas.rasteira = derruba e deixa no chão por rasteiraSeg (imobiliza animais sem ferir). */
  carlao: { id: "chute", nome: "Bola Dourada do Carlão", texto: "Chute: toque = bola volta, segurar = explode; Y capoeira; I rasteira.", recarga: .4, alcanceM: 40, cone: 25, bolaMS: 32, segurarSeg: .35, explosaoRaioM: 4.5, danoInimigo: 1, danoExplosao: 2, capoeiraM: 4, capoeiraDano: 1, rasteiraM: 5, rasteiraSeg: 4, teclas: { capoeira: "KeyY", rasteira: "KeyI" },
    golpes: ["ginga", "meia-lua de compasso", "martelo", "armada"] },
  atiara: { id: "olhos", nome: "Encantamento dos olhos", texto: "Seus olhos luminosos prendem quem os encara.", recarga: 6, alcanceM: 45, cone: 35, duracaoS: 8 }
};
export const PODERES_CFG = { tecla: "KeyV", espantalhosDebug: 3 };
export const FALAS_LABIA = [
  "“Olha, eu entendo seu lado, mas me dá dois minutinhos que eu te explico direitinho.”",
  "“Confia em mim: é o melhor negócio que você vai fazer hoje.”",
  "“Ninguém sai perdendo aqui — é só a gente conversar com calma.”",
  "“Se eu estiver errado, o próximo cafezinho é por minha conta.”"
];
