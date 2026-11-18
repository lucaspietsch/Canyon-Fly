"""Monta a galeria de capturas reais de moradores e transporte em 1950."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,html,math
p=Path(__file__).resolve().parents[1]/'docs/media/historico-1950'
data=json.loads((p/'catalogo.json').read_text())
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
vilas={'santana':'Santana','ouro-verde':'Ouro Verde','oswaldo-kroeff':'Oswaldo Kroeff'}
def sheet(cards,title,file):
 cols=3;cw=600;ch=680;out=Image.new('RGB',(1800,100+math.ceil(len(cards)/cols)*ch),'#192a22');d=ImageDraw.Draw(out);d.text((25,25),title,font=ImageFont.truetype(font,32),fill='#eee5cf')
 for i,c in enumerate(cards):
  x=i%cols*cw;y=100+i//cols*ch;im=Image.open(p/c['arquivo']).convert('RGB');im.thumbnail((590,590));out.paste(im,(x+(cw-im.width)//2,y));d.text((x+20,y+600),c['nome'],font=ImageFont.truetype(font,23),fill='#eee5cf');d.text((x+20,y+632),c.get('legenda',''),font=ImageFont.truetype(font,20),fill='#b8c7b5')
 out.save(p/file,quality=94)
people=[{'nome':c['nome'],'legenda':vilas[c['vila']]+' · '+c['papel'],'arquivo':'gaucho-'+c['id']+'.png'} for c in data['moradores']]
trucks=[{'nome':'Caminhão com toras','legenda':'Toras de 1,44 a 1,80 m no modelo','arquivo':'caminhao-toras.png'},{'nome':'Tora gigante de araucária','legenda':'Uma tora de 2,50 m de diâmetro no modelo','arquivo':'caminhao-gigante.png'},{'nome':'Caminhão com tábuas','legenda':'35 camadas e cintas de amarração','arquivo':'caminhao-tabuas.png'}]
sheet(people,'MORADORES GAÚCHOS · VILAS EM 1950','gauchos.jpg');sheet(trucks,'CAMINHÕES DE ÉPOCA · TRANSPORTE DE MADEIRA','caminhoes.jpg')
world=[{'nome':'Vila '+name,'arquivo':'vila-'+id+'.png'} for id,name in vilas.items()]
preview=[{'nome':'Prévia dos lenhadores · locais de corte pendentes','arquivo':'lenhadores-previa-sem-local.png'}]
sections=[]
for title,cards in [('Moradores em 1950',people),('Cargas de madeira',trucks),('Presença nas vilas',world),('Extração · prévia técnica',preview)]:
 sections.append('<h2>'+title+'</h2><div class="grid">'+''.join('<figure><a href="'+c['arquivo']+'"><img loading="lazy" src="'+c['arquivo']+'"></a><figcaption>'+html.escape(c['nome'])+'<br>'+html.escape(c.get('legenda',''))+'</figcaption></figure>' for c in cards)+'</div>')
(p/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>1950 · Gaúchos e madeira</title><style>body{background:#192a22;color:#eee5cf;font:18px system-ui;margin:3vw}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}figure{margin:0}img{width:100%}figcaption{padding:12px}h2{margin-top:40px}</style><h1>Gaúchos e transporte de madeira · 1950</h1><p>Modelos reais do jogo adaptados às referências. Moradores fictícios; medidas das cargas são escolhas de modelagem. Os locais de extração aguardam as coordenadas do usuário.</p>'+''.join(sections))
