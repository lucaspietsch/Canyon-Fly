import { Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, DataTexture, RGBAFormat, UnsignedByteType, LinearFilter, RepeatWrapping, Vector3, Vector4, Color, CircleGeometry, RingGeometry, SphereGeometry, PlaneGeometry, DoubleSide, Group, Line, LineBasicMaterial, CanvasTexture, SRGBColorSpace, CatmullRomCurve3 } from "three";
import { U, TURFEIRA as TF } from "../config.js";
import { texRuido } from "../ruido.js";
import { texAguaCorrente } from "../../terreno.js";
import { dentroPoli, distPoli } from "./base.js";

/* ============================================================================================================
   TURFEIRAS (banhados) COM SPHAGNUM, POÇAS, CANAIS E NASCENTES
   • Áreas: polígonos de turfeira/banhado do KML. Sem KML, 2 turfeiras provisórias nos campos (fáceis de substituir: ver `provisorias`).
   • Superfície: malha única sobre o platô, com almofadas suaves de musgo (a altura do chão também as segue) e borda que se funde ao campo. A aparência é feita no shader a
     partir de um mapa de poças/umidade/nascentes (textura): mosaico de verde-claro, verde-amarelado, ferrugem e palha; "estrelinhas" (rosetas) densas no topo das hastes, só de perto;
     poças e canais de água escura cor de chá que refletem o céu (mais especular onde molhado); neblina rasteira nas madrugadas.
   • Nascentes: poça clara com ondulação saindo do centro e bolhinhas; o filete serpenteia pela turfeira, ganha volume e DESAGUA no arroio, que segue ao cânion e à cascata.
   • Caminhar: lento, pisada encharcada, pé afunda (a câmera desce um pouco), pegadas que somem devagar e aviso educativo; NPCs, quadriciclo e comboio nunca entram.
   ============================================================================================================ */

const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };
const vnf = (x, z, s) => (vn(x, z, s) * .55 + vn(x * 2.1, z * 2.1, s + 5) * .3 + vn(x * 4.3, z * 4.3, s + 9) * .15);
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);

export function criarTurfeira(M, base, vento){
  const { cen } = M, Z = M.fauna.zonas, grupo = new Group(); cen.grupo.add(grupo);
  const S = { polis: [], nascentes: [], filetes: [], pegadas: [], dentro: false, fora: 99, pisou: false, aviso: 0, t: 0, passou: new Set() };
  const U_ = { uRuido: { value: texRuido() }, uTempo: { value: 0 }, uSky: { value: new Color(.55, .68, .85) }, uWet: { value: 0 }, uLuz: { value: 1 }, uNevoa: { value: 0 } };
  const AT = []; let provisorio = false;

  /* ---------- áreas ---------- */
  function carregaAreas(){
    S.polis.forEach(p => { grupo.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); S.polis = [];
    let L = base.A.turfeira;
    if(!L.length && TF.provisorias > 0){ provisorio = true; L = [[-380, 760], [160, 980], [820, 520]].slice(0, TF.provisorias).map(([cx, cz], k) => { const pts = []; for(let a = 0; a < 18; a++){ const t = a / 18 * 6.283, r = 150 + 55 * Math.sin(t * 3 + k) + 25 * Math.sin(t * 5 + 2 * k); pts.push([cx + Math.cos(t) * r * 1.2, cz + Math.sin(t) * r]); } return { nome: "turfeira provisória " + (k + 1), tipo: "turfeira", pts, bb: [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))] }; }); } else provisorio = false;
    L.forEach((o, i) => { const p = { o, i, pts: o.pts, bb: o.bb, nascentes: [], mask: null, mesh: null }; S.polis.push(p); });
    S.polis.forEach(p => escolheNascentes(p));
    S.polis.forEach(p => constroiMask(p));
    AT.length = 0; AT.push(...S.polis);
    S.polis.forEach(p => constroiMalha(p));
    constroiFiletes();
  }
  /* ---------- nascentes (na parte mais alta, longe da borda do cânion, ligadas ao arroio) ---------- */
  const ARROIO = cen.rios.ARROIO, kmlNasc = () => ((M.kml && M.kml.S.pontos) || []).filter(p => TF.nascenteNome.test(p.nome || ""));
  const distLinha = (L, x, z) => { let d = 1e18; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1; let t = ((x - a[0]) * vx + (z - a[1]) * vz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - a[0] - vx * t, dz = z - a[1] - vz * t; d = Math.min(d, dx * dx + dz * dz); } return Math.sqrt(d); };
  function escolheNascentes(p){
    const pts = kmlNasc().filter(q => dentroPoli(p.pts, q.pt[0], q.pt[1]));
    if(pts.length){ pts.forEach(q => p.nascentes.push({ x: q.pt[0], z: q.pt[1], poli: p })); return; }
    const n = Math.round(TF.nascentes[0] + hash(p.i, 3, 1) * (TF.nascentes[1] - TF.nascentes[0])), cand = [];
    for(let k = 0; k < 3500; k++){ const x = p.bb[0] + Math.random() * (p.bb[1] - p.bb[0]), z = p.bb[2] + Math.random() * (p.bb[3] - p.bb[2]); if(!dentroPoli(p.pts, x, z)) continue; const dE = distPoli(p.pts, x, z); if(dE < 60) continue;
      const dT = base.distTrilha(x, z); if(dT < 100) continue; const dA = distLinha(ARROIO, x, z); if(dA < 220 || dA > 1500) continue; const dB = Z.distBorda(x, z); cand.push({ x, z, s: dB * .7 + dE * .5 - dA * .15 + (Math.random() * 40) }); }
    cand.sort((a, b) => b.s - a.s); for(const c of cand){ if(p.nascentes.length >= n) break; if(p.nascentes.every(q => Math.hypot(q.x - c.x, q.z - c.z) > 300)) p.nascentes.push({ x: c.x, z: c.z, poli: p }); }
  }
  /* ---------- mapa (poças, umidade, nascentes) ---------- */
  function constroiMask(p){
    const cell = TF.celulaMask, pad = 30, x0 = p.bb[0] - pad, z0 = p.bb[2] - pad, w = p.bb[1] - p.bb[0] + pad * 2, h = p.bb[3] - p.bb[2] + pad * 2, nx = Math.ceil(w / cell), nz = Math.ceil(h / cell), data = new Uint8Array(nx * nz * 4);
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){
      const x = x0 + (i + .5) * cell, z = z0 + (j + .5) * cell, k = (j * nx + i) * 4; if(x < p.bb[0] || x > p.bb[1] || z < p.bb[2] || z > p.bb[3] || !dentroPoli(p.pts, x, z)) continue;
      const noAterro = !!M.estrada && M.estrada.ocupa(x, z, 6);                                  // a estrada (aterro) corta o banhado sem apagá-lo dos dois lados
      const d = distPoli(p.pts, x, z), a = noAterro ? 0 : sm(0, 18, d), n1 = vnf(x / 85, z / 85, 3), rid = 1 - Math.abs(2 * vnf(x / 55, z / 55, 7) - 1);
      let r = Math.max(sm(.63, .72, n1), sm(.945, .975, rid)) * sm(14, 40, d); const dT = base.distTrilha(x, z); r *= sm(6, 26, dT);
      data[k] = r * 255; data[k + 1] = vnf(x / 34, z / 34, 11) * 255; data[k + 2] = 0; data[k + 3] = a * 255;
    }
    p.mask = { data, nx, nz, x0, z0, cell, w, h };
  }
  const amostra = (p, x, z) => { const m = p.mask; if(!m) return null; const fx = (x - m.x0) / m.cell - .5, fz = (z - m.z0) / m.cell - .5, i = Math.floor(fx), j = Math.floor(fz); if(i < 0 || j < 0 || i >= m.nx - 1 || j >= m.nz - 1) return null; const tx = fx - i, tz = fz - j, d = m.data, k0 = (j * m.nx + i) * 4, k1 = k0 + 4, k2 = k0 + m.nx * 4, k3 = k2 + 4;
    const ch = (c) => (d[k0 + c] * (1 - tx) * (1 - tz) + d[k1 + c] * tx * (1 - tz) + d[k2 + c] * (1 - tx) * tz + d[k3 + c] * tx * tz) / 255; return { r: ch(0), g: ch(1), b: ch(2), a: ch(3) }; };
  /* marca no mapa os filetes (r) e as nascentes (b) */
  function pintaMask(p, pts, larg, canal, valor){ const m = p.mask; if(!m) return; for(let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / (m.cell * .5))); for(let s = 0; s <= n; s++){ const x = a[0] + (b[0] - a[0]) * s / n, z = a[1] + (b[1] - a[1]) * s / n; pintaPonto(m, x, z, larg, canal, valor); } } }
  function pintaPonto(m, x, z, rad, canal, valor){ const ci = Math.round((x - m.x0) / m.cell - .5), cj = Math.round((z - m.z0) / m.cell - .5), R = Math.ceil(rad / m.cell); for(let j = cj - R; j <= cj + R; j++) for(let i = ci - R; i <= ci + R; i++){ if(i < 0 || j < 0 || i >= m.nx || j >= m.nz) continue; const d = Math.hypot((i + .5) * m.cell + m.x0 - x, (j + .5) * m.cell + m.z0 - z); if(d > rad) continue; const k = (j * m.nx + i) * 4; if(m.data[k + 3] === 0) continue; const v = valor * (1 - d / rad * .5) * 255; if(v > m.data[k + canal]) m.data[k + canal] = v; } }

  /* ---------- altura (almofadas) ---------- */
  function cushion(x, z){
    for(let k = 0; k < AT.length; k++){ const p = AT[k]; if(x < p.bb[0] - 30 || x > p.bb[1] + 30 || z < p.bb[2] - 30 || z > p.bb[3] + 30) continue; const m = amostra(p, x, z); if(!m || m.a <= .01) continue;
      const n = vnf(x / 10, z / 10, 21) * .65 + vn(x / 3.6, z / 3.6, 4) * .35; return (n - .38) * TF.almofada * 2 * m.a - .35 * m.r * m.a; }
    return 0;
  }
  const emTurfeira = (x, z) => { for(let k = 0; k < AT.length; k++){ const p = AT[k]; if(x < p.bb[0] || x > p.bb[1] || z < p.bb[2] || z > p.bb[3]) continue; if(dentroPoli(p.pts, x, z)) return p; } return null; };
  const distTurfeira = (x, z) => { let d = 1e9; for(const p of AT){ if(x < p.bb[0] - 900 || x > p.bb[1] + 900 || z < p.bb[2] - 900 || z > p.bb[3] + 900) continue; d = Math.min(d, dentroPoli(p.pts, x, z) ? 0 : distPoli(p.pts, x, z)); } return d; };
  const alfaEm = (x, z) => { const p = emTurfeira(x, z); if(!p) return 0; const m = amostra(p, x, z); return m ? m.a : 0; };
  const pocaEm = (x, z) => { const p = emTurfeira(x, z); if(!p) return 0; const m = amostra(p, x, z); return m ? m.r * m.a : 0; };

  /* ---------- malha + shader do Sphagnum ---------- */
  function constroiMalha(p){
    const cel = 9 * U / 2.94, nx = Math.ceil((p.bb[1] - p.bb[0]) / cel) + 3, nz = Math.ceil((p.bb[3] - p.bb[2]) / cel) + 3, x0 = p.bb[0] - cel, z0 = p.bb[2] - cel, pos = [], idx = [], id = new Int32Array((nx + 1) * (nz + 1)).fill(-1), al = [];
    const vtx = (i, j) => { const k = j * (nx + 1) + i; if(id[k] >= 0) return id[k]; const x = x0 + i * cel, z = z0 + j * cel, a = alfaEm(x, z); pos.push(x, base.alturaNo(x, z) + .06, z); al.push(a); id[k] = pos.length / 3 - 1; return id[k]; };
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){ const xs = [x0 + i * cel, x0 + (i + 1) * cel], zs = [z0 + j * cel, z0 + (j + 1) * cel]; if(!(alfaEm(xs[0], zs[0]) > 0 || alfaEm(xs[1], zs[0]) > 0 || alfaEm(xs[0], zs[1]) > 0 || alfaEm(xs[1], zs[1]) > 0 || alfaEm((xs[0] + xs[1]) / 2, (zs[0] + zs[1]) / 2) > 0)) continue;
      const a = vtx(i, j), b = vtx(i + 1, j), c = vtx(i, j + 1), d = vtx(i + 1, j + 1); idx.push(a, c, b, b, c, d); }
    if(!idx.length) return; const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("aAlfa", new Float32BufferAttribute(al, 1)); g.setIndex(idx); g.computeVertexNormals();
    const m = p.mask, tex = new DataTexture(m.data, m.nx, m.nz, RGBAFormat, UnsignedByteType); tex.magFilter = tex.minFilter = LinearFilter; tex.needsUpdate = true; p.tex = tex;
    const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: .6, metalness: 0, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U_); sh.uniforms.uMapa = { value: tex }; sh.uniforms.uBB = { value: new Vector4(m.x0, m.z0, m.nx * m.cell, m.nz * m.cell) };
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aAlfa; varying float vAlfa; varying vec3 vWP;").replace("#include <begin_vertex>", "#include <begin_vertex>\n vAlfa = aAlfa; vWP = (modelMatrix * vec4(position, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
        varying float vAlfa; varying vec3 vWP; uniform sampler2D uMapa, uRuido; uniform vec4 uBB; uniform float uTempo, uWet, uLuz, uNevoa; uniform vec3 uSky;
        float pocaV = 0.0; float umidoV = 0.0;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
        /* roseta (estrelinha) do topo das hastes de Sphagnum: células pequenas com forma de estrela */
        float roseta(vec2 p, out float id){ vec2 c = floor(p), f = fract(p) - 0.5; vec2 j = (h22(c) - 0.5) * 0.5; f -= j; float r = length(f) * 2.0; id = h21(c); float a = atan(f.y, f.x);
          float estrela = 0.55 + 0.45 * cos(a * (5.0 + floor(id * 3.0)) + id * 6.28); return smoothstep(1.0, 0.1, r / (0.55 + 0.35 * estrela)); }`)
        .replace("#include <color_fragment>", `#include <color_fragment>
        {
          vec2 uvm = (vWP.xz - uBB.xy) / uBB.zw; vec4 mk = texture2D(uMapa, uvm);
          vec4 nA = texture2D(uRuido, vWP.xz * 0.0021), nB = texture2D(uRuido, vWP.xz * 0.0067 + 0.3), nC = texture2D(uRuido, vWP.xz * 0.021 + 0.7), nD = texture2D(uRuido, vWP.xz * 0.06 + 0.1);
          float dist = distance(cameraPosition, vWP);
          float poca = smoothstep(0.42, 0.56, mk.r + (nC.g - 0.5) * 0.22 + (nD.b - 0.5) * 0.08);
          float nasc = mk.b; float mosaic = nA.r * 0.6 + nB.g * 0.4;
          vec3 verdeC = vec3(0.50, 0.70, 0.26), verdeA = vec3(0.64, 0.70, 0.24), ferr = vec3(0.60, 0.20, 0.12), palha = vec3(0.64, 0.54, 0.30), verdeE = vec3(0.30, 0.52, 0.18);
          vec3 cor = mix(verdeC, verdeA, smoothstep(0.35, 0.55, mosaic));
          cor = mix(cor, ferr, smoothstep(0.50, 0.62, nB.b * 0.7 + nA.g * 0.4 - nasc * 0.5));
          cor = mix(cor, palha, smoothstep(0.62, 0.78, nC.r * 0.5 + nA.b * 0.6) * (1.0 - nasc));
          cor = mix(cor, verdeE, clamp(nasc * 1.6, 0.0, 0.85));
          float id; float ros = roseta(vWP.xz * 3.1, id); float ros2 = roseta(vWP.xz * 6.3 + 7.0, id);
          float detalhe = 1.0 - smoothstep(4.0, 22.0, dist);
          cor *= mix(1.0, 0.72 + 0.55 * (ros * 0.65 + ros2 * 0.35), detalhe);
          cor = mix(cor, cor * 1.15 + vec3(0.04, 0.02, 0.0), (id - 0.5) * 0.3 * detalhe);
          cor *= mix(1.0, 0.8, uWet);
          vec3 cha = vec3(0.075, 0.045, 0.028);
          vec3 vv = normalize(cameraPosition - vWP); float fr = pow(1.0 - clamp(vv.y, 0.0, 1.0), 3.0);
          vec3 agua = mix(cha, uSky * 0.8, 0.16 + 0.42 * fr);
          vec3 final = mix(cor, agua, poca);
          pocaV = poca; umidoV = 0.4 + 0.6 * mk.g;
          diffuseColor.rgb = final * (0.72 + 0.1 * uLuz);
          diffuseColor.a = vAlfa;
        }`)
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = mix(mix(0.62, 0.38, umidoV * (0.5 + uWet)), 0.05, pocaV);")
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n normal = normalize(normal + vec3(sin(vWP.x * 1.7 + uTempo * 1.3) + sin(vWP.z * 2.3 - uTempo), 0.0, cos(vWP.x * 1.1 - uTempo * 0.9) + sin(vWP.z * 1.9 + uTempo * 1.1)) * 0.012 * pocaV);"); };
    mat.customProgramCacheKey = () => "turfeira-v1";
    const mesh = new Mesh(g, mat); mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.receiveShadow = false; grupo.add(mesh); p.mesh = mesh;
  }

  /* ---------- filetes: do olho d'água até o arroio, serpenteando ---------- */
  const streamTex = texAguaCorrente(); streamTex.wrapS = streamTex.wrapT = RepeatWrapping;
  const matFilete = new MeshStandardMaterial({ map: streamTex, color: 0xb9d2c8, roughness: .12, metalness: 0, transparent: true, opacity: .88, side: DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  function constroiFiletes(){
    S.filetes.forEach(f => { grupo.remove(f.mesh); f.mesh.geometry.dispose(); }); S.filetes = [];
    S.nascentes.forEach(n => { n.grupo && grupo.remove(n.grupo); }); S.nascentes = [];
    S.polis.forEach(p => p.nascentes.forEach((n, k) => {
      /* ponto de encontro com o arroio: um ponto já encaixado no vale (chão rebaixado), o mais próximo da nascente */
      let melhor = null; const A = cen.rios.ARROIO, curva = new CatmullRomCurve3(A.map(([x, z]) => new Vector3(x, 0, z)), false, "centripetal"), amost = curva.getSpacedPoints(120);
      for(const v of amost){ const prof = cen.relevo(v.x, v.z) - cen.campo.chao; if(prof > -1.4) continue; const d = Math.hypot(v.x - n.x, v.z - n.z); if(!melhor || d < melhor.d) melhor = { d, x: v.x, z: v.z }; }
      if(!melhor) melhor = { x: A[3][0], z: A[3][1], d: 1 };
      /* caminho: da nascente ao arroio, com meandros que somem perto da junção */
      const dx = melhor.x - n.x, dz = melhor.z - n.z, L = Math.hypot(dx, dz), nr = -dz / L, nzv = dx / L, pts = [], seg = Math.max(8, Math.round(L / 24)), seed = hash(p.i, k, 77) * 50, amp = Math.min(42, L * .08);
      for(let s = 0; s <= seg; s++){ const t = s / seg, m = Math.sin(t * Math.PI * (2 + hash(p.i, k, 5) * 2) + seed) * amp * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * .6) + (vnf(t * 6, seed, 31) - .5) * amp * .8 * (1 - t); pts.push([n.x + dx * t + nr * m, n.z + dz * t + nzv * m]); }
      n.pts = pts; n.arroio = melhor; n.id = S.nascentes.length; S.nascentes.push(n); pintaMask(p, pts, 4.2, 0, 1); pintaPonto(p.mask, n.x, n.z, 70, 2, 1); pintaPonto(p.mask, n.x, n.z, 9, 0, 1);
      /* faixa de água acompanhando o terreno; a largura cresce com a distância */
      const pos = [], uv = [], idx = [], dense = []; for(let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = Math.max(1, Math.round(l / 6)); for(let q = 0; q < nn; q++) dense.push([a[0] + (b[0] - a[0]) * q / nn, a[1] + (b[1] - a[1]) * q / nn]); } dense.push(pts[pts.length - 1]);
      let ac = 0; dense.forEach((q, i) => { const a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; if(i) ac += Math.hypot(q[0] - dense[i - 1][0], q[1] - dense[i - 1][1]);
        const u = i / (dense.length - 1), w = (1.3 + 3.6 * Math.pow(u, .8)) / 2, ya = (x, z) => base.alturaNo(x, z) + .11 - (cen.relevo(x, z) - cen.campo.chao < -.4 ? 0 : 0); pos.push(q[0] - tz * w, ya(q[0] - tz * w, q[1] + tx * w), q[1] + tx * w, q[0] + tz * w, ya(q[0] + tz * w, q[1] - tx * w), q[1] - tx * w); uv.push(0, ac / 30, 1, ac / 30); if(i) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2); });
      const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const mesh = new Mesh(g, matFilete); mesh.renderOrder = 4; mesh.frustumCulled = false; grupo.add(mesh); S.filetes.push({ mesh, nascente: n, dense });
      /* a nascente: poça clara com ondas saindo do centro e bolhinhas */
      const ng = new Group(), y = base.alturaNo(n.x, n.z) + .16; ng.position.set(n.x, y, n.z);
      const disco = new Mesh(new CircleGeometry(5.2, 28), new MeshStandardMaterial({ color: 0xcfe9ef, roughness: .05, transparent: true, opacity: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 })); disco.rotation.x = -Math.PI / 2; ng.add(disco);
      const aneis = []; for(let r = 0; r < 3; r++){ const an = new Mesh(new RingGeometry(.88, 1, 36), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .0, depthWrite: false, side: DoubleSide })); an.rotation.x = -Math.PI / 2; an.position.y = .04 + r * .002; ng.add(an); aneis.push(an); }
      const bol = []; for(let b = 0; b < 6; b++){ const bm = new Mesh(new SphereGeometry(.16, 6, 4), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); ng.add(bm); bol.push({ m: bm, t: Math.random() * 3, x: rnd(-1.8, 1.8), z: rnd(-1.8, 1.8) }); }
      grupo.add(ng); n.grupo = ng; n.aneis = aneis; n.bolhas = bol; n.y = y;
    }));
    S.polis.forEach(p => { if(p.tex){ p.tex.image.data = p.mask.data; p.tex.needsUpdate = true; } });
  }
  function animaNascentes(dt, J){
    S.nascentes.forEach(n => { if(!n.grupo) return; const d = J ? Math.hypot(n.x - J.x, n.z - J.z) / U : 999; n.grupo.visible = d < 260;
      if(d > 90) return; n.aneis.forEach((an, r) => { const t = ((S.t * .45 + r / 3) % 1); an.scale.setScalar(.3 + t * 5.2); an.material.opacity = (1 - t) * .55 * (t < .12 ? t / .12 : 1); });
      n.bolhas.forEach(b => { b.t += dt; if(b.t > 3){ b.t = 0; b.x = rnd(-1.8, 1.8); b.z = rnd(-1.8, 1.8); } const u = b.t / 3; b.m.position.set(b.x, .1 + Math.sin(u * Math.PI) * .35, b.z); b.m.scale.setScalar(u < .85 ? .6 + u * .6 : (1 - u) * 6); b.m.visible = u < .93; }); });
  }

  /* ---------- pegadas, aviso, pé leve ---------- */
  const matPeg = [.55, .42, .3, .16].map(o => new MeshBasicMaterial({ color: 0x241810, transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
  const geoPeg = new PlaneGeometry(.55, 1.15); const pegs = []; for(let i = 0; i < 90; i++){ const m = new Mesh(geoPeg, matPeg[0]); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 5; grupo.add(m); pegs.push({ m, t: 1e9 }); } let pk = 0, ult = [1e9, 1e9], lado = 1;
  let ac = null; const passoSom = () => { try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime, n = Math.floor(ac.sampleRate * .16), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2) * (i < n * .2 ? i / (n * .2) : 1);
      const s = ac.createBufferSource(); s.buffer = buf; const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 650 + Math.random() * 400; const g = ac.createGain(); g.gain.value = .22; s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t); }catch(_){ /* sem áudio */ } };
  const TEXTO = "Você está em uma turfeira. Ela leva milhares de anos para se formar e é muito sensível ao pisoteio. Volte para a trilha.";
  const guard = (() => { try{ return JSON.parse(localStorage.getItem("sgv:turf") || "{}"); }catch(_){ return {}; } })(); const salva = () => { try{ localStorage.setItem("sgv:turf", JSON.stringify(guard)); }catch(_){ /* */ } };
  function tickJogador(dt, J){
    const p = emTurfeira(J.x, J.z), solo = base.alturaNo(J.x, J.z), noDeck = J.y > solo + 1.0;
    const dentro = !!p && !noDeck && alfaEm(J.x, J.z) > .25;
    if(dentro){ if(!S.dentro && S.fora > 6){ M.ctx && M.ctx.mostraAviso(TEXTO); } S.dentro = true; S.fora = 0; S.tDentro = (S.tDentro || 0) + dt; if(S.tDentro > 3 && !guard.pisou){ guard.pisou = true; salva(); } }
    else { S.dentro = false; S.fora += dt; S.tDentro = 0; }
    /* pegadas */
    if(dentro && Math.hypot(J.x - ult[0], J.z - ult[1]) > 1.5 * U){ ult = [J.x, J.z]; lado *= -1; const r = pegs[pk++ % pegs.length]; r.t = 0; const yaw = J.yaw !== undefined ? J.yaw : 0; r.m.position.set(J.x + Math.cos(yaw) * lado * .5, base.alturaNo(J.x, J.z) + .1, J.z - Math.sin(yaw) * lado * .5); r.m.rotation.set(-Math.PI / 2, 0, 0); r.m.rotation.order = "YXZ"; r.m.rotation.y = yaw; r.m.rotation.x = -Math.PI / 2; r.m.visible = true; r.m.material = matPeg[0]; passoSom(); }
    /* "Pé Leve": visitou (a menos de 30 m) todas as turfeiras sem pisar */
    S.polis.forEach(q => { const d = distTurfeira(J.x, J.z) / U; if(d < 30){ if(!guard["v" + q.i]){ guard["v" + q.i] = 1; salva(); } } });
    if(M.conquistas){ if(S.polis.length && S.polis.every(q => guard["v" + q.i]) && !guard.pisou) M.conquistas.dar("pe", "Pé Leve", "Passou por todas as turfeiras sem pisar fora da passarela ou da trilha.");
      S.nascentes.forEach(n => { if(Math.hypot(n.x - J.x, n.z - J.z) / U < 7 && !guard["n" + n.id]){ guard["n" + n.id] = 1; salva(); } }); if(S.nascentes.length && S.nascentes.every(n => guard["n" + n.id])) M.conquistas.dar("nascentes", "Guardião das Nascentes", "Encontrou todas as nascentes da serra."); }
  }
  function tickPegadas(dt){ pegs.forEach(r => { if(!r.m.visible) return; r.t += dt; const u = r.t / TF.pegadaSeg; if(u >= 1){ r.m.visible = false; return; } r.m.material = matPeg[Math.min(3, Math.floor(u * 4))]; }); }
  const fatorVel = (x, z, y) => { const p = emTurfeira(x, z); if(!p) return 1; const solo = base.alturaNo(x, z); if(y > solo + 1.0) return 1; const a = alfaEm(x, z); return 1 - (1 - TF.velFator) * Math.min(1, a * 2.2); };
  const delta = (x, z) => { const p = emTurfeira(x, z); if(!p) return 0; const m = amostra(p, x, z); if(!m || m.a <= .01) return 0; const n = vnf(x / 10, z / 10, 21) * .65 + vn(x / 3.6, z / 3.6, 4) * .35; return (n - .38) * TF.almofada * 2 * m.a - .35 * m.r * m.a - TF.afunda * Math.min(1, m.a * 2); };

  /* ---------- ciclo: cor do céu, luz, umidade (neblina e chuva) ---------- */
  function ciclo(E){ const l = Math.max(.15, E.lum !== undefined ? E.lum : 1); U_.uLuz.value = l; U_.uSky.value.setRGB(.42 * l + .12, .58 * l + .1, .8 * l + .08); const n = M.nevoa && M.nevoa.estado ? M.nevoa.estado.n : 0; U_.uWet.value = Math.min(1, n * .4 + .05); U_.uNevoa.value = n; }
  function tick(dt, J, E){
    S.t += dt; U_.uTempo.value = S.t; if(E) ciclo(E); streamTex.offset.y -= dt * .5; if(!J) return; tickJogador(dt, J); tickPegadas(dt); animaNascentes(dt, J);
  }
  /* depuração: polígonos do KML (turfeira, mata, mata baixa) */
  let dbg = null;
  function mostraPolis(on){ if(!on){ if(dbg){ grupo.remove(dbg); dbg = null; } return false; } dbg = new Group(); const cores = { turfeira: 0x30d0d0, mata: 0x30e040, mataBaixa: 0xb0e060 }; base.A.todas.forEach(o => { const a = new Float32Array(o.pts.length * 3); o.pts.forEach((p, i) => { a[i * 3] = p[0]; a[i * 3 + 1] = base.alturaNo(p[0], p[1]) + 4; a[i * 3 + 2] = p[1]; }); const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(a, 3)); const l = new Line(g, new LineBasicMaterial({ color: cores[o.tipo] || 0xffffff, depthTest: false })); l.renderOrder = 30; l.frustumCulled = false; dbg.add(l); }); grupo.add(dbg); return true; }
  /* teleporte de depuração: "turfeira" (meio) e "nascente" */
  const meio = (p) => { let best = null; for(let k = 0; k < 800; k++){ const x = p.bb[0] + Math.random() * (p.bb[1] - p.bb[0]), z = p.bb[2] + Math.random() * (p.bb[3] - p.bb[2]); if(!dentroPoli(p.pts, x, z)) continue; const d = distPoli(p.pts, x, z); if(!best || d > best.d) best = { x, z, d }; } return best; };
  carregaAreas();
  /* ligações com o chão */
  const semEstrada = (f, neutro) => (x, z, y) => (M.estrada && M.estrada.ocupa(x, z, 8)) ? neutro : f(x, z, y);            // em cima do aterro da estrada não há musgo nem pé afundando
  cen.extraChao.cushion = semEstrada(cushion, 0); cen.extraChao.delta = semEstrada(delta, 0); cen.extraChao.fatorVel = semEstrada(fatorVel, 1);
  base.excluir.push((x, z) => pocaEm(x, z) > .55 || S.filetes.some(f => f.dense.length && distLinha(f.dense, x, z) < 4.5));
  const api = { S, tick, regenera: carregaAreas, cushion, delta, fatorVel, dentro: (x, z) => !!emTurfeira(x, z) && alfaEm(x, z) > .05, emTurfeira, distTurfeira, alfaEm, pocaEm, amostra, nascentes: () => S.nascentes, polis: () => S.polis, mostraPolis, meio, guard, salva, provisorio: () => provisorio,
    info: () => "Turfeiras " + S.polis.length + (provisorio ? " (provisórias)" : "") + " · nascentes " + S.nascentes.length + (S.dentro ? " · NA TURFEIRA" : "") };
  return api;
}
