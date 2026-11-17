"""Monta uma folha de contato com os prints reais de olaria-game.cjs."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import html
p=Path(__file__).resolve().parents[1]/'docs/media/olaria'
cards=[('Lobisomem','lobisomem'),('Anhangá · cervo branco','anhanga'),('Anhangá · humano','anhanga-humano'),('Anhangá · cervo humanoide','anhanga-cervo-humano'),('O Gritador','gritador'),('Boitatá','boitata')]
out=Image.new('RGB',(1600,1580),'#09131d');d=ImageDraw.Draw(out);font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
d.text((25,20),'FLORESTA SOMBRIA DA OLARIA',font=ImageFont.truetype(font,30),fill='#e2e9eb')
for i,(label,name) in enumerate(cards):
 x=i%2*800;y=80+i//2*500
 im=Image.open(p/(name+'.png')).convert('RGB');im.thumbnail((790,445));out.paste(im,(x+5,y));d.text((x+20,y+453),label,font=ImageFont.truetype(font,24),fill='#e2e9eb')
out.save(p/'personagens-mitologicos.jpg',quality=94)
allcards=[('Clareira · conjunto','conjunto')]+cards+[('Arranhão · esquerda','garra-esquerda'),('Arranhão · direita','garra-direita')]
(p/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Olaria · Personagens mitológicos</title><style>body{background:#09131d;color:#e2e9eb;font:18px system-ui;margin:3vw}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px}img{width:100%}figure{margin:0}figcaption{padding:10px}</style><h1>Floresta sombria da Olaria</h1><p>Capturas dos modelos reais do jogo em 1950. Dois arranhões alternados defendem Anhangá quando Tupã o ataca.</p><div class="grid">'+''.join('<figure><a href="'+name+'.png"><img src="'+name+'.png"></a><figcaption>'+html.escape(label)+'</figcaption></figure>' for label,name in allcards)+'</div>')
