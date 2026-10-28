import { U, KML, ESTRADA as C, CIDADE, ZONAS } from "./config.js";
import { distPoli } from "./veg/base.js";

/* ============================================================================================================
   ZONAS DO MUNDO GRANDE: parque (cânion, trilha, estacionamento) · estrada e campos · cidade (e vilas).
   • Posiciona a zona urbana a partir do ponto final da estrada comprimida: o polígono da cidade é deslocado (sem girar nem escalar) de modo que a borda mais próxima do fim
     real da estrada fique no fim da estrada COMPRIMIDA; o trecho entre o fim do KML e a cidade é uma estrada provisória reta, comprimida igual ao resto.
   • `zonaDe(x, z)`, `atual` (zona do jogador), ganchos de terreno (cen.extraChao.rel / limite) combinando estrada + cidade, e conversão de itens do KML para o mundo.
   • Cada sistema que simula coisas marca `zona: "parque"` no registro e só roda quando o jogador está nela (ver index.js).
   ============================================================================================================ */

const URBANOS = new Set(["cidade", "vila", "rua", "praca", "sequoia", "urna", "fabrica", "olaria", "industrial"]);           // tudo que fica na região urbana/industrial anda junto com a cidade (deslocamento T)
const ZONAS_URB = new Set(["cidade", "vila", "olaria", "industrial"]);                                                  // polígonos que viram zona caminhável (terreno + limite)
const dentroPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const caixa = (P) => { let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); return [x0, x1, z0, z1]; };
const centro = (P) => { let x = 0, z = 0; P.forEach(p => { x += p[0]; z += p[1]; }); return [x / P.length, z / P.length]; };

/** nome bonito para mostrar: "AREA A ANTIGA FLORESTA DA OLARIA" → "Antiga Floresta da Olaria" */
export const rotuloDe = (n) => (n || "").toLowerCase().replace(/^(a|á)+rea( de| a)?\s+/i, "").replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|A|E|S\/a)\b/g, (m) => m === "S/a" ? "S/A" : m.toLowerCase()).replace(/^./, c => c.toUpperCase());

export function criarZonas(M){
  const S = { T: [0, 0], urbano: [], platos: [], atual: "parque", nome: ZONAS.parque.nome, provisorio: null, t: 0 }, ouvintes = [];

  /* ---------- a partir do KML ---------- */
  function carregaKML(){
    const K = M.kml, cad = K.cadeiaEstrada(), R = cad ? cad.pts : null;
    S.T = [0, 0]; S.urbano = []; S.provisorio = null; S.blocos = []; S.cadeia = cad;
    const dePoli = (tipos) => K.S.poligonos.filter(e => tipos.includes(e.tipo)), blocoCid = dePoli(["cidade"]), blocoCx = dePoli(["vila", "olaria", "industrial", "fabrica"]);
    /* a estrada é uma cadeia só (parque → cidade → complexo da Vila Oswaldo Kroeff até o fim da Vila Ouro Verde): fora das áreas urbanas ela é comprimida; perto de cada bloco urbano
       (cidade, complexo) fica em escala REAL (janelas). Cada bloco é então deslocado, sem girar nem escalar, para encostar na estrada comprimida no ponto mais próximo dele. */
    let janelas = [], ancoras = [], cumR = null, amostraR = null;
    if(R){
      cumR = [0]; for(let i = 1; i < R.length; i++) cumR.push(cumR[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
      amostraR = (sr) => { sr = Math.max(0, Math.min(cumR[cumR.length - 1], sr)); let i = 0; while(i < R.length - 2 && cumR[i + 1] < sr) i++; const l = cumR[i + 1] - cumR[i] || 1, t = (sr - cumR[i]) / l; return [R[i][0] + (R[i + 1][0] - R[i][0]) * t, R[i][1] + (R[i + 1][1] - R[i][1]) * t]; };
      const analisa = (id, polis, margemR) => { if(!polis.length) return; const tot = cumR[cumR.length - 1], passo = 120; let melhor = 1e18, sM = 0, run = null; const runs = [];
        for(let sr = 0; sr <= tot; sr += passo){ const p = amostraR(sr); let d = 1e18; polis.forEach(e => { const dd = dentroPoli(e.pts, p[0], p[1]) ? 0 : distPoli(e.pts, p[0], p[1]); if(dd < d) d = dd; });
          if(d < melhor){ melhor = d; sM = sr; } if(d < margemR){ if(!run) run = [sr, sr]; else run[1] = sr; } else if(run){ runs.push(run); run = null; } }
        if(run) runs.push(run); runs.forEach(r => janelas.push([Math.max(0, r[0] - passo), Math.min(tot, r[1] + passo)])); ancoras.push({ id, s: sM, dist: melhor, polis }); };
      analisa("cidade", blocoCid, 1500); analisa("complexo", blocoCx, 2600);
    }
    M.estrada.define(R, "KML", { janelasReal: janelas });
    const Tde = {};
    if(R) ancoras.forEach(a => { const r = amostraR(a.s), g = M.estrada.jogoEm(a.s); Tde[a.id] = [g.x - r[0], g.z - r[1]]; S.blocos.push({ id: a.id, T: Tde[a.id], sAncora: a.s, dist: a.dist }); });
    S.T = Tde.cidade || Tde.complexo || [0, 0];
    const blocoDe = (e) => (["cidade", "praca", "sequoia", "urna"].includes(e.tipo) ? "cidade" : "complexo");
    /* itens urbanos ganham coordenadas do mundo (deslocadas); os demais ficam como vieram */
    const todos = [...K.S.poligonos, ...K.S.linhas, ...K.S.pontos];
    todos.forEach(e => { const T = URBANOS.has(e.tipo) ? Tde[blocoDe(e)] : null; if(T){ e.T = T; if(e.pts) e.mundoPts = e.pts.map(p => [p[0] + T[0], p[1] + T[1]]); if(e.pt) e.mundoPt = [e.pt[0] + T[0], e.pt[1] + T[1]]; } else { e.mundoPts = e.pts; e.mundoPt = e.pt; } });
    K.S.poligonos.filter(e => ZONAS_URB.has(e.tipo)).forEach(e => {
      const P = e.mundoPts, bb = caixa(P), c = centro(P), pr = K.S.pontos.concat(K.S.poligonos).find(q => q.tipo === "praca" && (q.mundoPt ? dentroPoli(P, q.mundoPt[0], q.mundoPt[1]) : q.mundoPts && dentroPoli(P, ...centro(q.mundoPts))));
      S.urbano.push({ T: e.T || S.T, pracaPoli: pr && pr.mundoPts ? pr.mundoPts : null, nome: e.nome, rotulo: rotuloDe(e.nome), tipo: e.tipo, poli: P, bb, centro: c, praca: pr ? (pr.mundoPt || centro(pr.mundoPts)) : c, item: e, praçaDoKML: !!pr });
    });
    /* platôs: terreno plano sob a praça e a fábrica (o relevo da cidade se funde a eles) */
    S.platos = []; const circ = (P) => { const c = centro(P); return { c, R: Math.max(...P.map(p => Math.hypot(p[0] - c[0], p[1] - c[1]))) }; };
    K.S.poligonos.filter(e => e.tipo === "praca" || e.tipo === "fabrica").forEach(e => { const P = e.mundoPts, o = circ(P); S.platos.push({ c: o.c, R: o.R + (e.tipo === "praca" ? 130 : 60), borda: e.tipo === "praca" ? 110 : 180, y: undefined, tipo: e.tipo }); });
    M.estrada.aplicaDEM();                                                                              // refaz perfil e malha da pista com o terreno urbano já conhecido (fusão nos trechos de cidade/complexo)
    S.urbano.sort((a, b) => (a.bb[1] - a.bb[0]) * (a.bb[3] - a.bb[2]) - (b.bb[1] - b.bb[0]) * (b.bb[3] - b.bb[2]));            // o menor polígono que contém o ponto vence (Ouro Verde dentro do parque industrial)
    ouvintes.forEach(f => { try{ f(S); }catch(err){ console.warn("zonas:", err); } });
  }
  const mundoPts = (e) => e.mundoPts || e.pts, mundoPt = (e) => e.mundoPt || e.pt;

  /* ---------- zona e limites ---------- */
  const margem = CIDADE.margemU;
  const urbanoEm = (x, z, m = 0) => { for(const u of S.urbano){ const b = u.bb; if(x < b[0] - m || x > b[1] + m || z < b[2] - m || z > b[3] + m) continue; if(m === 0 ? dentroPoli(u.poli, x, z) : true) return u; } return null; };
  function zonaDe(x, z){
    const u = urbanoEm(x, z, margem * .6); if(u) return u.tipo === "cidade" ? "cidade" : "vila";
    const E = M.estrada; if(E && E.len){ const q = E.proximo(x, z); if(q && q.d < E.CW * .9 && q.s > E.S.sFora - 200) return "estrada"; }
    return "parque";
  }
  function limite(x, z){
    const u = urbanoEm(x, z, margem); if(u){ const b = u.bb; return [Math.max(b[0] - margem * .8, Math.min(b[1] + margem * .8, x)), Math.max(b[2] - margem * .8, Math.min(b[3] + margem * .8, z))]; }
    return M.estrada.limite(x, z);
  }
  const rel = (x, z) => { const wc = M.cidade ? M.cidade.peso(x, z) : 0; return wc <= 0 ? M.estrada.rel(x, z) : M.estrada.rel(x, z) * (1 - wc) + M.cidade.rel(x, z) * wc; };       // cidade e estrada se fundem na borda
  /* ---------- superfícies firmes ---------- */
  const RASO = 2.2;                                                                                        // u (~0,75 m): até o joelho; mais fundo que isso o jogador não entra
  const profAgua = (x, z) => { const a = M.cen.agua(x, z); return a && a.dentro ? Math.max(0, a.y - M.cen.relevo(x, z)) : 0; };
  const fatorAgua = (x, z, y) => { const d = profAgua(x, z); if(d <= .15) return 1; if(y > M.cen.relevo(x, z) + 1.2) return 1; return Math.max(.45, 1 - .45 * Math.min(1, d / RASO)); };
  const bloqueios = [];                                                                                     // áreas fechadas (ex.: Vila Santana trancada): { f(x,z) → bool, motivo }
  const bloqueado = (x, z) => profAgua(x, z) > RASO || bloqueios.some(b => b.f(x, z));
  const motivoBloqueio = (x, z) => { const b = bloqueios.find(q => q.f(x, z)); return b ? b.motivo : null; };
  /** tipo de superfície no ponto: { tipo, firme, nota } */
  function superficie(x, z, y){
    const T = M.vegetacao && M.vegetacao.turfeira; if(T && T.dentro(x, z) && !(y > M.cen.relevo(x, z) + 1)) return { tipo: "turfeira", firme: false, nota: "lenta, pé afunda; NPCs e veículos nunca entram" };
    const d = profAgua(x, z); if(d > RASO) return { tipo: "água funda", firme: false, nota: "barreira: o jogador não entra; veículos nunca" }; if(d > .15) return { tipo: "água rasa", firme: false, nota: "até o joelho, mais lento" };
    const E = M.estrada; if(E && E.ocupa(x, z)) return { tipo: "estrada", firme: true, nota: "" };
    const u = urbanoEm(x, z); if(u) return { tipo: "urbano", firme: true, nota: "" };
    const r = M.cen.relevo(x, z); if(y !== undefined && y > r + 1.5) return { tipo: "piso (construção/passarela)", firme: true, nota: "" };
    return { tipo: "campo/trilha", firme: true, nota: "" };
  }
  /* altitude real no ponto (m): referência do DEM + diferença de altura do jogo (1 m = 2,94 u) */
  function altitudeM(y){ const E = M.estrada, D = M.dem; if(!D || !D.pronto || E.S.altRef === undefined) return null; return E.S.altRef + (y - M.cen.campo.chao) / U / (DEMesc()); }
  const DEMesc = () => 1;
  function infoJogador(){ const J = M.jogador(); if(!J) return ""; const s = superficie(J.x, J.z, J.y), alt = altitudeM(J.y); return "Zona: " + S.nome + " · altitude " + (alt === null ? "— (sem DEM: rode tools/baixar_elevacao.py)" : alt.toFixed(0) + " m") + " · piso: " + s.tipo + (s.firme ? " (firme)" : " (NÃO firme: " + s.nota + ")"); }
  function liga(){ const X = M.cen.extraChao; X.rel = rel; X.limite = limite; X.fatorAgua = fatorAgua; X.bloqueado = bloqueado; X.motivoBloqueio = motivoBloqueio; }
  function tick(dt, J){ S.t += dt; if(!J || S.t < .4) return; S.t = 0; const z = zonaDe(J.x, J.z); if(z !== S.atual){ const ant = S.atual; S.atual = z; const uu = z === "vila" ? urbanoEm(J.x, J.z, margem * .6) : null; S.nome = uu ? uu.rotulo : (ZONAS[z] || ZONAS.parque).nome; ouvintes.forEach(f => { try{ f(S, ant); }catch(e){ console.warn("zonas:", e); } }); M.partes.forEach(p => p.aoZona && p.aoZona(z, ant)); } }
  return { S, bloqueios, superficie, altitudeM, infoJogador, profAgua, carregaKML, mundoPts, mundoPt, zonaDe, urbanoEm, limite, rel, liga, tick, aoMudar: (f) => ouvintes.push(f), get atual(){ return S.atual; }, get urbano(){ return S.urbano; }, get T(){ return S.T; }, Tde: (x, z) => { const u = urbanoEm(x, z, margem); return u ? u.T : S.T; }, get blocos(){ return S.blocos; }, get platos(){ return S.platos || []; }, URBANOS };
}
