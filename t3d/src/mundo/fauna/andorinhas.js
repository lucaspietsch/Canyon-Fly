import { InstancedMesh, BufferGeometry, Float32BufferAttribute, InstancedBufferAttribute, MeshStandardMaterial, DoubleSide, DynamicDrawUsage } from "three";
import { U, ANDORINHAS as C, qualidade } from "../config.js";
import { PORT, Y_COMUM } from "../../portico.js";

/* ============================================================================================================
   ANDORINHAS: revoada de ~300 boids no vão do cânion.
   • Regras: separação, alinhamento e coesão (vizinhos numa grade espacial) + rumo ao ponto do subgrupo + faixa de distância dos cabos (50–200 m: empurra para fora abaixo de 50 m,
     puxa para dentro acima de 200 m) + desvio do relevo/paredões (campo de distância à borda) + desvio do monomotor.
   • Ondas de virada atravessam o bando (a frente da onda empurra para o lado quem passa); subgrupos se separam e se juntam.
   • Um InstancedMesh só: corpo fusiforme, cauda bifurcada, asas em foice que batem no shader (fase e frequência por ave, planando de vez em quando); dorso preto-azulado, ventre claro.
   • Aparece em horários do agendador (EVENTOS.andorinhas) e some voando para longe.
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => Math.max(a, Math.min(b, v));
const sst = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function geometria(){
  const pos = [], cor = [], idx = []; const dorso = [.05, .08, .17], ventre = [.88, .86, .8], garg = [.62, .3, .2];
  const v = (x, y, z, c) => { pos.push(x, y, z); cor.push(...c); return pos.length / 3 - 1; };
  const tri = (a, b, c) => idx.push(a, b, c);
  /* corpo: fuso de 6 lados do bico (z+) à cauda (z−) */
  const sec = [[.5, 0], [.3, .07], [.1, .12], [-.1, .115], [-.3, .07], [-.46, .02]], n = 6, anel = [];
  sec.forEach(([z, r]) => { const a = []; for(let k = 0; k < n; k++){ const t = k / n * Math.PI * 2, y = Math.sin(t) * r, x = Math.cos(t) * r; a.push(v(x, y * .8, z, y < -.01 ? (z > .1 ? garg : ventre) : dorso)); } anel.push(a); });
  for(let i = 0; i < sec.length - 1; i++) for(let k = 0; k < n; k++){ const a = anel[i][k], b = anel[i][(k + 1) % n], c = anel[i + 1][k], d = anel[i + 1][(k + 1) % n]; tri(a, c, b); tri(b, c, d); }
  /* cauda bifurcada */
  const t0 = v(0, 0, -.42, dorso), tl = v(-.14, 0, -.78, dorso), tr = v(.14, 0, -.78, dorso), tn = v(0, 0, -.6, dorso); tri(t0, tl, tn); tri(t0, tn, tr);
  /* asas em foice (cada uma com 3 triângulos: raiz larga, curva para trás, ponta fina) */
  for(const s of [-1, 1]){ const r0 = v(s * .06, .02, .2, dorso), r1 = v(s * .06, .02, -.12, ventre), m0 = v(s * .38, .06, .14, dorso), m1 = v(s * .38, .06, -.14, ventre), p0 = v(s * .78, .1, -.2, dorso), p1 = v(s * .66, .08, -.04, dorso);
    tri(r0, m0, r1); tri(r1, m0, m1); tri(m0, p1, m1); tri(m1, p1, p0); tri(r0, r1, m0); tri(m1, p0, p1); }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setAttribute("color", new Float32BufferAttribute(cor, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function criarAndorinhas(M){
  const { cen } = M, Q = qualidade(), N = Math.round(C.quantidade * Math.min(1, Q.aves));
  const S = { t: 0, presenca: 0, alvo: 0, fim: 0, grupoT: 0, junto: false, ondaT: rnd(...C.ondaCada), onda: null, ultSom: 0 };
  /* eixo dos cabos (u): do pórtico ao lançamento, na altura dos cabos */
  const A = [PORT.x, Y_COMUM, (PORT.z7 + PORT.zs[0]) / 2], B = [PORT.lanca, 1, (PORT.z7 + PORT.zs[0]) / 2], AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L2 = AB[0] * AB[0] + AB[1] * AB[1] + AB[2] * AB[2];
  const dMin = C.cabosMin * U, dMax = C.cabosMax * U, dMed = (dMin + dMax) / 2;
  function distCabos(x, y, z, out){ let t = ((x - A[0]) * AB[0] + (y - A[1]) * AB[1] + (z - A[2]) * AB[2]) / L2; t = cl(t, .02, .98); const px = A[0] + AB[0] * t, py = A[1] + AB[1] * t, pz = A[2] + AB[2] * t, dx = x - px, dy = y - py, dz = z - pz, d = Math.hypot(dx, dy, dz) || 1; if(out){ out[0] = dx / d; out[1] = dy / d; out[2] = dz / d; out[3] = px; out[4] = py; out[5] = pz; } return d; }

  /* ---------- campo de distância à borda (paredões): grade lazy, > 0 fora da terra (vão), < 0 dentro ---------- */
  const { terraPoli, BORDA_PTS, norte, norteRim, emPoli } = cen.campo, CEL = 36, cache = new Map();
  const rim = [BORDA_PTS.filter((p, i) => i % 2 === 0), norteRim ? norteRim.filter((p, i) => i % 2 === 0) : []];
  const sdf = (x, z) => {
    const i = Math.floor(x / CEL), j = Math.floor(z / CEL), k = i * 100003 + j; let v = cache.get(k); if(v !== undefined) return v;
    const cx = (i + .5) * CEL, cz = (j + .5) * CEL; let d = 1e9; for(const L of rim) for(let q = 0; q < L.length - 1; q++){ const a = L[q], b = L[q + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1; let t = ((cx - a[0]) * vx + (cz - a[1]) * vz) / l2; t = cl(t, 0, 1); const dd = Math.hypot(cx - (a[0] + vx * t), cz - (a[1] + vz * t)); if(dd < d) d = dd; }
    v = emPoli(terraPoli, cx, cz) || (norte && emPoli(norte, cx, cz)) ? -d : d; cache.set(k, v); return v;
  };
  const sdfGrad = (x, z, o) => { const e = CEL; o[0] = sdf(x + e, z) - sdf(x - e, z); o[1] = sdf(x, z + e) - sdf(x, z - e); const l = Math.hypot(o[0], o[1]) || 1; o[0] /= l; o[1] /= l; };

  /* ---------- bando ---------- */
  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N), gid = new Uint8Array(N), ativa = new Uint8Array(N), sai = new Uint8Array(N), kick = new Float32Array(N), bank = new Float32Array(N);
  const alvoG = []; for(let g = 0; g < C.subgrupos; g++) alvoG.push([0, 0, 0]);
  const vmin = C.velocidadeM[0] * U, vmax = C.velocidadeM[1] * U, perc = C.percepcaoM * U, sep = C.separacaoM * U;
  const geo = geometria(), fase = new Float32Array(N * 2); for(let i = 0; i < N; i++){ fase[i * 2] = Math.random() * 6.283; fase[i * 2 + 1] = rnd(22, 30); }
  geo.setAttribute("aFase", new InstancedBufferAttribute(fase, 2));
  const mat = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: .8, metalness: 0 }), uT = { value: 0 };
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = uT; sh.vertexShader = "attribute vec2 aFase; uniform float uT;\n" + sh.vertexShader.replace("#include <begin_vertex>", `
    vec3 transformed = vec3(position);
    float asa = smoothstep(0.1, 0.35, abs(position.x));
    float planar = smoothstep(-0.4, 0.5, sin(uT * 0.5 + aFase.x * 3.0));                        // de vez em quando plana
    float bate = sin(uT * aFase.y + aFase.x) * mix(0.15, 1.0, planar);
    transformed.y += bate * abs(position.x) * 0.8 * asa;
    transformed.x *= 1.0 - 0.14 * abs(bate) * asa;
    transformed.z += abs(position.x) * 0.1 * bate * asa;`); };
  const im = new InstancedMesh(geo, mat, N); im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = false; cen.grupo.add(im);

  function nasce(i, longe){
    /* entra pela ponta do vão (lado do lançamento), espalhada na faixa de distância dos cabos */
    const t = longe ? rnd(.5, .75) : rnd(.1, .55), a = rnd(0, Math.PI * 2), d = rnd(dMin * 1.1, dMax * .9), cx = A[0] + AB[0] * t, cy = A[1] + AB[1] * t, cz = A[2] + AB[2] * t;
    px[i] = cx; py[i] = cy + Math.sin(a) * d; pz[i] = cz + Math.cos(a) * d; const h = rnd(0, 6.283), v = rnd(vmin, vmax); vx[i] = Math.cos(h) * v; vz[i] = Math.sin(h) * v; vy[i] = rnd(-1, 1) * U; gid[i] = i % C.subgrupos; ativa[i] = 1; sai[i] = 0; kick[i] = 0; bank[i] = 0;
  }
  function novoAlvo(g){ const t = rnd(.1, .55), a = rnd(0, Math.PI * 2), d = rnd(dMin * 1.25, dMax * .85); alvoG[g][0] = A[0] + AB[0] * t; alvoG[g][1] = A[1] + AB[1] * t + Math.sin(a) * d; alvoG[g][2] = A[2] + AB[2] * t + Math.cos(a) * d; }
  for(let g = 0; g < C.subgrupos; g++) novoAlvo(g);

  /* grade espacial 3D (cabeça/próximo: listas encadeadas) */
  const CG = perc, cab = new Map(), prox = new Int32Array(N);
  const chave = (x, y, z) => (Math.floor(x / CG) * 73856093) ^ (Math.floor(y / CG) * 19349663) ^ (Math.floor(z / CG) * 83492791);
  const tmp = [0, 0, 0, 0, 0, 0], gr = [0, 0], mono = [];
  function passo(dt, J){
    const W = C.pesos; S.t += dt;
    /* presença (entrada e saída do bando) */
    const alvoN = Math.round(N * S.alvo), ritmo = N / (S.alvo > S.presenca ? C.presenca.subidaSeg : C.presenca.descidaSeg);
    S.presenca += cl(S.alvo - S.presenca, -dt * ritmo / N, dt * ritmo / N); const nAtivas = Math.round(N * S.presenca);
    let cont = 0; for(let i = 0; i < N; i++) if(ativa[i]) cont++;
    if(cont < nAtivas){ for(let i = 0; i < N && cont < nAtivas; i++) if(!ativa[i]){ nasce(i, true); cont++; } }
    else if(cont > nAtivas){ for(let i = 0; i < N && cont > nAtivas; i++) if(ativa[i] && !sai[i]){ sai[i] = 1; cont--; } }
    /* subgrupos: juntam-se e separam-se */
    S.grupoT -= dt; if(S.grupoT <= 0){ S.junto = !S.junto; S.grupoT = S.junto ? rnd(...C.junta) : rnd(...C.separa); if(S.junto){ novoAlvo(0); for(let g = 1; g < C.subgrupos; g++){ alvoG[g][0] = alvoG[0][0]; alvoG[g][1] = alvoG[0][1]; alvoG[g][2] = alvoG[0][2]; } } else for(let g = 0; g < C.subgrupos; g++) novoAlvo(g); }
    for(let g = 0; g < C.subgrupos; g++){ const a = alvoG[g]; let dx = 0; for(let i = g; i < N; i += C.subgrupos * 8) if(ativa[i]){ dx = Math.hypot(px[i] - a[0], py[i] - a[1], pz[i] - a[2]); break; } if(dx < 80 * U) novoAlvo(g); }
    /* onda de virada */
    S.ondaT -= dt; if(S.ondaT <= 0){ S.ondaT = rnd(...C.ondaCada); const k = Math.floor(Math.random() * N); if(ativa[k]) S.onda = { x: px[k], y: py[k], z: pz[k], r: 0, lado: Math.random() < .5 ? -1 : 1, lat: rnd(.5, 1.4) }; }
    if(S.onda){ S.onda.r += C.ondaVelocidadeM * U * dt; if(S.onda.r > 700 * U) S.onda = null; }
    /* monomotor */
    mono.length = 0; if(M.aeronaves) M.aeronaves.voos.forEach(v => { if(v.tipo === "monomotor" && v.pos) mono.push(v.pos); });
    /* grade */
    cab.clear(); prox.fill(-1); for(let i = 0; i < N; i++){ if(!ativa[i]) continue; const k = chave(px[i], py[i], pz[i]); prox[i] = cab.has(k) ? cab.get(k) : -1; cab.set(k, i); }
    for(let i = 0; i < N; i++){
      if(!ativa[i]) continue;
      let sx = 0, sy = 0, sz = 0, ax = 0, ay = 0, az = 0, cx = 0, cy = 0, cz = 0, nv = 0;
      const gx = Math.floor(px[i] / CG), gy = Math.floor(py[i] / CG), gz = Math.floor(pz[i] / CG);
      for(let a = -1; a <= 1; a++) for(let b = -1; b <= 1; b++) for(let c = -1; c <= 1; c++){ let j = cab.get(((gx + a) * 73856093) ^ ((gy + b) * 19349663) ^ ((gz + c) * 83492791)); if(j === undefined) continue; for(; j >= 0; j = prox[j]){ if(j === i) continue; const dx = px[i] - px[j], dy = py[i] - py[j], dz = pz[i] - pz[j], d2 = dx * dx + dy * dy + dz * dz; if(d2 > perc * perc) continue; nv++; ax += vx[j]; ay += vy[j]; az += vz[j]; cx += px[j]; cy += py[j]; cz += pz[j]; if(d2 < sep * sep){ const f = 1 - Math.sqrt(d2) / sep, d = Math.sqrt(d2) || 1; sx += dx / d * f; sy += dy / d * f; sz += dz / d * f; } } }
      let fx = sx * W.separacao * vmax, fy = sy * W.separacao * vmax, fz = sz * W.separacao * vmax;
      if(nv){ ax /= nv; ay /= nv; az /= nv; cx = cx / nv - px[i]; cy = cy / nv - py[i]; cz = cz / nv - pz[i]; fx += (ax - vx[i]) * W.alinhamento + cx * W.coesao * .6; fy += (ay - vy[i]) * W.alinhamento + cy * W.coesao * .6; fz += (az - vz[i]) * W.alinhamento + cz * W.coesao * .6; }
      /* rumo do subgrupo */
      const al = alvoG[gid[i]], dx = al[0] - px[i], dy = al[1] - py[i], dz = al[2] - pz[i], dl = Math.hypot(dx, dy, dz) || 1; fx += dx / dl * vmax * W.rumo; fy += dy / dl * vmax * W.rumo; fz += dz / dl * vmax * W.rumo;
      /* faixa de distância dos cabos (50–200 m) */
      if(sai[i]){ fx += (B[0] + 900 * U - px[i]) * .5; fy += (B[1] - 400 * U - py[i]) * .2; }
      else { const d = distCabos(px[i], py[i], pz[i], tmp); if(d < dMin){ const k = (dMin - d) / dMin * W.cabos * vmax * 2.2; fx += tmp[0] * k; fy += tmp[1] * k; fz += tmp[2] * k; } else if(d > dMax){ const k = Math.min(2, (d - dMax) / dMax) * W.cabos * vmax; fx -= tmp[0] * k; fy -= tmp[1] * k; fz -= tmp[2] * k; } else if(d > dMed){ const k = (d - dMed) / (dMax - dMed) * vmax * .3; fx -= tmp[0] * k; fy -= tmp[1] * k; fz -= tmp[2] * k; } }
      /* relevo: olha 2,5 s adiante; dentro de 70 m da borda (ou dentro dela) é empurrado para o vão */
      const lx = px[i] + vx[i] * 2.5, lz = pz[i] + vz[i] * 2.5, s0 = Math.min(sdf(px[i], pz[i]), sdf(lx, lz)), marg = 70 * U;
      if(s0 < marg && py[i] < 120 * U){ sdfGrad(px[i], pz[i], gr); const k = (1 - s0 / marg) * W.relevo * vmax; fx += gr[0] * k; fz += gr[1] * k; if(s0 < 0){ fx += gr[0] * vmax * 3; fz += gr[1] * vmax * 3; } }
      /* monomotor */
      for(const m of mono){ const mx = px[i] - m.x, my = py[i] - m.y, mz = pz[i] - m.z, md = Math.hypot(mx, my, mz); if(md < C.distanciaAviaoM * U){ const k = (1 - md / (C.distanciaAviaoM * U)) * W.aviao * vmax / (md || 1); fx += mx * k; fy += my * k; fz += mz * k; } }
      /* onda de virada: a frente da onda passa por esta ave e a empurra para o lado */
      if(S.onda){ const od = Math.hypot(px[i] - S.onda.x, py[i] - S.onda.y, pz[i] - S.onda.z); if(Math.abs(od - S.onda.r) < 14 * U && !kick[i]) kick[i] = 1; }
      if(kick[i] > 0){ kick[i] = Math.max(0, kick[i] - dt * 1.2); const kx = -vz[i], kz = vx[i], kl = Math.hypot(kx, kz) || 1; fx += kx / kl * S.onda_lado(i) * vmax * 2.4 * kick[i]; fz += kz / kl * S.onda_lado(i) * vmax * 2.4 * kick[i]; fy += vmax * .4 * kick[i] * (S.onda ? S.onda.lat - 1 : 0); }
      /* integra: acelera até a força, limita velocidade e giro */
      const lim = vmax * 3.2 * dt; fx = cl(fx * dt, -lim, lim); fy = cl(fy * dt, -lim, lim); fz = cl(fz * dt, -lim, lim);
      const ovx = vx[i], ovz = vz[i]; vx[i] += fx; vy[i] += fy; vz[i] += fz; vy[i] *= 1 - dt * .6;
      let v = Math.hypot(vx[i], vy[i], vz[i]) || 1; const vt = cl(v, vmin, vmax); vx[i] *= vt / v; vy[i] *= vt / v; vz[i] *= vt / v;
      px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; bank[i] += (cl(-((vx[i] - ovx) * -vz[i] + (vz[i] - ovz) * vx[i]) / (vt * dt * vmax) * 2.2, -1.1, 1.1) - bank[i]) * Math.min(1, dt * 5);
      /* correção firme da faixa: se passou dos limites, é recolocada aos poucos dentro dela */
      if(!sai[i]){ const d = distCabos(px[i], py[i], pz[i], tmp); if(d < dMin){ const k = (dMin - d) * Math.min(1, dt * 3); px[i] += tmp[3 - 3] * k; py[i] += tmp[1] * k; pz[i] += tmp[2] * k; } else if(d > dMax){ const k = (d - dMax) * Math.min(1, dt * 1.5); px[i] -= tmp[0] * k; py[i] -= tmp[1] * k; pz[i] -= tmp[2] * k; } }
      if(sai[i] && Math.hypot(px[i] - J.x, pz[i] - J.z) > 1700 * U) ativa[i] = 0;
    }
  }
  S.onda_lado = (i) => (S.onda ? S.onda.lado : 1) * ((i & 1) ? 1 : .8);

  /* ---------- desenho ---------- */
  const E = im.instanceMatrix.array; let n = 0;
  function desenha(){
    const s = .17 * C.escala * U; n = 0;
    for(let i = 0; i < N; i++){ if(!ativa[i]){ E.fill(0, i * 16, i * 16 + 16); E[i * 16 + 15] = 1; continue; } const v = Math.hypot(vx[i], vy[i], vz[i]) || 1, fx = vx[i] / v, fy = vy[i] / v, fz = vz[i] / v;
      /* base: f = frente; r = direita (up × f) com inclinação de curva; u = f × r */
      let rx = fz, ry = 0, rz = -fx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl; const bk = bank[i]; let ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
      ux += rx * bk * .8; uy += 0; uz += rz * bk * .8; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul; /* r' = u × f */ rx = uy * fz - uz * fy; ry = uz * fx - ux * fz; rz = ux * fy - uy * fx;
      const o = i * 16; E[o] = rx * s; E[o + 1] = ry * s; E[o + 2] = rz * s; E[o + 3] = 0; E[o + 4] = ux * s; E[o + 5] = uy * s; E[o + 6] = uz * s; E[o + 7] = 0; E[o + 8] = fx * s; E[o + 9] = fy * s; E[o + 10] = fz * s; E[o + 11] = 0; E[o + 12] = px[i]; E[o + 13] = py[i]; E[o + 14] = pz[i]; E[o + 15] = 1;
      n++; }
    im.count = N; im.instanceMatrix.needsUpdate = true;
  }
  /* a ordem das instâncias muda quando aves entram/saem; a fase é por índice, então só embaralha o batimento (sem problema visual) */

  const info = () => "Andorinhas: " + Math.round(S.presenca * N) + "/" + N + (S.junto ? " (juntas)" : " (subgrupos)") + (S.onda ? " · onda de virada" : "");
  function tick(dt, J, E2){
    if(!C.ativo || !J) return; uT.value += dt;
    /* só de dia */
    const dia = E2.alt > -3, alvo = dia ? S.alvo : 0; if(!dia && S.alvo > 0){ S.alvo = 0; }
    if(S.fim > 0){ S.fim -= dt; if(S.fim <= 0) S.alvo = 0; }
    if(S.presenca <= 0 && S.alvo <= 0){ if(im.count){ im.count = 0; ativa.fill(0); n = 0; } return; }
    void alvo; passo(Math.min(dt, .05), J); desenha();
    /* gorjeio perto do bando */
    S.ultSom -= dt; if(S.ultSom <= 0 && M.fauna.aves && n){ S.ultSom = rnd(.3, .9); const k = Math.floor(Math.random() * N); if(ativa[k]) M.fauna.aves.somExt("passarinho", px[k], py[k], pz[k], .7); }
  }
  /** chega o bando: dura `seg` segundos reais */
  function chega(seg){ S.alvo = 1; S.fim = seg || rnd(110, 220); if(M.gente) M.gente.reageCeu("andorinhas", { dur: 12 }); }
  function parte(){ S.alvo = 0; }
  const maisPerto = (x, y, z) => { let d = 1e18; for(let i = 0; i < N; i++) if(ativa[i]){ const q = Math.hypot(px[i] - x, py[i] - y, pz[i] - z); if(q < d) d = q; } return d / U; };
  /** quantas andorinhas aparecem no quadro (para a conquista da foto) */
  const noQuadro = (cam, v) => { let c = 0; for(let i = 0; i < N; i++){ if(!ativa[i]) continue; v.set(px[i], py[i], pz[i]).project(cam); if(v.z < 1 && Math.abs(v.x) < .95 && Math.abs(v.y) < .95) c++; } return c; };
  /** estatísticas de depuração: distância aos cabos (m), aves dentro da terra, velocidade média */
  function stats(){ let c = 0, mn = 1e9, mx = 0, soma = 0, dentro = 0, vs = 0, fora = 0; for(let i = 0; i < N; i++){ if(!ativa[i]) continue; c++; const d = distCabos(px[i], py[i], pz[i]) / U; mn = Math.min(mn, d); mx = Math.max(mx, d); soma += d; if(sdf(px[i], pz[i]) < 0 && py[i] < 40 * U) dentro++; if(d < C.cabosMin * .9 || d > C.cabosMax * 1.1) fora++; vs += Math.hypot(vx[i], vy[i], vz[i]) / U; }
    return { ativas: c, distMin: +mn.toFixed(1), distMax: +mx.toFixed(1), distMedia: +(soma / Math.max(1, c)).toFixed(1), foraDaFaixa: fora, dentroDaTerra: dentro, velMedia: +(vs / Math.max(1, c)).toFixed(1) }; }
  return { stats, tick, chega, parte, info, maisPerto, noQuadro, S, N, get ativas(){ let c = 0; for(let i = 0; i < N; i++) c += ativa[i]; return c; }, distCabos: (x, y, z) => distCabos(x, y, z), desliga(){ S.alvo = 0; S.presenca = 0; ativa.fill(0); im.count = 0; } };
}
