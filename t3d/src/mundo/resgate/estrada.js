import { Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from "three";
import { canvasTex } from "../../lib.js";
import { U, ESTRADA as C, DEM as CD } from "../config.js";
import { distPoli, dentroPoli } from "../veg/base.js";

/* ============================================================================================================
   ESTRADA PARA CAMBARÁ DO SUL (KML "estrada"): do estacionamento rumo OESTE (sentido oposto ao do mirante/lançamento), de terra/cascalho, para dois veículos.
   • Rota: 1º ponto do KML = saída do estacionamento. Os primeiros C.realM (200 m) ficam na escala real; dali em diante as distâncias ao longo do caminho são multiplicadas por
     `fator` (0,5 = metade do comprimento; 1 = real) mantendo a forma das curvas; curvas apertadas demais para veículo (raio < C.raioMinM) são suavizadas.
   • Chão: ondulação suave e valetas laterais FORA do platô (onde o jogo não tinha terreno); dentro do platô o terreno existente é mantido. Perto da turfeira a pista sobe num aterro
     (talude) — o piso do aterro é "superfície caminhável" (cen.extraChao.superficies), então jogador e veículos andam em cima dele.
   • API: pts / len / amostra(s) (usadas pela ambulância, pelos carros e pelo bombeiro) · proximo(x,z) · ocupa(x,z) · rel(x,z) · limite(x,z) · setFator(f) · aoMudar(f).
   Tudo em unidades do mundo (u). 1 m = 2,94 u.
   ============================================================================================================ */

const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* ---------- geometria da rota ---------- */
function acumula(L){ const cum = [0]; for(let i = 1; i < L.length; i++) cum.push(cum[i - 1] + Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1])); return cum; }
function reamostra(L, passo){
  const cum = acumula(L), len = cum[cum.length - 1], n = Math.max(2, Math.round(len / passo)), out = []; let i = 0;
  for(let k = 0; k <= n; k++){ const s = len * k / n; while(i < L.length - 2 && cum[i + 1] < s) i++; const l = cum[i + 1] - cum[i] || 1; out.push(lerp2(L[i], L[i + 1], Math.max(0, Math.min(1, (s - cum[i]) / l)))); }
  return out;
}
function chaikin(L, vezes){ for(let v = 0; v < vezes; v++){ const o = [L[0]]; for(let i = 0; i < L.length - 1; i++){ o.push(lerp2(L[i], L[i + 1], .25), lerp2(L[i], L[i + 1], .75)); } o.push(L[L.length - 1]); L = o; } return L; }
const raio3 = (a, b, c) => { const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), cr = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])); return cr < 1e-6 ? 1e9 : ab * bc * ca / (2 * cr); };
/* curvas fechadas demais para um veículo: relaxa os pontos com raio < rMin em direção à média dos vizinhos */
function relaxa(P, rMin, iter = 140){
  for(let it = 0; it < iter; it++){ let tocou = false; for(let i = 2; i < P.length - 2; i++){ if(raio3(P[i - 2], P[i], P[i + 2]) < rMin){ const qx = (P[i - 2][0] + P[i - 1][0] + P[i + 1][0] + P[i + 2][0]) / 4, qz = (P[i - 2][1] + P[i - 1][1] + P[i + 1][1] + P[i + 2][1]) / 4; P[i] = [P[i][0] + (qx - P[i][0]) * .5, P[i][1] + (qz - P[i][1]) * .5]; tocou = true; } } if(!tocou) break; }
  return P;
}
/** comprime a rota: os primeiros `real` u e as `janelas` (intervalos [s0,s1] de comprimento REAL, em u) ficam como estão; o resto de cada trecho é multiplicado por f (a forma das curvas se mantém).
    Devolve { pts, mapR, mapC }: os pontos comprimidos e, para cada um, o comprimento acumulado real (mapR) e comprimido (mapC) — o mapa entre os dois comprimentos. */
export function comprimeJanelas(L, f, real, janelas = []){
  const cortes = [real, ...janelas.flat()].sort((a, b) => a - b), real1 = (s) => s < real || janelas.some(w => s >= w[0] && s <= w[1]);
  const pts = [L[0].slice()], mapR = [0], mapC = [0]; let sR = 0, sC = 0, ult = L[0].slice();
  for(let i = 1; i < L.length; i++){ const dx = L[i][0] - L[i - 1][0], dz = L[i][1] - L[i - 1][1], l = Math.hypot(dx, dz); if(l < 1e-6) continue;
    const marcos = cortes.filter(c => c > sR + 1e-6 && c < sR + l - 1e-6).map(c => c - sR); let a = 0;
    for(const b of [...marcos, l]){ const k = real1(sR + (a + b) / 2) ? 1 : f; ult = [ult[0] + dx / l * (b - a) * k, ult[1] + dz / l * (b - a) * k]; pts.push(ult); mapR.push(sR + b); sC += (b - a) * k; mapC.push(sC); a = b; }
    sR += l; }
  return { pts, mapR, mapC };
}
/** compatibilidade: só os primeiros `real` u em escala real */
export const comprimeRota = (L, f, real) => comprimeJanelas(L, f, real, []).pts;

export function criarEstrada(M){
  const { cen } = M, E = cen.estac, { terraPoli, emPoli } = cen.campo;
  const S = { fator: C.compressao, pts: [], cum: [0], len: 0, kml: null, nome: C.nome, sFora: 0, lift: [], turf: [] }, ouvintes = [];
  const W = C.largura * U / 2, BED = W + C.acostamentoM * U, CW = C.corredorU, BORDA = C.bordaU, TALUDE = 10;
  let malha = null, grade = new Map(); const CEL = 160;
  const ponto0 = () => E.PKW(-112, -26);                                                         // saída do pátio (lado oeste)

  /* ---------- rota provisória (enquanto não há KML) ---------- */
  function provisoria(){
    const ini = ponto0(), dir0 = Math.atan2(E.PKW(-160, -26)[1] - ini[1], E.PKW(-160, -26)[0] - ini[0]) + C.rumoGraus * Math.PI / 180, L = []; let [x, z] = ini, a = dir0;
    L.push([x, z]); const passos = Math.round(C.comprimentoM * U / 70);
    for(let i = 0; i < passos; i++){ a += Math.sin(i * .37) * .1 + Math.sin(i * .11 + 1) * .03; x += Math.cos(a) * 70; z += Math.sin(a) * 70; L.push([x, z]); }
    return L;
  }
  /* ---------- monta a rota final a partir da linha bruta ---------- */
  function monta(bruta){
    let L = bruta.map(p => [p[0], p[1]]); const e0 = ponto0(); if(Math.hypot(L[0][0] - e0[0], L[0][1] - e0[1]) > 3 * U) L.unshift(e0);
    const cumR = acumula(L); S.L = L; S.cumR = cumR; S.realLen = cumR[cumR.length - 1]; S.sProvisorio = -1;
    S.off = L.length > bruta.length ? cumR[1] : 0; const real = C.realM * U, jan = (S.janelas || []).map(w => [w[0] + S.off, w[1] + S.off]);   // (se o ponto de saída foi acrescentado, as janelas — medidas na rota do KML — andam junto)
    const cj = comprimeJanelas(L, S.fator, real, jan), comp = cj.pts, cum = acumula(comp); S.mapR = cj.mapR; S.mapC = cj.mapC; S.cC = cj.mapC[cj.mapC.length - 1]; let ic = 0; while(ic < comp.length - 1 && cum[ic] < real - 1) ic++;
    const head = chaikin(comp.slice(0, ic + 1), 1), tail = chaikin(comp.slice(ic), 2);
    let tl = relaxa(reamostra(tail, C.passoM * U), C.raioMinM * U); tl = relaxa(reamostra(tl, C.passoM * U), C.raioMinM * U);
    const hd = relaxa(reamostra(head, C.passoM * U), C.raioMinM * U * .8, 200); S.pts = [...hd.slice(0, -1), ...tl]; S.cum = acumula(S.pts); S.len = S.cum[S.cum.length - 1];
    S.escC = S.len / (S.cC || 1); S.sFora = S.len; for(let i = 0; i < S.pts.length; i++) if(!emPoli(terraPoli, S.pts[i][0], S.pts[i][1])){ S.sFora = S.cum[i]; break; }
    /* aterro: onde a pista passa perto de uma turfeira/banhado do KML */
    const turfs = ((M.kml && M.kml.S.poligonos) || []).filter(p => p.tipo === "banhado"), lift = [], A = C.aterro.alturaU || C.aterro.alturaM * U;
    S.turf = S.pts.map(p => { let d = 1e9; for(const o of turfs){ const bb = o.bb || (o.bb = bbox(o.pts)); if(p[0] < bb[0] - 400 || p[0] > bb[1] + 400 || p[1] < bb[2] - 400 || p[1] > bb[3] + 400) continue; d = Math.min(d, dentroPoli(o.pts, p[0], p[1]) ? 0 : distPoli(o.pts, p[0], p[1])); } return d; });
    for(let i = 0; i < S.pts.length; i++) lift.push(A * (1 - sst(C.aterro.distTurfU * .35, C.aterro.distTurfU, S.turf[i])));
    for(let k = 0; k < 5; k++) for(let i = 1; i < lift.length - 1; i++) lift[i] = (lift[i - 1] + lift[i] * 2 + lift[i + 1]) / 4;                // sobe e desce devagar
    S.lift = lift; S.temAterro = lift.some(v => v > .2);
    calcPerfil(); indexa();
  }
  /* ---------- elevação real ao longo da rota (comprimida junto) ---------- */
  const fator = () => S.fator;
  /* s comprimido → s real (mapa por partes entre o comprimento comprimido e o real; o perfil de subidas/descidas é preservado, só mais curto nos trechos rurais) */
  const sReal = (sc) => { const C2 = S.mapC, R2 = S.mapR; if(!C2 || C2.length < 2) return sc; const x = Math.max(0, Math.min(S.cC, sc / (S.escC || 1))); let lo = 0, hi = C2.length - 1; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(C2[m] <= x) lo = m; else hi = m; } const d = C2[hi] - C2[lo] || 1; return R2[lo] + (R2[hi] - R2[lo]) * (x - C2[lo]) / d; };
  /** inverso: s real (comprimento ao longo da rota do KML) → s comprimido */
  const sComp = (sr) => { const C2 = S.mapC, R2 = S.mapR; if(!R2 || R2.length < 2) return sr; const x = Math.max(0, Math.min(R2[R2.length - 1], sr)); let lo = 0, hi = R2.length - 1; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(R2[m] <= x) lo = m; else hi = m; } const d = R2[hi] - R2[lo] || 1; return (C2[lo] + (C2[hi] - C2[lo]) * (x - R2[lo]) / d) * (S.escC || 1); };
  function realPos(sc){
    const L = S.L, cum = S.cumR; let s = Math.max(0, Math.min(S.realLen, sReal(sc))), i = 0; while(i < L.length - 2 && cum[i + 1] < s) i++;
    const l = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / l; return { x: L[i][0] + (L[i + 1][0] - L[i][0]) * t, z: L[i][1] + (L[i + 1][1] - L[i][1]) * t, tx: (L[i + 1][0] - L[i][0]) / l, tz: (L[i + 1][1] - L[i][1]) / l };
  }
  const dem = () => (M.dem && M.dem.pronto ? M.dem : null);
  const escV = () => U * CD.escalaVertical;
  function calcPerfil(){
    S.hc = null; const D = dem(); if(!D || !S.pts.length) return;
    const n = S.pts.length, raw = S.pts.map((p, i) => { const r = realPos(S.cum[i]); return D.altReal(r.x, r.z); });
    let iF = 0; while(iF < n - 1 && pesoDem(S.pts[iF][0], S.pts[iF][1]) < .5) iF++; S.altRef = raw[iF];                  // referência: onde o relevo real passa a valer pela metade
    const h = raw.map(v => (v - S.altRef) * escV());
    for(let k = 0; k < 3; k++) for(let i = 1; i < n - 1; i++) h[i] = (h[i - 1] + h[i] + h[i + 1]) / 3;      // alisa o ruído do DEM
    const g = CD.inclinacaoMaxPct / 100, passo = C.passoM * U * g;                                                // inclinação máxima da pista: cortes e aterros leves
    for(let i = 1; i < n; i++) h[i] = Math.max(h[i - 1] - passo, Math.min(h[i - 1] + passo, h[i]));
    for(let i = n - 2; i >= 0; i--) h[i] = Math.max(h[i + 1] - passo, Math.min(h[i + 1] + passo, h[i]));
    const e = h.map((v, i) => v * pesoDem(S.pts[i][0], S.pts[i][1]));                                              // altura efetiva do eixo (já com o peso do platô)
    for(let i = 1; i < n; i++) e[i] = Math.max(e[i - 1] - passo, Math.min(e[i - 1] + passo, e[i]));
    /* trechos urbanos (cidade, complexo da Vila Oswaldo Kroeff…): a pista se funde ao terreno urbano (o DEM lá é lido em escala real, na estrada ele é lido comprimido) */
    if(M.cidade && M.zonas && M.zonas.urbano.length){ let tocou = false; for(let i = 0; i < n; i++){ const wr = M.cidade.peso(S.pts[i][0], S.pts[i][1]); if(wr > 0){ e[i] = e[i] * (1 - wr) + M.cidade.elevBruta(S.pts[i][0], S.pts[i][1]) * wr; tocou = true; } }
      if(tocou) for(let i = 1; i < n; i++) e[i] = Math.max(e[i - 1] - passo * 1.6, Math.min(e[i - 1] + passo * 1.6, e[i])); }
    for(let i = n - 2; i >= 0; i--) e[i] = Math.max(e[i + 1] - passo, Math.min(e[i + 1] + passo, e[i]));
    S.hc = h; S.hcEf = e; S.dh = e.map((v, i) => v - (raw[i] - S.altRef) * escV());                       // quanto o eixo da pista difere do DEM cru (cortes e aterros)
  }
  const hcEm = (q) => S.hcEf[q.i] + (S.hcEf[q.i + 1] - S.hcEf[q.i]) * q.t;
  const fino = (x, z) => ((vn(x / 55, z / 55, 11) - .5) + (vn(x / 17, z / 17, 13) - .5) * .5) * CD.ruidoFinoM * U;
  const bbox = (P) => { let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); return [x0, x1, z0, z1]; };
  /* grade espacial: cada segmento entra nas células a até CW+BORDA de distância */
  function indexa(){
    grade = new Map(); const R = CW + BORDA;
    for(let i = 0; i < S.pts.length - 1; i++){ const a = S.pts[i], b = S.pts[i + 1], x0 = Math.min(a[0], b[0]) - R, x1 = Math.max(a[0], b[0]) + R, z0 = Math.min(a[1], b[1]) - R, z1 = Math.max(a[1], b[1]) + R;
      for(let cx = Math.floor(x0 / CEL); cx <= Math.floor(x1 / CEL); cx++) for(let cz = Math.floor(z0 / CEL); cz <= Math.floor(z1 / CEL); cz++){ const k = cx * 100003 + cz; let l = grade.get(k); if(!l) grade.set(k, l = []); l.push(i); } }
    ult = null; platoCache = new Map(); distGrid = new Map();
  }
  /* ponto mais próximo da rota (null se estiver além do corredor) */
  let ult = null;
  function proximo(x, z){
    if(ult && ult.x === x && ult.z === z) return ult.q; const L = grade.get(Math.floor(x / CEL) * 100003 + Math.floor(z / CEL)); let q = null;
    if(L){ let d2 = 1e18; for(let n = 0; n < L.length; n++){ const i = L[n], a = S.pts[i], b = S.pts[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1; let t = ((x - a[0]) * vx + (z - a[1]) * vz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const px = a[0] + vx * t, pz = a[1] + vz * t, dd = (x - px) * (x - px) + (z - pz) * (z - pz);
        if(dd < d2){ d2 = dd; const l = Math.sqrt(l2); q = { i, t, x: px, z: pz, s: S.cum[i] + t * l, d: Math.sqrt(dd), lado: (x - px) * -vz / l + (z - pz) * vx / l > 0 ? 1 : -1, tx: vx / l, tz: vz / l }; } } }
    ult = { x, z, q }; return q;
  }
  /* peso do relevo real: 0 dentro do platô desenhado à mão (terreno plano existente), subindo suave até 1 a rampaU além da borda do polígono — contínuo no espaço, sem degraus */
  let distGrid = new Map(); const GC = 100;
  const noD = (i, j) => { const k = i * 100003 + j; let v = distGrid.get(k); if(v === undefined){ const x = i * GC, z = j * GC; v = emPoli(terraPoli, x, z) ? 0 : distPoli(terraPoli, x, z); distGrid.set(k, v); } return v; };
  function pesoDem(x, z){
    const fx = x / GC, fz = z / GC, i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j;
    const d = (noD(i, j) * (1 - a) + noD(i + 1, j) * a) * (1 - b) + (noD(i, j + 1) * (1 - a) + noD(i + 1, j + 1) * a) * b; return sst(0, CD.rampaU, d);
  }
  let platoCache = new Map();
  const plato = (x, z) => { const cx = Math.floor(x / 40), cz = Math.floor(z / 40), k = cx * 100003 + cz; let v = platoCache.get(k); if(v === undefined){ v = emPoli(terraPoli, (cx + .5) * 40, (cz + .5) * 40) ? 1 : 0; platoCache.set(k, v); } return v; };

  /* ---------- relevo do corredor (fora do platô): ondulação suave, valetas laterais e descida suave nas bordas ---------- */
  const onda = (x, z) => ((vn(x / 1100, z / 1100, 3) - .5) * 2 + (vn(x / 330, z / 330, 5) - .5) * .7) * C.ondulacaoM * U;
  function rel(x, z){
    const q = proximo(x, z); if(!q) return 0; let w = pesoDem(x, z); if(w <= 0) return 0;                                              // dentro do platô desenhado à mão: o terreno existente manda
    const fe = sst(CW, CW + BORDA, q.d); let v;
    if(S.hc){ const rp = realPos(q.s), lat = q.lado * q.d, D = dem(), hp = (D.altReal(rp.x - rp.tz * lat, rp.z + rp.tx * lat) - S.altRef) * escV(), wb = sst(BED, BED + CD.suavizaPistaU, q.d); v = (hcEm(q) * (1 - wb) + (hp + fino(x, z) * sst(BED + 20, BED + 90, q.d)) * w * wb) * (1 - fe) - C.quedaU * fe; w = 1; }
    else v = onda(x, z) * (1 - fe) - C.quedaU * fe;
    const dv = q.d - (BED + .2 * U), vl = C.valetaLarguraM * U; if(dv > 0 && dv < vl) v -= C.valetaProfM * U * Math.sin(Math.PI * dv / vl) * (1 - fe);
    return v * w;
  }
  /* ---------- perfil da pista (altura sobre o chão, pela distância lateral ao eixo) ---------- */
  const liftEm = (q) => S.lift[q.i] + (S.lift[q.i + 1] - S.lift[q.i]) * q.t;
  function perfil(lat, lift){
    const a = Math.abs(lat); if(a <= BED) return lift + .05 + .1 * (1 - a / BED) + (a > W ? -.04 : 0);
    if(a >= BED + TALUDE) return 0; return (lift + .01) * (1 - sst(0, 1, (a - BED) / TALUDE));
  }
  /* superfície caminhável do aterro: devolve a altura do piso/talude, senão null (o chão comum serve) */
  function superficie(x, z, y){
    if(!S.temAterro) return null; const q = proximo(x, z); if(!q || q.d > BED + TALUDE) return null; const lift = liftEm(q); if(lift < .35) return null;
    return cen.relevo(x, z) + perfil(q.d, lift);
  }
  /* quem NÃO pode crescer ali (capim, árvores, poças): pista + acostamento + talude */
  const ocupa = (x, z, extra = 0) => { const q = proximo(x, z); return !!q && q.d < BED + 4 + extra; };
  const dist = (x, z) => { const q = proximo(x, z); return q ? q.d : 1e9; };
  /* limite do mundo andável: o retângulo original + o corredor da estrada (até 90 % da largura) */
  function limite(x, z){
    const X = Math.max(-1450, Math.min(3350, x)), Z = Math.max(-960, Math.min(3750, z)); if(X === x && Z === z) return [x, z];
    const q = proximo(x, z); if(!q) return [X, Z]; const lim = CW * .9; if(q.d <= lim) return [x, z]; const f = lim / q.d; return [q.x + (x - q.x) * f, q.z + (z - q.z) * f];
  }

  /* ---------- faixa de terra desenhada (pista + acostamento + taludes) ---------- */
  function constroi(){
    if(malha){ malha.parent && malha.parent.remove(malha); malha.geometry.dispose(); }
    const pos = [], uv = [], idx = [], n = Math.max(2, Math.ceil(S.len / C.passoMalhaU)), EST = [-(BED + TALUDE), -(BED + 3), -BED, -W, 0, W, BED, BED + 3, BED + TALUDE], nc = EST.length;
    for(let k = 0; k <= n; k++){ const q = amostra(S.len * k / n), nx = -q.tz, nz = q.tx, ql = proximo(q.x, q.z), lift = ql ? liftEm(ql) : 0;
      for(let c = 0; c < nc; c++){ const lat = EST[c], x = q.x + nx * lat, z = q.z + nz * lat, y0 = cen.relevo(x, z); const a = Math.abs(lat), h = a > BED + .5 ? (a < BED + TALUDE - .5 ? perfil(lat, lift) * (a > BED + 2 ? 1 : 1) + .03 : .02) : perfil(lat, lift);
        pos.push(x, y0 + h, z); uv.push(a > BED ? (lat < 0 ? 0 : 1) : .12 + (lat + BED) / (2 * BED) * .76, S.len * k / n / (8 * U)); }
      if(k) for(let c = 0; c < nc - 1; c++){ const a = (k - 1) * nc + c, b = (k - 1) * nc + c + 1, c2 = k * nc + c, d = k * nc + c + 1; idx.push(a, b, c2, b, d, c2); } }
    const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const tx = canvasTex(128, 64, (c, w, h) => { c.fillStyle = "#6c7a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#a5593b"; c.fillRect(w * .12, 0, w * .76, h);
      for(let i = 0; i < 700; i++){ const t = Math.random(); c.fillStyle = "rgba(" + (120 + t * 60 | 0) + "," + (55 + t * 35 | 0) + "," + (30 + t * 20 | 0) + ",.4)"; c.fillRect(w * .12 + Math.random() * w * .76, Math.random() * h, 2, 2); }
      for(let i = 0; i < 120; i++){ c.fillStyle = "rgba(210,200,185,.55)"; c.fillRect(w * .12 + Math.random() * w * .76, Math.random() * h, 1, 1); }
      c.fillStyle = "rgba(70,32,20,.3)"; c.fillRect(w * .3, 0, 3, h); c.fillRect(w * .66, 0, 3, h); c.fillStyle = "rgba(100,120,50,.45)"; c.fillRect(w * .485, 0, 4, h); }, { repeat: [1, 1] });
    tx.wrapS = tx.wrapT = 1000; tx.repeat.set(1, 1);
    malha = new Mesh(g, new MeshStandardMaterial({ map: tx, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); malha.receiveShadow = true; malha.renderOrder = 2; malha.frustumCulled = false; cen.grupo.add(malha);
  }
  function amostra(s){
    s = Math.max(0, Math.min(S.len, s)); let i = 0; while(i < S.pts.length - 2 && S.cum[i + 1] < s) i++;
    const a = S.pts[i], b = S.pts[i + 1], l = S.cum[i + 1] - S.cum[i] || 1, t = (s - S.cum[i]) / l, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx, tz, i };
  }
  function define(novos, nome, opc = {}){
    S.kml = novos && novos.length ? novos.map(p => [p[0], p[1]]) : null; if(nome) S.nome = nome; S.provReal = -1; S.janelas = opc.janelasReal || []; monta(S.kml || provisoria()); constroi();
    if(!M.zonas){ cen.extraChao.rel = rel; cen.extraChao.limite = limite; } if(!cen.extraChao.superficies.includes(superficie)) cen.extraChao.superficies.push(superficie);
    ouvintes.forEach(f => { try{ f(); }catch(e){ console.warn("estrada:", e); } }); if(nome) E.nomeEstrada = nome;
  }
  /* compressão: 1 = comprimento real · 0,5 = metade (padrão) */
  function setFator(f){ S.fator = f; if(M.zonas && S.kml) M.zonas.carregaKML(); else if(S.kml) define(S.kml); return S.fator; }
  /* o DEM chegou (ou mudou): recalcula o perfil da pista e refaz a malha, os blocos e a vegetação */
  function aplicaDEM(){ calcPerfil(); platoCache = new Map(); ult = null; constroi(); ouvintes.forEach(f => { try{ f(); }catch(e){ console.warn("estrada:", e); } }); }
  define(null);
  /** posição no jogo (comprimida) do ponto da rota do KML a `sr` u do começo (comprimento real) */
  const jogoEm = (sr) => amostra(sComp(sr + (S.off || 0)));
  const reversa = () => ({ len: S.len, amostra: (s) => { const q = amostra(S.len - s); return { x: q.x, z: q.z, tx: -q.tx, tz: -q.tz }; } });
  return { define, amostra, reversa, setFator, aplicaDEM, pesoDem, realPos, sReal, sComp, jogoEm, hcEm, proximo, ocupa, dist, rel, onda, limite, perfil, liftEm, plato, aoMudar: (f) => ouvintes.push(f), S, W, BED, CW, BORDA, TALUDE,
    get fator(){ return S.fator; }, get pts(){ return S.pts; }, get cum(){ return S.cum; }, get len(){ return S.len; }, get malha(){ return malha; }, get realLen(){ return S.realLen; }, provisoria };
}
