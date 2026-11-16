import { constroiOperadoraDetalhada } from './operadora-detalhada.js';
export { TRANCAS_MARY } from './operadora-detalhada.js';
export function constroiMary(H,def){const r=constroiOperadoraDetalhada(H,def);r.p.maryVisual=r.p.operadoraVisual;delete r.p.operadoraVisual;return r;}
