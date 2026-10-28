import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial } from "three";
import { canvasTex, mat } from "../../lib.js";
import { U } from "../config.js";

/* ============================================================================================================
   QUADRICICLO DO BOMBEIRO CIVIL: utilitário 4×4 vermelho e preto (modelado a partir das fotos: para-lamas e capô vermelhos, quadro/racks/bagageiro pretos, faróis duplos,
   banco preto, rack dianteiro e traseiro com grades), com caixa de primeiros socorros no rack traseiro e giroflex (vermelho/azul) num mastro. Sem nenhuma marca de fabricante:
   a identificação é fictícia ("BOMBEIRO CIVIL", "SGV-01"). Medidas em metros (× 2,94). Frente = +Z; esquerda = −X. A origem é o chão, entre os eixos.
   Partes móveis devolvidas: rodas (giro + esterçamento das dianteiras), guidão, giroflex e faróis (materiais emissivos), capacete deixado no banco.
   ============================================================================================================ */

const G = {}; const geo = (k, f) => (G[k] = G[k] || f());
const caixa = (pai, x0, x1, y0, y1, z0, z1, material) => { const o = new Mesh(geo("b", () => new BoxGeometry(1, 1, 1)), material); o.scale.set((x1 - x0) * U, (y1 - y0) * U, (z1 - z0) * U); o.position.set((x0 + x1) / 2 * U, (y0 + y1) / 2 * U, (z0 + z1) / 2 * U); pai.add(o); return o; };
const cil = (pai, r, comp, x, y, z, material, eixo = "x", seg = 10) => { const o = new Mesh(geo("c" + seg, () => new CylinderGeometry(1, 1, 1, seg)), material); o.scale.set(r * U, comp * U, r * U); if(eixo === "x") o.rotation.z = Math.PI / 2; else if(eixo === "z") o.rotation.x = Math.PI / 2; o.position.set(x * U, y * U, z * U); pai.add(o); return o; };

let MT = null;
const materiais = () => MT || (MT = {
  vermelho: mat(0xc4141b, { roughness: .35, metalness: .35 }), preto: mat(0x121315, { roughness: .6, metalness: .3 }), pneu: mat(0x0c0d0e, { roughness: .97 }), aro: mat(0x1b1c1e, { roughness: .5, metalness: .6 }), cubo: mat(0x9a9da0, { roughness: .4, metalness: .8 }),
  banco: mat(0x17181a, { roughness: .9 }), branco: mat(0xeceeef, { roughness: .45 }), cromo: mat(0xb8bbbe, { roughness: .3, metalness: .8 }),
  farol: new MeshStandardMaterial({ color: 0xf6f3e4, emissive: 0xfff2c0, emissiveIntensity: 0, roughness: .2 }), lanterna: new MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff2410, emissiveIntensity: 0, roughness: .3 }),
  giroV: new MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff2010, emissiveIntensity: 0, roughness: .3 }), giroA: new MeshStandardMaterial({ color: 0x10308a, emissive: 0x1a50ff, emissiveIntensity: 0, roughness: .3 }),
  capacete: mat(0xc0141a, { roughness: .25, metalness: .2 }), viseira: mat(0x14181c, { roughness: .1, metalness: .6 })
});
export const luzesDoQuadriciclo = () => { const M = materiais(); return { farol: M.farol, lanterna: M.lanterna, giroV: M.giroV, giroA: M.giroA }; };

const texCruz = () => canvasTex(96, 96, (c, w, h) => { c.fillStyle = "#f3f3f1"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c0301e"; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = "#c8201a"; c.fillRect(w * .4, h * .2, w * .2, h * .6); c.fillRect(w * .2, h * .4, w * .6, h * .2); }, { hd: 3 });
const texNome = (txt, w = 320, h = 64) => canvasTex(w, h, (c, ww, hh) => { c.clearRect(0, 0, ww, hh); c.fillStyle = "#f6f6f2"; c.font = "900 " + Math.round(hh * .56) + "px Arial Black, Arial, sans-serif"; c.textAlign = "center"; c.fillText(txt, ww / 2, hh * .68); }, { hd: 3, aniso: 8 });
const decal = (pai, tex, w, h, ry, x, y, z) => { const p = new Mesh(new PlaneGeometry(w * U, h * U), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); p.rotation.y = ry; p.position.set(x * U, y * U, z * U); pai.add(p); return p; };

const RAIO = .3, EIXO_F = .66, EIXO_T = -.62, VIA = .5, LARG = .22;

export function criarQuadriciclo(){
  const M = materiais(), T = new Group(), corpo = new Group(); T.add(corpo); T.userData.quadriciclo = true;
  /* quadro e carroceria */
  caixa(corpo, -.3, .3, .26, .46, -.9, .95, M.preto);
  caixa(corpo, -.5, .5, .46, .62, -1.0, -.18, M.vermelho);                                  // tampa traseira (entre os para-lamas)
  [-1, 1].forEach(s => { caixa(corpo, s * .62 - .08, s * .62 + .08, .56, .68, -.98, -.22, M.vermelho); caixa(corpo, s * .56 - .08, s * .56 + .08, .56, .7, .34, 1.02, M.vermelho); });   // para-lamas
  [-1, 1].forEach(s => { caixa(corpo, s * .43 - .09, s * .43 + .09, .46, .6, -.98, -.22, M.vermelho); caixa(corpo, s * .43 - .09, s * .43 + .09, .46, .66, .3, .98, M.vermelho); });
  { const capo = caixa(corpo, -.4, .4, .62, .78, .3, .98, M.vermelho); capo.rotation.x = .12; }
  caixa(corpo, -.28, .28, .7, .94, -.05, .46, M.preto);                                      // tanque/cobertura central preta
  caixa(corpo, -.22, .22, .78, .87, -.62, -.02, M.banco);                                    // banco
  caixa(corpo, -.3, .3, .5, .78, -.7, -.2, M.preto);                                         // lateral do banco
  [-1, 1].forEach(s => { caixa(corpo, s * .5 - .1, s * .5 + .1, .27, .3, -.2, .38, M.preto); });   // estribos
  /* frente: grade, para-choque, faróis duplos e rack dianteiro */
  caixa(corpo, -.28, .28, .4, .66, .98, 1.04, M.preto);
  [-1, 1].forEach(s => caixa(corpo, s * .33 - .12, s * .33 + .12, .62, .74, .94, 1.0, M.farol));
  caixa(corpo, -.44, .44, .3, .38, .96, 1.06, M.preto);                                      // para-choque
  { const g = new Group(); corpo.add(g); [-1, 1].forEach(s => { cil(g, .012, .45, s * .38, .9, .72, M.preto, "z", 6); cil(g, .012, .3, s * .38, .8, .98, M.preto, "y", 6); }); cil(g, .012, .76, 0, .9, 1.0, M.preto, "x", 6); cil(g, .012, .76, 0, .9, .52, M.preto, "x", 6); caixa(g, -.36, .36, .87, .895, .55, 1.0, M.preto); }
  /* rack traseiro com grades e caixa de primeiros socorros */
  { caixa(corpo, -.42, .42, .78, .8, -1.0, -.22, M.preto); [-1, 1].forEach(s => { cil(corpo, .012, .78, s * .42, .85, -.61, M.preto, "z", 6); }); cil(corpo, .012, .84, 0, .86, -1.0, M.preto, "x", 6);
    const cx = caixa(corpo, -.3, .3, .8, 1.0, -.96, -.52, M.branco);
    decal(corpo, texCruz(), .16, .16, Math.PI, 0, .92, -.965); decal(corpo, texCruz(), .16, .16, -Math.PI / 2, -.305, .92, -.74); decal(corpo, texCruz(), .16, .16, Math.PI / 2, .305, .92, -.74); void cx;
    /* mastro do giroflex + barra de luz */
    cil(corpo, .012, .62, .26, 1.1, -.95, M.cromo, "y", 6); caixa(corpo, .08, .44, 1.4, 1.46, -1.0, -.9, M.preto);
    const gv = caixa(corpo, .08, .26, 1.41, 1.5, -1.01, -.89, M.giroV), ga = caixa(corpo, .26, .44, 1.41, 1.5, -1.01, -.89, M.giroA); T.userData.giroV = gv; T.userData.giroA = ga;
    caixa(corpo, -.08, .08, .74, .82, -1.02, -.98, M.lanterna); }
  /* identificação fictícia nas laterais (planos de uma face, orientados) */
  [-1, 1].forEach(s => { decal(corpo, texNome("BOMBEIRO CIVIL"), .5, .1, s < 0 ? -Math.PI / 2 : Math.PI / 2, s * .712, .62, -.6); decal(corpo, texNome("SGV-01", 160, 64), .24, .1, s < 0 ? -Math.PI / 2 : Math.PI / 2, s * .652, .6, .66); });
  /* guidão (gira como um todo) */
  const guidao = new Group(); guidao.position.set(0, .86 * U, .3 * U); corpo.add(guidao);
  cil(guidao, .02, .28, 0, .09, -.02, M.preto, "y", 6); cil(guidao, .014, .88, 0, .2, -.02, M.preto, "x", 6); [-1, 1].forEach(s => { cil(guidao, .02, .12, s * .4, .2, -.02, M.banco, "x", 7); cil(guidao, .012, .1, s * .3, .2, .06, M.preto, "z", 5); });
  caixa(guidao, -.12, .12, .1, .22, .0, .14, M.preto); caixa(guidao, -.07, .07, .2, .26, .04, .12, M.viseira);
  /* rodas: o esterçamento (dianteiras) fica num grupo e o giro no outro */
  const rodas = [];
  [[-1, EIXO_F, true], [1, EIXO_F, true], [-1, EIXO_T, false], [1, EIXO_T, false]].forEach(([s, z, frente]) => {
    const pos = new Group(); pos.position.set(s * VIA * U, RAIO * U, z * U); corpo.add(pos); const ester = new Group(); pos.add(ester); const giro = new Group(); ester.add(giro);
    cil(giro, RAIO, LARG, 0, 0, 0, M.pneu, "x", 20); cil(giro, RAIO * .56, LARG + .01, s * .004, 0, 0, M.aro, "x", 12); cil(giro, .05, LARG + .02, s * .012, 0, 0, M.cubo, "x", 8);
    for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; const k = caixa(giro, -LARG / 2 - .005, LARG / 2 + .005, -.02, .02, 0, .05, M.pneu); k.position.set(0, Math.sin(a) * (RAIO + .01) * U, Math.cos(a) * (RAIO + .01) * U); k.rotation.x = -a + Math.PI / 2; k.scale.set((LARG + .01) * U, .04 * U, .05 * U); }   // garras do pneu
    rodas.push({ pos, ester, giro, frente, lado: s });
  });
  /* capacete deixado sobre o banco quando o bombeiro desce */
  const cap = new Group(); { const c = new Mesh(new SphereGeometry(.15 * U, 12, 9, 0, Math.PI * 2, 0, Math.PI * .72), M.capacete); c.position.y = .02 * U; cap.add(c); const v = new Mesh(new BoxGeometry(.2 * U, .07 * U, .1 * U), M.viseira); v.position.set(0, -.01 * U, .12 * U); cap.add(v); }
  cap.position.set(0, .9 * U, -.28 * U); cap.visible = false; corpo.add(cap);
  T.traverse(o => { if(o.isMesh && o.material && o.material.isMeshStandardMaterial) o.castShadow = true; });
  return { obj: T, corpo, rodas, guidao, capacete: cap, luzes: luzesDoQuadriciclo(), raio: RAIO * U, eixoF: EIXO_F * U, eixoT: EIXO_T * U, via: VIA * U, assento: [0, .87 * U, -.3 * U] };
}
