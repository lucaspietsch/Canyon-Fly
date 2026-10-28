/* MISSÃO 4 — INSPEÇÃO DIÁRIA. Limite: liberar a operação até 08:55 (hora do jogo). Passou do horário: a missão falha e pode ser repetida no dia seguinte.
   Os itens vêm dos checklists que já existem (122, 124, 125); limites e relógio em data/missoes/operacao.js (inspecao). */
import { OPERACAO } from "./operacao.js";
export const m04 = {
  id: "m04-inspecao", numero: 4, serie: "principal", titulo: "Inspeção diária",
  descricao: "Antes das 08:55: inspecione a pintura dos clips, passe o inclinômetro em todos os cabos, faça o checklist do trolley, inspecione capacetes, cadeirinhas, mosquetões e o deck, reúna os documentos do lançamento e libere a operação.",
  prereq: { missoes: ["m03-treino-lancamento"], horaMin: 6, horaMax: OPERACAO.inspecao.limite },
  horarioLimite: OPERACAO.inspecao.limite, relogioFator: OPERACAO.inspecao.relogioFator, repeteDiaSeguinte: true,
  inicio: { hora: OPERACAO.inspecao.horaInicio, local: { ref: "recebimento" } },
  etapas: [
    { id: "ir", texto: "Ir ao deck de recebimento", tipo: "ir", local: { ref: "recebimento" }, raioM: 25 },
    { id: "clips", texto: "Inspecionar a pintura dos clips dos cabos", tipo: "cena", cena: "m4.clips", local: { x: OPERACAO.pontos.clips.x, z: OPERACAO.pontos.clips.z } },
    { id: "inclinometro", texto: "Passar o inclinômetro em todos os cabos", tipo: "cena", cena: "m4.inclinometro", local: { x: OPERACAO.pontos.inclinometro.x, z: OPERACAO.pontos.inclinometro.z } },
    { id: "trolley", texto: "Inspecionar o trolley (checklist do trolley)", tipo: "cena", cena: "m4.trolley", local: { x: OPERACAO.pontos.trolley.x, z: OPERACAO.pontos.trolley.z } },
    { id: "equipamentos", texto: "Inspecionar capacetes, cadeirinhas, mosquetões e toda a área do deck de recebimento", tipo: "cena", cena: "m4.equipamentos", local: { x: OPERACAO.pontos.equipamentos.x, z: OPERACAO.pontos.equipamentos.z } },
    { id: "documentos", texto: "Reunir os documentos da inspeção feita no lançamento", tipo: "cena", cena: "m4.documentos", local: { ref: "lancamento" }, viagem: ["lancamento", "recebimento"] },
    { id: "liberar", texto: "Liberar a operação até 08:55", tipo: "cena", cena: "m4.liberar", local: { x: OPERACAO.pontos.liberar.x, z: OPERACAO.pontos.liberar.z }, viagem: ["recebimento"] }
  ],
  recompensas: { texto: "Operação do dia liberada dentro do horário." }
};
