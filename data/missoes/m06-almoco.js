/* MISSÃO 6 — ALMOÇO às 12:00 no refeitório. O refeitório é PROVISÓRIO (cercado do recebimento): o local certo será indicado pelo dono do projeto (data/missoes/operacao.js › refeitorio). */
import { OPERACAO } from "./operacao.js";
export const m06 = {
  id: "m06-almoco", numero: 6, serie: "principal", titulo: "Almoço",
  descricao: "Almoce no refeitório às 12:00 (refeitório provisório, perto do recebimento).",
  prereq: { missoes: ["m05-receber-clientes"], horaMin: 10.5, horaMax: 15 },
  inicio: { hora: 11.5, local: { ref: "recebimento" } },
  etapas: [
    { id: "ir", texto: "Ir ao deck de recebimento", tipo: "ir", local: { ref: "recebimento" }, raioM: 25 },
    { id: "almoco", texto: "Almoçar no refeitório às 12:00 (balcão do refeitório provisório)", tipo: "cena", cena: "m6.almoco", local: { x: OPERACAO.refeitorio.x, z: OPERACAO.refeitorio.z - 3 } }
  ],
  recompensas: { texto: "Almoço feito. (Refeitório provisório: local a definir.)" }
};
