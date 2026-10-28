import { U, ESPECIES } from "../config.js";
import { Animal, rnd } from "./animal.js";
import { DEF } from "./especies.js";

/* ============================================================================================================
   FAUNA DO PASSADO (anos 1950): nas vilas, na Olaria e em Cambará S/A (só quando o jogador chegou pelo portal violeta) a mata era muito mais cheia de bichos.
   O dobro do que há no parque (o parque tem no máximo lobo 1 · graxaim 2 · veado 1 · quati 3 · gambá 1 — aqui, alvo = 2× e ainda arredondado para cima).
   Ajuste ANTIGO.alvo. Os bichos usam os mesmos modelos e o mesmo comportamento do parque (fogem de quem chega perto), mas só vivem dentro dos polígonos do passado.
   (Leão-baio e lontra não entram: dependem do arroio do parque.)
   ============================================================================================================ */
export const ANTIGO = { alvo: { lobo: 3, graxaim: 5, veado: 4, quati: 8, gamba: 3 }, raioAtivoU: 170, raioSpawnU: [20, 140], intervaloS: 1.2 };

export function criarFaunaAntigo(M, ctxParque){
  const S = { poligonos: null, lista: [], t: 0, relogio: 0, pts: [] }, grupo = M.cen.grupo;
  const dentro = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const emAlgum = (x, z) => !!S.poligonos && S.poligonos.some(P => dentro(P, x, z));
  const bate = (x, z, r) => M.cen.colisores.some(k => (!k.ativo || k.ativo()) && x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r);
  const zona = { contem: (x, z) => emAlgum(x, z) && !bate(x, z, 1), perto: () => true, pontosInteresse: () => S.pts };
  const ctx = { pessoasRaw: [], livre: (x, z, r = 1.2) => emAlgum(x, z) && !bate(x, z, r), chao: (x, z) => M.cen.chao(x, z, 1e9), zonas: { recebimento: zona, estacionamento: zona, agua: zona }, noite: 0 };

  function liga(polis){
    S.poligonos = polis; S.pts = [];
    for(const P of polis){ let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); });
      for(let k = 0; k < 60 && S.pts.length < 40; k++){ const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0); if(dentro(P, x, z)) S.pts.push([x, z]); } }
    if(!S.pts.length) S.pts.push([0, 0]);
  }
  function desliga(){ S.lista.forEach(a => a.libera()); S.lista = []; S.poligonos = null; }
  function sorteia(J){
    const falta = Object.keys(ANTIGO.alvo).filter(id => S.lista.filter(a => a.id === id).length < ANTIGO.alvo[id]); if(!falta.length) return;
    const id = falta[Math.floor(Math.random() * falta.length)];
    for(let i = 0; i < 160; i++){ const P = S.poligonos[Math.floor(Math.random() * S.poligonos.length)], ang = Math.random() * 6.283, r = rnd(ANTIGO.raioSpawnU[0], ANTIGO.raioSpawnU[1]) * U, x = J.x + Math.cos(ang) * r, z = J.z + Math.sin(ang) * r;
      if(!dentro(P, x, z) || !ctx.livre(x, z, 1.5)) continue;
      const cfg = { ...ESPECIES[id], duracao: [900, 1800] }, a = new Animal(DEF[id], cfg, ctx, x, z, Math.random() * 6.283); a.estado = "natural"; a.ativ = "parar"; a.durAtiv = rnd(1, 5); grupo.add(a.rig.root); S.lista.push(a); return; }
  }
  function tick(dt, J, E){
    if(!S.poligonos || !J) return; S.relogio += dt; S.t += dt; ctx.noite = E ? E.noite : 0;
    const L = ctx.pessoasRaw; L.length = 0; L.push({ x: J.x, z: J.z, corre: Math.abs(J.vel) > 6, vx: Math.sin(J.yaw), vz: Math.cos(J.yaw), jogador: true });
    if(S.t > ANTIGO.intervaloS){ S.t = 0; for(let k = 0; k < 3; k++) if(S.lista.length < Object.values(ANTIGO.alvo).reduce((a, b) => a + b, 0)) sorteia(J); }
    for(let i = S.lista.length - 1; i >= 0; i--){ const a = S.lista[i], dj = Math.hypot(a.x - J.x, a.z - J.z) / U;
      if(a.fim || dj > ANTIGO.raioAtivoU){ a.libera(); S.lista.splice(i, 1); continue; }
      const longe = dj > 60; a.quadros++; const passo = dj > 120 ? 8 : longe ? 3 : 1; a.dtAcum += dt; if(a.quadros % passo === 0){ const d = a.dtAcum; a.dtAcum = 0; a.update(d, ctx); a.anima(d, ctx, longe); a.aplica(ctx); } }
  }
  return { liga, desliga, tick, lista: S.lista, S, ativo: () => !!S.poligonos, info: () => (S.poligonos ? "Fauna do passado: " + S.lista.length + "/" + Object.values(ANTIGO.alvo).reduce((a, b) => a + b, 0) : null) };
}
