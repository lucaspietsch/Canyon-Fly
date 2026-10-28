import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, ShapeUtils, Vector2 } from "three";

/* ============================================================================================================
   Ferramentas geométricas dos lugares do mundo (praça, fábrica, vila): polígonos do KML em coordenadas do mundo (u), eixo principal, afastamento (inset) e malhas rasas sobre o terreno.
   ============================================================================================================ */

export const centroide = (P) => { let x = 0, z = 0; P.forEach(p => { x += p[0]; z += p[1]; }); return [x / P.length, z / P.length]; };
export const caixa = (P) => { let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; P.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); return [x0, x1, z0, z1]; };
export const dentroPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
/** polígono sem o ponto repetido do fim (o KML fecha o anel repetindo o 1º ponto) */
export const aberto = (P) => (P.length > 3 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1e-3 ? P.slice(0, -1) : P.slice());
export const area = (P) => { let a = 0; for(let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] * P[i][1] - P[i][0] * P[j][1]); return a / 2; };

/** quadro do polígono: eixo ao longo da maior aresta (ux,uz), perpendicular (vx,vz), centro e extensões (u) */
export function quadro(P0){
  const P = aberto(P0); let melhor = 0, ang = 0;
  for(let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if(l > melhor){ melhor = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
  const ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz, vz = ux; let u0 = 1e18, u1 = -1e18, v0 = 1e18, v1 = -1e18;
  P.forEach(p => { const u = p[0] * ux + p[1] * uz, v = p[0] * vx + p[1] * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  const q = { ux, uz, vx, vz, w: u1 - u0, d: v1 - v0, ang, c: [cu * ux + cv * vx, cu * uz + cv * vz],
    /** ponto local (a ao longo de u, b ao longo de v; 0,0 = centro) → mundo */
    ao: (a, b) => [q.c[0] + a * ux + b * vx, q.c[1] + a * uz + b * vz] };
  return q;
}

/** afasta o polígono `d` u para dentro (d<0: para fora) por bissetriz com limite de mitra */
export function inset(P0, d){
  const P = aberto(P0), n = P.length, ori = area(P) > 0 ? 1 : -1, out = [];
  for(let i = 0; i < n; i++){
    const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const e1x = b[0] - a[0], e1z = b[1] - a[1], l1 = Math.hypot(e1x, e1z) || 1, e2x = c[0] - b[0], e2z = c[1] - b[1], l2 = Math.hypot(e2x, e2z) || 1;
    const n1x = -e1z / l1 * ori, n1z = e1x / l1 * ori, n2x = -e2z / l2 * ori, n2z = e2x / l2 * ori;                  // normais para dentro
    let mx = n1x + n2x, mz = n1z + n2z; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const cos = Math.max(.35, mx * n1x + mz * n1z);                                                                  // limite da mitra (cantos muito agudos)
    out.push([b[0] + mx * d / cos, b[1] + mz * d / cos]);
  }
  return out;
}

/** malha plana do polígono (qualquer forma simples) à altura `yf(x,z)` (função do terreno ou constante) + `dy` */
export function malhaPoli(P0, yf, dy, material){
  const P = aberto(P0), V = P.map(p => new Vector2(p[0], p[1])), tri = ShapeUtils.triangulateShape(V, []);
  const pos = [], idx = [];
  P.forEach(p => { pos.push(p[0], (typeof yf === "function" ? yf(p[0], p[1]) : yf) + dy, p[1]); });
  tri.forEach(t => { idx.push(t[0], t[2], t[1]); });                                                                // z cresce "para baixo" na tela: inverte para a face ficar para cima
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if(g.attributes.normal.getY(0) < 0){ const ix = g.index.array; for(let i = 0; i < ix.length; i += 3){ const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  const uv = []; P.forEach(p => uv.push(p[0] / 40, p[1] / 40)); g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  const m = new Mesh(g, material); m.receiveShadow = true; return m;
}

/** faixa entre dois contornos paralelos (anel de calçada) do polígono: de `d0` a `d1` u para dentro */
export function anel(P, d0, d1, yf, dy, material){
  const A = inset(P, d0), B = inset(P, d1), n = A.length, pos = [], idx = [];
  const y = (x, z) => (typeof yf === "function" ? yf(x, z) : yf) + dy;
  for(let i = 0; i < n; i++){ pos.push(A[i][0], y(A[i][0], A[i][1]), A[i][1], B[i][0], y(B[i][0], B[i][1]), B[i][1]); }
  for(let i = 0; i < n; i++){ const j = (i + 1) % n, a = i * 2, b = i * 2 + 1, c = j * 2, d = j * 2 + 1; idx.push(a, c, b, b, c, d); }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if(g.attributes.normal.getY(0) < 0){ const ix = g.index.array; for(let i = 0; i < ix.length; i += 3){ const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  const m = new Mesh(g, material); m.receiveShadow = true; return m;
}

/** faixa reta de largura `w` entre dois pontos do mundo, acompanhando o terreno (subdividida a cada ~`passo` u) */
export function fitaReta(a, b, w, yf, dy, material, passo = 24){
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / passo)), tx = (b[0] - a[0]) / (L || 1), tz = (b[1] - a[1]) / (L || 1), nx = -tz * w / 2, nz = tx * w / 2, pos = [], idx = [];
  for(let i = 0; i <= n; i++){ const x = a[0] + (b[0] - a[0]) * i / n, z = a[1] + (b[1] - a[1]) * i / n; pos.push(x + nx, yf(x + nx, z + nz) + dy, z + nz, x - nx, yf(x - nx, z - nz) + dy, z - nz); }
  for(let i = 0; i < n; i++){ const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  const g = new BufferGeometry(); g.setAttribute("position", new Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if(g.attributes.normal.getY(0) < 0){ const ix = g.index.array; for(let i = 0; i < ix.length; i += 3){ const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
  const m = new Mesh(g, material); m.receiveShadow = true; return m;
}

export const mat = (cor, o = {}) => new MeshStandardMaterial({ color: cor, roughness: .9, ...o });
/** gerador pseudo-aleatório repetível (mesma vila/praça em toda carga) */
export const semente = (s) => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
export function descarta(g){ g.traverse(o => { if(o.geometry && !o.geometry.userData.compartilhada) o.geometry.dispose(); }); }
