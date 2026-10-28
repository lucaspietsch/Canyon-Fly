/* MISSÃO 5 — RECEBER CLIENTES: 3 clientes no recebimento (normal, extração simples, extração moderada). Vento: sistema de vento (brisa, vento, rajada). */
export const m05 = {
  id: "m05-receber-clientes", numero: 5, serie: "principal", titulo: "Receber clientes",
  descricao: "No recebimento, opere a chegada de 3 clientes: sem vento, com vento (extração simples) e com vento forte no meio do cânion (extração moderada, o resgatista Pit vai com o cinto buscar o cliente).",
  prereq: { missoes: ["m04-inspecao"] }, inicio: { hora: 9.5, local: { ref: "recebimento" } },
  etapas: [
    { id: "ir", texto: "Ir ao deck de recebimento", tipo: "ir", local: { ref: "recebimento" }, raioM: 25 },
    { id: "clientes", texto: "Receber os 3 clientes (normal, extração simples e extração moderada)", tipo: "cena", cena: "m5.clientes", local: { ref: "recebimento" } }
  ],
  recompensas: { texto: "Os 3 clientes foram recebidos em segurança." }
};
