import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, DoubleSide } from "three";
import { camera360 } from "./midia.js";
import { m, NIVEL, canvasTex, texPlacaHD, placaLegivel, rng, mat, caixa, coluna, barra, grupo } from "./lib.js";

/* ============================================================================================================
   CASINHA DA PLATAFORMA DE CHEGADA (medidas e detalhes das fotos; 1 m = 2,94 u)
   - cabana de madeira escura (tábuas horizontais finas), ≈ 2,9 × 2,9 m, telhado de UMA ÁGUA de telha metálica ondulada com fascia verde,
     beiral largo na frente, câmeras de CCTV, refletores, antena, hastes de para-raios na borda;
   - fundo (-x): porta estreita de treliça (abre para fora, E do mapa); lado do deck (+z): porta de correr de 2 folhas (F), placa "SAÍDA";
   - lado do cânion (+x): janela larga de treliça (2 × 8 vidros) com cortinas e placa "PLATAFORMA DE CHEGADA";
   - dentro: mesa de tampo laranja com 3 rádios, prancheta, notebook com adesivos e caixas de bateria; lixeiras, maleta; ganchos com equipamento.
   ============================================================================================================ */
export const CASA = { x0: -14, x1: -5.5, z0: -12.5, z1: -4 };            // mapa do usuário: ao lado do deck (z < -4), cabo 07 logo à frente; janela e parte alta do telhado voltadas ao cânion (+x)
const T = .35;                                                      // espessura das paredes
const HF = 7.6, HB = 6.7;                                           // altura das paredes na frente (+x) e no fundo (-x)
const PORTA_H = 6.4;

function texTabuas(){
  return canvasTex(128, 128, (c, w, h) => {
    const r = rng(3), n = 4, bh = h / n;
    c.fillStyle = "#17100b"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < n; i++){ const t = 36 + Math.floor(r() * 12); c.fillStyle = `rgb(${t + 8},${t + 3},${t - 3})`; c.fillRect(0, i * bh + 1.5, w, bh - 3);
      c.fillStyle = "rgba(255,255,255,.035)"; for(let k = 0; k < 6; k++) c.fillRect(r() * w, i * bh + 3 + r() * (bh - 6), 10 + r() * 30, 1); }
  }, { repeat: [1, 1] });
}
function texTelha(){
  return canvasTex(128, 128, (c, w, h) => {
    for(let i = 0; i < w; i++){ const k = .5 + .5 * Math.sin(i / w * Math.PI * 2 * 4); const t = Math.round(46 + k * 34); c.fillStyle = `rgb(${t - 6},${t + 2},${t + 6})`; c.fillRect(i, 0, 1.2, h); }
  }, { repeat: [1, 1] });
}
function texPlaca(txt1, txt2, bg = "#3f6b3a"){
  return texPlacaHD(256, 128, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = "#e7efe0"; c.textAlign = "center";
    if(txt2){ c.font = "bold 24px Arial"; c.fillText(txt1, w / 2, 48); c.font = "bold 40px Arial"; c.fillText(txt2, w / 2, 94); } else { c.font = "bold 44px Arial"; c.fillText(txt1, w / 2, 78); }
  });
}
function texTela(){
  return canvasTex(256, 160, (c, w, h) => {
    c.fillStyle = "#0e2a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#e0883a"; c.fillRect(0, 0, w, 20);
    c.fillStyle = "#cfe8ff"; c.font = "bold 12px monospace"; ["SGV · TIROLESA", "> checklist do trolley", "> frenagem", "> escala", "> procedimento / PAE"].forEach((t, i) => c.fillText(t, 10, 44 + i * 20));
  });
}

export function criarCasinha({ ag, y = NIVEL.DECK }){
  const g = grupo(ag, 0, y, 0);
  const X0 = CASA.x0, X1 = CASA.x1, Z0 = CASA.z0, Z1 = CASA.z1;
  const tab = texTabuas();
  const matParede = new MeshStandardMaterial({ map: tab, roughness: .9, transparent: true, opacity: 1 });
  const paredes = [], colisores = [];
  const alt = (x) => HB + (HF - HB) * (x - X0) / (X1 - X0);               // altura do topo da parede em x (telhado de uma água)
  const hmax = Math.max(HF, HB);

  /* parede: segmentos cheios entre vãos (cada vão com y0..y1); eixo "x" = ao longo de x (z fixo); "z" = ao longo de z (x fixo) */
  const parede = (eixo, fixo, a0, a1, vaos = []) => {
    const peca = (u0, u1, ya, yb, colide) => {
      if(u1 - u0 < .02 || yb - ya < .02) return;
      const mesh = eixo === "x" ? caixa(g, u0, u1, ya, yb, fixo - T / 2, fixo + T / 2, matParede) : caixa(g, fixo - T / 2, fixo + T / 2, ya, yb, u0, u1, matParede);
      paredes.push(mesh);
      if(colide) colisores.push(eixo === "x" ? { x0: u0, x1: u1, z0: fixo - T / 2, z1: fixo + T / 2 } : { x0: fixo - T / 2, x1: fixo + T / 2, z0: u0, z1: u1 });
    };
    const topo = (u) => (eixo === "z" ? alt(fixo) : alt(u));
    let cur = a0;
    [...vaos].sort((p, q) => p.a - q.a).forEach(v => {
      peca(cur, v.a, 0, topo((cur + v.a) / 2), true);
      if(v.y0 > 0) peca(v.a, v.b, 0, v.y0, true);
      peca(v.a, v.b, v.y1, topo((v.a + v.b) / 2), false);
      cur = v.b;
    });
    peca(cur, a1, 0, topo((cur + a1) / 2), true);
  };
  /* vãos (coordenadas absolutas) */
  const PE = { a: Z1 - 3.4, b: Z1 - .9 };                                      // porta de abrir: face da ESQUERDA de quem está dentro olhando para o deck (x = X0)
  const SC = { a: X0 + 1.5, b: X0 + 5.9 };                                        // porta de correr (face voltada para o deck, z = Z1): folha fixa A + folha B que desliza
  const JAN = { a: Z0 + 1.3, b: Z1 - 1.3, y0: 2.5, y1: 6.1 };            // janela larga (lado do cânion, +x)
  parede("z", X1, Z0, Z1, [{ ...JAN }]);
  parede("z", X0, Z0, Z1, [{ ...PE, y0: 0, y1: PORTA_H }]);
  parede("x", Z1, X0, X1, [{ a: SC.a, b: SC.b, y0: 0, y1: PORTA_H }]);
  parede("x", Z0, X0, X1);
  colisores.push({ x0: X1 - T / 2, x1: X1 + T / 2, z0: JAN.a, z1: JAN.b });
  /* piso escuro por dentro */
  const piso = canvasTex(256, 256, (c, w, h) => { const r = rng(9); c.fillStyle = "#1c150f"; c.fillRect(0, 0, w, h); for(let i = 0; i < 12; i++){ const t = 40 + Math.floor(r() * 16); c.fillStyle = `rgb(${t + 6},${t + 2},${t - 4})`; c.fillRect(i * 21.3 + 1, 0, 19, h); } }, { repeat: [3, 3] });
  const fl = caixa(g, X0 + T / 2, X1 - T / 2, .01, .05, Z0 + T / 2, Z1 - T / 2, new MeshStandardMaterial({ map: piso, roughness: .7 })); void fl;

  /* base de alvenaria sob a casinha (o piso dela fica na altura do deck) e dois degraus de madeira na saída da porta E, até o chão */
  const yChao = NIVEL.CHAO - NIVEL.DECK, madeira = mat(0x3b2a1e, { roughness: .85 });
  caixa(g, X0 - T / 2 - .05, X1 + T / 2 + .05, yChao, -.02, Z0 - T / 2 - .05, Z1 + T / 2 + .05, mat(0x1f1710, { roughness: .95 }));
  const DEGR = [{ x0: X0 - T / 2 - 1.3, x1: X0 - T / 2, y: yChao * .33 }, { x0: X0 - T / 2 - 2.6, x1: X0 - T / 2 - 1.3, y: yChao * .66 }];
  DEGR.forEach(d => caixa(g, d.x0, d.x1, yChao, d.y, PE.a - .3, PE.b + .3, madeira));
  const chaoCasa = (x, z) => {                                          // altura do piso dentro da casinha e nos degraus de saída (null = fora)
    if(x >= X0 - T / 2 && x <= X1 + T / 2 && z >= Z0 - T / 2 && z <= Z1 + T / 2) return y;
    if(z >= PE.a - .3 && z <= PE.b + .3) for(const d of DEGR) if(x >= d.x0 && x <= d.x1) return y + d.y;
    return null;
  };

  /* ---- telhado de uma água: telha ondulada + fascia verde + hastes de para-raios ---- */
  const tel = texTelha(); tel.repeat.set(9, 5);
  const rx0 = X0 - 1.0, rx1 = X1 + 2.7, rz0 = Z0 - 1.0, rz1 = Z1 + 1.0, ang = Math.atan2(HF - HB, X1 - X0);
  const roof = grupo(g, (rx0 + rx1) / 2, alt((rx0 + rx1) / 2) + .28, (rz0 + rz1) / 2); roof.rotation.z = ang;
  const rl = (rx1 - rx0) / Math.cos(ang), rw = rz1 - rz0;
  const telhado = new Mesh(new BoxGeometry(rl, .4, rw), [mat(0x2c3a2a), mat(0x2c3a2a), new MeshStandardMaterial({ map: tel, roughness: .5, metalness: .4 }), mat(0x1a1d1a), mat(0x2c3a2a), mat(0x2c3a2a)]); roof.add(telhado);
  const verde = mat(0x4f7a3e, { roughness: .7 });
  caixa(roof, -rl / 2, rl / 2, -.2, .2 + .1, -rw / 2 - .05, -rw / 2 + .15, verde); caixa(roof, -rl / 2, rl / 2, -.2, .3, rw / 2 - .15, rw / 2 + .05, verde); caixa(roof, rl / 2 - .15, rl / 2 + .05, -.2, .3, -rw / 2, rw / 2, verde);
  for(let i = 0; i < 6; i++){ const h = coluna(roof, -rl / 2 + 1.2 + i * (rl - 2.4) / 5, (i % 2 ? 1 : -1) * (rw / 2 - .4), .2, .2 + 2.6, .035, mat(0xcdd2d6, { metalness: .8, roughness: .3 }), 5); void h; }
  /* viga de tronco do beiral e pilares de canto */
  const tronco = mat(0x1f150e, { roughness: .9 });
  coluna(g, X1 + 1.2, Z0 - .2, 0, alt(X1 + 1.2) + .2, .5, tronco, 12); coluna(g, X1 + 1.2, Z1 + .2, 0, alt(X1 + 1.2) + .2, .5, tronco, 12);
  barra(g, [X1 + 1.2, alt(X1 + 1.2) - .5, Z0 - .2], [X1 + 1.2, alt(X1 + 1.2) - .5, Z1 + .2], .45, tronco, 10);

  /* ---- placas ---- */
  const placa = (tx, w, h, pos, rotY) => { const p = placaLegivel(tx, w, h); p.position.set(...pos); p.rotation.y = rotY; g.add(p); return p; };
  placa(texPlaca("SAÍDA"), 2.0, 1.0, [X0 - T / 2 - .03, PORTA_H + 1.05, (PE.a + PE.b) / 2], -Math.PI / 2);
  placa(texPlaca("SAÍDA"), 2.0, 1.0, [(SC.a + SC.b) / 2, PORTA_H + 1.05, Z1 + T / 2 + .03], 0);
  placa(texPlaca("PLATAFORMA DE", "CHEGADA"), 3.0, 1.5, [X1 + T / 2 + .04, 7.1, (Z0 + Z1) / 2], Math.PI / 2);

  /* ---- portas ---- */
  const aluM = mat(0x2a1e15, { roughness: .8 }), vidro = new MeshStandardMaterial({ color: 0xcfe0e6, transparent: true, opacity: .3, roughness: .1 });
  const trelica = (pai, w, h, nc, nl, esp = .16) => {
    caixa(pai, 0, w, 0, h, -.05, .05, vidro);
    caixa(pai, 0, esp, 0, h, -.09, .09, aluM); caixa(pai, w - esp, w, 0, h, -.09, .09, aluM); caixa(pai, 0, w, 0, esp, -.09, .09, aluM); caixa(pai, 0, w, h - esp, h, -.09, .09, aluM);
    for(let i = 1; i < nc; i++) caixa(pai, w * i / nc - .05, w * i / nc + .05, 0, h, -.08, .08, aluM);
    for(let j = 1; j < nl; j++) caixa(pai, 0, w, h * j / nl - .05, h * j / nl + .05, -.08, .08, aluM);
  };
  /* porta de abrir: dobradiça em z = PE.a, abre para fora (-x) */
  const pEst = grupo(g, X0 - T / 2 + .05, 0, PE.a); const folhaE = grupo(pEst, 0, 0, 0); folhaE.rotation.y = 0;
  const lE = grupo(folhaE); lE.rotation.y = -Math.PI / 2; trelica(lE, PE.b - PE.a, PORTA_H, 3, 8);   // eixo x local → ao longo de z do mundo
  /* porta de correr: folha A fixa + folha B que desliza para trás da A */
  const wFolha = (SC.b - SC.a) / 2;
  const fA = grupo(g, SC.a, 0, Z1 + T / 2 + .1); trelica(fA, wFolha, PORTA_H, 3, 8);
  const fB = grupo(g, SC.a + wFolha, 0, Z1 + T / 2 + .3); trelica(fB, wFolha, PORTA_H, 3, 8); const fBi = fB;
  caixa(fBi, wFolha * .06, wFolha * .06 + .1, 2.6, 3.9, .05, .2, mat(0xc9a64a, { metalness: .8, roughness: .3 }));      // puxador dourado
  const est = { k: 0, alvo: 0 }, cor = { k: 0, alvo: 0 };
  colisores.push({ x0: X0 - T / 2 - .4, x1: X0 + T / 2, z0: PE.a, z1: PE.b, ativo: () => est.k < .5 });
  colisores.push({ x0: SC.a, x1: SC.a + wFolha, z0: Z1 - T / 2, z1: Z1 + T / 2 + .4 });
  colisores.push({ x0: SC.a + wFolha, x1: SC.b, z0: Z1 - T / 2, z1: Z1 + T / 2 + .4, ativo: () => cor.k < .5 });

  /* ---- janela larga: 2 fileiras × 8 vidros, com cortina branca por dentro ---- */
  const jan = grupo(g, X1 + T / 2 + .02, JAN.y0, JAN.a); jan.rotation.y = -Math.PI / 2; { const w = JAN.b - JAN.a, h = JAN.y1 - JAN.y0; trelica(jan, w, h, 8, 2, .14); }
  const cortina = new Mesh(new PlaneGeometry(JAN.b - JAN.a, JAN.y1 - JAN.y0), new MeshStandardMaterial({ color: 0xf1f0ec, side: DoubleSide, transparent: true, opacity: .85, roughness: 1 }));
  cortina.position.set(X1 - T / 2 - .1, (JAN.y0 + JAN.y1) / 2, (JAN.a + JAN.b) / 2); cortina.rotation.y = Math.PI / 2; g.add(cortina);

  /* ---- detalhes de fora: refletores, antena, câmeras, caixa de passagem, eletroduto ---- */
  const branco = mat(0xe9ecee, { roughness: .5 }), preto = mat(0x15161a, { roughness: .6 });
  caixa(g, X1 - 2, X1 - 1.2, 5.5, 5.9, Z0 - T / 2 - .25, Z0 - T / 2, branco); caixa(g, X1 - 4.6, X1 - 3.8, 5.5, 5.9, Z0 - T / 2 - .25, Z0 - T / 2, branco);   // refletores LED
  caixa(g, X0 + 2.8, X0 + 3.9, 3.0, 4.1, Z0 - T / 2 - .3, Z0 - T / 2, branco);                                                               // caixa de passagem
  coluna(g, X0 + 3.3, Z0 - T / 2 - .06, .4, 6.2, .07, preto, 6);                                                                                // eletroduto
  const ant = new Mesh(new SphereGeometry(.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), branco); ant.rotation.x = Math.PI / 2; ant.position.set(X1 - .6, 5.9, Z0 - T / 2 - .55); g.add(ant);
  [[X1 + 2.4, hmax + .3, Z0 - .1], [X1 + 2.4, hmax + .3, Z1 + .1]].forEach(([x, yy, z]) => { const c = new Mesh(new CylinderGeometry(.18, .18, .8, 10), branco); c.rotation.z = Math.PI / 2; c.position.set(x, yy - 1.1, z); g.add(c); });   // câmeras no beiral

  /* ---- interior (base nas fotos) ---- */
  const lar = mat(0xd8782a, { roughness: .55 }), metal = mat(0x2a2c30, { roughness: .5, metalness: .4 }), prata = mat(0xc4c8cc, { metalness: .6, roughness: .35 });
  const dx0 = X0 + T / 2, dz0 = Z0 + 1.3, dz1 = Z0 + 5.0, mesaH = 2.2;
  caixa(g, dx0, dx0 + 1.8, mesaH - .08, mesaH, dz0, dz1, lar);                                                         // mesa de tampo laranja
  [[dx0 + .1, dz0 + .1], [dx0 + .1, dz1 - .1], [dx0 + 1.7, dz0 + .1], [dx0 + 1.7, dz1 - .1]].forEach(([x, z]) => caixa(g, x - .05, x + .05, 0, mesaH - .08, z - .05, z + .05, metal));
  [[dz0 + .55, 0], [dz0 + 1.05, .02], [dz0 + 1.55, 0]].forEach(([z, d], i) => {                                           // 3 rádios laranja
    caixa(g, dx0 + .5, dx0 + .78, mesaH, mesaH + .95, z - .13, z + .13, mat(i === 1 ? 0xd8782a : 0xf08a1c, { roughness: .45 })); coluna(g, dx0 + .64, z, mesaH + .95, mesaH + 1.85, .025, metal, 5); void d; });
  const tela = new Mesh(new PlaneGeometry(1.15, .8), new MeshBasicMaterial({ map: texTela() }));
  caixa(g, dx0 + .9, dx0 + 1.5, mesaH, mesaH + .06, dz1 - 1.5, dz1 - .35, prata);                                      // notebook (base)
  const nb = grupo(g, dx0 + .92, mesaH + .06, dz1 - .92); nb.rotation.z = -.35; caixa(nb, -.04, .04, 0, .85, -.55, .55, prata); tela.rotation.y = Math.PI / 2; tela.position.set(.06, .42, 0); nb.add(tela);
  caixa(g, dx0 + .2, dx0 + .9, mesaH, mesaH + .03, dz0 + .08, dz0 + .5, mat(0xdfe2e4));                                // prancheta
  caixa(g, dx0 + 1.0, dx0 + 1.7, mesaH, mesaH + .9, dz1 - .45, dz1 - .05, mat(0x1c1c1e)); caixa(g, dx0 + 1.0, dx0 + 1.7, mesaH, mesaH + .9, dz1 - 1.05, dz1 - .6, mat(0x232326));   // caixas de bateria
  /* embaixo da mesa */
  caixa(g, dx0 + .3, dx0 + 1.1, 0, 1.7, dz0 + .1, dz0 + .9, mat(0xefeeea, { roughness: .7 }));                          // lixeira branca (pedal)
  caixa(g, dx0 + .3, dx0 + 1.1, 0, 1.4, dz0 + 1.05, dz0 + 1.85, mat(0x2f57b5, { roughness: .6 })); coluna(g, dx0 + .7, dz0 + 1.45, 1.4, 1.9, .26, mat(0x8fd0ec, { transparent: true, opacity: .6 }), 12);   // lixeira azul + garrafão
  caixa(g, dx0 + .3, dx0 + 1.15, 0, .9, dz0 + 2.0, dz0 + 3.2, mat(0x1b1d20)); caixa(g, dx0 + .5, dx0 + .95, .9, 1.0, dz0 + 2.3, dz0 + 3.0, mat(0xe9c21a));   // maleta + martelo amarelo
  /* ganchos na parede do fundo: placa de ancoragem laranja, mosquetões, capacete laranja, corda */
  const pare = dx0 + .02;
  [[dz0 + .5, 5.1], [dz0 + 1.3, 5.3], [dz0 + 2.0, 5.0], [dz0 + 2.8, 5.2]].forEach(([z, yy], i) => { const t = new Mesh(new TorusGeometry(.17, .035, 6, 12), prata); t.position.set(pare + .06, yy, z); t.rotation.y = Math.PI / 2; g.add(t); void i; });
  caixa(g, pare, pare + .08, 4.9, 5.7, dz0 + 1.55, dz0 + 2.2, mat(0xf29a2e, { roughness: .5 }));                       // placa laranja
  { const hc = new Mesh(new SphereGeometry(.45, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf07a18, { roughness: .45 })); hc.position.set(pare + .45, 4.6, Z0 + T / 2 + .6); g.add(hc); }
  { const co = new Mesh(new TorusGeometry(.5, .08, 6, 16), mat(0xe6742a)); co.position.set(pare + .1, 3.6, Z0 + T / 2 + .5); co.rotation.y = Math.PI / 2; g.add(co); }
  placa(texPlaca("PROIBIDO FUMAR", "", "#2c5a36"), 1.2, .6, [pare + .06, 6.0, Z0 + T / 2 + 1.0], Math.PI / 2);
  caixa(g, pare, pare + .15, 3.2, 4.0, dz1 - .7, dz1 - .1, mat(0x6b6e72, { metalness: .4 }));                           // caixa elétrica pequena


  /* placa AVISO na folha fixa da porta de correr (face de dentro): "Acesso ao deck somente com equipamentos de segurança e com autorização dos condutores" */
  { const tx = texPlacaHD(256, 256, (c, w, h) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#c8202a"; c.fillRect(0, 0, w, 50); c.fillRect(8, 172, w - 16, 52); c.fillStyle = "#fff"; c.font = "bold 40px Arial"; c.textAlign = "center"; c.fillText("AVISO", w / 2, 40);
      c.fillStyle = "#222"; c.font = "bold 13px Arial"; ["ACESSO AO DECK SOMENTE COM", "EQUIPAMENTOS DE SEGURANÇA E COM", "AUTORIZAÇÃO DOS CONDUTORES."].forEach((t, i) => c.fillText(t, w / 2, 76 + i * 20));
      c.fillStyle = "#fff"; c.font = "bold 17px Arial"; c.fillText("OBRIGADO PELA", w / 2, 194); c.fillText("GENTILEZA", w / 2, 214); c.fillStyle = "#9a1a22"; c.font = "bold 12px Arial"; c.fillText("VERTICAL", w / 2, 244); });
    const pl = placaLegivel(tx, 1.7, 1.7); pl.position.set(SC.a + wFolha * .5, 4.1, Z1 - T / 2 - .07); pl.rotation.y = Math.PI; g.add(pl); }
  /* segundo monitor, estojo preto com cordão roxo, banquinho de pinus e a câmera 360 com o bastão */
  caixa(g, dx0 + 1.45, dx0 + 1.55, mesaH + .55, mesaH + 1.65, dz0 + .85, dz0 + 2.05, mat(0x0b0b0d, { roughness: .4 })); caixa(g, dx0 + 1.35, dx0 + 1.65, mesaH, mesaH + .08, dz0 + 1.25, dz0 + 1.65, metal);
  caixa(g, dx0 + 1.0, dx0 + 1.5, mesaH, mesaH + .22, dz0 + 2.1, dz0 + 2.55, mat(0x15161a, { roughness: .5 })); { const lan = new Mesh(new TorusGeometry(.17, .02, 6, 16), mat(0x6a3da8)); lan.rotation.x = Math.PI / 2; lan.position.set(dx0 + 1.25, mesaH + .03, dz0 + 2.55); g.add(lan); }
  { const bx = X1 - 1.6, bz = Z0 + 1.2, banq = grupo(g, bx, 0, bz);
    caixa(banq, -.7, .7, 1.55, 1.7, -.7, .7, mat(0xe0a050, { roughness: .6 })); [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]].forEach(([x, z]) => caixa(banq, x - .05, x + .05, 0, 1.55, z - .05, z + .05, metal));
    const cm = camera360({ escala: 1, comprimento: 1.7 }); cm.rotation.set(Math.PI / 2 - .2, .6, 0); cm.position.set(-.1, 1.78, .2); banq.add(cm); }
  /* ---- hotspots ---- */
  const alterna = (o) => { o.alvo = o.alvo ? 0 : 1; };
  const hotspots = [
    { id: "porta-estreita-dentro", x: X0 + 1.1, z: (PE.a + PE.b) / 2, r: 2.2, rotulo: () => (est.alvo ? "Fechar a porta de saída" : "Abrir a porta de saída (E)"), acao: () => alterna(est) },
    { id: "porta-estreita", x: X0 - 1.9, z: (PE.a + PE.b) / 2, r: 2.8, rotulo: () => (est.alvo ? "Fechar a porta" : "Abrir a porta"), acao: () => alterna(est) },
    { id: "porta-correr", x: (SC.a + SC.b) / 2, z: Z1 + 1.8, r: 4.2, rotulo: () => (cor.alvo ? "Fechar a porta de correr" : "Abrir a porta de correr"), acao: () => alterna(cor) },
    { id: "computador", x: dx0 + 3.4, z: dz1 - 1.0, r: 3.0, rotulo: () => "Usar o notebook", acao: null },
    { id: "radios", x: dx0 + 3.4, z: dz0 + .7, r: 2.6, rotulo: () => "Ver os rádios", acao: null, msg: "Três rádios HT laranja carregados na mesa: canal da operação, canal do lançamento e canal de emergência." },
    { id: "camera360", x: X1 - 3.4, z: Z0 + 2.8, r: 2.8, rotulo: () => "Ver a câmera 360 (pacote mídia)", acao: null, msg: "CAMERA 2 · câmera 360° do pacote mídia. Vai clipada numa ancoragem do cinto, nas costas (escápula); o cliente segura o bastão com a mão esquerda. Cordão amarelo e mosquetão de aço evitam a queda." },
    { id: "aviso-porta", x: SC.a + wFolha * .5, z: Z1 - 1.6, r: 2.4, rotulo: () => "Ler o aviso da porta", acao: null, msg: "AVISO · Acesso ao deck somente com equipamentos de segurança e com autorização dos condutores. Obrigado pela gentileza." },
    { id: "ganchos", x: dx0 + 3.0, z: dz0 + 2.0, r: 2.6, rotulo: () => "Ver o equipamento dos ganchos", acao: null, msg: "Roldana, mosquetões, placa de ancoragem, capacete e corda: o kit de resgate fica aqui, à mão." }
  ];

  const lerp = (a, b, k) => a + (b - a) * k;
  let fade = 1;
  const dentro = (x, z, folga = 0) => x > X0 - folga && x < X1 + folga && z > Z0 - folga && z < Z1 + folga;
  function tick(dt, px, pzz){
    est.k = lerp(est.k, est.alvo, Math.min(1, dt * 4)); cor.k = lerp(cor.k, cor.alvo, Math.min(1, dt * 4));
    pEst.rotation.y = -est.k * 1.75;                      // gira em torno da dobradiça (z = PE.a), abrindo para fora (-x)
    fB.position.x = SC.a + wFolha - cor.k * wFolha * .96;
    const in_ = dentro(px, pzz, -.25);
    fade = lerp(fade, in_ ? 0 : 1, Math.min(1, dt * 6));
    matParede.opacity = .16 + .84 * fade; matParede.depthWrite = fade > .6; telhado.visible = fade > .45; roof.visible = fade > .45;
  }
  return { grupo: g, colisores, hotspots, tick, dentro, chao: chaoCasa, paredes, limites: { x0: X0, x1: X1, z0: Z0, z1: Z1 }, aberturas: { est, cor } };
}
