// Comunicação diegética de Krig nas missões do parque, sem avançar objetivos.
export function criarCoordenacao(M){
 function radio(texto){M.terminal?.msg('tirolesa','📻 Krig · Coordenação: '+texto);const r=M.H?.jogo?.atores?.coord;r?.krigVisual?.radio(4);return texto;}
 function evento(tipo,{m}={}){if(!m||M.zonas?.atual!=='parque'||M.lugares?.epoca?.()==='1950')return;
  if(tipo==='inicia')radio('Equipe, iniciando '+m.titulo+'. Confiram os equipamentos e mantenham o rádio aberto.');
  else if(tipo==='conclui')radio('Missão concluída. Equipe, confirmem o recolhimento dos equipamentos.');
  else if(tipo==='falha')radio('Equipe, interrompam a atividade e aguardem orientação da coordenação.');
 }
 M.missoes?.ouve?.(evento);return {radio,evento};
}
