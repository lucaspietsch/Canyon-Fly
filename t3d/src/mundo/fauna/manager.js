import { Vector3, Matrix4, Frustum } from "three";
import { U, FAUNA, ESPECIES, MAPA, CAPIVARAS, pesoHora } from "../config.js";
import { criarZonas } from "./zonas.js";
import { Animal, rnd } from "./animal.js";
import { DEF } from "./especies.js";
import { criarCapivaras } from "./capivaras.js";
import { criarSerpentes } from "./serpentes.js";
import { criarFaunaAntigo } from "./antigo.js";

/* ============================================================================================================
   WILDLIFE MANAGER — sorteia avistamentos, cria/remove os bichos e os atualiza.
   Regras: o animal surge a ≤ 20 m de um grupo de visitantes ou do jogador, fora do campo de visão, dentro da ZONA da espécie; cooldown entre avistamentos;
   no máximo `max` indivíduos por espécie; só se simula quem está perto do jogador. Interação do jogador: só fotografar e manter distância.
   ============================================================================================================ */
export function criarFauna(M){
  const { cen, cam } = M;
  const Z = criarZonas(cen);
  const animais = [], S = {};
  Object.keys(ESPECIES).forEach(id => { S[id] = { proximo: 0, ativos: [], total: 0 }; });
  const grupo = cen.grupo;
  const fr = new Frustum(), pm = new Matrix4(), vv = new Vector3();
  let relogio = 0, tSorteio = 0, noite = 0, dbg = "";
  const ctx = { pessoasRaw: [], livre: Z.livre, chao: (x, z) => cen.chao(x, z, 1e9), zonas: Z.ZONAS, noite: 0 };

  const visivel = (x, z, y = 3) => { vv.set(x, y, z); return fr.containsPoint(vv); };
  const pessoas = (J) => {
    const L = ctx.pessoasRaw; L.length = 0;
    if(J){ const v = Math.abs(J.vel), sx = Math.sin(J.yaw) * Math.sign(J.vel || 1), sz = Math.cos(J.yaw) * Math.sign(J.vel || 1); L.push({ x: J.x, z: J.z, corre: v > FAUNA.corridaFuga, vx: sx, vz: sz, jogador: true }); }
    if(M.gente && M.gente.pessoasPerto) M.gente.pessoasPerto(J ? J.x : 0, J ? J.z : 0, FAUNA.raioAtivo * U, L);
    return L;
  };

  function observadores(J){
    const L = []; if(J) L.push({ x: J.x, z: J.z, tipo: "jogador" });
    if(M.gente && M.gente.observadores) M.gente.observadores(J, FAUNA.raioAtivo * U).forEach(o => L.push(o));
    return L;
  }

  function cria(id, ox, oz, J, forcado, dist){
    const cfg = ESPECIES[id], def = DEF[id], zona = Z.ZONAS[cfg.zona], f = cfg.fatorDist;
    const rMin = Math.max(FAUNA.distancias.alerta * f + 3, 10) * U, rMax = FAUNA.spawnMax * U;
    let p = null, vis = null;
    for(let i = 0; i < 80 && !p; i++){
      const q = Z.amostra(zona, ox, oz, rMin, rMax, 3); if(!q) continue;
      if(J && Math.hypot(q[0] - J.x, q[1] - J.z) < rMin * .85) continue;                           // nunca nasce em cima do jogador
      if(!forcado || i < 60){ if(visivel(q[0], q[1], 3) || visivel(q[0], q[1], 1)) continue; }       // fora do campo de visão no momento do spawn
      p = q;
    }
    if(!p && forcado){ const a = (J ? J.yaw : 0) + Math.PI + rnd(-.8, .8), r = (rMin + rMax) / 2; const x = ox + Math.sin(a) * r, z = oz + Math.cos(a) * r; if(Z.livre(x, z, 1, 20)) p = [x, z]; vis = true; }
    void vis; if(!p) return null;
    const yaw = Math.atan2(ox - p[0], oz - p[1]) + rnd(-.9, .9);
    const a = new Animal(def, cfg, ctx, p[0], p[1], yaw);
    /* entra caminhando de lado, atravessando a frente de quem está olhando (sem se aproximar além do alerta) */
    const r0 = Math.hypot(p[0] - ox, p[1] - oz), a0 = Math.atan2(p[1] - oz, p[0] - ox), sinal = Math.random() < .5 ? 1 : -1;
    for(const k of [1.2, .9, .6]){ const an = a0 + sinal * k, x = ox + Math.cos(an) * r0, z = oz + Math.sin(an) * r0; if(Z.livre(x, z, 1.2, 18) && (!zona.contem || zona.contem(x, z) || true)){ a.entrada = [x, z]; break; } }
    a.sorteioObs = [ox, oz]; grupo.add(a.rig.root); animais.push(a); S[id].ativos.push(a); S[id].total++;
    if(M.fotos && M.fotos.aoSpawn) M.fotos.aoSpawn(a);
    if(dist !== undefined) a.distSpawn = dist;
    return a;
  }

  function tentaSpawn(id, J, forcado = false){
    const cfg = ESPECIES[id], zona = Z.ZONAS[cfg.zona];
    let obs = observadores(J).filter(o => zona.perto(o.x, o.z, FAUNA.spawnMax * U * .6));
    if(!obs.length) return null;
    const o = obs[Math.floor(Math.random() * obs.length)];
    const a = cria(id, o.x, o.z, J, forcado);
    if(a && cfg.dupla && S[id].ativos.length === 1 && cfg.max > 1 && (forcado ? false : Math.random() < cfg.dupla)){
      const b = cria(id, a.x + rnd(-8, 8), a.z + rnd(-8, 8), J, false); if(b){ b.entrada = a.entrada; b.vida = rnd(0, 6); }
    }
    return a;
  }

  /* chamada de depuração: força o avistamento (teletransporta o jogador para a zona se ele estiver longe) */
  function forcar(id, J, teleporta){
    if(!J) return false;
    const cfg = ESPECIES[id], zona = Z.ZONAS[cfg.zona];
    S[id].ativos.slice().forEach(a => { a.fim = true; });
    if(!zona.perto(J.x, J.z, FAUNA.spawnMax * U * .6)){ const t = zona.teleporte; teleporta(t[0], t[1]); J = { ...J, x: t[0], z: t[1] }; }
    S[id].proximo = 0;
    return !!tentaSpawn(id, J, true) || (teleporta && !!tentaSpawn(id, J, true));
  }
  function teletransporta(id, teleporta){ const t = Z.ZONAS[ESPECIES[id].zona].teleporte; teleporta(t[0], t[1]); }

  function remove(a){
    const s = S[a.id]; s.ativos = s.ativos.filter(x => x !== a); const i = animais.indexOf(a); if(i >= 0) animais.splice(i, 1);
    a.libera(); if(s.ativos.length === 0) s.proximo = relogio + rnd(ESPECIES[a.id].cooldown[0], ESPECIES[a.id].cooldown[1]);
  }

  function tick(dt, J, E){
    relogio += dt; ctx.noite = E.noite;
    cam.updateMatrixWorld(); pm.multiplyMatrices(cam.projectionMatrix, vv.set(0, 0, 0) && new Matrix4().copy(cam.matrixWorld).invert()); fr.setFromProjectionMatrix(pm);
    if(!J){ animais.slice().forEach(remove); return; }
    pessoas(J);
    tSorteio += dt;
    if(tSorteio >= FAUNA.intervaloSorteio){ tSorteio = 0;
      Object.keys(ESPECIES).forEach(id => { const cfg = ESPECIES[id], s = S[id]; if(id === "capivara"){ if(!capi.familia && Math.random() < cfg.chance * pesoHora(cfg.horas, E.h)) capi.tenta(J, false, E); return; }
        if(s.ativos.length >= cfg.max || relogio < s.proximo || E.h === undefined) return;
        if(Math.random() < cfg.chance * pesoHora(cfg.horas, E.h)){ const a = tentaSpawn(id, J); if(a && id === "puma" && capi.familia && Math.hypot(a.x - capi.familia.mae.x, a.z - capi.familia.mae.z) / U < 75 && Math.random() < CAPIVARAS.chanceEncontro) capi.encontro(a); } });
    }
    animais.slice().forEach(a => {
      const dj = Math.hypot(a.x - J.x, a.z - J.z) / U;
      if(dj > FAUNA.raioAtivo){ a.fim = true; }                                                    // fora da zona ativa: não é simulado
      a.visivel = visivel(a.x, a.z, a.altura / 2);
      if(a.visivel && dj < MAPA.raioVisao) a.avistadoT = performance.now();
      if(a.fam){ if(a.fim) remove(a); return; }                                                    // família de capivaras: atualizada por capivaras.js
      const longe = dj > FAUNA.lod.longe, mlonge = dj > FAUNA.lod.muitoLonge; a.quadros++;
      const passo = mlonge ? 8 : longe ? 3 : 1; a.dtAcum += dt;
      if(a.quadros % passo === 0){ const d = a.dtAcum; a.dtAcum = 0; a.update(d, ctx); a.anima(d, ctx, longe); a.aplica(ctx); }
      if(a.fim) remove(a);
    });
    capi.tick(dt, J, E); serp.tick(dt, J, E);
    dbg = Object.keys(ESPECIES).filter(id => id !== "capivara").map(id => { const s = S[id], a = s.ativos[0]; return ESPECIES[id].nome + ": " + (a ? a.estado + "/" + a.ativ + " " + a.dmin.toFixed(0) + " m" : s.proximo > relogio ? "cooldown " + Math.ceil(s.proximo - relogio) + " s" : "pronto"); }).join(" | ") + " | " + capi.estadoTexto();
  }
  const serp = criarSerpentes(M, ctx, Z), antigo = criarFaunaAntigo(M, ctx);
  const capi = criarCapivaras(M, ctx, Z, { animais, estado: S, visivel, remove: (a) => remove(a), cria: null });
  /* cria um animal numa posição exata (encontros roteirizados) */
  function criaEm(id, x, z, yaw){ const cfg = ESPECIES[id], a = new Animal(DEF[id], cfg, ctx, x, z, yaw); grupo.add(a.rig.root); animais.push(a); S[id].ativos.push(a); S[id].total++; return a; }
  /* encontro capivaras × leão-baio (depuração: Shift+F7): garante a família num poço e solta o leão-baio a ~48 m, margem acima */
  function forcarEncontro(J, teleporta){
    if(!J) return false;
    S.puma.ativos.slice().forEach(a => { a.fim = true; });
    const zona = Z.ZONAS.agua; let Jp = J;
    if(!capi.familia){ if(!zona.perto(J.x, J.z, FAUNA.spawnMax * U * .6)){ const t = zona.teleporte; teleporta(t[0], t[1]); Jp = { ...J, x: t[0], z: t[1] }; } capi.cooldownZero(); capi.tenta(Jp, true, null); }
    const f = capi.familia; if(!f) return false;
    const m0 = f.mae, L = Z.ZONAS.agua.eixo; let s0 = 0, md = 1e9, acc = 0;
    for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, len = Math.sqrt(l2); let t = ((m0.x - a[0]) * dx + (m0.z - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); const d = Math.hypot(m0.x - (a[0] + dx * t), m0.z - (a[1] + dz * t)); if(d < md){ md = d; s0 = acc + len * t; } acc += len; }
    for(const dir of [1, -1]){ const s = s0 + dir * 46 * U; if(s < 0 || s > acc) continue; const q = Z.pontoNaLista(L, s), x = q[0] - Math.sin(q[2]) * 6, z = q[1] + Math.cos(q[2]) * 6;
      if(ctx.livre(x, z, 1.5, 18)){ const p = criaEm("puma", x, z, Math.atan2(m0.x - x, m0.z - z)); capi.encontro(p); return true; } }
    return false;
  }
  return { serp, capi, antigo, criaEm, forcarEncontro, remove, tick, forcar, teletransporta, animais, estado: S, zonas: Z, ctx, info: () => dbg, perturbaTodos: (n) => animais.forEach(a => a.perturba(n)), visivel,
    maisProximo: (x, z) => animais.reduce((m, a) => { const d = Math.hypot(a.x - x, a.z - z); return !m || d < m.d ? { a, d } : m; }, null) };
}
