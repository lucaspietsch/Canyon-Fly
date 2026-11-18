export const MODOS_RESOLUCAO={auto:{nome:'Automática',escala:1},alta:{nome:'Alta · 100%',escala:1},media:{nome:'Média · 75%',escala:.75},baixa:{nome:'Baixa · 50%',escala:.5},minima:{nome:'Mínima · 35%',escala:.35}};
export const CHAVE_RESOLUCAO='canyonfly:resolucao';
export function perfilResolucao(modo,nativo){const id=Object.hasOwn(MODOS_RESOLUCAO,modo)?modo:'auto';return{modo:id,pixelRatio:Math.max(.25,nativo*MODOS_RESOLUCAO[id].escala),automatico:id==='auto'};}
