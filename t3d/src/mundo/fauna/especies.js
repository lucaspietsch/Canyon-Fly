import { U } from "../config.js";
import { rnd } from "./animal.js";

/* ============================================================================================================
   DEFINIÇÃO DE CADA ESPÉCIE: aparência (modelos.js → SPEC), pose, atividades e como escolhe para onde ir.
   Para criar uma espécie nova: um objeto aqui, um bloco em config.js → ESPECIES e (se precisar) uma zona em zonas.js.
   ============================================================================================================ */

/* sorteia um destino perto, sem chegar mais perto de ninguém do que a distância de alerta + 2 m */
function destinoLivre(a, c, rMin, rMax, zona, abertura = 1.7){
  for(let i = 0; i < 16; i++){
    const ang = a.yaw + rnd(-abertura, abertura), r = rnd(rMin, rMax) * U, x = a.x + Math.sin(ang) * r, z = a.z + Math.cos(ang) * r;
    if(!c.livre(x, z, 1.5, 24) || (zona && !zona.contem(x, z))) continue;
    const minimo = Math.max(a.alertaM + 2, Math.min(a.dmin, a.naturalM) * .9);
    if(c.pessoasRaw.every(p => Math.hypot(p.x - x, p.z - z) / U >= minimo)) return [x, z];
  }
  return null;
}

export const DEF = {
  lobo: {
    spec: "lobo", alertaSeg: [3, 7], alertaMax: 12, aposAlerta: "natural",
    pose: { neutroPesc: .95, neutroCab: .15, altoPesc: .62, baixoPesc: 2.2, cauda: -.55, caudaAlerta: -.1, caudaFuga: -.95, perna: .78 },
    atividades: () => [["andar", 40], ["farejar", 25], ["escutar", 20], ["parar", 10]],
    durs: { farejar: [3, 6], escutar: [3, 6], parar: [2, 4] },
    destino: (a, c) => destinoLivre(a, c, 8, 22, c.zonas.recebimento)
  },
  puma: {
    spec: "puma", alertaSeg: [1, 2], alertaMax: 3, aposAlerta: "sair",
    pose: { neutroPesc: 1.55, neutroCab: .3, altoPesc: 1.25, baixoPesc: 2.35, cauda: -.3, caudaAlerta: -.12, caudaFuga: -.4, perna: .54 },
    atividades: () => [["andar", 38], ["beber", 28], ["farejar", 14], ["escutar", 20]],
    durs: { farejar: [2, 4], escutar: [2, 4], beber: [4, 8] },
    /* caminha pela margem, seguindo o curso d'água */
    destino: (a, c) => {
      const Z = c.zonas.agua, L = Z.eixo; let k = 0, md = 1e9; L.forEach((p, i) => { const d = Math.hypot(p[0] - a.x, p[1] - a.z); if(d < md){ md = d; k = i; } });
      if(!a.dirAgua) a.dirAgua = Math.random() < .5 ? 1 : -1;
      for(let t = 0; t < 8; t++){
        let i = k + a.dirAgua * (1 + Math.floor(Math.random() * 2)); if(i < 0 || i >= L.length){ a.dirAgua *= -1; continue; }
        const P = L[i], Q = L[Math.min(L.length - 1, i + 1)], ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]), lado = a.lado || (a.lado = Math.random() < .5 ? 1 : -1);
        const off = rnd(5, 9), x = P[0] - Math.sin(ang) * off * lado + rnd(-3, 3), z = P[1] + Math.cos(ang) * off * lado + rnd(-3, 3);
        if(!c.livre(x, z, 1.2, 22)) continue;
        if(c.pessoasRaw.every(p => Math.hypot(p.x - x, p.z - z) / U >= a.alertaM + 2)) return [x, z];
      }
      return destinoLivre(a, c, 6, 14, Z);
    },
    destinoBeber: (a, c) => {
      const Z = c.zonas.agua, L = Z.eixo; let best = null, md = 1e9;
      for(let i = 0; i < L.length - 1; i++){ const A = L[i], B = L[i + 1], dx = B[0] - A[0], dz = B[1] - A[1], l2 = dx * dx + dz * dz || 1; let t = ((a.x - A[0]) * dx + (a.z - A[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); const px = A[0] + dx * t, pz = A[1] + dz * t, d = Math.hypot(a.x - px, a.z - pz); if(d < md){ md = d; best = [px, pz]; } }
      if(!best || md > 40) return null;
      const ax = a.x - best[0], az = a.z - best[1], l = Math.hypot(ax, az) || 1, x = best[0] + ax / l * 4.5, z = best[1] + az / l * 4.5;     // à beira, do lado em que está
      return c.livre(x, z, 1, 16) ? [x, z] : null;
    }
  },
  graxaim: {
    spec: "graxaimCinza", variante: () => (Math.random() < .5 ? "graxaimCinza" : "graxaimRuivo"), alertaSeg: [2, 5], alertaMax: 9, aposAlerta: "natural",
    pose: { neutroPesc: 1.1, neutroCab: .2, altoPesc: .75, baixoPesc: 2.2, cauda: -.35, caudaAlerta: -.5, caudaFuga: -.2, perna: .35 },
    atividades: () => [["zigue", 34], ["farejar", 24], ["sentar", 14], ["cocar", 8], ["observar", 14]],
    durs: { farejar: [3, 6], sentar: [4, 9], cocar: [2.5, 4], observar: [3, 6] },
    destino: (a, c) => {
      const Z = c.zonas.estacionamento;
      if(Math.random() < .55){ const pts = Z.pontosInteresse(); for(let t = 0; t < 5; t++){ const p = pts[Math.floor(Math.random() * pts.length)], x = p[0] + rnd(-5, 5), z = p[1] + rnd(-5, 5);        // lixeiras e carros
          if(c.livre(x, z, 1, 10) && Z.contem(x, z) && c.pessoasRaw.every(q => Math.hypot(q.x - x, q.z - z) / U >= a.alertaM + 2)) return [x, z]; } }
      return destinoLivre(a, c, 5, 16, Z, 2.2);
    }
  }
};

/* ---- bichos de Cambará do Sul: veado-campeiro (campos, tímido), quati (estacionamento, de dia, em bando), gambá (à noite) e lontra (margens do arroio) ---- */
DEF.veado = {
  spec: "veado", alertaSeg: [4, 8], alertaMax: 14, aposAlerta: "sair",
  pose: { neutroPesc: .62, neutroCab: .12, altoPesc: .3, baixoPesc: 2.1, cauda: -.3, caudaAlerta: .25, caudaFuga: .5, perna: .7 },
  atividades: () => [["andar", 30], ["farejar", 32], ["escutar", 26], ["parar", 12]],
  durs: { farejar: [4, 9], escutar: [3, 7], parar: [3, 6] },
  destino: (a, c) => destinoLivre(a, c, 8, 24, c.zonas.recebimento)
};
DEF.quati = {
  spec: "quati", alertaSeg: [1.5, 4], alertaMax: 7, aposAlerta: "natural",
  pose: { neutroPesc: .5, neutroCab: .55, altoPesc: .45, baixoPesc: 2.3, cauda: .5, caudaAlerta: .9, caudaFuga: .3, perna: .4 },
  atividades: () => [["andar", 36], ["farejar", 40], ["escutar", 12], ["parar", 12]],
  durs: { farejar: [3, 7], escutar: [2, 4], parar: [2, 4] },
  destino: (a, c) => {
    const Z = c.zonas.estacionamento;
    if(Math.random() < .5){ const pts = Z.pontosInteresse(); for(let t = 0; t < 5; t++){ const p = pts[Math.floor(Math.random() * pts.length)], x = p[0] + rnd(-4, 4), z = p[1] + rnd(-4, 4);
        if(c.livre(x, z, 1, 10) && Z.contem(x, z) && c.pessoasRaw.every(q => Math.hypot(q.x - x, q.z - z) / U >= a.alertaM + 2)) return [x, z]; } }
    return destinoLivre(a, c, 4, 14, Z, 2.2);
  }
};
DEF.gamba = {
  spec: "gamba", alertaSeg: [2, 5], alertaMax: 8, aposAlerta: "natural",
  pose: { neutroPesc: .45, neutroCab: .5, altoPesc: .4, baixoPesc: 2.3, cauda: -.2, caudaAlerta: -.1, caudaFuga: -.3, perna: .3 },
  atividades: () => [["andar", 38], ["farejar", 40], ["escutar", 12], ["parar", 10]],
  durs: { farejar: [3, 8], escutar: [2, 4], parar: [2, 5] },
  destino: (a, c) => DEF.quati.destino(a, c)
};
DEF.lontra = {
  spec: "lontra", alertaSeg: [2, 5], alertaMax: 8, aposAlerta: "sair",
  pose: { neutroPesc: .5, neutroCab: .3, altoPesc: .35, baixoPesc: 2.2, cauda: -.15, caudaAlerta: -.05, caudaFuga: -.3, perna: .35 },
  atividades: () => [["andar", 40], ["beber", 25], ["farejar", 20], ["escutar", 15]],
  durs: { farejar: [2, 5], escutar: [2, 4], beber: [4, 8] },
  destino: (a, c) => DEF.puma.destino(a, c), destinoBeber: (a, c) => DEF.puma.destinoBeber(a, c)
};
