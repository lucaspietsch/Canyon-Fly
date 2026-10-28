/* MISSÃO 3 — TREINAMENTO NO LANÇAMENTO. Checklists: formulários 123 (Lançamento) e 124 (Cadeirinhas). */
export const m03 = {
  id: "m03-treino-lancamento", numero: 3, serie: "principal", titulo: "Treinamento no Lançamento",
  descricao: "Vá caminhando do recebimento até o lançamento, inicie o treinamento e faça todos os checklists do lançamento. Ao concluir, a viagem rápida passa a levar ao local de cada missão.",
  prereq: { missoes: ["m02-treino-recebimento"] }, inicio: { local: { ref: "recebimento" } },
  etapas: [
    { id: "ir", texto: "Ir caminhando do recebimento até o lançamento", tipo: "ir", local: { ref: "lancamento" }, raioM: 25 },
    { id: "treino", texto: "Iniciar o treinamento no lançamento", tipo: "cena", cena: "m3.treino", local: { ref: "lancamento" } },
    { id: "checklists", texto: "Fazer todos os checklists do lançamento", tipo: "cena", cena: "m3.checklists", local: { ref: "lancamento" } }
  ],
  recompensas: { viagem: ["*"], texto: "A partir daqui, a viagem rápida leva ao local de cada missão." }
};
