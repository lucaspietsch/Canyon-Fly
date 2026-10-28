import { Group, Line, LineBasicMaterial, BufferGeometry, Float32BufferAttribute } from "three";
import { U, KML } from "../config.js";

/* ============================================================================================================
   LEITOR DE KML (Google Earth) no navegador: LineString (estradas/trilhas) e Polygon (matas, banhados, campos), com conversão de latitude/longitude para o mundo do jogo.
   O ponto de referência (KML.ref) vira a origem; metros → unidades (× 2,94); o mundo é girado de KML.rotacao em relação ao norte:
   bearing b (a partir do norte, sentido horário)  →  x = cos(b − θ), z = sin(b − θ)  (mesma convenção do resto do jogo).
   Uso:  M.kml.carrega(textoKML)  ·  M.kml.arquivo(File)  ·  arrastar um .kml para cima do jogo  ·  com F3 aberto, tecla L abre o seletor de arquivo.
   Classificação por palavras-chave no nome (KML.tipos em config.js; sem acentos, sem diferenciar maiúsculas nem letras repetidas): mata · turfeira/banhado/umida · nascente · riacho/arroio/rio · lago/açude ·
   ponte ("alta" = ponte alta) · estrada · rua · praça · sequoia · urna · cambará s/a (fábrica) · vila · olaria · parque industrial · cidade/cambara · campo. A geometria (linha/polígono/ponto) é conferida antes do nome; a lista de classificação sai no console. Nomes desconhecidos viram referência (só no F3) e são listados no console.
   Vários KML: com `mescla`, elementos de mesmo nome (e mesmo tipo) SUBSTITUEM os anteriores e os novos são acrescentados.
   ============================================================================================================ */

const R_TERRA = 6371008.8;
export function latLonParaMundo(lat, lon, ref = KML.ref, theta = KML.rotacao){
  const dN = (lat - ref.lat) * Math.PI / 180 * R_TERRA, dE = (lon - ref.lon) * Math.PI / 180 * R_TERRA * Math.cos(ref.lat * Math.PI / 180);
  const d = Math.hypot(dE, dN), b = Math.atan2(dE, dN);
  return [Math.cos(b - theta) * d * KML.escala, Math.sin(b - theta) * d * KML.escala];
}
/** inverso: ponto do mundo (u, sem compressão nem deslocamento — coordenadas "reais" do KML) → [lat, lon] */
export function mundoParaLatLon(x, z, ref = KML.ref, theta = KML.rotacao){
  const d = Math.hypot(x, z) / KML.escala, a = Math.atan2(z, x) + theta, dE = Math.sin(a) * d, dN = Math.cos(a) * d;
  return [ref.lat + dN / R_TERRA * 180 / Math.PI, ref.lon + dE / (R_TERRA * Math.cos(ref.lat * Math.PI / 180)) * 180 / Math.PI];
}
const coords = (txt) => (txt || "").trim().split(/\s+/).map(t => t.split(",").map(Number)).filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1])).map(([lon, lat]) => [lon, lat]);
/** nome normalizado: minúsculas, sem acentos, letras repetidas viram uma ("mataaaa" → "mata", "aarea" → "area") */
export const normaliza = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/(.)\1+/g, "$1").replace(/[^a-z0-9]+/g, " ").trim();
/** classifica uma marca: 1º a GEOMETRIA (KML.geom: cada tipo só vale para linha, polígono ou ponto), depois as palavras-chave do nome na ordem de prioridade de KML.tipos */
export function classifica(nome, pasta = "", geom = ""){
  const t = normaliza(pasta + " " + nome), G = { LineString: "L", Polygon: "P", Point: "T" }[geom] || "";
  for(let i = 0; i < KML.tipos.length; i++){ const [tipo, re] = KML.tipos[i]; const ok = KML.geom[tipo]; if(G && ok && !ok.includes(G)) continue; if(re.test(t)) return { tipo, regra: i, regex: String(re) }; }
  return { tipo: "outro", regra: -1, regex: "" };
}
export const tipoDeNome = (nome, pasta = "", geom = "") => classifica(nome, pasta, geom).tipo;

/** lê o texto do KML e devolve { linhas, poligonos, pontos, desconhecidos } já em coordenadas do mundo (cada item: nome, chave, tipo, alta?, pts) */
export function parseKML(texto, opts = {}){
  const doc = new DOMParser().parseFromString(texto, "text/xml"); if(doc.querySelector("parsererror")) throw new Error("KML inválido");
  const ref = opts.ref || KML.ref, theta = opts.rotacao !== undefined ? opts.rotacao : KML.rotacao, out = { linhas: [], poligonos: [], pontos: [], desconhecidos: [] };
  const conv = (L) => L.map(([lon, lat]) => latLonParaMundo(lat, lon, ref, theta)), geo = (lon, lat) => [lat, lon];
  doc.querySelectorAll("Placemark").forEach(pm => {
    const nome = ((pm.querySelector("name") || {}).textContent || "").trim(), pasta = (pm.parentElement && pm.parentElement.querySelector(":scope > name") || {}).textContent || "";
    const item = (geom, extra) => { const cl = classifica(nome, pasta, geom), tipo = cl.tipo, n = normaliza(nome), it = { nome, chave: tipo + "|" + n, tipo, geom, regra: cl.regex, alta: tipo === "ponte" && /\balta\b/.test(n), ...extra }; if(tipo === "outro" && !out.desconhecidos.includes(nome)) out.desconhecidos.push(nome); return it; };
    pm.querySelectorAll("LineString").forEach(ls => { const L = coords((ls.querySelector("coordinates") || {}).textContent), c = conv(L); if(c.length > 1) out.linhas.push(item("LineString", { pts: c, geo: L.map(([lo, la]) => geo(lo, la)) })); });
    pm.querySelectorAll("Polygon").forEach(pg => { const L = coords((pg.querySelector("outerBoundaryIs coordinates") || pg.querySelector("coordinates") || {}).textContent), c = conv(L); if(c.length > 2) out.poligonos.push(item("Polygon", { pts: c, geo: L.map(([lo, la]) => geo(lo, la)) })); });
    pm.querySelectorAll("Point").forEach(pt => { const L = coords((pt.querySelector("coordinates") || {}).textContent), c = conv(L); if(c.length) out.pontos.push(item("Point", { pt: c[0] })); });
  });
  /* ajuste fino (KML.ajuste): desloca e gira tudo em volta do 1º ponto da estrada (ou do 1º ponto qualquer) */
  const aj = opts.ajuste || KML.ajuste;
  if(aj && (aj.dx || aj.dz || aj.giroGraus)){ const est = out.linhas.find(l => l.tipo === "estrada") || out.linhas[0], o = est ? est.pts[0] : (out.poligonos[0] ? out.poligonos[0].pts[0] : [0, 0]), a = (aj.giroGraus || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const f = (p) => { const x = p[0] - o[0], z = p[1] - o[1]; return [o[0] + x * c - z * s + (aj.dx || 0), o[1] + x * s + z * c + (aj.dz || 0)]; };
    out.linhas.forEach(l => { l.pts = l.pts.map(f); }); out.poligonos.forEach(l => { l.pts = l.pts.map(f); }); out.pontos.forEach(q => { q.pt = f(q.pt); }); }
  return out;
}
const dentroPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

export function criarKML(M){
  const S = { linhas: [], poligonos: [], pontos: [], carregado: false, ouvintes: [], desconhecidos: [] };
  const aoCarregar = (f) => { S.ouvintes.push(f); };
  /* mescla: elementos de mesma chave (tipo + nome normalizado) substituem os antigos; os demais são acrescentados */
  function carrega(texto, opts = {}){
    /* `texto` pode ser uma lista de KML (parque.kml + parque-detalhes.kml): na lista, marcas de mesma chave (tipo + nome) do arquivo seguinte substituem as do anterior e tudo é avisado UMA vez */
    const lista = (Array.isArray(texto) ? texto : [texto]).map(t => parseKML(t, opts)), uneL = (A, N) => [...A.filter(a => !N.some(n => n.chave === a.chave)), ...N];
    const r = lista.reduce((acc, x) => ({ linhas: uneL(acc.linhas, x.linhas), poligonos: uneL(acc.poligonos, x.poligonos), pontos: uneL(acc.pontos, x.pontos), desconhecidos: [...new Set([...acc.desconhecidos, ...x.desconhecidos])] }), { linhas: [], poligonos: [], pontos: [], desconhecidos: [] });
    const junta = (A, N) => opts.mescla ? [...A.filter(a => !N.some(n => n.chave === a.chave)), ...N] : N;
    S.linhas = junta(S.linhas, r.linhas); S.poligonos = junta(S.poligonos, r.poligonos); S.pontos = junta(S.pontos, r.pontos); S.carregado = true; S.desconhecidos = opts.mescla ? [...new Set([...S.desconhecidos, ...r.desconhecidos])] : r.desconhecidos;
    S.classificacao = [...r.poligonos, ...r.linhas, ...r.pontos].map(e => ({ nome: e.nome, geometria: e.geom, tipo: e.tipo, regra: e.regra || "—" }));
    console.info("KML: classificação de " + S.classificacao.length + " marcas (geometria primeiro, depois a ordem de prioridade das regras)\n" + S.classificacao.map(c => "  " + c.geometria.padEnd(10) + " " + c.tipo.padEnd(10) + " ← \"" + c.nome + "\"  " + c.regra).join("\n"));
    if(r.desconhecidos.length) console.info("KML: nomes desconhecidos (carregados só como referência, visíveis no F3):", r.desconhecidos.join(" | "));
    if(dbg) mostra(true);
    S.ouvintes.forEach(f => { try{ f(S); }catch(e){ console.warn("kml:", e); } });
    return { linhas: r.linhas.length, poligonos: r.poligonos.length, estradas: r.linhas.filter(l => l.tipo === "estrada").length, desconhecidos: r.desconhecidos };
  }
  async function arquivo(file){ const t = await file.text(); const r = carrega(t, { mescla: true }); if(M.ctx) M.ctx.mostraAviso("KML carregado: " + r.estradas + " estrada(s), " + r.poligonos + " área(s)" + (r.desconhecidos.length ? " · " + r.desconhecidos.length + " nome(s) desconhecido(s) (console)" : "")); return r; }
  const dentro = (tipo, x, z) => S.poligonos.some(p => (tipo === "*" || p.tipo === tipo) && dentroPoli(p.pts, x, z));
  const POR_TIPO = { sequoia: 0xc04020, urna: 0xffc030, fabrica: 0xa0a0a0, olaria: 0x7040a0, industrial: 0x8a8a60, mata: 0x30e040, mataBaixa: 0xb0e060, banhado: 0x30d0d0, estrada: 0xff4040, campo: 0xe0d040, nascente: 0x4080ff, riacho: 0x2060ff, lago: 0x4090d0, ponte: 0xff8020, rua: 0xd0d0d0, praca: 0xff60c0, vila: 0xc080ff, cidade: 0xffd040, outro: 0x909090 };
  let dbg = null;                                                                  // depuração: desenha TODOS os elementos do KML sobre o terreno (uma cor por tipo)
  function mostra(on){
    if(dbg){ dbg.parent && dbg.parent.remove(dbg); dbg = null; } if(!on) return false;
    dbg = new Group(); const cen = M.cen, mk = (pts, tipo, fecha) => { const a = []; pts.forEach(p => a.push(p[0], cen.chao(p[0], p[1], 1e9) + 4, p[1])); if(fecha) a.push(pts[0][0], cen.chao(pts[0][0], pts[0][1], 1e9) + 4, pts[0][1]);
      const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(a, 3)); const l = new Line(g, new LineBasicMaterial({ color: POR_TIPO[tipo] || 0xffffff, depthTest: false })); l.renderOrder = 30; l.frustumCulled = false; dbg.add(l); };
    S.poligonos.forEach(p => mk(M.zonas ? M.zonas.mundoPts(p) : p.pts, p.tipo, true)); S.linhas.forEach(l => mk(M.zonas ? M.zonas.mundoPts(l) : l.pts, l.tipo, false));
    S.pontos.forEach(q => { const p = M.zonas ? M.zonas.mundoPt(q) : q.pt; mk([[p[0] - 6, p[1]], [p[0] + 6, p[1]]], q.tipo, false); mk([[p[0], p[1] - 6], [p[0], p[1] + 6]], q.tipo, false); });
    cen.grupo.add(dbg); return true;
  }
  const legenda = () => "KML: mata (verde) · mata baixa (limão) · turfeira (ciano) · estrada (vermelho) · nascente/riacho/lago (azuis) · ponte (laranja) · rua (cinza) · praça (rosa) · vila (lilás) · cidade (amarelo) · desconhecido (cinza escuro)";
  const proibido = (x, z) => S.poligonos.some(p => (p.tipo === "mata" || p.tipo === "mataBaixa" || p.tipo === "banhado") && dentroPoli(p.pts, x, z));
  /** cadeia da estrada: junta as linhas "estrada" do KML num caminho só, em coordenadas do KML (u).
      Começa pela(s) linha(s) que saem do parque; se duas saem de lá (uma detalhada e outra grossa), vale a mais densa até o fim dela e a outra segue dali; depois encadeia as linhas
      cujo início encosta no fim do caminho (ex.: "estrada do centro até o fim da vila ouro verde"). Devolve { pts, trechos:[{nome, i0, i1}] } */
  function cadeiaEstrada(){
    const comp = (P) => { let c = 0; for(let i = 1; i < P.length; i++) c += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return c; };
    const L = S.linhas.filter(l => l.tipo === "estrada" && l.geom === "LineString").map(l => ({ nome: l.nome, pts: l.pts.map(p => [p[0], p[1]]) })); if(!L.length) return null;
    const usadas = new Set(), d0 = (l) => Math.hypot(l.pts[0][0], l.pts[0][1]), inicio = L.filter(l => d0(l) < 1800).sort((a, b) => b.pts.length / comp(b.pts) - a.pts.length / comp(a.pts));
    let pts, trechos;
    if(!inicio.length){ const mais = L.slice().sort((a, b) => b.pts.length - a.pts.length)[0]; usadas.add(mais); pts = mais.pts.slice(); trechos = [{ nome: mais.nome, i0: 0, i1: pts.length - 1 }]; }
    else { const det = inicio[0]; usadas.add(det); pts = det.pts.slice(); trechos = [{ nome: det.nome, i0: 0, i1: pts.length - 1 }];
      const grossa = inicio.slice(1).sort((a, b) => comp(b.pts) - comp(a.pts))[0];
      if(grossa){ usadas.add(grossa); const fim = pts[pts.length - 1]; let j = 0, d = 1e18; grossa.pts.forEach((p, i) => { const dd = Math.hypot(p[0] - fim[0], p[1] - fim[1]); if(dd < d){ d = dd; j = i; } });
        const resto = grossa.pts.slice(j + 1); if(resto.length && comp(resto) > comp(pts) * .05){ const i0 = pts.length; pts.push(...resto); trechos.push({ nome: grossa.nome, i0, i1: pts.length - 1 }); } } }
    for(let guarda = 0; guarda < 8; guarda++){ const fim = pts[pts.length - 1], prox = L.find(l => !usadas.has(l) && Math.hypot(l.pts[0][0] - fim[0], l.pts[0][1] - fim[1]) < 900); if(!prox) break;
      usadas.add(prox); const i0 = pts.length; pts.push(...prox.pts.slice(Math.hypot(prox.pts[0][0] - fim[0], prox.pts[0][1] - fim[1]) < 30 ? 1 : 0)); trechos.push({ nome: prox.nome, i0, i1: pts.length - 1 }); }
    return { pts, trechos };
  }
  const estrada = () => { const L = S.linhas.filter(l => l.tipo === "estrada").sort((a, b) => b.pts.length - a.pts.length); return L.length ? L[0].pts : null; };
  const lista = (tipo) => [...S.poligonos, ...S.linhas, ...S.pontos].filter(e => e.tipo === tipo);
  /* arrastar e soltar um .kml sobre o jogo + seletor de arquivo (F3 + L) */
  let alvoEl = null, fnDrop = null, fnOver = null;
  function liga(el){ alvoEl = el; fnOver = (e) => { if(e.dataTransfer && [...e.dataTransfer.items || []].some(i => i.kind === "file")) e.preventDefault(); }; fnDrop = (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f && /\.kml$/i.test(f.name)){ e.preventDefault(); arquivo(f).catch(err => M.ctx && M.ctx.mostraAviso("KML: " + err.message)); } };
    el.addEventListener("dragover", fnOver); el.addEventListener("drop", fnDrop); }
  function desliga(){ if(alvoEl){ alvoEl.removeEventListener("dragover", fnOver); alvoEl.removeEventListener("drop", fnDrop); alvoEl = null; } }
  function selecionar(){ const i = document.createElement("input"); i.type = "file"; i.accept = ".kml,application/vnd.google-earth.kml+xml"; i.onchange = () => { if(i.files[0]) arquivo(i.files[0]).catch(err => M.ctx && M.ctx.mostraAviso("KML: " + err.message)); }; i.click(); }
  return { S, lista, mostra, legenda, carrega, arquivo, dentro, proibido, estrada, cadeiaEstrada, aoCarregar, liga, desliga, selecionar, latLonParaMundo, parseKML };
}
