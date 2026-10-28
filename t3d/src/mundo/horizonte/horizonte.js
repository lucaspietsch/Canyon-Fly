import { Mesh, BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute, ShaderMaterial, Vector3, Vector2, Color } from "three";
import { texRuido } from "../ruido.js";
import { HORIZONTE } from "../config.js";

/* ============================================================================================================
   HORIZONTE DE MONTANHAS ATÉ 90 KM
   Uma malha polar (anéis geométricos: bem densos perto, grossos longe) gerada UMA vez, com semente fixa: terra firme continua como campo de altitude e depois serras; o vão
   continua como vale descendo para as montanhas. Picos cônicos distintos (cones com raio/altura/forma sortados) + cristas (ridged fBm) + relevo suave (fBm).
   Cores pintadas por inclinação/altura no shader (íngreme = rocha com faixas de derrame, suave = mata, alto e plano = campo) e perspectiva atmosférica por distância.
   Distâncias de 90 km cabem no plano de corte por compressão da distância no vertex shader (preserva a direção exata e a ordem de profundidade):
   nada de logarithmicDepthBuffer, e a névoa atmosférica só age nestes objetos (não afeta a névoa do cânion).
   ============================================================================================================ */

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rng(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177 | 0; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
const fbm = (x, y, o = 5) => { let a = .5, s = 0, f = 1; for(let i = 0; i < o; i++){ s += a * vn(x * f, y * f); a *= .5; f *= 2.03; } return s; };
const ridged = (x, y, o = 5) => { let a = .5, s = 0, f = 1; for(let i = 0; i < o; i++){ const n = 1 - Math.abs(2 * vn(x * f, y * f) - 1); s += a * n * n; a *= .5; f *= 2.1; } return s; };

const VERT = `
uniform vec3 uCam; varying vec3 vP; varying float vD; varying vec3 vN; attribute vec3 normal2;
void main(){
  vec3 d = position - uCam; float D = length(d);
  float Dc = D < 6000.0 ? D : 6000.0 + 2400.0 * (1.0 - exp(-(D - 6000.0) / 90000.0));      // compressão da distância (mesma direção, mesma ordem de profundidade)
  vec3 Pc = uCam + d / max(D, 1e-3) * Dc;
  vP = position; vD = D; vN = normal2;
  gl_Position = projectionMatrix * viewMatrix * vec4(Pc, 1.0);
}`;
const FRAG = `
varying vec3 vP; varying float vD; varying vec3 vN;
uniform sampler2D uN; uniform vec3 uAmb, uSun, uSunDir, uMoon, uMoonDir, uHaze, uMist, uCam, uCRocha, uCMata, uCCampo; uniform float uFade0, uTopo, uMistK, uAtmos, uNoite, uTime, uChao, uHazeD, uLum; uniform vec2 uWind;
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main(){
  float fade = smoothstep(uFade0, uFade0 + 3200.0, vD);
  if(fade < h13(vec3(gl_FragCoord.xy, 1.0))) discard;                                 // entrada suave (dithering) sobre o cenário real
  vec3 N = normalize(vN); float slope = 1.0 - N.y, rel = vP.y - uChao;
  float n1 = texture2D(uN, vP.xz * .00012).r, n2 = texture2D(uN, vP.xz * .0007).g, n3 = texture2D(uN, vP.xz * .003).b;
  vec3 rocha = uCRocha * mix(.82, 1.12, n2) * (.88 + .22 * sin(rel * .012 + n1 * 6.0));       // faixas horizontais de derrames de basalto
  vec3 mata = uCMata * mix(.8, 1.2, n2) * mix(.62, 1.0, smoothstep(-2300.0, -500.0, rel));      // vales mais escuros
  vec3 campo = uCCampo * mix(.85, 1.1, n1);
  float rochoso = smoothstep(.26, .5, slope + .16 * (n1 - .5));
  float alto = smoothstep(-350.0, 0.0, rel) * (1.0 - smoothstep(380.0, 800.0, rel)) * smoothstep(.3, .05, slope);
  vec3 base = mix(mata, rocha, rochoso); base = mix(base, campo, alto * .8); base *= .9 + .22 * n3; base = mix(base, rocha * 1.05, smoothstep(1500.0, 2600.0, rel) * .7);   // cristas altas: rocha exposta
  float diff = max(dot(N, uSunDir), 0.0), diffL = max(dot(N, uMoonDir), 0.0);
  vec3 col = base * (uAmb + uSun * diff + uMoon * diffL);
  float cs = texture2D(uN, vP.xz * .00003 + uWind * uTime * 9.0).r;                      // sombras de nuvens que passam devagar
  col *= 1.0 - .3 * smoothstep(.5, .7, cs) * (1.0 - uNoite);
  float mm = smoothstep(uTopo + 150.0, uTopo - 420.0, vP.y) * uMistK;                    // neblina enchendo os vales (picos furando)
  col = mix(col, uMist, mm * .93);
  float f = 1.0 - exp(-pow(vD / uHazeD, 1.12));                                           // perspectiva atmosférica
  col = mix(col, uHaze, clamp(f * uAtmos, 0.0, 1.0) * .97);
  vec2 cel = floor(vP.xz / 1500.0); float cid = h13(vec3(cel, 3.0));
  if(vD > 52000.0 && rel < -1300.0 && cid > .985) col += vec3(1.0, .62, .25) * uNoite * .55 * smoothstep(.3, .0, length(fract(vP.xz / 1500.0) - .5) - .1);   // luzes de cidades muito distantes
  gl_FragColor = vec4(col, 1.0);
}`;

export function criarHorizonte(M, luzes){
  const { cen, ciclo } = M, C = HORIZONTE, chao = cen.campo.chao, centro = [1200, 0];
  const { terraPoli, BORDA_PTS, norte, norteRim, emPoli } = cen.campo;
  const decima = (L, k) => L.filter((p, i) => i % k === 0 || i === L.length - 1);                // a borda deformada é densa: a paisagem distante usa uma versão rala
  const RIMS = [decima(BORDA_PTS, Math.max(1, Math.round(BORDA_PTS.length / 140))), decima(norteRim, Math.max(1, Math.round(norteRim.length / 140)))];
  const dRim = (x, z) => { let d = 1e9; for(let q = 0; q < RIMS.length; q++){ const L = RIMS[q]; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const e = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if(e < d) d = e; } } return d; };
  /* a paisagem distante usa versões ralas dos polígonos (a borda deformada é densa e o teste de pertinência rodaria ~100 mil vezes) */
  const rala = (P, n) => { const k = Math.max(1, Math.round(P.length / n)); return P.filter((p, i) => i % k === 0 || i === P.length - 1); }, terraR = rala(terraPoli, 160), norteR = rala(norte, 160);
  const terra = (x, z) => emPoli(terraR, x, z) || emPoli(norteR, x, z);

  /* picos cônicos (sorteio fixo) */
  const R = rng(C.seed), picos = [];
  for(let i = 0; i < C.picos; i++){ const a = R() * 6.283, dist = 9000 + Math.pow(R(), 1.7) * (C.distMaxKm * 2940 - 12000), h = C.alturaPicos[0] + R() * (C.alturaPicos[1] - C.alturaPicos[0]) * (.55 + .45 * Math.min(1, dist / 80000)), r = C.raioPicos[0] + R() * (C.raioPicos[1] - C.raioPicos[0]), ex = 1.05 + R() * .9, el = .7 + R() * .6, ro = R() * 3;
    picos.push({ x: centro[0] + Math.cos(a) * dist, z: centro[1] + Math.sin(a) * dist, h, r, ex, el, c: Math.cos(ro), s: Math.sin(ro) }); }
  const cones = (x, z) => { let m = 0; for(let i = 0; i < picos.length; i++){ const p = picos[i], dx = x - p.x, dz = z - p.z, u = (dx * p.c + dz * p.s) / (p.r * p.el), v = (-dx * p.s + dz * p.c) / p.r, d = Math.sqrt(u * u + v * v); if(d < 1){ const hh = p.h * Math.pow(1 - d, p.ex); if(hh > m) m = hh; } } return m; };

  /* altura em (x, z) */
  let dEstrada = () => 1e9, hEstrada = 0;                                                                           // distância à estrada/cidade (preenchida por recalcula): o chão perto dela é plano e baixo, abaixo do corredor
  const altura = (x, z, dr) => {
    const dE = dEstrada(x, z), fE = 1 - sstep(900, 3200, dE); if(fE > 0){ const o = alturaBase(x, z, dr); return o * (1 - fE) + (chao - 26 + hEstrada + (fbm(x / 1200, z / 1200, 3) - .5) * 14) * fE; } return alturaBase(x, z, dr);
  };
  const alturaBase = (x, z, dr) => {
    const prof = 1323 + 1327 * sstep(0, 1400, dr), sobe = sstep(2500, 15000, dr);
    let base = (chao - prof) * (1 - sobe) + (chao + 250) * sobe;
    const amp = sstep(2200, 9000, dr), ruido = fbm(x / 6000 + 11, z / 6000 + 3, 5), cr = ridged(x / 9500 + 5, z / 9500 + 9, 5);
    const serras = amp * (cones(x, z) + cr * 2600 + (ruido - .5) * 1400);
    const escarpa = (fbm(x / 400, z / 400, 3) - .5) * 220 * sstep(0, 900, dr) * (1 - sobe);                      // bordas irregulares (quebra a linha reta dos paredões)
    return base + serras + escarpa + (fbm(x / 700, z / 700, 4) - .5) * 60;
  };

  /* malha polar */
  const K = C.aneis, S = C.setores, r0 = C.distMinU, r1 = C.distMaxKm * 2940, ratio = Math.pow(r1 / r0, 1 / (K - 1));
  const pos = new Float32Array((K * S) * 3), nor = new Float32Array((K * S) * 3), land = new Uint8Array(K * S);
  for(let k = 0; k < K; k++){ const r = r0 * Math.pow(ratio, k); for(let j = 0; j < S; j++){ const a = j / S * Math.PI * 2, x = centro[0] + Math.cos(a) * r, z = centro[1] + Math.sin(a) * r, i = k * S + j, dr = dRim(x, z), L = terra(x, z);
      land[i] = L ? 1 : 0; pos[i * 3] = x; pos[i * 3 + 2] = z; pos[i * 3 + 1] = L ? chao - 3 : altura(x, z, dr); } }
  const H = (k, j) => pos[((k + K) % K * S + (j + S) % S) * 3 + 1];
  for(let k = 0; k < K; k++) for(let j = 0; j < S; j++){ const i = k * S + j, r = r0 * Math.pow(ratio, k), dr_ = r * (ratio - 1), da = r * 2 * Math.PI / S; const kk = Math.min(K - 1, k + 1), k0 = Math.max(0, k - 1);
    const hx = (H(kk, j) - H(k0, j)) / (dr_ * (kk - k0 + 0.0001)), hz = (H(k, j + 1) - H(k, j - 1)) / (2 * da); const a = j / S * Math.PI * 2; const dx = Math.cos(a), dz = Math.sin(a), tx = -Math.sin(a), tz = Math.cos(a);
    const gx = hx * dx + hz * tx, gz = hx * dz + hz * tz; const l = Math.hypot(gx, 1, gz); nor[i * 3] = -gx / l; nor[i * 3 + 1] = 1 / l; nor[i * 3 + 2] = -gz / l; }
  const idx = []; for(let k = 0; k < K - 1; k++) for(let j = 0; j < S; j++){ const a = k * S + j, b = k * S + (j + 1) % S, c = (k + 1) * S + j, d = (k + 1) * S + (j + 1) % S; if(land[a] && land[b] && land[c] && land[d]) continue; idx.push(a, c, b, b, c, d); }
  const geo = new BufferGeometry(); geo.setAttribute("position", new Float32BufferAttribute(pos, 3)); geo.setAttribute("normal2", new Float32BufferAttribute(nor, 3)); geo.setIndex(new Uint32BufferAttribute(new Uint32Array(idx), 1));
  const U = { uCam: { value: new Vector3() }, uN: { value: texRuido() }, uAmb: { value: new Vector3(.4, .4, .4) }, uSun: { value: new Vector3() }, uSunDir: { value: new Vector3(0, 1, 0) }, uMoon: { value: new Vector3() }, uMoonDir: { value: new Vector3(0, 1, 0) }, uHaze: { value: new Vector3(.7, .8, .9) }, uMist: { value: new Vector3(.95, .95, .95) },
    uCRocha: { value: new Vector3(...C.cores.rocha) }, uCMata: { value: new Vector3(...C.cores.mata) }, uCCampo: { value: new Vector3(...C.cores.campo) }, uFade0: { value: C.entradaU }, uTopo: { value: -1e5 }, uMistK: { value: 0 }, uAtmos: { value: 1 }, uNoite: { value: 0 }, uTime: { value: 0 }, uChao: { value: chao }, uHazeD: { value: C.hazeKm * 2940 }, uLum: { value: 1 }, uWind: { value: new Vector2(.004, .002) } };
  const mt = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, fog: false });
  const malha = new Mesh(geo, mt); malha.frustumCulled = false; malha.renderOrder = -50; cen.grupo.add(malha);
  cen.ceu.renderOrder = -300; cen.ceu.traverse(o => { o.renderOrder = -300; });                 // o céu desenha antes das montanhas
  M.cam.near = .5; M.cam.far = 12000; M.cam.updateProjectionMatrix();

  const cor = new Color(), v3 = new Vector3();
  function tick(dt, J, E){
    malha.visible = C.ativo; if(!C.ativo) return;
    M.cam.getWorldPosition(U.uCam.value); U.uTime.value += dt;
    const lum = Math.max(.12, E.lum), noite = E.noite;
    U.uNoite.value = noite;
    /* luz simples (normal + sol/lua) a partir das luzes do cenário */
    const h = luzes.hemi, a = luzes.amb, s = luzes.sol, s2 = luzes.sol2;
    U.uAmb.value.set(h.color.r * h.intensity + a.color.r * a.intensity, h.color.g * h.intensity + a.color.g * a.intensity, h.color.b * h.intensity + a.color.b * a.intensity).multiplyScalar(.5);
    U.uSun.value.set(s.color.r, s.color.g, s.color.b).multiplyScalar(s.intensity * .42); U.uSunDir.value.copy(E.sunDir);
    U.uMoon.value.set(s2.color.r, s2.color.g, s2.color.b).multiplyScalar(noite * s2.intensity * .5); U.uMoonDir.value.copy(E.moonDir);
    /* cor da neblina atmosférica: acompanha a hora (azulada de dia, dourada/rosada no amanhecer/entardecer, quase preta à noite) */
    const hz = E.hor; cor.setRGB(hz[0], hz[1], hz[2]); U.uHaze.value.set(hz[0] * (.55 + .45 * lum), hz[1] * (.55 + .45 * lum), Math.min(1, hz[2] * (.65 + .4 * lum)));
    const nv = E.nevoa; U.uMist.value.set(nv[0] * lum, nv[1] * lum, nv[2] * lum);
    const n = M.nevoa.estado.n; U.uTopo.value = M.nevoa.estado.topo + 20; U.uMistK.value = Math.min(1, n * 1.4);
    U.uWind.value.set(E.vento[0] * .6, E.vento[1] * .6); void v3;
  }
  /* recalcula as alturas perto da estrada e da cidade (chamada quando a rota muda): só mexe nos vértices que estão a menos de 3,2 mil u delas */
  function recalcula(){
    const E = M.estrada, P = E ? E.pts.map((p, i) => [p[0], p[1], E.S.hcEf ? E.S.hcEf[i] : 0]).filter((p, i) => i % 5 === 0 || i === E.pts.length - 1) : [], extra = (M.cidade && M.cidade.pontosHorizonte) ? M.cidade.pontosHorizonte() : [];
    const L = [...P, ...extra]; if(!L.length){ dEstrada = () => 1e9; return; }
    const cel = 600, g = new Map(); L.forEach(p => { const k = Math.floor(p[0] / cel) * 100003 + Math.floor(p[1] / cel); (g.get(k) || g.set(k, []).get(k)).push(p); });
    dEstrada = (x, z) => { let d = 1e9, h = 0; const cx = Math.floor(x / cel), cz = Math.floor(z / cel); for(let i = -6; i <= 6; i++) for(let j = -6; j <= 6; j++){ const l = g.get((cx + i) * 100003 + cz + j); if(!l) continue; for(const p of l){ const q = Math.hypot(p[0] - x, p[1] - z); if(q < d){ d = q; h = p[2] || 0; } } } hEstrada = h; return d; };
    for(let k = 0; k < K; k++){ const r = r0 * Math.pow(ratio, k); for(let j = 0; j < S; j++){ const i = k * S + j; if(land[i]) continue; const a = j / S * Math.PI * 2, x = centro[0] + Math.cos(a) * r, z = centro[1] + Math.sin(a) * r;
      if(Math.hypot(x - L[0][0], z - L[0][1]) > 1e9) continue; const d = dEstrada(x, z), antes = pos[i * 3 + 1]; if(d < 3200 || antes < chao - 20) pos[i * 3 + 1] = altura(x, z, dRim(x, z)); } }
    for(let k = 0; k < K; k++) for(let j = 0; j < S; j++){ const i = k * S + j, r = r0 * Math.pow(ratio, k), dr_ = r * (ratio - 1), da = r * 2 * Math.PI / S; const kk = Math.min(K - 1, k + 1), k0 = Math.max(0, k - 1);
      const hx = (H(kk, j) - H(k0, j)) / (dr_ * (kk - k0 + 0.0001)), hz = (H(k, j + 1) - H(k, j - 1)) / (2 * da); const a = j / S * Math.PI * 2; const dx = Math.cos(a), dz = Math.sin(a), tx = -Math.sin(a), tz = Math.cos(a);
      const gx = hx * dx + hz * tx, gz = hx * dz + hz * tz; const l = Math.hypot(gx, 1, gz); nor[i * 3] = -gx / l; nor[i * 3 + 1] = 1 / l; nor[i * 3 + 2] = -gz / l; }
    geo.attributes.position.array.set(pos); geo.attributes.normal2.array.set(nor); geo.attributes.position.needsUpdate = true; geo.attributes.normal2.needsUpdate = true;
  }
  return { tick, malha, recalcula, uniforms: U, alternaAtmos(){ U.uAtmos.value = U.uAtmos.value > .5 ? 0 : 1; return U.uAtmos.value > .5; }, info: () => "Horizonte: " + (idx.length / 3 / 1000).toFixed(0) + "k triângulos" };
}
