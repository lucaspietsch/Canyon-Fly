import { criarDiretor } from "./diretor.js";
import { criaUI } from "./ui.js";
import { criarMundoOperacao } from "./mundo.js";
import { registraCenasM1 } from "./cenasM1.js";
import { registraCenasM4 } from "./cenasM4.js";
import { registraCenasM5 } from "./cenasM5.js";
import { criaExtracao } from "./extracao.js";
import { registraCenasM7 } from "./cenasM7.js";
import { OPERACAO as C } from "../../../../../data/missoes/operacao.js";
import { U } from "../../config.js";

/* ============================================================================================================
   OPERAÇÃO DA TIROLESA (missões 1 a 7): liga o diretor de cenas, os painéis, as coisas físicas e as rotinas de cada missão ao sistema de missões.
   Os textos e etapas das missões ficam em data/missoes/m01…m07; aqui ficam só as rotinas ("cenas") que elas chamam pelo nome.
   ============================================================================================================ */
export function criarOperacao(M){
  const D = criarDiretor(M), W = criarMundoOperacao(M), UI = criaUI(M, D);
  const reg = (nome, f) => M.missoes.registraCena(nome, f);
  const O = { M, D, UI, W, reg, cfg: C };
  O.m1 = registraCenasM1(O);
  registraCenasM4(O); O.ext = criaExtracao(O); O.m5 = registraCenasM5(O); registraCenasM7(O);
  /* posto do lançamento (sempre visível): depois da missão 1 oferece "Operar na Tirolesa" (abre o jogo "Iniciar Turno") */
  const posto = W.posto(), hot = { id: "posto-atividade", x: posto.p.x, z: posto.p.z, r: 0, rotulo: () => "Operar na Tirolesa (Iniciar Turno)", acao: () => {
    if(M.H.irPara) M.H.irPara("jogo"); } };
  Object.defineProperty(hot, "r", { get: () => (M.missoes.flag("operar") && !M.missoes.ativa ? 4.5 * U : 0) });
  M.cen.hotspots.push(hot);
  return { ...O, diretor: D, tick: (dt) => D.tick(dt), desliga: () => { D.cinemaOff(); D.mundoDesliga(); D.setSetas([]); } };
}
