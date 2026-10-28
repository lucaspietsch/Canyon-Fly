/* SÉRIE "TUPÃ" — lendas da mata contadas com Tupã. Só podem ser iniciadas com Tupã em uso (desbloqueado pelo raio na Sequoia Lunar). Rotinas: t3d/src/mundo/lenda/cenasTupa.js.
   Textos e etapas editáveis aqui. Dica de teste: no painel de missões (J) há atalhos de debug; Gritador e Boitatá pedem a noite (Digit4 com F3 aberto = 21h, "." avança 1 h). */
export const missoesTupa = [
  { id: "t01-anhanga", numero: 1, serie: "tupa", titulo: "Olhos de Brasa", descricao: "Vá à Vila Ouro Verde. Um cervo branco gigante, de olhos de brasa, espera por Tupã: é o Anhangá, o espírito da mata. Converse com ele e veja suas metamorfoses.",
    prereq: { personagem: "tupa" },
    etapas: [
      { id: "ir", texto: "Viajar até a Vila Ouro Verde (viagem rápida)", tipo: "ir", local: { ref: "vila" }, raioM: 60, viagem: ["vila"] },
      { id: "anhanga", texto: "Encontrar o Anhangá e conversar", tipo: "cena", cena: "tupa.anhanga" }
    ],
    recompensas: { texto: "Anhangá reconhece Tupã. A justiça na mata está de pé.", flags: ["anhanga"] } },
  { id: "t02-gritador", numero: 2, serie: "tupa", titulo: "Eliminar o Gritador", descricao: "À noite (a partir das 22h), um vulto grita nos arredores da vila. NUNCA responda ao grito. Fique em silêncio e chame o raio de Tupã [V] quando ele chegar perto.",
    prereq: { personagem: "tupa", missoes: ["t01-anhanga"], horaMin: 22 },
    etapas: [
      { id: "ir", texto: "Viajar até a Vila Ouro Verde (viagem rápida)", tipo: "ir", local: { ref: "vila" }, raioM: 60, viagem: ["vila"] },
      { id: "gritador", texto: "Enfrentar o Gritador (sem responder ao grito)", tipo: "cena", cena: "tupa.gritador" }
    ],
    recompensas: { texto: "O Gritador se calou. Os gritos ajudarão a triangular o tesouro dos jesuítas (em breve).", flags: ["gritador"] } },
  { id: "t03-boitata", numero: 3, serie: "tupa", titulo: "O Boitatá", descricao: "A serpente de fogo que guarda a mata aparece. Não a ataque: siga-a, ponto a ponto, até onde o fogo-fátuo dorme.",
    prereq: { personagem: "tupa", missoes: ["t02-gritador"], horaMin: 18 },
    etapas: [
      { id: "ir", texto: "Viajar até a Vila Ouro Verde (viagem rápida)", tipo: "ir", local: { ref: "vila" }, raioM: 60, viagem: ["vila"] },
      { id: "boitata", texto: "Seguir o Boitatá até o fogo-fátuo", tipo: "cena", cena: "tupa.boitata" }
    ],
    recompensas: { texto: "O Boitatá se acalma. Falta o equilíbrio final da mata.", flags: ["boitata"] } },
  { id: "t04-equilibrio", numero: 4, serie: "tupa", titulo: "O Equilíbrio da Mata", descricao: "Em breve: missão final de Tupã e Anhangá. Passos editáveis em etapas.", emBreve: true,
    prereq: { missoes: ["t03-boitata"] }, etapas: [] }
];
