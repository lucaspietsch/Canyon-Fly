import { U, FAUNA } from "../config.js";
import { criarQuadrupede, SPEC } from "./modelos.js";

const PI2 = Math.PI * 2;
const angDif = (a, b) => { let d = (b - a) % PI2; if(d > Math.PI) d -= PI2; if(d < -Math.PI) d += PI2; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (lista) => { const t = lista.reduce((s, x) => s + x[1], 0); let r = Math.random() * t; for(const x of lista){ r -= x[1]; if(r <= 0) return x[0]; } return lista[0][0]; };

/* ============================================================================================================
   ANIMAL (classe base). Estados: entrando → natural → alerta → fugindo / saindo.
   Distâncias (config.js → FAUNA.distancias × fatorDist da espécie): 20–12 m natural · < 12 m alerta · < 8 m (ou alguém correndo na direção) foge e some.
   Nunca se aproxima de propósito de ninguém: os destinos sorteados e cada passo respeitam a distância de alerta.
   ============================================================================================================ */
export class Animal {
  constructor(def, cfg, ctx, x, z, yaw){
    this.def = def; this.cfg = cfg; this.id = cfg.id; this.nome = cfg.nome; this.variante = def.variante ? def.variante() : def.spec;
    this.rig = criarQuadrupede(SPEC[this.variante], { clonar: !!def.clonar }); this.escala = def.escala || 1; if(this.escala !== 1) this.rig.root.scale.setScalar(this.escala);
    this.x = x; this.z = z; this.yaw = yaw; this.vel = 0; this.y = ctx.chao(x, z);
    const D = FAUNA.distancias, f = cfg.fatorDist; this.naturalM = D.natural * f; this.alertaM = D.alerta * f; this.fugaM = D.fuga * f;
    this.estado = "entrando"; this.ativ = "andar"; this.tAtiv = 0; this.durAtiv = 0; this.tEstado = 0; this.vida = 0; this.duracao = rnd(cfg.duracao[0], cfg.duracao[1]);
    this.alvo = null; this.phi = Math.random() * 6; this.relogioAnim = Math.random() * 20; this.fim = false; this.perturbado = 0; this.dmin = 99; this.pm = null;
    this.visivel = false; this.avistadoT = 0; this.alertaDur = rnd(def.alertaSeg[0], def.alertaSeg[1]); this.fugaT = 0; this.zig = Math.random() * 6; this.dirFuga = null; this.pausaSeg = 0;
    this.p = { pesc: def.pose.neutroPesc, cabP: def.pose.neutroCab, cabY: 0, cabR: 0, orelhaX: .1, orelhaL: 0, orelhaR: 0, cauda: def.pose.cauda, curva: 0, wag: 0, sentar: 0, cocar: 0, abaixa: 0 };
    this.quadros = 0; this.dtAcum = 0;
    this.rig.root.position.set(x, this.y, z); this.rig.root.rotation.y = yaw;
  }
  get pos(){ return this.rig.root.position; }
  get altura(){ return this.rig.ombro * U * (this.escala || 1); }

  /* ---------- decisões ---------- */
  alertar(){ this.estado = "alerta"; this.tEstado = 0; this.alertaDur = rnd(this.def.alertaSeg[0], this.def.alertaSeg[1]); this.vel = 0; }
  fugir(pm){
    if(this.estado === "fugindo") return; this.estado = "fugindo"; this.tEstado = 0; this.ativ = "fugir";
    let ax = 0, az = 0; if(pm){ ax = this.x - pm.x; az = this.z - pm.z; } else { ax = Math.sin(this.yaw); az = Math.cos(this.yaw); }
    const l = Math.hypot(ax, az) || 1; this.dirFuga = Math.atan2(ax / l, az / l) + rnd(-.45, .45);
  }
  sair(){ if(this.estado === "fugindo" || this.estado === "saindo") return; this.estado = "saindo"; this.tEstado = 0; this.ativ = "andar"; this.alvo = null; }
  perturba(nivel){ this.perturbado = Math.max(this.perturbado, nivel); }       // barulho (avião baixo): 1 = fica alerta e se afasta · 2 = foge
  novaAtividade(c){
    const nome = pick(this.def.atividades(this)); this.ativ = nome; this.tAtiv = 0; this.alvo = null;
    const d = this.def.durs[nome] || [2, 5]; this.durAtiv = rnd(d[0], d[1]);
    if(nome === "andar" || nome === "zigue"){ this.alvo = this.def.destino(this, c); if(!this.alvo){ this.ativ = "escutar"; this.durAtiv = rnd(2, 4); } }
    if(nome === "beber"){ this.alvo = this.def.destinoBeber ? this.def.destinoBeber(this, c) : null; if(!this.alvo){ this.ativ = "farejar"; } }
  }

  /* ---------- movimento ---------- */
  caminha(dt, c, alvo, vAlvo, giro = 3){
    const dx = alvo[0] - this.x, dz = alvo[1] - this.z, d = Math.hypot(dx, dz);
    const yawAlvo = Math.atan2(dx, dz); this.yaw += angDif(this.yaw, yawAlvo) * Math.min(1, dt * giro);
    const quase = d < 3 * U; this.vel += ((quase ? 0 : vAlvo) - this.vel) * Math.min(1, dt * 3);
    const passo = this.vel * dt, nx = this.x + Math.sin(this.yaw) * passo, nz = this.z + Math.cos(this.yaw) * passo;
    /* não se aproxima de ninguém além da distância de alerta */
    let ok = c.livre(nx, nz, 1.2, 16);
    if(ok && this.estado !== "fugindo"){ for(const p of c.pessoasRaw){ const dn = Math.hypot(p.x - nx, p.z - nz) / U, da = Math.hypot(p.x - this.x, p.z - this.z) / U; if(dn < this.alertaM + 1.5 && dn < da){ ok = false; break; } } }
    if(ok){ this.x = nx; this.z = nz; } else { this.vel *= .5; this.bloq = (this.bloq || 0) + 1; }
    return d;
  }

  update(dt, c){
    this.vida += dt; this.tEstado += dt; this.tAtiv += dt; this.relogioAnim += dt;
    /* quem está perto */
    let dmin = 1e9, pm = null, assustou = false; const nat = this.naturalM;
    for(const p of c.pessoasRaw){ const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz), d = dist / U; if(d < dmin){ dmin = d; pm = p; }
      if(p.corre && d < nat && dist > 1){ const vv = Math.hypot(p.vx, p.vz) || 1; if((p.vx * -dx + p.vz * -dz) / (vv * dist) > .8) assustou = true; } }
    this.dmin = dmin; this.pm = pm;
    if(this.estado !== "fugindo"){
      if(dmin < this.fugaM || assustou || this.perturbado >= 2){ this.fugir(pm); }
      else if(this.perturbado >= 1 && this.estado !== "saindo"){ this.perturbado = 0; this.alertar(); this.alertaDur = rnd(1.2, 2.5); this.noSom = true; }
      else if(dmin < this.alertaM && this.estado !== "alerta" && this.estado !== "saindo"){ this.alertar(); }
    }
    if(this.estado !== "fugindo" && this.estado !== "saindo" && this.vida > this.duracao) this.sair();
    this.perturbado = this.estado === "fugindo" ? 0 : this.perturbado;

    switch(this.estado){
      case "entrando": case "natural": {
        if(this.estado === "entrando"){ if(!this.alvo) this.alvo = this.entrada; if(!this.alvo){ this.estado = "natural"; this.novaAtividade(c); break; }
          const d = this.caminha(dt, c, this.alvo, this.cfg.anda * U, 2.6); if(d < 3 * U || this.tEstado > 14){ this.estado = "natural"; this.novaAtividade(c); } break; }
        if(this.roteiro && this.roteiro.length){                         // roteiro (ex.: passar pela margem e olhar para a água)
          const r = this.roteiro[0]; this.ativ = "andar";
          if(!r.chegou){ const d = this.caminha(dt, c, r.alvo, this.cfg.anda * U * (r.rapido ? 1.25 : 1), 2.6); if(d < 2.8 * U || (r.t = (r.t || 0) + dt) > 25){ r.chegou = true; r.t0 = this.vida; } }
          else { this.ativ = r.acao === "olhar" ? "escutar" : "andar"; this.vel *= Math.max(0, 1 - dt * 6); if(r.olha){ const yw = Math.atan2(r.olha[0] - this.x, r.olha[1] - this.z); this.yaw += angDif(this.yaw, yw) * Math.min(1, dt * 3); }
            if(this.vida - r.t0 >= (r.dur || 0)) this.roteiro.shift(); }
          if(!this.roteiro.length){ this.roteiro = null; this.sair(); }
          break;
        }
        const a = this.ativ;
        if(a === "andar" || a === "zigue"){
          let alvo = this.alvo; if(!alvo){ this.novaAtividade(c); break; }
          if(a === "zigue"){ this.zig += dt * 5.5; const base = Math.atan2(alvo[0] - this.x, alvo[1] - this.z); this.yaw += angDif(this.yaw, base + Math.sin(this.zig) * .8) * Math.min(1, dt * 4); const passo = this.vel * dt, nx = this.x + Math.sin(this.yaw) * passo, nz = this.z + Math.cos(this.yaw) * passo; this.vel += (this.cfg.anda * U * 1.1 - this.vel) * Math.min(1, dt * 3); if(c.livre(nx, nz, 1.2, 16) && !this.pertoDemais(nx, nz, c)){ this.x = nx; this.z = nz; } else this.vel *= .4; if(Math.hypot(alvo[0] - this.x, alvo[1] - this.z) < 3 * U) this.novaAtividade(c); }
          else { const d = this.caminha(dt, c, alvo, this.cfg.anda * U, 2.4); if(d < 3 * U || this.bloq > 25){ this.bloq = 0; this.novaAtividade(c); } }
          if(this.tAtiv > 25) this.novaAtividade(c);
        } else if(a === "beber"){
          if(this.alvo && Math.hypot(this.alvo[0] - this.x, this.alvo[1] - this.z) > 2.2 * U && this.tAtiv < 14){ this.caminha(dt, c, this.alvo, this.cfg.anda * U * .85, 2.4); this.tAtiv = Math.min(this.tAtiv, .01); }
          else { this.vel *= Math.max(0, 1 - dt * 6); if(this.tAtiv > this.durAtiv) this.novaAtividade(c); }
        } else { this.vel *= Math.max(0, 1 - dt * 6); if(this.tAtiv > this.durAtiv) this.novaAtividade(c); }
        break;
      }
      case "alerta": {
        this.vel *= Math.max(0, 1 - dt * 8);
        if(pm){ const yw = Math.atan2(pm.x - this.x, pm.z - this.z); this.yaw += angDif(this.yaw, yw) * Math.min(1, dt * 4); }
        if(dmin >= this.alertaM + 1.5 && this.tEstado > this.alertaDur){ this.estado = "natural"; this.noSom = false; this.novaAtividade(c); if(this.def.aposAlerta === "sair") this.sair(); }
        else if(this.tEstado > this.alertaDur + this.def.alertaMax) this.sair();
        break;
      }
      case "fugindo": {
        this.fugaT += dt;
        const alvo = [this.x + Math.sin(this.dirFuga) * 60 * U, this.z + Math.cos(this.dirFuga) * 60 * U];
        const antes = this.x; void antes;
        const d0 = this.vel; void d0;
        this.yaw += angDif(this.yaw, this.dirFuga) * Math.min(1, dt * 5);
        this.vel += (this.cfg.trota * U - this.vel) * Math.min(1, dt * 4.5);
        const passo = this.vel * dt; let nx = this.x + Math.sin(this.yaw) * passo, nz = this.z + Math.cos(this.yaw) * passo;
        if(!c.livre(nx, nz, 1.2, 10)){ this.dirFuga += (Math.random() < .5 ? 1 : -1) * 1.0; nx = this.x; nz = this.z; }
        this.x = nx; this.z = nz; void alvo;
        break;
      }
      case "saindo": {
        if(!this.alvo || this.tEstado % 3 < dt){ const base = pm ? Math.atan2(this.x - pm.x, this.z - pm.z) : this.yaw; const a = base + rnd(-.5, .5); this.alvo = [this.x + Math.sin(a) * 30 * U, this.z + Math.cos(a) * 30 * U]; }
        this.caminha(dt, c, this.alvo, this.cfg.anda * U * 1.15, 2.2);
        break;
      }
    }
    /* some na vegetação: longe o bastante, ou fora de vista e já afastado */
    if(this.estado === "fugindo" || this.estado === "saindo"){
      const longe = dmin > FAUNA.distSegura, foraDeVista = !this.visivel && dmin > 20;
      if(longe || foraDeVista || this.tEstado > (this.estado === "fugindo" ? 14 : 40)) this.fim = true;
    }
    this.y = c.chao(this.x, this.z);
  }
  pertoDemais(nx, nz, c){ for(const p of c.pessoasRaw){ const dn = Math.hypot(p.x - nx, p.z - nz) / U, da = Math.hypot(p.x - this.x, p.z - this.z) / U; if(dn < this.alertaM + 1.5 && dn < da) return true; } return false; }

  /* ---------- animação ---------- */
  anima(dt, c, lod){
    const r = this.rig, p = this.p, def = this.def.pose, a = this.ativ, est = this.estado, t = this.relogioAnim;
    const k = 1 - Math.exp(-dt * 7);
    const alvo = { pesc: def.neutroPesc, cabP: def.neutroCab, cabY: 0, orelhaX: .12, orelhaL: 0, orelhaR: 0, cauda: def.cauda, curva: 0, wag: 0, sentar: 0, cocar: 0, abaixa: 0 };
    const vM = this.vel / U;
    if(est === "alerta"){ alvo.pesc = def.altoPesc; alvo.cabP = def.neutroCab - .2; alvo.orelhaX = .3; alvo.cauda = def.caudaAlerta; }
    else if(est === "fugindo"){ alvo.pesc = def.neutroPesc + .15; alvo.orelhaX = -.85; alvo.cauda = def.caudaFuga; alvo.cabP = .25; }
    else if(est === "saindo"){ alvo.orelhaX = -.15; alvo.cauda = def.cauda - .1; }
    else if(est === "natural" && vM < .15){
      if(a === "farejar"){ alvo.pesc = def.baixoPesc; alvo.cabP = .5 + Math.sin(t * 7) * .12; alvo.cabY = Math.sin(t * 1.8) * .35; alvo.cauda = def.cauda - .15; }
      else if(a === "escutar" || a === "observar" || a === "parar"){ alvo.pesc = def.altoPesc + .05; alvo.cabY = Math.sin(t * .9) * .7; alvo.orelhaL = Math.sin(t * 1.7) * .35; alvo.orelhaR = Math.cos(t * 1.3) * .35; alvo.orelhaX = .25; }
      else if(a === "beber"){ alvo.pesc = def.baixoPesc + .15; alvo.cabP = .65 + Math.sin(t * 9) * .05; alvo.cauda = def.cauda - .1; }
      else if(a === "sentar" || a === "cocar"){ alvo.sentar = 1; alvo.pesc = def.altoPesc; alvo.cabY = Math.sin(t * .8) * .5; alvo.cabP = .1; if(a === "cocar") alvo.cocar = 1; }
    }
    if(est === "natural" && vM >= .15 && a === "andar"){ alvo.cabY = Math.sin(t * .7) * .12; alvo.wag = .1; }
    if(this.noSom){ alvo.cabP = -.2; alvo.pesc = def.altoPesc; }
    alvo.wag = alvo.wag || (est === "natural" ? .12 : 0);
    ["pesc", "cabP", "cabY", "orelhaX", "orelhaL", "orelhaR", "cauda", "curva", "sentar", "cocar"].forEach(n => { p[n] += (alvo[n] - p[n]) * k; });
    /* marcha */
    const trote = vM > 2.3, perna = def.perna;
    if(vM > .05) this.phi += dt * vM * PI2 / (perna * 1.25 + vM * .2);
    const amp = Math.min(.75, vM * (trote ? .17 : .3)), ph = trote ? [0, Math.PI, Math.PI, 0] : [Math.PI / 2, 3 * Math.PI / 2, 0, Math.PI];
    r.pernas.forEach((l, i) => {
      const s = Math.sin(this.phi + ph[i]), cs = Math.cos(this.phi + ph[i]);
      let qx = amp * s, jx = Math.max(0, -cs) * amp * 1.35;
      if(p.sentar > .02){ if(i >= 2){ qx = qx * (1 - p.sentar) + (-1.3) * p.sentar; jx = jx * (1 - p.sentar) + 2.3 * p.sentar; } else { qx = qx * (1 - p.sentar) + .55 * p.sentar; jx *= 1 - p.sentar; } }
      if(p.cocar > .02 && i === 3){ qx = -.9 + Math.sin(t * 22) * .35; jx = 1.2; }
      l.quadril.rotation.x = qx; l.joelho.rotation.x = jx;
    });
    r.corpo.position.y = r.hip * U * (1 - p.sentar * .5) + Math.sin(this.phi * 2) * .012 * U * Math.min(1, vM);
    r.corpo.rotation.z = Math.sin(this.phi) * .035 * Math.min(1, vM);
    r.pesc.rotation.x = p.pesc; r.pesc.rotation.y = p.cabY * .45; r.cab.rotation.x = p.cabP; r.cab.rotation.y = p.cabY * .55; r.cab.rotation.z = p.cocar * .25;
    if(!lod){
      r.orelhas[0].rotation.x = p.orelhaX + p.orelhaL; r.orelhas[1].rotation.x = p.orelhaX + p.orelhaR;
      const w = Math.sin(t * (est === "fugindo" ? 7 : 2.2)) * (alvo.wag || .05);
      r.cauda[0].rotation.x = p.cauda; r.cauda[0].rotation.y = w; r.cauda[1].rotation.x = p.curva - .1; r.cauda[1].rotation.y = w * .7; r.cauda[2].rotation.x = p.curva * .6 - .1;
    }
    /* olhos brilham de noite (luz refletida) */
    const k2 = c.noite > .5 ? Math.min(1, (c.noite - .5) * 2) : 0;
    r.olhos.forEach(o => { o.material.color.lerpColors(o.userData.escuro, o.userData.brilho, k2); o.scale.setScalar(o.scale.x * (1 + (k2 > 0 ? .0 : 0))); });
  }

  /* aplica posição/rotação no modelo (com o corpo acompanhando o relevo) */
  aplica(c){
    const r = this.rig, L = r.comprimento * U * .4, sx = Math.sin(this.yaw), cz = Math.cos(this.yaw);
    const yF = c.chao(this.x + sx * L, this.z + cz * L), yB = c.chao(this.x - sx * L, this.z - cz * L);
    r.root.position.set(this.x, (yF + yB) / 2, this.z); r.root.rotation.y = this.yaw; r.corpo.parent.rotation.x = 0;
    r.corpo.rotation.x = Math.atan2(yB - yF, L * 2) * .9 - this.p.sentar * .55;
  }
  libera(){ this.rig.root.parent && this.rig.root.parent.remove(this.rig.root); this.rig.root.traverse(o => { if(o.isMesh && o.material && o.material.isMeshBasicMaterial) o.material.dispose(); }); }
}
export { pick, rnd, angDif };
