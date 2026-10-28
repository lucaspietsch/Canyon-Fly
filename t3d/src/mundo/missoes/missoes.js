import { Group, Mesh, OctahedronGeometry, RingGeometry, MeshBasicMaterial, DoubleSide } from "three";
import { U } from "../config.js";
import { MISSOES, MISSOES_CFG } from "../../../../data/missoes/index.js";

/* ============================================================================================================
   SISTEMA DE MISSÕES (CanyonFly) — orientado a dados, pensado para ~100 missões.
   • Cada missão é um objeto em data/missoes/*.js (id, número, série, título, descrição, prereq, horarioLimite, etapas, recompensas, viagem...). Nada de missão "chumbada" aqui.
   • Etapas (tipos):  ir {local, raioM}  ·  hotspot {local, rotulo}  ([E] perto do local)  ·  evento {evento}  (M.missoes.emite("nome"))  ·  cena {cena, param}  (rotina assíncrona registrada em
     M.missoes.registraCena("nome", async (X, etapa) => {...}); X traz msg/fala/espera/escolhe/confirma/alvo/vivo).  Uma etapa pode ter `opcional: true`.
   • Estados: bloqueada · disponível · ativa · concluída · falhou (repete no dia seguinte, se a missão permitir) · em breve.   Só uma missão ativa por vez; principais em sequência; secundárias livres.
   • Salvo em localStorage ("canyonfly:missoes:v1"), com try/catch.   Tela de missões: J.   Marcador no mundo, no minimapa e no cartão do topo.
   • Depuração (F3 aberto):  Home / Shift+Home = pular para o início da próxima / anterior   ·   End = completar o objetivo atual   ·   PageUp = apagar o progresso das missões.
   ============================================================================================================ */
const CHAVE = "canyonfly:missoes:v1";
class Aborta extends Error {}

export function criarMissoes(M){
  const hs = new Map(), ouvintes = [];
  const emite2 = (tipo, d) => ouvintes.forEach(f => { try{ f(tipo, d); }catch(err){ console.warn("ouvinte de missão:", err); } });
  const S = { prog: carrega(), ativa: null, etapa: 0, cenas: {}, fila: [], el: null, tracker: null, dica: null, tela: null, painel: null, marcador: null, alvo: null, token: 0, x: 0, t: 0, sel: null, ui: null, aberta: false, sim: null };
  const mapa = new Map(MISSOES.map(m => [m.id, m]));
  const J = () => M.jogador();
  const hora = () => M.ciclo.hora(), dia = () => M.ciclo.diaJogo();

  /* ---------- persistência ---------- */
  function carrega(){ try{ const o = JSON.parse(localStorage.getItem(CHAVE) || "null"); if(o && o.v === 1) return o; }catch(_){ /* sem armazenamento */ } return { v: 1, concl: {}, falhas: {}, flags: {}, viagem: {}, atual: null }; }
  function salva(){ try{ S.prog.atual = S.ativa ? { id: S.ativa.id, etapa: S.etapa } : null; localStorage.setItem(CHAVE, JSON.stringify(S.prog)); }catch(_){ /* sem armazenamento */ } }
  const flag = (n, v) => { if(v !== undefined){ S.prog.flags[n] = v; salva(); } return S.prog.flags[n]; };

  /* ---------- estado das missões ---------- */
  function estadoDe(m){
    if(S.prog.concl[m.id]) return "concluida";
    if(S.ativa && S.ativa.id === m.id) return "ativa";
    if(m.emBreve) return "embreve";
    const f = S.prog.falhas[m.id]; if(f && m.repeteDiaSeguinte !== false && dia() <= f.dia) return "falhou";
    return motivoBloqueio(m) ? "bloqueada" : "disponivel";
  }
  function motivoBloqueio(m){
    const p = m.prereq || {};
    for(const id of p.missoes || []) if(!S.prog.concl[id]){ const o = mapa.get(id); return "Conclua antes: " + (o ? (o.numero ? "Missão " + o.numero + " · " : "") + o.titulo : id); }
    if(p.personagem && M.personagens && M.personagens.ativo !== p.personagem) return "Personagem necessário: " + p.personagem;
    if(p.flag && !S.prog.flags[p.flag]) return "Requisito: " + p.flag;
    if(p.horaMin !== undefined && hora() < p.horaMin) return "Disponível a partir das " + fmtHora(p.horaMin);
    if(p.horaMax !== undefined && hora() > p.horaMax) return "Disponível até as " + fmtHora(p.horaMax);
    return "";
  }
  const fmtHora = (h) => String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0");

  /* ---------- locais ---------- */
  function resolve(l){
    if(!l) return null;
    if(l.ref){ const d = M.viagem && M.viagem.todos().find(q => q.id === l.ref); return d ? { x: d.pos.x + (l.dx || 0) * U, z: d.pos.z + (l.dz || 0) * U } : null; }
    if(isFinite(l.x)) return { x: l.x, z: l.z };
    if(typeof l.fn === "function") return l.fn();
    return null;
  }
  const etapaAtual = () => (S.ativa ? S.ativa.etapas[S.etapa] : null);
  const posAlvo = () => { if(S.alvo) return S.alvo; const e = etapaAtual(); return e ? resolve(e.local) : null; };

  /* ---------- fluxo ---------- */
  function inicia(id, opc = {}){
    const m = mapa.get(id); if(!m || S.ativa) return false;
    if(!opc.forca && estadoDe(m) !== "disponivel") return false;
    delete S.prog.falhas[id]; S.ativa = m; S.etapa = 0; S.diaInicio = dia(); S.horaInicio = hora(); S.token++; S.alvo = null; S.x = 0; seguraRelogio(m); salva();
    M.terminal.msg("missao", "Missão " + (m.numero || "") + " iniciada: " + m.titulo);
    M.ctx && M.ctx.mostraAviso("Nova missão: " + m.titulo);
    if(m.aoIniciar && S.cenas[m.aoIniciar]) rodaGancho(m.aoIniciar);
    emite2("inicia", { m }); entraEtapa(); desenhaTracker(); return true;
  }
  /* missões com `relogioFator` deixam o relógio do jogo mais lento enquanto estão ativas (ex.: inspeção diária com limite de horário) */
  function seguraRelogio(m){ soltaRelogio(); if(M.dia1 && M.dia1.jornadaAtiva()) return; /* no Dia 1 o modo jornada manda no relógio */ if(m && m.relogioFator){ S.multAntes = M.ciclo.relogio.mult; M.ciclo.relogio.mult = S.multAntes * m.relogioFator; } }
  function soltaRelogio(){ if(S.multAntes !== undefined){ M.ciclo.relogio.mult = S.multAntes; S.multAntes = undefined; } }
  function entraEtapa(){
    const m = S.ativa; if(!m) return; hs.clear();
    const e = etapaAtual(); S.alvo = null; S.x = 0; S.dica = null;
    if(!e){ conclui(); return; }
    S.token++; salva(); atualizaAlvo(); desenhaTracker(); emite2("etapa", { m, e, idx: S.etapa });
    if(e.msg) M.terminal.msg("missao", e.msg);
    if(e.tipo === "cena"){ const f = S.cenas[e.cena]; if(!f){ M.terminal.msg("missao", "[a definir] cena '" + e.cena + "' ainda não implementada"); return; } rodaCena(f, e); }
  }
  function rodaGancho(nome){ const f = S.cenas[nome]; if(f) try{ Promise.resolve(f(criaX(S.token), {})).catch(() => {}); }catch(_){ /* gancho opcional */ } }
  function rodaCena(f, e){
    const tk = S.token, X = criaX(tk), m = S.ativa;
    Promise.resolve().then(() => f(X, e)).then(() => { if(tk === S.token && S.ativa === m) avanca(); }).catch(err => { if(!(err instanceof Aborta)) console.error("cena " + e.cena + ":", err); });
  }
  function avanca(){
    const m = S.ativa; if(!m) return; const e = etapaAtual();
    if(e){ M.terminal.msg("missao", "Objetivo concluído: " + (e.texto || e.id)); if(e.aoConcluir && S.cenas[e.aoConcluir]) rodaGancho(e.aoConcluir); }
    S.etapa++; entraEtapa();
  }
  function conclui(){ hs.clear();
    const m = S.ativa; if(!m) return; soltaRelogio(); S.prog.concl[m.id] = { dia: dia(), hora: hora() }; S.ativa = null; S.token++; S.alvo = null; atualizaAlvo();
    const r = m.recompensas || {};
    (r.flags || []).forEach(f => { S.prog.flags[f] = true; });
    (r.viagem || []).forEach(v => { S.prog.viagem[v] = true; });
    (r.personagens || []).forEach(p => M.personagens && M.personagens.desbloqueia(p, "Missão " + (m.numero || "") + " concluída"));
    salva();
    M.terminal.msg("missao", "Missão " + (m.numero || "") + " concluída: " + m.titulo); emite2("conclui", { m });
    if(r.texto) M.terminal.msg("missao", r.texto);
    (r.viagem || []).forEach(v => M.terminal.msg("info", "Viagem rápida liberada: " + v));
    M.ctx && M.ctx.mostraAviso("Missão concluída: " + m.titulo);
    if(m.aoConcluir && S.cenas[m.aoConcluir]) rodaGancho(m.aoConcluir);
    const prox = MISSOES.find(q => q.serie === m.serie && !q.emBreve && estadoDe(q) === "disponivel" && (q.prereq || {}).missoes && q.prereq.missoes.includes(m.id));
    if(prox) M.terminal.msg("missao", "Próxima missão disponível: " + prox.titulo + " (J)");
    desenhaTracker(); atualizaTela();
  }
  function falha(motivo){ hs.clear();
    const m = S.ativa; if(!m) return; soltaRelogio(); S.prog.falhas[m.id] = { dia: dia(), motivo }; S.ativa = null; S.token++; S.alvo = null; atualizaAlvo(); salva();
    M.terminal.msg("emergencia", "Missão " + (m.numero || "") + " falhou: " + (motivo || m.titulo)); emite2("falha", { m });
    if(m.repeteDiaSeguinte !== false) M.terminal.msg("missao", "Você poderá repetir a missão amanhã (" + m.titulo + ").");
    if(m.aoFalhar && S.cenas[m.aoFalhar]) rodaGancho(m.aoFalhar);
    M.ctx && M.ctx.mostraAviso("Missão falhou: " + (motivo || m.titulo)); desenhaTracker(); atualizaTela();
  }
  function abandona(){ hs.clear(); const m = S.ativa; if(!m) return; soltaRelogio(); S.ativa = null; S.token++; S.alvo = null; atualizaAlvo(); salva(); M.terminal.msg("missao", "Missão abandonada: " + m.titulo); desenhaTracker(); atualizaTela(); }
  function emite(nome, dados){ const e = etapaAtual(); if(e && e.tipo === "evento" && e.evento === nome && (!e.filtro || e.filtro(dados))){ avanca(); return true; } return false; }

  /* ---------- contexto das cenas (rotinas assíncronas) ---------- */
  function criaX(tk){
    const vivo = () => tk === S.token; const guarda = () => { if(!vivo()) throw new Aborta(); };
    const X = {
      M, vivo, guarda, msg: (tipo, t, o) => { guarda(); M.terminal.msg(tipo, t, o); },
      espera: (seg) => new Promise((ok, no) => { let t = 0; const f = () => { if(!vivo()) return no(new Aborta()); if(t >= seg) return ok(); t += .05; setTimeout(f, 50); }; f(); }),
      esperaCond: (fn, maxSeg = 1e9) => new Promise((ok, no) => { let t = 0; const f = () => { if(!vivo()) return no(new Aborta()); if(fn()) return ok(true); t += .1; if(t > maxSeg) return ok(false); setTimeout(f, 100); }; f(); }),
      alvo: (p) => { guarda(); S.alvo = p ? { x: p.x, z: p.z, rotulo: p.rotulo } : null; atualizaAlvo(); },
      dica: (t) => { S.dica = t; desenhaTracker(); },
      painel: (o) => { guarda(); return abrePainel(o, tk); },
      escolhe: (titulo, opcoes, o = {}) => X.painel({ titulo, corpo: o.corpo, botoes: opcoes.map((t, i) => ({ rotulo: t, valor: i })), ...o }),
      confirma: (titulo, rotulo = "Continuar", o = {}) => X.painel({ titulo, corpo: o.corpo, botoes: [{ rotulo, valor: true }], ...o }),
      pertoDe: (p, rM) => { const j = J(); return !!j && Math.hypot(j.x - p.x, j.z - p.z) <= rM * U; },
      marcador: (id, p, texto) => M.missoes.hotspot(id, p, texto),
      avancaMin: (min) => { guarda(); M.ciclo.pulaHoras(min / 60); },
      emite
    };
    return X;
  }

  /* ---------- painel de diálogo/escolha (teclas 1-9 e Enter; mouse/toque) ---------- */
  function abrePainel(o, tk){
    return new Promise((ok, no) => {
      if(!M.ui) return no(new Aborta());
      M.ctx && M.ctx.soltaTeclas && M.ctx.soltaTeclas();
      const baixo = o.fundo === false, pausa0 = M.ciclo.relogio.pausa; if(o.pausaRelogio !== false) M.ciclo.relogio.pausa = true;                   // o relógio do jogo espera enquanto você responde
      const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:70;display:flex;justify-content:center;" + (baixo ? "align-items:flex-end;padding-bottom:14px;pointer-events:none;" : "align-items:center;background:rgba(0,0,0,.42);pointer-events:auto;");
      const caixa = document.createElement("div"); caixa.style.cssText = (baixo ? "pointer-events:auto;" : "") + "width:min(560px,92vw);max-height:88%;overflow:auto;background:rgba(14,18,10,.97);border:2px solid #8a9a3b;border-radius:16px;padding:16px 18px;color:#ecebdd;font:600 14px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.6);";
      if(o.etiqueta){ const l = document.createElement("div"); l.textContent = o.etiqueta; l.style.cssText = "font-size:11px;letter-spacing:1px;color:#9fd37a;margin-bottom:4px;"; caixa.appendChild(l); }
      const t = document.createElement("div"); t.textContent = o.titulo || ""; t.style.cssText = "font-size:16px;color:#ffd36a;margin-bottom:8px;"; caixa.appendChild(t);
      if(o.corpo){ const c = document.createElement("div"); c.style.cssText = "font-weight:500;opacity:.92;margin-bottom:10px;"; if(Array.isArray(o.corpo)) o.corpo.forEach(l => { const d = document.createElement("div"); d.textContent = l; c.appendChild(d); }); else c.textContent = o.corpo; caixa.appendChild(c); }
      const fim = (v) => { window.removeEventListener("keydown", kd, true); el.remove(); S.painel = null; clearInterval(vig); M.ciclo.relogio.pausa = pausa0; ok(v); };
      const bt = o.botoes || [{ rotulo: "Continuar", valor: true }];
      bt.forEach((b, i) => { const x = document.createElement("button"); x.type = "button"; x.textContent = (bt.length > 1 ? (i + 1) + " · " : "") + b.rotulo; x.style.cssText = "display:block;width:100%;text-align:left;margin:6px 0 0;padding:10px 12px;border-radius:10px;border:1.5px solid #5d6b2c;background:#232a14;color:#f1f0e0;font:700 13.5px system-ui,sans-serif;cursor:pointer;"; x.onclick = () => fim(b.valor); caixa.appendChild(x); });
      el.appendChild(caixa); M.ui.appendChild(el); S.painel = el;
      const kd = (e) => { e.stopPropagation(); if(/^Digit[1-9]$/.test(e.code) && bt[+e.code.slice(5) - 1]){ e.preventDefault(); fim(bt[+e.code.slice(5) - 1].valor); } else if((e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && bt.length === 1){ e.preventDefault(); fim(bt[0].valor); } else e.preventDefault(); };
      window.addEventListener("keydown", kd, true);
      const vig = setInterval(() => { if(tk !== S.token){ window.removeEventListener("keydown", kd, true); el.remove(); S.painel = null; clearInterval(vig); M.ciclo.relogio.pausa = pausa0; no(new Aborta()); } }, 200);
    });
  }

  /* ---------- hotspots próprios das cenas ([E] perto de um ponto) ---------- */
  function hotspot(id, p, rotulo, raioM = 3.2){ hs.set(id, { p, rotulo, raioM, pegou: null }); return new Promise(ok => { hs.get(id).ok = ok; }); }
  const removeHotspot = (id) => { hs.delete(id); };

  /* ---------- marcador 3D (discreto, tamanho constante na tela) ---------- */
  function montaMarcador(){
    if(S.marcador || !M.cena) return;
    const g = new Group(), m1 = new MeshBasicMaterial({ color: 0x8be36a, transparent: true, opacity: .9, depthTest: false }), m2 = new MeshBasicMaterial({ color: 0x8be36a, transparent: true, opacity: .55, side: DoubleSide, depthTest: false });
    const d = new Mesh(new OctahedronGeometry(.5, 0), m1); d.scale.set(.7, 1.1, .7); d.position.y = 1.4; const r = new Mesh(new RingGeometry(.7, .9, 28), m2); r.rotation.x = -Math.PI / 2; r.position.y = .05;
    g.add(d, r); g.renderOrder = 999; d.renderOrder = r.renderOrder = 999; g.visible = false; g.userData = { d, r }; M.cena.add(g); S.marcador = g;
  }
  function posicionaMarcador(dt){
    const g = S.marcador, p = posAlvo(), j = J(); if(!g) return;
    if(!p || !j){ g.visible = false; return; }
    const d = Math.hypot(p.x - j.x, p.z - j.z); g.visible = d > 3 * U; if(!g.visible) return;
    const y = M.cen.relevo ? M.cen.relevo(p.x, p.z) : 0; g.position.set(p.x, y, p.z);
    const k = Math.max(1, d / (48 * U)) * U * .55; g.scale.setScalar(k * (M.cam ? 1 : 1)); g.userData.d.rotation.y += dt * 1.6; g.userData.d.position.y = 1.4 + Math.sin(S.t * 2.2) * .12;
  }
  function atualizaAlvo(){ const p = S.ativa ? posAlvo() : null; if(M.mapa && M.mapa.marcaObjetivo) M.mapa.marcaObjetivo(p ? { x: p.x, z: p.z, rotulo: (etapaAtual() && etapaAtual().texto) || "" } : null); }

  /* ---------- cartão do objetivo (topo) e [E] ---------- */
  function monta(ui){
    S.ui = ui;
    S.tracker = document.createElement("div"); S.tracker.style.cssText = "position:absolute;left:12px;top:" + MISSOES_CFG.cartaoTopoPx + "px;z-index:30;max-width:min(300px,56vw);background:rgba(10,12,8,.72);border:1.5px solid #4c6a2a;border-left:5px solid #7ddc6a;border-radius:10px;padding:6px 10px;color:#e6efd8;font:600 12px/1.35 system-ui,sans-serif;pointer-events:none;display:none;";
    S.dicaEl = document.createElement("div"); S.dicaEl.style.cssText = "position:absolute;left:50%;bottom:" + MISSOES_CFG.dicaBaixoPx + "px;transform:translateX(-50%);z-index:31;background:rgba(10,12,8,.82);border:2px solid #9fd37a;border-radius:12px;padding:8px 16px;color:#f2f7e8;font:700 14px system-ui,sans-serif;pointer-events:none;display:none;white-space:nowrap;";
    ui.append(S.tracker, S.dicaEl); montaMarcador(); desenhaTracker();
  }
  function desenhaTracker(){
    if(!S.tracker) return; const m = S.ativa;
    if(!m){ S.tracker.style.display = "none"; return; } const e = etapaAtual(), n = m.etapas.length;
    S.tracker.style.display = "block"; S.tracker.textContent = "";
    const a = document.createElement("div"); a.style.cssText = "font-size:10.5px;letter-spacing:.6px;color:#8be36a;"; a.textContent = "MISSÃO " + (m.numero || "") + " · " + m.titulo.toUpperCase() + "  (" + Math.min(S.etapa + 1, n) + "/" + n + ")"; S.tracker.appendChild(a);
    const b = document.createElement("div"); b.textContent = "▸ " + (e ? e.texto : "…"); S.tracker.appendChild(b);
    if(S.dica){ const c = document.createElement("div"); c.style.cssText = "font-weight:500;opacity:.8;font-size:11px;"; c.textContent = S.dica; S.tracker.appendChild(c); }
    if(m.horarioLimite !== undefined){ const c = document.createElement("div"); c.style.cssText = "font-size:11px;color:#ffb35a;"; c.textContent = "⏱ Limite: " + fmtHora(m.horarioLimite) + " (agora " + M.ciclo.horaTexto() + ")"; S.tracker.appendChild(c); }
  }

  /* ---------- tela de missões (J) ---------- */
  const NOMEST = { ativa: ["EM ANDAMENTO", "#8be36a"], disponivel: ["DISPONÍVEL", "#ffd36a"], concluida: ["CONCLUÍDA", "#9aa38c"], falhou: ["FALHOU", "#ff7a6a"], bloqueada: ["BLOQUEADA", "#7d8472"], embreve: ["EM BREVE", "#7d8472"] };
  function abreTela(){
    if(S.tela || !M.ui) return; M.ctx && M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:64;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;pointer-events:auto;";
    el.innerHTML = "<div id='ms-c' style=\"width:min(720px,94vw);max-height:90%;overflow:auto;background:rgba(12,16,9,.97);border:2px solid #8a9a3b;border-radius:16px;padding:14px 18px;color:#ecebdd;font:600 13px/1.4 system-ui,sans-serif;\"></div>";
    el.addEventListener("pointerdown", e => { if(e.target === el) fechaTela(); }); M.ui.appendChild(el); S.tela = el; S.aberta = true; atualizaTela();
  }
  function fechaTela(){ if(S.tela){ S.tela.remove(); S.tela = null; } S.aberta = false; }
  function atualizaTela(){
    if(!S.tela) return; const c = S.tela.querySelector("#ms-c"); c.textContent = "";
    const topo = document.createElement("div"); topo.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#ffd36a;font-size:16px;"; topo.innerHTML = "<span>MISSÕES</span><span style='cursor:pointer;font-size:12px;opacity:.8'>✕ fechar (J / Esc)</span>"; topo.lastChild.onclick = fechaTela; c.appendChild(topo);
    const ordem = ["ativa", "disponivel", "falhou", "bloqueada", "concluida", "embreve"], grupos = {};
    MISSOES.forEach(m => { (grupos[estadoDe(m)] = grupos[estadoDe(m)] || []).push(m); });
    ordem.forEach(k => { const L = grupos[k]; if(!L) return; const h = document.createElement("div"); h.style.cssText = "margin:10px 0 4px;font-size:11px;letter-spacing:1px;color:" + NOMEST[k][1] + ";"; h.textContent = NOMEST[k][0] + " (" + L.length + ")"; c.appendChild(h);
      L.forEach(m => { const caixa = document.createElement("div"); caixa.style.cssText = "border:1.5px solid " + (k === "ativa" ? "#6aa84a" : "#394225") + ";border-radius:10px;padding:7px 10px;margin:4px 0;background:" + (k === "ativa" ? "rgba(70,110,40,.22)" : "rgba(255,255,255,.03)") + ";opacity:" + (k === "bloqueada" || k === "embreve" ? .66 : 1) + ";";
        const t = document.createElement("div"); t.style.cssText = "display:flex;justify-content:space-between;gap:8px;"; t.innerHTML = "<span>" + (m.numero ? "Missão " + m.numero + " · " : "") + esc(m.titulo) + (m.serie === "secundaria" ? " <i style='opacity:.6'>(secundária)</i>" : "") + "</span>"; caixa.appendChild(t);
        const d = document.createElement("div"); d.style.cssText = "font-weight:500;opacity:.8;font-size:12px;"; d.textContent = m.descricao || ""; caixa.appendChild(d);
        if(k === "bloqueada"){ const r = document.createElement("div"); r.style.cssText = "font-size:11.5px;color:#d8c07a;"; r.textContent = "🔒 " + motivoBloqueio(m); caixa.appendChild(r); }
        if(k === "falhou"){ const r = document.createElement("div"); r.style.cssText = "font-size:11.5px;color:#ff9a8a;"; r.textContent = "✖ " + (S.prog.falhas[m.id].motivo || "falhou") + " — tente novamente amanhã."; caixa.appendChild(r); }
        if(k === "ativa"){ m.etapas.forEach((e, i) => { const r = document.createElement("div"); r.style.cssText = "font-size:12px;margin-top:2px;color:" + (i < S.etapa ? "#8c9a7c" : i === S.etapa ? "#bff0a0" : "#d4d4c8") + ";" + (i === S.etapa ? "font-weight:800;" : ""); r.textContent = (i < S.etapa ? "✔ " : i === S.etapa ? "▸ " : "○ ") + e.texto; caixa.appendChild(r); });
          const b = botao("Abandonar missão", () => { abandona(); }); caixa.appendChild(b); }
        if(k === "disponivel"){ const b = botao("Iniciar missão", () => { fechaTela(); inicia(m.id); }); caixa.appendChild(b); }
        c.appendChild(caixa); }); });
  }
  const esc = (s) => String(s).replace(/[&<>]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
  function botao(t, f){ const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.style.cssText = "margin-top:6px;padding:6px 12px;border-radius:8px;border:1.5px solid #6aa84a;background:#25331a;color:#eaf5da;font:700 12px system-ui,sans-serif;cursor:pointer;"; b.onclick = f; return b; }

  /* ---------- tick e teclas ---------- */
  function tick(dt){
    S.t += dt; const j = J(); if(!j) return;
    posicionaMarcador(dt);
    const m = S.ativa; let dica = null;
    if(m){
      if(m.horarioLimite !== undefined && ciclaLimite(m)){ falha("passou do horário-limite (" + fmtHora(m.horarioLimite) + ")"); return; }
      const e = etapaAtual();
      if(e && e.tipo === "ir"){ const p = resolve(e.local); if(p && Math.hypot(p.x - j.x, p.z - j.z) <= (e.raioM || 5) * U) avanca(); }
      else if(e && e.tipo === "hotspot"){ const p = resolve(e.local); if(p && Math.hypot(p.x - j.x, p.z - j.z) <= (e.raioM || 3.5) * U) dica = e.rotulo || "Interagir"; }
      S.x += dt; if(S.x > 1 && S.tracker && m.horarioLimite !== undefined){ S.x = 0; desenhaTracker(); }
    }
    for(const [id, h] of hs){ if(Math.hypot(h.p.x - j.x, h.p.z - j.z) <= h.raioM * U){ dica = h.rotulo; h.perto = true; } else h.perto = false; void id; }
    if(S.dicaEl){ if(dica && !S.painel && !S.aberta){ S.dicaEl.style.display = "block"; S.dicaEl.textContent = "[E] " + dica; } else S.dicaEl.style.display = "none"; }
    if(S.sim) S.sim(dt);
  }
  const ciclaLimite = (m) => dia() > S.diaInicio || (hora() >= m.horarioLimite && S.horaInicio < m.horarioLimite);
  function tecla(e){
    if(M.depurando && M.depurando()){
      if(e.code === "Home"){ e.preventDefault(); pulaPara(e.shiftKey ? -1 : +1); return true; }
      if(e.code === "End"){ e.preventDefault(); completaObjetivo(); return true; }
      if(e.code === "PageUp"){ e.preventDefault(); if(e.shiftKey && M.dia1) M.dia1.reinicia(); else reinicia(); return true; }
      return false;
    }
    if(e.code === "KeyJ" && !e.ctrlKey && !e.altKey && !e.metaKey){ e.preventDefault(); if(S.tela) fechaTela(); else abreTela(); return true; }
    if(S.aberta && e.code === "Escape"){ fechaTela(); return true; }
    if(e.code === "KeyE" && !S.painel && !S.aberta){
      const j = J(); if(!j) return false;
      for(const [id, h] of hs){ if(Math.hypot(h.p.x - j.x, h.p.z - j.z) <= h.raioM * U){ const ok = h.ok; hs.delete(id); ok && ok(true); return true; } }
      const et = etapaAtual(); if(et && et.tipo === "hotspot"){ const p = resolve(et.local); if(p && Math.hypot(p.x - j.x, p.z - j.z) <= (et.raioM || 3.5) * U){ avanca(); return true; } }
    }
    return false;
  }

  /* ---------- depuração ---------- */
  function ordemPrincipais(){ return MISSOES.filter(m => m.serie === "principal" && !m.emBreve); }
  function pulaPara(dir){
    const L = ordemPrincipais(); let i = S.ativa ? L.findIndex(m => m.id === S.ativa.id) : (S.ultimoPulo !== undefined ? S.ultimoPulo : -1);
    i = Math.max(0, Math.min(L.length - 1, i + dir)); pulaParaId(L[i].id);
  }
  function pulaParaId(id){
    const L = ordemPrincipais(), i = L.findIndex(m => m.id === id), m = mapa.get(id); if(!m) return false;
    S.ultimoPulo = i; if(S.ativa) abandonaSilencioso();
    L.slice(0, Math.max(0, i)).forEach(q => { if(!S.prog.concl[q.id]){ S.prog.concl[q.id] = { dia: dia(), hora: hora(), debug: true }; const r = q.recompensas || {}; (r.flags || []).forEach(f => { S.prog.flags[f] = true; }); (r.viagem || []).forEach(v => { S.prog.viagem[v] = true; }); } });
    delete S.prog.concl[id]; delete S.prog.falhas[id]; salva();
    M.ctx && M.ctx.mostraAviso("Debug: início da missão " + (m.numero || "") + " — " + m.titulo);
    if(m.inicio && m.inicio.hora !== undefined) M.ciclo.ajustaHora(m.inicio.hora); const pos = m.inicio && resolve(m.inicio.local); if(pos && M.ctx) M.ctx.teleporta(pos.x, pos.z);
    inicia(id, { forca: true }); return true;
  }
  function abandonaSilencioso(){ soltaRelogio(); S.ativa = null; S.token++; S.alvo = null; atualizaAlvo(); }
  function completaObjetivo(){
    if(!S.ativa){ M.ctx && M.ctx.mostraAviso("Sem missão ativa (Home inicia a próxima)"); return false; }
    const e = etapaAtual(); S.token++;                                                  // cancela a cena em curso e passa para a próxima etapa
    M.ctx && M.ctx.mostraAviso("Debug: objetivo concluído — " + (e ? e.texto : "")); avanca(); return true;
  }
  function reinicia(){ abandonaSilencioso(); S.prog = { v: 1, concl: {}, falhas: {}, flags: {}, viagem: {}, atual: null }; salva(); desenhaTracker(); atualizaTela(); M.ctx && M.ctx.mostraAviso("Debug: progresso das missões apagado"); }

  /* ---------- API usada por outros sistemas ---------- */
  const SEMPRE = new Set(MISSOES_CFG.viagemSempre);
  const viagemPermitida = (id) => !MISSOES_CFG.bloqueiaViagemAteLiberar || SEMPRE.has(id) || !!S.prog.viagem[id] || !!S.prog.viagem["*"] || (S.ativa && etapaAtual() && (etapaAtual().viagem || []).includes(id));
  function restaura(){
    const a = S.prog.atual; if(a && mapa.get(a.id) && !S.prog.concl[a.id]){ S.ativa = mapa.get(a.id); S.etapa = Math.min(a.etapa, S.ativa.etapas.length - 1); S.diaInicio = dia(); S.horaInicio = hora(); seguraRelogio(S.ativa); entraEtapa(); }
  }
  let restaurado = false;
  return {
    liga: (ui) => { monta(ui); if(!restaurado){ restaurado = true; setTimeout(restaura, 1500); } },
    desliga: () => { fechaTela(); [S.tracker, S.dicaEl].forEach(x => x && x.remove()); S.tracker = S.dicaEl = null; if(S.painel) S.painel.remove(); if(S.marcador){ S.marcador.parent && S.marcador.parent.remove(S.marcador); S.marcador = null; } },
    tick, tecla, info: () => "Missões: " + (S.ativa ? "M" + (S.ativa.numero || S.ativa.id) + " etapa " + (S.etapa + 1) + "/" + S.ativa.etapas.length : "nenhuma ativa") + " · " + Object.keys(S.prog.concl).length + " concluídas",
    ouve: (f) => { ouvintes.push(f); }, registraCena: (nome, f) => { S.cenas[nome] = f; }, inicia, avanca, conclui, falha, abandona, emite, flag, estadoDe, pulaParaId, pulaPara, completaObjetivo, reinicia, viagemPermitida, hotspot, removeHotspot, hs,
    abreTela, fechaTela, lista: () => MISSOES, get ativa(){ return S.ativa; }, get etapa(){ return S.etapa; }, get prog(){ return S.prog; }, S, mapa,
    resolve, alvoPos: posAlvo
  };
}
