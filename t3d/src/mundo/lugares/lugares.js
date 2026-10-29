import { Group } from "three";
import { U, LUGARES as C } from "../config.js";
import { aberto, centroide, caixa, dentroPoli, descarta } from "./util.js";
import { criarPraca, ruasDoEntorno, naPracaOuRua } from "./praca.js";
import { criarFabrica } from "./fabrica.js";
import { criarVila } from "./vila.js";
import { criarSantana } from "./santana.js";

/* ============================================================================================================
   LUGARES DO MUNDO LIDOS DO KML: praça central (+ Sequoia Lunar + Urna do Tempo), fábrica Cambará S/A e Vila Ouro Verde.
   Cada lugar só é construído quando o jogador chega perto (cargaU) e é descartado ao se afastar; a posição de cada um vem do polígono do KML (já com o deslocamento da zona urbana).
   Depuração (F3 aberto): Numpad1 Sequoia · 2 Urna · 3 praça · 4 fábrica · 5 Vila Ouro Verde · 7 raio na Sequoia · 8 abrir a Urna · 9 contorno dos polígonos (também Shift+Digit1…5/7/8 sem teclado numérico).
   ============================================================================================================ */

export function criarLugares(M){
  const { cen } = M, grupo = new Group(); cen.grupo.add(grupo);
  const S = { itens: [], vivos: new Map(), t: 0, antigo: false };
  const Z = () => M.zonas, K = () => M.kml;
  const poly = (tipo) => K().lista(tipo).filter(e => e.geom === "Polygon").map(e => ({ e, pts: Z().mundoPts(e) }));
  const dentroDe = (P, Q) => { const c = centroide(aberto(Q)); return dentroPoli(aberto(P), c[0], c[1]); };

  /* ---------- itens (um por lugar) ---------- */
  function monta(){
    desmonta(); S.itens = [];
    if(!M.kml || !M.kml.S.carregado) return;
    const pracas = poly("praca"), seqs = poly("sequoia"), urnas = poly("urna"), fabs = poly("fabrica"), vilas = poly("vila").filter(v => /ouro verde/.test(v.e.chave));
    const end = M.estrada && M.estrada.pts && M.estrada.pts.length ? M.estrada.pts[M.estrada.pts.length - 1] : null;
    const usadas = new Set();
    pracas.forEach(p => {
      const seq = seqs.find(s => dentroDe(p.pts, s.pts)), urna = urnas.find(s => dentroDe(p.pts, s.pts)); if(seq) usadas.add(seq); if(urna) usadas.add(urna);
      const P = aberto(p.pts), c = centroide(P), bb = caixa(P);
      /* ponto de carona: na aresta cujo meio fica mais perto da estrada, um pouco para dentro */
      let mel = 1e18, ar = [c[0], c[1], 0, 0]; for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = end ? Math.hypot(m[0] - end[0], m[1] - end[1]) : -m[0]; if(d < mel){ mel = d; ar = [m[0], m[1], a, b]; } }
      const ix = c[0] - ar[0], iz = c[1] - ar[1], il = Math.hypot(ix, iz) || 1, nx = ix / il, nz = iz / il, carona = { x: ar[0] + nx * 2.6 * U, z: ar[1] + nz * 2.6 * U, yaw: Math.atan2(nx, nz) };
      S.itens.push({ id: "praca", nome: "Praça central", tipo: "praca", pts: P, centro: c, bb, carona, seq: seq && seq.pts, urna: urna && urna.pts, raio: C.cargaU.praca,
        constroi: () => criarPraca(M, { poli: P, seq: seq && seq.pts, urna: urna && urna.pts, carona }),
        chegada: { x: carona.x + nx * 5 * U, z: carona.z + nz * 5 * U, yaw: carona.yaw } });
    });
    seqs.filter(s => !usadas.has(s)).forEach(s => { const c = centroide(aberto(s.pts)), R = 45 * U, P = Array.from({ length: 8 }, (_, i) => [c[0] + Math.cos(i / 8 * 6.2832) * R, c[1] + Math.sin(i / 8 * 6.2832) * R]), urna = urnas.find(u => dentroDe(P, u.pts));
      S.itens.push({ id: "praca-sequoia", nome: "Sequoia Lunar", tipo: "praca", pts: P, centro: c, bb: caixa(P), carona: null, seq: s.pts, urna: urna && urna.pts, raio: C.cargaU.praca, constroi: () => criarPraca(M, { poli: P, seq: s.pts, urna: urna && urna.pts, carona: null }), chegada: { x: c[0] - 14 * U, z: c[1], yaw: Math.PI / 2 } }); });
    const vOuro = vilas[0] && centroide(aberto(vilas[0].pts));
    fabs.forEach(f => { const P = aberto(f.pts), c = centroide(P);
      S.itens.push({ id: "fabrica", nome: "Cambará S/A", tipo: "fabrica", pts: P, centro: c, bb: caixa(P), raio: C.cargaU.fabrica, constroi: () => criarFabrica(M, { poli: P, ref: vOuro || c }), chegada: null }); });
    vilas.forEach(v => { const P = aberto(v.pts), c = centroide(P), fab = fabs[0] && centroide(aberto(fabs[0].pts));
      S.itens.push({ id: "vila-ouro-verde", nome: "Vila Ouro Verde", tipo: "vila", pts: P, centro: c, bb: caixa(P), raio: C.cargaU.vila, constroi: () => criarVila(M, { poli: P, fabrica: fab }), chegada: null }); });
    poly("vila").filter(v => /santana/.test(v.e.chave)).forEach(v => { const P = aberto(v.pts), c = centroide(P), E = M.estrada; let i0 = E && E.pts ? E.pts.findIndex(p => dentroPoli(P, p[0], p[1])) : -1; if(i0 < 8) i0 = 8;
      const ref = E && E.pts && E.pts[i0 - 8] ? E.pts[i0 - 8] : [c[0] - 30 * U, c[1]], nxt = E && E.pts && E.pts[i0] ? E.pts[i0] : c;
      S.itens.push({ id: "vila-santana", nome: "Vila Santana", tipo: "santana", pts: P, centro: c, bb: caixa(P), raio: C.cargaU.vila, constroi: () => criarSantana(M, { poli: P }), chegada: { x: ref[0], z: ref[1], yaw: Math.atan2(nxt[0] - ref[0], nxt[1] - ref[1]) } }); });
    /* chegada da fábrica: um pouco antes do portão (do lado de fora) — a posição só é conhecida depois de construída; antes, o centro do lado mais próximo da vila */
    S.itens.forEach(it => { if(it.id === "fabrica" && vOuro){ let mel = 1e18, pt = it.centro; for(let i = 0; i < it.pts.length; i++){ const a = it.pts[i], b = it.pts[(i + 1) % it.pts.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(m[0] - vOuro[0], m[1] - vOuro[1]); if(d < mel){ mel = d; pt = m; } }
        const dx = pt[0] - it.centro[0], dz = pt[1] - it.centro[1], dl = Math.hypot(dx, dz) || 1; it.chegada = { x: pt[0] + dx / dl * 22 * U, z: pt[1] + dz / dl * 22 * U, yaw: Math.atan2(-dx, -dz) }; }
      if(it.id === "vila-ouro-verde") it.chegada = { x: it.centro[0], z: it.centro[1], yaw: 0 }; });
  }
  function desmonta(){ S.vivos.forEach(v => { v.o.dispose && v.o.dispose(); grupo.remove(v.o.g); descarta(v.o.g); }); S.vivos.clear(); }

  /* ---------- carga por proximidade ---------- */
  function distBB(it, J){ const b = it.bb, dx = Math.max(b[0] - J.x, 0, J.x - b[1]), dz = Math.max(b[2] - J.z, 0, J.z - b[3]); return Math.hypot(dx, dz); }
  /* polígonos do tempo antigo (Olaria, área industrial, Cambará S/A, Vila Ouro Verde): a época é decidida pelo lugar vila-santana (santana.js → dentroAntigo) */
  const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  function dentroAntigo(x, z){ const K = M.kml && M.kml.S; if(!K) return false; return K.poligonos.some(e => (e.tipo === "olaria" || e.tipo === "industrial" || e.tipo === "fabrica" || (e.tipo === "vila" && /ouro/i.test(e.nome))) && emPoli(e.mundoPts || e.pts, x, z)); }
  function tick(dt, J){
    if(!J) return; S.t += dt;
    if(S.t > .5){ S.t = 0; const emAntigo = dentroAntigo(J.x, J.z); S.itens.forEach(it => { const d = (it.id === "vila-santana" && emAntigo) ? 0 : distBB(it, J), v = S.vivos.get(it.id);      // dentro da área antiga a Vila Santana fica sempre viva: é ela que controla a época 1950
      if(S.antigo && (it.tipo === "vila" || it.tipo === "fabrica")){ if(v){ v.o.dispose && v.o.dispose(); grupo.remove(v.o.g); descarta(v.o.g); S.vivos.delete(it.id); } return; }                       // no passado a vila e a fábrica nem existem: é só mata
      if(!v && d < it.raio){ try{ const o = it.constroi(); grupo.add(o.g); S.vivos.set(it.id, { o, it }); if(M.terminal && it.id !== "praca-sequoia") console.info("Lugares: " + it.nome + " construído"); }catch(e){ console.warn("lugares:", it.id, e); } }
      else if(v && d > it.raio * C.descargaFator){ v.o.dispose && v.o.dispose(); grupo.remove(v.o.g); descarta(v.o.g); S.vivos.delete(it.id); } }); }
    if(S.antigo && M.vegetacao){ S.focoT += dt; const f = M.vegetacao.base.antigoCfg.foco; if(f && S.focoT > 5 && Math.hypot(J.x - f[0], J.z - f[1]) > 260 * U){ S.focoT = 0; M.vegetacao.base.antigoCfg.foco = [J.x, J.z]; M.vegetacao.base.carrega(); M.vegetacao.arvores.regenera(); } }          // a mata do passado acompanha o jogador
    S.vivos.forEach(v => v.o.tick(dt, J));
  }

  /* ---------- consultas para outros módulos ---------- */
  const item = (id) => S.itens.find(i => i.id === id) || null;
  const doUrbano = (u) => S.itens.find(i => i.id.startsWith("praca") && u && dentroPoli(u.poli, i.centro[0], i.centro[1])) || null;
  /** ruas provisórias em volta da praça real e filtro da grade: usado por cidade.js */
  const ruasEntorno = (u) => { const it = doUrbano(u); return it ? ruasDoEntorno(it.pts) : []; };
  const naPraca = (u, x, z) => { const it = doUrbano(u); return !!it && naPracaOuRua(it.pts, x, z); };
  const caronaDe = (u) => { const it = doUrbano(u); return it && it.carona ? it.carona : null; };
  const chegadaDe = (u) => { const it = doUrbano(u); return it && it.chegada ? it.chegada : null; };
  /** ícones para o minimapa (posições do KML, sempre disponíveis) */
  const icones = () => S.itens.flatMap(it => { if(it.id.startsWith("praca")){ const L = [{ tipo: "praca", nome: "Praça central", x: it.centro[0], z: it.centro[1] }]; if(it.seq) { const c = centroide(aberto(it.seq)); L.push({ tipo: "sequoia", nome: "Sequoia Lunar", x: c[0], z: c[1] }); } if(it.urna){ const c = centroide(aberto(it.urna)); L.push({ tipo: "urna", nome: "Urna do Tempo", x: c[0], z: c[1] }); } return L; } return [{ tipo: it.tipo, nome: it.nome, x: it.centro[0], z: it.centro[1] }]; });
  const posDe = (tipo) => icones().find(i => i.tipo === tipo) || null;
  const vivo = (id) => (S.vivos.get(id) || {}).o || null;

  /* ---------- depuração ---------- */
  function vai(tipo){
    const p = posDe(tipo); if(!p){ M.ctx.mostraAviso("Sem " + tipo + " no KML carregado"); return false; }
    const it = tipo === "praca" ? item("praca") || item("praca-sequoia") : item(tipo === "vila" ? "vila-ouro-verde" : tipo === "santana" ? "vila-santana" : tipo), off = tipo === "sequoia" ? 16 * U : tipo === "urna" ? 7 * U : tipo === "praca" ? 0 : 0;
    let x = p.x - off, z = p.z; if((tipo === "fabrica" || tipo === "santana") && it && it.chegada){ x = it.chegada.x; z = it.chegada.z; }
    M.ctx.teleporta(x, z); M.ctx.mostraAviso("Teleporte: " + p.nome); return true;
  }
  const poliDbg = () => { const v = !S.dbgPoli; S.dbgPoli = v; if(M.kml) M.kml.mostra(v); M.ctx.mostraAviso(v ? "Contornos dos polígonos do KML (todos os tipos)" : "Contornos ocultos"); };
  function tecla(e){
    if(!M.depurando || !M.depurando()) return false;
    const mapa = { Numpad1: "sequoia", Numpad2: "urna", Numpad3: "praca", Numpad4: "fabrica", Numpad5: "vila", Numpad6: "santana", Digit1: "sequoia", Digit2: "urna", Digit3: "praca", Digit4: "fabrica", Digit5: "vila", Digit6: "santana" };
    if(e.code.startsWith("Numpad") || e.shiftKey){
      if(mapa[e.code]){ e.preventDefault(); vai(mapa[e.code]); return true; }
      if(e.code === "Numpad7" || (e.shiftKey && e.code === "Digit7")){ e.preventDefault(); const p = vivo("praca") || vivo("praca-sequoia"); if(p) p.raio({ origem: "debug" }); else M.ctx.mostraAviso("Vá até a praça (Numpad3) para ver o raio"); return true; }
      if(e.code === "Numpad8" || (e.shiftKey && e.code === "Digit8")){ e.preventDefault(); const p = vivo("praca") || vivo("praca-sequoia"); if(p) p.abreUrna(); else M.ctx.mostraAviso("Vá até a Urna (Numpad2) para abri-la"); return true; }
      if(e.code === "Numpad9"){ e.preventDefault(); poliDbg(); return true; }
    }
    return false;
  }
  const info = () => { const v = [...S.vivos.keys()]; return "Lugares: " + (v.length ? v.join(", ") : "nenhum construído") + (S.itens.length ? " · KML: " + S.itens.map(i => i.id).join(", ") : ""); };
  const epoca = () => { if(S.antigo) return "1950"; const v = vivo("vila-santana"); return v ? v.epoca() : "2026"; };
  /* ---------- o passado (portal violeta): vilas, Olaria e Cambará S/A viram mata densa, com o dobro de bichos do parque ---------- */
  const poligonosAntigos = () => ["vila", "olaria", "industrial", "fabrica"].flatMap(t => poly(t).map(q => aberto(q.pts)));
  function entraAntigo(x, z){ if(S.antigo) return false; S.antigo = true; S.focoT = 0; const L = poligonosAntigos();
    if(M.vegetacao){ M.vegetacao.base.antigoCfg.lista = L; M.vegetacao.base.antigoCfg.foco = [x, z]; M.vegetacao.regenera(); } if(M.fauna && M.fauna.antigo) M.fauna.antigo.liga(L); return true; }
  function saiAntigo(){ if(!S.antigo) return false; S.antigo = false;
    if(M.vegetacao){ M.vegetacao.base.antigoCfg.lista = null; M.vegetacao.base.antigoCfg.foco = null; M.vegetacao.regenera(); } if(M.fauna && M.fauna.antigo) M.fauna.antigo.desliga(); return true; }
  return { S, epoca, entraAntigo, saiAntigo, poligonosAntigos, tick, monta, desmonta, refaz: monta, tecla, info, icones, ruasEntorno, naPraca, caronaDe, chegadaDe, item, vivo, vai, posDe, desliga: desmonta };
}
