import { canvasTex } from "../../lib.js";

/* ============================================================================================================
   LOGO DO ICMBio, redesenhada em canvas (mapa do Brasil feito de bolinhas + "ICMBio" + "INSTITUTO CHICO MENDES" + "MMA").
   Se você tiver o arquivo oficial, salve como fotos/icmbio-logo.png e troque o desenho por uma <img> aqui (uma função só: desenhaLogo).
   O desenho é sempre feito em coordenadas normais (texto da esquerda para a direita): a leitura certa nas costas, no peito e nas portas vem de como o
   PLANO é virado (ver placaLegivel e os decalques das camionetes), nunca de escala negativa nem de textura espelhada.
   ============================================================================================================ */

/* contorno do Brasil (lon, lat) bem simplificado */
const BR = [[-60.1, 5.3], [-57.5, 2], [-54, 2.2], [-51.7, 4.2], [-50, 1.5], [-48, -1], [-44.5, -2.4], [-41, -2.9], [-37, -4.8], [-35, -5.2], [-34.8, -8], [-36.5, -10.5], [-37.8, -12.5], [-39, -15], [-39.2, -18], [-40.8, -21], [-41.8, -23], [-44.5, -23.5], [-48.1, -25.5], [-48.7, -28], [-50.5, -30.5], [-53.4, -33.7], [-53.3, -32], [-55.5, -30.2], [-57.6, -30.2], [-56, -28], [-54.5, -27], [-54, -25.5], [-54.6, -24], [-57.5, -22.2], [-58, -20], [-58.2, -17.5], [-60, -16.2], [-60.2, -13.5], [-65, -11.5], [-69.5, -11], [-72.5, -9.7], [-70.7, -11], [-73.5, -7.5], [-72, -4], [-69.5, -4.2], [-70, -1], [-69.5, 1.5], [-66.8, 1.2], [-64, 4]];
const dentro = (x, y) => { let c = false; for(let i = 0, j = BR.length - 1; i < BR.length; j = i++){ const [xi, yi] = BR[i], [xj, yj] = BR[j]; if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

let pontos = null;
const gera = () => {
  if(pontos) return pontos; pontos = []; let s = 90210; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for(let k = 0; k < 4000 && pontos.length < 190; k++){
    const lon = -74 + r() * 40, lat = -34 + r() * 39.5; if(!dentro(lon, lat)) continue;
    const rad = .55 + Math.pow(r(), 1.7) * 1.9;
    if(pontos.some(p => Math.hypot(p[0] - lon, p[1] - lat) < (p[2] + rad) * .82)) continue;
    pontos.push([lon, lat, rad, r()]);
  }
  return pontos;
};

/** cor: "branco" (para fundo escuro: costas do colete, camiseta preta/verde) · "verde" (para fundo claro: porta da camionete) */
export function desenhaLogo(c, w, h, cor = "branco"){
  const A = w, escala = A / 512, topo = 0, mapaH = h * .62;
  const claro = cor === "branco";
  const tons = claro ? ["#ffffff", "#ffffff", "#e6e6e6", "#bdbdbd", "#8f8f8f"] : ["#0a5a2c", "#0f7a3a", "#2a9a45", "#7dc243", "#b6d83c"];
  gera().forEach(([lon, lat, rad, q]) => {
    const x = (lon + 74) / 40 * w * .62 + w * .19, y = topo + (5.5 - lat) / 39.5 * mapaH * .96 + mapaH * .02;
    c.fillStyle = tons[Math.floor(q * tons.length) % tons.length]; c.beginPath(); c.arc(x, y, rad * w / 512 * 5.3, 0, 7); c.fill();
  });
  c.textAlign = "center"; c.fillStyle = claro ? "#ffffff" : "#0a5a2c";
  c.font = "900 " + Math.round(h * .27) + "px Arial Black, Arial, sans-serif"; c.fillText("ICMBio", w / 2, h * .62 + h * .21);
  c.font = "bold " + Math.round(h * .062) + "px Arial, sans-serif"; c.fillText("INSTITUTO CHICO MENDES", w / 2, h * .62 + h * .29);
  c.font = "bold " + Math.round(h * .1) + "px Arial, sans-serif"; c.fillText("MMA", w / 2, h * .62 + h * .385);
  void escala;
}

const cache = {};
/** textura da logo (fundo transparente); `hd` = superamostragem */
export function texLogo(cor = "branco", w = 256, h = 300){
  const k = cor + w; if(cache[k]) return cache[k];
  const t = canvasTex(w, h, (c, ww, hh) => { c.clearRect(0, 0, ww, hh); desenhaLogo(c, ww, hh, cor); }, { hd: 4, aniso: 8 }); return (cache[k] = t);
}
export const LOGO_ASPECTO = 300 / 256;
