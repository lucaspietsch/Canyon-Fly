import { Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial } from "three";
import { canvasTex, mat } from "../../lib.js";
import { U } from "../config.js";

/* ============================================================================================================
   AMBULÂNCIA (furgão de suporte básico: carroceria alta branca, faixa vermelha/laranja, barra de luz vermelha e branca no teto, pisca-alertas na grade e na traseira,
   portas traseiras que abrem, compartimento da maca). Identificação fictícia ("RESGATE 192 · SGV"): sem nome de nenhum serviço real. "AMBULÂNCIA" no capô/teto da frente
   é desenhada ESPELHADA de propósito (para ser lida no retrovisor de quem está à frente). Frente = +Z. Origem no chão, no centro. Medidas em metros (× 2,94).
   ============================================================================================================ */

const caixa = (pai, x0, x1, y0, y1, z0, z1, material) => { const o = new Mesh(new BoxGeometry((x1 - x0) * U, (y1 - y0) * U, (z1 - z0) * U), material); o.position.set((x0 + x1) / 2 * U, (y0 + y1) / 2 * U, (z0 + z1) / 2 * U); pai.add(o); return o; };
const cil = (pai, r, comp, x, y, z, material, seg = 16) => { const o = new Mesh(new CylinderGeometry(r * U, r * U, comp * U, seg), material); o.rotation.z = Math.PI / 2; o.position.set(x * U, y * U, z * U); pai.add(o); return o; };
const decal = (pai, tex, w, h, ry, x, y, z) => { const p = new Mesh(new PlaneGeometry(w * U, h * U), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); p.rotation.y = ry; p.position.set(x * U, y * U, z * U); pai.add(p); return p; };

const emblema = (c, cx, cy, r) => { c.fillStyle = "#e8731a"; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#f6f2e8"; c.beginPath(); c.arc(cx, cy, r * .82, 0, 7); c.fill(); c.strokeStyle = "#d0301e"; c.lineWidth = r * .22; c.lineCap = "round";
  for(let i = 0; i < 3; i++){ const a = i * Math.PI / 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6); c.lineTo(cx - Math.cos(a) * r * .6, cy - Math.sin(a) * r * .6); c.stroke(); } };
const texLado = () => canvasTex(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h);
  c.fillStyle = "#d8291f"; c.fillRect(0, h * .56, w, h * .14); c.fillStyle = "#ee7a1c"; c.fillRect(0, h * .72, w, h * .06); c.fillStyle = "#1b1c1e"; c.fillRect(0, h * .8, w, h * .1);
  emblema(c, w * .72, h * .3, h * .17); c.fillStyle = "#d8291f"; c.textAlign = "center"; c.font = "900 " + Math.round(h * .2) + "px Arial Black, Arial, sans-serif"; c.fillText("RESGATE", w * .3, h * .3); c.font = "900 " + Math.round(h * .17) + "px Arial Black, Arial, sans-serif"; c.fillText("192 · SGV", w * .3, h * .5);
  c.fillStyle = "#e8731a"; c.font = "bold " + Math.round(h * .07) + "px Arial, sans-serif"; c.fillText("UNIDADE DE SUPORTE BÁSICO", w * .5, h * .67); }, { hd: 3, aniso: 8 });
const texFrente = () => canvasTex(512, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.save(); c.translate(w, 0); c.scale(-1, 1); c.fillStyle = "#d8291f"; c.textAlign = "center"; c.font = "900 " + Math.round(h * .5) + "px Arial Black, Arial, sans-serif"; c.fillText("AMBULÂNCIA", w / 2, h * .66); c.restore(); }, { hd: 3, aniso: 8 });   // espelhado de propósito
const texTras = () => canvasTex(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#d8291f"; c.fillRect(0, h * .74, w, h * .1); emblema(c, w / 2, h * .36, h * .2); c.fillStyle = "#d8291f"; c.textAlign = "center"; c.font = "900 " + Math.round(h * .13) + "px Arial Black, Arial, sans-serif"; c.fillText("AMBULÂNCIA", w / 2, h * .7); }, { hd: 3, aniso: 8 });
const texPlaca = () => canvasTex(120, 40, (c, w, h) => { c.fillStyle = "#f4f4f2"; c.fillRect(0, 0, w, h); c.fillStyle = "#1c3f94"; c.fillRect(0, 0, w, 9); c.fillStyle = "#fff"; c.font = "bold 7px Arial"; c.textAlign = "center"; c.fillText("BRASIL", w / 2, 7); c.fillStyle = "#1a1a1a"; c.font = "bold 24px Arial"; c.fillText("SGV9A92", w / 2, 33); }, { hd: 4 });

let MT = null;
const materiais = () => MT || (MT = {
  branco: mat(0xf0f1f1, { roughness: .35, metalness: .2 }), preto: mat(0x16171a, { roughness: .6, metalness: .3 }), pneu: mat(0x101112, { roughness: .95 }), aro: mat(0xbfc3c6, { roughness: .35, metalness: .8 }), interior: mat(0x9aa0a4, { roughness: .8 }), escuro: mat(0x23262a, { roughness: .9 }),
  vidro: new MeshStandardMaterial({ color: 0x1e2b36, roughness: .08, metalness: .85 }), faroi: new MeshStandardMaterial({ color: 0xf6f3e4, emissive: 0xfff2c0, emissiveIntensity: 0, roughness: .2 }),
  barraV: new MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff1a10, emissiveIntensity: 0, roughness: .25 }), barraB: new MeshStandardMaterial({ color: 0xdfe6ee, emissive: 0xdfe9ff, emissiveIntensity: 0, roughness: .25 }), barraA: new MeshStandardMaterial({ color: 0x10308a, emissive: 0x1a50ff, emissiveIntensity: 0, roughness: .25 }),
  pisca: new MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff2010, emissiveIntensity: 0, roughness: .3 }), lanterna: new MeshStandardMaterial({ color: 0x8a1010, emissive: 0xff2410, emissiveIntensity: 0, roughness: .3 }), luz: new MeshBasicMaterial({ color: 0xfff1c8 })
});

export function criarAmbulancia(){
  const M = materiais(), T = new Group(), corpo = new Group(); T.add(corpo); T.userData.ambulancia = true;
  caixa(corpo, -.92, .92, .32, .55, -3.0, 3.05, M.preto);                                    // chassi
  caixa(corpo, -1.0, 1.0, .55, 2.62, -3.0, 1.95, M.branco);                                  // carroceria alta
  caixa(corpo, -.98, .98, .55, 1.28, 1.95, 3.0, M.branco);                                   // capô
  { const pb = caixa(corpo, -.9, .9, 1.28, 2.35, 1.95, 2.02, M.vidro); pb.rotation.x = -.42; pb.position.set(0, 1.78 * U, 2.2 * U); }   // para-brisa inclinado
  caixa(corpo, -.99, .99, 1.28, 1.34, 2.05, 3.0, M.preto);                                    // friso do capô
  caixa(corpo, -.55, .55, .45, .9, 3.0, 3.06, M.preto); caixa(corpo, -.95, .95, .36, .5, 3.0, 3.1, M.preto);       // grade e para-choque
  [-1, 1].forEach(s => { caixa(corpo, s * .72 - .14, s * .72 + .14, .78, .94, 3.0, 3.07, M.faroi); caixa(corpo, s * .35 - .1, s * .35 + .1, .72, .8, 3.07, 3.1, M.pisca); caixa(corpo, s * .985 - .02, s * .985 + .02, 1.55, 2.2, 1.5, 1.98, M.vidro); caixa(corpo, s * 1.0 - .02, s * 1.0 + .02, 1.5, 1.62, .4, .46, M.preto);
    caixa(corpo, s * .8 - .06, s * .8 + .06, 1.0, 1.1, -3.04, -3.0, M.lanterna); caixa(corpo, s * .8 - .06, s * .8 + .06, 1.55, 1.7, -3.04, -3.0, M.pisca); caixa(corpo, s * 1.07 - .03, s * 1.07 + .03, 1.75, 2.0, 2.0, 2.12, M.preto); });   // retrovisores, lanternas
  /* barra de luz (vermelha e branca) na frente do teto + pisca-alertas laterais e traseiros */
  caixa(corpo, -.92, .92, 2.62, 2.72, 1.5, 1.8, M.preto); T.userData.barra = [];
  [-.9, -.63, -.36, -.09].forEach((x, i) => T.userData.barra.push(caixa(corpo, x, x + .24, 2.63, 2.74, 1.52, 1.78, i < 2 ? M.barraV : M.barraB)));
  [.09, .36, .63].forEach((x, i) => T.userData.barra.push(caixa(corpo, x, x + .24, 2.63, 2.74, 1.52, 1.78, i === 1 ? M.barraA : M.barraV)));
  caixa(corpo, .66, .9, 2.63, 2.74, 1.52, 1.78, M.barraB);
  [-1, 1].forEach(s => { caixa(corpo, s * .92 - .1, s * .92 + .1, 2.62, 2.7, -3.0, -2.86, M.barraV); });
  /* identificação (planos de uma face) */
  decal(corpo, texLado(), 4.6, 2.3, -Math.PI / 2, -1.005, 1.32, -.5); decal(corpo, texLado(), 4.6, 2.3, Math.PI / 2, 1.005, 1.32, -.5);
  decal(corpo, texFrente(), 1.5, .48, 0, 0, 2.55, 2.0 + .02); decal(corpo, texTras(), 1.7, .85, Math.PI, 0, 1.5, -3.0 - .01);
  decal(corpo, texPlaca(), .4, .13, 0, 0, .62, 3.08); decal(corpo, texPlaca(), .4, .13, Math.PI, 0, .62, -3.08);
  /* portas traseiras */
  const portas = [-1, 1].map(s => { const P = new Group(); P.position.set(s * 1.0 * U, 0, -3.0 * U); corpo.add(P); const f = caixa(P, -s * .96 - .0, -s * .02, .6, 2.55, -.07, 0, M.branco); void f; caixa(P, s * -.8 - .2, s * -.2, 1.3, 2.1, -.08, -.06, M.vidro); caixa(P, s * -.05 - .03, s * -.05 + .03, 1.2, 1.3, -.1, -.07, M.preto); return P; });
  /* compartimento (visível quando as portas abrem) */
  caixa(corpo, -.95, .95, .6, .66, -2.98, 1.0, M.interior); caixa(corpo, -.96, -.9, .66, 2.4, -2.98, 1.0, M.escuro); caixa(corpo, .9, .96, .66, 2.4, -2.98, 1.0, M.escuro); caixa(corpo, -.9, .9, 2.4, 2.5, -2.98, 1.0, M.luz);
  caixa(corpo, -.9, -.3, .66, 1.0, -2.8, -1.2, M.escuro);   // banco lateral
  const rs = []; [[-1, 2.0, true], [1, 2.0, true], [-1, -1.95, false], [1, -1.95, false]].forEach(([s, z, frente]) => { const pos = new Group(); pos.position.set(s * .93 * U, .38 * U, z * U); corpo.add(pos); const ester = new Group(); pos.add(ester); const giro = new Group(); ester.add(giro); cil(giro, .38, .26, 0, 0, 0, M.pneu, 18); cil(giro, .27, .27, s * .006, 0, 0, M.aro, 12); cil(giro, .09, .28, s * .012, 0, 0, M.preto, 8); rs.push({ pos, ester, giro, frente, lado: s }); });
  [-1, 1].forEach(s => { [2.0, -1.95].forEach(z => caixa(corpo, s * .93 - .05, s * .93 + .05, .76, .86, z - .5, z + .5, M.preto)); });
  const abre = (a) => { portas[0].rotation.y = -a; portas[1].rotation.y = a; };
  T.traverse(o => { if(o.isMesh && o.material && o.material.isMeshStandardMaterial) o.castShadow = true; });
  return { obj: T, corpo, rodas: rs, portas, abre, luzes: { barraV: M.barraV, barraB: M.barraB, barraA: M.barraA, pisca: M.pisca, farol: M.faroi, lanterna: M.lanterna }, raio: .38 * U, interior: [0, .7 * U, -1.2 * U], porta: [0, 0, -3.4 * U], comp: 6.1 * U, larg: 2.1 * U };
}
