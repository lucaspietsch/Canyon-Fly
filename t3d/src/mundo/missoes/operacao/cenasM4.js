import { CHECKLISTS, INCLINOMETRO } from "../../../../../data/missoes/procedimentos.js";
import { OPERACAO as C } from "../../../../../data/missoes/operacao.js";

/* ============================================================================================================
   MISSÃO 4 — INSPEÇÃO DIÁRIA (limite 8:55, relógio do jogo mais lento enquanto ela está ativa) · MISSÃO 6 — ALMOÇO
   Itens dos checklists: os mesmos formulários que já existem no projeto (122 Recebimento, 124 Cadeirinhas, 125 Trolley diário; 123 Lançamento no que é lido de lá).
   O jogo só LÊ esses itens: nada é gravado nos registros reais.
   ============================================================================================================ */
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

export function registraCenasM4(O){
  const { M, D, UI, W, reg } = O;
  const min = C.inspecao.minPorItem;
  const espera = (X, rotulo, p, raio = 4.5) => { X.alvo({ x: p.x, z: p.z, rotulo }); return M.missoes.hotspot("m4:" + rotulo, p, rotulo, raio); };

  /* 1 · pintura dos clips dos cabos (itens 16 e 17 do formulário 122) */
  reg("m4.clips", async (X) => {
    await espera(X, "Inspecionar a pintura dos clips dos cabos", C.pontos.clips);
    X.alvo(null);
    const it = CHECKLISTS.rec.itens.filter(t => /clips/i.test(t));
    await UI.checklist(X, { titulo: "Clips dos cabos", itens: it, minPorItem: min * 2, etiqueta: "INSPEÇÃO DIÁRIA" });
  });

  /* 2 · inclinômetro em todos os cabos (cabos 1 a 6 e o trolley, faixas normais do checklist) */
  reg("m4.inclinometro", async (X) => {
    await espera(X, "Passar o inclinômetro nos cabos", C.pontos.inclinometro);
    X.alvo(null);
    const [a, b] = INCLINOMETRO.faixaCabo, nc = [];
    for(let i = 1; i <= INCLINOMETRO.cabos; i++){
      const v = rnd([a, b]), ok = v >= a && v <= b;
      const r = await X.painel({ etiqueta: "INSPEÇÃO DIÁRIA · INCLINÔMETRO", titulo: "Cabo " + i + ": leitura " + v.toFixed(1) + "°", fundo: false,
        corpo: "Faixa normal informada pelo operador: " + a.toFixed(1) + " a " + b.toFixed(1) + " (checklist). Registrar esta leitura?", botoes: [{ rotulo: "Registrar leitura (conforme)", valor: "C" }, { rotulo: "Registrar como fora da faixa", valor: "NC" }] });
      if(r === "NC" || !ok) nc.push(i); X.avancaMin(min * 3);
    }
    const t = rnd(INCLINOMETRO.faixaTrolley);
    await X.painel({ etiqueta: "INSPEÇÃO DIÁRIA · INCLINÔMETRO", titulo: "Trolley (cabo 7): leitura " + t.toFixed(2) + "°", fundo: false, corpo: "Faixa normal do trolley: " + INCLINOMETRO.faixaTrolley.map(x => x.toFixed(2)).join(", ") + ".", botoes: [{ rotulo: "Registrar leitura", valor: true }] });
    X.avancaMin(min * 3); X.msg("missao", "Inclinômetro: 6 cabos + trolley lidos" + (nc.length ? " · fora da faixa: " + nc.join(", ") : " · todos na faixa"));
  });

  /* 3 · checklist do trolley (formulário 125) */
  reg("m4.trolley", async (X) => {
    await espera(X, "Inspecionar o trolley (checklist do trolley)", C.pontos.trolley);
    X.alvo(null);
    await UI.checklist(X, { titulo: CHECKLISTS.tro.nome, itens: CHECKLISTS.tro.itens, minPorItem: min, etiqueta: "INSPEÇÃO DIÁRIA" });
  });

  /* 4 · capacetes, cadeirinhas, mosquetões e área do deck de recebimento (formulários 124 e 122) */
  reg("m4.equipamentos", async (X) => {
    await espera(X, "Inspecionar capacetes, cadeirinhas, mosquetões e o deck", C.pontos.equipamentos);
    X.alvo(null);
    await UI.checklist(X, { titulo: CHECKLISTS.cad.nome, itens: CHECKLISTS.cad.itens, minPorItem: min, etiqueta: "INSPEÇÃO DIÁRIA" });
    await UI.checklist(X, { titulo: CHECKLISTS.rec.nome + " · área do deck", itens: CHECKLISTS.rec.itens, minPorItem: min, etiqueta: "INSPEÇÃO DIÁRIA" });
  });

  /* 5 · documentos da inspeção do lançamento (no posto do lançamento) */
  reg("m4.documentos", async (X) => {
    const posto = W.posto();
    await espera(X, "Reunir os documentos da inspeção do lançamento", posto.p, 5);
    X.alvo(null);
    const docs = [CHECKLISTS.lan.nome, "Cadeirinhas · lançamento (124)", "Inclinômetro das vias", "Trolley diário (125)"];
    for(const d of docs){ await X.painel({ etiqueta: "INSPEÇÃO DIÁRIA · DOCUMENTOS DO LANÇAMENTO", titulo: "Recolher: " + d, fundo: false, corpo: "Conteúdo e assinatura da folha: a definir (o jogo só confere que o documento foi reunido).", botoes: [{ rotulo: "Documento recolhido", valor: true }] }); X.avancaMin(2); }
    X.msg("missao", "Documentos da inspeção do lançamento reunidos (" + docs.length + ")");
  });

  /* 6 · liberar a operação (no recebimento, até 8:55) */
  reg("m4.liberar", async (X) => {
    await espera(X, "Liberar a operação do dia", C.pontos.liberar);
    X.alvo(null);
    const a = D.S ? M.H.jogo.atores : {};
    await X.painel({ etiqueta: "INSPEÇÃO DIÁRIA", titulo: "Liberar a operação do dia?", fundo: false, corpo: ["Todos os objetivos da inspeção foram cumpridos. Horário limite: 08:55 (agora " + M.ciclo.horaTexto() + ")."], botoes: [{ rotulo: "Liberar a operação", valor: true }] });
    D.fala(a.lider3, "Recebimento pronto. Operação liberada!", { tipo: "tirolesa" });
    X.msg("tirolesa", "Operação do dia liberada às " + M.ciclo.horaTexto());
  });

  /* ============================================================================================ M6 */
  reg("m6.almoco", async (X) => {
    const r = W.refeitorio(), p = r.bal;
    X.alvo({ x: p.x, z: p.z, rotulo: "Refeitório (provisório)" });
    X.msg("missao", "O refeitório é PROVISÓRIO (cercado do recebimento): o local certo ainda será definido.");
    X.dica("Almoço às " + String(C.almoco.hora).padStart(2, "0") + ":00 — use o relógio (teclas , . - =) para adiantar");
    M.missoes.S.esperaAte = C.almoco.hora;
    await X.esperaCond(() => M.ciclo.hora() >= C.almoco.hora, 3600);
    M.missoes.S.esperaAte = null;
    X.msg("info", "Meio-dia: hora do almoço");
    await M.missoes.hotspot("almoco", p, "Almoçar no refeitório", 5);
    X.alvo(null); X.dica(null);
    await X.painel({ etiqueta: "ALMOÇO", titulo: "Almoçar no refeitório", fundo: false, corpo: "Cardápio do dia: a definir.", botoes: [{ rotulo: "Almoçar (40 min)", valor: true }] });
    X.avancaMin(40); X.msg("info", "Você almoçou no refeitório");
    if(M.dia1 && M.dia1.ativo() && M.dia1.pit.S.presente){ const P = M.dia1.pit, F = M.dia1.DIA1.falas.m06; P.fixa(p.x + 3, p.z + 4, 0); P.linhas(F, 4.5); await X.espera(D.acelera ? .3 : 9); P.volta(); }
  });
}
