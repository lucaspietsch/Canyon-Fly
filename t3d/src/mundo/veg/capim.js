import { BufferGeometry, Float32BufferAttribute, InstancedBufferAttribute, MeshStandardMaterial, InstancedMesh, DynamicDrawUsage, Vector4, DoubleSide, Color, Matrix4, Quaternion, Vector3 } from "three";
import { U, qualidade } from "../config.js";
import { GLSL_VENTO } from "../vento.js";

/* ============================================================================================================
   CAPIM ALTO (até a canela, 30–45 cm) em TODO ponto que não é trilha, estacionamento, obra ou leito de rio: campos, bordas, encostas e (mais ralo) dentro da mata.
   • Instancing em blocos (chunks de 24 m): só existe capim ao redor do jogador (raio por qualidade: 70/110/150 m), com densidade decrescente por anel (4 → 1,1 → 0,3 tufos/m²);
     além do raio, a textura do terreno simula o capim. Blocos distantes ou fora do alcance não geram nada; o desenho é UM InstancedMesh (≈ 7 triângulos por tufo).
   • Borda da trilha: capim baixo e pisoteado perto, alto mais longe. Turfeira/banhado: mais verde e mais alto. Mata: ralo.
   • Vento: ondas que percorrem o campo na direção do vento (ruído deslocado no tempo, no vertex shader); dentro da mata o balanço é bem menor.
   • Pisoteio: o capim se abaixa e se afasta onde o jogador, NPCs e animais passam (até 16 "empurradores" enviados como uniform).
   ============================================================================================================ */

const CH = 24 * U;                                         // lado do bloco (u)
const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function geoTufo(){
  const pos = [], col = [], N = 7;
  for(let k = 0; k < N; k++){
    const a = k / N * Math.PI * 2 + (k % 2) * .4, r = .16 + (k % 3) * .06, bx = Math.cos(a) * r, bz = Math.sin(a) * r, h = .72 + (k % 3) * .14, lean = .2 + (k % 2) * .12, w = .095;
    const tx = bx + Math.cos(a) * lean, tz = bz + Math.sin(a) * lean, px = -Math.sin(a) * w, pz = Math.cos(a) * w;
    pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, tx, h, tz); col.push(.55, .55, .5, .55, .55, .5, 1, 1, .95);
  }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("color", new Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}

export function criarCapim(M, base, vento){
  const Q = qualidade(), { cen } = M, Z = M.fauna.zonas;
  const CAP = Q.nome === "baixa" ? 26000 : Q.nome === "alta" ? 120000 : 60000, RAIO = Q.capimRaio * U, DENS = Q.capimDens;
  const geo = geoTufo();
  const U_push = { value: Array.from({ length: 16 }, () => new Vector4(0, 0, 0, 0)) };
  const mat = new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uVento = vento.U.uVento; sh.uniforms.uVentoMata = vento.U.uVentoMata; sh.uniforms.uPush = U_push;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL_VENTO + "\nuniform vec4 uPush[16]; attribute float aMata;").replace("#include <begin_vertex>", `#include <begin_vertex>
      {
        mat3 m3 = mat3(instanceMatrix); float sw = length(m3[0]), sh2 = length(m3[1]);
        vec3 wb = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float hh = clamp(position.y, 0.0, 1.0), hf = hh * hh;
        float vm = mix(1.0, uVentoMata, aMata);
        vec2 dir = normalize(uVento.xy + 1e-4);
        vec2 wo = dir * ondaVento(wb.xz, 1.0) * hf * sh2 * 0.85 * vm;
        float achata = 1.0;
        for(int i = 0; i < 16; i++){ vec4 P = uPush[i]; if(P.w <= 0.0) continue; vec2 d = wb.xz - P.xy; float r = length(d); float k = (1.0 - smoothstep(P.z * 0.35, P.z, r)) * P.w; wo += normalize(d + vec2(1e-3)) * k * 0.7 * hf * sh2; achata *= 1.0 - 0.6 * k * hh; }
        transformed.y *= achata;
        vec3 l = transpose(m3) * vec3(wo.x, 0.0, wo.y); l.x /= (sw * sw); l.z /= (sw * sw); transformed.xz += l.xz;
      }`);
  };
  mat.customProgramCacheKey = () => "capim-v1";
  const aMata = new InstancedBufferAttribute(new Float32Array(CAP), 1); aMata.setUsage(DynamicDrawUsage); geo.setAttribute("aMata", aMata);
  const mesh = new InstancedMesh(geo, mat, CAP); mesh.instanceMatrix.setUsage(DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.setColorAt(0, new Color(1, 1, 1)); mesh.instanceColor.setUsage(DynamicDrawUsage); mesh.renderOrder = 4; cen.grupo.add(mesh);
  const POOL = { arrM: mesh.instanceMatrix.array, arrC: mesh.instanceColor.array };
  /* cores: palha e verde de campo de altitude; banhado mais verde; mata mais escura */
  const PAL = { campo: [[.50, .55, .20], [.66, .60, .28], [.42, .50, .18], [.72, .66, .36], [.55, .58, .24], [.35, .45, .16]], turfeira: [[.28, .52, .20], [.34, .58, .24], [.40, .56, .22], [.24, .46, .18]], mata: [[.22, .40, .16], [.30, .46, .18], [.26, .36, .14]] };
  /* altura (u) do chão por grade bilinear de 9×9 nós por bloco */
  function gradeAltura(x0, z0){ const n = 9, g = new Float32Array(n * n), st = CH / (n - 1); for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) g[j * n + i] = base.alturaNo(x0 + i * st, z0 + j * st); return (x, z) => { const fx = (x - x0) / st, fz = (z - z0) / st, i = Math.min(n - 2, Math.max(0, Math.floor(fx))), j = Math.min(n - 2, Math.max(0, Math.floor(fz))), tx = fx - i, tz = fz - j; const a = g[j * n + i], b = g[j * n + i + 1], c = g[(j + 1) * n + i], d = g[(j + 1) * n + i + 1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; }; }
  const cache = new Map();                                                   // "cx,cz,tier" → { m: Float32Array, c: Float32Array, n }
  const M4 = new Matrix4(), Qn = new Quaternion(), V3 = new Vector3(), Sc = new Vector3(), Yv = new Vector3(0, 1, 0);
  const NIV = [1, .5, .2, .07];                                                        // frações de densidade geradas por bloco (do mais perto ao mais longe)
  const fDist = (dm) => { const R = RAIO / U; return (dm < 25 ? 1 : Math.pow(.3, (dm - 25) / 40)) * (1 - smooth(R * .88, R, dm)); };   // fração de tufos que sobrevive a `dm` metros do jogador
  function gera(cx, cz, tier){
    const x0 = cx * CH, z0 = cz * CH, alt = gradeAltura(x0, z0), area = 24 * 24, nTot = Math.min(2600, Math.round(area * 4 * DENS)), nMax = Math.ceil(nTot * NIV[tier]); const out = { m: new Float32Array(nMax * 16), c: new Float32Array(nMax * 3), a: new Float32Array(nMax), rk: new Float32Array(nMax), xz: new Float32Array(nMax * 2), n: 0 };
    const pertoAgua = Z.ZONAS.agua.distAgua(x0 + CH / 2, z0 + CH / 2) < 220;
    for(let k = 0; k < nMax; k++){
      const x = x0 + hash(cx, cz, k * 2 + 1) * CH, z = z0 + hash(cx, cz, k * 2 + 2) * CH; const tp = base.tipoEm(x, z);
      if(tp === "turfeira" && hash(cx, cz, k + 77777) > .42) continue; if(tp === "mata" && hash(cx, cz, k + 77777) > .32) continue; if(tp === "mataBaixa" && hash(cx, cz, k + 77777) > .55) continue;
      if(!base.livreBase(x, z, 2)) continue;
      const dT = base.distTrilha(x, z); if(dT < 3.8) continue;
      if(pertoAgua && base.naAgua(x, z)) continue; if(base.excluir.some(f => f(x, z))) continue;
      const r1 = hash(cx, cz, k + 31), r2 = hash(cx, cz, k + 53), r3 = hash(cx, cz, k + 91);
      let altura = (tp === "turfeira" ? .52 : .38 + r1 * .1) * (r2 > .93 ? 1.55 : 1) * (.8 + .4 * r3);       // m (a canela: 30–45 cm; touceiras maiores e raras)
      altura *= .38 + .62 * smooth(3.8, 20, dT);                                                                  // pisoteado perto da trilha
      const y = alt(x, z), P = PAL[tp === "mataBaixa" ? "mata" : tp] || PAL.campo, c = P[Math.floor(hash(cx, cz, k + 11) * P.length)];
      const sh = altura * U * 1.1, sw = U * (1.0 + r3 * .6) * (r2 > .93 ? 1.4 : 1);
      Qn.setFromAxisAngle(Yv, hash(cx, cz, k + 5) * 6.283); V3.set(x, y, z); Sc.set(sw, sh, sw); M4.compose(V3, Qn, Sc); M4.toArray(out.m, out.n * 16);
      const bm = tp === "mata" || tp === "mataBaixa" ? 3 : 1;                                                    // r > 2 marca "dentro da mata" para o vento fraco
      const v = .85 + .3 * hash(cx, cz, k + 3); out.rk[out.n] = k / nTot; out.xz[out.n * 2] = x; out.xz[out.n * 2 + 1] = z; out.a[out.n] = bm > 2 ? 1 : 0; out.c[out.n * 3] = c[0] * v; out.c[out.n * 3 + 1] = c[1] * v; out.c[out.n * 3 + 2] = c[2] * v; out.n++;
    }
    return out;
  }
  let fila = [], ultC = [1e9, 1e9], atual = null, dirty = true, geradosFrame = 0;
  const chaveT = (cx, cz, t) => cx + "," + cz + "," + t;
  function planeja(J){
    const pcx = J.x / CH, pcz = J.z / CH, R = Math.ceil(RAIO / CH) + 1, lista = [];
    for(let cz = Math.floor(pcz) - R; cz <= Math.floor(pcz) + R; cz++) for(let cx = Math.floor(pcx) - R; cx <= Math.floor(pcx) + R; cx++){
      const d = Math.hypot((cx + .5) * CH - J.x, (cz + .5) * CH - J.z); if(d > RAIO + CH * .5) continue;
      const dmin = Math.max(0, d - CH * .72) / U, f = fDist(dmin), tier = f > .75 ? 0 : f > .35 ? 1 : f > .12 ? 2 : 3; lista.push({ cx, cz, tier, d });
    }
    lista.sort((a, b) => a.d - b.d); atual = lista; dirty = true;
  }
  function monta(){
    let n = 0; const P0 = ultC; const aM = POOL.arrM, aC = POOL.arrC;
    for(const c of atual){ let d = null; for(let t = c.tier; t >= 0 && !d; t--) d = cache.get(chaveT(c.cx, c.cz, t)); if(!d) for(let t = c.tier + 1; t < 4 && !d; t++) d = cache.get(chaveT(c.cx, c.cz, t)); if(!d) continue;
      for(let i = 0; i < d.n; i++){ if(n >= CAP) break; const dx = d.xz[i * 2] - P0[0], dz = d.xz[i * 2 + 1] - P0[1]; if(d.rk[i] >= fDist(Math.sqrt(dx * dx + dz * dz) / U)) continue; aM.set(d.m.subarray(i * 16, i * 16 + 16), n * 16); aC[n * 3] = d.c[i * 3]; aC[n * 3 + 1] = d.c[i * 3 + 1]; aC[n * 3 + 2] = d.c[i * 3 + 2]; aMata.array[n] = d.a[i]; n++; } }
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; aMata.needsUpdate = true; dirty = false;
  }
  function tick(dt, J){
    if(!J) return;
    if(Math.hypot(J.x - ultC[0], J.z - ultC[1]) > CH * .35){ ultC = [J.x, J.z]; planeja(J); fila = atual.filter(c => !cache.has(chaveT(c.cx, c.cz, c.tier))); }
    else if(!atual) planeja(J);
    let n = 0; while(fila.length && n < 3){ const c = fila.shift(); if(!cache.has(chaveT(c.cx, c.cz, c.tier))){ cache.set(chaveT(c.cx, c.cz, c.tier), gera(c.cx, c.cz, c.tier)); n++; dirty = true; } }
    if(dirty) monta();
    if(cache.size > 700){ const it = cache.keys(); for(let i = 0; i < 200; i++) cache.delete(it.next().value); }
    /* pisoteio: jogador, NPCs e animais perto */
    const P = U_push.value; let k = 0; P[k++].set(J.x, J.z, 2.4 * U, 1);
    if(M.gente){ const L = []; M.gente.pessoasPerto(J.x, J.z, 14 * U, L); L.sort((a, b) => Math.hypot(a.x - J.x, a.z - J.z) - Math.hypot(b.x - J.x, b.z - J.z)); for(let i = 0; i < L.length && k < 11; i++) P[k++].set(L[i].x, L[i].z, 1.9 * U, .8); }
    if(M.fauna) M.fauna.animais.forEach(a => { if(k < 15 && a.visivel && !a.fim && Math.hypot(a.x - J.x, a.z - J.z) < 90 * U) P[k++].set(a.x, a.z, (a.id === "capivara" ? 1.5 : 2) * U, .9); });
    if(M.resgate && Math.abs(M.resgate.quad.v) > .3 && k < 16) P[k++].set(M.resgate.quad.x, M.resgate.quad.z, 3 * U, 1);
    for(; k < 16; k++) P[k].set(0, 0, 0, 0);
  }
  const limpa = () => { cache.clear(); atual = null; ultC = [1e9, 1e9]; mesh.count = 0; };
  return { tick, limpa, mesh, info: () => "Capim: " + mesh.count + " tufos (" + Q.nome + ")", regenera: limpa };
}
