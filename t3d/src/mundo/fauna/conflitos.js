import { U, CONFLITOS as C } from "../config.js";
import { rnd, angDif } from "./animal.js";

/* ============================================================================================================
   CONFLITOS NATURAIS (sem violência, sem sangue): o maior avança, o menor percebe, para um instante olhando e se afasta trotando. Ninguém encosta em ninguém.
   • leão-baio × lobo-guará: o leão-baio caminha na direção do lobo; o lobo fica alerta e se afasta. As aves dão alarme e a mata fica em silêncio (aves.js).
   • lobo-guará × graxaim: o graxaim cede o lugar ao lobo-guará.
   • gralhas × gavião: aves.js (as gralhas perseguem o gavião até ele sair).
   • Acontecem sozinhos (chance configurável em config.js → CONFLITOS.chance, com cooldown) ou pelas teclas de depuração. Os guias comentam a cena.
   ============================================================================================================ */

export function criarConflitos(M){
  const F = M.fauna, ctx = F.ctx, S = { cd: rnd(40, 90), ativo: null, t2: 0, log: "—", pumas: new WeakSet(), lobos: new WeakSet() };
  const livre = (x, z) => ctx.livre(x, z, 1.5, 24);
  const dM = (p, q) => Math.hypot(p.x - q.x, p.z - q.z) / U;

  /* encontra onde posicionar o menor (B) e o maior (A): A a 26 m de B, ambos a ≥ 28 m do jogador */
  function acha(ancora, J, lado){
    for(let k = 0; k < 60; k++){
      const bx = ancora.x + (ancora.sorteia ? rnd(-10, 10) * U : 0), bz = ancora.z + (ancora.sorteia ? rnd(-10, 10) * U : 0), a = rnd(0, 6.283), d = rnd(24, 28) * U, ax = bx + Math.sin(a) * d, az = bz + Math.cos(a) * d;
      void lado; if(!livre(bx, bz) || !livre(ax, az)) continue; if(Math.hypot(bx - J.x, bz - J.z) < 28 * U || Math.hypot(ax - J.x, az - J.z) < 26 * U) continue; return { bx, bz, ax, az };
    }
    return null;
  }
  function frente(J, dist){ const a = (J.yaw || 0) + rnd(-.5, .5); return { x: J.x + Math.sin(a) * dist * U, z: J.z + Math.cos(a) * dist * U }; }

  /* ---------- cena: A (maior) avança, B (menor) cede ---------- */
  function inicia(tipo, A, B){
    if(S.ativo) return false;
    [A, B].forEach(a => { a.estado = "natural"; a.vida = 0; a.duracao = Math.max(a.duracao, 240); a.alvo = null; a.roteiro = null; a.vel = 0; a.perturbado = 0; });
    B.ativ = "escutar"; B.durAtiv = 120; B.tAtiv = 0; B.cena = true;
    const d = Math.hypot(B.x - A.x, B.z - A.z), k = Math.max(0, d - 9 * U) / (d || 1);
    A.roteiro = [{ alvo: [A.x + (B.x - A.x) * k, A.z + (B.z - A.z) * k], acao: "olhar", olha: [B.x, B.z], dur: 99, rapido: false }];
    S.ativo = { tipo, A, B, est: "aprox", t: 0 }; S.log = tipo + ": aproxima";
    if(tipo === "pumaLobo" && M.fauna.aves) M.fauna.aves.silencio(A.x, A.z);
    return true;
  }
  function fim(){ const c = S.ativo; if(!c) return; c.B.cena = false; if(!c.A.fim && c.A.estado === "natural"){ c.A.roteiro = null; c.A.sair(); } S.ativo = null; S.cd = rnd(...C.cooldownSeg); S.log = "cooldown"; }
  function tickCena(dt, J){
    const c = S.ativo; if(!c) return; const { A, B } = c; c.t += dt;
    if(A.fim || B.fim){ fim(); return; }
    if(c.est === "aprox"){
      B.ativ = "escutar"; B.tAtiv = 0; B.vel *= .8; if(B.estado !== "natural") B.estado = "natural";
      if(dM(A, B) < C.aproximaM + 6 || c.t > 70){ c.est = "ve"; c.t = 0; S.log = c.tipo + ": percebe"; if(M.fauna.conflitos) avisaGuias(c.tipo === "pumaLobo" ? "lobo" : "graxaim", B.x, B.z, "Conflito natural"); }
    } else if(c.est === "ve"){
      B.yaw += angDif(B.yaw, Math.atan2(A.x - B.x, A.z - B.z)) * Math.min(1, dt * 4); B.ativ = "escutar"; B.vel *= .8;
      if(c.t > 2.4){ c.est = "foge"; c.t = 0; B.cena = false; B.estado = "natural"; B.fugir({ x: A.x, z: A.z }); A.roteiro = [{ alvo: [A.x, A.z], acao: "olhar", olha: [B.x, B.z], dur: 99 }]; S.log = c.tipo + ": " + B.nome + " se afasta"; }
    } else if(c.est === "foge"){
      if(c.t < 4) A.yaw += angDif(A.yaw, Math.atan2(B.x - A.x, B.z - A.z)) * Math.min(1, dt * 2);
      if(c.t > C.fugaSeg) fim();
    }
    void J;
  }

  /* ---------- montagem ---------- */
  function apagaAnimais(ids){ ids.forEach(id => F.estado[id].ativos.slice().forEach(a => { a.fim = true; })); }
  function pumaLobo(J, forca){
    if(S.ativo) return false; if(forca){ apagaAnimais(["puma", "lobo"]); F.animais.filter(a => a.fim).forEach(a => F.remove(a)); }
    const anc = frente(J, 38); anc.sorteia = false; const p = acha(anc, J); if(!p) return false;
    const lobo = F.criaEm("lobo", p.bx, p.bz, Math.random() * 6.28), puma = F.criaEm("puma", p.ax, p.az, Math.atan2(p.bx - p.ax, p.bz - p.az));
    return inicia("pumaLobo", puma, lobo);
  }
  function graxaimLobo(J, forca){
    if(S.ativo) return false; if(forca){ apagaAnimais(["graxaim", "lobo"]); F.animais.filter(a => a.fim).forEach(a => F.remove(a)); }
    const anc = frente(J, 36); anc.sorteia = false; const p = acha(anc, J); if(!p) return false;
    const gx = F.criaEm("graxaim", p.bx, p.bz, Math.random() * 6.28), lobo = F.criaEm("lobo", p.ax, p.az, Math.atan2(p.bx - p.ax, p.bz - p.az));
    return inicia("graxaimLobo", lobo, gx);
  }

  /* ---------- guias, visitantes e conquistas ---------- */
  function avisaGuias(tipo, x, z, titulo){
    let n = 0; if(M.gente && M.gente.reageFauna) n = M.gente.reageFauna(tipo, x, z, 55);
    const J = M.jogador(); if(J && M.conquistas){ const d = Math.hypot(J.x - x, J.z - z) / U;
      if(tipo === "silencio" && d < 60) M.conquistas.dar("sil", "Silêncio da Mata", "Ouviu a mata calar quando o leão-baio passou.");
      if((tipo === "lobo" || tipo === "graxaim" || tipo === "gralha") && d < 70) M.conquistas.dar("conf", "Cada Um no Seu Espaço", "Presenciou um encontro natural entre animais, sem briga: o menor cede e se afasta."); }
    void titulo; return n;
  }

  /* ---------- sorteio automático ---------- */
  function tick(dt, J){
    if(!C.ativo || !J) return; tickCena(dt, J);
    S.cd -= dt; S.t2 -= dt; if(S.t2 > 0 || S.ativo || S.cd > 0) return; S.t2 = 2;
    const lobo = F.estado.lobo.ativos[0], puma = F.estado.puma.ativos[0], gx = F.estado.graxaim.ativos[0], longe = (a) => Math.hypot(a.x - J.x, a.z - J.z) / U > 28;
    if(puma && !S.pumas.has(puma)){ S.pumas.add(puma);
      if(longe(puma) && !lobo && Math.random() < C.chance.pumaLobo){ const anc = { x: puma.x + rnd(-1, 1) * 20 * U, z: puma.z + rnd(-1, 1) * 20 * U }; for(let k = 0; k < 20; k++){ const a = rnd(0, 6.283), d = rnd(24, 28) * U, bx = puma.x + Math.sin(a) * d, bz = puma.z + Math.cos(a) * d; void anc; if(livre(bx, bz) && Math.hypot(bx - J.x, bz - J.z) > 28 * U){ const l = F.criaEm("lobo", bx, bz, Math.random() * 6.28); inicia("pumaLobo", puma, l); return; } } } }
    if(lobo && !S.lobos.has(lobo)){ S.lobos.add(lobo);
      if(gx && longe(lobo) && longe(gx) && dM(lobo, gx) < 70 && Math.random() < C.chance.graxaimLobo){ inicia("graxaimLobo", lobo, gx); return; } }
  }
  return { tick, pumaLobo, graxaimLobo, avisaGuias, get ativo(){ return S.ativo; }, info: () => "Conflito: " + (S.ativo ? S.log : S.cd > 0 ? "cooldown " + Math.ceil(S.cd) + " s" : "pronto") };
}
