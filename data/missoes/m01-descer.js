/* MISSÃO 1 — DESCER NA TIROLESA. As rotinas ("cena") ficam em t3d/src/mundo/missoes/operacao/cenasM1.js e usam os procedimentos de data/missoes/procedimentos.js. */
export const m01 = {
  id: "m01-descer", numero: 1, serie: "principal", titulo: "Descer na Tirolesa",
  descricao: "Pegue carona na praça de Cambará do Sul até o Cânion Fortaleza, faça a trilha até o mirante e desça na tirolesa como cliente. A missão termina no recebimento.",
  prereq: {}, inicio: { local: { ref: "cidade", dx: 6, dz: 0 } },
  etapas: [
    { id: "carona", texto: "Pegar carona na praça de Cambará do Sul até o Cânion Fortaleza", tipo: "cena", cena: "m1.carona", local: { ref: "cidade", dx: 12, dz: 6 }, viagem: ["estacionamento"] },
    { id: "trilha", texto: "Fazer a trilha a pé até o mirante e chegar ao lançamento", tipo: "ir", local: { ref: "lancamento" }, raioM: 25 },
    { id: "atividade", texto: "No lançamento, usar “Realizar Atividade”: ouvir o procedimento, descer na tirolesa e concluir a chegada no recebimento", tipo: "cena", cena: "m1.atividade", local: { ref: "lancamento" } }
  ],
  recompensas: { flags: ["operar"], texto: "Liberada a opção “Operar na Tirolesa” no lançamento." }
};
