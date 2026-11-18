import {MODOS_RESOLUCAO} from './resolucao.js';
/** Controles acessíveis mesmo com o HUD simplificado. */
export function criarAjustesJogador(pai,H){
 const panel=document.createElement('details');panel.dataset.cfAjustes='';panel.style.cssText='position:absolute;left:50%;top:8px;transform:translateX(-50%);pointer-events:auto;color:#eef1df;font:14px system-ui;z-index:45;';pai.append(panel);
 const summary=document.createElement('summary');summary.textContent='Pit / Desempenho';summary.style.cssText='cursor:pointer;background:#17241fee;border:1px solid #8a9a3b;border-radius:10px;padding:10px 14px;';panel.append(summary);
 const body=document.createElement('div');body.style.cssText='display:grid;gap:8px;padding:12px;background:#17241ff5;border:1px solid #8a9a3b;border-radius:10px;width:240px;max-height:65dvh;overflow:auto;';panel.append(body);
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.style.cssText='min-height:42px;border:1px solid #779884;background:#213b32;color:#fff;border-radius:8px;cursor:pointer;';b.onclick=fn;body.append(b);return b;};
 const transform=button('Transformar Pit (T)',()=>H.mundo?.transformacao.alternaPit());transform.dataset.pitTransformar='';
 const voo=button('Voar rápido (G)',()=>H.mundo?.poderes.pit.voo());voo.dataset.pitVoo='';
 const hint=document.createElement('small');hint.textContent='Voo: setas movem, Shift acelera, Espaço sobe e Ctrl desce. G para pousar.';body.append(hint);
 const label=document.createElement('label');label.textContent='Resolução do jogo ';const select=document.createElement('select');select.setAttribute('aria-label','Resolução do jogo');select.style.cssText='width:100%;min-height:42px;background:#15251f;color:#fff;border:1px solid #779884;border-radius:8px;';for(const [id,m]of Object.entries(MODOS_RESOLUCAO)){const o=new Option(m.nome,id);select.add(o);}select.value=H.resolucao?.().modo||'auto';select.onchange=()=>H.resolucao?.(select.value);label.append(select);body.append(label);
 const lower=document.createElement('small');lower.textContent='Baixa e Mínima reduzem os pixels desenhados para aliviar a placa de vídeo.';body.append(lower);
 function tick(){const M=H.mundo,pit=M?.personagens.ativo==='pit',on=pit&&M.transformacao.ativa()&&M.transformacao.S.id==='pit';transform.hidden=!pit;voo.hidden=!on;hint.hidden=!on;transform.textContent=on?'Voltar ao normal (T)':'Transformar Pit (T)';transform.setAttribute('aria-pressed',String(on));voo.textContent=M?.poderes.pit.voando()?'Pousar (G)':'Voar rápido (G)';voo.setAttribute('aria-pressed',String(!!M?.poderes.pit.voando()));}
 tick();return{tick,panel};
}
