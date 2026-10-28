import { Group, Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, PlaneGeometry, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, DoubleSide } from "three";
import { m, NIVEL, canvasTex, texPlacaHD, placaLegivel, rng, mat, caixa, coluna, barra, grupo } from "./lib.js";

/* ============================================================================================================
   PLATAFORMA DE CHEGADA (deck): corpo comprido + patamar da casinha, saia de tábuas, linhas amarelas, guarda-corpo de troncos,
   escadinha de madeira com placa de aviso, escada plataforma de alumínio e escada verde de aço. Medidas das fotos (1 m = 2,94 u).
   Corpo do deck: x ∈ [-30, 30] (20 m), z ∈ [-36, 3] (13 m); o conjunto com o patamar (z até 22) fica quase quadrado, 20 × 19 m. Patamar da casinha: z ∈ [3, 22]. Topo = NIVEL.DECK.
   ============================================================================================================ */
/* mapa do usuário: 17 × 24 m (50 × 71 u), com um recorte no canto do lado das molas (x ≤ nx1, z ≤ nz1). Casinha encostada na borda esquerda (z = z0). */
export const DECK = { x0: -36, x1: 36, z0: -4, z1: 46, nx1: -22, nz1: 22 };
const ESP = .35;                                                          // espessura do tampo

/* ------------------------------------------------------------------ texturas */
const px = (x, w) => ((x - DECK.x0) / (DECK.x1 - DECK.x0)) * w;
const pz = (z, h) => ((z - DECK.z0) / (DECK.z1 - DECK.z0)) * h;

function texPiso(){
  return canvasTex(1024, 720, (c, w, h) => {
    const r = rng(11);
    c.fillStyle = "#3c342d"; c.fillRect(0, 0, w, h);
    const nb = 90, bw = w / nb, comp = pz(DECK.z0 + 8.8, h);              // tábuas de ~3 m
    for(let i = 0; i < nb; i++){
      let y = -r() * comp;
      while(y < h){
        const t = 82 + Math.floor(r() * 30);
        c.fillStyle = `rgb(${t + 14},${t + 8},${t})`;
        c.fillRect(i * bw + .7, y + 1.2, bw - 1.4, comp - 2.4);
        c.fillStyle = "rgba(255,255,255,.04)"; c.fillRect(i * bw + .7, y + 1.2, (bw - 1.4) * .3, comp - 2.4);
        y += comp;
      }
    }
    /* sinalização amarela (tinta): linha dupla ao longo do comprimento com retorno em "L", linha simples transversal e marcas junto à casinha */
    c.strokeStyle = "#e3b520"; c.lineCap = "butt"; c.lineJoin = "miter";
    const lin = (pts, esp) => { c.lineWidth = esp; c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(px(x, w), pz(z, h)) : c.moveTo(px(x, w), pz(z, h)))); c.stroke(); };
    const E = 5.2;                                                         // ~0,1 m de tinta
    lin([[14, 4], [14, 40], [8, 40]], E); lin([[17.4, 4], [17.4, 41.4], [8, 41.4]], E);   // dupla com retorno em "L"
    lin([[-22, 26], [36, 26]], E);                                         // simples transversal
    lin([[-13.5, 1.4], [-8, 1.4]], E); lin([[-8, 1.4], [-8, -3.6]], E);    // marca em frente à porta corrediça da casinha
    lin([[-36, 24.4], [-22, 24.4]], E);                                    // beira do recorte do lado das molas
  });
}
function texSaia(){
  return canvasTex(384, 150, (c, w, h) => {
    const r = rng(5), n = 7, bh = h / n;
    c.fillStyle = "#1f1710"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < n; i++){
      const t = 38 + Math.floor(r() * 14);
      c.fillStyle = `rgb(${t + 10},${t + 4},${t - 4})`; c.fillRect(0, i * bh + 1.5, w, bh - 3);
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(0, i * bh + bh - 3, w, 1.5);
    }
    c.fillStyle = "#2e231a"; c.fillRect(0, 0, 14, h); c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(2, 0, 3, h);   // pilarete a cada 6 u (≈ 2 m)
  }, { repeat: [1, 1] });
}
function texAviso(){
  return texPlacaHD(256, 176, (c, w, h) => {
    c.fillStyle = "#f5f2ec"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#c8202a"; c.fillRect(0, 0, w, 54); c.fillRect(0, h - 10, w, 10);
    c.fillStyle = "#fff"; c.font = "bold 36px Arial"; c.textAlign = "center"; c.fillText("AVISO", w / 2, 40);
    c.fillStyle = "#c8202a"; c.font = "bold 22px Arial"; c.fillText("RISCO DE QUEDA", w / 2, 80);
    c.fillStyle = "#f2c200"; c.beginPath(); c.moveTo(w / 2, 92); c.lineTo(w / 2 + 38, 150); c.lineTo(w / 2 - 38, 150); c.closePath(); c.fill();
    c.strokeStyle = "#111"; c.lineWidth = 3; c.stroke();
    c.fillStyle = "#111"; c.fillRect(w / 2 - 2, 108, 4, 20); c.fillRect(w / 2 - 2, 134, 4, 4);
  });
}
function texXadrez(){
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = "#b9bec2"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ c.save(); c.translate(i * 16 + 8, j * 16 + 8); c.rotate(((i + j) % 2 ? 1 : -1) * Math.PI / 4); c.fillStyle = (i + j) % 2 ? "#dde1e4" : "#8f959a"; c.fillRect(-6, -1.6, 12, 3.2); c.restore(); }
  }, { repeat: [3, 3] });
}

/* ------------------------------------------------------------------ componentes */
function plano(pai, x0, x1, z0, z1, y, material){
  const g = new BufferGeometry();
  const P = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  g.setAttribute("position", new Float32BufferAttribute(P.flatMap(([x, z]) => [x, y, z]), 3));
  g.setAttribute("normal", new Float32BufferAttribute(P.flatMap(() => [0, 1, 0]), 3));
  g.setAttribute("uv", new Float32BufferAttribute(P.flatMap(([x, z]) => [(x - DECK.x0) / (DECK.x1 - DECK.x0), 1 - (z - DECK.z0) / (DECK.z1 - DECK.z0)]), 2));
  g.setIndex([0, 3, 2, 0, 2, 1]);
  const o = new Mesh(g, material); pai.add(o); return o;
}

/** guarda-corpo de troncos: postes redondos + trilho no topo + ripas horizontais opcionais */
export function guardaCorpo(pai0, a, b, { ripas = false, y0 = NIVEL.DECK } = {}){
  const pai = grupo(pai0);
  const tronco = mat(0x2a1d14, { roughness: .9 });
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / m(1.4))), H = m(1.1);
  for(let i = 0; i <= n; i++){
    const x = a[0] + (b[0] - a[0]) * i / n, z = a[1] + (b[1] - a[1]) * i / n;
    coluna(pai, x, z, y0, y0 + H, .3, tronco, 10);
  }
  barra(pai, [a[0], y0 + H + .05, a[1]], [b[0], y0 + H + .05, b[1]], .34, tronco, 10);
  if(ripas) [.35, .8, 1.25, 1.7, 2.15, 2.6].forEach(h => barra(pai, [a[0], y0 + h, a[1]], [b[0], y0 + h, b[1]], .13, mat(0x3a2a1e), 6));
  return pai;
}

/** escada plataforma de alumínio: plataforma de chapa xadrez a ~1,1 m, 2 degraus, corrimão */
export function escadaAluminio(pai, x, z, giro = 0){
  const g = grupo(pai, x, NIVEL.DECK, z); g.rotation.y = giro;
  const al = mat(0xc4c9cd, { metalness: .75, roughness: .35 }), xad = new MeshStandardMaterial({ map: texXadrez(), metalness: .5, roughness: .45 });
  const H = m(1.1), S = 3.4;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => coluna(g, sx * S / 2 * .92, sz * S / 2 * .92, 0, H, .12, al, 8));
  caixa(g, -S / 2, S / 2, H - .08, H + .04, -S / 2, S / 2, xad);
  [-1, 1].forEach(sx => { caixa(g, sx * S / 2 * .92 - .06, sx * S / 2 * .92 + .06, H, H + m(.95), -S / 2, -S / 2 + .12, al); barra(g, [sx * S / 2 * .92, H + m(.95), -S / 2 * .92], [sx * S / 2 * .92, H + m(.95), S / 2 * .92], .09, al, 6); coluna(g, sx * S / 2 * .92, S / 2 * .92, H, H + m(.95), .08, al, 6); coluna(g, sx * S / 2 * .92, -S / 2 * .92, H, H + m(.95), .08, al, 6); });
  barra(g, [-S / 2 * .92, H + m(.95), -S / 2 * .92], [S / 2 * .92, H + m(.95), -S / 2 * .92], .09, al, 6);
  for(let i = 0; i < 2; i++){ caixa(g, -S / 2 * .8, S / 2 * .8, H * (.33 + i * .33) - .05, H * (.33 + i * .33) + .05, S / 2 + .4 + (1 - i) * 1.3, S / 2 + 1.5 + (1 - i) * 1.3, al); }
  [-1, 1].forEach(sx => barra(g, [sx * S / 2 * .85, 0, S / 2 + 2.8], [sx * S / 2 * .85, H, S / 2 * .9], .1, al, 6));
  /* superfícies para subir: plataforma e 2 degraus (caixas [x0, x1, z0, z1, altura acima da base], no referencial da escada) */
  g.userData.sup = { x, z, giro, y0: NIVEL.DECK, caixas: [[-S / 2, S / 2, -S / 2, S / 2, H], [-S / 2 * .8, S / 2 * .8, S / 2 + 1.7, S / 2 + 2.8, H * .33], [-S / 2 * .8, S / 2 * .8, S / 2 + .4, S / 2 + 1.5, H * .66]] };
  return g;
}

/** escada verde de aço (andaime com rodízios): plataforma de chapa xadrez + 3 degraus + corrimão */
export function escadaVerde(pai, x, z, giro = 0, y = NIVEL.DECK){
  const g = grupo(pai, x, y, z); g.rotation.y = giro;
  const verde = mat(0x7f8a5a, { metalness: .55, roughness: .55 }), xad = new MeshStandardMaterial({ map: texXadrez(), metalness: .5, roughness: .45 });
  const H = m(1.05), S = 3.6;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { coluna(g, sx * S / 2, sz * S / 2, .3, H, .1, verde, 8); const r = new Mesh(new CylinderGeometry(.16, .16, .1, 10), mat(0x222222)); r.rotation.z = Math.PI / 2; r.position.set(sx * S / 2, .2, sz * S / 2); g.add(r); });
  caixa(g, -S / 2, S / 2, H - .06, H + .06, -S / 2, S / 2, xad);
  [[-S / 2, S / 2], [S / 2, S / 2]].forEach(([a, b]) => { void a; void b; });
  [-1, 1].forEach(sx => { barra(g, [sx * S / 2, H, -S / 2], [sx * S / 2, H, S / 2], .07, verde, 6); });
  barra(g, [-S / 2, H + m(.95), -S / 2], [S / 2, H + m(.95), -S / 2], .08, verde, 6);
  [-1, 1].forEach(sx => { coluna(g, sx * S / 2, -S / 2, H, H + m(.95), .08, verde, 6); barra(g, [sx * S / 2, H + m(.95), -S / 2], [sx * S / 2, H + m(.95), S / 2], .08, verde, 6); });
  for(let i = 0; i < 3; i++){ const f = (i + 1) / 4; caixa(g, -S / 2 * .9, S / 2 * .9, H * (1 - f) - .05, H * (1 - f) + .05, S / 2 + f * 3.0, S / 2 + f * 3.0 + 1.0, xad); }
  [-1, 1].forEach(sx => { barra(g, [sx * S / 2 * .92, H, S / 2], [sx * S / 2 * .92, 0.3, S / 2 + 4.2], .09, verde, 6); barra(g, [sx * S / 2 * .92, H + m(.8), S / 2], [sx * S / 2 * .92, m(.8), S / 2 + 3.6], .06, verde, 6); });
  barra(g, [-S / 2, .6, -S / 2], [S / 2, H * .6, S / 2], .06, verde, 5);
  g.userData.sup = { x, z, giro, y0: y, caixas: [[-S / 2, S / 2, -S / 2, S / 2, H], ...[1, 2, 3].map(i => { const f = i / 4; return [-S / 2 * .9, S / 2 * .9, S / 2 + f * 3.0, S / 2 + f * 3.0 + 1.0, H * (1 - f)]; })] };
  return g;
}

/* ------------------------------------------------------------------ plataforma completa */
export function criarPlataforma({ ag }){
  const g = grupo(ag);
  const topo = NIVEL.DECK, chao = NIVEL.CHAO, { x0, x1, z0, z1, nx1, nz1 } = DECK;
  const corpo = mat(0x1f1710, { roughness: .95 }), bordaM = mat(0x3a3029, { roughness: .8 });
  const piso = new MeshStandardMaterial({ map: texPiso(), roughness: .42, metalness: .08 });
  /* o deck é um "L": retângulo principal + a ponta do fundo (sem o recorte do lado das molas) */
  const blocos = [[nx1, x1, z0, z1], [x0, nx1, nz1, z1]];
  blocos.forEach(([a, b, c, d]) => {
    caixa(g, a, b, chao, topo - ESP, c, d, corpo);
    caixa(g, a - .05, b + .05, topo - ESP, topo, c - .05, d + .05, bordaM);
    plano(g, a, b, c, d, topo + .005, piso);
  });
  /* saia: tábuas horizontais + pilaretes (cobre todo o contorno) */
  const h = topo - chao, saia = texSaia();
  const face = (len, cx, cz, giro) => {
    const t = saia.clone(); t.needsUpdate = true; t.repeat.set(len / m(2), 1);
    const q = new Mesh(new PlaneGeometry(len, h), new MeshStandardMaterial({ map: t, roughness: .9 }));
    q.position.set(cx, chao + h / 2, cz); q.rotation.y = giro; g.add(q);
  };
  face(x1 - nx1, (nx1 + x1) / 2, z0 - .02, Math.PI); face(z1 - z0, x1 + .02, (z0 + z1) / 2, Math.PI / 2); face(x1 - x0, 0, z1 + .02, 0);
  face(z1 - nz1, x0 - .02, (nz1 + z1) / 2, -Math.PI / 2); face(nx1 - x0, (x0 + nx1) / 2, nz1 - .02, Math.PI); face(nz1 - z0, nx1 - .02, (z0 + nz1) / 2, -Math.PI / 2);
  /* fitas vermelhas com laço (cintas de ancoragem) deitadas no piso */
  [[8, 14, .3], [20, 30, -.5], [-8, 36, .9]].forEach(([x, z, r]) => {
    const f = grupo(g, x, topo + .03, z); f.rotation.y = r;
    const verm = mat(0xc0332b, { roughness: .7 });
    caixa(f, -.9, .9, 0, .05, -.07, .07, verm);
    const l1 = new Mesh(new TorusGeometry(.32, .04, 6, 14), verm); l1.rotation.x = Math.PI / 2; l1.position.set(.95, .05, 0); f.add(l1);
    const l2 = new Mesh(new TorusGeometry(.26, .04, 6, 14), verm); l2.rotation.x = Math.PI / 2; l2.position.set(-1.0, .05, .1); f.add(l2);
  });
  /* guarda-corpo de troncos: borda de trás, borda esquerda (depois da casinha), recorte das molas; a borda do lado do cânion fica livre (chegada dos clientes) */
  const SX0 = 8.4, SX1 = 16.6;                                                                  // abertura da escadinha de madeira (borda z = z1)
  const G6 = (id, nome, a, b) => ({ id, nome, obj: guardaCorpo(g, a, b), col: { x0: Math.min(a[0], b[0]) - .3, x1: Math.max(a[0], b[0]) + .3, z0: Math.min(a[1], b[1]) - .3, z1: Math.max(a[1], b[1]) + .3 } });
  const guardas = [
    G6("guarda-1", "Guarda-corpo 1 (borda esquerda, depois da casinha)", [-5, z0], [x1, z0]),
    G6("guarda-2", "Guarda-corpo 2 (borda de trás, esquerda)", [x0, z1], [SX0, z1]),
    G6("guarda-3", "Guarda-corpo 3 (borda de trás, direita)", [SX1, z1], [x1, z1]),
    G6("guarda-4", "Guarda-corpo 4 (borda do fundo, lado das molas)", [x0, nz1], [x0, z1]),
    G6("guarda-5", "Guarda-corpo 5 (recorte das molas, lado do cânion)", [nx1, z0], [nx1, nz1]),
    G6("guarda-6", "Guarda-corpo 6 (recorte das molas, lado de trás)", [x0, nz1], [nx1, nz1])
  ];
  /* escadinha de madeira (3 degraus) na borda de trás, com painel de ripas e placa de aviso */
  const madeira = mat(0x3b2a1e, { roughness: .85 }), dg = (topo - chao) / 3;
  for(let i = 0; i < 3; i++) caixa(g, SX0, SX1, topo - dg * (i + 1) - .05, topo - dg * (i + 1) + .05, z1 + .2 + i * 1.3, z1 + 1.5 + i * 1.3, madeira);
  [SX0, SX1].forEach(x => { coluna(g, x, z1 + .1, chao, topo + m(1.1), .3, mat(0x2a1d14), 10); barra(g, [x, topo + m(1.1), z1 + .1], [x, topo + m(.3), z1 + 4.2], .22, mat(0x2a1d14), 8); });
  [.35, .9, 1.45, 2.0, 2.55].forEach(hh => caixa(g, SX0 - .08, SX0 + .08, topo + hh, topo + hh + .26, z1 + .1, z1 + 3.6, mat(0x3a2a1e)));
  const aviso = placaLegivel(texAviso(), 1.7, 1.2); aviso.position.set(SX0 - .4, topo + m(1.2), z1 + .5); aviso.rotation.y = Math.PI / 2; g.add(aviso);
  /* escadas: uma de cada lado do trolley (cabo 07, x ≈ 3,5) */
  const escAlu = escadaAluminio(g, 10, 4.5, 0);
  const escVerde = escadaVerde(g, -3.5, 4.5, 0);

  /* ---- colisão e altura do chão ---- */
  const colisores = [];
  const parede = (a, b, c, d) => colisores.push({ x0: a, x1: b, z0: c, z1: d, y1: topo });         // saia: bloqueia quem está no chão (dá para pular em cima)
  parede(nx1, x1 + .3, z0 - .3, z0 + .1); parede(x1 - .1, x1 + .3, z0 - .3, z1 + .3); parede(x0 - .3, x1 + .3, z1 - .1, z1 + .3);
  parede(x0 - .3, x0 + .1, nz1 - .3, z1 + .3); parede(x0 - .3, nx1 + .1, nz1 - .3, nz1 + .1); parede(nx1 - .3, nx1 + .1, z0 - .3, nz1 + .3);
  guardas.forEach(gd => colisores.push({ ...gd.col, peca: gd.id }));
  const dentro = (x, z, f = .15) => (x >= nx1 - f && x <= x1 + f && z >= z0 - f && z <= z1 + f) || (x >= x0 - f && x <= nx1 + f && z >= nz1 - f && z <= z1 + f);
  const chaoNaPlataforma = (x, z) => {
    if(dentro(x, z)) return topo;
    if(x >= SX0 && x <= SX1 && z > z1 && z < z1 + 4.1){ const t = (z - z1) / 4.1; return Math.max(chao, topo - Math.floor(t * 3 + .999) * dg + 0); }   // 3 degraus
    return null;
  };
  return { grupo: g, guardas, escAlu, escVerde, colisores, chao: chaoNaPlataforma, dentro, topo, hotspots: [
    { id: "aviso-queda", x: (SX0 + SX1) / 2, z: z1 - 1.6, r: 3.6, rotulo: () => "Ler o aviso: risco de queda", acao: null, msg: "AVISO · RISCO DE QUEDA. A saída do deck é por aqui, pelos degraus. Cuidado com o piso molhado." }
  ] };
}
