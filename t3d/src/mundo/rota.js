import { U } from "./config.js";

/* ============================================================================================================
   ROTA A PÉ até o destino marcado no mapa: segue as linhas do mapa (trilhas do parque, estrada, ruas das vilas e da cidade).
   • Grafo montado das polylines (vértices a menos de JUNTA viram o mesmo nó; trechos longos são subdivididos; nós de linhas que se
     cruzam sem dividir vértice ganham ligação até LIGA). Remontado sozinho quando a estrada/as ruas terminam de carregar (KML).
   • Dijkstra com custo FORA× para andar fora das linhas: a rota só corta pelo campo quando compensa, e se não houver linha perto
     (ACESSO) do jogador ou do destino, ela é a reta.
   • API: calcula(ax, az, bx, bz) → [[x, z], …] (do jogador ao destino).
   ============================================================================================================ */

const JUNTA = 3 * U, LIGA = 14 * U, PASSO = 20 * U, ACESSO = 450 * U, FORA = 1.8, CEL = 16 * U;

export function criarRota(M){
  const G = { nos: [], viz: [], grade: new Map(), assin: "" };
  const celula = (x, z) => Math.floor(x / CEL) + "," + Math.floor(z / CEL);
  function perto(x, z, r, f){
    const n = Math.ceil(r / CEL), cx = Math.floor(x / CEL), cz = Math.floor(z / CEL);
    for(let i = -n; i <= n; i++) for(let j = -n; j <= n; j++){ const l = G.grade.get((cx + i) + "," + (cz + j)); if(!l) continue;
      for(const k of l){ const p = G.nos[k], d = Math.hypot(p[0] - x, p[1] - z); if(d <= r) f(k, d); } }
  }
  function no(x, z){
    let k = -1, md = JUNTA; perto(x, z, JUNTA, (i, d) => { if(d < md){ md = d; k = i; } }); if(k >= 0) return k;
    k = G.nos.length; G.nos.push([x, z]); G.viz.push([]); const c = celula(x, z); if(!G.grade.has(c)) G.grade.set(c, []); G.grade.get(c).push(k); return k;
  }
  function liga(a, b){ if(a === b || G.viz[a].some(e => e[0] === b)) return; const d = Math.hypot(G.nos[a][0] - G.nos[b][0], G.nos[a][1] - G.nos[b][1]); G.viz[a].push([b, d]); G.viz[b].push([a, d]); }
  function linhas(){
    const L = [], ok = (l) => Array.isArray(l) && l.length > 1 && Array.isArray(l[0]);
    const T = (M.cen && M.cen.trilhas) || {}; Object.values(T).forEach(l => { if(ok(l)) L.push(l); });
    if(M.estrada && ok(M.estrada.pts)) L.push(M.estrada.pts);
    if(M.zonas && M.zonas.urbano) M.zonas.urbano.forEach(u => (u.ruas || []).forEach(r => { if(ok(r)) L.push(r); }));
    return L;
  }
  function monta(){
    const L = linhas(), assin = L.map(l => l.length).join(","); if(assin === G.assin) return;
    G.nos = []; G.viz = []; G.grade = new Map(); G.assin = assin;
    L.forEach(l => { let ant = no(l[0][0], l[0][1]);
      for(let i = 1; i < l.length; i++){ const a = l[i - 1], b = l[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / PASSO));
        for(let s = 1; s <= n; s++){ const t = s / n, k = no(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); liga(ant, k); ant = k; } } });
    for(let k = 0, N = G.nos.length; k < N; k++){ const p = G.nos[k]; perto(p[0], p[1], LIGA, (i) => { if(i > k) liga(k, i); }); }
  }
  /* fila de prioridade (heap binário) para o Dijkstra */
  function calcula(ax, az, bx, bz){
    monta(); const N = G.nos.length, reta = [[ax, az], [bx, bz]]; if(!N) return reta;
    const dist = new Float64Array(N).fill(Infinity), ant = new Int32Array(N).fill(-1), hk = [], hc = [];
    const poe = (k, c) => { let i = hk.length; hk.push(k); hc.push(c); while(i > 0){ const p = (i - 1) >> 1; if(hc[p] <= c) break; hk[i] = hk[p]; hc[i] = hc[p]; i = p; } hk[i] = k; hc[i] = c; };
    const tira = () => { const k = hk[0], c = hc[0], lk = hk.pop(), lc = hc.pop(); if(hk.length){ let i = 0; for(;;){ const l = 2 * i + 1, r = l + 1; let m = i, mc = lc;
      if(l < hk.length && hc[l] < mc){ m = l; mc = hc[l]; } if(r < hk.length && hc[r] < mc){ m = r; mc = hc[r]; } if(m === i) break; hk[i] = hk[m]; hc[i] = hc[m]; i = m; } hk[i] = lk; hc[i] = lc; } return [k, c]; };
    perto(ax, az, ACESSO, (k, d) => { const c = d * FORA; if(c < dist[k]){ dist[k] = c; ant[k] = -2; poe(k, c); } });
    const saida = new Map(); perto(bx, bz, ACESSO, (k, d) => saida.set(k, d * FORA));
    let melhor = Math.hypot(bx - ax, bz - az) * FORA, fim = -1;
    while(hk.length){ const [k, c] = tira(); if(c > dist[k]) continue; if(c >= melhor) break;
      const s = saida.get(k); if(s !== undefined && c + s < melhor){ melhor = c + s; fim = k; }
      for(const [v, w] of G.viz[k]){ const nc = c + w; if(nc < dist[v]){ dist[v] = nc; ant[v] = k; poe(v, nc); } } }
    if(fim < 0) return reta;
    const P = []; for(let k = fim; k >= 0; k = ant[k]) P.push(G.nos[k]); P.reverse();
    return [[ax, az], ...P, [bx, bz]];
  }
  return { calcula, info: () => "Rota: " + G.nos.length + " nós" };
}
