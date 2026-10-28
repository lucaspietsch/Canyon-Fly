import { criarBase } from "./base.js";
import { criarCapim } from "./capim.js";
import { criarArvores } from "./arvores.js";
import { criarSamambaias } from "./samambaias.js";
import { criarTurfeira } from "./turfeira.js";
import { criarPassarelas } from "./passarela.js";
import { criarPlacas } from "./placas.js";
import { qualidade } from "../config.js";

/* VEGETAÇÃO: orquestra capim, samambaias/xaxins e árvores em camadas a partir das áreas do KML (mata, mata mediana/baixa, turfeira). */
export function criarVegetacao(M, vento){
  const t0 = performance.now(), base = criarBase(M), Q = qualidade();
  base.excluir.push((x, z) => !!M.estrada && M.estrada.ocupa(x, z));                                   // nada cresce na pista, no acostamento nem no talude
  const t1 = performance.now(); const capim = criarCapim(M, base, vento);
  const t2 = performance.now(); const arvores = criarArvores(M, base, vento); const t3 = performance.now();
  const turfeira = criarTurfeira(M, base, vento); const t4 = performance.now();
  const samambaias = criarSamambaias(M, base, vento); const t5 = performance.now();
  const passarelas = criarPassarelas(M, base, turfeira); turfeira.passarelas = passarelas;
  const placas = criarPlacas(M, base, turfeira);
  const partes = [turfeira, capim, arvores, samambaias, { regenera(){ passarelas.gera(); placas.gera(); }, info: () => placas.info() }];
  function regenera(){ base.carrega(); partes.forEach(p => p.regenera && p.regenera()); }
  function tick(dt, J, E){ partes.forEach(p => p.tick && p.tick(dt, J, E)); }
  /* turfeira / nascente / sapinho a até ~20 m: o guia explica */
  const U2 = 2.94;
  function lugarPerto(x, z){
    if(M.fauna && M.fauna.aves){ const av = M.fauna.aves.lugarPerto(x, z); if(av) return av; }
    if(M.fauna && M.fauna.sapinhos){ const sp = M.fauna.sapinhos.maisPerto(x, z); if(sp && sp.d < 8 * U2) return { tipo: "sapinho", x: sp.x, z: sp.z }; }
    for(const n of turfeira.nascentes()) if(Math.hypot(n.x - x, n.z - z) < 20 * U2) return { tipo: "nascente", x: n.x, z: n.z };
    if(turfeira.distTurfeira(x, z) < 20 * U2){ const p = turfeira.emTurfeira(x, z) || turfeira.polis().find(q => x > q.bb[0] - 90 && x < q.bb[1] + 90 && z > q.bb[2] - 90 && z < q.bb[3] + 90); return { tipo: "turfeira", x: p ? (p.bb[0] + p.bb[1]) / 2 : x, z: p ? (p.bb[2] + p.bb[3]) / 2 : z }; }
    for(const q of placas.lista()) if(Math.hypot(q.x - x, q.z - z) < 20 * U2) return { tipo: "turfeira", x: q.x, z: q.z };
    return null;
  }
  return { lugarPerto, base, capim, arvores, samambaias, turfeira, passarelas, placas, tick, regenera, adiciona: (p) => partes.push(p), tipoEm: base.tipoEm, fatorMata: base.fatorMata, qualidade: Q, info: () => partes.map(p => p.info && p.info()).filter(Boolean).join(" · ") };
}
