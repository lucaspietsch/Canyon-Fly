import { Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, DoubleSide, Color } from "three";
import { canvasTex, texPlacaHD, mat, m } from "../../lib.js";
import { desenhaLogo } from "./logo.js";
import { CAMIONETES } from "../config.js";

/* ============================================================================================================
   CAMIONETES DO ICMBio (cabine dupla branca com faixa verde, quebra-mato preto, logo e placa amarela "USO EXCLUSIVO EM SERVIÇO").
   As três usam a MESMA geometria e os MESMOS materiais; só mudam os decalques (numeração da frota e placa fictícia Mercosul).
   Medidas em metros (× 2,94). Frente do veículo = +Z; lado esquerdo = −X.
   ============================================================================================================ */

const G = {}; const geo = (k, f) => (G[k] = G[k] || f());
const caixa = (pai, x0, x1, y0, y1, z0, z1, material) => { const g = geo("b", () => new BoxGeometry(1, 1, 1)); const o = new Mesh(g, material); o.scale.set((x1 - x0) * 2.94, (y1 - y0) * 2.94, (z1 - z0) * 2.94); o.position.set((x0 + x1) / 2 * 2.94, (y0 + y1) / 2 * 2.94, (z0 + z1) / 2 * 2.94); pai.add(o); return o; };
const cil = (pai, r, comp, x, y, z, material, eixo = "x", seg = 14) => { const o = new Mesh(geo("c" + seg, () => new CylinderGeometry(1, 1, 1, seg)), material); o.scale.set(r * 2.94, comp * 2.94, r * 2.94); if(eixo === "x") o.rotation.z = Math.PI / 2; else if(eixo === "z") o.rotation.x = Math.PI / 2; o.position.set(x * 2.94, y * 2.94, z * 2.94); pai.add(o); return o; };

/* materiais compartilhados pelas três */
let MT = null;
const materiais = () => MT || (MT = {
  branco: mat(0xe9ebec, { roughness: .35, metalness: .25 }), preto: mat(0x17181a, { roughness: .6, metalness: .3 }), pneu: mat(0x101112, { roughness: .95 }), aro: mat(0xbfc3c6, { roughness: .35, metalness: .8 }),
  vidro: new MeshStandardMaterial({ color: 0x20303c, roughness: .08, metalness: .85, map: canvasTex(64, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#8aa4b8"); g.addColorStop(.35, "#34495a"); g.addColorStop(.55, "#1b2833"); g.addColorStop(.62, "#5d7a8e"); g.addColorStop(1, "#1a2530"); c.fillStyle = g; c.fillRect(0, 0, w, h); }) }),
  interior: mat(0x24262a, { roughness: 1 }), farol: new MeshStandardMaterial({ color: 0xf6f3e4, emissive: 0xfff2c0, emissiveIntensity: 0, roughness: .2 }), lanterna: new MeshStandardMaterial({ color: 0x9a1414, emissive: 0xff2410, emissiveIntensity: 0, roughness: .3 }),
  verde: mat(0x2a8a3c, { roughness: .5 }), cinza: mat(0x6f7478, { roughness: .8 }), giro: new MeshStandardMaterial({ color: 0xffa500, emissive: 0xff8a00, emissiveIntensity: 0, roughness: .3 }), sujeira: new MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
});

/* decalque (plano de uma face só, virado para fora). `lado`: -1 esquerdo (−X), +1 direito (+X). Frente do veículo à direita de quem olha o lado esquerdo e à esquerda de quem olha o direito. */
const decalque = (pai, tex, w, h, lado, x, y, z) => {
  const p = new Mesh(new PlaneGeometry(w * 2.94, h * 2.94), new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  p.rotation.y = lado < 0 ? -Math.PI / 2 : Math.PI / 2; p.position.set(x * 2.94, y * 2.94, z * 2.94); pai.add(p); return p;
};
/* desenha um decalque do lado `lado`: a função recebe (c, w, h, frenteNaDireita) e desenha em coordenadas normais */
const texLado = (lado, w, h, desenha) => canvasTex(w, h, (c, ww, hh) => { c.clearRect(0, 0, ww, hh); desenha(c, ww, hh, lado < 0); }, { hd: 4, aniso: 8 });

const faixaVerde = (c, w, h, frenteDireita) => {
  /* três ondas verdes que sobem da frente para trás; a frente fica do lado certo conforme o lado do veículo */
  const X = (t) => (frenteDireita ? t : 1 - t) * w;
  const onda = (cor, a0, a1, b0, b1) => { c.fillStyle = cor; c.beginPath(); c.moveTo(X(0), h * a0); c.bezierCurveTo(X(.3), h * (a0 + .05), X(.55), h * (b0 - .25), X(1), h * b0); c.lineTo(X(1), h * b1); c.bezierCurveTo(X(.55), h * (b1 - .2), X(.3), h * (a1 + .02), X(0), h * a1); c.closePath(); c.fill(); };
  onda("#6fbf3a", .55, .72, .12, .42); onda("#1f7a35", .72, .86, .38, .6); onda("#1a2a22", .86, 1, .56, .74);
};

export function criarCamionete({ numero, placa, aberta = false, suja = false, lado: _ }){
  const M = materiais(), T = new Group(); T.userData.camionete = numero;
  /* carroceria */
  caixa(T, -.92, .92, .42, .98, -2.62, 2.62, M.branco);
  caixa(T, -.9, .9, .98, 1.1, .95, 2.6, M.branco);                                 // capô
  caixa(T, -.86, .86, .98, 1.82, -.5, .98, M.branco);                              // cabine
  caixa(T, -.8, .8, 1.82, 1.85, -.4, .9, M.branco);                                // teto
  caixa(T, -.93, .93, .3, .46, -2.55, 2.55, M.preto);                              // soleira/estribo
  /* caçamba */
  caixa(T, -.9, .9, .98, 1.02, -2.6, -.5, M.interior); [-1, 1].forEach(s => caixa(T, s * .9 - .035, s * .9 + .035, .98, 1.46, -2.62, -.5, M.branco));
  caixa(T, -.9, .9, .98, 1.46, -2.66, -2.6, M.branco); caixa(T, -.9, .9, .98, 1.46, -.56, -.5, M.branco);
  /* vidros: para-brisa inclinado, laterais e traseiro */
  { const pb = caixa(T, -.78, .78, 1.1, 1.78, .98, 1.06, M.vidro); pb.rotation.x = -.5; pb.position.z = 1.05 * 2.94; pb.position.y = 1.4 * 2.94; }
  [-1, 1].forEach(s => { caixa(T, s * .87 - .01, s * .87 + .01, 1.15, 1.75, .12, .92, M.vidro); caixa(T, s * .87 - .01, s * .87 + .01, 1.15, 1.75, -.46, .08, M.vidro); });
  caixa(T, -.7, .7, 1.2, 1.72, -.52, -.49, M.vidro);
  /* interior visível pela porta aberta: bancos e volante */
  [-.4, .4].forEach(x => { caixa(T, x - .22, x + .22, 1.0, 1.4, .12, .5, M.interior); caixa(T, x - .22, x + .22, 1.4, 1.75, .06, .16, M.interior); });
  cil(T, .17, .05, -.4, 1.35, .95, M.preto, "z");
  /* portas dianteiras (grupo com dobradiça na frente; a da esquerda abre na camionete aberta) */
  const portas = [-1, 1].map(s => {
    const P = new Group(); P.position.set(s * .9 * 2.94, 0, .96 * 2.94); T.add(P);
    caixa(P, -.03 * s - .035, -.03 * s + .035, .5, 1.83, -.86, 0, M.branco);
    caixa(P, -.03 * s - .03, -.03 * s + .03 + (s > 0 ? .03 : -.03) * 0, 1.2, 1.78, -.8, -.06, M.vidro).position.x += s * .02 * 2.94;
    caixa(P, s * .02 - .02, s * .02 + .02, 1.05, 1.1, -.2, -.05, M.preto);       // maçaneta
    return P;
  });
  portas.forEach(P => { P.rotation.y = 0; });
  if(aberta){ portas[0].rotation.y = 1.0; }
  /* rodas */
  [[-1, 1.5], [1, 1.5], [-1, -1.5], [1, -1.5]].forEach(([s, z]) => { const W = new Group(); W.position.set(s * .93 * 2.94, .38 * 2.94, z * 2.94); T.add(W); cil(W, .38, .27, 0, 0, 0, M.pneu, "x", 18); cil(W, .26, .28, s * .005, 0, 0, M.aro, "x", 12); cil(W, .08, .3, 0, 0, 0, M.cinza, "x", 8); });
  [[-1, 1.5], [1, 1.5], [-1, -1.5], [1, -1.5]].forEach(([s, z]) => caixa(T, s * .93 - .05, s * .93 + .05, .76, .86, z - .5, z + .5, M.preto));      // paralamas (parte alta do arco)
  /* quebra-mato, faróis, lanternas, espelhos */
  caixa(T, -.78, .78, .5, .95, 2.62, 2.7, M.preto);
  [-.5, .5].forEach(x => cil(T, .045, .5, x, .72, 2.9, M.preto, "y", 8)); cil(T, .05, 1.5, 0, .55, 2.9, M.preto, "x", 8); cil(T, .05, 1.5, 0, .95, 2.9, M.preto, "x", 8); [-.74, .74].forEach(x => cil(T, .045, .45, x, .75, 2.82, M.preto, "y", 8));
  [-.62, .62].forEach(x => caixa(T, x - .17, x + .17, .86, 1.02, 2.58, 2.66, M.farol)); [-.88, .88].forEach(x => caixa(T, x - .035, x + .035, .75, 1.0, -2.68, -2.62, M.lanterna));
  [-1, 1].forEach(s => caixa(T, s * .96 - .06, s * .96 + .06, 1.4, 1.6, 1.0, 1.15, M.preto));
  /* faixas e decalques dos dois lados */
  [-1, 1].forEach(lado => {
    decalque(T, texLado(lado, 512, 96, faixaVerde), 4.4, .46, lado, lado * .925, .66, -.1);
    /* placa amarela na porta da frente */
    decalque(T, texLado(lado, 256, 128, (c, w, h) => { c.fillStyle = "#f2c200"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a6c00"; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4); c.fillStyle = "#1a1a1a"; c.textAlign = "center"; c.font = "bold 48px Arial"; c.fillText("ICMBio", w / 2, 52); c.font = "bold 14px Arial"; c.fillText("INSTITUTO CHICO MENDES", w / 2, 74); c.font = "bold 17px Arial"; c.fillText("USO EXCLUSIVO", w / 2, 100); c.fillText("EM SERVIÇO", w / 2, 120); }), .55, .27, lado, lado * (.9 + .045), .88, 1.0 - .4);
    /* logo (verde) na porta de trás */
    decalque(T, texLado(lado, 200, 230, (c, w, h) => desenhaLogo(c, w, h, "verde")), .42, .48, lado, lado * .875, 1.3, -.05 + .1);
    /* nome da unidade e numeração da frota na caçamba */
    decalque(T, texLado(lado, 512, 96, (c, w, h) => { c.fillStyle = "#1f7a35"; c.textAlign = "center"; c.font = "bold 30px Arial"; c.fillText("PARQUE NACIONAL DA SERRA GERAL", w / 2, 40); c.font = "bold 24px Arial"; c.fillStyle = "#0a5a2c"; c.fillText("ICMBio · VTR " + numero, w / 2, 76); }), 1.9, .35, lado, lado * .94, 1.18, -1.55);
  });
  /* placas Mercosul (fictícias) e logo na tampa traseira, viradas para fora (1 face) */
  const placaTex = texPlacaHD(120, 40, (c, w, h) => { c.fillStyle = "#f4f4f2"; c.fillRect(0, 0, w, h); c.fillStyle = "#1c3f94"; c.fillRect(0, 0, w, 9); c.fillStyle = "#fff"; c.font = "bold 7px Arial"; c.textAlign = "center"; c.fillText("BRASIL", w / 2, 7); c.fillStyle = "#111"; c.font = "bold 24px Arial"; c.fillText(placa, w / 2, 33); c.strokeStyle = "#999"; c.lineWidth = 1; c.strokeRect(.5, .5, w - 1, h - 1); });
  [[1, 2.74, 0], [-1, -2.69, Math.PI]].forEach(([f, z, ry]) => { const p = new Mesh(new PlaneGeometry(.4 * 2.94, .13 * 2.94), new MeshBasicMaterial({ map: placaTex })); p.position.set(0, (f > 0 ? .62 : 1.2) * 2.94, z * 2.94 + f * .05); p.rotation.y = ry; T.add(p); });
  { const p = new Mesh(new PlaneGeometry(.5 * 2.94, .58 * 2.94), new MeshBasicMaterial({ map: texLado(1, 200, 230, (c, w, h) => desenhaLogo(c, w, h, "verde")), transparent: true, depthWrite: false })); p.position.set(.45 * 2.94, 1.3 * 2.94, -2.685 * 2.94); p.rotation.y = Math.PI; T.add(p); }
  /* giroflex opcional no teto (acende de noite se CAMIONETES.giroflexNoite) */
  const giro = new Mesh(new BoxGeometry(.5 * 2.94, .1 * 2.94, .16 * 2.94), M.giro); giro.position.set(0, 1.92 * 2.94, .3 * 2.94); giro.visible = CAMIONETES.giroflexNoite; T.add(giro); T.userData.giro = giro;
  /* sujeira de estrada de chão: faixa marrom nas laterais e nas rodas */
  if(suja){ const tx = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, h, 0, 0); g.addColorStop(0, "rgba(120,78,44,.85)"); g.addColorStop(.6, "rgba(130,88,52,.45)"); g.addColorStop(1, "rgba(130,88,52,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); for(let i = 0; i < 60; i++){ c.fillStyle = `rgba(110,70,40,${.15 + Math.random() * .25})`; c.fillRect(Math.random() * w, Math.random() * h * .6 + h * .3, 2 + Math.random() * 5, 2 + Math.random() * 4); } });
    [-1, 1].forEach(lado => decalque(T, tx, 5.2, .55, lado, lado * .935, .55, 0).material.depthWrite = false); }
  /* cores de partes sujeitas ao ciclo (faróis) ficam nos materiais compartilhados */
  T.traverse(o => { if(o.isMesh && o.material && o.material.isMeshStandardMaterial) o.castShadow = true; });
  return T;
}
export const luzesDaCamionete = () => { const M = materiais(); return { farol: M.farol, lanterna: M.lanterna, giro: M.giro }; };
void Color; void DoubleSide; void m;
