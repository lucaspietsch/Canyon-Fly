import { Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture, SRGBColorSpace } from "three";
import { U } from "../config.js";

/* ============================================================================================================
   ZONAS DE OCORRÊNCIA
   recebimento — campos e bordas de mata em volta do recebimento da tirolesa (lobo-guará)
   estacionamento — dentro e em volta do estacionamento: carros, lixeiras, meio-fio, borda do mato (graxaim)
   agua — margens do arroio do Graxaim até a cachoeira (leão-baio)
   Cada zona sabe: contem(x,z) · amostra(perto, rMin, rMax) → ponto sorteado perto de alguém · centro/ponto de teletransporte.
   ============================================================================================================ */

const polyDentro = (ply, x, z) => { let c = false; for(let i = 0, j = ply.length - 1; i < ply.length; j = i++){ const [xi, zi] = ply[i], [xj, zj] = ply[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const distSeg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)); };
const distLista = (px, pz, L) => { let d = 1e9; for(let i = 0; i < L.length - 1; i++){ const v = distSeg(px, pz, L[i], L[i + 1]); if(v < d) d = v; } return d; };
const maisPerto = (px, pz, L) => { let d = 1e9, r = [L[0][0], L[0][1]]; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); const qx = a[0] + dx * t, qz = a[1] + dz * t, dd = Math.hypot(px - qx, pz - qz); if(dd < d){ d = dd; r = [qx, qz]; } } return { d, p: r }; };
const pontoNaLista = (L, s) => { let r = s; for(let i = 0; i < L.length - 1; i++){ const l = Math.hypot(L[i + 1][0] - L[i][0], L[i + 1][1] - L[i][1]); if(r <= l){ const t = r / l; return [L[i][0] + (L[i + 1][0] - L[i][0]) * t, L[i][1] + (L[i + 1][1] - L[i][1]) * t, Math.atan2(L[i + 1][1] - L[i][1], L[i + 1][0] - L[i][0])]; } r -= l; } const n = L.length; return [L[n - 1][0], L[n - 1][1], 0]; };

export function criarZonas(cen){
  const { terraPoli, BORDA_PTS, emPoli } = cen.campo, AREA = cen.area, E = cen.estac, ARROIO = cen.rios.ARROIO;
  const distBorda = (x, z) => distLista(x, z, BORDA_PTS);
  const emTerra = (x, z) => emPoli(terraPoli, x, z);
  const naColina = (x, z) => cen.colinas.some(([cx, cz, rx, ry, rz]) => ((x - cx) / (rx * 1.05)) ** 2 + ((z - cz) / (rz * 1.05)) ** 2 < 1);
  const emCerca = (x, z, mg = 10) => x > AREA.x0 - mg && x < AREA.x1 + mg && z > AREA.z0 - mg - 6 && z < AREA.z1 + mg;
  const bateColisor = (x, z, r) => cen.colisores.some(k => (!k.ativo || k.ativo()) && x > k.x0 - r && x < k.x1 + r && z > k.z0 - r && z < k.z1 + r);
  /* chão por onde o bicho pode pisar: terra firme, longe da borda do cânion, fora de colinas, cerca e obstáculos */
  const livre = (x, z, r = 1.2, folgaBorda = 45) => emTerra(x, z) && distBorda(x, z) > folgaBorda && !naColina(x, z) && !emCerca(x, z, 4) && !bateColisor(x, z, r);

  /* ---- recebimento ---- */
  const REC = { centro: [30, 18], raio: 380 };
  const recebimento = {
    id: "recebimento", nome: "Arredores do recebimento",
    contem: (x, z) => Math.hypot(x - REC.centro[0], z - REC.centro[1]) < REC.raio && !emCerca(x, z, 8) && livre(x, z, 1, 40),
    perto: (x, z, mg = 0) => Math.hypot(x - REC.centro[0], z - REC.centro[1]) < REC.raio + mg,
    teleporte: [-170, 110, 0], centro: REC.centro, raio: REC.raio
  };

  /* ---- estacionamento ---- */
  const estPoly = E.poli, estC = E.PKW(0, 0);
  const estDentro = (x, z, mg) => polyDentro(estPoly, x, z) || distLista(x, z, [...estPoly, estPoly[0]]) < mg;
  const estacionamento = {
    id: "estacionamento", nome: "Estacionamento",
    contem: (x, z) => estDentro(x, z, 40) && !bateColisor(x, z, .8) && emTerra(x, z) && !naColina(x, z),
    perto: (x, z, mg = 0) => estDentro(x, z, 40 + mg),
    teleporte: [...E.PKW(-6, 8), 0], centro: estC, raio: 300,
    pontosInteresse: () => [...E.lixeiras.map(([a, b]) => E.PKW(a, b)), ...E.carros.map(([a, b]) => E.PKW(a, b + 6))]
  };

  /* ---- água: margens do arroio ---- */
  const margem = 24;                                                         // u de cada lado do eixo do arroio
  const agua = {
    id: "agua", nome: "Margens do arroio do Graxaim",
    contem: (x, z) => distLista(x, z, ARROIO) < margem + 10 && emTerra(x, z) && distBorda(x, z) > 25 && !bateColisor(x, z, .8),
    perto: (x, z, mg = 0) => distLista(x, z, ARROIO) < margem + 10 + mg,
    centro: ARROIO[Math.floor(ARROIO.length / 2)], raio: 200,
    eixo: ARROIO, distAgua: (x, z) => distLista(x, z, ARROIO)
  };
  /* ponto de teletransporte da água: onde a trilha cruza o arroio, uns passos para o lado */
  { let melhor = null; const TM = cen.trilhas.TM; for(let i = 0; i < TM.length - 1; i++){ const A = TM[i], B = TM[i + 1], Ln = Math.hypot(B[0] - A[0], B[1] - A[1]); for(let d = 0; d <= Ln; d += 6){ const x = A[0] + (B[0] - A[0]) * d / Ln, z = A[1] + (B[1] - A[1]) * d / Ln, dd = distLista(x, z, ARROIO); if(!melhor || dd < melhor.d) melhor = { d: dd, x, z }; } }
    agua.teleporte = [melhor.x - 18, melhor.z - 18, 0]; agua.ponte = [melhor.x, melhor.z]; }

  const ZONAS = { recebimento, estacionamento, agua };

  /* sorteia um ponto livre em volta de (ox,oz), entre rMin e rMax (u), dentro da zona */
  const amostra = (zona, ox, oz, rMin, rMax, tenta = 40) => {
    for(let i = 0; i < tenta; i++){
      const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin), x = ox + Math.cos(a) * r, z = oz + Math.sin(a) * r;
      if(zona.contem(x, z) && livre(x, z, 1.2, zona.id === "agua" ? 25 : 45) ) return [x, z];
    }
    return null;
  };

  /* ---- pegadas de leão-baio na lama das margens (detalhe ambiental, mesmo sem o animal) ---- */
  const pegada = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    x.fillStyle = "rgba(55,36,22,.0)"; x.fillRect(0, 0, 128, 128); x.fillStyle = "rgba(48,30,18,.8)";
    x.beginPath(); x.ellipse(64, 80, 24, 20, 0, 0, 7); x.fill();
    [[36, 44, 9], [54, 32, 9.5], [74, 32, 9.5], [92, 44, 9]].forEach(([a, b, r]) => { x.beginPath(); x.ellipse(a, b, r, r * 1.15, 0, 0, 7); x.fill(); });
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const lama = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 62); g.addColorStop(0, "rgba(58,40,26,.85)"); g.addColorStop(.7, "rgba(66,46,30,.55)"); g.addColorStop(1, "rgba(66,46,30,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; })();
  const matP = new MeshBasicMaterial({ map: pegada, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: true });
  const matL = new MeshBasicMaterial({ map: lama, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: true });
  const pegadas = [];
  { const L = ARROIO; let total = 0; for(let i = 0; i < L.length - 1; i++) total += Math.hypot(L[i + 1][0] - L[i][0], L[i + 1][1] - L[i][1]);
    let semente = 7; const r = () => (semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296;
    for(let k = 0; k < 6; k++){
      const s = total * (.1 + .8 * (k + r() * .5) / 6), [px, pz, ang] = pontoNaLista(L, s), lado = k % 2 ? 1 : -1, off = 11 + r() * 5, nx = -Math.sin(ang) * lado, nz = Math.cos(ang) * lado;
      const cx = px + nx * off, cz = pz + nz * off;
      if(!emTerra(cx, cz) || distBorda(cx, cz) < 30 || bateColisor(cx, cz, 2)) continue;
      const y = cen.chao(cx, cz) + .12;
      const m = new Mesh(new PlaneGeometry(13, 9), matL); m.rotation.x = -Math.PI / 2; m.rotation.z = r() * 6; m.position.set(cx, y, cz); m.renderOrder = 3; cen.grupo.add(m);
      for(let j = 0; j < 6; j++){ const p = new Mesh(new PlaneGeometry(1.7, 1.7), matP); p.rotation.x = -Math.PI / 2; p.rotation.z = -ang - Math.PI / 2 + (r() - .5) * .35;
        const dx = Math.cos(ang) * (j * 3.0 - 7) + (j % 2 ? .7 : -.7) * (-Math.sin(ang)), dz = Math.sin(ang) * (j * 3.0 - 7) + (j % 2 ? .7 : -.7) * Math.cos(ang);
        p.position.set(cx + dx, y + .04, cz + dz); p.renderOrder = 4; cen.grupo.add(p); }
      pegadas.push([cx, cz]);
    } }

  return { ZONAS, maisPerto, livre, emTerra, distBorda, naColina, emCerca, bateColisor, amostra, distLista, pontoNaLista, pegadas, U };
}
