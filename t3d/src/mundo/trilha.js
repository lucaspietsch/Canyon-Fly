// Prioridades musicais: ação roteirizada > aparição > seleção > ambiente.
export function escolheTrilha(c){if(c.descida)return 'tirolesa';if(c.tupaEvento)return 'tupa';if(c.sepeEvento)return 'sepe';if(c.escolha||c.transformando)return 'personagens';if(c.anhanga)return 'anhanga';if(c.terror)return 'terror';if(c.personagem==='tupa')return 'tupa';if(c.personagem==='sepe')return 'sepe';if(c.personagem==='atiara')return 'atiara';return 'ambiente';}
export function criarTrilha(M){let cena=null,ate=0,transAte=0;
 function evento(id,seg=12){cena=id;ate=performance.now()+seg*1000;}
 function tick(){const audio=window.CanyonMusic;if(!audio)return;const J=M.jogador(),hora=M.ciclo.hora(),mata=J&&M.vegetacao?.fatorMata(J.x,J.z)>0,gritador=M.poderes?.alvos?.some(a=>a.id==='gritador'&&!a.morto&&a.g?.visible),cinema=M.H.andarMod?.emCinema?.(),descida=M.H.jogo?.musicaCena==='tirolesa'&&(cinema||M.opts?.jogo3d),tupaEvento=cena==='tupa'&&performance.now()<ate,sepeEvento=cena==='sepe'&&performance.now()<ate;
 audio.troca(escolheTrilha({descida,tupaEvento,sepeEvento,escolha:!!M.personagens?.S.tela,transformando:performance.now()<transAte,anhanga:!!M.anhanga?.S.vivo,terror:gritador||mata&&(hora<6||hora>=18),personagem:M.personagens?.ativo}));}
 return {tick,evento,transformou(){transAte=performance.now()+9000;},desliga(){window.CanyonMusic?.troca('ambiente');}};
}
