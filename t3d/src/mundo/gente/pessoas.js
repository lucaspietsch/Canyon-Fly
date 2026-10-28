import { InstancedMesh, BoxGeometry, SphereGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, Matrix4, Color, Frustum, Vector3, DynamicDrawUsage } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { texLogo, LOGO_ASPECTO } from "../icmbio/logo.js";
import { texTag } from "../resgate/tags.js";

/* ============================================================================================================
   PESSOAS INSTANCIADAS
   Todos os visitantes, guias, alunos e a equipe do ICMBio usam o MESMO conjunto de InstancedMesh (um por tipo de peça: pernas, tronco, braços, cabeça, chapéu,
   mochila, colete, logos...). Cada pessoa é só uma struct (posição, pose, cores, acessórios) de um pool reutilizável: nada é criado ou destruído em jogo.
   Frente = +Z, esquerda da pessoa = +X (por isso a logo pequena do peito fica em +X e a grande das costas em −Z, de frente para trás).
   ============================================================================================================ */

const caixa = (w, h, d, x = 0, y = 0, z = 0) => { const g = new BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
const GEO = {
  perna: caixa(.56, 2.35, .62, 0, -1.175, 0), bota: caixa(.62, .55, .86, 0, -2.08, .1), tronco: caixa(1.5, 1.95, .82, 0, .98, 0), colete: caixa(1.62, 1.5, .98, 0, 1.0, 0),
  braco: caixa(.4, 1.75, .44, 0, -.875, 0), mao: new SphereGeometry(.24, 7, 5), cabeca: new SphereGeometry(.5, 10, 8), cabelo: new SphereGeometry(.54, 9, 6, 0, Math.PI * 2, 0, Math.PI * .62),
  rabo: new SphereGeometry(.22, 6, 5), mochila: caixa(1.0, 1.4, .55), garrafa: new CylinderGeometry(.16, .16, .8, 7), bastao: new CylinderGeometry(.05, .05, 3.8, 5), celular: caixa(.3, .5, .07),
  binoculo: caixa(.62, .3, .34), prancheta: caixa(.72, .96, .05), radio: caixa(.22, .46, .18), logo: new PlaneGeometry(1, 1)
};
GEO.faixa = new BoxGeometry(1, 1, 1);
{ const copa = new SphereGeometry(.6, 12, 9, 0, Math.PI * 2, 0, Math.PI * .68); copa.translate(0, .12, 0); const viseira = caixa(.78, .26, .26, 0, .0, .52); const queixo = caixa(.7, .2, .3, 0, -.34, .4); const aba = caixa(.62, .05, .36, 0, .3, .62); GEO.capacete = mergeGeometries([copa, viseira, queixo, aba]); }
GEO.cabelo.translate(0, .05, -.04); GEO.rabo.translate(0, 0, 0);
{ const brim = new CylinderGeometry(1.05, 1.05, .06, 14); brim.translate(0, .06, 0); const copa = new CylinderGeometry(.56, .62, .42, 12); copa.translate(0, .27, 0); GEO.chapeu = mergeGeometries([brim, copa]); }
{ const copa = new SphereGeometry(.56, 10, 6, 0, Math.PI * 2, 0, Math.PI * .5); copa.translate(0, .1, 0); const aba = caixa(.7, .05, .55, 0, .12, .62); GEO.bone = mergeGeometries([copa, aba]); }

const std = (o = {}) => new MeshStandardMaterial({ roughness: .92, metalness: 0, ...o });
const LOGO_PEITO_W = .52, LOGO_COSTAS_W = 1.2;
const tagMat = (t, l) => new MeshBasicMaterial({ map: texTag(t, l), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

export function criarPessoas(pai, MAX){
  const L = [];
  const mk = (geo, { material = std(), sombra = false, n = MAX } = {}) => { const im = new InstancedMesh(geo, material, n); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = sombra; im.setColorAt(0, new Color(1, 1, 1)); im.instanceColor.setUsage(DynamicDrawUsage); pai.add(im); return im; };
  const logoMat = (w) => new MeshBasicMaterial({ map: texLogo("branco"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); void logoMat;
  const IM = {
    perna: mk(GEO.perna, { sombra: true, n: MAX * 2 }), bota: mk(GEO.bota, { n: MAX * 2 }), tronco: mk(GEO.tronco, { sombra: true }), colete: mk(GEO.colete), braco: mk(GEO.braco, { sombra: true, n: MAX * 2 }), mao: mk(GEO.mao, { n: MAX * 2 }),
    cabeca: mk(GEO.cabeca, { sombra: true }), cabelo: mk(GEO.cabelo), rabo: mk(GEO.rabo), chapeu: mk(GEO.chapeu), bone: mk(GEO.bone), mochila: mk(GEO.mochila), garrafa: mk(GEO.garrafa), bastao: mk(GEO.bastao),
    celular: mk(GEO.celular, { material: std({ color: 0x15171a, roughness: .3 }) }), binoculo: mk(GEO.binoculo, { material: std({ color: 0x222426 }) }), prancheta: mk(GEO.prancheta), radio: mk(GEO.radio, { material: std({ color: 0x1b1c1e }) }),
    logoCostas: mk(GEO.logo, { material: new MeshBasicMaterial({ map: texLogo("branco"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) }),
    capacete: mk(GEO.capacete, { material: std({ color: 0xffffff, roughness: .25, metalness: .1 }) }),
    faixa: mk(GEO.faixa, { material: new MeshStandardMaterial({ color: 0xffffff, roughness: .35, metalness: .3, emissive: 0x2a2a2a }), n: MAX * 8 }),
    tagCostasBomb: mk(GEO.logo, { material: tagMat("bomb", "costas"), n: 6 }), tagPeitoBomb: mk(GEO.logo, { material: tagMat("bomb", "peito"), n: 6 }),
    tagCostasResg: mk(GEO.logo, { material: tagMat("resg", "costas"), n: 10 }), tagPeitoResg: mk(GEO.logo, { material: tagMat("resg", "peito"), n: 10 }),
    tagCostasEnf: mk(GEO.logo, { material: tagMat("enf", "costas"), n: 10 }), tagPeitoEnf: mk(GEO.logo, { material: tagMat("enf", "peito"), n: 10 }),
    logoPeito: mk(GEO.logo, { material: new MeshBasicMaterial({ map: texLogo("branco"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) })
  };
  const CAB = new Color(); const n = {}; Object.keys(IM).forEach(k => { n[k] = 0; });
  const raiz = new Matrix4(), alto = new Matrix4(), t1 = new Matrix4(), t2 = new Matrix4(), t3 = new Matrix4(), out = new Matrix4(), cabM = new Matrix4(), braM = new Matrix4();
  const pr = (m, x, y, z) => m.makeTranslation(x, y, z);
  const put = (k, M, cor) => { const i = n[k]++; if(i >= IM[k].instanceMatrix.count) { n[k]--; return; } IM[k].setMatrixAt(i, M); IM[k].setColorAt(i, typeof cor === "number" ? CAB.setHex(cor) : cor); };
  const loc = (base, x, y, z, rx = 0, ry = 0, sx = 1, sy = 1, sz = 1) => { out.copy(base).multiply(pr(t1, x, y, z)); if(ry) out.multiply(t2.makeRotationY(ry)); if(rx) out.multiply(t3.makeRotationX(rx)); if(sx !== 1 || sy !== 1 || sz !== 1) out.multiply(t1.makeScale(sx, sy, sz)); return out; };

  /* uma pessoa → matrizes de todas as peças */
  function escreve(P, detalhe){
    const e = P.esc, po = P.pose, c = P.cor, o = P.acess;
    raiz.makeTranslation(P.x, P.y, P.z).multiply(t1.makeRotationY(P.yaw));
    if(po.lie > .01) raiz.multiply(t1.makeTranslation(0, .55 * e * po.lie, 0)).multiply(t2.makeRotationX(-Math.PI / 2 * po.lie));        // deitado de costas (na maca)
    raiz.multiply(t2.makeScale(e, e, e));
    const hipY = 2.35 - po.sit * 1.85 + po.bob;
    /* pernas e botas (quadril em hipY) */
    for(let s = -1; s <= 1; s += 2){ const ang = s < 0 ? po.legR : po.legL, base = out.copy(raiz).multiply(pr(t1, s * -.36, hipY, 0)).multiply(t2.makeRotationX(ang)).clone();
      put("perna", base, c.calca); put("bota", base, c.bota);
      if(o.faixas){ put("faixa", base.clone().multiply(t2.makeTranslation(0, -1.55, 0)).multiply(t3.makeScale(.6, .2, .66)), 0xc9ccd0); if(o.listra) put("faixa", base.clone().multiply(t2.makeTranslation(s * -.29, -1.2, 0)).multiply(t3.makeScale(.05, 2.2, .64)), o.listra); } }
    /* tronco e tudo que vai preso a ele (inclina a partir do quadril) */
    alto.copy(raiz).multiply(pr(t1, 0, hipY, 0)).multiply(t2.makeRotationX(po.lean)); 
    put("tronco", loc(alto, 0, 0, 0).clone(), c.camisa);
    if(!detalhe) { put("cabeca", loc(alto, 0, 2.55, 0).clone(), c.pele); return; }
    if(o.colete) put("colete", loc(alto, 0, 0, 0).clone(), c.colete || 0x1a1b1d);
    const zf = o.colete ? .5 : .43;
    if(o.logoCostas) put("logoCostas", loc(alto, 0, 1.12, -zf - .012, 0, Math.PI, LOGO_COSTAS_W, LOGO_COSTAS_W * LOGO_ASPECTO, 1).clone(), 0xffffff);
    if(o.logoPeito) put("logoPeito", loc(alto, .42, 1.42, zf + .012, 0, 0, LOGO_PEITO_W, LOGO_PEITO_W * LOGO_ASPECTO, 1).clone(), 0xffffff);
    if(o.mochila) put("mochila", loc(alto, 0, .95, -.7).clone(), c.mochila || 0x3a4a2c);
    if(o.radio) put("radio", loc(alto, -.45, 1.5, zf + .1).clone(), 0xffffff);
    if(o.faixas){ put("faixa", loc(alto, 0, .52, 0, 0, 0, 1.58, .2, .88).clone(), 0xc9ccd0); put("faixa", loc(alto, 0, 1.58, 0, 0, 0, 1.58, .16, .88).clone(), 0xc9ccd0); }
    if(o.tag){ const T = o.tag === "bomb" ? ["tagCostasBomb", "tagPeitoBomb"] : o.tag === "resg" ? ["tagCostasResg", "tagPeitoResg"] : ["tagCostasEnf", "tagPeitoEnf"];
      put(T[0], loc(alto, 0, 1.08, -zf - .014, 0, Math.PI, 1.25, 1.25 * 190 / 320, 1).clone(), 0xffffff); put(T[1], loc(alto, .42, 1.46, zf + .014, 0, 0, .4, .4, 1).clone(), 0xffffff); }
    /* braços: pivô nos ombros */
    for(let s = -1; s <= 1; s += 2){
      const esquerdo = s > 0, rx = esquerdo ? po.armL : po.armR, rz = (esquerdo ? po.armLz : po.armRz);
      braM.copy(alto).multiply(pr(t1, s * .96, 1.9, 0)).multiply(t2.makeRotationZ(-s * rz)).multiply(t3.makeRotationX(rx));
      put("braco", braM.clone(), o.colete ? c.manga || c.camisa : c.manga || c.camisa);
      if(o.faixas) put("faixa", braM.clone().multiply(t2.makeTranslation(0, -.95, 0)).multiply(t3.makeScale(.46, .2, .5)), 0xc9ccd0);
      t1.makeTranslation(0, -1.78, .02); out.copy(braM).multiply(t1); put("mao", out.clone(), c.luva !== undefined ? c.luva : c.pele);
      /* itens na mão */
      if(!esquerdo){ if(po.celular) put("celular", out.clone().multiply(t2.makeTranslation(0, .1, .2)).multiply(t3.makeRotationX(.2)), 0xffffff); if(o.bastao) put("bastao", out.clone().multiply(t2.makeTranslation(0, -.3, .1)).multiply(t3.makeRotationX(-rx)), c.bastao || 0x6a4a2a); }
      else { if(o.garrafa && !po.prancheta) put("garrafa", out.clone().multiply(t2.makeTranslation(0, .15, .15)), c.garrafa || 0x2f7fb0); if(po.prancheta) put("prancheta", out.clone().multiply(t2.makeTranslation(.1, .45, .35)).multiply(t3.makeRotationX(-.2)), 0xb59a6a); }
    }
    /* cabeça, cabelo, chapéu, óculos de binóculo */
    cabM.copy(alto).multiply(pr(t1, 0, 2.55, 0)).multiply(t2.makeRotationY(po.headYaw)).multiply(t3.makeRotationX(po.headPitch));
    put("cabeca", cabM.clone(), c.pele);
    if(o.cabelo) put("cabelo", cabM.clone(), c.cabelo);
    if(o.rabo) put("rabo", cabM.clone().multiply(t1.makeTranslation(0, .02, -.58)), c.cabelo);
    if(o.capacete) put("capacete", cabM.clone().multiply(t1.makeTranslation(0, .12, 0)), c.capacete || 0xc0141a);
    if(o.chapeu === 1) put("chapeu", cabM.clone().multiply(t1.makeTranslation(0, .3, 0)), c.chapeu || 0x4a5a35);
    else if(o.chapeu === 2) put("bone", cabM.clone().multiply(t1.makeTranslation(0, .3, 0)), c.chapeu || 0x2a2a2a);
    if(po.binoculo) put("binoculo", cabM.clone().multiply(t1.makeTranslation(0, .05, .58)), 0xffffff);
  }

  function inicia(){ Object.keys(n).forEach(k => { n[k] = 0; }); }
  function fim(){ Object.keys(IM).forEach(k => { const im = IM[k]; im.count = n[k]; im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; }); }
  return { IM, escreve, inicia, fim, n, setSombras(on){ ["perna", "tronco", "braco", "cabeca"].forEach(k => { IM[k].castShadow = on; }); } };
}
