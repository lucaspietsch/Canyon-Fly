import { Group, Mesh, BoxGeometry, ConeGeometry, TorusGeometry, MeshStandardMaterial, Matrix4, Quaternion, Vector3, Euler } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { U } from "../config.js";
import { latLonParaMundo } from "../resgate/kml.js";
import { PREDIOS_CENTRO, ORIGEM_CENTRO as O } from "../dados/cidade-centro.js";

/* ============================================================================================================
   CENTRO DE CAMBARÁ DO SUL — primeira montagem (blocos) a partir do catálogo dos prints do Lucas (docs/cidade/REFERENCIAS-STREET-VIEW.md):
   • prédios em blocos (paredes + telhado de 4 águas), cada um com a frente PARALELA À RUA mais próxima (mesmo que fique torto — pedido do Lucas), com colisão;
   • Igreja Matriz São José com a torre (posição triangulada por 5 vistas);
   • Rua Coberta: EXATAMENTE 10 arcos em forma de favo de mel (hexágono), girados alguns graus e cravados no solo, só na frente da praça.
   Coordenadas dos dados: metros locais (x leste, y norte) a partir da Ref 01; aqui viram lat/lon → mundo (latLonParaMundo) + o deslocamento da cidade (u.T).
   Gerado por docs/cidade/gera_cidade.py — para mudar posições/medidas, edite o gerador e rode de novo.
   ============================================================================================================ */

const COR = { casa: [0xefe4cf, 0xb04a32], publico: [0xf2ead2, 0x8b4a2b], comercio: [0xf7f5f0, 0x64666c], igreja: [0xf6f2e8, 0x8e9196] };

export function criarCentro(M, u){
  const { cen } = M, G = new Group(), T = u.T || [0, 0];
  const mundo = (x, y) => { const p = latLonParaMundo(O.lat + y / O.mLat, O.lon + x / O.mLon); return [p[0] + T[0], p[1] + T[1]]; };
  const Y = (x, z) => cen.relevo(x, z);
  /* eixo local (metros) → vetor no mundo (u por metro) */
  const eixo = (x, y, ang) => { const a = mundo(x, y), b = mundo(x + Math.cos(ang), y + Math.sin(ang)); return [b[0] - a[0], b[1] - a[1]]; };
  const geos = new Map(), add = (cor, g) => { if(!geos.has(cor)) geos.set(cor, []); geos.get(cor).push(g); };
  const colisores = [], m4 = new Matrix4(), q = new Quaternion(), e = new Euler(), v = new Vector3(), s = new Vector3();

  /* ---------- prédios em blocos ---------- */
  for(const [nome, x, y, w, d, alt, tipo, angG] of PREDIOS_CENTRO){
    const a = angG * Math.PI / 180, [cx, cz] = mundo(x, y), ex = eixo(x, y, a), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]);
    const W = w * le, D = d * le, H = alt * U, y0 = Math.min(Y(cx, cz), Y(cx + ex[0] * w / 2, cz + ex[1] * w / 2), Y(cx - ex[0] * w / 2, cz - ex[1] * w / 2)) - .3;
    const [cParede, cTelha] = COR[tipo] || COR.casa;
    e.set(0, yaw, 0); q.setFromEuler(e);
    const par = new BoxGeometry(1, 1, 1); par.applyMatrix4(m4.compose(v.set(cx, y0 + H / 2, cz), q, s.set(W, H, D))); add(cParede, par);
    const rh = Math.min(W, D) * .42, tel = new ConeGeometry(Math.SQRT1_2, 1, 4); tel.rotateY(Math.PI / 4);
    tel.applyMatrix4(m4.compose(v.set(cx, y0 + H + rh / 2, cz), q, s.set(W * 1.08, rh, D * 1.08))); add(cTelha, tel);
    /* colisor: caixa alinhada aos eixos que cobre o bloco girado (um pouco menor para não travar nas quinas) */
    const c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw)), hx = (W * c + D * sn) / 2 * .86, hz = (W * sn + D * c) / 2 * .86;
    colisores.push({ x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, peca: "predio:" + nome });
  }

  /* ---------- torre da Igreja Matriz São José (−24, +51,5) ---------- */
  { const [tx, tz] = mundo(-24, 51.5), ex = eixo(-24, 51.5, 3.9 * Math.PI / 180), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]), y0 = Y(tx, tz) - .3, L = 6 * le, H = 25 * U;
    e.set(0, yaw, 0); q.setFromEuler(e);
    const tor = new BoxGeometry(1, 1, 1); tor.applyMatrix4(m4.compose(v.set(tx, y0 + H / 2, tz), q, s.set(L, H, L))); add(COR.igreja[0], tor);
    const pt = new ConeGeometry(Math.SQRT1_2, 1, 4); pt.rotateY(Math.PI / 4); pt.applyMatrix4(m4.compose(v.set(tx, y0 + H + 3 * U, tz), q, s.set(L * 1.1, 6 * U, L * 1.1))); add(COR.igreja[1], pt);
    const cz1 = new BoxGeometry(.25 * U, 2.2 * U, .25 * U); cz1.translate(tx, y0 + H + 7.1 * U, tz); add(0x3a3a3a, cz1);
    const cz2 = new BoxGeometry(1.2 * U, .25 * U, .25 * U); cz2.translate(tx, y0 + H + 7.5 * U, tz); add(0x3a3a3a, cz2);
    colisores.push({ x0: tx - L * .5, x1: tx + L * .5, z0: tz - L * .5, z1: tz + L * .5, peca: "torre da igreja" });
  }

  /* ---------- Rua Coberta: 10 arcos-favo (hexágonos) na frente da praça, da esquina da Quinze de Março (x −56) à da Laurindo (x −2), y ≈ +6 (faixa entre a avenida e o gramado) ---------- */
  { const N = 10, xa = -56, xb = -2, yr = 6, R = 6.2 * U, tubo = .32 * U, giro = Math.PI / 6 + .17;   // ~10° de giro sobre o próprio plano
    const a0 = mundo(xa, yr), a1 = mundo(xb, yr), dx = a1[0] - a0[0], dz = a1[1] - a0[1], yaw = Math.atan2(dx, dz);
    for(let k = 0; k < N; k++){ const t = k / (N - 1), px = a0[0] + dx * t, pz = a0[1] + dz * t, py = Y(px, pz) + R * .72;   // centro baixo: a ponta de baixo do hexágono fica enterrada
      const g = new TorusGeometry(R, tubo, 4, 6); g.rotateZ(giro); g.rotateY(yaw); g.translate(px, py, pz); add(0xa82b22, g); }
    /* longarinas ligando os arcos pelo alto */
    const Lr = Math.hypot(dx, dz), nx = -dz / Lr, nz = dx / Lr;
    for(const lado of [-1, 1]){ const off = R * .55 * lado, my = Y((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2) + R * 1.55;
      const b = new BoxGeometry(.35 * U, .35 * U, Lr); b.rotateY(yaw); b.translate((a0[0] + a1[0]) / 2 + nx * off, my, (a0[1] + a1[1]) / 2 + nz * off); add(0xa82b22, b); }
  }

  /* ---------- malhas finais (uma por cor) ---------- */
  geos.forEach((lista, cor) => { const g = mergeGeometries(lista); lista.forEach(x => x.dispose()); const m = new Mesh(g, new MeshStandardMaterial({ color: cor, roughness: .9 })); m.castShadow = true; m.receiveShadow = true; G.add(m); });

  /* colisores entram no cenário enquanto o centro existir */
  colisores.forEach(k => cen.colisores.push(k));
  G.userData.descartar = () => colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); });
  return G;
}
