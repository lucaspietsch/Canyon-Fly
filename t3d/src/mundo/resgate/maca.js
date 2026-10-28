import { Group, Mesh, BoxGeometry, CylinderGeometry } from "three";
import { mat } from "../../lib.js";
import { U } from "../config.js";

/* ============================================================================================================
   MACA DE RESGATE RÍGIDA (cesto/"Mamute"): armação tubular vermelha, casca branco-acinzentada, alças laterais pretas (2 de cada lado + 1 em cada ponta) e cintos laranja de fixação
   (três travessas e dois em X no peito). Sem marca. Comprimento ao longo de Z (cabeça em −Z, pés em +Z); a origem é o centro, na altura da casca.
   `cintos(on)` mostra/esconde os cintos (presos só com a vítima). Medidas em metros (× 2,94).
   ============================================================================================================ */

const caixa = (pai, x0, x1, y0, y1, z0, z1, material) => { const o = new Mesh(new BoxGeometry((x1 - x0) * U, (y1 - y0) * U, (z1 - z0) * U), material); o.position.set((x0 + x1) / 2 * U, (y0 + y1) / 2 * U, (z0 + z1) / 2 * U); pai.add(o); return o; };
const tubo = (pai, r, comp, x, y, z, material, eixo, seg = 6) => { const o = new Mesh(new CylinderGeometry(r * U, r * U, comp * U, seg), material); if(eixo === "z") o.rotation.x = Math.PI / 2; else if(eixo === "x") o.rotation.z = Math.PI / 2; o.position.set(x * U, y * U, z * U); pai.add(o); return o; };

let MT = null;
const M = () => MT || (MT = { verm: mat(0xc8201c, { roughness: .4, metalness: .35 }), casca: mat(0xd9dcd8, { roughness: .6 }), cinto: mat(0xe8821a, { roughness: .7 }), alca: mat(0x16171a, { roughness: .7 }), metal: mat(0xa9acae, { roughness: .35, metalness: .8 }) });

export function criarMaca(){
  const m = M(), G = new Group(), L = 2.1, W = .56;
  caixa(G, -W / 2 + .02, W / 2 - .02, -.02, .0, -L / 2 + .04, L / 2 - .04, m.casca);                                  // casca
  [-1, 1].forEach(s => { tubo(G, .016, L - .08, s * W / 2, .03, 0, m.verm, "z"); tubo(G, .014, L - .08, s * (W / 2 - .06), -.01, 0, m.metal, "z"); });   // trilhos
  [-1, 1].forEach(s => { tubo(G, .016, W, 0, .03, s * (L / 2 - .02), m.verm, "x"); });                                  // cabeceiras
  [-.78, -.4, .4, .78].forEach(z => caixa(G, -W / 2 + .02, W / 2 - .02, -.03, .0, z - .015, z + .015, m.verm));          // travessas inferiores
  /* alças laterais (loops pretos) e das pontas */
  const alcas = [];
  [-1, 1].forEach(s => [-.62, .62].forEach(z => { const a = new Group(); a.position.set(s * (W / 2 + .035) * U, .03 * U, z * U); G.add(a); caixa(a, -.03, .03, -.012, .012, -.12, .12, m.alca); caixa(a, -.045, .045, -.03, 0, -.12, -.09, m.alca); caixa(a, -.045, .045, -.03, 0, .09, .12, m.alca); alcas.push({ obj: a, s, z }); }));
  [-1, 1].forEach(s => { const a = new Group(); a.position.set(0, .03 * U, s * (L / 2 + .02) * U); G.add(a); caixa(a, -.12, .12, -.012, .012, -.03, .03, m.alca); alcas.push({ obj: a, s: 0, z: s * 1.07 }); });
  /* cintos laranja */
  const cintos = new Group(); G.add(cintos);
  [-.42, .06, .55].forEach(z => caixa(cintos, -W / 2 + .01, W / 2 - .01, .005, .022, z - .03, z + .03, m.cinto));
  [-1, 1].forEach(s => { const c = caixa(cintos, -.02, .02, .005, .022, -.2, .2, m.cinto); c.position.set(s * .08 * U, .016 * U, -.55 * U); c.rotation.y = s * .55; c.scale.set(1, 1, 1.0); });
  G.traverse(o => { if(o.isMesh) o.castShadow = true; });
  return { obj: G, cintos, alcas, comp: L * U, larg: W * U };
}
