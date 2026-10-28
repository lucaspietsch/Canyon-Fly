import { U, GAME_TIME_CONFIG } from "../config.js";
import { DIA1 } from "../../../../data/missoes/dia1.js";
import { criaPit } from "./pit.js";

/* ============================================================================================================
   DIA 1 — PRIMEIRO DIA COMO LÍDER DE OPERAÇÕES (acompanhado pelo Pit)
   • Tela de abertura "Dia 1 — Tirolesa Mais Alta das Américas": nome do personagem (padrão "Líder de Operações"), frase de boas-vindas do Pit.
   • MODO JORNADA: durante o Dia 1 o relógio corre mais devagar (1 min de jogo = DIA1.jornada.segPorMinuto s reais). Fora dele, escala normal.
   • "Avançar até [horário]": botão que pula o relógio até o horário da próxima missão da agenda (ou até o horário que uma etapa está esperando).
   • A emergência diária das 10 h fica desligada no Dia 1 (o SAMU aparece na Missão 8); a partir do Dia 2 volta ao normal.
   • Pit: companheiro que anda junto, espera, chama quando o jogador se afasta do objetivo, comenta missões, fauna, clima e eventos.
   • Teclas de depuração (F3 aberto): Shift+PageUp reinicia o Dia 1 do começo · Home/End/PageUp: missões (ver missoes.js) · , . - = : relógio.
   ============================================================================================================ */
const CHAVE = "canyonfly:perfil";
const fmt = (h) => String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0");

export function criarDia1(M){
  const D = M.operacao.diretor, pit = criaPit(M, D), R = M.ciclo.relogio;
  const S = { perfil: null, ui: null, abertura: null, hud: null, multBase: null, aplicado: false, t: 0, avisou: new Set(), dMin: null, alvoK: "", longeT: 0, ultComent: -999, esperaAte: null };
  try{ S.perfil = JSON.parse(localStorage.getItem(CHAVE) || "null"); }catch(_){ S.perfil = null; }
  const salva = () => { try{ localStorage.setItem(CHAVE, JSON.stringify(S.perfil)); }catch(_){ /* sem armazenamento */ } };
  const hora = () => M.ciclo.hora(), dia = () => M.ciclo.diaJogo();

  /* ---------- estado do dia ---------- */
  function ativo(){ const p = S.perfil; if(!p || p.fim) return false; if(dia() > p.dia){ p.fim = true; salva(); return false; } return true; }
  const jornadaAtiva = () => DIA1.jornada.ativo && ativo();
  const nomeJogador = () => (S.perfil && S.perfil.nome) || DIA1.nomePadrao;
  const suprimeEmergencia = () => DIA1.emergencia10hDesligada && ativo();
  const fator = () => (GAME_TIME_CONFIG.realSecondsPerGameHour / 60) / Math.max(.1, DIA1.jornada.segPorMinuto);

  /* ---------- começo do Dia 1 ---------- */
  function comeca(nome){
    S.perfil = { nome: (nome || "").trim().slice(0, 28) || DIA1.nomePadrao, dia: dia(), fim: false }; salva(); S.avisou.clear(); pit.S.presente = false; pit.oculta();
    M.missoes.reinicia(); M.ciclo.ajustaHora(6); M.ctx && M.ctx.mostraAviso(DIA1.titulo);
    M.personagens && M.personagens.atualizaNome && M.personagens.atualizaNome();
    const d = M.viagem.todos().find(q => q.id === "cidade"); if(d){ M.H.andarMod.colocar(d.pos.x, d.pos.z, d.pos.yaw + Math.PI); if(M.zonas) M.zonas.tick(10, M.jogador()); }
    M.terminal.msg("missao", DIA1.titulo + " — bom trabalho, " + nomeJogador() + "!");
    setTimeout(() => { M.missoes.inicia("m01-descer", { forca: true }); }, 600);
  }
  function reinicia(){ S.perfil = null; try{ localStorage.removeItem(CHAVE); }catch(_){ /* sem armazenamento */ } pit.S.presente = false; pit.oculta(); M.missoes.reinicia(); abreAbertura(); }

  /* ---------- tela de abertura ---------- */
  function abreAbertura(){
    if(S.abertura || !M.ui) return; M.ctx && M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:98;background:radial-gradient(ellipse at 50% 35%,#24301a,#07080a);display:flex;align-items:center;justify-content:center;pointer-events:auto;color:#ecebdd;font:600 15px system-ui,sans-serif;text-align:center;";
    const cx = document.createElement("div"); cx.style.cssText = "width:min(560px,92vw);padding:24px;";
    cx.innerHTML = "<div style='letter-spacing:6px;color:#9fd37a;font-size:12px'>CANYONFLY</div><h1 style='margin:10px 0 6px;color:#ffd36a;font-size:clamp(22px,4.6vw,34px)'></h1><div style='margin:16px auto;max-width:440px;background:rgba(255,255,255,.06);border-left:4px solid #ff7a00;border-radius:10px;padding:12px 14px;text-align:left'><b style='color:#ffb35a'>Pit</b><div id='d1-f' style='font-weight:500;margin-top:4px'></div></div><label style='display:block;margin:18px 0 4px;font-size:13px;opacity:.85'>Seu nome no jogo</label>";
    cx.querySelector("h1").textContent = DIA1.titulo; cx.querySelector("#d1-f").textContent = DIA1.boasVindas;
    const inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 28; inp.value = S.perfil ? S.perfil.nome : ""; inp.placeholder = DIA1.nomePadrao; inp.style.cssText = "width:min(320px,80vw);padding:10px;border-radius:8px;border:1.5px solid #5d6b2c;background:#0c0e08;color:#fff;font:600 15px system-ui,sans-serif;text-align:center;";
    const b1 = document.createElement("button"); b1.type = "button"; b1.textContent = "Começar o Dia 1"; b1.style.cssText = "display:block;margin:16px auto 0;padding:12px 26px;border-radius:10px;border:2px solid #ff7a00;background:#3a2410;color:#ffe9c8;font:800 15px system-ui,sans-serif;cursor:pointer;";
    const b2 = document.createElement("button"); b2.type = "button"; b2.textContent = "Pular a abertura (mundo livre)"; b2.style.cssText = "display:block;margin:10px auto 0;padding:6px 12px;border-radius:8px;border:1px solid #444;background:transparent;color:#aaa;font:600 12px system-ui,sans-serif;cursor:pointer;";
    cx.append(inp, b1, b2); el.appendChild(cx); M.ui.appendChild(el); S.abertura = el;
    const fecha = () => { window.removeEventListener("keydown", kd, true); el.remove(); S.abertura = null; };
    const kd = (e) => { e.stopPropagation(); if(e.code === "Enter"){ e.preventDefault(); b1.click(); } };
    window.addEventListener("keydown", kd, true);
    b1.onclick = () => { const n = inp.value; fecha(); comeca(n); };
    b2.onclick = () => { fecha(); S.perfil = { nome: DIA1.nomePadrao, dia: dia(), fim: true, pulou: true }; salva(); };
    setTimeout(() => inp.focus(), 50);
  }

  /* ---------- botão "Avançar até [horário]" ---------- */
  function monta(ui){
    S.ui = ui; const b = document.createElement("div"); b.id = "d1-hud"; b.style.cssText = "position:absolute;left:50%;top:58px;transform:translateX(-50%);z-index:32;background:rgba(10,12,8,.82);border:1.5px solid #ff7a00;border-radius:999px;padding:6px 14px;color:#ffe9c8;font:700 12.5px system-ui,sans-serif;cursor:pointer;display:none;user-select:none;";
    b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if(S.alvoHora !== undefined){ M.ciclo.irParaHora(S.alvoHora); } }); ui.appendChild(b); S.hud = b;
    if(!S.perfil && DIA1.jornada !== null) setTimeout(abreAbertura, 1200);
  }
  function atualizaHud(){
    if(!S.hud) return; let h = null, rot = "";
    const ate = M.missoes.S.esperaAte; if(ate !== null && ate !== undefined && hora() < ate){ h = ate; rot = "esta etapa espera esse horário"; }
    else if(ativo() && !M.missoes.ativa){ const prox = M.missoes.lista().find(m => m.serie === "principal" && !m.emBreve && M.missoes.estadoDe(m) === "disponivel" && DIA1.agenda[m.id] !== undefined); if(prox && DIA1.agenda[prox.id] > hora() + .01){ h = DIA1.agenda[prox.id]; rot = "Missão " + prox.numero + " · " + prox.titulo; } }
    if(h === null || M.ciclo.emSalto()){ S.hud.style.display = "none"; return; }
    S.alvoHora = h; S.hud.style.display = "block"; S.hud.textContent = "⏩ Avançar até " + fmt(h) + " — " + rot;
  }

  /* ---------- reações do Pit a missões e acontecimentos ---------- */
  function lado(txt){ if(pit.modo === "oculto" || !pit.S.presente) return; pit.fala(txt); }
  M.missoes.ouve((tipo, d) => {
    if(!ativo()) return; const m = d.m, id = m && m.id;
    if(tipo === "inicia"){ S.dMin = null; S.avisou.clear();
      const f = { "m02-treino-recebimento": "m02", "m03-treino-lancamento": "m03", "m04-inspecao": "m04", "m05-receber-clientes": "m05", "m06-almoco": "m06", "m07-operar-lancamento": "m07" }[id];
      if(f){ if(pit.S.presente && pit.modo === "oculto") pit.aparece(); pit.linhas([DIA1.falas[f][0]], 1); } }
    if(tipo === "etapa" && id === "m01-descer"){ if(d.e.id === "trilha"){ pit.aparece(); pit.linhas(DIA1.falas.trilha); } if(d.e.id === "atividade") pit.linhas(DIA1.falas.lancamento); }
    if(tipo === "conclui" && id === "m01-descer"){ pit.aparece(); pit.linhas(DIA1.falas.chegada); }
    if(tipo === "conclui" && id === "m03-treino-lancamento") pit.linhas([DIA1.falas.m03[1]], 1);
  });
  M.terminal.ouve((tipo, txt) => {
    if(!ativo() || !pit.S.presente || pit.modo === "oculto" || S.t - S.ultComent < 40) return;
    let k = null; if(tipo === "natureza"){ if(/Monomotor/i.test(txt)) k = "monomotor"; else if(/Avião de passageiros/i.test(txt)) k = "jato"; else if(/Vento aumentando|Rajada/i.test(txt)) k = "vento"; else if(/Neblina subindo/i.test(txt)) k = "neblina"; else if(/avistado/i.test(txt)) k = "fauna"; }
    if(k){ S.ultComent = S.t; setTimeout(() => lado(pit.sorteia(k)), 1500); }
  });

  /* na hora marcada da agenda (ou assim que a missão anterior termina, se já passou da hora) a próxima missão do dia começa sozinha */
  function iniciaDaAgenda(){
    if(!ativo() || M.missoes.ativa || D.em || M.viagem.S.viajando || M.missoes.S.painel || M.missoes.S.aberta || M.ciclo.emSalto()) return;
    const prox = M.missoes.lista().find(m => m.serie === "principal" && !m.emBreve && M.missoes.estadoDe(m) === "disponivel" && DIA1.agenda[m.id] !== undefined);
    if(prox && hora() >= DIA1.agenda[prox.id] - .001){ M.terminal.msg("missao", "São " + fmt(hora()) + ": começa a Missão " + prox.numero + " — " + prox.titulo); M.missoes.inicia(prox.id); }
  }
  function tick(dt, J){
    S.t += dt; pit.tick(dt, J);
    /* relógio do modo jornada */
    const quer = jornadaAtiva();
    if(quer && !S.aplicado){ S.multBase = R.mult; R.mult = S.multBase * fator(); S.aplicado = true; }
    else if(!quer && S.aplicado){ R.mult = S.multBase || 1; S.aplicado = false; }
    if(((S.t * 2) | 0) !== (((S.t - dt) * 2) | 0)){ atualizaHud(); iniciaDaAgenda(); }
    if(!ativo() || !J) return;
    /* inspeção: o Pit cobra o horário */
    const m = M.missoes.ativa;
    if(m && m.id === "m04-inspecao" && m.horarioLimite !== undefined){ const resta = (m.horarioLimite - hora()) * 60; [40, 25, 15, 5].forEach(k => { if(resta <= k && resta > 0 && !S.avisou.has(k)){ S.avisou.add(k); lado(DIA1.falas.aviso[0].replace("{min}", k)); } }); }
    /* chama quando o jogador se afasta do objetivo */
    S.longeT += dt; if(S.longeT >= 1 && m){ S.longeT = 0; const p = M.missoes.alvoPos(); if(p){ const k = Math.round(p.x) + ":" + Math.round(p.z), d = Math.hypot(p.x - J.x, p.z - J.z); if(k !== S.alvoK){ S.alvoK = k; S.dMin = d; } S.dMin = Math.min(S.dMin, d);
        if(d - S.dMin > 60 * U && d > DIA1.pit.distChamaM * U * .5 && S.t - (S.chamouT || -999) > DIA1.pit.chamaCadaSeg){ S.chamouT = S.t; S.dMin = d; lado(pit.sorteia("longe")); } } }
  }

  M.registra({ tick: (dt, J) => tick(dt, J), liga: (ui) => monta(ui), desliga: () => { if(S.hud){ S.hud.remove(); S.hud = null; } if(S.abertura){ S.abertura.remove(); S.abertura = null; } if(S.aplicado){ R.mult = S.multBase || 1; S.aplicado = false; } pit.oculta(); }, info: () => "Dia 1: " + (ativo() ? "em andamento" + (jornadaAtiva() ? " (jornada ×" + fator().toFixed(2) + ")" : "") : S.perfil ? "encerrado" : "não iniciado") });
  return { pit, DIA1, ativo, jornadaAtiva, nomeJogador, suprimeEmergencia, comeca, reinicia, abreAbertura, S, perfil: () => S.perfil };
}
