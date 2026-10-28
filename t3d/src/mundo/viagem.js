import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, TorusGeometry } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../lib.js";
import { U, VIAGEM as C, GAME_TIME_CONFIG } from "./config.js";

/* ============================================================================================================
   VIAGEM RÁPIDA. Fade para preto, cartão com o nome do destino e uma ilustração simples, fade de volta. O relógio do jogo avança proporcional à distância (como no salto do relógio
   clicável). Não dá para viajar no modo foto, durante um diálogo, com uma leitura aberta ou já viajando.
   Marcos físicos ([E] Viagem rápida): junto à saída do estacionamento e na praça da cidade/vila. Lista de destinos em config.js → VIAGEM.
   ============================================================================================================ */

const ILUS = {
  estacionamento: (c, w, h) => { céu(c, w, h, ["#9ec4e8", "#e9e4c8"]); morros(c, w, h, "#5c7a3e"); c.fillStyle = "#b0a38a"; c.fillRect(0, h * .72, w, h * .28); c.fillStyle = "#2f6fa8"; c.fillRect(w * .18, h * .6, w * .2, h * .1); c.fillStyle = "#c0392b"; c.fillRect(w * .5, h * .62, w * .22, h * .09); c.fillStyle = "#222"; [[.22, .71], [.34, .71], [.54, .71], [.66, .71]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, h * .025, 0, 7); c.fill(); }); },
  recebimento: (c, w, h) => { céu(c, w, h, ["#a9cbe6", "#f0e6c8"]); morros(c, w, h, "#6a8a45"); c.fillStyle = "#8c7a5a"; c.fillRect(0, h * .75, w, h * .25); c.fillStyle = "#555"; c.fillRect(w * .4, h * .46, w * .04, h * .3); c.fillRect(w * .56, h * .46, w * .04, h * .3); c.fillRect(w * .38, h * .46, w * .24, h * .03); c.strokeStyle = "#333"; c.lineWidth = 3; for(let i = 0; i < 3; i++){ c.beginPath(); c.moveTo(w * .6, h * (.5 + i * .03)); c.lineTo(w, h * (.52 + i * .02)); c.stroke(); } },
  lancamento: (c, w, h) => { céu(c, w, h, ["#8fb8e0", "#f2dcb0"]); c.fillStyle = "#5a7a5a"; c.beginPath(); c.moveTo(0, h * .7); c.lineTo(w * .35, h * .5); c.lineTo(w * .5, h * .78); c.lineTo(w * .7, h * .52); c.lineTo(w, h * .72); c.lineTo(w, h); c.lineTo(0, h); c.fill(); c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(0, h * .74, w, h * .06); c.strokeStyle = "#333"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h * .42); c.lineTo(w, h * .4); c.stroke(); },
  cidade: (c, w, h) => { céu(c, w, h, ["#9cc3ea", "#f0e8d0"]); morros(c, w, h, "#7a9a5a"); c.fillStyle = "#d8cdb5"; [[.1, .55, .12, .3], [.26, .6, .1, .25], [.4, .5, .14, .35], [.58, .58, .1, .27], [.72, .52, .13, .33], [.88, .6, .1, .25]].forEach(([x, y, ww, hh]) => { c.fillRect(w * x, h * y, w * ww, h * hh); c.fillStyle = "#b0553a"; c.fillRect(w * x - 4, h * y - 8, w * ww + 8, 10); c.fillStyle = "#d8cdb5"; }); c.fillStyle = "#555"; c.fillRect(0, h * .86, w, h * .14); },
  vila: (c, w, h) => { céu(c, w, h, ["#a4c8e8", "#f2ead0"]); morros(c, w, h, "#6f9050"); c.fillStyle = "#e6dcc3"; [[.2, .64, .14, .2], [.42, .62, .16, .22], [.66, .65, .13, .19]].forEach(([x, y, ww, hh]) => { c.fillRect(w * x, h * y, w * ww, h * hh); c.fillStyle = "#9c4a30"; c.beginPath(); c.moveTo(w * x - 6, h * y); c.lineTo(w * (x + ww / 2), h * (y - .1)); c.lineTo(w * (x + ww) + 6, h * y); c.fill(); c.fillStyle = "#e6dcc3"; }); c.fillStyle = "#7a6a4a"; c.fillRect(0, h * .86, w, h * .14); }
};
function céu(c, w, h, [a, b]){ const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,.7)"; [[.2, .2], [.6, .15], [.8, .3]].forEach(([x, y]) => { c.beginPath(); c.ellipse(w * x, h * y, w * .08, h * .04, 0, 0, 7); c.fill(); }); }
function morros(c, w, h, cor){ c.fillStyle = cor; c.beginPath(); c.moveTo(0, h * .7); for(let i = 0; i <= 12; i++) c.lineTo(w * i / 12, h * (.55 + .06 * Math.sin(i * 1.7) + .05 * Math.cos(i * .9))); c.lineTo(w, h); c.lineTo(0, h); c.fill(); }

export function criarViagem(M){
  const { cen } = M, E = cen.estac, grupo = new Group(); cen.grupo.add(grupo);
  const S = { viajando: false, el: null, card: null, lista: null, marcos: [], menu: null, t: 0 };

  /* ---------- onde fica cada destino ---------- */
  const resolvedores = {
    estacionamento: () => { const [x, z] = E.PKW(-60, -10); return { x, z, yaw: Math.atan2(-1, 0) }; },
    recebimento: () => ({ x: cen.spawn.x, z: cen.spawn.z, yaw: cen.spawn.yaw }),
    lancamento: () => (cen.spawnLan ? { x: cen.spawnLan.x, z: cen.spawnLan.z, yaw: cen.spawnLan.yaw } : null),
    cidade: () => { const u = M.zonas.urbano.find(q => q.tipo === "cidade"); if(!u) return null; const ch = M.lugares && M.lugares.chegadaDe(u); return ch ? { x: ch.x, z: ch.z, yaw: ch.yaw } : { x: u.praca[0] - C0(), z: u.praca[1] + C0() * .6, yaw: 0 }; },
    vila: () => { const u = M.zonas.urbano.find(q => q.tipo === "vila" && /oswaldo/i.test(q.nome)) || M.zonas.urbano.find(q => q.tipo === "vila"); return u ? { x: u.praca[0] - C0(), z: u.praca[1] + C0() * .6, yaw: 0 } : null; }
  };
  const C0 = () => 36 * U;                                                                   // chega ao lado da praça (fora da fita da obra)
  function resolve(d){
    const r = d.ref;
    if(typeof r === "string") return resolvedores[r] ? resolvedores[r]() : null;
    if(r && r.kml){ const q = M.kml.S.pontos.find(p => p.nome === r.kml); if(q){ const p = M.zonas.mundoPt(q); return { x: p[0], z: p[1], yaw: 0 }; } return null; }
    if(r && isFinite(r.x)) return { x: r.x, z: r.z, yaw: r.yaw || 0 };
    return null;
  }
  const todos = () => C.destinos.map(d => ({ ...d, pos: resolve(d) })).filter(d => d.pos);
  const destinos = () => todos().filter(d => !M.missoes || M.missoes.viagemPermitida(d.id));                  // as missões decidem quais destinos já estão liberados
  /* ---------- distância (km de percurso) e tempo ---------- */
  function eixo(x, z){                                                                         // posição (m) ao longo da estrada: parque (antes do começo) → estrada → cidade → complexo da Vila Oswaldo Kroeff
    const Z = M.zonas, zona = Z.zonaDe(x, z), Es = M.estrada, p0 = Es.pts[0];
    if(zona === "estrada"){ const q = Es.proximo(x, z); return q ? q.s / U : 0; }
    if(zona === "cidade" || zona === "vila"){ let bi = 0, bd = 1e18; for(let i = 0; i < Es.pts.length; i++){ const d = (Es.pts[i][0] - x) ** 2 + (Es.pts[i][1] - z) ** 2; if(d < bd){ bd = d; bi = i; } } return (Es.cum[bi] + Math.sqrt(bd)) / U; }
    return -Math.hypot(x - p0[0], z - p0[1]) / U;
  }
  function distKm(a, b){
    const Z = M.zonas, za = Z.zonaDe(a.x, a.z), zb = Z.zonaDe(b.x, b.z);
    if(za === "parque" && zb === "parque") return Math.hypot(a.x - b.x, a.z - b.z) / U / 1000;
    if(za === zb && za !== "estrada") return Math.hypot(a.x - b.x, a.z - b.z) / U / 1000;
    return Math.abs(eixo(a.x, a.z) - eixo(b.x, b.z)) / 1000;
  }
  const minutos = (a, b) => Math.max(C.minimoMin, Math.round(distKm(a, b) / C.velocidadeKmh * 60));

  /* ---------- tela ---------- */
  function monta(){
    if(S.el || !M.ui) return;
    S.el = document.createElement("div"); S.el.style.cssText = "position:absolute;inset:0;z-index:90;background:#000;opacity:0;pointer-events:none;transition:opacity " + C.fadeSeg + "s;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;font:600 15px ui-monospace,Consolas,monospace;color:#e9efc0;";
    S.card = document.createElement("canvas"); S.card.width = 420; S.card.height = 200; S.card.style.cssText = "border:2px solid #8a9a3b;border-radius:12px;max-width:80%;opacity:0;transition:opacity .3s;";
    S.txt = document.createElement("div"); S.txt.style.cssText = "font-size:20px;text-align:center;padding:0 16px;opacity:0;transition:opacity .3s;"; S.sub = document.createElement("div"); S.sub.style.cssText = "font-size:13px;opacity:.75;";
    S.el.append(S.card, S.txt, S.sub); M.ui.appendChild(S.el);
  }
  const hora = (h) => { const t = ((h % 24) + 24) % 24, hh = Math.floor(t), mm = Math.floor((t - hh) * 60); return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); };
  function viajar(id){
    const d = destinos().find(q => q.id === id); if(!d || S.viajando) return false;
    const J = M.jogador(); if(!J) return false;
    if(M.fotos && M.fotos.ativo()){ M.ctx.mostraAviso("Saia do modo foto para viajar"); return false; }
    if(M.gente && M.gente.dialogoAberto()){ M.ctx.mostraAviso("Termine a conversa antes de viajar"); return false; }
    monta(); if(!S.el) return false; fechaMenu(); S.viajando = true; const min = minutos(J, d.pos), h0 = M.ciclo.estado.h;
    M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    S.el.style.pointerEvents = "auto"; S.el.style.opacity = "1";
    setTimeout(() => {
      const c = S.card.getContext("2d"); c.clearRect(0, 0, 420, 200); (ILUS[d.ilus] || ILUS.cidade)(c, 420, 200); S.card.style.opacity = "1"; S.txt.textContent = d.nome; S.txt.style.opacity = "1"; S.sub.textContent = "Viagem de " + min + " min · " + hora(h0) + " → " + hora(h0 + min / 60);
      M.H.andarMod.colocar(d.pos.x, d.pos.z, d.pos.yaw + Math.PI);                                  // (a câmera fica atrás de quem olha para `yaw`)
      if(M.zonas) M.zonas.tick(10, M.jogador());
      if(!M.ciclo.relogio.pausa) M.ciclo.irParaHora(((h0 + min / 60) % 24 + 24) % 24);
      setTimeout(() => { S.card.style.opacity = "0"; S.txt.style.opacity = "0"; S.el.style.opacity = "0"; setTimeout(() => { S.el.style.pointerEvents = "none"; S.viajando = false; M.ctx.mostraAviso("Chegou: " + d.nome); }, C.fadeSeg * 1000); }, C.cartaoSeg * 1000);
    }, C.fadeSeg * 1000 + 40);
    return true;
  }
  /* ---------- menu de destinos (no marco) ---------- */
  function abreMenu(){
    if(S.menu || S.viajando) return; const J = M.jogador(); if(!J) return;
    S.menu = document.createElement("div"); S.menu.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:80;background:rgba(18,19,14,.94);border:2px solid #8a9a3b;border-radius:14px;padding:14px 18px;min-width:280px;font:600 14px ui-monospace,Consolas,monospace;color:#e9efc0;pointer-events:auto;";
    const t = document.createElement("div"); t.textContent = "Viagem rápida"; t.style.cssText = "font-size:17px;margin-bottom:10px;color:#ffd36a;"; S.menu.appendChild(t);
    destinos().forEach((d, i) => { const b = document.createElement("div"); b.style.cssText = "cursor:pointer;padding:8px 10px;margin:4px 0;border:1px solid #5a6a2b;border-radius:8px;display:flex;justify-content:space-between;gap:18px;"; b.innerHTML = "<span>" + (i + 1) + " · " + d.nome + "</span><span style='opacity:.7'>" + minutos(J, d.pos) + " min</span>"; b.onclick = () => viajar(d.id); S.menu.appendChild(b); });
    const f = document.createElement("div"); f.textContent = "Esc fecha"; f.style.cssText = "opacity:.6;font-size:12px;margin-top:6px;"; S.menu.appendChild(f); M.ui.appendChild(S.menu); M.ctx.soltaTeclas && M.ctx.soltaTeclas();
  }
  function fechaMenu(){ if(S.menu){ S.menu.remove(); S.menu = null; } }
  function tecla(e){
    if(!S.menu) return false;
    if(e.code === "Escape" || e.code === "KeyE"){ fechaMenu(); e.preventDefault(); return true; }
    const m = /^Digit(\d)$/.exec(e.code); if(m){ const d = destinos()[+m[1] - 1]; if(d) viajar(d.id); e.preventDefault(); return true; }
    e.preventDefault(); return true;
  }
  /* ---------- marcos físicos ---------- */
  const madeira = new MeshStandardMaterial({ color: 0x5a3e24, roughness: .95 }), anel = new MeshStandardMaterial({ color: 0x3fb0e8, roughness: .4, emissive: 0x1a6a9a, emissiveIntensity: .6 });
  function marco(x, z, yaw, rotulo, titulo = "VIAGEM RÁPIDA"){
    const g = new Group(), y = cen.chao(x, z, 1e9); g.position.set(x, y, z); g.rotation.y = yaw;
    for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.35, 6, .35), madeira); po.position.set(sx * 2.6, 3, 0); g.add(po); }
    const tex = texPlacaHD(512, 192, (c, w, h) => { c.fillStyle = "#1c5a8a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f4f4ea"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#f4f4ea"; c.textAlign = "center"; c.font = "bold " + (titulo.length > 14 ? 44 : 54) + "px Arial"; c.fillText(titulo, w / 2, 88); c.font = "bold 30px Arial"; c.fillText(rotulo, w / 2, 138); });
    const pl = placaLegivel(tex, 7, 2.6, { verso: tex, cor: 0x2a4a60 }); pl.position.set(0, 5, .05); g.add(pl);
    const ar = new Mesh(new TorusGeometry(3.2, .12, 8, 28), anel); ar.rotation.x = Math.PI / 2; ar.position.y = .4; g.add(ar);
    grupo.add(g); const hot = { id: "viagem" + S.marcos.length, x, z, r: 4.2 * U, rotulo: () => "Viagem rápida", acao: () => abreMenu() }; cen.hotspots.push(hot); S.marcos.push({ g, hot });
  }
  function refazMarcos(){
    S.marcos.forEach(m => { grupo.remove(m.g); const i = cen.hotspots.indexOf(m.hot); if(i >= 0) cen.hotspots.splice(i, 1); }); S.marcos = [];
    const Es = M.estrada; if(Es && Es.len){ const q = Es.amostra(150), lado = -(Es.BED + 16), x = q.x - q.tz * lado, z = q.z + q.tx * lado; marco(x, z, Math.atan2(-q.tx, -q.tz), "Estacionamento"); }
    M.zonas.urbano.forEach(u => { if(u.tipo !== "cidade" && !/oswaldo/i.test(u.nome)) return; const ca = M.lugares && M.lugares.caronaDe(u);
      if(ca) marco(ca.x, ca.z, ca.yaw, "Cambará do Sul", "PONTO DE CARONA"); else marco(u.praca[0] - 30 * U, u.praca[1] + 10 * U, Math.PI / 2, u.tipo === "vila" ? "Vila" : "Cambará do Sul"); });
  }
  M.zonas.aoMudar(refazMarcos); M.estrada.aoMudar(() => { if(M.zonas.urbano.length >= 0) refazMarcos(); });
  const info = () => "Viagem rápida: " + destinos().length + " destinos" + (S.viajando ? " (viajando)" : "");
  return { tick: () => {}, tecla, viajar, destinos, todos, minutos, abreMenu, fechaMenu, info, desliga: () => { fechaMenu(); if(S.el){ S.el.remove(); S.el = null; } }, S, get viajando(){ return S.viajando; }, refazMarcos };
}
