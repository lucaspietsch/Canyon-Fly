import { Group, Mesh, BoxGeometry, ConeGeometry, TorusGeometry, MeshStandardMaterial, Matrix4, Quaternion, Vector3, Euler } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { U } from "../config.js";
import { canvasTex } from "../../lib.js";
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
/* cor da parede pelo que o catálogo diz de cada prédio (nome) */
const CORES_NOME = [[/rosa/i, 0xe9b7b9], [/amarel/i, 0xf0d77e], [/verde/i, 0xa9c4a0], [/lil[aá]s/i, 0xc3b1dc], [/vermelh/i, 0xc0554a], [/cinza|t[aá]buas/i, 0xa9a49a], [/madeira escura/i, 0x6e5440], [/Prefeitura/i, 0xf0d77e], [/Sociedade/i, 0xf1e3c2], [/Thewes/i, 0xf3d6d6], [/Pioneiro/i, 0xd9776a], [/concreto/i, 0xb8b4ac]];
const corDe = (nome, tipo) => { for(const [re, c] of CORES_NOME) if(re.test(nome)) return c; return (COR[tipo] || COR.casa)[0]; };
/* texturas de fachada (1 ladrilho = 3,2 m de largura × 1 pavimento de 3,2 m): fundo BRANCO (a cor vem do material), janelas/portas por cima */
const MOD = 3.2;
function texFachada(tipo){
  return canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(0,0,0,.06)"; c.fillRect(0, h - 4, w, 4);            // rodapé
    if(tipo === "igreja"){ c.fillStyle = "#3f5f7a"; c.beginPath(); c.moveTo(22, 58); c.lineTo(22, 22); c.arc(32, 22, 10, Math.PI, 0); c.lineTo(42, 58); c.fill(); c.strokeStyle = "#f4f1e8"; c.lineWidth = 2; c.stroke(); c.fillStyle = "#d9d3c2"; c.fillRect(0, 0, 4, h); c.fillRect(w - 4, 0, 4, h); return; }
    if(tipo === "comercio"){ c.fillStyle = "#53697a"; c.fillRect(8, 18, 48, 36); c.strokeStyle = "#2c2c2c"; c.lineWidth = 2; c.strokeRect(8, 18, 48, 36); c.beginPath(); c.moveTo(32, 18); c.lineTo(32, 54); c.stroke(); return; }
    if(tipo === "publico"){ c.fillStyle = "#5a3b24"; c.fillRect(20, 12, 24, 40); c.fillStyle = "#7a9ab0"; c.fillRect(23, 15, 18, 20); c.strokeStyle = "#f4f1e8"; c.lineWidth = 3; c.strokeRect(19, 11, 26, 42); return; }
    c.fillStyle = "#6a8aa0"; c.fillRect(22, 18, 20, 24); c.strokeStyle = "#f4f1e8"; c.lineWidth = 2; c.strokeRect(22, 18, 20, 24); c.beginPath(); c.moveTo(32, 18); c.lineTo(32, 42); c.moveTo(22, 30); c.lineTo(42, 30); c.stroke();
    c.fillStyle = "#8a3a2a"; c.fillRect(12, 17, 8, 26); c.fillRect(44, 17, 8, 26);                                               // venezianas
  }, { repeat: [1, 1] });
}
function texTorre(){
  return canvasTex(64, 256, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "#e3ddcc"; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);
    c.fillStyle = "#2a2a2a"; for(const x of [16, 36]){ c.beginPath(); c.moveTo(x, 62); c.lineTo(x, 30); c.arc(x + 6, 30, 6, Math.PI, 0); c.lineTo(x + 12, 62); c.fill(); }     // campanário: 2 aberturas em arco lado a lado
    c.fillStyle = "#3f5f7a"; c.beginPath(); c.arc(32, 120, 9, 0, Math.PI * 2); c.fill();                                                   // óculo
    c.fillStyle = "#5a3b24"; c.beginPath(); c.moveTo(20, 256); c.lineTo(20, 206); c.arc(32, 206, 12, Math.PI, 0); c.lineTo(44, 256); c.fill();       // porta principal em arco
  }, { repeat: [1, 1] });
}
/* UV da caixa 1×1×1 (faces ±x, ±x, ±y, ±y, ±z, ±z; 4 vértices cada): ladrilhos de MOD m; topo/fundo no canto (só cor) */
function uvCaixa(g, wM, dM, hM){ const uv = g.attributes.uv; for(let f = 0; f < 6; f++) for(let k = 0; k < 4; k++){ const i = f * 4 + k, lado = f < 2 ? dM : f > 3 ? wM : 0;
  if(!lado){ uv.setXY(i, .02, .98); continue; } uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(lado / MOD)), uv.getY(i) * Math.max(1, Math.round(hM / MOD))); } uv.needsUpdate = true; }

export function criarCentro(M, u){
  const { cen } = M, G = new Group(), T = u.T || [0, 0];
  const mundo = (x, y) => { const p = latLonParaMundo(O.lat + y / O.mLat, O.lon + x / O.mLon); return [p[0] + T[0], p[1] + T[1]]; };
  const Y = (x, z) => cen.relevo(x, z);
  /* eixo local (metros) → vetor no mundo (u por metro) */
  const eixo = (x, y, ang) => { const a = mundo(x, y), b = mundo(x + Math.cos(ang), y + Math.sin(ang)); return [b[0] - a[0], b[1] - a[1]]; };
  const geos = new Map(), add = (cor, g, tex = "") => { const k = tex + "|" + cor; if(!geos.has(k)) geos.set(k, []); geos.get(k).push(g); };
  const TEX = { casa: texFachada("casa"), comercio: texFachada("comercio"), publico: texFachada("publico"), igreja: texFachada("igreja"), torre: texTorre() };
  for(const t of ["casa", "comercio", "publico", "igreja"]){ TEX[t].wrapS = TEX[t].wrapT = 1000; }
  const colisores = [], m4 = new Matrix4(), q = new Quaternion(), e = new Euler(), v = new Vector3(), s = new Vector3();

  /* ---------- prédios em blocos ---------- */
  for(const [nome, x, y, w, d, alt, tipo, angG] of PREDIOS_CENTRO){
    const a = angG * Math.PI / 180, [cx, cz] = mundo(x, y), ex = eixo(x, y, a), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]);
    const W = w * le, D = d * le, H = alt * U, y0 = Math.min(Y(cx, cz), Y(cx + ex[0] * w / 2, cz + ex[1] * w / 2), Y(cx - ex[0] * w / 2, cz - ex[1] * w / 2)) - .3;
    const cTelha = (COR[tipo] || COR.casa)[1], cParede = corDe(nome, tipo);
    e.set(0, yaw, 0); q.setFromEuler(e);
    const par = new BoxGeometry(1, 1, 1); uvCaixa(par, w, d, alt); par.applyMatrix4(m4.compose(v.set(cx, y0 + H / 2, cz), q, s.set(W, H, D))); add(cParede, par, tipo);
    const rh = Math.min(W, D) * .42, tel = new ConeGeometry(Math.SQRT1_2, 1, 4); tel.rotateY(Math.PI / 4);
    tel.applyMatrix4(m4.compose(v.set(cx, y0 + H + rh / 2, cz), q, s.set(W * 1.08, rh, D * 1.08))); add(cTelha, tel);
    /* colisor: caixa alinhada aos eixos que cobre o bloco girado (um pouco menor para não travar nas quinas) */
    const c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw)), hx = (W * c + D * sn) / 2 * .86, hz = (W * sn + D * c) / 2 * .86;
    colisores.push({ x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, peca: "predio:" + nome });
  }

  /* ---------- torre da Igreja Matriz São José (−24, +51,5) ---------- */
  { const [tx, tz] = mundo(-24, 51.5), ex = eixo(-24, 51.5, 3.9 * Math.PI / 180), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]), y0 = Y(tx, tz) - .3, L = 6 * le, H = 25 * U;
    e.set(0, yaw, 0); q.setFromEuler(e);
    const tor = new BoxGeometry(1, 1, 1); tor.applyMatrix4(m4.compose(v.set(tx, y0 + H / 2, tz), q, s.set(L, H, L))); add(COR.igreja[0], tor, "torre");
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
  geos.forEach((lista, k) => { const [tex, cor] = k.split("|"), g = mergeGeometries(lista); lista.forEach(x => x.dispose()); const m = new Mesh(g, new MeshStandardMaterial({ color: +cor, roughness: .9, map: TEX[tex] || null })); m.castShadow = true; m.receiveShadow = true; G.add(m); });

  /* colisores entram no cenário enquanto o centro existir */
  colisores.forEach(k => cen.colisores.push(k));
  G.userData.descartar = () => colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); });
  return G;
}
