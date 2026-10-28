/* Registro das missões do CanyonFly. Um arquivo por missão (ou por grupo); aqui só se juntam. Sem missão "chumbada" no código do jogo. */
import { missoesEmBreve } from "./em-breve.js";
import { m01 } from "./m01-descer.js";
import { m02 } from "./m02-treino-recebimento.js";
import { m03 } from "./m03-treino-lancamento.js";
import { m04 } from "./m04-inspecao.js";
import { m05 } from "./m05-receber-clientes.js";
import { m07 } from "./m07-operar-lancamento.js";
import { m06 } from "./m06-almoco.js";
import { missoesTupa } from "./tupa.js";

/* Ajustes da interface e das regras de viagem rápida ligadas às missões */
export const MISSOES_CFG = {
  cartaoTopoPx: 150, dicaBaixoPx: 120,                         // cartão do objetivo (esquerda) e aviso "[E] ..." (embaixo)
  bloqueiaViagemAteLiberar: true,                              // recebimento e lançamento só entram na viagem rápida depois que uma missão libera
  viagemSempre: ["estacionamento", "cidade", "vila"]           // destinos que a viagem rápida sempre oferece
};

export const MISSOES = [m01, m02, m03, m04, m05, m06, m07, ...missoesTupa, ...missoesEmBreve];
