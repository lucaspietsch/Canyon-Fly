import { RECEBIMENTO_LEGENDAS } from "../../../../../data/missoes/procedimentos.js";
import { OPERACAO as C } from "../../../../../data/missoes/operacao.js";

/* ============================================================================================================
   MISSÃO 5 — RECEBER CLIENTES: o jogador opera o recebimento de 3 clientes.
     cliente 1: sem vento (brisa), chega normalmente · cliente 2: com vento → extração simples · cliente 3: vento forte no meio do cânion → extração moderada (o resgatista Pit vai com o cinto).
   O vento vem do sistema de vento já criado (M.vento.forca): brisa, vento e rajada.
   ============================================================================================================ */
export function registraCenasM5(O){
  const { M, D, UI, reg, ext } = O, G = () => M.H.jogo, A = () => G().atores, cen = M.cen;
  const cliOpc = () => ({ ...C.cliente });

  /* recebimento interativo: o roteiro de 23,6 s do jogo, com as ações do jogador (dupla checagem e aviso de via liberada) */
  async function receber(X, via, t0 = 0, cli = cliOpc()){
    const R = { t: t0, t0, cli, via, maxComp: .46 + Math.random() * .28, fim: false, espera: null, dupla: t0 > 7.8, pausa: false, ptPos3: null }; let leg = -1;
    D.roda((dt, t) => {
      if(!R.espera && !R.pausa) R.t += dt;
      if(R.t >= 7.8 && !R.dupla){ R.t = 7.8; R.espera = "dupla"; }
      if(R.t > 24.6) R.fim = true;
      const i = RECEBIMENTO_LEGENDAS.findIndex(l => R.t >= l[0] && R.t < l[1]); if(i >= 0 && i !== leg){ leg = i; D.narra(RECEBIMENTO_LEGENDAS[i][2]); }
      G().recebimento({ R, t });
    });
    if(!R.dupla){
      await X.esperaCond(() => R.espera === "dupla", 120);
      for(const [n, txt] of [[1, "Ponto 1 · corda branca (à esquerda do cliente)"], [2, "Ponto 2 · corda vermelha (à direita do cliente)"]])
        await X.painel({ etiqueta: "DUPLA CHECAGEM · " + n + "/2", titulo: txt, fundo: false, corpo: "Confira que a cadeirinha está clipada neste ponto. Só depois o cliente pode ser desequipado.", botoes: [{ rotulo: "Conferido: clipado", valor: true }] });
      R.dupla = true; R.espera = null; X.msg("tirolesa", "Dupla checagem feita: a cadeirinha está clipada em 2 pontos");
    }
    await X.esperaCond(() => R.t >= 17.4, 120);
    R.pausa = true;
    await X.painel({ etiqueta: "RÁDIO COM O LANÇAMENTO", titulo: "Cadeirinha retirada: avisar que a Via " + via + " está liberada", fundo: false, botoes: [{ rotulo: "📻 \"Lançamento, Via " + via + " liberada\"", valor: true }] });
    R.pausa = false; D.fala(A().op6, "Lançamento, Via " + via + " liberada.", { dur: 2.6, tipo: "tirolesa" });
    await X.esperaCond(() => R.fim, 120);
    return R;
  }

  reg("m5.clientes", async (X) => {
    const via = C.via, a = A(), pit = a.op6, marcos = a.resg, thay = G().thaynara;
    D.cinemaOn();
    try{
      X.msg("tirolesa", "Início da recepção de clientes: 3 clientes nesta missão");
      const PLANO = [
        { tipo: "normal", vento: "brisa", rot: "sem vento", txt: "Vento fraco: o cliente chega normalmente." },
        { tipo: "simples", vento: "vento", rot: "com vento", txt: "Rajadas pararam o cliente a 30 m das molas: extração simples." },
        { tipo: "moderada", vento: "rajada", rot: "vento forte", txt: "Vento forte no meio do cânion: o cliente parou sobre o vão. Extração moderada: o resgatista Pit vai com o cinto buscar o cliente." }
      ];
      for(let k = 0; k < PLANO.length; k++){
        const pl = PLANO[k]; M.vento.forca(pl.vento);
        X.msg("natureza", "Vento para o cliente " + (k + 1) + ": " + pl.rot);
        await X.confirma("Cliente " + (k + 1) + " de 3 · " + pl.rot, "Receber o cliente", { etiqueta: "MISSÃO 5", corpo: pl.txt, fundo: false });
        X.msg("tirolesa", "Lançamento: cliente " + (k + 1) + " liberado na Via " + via);
        let R;
        if(pl.tipo === "normal"){ G().papelOp6(null); R = await receber(X, via, 0); }
        else {
          const Dd = { via, cli: cliOpc() };
          const pitNpc = M.dia1 && M.dia1.ativo() ? M.dia1.pit.rig() : null;
          if(pl.tipo === "moderada" && pitNpc){          // Dia 1: o resgatista Pit (NPC) vai com o cinto; o líder autoriza pelo rádio
            a.resg = pitNpc; G().papelOp6(null);
            D.fala(pitNpc, "Coordenador, solicito autorização para extração moderada na Via " + via + ".", { tipo: "emergencia", dur: 4.5 });
            await X.painel({ etiqueta: "EXTRAÇÃO MODERADA", titulo: "O Pit pede autorização para a extração moderada", fundo: false, corpo: "O cliente parou sobre o vão. Sem a sua autorização (líder), não há extração.", botoes: [{ rotulo: "Autorizado: siga o PAE e mantenha o rádio aberto", valor: true }] });
            D.fala(pitNpc, "Autorizado! Vou equipar o cinto e buscar o cliente.", { tipo: "emergencia", dur: 3.5 });
            const hold = { fn: null }; D.roda((dt, t) => { if(hold.fn) hold.fn(dt, t); });
            await ext.automatica(X, "moderada", Dd, hold);
          } else {
            if(pl.tipo === "moderada"){ a.resg = pit; G().papelOp6(thay); } else { a.resg = marcos; G().papelOp6(null); }
            await ext.jogador(X, pl.tipo, Dd);
          }
          R = await receber(X, via, 3.8, Dd.cli);
          a.resg = marcos; G().papelOp6(null);
        }
        X.msg("missao", "Cliente " + (k + 1) + " recebido em segurança (" + pl.rot + ")");
        if(k < PLANO.length - 1) await X.espera(D.acelera ? .3 : 1.5);
      }
      await X.confirma("Os 3 clientes foram recebidos!", "Concluir", { etiqueta: "MISSÃO 5", corpo: "Cliente 1 normal, cliente 2 com extração simples e cliente 3 com extração moderada.", fundo: false });
    }finally{
      a.resg = marcos; G().papelOp6(null); M.vento.forca("brisa"); D.cinemaOff();
    }
    M.H.andarMod.colocar(cen.spawn.x, cen.spawn.z, cen.spawn.yaw + Math.PI);
  });
  return { receber };
}
