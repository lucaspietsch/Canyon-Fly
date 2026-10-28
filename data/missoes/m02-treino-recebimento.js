/* MISSÃO 2 — TREINAMENTO NO RECEBIMENTO. Checklists: formulários 122 (Recebimento) e 124 (Cadeirinhas), de build/checklist-atualizado.html. */
export const m02 = {
  id: "m02-treino-recebimento", numero: 2, serie: "principal", titulo: "Treinamento no Recebimento",
  descricao: "Receba o treinamento de como operar na plataforma de recebimento e faça todos os checklists do recebimento, item por item, com o instrutor.",
  prereq: { missoes: ["m01-descer"] }, inicio: { local: { ref: "recebimento" } },
  etapas: [
    { id: "ir", texto: "Ir ao deck de recebimento", tipo: "ir", local: { ref: "recebimento" }, raioM: 25 },
    { id: "instrucao", texto: "Receber o treinamento do instrutor (Renato)", tipo: "cena", cena: "m2.instrucao", local: { ref: "recebimento" } },
    { id: "checklists", texto: "Fazer todos os checklists do recebimento com o instrutor", tipo: "cena", cena: "m2.checklists", local: { ref: "recebimento" } }
  ],
  recompensas: { texto: "Treinamento no recebimento concluído." }
};
