import { InstancedMesh, MeshStandardMaterial, MeshBasicMaterial, Matrix4, Color, DynamicDrawUsage } from "three";
import { criarGeometriasPessoas } from "./geometrias.js";
import { texLogo, LOGO_ASPECTO } from "../icmbio/logo.js";
import { texTag } from "../resgate/tags.js";

/* ============================================================================================================
   PESSOAS INSTANCIADAS
   Todos os visitantes, guias, alunos e a equipe do ICMBio usam o MESMO conjunto de InstancedMesh (um por tipo de peça: pernas, tronco, braços, cabeça, chapéu,
   mochila, colete, logos...). Cada pessoa é só uma struct (posição, pose, cores, acessórios) de um pool reutilizável: nada é criado ou destruído em jogo.
   Frente = +Z, esquerda da pessoa = +X (por isso a logo pequena do peito fica em +X e a grande das costas em −Z, de frente para trás).
   ============================================================================================================ */

const GEO = criarGeometriasPessoas();

const std = (o = {}) => new MeshStandardMaterial({ roughness: .92, metalness: 0, ...o });
const LOGO_PEITO_W = .52, LOGO_COSTAS_W = 1.2;
const tagMat = (t, l) => new MeshBasicMaterial({ map: texTag(t, l), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

export function criarPessoas(pai, MAX){
  const mk = (geo, { material = std(), sombra = false, n = MAX } = {}) => { const im = new InstancedMesh(geo, material, n); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = sombra; im.setColorAt(0, new Color(1, 1, 1)); im.instanceColor.setUsage(DynamicDrawUsage); pai.add(im); return im; };
  const IM = {
    perna: mk(GEO.perna, { sombra: true, n: MAX * 2 }), canela: mk(GEO.canela, { sombra: true, n: MAX * 2 }), bota: mk(GEO.bota, { n: MAX * 2 }), tronco: mk(GEO.tronco, { sombra: true }), colete: mk(GEO.colete), braco: mk(GEO.braco, { sombra: true, n: MAX * 2 }), antebraco: mk(GEO.antebraco, { sombra: true, n: MAX * 2 }), mao: mk(GEO.mao, { n: MAX * 2 }),
    cabeca: mk(GEO.cabeca, { sombra: true }), pescoco: mk(GEO.pescoco), rosto: mk(GEO.rosto, { material: std({ vertexColors: true, roughness: .72 }) }), cabelo: mk(GEO.cabelo), rabo: mk(GEO.rabo), chapeu: mk(GEO.chapeu), bone: mk(GEO.bone), mochila: mk(GEO.mochila), garrafa: mk(GEO.garrafa), bastao: mk(GEO.bastao),
    celular: mk(GEO.celular, { material: std({ color: 0x15171a, roughness: .3 }) }), binoculo: mk(GEO.binoculo, { material: std({ color: 0x222426 }) }), prancheta: mk(GEO.prancheta), radio: mk(GEO.radio, { material: std({ color: 0x1b1c1e }) }),
    logoCostas: mk(GEO.logo, { material: new MeshBasicMaterial({ map: texLogo("branco"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) }),
    capacete: mk(GEO.capacete, { material: std({ color: 0xffffff, roughness: .25, metalness: .1 }) }),
    faixa: mk(GEO.faixa, { material: new MeshStandardMaterial({ color: 0xffffff, roughness: .35, metalness: .3, emissive: 0x2a2a2a }), n: MAX * 8 }),
    tagCostasBomb: mk(GEO.logo, { material: tagMat("bomb", "costas"), n: 6 }), tagPeitoBomb: mk(GEO.logo, { material: tagMat("bomb", "peito"), n: 6 }),
    tagCostasResg: mk(GEO.logo, { material: tagMat("resg", "costas"), n: 10 }), tagPeitoResg: mk(GEO.logo, { material: tagMat("resg", "peito"), n: 10 }),
    tagCostasEnf: mk(GEO.logo, { material: tagMat("enf", "costas"), n: 10 }), tagPeitoEnf: mk(GEO.logo, { material: tagMat("enf", "peito"), n: 10 }),
    logoPeito: mk(GEO.logo, { material: new MeshBasicMaterial({ map: texLogo("branco"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }) })
  };
  const CAB = new Color(); const n = {}; Object.keys(IM).forEach(k => { n[k] = 0; IM[k].name = "npc-" + k; });
  const raiz = new Matrix4(), alto = new Matrix4(), t1 = new Matrix4(), t2 = new Matrix4(), t3 = new Matrix4(), out = new Matrix4(), cabM = new Matrix4(), braM = new Matrix4(), joelhoM = new Matrix4(), cotoveloM = new Matrix4();
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
    for(let s = -1; s <= 1; s += 2){
      const ang = s < 0 ? po.legR : po.legL;
      const base = out.copy(raiz).multiply(pr(t1, s * -.34, hipY, 0)).multiply(t2.makeRotationX(ang)).clone();
      const sentadoNoBanco = P.sentado !== undefined && P.sentado >= 0;
      const flexao = po.lie > .5 ? 0 : Math.max(0, -ang) * (sentadoNoBanco ? .90 : po.sit > .5 ? .18 : .55);
      joelhoM.copy(base).multiply(pr(t1, 0, -1.14, 0)).multiply(t2.makeRotationX(flexao));
      put("perna", base, c.calca); put("canela", joelhoM, c.calca); put("bota", joelhoM, c.bota);
      if(o.faixas){
        put("faixa", loc(joelhoM, 0, -.55, 0, 0, 0, .43, .17, .46), 0xc9ccd0);
        if(o.listra) put("faixa", loc(base, s * -.28, -.53, 0, 0, 0, .035, .9, .54), o.listra);
      }
    }
    /* tronco e tudo que vai preso a ele (inclina a partir do quadril) */
    alto.copy(raiz).multiply(pr(t1, 0, hipY, 0)).multiply(t2.makeRotationX(po.lean)); 
    put("tronco", loc(alto, 0, 0, 0).clone(), c.camisa);
    put("pescoco", alto, c.pele);
    if(detalhe){
      if(o.colete) put("colete", loc(alto, 0, 0, 0).clone(), c.colete || 0x1a1b1d);
      const zf = o.colete ? .5 : .43;
      if(o.logoCostas) put("logoCostas", loc(alto, 0, 1.12, -zf - .012, 0, Math.PI, LOGO_COSTAS_W, LOGO_COSTAS_W * LOGO_ASPECTO, 1).clone(), 0xffffff);
      if(o.logoPeito) put("logoPeito", loc(alto, .42, 1.42, zf + .012, 0, 0, LOGO_PEITO_W, LOGO_PEITO_W * LOGO_ASPECTO, 1).clone(), 0xffffff);
      if(o.mochila) put("mochila", loc(alto, 0, .95, -.7).clone(), c.mochila || 0x3a4a2c);
      if(o.radio) put("radio", loc(alto, -.45, 1.5, zf + .1).clone(), 0xffffff);
      if(o.faixas){ put("faixa", loc(alto, 0, .52, 0, 0, 0, 1.18, .18, .76).clone(), 0xc9ccd0); put("faixa", loc(alto, 0, 1.58, 0, 0, 0, 1.44, .16, .82).clone(), 0xc9ccd0); }
      if(o.tag){ const T = o.tag === "bomb" ? ["tagCostasBomb", "tagPeitoBomb"] : o.tag === "resg" ? ["tagCostasResg", "tagPeitoResg"] : ["tagCostasEnf", "tagPeitoEnf"];
        put(T[0], loc(alto, 0, 1.08, -zf - .014, 0, Math.PI, 1.25, 1.25 * 190 / 320, 1).clone(), 0xffffff); put(T[1], loc(alto, .42, 1.46, zf + .014, 0, 0, .4, .4, 1).clone(), 0xffffff); }
    }
    /* Braços com cotovelos; acessórios acompanham as mãos após a articulação. */
    for(let s = -1; s <= 1; s += 2){
      const esquerdo = s > 0, rx = esquerdo ? po.armL : po.armR, rz = (esquerdo ? po.armLz : po.armRz);
      braM.copy(alto).multiply(pr(t1, s * .84, 1.78, 0)).multiply(t2.makeRotationZ(-s * rz)).multiply(t3.makeRotationX(rx));
      put("braco", braM, c.manga || c.camisa);
      const flexao = -(.10 + Math.min(1, Math.abs(rx)) * .32);
      cotoveloM.copy(braM).multiply(pr(t1, 0, -.88, 0)).multiply(t2.makeRotationX(flexao));
      put("antebraco", cotoveloM, c.manga || c.camisa);
      if(o.faixas) put("faixa", cotoveloM.clone().multiply(t2.makeTranslation(0, -.25, 0)).multiply(t3.makeScale(.36, .17, .40)), 0xc9ccd0);
      t1.makeTranslation(0, -.88, .02); out.copy(cotoveloM).multiply(t1); put("mao", out.clone().multiply(t2.makeRotationY(s < 0 ? Math.PI : 0)), c.luva !== undefined ? c.luva : c.pele);
      /* itens na mão */
      if(!esquerdo){ if(po.celular) put("celular", out.clone().multiply(t2.makeTranslation(0, .1, .2)).multiply(t3.makeRotationX(.2)), 0xffffff); if(o.bastao) put("bastao", out.clone().multiply(t2.makeTranslation(0, -.3, .1)).multiply(t3.makeRotationX(-rx)), c.bastao || 0x6a4a2a); }
      else { if(o.garrafa && !po.prancheta) put("garrafa", out.clone().multiply(t2.makeTranslation(0, .15, .15)), c.garrafa || 0x2f7fb0); if(po.prancheta) put("prancheta", out.clone().multiply(t2.makeTranslation(.1, .45, .35)).multiply(t3.makeRotationX(-.2)), 0xb59a6a); }
    }
    /* cabeça, cabelo, chapéu, óculos de binóculo */
    cabM.copy(alto).multiply(pr(t1, 0, 2.55, 0)).multiply(t2.makeRotationY(po.headYaw)).multiply(t3.makeRotationX(po.headPitch));
    if(P.role === "crianca" || P.role === "aluno" || e < .8) cabM.multiply(t1.makeScale(1.12, 1.12, 1.12));
    put("cabeca", cabM, c.pele);
    if(detalhe) put("rosto", cabM, 0xffffff);
    if(o.cabelo) put("cabelo", cabM.clone(), c.cabelo);
    if(o.rabo) put("rabo", cabM, c.cabelo);
    if(o.capacete) put("capacete", cabM.clone().multiply(t1.makeTranslation(0, .12, 0)), c.capacete || 0xc0141a);
    if(o.chapeu === 1) put("chapeu", cabM, c.chapeu || 0x4a5a35);
    else if(o.chapeu === 2) put("bone", cabM, c.chapeu || 0x2a2a2a);
    if(po.binoculo) put("binoculo", cabM.clone().multiply(t1.makeTranslation(0, .05, .58)), 0xffffff);
  }

  function inicia(){ Object.keys(n).forEach(k => { n[k] = 0; }); }
  function fim(){ Object.keys(IM).forEach(k => { const im = IM[k]; im.count = n[k]; im.instanceMatrix.needsUpdate = true; if(im.instanceColor) im.instanceColor.needsUpdate = true; }); }
  return { IM, escreve, inicia, fim, n, setSombras(on){ ["perna", "canela", "tronco", "braco", "antebraco", "cabeca"].forEach(k => { IM[k].castShadow = on; }); } };
}
