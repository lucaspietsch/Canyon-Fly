import { canvasTex } from "../../lib.js";

/* ============================================================================================================
   IDENTIFICAÇÃO FICTÍCIA nas costas e no peito dos uniformes do bombeiro civil e da equipe de resgate/enfermagem.
   Desenhadas em canvas em coordenadas normais; a leitura certa vem de como o plano é virado (planos de UMA face, orientados), nunca de escala negativa.
   ============================================================================================================ */

const faixa = (c, x, y, w, h) => { c.fillStyle = "#c8ccd0"; c.fillRect(x, y, w, h); c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(x, y, w, h * .35); };
const emblema = (c, cx, cy, r, anel = "#e8731a") => {                      // círculo laranja com cruz-estrela (símbolo genérico de socorro; sem marca de nenhum serviço real)
  c.fillStyle = anel; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#f6f2e8"; c.beginPath(); c.arc(cx, cy, r * .82, 0, 7); c.fill();
  c.strokeStyle = "#d0301e"; c.lineWidth = r * .22; c.lineCap = "round";
  for(let i = 0; i < 3; i++){ const a = i * Math.PI / 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6); c.lineTo(cx - Math.cos(a) * r * .6, cy - Math.sin(a) * r * .6); c.stroke(); }
};
const escudo = (c, cx, cy, r) => {                                         // emblema fictício do bombeiro civil
  c.fillStyle = "#e9b21c"; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.fillStyle = "#1a1a1a"; c.beginPath(); c.arc(cx, cy, r * .78, 0, 7); c.fill();
  c.strokeStyle = "#e0301e"; c.lineWidth = r * .2; c.lineCap = "round"; c.beginPath(); c.moveTo(cx - r * .45, cy - r * .45); c.lineTo(cx + r * .45, cy + r * .45); c.moveTo(cx + r * .45, cy - r * .45); c.lineTo(cx - r * .45, cy + r * .45); c.stroke();
  c.fillStyle = "#f6f2e8"; c.beginPath(); c.arc(cx, cy, r * .22, 0, 7); c.fill();
};
const cache = {};
const tex = (k, w, h, f) => cache[k] || (cache[k] = canvasTex(w, h, (c, ww, hh) => { c.clearRect(0, 0, ww, hh); f(c, ww, hh); }, { hd: 3, aniso: 8 }));

export const texTag = (tipo, lado) => tex(tipo + lado, lado === "costas" ? 320 : 128, lado === "costas" ? 190 : 128, (c, w, h) => {
  c.textAlign = "center"; c.textBaseline = "alphabetic";
  if(lado === "peito"){ if(tipo === "bomb") escudo(c, w / 2, h / 2, h * .42); else emblema(c, w / 2, h / 2, h * .42); return; }
  if(tipo === "bomb"){                                                                  // BOMBEIRO / CIVIL entre duas faixas refletivas (como na referência)
    faixa(c, 18, 14, w - 36, 24); c.fillStyle = "#f4f4f2"; c.font = "900 56px Arial Black, Arial, sans-serif"; c.fillText("BOMBEIRO", w / 2, 98); c.font = "900 50px Arial Black, Arial, sans-serif"; c.fillText("CIVIL", w / 2, 146); faixa(c, 18, 158, w - 36, 22);
  } else { const nome = tipo === "resg" ? "RESGATE" : "ENFERMAGEM"; faixa(c, 18, 10, w - 36, 22); emblema(c, w / 2, 76, 36); c.fillStyle = "#f4f4f2"; c.font = "900 " + (tipo === "resg" ? 46 : 38) + "px Arial Black, Arial, sans-serif"; c.fillText(nome, w / 2, 148); c.font = "bold 22px Arial, sans-serif"; c.fillText("192 · SGV", w / 2, 178); }
});
