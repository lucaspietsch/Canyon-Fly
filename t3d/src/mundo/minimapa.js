import { Mesh, CylinderGeometry, ConeGeometry, RingGeometry, MeshBasicMaterial, Group, AdditiveBlending, DoubleSide, Color } from "three";
import { U, MAPA, FAUNA } from "./config.js";

/* ============================================================================================================
   MINIMAPA (canto superior direito) + MAPA GRANDE (tecla M)
   Canvas 2D desenhado a partir dos dados do cenário (terreno, trilhas, rios, bordas, locais); ~10 vezes por segundo; nenhuma segunda câmera 3D.
   Gira com o jogador (a seta aponta para onde ele olha) ou trava o norte (botão N). Escurece de noite, mostra o relógio, os grupos de visitantes, a equipe do ICMBio quando
   perto, as camionetes e os animais SÓ quando estão no raio de visão (ou foram avistados há pouco). No mapa grande, clicar marca um destino: linha/seta no minimapa e feixe no mundo.
   ============================================================================================================ */

const TH = 1.15;                                                       // o eixo X do mundo aponta para o rumo 65,9°
const NORTE = [Math.cos(-TH), Math.sin(-TH)];                          // direção do norte verdadeiro no mundo (x, z)

export function criarMinimapa(M){
  const { cen, ciclo } = M;
  const S = { zoom: MAPA.zoomInicial, norteFixo: false, tAcc: 0, grande: false, destino: null, el: null, cv: null, ctx: null, big: null, bigCv: null, tam: MAPA.tamanho, J: null, ui: null, escala: 1, bigInfo: null, chegou: false };
  const PX = [.1, .17, .28, .45, .75];                                    // px por unidade (zoom)
  const FONTE = "font:700 11px ui-monospace,Consolas,'Courier New',monospace;";
  const { terraPoli, BORDA_PTS } = cen.campo, TR = cen.trilhas, A = cen.rios.ARROIO, AREA = cen.area, E = cen.estac;
  const PK = E.PKW(0, 0), launch = cen.lancamento, deckC = [0, 34];
  const locais = () => [
    { id: "rec", nome: "Recebimento (chegada da tirolesa)", x: 30, z: 18, cor: "#e0883a", ic: "R" }, { id: "est", nome: "Estacionamento", x: PK[0], z: PK[1], cor: "#5aa0e0", ic: "P" },
    { id: "lan", nome: "Largada da tirolesa (lançamento)", x: launch.x + 6, z: 28, cor: "#e8c32a", ic: "L" }, { id: "che", nome: "Chegada da tirolesa (deck)", x: deckC[0], z: deckC[1], cor: "#e0883a", ic: "C" },
    { id: "ban", nome: "Banheiros", x: E.PKW(...E.banheiro)[0], z: E.PKW(...E.banheiro)[1], cor: "#5ec8c8", ic: "W", so: "grande" }, { id: "amb", nome: "Ambulância de apoio", x: E.PKW(...E.ambulancia)[0], z: E.PKW(...E.ambulancia)[1], cor: "#e8e8e8", ic: "+", so: "grande" },
    { id: "lan2", nome: "Lanchonete", x: E.PKW(...E.lanchonete)[0], z: E.PKW(...E.lanchonete)[1], cor: "#5ec8c8", ic: "▣", so: "grande" },
    { id: "cas", nome: "Cachoeira Gravata do Noivo", x: cen.campo.BORDA - 4, z: cen.terreno.zq, cor: "#9fd4ff", ic: "≈", so: "grande" }
  ];
  let _mir = null;
  const mirantes = () => { if(_mir) return _mir; if(!M.gente) return []; const L = []; M.gente.mirantes().forEach(([x, z]) => { if(L.every(q => Math.hypot(q.x - x, q.z - z) > 140)) L.push({ id: "mir" + L.length, nome: "Mirante", x, z, cor: "#c8e86a", ic: "M" }); }); return (_mir = L); };
  const camionetes = () => (M.camionetes ? M.camionetes.lista.map(v => [v.x, v.z]) : []);

  /* ---- transformação mundo → mapa ---- */
  const base = () => { const J = S.J || { x: 0, z: 0, camYaw: 0 }; const f = S.norteFixo || S.grande ? NORTE : [-Math.sin(J.camYaw || 0), -Math.cos(J.camYaw || 0)]; return { f, r: [-f[1], f[0]] }; };
  const proj = (x, z, cx, cy, esc, ox, oz, B) => { const dx = x - ox, dz = z - oz; return [cx + (dx * B.r[0] + dz * B.r[1]) * esc, cy - (dx * B.f[0] + dz * B.f[1]) * esc]; };
  const inv = (px, py, cx, cy, esc, ox, oz, B) => { const sx = (px - cx) / esc, sy = -(py - cy) / esc; return [ox + sx * B.r[0] + sy * B.f[0], oz + sx * B.r[1] + sy * B.f[1]]; };

  function caminho(c, L, cx, cy, esc, ox, oz, B, fecha){ c.beginPath(); L.forEach((p, i) => { const q = proj(p[0], p[1], cx, cy, esc, ox, oz, B); if(i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); if(fecha) c.closePath(); }

  function desenha(c, W, Hh, esc, ox, oz, grande){
    const B = base(), cx = W / 2, cy = Hh / 2, E2 = ciclo.estado, noite = E2.noite || 0;
    c.clearRect(0, 0, W, Hh);
    c.fillStyle = "#1c3042"; c.fillRect(0, 0, W, Hh);                                  // o vão do cânion
    /* terra firme */
    c.fillStyle = "#4a5a34"; caminho(c, terraPoli, cx, cy, esc, ox, oz, B, true); c.fill();
    /* corredor da estrada (campo em volta dela), mata do KML e cidade/vila */
    if(M.estrada && M.estrada.len){ c.save(); c.lineJoin = "round"; c.strokeStyle = "#4a5a34"; c.lineWidth = Math.max(3, M.estrada.CW * esc * 1.3); caminho(c, M.estrada.pts, cx, cy, esc, ox, oz, B, false); c.stroke(); c.restore(); }
    if(M.vegetacao){ c.fillStyle = "rgba(46,118,46,.6)"; [...M.vegetacao.base.A.mata, ...M.vegetacao.base.A.mataBaixa].forEach(o => { caminho(c, o.pts, cx, cy, esc, ox, oz, B, true); c.fill(); }); }
    if(M.zonas) M.zonas.urbano.forEach(u => { c.fillStyle = u.tipo === "vila" ? "#6b6a5a" : u.tipo === "olaria" ? "#4a3a5a" : u.tipo === "industrial" ? "#5a5a4a" : "#74705e"; caminho(c, u.poli, cx, cy, esc, ox, oz, B, true); c.fill(); c.strokeStyle = "#d8c36a"; c.lineWidth = grande ? 2 : 1.4; c.stroke();
      c.strokeStyle = "#b8b6a4"; c.lineWidth = Math.max(.8, 26 * esc); (u.ruas || []).forEach(R => { caminho(c, R, cx, cy, esc, ox, oz, B, false); c.stroke(); }); });
    /* borda do cânion */
    c.strokeStyle = "#c9b98a"; c.lineWidth = grande ? 3 : 2; caminho(c, BORDA_PTS, cx, cy, esc, ox, oz, B, false); c.stroke();
    /* rios */
    c.strokeStyle = "#5aa9e0"; c.lineWidth = grande ? 3 : 2; c.lineJoin = "round"; caminho(c, A, cx, cy, esc, ox, oz, B, false); c.stroke();
    c.strokeStyle = "#3b86c2"; c.lineWidth = grande ? 4 : 2.4; [cen.rios.TIGRE, cen.rios.FORT].forEach(L => { if(L) { caminho(c, L, cx, cy, esc, ox, oz, B, false); c.stroke(); } });
    /* trilhas */
    c.lineWidth = grande ? 3 : 1.8; c.strokeStyle = "#d7b57a"; caminho(c, TR.TM, cx, cy, esc, ox, oz, B, false); c.stroke(); c.strokeStyle = "#c89a5a"; caminho(c, TR.TB, cx, cy, esc, ox, oz, B, false); c.stroke(); c.strokeStyle = "#b8894e"; caminho(c, TR.TREC, cx, cy, esc, ox, oz, B, false); c.stroke();
    /* estrada completa: parque → Cambará do Sul → Vila Ouro Verde */
    if(M.estrada && M.estrada.len){ const P = M.estrada.pts; c.lineWidth = grande ? 3 : 2; c.lineJoin = "round"; c.strokeStyle = "#e0643a"; caminho(c, P, cx, cy, esc, ox, oz, B, false); c.stroke(); }
    /* cercado do recebimento */
    { const R = [[AREA.x0, AREA.z0], [AREA.x1, AREA.z0], [AREA.x1, AREA.z1], [AREA.x0, AREA.z1]]; c.strokeStyle = "#e0883a"; c.lineWidth = 1.2; caminho(c, R, cx, cy, esc, ox, oz, B, true); c.stroke(); }
    /* locais */
    const marca = (p, tam) => { const q = proj(p.x, p.z, cx, cy, esc, ox, oz, B); if(q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > Hh + 20) return q; c.fillStyle = p.cor; c.beginPath(); c.arc(q[0], q[1], tam, 0, 7); c.fill(); c.strokeStyle = "rgba(0,0,0,.7)"; c.lineWidth = 1.2; c.stroke(); c.fillStyle = "#101010"; c.font = FONTE.replace("11px", Math.round(tam * 1.15) + "px"); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(p.ic, q[0], q[1] + .5); return q; };
    const ps = locais().filter(p => !p.so || grande), tam = grande ? 10 : 6.5;
    ps.forEach(p => { const q = marca(p, tam); if(grande && esc > .05){ c.fillStyle = "#fff"; c.font = "700 12px system-ui,sans-serif"; c.textAlign = "left"; c.textBaseline = "middle"; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 3; c.strokeText(p.nome, q[0] + 14, q[1]); c.fillText(p.nome, q[0] + 14, q[1]); } });
    /* lugares do KML: praça, Sequoia Lunar, Urna do Tempo, fábrica Cambará S/A, Vila Ouro Verde */
    if(M.lugares) M.lugares.icones().forEach(ic => { const q = proj(ic.x, ic.z, cx, cy, esc, ox, oz, B); if(q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > Hh + 20) return; const r = grande ? 8 : 4.6;
      c.save(); c.translate(q[0], q[1]);
      if(ic.tipo === "sequoia"){ c.fillStyle = "#2f7a3a"; c.strokeStyle = "#0e2a14"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -r * 1.5); c.lineTo(r, r * .5); c.lineTo(-r, r * .5); c.closePath(); c.fill(); c.stroke(); c.fillStyle = "#8c4128"; c.fillRect(-r * .18, r * .5, r * .36, r * .6); }
      else if(ic.tipo === "urna"){ c.fillStyle = "#e8b84a"; c.strokeStyle = "#5a3a08"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r * .45, -r); c.lineTo(r * .45, -r); c.lineTo(r * .9, r * .2); c.lineTo(r * .5, r); c.lineTo(-r * .5, r); c.lineTo(-r * .9, r * .2); c.closePath(); c.fill(); c.stroke(); }
      else if(ic.tipo === "praca"){ c.fillStyle = "#bfe8a0"; c.strokeStyle = "#2a4a1a"; c.lineWidth = 1.2; c.beginPath(); c.rect(-r * .8, -r * .8, r * 1.6, r * 1.6); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-r * .8, -r * .8); c.lineTo(r * .8, r * .8); c.moveTo(r * .8, -r * .8); c.lineTo(-r * .8, r * .8); c.stroke(); }
      else if(ic.tipo === "fabrica"){ c.fillStyle = "#9aa4ac"; c.strokeStyle = "#20262a"; c.lineWidth = 1.2; c.fillRect(-r, -r * .2, r * 2, r * 1.2); c.strokeRect(-r, -r * .2, r * 2, r * 1.2); c.fillStyle = "#c4352a"; c.fillRect(r * .35, -r * 1.3, r * .5, r * 1.2); }
      else { c.fillStyle = "#e9d6a0"; c.strokeStyle = "#4a3a1a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(r * .7, r * .9); c.lineTo(-r * .7, r * .9); c.lineTo(-r, 0); c.closePath(); c.fill(); c.stroke(); }
      c.restore();
      if(grande){ c.fillStyle = "#fff"; c.font = "700 11px system-ui,sans-serif"; c.textAlign = "left"; c.textBaseline = "middle"; c.strokeStyle = "rgba(0,0,0,.85)"; c.lineWidth = 3; c.strokeText(ic.nome, q[0] + r + 5, q[1]); c.fillText(ic.nome, q[0] + r + 5, q[1]); } });
    /* viagem rápida: ícones (clicáveis no mapa grande) */
    S.hitsViagem = []; if(M.viagem) M.viagem.destinos().forEach(d => { const q = proj(d.pos.x, d.pos.z, cx, cy, esc, ox, oz, B); if(q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > Hh + 20) return; const r = grande ? 11 : 6;
      c.fillStyle = "#2fa8e8"; c.strokeStyle = "#fff"; c.lineWidth = 1.6; c.beginPath(); c.arc(q[0], q[1], r, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#06263a"; c.font = "800 " + (r + 1) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("⇄", q[0], q[1] + .5);
      if(grande){ c.fillStyle = "#cfefff"; c.font = "700 12px system-ui,sans-serif"; c.textAlign = "left"; c.strokeStyle = "rgba(0,0,0,.85)"; c.lineWidth = 3; c.strokeText("Viagem: " + d.nome, q[0] + 16, q[1] + 16); c.fillText("Viagem: " + d.nome, q[0] + 16, q[1] + 16); S.hitsViagem.push({ id: d.id, x: q[0], y: q[1], r: r + 6 }); } });
    mirantes().forEach(p => { const q = marca(p, grande ? 8 : 4.5); if(grande){ c.fillStyle = "#e8f6b0"; c.font = "700 11px system-ui,sans-serif"; c.textAlign = "left"; c.strokeStyle = "rgba(0,0,0,.8)"; c.lineWidth = 3; c.strokeText("Mirante", q[0] + 11, q[1]); c.fillText("Mirante", q[0] + 11, q[1]); } });
    /* camionetes do ICMBio */
    camionetes().forEach(([x, z], i) => { if(i) return; const q = proj(x, z, cx, cy, esc, ox, oz, B); c.fillStyle = "#2f8a40"; c.fillRect(q[0] - 7, q[1] - 4, 14, 8); c.fillStyle = "#fff"; c.font = "700 6px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ICMBio", q[0], q[1] + .5); });
    /* turfeiras (verde-azulado), passarelas, nascentes (gota), placas ("i") e seta do vento */
    if(M.vegetacao){ const T = M.vegetacao.turfeira; c.save(); T.polis().forEach(p => { if(p.bb[1] < S.J.x - 9000) return; c.beginPath(); p.pts.forEach((q, i) => { const w = proj(q[0], q[1], cx, cy, esc, ox, oz, B); if(i) c.lineTo(w[0], w[1]); else c.moveTo(w[0], w[1]); }); c.closePath(); c.fillStyle = "rgba(46,146,150,.42)"; c.fill(); c.strokeStyle = "rgba(120,210,205,.8)"; c.lineWidth = 1; c.stroke(); }); c.restore();
      M.vegetacao.passarelas.runs().forEach(r => { c.strokeStyle = "#8a5a2a"; c.lineWidth = grande ? 5 : 3.5; c.beginPath(); r.pts.forEach((q, i) => { const w = proj(q.x, q.z, cx, cy, esc, ox, oz, B); if(i) c.lineTo(w[0], w[1]); else c.moveTo(w[0], w[1]); }); c.stroke(); });
      T.nascentes().forEach(n => { const w = proj(n.x, n.z, cx, cy, esc, ox, oz, B); c.fillStyle = "#58b8ee"; c.beginPath(); c.moveTo(w[0], w[1] - 5.5); c.quadraticCurveTo(w[0] + 4.5, w[1] + 1, w[0], w[1] + 3.5); c.quadraticCurveTo(w[0] - 4.5, w[1] + 1, w[0], w[1] - 5.5); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = .8; c.stroke(); });
      M.vegetacao.placas.lista().forEach(p => { const w = proj(p.x, p.z, cx, cy, esc, ox, oz, B); c.fillStyle = "#1f7a8a"; c.beginPath(); c.arc(w[0], w[1], grande ? 5 : 3.6, 0, 7); c.fill(); c.fillStyle = "#fff"; c.font = "800 " + (grande ? 8 : 6) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("i", w[0], w[1] + .4); }); }
    if(M.vento && S.J){ const w = M.vento.U.uVento.value, vx = w.x * B.r[0] + w.y * B.r[1], vy = -(w.x * B.f[0] + w.y * B.f[1]), l = Math.hypot(vx, vy) || 1, px = 18, py = Hh - 18, k = 7 + 7 * Math.min(1, w.z);
      c.save(); c.strokeStyle = "rgba(235,245,255,.85)"; c.fillStyle = "rgba(235,245,255,.85)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px - vx / l * k, py - vy / l * k); c.lineTo(px + vx / l * k, py + vy / l * k); c.stroke(); c.beginPath(); c.moveTo(px + vx / l * k, py + vy / l * k); c.lineTo(px + vx / l * (k - 5) - vy / l * 3, py + vy / l * (k - 5) + vx / l * 3); c.lineTo(px + vx / l * (k - 5) + vy / l * 3, py + vy / l * (k - 5) - vx / l * 3); c.closePath(); c.fill(); c.restore(); }
    /* bombeiro civil (em deslocamento) e ambulância na estrada */
    if(M.resgate) M.resgate.pontosMapa().forEach(p => { const q = proj(p.x, p.z, cx, cy, esc, ox, oz, B); c.fillStyle = p.tipo === "bombeiro" ? "#d8231c" : "#f2f2f0"; c.fillRect(q[0] - 7, q[1] - 4, 14, 8); c.fillStyle = p.tipo === "bombeiro" ? "#fff" : "#d8231c"; c.font = "700 5.5px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(p.tipo === "bombeiro" ? "Bombeiro" : "192", q[0], q[1] + .5); });
    /* gente: grupos como pontos discretos; equipe do ICMBio só dentro do raio de visão */
    if(M.gente){ M.gente.pontosMapa().forEach(g => { if(g.icm) return; const q = proj(g.x, g.z, cx, cy, esc, ox, oz, B); if(q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > Hh) return; c.fillStyle = "rgba(235,235,225,.9)"; c.beginPath(); c.arc(q[0], q[1], grande ? 3 : 2.2, 0, 7); c.fill(); });
      M.gente.equipePosicoes().forEach(e => { if(e.oculto) return; const d = S.J ? Math.hypot(e.x - S.J.x, e.z - S.J.z) / U : 999; if(d > MAPA.raioVisao && !grande) return; if(grande && d > MAPA.raioVisao * 3) return; const q = proj(e.x, e.z, cx, cy, esc, ox, oz, B); c.fillStyle = "#2f8a40"; c.beginPath(); c.arc(q[0], q[1], 3.3, 0, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1; c.stroke(); }); }
    /* animais: só se avistados há pouco (nada de rastrear) */
    const agora = performance.now();
    M.fauna.animais.forEach(a => { if(!a.avistadoT || agora - a.avistadoT > MAPA.avistadoSeg * 1000) return; const q = proj(a.x, a.z, cx, cy, esc, ox, oz, B), cor = { lobo: "#e0642a", puma: "#c9a46a", graxaim: "#a8a090", capivara: "#8a5b3c", veado: "#c98a54", quati: "#7a5a3a", gamba: "#b8b4aa", lontra: "#6a4e3a" }[a.id] || "#fff"; c.fillStyle = cor; c.beginPath(); c.arc(q[0], q[1], grande ? 6 : 4.2, 0, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.2; c.stroke(); c.fillStyle = "#101010"; c.font = "700 7px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(a.nome[0], q[0], q[1] + .5); });
    /* objetivo da missão atual (verde, pulsando) */
    if(S.objetivo){ const q = proj(S.objetivo.x, S.objetivo.z, cx, cy, esc, ox, oz, B), dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy), r = Math.min(W, Hh) / 2 - 12, fora = d > r && !grande, a2 = fora ? [cx + dx / d * r, cy + dy / d * r] : q, p = .5 + .5 * Math.sin(performance.now() / 280);
      c.save(); c.strokeStyle = "#7ddc6a"; c.fillStyle = "rgba(125,220,106,.28)"; c.lineWidth = grande ? 3 : 2; c.beginPath(); c.arc(a2[0], a2[1], (grande ? 11 : 7) + p * 3, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#7ddc6a"; c.beginPath(); c.arc(a2[0], a2[1], grande ? 4 : 2.6, 0, 7); c.fill();
      if(grande){ c.fillStyle = "#d8f8c8"; c.font = "700 12px system-ui,sans-serif"; c.textAlign = "left"; c.strokeStyle = "rgba(0,0,0,.85)"; c.lineWidth = 3; c.strokeText("Objetivo: " + (S.objetivo.rotulo || ""), a2[0] + 16, a2[1] - 12); c.fillText("Objetivo: " + (S.objetivo.rotulo || ""), a2[0] + 16, a2[1] - 12); } c.restore(); }
    /* destino */
    if(S.destino){ const q = proj(S.destino.x, S.destino.z, cx, cy, esc, ox, oz, B); const dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy), r = Math.min(W, Hh) / 2 - 10;
      const alvo = d > r && !grande ? [cx + dx / d * r, cy + dy / d * r] : q;
      if(S.J && !grande){ c.strokeStyle = "rgba(255,215,0,.85)"; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(alvo[0], alvo[1]); c.stroke(); c.setLineDash([]); }
      c.fillStyle = "#ffd700"; c.beginPath(); c.moveTo(alvo[0], alvo[1] - 12); c.lineTo(alvo[0] + 8, alvo[1] - 5); c.lineTo(alvo[0], alvo[1]); c.closePath(); c.fill(); c.strokeStyle = "#000"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(alvo[0], alvo[1]); c.lineTo(alvo[0], alvo[1] - 14); c.stroke(); }
    /* jogador (seta na direção em que ele anda/olha) */
    if(S.J){ const q = proj(S.J.x, S.J.z, cx, cy, esc, ox, oz, B), f = [Math.sin(S.J.yaw), Math.cos(S.J.yaw)]; const fx = f[0] * B.r[0] + f[1] * B.r[1], fy = -(f[0] * B.f[0] + f[1] * B.f[1]); const a = Math.atan2(fy, fx);
      c.save(); c.translate(q[0], q[1]); c.rotate(a); const t = grande ? 1.5 : 1.05; c.fillStyle = "#ff4a3a"; c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(9 * t, 0); c.lineTo(-6 * t, 6 * t); c.lineTo(-3 * t, 0); c.lineTo(-6 * t, -6 * t); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    /* noite: escurece */
    if(noite > .02){ c.fillStyle = "rgba(4,8,28," + (.5 * noite).toFixed(3) + ")"; c.fillRect(0, 0, W, Hh); }
    return B;
  }
  /* N no contorno */
  function letraN(c, W, Hh){ const B = base(), r = Math.min(W, Hh) / 2 - 9, cx = W / 2, cy = Hh / 2, q = proj(cen.campo.BORDA * 0 + NORTE[0] * 1000 + (S.J ? S.J.x : 0), NORTE[1] * 1000 + (S.J ? S.J.z : 0), cx, cy, 1, S.J ? S.J.x : 0, S.J ? S.J.z : 0, B); const dx = q[0] - cx, dy = q[1] - cy, d = Math.hypot(dx, dy) || 1; const x = cx + dx / d * r, y = cy + dy / d * r; c.fillStyle = "#e0883a"; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); c.fillStyle = "#101010"; c.font = "800 11px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("N", x, y + .5); }

  /* ---- minimapa ---- */
  function monta(ui){
    S.ui = ui;
    const el = document.createElement("div"); el.style.cssText = "position:absolute;right:10px;top:56px;display:flex;flex-direction:column;align-items:flex-end;gap:5px;pointer-events:none;z-index:29;";
    const caixa = document.createElement("div"); caixa.style.cssText = "position:relative;border-radius:50%;overflow:hidden;border:2px solid #8a9a3b;background:#1c3042;box-shadow:0 2px 12px rgba(0,0,0,.5);opacity:.9;pointer-events:auto;touch-action:none;";
    const cv = document.createElement("canvas"); cv.style.cssText = "display:block;width:100%;height:100%;"; caixa.appendChild(cv);
    const bt = (t, css, fn, rot) => { const b = document.createElement("div"); b.textContent = t; b.setAttribute("role", "button"); b.setAttribute("aria-label", rot); b.style.cssText = "pointer-events:auto;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;text-align:center;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.78);color:#e9efc0;border-radius:9px;padding:3px 8px;min-width:22px;" + FONTE + css; b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(); }); return b; };
    const barra = document.createElement("div"); barra.style.cssText = "display:flex;gap:5px;align-items:center;";
    S.relogio = document.createElement("div"); S.relogio.style.cssText = "background:rgba(18,19,14,.78);border:1.5px solid #3a3f27;border-radius:9px;padding:3px 8px;color:#e9efc0;" + FONTE;
    S.btnN = bt("N", "", () => { S.norteFixo = !S.norteFixo; atualizaN(); }, "Travar o norte"); const atualizaN = () => { S.btnN.style.background = S.norteFixo ? "rgba(224,136,58,.9)" : "rgba(18,19,14,.78)"; S.btnN.style.color = S.norteFixo ? "#1a1408" : "#e9efc0"; }; atualizaN();
    barra.appendChild(S.relogio); barra.appendChild(bt("−", "", () => zoom(-1), "Menos zoom")); barra.appendChild(bt("+", "", () => zoom(1), "Mais zoom")); barra.appendChild(S.btnN); barra.appendChild(bt("🗺", "", () => abreGrande(), "Mapa grande (M)"));
    el.appendChild(caixa); el.appendChild(barra); ui.appendChild(el);
    caixa.addEventListener("wheel", e => { e.preventDefault(); e.stopPropagation(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    S.el = el; S.caixa = caixa; S.cv = cv; S.ctx = cv.getContext("2d"); redimensiona(); S.resize = () => redimensiona(); window.addEventListener("resize", S.resize);
  }
  function redimensiona(){
    if(!S.cv) return; const vm = Math.min(window.innerWidth, window.innerHeight), tam = Math.round(Math.max(104, Math.min(MAPA.tamanho, vm * .24))), dpr = Math.min(2, window.devicePixelRatio || 1);
    S.tam = tam; S.caixa.style.width = S.caixa.style.height = tam + "px"; S.cv.width = S.cv.height = Math.round(tam * dpr); S.escala = dpr;
  }
  const zoom = (d) => { S.zoom = Math.max(0, Math.min(PX.length - 1, S.zoom + d)); S.tAcc = 1; };

  /* ---- mapa grande ---- */
  function abreGrande(){
    if(S.grande || !S.ui) return; S.grande = true; if(M.ctx && M.ctx.soltaTeclas) M.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:47;background:rgba(5,6,3,.88);display:flex;align-items:center;justify-content:center;pointer-events:auto;"; el.addEventListener("pointerdown", e => e.stopPropagation());
    const box = document.createElement("div"); box.style.cssText = "position:relative;width:min(94%,1100px);height:min(90%,760px);border:2px solid #e0883a;border-radius:16px;overflow:hidden;background:#1c3042;"; el.appendChild(box);
    const cv = document.createElement("canvas"); cv.style.cssText = "width:100%;height:100%;display:block;cursor:crosshair;"; box.appendChild(cv);
    const info = document.createElement("div"); info.style.cssText = "position:absolute;left:12px;top:10px;color:#fff;background:rgba(0,0,0,.55);border-radius:10px;padding:6px 10px;" + FONTE + "font-size:12px;line-height:1.5;"; info.textContent = "MAPA · clique para marcar um destino ou num ⇄ para viajar · M ou Esc fecha"; box.appendChild(info);
    const leg = document.createElement("div"); leg.style.cssText = "position:absolute;left:12px;bottom:10px;color:#e9efc0;background:rgba(0,0,0,.6);border-radius:10px;padding:8px 10px;" + FONTE + "font-size:11px;line-height:1.55;"; leg.innerHTML = '<span style="color:#e0883a">R</span> Recebimento · <span style="color:#5aa0e0">P</span> Estacionamento · <span style="color:#e8c32a">L</span> Largada · <span style="color:#e0883a">C</span> Chegada · <span style="color:#c8e86a">M</span> Mirante<br><span style="color:#d7b57a">━</span> trilhas · <span style="color:#5aa9e0">━</span> rios · <span style="color:#c9b98a">━</span> borda do cânion · <span style="color:#ff4a3a">▲</span> você · <span style="color:#ffd700">⚑</span> destino · <span style="color:#2f8a40">●</span> ICMBio'; box.appendChild(leg);
    const x = document.createElement("div"); x.textContent = "✕"; x.style.cssText = "position:absolute;right:10px;top:10px;cursor:pointer;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.85);color:#e9efc0;border-radius:10px;padding:6px 12px;" + FONTE; x.addEventListener("pointerdown", e => { e.preventDefault(); fechaGrande(); }); box.appendChild(x);
    const md = document.createElement("div"); md.textContent = (S.bigModo === "mundo" ? "ver o parque" : "ver o mundo todo"); md.style.cssText = x.style.cssText.replace("right:10px", "right:64px"); md.addEventListener("pointerdown", e => { e.preventDefault(); S.bigModo = S.bigModo === "mundo" ? "parque" : "mundo"; md.textContent = S.bigModo === "mundo" ? "ver o parque" : "ver o mundo todo"; calcExt(); desenhaGrande(); }); box.appendChild(md);
    const lim = document.createElement("div"); lim.textContent = "limpar destino"; lim.style.cssText = "position:absolute;right:10px;bottom:10px;cursor:pointer;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.85);color:#e9efc0;border-radius:10px;padding:6px 12px;" + FONTE; lim.addEventListener("pointerdown", e => { e.preventDefault(); limpaDestino(); }); box.appendChild(lim);
    S.ui.appendChild(el); S.big = el; S.bigCv = cv; S.bigInfo = info;
    const dim = () => { const r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); S.bigDpr = dpr; }; dim(); S.bigDim = dim;
    /* extensão: pontos principais girados para o norte para cima */
    S.bigModo = S.bigModo || "parque"; calcExt();
    cv.addEventListener("pointerdown", e => { e.preventDefault(); const r = cv.getBoundingClientRect(), W = cv.width, Hh = cv.height, esc = S.bigEsc, px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * Hh; const hit = (S.hitsViagem || []).find(h => Math.hypot(h.x - px, h.y - py) < h.r * (W / r.width)); if(hit){ fechaGrande(); M.viagem.viajar(hit.id); return; } const B2 = base(); const o = S.bigOrig; const w = inv(px, py, W / 2, Hh / 2, esc, o[0], o[1], B2); marcaDestino(w[0], w[1]); });
    desenhaGrande(); S.bigT = setInterval(desenhaGrande, 200);
  }
  /* extensão do mapa grande: "parque" (como antes) ou "mundo" (parque + estrada + cidade/vila) */
  function calcExt(){
    const B = base(); let pts = [...BORDA_PTS.filter(p => Math.abs(p[0]) < 3500 && Math.abs(p[1]) < 3500), ...locais().map(p => [p.x, p.z]), ...TR.TM, ...TR.TB, [launch.x + 40, 28]];
    if(S.bigModo === "mundo"){ pts = [...pts, ...(M.estrada ? M.estrada.pts : []), ...(M.zonas ? M.zonas.urbano.flatMap(u => u.poli) : [])]; }
    let a = 1e9, b2 = -1e9, c2 = 1e9, d2 = -1e9; pts.forEach(p => { const sx = p[0] * B.r[0] + p[1] * B.r[1], sy = p[0] * B.f[0] + p[1] * B.f[1]; a = Math.min(a, sx); b2 = Math.max(b2, sx); c2 = Math.min(c2, sy); d2 = Math.max(d2, sy); });
    S.bigExt = { cx: (a + b2) / 2, cy: (c2 + d2) / 2, w: b2 - a, h: d2 - c2 };
  }
  function desenhaGrande(){
    if(!S.bigCv) return; const cv = S.bigCv, c = cv.getContext("2d"), W = cv.width, Hh = cv.height, B = base(), ext = S.bigExt;
    const esc = Math.min(W / (ext.w * 1.12), Hh / (ext.h * 1.12)); S.bigEsc = esc;
    /* origem do mapa: o centro da extensão em coordenadas do mundo */
    const ox = ext.cx * B.r[0] + ext.cy * B.f[0], oz = ext.cx * B.r[1] + ext.cy * B.f[1]; S.bigOrig = [ox, oz];
    desenha(c, W, Hh, esc, ox, oz, true);
    if(S.bigInfo){ const d = S.destino && S.J ? Math.hypot(S.destino.x - S.J.x, S.destino.z - S.J.z) / U : null; S.bigInfo.textContent = "MAPA · clique para marcar um destino · M ou Esc fecha" + (d !== null ? "   |   destino a " + d.toFixed(0) + " m" : ""); }
  }
  function fechaGrande(){ if(!S.big) return; clearInterval(S.bigT); S.big.remove(); S.big = S.bigCv = S.bigInfo = null; S.grande = false; }

  /* ---- destino: linha no minimapa + feixe e seta no mundo ---- */
  const mundoDest = new Group(); mundoDest.visible = false; cen.grupo.add(mundoDest);
  const feixe = new Mesh(new CylinderGeometry(1.1, 1.1, 120, 14, 1, true), new MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: .38, depthWrite: false, blending: AdditiveBlending, side: DoubleSide })); feixe.position.y = 60; mundoDest.add(feixe);
  const anel = new Mesh(new RingGeometry(3.2, 4.2, 28), new MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: .8, depthWrite: false, side: DoubleSide })); anel.rotation.x = -Math.PI / 2; anel.position.y = .4; mundoDest.add(anel);
  const seta = new Mesh(new ConeGeometry(1.5, 4.5, 4), new MeshBasicMaterial({ color: 0xffd34a })); seta.visible = false; cen.grupo.add(seta);
  function marcaDestino(x, z){ S.destino = { x, z }; S.chegou = false; mundoDest.position.set(x, cen.chao(x, z, 1e9), z); mundoDest.visible = true; if(M.ctx) M.ctx.mostraAviso("Destino marcado: siga a seta e o feixe amarelo"); fechaGrande(); }
  function limpaDestino(){ S.destino = null; mundoDest.visible = false; seta.visible = false; }

  function tick(dt, J){
    S.J = J; if(S.destino && J){ const d = Math.hypot(S.destino.x - J.x, S.destino.z - J.z);
      if(d < 12 * U * .5 && !S.chegou){ S.chegou = true; if(M.ctx) M.ctx.mostraAviso("Você chegou ao destino"); limpaDestino(); }
      else if(S.destino){ const a = Math.atan2(S.destino.x - J.x, S.destino.z - J.z); seta.visible = true; seta.position.set(J.x + Math.sin(a) * 9, J.y + 1.6, J.z + Math.cos(a) * 9); seta.rotation.set(Math.PI / 2, 0, -a + Math.PI); seta.rotation.order = "YXZ"; seta.rotation.y = a; seta.rotation.x = Math.PI / 2; anel.scale.setScalar(1 + Math.sin(performance.now() / 300) * .12); } }
    S.tAcc += dt; if(S.tAcc < 1 / MAPA.hz || !S.cv) return; S.tAcc = 0;
    const c = S.ctx, W = S.cv.width; const esc = PX[S.zoom] * (W / MAPA.tamanho);
    if(!J){ c.clearRect(0, 0, W, W); return; }
    c.save(); desenha(c, W, W, esc, J.x, J.z, false); letraN(c, W, W); c.restore();
    S.relogio.textContent = (ciclo.estado.alt > -2 ? (ciclo.estado.alt > 4 ? "☀ " : "🌅 ") : "🌙 ") + ciclo.horaTexto();
  }
  function liga(ui){ monta(ui); }
  function desliga(){ fechaGrande(); if(S.el){ S.el.remove(); S.el = null; } if(S.resize) window.removeEventListener("resize", S.resize); limpaDestino(); S.cv = null; }
  function tecla(e){
    if(S.grande){ if(e.code === "KeyM" || e.code === "Escape"){ fechaGrande(); } e.preventDefault(); return true; }
    if(e.code === "KeyM"){ abreGrande(); e.preventDefault(); return true; }
    return false;
  }
  void Color; void FAUNA;
  return { liga, desliga, tick, tecla, marcaDestino, limpaDestino, coluna: () => S.el, marcaObjetivo: (o) => { S.objetivo = o; },  info: () => "Mapa: zoom " + S.zoom + (S.norteFixo ? " · norte fixo" : "") + (S.destino ? " · destino" : "") };
}
