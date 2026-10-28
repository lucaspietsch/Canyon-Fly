import { U } from "../config.js";

/* ============================================================================================================
   BASE DA VEGETAÇÃO: onde pode crescer o quê.
   • Áreas vindas do KML (mata, mata mediana/baixa, turfeira/banhado) ou, sem KML, as matas e turfeiras provisórias.
   • Máscaras comuns: platô (dentro do polígono de terra), fora do cercado/estacionamento, longe da trilha, longe da água, altura do chão (cen.relevo).
   Tudo em unidades do mundo (u). 1 m = 2,94 u.
   ============================================================================================================ */

export const dentroPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const zi = P[i][1], zj = P[j][1]; if((zi > z) !== (zj > z) && x < (P[j][0] - P[i][0]) * (z - zi) / (zj - zi) + P[i][0]) c = !c; } return c; };
export const distPoli = (P, x, z) => { let d = 1e18; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const ax = P[j][0], az = P[j][1], vx = P[i][0] - ax, vz = P[i][1] - az, l2 = vx * vx + vz * vz || 1; let t = ((x - ax) * vx + (z - az) * vz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - (ax + vx * t), dz = z - (az + vz * t), q = dx * dx + dz * dz; if(q < d) d = q; } return Math.sqrt(d); };

export function criarBase(M){
  const { cen } = M, Z = M.fauna.zonas, TL = cen.trilhas;
  const terraPoli = cen.campo.terraPoli, emPoli = cen.campo.emPoli;
  /* segmentos de trilha em grade (células de 96 u) para distância rápida */
  const CEL = 96, grade = new Map(); const segs = [];
  [TL.TM, TL.TB, TL.TREC].forEach(L => { for(let i = 0; i < L.length - 1; i++) segs.push([L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]]); });
  const adiciona = (s) => { const x0 = Math.min(s[0], s[2]) - 40, x1 = Math.max(s[0], s[2]) + 40, z0 = Math.min(s[1], s[3]) - 40, z1 = Math.max(s[1], s[3]) + 40; for(let cx = Math.floor(x0 / CEL); cx <= Math.floor(x1 / CEL); cx++) for(let cz = Math.floor(z0 / CEL); cz <= Math.floor(z1 / CEL); cz++){ const k = cx + "," + cz; (grade.get(k) || grade.set(k, []).get(k)).push(s); } };
  segs.forEach(adiciona);
  const extras = [];                                                                // trilhas extras (estrada, passarelas): [x0,z0,x1,z1]
  const addSeg = (s) => { extras.push(s); adiciona(s); };
  function distTrilha(x, z){
    const L = grade.get(Math.floor(x / CEL) + "," + Math.floor(z / CEL)); if(!L) return M.estrada ? M.estrada.dist(x, z) : 1e9; let d = 1e18;
    for(let i = 0; i < L.length; i++){ const s = L[i], vx = s[2] - s[0], vz = s[3] - s[1], l2 = vx * vx + vz * vz || 1; let t = ((x - s[0]) * vx + (z - s[1]) * vz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - (s[0] + vx * t), dz = z - (s[1] + vz * t), q = dx * dx + dz * dz; if(q < d) d = q; }
    d = Math.sqrt(d); if(M.estrada){ const de = M.estrada.dist(x, z); if(de < d) d = de; } return d;
  }
  /* áreas */
  const A = { mata: [], mataBaixa: [], turfeira: [], todas: [] }, antigoCfg = { lista: null };                       // antigoCfg.lista: polígonos do "passado" (vilas, Olaria, Cambará S/A) com mata densa
  const caixa = (P) => { let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); return [x0, x1, z0, z1]; };
  function carrega(){
    A.mata = []; A.mataBaixa = []; A.turfeira = []; A.todas = [];
    const S = M.kml && M.kml.S;
    if(S && S.poligonos.length){ S.poligonos.forEach(p => { const o = { nome: p.nome, tipo: p.tipo === "banhado" ? "turfeira" : p.tipo, pts: p.pts, bb: caixa(p.pts) }; if(o.tipo === "mata") A.mata.push(o); else if(o.tipo === "mataBaixa") A.mataBaixa.push(o); else if(o.tipo === "turfeira") A.turfeira.push(o); A.todas.push(o); }); }
    if(antigoCfg.lista) antigoCfg.lista.forEach(pts => { const o = { nome: "mata antiga", tipo: "mata", pts, bb: caixa(pts), denso: true }; A.mata.push(o); A.todas.push(o); });
    (M.cenaEstrada ? M.cenaEstrada.capoes() : []).forEach(o => A.mata.push(o));                                         // capões gerados ao longo da estrada
    A.vindoDoKML = A.mata.length + A.mataBaixa.length + A.turfeira.length > 0;
  }
  const noPoli = (L, x, z) => { for(let i = 0; i < L.length; i++){ const o = L[i], b = o.bb; if(x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue; if(dentroPoli(o.pts, x, z)) return o; } return null; };
  /* tipo do ponto: "turfeira" | "mata" | "mataBaixa" | "campo" */
  function tipoEm(x, z){ if(noPoli(A.turfeira, x, z)) return "turfeira"; if(noPoli(A.mata, x, z)) return "mata"; if(noPoli(A.mataBaixa, x, z)) return "mataBaixa"; return "campo"; }
  const fatorMata = (x, z) => { const t = tipoEm(x, z); return t === "mata" ? 1 : t === "mataBaixa" ? .55 : 0; };
  /* construído (cercado, estacionamento, casinha), água corrente e fora do platô: sem vegetação */
  const E0 = cen.estac;
  const livreBase = (x, z, folgaCerca = 3) => { if(!emPoli(terraPoli, x, z) && !(M.estrada && M.estrada.dist(x, z) < M.estrada.CW)) return false; if(Z.emCerca(x, z, folgaCerca)) return false; if(E0.poli && dentroPoli(E0.poli, x, z)) return false; return true; };
  const naAgua = (x, z) => { const ag = cen.agua(x, z); return ag && ag.dentro; };
  const alturaNo = (x, z) => cen.relevo(x, z) + (cen.extraChao && cen.extraChao.cushion ? cen.extraChao.cushion(x, z) : 0);
  /* estimativa do "raio interno" de um polígono (para escalonar grande → pequeno do centro para a borda) */
  function raioInterno(o){ if(o.rin) return o.rin; let m = 0; const [x0, x1, z0, z1] = o.bb; for(let k = 0; k < 600; k++){ const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0); if(dentroPoli(o.pts, x, z)) m = Math.max(m, distPoli(o.pts, x, z)); } return (o.rin = Math.max(60, m * .85)); }
  const excluir = [];                                                              // funções (x,z)→bool registradas por outros sistemas (poças, passarelas...)
  carrega();
  return { excluir, A, antigoCfg, carrega, tipoEm, fatorMata, distTrilha, addSeg, livreBase, naAgua, alturaNo, noPoli, raioInterno, U };
}
