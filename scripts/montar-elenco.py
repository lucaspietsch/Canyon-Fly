"""Monta as galerias usando as capturas reais geradas por t3d/test/browser/elenco.cjs."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, math, html
p = Path(__file__).resolve().parents[1] / 'docs/media/elenco-atual'
data = json.loads((p/'indice.json').read_text())
font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
sections = []
for cat, titulo in [('personagens','PERSONAGENS E FORMAS'),('npcs','NPCs E CRIATURAS'),('animais','ANIMAIS E VARIANTES')]:
    cards=data[cat]; cols=5; w=1800; pad=30; gap=12; cw=(w-pad*2-gap*(cols-1))//cols; ch=cw+58
    h=150+math.ceil(len(cards)/cols)*(ch+gap)+50
    out=Image.new('RGB',(w,h),'#12241d'); d=ImageDraw.Draw(out)
    d.text((pad,25),'CANYON FLY · '+titulo,font=ImageFont.truetype(bold,32),fill='#f5f0dc')
    d.text((pad,80),'Modelos atuais do jogo · enquadramentos para comparação',font=ImageFont.truetype(font,21),fill='#afc7b7')
    for i,c in enumerate(cards):
        x=pad+i%cols*(cw+gap); y=140+i//cols*(ch+gap)
        im=Image.open(p/c['arquivo']).convert('RGB'); im.thumbnail((cw,cw)); out.paste(im,(x+(cw-im.width)//2,y))
        label=c['nome']; lines=[]
        while len(label)>27:
            k=label.rfind(' ',0,27); k=k if k>0 else 27; lines.append(label[:k]); label=label[k:].strip()
        lines.append(label)
        for j,line in enumerate(lines[:2]):d.text((x+5,y+cw+4+j*23),line,font=ImageFont.truetype(font,17),fill='#f5f0dc')
    d.text((pad,h-35),str(len(cards))+' vistas · visitantes aleatórios representados por tipos',font=ImageFont.truetype(font,17),fill='#afc7b7')
    out.save(p/(cat+'.jpg'),quality=92)
    sections.append('<h2>'+titulo+'</h2><div class="grid">'+''.join('<figure><a href="'+c['arquivo']+'"><img loading="lazy" src="'+c['arquivo']+'"></a><figcaption>'+html.escape(c['nome'])+'</figcaption></figure>' for c in cards)+'</div>')
(p/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Canyon Fly · Elenco</title><style>body{background:#12241d;color:#f5f0dc;font:16px system-ui;margin:3vw}h1,h2{color:#dbc994}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}figure{margin:0;background:#25372f;padding:12px;border-radius:12px}img{width:100%}figcaption{padding:8px}</style><h1>Canyon Fly · Elenco atual</h1><p>Capturas dos modelos do jogo. Tipos de visitantes representam a população aleatória.</p>'+''.join(sections))
print({k:len(data[k])for k in ['personagens','npcs','animais']})
