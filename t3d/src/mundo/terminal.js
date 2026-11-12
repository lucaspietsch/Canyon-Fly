/* ============================================================================================================
   TERMINAL DE INFORMAÇÕES (logo abaixo do minimapa) — usado pelo jogo inteiro.
   Cada mensagem tem o horário do jogo e uma cor por tipo:
     missao (verde) · tirolesa (laranja) · emergencia (vermelho) · natureza (azul) · sobrenatural (roxo: Tupã, Anhangá, floresta encantada) · info (branco/cinza)
   Mostra as últimas 5 mensagens (as mais antigas esmaecem); a roda do mouse rola o histórico; a tecla T (ou o botão ▲) expande o histórico completo.
   Uso: M.terminal.msg("natureza", "Vento aumentando"). Também aceita M.terminal.msg("missao", "texto", { unico: true }) para não repetir a mesma linha em seguida.
   ============================================================================================================ */

export const TIPOS = {
  missao: { cor: "#7ddc6a", nome: "Missão" }, tirolesa: { cor: "#ffa23a", nome: "Tirolesa" }, emergencia: { cor: "#ff5a4a", nome: "Emergência" },
  natureza: { cor: "#6ab8ff", nome: "Natureza" }, sobrenatural: { cor: "#b784ff", nome: "Sobrenatural" }, info: { cor: "#d4d4c8", nome: "Geral" }
};
const VISIVEIS = 5, MAX = 400;

export function criarTerminal(M){
  const ouvintes = [], S = { lista: [], el: null, caixa: null, hist: null, aberto: false, rolagem: 0, ult: "", ultT: 0, ui: null };
  const hora = () => { try{ return M.ciclo.horaTexto(); }catch(_){ return "--:--"; } };
  function msg(tipo, texto, opc = {}){
    if(!TIPOS[tipo]) tipo = "info"; const agora = performance.now(); if(S.ult === tipo + texto && agora - S.ultT < 1500) return; S.ult = tipo + texto; S.ultT = agora;
    ouvintes.forEach(f => { try{ f(tipo, texto); }catch(_){ /* ouvinte opcional */ } });
    S.lista.push({ t: hora(), tipo, texto, real: Date.now() }); if(S.lista.length > MAX) S.lista.shift(); if(!opc.semRolar) S.rolagem = 0; desenha();
  }
  const linha = (m, op = 1) => { const d = document.createElement("div"); d.style.cssText = "display:flex;gap:6px;line-height:1.35;opacity:" + op + ";"; const h = document.createElement("span"); h.textContent = m.t; h.style.cssText = "opacity:.62;flex:none;"; const t = document.createElement("span"); t.textContent = m.texto; t.style.color = TIPOS[m.tipo].cor; d.append(h, t); return d; };
  function desenha(){
    if(!S.caixa) return;
    S.caixa.textContent = ""; const n = S.lista.length, fim = Math.max(0, n - S.rolagem), ini = Math.max(0, fim - VISIVEIS);
    for(let i = ini; i < fim; i++){ const idade = fim - 1 - i; S.caixa.appendChild(linha(S.lista[i], Math.max(.28, 1 - idade * .17))); }
    if(!n){ const d = document.createElement("div"); d.style.opacity = ".5"; d.textContent = "Sem mensagens"; S.caixa.appendChild(d); }
    if(S.aberto && S.hist){ S.hist.textContent = ""; S.lista.slice().reverse().forEach(m => S.hist.appendChild(linha(m))); }
  }
  function monta(){
    const pai = M.mapa && M.mapa.coluna && M.mapa.coluna(); if(!pai || S.el) return;
    const el = document.createElement("div"); el.dataset.hud = "extra"; el.style.cssText = "pointer-events:auto;width:min(260px,44vw);background:rgba(10,12,8,.72);border:1.5px solid #3a4222;border-radius:10px;padding:5px 8px 6px;font:600 10.5px ui-monospace,Consolas,monospace;color:#d4d4c8;position:relative;";
    const topo = document.createElement("div"); topo.style.cssText = "display:flex;justify-content:space-between;opacity:.55;font-size:9.5px;margin-bottom:2px;letter-spacing:.4px;"; topo.innerHTML = "<span>TERMINAL</span>"; const bt = document.createElement("span"); bt.textContent = "▲ histórico (T)"; bt.style.cursor = "pointer"; bt.onpointerdown = (e) => { e.preventDefault(); alterna(); }; topo.appendChild(bt);
    S.caixa = document.createElement("div"); S.caixa.style.cssText = "height:" + (VISIVEIS * 14.5) + "px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;";
    el.append(topo, S.caixa); pai.appendChild(el); S.el = el;
    el.addEventListener("wheel", e => { e.preventDefault(); e.stopPropagation(); S.rolagem = Math.max(0, Math.min(Math.max(0, S.lista.length - VISIVEIS), S.rolagem + (e.deltaY < 0 ? 1 : -1))); desenha(); }, { passive: false });
    desenha();
  }
  function alterna(on){
    S.aberto = on === undefined ? !S.aberto : on; if(!S.ui) return;
    if(S.aberto){ S.hist = document.createElement("div"); S.hist.style.cssText = "position:absolute;right:10px;top:56px;z-index:46;width:min(520px,92vw);max-height:80%;overflow:auto;background:rgba(8,10,6,.94);border:2px solid #8a9a3b;border-radius:14px;padding:12px 14px;font:600 12px ui-monospace,Consolas,monospace;color:#d4d4c8;pointer-events:auto;";
      const t = document.createElement("div"); t.style.cssText = "display:flex;justify-content:space-between;margin-bottom:8px;color:#ffd36a;font-size:13px;"; t.innerHTML = "<span>HISTÓRICO · " + S.lista.length + " mensagens</span><span style='cursor:pointer' id='tm-x'>✕ (T / Esc)</span>"; S.hist.prepend(t);
      const corpo = document.createElement("div"); corpo.id = "tm-c"; S.hist.appendChild(corpo); S.ui.appendChild(S.hist); S.hist.querySelector("#tm-x").onpointerdown = () => alterna(false); S.hist = corpo; S.histCaixa = corpo.parentNode;
      const leg = document.createElement("div"); leg.style.cssText = "margin-top:8px;opacity:.7;font-size:10.5px;"; leg.innerHTML = Object.values(TIPOS).map(t => "<span style='color:" + t.cor + "'>● " + t.nome + "</span>").join(" &nbsp; "); S.histCaixa.appendChild(leg); S.histCaixa.addEventListener("wheel", e => e.stopPropagation(), { passive: true }); desenha(); }
    else if(S.histCaixa){ S.histCaixa.remove(); S.hist = S.histCaixa = null; }
  }
  function tecla(e){
    if(S.aberto && (e.code === "KeyT" || e.code === "Escape")){ alterna(false); e.preventDefault(); return true; }
    if(e.code === "KeyT" && !M.depurando() && !e.ctrlKey && !e.altKey && !e.metaKey){ alterna(true); e.preventDefault(); return true; }
    return false;
  }
  /* ---------- observador: os sistemas já existentes mandam mensagens sem precisar de remendo em cada um ---------- */
  const O = { t: 0, vistos: new WeakSet(), vento: "", fase: "", resg: "", zona: "", neb: 0, aero: new WeakSet(), serp: new WeakSet(), hawk: false, sil: false, andor: false, conf: false, capi: false, meteoro: false, ninhos: 0, primeiro: true };
  const NOMEFASE = { queda: "Acidente na trilha: o bombeiro civil foi acionado", saida: "Bombeiro civil e equipe de resgate saem da base", sobe: "Equipe de resgate subindo de quadriciclo", atende: "Equipe atendendo a vítima", espera: "Aguardando a ambulância", embarque: "Vítima na maca: embarque", preparaDesce: "Preparando a descida com a maca", desce: "Comboio de resgate descendo a trilha", carga: "Vítima sendo carregada na ambulância", saidaAmb: "Ambulância deixando o parque, sirene ligada", fora: "Ambulância a caminho de Cambará do Sul", voltaAmb: "Ambulância retornando ao parque", descarrega: "Ambulância de volta ao estacionamento" };
  function observa(dt){
    O.t += dt; if(O.t < .5) return; O.t = 0; const primeiro = O.primeiro; O.primeiro = false; const E = M.ciclo.estado;
    try{
      if(M.vento){ const v = M.vento.estado; if(v !== O.vento){ if(O.vento){ if(v.startsWith("vento") && !O.vento.startsWith("vento")) msg("natureza", "Vento aumentando"); else if(v === "brisa") msg("natureza", "O vento diminuiu: brisa leve"); else if(v.includes("rajada") && !O.vento.includes("rajada")) msg("natureza", "Rajada de vento"); } O.vento = v; } }
      if(E.fase !== O.fase){ if(O.fase) msg("info", E.fase === "Dia" ? "É dia" : "Fase do dia: " + E.fase); O.fase = E.fase; }
      if(M.nevoa){ const n = M.nevoa.estado.n; if(Math.abs(n - O.neb) > .25){ msg("natureza", n > O.neb ? "Neblina subindo pelo cânion" : "A neblina está se dissipando"); O.neb = n; } }
      if(M.aeronaves) M.aeronaves.voos.forEach(v => { if(O.aero.has(v)) return; O.aero.add(v); if(v.tipo === "monomotor") msg("natureza", v.baixo ? "Monomotor voando baixo sobre o cânion" : "Monomotor sobrevoando o cânion"); else if(v.tipo === "jato") msg("natureza", "Avião de passageiros cruzando o céu"); });
      if(M.meteoros){ const at = !!M.meteoros.estado.ativa; if(at && !O.meteoro) msg("natureza", "Chuva de meteoros começando"); if(!at && O.meteoro) msg("natureza", "A chuva de meteoros terminou"); O.meteoro = at; }
      M.fauna.animais.forEach(a => { if(O.vistos.has(a)) return; O.vistos.add(a); if(a.fam) return; if(!primeiro) msg("natureza", (a.nome || a.id) + " avistado"); });
      if(M.fauna.serp) M.fauna.serp.lista.forEach(sp => { if(O.serp.has(sp)) return; O.serp.add(sp); msg("natureza", (sp.nome || "Serpente") + " cruzando a trilha"); });
      { const c = !!(M.fauna.capi && M.fauna.capi.familia); if(c && !O.capi) msg("natureza", "Família de capivaras na beira do rio"); O.capi = c; }
      if(M.fauna.aves){ const A = M.fauna.aves.S; if(A.hawk && !O.hawk) msg("natureza", "Gralhas expulsando um gavião"); O.hawk = !!A.hawk; if(A.sil && !O.sil) msg("natureza", "A mata ficou em silêncio: algo grande passou"); O.sil = !!A.sil; const nn = M.fauna.aves.ninhos.length; if(nn > O.ninhos) msg("natureza", "Quero-quero com ninho no campo: cuidado com os rasantes"); O.ninhos = nn; }
      if(M.fauna.andorinhas){ const a = M.fauna.andorinhas.S.presenca > .5; if(a && !O.andor) msg("natureza", "Revoada de andorinhas sobre o vão"); O.andor = a; }
      if(M.fauna.conflitos){ const c = !!M.fauna.conflitos.ativo; if(c && !O.conf) msg("natureza", "Encontro natural entre animais: o menor cede lugar"); O.conf = c; }
      if(M.resgate){ const m = /· (\w+)/.exec(M.resgate.info()), f = m ? m[1] : ""; if(f !== O.resg){ if(NOMEFASE[f]) msg("emergencia", NOMEFASE[f]); O.resg = f; } }
      if(M.zonas && M.zonas.atual !== O.zona){ if(O.zona) msg("info", "Você chegou: " + M.zonas.S.nome); O.zona = M.zonas.atual; }
    }catch(err){ /* um observador nunca derruba o jogo */ }
  }
  function liga(ui){ S.ui = ui; monta(); }
  function desliga(){ if(S.histCaixa){ S.histCaixa.remove(); S.hist = S.histCaixa = null; } S.aberto = false; if(S.el){ S.el.remove(); S.el = null; S.caixa = null; } }
  return { msg, ouve: (f) => { ouvintes.push(f); }, tick: (dt) => observa(dt), liga, desliga, tecla, alterna, lista: S.lista, S, info: () => "Terminal: " + S.lista.length + " mensagens" };
}
