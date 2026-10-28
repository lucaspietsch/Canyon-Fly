import { Vector3 } from "three";

/* Balões de fala: um pequeno pool de elementos DOM, posicionados sobre a cabeça de quem fala (projeção da câmera). Só aparecem perto do jogador. */
export function criarBaloes(M){
  const POOL = 5, els = [], ativos = [], v = new Vector3();
  let raiz = null;
  const liga = (ui) => { raiz = document.createElement("div"); raiz.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:28;overflow:hidden;"; ui.appendChild(raiz);
    for(let i = 0; i < POOL; i++){ const e = document.createElement("div"); e.style.cssText = "position:absolute;left:0;top:0;max-width:min(260px,62%);padding:7px 11px;border-radius:14px;background:rgba(250,248,240,.95);color:#1f1d16;font:600 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.4);display:none;transform:translate(-50%,-100%);text-align:center;"; const seta = document.createElement("div"); seta.style.cssText = "position:absolute;left:50%;bottom:-6px;width:12px;height:12px;background:inherit;transform:translateX(-50%) rotate(45deg);"; e.appendChild(document.createElement("span")); e.appendChild(seta); raiz.appendChild(e); els.push(e); } };
  const desliga = () => { raiz && raiz.remove(); raiz = null; els.length = 0; ativos.length = 0; };
  /* quem: pessoa do pool · texto · dur (s) · max (u) distância máxima do jogador para aparecer · cor opcional */
  function fala(quem, texto, dur = 4, maxU = 8 * 2.94, cor = null){
    for(let i = ativos.length - 1; i >= 0; i--) if(ativos[i].quem === quem) ativos.splice(i, 1);          // cada pessoa tem no máximo um balão
    ativos.push({ quem, texto, t: 0, dur, maxU, cor });
    if(ativos.length > 14) ativos.shift();
  }
  function tick(dt, J, cam, w, h){
    if(!raiz) return;
    ativos.forEach(a => { a.t += dt; });
    for(let i = ativos.length - 1; i >= 0; i--) if(ativos[i].t > ativos[i].dur || !ativos[i].quem.ativo || ativos[i].quem.oculto) ativos.splice(i, 1);
    const vis = [];
    ativos.forEach(a => { if(!J) return; const d = Math.hypot(a.quem.x - J.x, a.quem.z - J.z); if(d <= a.maxU){ v.set(a.quem.x, a.quem.y + 6.3 * a.quem.esc, a.quem.z).project(cam); if(v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) vis.push({ a, d, x: (v.x * .5 + .5) * w, y: (-v.y * .5 + .5) * h }); } });
    vis.sort((p, q) => p.d - q.d);
    els.forEach((e, i) => { const q = vis[i]; if(!q){ e.style.display = "none"; return; } e.style.display = "block"; e.firstChild.textContent = q.a.texto; e.style.left = q.x + "px"; e.style.top = q.y + "px"; e.style.opacity = String(Math.min(1, (q.a.dur - q.a.t) * 2.5 + .1)); e.style.background = q.a.cor || "rgba(250,248,240,.95)"; e.style.zIndex = String(100 - i); });
  }
  return { liga, desliga, fala, tick, ativos, limpa: () => { ativos.length = 0; } };
}
