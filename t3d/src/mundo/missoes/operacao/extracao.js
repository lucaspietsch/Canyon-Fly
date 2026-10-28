import { EXTRACOES, ITENS_RESG } from "../../../../../data/missoes/procedimentos.js";

/* ============================================================================================================
   EXTRAÇÃO SIMPLES E MODERADA (procedimento de resgate do jogo "Iniciar Turno": data/missoes/procedimentos.js › EXTRACOES)
   • `jogador`: o jogador executa cada passo (rádio, bloquear vias, pegar o kit, clipar, puxar, orientar o cliente...) — missão 5.
   • `automatica`: a equipe do recebimento executa sozinha e o terminal narra em vermelho (resgate) — missão 7.
   O estado visual (E.sc) é lido pelas cenas 3D extSimples/extModerada de jogo3d.js.
   ============================================================================================================ */
const sub = (t, via) => String(t || "").replace(/\{via\}/g, via);

export function criaExtracao(O){
  const { M, D, UI } = O, G = () => M.H.jogo, A = () => G().atores;

  /* estado inicial da cena de extração */
  const novo = (tipo) => ({ tipo, def: EXTRACOES[tipo], i: 0, sc: { pul0: false, pul: 0, cli: 0, res0: false, res: 0, back: 0, bloq: { 1: false, 3: false, 5: false }, eq: {}, prog: 0 }, t: 0 });
  const quadro = (E, Dd) => (dt, t) => { E.t += dt; G()[E.tipo === "simples" ? "extSimples" : "extModerada"]({ E, D: Dd, t }); };

  /* ---------- um passo executado pelo jogador ---------- */
  async function passo(X, E, Dd, p){
    const via = Dd.via, et = "EXTRAÇÃO " + (E.tipo === "simples" ? "SIMPLES" : "MODERADA") + " · " + (E.i + 1) + "/" + E.def.passos.length;
    const alvoCoord = A().coord, lider = A().lider3;
    const erro = (m) => X.msg("emergencia", m);
    switch(p.tipo){
      case "radio": {
        await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: p.txt, botoes: [{ rotulo: p.chama.replace(/^📻 /, "📻 Chamar ").replace(/\{via\}/g, via), valor: true }] });
        D.fala(A().op6, sub(p.chama, via).replace(/^📻 /, "").replace(/^"|"$/g, ""), { tipo: "emergencia", dur: 3.5 }); await X.espera(D.acelera ? .3 : 2.2);
        D.fala(E.tipo === "simples" ? alvoCoord : alvoCoord, sub(p.resp, via), { tipo: "emergencia", dur: 4, semBalao: true }); await X.espera(D.acelera ? .3 : 1.5); break; }
      case "bloqueio": {
        for(const v of [1, 3, 5]){ await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: p.txt, botoes: [{ rotulo: "Bloquear a Via " + v, valor: true }] }); E.sc.bloq[v] = true; X.msg("emergencia", "Via " + v + " bloqueada"); }
        break; }
      case "itens": {
        const certos = p.itens.filter(i => i[1]).length, pegos = new Set();
        while(pegos.size < certos){
          const lista = p.itens.filter(i => !pegos.has(i[0]));
          const r = await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: p.txt + "  (" + pegos.size + "/" + certos + ")", botoes: lista.map(i => ({ rotulo: i[0], valor: i })) });
          if(r[1]){ pegos.add(r[0]); if(p.equipa) E.sc.eq[r[0]] = true; X.msg("tirolesa", "Pegou: " + r[0]); } else erro((r[2] || "Item que não faz parte deste procedimento.") + " (" + r[0] + ")");
        }
        break; }
      case "toque": {
        await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: p.txt, botoes: [{ rotulo: p.btn, valor: true }] });
        if(p.alvo) E.sc[p.alvo] = true; break; }
      case "puxar": {
        await UI.repete(X, { etiqueta: et, titulo: p.nome + " — " + p.txt, rotulo: p.btn, n: p.n, aoToque: (f) => { E.sc[p.campo] = f; } });
        E.sc[p.campo] = 1; break; }
      case "escolha": {
        for(;;){ const r = await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: p.txt, botoes: p.ops.map(o => ({ rotulo: o[0], valor: o })) });
          if(r[1]) break; erro(r[2] || "Essa não é a conduta correta."); }
        break; }
      case "dupla": {
        const falha = Math.floor(Math.random() * ITENS_RESG.length), com = Math.random() < .5; let ok = false;
        while(!ok){
          const r = await X.painel({ etiqueta: et, titulo: p.nome, fundo: false, corpo: ITENS_RESG.map((it, i) => it.n + ": " + (com && i === falha ? it.ruim : it.ok)), botoes: [{ rotulo: "Tudo conforme: liberar", valor: "ok" }, ...(com ? [{ rotulo: "Reportar o item com falha e corrigir", valor: "rep" }] : [])] });
          if(r === "ok" && com){ erro("Você ia liberar com falha: " + ITENS_RESG[falha].n + " — " + ITENS_RESG[falha].ruim + ". " + ITENS_RESG[falha].e); continue; }
          if(r === "rep"){ X.msg("tirolesa", ITENS_RESG[falha].n + " corrigido e conferido de novo"); const r2 = await X.painel({ etiqueta: et, titulo: "Conferido de novo", fundo: false, botoes: [{ rotulo: "Tudo conforme: liberar", valor: true }] }); void r2; }
          ok = true; }
        break; }
      default: break;
    }
    void lider;
  }
  async function jogador(X, tipo, Dd){
    const E = novo(tipo); E.i = 0; D.roda(quadro(E, Dd));
    X.msg("emergencia", E.def.titulo + " — " + E.def.sub);
    for(let i = 0; i < E.def.passos.length; i++){ E.i = i; await passo(X, E, Dd, E.def.passos[i]); }
    E.i = E.def.passos.length - 1; return E;
  }

  /* ---------- a equipe faz sozinha (missão 7): o terminal narra em vermelho ---------- */
  async function automatica(X, tipo, Dd, hold){
    const E = novo(tipo), via = Dd.via; const quadroE = quadro(E, Dd); hold.fn = quadroE;
    X.msg("emergencia", E.def.titulo + " — " + E.def.sub);
    const anim = async (campo, seg) => { let t = 0; while(t < seg){ await X.espera(.05); t += .05 * (D.acelera ? 5 : 1); E.sc[campo] = Math.min(1, t / seg); } E.sc[campo] = 1; };
    for(let i = 0; i < E.def.passos.length; i++){
      E.i = i; const p = E.def.passos[i]; X.msg("emergencia", (i + 1) + "/" + E.def.passos.length + " · " + p.nome);
      if(p.tipo === "radio"){ X.msg("emergencia", sub(p.chama, via).replace(/^📻 /, "Rádio: ")); await X.espera(D.acelera ? .2 : 1.6); X.msg("emergencia", sub(p.resp, via)); }
      else if(p.tipo === "bloqueio"){ [1, 3, 5].forEach(v => { E.sc.bloq[v] = true; }); X.msg("emergencia", "Vias 1, 3 e 5 bloqueadas"); }
      else if(p.tipo === "toque" && p.alvo){ E.sc[p.alvo] = true; }
      else if(p.tipo === "puxar"){ await anim(p.campo, D.acelera ? 2 : 7); }
      else if(p.tipo === "itens" && p.equipa){ p.itens.filter(x => x[1]).forEach(x => { E.sc.eq[x[0]] = true; }); }
      await X.espera(D.acelera ? .2 : 1.4);
    }
    return { E };
  }
  return { novo, quadro, jogador, automatica };
}
