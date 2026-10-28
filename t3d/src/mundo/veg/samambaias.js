import { InstancedMesh, MeshStandardMaterial, BufferGeometry, Float32BufferAttribute, CylinderGeometry, DynamicDrawUsage, Color, Matrix4, Quaternion, Vector3, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { U, qualidade } from "../config.js";
import { GLSL_VENTO } from "../vento.js";
import { dentroPoli, distPoli } from "./base.js";

/* ============================================================================================================
   SAMAMBAIAS, XAXINS (samambaiaçu / samambaia arborescente), TRONCOS CAÍDOS COM MUSGO E PISO ESCURO DA MATA
   • Campos: samambaias raras, em pequenos grupos isolados, mais nas partes úmidas e nas beiras de turfeira/banhado.
   • Mata: abundantes no sub-bosque, de tamanhos variados; xaxins (tronco fibroso + copa em leque) em manchas úmidas dentro dos capões e junto de turfeiras/água.
   • Instancing em blocos de 24 m, só ao redor do jogador (samambaia ~55 m, xaxim ~140 m), com a densidade caindo com a distância; folhas balançam com o vento global (mais forte nas pontas).
   • Piso da mata: malha única escurecida e úmida, com borda suave, sobre os polígonos de mata (sem passar da borda do platô).
   ============================================================================================================ */

const CH = 24 * U;
const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* fronde: faixa arqueada de 5 anéis (x = abertura, y = altura, z = para fora) */
function fronde(len, larg, arco, ang, y0, cor0, cor1, nSeg = 4){
  const pos = [], col = [], idx = [];
  for(let i = 0; i <= nSeg; i++){ const t = i / nSeg, r = len * t, h = y0 + Math.sin(t * 1.5) * len * .75 * (1 - arco * t) - arco * len * .4 * t * t, w = larg * Math.sin(Math.PI * Math.min(1, t * .95 + .05)) * (1 - t * .3);
    const cx = Math.cos(ang) * r, cz = Math.sin(ang) * r, px = -Math.sin(ang) * w, pz = Math.cos(ang) * w, k = t; const c = [cor0[0] + (cor1[0] - cor0[0]) * k, cor0[1] + (cor1[1] - cor0[1]) * k, cor0[2] + (cor1[2] - cor0[2]) * k];
    pos.push(cx - px, h, cz - pz, cx + px, h, cz + pz); col.push(...c, ...c); }
  for(let i = 0; i < nSeg; i++){ const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("color", new Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const geoSamambaia = () => { const L = []; for(let i = 0; i < 9; i++) L.push(fronde(.9 + (i % 3) * .12, .13, .35 + (i % 2) * .15, i / 9 * 6.283 + (i % 2) * .2, .12 + (i % 3) * .05, [.12, .26, .1], [.34, .56, .2])); return mergeGeometries(L.map(g => g.toNonIndexed())); };
const geoXaxim = () => { const tr = new CylinderGeometry(.09, .13, 2.2, 7, 1); tr.translate(0, 1.1, 0); const n = tr.attributes.position.count, c = new Float32Array(n * 3); for(let i = 0; i < n; i++){ const k = .8 + .4 * ((Math.sin(i * 7.7) * 43758.5) % 1); c[i * 3] = .26 * k; c[i * 3 + 1] = .18 * k; c[i * 3 + 2] = .12 * k; } tr.setAttribute("color", new Float32BufferAttribute(c, 3)); tr.deleteAttribute("uv");
  const L = [tr.toNonIndexed()]; for(let i = 0; i < 11; i++) L.push(fronde(1.45 + (i % 3) * .2, .18, .1 + (i % 4) * .18, i / 11 * 6.283, 2.2 + (i % 2) * .08, [.13, .3, .11], [.3, .5, .18], 5).toNonIndexed()); return mergeGeometries(L); };

export function criarSamambaias(M, base, vento){
  const Q = qualidade(), { cen } = M, Z = M.fauna.zonas;
  const RF = 55 * U * Math.sqrt(Q.samambaia), RX = 140 * U, MAXF = Math.round(9000 * Q.samambaia), MAXX = Math.round(700 * Q.xaxim);
  const mat = () => { const m = new MeshStandardMaterial({ vertexColors: true, roughness: 1, side: DoubleSide });
    m.onBeforeCompile = (sh) => { sh.uniforms.uVento = vento.U.uVento; sh.uniforms.uVentoMata = vento.U.uVentoMata;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL_VENTO).replace("#include <begin_vertex>", `#include <begin_vertex>
        { mat3 m3 = mat3(instanceMatrix); float s = length(m3[1]); vec3 wb = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float hf = clamp(length(transformed.xz) / 1.6 + transformed.y * 0.15, 0.0, 1.5); hf *= hf;
          vec2 dir = normalize(uVento.xy + 1e-4); vec2 wo = dir * ondaVento(wb.xz * 0.6, 1.0) * hf * s * 0.16 * mix(1.0, uVentoMata, 0.7);
          vec3 l = transpose(m3) * vec3(wo.x, 0.0, wo.y); l /= (s * s); transformed.xz += l.xz; transformed.y -= abs(l.x + l.z) * 0.25; }`); };
    m.customProgramCacheKey = () => "samamb-v1"; return m; };
  const mk = (geo, cap) => { const im = new InstancedMesh(geo, mat(), cap); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.setColorAt(0, new Color(1, 1, 1)); im.instanceColor.setUsage(DynamicDrawUsage); cen.grupo.add(im); return im; };
  const mF = mk(geoSamambaia(), MAXF), mX = mk(geoXaxim(), MAXX);
  /* troncos caídos com musgo */
  const tronco = new CylinderGeometry(.3, .34, 1, 7, 1); tronco.rotateZ(Math.PI / 2); { const n = tronco.attributes.position.count, c = new Float32Array(n * 3); for(let i = 0; i < n; i++){ const y = tronco.attributes.position.getY(i), k = .85 + .3 * ((Math.sin(i * 5.3) * 43758.5) % 1); c[i * 3] = (.3 + (y > .1 ? -.12 : 0)) * k; c[i * 3 + 1] = (.22 + (y > .1 ? .17 : 0)) * k; c[i * 3 + 2] = (.15 + (y > .1 ? -.06 : 0)) * k; } tronco.setAttribute("color", new Float32BufferAttribute(c, 3)); tronco.deleteAttribute("uv"); }
  const mT = new InstancedMesh(tronco, new MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 700); mT.count = 0; mT.frustumCulled = false; mT.instanceMatrix.setUsage(DynamicDrawUsage); cen.grupo.add(mT);
  /* geração por bloco */
  const cache = new Map(), M4 = new Matrix4(), Qn = new Quaternion(), V3 = new Vector3(), Sc = new Vector3(), Yv = new Vector3(0, 1, 0);
  const gradeAltura = (x0, z0) => { const n = 7, g = new Float32Array(n * n), st = CH / (n - 1); for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) g[j * n + i] = base.alturaNo(x0 + i * st, z0 + j * st); return (x, z) => { const fx = (x - x0) / st, fz = (z - z0) / st, i = Math.min(n - 2, Math.max(0, Math.floor(fx))), j = Math.min(n - 2, Math.max(0, Math.floor(fz))), tx = fx - i, tz = fz - j; const a = g[j * n + i], b = g[j * n + i + 1], c = g[(j + 1) * n + i], d = g[(j + 1) * n + i + 1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; }; };
  const distTurfeira = (x, z) => { let d = 1e9; for(const o of base.A.turfeira){ if(x < o.bb[0] - 600 || x > o.bb[1] + 600 || z < o.bb[2] - 600 || z > o.bb[3] + 600) continue; d = Math.min(d, distPoli(o.pts, x, z)); } return d; };
  function gera(cx, cz){
    const x0 = cx * CH, z0 = cz * CH, alt = gradeAltura(x0, z0), F = { m: [], c: [], x: [], z: [], r: [] }, X = { m: [], c: [], x: [], z: [], r: [] }, T = { m: [], x: [], z: [] };
    const centro = base.tipoEm(x0 + CH / 2, z0 + CH / 2);
    const nF = 230, nX = 22, nT = 3;
    const pertoAgua = Z.ZONAS.agua.distAgua(x0 + CH / 2, z0 + CH / 2) < 240;
    for(let k = 0; k < nF; k++){
      const x = x0 + hash(cx, cz, k * 2 + 1) * CH, z = z0 + hash(cx, cz, k * 2 + 2) * CH, tp = base.tipoEm(x, z); let p;
      if(tp === "mata") p = .55 * (.5 + vn(x / 90, z / 90, 3)); else if(tp === "mataBaixa") p = .32 * (.5 + vn(x / 90, z / 90, 3)); else if(tp === "turfeira") p = .02;
      else { const dt = distTurfeira(x, z), umido = dt < 150 ? 1 - dt / 150 : 0, grupo = vn(x / 38, z / 38, 7); p = (grupo > .78 ? .55 : 0) * (.25 + .75 * umido) + (dt < 60 ? .05 : 0); }
      if(hash(cx, cz, k + 999) > p || !base.livreBase(x, z, 2)) continue; if(base.distTrilha(x, z) < 6) continue; if(pertoAgua && base.naAgua(x, z)) continue; if(base.excluir.some(f => f(x, z))) continue;
      const e = (.55 + hash(cx, cz, k + 5) * .75) * U * (tp === "campo" ? .8 : 1), v = .8 + .35 * hash(cx, cz, k + 9);
      Qn.setFromAxisAngle(Yv, hash(cx, cz, k + 3) * 6.283); V3.set(x, alt(x, z), z); Sc.set(e, e * (.85 + .3 * hash(cx, cz, k + 6)), e); M4.compose(V3, Qn, Sc); F.m.push(...M4.elements); F.c.push(v * (.9 + hash(cx, cz, k + 4) * .2), v, v * .95); F.x.push(x); F.z.push(z); F.r.push(hash(cx, cz, k + 200));
    }
    if(centro === "mata" || centro === "mataBaixa" || base.A.turfeira.length){
      for(let k = 0; k < nX; k++){
        const x = x0 + hash(cx, cz, k * 2 + 5001) * CH, z = z0 + hash(cx, cz, k * 2 + 5002) * CH, tp = base.tipoEm(x, z); if(tp !== "mata" && tp !== "mataBaixa") continue;
        const umido = vn(x / 55, z / 55, 11), dt = distTurfeira(x, z), p = (tp === "mata" ? .55 : .22) * smooth(.55, .8, umido + (dt < 120 ? .25 : 0));
        if(hash(cx, cz, k + 7777) > p || !base.livreBase(x, z, 4) || base.distTrilha(x, z) < 10) continue; if(pertoAgua && base.naAgua(x, z)) continue;
        const e = (1.2 + hash(cx, cz, k + 5) * 1.6) * U; Qn.setFromAxisAngle(Yv, hash(cx, cz, k + 3) * 6.283); V3.set(x, alt(x, z) - .1, z); Sc.set(e * .9, e * (.95 + .3 * hash(cx, cz, k + 6)), e * .9); M4.compose(V3, Qn, Sc); X.m.push(...M4.elements); const v = .85 + .3 * hash(cx, cz, k + 9); X.c.push(v, v, v * .95); X.x.push(x); X.z.push(z);
      }
      for(let k = 0; k < nT; k++){
        const x = x0 + hash(cx, cz, k * 2 + 9001) * CH, z = z0 + hash(cx, cz, k * 2 + 9002) * CH, tp = base.tipoEm(x, z); if((tp !== "mata" && tp !== "mataBaixa") || hash(cx, cz, k + 9999) > .32 || !base.livreBase(x, z, 4) || base.distTrilha(x, z) < 8) continue; if(pertoAgua && base.naAgua(x, z)) continue;
        const len = (3.5 + hash(cx, cz, k + 5) * 5) * U, r = (.6 + hash(cx, cz, k + 6) * .5) ; Qn.setFromAxisAngle(Yv, hash(cx, cz, k + 3) * 6.283); V3.set(x, alt(x, z) + .22 * U * r, z); Sc.set(len, r * U * .8, r * U * .8); M4.compose(V3, Qn, Sc); T.m.push(...M4.elements); T.x.push(x); T.z.push(z);
      }
    }
    return { F, X, T };
  }
  let ultC = [1e9, 1e9], fila = [], atual = [], dirty = true;
  function planeja(J){ const R = Math.ceil(RX / CH) + 1, l = []; for(let cz = Math.floor(J.z / CH) - R; cz <= Math.floor(J.z / CH) + R; cz++) for(let cx = Math.floor(J.x / CH) - R; cx <= Math.floor(J.x / CH) + R; cx++){ const d = Math.hypot((cx + .5) * CH - J.x, (cz + .5) * CH - J.z); if(d < RX + CH * .6) l.push({ cx, cz, d }); } l.sort((a, b) => a.d - b.d); atual = l; fila = l.filter(c => !cache.has(c.cx + "," + c.cz)); dirty = true; }
  function monta(J){
    let nf = 0, nx = 0, nt = 0; const aM = mF.instanceMatrix.array, aC = mF.instanceColor.array, xM = mX.instanceMatrix.array, xC = mX.instanceColor.array, tM = mT.instanceMatrix.array;
    for(const c of atual){ const d = cache.get(c.cx + "," + c.cz); if(!d) continue;
      if(c.d < RF + CH){ const F = d.F; for(let i = 0; i < F.x.length && nf < MAXF; i++){ const dx = F.x[i] - J.x, dz = F.z[i] - J.z, dd = Math.sqrt(dx * dx + dz * dz); if(dd > RF || F.r[i] > 1 - smooth(RF * .35, RF, dd) * .92) continue; aM.set(F.m.slice(i * 16, i * 16 + 16), nf * 16); aC[nf * 3] = F.c[i * 3]; aC[nf * 3 + 1] = F.c[i * 3 + 1]; aC[nf * 3 + 2] = F.c[i * 3 + 2]; nf++; } }
      { const X = d.X; for(let i = 0; i < X.x.length && nx < MAXX; i++){ const dx = X.x[i] - J.x, dz = X.z[i] - J.z; if(dx * dx + dz * dz > RX * RX) continue; xM.set(X.m.slice(i * 16, i * 16 + 16), nx * 16); xC[nx * 3] = X.c[i * 3]; xC[nx * 3 + 1] = X.c[i * 3 + 1]; xC[nx * 3 + 2] = X.c[i * 3 + 2]; nx++; } }
      if(c.d < 100 * U){ const T = d.T; for(let i = 0; i < T.x.length && nt < 700; i++){ tM.set(T.m.slice(i * 16, i * 16 + 16), nt * 16); nt++; } } }
    mF.count = nf; mX.count = nx; mT.count = nt; [mF.instanceMatrix, mF.instanceColor, mX.instanceMatrix, mX.instanceColor, mT.instanceMatrix].forEach(a => { a.needsUpdate = true; }); dirty = false;
  }
  function tick(dt, J){
    if(!J) return;
    if(Math.hypot(J.x - ultC[0], J.z - ultC[1]) > CH * .3){ ultC = [J.x, J.z]; planeja(J); }
    let n = 0; while(fila.length && n < 2){ const c = fila.shift(); const k = c.cx + "," + c.cz; if(!cache.has(k)){ cache.set(k, gera(c.cx, c.cz)); n++; dirty = true; } }
    if(dirty) monta(J); if(cache.size > 500){ const it = cache.keys(); for(let i = 0; i < 150; i++) cache.delete(it.next().value); }
  }
  /* piso escurecido da mata (malha única, borda suave) */
  let piso = null;
  function constroiPiso(){
    if(piso){ cen.grupo.remove(piso); piso.geometry.dispose(); piso = null; }
    const cel = 14 * U, pos = [], col = [], idx = [], mapa = new Map();
    const alvo = [...base.A.mata.map(o => ({ o, k: 1 })), ...base.A.mataBaixa.map(o => ({ o, k: .6 }))];
    const alfaEm = (x, z) => { for(const { o, k } of alvo){ if(x < o.bb[0] || x > o.bb[1] || z < o.bb[2] || z > o.bb[3]) continue; if(!dentroPoli(o.pts, x, z)) continue; if(base.tipoEm(x, z) === "turfeira") return 0; if(!base.livreBase(x, z, 1)) return 0; return k * smooth(0, 60 * U / 2.94, distPoli(o.pts, x, z)) * .62; } return 0; };
    alvo.forEach(({ o }) => { for(let cz = Math.floor(o.bb[2] / cel); cz <= Math.ceil(o.bb[3] / cel); cz++) for(let cx = Math.floor(o.bb[0] / cel); cx <= Math.ceil(o.bb[1] / cel); cx++){ const kk = cx + "," + cz; if(mapa.has(kk)) continue; const a = alfaEm(cx * cel, cz * cel); mapa.set(kk, a); } });
    const vid = new Map(); const vtx = (cx, cz) => { const k = cx + "," + cz; if(vid.has(k)) return vid.get(k); const x = cx * cel, z = cz * cel, a = mapa.get(k) !== undefined ? mapa.get(k) : alfaEm(x, z); pos.push(x, base.alturaNo(x, z) + .09, z); col.push(.16, .17, .1, a); const i = pos.length / 3 - 1; vid.set(k, i); return i; };
    for(const [k, a] of mapa){ const [cx, cz] = k.split(",").map(Number); const a1 = mapa.get((cx + 1) + "," + cz), a2 = mapa.get(cx + "," + (cz + 1)), a3 = mapa.get((cx + 1) + "," + (cz + 1)); if(a <= 0 && !(a1 > 0) && !(a2 > 0) && !(a3 > 0)) continue; const i0 = vtx(cx, cz), i1 = vtx(cx + 1, cz), i2 = vtx(cx, cz + 1), i3 = vtx(cx + 1, cz + 1); idx.push(i0, i2, i1, i1, i2, i3); }
    if(!idx.length) return; const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); const c4 = new Float32Array(col); g.setAttribute("color", new Float32BufferAttribute(c4, 4)); g.setIndex(idx); g.computeVertexNormals();
    piso = new Mesh(g, new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, opacity: 1 })); piso.renderOrder = 2; piso.frustumCulled = false; cen.grupo.add(piso); piso.userData.semSombra = true;
  }
  /* o piso usa cor fixa escura: escurece junto com a luz do ciclo */
  const regenera = () => { cache.clear(); ultC = [1e9, 1e9]; mF.count = mX.count = mT.count = 0; try{ constroiPiso(); }catch(e){ console.warn("piso da mata:", e); } };
  const corPiso = new Color();
  function ciclo(E){ if(piso){ const l = Math.max(.12, E.lum !== undefined ? E.lum : 1); piso.material.color.setRGB(l, l, l); } }
  regenera();
  return { tick: (dt, J, E) => { tick(dt, J); if(E) ciclo(E); }, regenera, info: () => "Samambaias " + mF.count + " · xaxins " + mX.count + " · troncos " + mT.count, void: corPiso };
}
