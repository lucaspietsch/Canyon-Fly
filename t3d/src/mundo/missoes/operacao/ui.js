/* Painéis reutilizáveis das missões: checklist item a item (formulários que já existem no projeto), perguntas e leituras. */
export function criaUI(M, D){
  const ROTULO = { C: "Conforme", NC: "Não conforme", NA: "Não se aplica" };

  /* Checklist item por item. `instrutor` fala cada item (treinamento) ou fica em silêncio (inspeção). Devolve { C, NC, NA, nc: [itens] }.
     Cada item gasta `minPorItem` minutos do relógio do jogo. */
  async function checklist(X, { titulo, itens, minPorItem = .4, instrutor = null, treino = false, etiqueta = "CHECKLIST" }){
    const r = { C: 0, NC: 0, NA: 0, nc: [] }, n = itens.length;
    for(let i = 0; i < n; i++){
      const txt = itens[i];
      if(instrutor){ D.fala(instrutor, treino ? "Item " + (i + 1) + ": " + txt.replace(/\?$/, "") + ". Confira e responda." : "Item " + (i + 1) + ": " + txt, { dur: 3.2 }); }
      const v = await X.painel({ etiqueta: etiqueta + " · " + titulo.toUpperCase() + " · ITEM " + (i + 1) + "/" + n, titulo: txt, fundo: false,
        corpo: treino ? ["Instrutor: olhe o equipamento ou a área, responda e siga para o próximo item.", "(Explicação detalhada deste item: a definir — o projeto só tem a pergunta do formulário.)"] : null,
        botoes: [{ rotulo: "Conforme (C)", valor: "C" }, { rotulo: "Não conforme (NC)", valor: "NC" }, { rotulo: "Não se aplica (NA)", valor: "NA" }] });
      r[v]++; if(v === "NC"){ r.nc.push(txt); X.msg("emergencia", "Não conformidade registrada: " + txt);
        if(instrutor) D.fala(instrutor, "Registre a não conformidade e avise o líder antes de operar. (Tratativa formal: a definir.)", { dur: 4, tipo: "tirolesa" }); }
      X.avancaMin(minPorItem);
    }
    X.msg("missao", titulo + ": " + r.C + " conformes, " + r.NC + " não conformes, " + r.NA + " não se aplicam");
    return r;
  }

  /* leitura simples com botão */
  const leitura = (X, titulo, linhas, rotulo = "Continuar", o = {}) => X.painel({ titulo, corpo: linhas, botoes: [{ rotulo, valor: true }], ...o });

  /* botão de esforço repetido (puxar/empurrar): cada toque (ou Espaço/Enter/E) avança 1/n; devolve quando completa */
  function repete(X, { etiqueta = "", titulo, rotulo, n, aoToque }){
    return new Promise((ok, no) => {
      if(!M.ui) return no(new Error("sem interface")); let k = 0;
      const el = document.createElement("div"); el.style.cssText = "position:absolute;left:0;right:0;bottom:14px;z-index:70;display:flex;justify-content:center;pointer-events:none;";
      const cx = document.createElement("div"); cx.style.cssText = "pointer-events:auto;width:min(480px,92vw);background:rgba(14,18,10,.97);border:2px solid #8a9a3b;border-radius:16px;padding:14px 16px;color:#ecebdd;font:600 14px system-ui,sans-serif;text-align:center;";
      cx.innerHTML = "<div style='font-size:11px;letter-spacing:1px;color:#9fd37a'>" + etiqueta + "</div><div style='color:#ffd36a;font-size:16px;margin:4px 0 8px'>" + titulo + "</div><div style='height:10px;background:#232a15;border-radius:9px;overflow:hidden;margin-bottom:10px'><i id='rp-b' style='display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7a00,#ffd36a)'></i></div>";
      const b = document.createElement("button"); b.type = "button"; b.textContent = rotulo + "  (toque ou Espaço)"; b.style.cssText = "width:100%;padding:12px;border-radius:10px;border:1.5px solid #6aa84a;background:#25331a;color:#eaf5da;font:800 15px system-ui,sans-serif;cursor:pointer;"; cx.appendChild(b); el.appendChild(cx); M.ui.appendChild(el);
      const fim = () => { window.removeEventListener("keydown", kd, true); clearInterval(vig); el.remove(); };
      const toque = () => { k++; cx.querySelector("#rp-b").style.width = Math.min(100, 100 * k / n) + "%"; if(aoToque) aoToque(k / n, k); if(k >= n){ fim(); ok(true); } };
      const kd = (e) => { e.stopPropagation(); e.preventDefault(); if(!e.repeat && (e.code === "Space" || e.code === "Enter" || e.code === "KeyE")) toque(); };
      b.onclick = toque; window.addEventListener("keydown", kd, true);
      const vig = setInterval(() => { if(!X.vivo()){ fim(); try{ X.guarda(); }catch(e){ no(e); } } }, 200);
    });
  }
  return { checklist, leitura, repete, ROTULO };
}
