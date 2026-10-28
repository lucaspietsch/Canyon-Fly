import { KML, DEM as C } from "../config.js";
import { mundoParaLatLon } from "../resgate/kml.js";

/* ============================================================================================================
   ELEVAÇÃO REAL (modelo digital de elevação SRTM 30 m), lida de data/terrain/elevacao.json + elevacao.bin (gerados por tools/baixar_elevacao.py).
   Grade regular lat/lon (linha 0 = norte, coluna 0 = oeste), altitudes em decímetros (int16). O jogo só lê esses arquivos locais (Live Server, sem internet).
   Sem os arquivos: `pronto` fica falso e o terreno usa só a ondulação suave de reserva.
   API: alt(lat, lon) → metros · altReal(x, z) → metros (x, z = coordenadas "reais" do KML no mundo, antes de qualquer deslocamento/compressão).
   ============================================================================================================ */

export function criarDEM(M){
  const S = { pronto: false, meta: null, g: null, erro: "", ouvintes: [] };
  const alt = (lat, lon) => {
    const m = S.meta; if(!m) return 0; const i = (lon - m.lon0) / m.dlon, j = (m.lat0 - lat) / m.dlat; const i0 = Math.max(0, Math.min(m.nx - 2, Math.floor(i))), j0 = Math.max(0, Math.min(m.nz - 2, Math.floor(j))), fx = Math.max(0, Math.min(1, i - i0)), fy = Math.max(0, Math.min(1, j - j0)), g = S.g, nx = m.nx, k = j0 * nx + i0;
    return ((g[k] * (1 - fx) + g[k + 1] * fx) * (1 - fy) + (g[k + nx] * (1 - fx) + g[k + nx + 1] * fx) * fy) / m.escala;
  };
  const altReal = (x, z) => { const [la, lo] = mundoParaLatLon(x, z); return alt(la, lo); };
  async function carrega(){
    try{
      if(typeof fetch !== "function" || !/^https?:/.test(location.protocol)) { S.erro = "sem servidor (abra pelo Live Server)"; return false; }
      const r = await fetch(C.pasta + "elevacao.json", { cache: "no-cache" }); if(!r.ok){ S.erro = "data/terrain/elevacao.json não encontrado (rode tools/baixar_elevacao.py)"; return false; }
      const meta = await r.json(), b = await fetch(C.pasta + "elevacao.bin", { cache: "no-cache" }); if(!b.ok){ S.erro = "elevacao.bin não encontrado"; return false; }
      const buf = await b.arrayBuffer(); if(buf.byteLength < meta.nx * meta.nz * 2){ S.erro = "elevacao.bin incompleto"; return false; }
      S.meta = meta; S.g = new Int16Array(buf, 0, meta.nx * meta.nz); S.pronto = true; S.erro = "";
      S.ouvintes.forEach(f => { try{ f(S); }catch(e){ console.warn("dem:", e); } }); return true;
    }catch(e){ S.erro = String(e.message || e); return false; }
  }
  const info = () => S.pronto ? "Elevação real: " + S.meta.min + "–" + S.meta.max + " m (" + S.meta.fonte + ")" : "Elevação real: não carregada" + (S.erro ? " — " + S.erro : "");
  return { S, alt, altReal, carrega, info, aoCarregar: (f) => S.ouvintes.push(f), get pronto(){ return S.pronto; }, get meta(){ return S.meta; } };
}
