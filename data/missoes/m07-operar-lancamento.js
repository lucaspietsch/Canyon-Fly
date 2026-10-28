/* MISSÃO 7 — OPERAR NO LANÇAMENTO. A tela "Iniciar Turno" passa a ficar no posto do lançamento. A missão NÃO termina no lançamento: segue com a descida (câmera de trás),
   o acompanhamento da equipe do recebimento a ~720 m e as extrações simples e moderada. Rotina: t3d/src/mundo/missoes/operacao/cenasM7.js.
   GANCHOS FUTUROS (a fazer): formato real da plataforma de lançamento (desenho à mão) e animação de puxar o gatilho (vídeo). */
export const m07 = {
  id: "m07-operar-lancamento", numero: 7, serie: "principal", titulo: "Operar no Lançamento",
  descricao: "Vá ao lançamento (viagem rápida), inicie o turno e lance 3 clientes: acompanhe a descida e a equipe do recebimento a ~720 m (setas laranjas nos operadores, vermelha no resgatista). Cliente 2: extração simples. Cliente 3: extração moderada.",
  prereq: { missoes: ["m06-almoco"] }, inicio: { hora: 13.5, local: { ref: "lancamento" } },
  etapas: [
    { id: "ir", texto: "Viajar até o lançamento (viagem rápida)", tipo: "ir", local: { ref: "lancamento" }, raioM: 25, viagem: ["lancamento"] },
    { id: "turno", texto: "Usar “Iniciar Turno” no posto do lançamento e lançar os 3 clientes", tipo: "cena", cena: "m7.turno", local: { ref: "lancamento" } }
  ],
  recompensas: { texto: "Turno de lançamento concluído." }
};
