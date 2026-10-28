import { U } from "../config.js";

/* ============================================================================================================
   NAVEGAÇÃO DO RESGATE (quadriciclo e comboio): trabalha em coordenadas de trilha (s ao longo, lat para o lado) e escolhe um deslocamento lateral SEGURO.
   • candidatos de desvio por pontos pré-definidos ao lado da trilha (a cada ~2,5 m, até 14 m), sempre apoiados no terreno;
   • "seguro" = campo aberto: fora de mata (tronco de araucária a < 2,4 m), banhado/água (< 14 u do curso), borda do cânion (< 40 u), colinas/relevo íngreme (> ~24°), cerca/colisores,
     e fora das áreas de mata/banhado do KML;
   • obstáculos (pessoas, serpentes, animais) viram pontos em (s, lat) com uma folga em metros; o plano exige folga em toda a janela à frente (e um pouco atrás).
   ============================================================================================================ */

const cl = (v, a, b) => Math.max(a, Math.min(b, v));
export const CANDIDATOS_M = [0, 2.8, -2.8, 5.5, -5.5, 8.5, -8.5, 11.5, -11.5, 15, -15];

export function criarNav(M){
  const { cen } = M, troncos = cen.terreno.troncos || [];
  const Z = () => M.fauna.zonas, TL = U * 3.4;                                   // meia-largura da trilha (u)
  const chao = (x, z) => cen.chao(x, z, 1e9);

  /* projeta (x,z) numa trilha: s e lat (lat > 0 para o lado da normal (−tz, tx)); `hint` = índice do segmento onde procurar primeiro */
  function proj(path, x, z, hint = 0, tudo = false){
    const P = path.pts, i0 = tudo ? 0 : Math.max(0, hint - 4), i1 = tudo ? P.length - 2 : Math.min(P.length - 2, hint + 8); let best = null;
    for(let i = i0; i <= i1; i++){ const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = cl(t, 0, 1);
      const qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if(!best || d < best.d){ const l = Math.sqrt(l2); best = { d, i, s: path.cum[i] + t * l, lat: ((x - qx) * (-dz / l) + (z - qz) * (dx / l)), qx, qz }; } }
    return best;
  }
  const declive = (x, z) => { const d = 3; return Math.hypot(chao(x + d, z) - chao(x - d, z), chao(x, z + d) - chao(x, z - d)) / (2 * d); };
  /* campo aberto, plano e longe de mata, água e borda? */
  function seguroXZ(x, z){
    const zn = Z(); if(!zn.livre(x, z, 2.2, 40)) return false;
    if(declive(x, z) > .42) return false;
    if(zn.ZONAS.agua.distAgua(x, z) < 14) return false;
    for(let i = 0; i < troncos.length; i++){ const t = troncos[i]; if(Math.abs(t[0] - x) < 7.2 && Math.abs(t[1] - z) < 7.2 && Math.hypot(t[0] - x, t[1] - z) < 7.2) return false; }
    if(M.kml && M.kml.proibido(x, z)) return false;
    if(M.vegetacao){ if(M.vegetacao.turfeira.distTurfeira(x, z) < 8 * U / 2.94 * 2.2) return false; if(M.vegetacao.arvores.perto(x, z, 7)) return false; }
    return true;
  }
  /* na trilha (|lat| pequeno) vale sempre; fora dela, só campo aberto */
  function latSeguro(path, amostra, s, lat){ const lm = M.vegetacao ? Math.min(TL, M.vegetacao.passarelas.latMax(path.nome, s) + .9) : TL; if(Math.abs(lat) <= lm) return true; if(lm < TL) return false; const q = amostra(path, s); return seguroXZ(q.x - q.tz * lat, q.z + q.tx * lat); }

  /* obstáculos em (s, lat) com folga (m) — `tipos`: pessoas, serpentes, animais */
  function obstaculos(path, amostra, hintI, ref, tipos, raio = 90 * U){
    const L = [];
    if(tipos.pessoas && M.gente) M.gente.POOL.forEach(P => { if(!P.ativo || P.oculto || P.staff) return; if(Math.abs(P.x - ref.x) > raio || Math.abs(P.z - ref.z) > raio) return; let s, lat; if(P.g && P.g.path === path){ s = P.s; lat = P.lat; } else { const q = proj(path, P.x, P.z, hintI, true); if(q.d > 22 * U) return; s = q.s; lat = q.lat; } L.push({ s, lat, folga: tipos.folgaPessoas * U, tipo: "pessoa" }); });
    if(tipos.serpentes && M.fauna.serp) M.fauna.serp.lista.forEach(sp => { if(sp.fim || sp.capturada) return; const q = proj(path, sp.x, sp.z, hintI, true); if(q.d > 40 * U) return; L.push({ s: q.s, lat: q.lat, folga: tipos.folgaSerpente * U, tipo: "serpente", ref: sp }); });
    if(tipos.animais) M.fauna.animais.forEach(a => { if(a.fim || !a.visivel) return; const q = proj(path, a.x, a.z, hintI, true); if(q.d > 60 * U) return; L.push({ s: q.s, lat: q.lat, folga: (tipos.folgaAnimal || 15) * U, tipo: "animal", ref: a }); });
    return L;
  }
  /* escolhe o deslocamento lateral: devolve { lat, ok, livre, motivo } */
  function planeja(path, amostra, s, dir, latAtual, obst, o = {}){
    const adiante = (o.adiante || 32) * U, atras = (o.atras || 9) * U, passo = 4 * U, a0 = s - dir * atras, a1 = s + dir * adiante;
    const perto = obst.filter(b => (dir > 0 ? b.s > a0 - b.folga && b.s < a1 + b.folga : b.s < a0 + b.folga && b.s > a1 - b.folga));
    if(!perto.length) return { lat: 0, ok: true, livre: true };
    const C = (o.cands || CANDIDATOS_M).map(m => m * U).sort((p, q) => (Math.abs(p - latAtual) + Math.abs(p) * .25) - (Math.abs(q - latAtual) + Math.abs(q) * .25));
    for(const c of C){ let ok = true;
      for(let k = 0; k * passo <= adiante + atras && ok; k++){ const sc = a0 + dir * k * passo; if(sc < 0 || sc > path.len) continue;
        if(!latSeguro(path, amostra, sc, c)) { ok = false; break; }
        for(const b of perto){ if(Math.hypot(b.s - sc, b.lat - c) < b.folga){ ok = false; break; } } }
      if(ok) return { lat: c, ok: true, livre: false, desvio: Math.abs(c) > TL };
    }
    return { lat: latAtual, ok: false, livre: false, motivo: perto[0].tipo };
  }
  return { proj, seguroXZ, latSeguro, obstaculos, planeja, declive, TL };
}
