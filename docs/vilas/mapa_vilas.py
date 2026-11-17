#!/usr/bin/env python3
"""Mapa-base das VILAS (Oswaldo Kroeff, Santana, Ouro Verde + Olaria e Cambará S/A) a partir de data/kml/parque.kml.
Divide cada vila em quadrantes de 250 m (letra = coluna oeste→leste, número = linha norte→sul), com link do Google Maps
(satélite) e do Street View no centro de cada quadrante — para o Lucas mandar prints e KML das ruas, como foi feito na cidade.
Gera docs/vilas/MAPA-VILAS.svg e docs/vilas/QUADRANTES.md.   Rodar: python3 docs/vilas/mapa_vilas.py"""
import os, re, html
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.dirname(os.path.dirname(AQUI))
MLAT, MLON, Q = 110540.0, 97316.0, 250
s = open(os.path.join(RAIZ, "data/kml/parque.kml"), encoding="utf-8").read()
P = {}
for pm in re.split(r"<Placemark", s)[1:]:
    n = re.search(r"<name>(.*?)</name>", pm, re.S).group(1).strip(); c = re.search(r"<coordinates>(.*?)</coordinates>", pm, re.S)
    if c: P[n] = [tuple(map(float, p.split(",")[:2])) for p in c.group(1).split()]
VILAS = [("Vila Oswaldo Kroeff", "vila oswaldo kroeff", "OK", "#3a8fd8"), ("Vila Santana (1950)", "vila santana", "SA", "#c8792a"),
         ("Vila Ouro Verde", "vila ouro verde", "OV", "#2f9e57")]
EXTRAS = [("Antiga Floresta da Olaria", "AREA A ANTIGA FLORESTA DA OLARIA", "#6b8f3a"), ("Parque Industrial (Celulose)", "área Parque Industrial Celulose Cambará", "#999"),
          ("Cambará S/A", "cambara s/a", "#a33")]
todos = [P[k] for _, k, *_ in VILAS] + [P[k] for _, k, _ in EXTRAS]
lon0 = min(p[0] for L in todos for p in L) - .002; lat1 = max(p[1] for L in todos for p in L) + .002
lon1 = max(p[0] for L in todos for p in L) + .002; lat0 = min(p[1] for L in todos for p in L) - .002
ESC = .28; X = lambda lon: 20 + (lon - lon0) * MLON * ESC; Y = lambda lat: 80 + (lat1 - lat) * MLAT * ESC
W, H = X(lon1) + 20, Y(lat0) + 40
def dentro(poly, lon, lat):
    d = False; j = len(poly) - 1
    for i in range(len(poly)):
        (xi, yi), (xj, yj) = poly[i], poly[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi: d = not d
        j = i
    return d
o = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" font-family="sans-serif">' % (W, H), '<rect width="100%" height="100%" fill="#f6f4ee"/>',
     '<text x="20" y="30" font-size="20" font-weight="bold" fill="#333">Vilas de Cambará do Sul — quadrantes de 250 m para prints</text>',
     '<text x="20" y="54" font-size="13" fill="#555">Letra = coluna (oeste→leste) · número = linha (norte→sul) · links em QUADRANTES.md · norte para cima</text>']
for nome, k, cor in EXTRAS:
    o.append('<polygon points="%s" fill="%s" fill-opacity=".12" stroke="%s" stroke-dasharray="6 4"/>' % (" ".join("%.1f,%.1f" % (X(a), Y(b)) for a, b in P[k]), cor, cor))
    a = sum(p[0] for p in P[k]) / len(P[k]); b = max(p[1] for p in P[k])
    o.append('<text x="%.1f" y="%.1f" font-size="12" fill="%s" text-anchor="middle" font-style="italic">%s</text>' % (X(a), Y(b) - 6, cor, html.escape(nome)))
md = ["# Quadrantes das vilas — prints que faltam", "", "Gerado por `docs/vilas/mapa_vilas.py`. Mapa: `MAPA-VILAS.svg`. Cada quadrante tem 250 m × 250 m.", "",
      "Para cada vila, o ideal (igual à cidade): **1) um KML do Google Earth com as ruas** (uma linha por rua, com o nome) e **2) prints do Street View** das casas, dizendo o código do quadrante.", ""]
for nome, k, sig, cor in VILAS:
    poly = P[k]; o.append('<polygon points="%s" fill="%s" fill-opacity=".18" stroke="%s" stroke-width="2"/>' % (" ".join("%.1f,%.1f" % (X(a), Y(b)) for a, b in poly), cor, cor))
    a0, a1 = min(p[0] for p in poly), max(p[0] for p in poly); b0, b1 = min(p[1] for p in poly), max(p[1] for p in poly)
    nc = int((a1 - a0) * MLON // Q) + 1; nl = int((b1 - b0) * MLAT // Q) + 1; quad = []
    for c in range(nc):
        for l in range(nl):
            la, lb = a0 + c * Q / MLON, b1 - l * Q / MLAT; ca, cb = la + Q / MLON / 2, lb - Q / MLAT / 2
            amostra = [(la + i * Q / MLON / 4, lb - j * Q / MLAT / 4) for i in range(5) for j in range(5)]
            if not any(dentro(poly, x, y) for x, y in amostra): continue
            cod = "%s-%s%d" % (sig, chr(65 + c), l + 1); quad.append((cod, cb, ca))
            o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="none" stroke="%s" stroke-opacity=".55" stroke-width=".8"/>' % (X(la), Y(lb), Q * ESC, Q * ESC, cor))
            o.append('<text x="%.1f" y="%.1f" font-size="9" fill="%s" text-anchor="middle">%s</text>' % (X(ca), Y(cb) + 3, cor, cod[3:]))
    a = sum(p[0] for p in poly) / len(poly)
    o.append('<text x="%.1f" y="%.1f" font-size="15" font-weight="bold" fill="%s" text-anchor="middle">%s</text>' % (X(a), Y(b1) - 10, cor, html.escape(nome)))
    md += ["## %s — %d quadrantes" % (nome, len(quad)), "", "| Quadrante | centro (lat, lon) | Satélite | Street View |", "|---|---|---|---|"]
    md += ["| **%s** | %.5f, %.5f | [mapa](https://www.google.com/maps/@%.6f,%.6f,250m/data=!3m1!1e3) | [abrir](https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=%.6f,%.6f) |" % (cod, la_, lo_, la_, lo_, la_, lo_) for cod, la_, lo_ in quad] + [""]
# escala
o.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#333" stroke-width="2"/><text x="%d" y="%d" font-size="12" fill="#333">500 m</text>' % (20, H - 18, 20 + 500 * ESC, H - 18, 26 + 500 * ESC, H - 14))
o.append("</svg>")
open(os.path.join(AQUI, "MAPA-VILAS.svg"), "w", encoding="utf-8").write("\n".join(o))
open(os.path.join(AQUI, "QUADRANTES.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print("ok", W, H)
