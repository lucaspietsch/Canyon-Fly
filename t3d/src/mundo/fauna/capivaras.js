import { Mesh, RingGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, Plane, Vector3, Color, DoubleSide } from "three";
import { U, FAUNA, CAPIVARAS, ESPECIES, pesoHora } from "../config.js";
import { Animal, rnd, angDif, pick } from "./animal.js";

/* ============================================================================================================
   FAMÍLIA DE CAPIVARAS (1 adulta + 3 filhotes) — margens e poços do arroio
   Normal: a mãe lidera em fila solta (filhotes atrás e ao lado, um ou outro correndo para alcançar); caminha pela margem, pasta, entra e sai da água rasa, nada, se sacode e deita.
   Perigo (pessoa a < 8 m, ou leão-baio a ≤ 40 m): a mãe levanta a cabeça, solta o latido de alerta, os filhotes correm para ela e a família entra na água e se esconde
   mergulhada até só ficar o topo da cabeça (olhos, orelhas e narinas na linha d'água), em ~1 s e sem teleporte. Sai quando o perigo passa de 60 m e passa o tempo de espera.
   Ninguém é atacado: o leão-baio só passa, olha a água e segue. A parte submersa é cortada por um plano de recorte na altura da água (não aparece através dela).
   ============================================================================================================ */

const DEF = {
  clonar: true, alertaSeg: [1.2, 1.2], alertaMax: 99, aposAlerta: "natural",
  pose: { neutroPesc: 1.3, neutroCab: .3, altoPesc: .8, baixoPesc: 2.0, cauda: 0, caudaAlerta: 0, caudaFuga: 0, perna: .26 },
  atividades: () => [["andar", 1]], durs: {}, destino: () => null
};

/* ---------------- efeitos de água: anéis, respingos e rastro em V ---------------- */
export function criarFxAgua(M){
  const g = M.cen.grupo, aneis = [], gotas = [], tmp = new Vector3();
  const geoA = new RingGeometry(.82, 1, 28), matA = () => new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, fog: true });
  for(let i = 0; i < 32; i++){ const m = new Mesh(geoA, matA()); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 6; g.add(m); aneis.push({ m, t: 0, dur: 0 }); }
  const geoG = new SphereGeometry(.2, 5, 4), matG = new MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: .85, depthWrite: false });
  for(let i = 0; i < 48; i++){ const m = new Mesh(geoG, matG); m.visible = false; m.renderOrder = 7; g.add(m); gotas.push({ m, vx: 0, vy: 0, vz: 0, t: 0, y0: 0, vivo: false }); }
  let ia = 0, ig = 0;
  return {
    anel(x, y, z, tam = 4, dur = 1.6, op = .55){ const a = aneis[ia++ % aneis.length]; a.t = 0; a.dur = dur; a.tam = tam; a.op = op; a.m.position.set(x, y + .1, z); a.m.visible = true; },
    respingo(x, y, z, n = 10, forca = 7){ for(let i = 0; i < n; i++){ const p = gotas[ig++ % gotas.length], a = Math.random() * 6.28, v = Math.random() * forca * .6; p.vx = Math.cos(a) * v; p.vz = Math.sin(a) * v; p.vy = forca * (.6 + Math.random() * .8); p.t = 0; p.y0 = y; p.m.position.set(x, y + .2, z); p.m.scale.setScalar(.6 + Math.random() * .9); p.m.visible = true; p.vivo = true; } },
    tick(dt){
      aneis.forEach(a => { if(!a.m.visible) return; a.t += dt; const k = a.t / a.dur; if(k >= 1){ a.m.visible = false; return; } a.m.scale.setScalar(.6 + k * a.tam); a.m.material.opacity = a.op * (1 - k) * (k < .12 ? k / .12 : 1); });
      gotas.forEach(p => { if(!p.vivo) return; p.t += dt; p.vy -= 22 * dt; tmp.copy(p.m.position); p.m.position.set(tmp.x + p.vx * dt, tmp.y + p.vy * dt, tmp.z + p.vz * dt); if(p.m.position.y < p.y0 || p.t > 1.4){ p.vivo = false; p.m.visible = false; } });
    }
  };
}

/* rastro em V na superfície enquanto nada */
function criaRastro(g){
  const geo = new BufferGeometry(), v = [0, 0, 0, -1.4, 0, -5.5, -2, 0, -5.4, 0, 0, 0, 1.4, 0, -5.5, 2, 0, -5.4];
  geo.setAttribute("position", new Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
  const m = new Mesh(geo, new MeshBasicMaterial({ color: 0xf2faff, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide })); m.visible = false; m.renderOrder = 6; g.add(m); return m;
}

function latido(){
  try{ const AC = window.AudioContext || window.webkitAudioContext; const ac = (latido.ac = latido.ac || new AC()), t = ac.currentTime;
    for(let k = 0; k < 2; k++){ const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = "sawtooth"; o.frequency.setValueAtTime(380 - k * 40, t + k * .13); o.frequency.exponentialRampToValueAtTime(210, t + k * .13 + .11); f.type = "lowpass"; f.frequency.value = 900; g.gain.setValueAtTime(0, t + k * .13); g.gain.linearRampToValueAtTime(.16, t + k * .13 + .015); g.gain.exponentialRampToValueAtTime(.001, t + k * .13 + .12); o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t + k * .13); o.stop(t + k * .13 + .14); }
  }catch(_){ /* sem áudio */ }
}

class Capivara extends Animal {
  constructor(ctx, papel, x, z, yaw, fam, idx, fx){
    const filhote = papel === "filhote", def = { ...DEF, variante: () => (filhote ? "capivaraFilhote" : "capivara"), escala: filhote ? .26 + idx * .02 : 1 };
    super(def, ESPECIES.capivara, ctx, x, z, yaw);
    this.papel = papel; this.fam = fam; this.idx = idx; this.fx = fx; this.submersa = 0; this.molhado = 0; this.yv = this.y; this.emAgua = false; this.nada = false; this.plano = new Plane(new Vector3(0, 1, 0), -1e5);
    this.dEsc = def.escala; this.meta = null; this.vMeta = 0; this.offX = 0; this.offZ = 0; this.sacode = 0; this.rastro = null;
    this.corBase = this.rig.materiais.map(m => m.color.clone()); this.rig.materiais.forEach(m => { m.clippingPlanes = [this.plano]; });
    this.estado = "natural"; this.ativ = "parar"; this.duracao = 1e9;
    if(filhote){ this.rig.cab.scale.setScalar(1.18); }
  }
  vai(dt, c, al, v, giro = 3){
    const dx = al[0] - this.x, dz = al[1] - this.z, d = Math.hypot(dx, dz); this.yaw += angDif(this.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * giro);
    this.vel += ((d < 1.2 * U ? 0 : v) - this.vel) * Math.min(1, dt * 4);
    const nx = this.x + Math.sin(this.yaw) * this.vel * dt, nz = this.z + Math.cos(this.yaw) * this.vel * dt;
    if(c.livre(nx, nz, .8, 10)){ this.x = nx; this.z = nz; } else this.vel *= .5; return d;
  }
  /* a Familia manda; aqui só altura/água/efeitos */
  atualizaAgua(dt, c){
    const ag = c.agua(this.x, this.z), piso = c.chao(this.x, this.z), prof = ag.dentro ? ag.y - piso : 0, antes = this.emAgua, e = this.dEsc;
    this.emAgua = ag.dentro; this.aguaY = ag.y;
    const alt = this.rig.hip * U * e;
    const fundo = prof > 1.2 * e * 3 || this.escondeAlvo;                        // fundo o bastante para nadar
    this.nada = ag.dentro && prof > alt * .8;
    /* altura de repouso, nado (só o dorso para fora) ou escondida (só a cabeça) */
    let yAlvo = piso;
    if(this.nada){ const costas = (this.rig.hip + .27) * U * e; yAlvo = ag.y + .1 - costas; }
    if(this.nada && this.esconde){ this.rig.root.position.y = this.yv; this.rig.root.updateMatrixWorld(true); const hw = new Vector3(); this.rig.olhos[0].getWorldPosition(hw); const dh = hw.y - this.rig.root.position.y; yAlvo = ag.y + .02 - dh; }
    const k = 1 - Math.exp(-dt * 3.2);                                          // ~1 s para afundar/subir, sem teleporte
    this.yv += (yAlvo - this.yv) * k;
    this.submersa = this.nada ? (this.esconde ? 1 : .55) : 0;
    this.y = this.yv;
    /* recorte da água */
    this.plano.constant = ag.dentro ? -ag.y : -1e5;
    /* respingos ao entrar/sair e anéis ao nadar */
    if(antes !== this.emAgua){ this.fx.respingo(this.x, ag.y, this.z, this.papel === "mae" ? 14 : 8, 6); this.fx.anel(this.x, ag.y, this.z, this.papel === "mae" ? 7 : 4, 1.8); if(!this.emAgua) this.molhado = 1; else this.molhado = Math.max(this.molhado, .7); }
    this.tAnel = (this.tAnel || 0) - dt; if(this.tAnel < 0 && this.emAgua){ this.tAnel = this.esconde ? rnd(.9, 1.5) : rnd(.35, .7) / Math.max(.3, Math.min(1, this.vel / U)); this.fx.anel(this.x, ag.y, this.z, this.esconde ? 3 : 4.4, this.esconde ? 2.2 : 1.5, this.esconde ? .4 : .5); }
    /* rastro em V */
    if(!this.rastro){ this.rastro = criaRastro(this.rig.root.parent || c.pai); }
    const nadando = this.nada && this.vel > .8 * U * .5 && !this.esconde;
    this.rastro.visible = nadando || this.rastro.material.opacity > .02; this.rastro.position.set(this.x, ag.y + .1, this.z); this.rastro.rotation.y = this.yaw; this.rastro.scale.setScalar(this.dEsc === 1 ? 1 : .55);
    this.rastro.material.opacity += ((nadando ? .45 : 0) - this.rastro.material.opacity) * Math.min(1, dt * 3);
    /* pelo molhado: mais escuro e brilhante por um tempo depois de sair */
    this.molhado = Math.max(0, this.molhado - (this.emAgua ? 0 : dt / 32));
    const w = this.molhado; this.rig.materiais.forEach((m, i) => { m.color.copy(this.corBase[i]).multiplyScalar(1 - .38 * w); m.roughness = 1 - .7 * w; });
    void fundo;
  }
  aplica(c){
    const r = this.rig, L = r.comprimento * U * .4 * this.dEsc, sx = Math.sin(this.yaw), cz = Math.cos(this.yaw);
    r.root.position.set(this.x, this.y, this.z); r.root.rotation.y = this.yaw;
    if(this.submersa < .1){ const yF = c.chao(this.x + sx * L, this.z + cz * L), yB = c.chao(this.x - sx * L, this.z - cz * L); r.corpo.rotation.x = Math.atan2(yB - yF, L * 2) * .9 - this.p.sentar * .5; }
    else r.corpo.rotation.x = this.esconde ? -.45 : -.1;                         // escondida: focinho para cima, o dorso fica abaixo da linha d'água
    if(this.sacode > 0){ r.corpo.rotation.z = Math.sin(this.sacode * 38) * .16 * Math.min(1, this.sacode * 2); r.root.rotation.y += Math.sin(this.sacode * 30) * .08; }
  }
  libera(){ super.libera(); if(this.rastro){ this.rastro.parent && this.rastro.parent.remove(this.rastro); this.rastro = null; } }
}

/* ============================================================================================================ */
export function criarCapivaras(M, ctx, Z, fauna){
  const fx = criarFxAgua(M), cen = M.cen, ZA = Z.ZONAS.agua, A = cen.rios.ARROIO;
  M.renderer.localClippingEnabled = true; ctx.agua = (x, z) => cen.agua(x, z); ctx.pai = cen.grupo;
  let fam = null, cooldown = 0, relogio = 0;

  const poco = (x, z) => { let m = null, d = 1e9; cen.pocos.forEach(p => { const dd = Math.hypot(p.x - x, p.z - z); if(dd < d){ d = dd; m = p; } }); return { p: m, d }; };

  function cria(x, z, yaw){
    const lista = [], f = { estado: "normal", atividade: "parar", tAtiv: 0, durAtiv: 4, membros: lista, mae: null, t: 0, vida: 0, duracao: rnd(CAPIVARAS.duracao[0], CAPIVARAS.duracao[1]), perigo: 0, tSeguro: 0, ameaca: null, pocoAlvo: null, saindo: [], escondeInicio: 0, lado: Math.random() < .5 ? 1 : -1, dir: Math.random() < .5 ? 1 : -1, fim: false, escondida: false, alertaT: 0, latiu: false };
    const mae = new Capivara(ctx, "mae", x, z, yaw, f, 0, fx); lista.push(mae); f.mae = mae;
    for(let i = 0; i < 3; i++){ const a = Math.random() * 6.28, fi = new Capivara(ctx, "filhote", x - Math.sin(yaw) * (3 + i * 1.6) + Math.cos(a), z - Math.cos(yaw) * (3 + i * 1.6) + Math.sin(a), yaw, f, i + 1, fx); fi.offX = (i % 2 ? 1 : -1) * rnd(1.2, 2.4); fi.offZ = -(2.2 + i * 1.7); lista.push(fi); }
    lista.forEach(a => { cen.grupo.add(a.rig.root); fauna.animais.push(a); fauna.estado.capivara.ativos.push(a); a.fim = false; });
    fauna.estado.capivara.total++; if(M.fotos && M.fotos.aoSpawn) M.fotos.aoSpawn(mae);
    return f;
  }

  /* ponto da margem (a 5–9 u do eixo do riacho) a uma distância ao longo dele */
  function pontoMargem(a, passo){
    const L = A; let k = 0, md = 1e9; L.forEach((p, i) => { const d = Math.hypot(p[0] - a.x, p[1] - a.z); if(d < md){ md = d; k = i; } });
    for(let t = 0; t < 10; t++){ let i = k + fam.dir * (1 + Math.floor(Math.random() * passo)); if(i < 0 || i >= L.length){ fam.dir *= -1; continue; }
      const P = L[i], Q = L[Math.min(L.length - 1, i + 1)], ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]), off = rnd(6, 10), x = P[0] - Math.sin(ang) * off * fam.lado + rnd(-3, 3), z = P[1] + Math.cos(ang) * off * fam.lado + rnd(-3, 3);
      if(ctx.livre(x, z, 1.5, 20)) return [x, z]; }
    return null;
  }
  const bordaPerto = (x, z) => { const ag = cen.agua(x, z); const L = A; let best = null, md = 1e9; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz); if(d < md){ md = d; best = [px, pz]; } } void ag; return { eixo: best, d: md }; };

  function proximos(){ const m = fam.mae; let dmin = 1e9; for(const p of ctx.pessoasRaw){ const d = Math.hypot(p.x - m.x, p.z - m.z) / U; if(d < dmin) dmin = d; } const pumas = fauna.animais.filter(a => a.id === "puma" && !a.fim && a.estado !== "fugindo"); let dp = 1e9, pm = null; pumas.forEach(p => { const d = Math.hypot(p.x - m.x, p.z - m.z) / U; if(d < dp){ dp = d; pm = p; } }); return { dpessoa: dmin, dpuma: dp, puma: pm }; }

  function escolheAtividade(E){
    const h = E.h, quente = h > 11 && h < 15.5, pesos = quente ? [["deitar", 50], ["nadar", 25], ["pastar", 15], ["andar", 10]] : [["andar", 36], ["pastar", 30], ["nadar", 22], ["deitar", 12]];
    const t = pesos.reduce((s, x) => s + x[1], 0); let r = Math.random() * t; for(const [n, w] of pesos){ r -= w; if(r <= 0) return n; } return "pastar";
  }

  function tickFamilia(dt, J, E){
    const m = fam.mae; fam.vida += dt; fam.t += dt;
    const { dpessoa, dpuma, puma } = proximos(), alertaM = CAPIVARAS.alerta;
    /* --------- máquina de estados da família --------- */
    if(fam.estado === "normal"){
      if(dpessoa < alertaM || dpuma < CAPIVARAS.percepcao){ fam.estado = "alerta"; fam.t = 0; fam.latiu = false; fam.ameaca = dpuma < CAPIVARAS.percepcao ? puma : null; fam.alvoPoco = poco(m.x, m.z).p; fam.perigoPuma = dpuma < CAPIVARAS.percepcao; }
      else if(fam.vida > fam.duracao){ fam.estado = "saindoCena"; fam.t = 0; }
    }
    if(fam.estado === "alerta"){
      m.vel *= Math.max(0, 1 - dt * 8); m.ativ = "escutar"; m.estado = "alerta";
      if(!fam.latiu && fam.t > .55){ fam.latiu = true; latido(); }
      if(fam.t > 1.3){ fam.estado = "fuga"; fam.t = 0; m.estado = "fugindo"; if(!fam.alvoPoco){ fam.estado = "normal"; m.estado = "natural"; } }
    }
    if(fam.estado === "fuga"){
      const p = fam.alvoPoco; if(!p){ fam.estado = "normal"; }
      else { const d = m.vai(dt, ctx, [p.x + rnd(-1, 1), p.z + rnd(-1, 1)], CAPIVARAS.trota * U, 5);
        if(d < 3 * U && m.nada || fam.t > 12){ fam.estado = "escondida"; fam.t = 0; fam.tSeguro = 0; fam.centro = [p.x, p.z]; fam.membros.forEach(a => { a.esconde = true; a.estado = "natural"; a.ativ = "parar"; }); } }
    }
    if(fam.estado === "escondida"){
      const m0 = fam.mae; m0.vel *= Math.max(0, 1 - dt * 5);
      const seguro = dpuma > CAPIVARAS.saiAlcance && dpessoa > 12; fam.tSeguro = seguro ? fam.tSeguro + dt : 0;
      const espera = fam.espera || (fam.espera = rnd(CAPIVARAS.escondidaSeg[0], CAPIVARAS.escondidaSeg[1]));
      if(fam.tSeguro > espera){ fam.estado = "saindoAgua"; fam.t = 0; fam.espera = 0; fam.fase = 0; const b = bordaPerto(m0.x, m0.z), pa = fam.alvoPoco || poco(m0.x, m0.z).p; const ax = b.eixo[0] - pa.x, az = b.eixo[1] - pa.z, l = Math.hypot(ax, az) || 1; fam.margem = [pa.x + ax / l * (pa.R + 5), pa.z + az / l * (pa.R + 5)]; m0.esconde = false; }
    }
    if(fam.estado === "saindoAgua"){
      /* a mãe sai primeiro, olha em volta; depois os filhotes, um por vez */
      m.estado = "natural"; const d = m.vai(dt, ctx, fam.margem, CAPIVARAS.anda * U * 1.1, 3);
      if(fam.fase === 0 && d < 2.5 * U){ fam.fase = 1; fam.t1 = fam.t; m.ativ = "escutar"; }
      if(fam.fase === 1){ m.vel *= Math.max(0, 1 - dt * 6); m.ativ = "escutar"; fam.membros.forEach((a, i) => { if(i > 0 && a.esconde && fam.t - fam.t1 > 2 + (i - 1) * 1.6){ a.esconde = false; } }); if(fam.t - fam.t1 > 8){ fam.estado = "normal"; fam.atividade = "sacudir"; fam.tAtiv = 0; fam.durAtiv = 1.6; m.sacode = 1.6; fam.membros.forEach(a => { a.sacode = 1.4; a.molhado = 1; a.estado = "natural"; }); fx_sacudir(); } }
    }
    if(fam.estado === "saindoCena"){
      if(!fam.fugaDir){ const a = Math.atan2(m.x - (J ? J.x : m.x), m.z - (J ? J.z : m.z)) + rnd(-.4, .4); fam.fugaDir = a; }
      m.vai(dt, ctx, [m.x + Math.sin(fam.fugaDir) * 40, m.z + Math.cos(fam.fugaDir) * 40], CAPIVARAS.anda * U * 1.15, 2.5); m.estado = "natural"; m.ativ = "andar";
      if(!m.visivel || fam.t > 40 || (J && Math.hypot(m.x - J.x, m.z - J.z) / U > FAUNA.raioAtivo * .8)) fam.fim = true;
    }
    if(fam.estado === "normal"){
      m.estado = "natural"; fam.tAtiv += dt;
      const at = fam.atividade;
      if(at === "parar"){ if(fam.tAtiv > fam.durAtiv){ fam.atividade = escolheAtividade(E); fam.tAtiv = 0; fam.durAtiv = rnd(6, 14); fam.alvoMae = null; fam.estagio = 0; } m.vel *= Math.max(0, 1 - dt * 5); m.ativ = "escutar"; }
      else if(at === "andar"){ if(!fam.alvoMae){ fam.alvoMae = pontoMargem(m, 3); if(!fam.alvoMae){ fam.atividade = "pastar"; fam.tAtiv = 0; } }
        else { const d = m.vai(dt, ctx, fam.alvoMae, CAPIVARAS.anda * U, 2.4); m.ativ = "andar"; if(d < 2.5 * U || fam.tAtiv > 22){ fam.atividade = Math.random() < .6 ? "pastar" : "parar"; fam.tAtiv = 0; fam.durAtiv = rnd(5, 10); fam.alvoMae = null; } } }
      else if(at === "pastar"){ m.vel *= Math.max(0, 1 - dt * 6); m.ativ = "farejar"; if(fam.tAtiv > fam.durAtiv){ fam.atividade = escolheAtividade(E); fam.tAtiv = 0; fam.durAtiv = rnd(6, 14); fam.alvoMae = null; fam.estagio = 0; } }
      else if(at === "deitar"){ m.vel *= Math.max(0, 1 - dt * 6); m.ativ = "sentar"; if(fam.tAtiv > fam.durAtiv * 1.3){ fam.atividade = "pastar"; fam.tAtiv = 0; fam.durAtiv = rnd(5, 9); } }
      else if(at === "nadar"){
        const pc = poco(m.x, m.z); if(pc.d > 120 || !pc.p){ fam.atividade = "pastar"; fam.tAtiv = 0; }
        else if(fam.estagio === 0){ const d = m.vai(dt, ctx, [pc.p.x + rnd(-2, 2), pc.p.z + rnd(-2, 2)], CAPIVARAS.anda * U * 1.1, 2.6); m.ativ = "andar"; if(d < 3 * U || m.nada){ fam.estagio = 1; fam.tNado = 0; fam.alvoNado = null; } if(fam.tAtiv > 25){ fam.atividade = "pastar"; fam.tAtiv = 0; } }
        else if(fam.estagio === 1){ fam.tNado += dt; if(!fam.alvoNado || Math.hypot(fam.alvoNado[0] - m.x, fam.alvoNado[1] - m.z) < 2 * U){ const a = Math.random() * 6.28, r = rnd(1, pc.p.R * .6); fam.alvoNado = [pc.p.x + Math.cos(a) * r, pc.p.z + Math.sin(a) * r]; } m.vai(dt, ctx, fam.alvoNado, CAPIVARAS.anda * U * .9, 2.2); m.ativ = "andar";
          if(fam.tNado > rnd(9, 15)){ fam.estagio = 2; const b = bordaPerto(m.x, m.z), ax = b.eixo[0] - pc.p.x, az = b.eixo[1] - pc.p.z, l = Math.hypot(ax, az) || 1; fam.alvoSaida = [pc.p.x + ax / l * (pc.p.R + 4), pc.p.z + az / l * (pc.p.R + 4)]; } }
        else if(fam.estagio === 2){ const d = m.vai(dt, ctx, fam.alvoSaida, CAPIVARAS.anda * U * 1.1, 2.6); m.ativ = "andar"; if(d < 2.5 * U || fam.tAtiv > 45){ fam.atividade = "sacudir"; fam.tAtiv = 0; fam.durAtiv = 1.6; m.sacode = 1.6; fam.membros.forEach(a => { if(a.papel === "filhote") a.sacode = 1.2 + Math.random() * .6; }); fx_sacudir(); } }
      }
      else if(at === "sacudir"){ m.vel *= Math.max(0, 1 - dt * 8); m.ativ = "parar"; if(fam.tAtiv > fam.durAtiv){ fam.atividade = "pastar"; fam.tAtiv = 0; fam.durAtiv = rnd(6, 10); } }
    }
    /* --------- filhotes: seguem a mãe em fila solta; um ou outro corre para alcançar --------- */
    const ang = m.yaw, sx = Math.sin(ang), cz = Math.cos(ang);
    fam.membros.forEach((a, i) => {
      if(i === 0) return;
      const esc = fam.estado === "escondida" || fam.estado === "saindoAgua" && a.esconde;
      if(a.esconde && fam.estado !== "alerta"){ /* escondido: colado à mãe */
        const al = [m.x - sx * (1.2 + i * .5) + cz * (i % 2 ? 1.2 : -1.2), m.z - cz * (1.2 + i * .5) - sx * (i % 2 ? 1.2 : -1.2)]; a.vai(dt, ctx, al, CAPIVARAS.trota * U * .6, 5); a.estado = "natural"; a.ativ = "parar"; return; }
      const al = [m.x + sx * a.offZ + cz * a.offX, m.z + cz * a.offZ - sx * a.offX], d = Math.hypot(al[0] - a.x, al[1] - a.z);
      let v = CAPIVARAS.anda * U * (d > 6 ? 1.9 : d > 2.5 ? 1.25 : .8); if(fam.estado === "fuga" || fam.estado === "alerta") v = CAPIVARAS.trota * U * 1.1;
      if(fam.estado === "alerta"){ a.estado = "alerta"; a.ativ = "escutar"; } else if(fam.estado === "fuga") a.estado = "fugindo"; else { a.estado = "natural"; a.ativ = (fam.atividade === "pastar" || fam.atividade === "deitar") && d < 4 ? (fam.atividade === "deitar" ? "sentar" : "farejar") : (d > 1.6 ? "andar" : "escutar"); }
      if(fam.estado === "alerta") a.vel *= .9; else a.vai(dt, ctx, al, v, 4);
      void esc;
    });
    /* sacudir: o ruído de respingo em volta dos que se sacodem */
    fam.membros.forEach(a => { if(a.sacode > 0){ a.sacode -= dt; if(Math.random() < dt * 14) fx.respingo(a.x, a.y + 1.4, a.z, 2, 4); } });
    /* animais auxiliares: orientação do puma (encontro) */
    if(fam.estado === "escondida" && fam.perigoPuma) { /* o puma passa: roteiro definido em encontro() */ }
    if(fam.fim) fam.membros.forEach(a => { a.fim = true; });
  }
  const fx_sacudir = () => { /* efeito já nos membros (a.sacode) */ };

  /* ---------- o puma passa pela margem e olha para a água ---------- */
  function encontro(puma){
    if(!fam || !puma) return false;
    const m = fam.mae, pc = poco(m.x, m.z).p || poco(puma.x, puma.z).p, L = A; if(!pc) return false;
    let k = 0, md = 1e9; L.forEach((p, i) => { const d = Math.hypot(p[0] - pc.x, p[1] - pc.z); if(d < md){ md = d; k = i; } });
    const lado = Math.random() < .5 ? 1 : -1, ang = (i) => { const P = L[Math.max(0, Math.min(L.length - 1, i))], Q = L[Math.max(0, Math.min(L.length - 1, i + 1))]; return Math.atan2(Q[1] - P[1], Q[0] - P[0]); };
    const ponto = (i, off) => { const P = L[Math.max(0, Math.min(L.length - 1, i))], a = ang(i); return [P[0] - Math.sin(a) * off * lado, P[1] + Math.cos(a) * off * lado]; };
    const dirV = Math.random() < .5 ? 1 : -1;
    puma.entrada = null; puma.estado = "natural"; puma.vida = 0; puma.duracao = 1e9;
    puma.roteiro = [ { alvo: ponto(k - dirV * 2, pc.R + 6) }, { alvo: ponto(k, pc.R + 5), acao: "olhar", dur: rnd(4, 7), olha: [pc.x, pc.z] }, { alvo: ponto(k + dirV * 4, pc.R + 12), rapido: false }, { alvo: ponto(k + dirV * 7, pc.R + 18) } ];
    puma.cfg = { ...puma.cfg, anda: .8 * 1 };
    puma.encontro = true; return true;
  }

  function tenta(J, forcado, E){
    if(fam) return null; if(!forcado && (relogio < cooldown)) return null;
    const obs = [{ x: J.x, z: J.z }].concat(M.gente && M.gente.observadores ? M.gente.observadores(J, FAUNA.raioAtivo * U) : []).filter(o => ZA.perto(o.x, o.z, FAUNA.spawnMax * U * .6));
    if(!obs.length) return null;
    const o = obs[Math.floor(Math.random() * obs.length)];
    for(let i = 0; i < 80; i++){
      const a = Math.random() * 6.28, r = rnd(13, 19) * U, x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r;
      if(!ZA.contem(x, z)) continue; const b = bordaPerto(x, z); if(b.d < 5 || b.d > 12) continue; if(!ctx.livre(x, z, 1.5, 20)) continue;
      if(fauna.visivel(x, z, 3) && !forcado) continue;
      const yaw = Math.atan2(o.x - x, o.z - z) + rnd(-1, 1); fam = cria(x, z, yaw); return fam;
    }
    return null;
  }

  function tick(dt, J, E){
    relogio += dt; fx.tick(dt);
    if(!fam) return;
    if(!J){ fam.membros.forEach(a => { a.fim = true; }); }
    else { tickFamilia(dt, J, E); }
    /* atualiza cada membro (altura/água, animação) */
    fam.membros.forEach(a => {
      const dj = J ? Math.hypot(a.x - J.x, a.z - J.z) / U : 0; if(dj > FAUNA.raioAtivo) fam.fim = true;
      a.atualizaAgua(dt, ctx); a.anima(dt, ctx, dj > FAUNA.lod.longe); a.aplica(ctx);
      /* a pose "afundada" não deve inclinar o corpo; mantém cabeça reta quando escondida */
      if(a.esconde && a.submersa > .5){ a.rig.pesc.rotation.x = .9; a.rig.cab.rotation.x = .2; }
    });
    if(fam.fim && fam.membros.every(a => a.fim)){ fam.membros.forEach(a => { fauna.remove(a); }); cooldown = relogio + rnd(CAPIVARAS.cooldown[0], CAPIVARAS.cooldown[1]); fam = null; }
    else if(fam.fim) fam.membros.forEach(a => { a.fim = true; });
  }
  return { tick, tenta, encontro, get familia(){ return fam; }, fx, estadoTexto: () => (fam ? "capivaras " + fam.estado + (fam.atividade ? "/" + fam.atividade : "") + " " + fam.mae.submersa.toFixed(1) : "capivaras: cooldown " + Math.max(0, Math.ceil(cooldown - relogio)) + " s"), cooldownZero(){ cooldown = 0; }, pesoHora };
}
void Color; void pick;
