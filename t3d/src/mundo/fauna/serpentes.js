import { Mesh, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, DoubleSide, BoxGeometry, Vector3, Frustum, Matrix4 } from "three";
import { U, SERPENTES, pesoHora } from "../config.js";
import { canvasTex } from "../../lib.js";

/* ============================================================================================================
   SERPENTES CRUZANDO A TRILHA (jararaca, urutu-cruzeiro, cobra-coral)
   Cada serpente é UMA malha tubular deformada por uma curva (os pontos que a cabeça já percorreu): cada segmento passa exatamente pelo ponto onde a cabeça passou,
   com ondulação lateral. Padrões de cor por textura procedural (jararaca: "V" invertidos; urutu: "C" com contorno creme e cruz na cabeça; coral: anéis completos).
   Tímidas: nunca perseguem nem atacam. Perto demais (< 2,5 m): param em postura defensiva (corpo em S, cabeça recuada; a coral levanta a cauda e esconde a cabeça) e,
   quando a pessoa se afasta, terminam a travessia mais rápido. Capturadas por gaviões, o corpo vira um "cabo" preso nas garras (Verlet).
   ============================================================================================================ */

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const N = 34, MR = 8;                                                    // pontos ao longo do corpo × lados da seção

/* ---- texturas (u ao longo do corpo, cabeça em u = 0; v em volta: 0 = dorso, .5 = ventre) ---- */
function texJararaca(){
  return canvasTex(1024, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#7d6e48"); g.addColorStop(.18, "#6f6244"); g.addColorStop(.36, "#5e533c"); g.addColorStop(.46, "#c7bc94"); g.addColorStop(.54, "#d6ccA6"); g.addColorStop(.64, "#5e533c"); g.addColorStop(.82, "#6f6244"); g.addColorStop(1, "#7d6e48"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 40; i++){ [.22, .78].forEach(v => { const x = 70 + i * 22 + (v > .5 ? 11 : 0), y = h * v; c.fillStyle = "rgba(40,30,22,.9)"; c.beginPath(); c.moveTo(x - 9, y + 18); c.lineTo(x, y - 18); c.lineTo(x + 9, y + 18); c.lineTo(x + 4, y + 18); c.lineTo(x, y - 8); c.lineTo(x - 4, y + 18); c.closePath(); c.fill(); c.strokeStyle = "rgba(225,214,170,.85)"; c.lineWidth = 2; c.stroke(); }); }
    for(let i = 0; i < 380; i++){ c.fillStyle = `rgba(30,24,18,${Math.random() * .18})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    c.fillStyle = "rgba(35,28,20,.85)"; c.fillRect(0, h * .1, 62, h * .18); c.fillRect(0, h * .72, 62, h * .18);      // faixa pós-ocular escura na cabeça
  }, { hd: 1, aniso: 4 });
}
function texUrutu(){
  return canvasTex(1024, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#6a573c"); g.addColorStop(.3, "#5d4c36"); g.addColorStop(.46, "#c9bf9a"); g.addColorStop(.54, "#d8cfae"); g.addColorStop(.7, "#5d4c36"); g.addColorStop(1, "#6a573c"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 18; i++){ [.17, .83].forEach(v => { const x = 90 + i * 49 + (v > .5 ? 22 : 0), y = h * v; c.lineWidth = 7; c.strokeStyle = "#e9dec2"; c.fillStyle = "#2a2018"; c.beginPath(); c.ellipse(x, y, 20, 22, 0, .8, Math.PI * 2 - .8); c.stroke(); c.lineWidth = 11; c.strokeStyle = "#2a2018"; c.beginPath(); c.ellipse(x, y, 15, 17, 0, .85, Math.PI * 2 - .85); c.stroke(); }); }
    for(let i = 0; i < 300; i++){ c.fillStyle = `rgba(25,20,14,${Math.random() * .16})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    /* cruz clara no alto da cabeça (u 0–.06, dorso v ≈ 0 e 1) */
    c.fillStyle = "#efe6cc"; [[28, h * .02], [28, h * .96]].forEach(([x, y]) => { c.fillRect(x - 3, y - 12, 6, 24); c.fillRect(x - 14, y - 3, 28, 6); });
  }, { hd: 1, aniso: 4 });
}
function texCoral(){
  return canvasTex(1024, 64, (c, w, h) => {
    c.fillStyle = "#e8e2c4"; c.fillRect(0, 0, w, h);
    const per = 60; for(let x0 = 66; x0 < w; x0 += per){                                   // tríade: vermelho · preto · branco · preto
      const seq = [["#c42a1e", 22], ["#101010", 8], ["#efe8c8", 8], ["#101010", 8]]; let x = x0; seq.forEach(([cor, l]) => { c.fillStyle = cor; c.fillRect(x, 0, l, h); x += l; }); }
    c.fillStyle = "#101010"; c.fillRect(0, 0, 40, h); c.fillStyle = "#efe8c8"; c.fillRect(40, 0, 7, h); c.fillStyle = "#c42a1e"; c.fillRect(47, 0, 19, h);       // cabeça preta, anel claro, anel vermelho
    for(let i = 0; i < 500; i++){ c.fillStyle = `rgba(0,0,0,${Math.random() * .16})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, { hd: 1, aniso: 4 });
}
const TEX = {}; const textura = (id) => TEX[id] || (TEX[id] = id === "jararaca" ? texJararaca() : id === "urutu" ? texUrutu() : texCoral());

class Serpente {
  constructor(esp, M, x, z, yaw, fim){
    this.esp = esp; this.id = esp.id; this.nome = esp.nome; this.M = M; this.cen = M.cen; this.x = x; this.z = z; this.yaw = yaw; this.fimXZ = fim;
    this.L = esp.comp * U; this.R = esp.raio * U; this.v = esp.v * U; this.estado = "cruzando"; this.t = 0; this.fase = Math.random() * 6; this.pausa = 0; this.tPausa = rnd(2, 5); this.def = 0; this.tDef = 0;
    this.hist = []; this.passo = .5; this.cruzou = false; this.fimT = 0; this.altura = 1.4; this.visivel = false; this.avistadoT = 0; this.vigia = 0; this.lingua = 0; this.tLingua = rnd(.8, 2);
    this.capturada = null; this.cabo = null; this.fim = false; this.sumindo = 0;
    for(let i = 0; i < 80; i++) this.hist.push([x - Math.sin(yaw) * i * this.passo, z - Math.cos(yaw) * i * this.passo]);      // o corpo começa estendido para trás
    this.pts = Array.from({ length: N }, () => new Vector3());
    /* malha tubular dinâmica */
    const g = new BufferGeometry(), nv = N * MR + 2, pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), nor = new Float32Array(nv * 3), idx = [];
    for(let i = 0; i < N; i++) for(let k = 0; k < MR; k++){ uv[(i * MR + k) * 2] = i / (N - 1) * .96 + .02; uv[(i * MR + k) * 2 + 1] = k / MR; }
    for(let i = 0; i < N - 1; i++) for(let k = 0; k < MR; k++){ const a = i * MR + k, b = i * MR + (k + 1) % MR, c = (i + 1) * MR + k, d = (i + 1) * MR + (k + 1) % MR; idx.push(a, b, c, b, d, c); }
    for(let k = 0; k < MR; k++){ idx.push(N * MR, (k + 1) % MR, k); idx.push(N * MR + 1, (N - 1) * MR + k, (N - 1) * MR + (k + 1) % MR); }                // tampas: focinho e ponta da cauda
    g.setAttribute("position", new Float32BufferAttribute(pos, 3).setUsage(35048)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g.setAttribute("normal", new Float32BufferAttribute(nor, 3).setUsage(35048)); g.setIndex(new Uint16BufferAttribute(new Uint16Array(idx), 1));
    this.mat = new MeshStandardMaterial({ map: textura(esp.id), roughness: .55, metalness: 0, side: DoubleSide }); this.malha = new Mesh(g, this.mat); this.malha.frustumCulled = false; this.malha.castShadow = true; this.cen.grupo.add(this.malha);
    this.lingMesh = new Mesh(new BoxGeometry(.12 * U, .02 * U, .5 * U), new MeshBasicMaterial({ color: esp.id === "coral" ? 0xcc2020 : 0x1a1010 })); this.lingMesh.visible = false; this.cen.grupo.add(this.lingMesh);
    this.atualizaMalha(0);
  }
  /* ---- pontos do corpo a partir do histórico da cabeça ---- */
  amostraHist(){
    const P = this.pts, h = this.hist, seg = this.L / (N - 1); let acc = 0, j = 0, ax = this.x, az = this.z;
    P[0].set(this.x, 0, this.z);
    for(let i = 1; i < N; i++){ let alvo = i * seg;
      while(j < h.length - 1 && acc + Math.hypot(h[j][0] - ax, h[j][1] - az) < alvo){ acc += Math.hypot(h[j][0] - ax, h[j][1] - az); ax = h[j][0]; az = h[j][1]; j++; }
      const px = h[Math.min(j, h.length - 1)][0], pz = h[Math.min(j, h.length - 1)][1], d = Math.hypot(px - ax, pz - az) || 1, t = Math.min(1, (alvo - acc) / d);
      P[i].set(ax + (px - ax) * t, 0, az + (pz - az) * t); }
  }
  /* postura defensiva: S compacto; coral: cauda erguida e cabeça escondida */
  posturaDef(){
    const P = [], sx = Math.sin(this.yaw), sz = Math.cos(this.yaw), rx = sz, rz = -sx, L = this.L * .62;
    for(let i = 0; i < N; i++){ const t = 1 - i / (N - 1);                              // t = 0 na cauda, 1 na cabeça
      const along = (t - .5) * L, lat = Math.sin(t * Math.PI * 2.2) * this.L * .2 * (this.id === "coral" ? .6 : 1), y = this.id === "coral" ? (t < .2 ? (1 - t / .2) * this.L * .28 : 0) : (t > .78 ? Math.pow((t - .78) / .22, 1.6) * this.L * .3 : 0);
      P.push([this.x - sx * (this.L * .31) + sx * along + rx * lat, y, this.z - sz * (this.L * .31) + sz * along + rz * lat]); }
    return P;
  }
  yTerreno(x, z){ return this.cen.chao(x, z, 1e9); }
  atualizaMalha(dt){
    const pos = this.malha.geometry.attributes.position, nor = this.malha.geometry.attributes.normal, P = this.pts, esp = this.esp;
    const vi = new Vector3(), tan = new Vector3(), rig = new Vector3(), up = new Vector3(), tmp = new Vector3();
    for(let i = 0; i < N; i++){
      const u = i / (N - 1), c = P[i];
      /* perfil do raio: cabeça triangular destacada do pescoço (jararaca/urutu), cabeça pequena e arredondada (coral), afina na cauda */
      let rw = this.R, rh = this.R;
      if(this.id !== "coral"){ const cab = sstep(.0, .035, u) * (1 - sstep(.035, .085, u)); rw *= .75 + 1.15 * cab - .22 * sstep(.06, .12, u) * (1 - sstep(.12, .2, u)); rh *= .7 + .35 * cab; }
      else { rw *= .8 + .15 * sstep(0, .06, u); rh = rw; }
      const corpo = Math.sin(Math.min(1, u * 1.02 + .08) * Math.PI * .5), cauda = 1 - sstep(.62, 1, u) * .85; rw *= (u < .1 ? 1 : corpo * .35 + .65) * cauda; rh *= (u < .1 ? 1 : corpo * .35 + .65) * cauda;
      const y = c.y;
      const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)]; tan.set(b.x - a.x, b.y - a.y, b.z - a.z); if(tan.lengthSq() < 1e-8) tan.set(0, 0, 1); tan.normalize();
      if(i === 0){ up.set(0, 1, 0); rig.crossVectors(tan, up); if(rig.lengthSq() < 1e-6) rig.set(1, 0, 0); } else rig.addScaledVector(tan, -rig.dot(tan));      // transporte paralelo: sem torção nem inversão ao erguer a cauda
      if(rig.lengthSq() < 1e-8) rig.set(1, 0, 0).addScaledVector(tan, -tan.x); rig.normalize(); up.crossVectors(rig, tan).normalize();
      for(let k = 0; k < MR; k++){ const an = k / MR * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an); vi.set(c.x, y, c.z).addScaledVector(rig, ca * rw).addScaledVector(up, sa * rh);
        const idx = (i * MR + k) * 3; pos.array[idx] = vi.x; pos.array[idx + 1] = vi.y; pos.array[idx + 2] = vi.z; tmp.copy(rig).multiplyScalar(ca / Math.max(rw, 1e-4)).addScaledVector(up, sa / Math.max(rh, 1e-4)).normalize(); nor.array[idx] = tmp.x; nor.array[idx + 1] = tmp.y; nor.array[idx + 2] = tmp.z; }
    }
    { const h = P[0], h1 = P[1], t0 = P[N - 1], t1 = P[N - 2], q = N * MR * 3, rh0 = this.R * (this.id === "coral" ? .8 : .52);
      tmp.set(h.x - h1.x, h.y - h1.y, h.z - h1.z).normalize(); pos.array[q] = h.x + tmp.x * rh0 * 1.1; pos.array[q + 1] = h.y + tmp.y * rh0 * 1.1; pos.array[q + 2] = h.z + tmp.z * rh0 * 1.1; nor.array[q] = tmp.x; nor.array[q + 1] = tmp.y; nor.array[q + 2] = tmp.z;
      tmp.set(t0.x - t1.x, t0.y - t1.y, t0.z - t1.z).normalize(); pos.array[q + 3] = t0.x + tmp.x * this.R * .3; pos.array[q + 4] = t0.y + tmp.y * this.R * .3; pos.array[q + 5] = t0.z + tmp.z * this.R * .3; nor.array[q + 3] = tmp.x; nor.array[q + 4] = tmp.y; nor.array[q + 5] = tmp.z; }
    pos.needsUpdate = true; nor.needsUpdate = true;
    /* língua */
    this.tLingua -= dt; if(this.tLingua < 0){ this.lingua = .28; this.tLingua = rnd(1.2, 2.8); } this.lingua -= dt; const h0 = P[0], h1 = P[2];
    this.lingMesh.visible = this.lingua > 0 && this.estado !== "capturada"; if(this.lingMesh.visible){ const d = Math.atan2(h0.x - h1.x, h0.z - h1.z); this.lingMesh.position.set(h0.x + Math.sin(d) * this.R * 2.6, h0.y, h0.z + Math.cos(d) * this.R * 2.6); this.lingMesh.rotation.y = d; }
  }
  /* ---- passo da simulação ---- */
  update(dt, ctx){
    this.t += dt; const g = this.M;
    /* pessoas por perto */
    let dmin = 1e9; for(const p of ctx.pessoasRaw){ const d = Math.hypot(p.x - this.x, p.z - this.z) / U; if(d < dmin) dmin = d; } this.dmin = dmin;
    if(this.capturada){ this.simulaCabo(dt); this.atualizaMalha(dt); return; }
    const D = SERPENTES.dist;
    if(this.estado === "cruzando" || this.estado === "pausa"){
      if(dmin < D.alerta && this.id){ this.estado = "defensiva"; this.tDef = 0; this.defAlvo = this.posturaDef(); this.afastouT = 0; }
      else if(this.estado === "pausa"){ this.pausa -= dt; if(this.pausa <= 0) this.estado = "cruzando"; }
      else {
        this.tPausa -= dt; if(this.tPausa < 0){ this.estado = "pausa"; this.pausa = rnd(.7, 2.2); this.tPausa = rnd(3, 7); }
        this.vigia += ((dmin < 12 ? 1 : 0) - this.vigia) * Math.min(1, dt * 2.5);                // ergue um pouco a cabeça ao sentir os passos
        const vel = this.v * (this.rapido ? SERPENTES.defensivaVolta : 1) * (this.id === "coral" ? 1 + .25 * Math.sin(this.t * 6) : 1);
        const alvo = Math.atan2(this.fimXZ[0] - this.x, this.fimXZ[1] - this.z); let dy = alvo - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); const onda = Math.sin(this.fase) * (this.id === "coral" ? .55 : .42);
        this.yaw += (dy * Math.min(1, dt * 2) ); this.fase += dt * vel / (U * .22) * Math.PI * 2 * .35;
        const mv = this.yaw + onda * .55, passo = vel * dt; this.x += Math.sin(mv) * passo; this.z += Math.cos(mv) * passo;
        const ult = this.hist[0]; if(Math.hypot(this.x - ult[0], this.z - ult[1]) >= this.passo){ this.hist.unshift([this.x, this.z]); if(this.hist.length > 140) this.hist.pop(); }
        if(Math.hypot(this.fimXZ[0] - this.x, this.fimXZ[1] - this.z) < 2.2 * U){ this.cruzou = true; this.estado = "sumindo"; }
      }
    } else if(this.estado === "defensiva"){
      this.tDef += dt; this.def = Math.min(1, this.def + dt * 1.6);
      if(dmin > D.alerta + 1.2){ this.afastouT += dt; if(this.afastouT > 1.5){ this.estado = "cruzando"; this.rapido = true; this.hist = this.defAlvo.map(p => [p[0], p[2]]).reverse().slice(); /* a postura vira o histórico: sem salto */ const h2 = []; for(let i = this.defAlvo.length - 1; i >= 0; i--) h2.push([this.defAlvo[i][0], this.defAlvo[i][2]]); this.hist = h2; this.def = 0; this.x = this.hist[0][0]; this.z = this.hist[0][1]; } } else this.afastouT = 0;
    } else if(this.estado === "sumindo"){
      const vel = this.v * 1.1; this.yaw += 0; this.x += Math.sin(this.yaw) * vel * dt; this.z += Math.cos(this.yaw) * vel * dt;
      const ult = this.hist[0]; if(Math.hypot(this.x - ult[0], this.z - ult[1]) >= this.passo){ this.hist.unshift([this.x, this.z]); if(this.hist.length > 140) this.hist.pop(); }
      this.sumindo += vel * dt; if(this.sumindo > this.L + 3 * U) this.fim = true;
    }
    /* corpo */
    if(this.estado === "defensiva" || this.def > 0){ const P = this.defAlvo || this.posturaDef(); this.amostraHist(); const k = this.estado === "defensiva" ? this.def : 0; for(let i = 0; i < N; i++){ this.pts[i].x += (P[i][0] - this.pts[i].x) * k; this.pts[i].z += (P[i][2] - this.pts[i].z) * k; this.pts[i].y = P[i][1] * k; } if(this.estado !== "defensiva") this.def = 0; }
    else { this.amostraHist(); for(let i = 0; i < N; i++) this.pts[i].y = 0; if(this.vigia > .02) for(let i = 0; i < 6; i++) this.pts[i].y = (1 - i / 6) * this.vigia * 1.1 * this.R * 2; }
    for(let i = 0; i < N; i++) this.pts[i].y += this.yTerreno(this.pts[i].x, this.pts[i].z) + this.R * .85;       // sempre sobre a superfície, sem afundar nem flutuar
    this.atualizaMalha(dt);
    this.altura = this.R * 4 + (this.estado === "defensiva" ? this.L * .25 : 0);
  }
  /* ---- capturada: cabo preso nas garras (Verlet) ---- */
  prende(gancho, pino){
    this.estado = "capturada"; this.capturada = true; this.gancho = gancho; this.pino = pino; this.cabo = this.pts.map(p => ({ p: p.clone(), q: p.clone() })); this.alvoLim = this.L / (N - 1);
  }
  simulaCabo(dt){
    const C = this.cabo, seg = this.alvoLim; dt = Math.min(dt, .033);
    const gp = this.gancho(); C[this.pino].p.copy(gp); C[this.pino].q.copy(gp);
    C.forEach((n, i) => { if(i === this.pino) return; const vx = (n.p.x - n.q.x) * .985, vy = (n.p.y - n.q.y) * .985, vz = (n.p.z - n.q.z) * .985; n.q.copy(n.p); n.p.x += vx + Math.sin(this.t * 3 + i * .7) * .0025; n.p.y += vy - 28 * dt * dt; n.p.z += vz + Math.cos(this.t * 2.6 + i) * .0025; });
    for(let it = 0; it < 6; it++){ for(let i = 0; i < N - 1; i++){ const a = C[i], b = C[i + 1], dx = b.p.x - a.p.x, dy = b.p.y - a.p.y, dz = b.p.z - a.p.z, d = Math.hypot(dx, dy, dz) || 1, df = (d - seg) / d, fa = i === this.pino ? 0 : (i + 1 === this.pino ? 1 : .5), fb = i + 1 === this.pino ? 0 : (i === this.pino ? 1 : .5);
        a.p.x += dx * df * fa; a.p.y += dy * df * fa; a.p.z += dz * df * fa; b.p.x -= dx * df * fb; b.p.y -= dy * df * fb; b.p.z -= dz * df * fb; } C[this.pino].p.copy(gp); }
    C.forEach((n, i) => { this.pts[i].copy(n.p); });
  }
  libera(){ this.malha.parent && this.malha.parent.remove(this.malha); this.lingMesh.parent && this.lingMesh.parent.remove(this.lingMesh); this.malha.geometry.dispose(); this.mat.dispose(); }
  get posCentro(){ return this.pts[Math.floor(N * .4)]; }
}

/* ============================================================================================================
   GERENTE DE SERPENTES: sorteia travessias em trechos elegíveis da trilha perto do jogador ou de um grupo
   ============================================================================================================ */
export function criarSerpentes(M, ctx, Z){
  const { cen } = M, lista = [], TR = cen.trilhas, PK = cen.estac.PKW(0, 0), troncos = cen.terreno.troncos || [];
  const caminhos = [TR.TM, TR.TB, TR.TREC];
  const dist = (a, b, x, z) => Math.hypot(a - x, b - z);
  const minTronco = (x, z) => { let d = 1e9; for(const t of troncos){ const e = dist(t[0], t[1], x, z); if(e < d) d = e; } return d; };
  /* candidatos por espécie: pontos da trilha com a vizinhança certa */
  const cands = { jararaca: [], urutu: [], coral: [] };
  caminhos.forEach((L, li) => { for(let i = 0; i < L.length - 1; i++){ const A = L[i], B = L[i + 1], Ln = Math.hypot(B[0] - A[0], B[1] - A[1]), tx = (B[0] - A[0]) / Ln, tz = (B[1] - A[1]) / Ln;
      for(let d = 8; d < Ln - 8; d += 28){ const x = A[0] + tx * d, z = A[1] + tz * d, agua = Z.ZONAS.agua.distAgua(x, z), tr = minTronco(x, z), pk = dist(PK[0], PK[1], x, z), c = { x, z, tx, tz, li };
        if(agua < 90 || tr < 45) cands.jararaca.push(c); if(agua > 130 && tr > 85 && pk > 360) cands.urutu.push(c); if(pk < 420 || tr < 40) cands.coral.push(c); } } });
  const fr = new Frustum(), pm = new Matrix4(), vv = new Vector3(); let acc = 0, relogio = 0, cooldown = 0;

  function cria(id, c, J, forcado){
    const esp = SERPENTES.especies[id], lado = Math.random() < .5 ? 1 : -1, nx = -c.tz, nz = c.tx, off = 11, ang = rnd(-.25, .25);
    const sx = c.x + nx * off * lado, sz = c.z + nz * off * lado, ex = c.x - nx * off * lado + c.tx * Math.sin(ang) * 6, ez = c.z - nz * off * lado + c.tz * Math.sin(ang) * 6;
    const yaw = Math.atan2(ex - sx, ez - sz), s = new Serpente(esp, M, sx, sz, yaw, [ex, ez]); s.trilha = c.li; s.lado = lado; lista.push(s); if(M.fotos && M.fotos.aoSpawn) M.fotos.aoSpawn(s); void J; void forcado; return s;
  }
  /* escolhe um ponto elegível a 20–70 m do jogador (ou de um grupo), de preferência fora de vista */
  function tenta(id, J, forcado = false, perto = null){
    const L = cands[id]; if(!L.length) return null; const ref = perto || J, lo = forcado ? 12 : 30, hi = forcado ? 22 : 90;
    for(let k = 0; k < 60; k++){ const c = L[Math.floor(Math.random() * L.length)], d = Math.hypot(c.x - ref.x, c.z - ref.z) / U; if(d < lo || d > hi) continue;
      if(lista.some(s => s.trilha === c.li && Math.hypot(s.x - c.x, s.z - c.z) < 400)) continue;                        // no máximo 1 por trecho
      if(!forcado){ vv.set(c.x, 3, c.z); if(fr.containsPoint(vv)) continue; }
      return cria(id, c, J, forcado); }
    return null;
  }
  function frente(id, J, grupo = false){                                                       // depuração: cruza na frente do jogador (ou de um grupo com guia)
    lista.slice().forEach(s => { s.fim = true; });
    let ref = J, alvoG = null;
    if(grupo && M.gente){ const gs = M.gente.grupos.filter(q => q.guia && q.path && q.estado === "andando" && q.membros.some(p => p.ativo)).sort((p, q) => Math.hypot(p.guia.x - J.x, p.guia.z - J.z) - Math.hypot(q.guia.x - J.x, q.guia.z - J.z));
      if(gs.length){ const p = gs[0].guia; alvoG = { x: p.x, z: p.z, yaw: p.yaw }; ref = { x: p.x + Math.sin(p.yaw) * 13 * U, z: p.z + Math.cos(p.yaw) * 13 * U }; } }
    /* ponto da trilha mais próximo da referência (ainda que a espécie preferisse outra zona): é para teste */
    let best = null, bd = 1e9; caminhos.forEach((P, li) => { for(let i = 0; i < P.length - 1; i++){ const A = P[i], B = P[i + 1], Ln = Math.hypot(B[0] - A[0], B[1] - A[1]); for(let d = 4; d < Ln - 4; d += 4){ const x = A[0] + (B[0] - A[0]) * d / Ln, z = A[1] + (B[1] - A[1]) * d / Ln, dd = Math.hypot(x - ref.x, z - ref.z); if((alvoG || dd > 8 * U) && dd < bd){ bd = dd; best = { x, z, tx: (B[0] - A[0]) / Ln, tz: (B[1] - A[1]) / Ln, li }; } } } });
    const s = best ? cria(id, best, J, true) : null; if(s){ s.forcada = true; s.grupoRef = alvoG; } return s;
  }

  function tick(dt, J, E){
    relogio += dt; cam_();
    if(J){
      acc += dt; if(acc >= SERPENTES.intervalo && relogio > cooldown && lista.length < SERPENTES.maxAtivas){ acc = 0;
        Object.values(SERPENTES.especies).forEach(esp => { if(lista.length >= SERPENTES.maxAtivas) return; const p = esp.chance * SERPENTES.intervalo * pesoHora(esp.horas, E.h); if(Math.random() < p){ const ob = M.gente && M.gente.observadores ? M.gente.observadores(J, 60 * U) : []; const alvo = ob.length && Math.random() < .5 ? ob[Math.floor(Math.random() * ob.length)] : null; if(tenta(esp.id, J, false, alvo)) cooldown = relogio + rnd(SERPENTES.cooldown[0], SERPENTES.cooldown[1]); } }); }
    }
    for(let i = lista.length - 1; i >= 0; i--){ const s = lista[i], dj = J ? Math.hypot(s.x - J.x, s.z - J.z) / U : 1e9;
      vv.set(s.x, s.pts[0].y, s.z); s.visivel = fr.containsPoint(vv); if(s.visivel && dj < 40) s.avistadoT = performance.now();
      if(!J || dj > (s.forcada ? 260 : 120)) s.fim = true;
      if(!s.fim) s.update(dt, ctx);
      if(s.fim){ s.libera(); lista.splice(i, 1); } }
  }
  function cam_(){ M.cam.updateMatrixWorld(); pm.multiplyMatrices(M.cam.projectionMatrix, new Matrix4().copy(M.cam.matrixWorld).invert()); fr.setFromProjectionMatrix(pm); }
  const emPonto = (id, x, z, tx, tz, li = 0) => cria(id, { x, z, tx, tz, li }, null, true);                // depuração: cruza exatamente neste ponto da trilha
  return { lista, tick, tenta, frente, emPonto, cands, remove(s){ s.fim = true; }, info: () => (lista.length ? "Serpente: " + lista.map(s => s.nome + " " + s.estado + " " + (s.dmin !== undefined ? s.dmin.toFixed(0) + " m" : "")).join(", ") : "Serpentes: nenhuma") };
}
