import { Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, RepeatWrapping, DataTexture, RGBAFormat, UnsignedByteType, LinearFilter, LinearMipmapLinearFilter, Vector3, DoubleSide } from "three";
import { texRuido } from "./mundo/ruido.js";
import { qualidade } from "./mundo/config.js";

/* ============================================================================================================
   PAREDÕES NATURAIS DO CÂNION
   Os KML da borda são retas em vários trechos: aqui a linha é suavizada e DEFORMADA com ruído em várias escalas (reentrâncias, pontas avançando sobre o vão, curvas irregulares),
   e a parede deixa de ser um bloco extrudado: vira uma malha gerada uma única vez no carregamento, com
     • escala média: camadas de derrame de basalto de espessuras diferentes, com saliências, recuos, cornijas projetadas (balanços) e plataformas onde cresce vegetação;
     • tálus (rampas de blocos caídos) na base, em partes da extensão;
     • topo arredondado e quebrado;
   O detalhe pequeno (diáclases, colunas, rugosidade) vem de um mapa de normais; manchas de liquens e umidade são calculadas no shader (ver materialRocha).
   O polígono do platô, a colisão do lábio, as zonas da fauna e o vale usam a MESMA linha deformada: nada flutua nem atravessa.
   ============================================================================================================ */

/* ---------- ruído de valor determinístico ---------- */
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const suave = (t) => t * t * (3 - 2 * t);
export function ruido1(x, seed = 0){ const i = Math.floor(x), f = x - i; return (hash(i, seed) + (hash(i + 1, seed) - hash(i, seed)) * suave(f)) * 2 - 1; }
export function ruido2(x, y, seed = 0){ const i = Math.floor(x), j = Math.floor(y), fx = suave(x - i), fy = suave(y - j); const a = hash(i, j, seed), b = hash(i + 1, j, seed), c = hash(i, j + 1, seed), d = hash(i + 1, j + 1, seed); return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1; }
export const fbm1 = (x, seed, oit = 4) => { let a = 1, s = 0, n = 0; for(let o = 0; o < oit; o++){ s += a * ruido1(x * (1 << o), seed + o * 17); n += a; a *= .5; } return s / n; };
export const ridged1 = (x, seed, oit = 3) => { let a = 1, s = 0, n = 0; for(let o = 0; o < oit; o++){ s += a * (1 - Math.abs(ruido1(x * (1 << o), seed + o * 31))); n += a; a *= .5; } return (s / n) * 2 - 1; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- deformação da linha da borda ---------- */
/** suaviza (Chaikin), reamostra a cada `passo` e desloca ao longo da normal com fBm em 3 escalas. `mascara(x, z)` (0–1) protege trechos que outros sistemas esperam retos (ex.: o leito do arroio). */
export function deformaLinha(pts, { seed = 1, passo = 8, A = [26, 11, 3.2], L = [520, 140, 38], ridged = .5, mascara = () => 1, escala = 1, dentro = null, pertoTrilha = () => 0 } = {}){
  let P = pts.map(p => [p[0], p[1]]);
  for(let it = 0; it < 2; it++){ const Q = [P[0]]; for(let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if(l < passo * 3){ Q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } else Q.push(a.slice(), b.slice()); } Q.push(P[P.length - 1]); P = Q.filter((p, i) => i === 0 || Math.hypot(p[0] - Q[i - 1][0], p[1] - Q[i - 1][1]) > .01); }
  const R = []; for(let i = 0; i < P.length - 1; i++){ const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(l / passo)); for(let k = 0; k < n; k++) R.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } R.push(P[P.length - 1]);
  const cum = [0]; for(let i = 1; i < R.length; i++) cum.push(cum[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
  return R.map((p, i) => { const a = R[Math.max(0, i - 2)], b = R[Math.min(R.length - 1, i + 2)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const s = cum[i], m = mascara(p[0], p[1]) * (i < 6 ? i / 6 : 1) * (i > R.length - 7 ? (R.length - 1 - i) / 6 : 1);
    let d = (A[0] * fbm1(s / L[0], seed, 3) + A[1] * fbm1(s / L[1], seed + 5, 3) + A[2] * (ridged1(s / L[2], seed + 9, 2) * ridged + fbm1(s / (L[2] * .4), seed + 13, 2) * (1 - ridged))) * escala * m;
    let nx = tz, nz = -tx; if(dentro && dentro(p[0] + nx * 5, p[1] + nz * 5)){ nx = -nx; nz = -nz; }                    // normal para fora (rumo ao vão)
    const f = pertoTrilha(p[0], p[1]); if(f > 0) d = d * (1 - f) + Math.abs(d) * .8 * f;                              // perto de trilha, a borda só avança para o vão (nunca engole o caminho)
    return [p[0] + nx * d, p[1] + nz * d]; });
}

/* ---------- mapa de normais do detalhe (fraturas verticais, colunas, estratos, rugosidade) ---------- */
export function texNormalRocha(N = 512){
  const h = new Float32Array(N * N), r = (x, y, s) => ruido2(x, y, s);
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){
    const u = x / N, v = y / N; let a = 0;
    a += .55 * r(u * 8, v * 8, 1) + .3 * r(u * 24, v * 24, 2) + .15 * r(u * 64, v * 64, 3);                    // rugosidade
    const col = Math.floor(u * 9 + 3 * r(0, v * 6, 4)), bordaC = Math.abs((u * 9 + 3 * r(0, v * 6, 4)) - col - .5) * 2; a -= Math.pow(bordaC, 14) * .9 * (.5 + .5 * r(col, 0, 5));      // colunas e fraturas verticais
    const est = Math.abs(Math.sin(v * Math.PI * 14 + r(u * 3, 0, 6) * 2)); a -= Math.pow(1 - est, 26) * .45;                               // estratos horizontais
    const bloco = r(Math.floor(u * 14) * 1.7 + v * 6, Math.floor(v * 18), 7); a += bloco * .22;                                           // blocos
    h[y * N + x] = a;
  }
  const d = new Uint8Array(N * N * 4), s = 3.2;
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){ const L = h[y * N + (x + N - 1) % N], Rr = h[y * N + (x + 1) % N], U = h[((y + N - 1) % N) * N + x], Dn = h[((y + 1) % N) * N + x];
    let nx = (L - Rr) * s, ny = (U - Dn) * s, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; const k = (y * N + x) * 4; d[k] = (nx * .5 + .5) * 255; d[k + 1] = (ny * .5 + .5) * 255; d[k + 2] = (nz * .5 + .5) * 255; d[k + 3] = 255; }
  const t = new DataTexture(d, N, N, RGBAFormat, UnsignedByteType); t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
}

/* ---------- material da rocha: albedo + normal + liquens (triplanar) + umidade ---------- */
export function materialRocha(map){
  const U = { uRuido: { value: texRuido() }, uWet: { value: 0 }, uCasc: { value: new Vector3(1e9, 0, 1e9) }, uCascR: { value: 600 }, uLiq: { value: 1 }, uLum: { value: 1 } };
  const m = new MeshStandardMaterial({ map, normalMap: texNormalRocha(), roughness: .94, metalness: 0, vertexColors: true });
  m.normalMap.repeat.set(2.4, 22); m.normalScale.set(.65, .65);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN;").replace("#include <begin_vertex>", "#include <begin_vertex>\n vWP = (modelMatrix * vec4(position, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vWP; varying vec3 vWN; uniform sampler2D uRuido; uniform float uWet; uniform vec3 uCasc; uniform float uCascR; uniform float uLiq;
      vec4 tri(vec3 p, vec3 n, float sc){ vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-4); return texture2D(uRuido, p.zy * sc) * w.x + texture2D(uRuido, p.xz * sc) * w.y + texture2D(uRuido, p.xy * sc) * w.z; }`)
      .replace("#include <map_fragment>", `#include <map_fragment>
      {
        vec3 N = normalize(vWN); vec4 a = tri(vWP, N, 0.0021); vec4 b = tri(vWP + a.rgb * 46.0, N, 0.0074); vec4 c = tri(vWP + b.rgb * 18.0, N, 0.027); vec4 d = tri(vWP, N, 0.085);
        float vert = 1.0 - smoothstep(0.50, 0.97, abs(N.y));
        float casc = 1.0 - smoothstep(uCascR * 0.25, uCascR, distance(vWP, uCasc));
        float umido = clamp(uWet * (0.55 + 0.45 * a.g) + casc * 0.9, 0.0, 1.0);
        float base = a.r * 0.52 + b.g * 0.30 + c.b * 0.2 + d.a * 0.06;
        float lim = 0.60 - 0.07 * umido - 0.05 * vert - 0.11 * casc + 0.06 * (1.0 - uLiq);
        float fresco = smoothstep(0.70, 0.88, b.r);                                      // rocha recém-fraturada: sem líquen
        float mancha = smoothstep(lim, lim + 0.035, base + c.a * 0.10) * (1.0 - fresco * 0.85);
        float pontos = step(0.80, d.r) * smoothstep(lim - 0.13, lim - 0.02, base) * (1.0 - mancha);
        float k = b.a;
        vec3 branco = vec3(0.90, 0.92, 0.88), verde = vec3(0.56, 0.74, 0.36), cinza = vec3(0.64, 0.70, 0.60), amar = vec3(0.72, 0.76, 0.34);
        vec3 liq = mix(mix(branco, verde, smoothstep(0.28, 0.46, k)), mix(cinza, amar, smoothstep(0.74, 0.90, k)), smoothstep(0.55, 0.72, k));
        liq *= mix(1.0, 0.82, umido);
        diffuseColor.rgb = mix(diffuseColor.rgb, liq, clamp(mancha + pontos * 0.8, 0.0, 1.0) * 0.62 * uLiq);
        diffuseColor.rgb *= mix(1.0, 0.70, umido * (1.0 - mancha));                       // rocha molhada: mais escura e saturada
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * diffuseColor.rgb * 1.5, umido * 0.25);
        wetRough = mix(1.0, 0.45, umido);
      }`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor *= wetRough;")
      .replace("void main() {", "float wetRough = 1.0;\nvoid main() {");
  };
  m.customProgramCacheKey = () => "rocha-liquen-v1";
  return { mat: m, U };
}

/* ---------- a parede ---------- */
/** rim: [[x,z]...] já deformada · dentro(x,z): true se o ponto está em terra firme (platô) · Hvale(x,z): altura (relativa a `chao`) do vale no pé da parede · opções: MID (altura da parede), seed, passoDepth, talude
    Devolve { mesh, perfil(s, depth) } */
export function criaParedao(rim, { dentro, Hvale, chao, MID, seed = 3, material, talus = .45, escalaH = 1, mult = 1 } = {}){
  const qual = qualidade(), fator = qual.paredeFator * mult;
  /* camadas (derrames): espessuras diferentes, cada uma com recuo/saliência próprios */
  const B = [0]; const camadas = []; { let d = 0, k = 0; while(d < MID + 400){ const esp = 12 + hash(k, seed) * 70 + (hash(k, seed + 1) > .85 ? 55 : 0), ci = hash(k, seed + 2); const O = ci < .3 ? 6 + hash(k, seed + 3) * 9 : ci < .55 ? -(4 + hash(k, seed + 4) * 8) : (hash(k, seed + 5) - .45) * 8; camadas.push({ O, esp, sag: (hash(k, seed + 6) - .3) * 5, balanco: ci < .12 }); d += esp; B.push(d); k++; } }
  const camada = (yy) => { let lo = 0, hi = B.length - 2; while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(B[mid] <= yy) lo = mid; else hi = mid - 1; } return lo; };
  /* linhas de profundidade (mais densas perto do topo) */
  const D = []; for(let d = 0; d < 250; d += 8 * fator) D.push(d); for(let d = 250; d < 700; d += 22 * fator) D.push(d); for(let d = 700; d < MID; d += 60 * fator) D.push(d); D.push(MID);
  const n = rim.length, cum = [0]; for(let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(rim[i][0] - rim[i - 1][0], rim[i][1] - rim[i - 1][1]));
  /* normais para fora (rumo ao vão) */
  const nor = rim.map((p, i) => { const a = rim[Math.max(0, i - 2)], b = rim[Math.min(n - 1, i + 2)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; let nx = tz, nz = -tx; if(dentro(p[0] + nx * 5, p[1] + nz * 5)){ nx = -nx; nz = -nz; } return [nx, nz]; });
  /* suaviza as normais para as pontas não "rasgarem" a malha */
  for(let it = 0; it < 2; it++) for(let i = 1; i < n - 1; i++){ const a = nor[i - 1], b = nor[i], c = nor[i + 1]; let x = a[0] + b[0] * 2 + c[0], z = a[1] + b[1] * 2 + c[1]; const l = Math.hypot(x, z) || 1; nor[i] = [x / l, z / l]; }
  /* perfil de saliência (+ = para o vão) na posição s (u ao longo) e profundidade d */
  const perfil = (s, d) => {
    const topo = sstep(0, 14, d), dsh = 24 * ruido1(s / 310 + seed, seed) + 9 * ruido1(s / 83, seed + 3), yy = d + dsh, k = camada(yy), c = camadas[k], u = (yy - B[k]) / c.esp;
    const am = .55 + .6 * (ruido1(s / 190 + k * 3.1, seed + 8) * .5 + .5), balanco = c.balanco || ruido1(s / 150 + k * 1.9, seed + 11) > .62;
    let o = (c.O * am + c.sag * Math.sin(u * Math.PI)) * topo;
    if(balanco) o += (9 + 7 * hash(k, seed + 12)) * Math.sin(Math.min(1, u * 1.3) * Math.PI * .5) * topo;                          // cornija projetada
    if(k > 0 && camadas[k - 1].balanco) o -= 8 * (1 - sstep(0, .5, u)) * topo;                                                    // recuo sob a cornija
    o += 2.2 * ridged1(s / 9 + d / 25, seed + 20, 2) * topo + 1.1 * ruido2(s / 3.2, d / 5, seed + 21) * topo;                        // fraturas e blocos
    o += 1.6 * (1 - sstep(0, 5, d)) * (ruido1(s / 14, seed + 22) * .5 + .5);                                                          // topo quebrado
    /* tálus: rampa de blocos na base, só em parte da extensão */
    const base = MID - d, tl = Math.max(0, ruido1(s / 420 + seed * 2, seed + 30) + .15 + talus - .45) * 1.1;
    if(tl > 0) o += tl * 70 * Math.pow(sstep(0, 260, 260 - base) * (base < 260 ? 1 : 0), 1.6) * (.75 + .5 * ruido2(s / 11, d / 9, seed + 31));
    return o * escalaH;
  };
  /* geometria */
  const nr = D.length, pos = new Float32Array(n * nr * 3), uv = new Float32Array(n * nr * 2), col = new Float32Array(n * nr * 3), idx = [];
  for(let i = 0; i < n; i++){ const [px, pz] = rim[i], [nx, nz] = nor[i], s = cum[i];
    for(let j = 0; j < nr; j++){ const d = D[j], o = perfil(s, d), x = px + nx * o, z = pz + nz * o; let y = chao - d;
      if(j === nr - 1) y = chao + Hvale(x, z) + .4;                                                                         // a última linha encosta no vale
      const k = (i * nr + j); pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; uv[k * 2] = s / 140; uv[k * 2 + 1] = d / 2650; col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = 1; } }
  for(let i = 0; i < n - 1; i++) for(let j = 0; j < nr - 1; j++){ const a = i * nr + j, b = (i + 1) * nr + j, c = i * nr + j + 1, e = (i + 1) * nr + j + 1; idx.push(a, c, b, b, c, e); }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2)); g.setAttribute("color", new Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  /* vegetação nas plataformas: faces voltadas para cima ficam esverdeadas; base mais escura e úmida */
  { const nm = g.attributes.normal.array, cl = g.attributes.color.array, vv = nr; for(let i = 0; i < n; i++) for(let j = 0; j < nr; j++){ const k = i * vv + j, ny = nm[k * 3 + 1], d = D[j], s = cum[i];
      const verde = Math.max(0, ny * 2.4 - .35) * (.6 + .4 * (ruido2(s / 7, d / 7, 55) * .5 + .5)); cl[k * 3] = 1 - verde * .3; cl[k * 3 + 1] = 1 - verde * .08; cl[k * 3 + 2] = 1 - verde * .38; } }
  const mesh = new Mesh(g, material || new MeshStandardMaterial({ color: 0x9a968c, roughness: 1, side: DoubleSide })); mesh.material.side = DoubleSide; mesh.frustumCulled = false; mesh.receiveShadow = false;
  return { mesh, perfil, rim, nor, cum };
}
