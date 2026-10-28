import { PROCEDIMENTOS, BRIEFING, ITENS_DUPLA } from "../../../../../data/missoes/procedimentos.js";
import { OPERACAO as C } from "../../../../../data/missoes/operacao.js";
import { PORT } from "../../../portico.js";
import { U } from "../../config.js";

/* ============================================================================================================
   MISSÃO 7 — OPERAR NO LANÇAMENTO ("Iniciar Turno" passa a ficar no posto do lançamento)
   Para cada um dos 3 clientes: procedimento do lançamento (as 8 etapas do jogo) → lançamento → câmera de trás acompanha a descida (comemora depois de ~30 m) →
   o jogador volta ao deck e acompanha a equipe do recebimento a ~720 m (setas laranjas nos operadores e vermelha no resgatista, terminal narrando).
   2º cliente: para perto do cercado → extração simples · 3º: vento forte, para sobre o vão → extração moderada. A missão termina depois do 3º cliente.
   FUTURO (estrutura pronta, NÃO feito agora): formato real da plataforma de lançamento (desenho à mão) e a animação de puxar o gatilho (vídeo): ver `gatilho` abaixo.
   ============================================================================================================ */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.slice().sort(() => Math.random() - .5);

export function registraCenasM7(O){
  const { M, D, UI, W, reg, ext, m1 } = O, G = () => M.H.jogo, A = () => G().atores;
  const LX = PORT.lanca;
  const ROTA = ["normal", "simples", "moderada"], VENTO = ["brisa", "vento", "rajada"], PESO = [[75, 3], [88, 2], [64, 0]];

  /* GANCHO (a fazer): animação de puxar o gatilho. Quando o vídeo chegar, troque o corpo desta função (ela só avisa o terminal e espera um instante). */
  async function gatilho(X){ X.msg("tirolesa", "Gatilho acionado: backup retirado"); await X.espera(D.acelera ? .1 : .8); }

  /* ---------- as 8 etapas do procedimento, com o jogador no comando ---------- */
  async function procedimento(X, k, st, cli){
    const a = A(), via = C.via, kmh = m1.ventoKmh(), lim = m1.limites(kmh) || { min: 60, max: 110 };
    const total = PESO[k][0] + PESO[k][1], et = (i) => "INICIAR TURNO · CLIENTE " + (k + 1) + "/3 · ETAPA " + (i + 1) + "/8";
    /* 1 pesagem */
    st.pose = "idle";
    const ok = total >= lim.min && total <= lim.max;
    for(;;){
      const r = await X.painel({ etiqueta: et(0), titulo: PROCEDIMENTOS[0].nome, fundo: false,
        corpo: ["Pessoa " + PESO[k][0] + " kg + mochila " + PESO[k][1] + " kg = " + total + " kg.", "Vento agora: " + kmh + " km/h · limites vigentes: " + lim.min + " a " + lim.max + " kg.", PROCEDIMENTOS[0].instrucao],
        botoes: [{ rotulo: "Peso dentro do limite: liberar o cliente", valor: "lib" }, { rotulo: "Recusar com educação", valor: "rec" }] });
      if(r === "lib" && ok) break;
      if(r === "lib"){ X.msg("emergencia", "Total de " + total + " kg fora do limite. " + PROCEDIMENTOS[0].explica); continue; }
      if(r === "rec" && ok){ X.msg("emergencia", "Esse cliente estava dentro do limite (" + total + " kg para " + lim.min + "–" + lim.max + " kg). Recusar quem pode descer também é erro."); continue; }
    }
    D.fala(a.op4, "Peso conferido: " + total + " kg. Liberado!", { dur: 2.5 });
    /* 2 briefing */
    const q = pick(BRIEFING);
    for(;;){
      const r = await X.painel({ etiqueta: et(1), titulo: PROCEDIMENTOS[1].nome, fundo: false, corpo: [q.q, PROCEDIMENTOS[1].instrucao], botoes: shuffle(q.o).map(o => ({ rotulo: o[0], valor: o })) });
      if(r[1]) break; X.msg("emergencia", q.e);
    }
    D.fala(a.lider2, q.e, { dur: 4.5 });
    /* 3 EPI: touca antes do capacete */
    st.pose = "trabalho"; const faltam = ["touca", "oculos", "capacete", "harness", "seat"], NOME = { touca: "Touca", oculos: "Óculos", capacete: "Capacete", harness: "Cinto paraquedista", seat: "Cadeirinha" };
    while(faltam.length){
      const r = await X.painel({ etiqueta: et(2), titulo: PROCEDIMENTOS[2].nome, fundo: false, corpo: [PROCEDIMENTOS[2].instrucao, "Faltam " + faltam.length + " itens."], botoes: shuffle(faltam).map(f => ({ rotulo: NOME[f], valor: f })) });
      if(r === "capacete" && faltam.includes("touca")){ X.msg("emergencia", "A touca vai por baixo do capacete: coloque a touca primeiro."); continue; }
      st.equip[r] = true; if(r === "seat"){ st.equip.colete = true; st.equip.cinta = true; } faltam.splice(faltam.indexOf(r), 1);
    }
    await X.painel({ etiqueta: et(2), titulo: "Ajustar as fitas na zona verde", fundo: false, corpo: PROCEDIMENTOS[2].explica, botoes: [{ rotulo: "Fitas ajustadas", valor: true }] });
    /* 4 roldana: via certa */
    st.pronto = true;
    for(;;){
      const r = await X.painel({ etiqueta: et(3), titulo: PROCEDIMENTOS[3].nome, fundo: false, corpo: [PROCEDIMENTOS[3].instrucao, "Via liberada pelo recebimento para este cliente: Via " + via + "."], botoes: [1, 3, 5].map(v => ({ rotulo: "Via " + v, valor: v })) });
      if(r === via) break; X.msg("emergencia", "Via trocada = risco de colisão e cabo sem freio pronto. " + PROCEDIMENTOS[3].explica);
    }
    /* 5 mosquetões */
    for(let i = 1; i <= 3; i++){ await X.painel({ etiqueta: et(4), titulo: "Mosquetão " + i + " de 3", fundo: false, corpo: PROCEDIMENTOS[4].instrucao, botoes: [{ rotulo: "Fechar o gatilho e travar a rosca", valor: true }] }); }
    await X.painel({ etiqueta: et(4), titulo: "Conferir puxando", fundo: false, corpo: PROCEDIMENTOS[4].explica, botoes: [{ rotulo: "Puxei os três: travados", valor: true }] });
    /* 6 dupla checagem (no 2º cliente há uma falha para achar) */
    st.pose = "idle"; const falha = k === 1 ? Math.floor(Math.random() * ITENS_DUPLA.length) : -1; let achou = falha < 0;
    for(;;){
      const r = await X.painel({ etiqueta: et(5), titulo: PROCEDIMENTOS[5].nome + " (segundo operador)", fundo: false,
        corpo: ITENS_DUPLA.map((it, i) => it.n + ": " + (i === falha && !achou ? it.ruim : it.ok)), botoes: [{ rotulo: "Tudo conforme: liberar", valor: "ok" }, ...(falha >= 0 && !achou ? [{ rotulo: "Reportar o item com falha e corrigir", valor: "rep" }] : [])] });
      if(r === "ok" && !achou){ X.msg("emergencia", "Você ia lançar com falha: \"" + ITENS_DUPLA[falha].n + " — " + ITENS_DUPLA[falha].ruim + "\". " + ITENS_DUPLA[falha].e); continue; }
      if(r === "rep"){ achou = true; X.msg("tirolesa", ITENS_DUPLA[falha].n + ": corrigido e conferido de novo"); continue; }
      break;
    }
    /* 7 rádio com o recebimento */
    const L = (rig, t, o = {}) => D.fala(rig, t, { dur: 2.6, ...o });
    await X.painel({ etiqueta: et(6), titulo: PROCEDIMENTOS[6].nome, fundo: false, corpo: PROCEDIMENTOS[6].instrucao, botoes: [{ rotulo: "📻 \"QAP Recebimento, status da Via " + via + "\"", valor: true }] });
    L(a.op5, "QAP Recebimento, status da Via " + via + ".", {}); await X.espera(D.acelera ? .2 : 1.8); L(a.lider3, "Via " + via + " liberada.", { semBalao: true }); await X.espera(D.acelera ? .2 : 1.6);
    await X.painel({ etiqueta: et(6), titulo: "Pedir a confirmação", fundo: false, botoes: [{ rotulo: "📻 \"Recebimento, confirmação da Via " + via + "?\"", valor: true }] });
    L(a.op5, "Recebimento, confirmação da Via " + via + "?", {}); await X.espera(D.acelera ? .2 : 1.8); L(a.lider3, "Confirmado: Via " + via + " liberada.", { semBalao: true }); await X.espera(D.acelera ? .2 : 1.4);
    /* 8 contagem e lançamento */
    await X.painel({ etiqueta: et(7), titulo: PROCEDIMENTOS[7].nome, fundo: false, corpo: PROCEDIMENTOS[7].instrucao, botoes: [{ rotulo: "INICIAR CONTAGEM", valor: true }] });
    D.fala(a.lider2, "Sejam muito bem-vindos à Tirolesa Mais Alta das Américas! Olhem muito para baixo, pois as nossas emoções começam em:", { dur: 5 }); await X.espera(D.acelera ? .3 : 4.8);
    for(const n of ["3…", "2…", "1…"]){ L(a.lider2, n, { dur: 1 }); await X.espera(D.acelera ? .1 : 1); }
    L(a.lider2, "Valeu, galera! O mundo é de vocês!!!", {}); await X.painel({ etiqueta: et(7), titulo: "Liberar o cliente", fundo: false, botoes: [{ rotulo: "RETIRAR O BACKUP E LIBERAR O CLIENTE", valor: true }] });
    await gatilho(X);
  }

  reg("m7.turno", async (X) => {
    const posto = W.posto(), a = A(), via = C.via, thay = G().thaynara;
    X.alvo({ x: posto.p.x, z: posto.p.z, rotulo: "Iniciar Turno" });
    await M.missoes.hotspot("turno", posto.p, "Iniciar Turno", 4.5);
    X.alvo(null);
    const pitNpc = M.dia1 && M.dia1.ativo() ? M.dia1.pit.rig() : null, marcos = a.resg; if(pitNpc) a.resg = pitNpc;
    D.mundoLiga(() => {}); G().papelOp6(thay);
    D.setSetas([...[() => thay, () => a.op7, () => a.op9, () => a.lider3].map(r => ({ rig: r, cor: "#ff8a00" })), { rig: () => a.resg, cor: "#e53935" }]);
    const hold = { fn: null }, cliOpc = m1.cliOpc;
    const mundo = (st) => D.mundoLiga((dt, t) => {
      G().plataforma({ t, chk: st ? { via, pose: st.pose } : null, cli: st ? cliOpc() : undefined, equip: st ? st.equip : {}, pronto: st ? st.pronto : false, fila: 0 });
      if(hold.fn) hold.fn(dt, t); else G().recebimentoEspera(via);
    });
    try{
      X.msg("tirolesa", "Turno iniciado na plataforma de lançamento: 3 clientes");
      X.msg("info", "Dica: olhe para o recebimento (a ~720 m) com o zoom do modo foto (F) para acompanhar a equipe");
      for(let k = 0; k < ROTA.length; k++){
        const tipo = ROTA[k]; M.vento.forca(VENTO[k]); X.msg("natureza", "Vento para o cliente " + (k + 1) + ": " + ["fraco", "com rajadas", "forte"][k]);
        /* 1 · procedimento no lançamento (modo mundo) */
        const st = { equip: {}, pronto: false, pose: "idle" }; hold.fn = null; mundo(st);
        await procedimento(X, k, st, cliOpc());
        /* 2 · descida: câmera de trás acompanha (cinema), comemora depois de ~30 m */
        D.mundoDesliga(); D.cinemaOn(); G().papelOp6(thay);
        X.msg("tirolesa", "Cliente " + (k + 1) + " lançado na Via " + via);
        const longo = tipo === "moderada", d = m1.descida(X, { via, tras: true, comemora: tipo === "normal", xFim: longo ? 900 : 90, dur: C.descidaSegundos * (longo ? .55 : 1) });
        await X.esperaCond(() => d.fim, 240);
        D.cinemaOff(); G().papelOp6(thay);
        /* 3 · de volta ao deck do lançamento: a equipe do recebimento trabalha lá longe */
        hold.fn = null; mundo(null);
        if(tipo === "normal"){
          X.msg("tirolesa", "Cliente " + (k + 1) + " chegando ao recebimento");
          const rc = m1.recebimento(X, { via, dupla: "auto" }); hold.fn = rc.quadro; await X.esperaCond(() => rc.R.fim, 240);
        } else {
          X.msg("emergencia", tipo === "simples" ? "Cliente " + (k + 1) + " parou perto do cercado: extração simples" : "Cliente " + (k + 1) + " parou sobre o vão do cânion: extração moderada");
          const Dd = { via, cli: cliOpc() };                                  // (o resgatista NPC — o Pit no Dia 1 — vai pelo cabo)
          await ext.automatica(X, tipo, Dd, hold);
          X.msg("tirolesa", "Cliente " + (k + 1) + " no deck: procedimento de recebimento");
          const rc = m1.recebimento(X, { via, dupla: "auto", t0: 3.8 }); hold.fn = rc.quadro; await X.esperaCond(() => rc.R.fim, 240);
        }
        X.msg("missao", "Cliente " + (k + 1) + " concluído");
        hold.fn = null; await X.espera(D.acelera ? .3 : 2);
      }
      await X.confirma("Turno concluído!", "Concluir", { etiqueta: "MISSÃO 7", corpo: "Os 3 lançamentos foram feitos: normal, extração simples e extração moderada.", fundo: false });
    }finally{
      a.resg = marcos; D.setSetas([]); D.mundoDesliga(); D.cinemaOff(); G().papelOp6(null); M.vento.forca("brisa");
    }
  });
}
