import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial } from "three";
import { canvasTex, texPlacaHD, placaLegivel } from "../../lib.js";
import { U, TURFEIRA as TF } from "../config.js";

/* ============================================================================================================
   PLACAS INTERPRETATIVAS DAS TURFEIRAS
   Painéis de madeira com moldura, inclinados para leitura, em todos os pontos onde a trilha passa a até ~30 m de uma turfeira e no início de cada passarela.
   4 painéis diferentes. Texto sempre legível (planos de uma face, nunca espelhados; textura de 4× a resolução) e voltado para quem vem pela trilha.
   A 3 m aparece "[E] Ler placa": o texto completo abre em tela, em fonte grande (E ou Esc fecham). Ler todas dá a conquista "Leitor da Serra".
   ============================================================================================================ */

export const PAINEIS = [
  { id: "caixa", titulo: ["TURFEIRA:", "A CAIXA D'ÁGUA DA SERRA"], texto: "Este banhado é uma turfeira. Ela acumula água da chuva e da neblina e a libera aos poucos, alimentando nascentes e rios durante todo o ano, mesmo nas épocas secas.", ilus: "gota" },
  { id: "sphagnum", titulo: ["SPHAGNUM:", "O MUSGO QUE GUARDA ÁGUA"], texto: "O Sphagnum é o musgo que forma as turfeiras. Suas células especiais conseguem reter muitas vezes o próprio peso em água, funcionando como uma esponja natural. É ele que capta e guarda a água que abastece as nascentes.", ilus: "musgo" },
  { id: "rios", titulo: ["AQUI NASCEM", "OS RIOS"], texto: "As nascentes que brotam das turfeiras formam os riachos que descem pelos cânions e chegam às cidades e lavouras lá embaixo. Proteger a turfeira é proteger a água de todos.", ilus: "nascente" },
  { id: "passos", titulo: ["MILHARES DE ANOS", "EM CADA PASSO"], texto: "Uma turfeira cresce cerca de 1 milímetro por ano. O pisoteio destrói em segundos o que a natureza levou séculos para formar. Permaneça na trilha e na passarela.", ilus: "pegada" }
];

function ilustracao(c, tipo, x, y, r){
  c.save(); c.translate(x, y);
  if(tipo === "gota"){ c.fillStyle = "#2c86b8"; c.beginPath(); c.moveTo(0, -r); c.bezierCurveTo(r * .9, -r * .1, r * .8, r * .8, 0, r * .85); c.bezierCurveTo(-r * .8, r * .8, -r * .9, -r * .1, 0, -r); c.fill(); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.ellipse(-r * .3, r * .1, r * .12, r * .3, .3, 0, 7); c.fill(); }
  else if(tipo === "musgo"){ for(let k = 0; k < 9; k++){ const a = k * 2.1, d = k < 1 ? 0 : r * .55, cx = Math.cos(a) * d, cy = Math.sin(a) * d * .8; const cols = ["#b9462e", "#8aa63a", "#d0a640", "#a9c24a"]; c.fillStyle = cols[k % 4]; for(let p = 0; p < 7; p++){ const aa = p / 7 * 6.283; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(aa - .22) * r * .34, cy + Math.sin(aa - .22) * r * .34); c.lineTo(cx + Math.cos(aa) * r * .5, cy + Math.sin(aa) * r * .5); c.lineTo(cx + Math.cos(aa + .22) * r * .34, cy + Math.sin(aa + .22) * r * .34); c.closePath(); c.fill(); } } }
  else if(tipo === "nascente"){ c.fillStyle = "#6a7a3a"; c.beginPath(); c.ellipse(0, r * .3, r * 1.1, r * .5, 0, 0, 7); c.fill(); c.fillStyle = "#8fd0e0"; c.beginPath(); c.ellipse(-r * .3, r * .1, r * .45, r * .2, 0, 0, 7); c.fill(); c.strokeStyle = "#8fd0e0"; c.lineWidth = r * .16; c.lineCap = "round"; c.beginPath(); c.moveTo(-r * .1, r * .15); c.bezierCurveTo(r * .3, r * .4, r * .1, r * .7, r * .8, r * .9); c.stroke(); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 2; [.6, .9].forEach(k => { c.beginPath(); c.ellipse(-r * .3, r * .1, r * .45 * k, r * .2 * k, 0, 0, 7); c.stroke(); }); }
  else { c.fillStyle = "#7a4a2c"; c.beginPath(); c.ellipse(-r * .3, 0, r * .3, r * .55, -.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(r * .35, -r * .15, r * .3, r * .55, .2, 0, 7); c.fill(); c.strokeStyle = "#b02c20"; c.lineWidth = r * .14; c.beginPath(); c.moveTo(-r * .9, -r * .9); c.lineTo(r * .9, r * .9); c.moveTo(r * .9, -r * .9); c.lineTo(-r * .9, r * .9); c.stroke(); }
  c.restore();
}
export const texPainel = (pn) => texPlacaHD(480, 360, (c, w, h) => {
  c.fillStyle = "#4a3526"; c.fillRect(0, 0, w, h); c.fillStyle = "#efe6cf"; c.fillRect(10, 10, w - 20, h - 20); c.strokeStyle = "#7a5a3a"; c.lineWidth = 3; c.strokeRect(16, 16, w - 32, h - 32);
  c.fillStyle = "#1f5a3a"; c.fillRect(16, 16, w - 32, 78); c.fillStyle = "#f6f1de"; c.textAlign = "center"; c.font = "bold 24px Arial"; c.fillText(pn.titulo[0], w / 2, 48); c.font = "bold 22px Arial"; c.fillText(pn.titulo[1], w / 2, 78);
  c.fillStyle = "#26231a"; c.textAlign = "left"; c.font = "17px Arial"; const pal = pn.texto.split(" "), linhas = []; let l = ""; const maxW = w - 190; pal.forEach(p => { const t = l ? l + " " + p : p; if(c.measureText(t).width > maxW){ linhas.push(l); l = p; } else l = t; }); linhas.push(l);
  linhas.slice(0, 9).forEach((ln, i) => c.fillText(ln, 34, 124 + i * 24));
  ilustracao(c, pn.ilus, w - 82, 190, 48); c.fillStyle = "#5a5a48"; c.font = "bold 12px Arial"; c.textAlign = "center"; c.fillText("Parque Nacional da Serra Geral", w / 2, h - 24);
});

export function criarPlacas(M, base, turf){
  const { cen } = M, G = M.gente, grupo = new Group(); cen.grupo.add(grupo);
  const S = { placas: [], lidas: new Set(), leitor: null };
  try{ JSON.parse(localStorage.getItem("sgv:placas") || "[]").forEach(i => S.lidas.add(i)); }catch(_){ /* */ }
  const madeira = new MeshStandardMaterial({ color: 0x4a3526, roughness: .95 }), tex = PAINEIS.map(texPainel);
  function limpa(){ S.placas.forEach(p => { grupo.remove(p.obj); const i = cen.hotspots.indexOf(p.hot); if(i >= 0) cen.hotspots.splice(i, 1); }); S.placas = []; }
  function gera(){
    limpa(); const lista = []; let cont = 0;
    G.PATHS.forEach(path => { let ultS = -1e9;
      for(let s = 0; s <= path.len; s += 10){ const q = G.amostra(path, s), d = turf.distTurfeira(q.x, q.z) / U; if(d < TF.placaDist && s - ultS > 170){ lista.push({ path, s }); ultS = s; } } });
    /* e no início de cada passarela */
    (turf.passarelas ? turf.passarelas.runs() : []).forEach(r => lista.push({ path: r.pathRef, s: Math.max(0, r.s0 - 3), inicio: true }));
    lista.forEach(({ path, s }, k) => {
      const q = G.amostra(path, s), nx = -q.tz, nz = q.tx; let lado = 1; { const a = turf.distTurfeira(q.x + nx * 8, q.z + nz * 8), b = turf.distTurfeira(q.x - nx * 8, q.z - nz * 8); lado = a <= b ? 1 : -1; }
      const x = q.x + nx * lado * 6.5, z = q.z + nz * lado * 6.5, y = base.alturaNo(x, z), idx = cont++ % PAINEIS.length;
      const obj = new Group(); obj.position.set(x, y, z); obj.rotation.y = Math.atan2(-nx * lado, -nz * lado);                       // a frente (+Z) aponta para a trilha
      [-1, 1].forEach(sd => { const p = new Mesh(new CylinderGeometry(.16, .2, 4.2, 6), madeira); p.position.set(sd * 2.1, 2.1, -.2); p.castShadow = true; obj.add(p); });
      const pl = placaLegivel(tex[idx], 4.9, 3.7, { verso: null }); pl.position.set(0, 3.3, 0); pl.rotation.x = -.28; obj.add(pl);
      const moldura = new Mesh(new BoxGeometry(5.1, 3.9, .12), madeira); moldura.position.set(0, 3.3, -.12); moldura.rotation.x = -.28; obj.add(moldura);
      grupo.add(obj);
      const id = "pl" + k, pn = PAINEIS[idx], hot = { id, x, z, r: TF.placaLeitura * U * 1.2, rotulo: () => "Ler placa: " + pn.titulo.join(" "), acao: () => abre(pn, id) };
      cen.hotspots.push(hot); S.placas.push({ obj, hot, id, pn, x, z, path: path.nome, s });
    });
  }
  /* leitor em tela */
  function abre(pn, id){
    if(!M.ui || S.leitor) return; M.ctx && M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:55;background:rgba(5,6,3,.84);display:grid;place-items:center;pointer-events:auto;"; el.addEventListener("pointerdown", e => { e.preventDefault(); fecha(); });
    const cx = document.createElement("div"); cx.style.cssText = "width:min(720px,94%);max-height:92%;overflow:auto;border:3px solid #7a5a3a;border-radius:18px;background:#efe6cf;color:#26231a;padding:22px 26px;font:600 clamp(18px,3.2vw,26px)/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 0 50px rgba(0,0,0,.6);";
    cx.innerHTML = '<div style="background:#1f5a3a;color:#f6f1de;border-radius:10px;padding:12px 16px;font-weight:800;font-size:1.05em;letter-spacing:.3px;text-align:center">' + pn.titulo.join("<br>") + '</div><p style="margin:18px 4px">' + pn.texto + '</p><div style="text-align:center;font-size:.55em;color:#5a5a48">Parque Nacional da Serra Geral · [E] ou [Esc] para fechar</div>';
    el.appendChild(cx); M.ui.appendChild(el); S.leitor = el;
    S.lidas.add(id); try{ localStorage.setItem("sgv:placas", JSON.stringify([...S.lidas])); }catch(_){ /* */ }
    if(M.conquistas && S.placas.length && S.placas.every(p => S.lidas.has(p.id))) M.conquistas.dar("leitor", "Leitor da Serra", "Leu todas as placas das turfeiras.");
  }
  function fecha(){ if(S.leitor){ S.leitor.remove(); S.leitor = null; return true; } return false; }
  const tecla = (e) => { if(!S.leitor) return false; if(e.code === "KeyE" || e.code === "Escape" || e.code === "Enter"){ fecha(); e.preventDefault(); return true; } e.preventDefault(); return true; };
  gera();
  return { S, gera, abre, fecha, tecla, desliga: () => { fecha(); }, info: () => "Placas " + S.placas.length + " (lidas " + [...S.lidas].filter(i => S.placas.some(p => p.id === i)).length + ")", lista: () => S.placas };
}
