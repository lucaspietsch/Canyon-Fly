import { InstancedMesh, MeshStandardMaterial, BufferGeometry, Float32BufferAttribute, CylinderGeometry, IcosahedronGeometry, ConeGeometry, PlaneGeometry, DynamicDrawUsage, Color, Matrix4, Quaternion, Vector3, Euler, DoubleSide, CanvasTexture, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { U, qualidade } from "../config.js";
import { GLSL_VENTO } from "../vento.js";
import { dentroPoli, distPoli } from "./base.js";

/* ============================================================================================================
   ÁRVORES EM CAMADAS, SÓ DENTRO DAS ÁREAS DE MATA DO KML
   • mata (alta): do centro para a borda do polígono — GRANDES no centro (araucárias de tronco reto e copa em taça/candelabro acima das outras, folhosas de copa larga),
     MÉDIAS na faixa intermediária (copas arredondadas, alguns podocarpos/pinheiros-bravos) e PEQUENAS/arbustos na periferia, fazendo a transição para o campo.
   • mata mediana/baixa: um degrau abaixo (centro = médias, borda = pequenas e arbustos).
   • Distribuição orgânica: grade jitterada + ruído de manchas (clareiras), tamanho, giro, inclinação e cor variando em cada porte. Nenhuma árvore fora dos polígonos
     (nem dentro de turfeira, água, trilha, cercado, estacionamento ou fora do platô).
   • Desempenho: UM InstancedMesh por espécie × nível de detalhe (LOD0 perto, LOD1 médio, LOD2 = cruzeta com silhueta para o resto), remontados a cada ~1 s quando o jogador anda.
   • Vento: o balanço cresce com a altura (mais nas araucárias) e é ondulado, como no capim.
   ============================================================================================================ */

const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };

/* ---------- geometrias (altura 1 = escala da instância; base em y = 0) ---------- */
const paint = (g, r, gg, b, jit = .06) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, c = new Float32Array(n * 3); for(let i = 0; i < n; i += 3){ const k = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * jit; for(let j = 0; j < 3; j++){ c[(i + j) * 3] = r * k; c[(i + j) * 3 + 1] = gg * k; c[(i + j) * 3 + 2] = b * k; } } g.setAttribute("color", new Float32BufferAttribute(c, 3)); g.deleteAttribute("uv"); return g; };
const mv = (g, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { g.scale(sx, sy, sz); if(rx) g.rotateX(rx); if(rz) g.rotateZ(rz); g.translate(x, y, z); return g; };
const tronco = (r0, r1, h, seg, cor) => paint(mv(new CylinderGeometry(r1, r0, h, seg, 1), 0, h / 2, 0), ...cor, .1);
const blob = (r, det, x, y, z, sx, sy, sz, cor) => paint(mv(new IcosahedronGeometry(r, det), x, y, z, sx, sy, sz), ...cor, .12);

const GEO = {
  /* araucária: tronco reto e alto; copa em taça/candelabro (galhos que sobem e terminam em tufos achatados) */
  araucaria: (lod) => { const L = [tronco(.012, .018, .8, lod ? 5 : 7, [.30, .22, .16])]; const verde = [[.12, .30, .13], [.15, .34, .15], [.10, .26, .12]];
    const nb = lod ? 5 : 9; for(let i = 0; i < nb; i++){ const a = i / nb * 6.283 + (i % 2) * .3, y0 = .62 + (i % 3) * .05, r = .13 + (i % 2) * .03, up = .1 + (i % 3) * .04;
      if(!lod){ const br = paint(mv(new CylinderGeometry(.004, .006, .17, 4), Math.cos(a) * r * .5, y0 + .05, Math.sin(a) * r * .5, 1, 1, 1, 0, 0), .26, .19, .14); br.rotateZ(0); L.push(br); }
      L.push(blob(.08, lod ? 0 : 1, Math.cos(a) * r, y0 + up + (i % 2) * .05, Math.sin(a) * r, 1.5, .34, 1.5, verde[i % 3])); }
    L.push(blob(.1, lod ? 0 : 1, 0, .96, 0, 1.4, .4, 1.4, verde[1])); L.push(blob(.07, 0, 0, 1.0, 0, 1.2, .42, 1.2, verde[0])); return mergeGeometries(L); },
  folhosa: (lod) => { const L = [tronco(.03, .045, .45, lod ? 5 : 7, [.34, .26, .2])]; const v = [[.17, .40, .15], [.21, .46, .17], [.14, .34, .14]]; [[0, .62, 0, .32], [.16, .56, .08, .26], [-.14, .58, -.1, .25], [.04, .78, -.06, .22]].forEach(([x, y, z, r], i) => L.push(blob(r, lod ? 0 : 1, x, y, z, 1, .78, 1, v[i % 3]))); return mergeGeometries(L); },
  medio: (lod) => { const L = [tronco(.03, .05, .38, lod ? 5 : 6, [.36, .28, .2])]; const v = [[.19, .42, .16], [.24, .48, .18]]; L.push(blob(.34, lod ? 0 : 1, 0, .66, 0, 1, .85, 1, v[0])); if(!lod) L.push(blob(.22, 1, .14, .78, .06, 1, .8, 1, v[1])); return mergeGeometries(L); },
  podocarpo: (lod) => { const L = [tronco(.028, .04, .32, lod ? 5 : 6, [.34, .26, .2])]; const v = [[.13, .33, .15], [.16, .38, .17]]; L.push(paint(mv(new ConeGeometry(.24, .75, lod ? 5 : 8, 1), 0, .62, 0), ...v[0], .1)); if(!lod) L.push(paint(mv(new ConeGeometry(.17, .5, 8, 1), 0, .88, 0), ...v[1], .1)); return mergeGeometries(L); },
  pequeno: (lod) => { const L = [tronco(.03, .05, .4, lod ? 4 : 5, [.38, .3, .22])]; L.push(blob(.4, lod ? 0 : 1, 0, .68, 0, 1, .8, 1, [.23, .46, .18])); return mergeGeometries(L); },
  arbusto: (lod) => { const L = [blob(.4, lod ? 0 : 1, 0, .38, 0, 1.2, .9, 1.2, [.26, .46, .2])]; if(!lod){ L.push(blob(.3, 1, .28, .3, .1, 1.1, .8, 1.1, [.3, .5, .22])); L.push(blob(.28, 1, -.24, .26, -.12, 1.1, .8, 1.1, [.22, .42, .18])); } return mergeGeometries(L); }
};
/* silhuetas dos impostores (cruzeta de 2 planos com alfa) */
function texSilhueta(esp){
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d"); x.clearRect(0, 0, 64, 128);
  const verde = (a) => { x.fillStyle = a; };
  if(esp === "araucaria"){ x.fillStyle = "#4a3828"; x.fillRect(30, 40, 4, 88); verde("#1f4a23"); [[32, 28, 24, 7], [14, 36, 12, 5], [50, 36, 12, 5], [22, 24, 14, 5], [42, 24, 14, 5], [32, 16, 14, 5]].forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); }); }
  else if(esp === "podocarpo"){ x.fillStyle = "#4a3828"; x.fillRect(30, 96, 4, 32); verde("#1f4a26"); x.beginPath(); x.moveTo(32, 6); x.lineTo(50, 100); x.lineTo(14, 100); x.closePath(); x.fill(); }
  else { x.fillStyle = "#4a3828"; x.fillRect(30, 76, 4, 52); verde(esp === "folhosa" ? "#27592a" : "#2f6431"); x.beginPath(); x.ellipse(32, esp === "arbusto" ? 100 : 52, esp === "folhosa" ? 30 : 26, esp === "arbusto" ? 26 : 38, 0, 0, 7); x.fill(); }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
const cruzeta = () => { const a = new PlaneGeometry(1, 1), b = new PlaneGeometry(1, 1); b.rotateY(Math.PI / 2); const g = mergeGeometries([a, b]); g.translate(0, .5, 0); return g; };

/* espécies: altura m [min,max], largura relativa (largura = H × k), distâncias de colisão (raio do tronco em m) */
const ESP = {
  araucaria: { h: [22, 32], k: .62, tronco: .5, copa: [.1, .2, .12] }, folhosa: { h: [14, 20], k: .95, tronco: .45 }, medio: { h: [8, 12], k: .8, tronco: .3 },
  podocarpo: { h: [9, 13], k: .5, tronco: .28 }, pequeno: { h: [4, 7], k: .8, tronco: .2 }, arbusto: { h: [2, 3.5], k: 1, tronco: 0 }
};

export function criarArvores(M, base, vento){
  const Q = qualidade(), { cen } = M, FATOR = Q.arvores;
  const L0 = (Q.nome === "baixa" ? 30 : Q.nome === "alta" ? 55 : 42) * U, L1 = (Q.nome === "baixa" ? 110 : Q.nome === "alta" ? 220 : 160) * U, L2 = 1400 * U;
  /* material de árvore (cores no vértice × tinta da instância) com vento nas copas */
  const matArv = (alfa) => { const m = new MeshStandardMaterial({ vertexColors: !alfa, roughness: 1, metalness: 0, side: DoubleSide, flatShading: !alfa, alphaTest: alfa ? .5 : 0, map: alfa || null });
    m.onBeforeCompile = (sh) => { sh.uniforms.uVento = vento.U.uVento; sh.uniforms.uVentoMata = vento.U.uVentoMata;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL_VENTO).replace("#include <begin_vertex>", `#include <begin_vertex>
        { mat3 m3 = mat3(instanceMatrix); float s = length(m3[1]); vec3 wb = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float hf = clamp(position.y, 0.0, 1.2); hf *= hf;
          vec2 dir = normalize(uVento.xy + 1e-4); vec2 wo = dir * ondaVento(wb.xz * 0.35, 1.0) * hf * s * 0.045;
          vec3 l = transpose(m3) * vec3(wo.x, 0.0, wo.y); l /= (s * s); transformed.xz += l.xz; }`); };
    m.customProgramCacheKey = () => "arvore-v1" + (alfa ? "a" : ""); return m; };
  const mats = { solido: matArv(null) }; const impMat = {}; Object.keys(ESP).forEach(k => { impMat[k] = matArv(texSilhueta(k)); });
  /* meshes por espécie × LOD */
  const grupo = {}; const dummyColor = new Color(1, 1, 1);
  function criaMesh(geo, mat, cap){ const im = new InstancedMesh(geo, mat, cap); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.setColorAt(0, dummyColor); im.instanceColor.setUsage(DynamicDrawUsage); im.castShadow = false; im.receiveShadow = false; cen.grupo.add(im); return im; }
  /* árvores geradas: por espécie */
  const T = {}; Object.keys(ESP).forEach(k => { T[k] = { n: 0, m: [], x: [], z: [], c: [], h: [], r: [] }; });
  let todas = 0, colisores = [], poolCol = [];
  const distTurf = (x, z) => { let d = 1e9; for(const o of base.A.turfeira){ if(x < o.bb[0] - 60 || x > o.bb[1] + 60 || z < o.bb[2] - 60 || z > o.bb[3] + 60) continue; d = Math.min(d, distPoli(o.pts, x, z)); } return d; };
  function gera(){
    Object.keys(T).forEach(k => { T[k] = { n: 0, m: [], x: [], z: [], c: [], h: [], r: [] }; }); todas = 0;
    const cel = 5.6 * U, M4 = new Matrix4(), Qn = new Quaternion(), V = new Vector3(), S = new Vector3(), E = new Euler();
    const polis = [...base.A.mata.map(o => ({ o, baixa: false })), ...base.A.mataBaixa.map(o => ({ o, baixa: true }))];
    polis.forEach(({ o, baixa }, pi) => {
      const rin = base.raioInterno(o), fo = o.denso ? base.antigoCfg.foco : null, RD = 450 * U; let [x0, x1, z0, z1] = o.bb; const celP = o.denso ? 3.4 * U : cel;
      if(fo){ x0 = Math.max(x0, fo[0] - RD); x1 = Math.min(x1, fo[0] + RD); z0 = Math.max(z0, fo[1] - RD); z1 = Math.min(z1, fo[1] + RD); }       // mata do passado: só em volta do jogador (senão seriam centenas de milhares)
      for(let cz = Math.floor(z0 / celP); cz <= Math.floor(z1 / celP); cz++) for(let cx = Math.floor(x0 / celP); cx <= Math.floor(x1 / celP); cx++){
        const r1 = hash(cx, cz, pi + 3), x = (cx + .15 + .7 * hash(cx, cz, 11 + pi)) * celP, z = (cz + .15 + .7 * hash(cx, cz, 23 + pi)) * celP;
        if(x < x0 || x > x1 || z < z0 || z > z1 || !dentroPoli(o.pts, x, z)) continue;
        if(base.tipoEm(x, z) === "turfeira") continue;                                                    // a turfeira tem prioridade: nada de árvore dentro dela
        if(polis.some((q, qi) => qi < pi && !q.baixa === !baixa && x >= q.o.bb[0] && x <= q.o.bb[1] && z >= q.o.bb[2] && z <= q.o.bb[3] && dentroPoli(q.o.pts, x, z))) continue;      // polígonos sobrepostos = UMA mata só (a árvore nasce uma vez)
        let d = distPoli(o.pts, x, z), rinU = rin; polis.forEach((q, qi) => { if(qi !== pi && !q.baixa === !baixa && x >= q.o.bb[0] && x <= q.o.bb[1] && z >= q.o.bb[2] && z <= q.o.bb[3] && dentroPoli(q.o.pts, x, z)){ const dq = distPoli(q.o.pts, x, z); if(dq / base.raioInterno(q.o) > d / rinU){ d = dq; rinU = base.raioInterno(q.o); } } });
        const dTf = distTurf(x, z), t = Math.min(1, d / rinU), manchas = vn(x / (70 * U / 2.94), z / (70 * U / 2.94), 5), clareira = vn(x / (28 * U), z / (28 * U), 9) < .17;
        if(clareira && !o.denso) continue; if(fo && (Math.hypot(x - fo[0], z - fo[1]) > RD || Math.hypot(x - fo[0], z - fo[1]) < 16 * U)) continue;                // clareira de 16 m onde o jogador chega (e onde fica o portal de volta)
        let p = (baixa ? .5 : .62) * (.55 + .9 * manchas) * (t < .12 ? .55 : 1) * FATOR; if(o.denso) p = Math.min(.95, p * 1.3 + .25); if(r1 > p) continue;
        if(!o.denso && !base.livreBase(x, z, 6)) continue; const dT = base.distTrilha(x, z); if(dT < 7 * U / 2.94 * 2.0) continue; if(base.naAgua(x, z) || base.excluir.some(f => f(x, z))) continue;
        /* porte por camada: do centro (t alto) para a borda (t baixo) */
        const r = hash(cx, cz, 41 + pi); let esp;
        if(!baixa){ if(t > .6) esp = r < .32 ? "araucaria" : r < .66 ? "folhosa" : r < .94 ? (r < .8 ? "medio" : "podocarpo") : "pequeno"; else if(t > .28) esp = r < .08 ? "araucaria" : r < .14 ? "folhosa" : r < .36 ? "medio" : r < .6 ? "podocarpo" : r < .84 ? "pequeno" : "arbusto"; else esp = r < .02 ? "folhosa" : r < .12 ? "medio" : r < .32 ? "pequeno" : "arbusto"; }
        else { if(t > .5) esp = r < .08 ? "folhosa" : r < .5 ? "medio" : r < .62 ? "podocarpo" : r < .9 ? "pequeno" : "arbusto"; else esp = r < .12 ? "medio" : r < .52 ? "pequeno" : "arbusto"; }
        if(dT < 13 * U / 2.94 * 2 && (esp === "araucaria" || esp === "folhosa")) esp = "medio";
        if(dTf < 12 * U){ esp = dTf < 5 * U ? "arbusto" : (r < .6 ? "arbusto" : "pequeno"); }                 // transição natural até a turfeira: arbustos e árvores pequenas (as samambaias já engrossam aqui)
        const e = ESP[esp], hM = e.h[0] + (e.h[1] - e.h[0]) * Math.pow(hash(cx, cz, 61 + pi), .8) * (t > .6 ? 1 : .88), H = hM * U, W = H * e.k * (.9 + .25 * hash(cx, cz, 71)), tilt = (esp === "araucaria" ? .02 : .07) * (hash(cx, cz, 81) - .5) * 2;
        const y = base.alturaNo(x, z); E.set(tilt, hash(cx, cz, 91) * 6.283, tilt * .6); Qn.setFromEuler(E); V.set(x, y - .15, z); S.set(W / (esp === "araucaria" ? 1.55 : 1.55), H, W / 1.55); M4.compose(V, Qn, S);
        const tg = T[esp]; tg.m.push(...M4.elements); tg.x.push(x); tg.z.push(z); tg.h.push(H); tg.r.push(e.tronco * U); const tint = .86 + .28 * hash(cx, cz, 101), seas = hash(cx, cz, 111) > .9 ? 1.15 : 1; tg.c.push(tint * seas, tint, tint * .96); tg.n++; todas++;
      }
    });
    /* meshes */
    Object.keys(ESP).forEach(k => { const g = grupo[k] || (grupo[k] = {}), n = T[k].n; [g.l0, g.l1, g.l2].forEach(m => { if(m){ cen.grupo.remove(m); m.dispose(); } });
      const cap0 = Math.min(n, k === "araucaria" ? 160 : 260), cap1 = Math.min(n, 1600), cap2 = Math.min(n, 12000);
      g.l0 = criaMesh(GEO[k](0), mats.solido, Math.max(1, cap0)); g.l1 = criaMesh(GEO[k](1), mats.solido, Math.max(1, cap1)); g.l2 = criaMesh(cruzeta(), impMat[k], Math.max(1, cap2)); });
    ultC = [1e9, 1e9]; ultT = 0;
  }
  /* LOD: reparte as árvores nos três meshes por distância ao jogador */
  let ultC = [1e9, 1e9], ultT = 0; const tmpC = new Color();
  function lod(J){
    Object.keys(ESP).forEach(k => { const t = T[k], g = grupo[k], n = t.n; if(!g) return; let a = 0, b = 0, c = 0; const c0 = g.l0.instanceMatrix.count, c1 = g.l1.instanceMatrix.count, c2 = g.l2.instanceMatrix.count;
      for(let i = 0; i < n; i++){ const dx = t.x[i] - J.x, dz = t.z[i] - J.z, d2 = dx * dx + dz * dz; let dst, idx;
        if(d2 < L0 * L0 && a < c0){ dst = g.l0; idx = a++; } else if(d2 < L1 * L1 && b < c1){ dst = g.l1; idx = b++; } else if(d2 < L2 * L2 && c < c2){ dst = g.l2; idx = c++; } else continue;
        const o = i * 16, ar = dst.instanceMatrix.array; for(let q = 0; q < 16; q++) ar[idx * 16 + q] = t.m[o + q];
        if(dst === g.l2){ /* cruzeta: largura/altura reais (escala x,z já embutida) */ }
        const ac = dst.instanceColor.array; ac[idx * 3] = t.c[i * 3]; ac[idx * 3 + 1] = t.c[i * 3 + 1]; ac[idx * 3 + 2] = t.c[i * 3 + 2]; }
      g.l0.count = a; g.l1.count = b; g.l2.count = c; [g.l0, g.l1, g.l2].forEach(m => { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }); });
  }
  /* colisão: troncos das árvores grandes e médias mais próximas viram retângulos no array de colisores (pool fixo) */
  const POOLN = 48; for(let i = 0; i < POOLN; i++){ const c = { x0: 0, x1: 0, z0: 0, z1: 0, ativo: () => false, _on: false }; c.ativo = () => c._on; poolCol.push(c); cen.colisores.push(c); }
  function colide(J){
    const cand = []; ["araucaria", "folhosa", "medio", "podocarpo", "pequeno"].forEach(k => { const t = T[k]; for(let i = 0; i < t.n; i++){ const dx = t.x[i] - J.x, dz = t.z[i] - J.z, d2 = dx * dx + dz * dz; if(d2 < (16 * U) * (16 * U)) cand.push([d2, t.x[i], t.z[i], t.r[i]]); } });
    cand.sort((a, b) => a[0] - b[0]); for(let i = 0; i < POOLN; i++){ const c = poolCol[i], q = cand[i]; if(!q){ c._on = false; continue; } c.x0 = q[1] - q[3]; c.x1 = q[1] + q[3]; c.z0 = q[2] - q[3]; c.z1 = q[2] + q[3]; c._on = true; }
  }
  function tick(dt, J){
    if(!J) return; ultT += dt;
    if((ultT > .9 && Math.hypot(J.x - ultC[0], J.z - ultC[1]) > 10 * U) || ultC[0] > 1e8){ ultC = [J.x, J.z]; ultT = 0; lod(J); colide(J); }
  }
  /* árvore mais próxima (para o planejamento do quadriciclo/comboio e dos animais) */
  function perto(x, z, r){ for(const k of Object.keys(T)){ const t = T[k]; for(let i = 0; i < t.n; i++){ if(Math.abs(t.x[i] - x) < r && Math.abs(t.z[i] - z) < r) return true; } } return false; }
  gera();
  return { tick, regenera(){ gera(); }, perto, info: () => "Árvores: " + todas + " (" + Object.keys(ESP).map(k => k[0] + T[k].n).join(" ") + ")", T };
}
