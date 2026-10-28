import { Group, Mesh, SphereGeometry, BoxGeometry, CylinderGeometry, ConeGeometry, MeshStandardMaterial, MeshBasicMaterial, Color } from "three";
import { U } from "../config.js";

/* ============================================================================================================
   MODELO PROCEDURAL DE QUADRÚPEDE (low-poly, com articulações)
   Um construtor só para os três bichos: muda só o "spec" (proporções e cores). Frente = +Z, cima = +Y; medidas em METROS (× 2,94 u).
   Articulações: corpo → pescoço → cabeça (orelhas, olhos) · cauda em 3 segmentos · 4 pernas de 2 segmentos (quadril + joelho) com pata.
   ============================================================================================================ */

const geoEsf = new SphereGeometry(1, 10, 8), geoCaixa = new BoxGeometry(1, 1, 1), geoCil = new CylinderGeometry(1, 1, 1, 8), geoCone = new ConeGeometry(1, 1, 8);
const mats = new Map();
const mat = (hex) => { let m = mats.get(hex); if(!m){ m = new MeshStandardMaterial({ color: hex, roughness: 1, metalness: 0 }); mats.set(hex, m); } return m; };

const g = (pai, x = 0, y = 0, z = 0) => { const o = new Group(); o.position.set(x, y, z); if(pai) pai.add(o); return o; };
let MATF = mat;
const parte = (pai, geo, cor, sx, sy, sz, x = 0, y = 0, z = 0) => { const o = new Mesh(geo, typeof cor === "number" ? MATF(cor) : cor); o.scale.set(sx * U, sy * U, sz * U); o.position.set(x * U, y * U, z * U); if(pai) pai.add(o); return o; };
const esf = (pai, cor, rx, ry, rz, x, y, z) => parte(pai, geoEsf, cor, rx, ry, rz, x, y, z);

export function criarQuadrupede(S, opts = {}){
  MATF = opts.clonar ? ((hex) => new MeshStandardMaterial({ color: hex, roughness: 1, metalness: 0 })) : mat;
  const { tronco: T, perna: P, pesc: N, cab: C, orelha: O, cauda: R, cor } = S;
  const hip = (P.sup + P.inf) * .965 + T.alt * .22;                                    // altura do centro do corpo
  const root = g(null), corpo = g(root, 0, hip * U, 0);
  /* tronco: peito mais fundo na frente, quadril atrás, faixa clara na barriga */
  esf(corpo, cor.corpo, T.larg / 2, T.alt / 2, T.comp / 2, 0, 0, 0);
  esf(corpo, cor.peito || cor.corpo, T.larg * .54, T.alt * .56, T.comp * .26, 0, -T.alt * .04, T.comp * .27);
  esf(corpo, cor.corpo, T.larg * .5, T.alt * .5, T.comp * .24, 0, 0, -T.comp * .27);
  esf(corpo, cor.barriga || cor.corpo, T.larg * .38, T.alt * .26, T.comp * .4, 0, -T.alt * .28, 0);
  if(cor.crina){ parte(corpo, geoCaixa, cor.crina, T.larg * .3, T.alt * .24, T.comp * .62, 0, T.alt * .46, T.comp * .06); }
  /* pernas */
  const pernas = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], i) => {                      // FD, FE, TD, TE
    const q = g(corpo, sx * T.larg * .36 * U, -T.alt * .25 * U, sz * T.comp * .3 * U);
    const corSup = cor.pernaSup !== undefined ? (i < 2 || !cor.pernaSupTras ? cor.pernaSup : cor.pernaSupTras) : cor.corpo;
    const cilS = parte(q, geoCil, corSup, P.esp * (sz > 0 ? 1.0 : 1.12), P.sup / 2, P.esp * (sz > 0 ? 1.0 : 1.12), 0, -P.sup / 2, 0);
    const joelho = g(q, 0, -P.sup * U, 0);
    parte(joelho, geoCil, cor.pernaInf, P.esp * .78, P.inf / 2, P.esp * .78, 0, -P.inf / 2, 0);
    const pata = esf(joelho, cor.pata, P.esp * 1.15, P.esp * .6, P.esp * 1.75, 0, -P.inf, P.esp * .6);
    void cilS; pernas.push({ quadril: q, joelho, pata });
  });
  /* pescoço → cabeça */
  const pesc = g(corpo, 0, T.alt * .22 * U, T.comp * .42 * U);
  parte(pesc, geoCil, cor.pescoco || cor.corpo, N.esp, N.comp / 2, N.esp * .95, 0, N.comp / 2, 0);
  if(cor.nuca) parte(pesc, geoCaixa, cor.nuca, N.esp * .55, N.comp * .5, N.esp * 1.05, 0, N.comp * .5, -N.esp * .55);
  const cab = g(pesc, 0, N.comp * U, 0);
  esf(cab, cor.cabeca, C.larg / 2, C.alt / 2, C.comp / 2, 0, 0, C.comp * .22);
  const foc = C.focinho;
  esf(cab, cor.focinhoCor || cor.cabeca, foc.larg / 2, foc.alt / 2, foc.comp / 2, 0, -C.alt * .12, C.comp * .45 + foc.comp * .3);
  esf(cab, cor.queixo || cor.cabeca, foc.larg * .42, foc.alt * .36, foc.comp * .5, 0, -C.alt * .34, C.comp * .42 + foc.comp * .15);
  esf(cab, cor.nariz, foc.larg * .34, foc.alt * .3, foc.larg * .3, 0, -C.alt * .06, C.comp * .45 + foc.comp * .78);
  if(cor.mascara){ [-1, 1].forEach(sx => esf(cab, cor.mascara, foc.larg * .14, foc.alt * .08, foc.comp * .36, sx * foc.larg * .48, -C.alt * .03, C.comp * .5 + foc.comp * .28)); }
  /* orelhas */
  const orelhas = [-1, 1].map(sx => {
    const o = g(cab, sx * C.larg * .34 * U, C.alt * .38 * U, C.comp * .08 * U);
    const cone = parte(o, geoCone, cor.orelha, O.larg / 2, O.alt / 2, O.larg * .2, 0, O.alt / 2, 0);
    if(O.redonda){ cone.geometry = geoEsf; cone.scale.set(O.larg / 2 * U, O.alt / 2 * U, O.larg * .25 * U); }
    if(cor.orelhaInt) parte(o, geoCone, cor.orelhaInt, O.larg * .32, O.alt * .36, O.larg * .1, 0, O.alt * .42, O.larg * .12);
    o.rotation.z = -sx * .12; return o;
  });
  /* olhos (brilham de noite) */
  const olhos = [-1, 1].map(sx => { const m = new MeshBasicMaterial({ color: cor.olho }); const e = new Mesh(geoEsf, m); e.scale.setScalar(C.larg * (S.olhoR || .075) * U); e.position.set(sx * C.larg * .4 * U, C.alt * (S.olhoY || .12) * U, C.comp * (S.olhoZ || .42) * U); cab.add(e); e.userData.escuro = new Color(cor.olho); e.userData.brilho = new Color(cor.brilho); return e; });
  /* cauda: três segmentos encadeados (dá para curvar e abanar) */
  const c1 = g(corpo, 0, T.alt * .2 * U, -T.comp * .5 * U), s1 = R.comp * .38, s2 = R.comp * .38, s3 = R.comp * .24;
  esf(c1, cor.cauda, R.esp * .8, R.esp * .8, s1 / 2, 0, 0, -s1 / 2);
  const c2 = g(c1, 0, 0, -s1 * U); esf(c2, cor.cauda, R.esp, R.esp, s2 / 2, 0, 0, -s2 / 2);
  const c3 = g(c2, 0, 0, -s2 * U); esf(c3, cor.caudaPonta || cor.cauda, R.esp * .85, R.esp * .85, s3 / 2, 0, 0, -s3 / 2);
  corpo.traverse(o => { if(o.isMesh && o.material && !o.material.isMeshBasicMaterial) o.castShadow = true; });
  const materiais = []; root.traverse(o => { if(o.isMesh && o.material && o.material.isMeshStandardMaterial && !materiais.includes(o.material)) materiais.push(o.material); });
  if(S.extras) S.extras({ cab, corpo, pesc, g, parte, esf, geoCil, geoCone, geoEsf, geoCaixa, cor });
  MATF = mat;
  return { materiais, root, corpo, pesc, cab, orelhas, olhos, cauda: [c1, c2, c3], pernas, hip, ombro: hip + T.alt * .35 + N.comp * .5, comprimento: T.comp };
}

/* ---- as três espécies ---- */
export const SPEC = {
  lobo: {
    tronco: { comp: .98, alt: .30, larg: .20 }, perna: { sup: .38, inf: .40, esp: .045 }, pesc: { comp: .30, esp: .10 },
    cab: { comp: .21, alt: .115, larg: .125, focinho: { comp: .17, alt: .06, larg: .065 } }, orelha: { alt: .20, larg: .095 }, cauda: { comp: .42, esp: .07 },
    cor: { corpo: 0xc4551f, peito: 0xb84c1a, barriga: 0xd98a52, crina: 0x14100e, nuca: 0x14100e, pernaSup: 0x15110f, pernaInf: 0x100d0b, pata: 0x0b0908, pescoco: 0xc4551f, cabeca: 0xc9622a, focinhoCor: 0x1a1411, queixo: 0xf1e6d6, nariz: 0x0a0807,
      orelha: 0x2a1c14, orelhaInt: 0xe3b48a, cauda: 0xc4551f, caudaPonta: 0xf5eee0, olho: 0x3a1c08, brilho: 0xff8a1e }
  },
  puma: {
    tronco: { comp: 1.15, alt: .34, larg: .26 }, perna: { sup: .27, inf: .27, esp: .08 }, pesc: { comp: .24, esp: .15 },
    cab: { comp: .22, alt: .15, larg: .16, focinho: { comp: .10, alt: .075, larg: .10 } }, orelha: { alt: .07, larg: .08, redonda: true }, cauda: { comp: .86, esp: .075 },
    cor: { corpo: 0xb99a6e, peito: 0xc2a478, barriga: 0xd9c8a6, pernaSup: 0xb69866, pernaInf: 0xad9060, pata: 0xa08558, pescoco: 0xbd9f72, cabeca: 0xbf9f74, focinhoCor: 0xe6d9c0, queixo: 0xf0e8d6, nariz: 0xc98a82, mascara: 0x2a2018,
      orelha: 0x3d2c20, orelhaInt: 0xd8c4a0, cauda: 0xb4966a, caudaPonta: 0x2e231b, olho: 0x6e6428, brilho: 0xb7ff3c }
  },
  graxaimCinza: {
    tronco: { comp: .56, alt: .19, larg: .13 }, perna: { sup: .17, inf: .18, esp: .033 }, pesc: { comp: .13, esp: .07 },
    cab: { comp: .12, alt: .072, larg: .08, focinho: { comp: .10, alt: .036, larg: .042 } }, orelha: { alt: .115, larg: .06 }, cauda: { comp: .36, esp: .075 },
    cor: { corpo: 0x8d8a83, peito: 0xa39f96, barriga: 0xd9d3c6, pernaSup: 0xb8884f, pernaInf: 0xb8884f, pata: 0x6e5a40, cabeca: 0xa59a8a, focinhoCor: 0xb98d5e, queixo: 0xe8e0d0, nariz: 0x1c1815,
      orelha: 0xb97a42, orelhaInt: 0xe8d4b6, cauda: 0x8d8a83, caudaPonta: 0x1e1814, olho: 0x5a4418, brilho: 0xfff0b0 }
  },
  graxaimRuivo: {
    tronco: { comp: .56, alt: .19, larg: .13 }, perna: { sup: .17, inf: .18, esp: .033 }, pesc: { comp: .13, esp: .07 },
    cab: { comp: .12, alt: .072, larg: .08, focinho: { comp: .10, alt: .036, larg: .042 } }, orelha: { alt: .115, larg: .06 }, cauda: { comp: .36, esp: .075 },
    cor: { corpo: 0xa5724c, peito: 0xb48a62, barriga: 0xe0d2b8, pernaSup: 0xc58f55, pernaInf: 0xc58f55, pata: 0x6e5a40, cabeca: 0xb98a5c, focinhoCor: 0xc89a66, queixo: 0xeee4d0, nariz: 0x1c1815,
      orelha: 0xc27a3a, orelhaInt: 0xeed8b8, cauda: 0x9a8670, caudaPonta: 0x211a15, olho: 0x5a4418, brilho: 0xffe8a0 }
  }
};

/* capivara: corpo de barril, pernas curtas, sem cauda, cabeça grande e retangular com focinho largo e rombudo; olhos, orelhas e narinas no ALTO da cabeça */
SPEC.capivara = {
  tronco: { comp: 1.05, alt: .54, larg: .5 }, perna: { sup: .13, inf: .13, esp: .075 }, pesc: { comp: .07, esp: .27 },
  cab: { comp: .36, alt: .25, larg: .27, focinho: { comp: .15, alt: .17, larg: .23 } }, orelha: { alt: .055, larg: .05, redonda: true }, cauda: { comp: .04, esp: .02 }, olhoY: .42, olhoZ: .26, olhoR: .06,
  cor: { corpo: 0x8a5b3c, peito: 0x84583a, barriga: 0xa68a62, pernaSup: 0x6e4a32, pernaInf: 0x5a3e2a, pata: 0x3a2a20, pescoco: 0x8a5b3c, cabeca: 0x7e5538, focinhoCor: 0x6e4a32, queixo: 0x9a7e5c, nariz: 0x1a1210,
    orelha: 0x5a3a28, orelhaInt: 0x8a6a52, cauda: 0x8a5b3c, olho: 0x1c120c, brilho: 0xe8d9a0 }
};
SPEC.capivaraFilhote = JSON.parse(JSON.stringify(SPEC.capivara));
Object.assign(SPEC.capivaraFilhote.cor, { corpo: 0xa8723f, peito: 0xa06c3c, barriga: 0xc9a674, pernaSup: 0x8a5e38, pernaInf: 0x7a5232, cabeca: 0xa8723f, focinhoCor: 0x8a5e38, pescoco: 0xa8723f });
SPEC.capivaraFilhote.cab = { comp: .44, alt: .31, larg: .33, focinho: { comp: .17, alt: .2, larg: .27 } };

/* ---- Cambará do Sul: veado-campeiro (macho com chifres de três pontas), quati (focinho comprido, cauda anelada), gambá-de-orelha-branca, lontra ---- */
SPEC.veado = {
  tronco: { comp: 1.0, alt: .3, larg: .2 }, perna: { sup: .3, inf: .32, esp: .038 }, pesc: { comp: .3, esp: .075 },
  cab: { comp: .24, alt: .1, larg: .1, focinho: { comp: .14, alt: .05, larg: .06 } }, orelha: { alt: .17, larg: .1 }, cauda: { comp: .16, esp: .05 },
  cor: { corpo: 0xb2764a, peito: 0xb87d50, barriga: 0xf0e4cc, pernaSup: 0xa86f46, pernaInf: 0x9a6a46, pata: 0x2a1c12, pescoco: 0xb2764a, cabeca: 0xa9704a, focinhoCor: 0xc7a47a, queixo: 0xf3ead6, nariz: 0x1c1411,
    orelha: 0xa9704a, orelhaInt: 0xf3e6d0, cauda: 0xb2764a, caudaPonta: 0xf3e6d0, olho: 0x2a160a, brilho: 0xfff0a0 },
  extras: ({ cab, g, parte, geoCil, geoEsf }) => {                                         // chifres do macho: haste, ponta de trás e ponta da frente (U vem do módulo)
    for(const sx of [-1, 1]){ const h = g(cab, sx * .03 * U, .05 * U, -.02 * U); h.rotation.set(-.35, 0, -sx * .35);
      parte(h, geoCil, 0xd9cdb0, .012, .13, .012, 0, .13, 0); const b = g(h, 0, .24 * U, 0); b.rotation.z = sx * .5; parte(b, geoCil, 0xd9cdb0, .01, .07, .01, 0, .07, 0);
      const t = g(h, 0, .15 * U, 0); t.rotation.x = .7; parte(t, geoCil, 0xd9cdb0, .009, .05, .009, 0, .05, 0); }
  }
};
SPEC.quati = {
  tronco: { comp: .5, alt: .15, larg: .12 }, perna: { sup: .1, inf: .1, esp: .03 }, pesc: { comp: .09, esp: .06 },
  cab: { comp: .12, alt: .065, larg: .07, focinho: { comp: .12, alt: .035, larg: .04 } }, orelha: { alt: .035, larg: .04, redonda: true }, cauda: { comp: .5, esp: .055 },
  cor: { corpo: 0x6e4a2e, peito: 0x6a472c, barriga: 0x8a6a46, pernaSup: 0x2e1f14, pernaInf: 0x2a1c12, pata: 0x1c120b, pescoco: 0x6a472c, cabeca: 0x5a3d26, focinhoCor: 0xd8c4a0, queixo: 0xe6d8bc, nariz: 0x120d0a, mascara: 0x1c120b,
    orelha: 0x4a3220, cauda: 0x6b4a2c, caudaPonta: 0x2a1c12, olho: 0x1c120a, brilho: 0xffe39a }
};
SPEC.gamba = {
  tronco: { comp: .38, alt: .14, larg: .13 }, perna: { sup: .06, inf: .07, esp: .026 }, pesc: { comp: .06, esp: .07 },
  cab: { comp: .12, alt: .07, larg: .07, focinho: { comp: .11, alt: .035, larg: .04 } }, orelha: { alt: .05, larg: .045 }, cauda: { comp: .38, esp: .03 },
  cor: { corpo: 0x8c8a86, peito: 0x9a9893, barriga: 0xc9c4b8, pernaSup: 0x4a4540, pernaInf: 0x3a3632, pata: 0x2a2623, pescoco: 0x8c8a86, cabeca: 0xe8e2d4, focinhoCor: 0xf0eadc, queixo: 0xf4efe2, nariz: 0xd98a8a,
    orelha: 0xf2eee2, orelhaInt: 0xe0b0a8, cauda: 0x4a3f3a, caudaPonta: 0xd8d0c0, olho: 0x120c08, brilho: 0xff9a7a }
};
SPEC.lontra = {
  tronco: { comp: .7, alt: .16, larg: .16 }, perna: { sup: .08, inf: .07, esp: .045 }, pesc: { comp: .1, esp: .09 },
  cab: { comp: .14, alt: .09, larg: .1, focinho: { comp: .06, alt: .06, larg: .08 } }, orelha: { alt: .03, larg: .03, redonda: true }, cauda: { comp: .45, esp: .07 },
  cor: { corpo: 0x5a3f2c, peito: 0x5e4330, barriga: 0xc8ad86, pernaSup: 0x4e3524, pernaInf: 0x452e1f, pata: 0x2c1d13, pescoco: 0x5a3f2c, cabeca: 0x55392a, focinhoCor: 0x6a4d38, queixo: 0xe4d4b6, nariz: 0x120c08,
    orelha: 0x4a3223, cauda: 0x52392a, caudaPonta: 0x3a281c, olho: 0x120c08, brilho: 0xffcf8a }
};
