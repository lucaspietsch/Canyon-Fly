import { Frustum, Matrix4, Sphere, Vector3 } from "three";
import { U, GENTE, FAUNA, SERPENTES, PARQUE, pesoHora } from "../config.js";
import { criarPessoas } from "./pessoas.js";
import { criarBaloes } from "./baloes.js";
import * as F from "./falas.js";
import { EQUIPE, COR_PERFIL, TEMAS, resposta } from "../icmbio/equipe.js";

/* ============================================================================================================
   GENTE: visitantes, guias, grupos escolares e a equipe do ICMBio
   • Pool de pessoas (instanciadas) reaproveitado; spawn/despawn longe do jogador e fora do campo de visão.
   • Todos andam POR CIMA da trilha (coordenadas de caminho: posição ao longo + deslocamento lateral limitado), usando a mesma altura do terreno do Pit e dos animais.
   • IA de quem está longe é atualizada a cada N quadros. Desvio simples do jogador e entre grupos (lados opostos da trilha).
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = (L) => L[Math.floor(Math.random() * L.length)];
const PELES = [0xf1c9a5, 0xe6b996, 0xd9a37a, 0xc68a5e, 0xa8714a, 0x8a5a3a, 0x6f4a32, 0x4a3222], CABELOS = [0x1a1410, 0x2a1c12, 0x4a3220, 0x6a4a2a, 0xb08a4a, 0xc8c8c8, 0x7a2a1a, 0xd8c070];
const CAMISAS = [0xc0392b, 0x2c6fbb, 0xe8b429, 0x3a8a4a, 0xe8e8e8, 0xd96a1a, 0x7a3f9a, 0x1e8aa8, 0xb8325a, 0x2a2a30, 0xcdbd8a, 0x4a6a3a], CALCAS = [0x3a4a6a, 0x2a3a52, 0x8a7a5a, 0x1c1c1e, 0x4a5a3a, 0x5a4a3a, 0x6a6a72];
const ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };

export function criarGente(M){
  const { cen, cam, ciclo } = M;
  const pai = cen.grupo;
  const R = criarPessoas(pai, GENTE.max), baloes = criarBaloes(M);
  const Z = M.fauna.zonas;
  const POOL = Array.from({ length: GENTE.max }, () => ({ ativo: false })), grupos = [];
  const fr = new Frustum(), pm = new Matrix4(), esf = new Sphere(), cp = new Vector3();
  let J0 = null, tempo = 0, quadro = 0, tSpawn = 0, uiRaiz = null, dialogo = null;

  /* ---------- trilhas como caminhos ---------- */
  const mkPath = (pts, nome) => { const cum = [0]; for(let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1], nome, mirantes: [] }; };
  const TR = cen.trilhas, PATHS = [mkPath(TR.TM, "mirante"), mkPath(TR.TB, "borda"), mkPath(TR.TREC, "recebimento")];
  const amostra = (path, s, h = 0) => {                                  // ponto, tangente e normal na posição s (hint h = índice do segmento)
    const { pts, cum } = path; s = Math.max(0, Math.min(path.len, s));
    let i = Math.min(h, pts.length - 2); while(i > 0 && cum[i] > s) i--; while(i < pts.length - 2 && cum[i + 1] < s) i++;
    const a = pts[i], b = pts[i + 1], l = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / l, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx, tz, i };
  };
  /* mirantes: pontos da trilha perto da borda do cânion (entre 25 e 110 u), espaçados */
  PATHS.forEach(p => { let ult = -1e9; for(let s = 60; s < p.len - 30; s += 25){ const q = amostra(p, s), d = Z.maisPerto(q.x, q.z, cen.campo.BORDA_PTS); if(d.d > 22 && d.d < 120 && s - ult > 320){ const fx = d.p[0] - q.x, fz = d.p[1] - q.z, l = Math.hypot(fx, fz) || 1; p.mirantes.push({ s, x: q.x, z: q.z, fx: fx / l, fz: fz / l, d: d.d }); ult = s; } }
    if(p.nome === "mirante"){ const q = amostra(p, p.len - 2), d = Z.maisPerto(q.x, q.z, cen.campo.BORDA_PTS), fx = d.p[0] - q.x, fz = d.p[1] - q.z, l = Math.hypot(fx, fz) || 1; p.mirantes.push({ s: p.len - 3, x: q.x, z: q.z, fx: fx / l, fz: fz / l, d: d.d, fim: true }); } });
  const mirantesTodos = () => PATHS.flatMap(p => p.mirantes.map(m => [m.x, m.z]));

  /* ---------- pool ---------- */
  const aloca = () => { const P = POOL.find(p => !p.ativo); if(!P) return null; Object.assign(P, { ativo: true, oculto: false, x: 0, y: 0, z: 0, yaw: 0, esc: 1, vel: 0, fase: Math.random() * 6, modo: "idle", tModo: 0, seed: Math.random() * 100, s: 0, lat: 0, latAlvo: 0, back: 0, idx: 0, g: null, role: "adulto", falaCd: rnd(3, 12), hotspot: null, icm: null, cor: {}, acess: {}, focoYaw: null, yTick: 0,
      pose: { legL: 0, legR: 0, armL: 0, armR: 0, armLz: .08, armRz: .08, lean: 0, sit: 0, lie: 0, bob: 0, headYaw: 0, headPitch: 0, celular: false, binoculo: false, prancheta: false } }); return P; };
  const libera = (P) => { P.ativo = false; if(P.hotspot){ const i = cen.hotspots.indexOf(P.hotspot); if(i >= 0) cen.hotspots.splice(i, 1); P.hotspot = null; } };

  /* ---------- aparência ---------- */
  function aparencia(P, tipo){
    const pele = pick(PELES), kid = tipo === "crianca" || tipo === "aluno", idoso = tipo === "idoso";
    P.esc = kid ? rnd(.6, .8) : idoso ? rnd(.92, .98) : rnd(.92, 1.08); P.role = tipo;
    const camisa = pick(CAMISAS), cor = P.cor = { pele, camisa, manga: camisa, calca: pick(CALCAS), cabelo: idoso ? 0xc8c8c8 : pick(CABELOS), bota: pick([0x2a1f18, 0x3a3128, 0x1c1c1e, 0x4a3a28]), chapeu: pick([0x2a2a2a, 0x3a5a8a, 0x8a2a2a, 0xd8d0b8, 0x4a5a35]), mochila: pick([0x3a4a2c, 0x2a3a6a, 0x8a2a1a, 0x2a2a2e, 0x6a5a2a]), garrafa: pick([0x2f7fb0, 0x8a8a8a, 0x3a8a4a]), bastao: 0x6a4a2a };
    const a = P.acess = { cabelo: true, rabo: Math.random() < .2, chapeu: Math.random() < .35 ? (Math.random() < .5 ? 1 : 2) : 0, mochila: !kid && Math.random() < .35, garrafa: Math.random() < .25, bastao: !kid && Math.random() < (idoso ? .6 : .12) };
    if(kid){ a.chapeu = Math.random() < .3 ? 2 : 0; a.mochila = Math.random() < .6; a.bastao = false; }
  }
  function uniforme(P, tipo){                                   // alunos de uniforme (camiseta branca com listra azul), professores e guias (colete laranja/verde)
    const c = P.cor, a = P.acess;
    if(tipo === "aluno"){ c.camisa = c.manga = 0xf4f4f0; c.calca = 0x24407a; }
    if(tipo === "prof"){ c.camisa = c.manga = 0x2a6ab0; a.mochila = true; }
    if(tipo === "guia"){ c.camisa = c.manga = 0x3a8a4a; c.calca = 0x4a4d38; c.chapeu = 0xd8cca0; a.chapeu = 1; a.colete = true; c.colete = 0xe8731a; a.radio = true; a.mochila = true; }
  }

  /* ---------- grupos ---------- */
  const nGrupos = (t) => grupos.filter(g => g.tipo === t).length;
  const contaPessoas = () => POOL.reduce((s, p) => s + (p.ativo && !p.icm && !p.staff && !p.oculto ? 1 : 0), 0);
  function novoGrupo(tipo, path, dir, s, lista){
    const g = { id: Math.random(), tipo, path: path, dir, s, v: rnd(GENTE.velocidade[0], GENTE.velocidade[1]), estado: "andando", t: 0, membros: lista, guia: lista.find(p => p.role === "guia") || null, prox: 0, tPausa: rnd(20, 50), mir: null, focoX: 0, focoZ: 0, saindo: false, reagiu: new Map(), tFala: rnd(6, 16), acc: 0, parado: null };
    lista.forEach((p, i) => { p.g = g; p.idx = i; });
    grupos.push(g); return g;
  }
  function criaGrupoTrilha(tipo, ptIdx, dir, s){
    const path = PATHS[ptIdx], quant = { solo: 1, casal: 2, familia: ri(3, 5), guiado: ri(GENTE.guiado.tamanho[0], GENTE.guiado.tamanho[1]) + 1, escolar: ri(GENTE.escolar.tamanho[0], GENTE.escolar.tamanho[1]) + 3 }[tipo];
    const lista = []; for(let i = 0; i < quant; i++){ const P = aloca(); if(!P) break; lista.push(P); }
    if(lista.length < Math.min(2, quant)){ lista.forEach(libera); return null; }
    lista.forEach((P, i) => {
      let t = "adulto";
      if(tipo === "familia") t = i < 2 ? "adulto" : "crianca"; else if(tipo === "casal") t = Math.random() < .12 ? "idoso" : "adulto"; else if(tipo === "solo") t = Math.random() < .15 ? "idoso" : "adulto";
      else if(tipo === "guiado") t = i === 0 ? "guia" : Math.random() < .08 ? "idoso" : Math.random() < .12 ? "crianca" : "adulto";
      else if(tipo === "escolar") t = i === 0 ? "guia" : i === 1 ? "prof" : (i === 2 && lista.length > 9 ? "prof" : "aluno");
      aparencia(P, t); if(t === "guia" || t === "prof" || t === "aluno") uniforme(P, t);
      P.back = i === 0 ? 0 : rnd(3, 7 + i * 1.4); P.lat = P.latAlvo = (dir > 0 ? 1 : -1) * rnd(.4, 2.6) * (Math.random() < .5 ? 1 : .6); P.s = s - dir * P.back; P.vOff = 0;
    });
    const g = novoGrupo(tipo, path, dir, s, lista);
    g.prox = proxMirante(g); lista.forEach(P => snap(P, g)); return g;
  }
  const proxMirante = (g) => { const L = g.path.mirantes.filter(m => (g.dir > 0 ? m.s > g.s + 40 : m.s < g.s - 40)); L.sort((a, b) => g.dir > 0 ? a.s - b.s : b.s - a.s); return L.find(m => m.fim || Math.random() < .7) || null; };
  const snap = (P, g) => { const q = amostra(g.path, P.s, P.idxSeg || 0); P.idxSeg = q.i; const nx = -q.tz, nz = q.tx; P.x = q.x + nx * P.lat; P.z = q.z + nz * P.lat; P.y = cen.chao(P.x, P.z, 1e9); P.yaw = Math.atan2(q.tx * g.dir, q.tz * g.dir); P.tx = q.tx; P.tz = q.tz; };

  /* grupos parados no estacionamento (conversando perto da lanchonete, das mesas e dos carros) */
  const SPOTS = () => { const E = cen.estac; return [E.PKW(-22, 12), E.PKW(30, -6), E.PKW(-8, 12), E.PKW(14, 24), E.PKW(60, 12), E.PKW(-40, 4)]; };
  function criaGrupoParado(){
    const quant = ri(2, 4), lista = []; for(let i = 0; i < quant; i++){ const P = aloca(); if(!P) break; lista.push(P); }
    if(lista.length < 2){ lista.forEach(libera); return null; }
    const [cx, cz] = pick(SPOTS()); const g = novoGrupo("parado", null, 1, 0, lista); g.estado = "parado"; g.parado = { cx, cz, ate: tempo + rnd(60, 150) };
    lista.forEach((P, i) => { aparencia(P, Math.random() < .12 ? "idoso" : "adulto"); const a = i / lista.length * 6.28 + Math.random(); P.x = cx + Math.cos(a) * rnd(2.2, 3.6); P.z = cz + Math.sin(a) * rnd(2.2, 3.6); P.y = cen.chao(P.x, P.z, 1e9); P.yaw = Math.atan2(cx - P.x, cz - P.z); P.modo = pick(["conversa", "idle", "conversa", "foto"]); P.tModo = rnd(3, 9); });
    return g;
  }

  /* ---------- poses ---------- */
  function poseAlvo(P, dt, t){
    const po = P.pose, k = Math.min(1, dt * 9), s = P.seed, f = P.fase;
    const alvo = { legL: 0, legR: 0, armL: 0, armR: 0, armLz: .08, armRz: .08, lean: 0, sit: 0, lie: 0, headYaw: 0, headPitch: 0, bob: 0, celular: false, binoculo: false, prancheta: false };
    const v = P.vel / U;
    switch(P.modo){
      case "anda": case "corre": { const am = Math.min(.75, .2 + v * .2) * (P.modo === "corre" ? 1.25 : 1); alvo.legL = Math.sin(f) * am; alvo.legR = -Math.sin(f) * am; alvo.armL = -Math.sin(f) * am * .85; alvo.armR = Math.sin(f) * am * .85; alvo.bob = Math.abs(Math.cos(f)) * .1; alvo.lean = P.modo === "corre" ? .2 : .03; if(P.role === "idoso") alvo.lean = .12; if(P.acess.bastao) alvo.armR = -.3; if(P.acess.prancheta) alvo.armL = -1.0; break; }
      case "idle": alvo.lean = .01 + Math.sin(t * 1.1 + s) * .015; alvo.armL = Math.sin(t * .9 + s) * .06; alvo.armR = Math.sin(t * .8 + s * 2) * .06; alvo.headYaw = Math.sin(t * .5 + s) * .5; break;
      case "conversa": alvo.armR = -.5 + Math.sin(t * 2.6 + s) * .45; alvo.armL = -.15 + Math.sin(t * 1.7 + s * 3) * .2; alvo.headYaw = Math.sin(t * .9 + s) * .3; alvo.lean = .03; break;
      case "foto": alvo.armL = alvo.armR = -1.4; alvo.armLz = alvo.armRz = .22; alvo.celular = true; alvo.headPitch = .0; break;
      case "apontar": alvo.armR = -1.5 + Math.sin(t * 1.2) * .05; alvo.armRz = .3; alvo.armL = .0; alvo.headYaw = -.15; break;
      case "sentar": alvo.sit = 1; alvo.legL = alvo.legR = -1.45; alvo.armL = -.4; alvo.armR = -.4; alvo.lean = .12; break;
      case "radio": alvo.armR = -2.35; alvo.armRz = .3; alvo.armL = -.2; alvo.headYaw = .2; break;
      case "prancheta": alvo.armL = -1.15; alvo.armR = -.45; alvo.prancheta = true; alvo.headPitch = .35; alvo.lean = .05; break;
      case "binoculo": alvo.armL = alvo.armR = -2.15; alvo.binoculo = true; alvo.armLz = alvo.armRz = .05; break;
      case "abaixa": alvo.lean = 1.05; alvo.armL = alvo.armR = -.4; alvo.legL = alvo.legR = .3; alvo.headPitch = .2; break;
      case "cima": alvo.headPitch = -.75; alvo.lean = -.08; alvo.armL = alvo.armR = -.1; break;
      case "dor": alvo.sit = 1; alvo.legL = -1.5; alvo.legR = -1.2; alvo.armL = -1.2; alvo.armR = -1.0; alvo.lean = .55; alvo.headPitch = .45; break;                       // sentado no chão, segurando o tornozelo
      case "tropeca": alvo.lean = .6; alvo.armL = -.9; alvo.armR = -1.4; alvo.legL = .5; alvo.legR = -.4; alvo.bob = .1; break;
      case "ajoelha": alvo.sit = .62; alvo.legL = -.5; alvo.legR = .35; alvo.lean = .42; alvo.armL = -1.0; alvo.armR = -1.35; alvo.headPitch = .3; break;                      // ao lado do paciente
      case "examina": alvo.sit = .62; alvo.legL = -.5; alvo.legR = .35; alvo.lean = .55; alvo.armL = -1.5; alvo.armR = -1.7; alvo.headPitch = .35; break;
      case "capacete": alvo.armL = alvo.armR = -2.4; alvo.armLz = alvo.armRz = .35; alvo.headPitch = -.1; alvo.lean = .02; break;
      case "pilota": alvo.sit = .9; alvo.legL = alvo.legR = -.95; alvo.armL = alvo.armR = -1.05; alvo.armLz = alvo.armRz = .12; alvo.lean = .12; break;
      case "carrega": { const am = Math.min(.5, .15 + v * .12); alvo.legL = Math.sin(f) * am; alvo.legR = -Math.sin(f) * am; alvo.armL = alvo.armR = -.38; alvo.armLz = alvo.armRz = .02; alvo.bob = Math.abs(Math.cos(f)) * .03; alvo.lean = .02; break; }
      case "deitado": alvo.lie = 1; alvo.armL = alvo.armR = -.15; alvo.armLz = alvo.armRz = .06; break;
      case "empurra": alvo.armL = alvo.armR = -1.3; alvo.lean = .3; alvo.legL = Math.sin(f) * .25; alvo.legR = -Math.sin(f) * .25; break;
      case "acena": alvo.armR = -2.55 + Math.sin(t * 9) * .35; alvo.armRz = .4; break;
      case "pula": alvo.bob = Math.abs(Math.sin(t * 6 + s)) * .9; alvo.armL = alvo.armR = -2.6 + Math.sin(t * 6) * .3; break;
      default: break;
    }
    Object.keys(alvo).forEach(n => { if(typeof alvo[n] === "boolean") po[n] = alvo[n]; else po[n] += (alvo[n] - po[n]) * k; });
    po.headYaw += (alvo.headYaw - po.headYaw) * 0; // (suaviza acima)
  }

  /* ---------- balões ---------- */
  const fala = (P, texto, dur = 4, maxU = GENTE.falaPerto * U) => baloes.fala(P, texto, dur, maxU);
  function ambiente(E, nev){
    if(E.alt < -8) return "noite"; if(E.alt < 8 && E.h > 12) return "poente"; if(nev > .8 && E.h < 12) return "neblina"; return E.h < 11 ? "manha" : E.h > 15.5 ? "tarde" : "geral";
  }
  function conversaAmbiente(P, g, E, J, dt, nev){
    P.falaCd -= dt; if(P.falaCd > 0) return; P.falaCd = rnd(9, 22);
    if(Math.hypot(P.x - J.x, P.z - J.z) > GENTE.falaPerto * U) return;
    if(P.icm) return;
    let L;
    const cat = ambiente(E, nev), r = Math.random();
    if(P.role === "aluno") L = F.ESCOLAR.aluno; else if(P.role === "prof") L = F.ESCOLAR.professor; else if(P.role === "guia") L = Math.random() < .6 ? F.GUIA.geologia : F.GUIA.seguranca;
    else if(P.role === "crianca" && r < .5) L = F.VISITANTE.crianca; else if(P.role === "idoso" && r < .3) L = F.VISITANTE.idoso;
    else if(cat !== "geral" && r < .6) L = F.VISITANTE[cat] || F.VISITANTE.geral; else L = F.VISITANTE.geral;
    if(P.role === "guia" && cat === "noite") L = F.GUIA.noite;
    fala(P, F.fala(L), 4.2);
  }

  /* ---------- reações (fauna, céu) ---------- */
  function reageAnimal(g, a){
    const esp = a.id, escolar = g.tipo === "escolar", guiado = !!g.guia && !g.icmEq;
    g.reagiu.set(esp, tempo); g.estado = "observando"; g.t = 0; g.obs = { a, linhas: [], i: 0, t: 0, dur: 0 };
    g.focoX = a.x; g.focoZ = a.z;
    if(g.icmEq){ const P = g.membros.find(p => p.ativo && !p.oculto); if(P){ fala(P, F.fala(F.ICMBIO_RONDA.fauna), 4.5, 15 * U); if(esp === "graxaim") setTimeout(() => P.ativo && fala(P, F.fala(F.ICMBIO_RONDA.graxaim), 4.5, 15 * U), 4500); } g.obs.dur = 14; }
    else if(escolar || guiado){
      const L = escolar ? F.ANIMAL_ESCOLAR[esp].slice() : F.ANIMAL[esp].map(p => F.fala(p));
      g.obs.especie = esp;
      g.obs.linhas = L; g.obs.dur = L.length * GENTE.balaoSeg + 7;
    } else { g.obs.dur = rnd(9, 15); const P = pick(g.membros); if(P) fala(P, F.fala(F.VISITANTE.fauna[esp]), 3.8, 12 * U); }
    g.membros.forEach(P => { if(P.hotspot) return; P.modo = P.role === "crianca" || P.role === "aluno" ? (Math.random() < .5 ? "apontar" : "foto") : Math.random() < .55 ? "foto" : "idle"; P.tModo = rnd(5, 9); });
    if(g.guia) g.guia.modo = "apontar";
  }
  function reageVento(){ const J = J0; if(!J) return; grupos.forEach(g => g.membros.forEach(P => { if(!P.ativo || P.oculto || P.hotspot) return; if(Math.hypot(P.x - J.x, P.z - J.z) > 40 * U || Math.random() > .35) return; if(P.modo !== "anda") P.modo = "idle"; if(Math.random() < .5) setTimeout(() => P.ativo && fala(P, F.fala(F.VENTO.visitante), 3.6, 22 * U), rnd(500, 6000)); })); }
  function reageCeu(tipo, info = {}){
    const dur = info.dur || 12, J = J0; if(!J) return;
    grupos.forEach(g => { if(g.estado === "dialogo") return; g.ceu = { tipo, t: dur };
      g.membros.forEach((P, i) => { if(!P.ativo || P.oculto || P.hotspot && P.hotspot.falando) return; if(Math.random() < (tipo === "meteoro" || tipo === "viaLactea" ? .9 : .7)){ P.modo = Math.random() < .35 && tipo !== "meteoro" ? "foto" : "cima"; P.tModo = dur * rnd(.5, 1); }
        if(Math.hypot(P.x - J.x, P.z - J.z) < 45 * U && Math.random() < .35){
          let L = F.VISITANTE[tipo === "monomotorBaixo" ? "monomotor" : tipo] || F.VISITANTE.geral;
          if(P.role === "guia" && tipo === "monomotorBaixo") L = F.GUIA.aviaoBaixo; else if(P.role === "guia" && (tipo === "meteoro" || tipo === "bolido")) L = F.GUIA.meteoro; else if(P.role === "guia" && tipo === "viaLactea") L = F.GUIA.noite; else if(P.role === "guia" && tipo === "andorinhas") L = F.GUIA.andorinhas;
          if(P.icm && tipo === "monomotorBaixo") L = i % 2 ? F.ICMBIO_RONDA.aviaoAnota : F.ICMBIO_RONDA.aviaoBaixo;
          setTimeout(() => P.ativo && fala(P, F.fala(L), 4.5, 30 * U), rnd(600, 3500)); } }); });
  }

  /* turfeira, nascente ou sapinho por perto (~20 m): o grupo com guia para e o guia explica; escolares ouvem a versão simples; a equipe do ICMBio reforça */
  function reageLugar(g, tipo, x, z){
    const pool = tipo === "nascente" ? F.NASCENTE : tipo === "sapinho" ? F.SAPINHO : F.AVES[tipo] || F.TURFEIRA; g.reagiuLugar = g.reagiuLugar || {}; g.reagiuLugar[tipo] = tempo;
    if(g.icmEq){ const P = g.membros[0]; if(P) fala(P, F.fala(F.TURFEIRA.icm), 4.5, 16 * U); return; }
    if(!g.guia && g.tipo !== "escolar") return;
    g.estado = "observando"; g.t = 0; g.focoX = x; g.focoZ = z; const L = [];
    if(g.tipo === "escolar") L.push(F.fala(pool.escolar), F.fala(pool.escolar));
    else { L.push(F.fala(pool.intro), F.fala(pool.explica)); if(Math.random() < .7) L.push(F.fala(pool.explica)); if(tipo === "turfeira" && Math.random() < .35) L.push(F.fala(F.TURFEIRA.placa)); L.push(F.fala(pool.conduta)); }
    g.obs = { a: null, linhas: L, i: 0, t: 0, dur: L.length * GENTE.balaoSeg + 6, especie: tipo };
    g.membros.forEach(P => { if(P.hotspot) return; P.modo = P.role === "crianca" || P.role === "aluno" ? "apontar" : Math.random() < .5 ? "foto" : "idle"; P.tModo = rnd(5, 9); }); if(g.guia) g.guia.modo = "apontar";
  }
  /* ---------- movimento de grupos de trilha ---------- */
  function movePessoa(P, g, alvoS, alvoLat, vmax, dt, foco){
    const ds = Math.max(-vmax * dt, Math.min(vmax * dt, alvoS - P.s)); P.s += ds;
    P.lat += Math.max(-3 * dt, Math.min(3 * dt, alvoLat - P.lat)); const lm = M.vegetacao && M.vegetacao.passarelas ? M.vegetacao.passarelas.latMax(g.path.nome, P.s) : 3.4; P.lat = Math.max(-lm, Math.min(lm, P.lat));       // na passarela da turfeira, só no centro
    const q = amostra(g.path, P.s, P.idxSeg || 0); P.idxSeg = q.i; const nx = -q.tz, nz = q.tx; P.x = q.x + nx * P.lat; P.z = q.z + nz * P.lat;
    const mov = Math.abs(ds) / dt; P.vel = mov;
    let yw;
    if(mov > .6 && !foco) yw = Math.atan2(q.tx * Math.sign(ds), q.tz * Math.sign(ds)); else if(foco) yw = Math.atan2(foco[0] - P.x, foco[1] - P.z); else yw = P.yaw;
    P.yaw += ang(yw - P.yaw) * Math.min(1, dt * 7);
    return mov;
  }
  /* saída do parque: o grupo vai até um carro do estacionamento e entra (some); aqui não há animação do carro saindo */
  function vaiParaCarro(g){
    const E0 = cen.estac, car = E0.carros[Math.floor(Math.random() * E0.carros.length)], [cx, cz] = E0.PKW(car[0], car[1] + 4);
    g.estado = "carro"; g.carro = [cx, cz];
    g.membros.forEach((P, i) => { P.carroAlvo = [cx + Math.cos(i * 2.1) * 2.2, cz + Math.sin(i * 2.1) * 2.2]; P.modo = "anda"; P.hotspot = P.hotspot || null; });
  }
  function atualizaCarro(g, dt, E){
    let todos = true; const v = (g.v || 3.6) * (E.h >= PARQUE.fecha ? PARQUE.aceleraAposFechar : 1.1);
    g.membros.forEach(P => { if(!P.ativo || P.oculto) return; const al = P.carroAlvo, dx = al[0] - P.x, dz = al[1] - P.z, d = Math.hypot(dx, dz);
      if(d < 1.4){ P.oculto = true; return; } todos = false; P.vel = v; P.modo = "anda"; P.fase += dt * (3 + v / U * 2.6); P.yaw += ang(Math.atan2(dx, dz) - P.yaw) * Math.min(1, dt * 6); P.x += dx / d * v * dt; P.z += dz / d * v * dt;
      P.yTick -= dt; if(P.yTick <= 0){ P.y = cen.chao(P.x, P.z, 1e9); P.yTick = .12; } });
    if(todos){ g.fim = true; g.membros.forEach(P => { P.oculto = true; }); }
  }
  function atualizaGrupoTrilha(g, dt, J, E, nev){
    const len = g.path.len;
    g.t += dt;
    const centro = g.guia || g.membros[0];
    let foco = null;
    /* emergência passando: o grupo para, abre espaço para a lateral da trilha e olha o comboio */
    if(g.cede > 0){ g.cede -= dt; if(g.estado === "andando"){ g.estado = "cede"; g.t = 0; g.membros.forEach(P => { if(!P.hotspot){ P.modo = pick(["idle", "foto", "apontar", "idle"]); P.tModo = rnd(3, 6); } }); const falante = g.guia || g.membros.find(p => p.role === "adulto" || p.role === "aluno"); if(falante && !g.cedeFalou){ g.cedeFalou = true; const L = g.guia ? (g.tipo === "escolar" ? F.EMERG.guiaEscolar : F.EMERG.guia) : F.EMERG.visitante; if(!g.icmEq) fala(falante, F.fala(L), 4.2, 18 * U); } } }
    else if(g.estado === "cede"){ g.estado = "andando"; g.cedeFalou = false; g.membros.forEach(P => { if(!P.hotspot) P.modo = "anda"; }); }
    /* estados */
    if(g.estado === "andando"){
      g.s += g.dir * g.v * dt * (g.tipo === "escolar" ? .92 : 1) * (g.saindo && E.h >= PARQUE.fecha ? PARQUE.aceleraAposFechar : 1);
      g.tPausa -= dt; if(g.tPausa <= 0){ g.estado = "parada"; g.t = 0; g.dur = rnd(4, 9); g.tPausa = rnd(25, 60); }
      if(g.prox && (g.dir > 0 ? g.s >= g.prox.s : g.s <= g.prox.s)){ g.estado = "mirante"; g.t = 0; g.dur = g.prox.fim ? rnd(25, 45) : rnd(14, 30); g.mir = g.prox; g.prox = null; poseMirante(g); }
      if(g.dir > 0 && g.s >= len - 3){ g.estado = "mirante"; g.t = 0; g.dur = rnd(10, 20); g.mir = g.mir || { fx: 0, fz: 0 }; poseMirante(g); g.virar = true; }
      else if(g.dir < 0 && g.s <= 3){ if(g.icmEq && g.ronda){ g.ronda.voltas++; } if(g.saindo && !g.icmEq && !g.staff){ vaiParaCarro(g); } else if(g.saindo || g.tipo !== "equipe" || !g.ronda){ g.fim = true; } else { g.estado = "parada"; g.t = 0; g.dur = 6; g.virar = true; } }
    } else if(g.estado === "parada"){ if(g.t > g.dur){ g.estado = "andando"; if(g.virar){ g.dir *= -1; g.virar = false; g.prox = proxMirante(g); } } }
    else if(g.estado === "mirante"){
      foco = [centro.x + g.mir.fx * 60, centro.z + g.mir.fz * 60];
      if(g.guia && g.t > 2 && !g.guiaFalou){ g.guiaFalou = true; const L = ambiente(E, nev) === "noite" ? F.GUIA.noite : [...F.GUIA.geologia, ...F.GUIA.seguranca]; fala(g.guia, g.tipo === "escolar" ? F.fala(F.ESCOLAR.guia) : F.fala(L), 5, 14 * U); }
      if(g.icmEq && g.t > 3 && !g.radioFalou){ g.radioFalou = true; const P = g.membros[0]; P.modo = "radio"; P.tModo = 6; fala(P, F.fala(F.ICMBIO_RONDA.radio), 5, 14 * U); }
      if(g.t > g.dur){ g.estado = "andando"; g.guiaFalou = false; g.radioFalou = false; g.membros.forEach(P => { if(!P.hotspot) P.modo = "anda"; }); if(g.virar){ g.dir *= -1; g.virar = false; g.prox = proxMirante(g); } }
    } else if(g.estado === "observando"){
      const o = g.obs; o.t += dt; foco = [g.focoX, g.focoZ];
      if(o.a && !o.a.fim){ g.focoX = o.a.x; g.focoZ = o.a.z; }
      if(g.guia && o.linhas.length && o.i < o.linhas.length && o.t > o.i * GENTE.balaoSeg + (o.i === 0 ? 1.5 : 1.5)){ fala(g.guia, o.linhas[o.i], GENTE.balaoSeg + .4, GENTE.falaGuiaAnimal * U); if(g.tipo === "escolar" && o.i === 1){ const pr = g.membros.find(p => p.role === "prof"); if(pr) setTimeout(() => pr.ativo && fala(pr, F.fala(F.PROFESSOR_ANIMAL), 3.8, GENTE.falaGuiaAnimal * U), 2500); } o.i++; }
      if(o.t > o.dur || (o.a && o.a.fim && o.t > 4)){ g.estado = "andando"; g.membros.forEach(P => { if(!P.hotspot || !P.hotspot.falando) P.modo = "anda"; }); }
    } else if(g.estado === "cobra"){
      const s = g.cobra; foco = s ? [s.x, s.z] : null; g.tCobra = (g.tCobra || 0) + dt;
      if(s && !s.fim && !s.capturada && s.estado !== "sumindo") g.cobraFim = null; else if(g.cobraFim == null) g.cobraFim = rnd(4, 6);
      if(g.cobraFim != null){ g.cobraFim -= dt; if(g.cobraFim <= 0){ g.estado = "andando"; g.cobra = null; g.membros.forEach(P => { if(!P.hotspot) P.modo = "anda"; }); } }
      if(g.guia && s && g.cobraLinhas && g.cobraI < g.cobraLinhas.length && g.tCobra > g.cobraI * GENTE.balaoSeg + 1.2){ fala(g.guia, g.cobraLinhas[g.cobraI], GENTE.balaoSeg + .4, GENTE.falaGuiaAnimal * U); if(g.tipo === "escolar" && g.cobraI === 1){ const pr = g.membros.find(p => p.role === "prof"); if(pr) setTimeout(() => pr.ativo && fala(pr, F.fala(F.ESCOLAR.professorSerpente), 3.8, GENTE.falaGuiaAnimal * U), 2200); } g.cobraI++; }
    } else if(g.estado === "cede"){ foco = g.cedeFoco || null;
    } else if(g.estado === "dialogo"){ foco = [J.x, J.z]; if(!g.dialogoAtivo && g.t > 1.5){ g.estado = "andando"; g.membros.forEach(P => { P.modo = "anda"; }); } }
    if(g.ceu){ g.ceu.t -= dt; if(g.ceu.t <= 0) g.ceu = null; }
    g.s = Math.max(0, Math.min(len, g.s));
    /* membros */
    const parou = g.estado !== "andando";
    if(g.estado === "cobra") g.membros.forEach(P => { P.back = Math.max(P.back, 0); });
    g.membros.forEach((P, i) => {
      if(!P.ativo) return;
      let alvoS, alvoLat, vmax = g.v * 1.7;
      if(!parou){ alvoS = g.s - g.dir * P.back + Math.sin(tempo * .4 + P.seed) * 1.2; alvoLat = P.latAlvo; }
      else if(g.estado === "cede"){ alvoS = g.s - g.dir * P.back * .4; alvoLat = (P.cedeLado || (P.cedeLado = (P.lat >= 0 ? 1 : -1))) * 3.2; vmax = g.v * 1.4; } else { const aberto = g.estado === "mirante" || g.estado === "observando" || g.estado === "dialogo"; alvoS = g.s - g.dir * (aberto ? Math.sin(P.seed * 3) * 7 + (g.estado === "observando" ? P.back * .3 : 0) : P.back * .5); alvoLat = aberto ? Math.sin(P.seed * 5) * 2.6 : P.latAlvo; vmax = g.v * 1.2; }
      /* alunos correm um pouco à frente e voltam */
      if(P.role === "aluno" && g.estado === "andando" && P.modo !== "corre" && Math.random() < dt * .02){ P.modo = "corre"; P.tModo = rnd(2, 3.5); P.correFrente = rnd(4, 10); }
      if(P.modo === "corre" && g.estado === "andando"){ alvoS += g.dir * (P.correFrente || 6); vmax = g.v * 2.6; if((P.tModo -= dt) < 0) P.modo = "anda"; }
      /* desvia do jogador (lado oposto da trilha) */
      if(J){ const dx = J.x - P.x, dz = J.z - P.z, d = Math.hypot(dx, dz); if(d < 5.5){ const q = amostra(g.path, P.s, P.idxSeg || 0), nx = -q.tz, nz = q.tx, lado = dx * nx + dz * nz; alvoLat = lado > 0 ? -2.8 : 2.8; } }
      const mov = movePessoa(P, g, alvoS, alvoLat, vmax, dt, foco && parou ? [foco[0] + (P.seed % 1 - .5) * 6, foco[1]] : null);
      if(mov > .6){ if(P.modo === "idle" || P.modo === "conversa" || P.modo === "foto" || P.modo === "cima" || P.modo === "apontar") P.modo = "anda"; P.fase += dt * (3 + mov / U * 2.6); }
      else if(P.modo === "anda" || P.modo === "corre"){ P.modo = pick(["idle", "idle", "conversa"]); P.tModo = rnd(3, 8); }
      if(P.modo !== "anda" && P.modo !== "corre" && !P.hotspot){ if((P.tModo -= dt) < 0){ P.modo = g.estado === "mirante" ? pick(["foto", "apontar", "idle", "sentar", "foto"]) : pick(["idle", "conversa", "conversa"]); if(P.role === "crianca" || P.role === "aluno") P.modo = pick(["apontar", "pula", "idle", "foto"]); P.tModo = rnd(4, 10); } }
      P.yTick -= dt; if(P.yTick <= 0){ P.y = cen.chao(P.x, P.z, 1e9); P.yTick = .12; }
      if(J) conversaAmbiente(P, g, E, J, dt, nev);
    });
    /* equipe da trilha: orienta quem está perto demais da borda, cumprimenta, recolhe lixo */
    if(g.icmEq) equipeTrilha(g, dt, J, E);
  }
  function poseMirante(g){ g.membros.forEach((P, i) => { if(P.hotspot) { P.modo = "idle"; return; } P.modo = g.mir && g.mir.fim ? pick(["foto", "apontar", "idle", "foto"]) : pick(["foto", "idle", "apontar", "sentar"]); P.tModo = rnd(3, 8); }); }

  /* ---------- equipe do ICMBio ---------- */
  const equipes = { est: null, trilha: null, estSaindo: false, trilhaCriada: false };
  function aplicaICM(P, def){
    P.icm = def; P.esc = def.esc; const cp = COR_PERFIL[def.perfil];
    P.cor = { pele: def.pele, cabelo: def.cabelo, camisa: cp.camisa, manga: cp.manga, calca: cp.calca, colete: cp.colete, chapeu: cp.chapeu, bota: 0x2a2018, mochila: 0x3a4a2c, garrafa: 0x3a8a4a, bastao: 0 };
    const preto = def.perfil === "preto";
    P.acess = { cabelo: def.acess.cabelo !== false, rabo: !!def.rabo, chapeu: def.acess.chapeu || 0, colete: !!def.acess.colete, mochila: !!def.acess.mochila, garrafa: !!def.acess.garrafa, radio: !!def.acess.radio, logoCostas: true, logoPeito: true, bastao: false };
    if(preto){ P.cor.camisa = P.cor.manga = 0x39422f; }
    P.role = "icm"; P.nomeICM = def.nome;
    P.hotspot = { id: "icm-" + def.id, x: P.x, z: P.z, r: 3.2 * U, rotulo: () => "Conversar com " + def.nome.split(" ")[0], acao: () => abreDialogo(P), peca: undefined };
    cen.hotspots.push(P.hotspot);
  }
  function criaEquipeEst(){
    const E = cen.estac, V = M.camionetes, lista = []; const defs = EQUIPE.filter(d => d.onde === "est");
    const [cx, cz] = E.PKW(84, 36);
    defs.forEach((d, i) => { const P = aloca(); if(!P) return; aplicaICM(P, d); const a = i / defs.length * 6.28 + .4, rr = rnd(3.6, 6.4); P.x = cx + Math.cos(a) * rr; P.z = cz + Math.sin(a) * rr; P.y = cen.chao(P.x, P.z, 1e9); P.yaw = Math.atan2(cx - P.x, cz - P.z); P.home = [P.x, P.z]; P.modo = pick(d.modos); P.tModo = rnd(3, 8); P.est = "slot"; P.tEst = rnd(40, 110); lista.push(P); });
    const g = novoGrupo("equipe", null, 1, 0, lista); g.estado = "parado"; g.icmEq = true; g.est = true; g.centro = [cx, cz]; equipes.est = g; void V; return g;
  }
  function criaEquipeTrilha(){
    const defs = EQUIPE.filter(d => d.onde === "trilha"), lista = [];
    defs.forEach(d => { const P = aloca(); if(P){ aplicaICM(P, d); lista.push(P); } });
    if(lista.length < 3){ lista.forEach(libera); return null; }
    lista.forEach((P, i) => { P.back = i * 3.4; P.lat = P.latAlvo = (i - 1) * 1.3; P.s = -P.back; P.vOff = 0; P.modo = "anda"; });
    const g = novoGrupo("equipe", PATHS[0], 1, 3, lista); g.icmEq = true; g.v = 3.5; g.ronda = { voltas: 0 }; g.prox = proxMirante(g); lista.forEach(P => { P.s = Math.max(0, g.s - P.back); snap(P, g); });
    equipes.trilha = g; return g;
  }
  function equipeTrilha(g, dt, J, E){
    g.tCheca = (g.tCheca || 0) - dt; if(g.tCheca > 0) return; g.tCheca = 1.5;
    const L = g.membros[0]; if(!L) return;
    /* saúda quem cruza */
    grupos.forEach(o => { if(o === g || o.icmEq || !o.membros.length) return; const a = o.membros[0]; if(Math.hypot(a.x - L.x, a.z - L.z) < 9 * U && (g.saudou || 0) < tempo - 14){ g.saudou = tempo; const P = g.membros[1 % g.membros.length]; P.modo = "acena"; P.tModo = 2.5; fala(P, F.fala(F.ICMBIO_RONDA.saudacao), 4.5, 16 * U); } });
    /* alguém perto demais da borda? (visitantes passam por trechos de trilha perto do vão) */
    if((g.avisoBorda || 0) < tempo - 60) for(const o of grupos){ if(o === g || o.icmEq) continue; const P = o.membros.find(p => p.ativo && Math.hypot(p.x - L.x, p.z - L.z) < 14 * U && Z.maisPerto(p.x, p.z, cen.campo.BORDA_PTS).d < 24); if(P){ g.avisoBorda = tempo; const M2 = g.membros[2 % g.membros.length]; M2.modo = "apontar"; M2.tModo = 3; fala(M2, F.fala(F.ICMBIO_RONDA.borda), 4.5, 16 * U); break; } }
    /* recolhe lixo de vez em quando (anda parado 3 s) */
    if(g.estado === "andando" && Math.random() < .03 && (g.lixo || 0) < tempo - 90){ g.lixo = tempo; const P = g.membros[1 % g.membros.length]; P.modo = "abaixa"; P.tModo = 2.8; fala(P, F.fala(F.ICMBIO_RONDA.lixo), 3.5, 14 * U); }
  }

  /* equipe parada ao lado das camionetes: animações, entrar na camionete e sair, partir no fim do dia */
  function atualizaEquipeEst(g, dt, J, E){
    const V = M.camionetes;
    g.membros.forEach(P => {
      if(!P.ativo) return;
      P.tEst -= dt;
      if(P.est === "slot"){
        P.vel = 0; P.focoYaw = Math.atan2(g.centro[0] - P.x, g.centro[1] - P.z) + Math.sin(P.seed) * .6; P.yaw += ang(P.focoYaw - P.yaw) * Math.min(1, dt * 3);
        if(!P.hotspot.falando && (P.tModo -= dt) < 0){ P.modo = pick(P.icm.modos); P.tModo = rnd(4, 10); if(P.modo === "apontar"){ const m = PATHS[0].pts[0]; P.yaw = Math.atan2(m[0] - P.x, m[1] - P.z); } }
        if(P.tEst < 0 && !equipes.estSaindo && Math.random() < .5){ const i = Math.floor(Math.random() * V.lista.length); P.est = "indo"; P.alvoXZ = V.porta(i, -1); P.truck = i; P.modo = "anda"; }
        else if(P.tEst < 0) P.tEst = rnd(30, 80);
      } else if(P.est === "indo" || P.est === "volta" || P.est === "saindo"){
        const al = P.alvoXZ, dx = al[0] - P.x, dz = al[1] - P.z, d = Math.hypot(dx, dz), v = 4 * U / 2.94 * 1.0; P.vel = v;
        P.yaw += ang(Math.atan2(dx, dz) - P.yaw) * Math.min(1, dt * 6); P.modo = "anda"; P.fase += dt * 6.5; P.x += dx / (d || 1) * v * dt; P.z += dz / (d || 1) * v * dt;
        if(d < 1.2){ if(P.est === "indo"){ P.est = "dentro"; P.oculto = true; P.tEst = rnd(8, 15); } else if(P.est === "saindo"){ P.oculto = true; P.fimDia = true; } else { P.est = "slot"; P.vel = 0; P.modo = "idle"; P.tEst = rnd(40, 110); P.tModo = 2; } }
      } else if(P.est === "dentro"){ if(P.tEst < 0){ P.oculto = false; const i = P.truck, pp = V.porta(i, -1); P.x = pp[0]; P.z = pp[1]; P.est = "volta"; P.alvoXZ = P.home; } }
      P.yTick -= dt; if(P.yTick <= 0){ P.y = cen.chao(P.x, P.z, 1e9); P.yTick = .12; }
      if(P.hotspot){ P.hotspot.x = P.x; P.hotspot.z = P.z; }
    });
    if(equipes.estSaindo && g.membros.every(P => !P.ativo || P.fimDia || P.oculto && P.est !== "dentro")){ g.fim = true; }
    if(equipes.estSaindo) g.membros.forEach(P => { if(P.est === "slot" || P.est === "volta"){ P.est = "saindo"; P.alvoXZ = V.porta(Math.floor(Math.random() * V.lista.length), -1); } });
  }

  /* ---------- diálogo com a equipe ---------- */
  function abreDialogo(P){
    if(!uiRaiz || dialogo) return; const def = P.icm || P.dialogoDef; if(!def) return;
    /* `def` do ICMBio usa TEMAS/resposta; funcionários de outros serviços (bombeiro civil) trazem temas e resposta(id) próprios */
    const ehICM = !!P.icm, temas = ehICM ? TEMAS : def.temas, responde = (id) => ehICM ? resposta(def, id, def.perfil === "ronda" ? relatoDoDia() : "") : def.resposta(id), saudacao = ehICM ? def.tique + "tudo bem? Em que posso ajudar?" : def.saudacao, rodape = ehICM ? " · ICMBio · Parque Nacional da Serra Geral" : (def.rodape || "");
    M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    const g = P.g; if(g){ g.estado = g.est ? g.estado : "dialogo"; g.dialogoAtivo = true; g.t = 0; }
    if(P.hotspot) P.hotspot.falando = true; P.modoAntes = P.modo; P.modo = "idle"; if(J0) P.yaw = Math.atan2(J0.x - P.x, J0.z - P.z); P.conversando = true;
    const FONTE = "font:600 13px ui-monospace,Consolas,'Courier New',monospace;color:#c9d28a;";
    const el = document.createElement("div"); el.style.cssText = "position:absolute;left:50%;bottom:3%;transform:translateX(-50%);width:min(560px,94%);max-height:86%;overflow:auto;z-index:42;pointer-events:auto;border:2px solid #e0883a;border-radius:16px;background:linear-gradient(170deg,#1b1d15,#23261b);padding:14px;box-shadow:0 0 40px rgba(224,136,58,.35);" + FONTE;
    el.addEventListener("pointerdown", e => e.stopPropagation());
    const cab = document.createElement("div"); cab.style.cssText = "color:#e0883a;text-transform:uppercase;letter-spacing:.6px;font-size:14px;"; cab.textContent = def.nome; el.appendChild(cab);
    const fn = document.createElement("div"); fn.style.cssText = "color:#8f9a5c;font-size:11px;margin-bottom:8px;"; fn.textContent = def.funcao + rodape; el.appendChild(fn);
    const txt = document.createElement("div"); txt.style.cssText = "background:rgba(250,248,240,.95);color:#1f1d16;border-radius:12px;padding:10px 12px;line-height:1.45;font:600 14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin-bottom:10px;min-height:44px;"; txt.textContent = saudacao; el.appendChild(txt);
    const op = document.createElement("div"); op.style.cssText = "display:grid;gap:6px;"; el.appendChild(op);
    const BT = "cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;text-align:left;border:1.5px solid #3a3f27;border-radius:10px;background:rgba(18,19,14,.8);color:#e9efc0;padding:9px 12px;" + FONTE + "font-size:13px;";
    temas.forEach(([id, rot], i) => { const b = document.createElement("div"); b.style.cssText = BT; b.textContent = (i + 1) + ". " + rot; b.setAttribute("role", "button");
      b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if(id === "tchau"){ txt.textContent = ehICM ? resposta(def, "tchau") : (def.tchau || "Até mais!"); if(ehICM) marca(def); setTimeout(fecha, 900); return; } txt.textContent = responde(id); if(ehICM) marca(def); }); op.appendChild(b); });
    uiRaiz.appendChild(el);
    dialogo = { el, P, def };
    function fecha(){ if(!dialogo) return; el.remove(); dialogo = null; if(P.hotspot) P.hotspot.falando = false; P.conversando = false; if(g){ g.dialogoAtivo = false; if(!g.est){ g.estado = "andando"; g.t = 0; P.modo = "anda"; } } else if(P.modoAntes) P.modo = P.modoAntes; }
    dialogo.fecha = fecha;
  }
  const falouCom = new Set((() => { try{ return JSON.parse(localStorage.getItem("sgv:icm") || "[]"); }catch(_){ return []; } })());
  function marca(def){ if(falouCom.has(def.id)) return; falouCom.add(def.id); try{ localStorage.setItem("sgv:icm", JSON.stringify([...falouCom])); }catch(_){ /* sem armazenamento */ } if(M.conquistas) M.conquistas.progresso("amigo", falouCom.size, EQUIPE.length, "Amigo do Parque", "Você conversou com toda a equipe do ICMBio!"); }
  function relatoDoDia(){
    const n = M.nevoa.estado.n, F2 = M.fauna.estado, partes = [];
    partes.push(n > 1.2 ? "Hoje a neblina encheu o cânion." : n > .5 ? "Tem neblina no fundo do cânion." : "Hoje o cânion amanheceu limpo.");
    const viu = Object.keys(F2).filter(k => F2[k].total > 0).map(k => ({ lobo: "lobo-guará", puma: "leão-baio", graxaim: "graxaim", veado: "veado-campeiro", quati: "quati", gamba: "gambá", lontra: "lontra" }[k]));
    if(viu.length) partes.push("Hoje avistamos: " + viu.join(", ") + ".");
    const pop = contaPessoas(); partes.push(pop > 25 ? "O movimento de visitantes está grande." : pop > 6 ? "O movimento de visitantes está moderado." : "Está bem tranquilo de visitantes.");
    return "Na ronda de hoje: " + partes.join(" ");
  }
  const fechaDialogo = () => { if(dialogo){ dialogo.fecha(); return true; } return false; };

  /* ---------- população ---------- */
  function alvoPopulacao(E){
    const h = E.h; let n = pesoHora(GENTE.populacao.map(p => p), h); const dow = ciclo.diaSemana(); if(dow === 0 || dow === 6) n *= GENTE.fimDeSemana; return Math.round(n);
  }
  const escolarPermitido = (E) => GENTE.escolar.dias.includes(ciclo.diaSemana()) && E.h >= GENTE.escolar.de && E.h <= GENTE.escolar.ate;
  function gerencia(J, E){
    const alvo = alvoPopulacao(E), atual = contaPessoas();
    /* quem deve sair: horário do parque (cada grupo tem a sua hora de saída entre voltaIni e fecha), excesso de gente, escola fora do horário */
    const h = E.h, fechado = h >= PARQUE.fecha || h < PARQUE.abre;
    grupos.forEach(g => { if(g.saindo || g.icmEq || g.staff) return;
      if(g.saidaH === undefined) g.saidaH = rnd(PARQUE.voltaIni, PARQUE.fecha - .05);
      const hora = fechado || (h >= g.saidaH && h < PARQUE.abre + 12 + 6);
      if(hora || (atual > alvo + 6 && g.tipo !== "parado" && Math.random() < .25) || (g.tipo === "escolar" && !escolarPermitido(E))){ g.saindo = true; if(g.path){ g.dir = -1; g.prox = null; } else if(g.parado) g.parado.ate = 0; } });
    /* depois de fechar: quem não está à vista some (já foi embora); passada a tolerância, também os que estão longe do jogador */
    if(h >= PARQUE.fecha && h < PARQUE.fecha + 8) grupos.forEach(g => { if(!g.saindo || g.icmEq || g.staff || g.fim) return; const c0 = g.membros.find(p => p.ativo && !p.oculto); if(!c0) return; cp.set(c0.x, c0.y + 3, c0.z); const longe = !J || Math.hypot(c0.x - J.x, c0.z - J.z) > (h > PARQUE.fecha + PARQUE.limiteSaida ? 60 * U : 160); if(longe && !fr.containsPoint(cp)) g.fim = true; });
    if(atual < alvo - 2 && atual < GENTE.max - 20 && h >= PARQUE.abre && h < PARQUE.voltaIni){
      let tipo = pick(["solo", "casal", "casal", "familia", "familia", "guiado", "parado"]);
      if(escolarPermitido(E) && nGrupos("escolar") < GENTE.escolar.max && Math.random() < .35) tipo = "escolar"; else if(tipo === "guiado" && Math.random() > GENTE.guiado.chance * 2) tipo = "familia";
      if(tipo === "parado"){ if(nGrupos("parado") < 3 && E.h > 8 && E.h < 19) criaGrupoParado(); return; }
      const pi = Math.random() < .55 ? 0 : Math.random() < .75 ? 1 : 2, path = PATHS[pi], inicio = Math.random() < .5;
      for(let k = 0; k < 8; k++){
        const s = inicio ? rnd(0, 10) : rnd(30, path.len - 40), q = amostra(path, s); const longe = !J || Math.hypot(q.x - J.x, q.z - J.z) > 180;
        cp.set(q.x, cen.chao(q.x, q.z, 1e9) + 3, q.z); if(longe && !fr.containsPoint(cp)){ criaGrupoTrilha(tipo, pi, Math.random() < .5 ? 1 : -1, s); return; }
      }
    }
  }
  function gerenciaEquipes(E){
    const h = E.h, ini = 7.5, fimE = 18, iniT = 8.0, fimT = 17.5;
    if(h >= ini && h < fimE){ if(!equipes.est){ equipes.estSaindo = false; criaEquipeEst(); } else equipes.estSaindo = false; }
    else if(equipes.est && !equipes.estSaindo) equipes.estSaindo = true;
    if(h >= iniT && h < fimT){ if(!equipes.trilha && !equipes.trilhaPend) criaEquipeTrilha(); }
    else if(equipes.trilha && !equipes.trilha.saindo){ equipes.trilha.saindo = true; equipes.trilha.dir = -1; equipes.trilha.prox = null; }
  }

  /* ---------- quadro ---------- */
  function tick(dt, J, E){
    tempo += dt; quadro++; J0 = J;
    cam.updateMatrixWorld(); pm.multiplyMatrices(cam.projectionMatrix, new Matrix4().copy(cam.matrixWorld).invert()); fr.setFromProjectionMatrix(pm); cam.getWorldPosition(cp);
    const camP = cp.clone();
    if(!J){ R.inicia(); R.fim(); baloes.tick(dt, null, cam, 1, 1); return; }
    tSpawn += dt; if(tSpawn > 1.3){ tSpawn = 0; gerenciaEquipes(E); gerencia(J, E); }
    const nev = M.nevoa.estado.n;
    /* animais por perto → reação dos grupos */
    if(M.fauna.animais.length) M.fauna.animais.forEach(a => { if(a.estado === "fugindo" || a.fim) return; grupos.forEach(g => { if(g.estado === "dialogo" || g.reagiu.has(a.id) && tempo - g.reagiu.get(a.id) < 120) return; const c0 = g.membros.find(p => p.ativo && !p.oculto); if(!c0) return; if(Math.hypot(c0.x - a.x, c0.z - a.z) < 20 * U * 1.1 && g.tipo !== "parado" || (g.est && Math.hypot(g.centro[0] - a.x, g.centro[1] - a.z) < 25 * U) || (g.tipo === "parado" && Math.hypot(c0.x - a.x, c0.z - a.z) < 20 * U)){ if(g.est){ g.reagiu.set(a.id, tempo); const P = g.membros.find(p => p.est === "slot" && p.ativo); if(P){ fala(P, F.fala(F.ICMBIO_RONDA.fauna), 4.5, 15 * U); if(a.id === "graxaim"){ const P2 = g.membros.find(p => p !== P && p.est === "slot"); P2 && setTimeout(() => P2.ativo && fala(P2, F.fala(F.ICMBIO_RONDA.graxaim), 4.5, 15 * U), 4200); } } g.membros.forEach(p => { if(p.est === "slot"){ p.modo = "idle"; p.yaw = Math.atan2(a.x - p.x, a.z - p.z); } }); } else reageAnimal(g, a); } }); });
    /* encontro das capivaras com o leão-baio: o guia comenta (uma vez por encontro) */
    { const fa = M.fauna.capi.familia; if(fa && fa.estado === "escondida" && fa.perigoPuma && M.fauna.animais.some(a => a.id === "puma" && !a.fim)){ grupos.forEach(g => { if(!g.guia || g.encontroFalado === fa || g.estado === "dialogo") return; const c0 = g.guia; if(Math.hypot(c0.x - fa.mae.x, c0.z - fa.mae.z) < 22 * U){ g.encontroFalado = fa; g.estado = "observando"; g.t = 0; g.focoX = fa.mae.x; g.focoZ = fa.mae.z; g.obs = { a: fa.mae, linhas: F.ANIMAL.capivaraPuma.map(p => F.fala(p)), i: 0, t: 0, dur: 18 }; g.membros.forEach(P => { if(!P.hotspot){ P.modo = Math.random() < .5 ? "foto" : "idle"; P.tModo = 8; } }); } }); } }
    /* serpente à frente (≈ 6 m): qualquer grupo para, mantém distância e espera a travessia */
    if(M.fauna.serp && M.fauna.serp.lista.length){ M.fauna.serp.lista.forEach(s => { if(s.capturada) return; grupos.forEach(g => { if(g.estado !== "andando" || !g.path) return; const c0 = g.guia || g.membros.find(p => p.ativo && !p.oculto); if(!c0) return; const dx = s.x - c0.x, dz = s.z - c0.z, d = Math.hypot(dx, dz) / U;
        if(d < SERPENTES.dist.espera && (dx * Math.sin(c0.yaw) + dz * Math.cos(c0.yaw)) > 0){ g.estado = "cobra"; g.cobra = s; g.tCobra = 0; g.cobraI = 0; g.cobraFim = null; g.cobraLinhas = null;
          const L = g.tipo === "escolar" ? F.SERPENTE_ESCOLAR[s.id] : F.SERPENTE[s.id]; if(g.guia && L){ g.cobraLinhas = L.map(x => (Array.isArray(x) ? F.fala(x) : x)); g.cobraLinhas.push(g.tipo === "escolar" ? F.SERPENTE_ESCOLAR.comum : F.SERPENTE.comum); }
          g.membros.forEach(P => { if(P.hotspot) return; const r = Math.random(); P.modo = r < .35 ? "foto" : r < .55 ? "apontar" : "idle"; P.tModo = 8; });
          const falante = g.membros.find(p => p.role === "adulto" || p.role === "crianca" || p.role === "aluno"); if(falante && !g.guia) fala(falante, F.fala(g.tipo === "escolar" ? F.ESCOLAR.serpente : F.VISITANTE.serpente), 3.6, 12 * U);
          if(g.icmEq){ const P = g.membros[0]; fala(P, "Pessoal, parados! Deixem a serpente passar com calma.", 4, 15 * U); } } }); }); }
    /* lugares (turfeira / nascente / sapinhos) */
    if(M.vegetacao && quadro % 20 === 0) grupos.forEach(g => { if(g.estado !== "andando" || !g.path) return; const c0 = g.guia || g.membros.find(p => p.ativo && !p.oculto); if(!c0) return; const lg = M.vegetacao.lugarPerto(c0.x, c0.z); if(!lg) return; if(g.reagiuLugar && g.reagiuLugar[lg.tipo] && tempo - g.reagiuLugar[lg.tipo] < 140) return; reageLugar(g, lg.tipo, lg.x, lg.z); });
    /* grupos */
    for(let i = grupos.length - 1; i >= 0; i--){
      const g = grupos[i], c0 = g.membros.find(p => p.ativo) || g.membros[0]; if(!c0){ grupos.splice(i, 1); continue; }
      const d = Math.hypot(c0.x - J.x, c0.z - J.z), passo = d > 800 ? GENTE.atualizaLonge[1] : d > 400 ? GENTE.atualizaLonge[0] : 1;
      g.acc += dt; if(quadro % passo === 0){ const dd = g.acc; g.acc = 0;
        if(g.est) atualizaEquipeEst(g, dd, J, E); else if(g.estado === "carro") atualizaCarro(g, dd, E); else if(g.tipo === "parado") atualizaParado(g, dd, J, E, nev); else atualizaGrupoTrilha(g, dd, J, E, nev); }
      /* sai de cena: longe do jogador e fora de vista (ou fim de percurso) */
      const fora = (g.fim) || (d > 1700 && g.saindo);
      if(g.fim && g.estado === "carro" && g.membros.every(P => !P.ativo || P.oculto)){ g.membros.forEach(libera); grupos.splice(i, 1); continue; }
      if(fora){ const longeOK = d > 160; cp.set(c0.x, c0.y + 3, c0.z); if(longeOK && !fr.containsPoint(cp)){ g.membros.forEach(libera); grupos.splice(i, 1); if(equipes.est === g) equipes.est = null; if(equipes.trilha === g) equipes.trilha = null; } else if(!g.saindo && g.fim) { g.fim = false; g.saindo = true; g.dir = -1; } }
    }
    /* animação e desenho */
    R.inicia();
    POOL.forEach(P => {
      if(!P.ativo || P.oculto) return;
      const dx = P.x - camP.x, dz = P.z - camP.z, d2 = dx * dx + dz * dz; if(d2 > 1400 * 1400) return;
      if(P.hotspot){ P.hotspot.x = P.x; P.hotspot.z = P.z; }
      if(P.modo !== "anda" && P.modo !== "corre" && P.vel > 0) P.vel *= .5;
      poseAlvo(P, 1 / 60 * Math.max(1, Math.min(3, dt * 60)), tempo);
      esf.center.set(P.x, P.y + 3, P.z); esf.radius = 6; if(!fr.intersectsSphere(esf)) return;
      R.escreve(P, d2 < 300 * 300);
    });
    R.fim();
    baloes.tick(dt, J, cam, M.renderer.domElement.clientWidth, M.renderer.domElement.clientHeight);
  }
  function atualizaParado(g, dt, J, E, nev){
    g.membros.forEach(P => { if(!P.ativo) return; P.vel = 0; if((P.tModo -= dt) < 0){ P.modo = pick(["conversa", "conversa", "idle", "foto", "apontar"]); P.tModo = rnd(4, 10); const a = Math.atan2(g.parado.cx - P.x, g.parado.cz - P.z); P.yaw += ang(a - P.yaw) * .8; } P.yTick -= dt; if(P.yTick <= 0){ P.y = cen.chao(P.x, P.z, 1e9); P.yTick = .5; } if(J) conversaAmbiente(P, g, E, J, dt, nev); });
    if(g.reagiuAniml) return;
    if(g.saindo){ vaiParaCarro(g); return; }
    if(tempo > g.parado.ate || g.saindo){ /* vai embora: junta-se à trilha a partir do início */
      const pi = 0, path = PATHS[pi], lista = g.membros; const ini = path.pts[0];
      const t0 = amostra(path, 0); lista.forEach(P => { P.back = rnd(0, 6); P.s = 0; P.lat = P.latAlvo = rnd(-2, 2); P.vOff = 0; P.modo = "anda"; });
      /* reposiciona na entrada da trilha (a pé, sem salto visível: só se fora de vista) */
      const lonje = Math.hypot(ini[0] - (J ? J.x : 0), ini[1] - (J ? J.z : 0)) > 80; void t0;
      if(lonje || g.saindo){ g.tipo = lista.length > 1 ? "casal" : "solo"; g.path = path; g.dir = 1; g.s = 2; g.estado = "andando"; g.prox = proxMirante(g); g.parado = null; lista.forEach(P => { snap(P, g); }); }
      else g.parado.ate = tempo + 20;
    }
  }

  /* ---------- API ---------- */
  return {
    tick, grupos, POOL, baloes, PATHS, amostra, equipes,
    /* pessoas "de serviço" (bombeiro civil, resgate, vítima e acompanhantes): fora dos grupos, comandadas por resgate/emergencia.js */
    alocaStaff(){ const P = aloca(); if(P){ P.staff = true; } return P; }, liberaStaff: libera, aplicaAparencia: aparencia, abreDialogo,
    /* grupos de trilha perto de (x,z) param e abrem espaço por `seg` s */
    cedeEspaco(x, z, raio, seg = 6){ let n = 0; grupos.forEach(g => { if(!g.path || g.staff || g.estado === "dialogo" || g.estado === "carro") return; if(g.membros.some(P => P.ativo && !P.oculto && Math.hypot(P.x - x, P.z - z) < raio)){ g.cede = Math.max(g.cede || 0, seg); g.cedeFoco = [x, z]; n++; } }); return n; },
    gruposPerto(x, z, raio){ return grupos.filter(g => g.membros.some(P => P.ativo && !P.oculto && Math.hypot(P.x - x, P.z - z) < raio)); },
    liga(ui){ uiRaiz = ui; baloes.liga(ui); }, desliga(){ fechaDialogo(); baloes.desliga(); uiRaiz = null; },
    dialogoAberto: () => !!dialogo, fechaDialogo,
    /* conflito natural / aves (silêncio da mata, lobo×leão-baio, gralhas, quero-quero): guias explicam, visitantes comentam; devolve quantos grupos reagiram */
    reageFauna(tipo, x, z, raioM){ let n = 0; grupos.forEach(g => { if(g.estado !== "andando" || !g.path) return; const c0 = g.guia || g.membros.find(p => p.ativo && !p.oculto); if(!c0 || Math.hypot(c0.x - x, c0.z - z) > raioM * U) return; if(g.reagiuLugar && g.reagiuLugar[tipo] && tempo - g.reagiuLugar[tipo] < 90) return;
      if(g.guia || g.tipo === "escolar" || g.icmEq) reageLugar(g, tipo, x, z); else { g.reagiuLugar = g.reagiuLugar || {}; g.reagiuLugar[tipo] = tempo; const P = g.membros.find(p => p.ativo && !p.oculto), L = F.AVES.visitante[tipo]; if(P && L) setTimeout(() => P.ativo && fala(P, F.fala(L), 3.6, 14 * U), rnd(500, 2200)); } n++; }); return n; },
    pessoasPerto(x, z, r, L){ const r2 = r * r; POOL.forEach(P => { if(!P.ativo || P.oculto) return; const dx = P.x - x, dz = P.z - z; if(dx * dx + dz * dz < r2) L.push({ x: P.x, z: P.z, corre: P.modo === "corre", vx: Math.sin(P.yaw), vz: Math.cos(P.yaw), npc: true }); }); return L; },
    observadores(J, r){ const L = []; grupos.forEach(g => { const c = g.membros.find(p => p.ativo && !p.oculto); if(!c) return; if(Math.hypot(c.x - J.x, c.z - J.z) < r){ let sx = 0, sz = 0, n = 0; g.membros.forEach(p => { if(p.ativo && !p.oculto){ sx += p.x; sz += p.z; n++; } }); if(n) L.push({ x: sx / n, z: sz / n, tipo: "grupo", g }); } }); return L; },
    pontosMapa(J, raioVisao){ const L = []; grupos.forEach(g => { let sx = 0, sz = 0, n = 0; g.membros.forEach(p => { if(p.ativo && !p.oculto){ sx += p.x; sz += p.z; n++; } }); if(n) L.push({ x: sx / n, z: sz / n, icm: !!g.icmEq, n }); }); return L; },
    reageCeu, reageVento, reageLugar, reageAnimal, contaPessoas, aoSalto(){ grupos.slice().forEach(g => { g.membros.forEach(libera); }); grupos.length = 0; equipes.est = equipes.trilha = null; baloes.limpa(); fechaDialogo(); },
    mirantes: mirantesTodos, fala, relatoDoDia, equipePosicoes: () => POOL.filter(p => p.ativo && p.icm).map(p => ({ id: p.icm.id, x: p.x, z: p.z, nome: p.icm.nome, oculto: p.oculto })),
    info(){ return "Gente: " + contaPessoas() + " visitantes · " + grupos.length + " grupos · alvo " + (J0 ? "" : "") + "" ; },
    teletransporteEquipe(kind){ if(kind === "est"){ const p = M.camionetes.frente(1, -22); return [p[0] + 14, p[1]]; } const g = equipes.trilha; if(g){ const P = g.membros[0]; return [P.x - Math.sin(P.yaw) * 16, P.z - Math.cos(P.yaw) * 16]; } return null; }
  };
}
