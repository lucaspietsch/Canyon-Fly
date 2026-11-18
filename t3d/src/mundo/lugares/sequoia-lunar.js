import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, PlaneGeometry, IcosahedronGeometry, MeshStandardMaterial, DoubleSide } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U } from "../config.js";

/* ============================================================================================================
   ENTORNO DA SEQUOIA LUNAR (fotos do Lucas, 2021–2026) — praça São José, Cambará do Sul.
   • cerca rústica OCTOGONAL de madeira em volta do tronco; placa entalhada "Sequoia Lunar" (letras creme, foguete e lua);
   • placa antiga emoldurada com o texto histórico; painel novo (2026) com emblema da lua; pedra branca com placa de bronze;
   • TERMÔMETRO: coluna de pedra escura sobre plataforma de concreto com degrau, cercada por cordões vermelho e branco;
   • cruz azul de madeira; letreiro "I ♥ CAMBARÁ DO SUL — Terra dos Cânions".
   • [E] na árvore abre a placa com a história (abrePlaca). Texto da placa + curiosidades: docs/cidade/SEQUOIA-LUNAR.md.
   ============================================================================================================ */
export const HISTORIA_SEQUOIA = {
  titulo: "Sequoia Lunar — Sequoia sempervirens",
  placa: "A missão espacial denominada “Apollo 14” levou consigo algumas sementes de sequoia com o astronauta Stuart Roosa. Após germinarem, as sementes da árvore retornaram à Terra em 1971, quando foram distribuídas para vários países do mundo. Uma destas mudas foi plantada em Cambará do Sul/RS, na Praça Central São José, no dia 26 de setembro de 1982, pelo então prefeito municipal, Senhor Pedro Teixeira Constantino, com a presença de autoridades locais e testemunho do povo cambaraense, que presenciaram o fato histórico.",
  curiosidades: [
    "É uma das “Árvores da Lua” (Moon Trees): as sementes deram voltas em torno da Lua dentro da cápsula da Apollo 14, em 1971, e germinaram aqui na Terra. A placa antiga fala em “solo lunar”, mas nenhum solo da Lua foi usado.",
    "A muda foi plantada entre dois cambarás, perto do Dia da Árvore. A praça é a de São José.",
    "No Brasil só três lugares têm uma Sequoia Lunar registrada: Cambará do Sul, a sede do Ibama em Brasília e o Parque de Exposições de Santa Rosa (RS). A de Cambará entrou na lista oficial da NASA em 2021.",
    "O certificado da árvore foi guardado numa urna enterrada na praça junto com outros documentos — mas a água infiltrou e nada se salvou. Por muito tempo, muita gente achou que a história fosse lenda.",
    "Em 2021 ela tinha cerca de 30 metros de altura e 70 centímetros de diâmetro. A espécie é a sequoia-costeira, a árvore mais alta do mundo: pode passar dos 100 metros.",
    "Ao lado fica o termômetro da praça: os turistas tiram foto ali para provar o frio do inverno serrano.",
  ],
};

export function criarEntornoSequoia(M, { sc, Y, dir }){
  const G = new Group(), dx = dir[0], dz = dir[1], ox = -dz, oz = dx, colisores = [];
  const em = (f, l) => [sc[0] + dx * f + ox * l, sc[1] + dz * f + oz * l];                                   // f = para frente (lado da carona), l = lateral
  const madeira = new MeshStandardMaterial({ color: 0x6b4a2e, roughness: .95 }), madeiraV = new MeshStandardMaterial({ color: 0x8a6a48, roughness: .95 });
  const yaw = Math.atan2(dx, dz);
  /* cerca octogonal (raio 2,6 m): postes nos vértices + 2 travessas */
  const R = 2.6 * U, alt = 1.05 * U, V = [];
  for(let i = 0; i < 8; i++){ const a = yaw + Math.PI / 8 + i * Math.PI / 4; V.push([sc[0] + Math.sin(a) * R, sc[1] + Math.cos(a) * R]); }
  V.forEach(([x, z]) => { const p = new Mesh(new BoxGeometry(.22 * U, alt + .15 * U, .22 * U), madeira); p.position.set(x, Y(x, z) + (alt + .15 * U) / 2, z); p.castShadow = true; G.add(p); });
  for(let i = 0; i < 8; i++){ const [x0, z0] = V[i], [x1, z1] = V[(i + 1) % 8], L = Math.hypot(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    for(const h of [.45, .92]){ const t = new Mesh(new BoxGeometry(.1 * U, .2 * U, L + .1 * U), madeiraV); t.position.set(mx, Y(mx, mz) + h * U, mz); t.rotation.y = Math.atan2(x1 - x0, z1 - z0); t.castShadow = true; G.add(t); } }
  /* placa entalhada "Sequoia Lunar" presa na cerca, do lado da frente */
  { const tex = texPlacaHD(512, 256, (c, w, h) => { c.fillStyle = "#5a4a2a"; c.beginPath(); c.roundRect ? c.roundRect(8, 8, w - 16, h - 16, 40) : c.rect(8, 8, w - 16, h - 16); c.fill(); c.strokeStyle = "#b89a5a"; c.lineWidth = 8; c.stroke();
      c.fillStyle = "#efe2b0"; c.textAlign = "center"; c.font = "italic bold 80px Georgia"; c.fillText("Sequoia", w / 2 + 20, 112); c.fillText("Lunar", w / 2, 205);
      c.save(); c.translate(70, 80); c.rotate(-.6); c.fillStyle = "#f4f0e0"; c.beginPath(); c.moveTo(0, -28); c.lineTo(10, 10); c.lineTo(-10, 10); c.closePath(); c.fill(); c.fillRect(-6, 10, 12, 10); c.restore();
      c.fillStyle = "#f2d85a"; c.beginPath(); c.arc(w - 70, 190, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = "#5a4a2a"; c.beginPath(); c.arc(w - 60, 182, 20, 0, Math.PI * 2); c.fill(); });
    const pl = placaLegivel(tex, 2.0 * U, 1.0 * U, { verso: tex, cor: 0x3a2a1a }); const [x, z] = em(R / U * U * .93 / U * U / U, .9 * U); pl.position.set(x, Y(x, z) + .7 * U, z); pl.rotation.y = yaw; G.add(pl); }
  /* placa antiga emoldurada (texto histórico) */
  { const tex = texPlacaHD(256, 320, (c, w, h) => { c.fillStyle = "#c8a46a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f6f4ee"; c.fillRect(22, 22, w - 44, h - 44); c.fillStyle = "#222"; c.textAlign = "center"; c.font = "italic bold 18px Georgia"; c.fillText("Sequoia Lunar", w / 2, 52); c.font = "italic 13px Georgia"; c.fillText("“Sequoia sempervirens”", w / 2, 70);
      c.font = "10px Georgia"; const linhas = ["A missão espacial denominada", "“Apollo 14” levou consigo algumas", "sementes de sequoia com o", "astronauta Stuart Roosa.", "", "Uma destas mudas foi plantada", "em Cambará do Sul/RS, na Praça", "Central São José, no dia 26 de", "setembro de 1982 ..."]; linhas.forEach((l, i) => c.fillText(l, w / 2, 98 + i * 15)); });
    const pl = placaLegivel(tex, .8 * U, 1.0 * U, { verso: tex, cor: 0x8a6a40 }); const [x, z] = em(R * .93, -.9 * U); pl.position.set(x, Y(x, z) + .75 * U, z); pl.rotation.y = yaw; G.add(pl); }
  /* painel novo (2026) com emblema da lua, em dois postes brancos */
  { const [x, z] = em(R + 1.4 * U, -2.6 * U), g = new Group(); g.position.set(x, Y(x, z), z); g.rotation.y = yaw - .5; G.add(g);
    for(const s of [-1, 1]){ const p = new Mesh(new BoxGeometry(.14 * U, 2.2 * U, .14 * U), new MeshStandardMaterial({ color: 0xeeeeea })); p.position.set(s * .75 * U, 1.1 * U, 0); g.add(p); }
    const tex = texPlacaHD(384, 256, (c, w, h) => { c.fillStyle = "#f4f2ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#1b2a48"; c.font = "bold 26px sans-serif"; c.fillText("SEQUOIA LUNAR", 20, 44); c.fillStyle = "#333"; c.font = "13px sans-serif";
      ["Uma das “Árvores da Lua”: as sementes", "orbitaram a Lua na Apollo 14 (1971).", "Plantada nesta praça em 26/09/1982.", "Uma de só três no Brasil.", "Sequoia-costeira — pode passar de 100 m."].forEach((l, i) => c.fillText(l, 20, 80 + i * 22));
      c.fillStyle = "#1b2a48"; c.beginPath(); c.arc(w - 60, 60, 42, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#e0b23a"; c.lineWidth = 6; c.stroke(); c.fillStyle = "#f2e6b0"; c.beginPath(); c.arc(w - 60, 60, 24, 0, Math.PI * 2); c.fill(); c.fillStyle = "#1b2a48"; c.beginPath(); c.arc(w - 50, 54, 22, 0, Math.PI * 2); c.fill(); });
    const pl = placaLegivel(tex, 1.8 * U, 1.2 * U, { verso: tex, cor: 0xdddddd }); pl.position.set(0, 1.55 * U, 0); g.add(pl); }
  /* pedra branca com placa de bronze */
  { const [x, z] = em(R + 1.6 * U, 1.8 * U), p = new Mesh(new IcosahedronGeometry(.75 * U, 0), new MeshStandardMaterial({ color: 0xe9e6dc, roughness: .9, flatShading: true })); p.scale.set(1.1, .7, .9); p.position.set(x, Y(x, z) + .35 * U, z); p.castShadow = true; G.add(p);
    const b = new Mesh(new BoxGeometry(.6 * U, .42 * U, .04 * U), new MeshStandardMaterial({ color: 0x6a5a3a, metalness: .6, roughness: .45 })); b.position.set(x + dx * .62 * U, Y(x, z) + .5 * U, z + dz * .62 * U); b.rotation.y = yaw; b.rotation.x = -.35; G.add(b); }
  /* TERMÔMETRO: coluna de pedra escura sobre plataforma, com cordões vermelho e branco */
  { const [x, z] = em(9 * U, 2 * U), y = Y(x, z), g = new Group(); g.position.set(x, y, z); g.rotation.y = yaw; G.add(g);
    const conc = new MeshStandardMaterial({ color: 0xd8d4c8, roughness: .95 }); const base = new Mesh(new BoxGeometry(5.2 * U, .35 * U, 5.2 * U), conc); base.position.y = .17 * U; g.add(base);
    const deg = new Mesh(new BoxGeometry(2.4 * U, .2 * U, 1 * U), conc); deg.position.set(0, .1 * U, 3.0 * U); g.add(deg);
    const pedraTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = "#4a4640"; c.fillRect(0, 0, w, h); for(let r = 0; r < 16; r++) for(let k = 0; k < 4; k++){ const o = (r % 2) * 16; c.fillStyle = ["#5a554e", "#3e3a35", "#67615a", "#4f4a44"][(r * 3 + k) % 4]; c.fillRect(k * 32 + o - 16 + 2, r * 16 + 2, 28, 12); } }, { repeat: [1, 1] });
    const col = new Mesh(new BoxGeometry(.9 * U, 4.2 * U, .9 * U), new MeshStandardMaterial({ map: pedraTex, roughness: .95 })); col.position.y = .35 * U + 2.1 * U; col.castShadow = true; g.add(col);
    const topo = new Mesh(new BoxGeometry(1.1 * U, .2 * U, 1.1 * U), new MeshStandardMaterial({ color: 0x3a3632 })); topo.position.y = 4.65 * U; g.add(topo);
    /* mostrador do termômetro (frente) */
    const mt = texPlacaHD(128, 384, (c, w, h) => { c.fillStyle = "#f4f2ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#222"; c.font = "bold 18px sans-serif"; c.textAlign = "center"; c.fillText("°C", w / 2, 26); for(let t = -10; t <= 40; t += 5){ const yy = 330 - (t + 10) * 5.6; c.fillRect(30, yy, 18, 2); c.fillText(String(t), 85, yy + 6); }
      c.fillStyle = "#c22"; c.fillRect(56, 120, 10, 210); c.beginPath(); c.arc(61, 340, 16, 0, Math.PI * 2); c.fill(); });
    const mostr = new Mesh(new PlaneGeometry(.55 * U, 1.65 * U), new MeshStandardMaterial({ map: mt })); mostr.position.set(0, 2.6 * U, .46 * U); g.add(mostr);
    /* cordões vermelho/branco em 4 pilaretes */
    const pil = [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]; pil.forEach(([a, b]) => { const p = new Mesh(new CylinderGeometry(.06 * U, .06 * U, 1 * U, 6), new MeshStandardMaterial({ color: 0xeeeeee })); p.position.set(a * U, .85 * U, b * U); g.add(p); });
    for(let i = 0; i < 4; i++){ const [a0, b0] = pil[i], [a1, b1] = pil[(i + 1) % 4]; if(i === 2) continue;                       // a frente (lado do degrau) fica aberta
      const n = 8; for(let k = 0; k < n; k++){ const t0 = k / n, t1 = (k + 1) / n, xa = (a0 + (a1 - a0) * t0) * U, za = (b0 + (b1 - b0) * t0) * U, xb = (a0 + (a1 - a0) * t1) * U, zb = (b0 + (b1 - b0) * t1) * U, L = Math.hypot(xb - xa, zb - za);
        const s = new Mesh(new CylinderGeometry(.035 * U, .035 * U, L, 5), new MeshStandardMaterial({ color: k % 2 ? 0xf2f2f2 : 0xc8202a })); s.position.set((xa + xb) / 2, 1.2 * U - Math.sin(Math.PI * (t0 + t1) / 2) * .15 * U, (za + zb) / 2); s.rotation.z = Math.PI / 2; s.rotation.y = Math.atan2(xb - xa, zb - za) + Math.PI / 2; g.add(s); } }
    colisores.push({ x0: x - .7 * U, x1: x + .7 * U, z0: z - .7 * U, z1: z + .7 * U, peca: "termômetro" }); }
  /* cruz azul de madeira */
  { const [x, z] = em(5 * U, -10 * U), y = Y(x, z), az = new MeshStandardMaterial({ color: 0x8fb0d8, roughness: .8 });
    const v = new Mesh(new BoxGeometry(.25 * U, 4.2 * U, .25 * U), az); v.position.set(x, y + 2.1 * U, z); v.castShadow = true; G.add(v);
    const h = new Mesh(new BoxGeometry(1.8 * U, .25 * U, .25 * U), az); h.position.set(x, y + 3.2 * U, z); h.rotation.y = yaw; G.add(h); }
  /* letreiro "I ♥ CAMBARÁ DO SUL — Terra dos Cânions" (letras brancas sobre base escura) */
  { const [x, z] = em(14 * U, -6 * U), y = Y(x, z), g = new Group(); g.position.set(x, y, z); g.rotation.y = yaw + .35; G.add(g);
    const base = new Mesh(new BoxGeometry(5.6 * U, .5 * U, 1.0 * U), new MeshStandardMaterial({ color: 0x3a3430, roughness: .9 })); base.position.y = .25 * U; g.add(base);
    const tb = texPlacaHD(512, 48, (c, w, h) => { c.fillStyle = "#3a3430"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2efe6"; c.font = "italic bold 30px Georgia"; c.textAlign = "center"; c.fillText("Terra dos Cânions", w / 2, 34); });
    const fb = new Mesh(new PlaneGeometry(5.6 * U, .48 * U), new MeshStandardMaterial({ map: tb })); fb.position.set(0, .25 * U, .51 * U); g.add(fb);
    const tl = canvasTex(1024, 320, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.textAlign = "left"; c.font = "bold 150px sans-serif"; c.fillText("I", 30, 140); c.fillStyle = "#d8282e"; c.font = "bold 150px sans-serif"; c.fillText("♥", 110, 140);
      c.fillStyle = "#ffffff"; c.font = "bold 110px sans-serif"; c.fillText("CAMBARÁ", 290, 140); c.font = "bold 90px sans-serif"; c.fillText("DO SUL", 560, 280); }, { repeat: [1, 1] });
    const letras = new Mesh(new PlaneGeometry(5.6 * U, 1.75 * U), new MeshStandardMaterial({ map: tl, transparent: true, alphaTest: .4, side: DoubleSide })); letras.position.set(0, .5 * U + .87 * U, .2 * U); g.add(letras);
    colisores.push({ x0: x - 2.8 * U, x1: x + 2.8 * U, z0: z - .6 * U, z1: z + .6 * U, peca: "letreiro" }); }
  G.traverse(o => { if(o.isMesh) o.castShadow = true; });
  return { g: G, colisores };
}

/* painel de leitura genérico (placas, lendas): { titulo, texto, subtitulo, itens[] } */
export function abrePainel(M, { titulo, texto, subtitulo, itens = [], borda = "#8a6a40" }){
  const ui = M.ui || document.body; if(ui.querySelector("[data-painel-leitura]")) return;
  const d = document.createElement("div"); d.dataset.painelLeitura = ""; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", titulo);
  d.style.cssText = "position:absolute;inset:0;z-index:120;background:#0009;display:grid;place-items:center;padding:16px;font:15px/1.45 Georgia,serif";
  const box = document.createElement("section"); box.style.cssText = "max-width:560px;max-height:86vh;overflow:auto;background:#f6f1e1;color:#2a2418;border:10px solid " + borda + ";border-radius:6px;padding:18px 22px;box-shadow:0 10px 40px #000a";
  const h = document.createElement("h2"); h.textContent = titulo; h.style.cssText = "margin:0 0 10px;font-style:italic"; box.append(h);
  if(texto){ const p = document.createElement("p"); p.textContent = texto; box.append(p); }
  if(itens.length){ if(subtitulo){ const h3 = document.createElement("h3"); h3.textContent = subtitulo; h3.style.margin = "14px 0 6px"; box.append(h3); }
    const ul = document.createElement("ul"); ul.style.paddingLeft = "20px"; itens.forEach(t => { const li = document.createElement("li"); li.textContent = t; li.style.marginBottom = "6px"; ul.append(li); }); box.append(ul); }
  const bt = document.createElement("button"); bt.textContent = "Fechar"; bt.style.cssText = "margin-top:10px;min-height:44px;padding:8px 18px;border:0;border-radius:8px;background:#5a4a2a;color:#f6f1e1;cursor:pointer;font:inherit"; box.append(bt);
  const fecha = () => { d.remove(); document.removeEventListener("keydown", esc, true); }, esc = (e) => { if(e.code === "Escape"){ e.preventDefault(); e.stopPropagation(); fecha(); } };
  bt.onclick = fecha; d.addEventListener("click", e => { if(e.target === d) fecha(); }); d.addEventListener("pointerdown", e => e.stopPropagation()); document.addEventListener("keydown", esc, true);
  d.append(box); ui.append(d); M.ctx && M.ctx.soltaTeclas && M.ctx.soltaTeclas(); bt.focus();
}
/* painel com a história da Sequoia (abre com [E] na árvore) */
export function abrePlaca(M){ abrePainel(M, { titulo: HISTORIA_SEQUOIA.titulo, texto: HISTORIA_SEQUOIA.placa, subtitulo: "Curiosidades", itens: HISTORIA_SEQUOIA.curiosidades }); }
