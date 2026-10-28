import { PORT } from "../../../portico.js";
import { U } from "../../config.js";
import { PROCEDIMENTOS, BRIEFING, ITENS_DUPLA, RECEBIMENTO_LEGENDAS, VENTO_TABELA, CHECKLISTS } from "../../../../../data/missoes/procedimentos.js";
import { OPERACAO as C } from "../../../../../data/missoes/operacao.js";

/* ============================================================================================================
   MISSÃO 1 — DESCER NA TIROLESA · MISSÃO 2 — TREINAMENTO NO RECEBIMENTO · MISSÃO 3 — TREINAMENTO NO LANÇAMENTO
   O texto das falas vem dos procedimentos que já existem (data/missoes/procedimentos.js: "Iniciar Turno" do jogo e checklists 122/123/124).
   ============================================================================================================ */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

/* velocidade ao longo da descida (a mesma curva do jogo): acelera no começo, perde um pouco no final */
const vel = (t) => clamp(t / .2, 0, 1) * (1 - .22 * ease((t - .72) / .28));
const VTOT = (() => { let s = 0; for(let i = 0; i < 200; i++) s += vel(i / 200) / 200; return s; })();

export function registraCenasM1(O){
  const { M, D, UI, W, reg } = O, G = () => M.H.jogo, A = () => G().atores, cen = M.cen;
  const LX = PORT.lanca;

  /* ---------- utilidades de cena ---------- */
  const dlg = async (X, linhas) => { for(const l of linhas){ const [rig, txt, op] = l; const dur = D.fala(rig, txt, op || {}); const t0 = performance.now(); D.consomePassa(); await X.esperaCond(() => performance.now() - t0 >= dur * 1000 || D.consomePassa() || D.acelera, dur + 2); } };
  const ventoKmh = () => Math.round(8 + Math.min(1.1, M.vento.intensidade) * 50);
  const limites = (kmh) => VENTO_TABELA.find(l => kmh <= l.ate) || null;
  const cliOpc = () => ({ ...C.cliente });

  /* ---------- movimento do cliente na descida (curva do jogo) ---------- */
  function descida(X, { via = C.via, dur = C.descidaSegundos, tras = false, comemora = false, foto = false, xFim = 90 }){
    const cli = cliOpc(), Dd = { via, t: 0, uau: 0, cli, tras, comemora: false, xFim, recua: 0, corte: true };
    const comprimento = (LX + 3 - Dd.xFim) / U;                                   // m
    let tn = 0, cum = 0; const out = { fim: false, metros: 0, vkmh: 0 };
    D.roda((dt, t) => {
      tn += dt / dur; const v = vel(clamp(tn, 0, 1)); cum = Math.min(1, cum + v * dt / dur / VTOT); Dd.t = .86 * cum;
      out.metros = comprimento * cum; out.vkmh = v * 35; Dd.uau = clamp(tn * 1.8, 0, 1) * (1 - ease((tn - .85) / .15));
      Dd.corte = false; if(comemora && out.metros > C.comemoraAposM && v > .55) Dd.comemora = true;
      if(tn > 0 && cum >= 0.995) out.fim = true;
      G().descida({ t, D: Dd });
    });
    if(foto) D.fotoHud(true);
    return out;
  }

  /* ---------- recebimento (23,6 s de roteiro do jogo), com a narração do terminal ---------- */
  function recebimento(X, { via = C.via, dupla = "auto", t0 = 0 } = {}){
    const R = { t: t0, t0, via, cli: cliOpc(), maxComp: .46 + Math.random() * .28, fim: false, espera: null, dupla: false, festa: false, ptPos3: null }; let leg = -1; const o = { R, espera: false };
    const quadro = (dt, t) => {
      if(!R.espera) R.t += dt;
      if(R.t >= 7.8 && !R.dupla){ R.t = 7.8; R.espera = "dupla"; if(dupla === "auto" && !R.auto){ R.auto = true; setTimeout(() => { R.dupla = true; R.espera = null; D.narra("Dupla checagem feita: a cadeirinha está clipada em 2 pontos."); }, 1600); } }
      const i = RECEBIMENTO_LEGENDAS.findIndex(l => R.t >= l[0] && R.t < l[1]); if(i >= 0 && i !== leg){ leg = i; D.narra(RECEBIMENTO_LEGENDAS[i][2]); }
      if(R.t > 24.6) R.fim = true;
      G().recebimento({ R, t });
    };
    return { R, quadro };
  }

  /* =================================================================================================== M1 */
  reg("m1.carona", async (X) => {
    const p = W.mostraCarona(true); if(!p){ X.msg("missao", "[a definir] ponto de carona não encontrado"); return; }
    const mo = W.S.motorista, d1 = !!(M.dia1 && M.dia1.ativo()), F = d1 ? M.dia1.DIA1 : null; X.alvo({ x: mo.av.position.x, z: mo.av.position.z, rotulo: d1 ? "Pit (carro da Serra Geral Vertical)" : "Carro da carona" });
    X.msg("missao", d1 ? "O Pit chegou de carro na praça: fale com ele." : "Um carro espera na praça. Fale com o motorista.");
    if(d1) M.dia1.pit.linhas(F.falas.inicio.slice(0, 1), 1);
    await M.missoes.hotspot("carona", { x: mo.av.position.x, z: mo.av.position.z }, d1 ? "Entrar no carro com o Pit" : "Pegar carona para o Cânion Fortaleza", 4.5);
    if(d1){ for(const t of F.falas.inicio.slice(1)) await dlg(X, [[mo, t, { tipo: "info" }]]); }
    else await dlg(X, [[mo, "Bom dia! Vai para o Cânion Fortaleza? Sobe comigo, são uns 20 minutos de estrada de terra.", { tipo: "info" }]]);
    X.msg("info", d1 ? "Você embarcou no carro branco da Serra Geral Vertical" : "Você embarcou no carro da carona");
    if(d1){ F.falas.carro.slice(0, 2).forEach((t, i) => setTimeout(() => mo.av.visible && D.fala(mo, t, { tipo: "info" }), 400 + i * 700)); }
    M.viagem.viajar("estacionamento"); await X.espera(.4);
    await X.esperaCond(() => !M.viagem.S.viajando, 30);
    W.mostraCarona(false);
    if(d1){ M.dia1.pit.aparece(); setTimeout(() => M.dia1.pit.fala(F.falas.carro[2]), 1500); }
    X.msg("missao", "Você chegou ao estacionamento do Parque Cânion Fortaleza");
  });

  reg("m1.atividade", async (X) => {
    const posto = W.posto(); X.alvo({ x: posto.p.x, z: posto.p.z, rotulo: "Realizar Atividade" });
    await M.missoes.hotspot("atividade", posto.p, "Realizar Atividade", 4.5);
    X.alvo(null);
    const a = A(), via = C.via, cli = cliOpc(), st = { equip: {}, pronto: false, pose: "idle" };
    const kmh = ventoKmh(), lim = limites(kmh), total = cli.pesoKg + cli.mochilaKg;
    D.cinemaOn(); X.msg("tirolesa", "Atividade iniciada no lançamento: você é o cliente");
    D.roda((dt, t) => G().plataforma({ t, chk: { via, pose: st.pose }, cli, equip: st.equip, pronto: st.pronto, fila: 2 }));
    try{
      await X.espera(.8);
      /* 1 pesagem */
      await dlg(X, [[a.op4, "Bem-vindo à Tirolesa Mais Alta das Américas! Antes de tudo, vamos conferir o seu peso: pessoa e mochila somados."],
        [a.op4, "O atrativo foi dimensionado para até " + PROCEDIMENTOS[0].explica.match(/até (\d+) kg/)[1] + " kg e o mínimo é 40 kg (60 kg com vento entre 40 e 60 km/h)."],
        [a.op4, "Vento agora: " + kmh + " km/h. Você + mochila = " + total + " kg. Limites vigentes: " + (lim ? lim.min + " a " + lim.max : "descida suspensa") + " kg. Dentro do limite!"]]);
      /* 2 briefing de segurança */
      st.pose = "idle";
      const perg = BRIEFING.slice().sort(() => Math.random() - .5).slice(0, 2);
      await dlg(X, [[a.lider2, "Agora o briefing de segurança. Celular e objetos vão na bolsa anexa; só entra na área de lançamento com autorização verbal; olhos abertos e sem mexer nos equipamentos."]]);
      for(const q of perg){ const ok = q.o.find(o => o[1]); await dlg(X, [[a.lider2, "Cliente: \"" + q.q.replace(/^O cliente pergunta: /, "").replace(/"/g, "") + "\" — " + ok[0], { dur: 6.5 }], [a.lider2, q.e, { dur: 5.5 }]]); }
      /* 3 EPI */
      st.pose = "trabalho";
      const epi = [["touca", "Primeiro a touca, por baixo do capacete."], ["oculos", "Agora os óculos."], ["capacete", "O capacete, com a jugular ajustada."], ["harness", "O cinto paraquedista."], ["seat", "E a cadeirinha ZipRider."]];
      await dlg(X, [[a.op5, PROCEDIMENTOS[2].explica]]);
      for(const [k, f] of epi){ await dlg(X, [[a.op5, f, { dur: 2.4 }]]); st.equip[k] = true; if(k === "seat"){ st.equip.colete = true; st.equip.cinta = true; } }
      await dlg(X, [[a.op5, "Pronto: fitas ajustadas na zona verde.", { dur: 2.4 }]]);
      /* 4 roldana */
      st.pronto = true; st.pose = "trabalho";
      await dlg(X, [[a.op4, "Vou conectar a roldana ao par de cabos da Via " + via + " (cabos 3 e 4). " + PROCEDIMENTOS[3].explica]]);
      /* 5 mosquetões */
      await dlg(X, [[a.op5, "Mosquetões: fecho o gatilho, travo a rosca e confiro puxando. " + PROCEDIMENTOS[4].explica]]);
      /* 6 dupla checagem */
      st.pose = "idle";
      await dlg(X, [[a.lider2, "Dupla checagem. " + PROCEDIMENTOS[5].explica]]);
      for(let i = 0; i < ITENS_DUPLA.length; i += 3) await dlg(X, [[a.lider2, ITENS_DUPLA.slice(i, i + 3).map(it => it.n + ": " + it.ok.toLowerCase()).join(". ") + ".", { dur: 5.5 }]]);
      await dlg(X, [[a.lider2, "Tudo conforme.", { dur: 2 }]]);
      /* 7 rádio com o recebimento */
      await dlg(X, [[a.op5, "QAP Recebimento, status da Via " + via + ".", { dur: 2.6 }], [a.lider3, "Via " + via + " liberada.", { dur: 2.2, semBalao: true }], [a.op5, "Recebimento, confirmação da Via " + via + "?", { dur: 2.6 }], [a.lider3, "Confirmado: Via " + via + " liberada.", { dur: 2.4, semBalao: true }]]);
      /* 8 contagem */
      await dlg(X, [[a.lider2, "Sejam muito bem-vindos à Tirolesa Mais Alta das Américas! Olhem muito para baixo, pois as nossas emoções começam em:", { dur: 6 }], [a.lider2, "3…", { dur: 1.1 }], [a.lider2, "2…", { dur: 1.1 }], [a.lider2, "1…", { dur: 1.1 }], [a.lider2, "Valeu, galera! O mundo é de vocês!!!", { dur: 2.6 }], [a.op4, "Retirando o backup e liberando o cliente!", { dur: 2.2 }]]);
      /* descida: câmera 360 do pacote mídia (à frente do cliente, olhando para ele) */
      X.msg("tirolesa", "Cliente lançado na Via " + via + ". Câmera do pacote mídia ligada (F fotografa)");
      const d = descida(X, { via, foto: true, comemora: true });
      await X.esperaCond(() => d.fim, 120);
      D.fotoHud(false);
      X.msg("tirolesa", "Cliente chegando ao recebimento");
      /* recebimento */
      const rc = recebimento(X, { via, dupla: "auto" }); D.roda(rc.quadro);
      await X.esperaCond(() => rc.R.fim, 180);
      await UI.leitura(X, "Cliente recebido em segurança!", ["Via " + via + " · procedimento de chegada concluído.", "Você concluiu a descida e o procedimento de chegada no recebimento."], "Concluir", { etiqueta: "MISSÃO 1" });
    }finally{ D.fotoHud(false); D.cinemaOff(); }
    /* o jogador termina no recebimento */
    M.H.andarMod.colocar(cen.spawn.x, cen.spawn.z, cen.spawn.yaw + Math.PI); M.ctx.mostraAviso("Você está no recebimento");
    M.missoes.flag("operar", true);
    X.msg("missao", "Opção liberada no lançamento: \"Operar na Tirolesa\"");
  });

  /* =================================================================================================== M2 */
  reg("m2.instrucao", async (X) => {
    const ins = A().lider3; X.alvo({ x: ins.av.position.x, z: ins.av.position.z, rotulo: "Instrutor (Renato)" });
    await M.missoes.hotspot("instrutor", { x: ins.av.position.x, z: ins.av.position.z }, "Falar com o instrutor (Renato)", 5);
    X.alvo(null);
    const L = RECEBIMENTO_LEGENDAS;
    await dlg(X, [[ins, "Bem-vindo ao recebimento! Aqui você vai aprender a receber o cliente no deck, passo a passo."],
      [ins, "A equipe do recebimento: operadores 6 e 7, o líder 3 e o resgatista 8. Cada um tem o seu papel no deck."]]);
    for(let i = 0; i < L.length; i++) await dlg(X, [[ins, (i + 1) + "/" + L.length + " — " + L[i][2], { dur: 6 }]]);
    await dlg(X, [[ins, "Antes de liberar o cliente, a dupla checagem: duas ancoragens da cadeirinha, uma em cada lado. Só depois ele é desequipado."],
      [ins, "Se o cliente parar no vão, é extração: simples, a 30 m das molas; moderada, sobre o vão do cânion. Quem cuida disso é o resgatista."]]);
  });
  reg("m2.checklists", async (X) => {
    const ins = A().lider3;
    await dlg(X, [[ins, "Agora os checklists do recebimento, item por item. Eu explico e você confere no local."]]);
    for(const k of ["rec", "cad"]) await UI.checklist(X, { titulo: CHECKLISTS[k].nome, itens: CHECKLISTS[k].itens, instrutor: ins, treino: true, minPorItem: .3, etiqueta: "TREINAMENTO" });
    await dlg(X, [[ins, "Muito bem! Você concluiu todos os checklists do recebimento."]]);
  });

  /* =================================================================================================== M3 */
  reg("m3.treino", async (X) => {
    const posto = W.posto(); X.alvo({ x: posto.p.x, z: posto.p.z, rotulo: "Iniciar o treinamento" });
    await M.missoes.hotspot("treino-lan", posto.p, "Iniciar o treinamento no lançamento", 4.5);
    X.alvo(null);
    const a = A(), ins = a.lider2;
    await dlg(X, [[ins, "Bem-vindo ao lançamento! O líder e o coordenador comandam o procedimento; os operadores equipam o cliente.", { dur: 5 }]]);
    for(let i = 0; i < PROCEDIMENTOS.length; i++){ const p = PROCEDIMENTOS[i]; await dlg(X, [[ins, (i + 1) + "/" + PROCEDIMENTOS.length + " · " + p.nome + ". " + p.instrucao, { dur: 7 }], [ins, p.explica, { dur: 7 }]]); }
    await dlg(X, [[a.coord, "O gatilho só é liberado depois de todas as etapas e da contagem. Segurança vem sempre antes da pressa.", { dur: 5 }]]);
  });
  reg("m3.checklists", async (X) => {
    const ins = A().lider2;
    await dlg(X, [[ins, "Agora os checklists do lançamento, item por item."]]);
    for(const k of ["lan", "cad"]) await UI.checklist(X, { titulo: CHECKLISTS[k].nome + (k === "cad" ? " · lançamento" : ""), itens: CHECKLISTS[k].itens, instrutor: ins, treino: true, minPorItem: .3, etiqueta: "TREINAMENTO" });
    await dlg(X, [[ins, "Treinamento concluído! A partir de agora você já pode usar a viagem rápida até o local de cada missão."]]);
  });
  return { descida, recebimento, dlg, ventoKmh, limites, cliOpc };
}
