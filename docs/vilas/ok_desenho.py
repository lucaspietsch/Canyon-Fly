#!/usr/bin/env python3
"""Desenha docs/vilas/ok-leitura.json (ruas e casas lidas dos prints) em docs/vilas/OK-LEITURA.svg — uma cor por print, para conferir se as ruas emendam."""
import json, os, html
AQUI = os.path.dirname(os.path.abspath(__file__)); D = json.load(open(os.path.join(AQUI, "ok-leitura.json"), encoding="utf-8"))
pts = [p for v in D["ruas"].values() for p in v] + [(c[1], c[2]) for c in D["casas"]]
x0, x1 = min(p[0] for p in pts) - 40, max(p[0] for p in pts) + 40; y0, y1 = min(p[1] for p in pts) - 40, max(p[1] for p in pts) + 40
E = 1.6; X = lambda x: 20 + (x - x0) * E; Y = lambda y: 60 + (y1 - y) * E
COR = {"OK-M1": "#d8423a", "OK-M2": "#e8902a", "OK-M3": "#3a9a4a", "OK-M4": "#3a7bd8", "OK-M5": "#8a4ad8", "OK-M6": "#c03a9a", "OK-M7": "#2aa8a8", "OK-M8": "#777", "OK-M9": "#b8892a", "OK-M10": "#2a5a9a", "OK-M11": "#9a2a5a", "OK-M12": "#5a9a2a"}
o = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" font-family="sans-serif"><rect width="100%%" height="100%%" fill="#f6f4ee"/>' % (X(x1) + 20, Y(y0) + 20),
     '<text x="20" y="30" font-size="18" font-weight="bold">Vila Oswaldo Kroeff — leitura dos prints do Google Earth (norte para cima, metros)</text>']
for c in D["casas"]:
    w, d = c[3] * E, c[4] * E; o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" fill-opacity=".45"/>' % (X(c[1]) - w / 2, Y(c[2]) - d / 2, w, d, COR.get(c[0], "#999")))
for k, v in D["ruas"].items():
    cod = k.split()[0]; o.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="5" stroke-opacity=".75" stroke-linecap="round"/>' % (" ".join("%.1f,%.1f" % (X(a), Y(b)) for a, b in v), COR.get(cod, "#999")))
    a, b = v[len(v) // 2]; o.append('<text x="%.1f" y="%.1f" font-size="10" fill="#333">%s</text>' % (X(a) + 4, Y(b) - 4, html.escape(k[6:40])))
for n, (a, b) in D["pontos"].items():
    o.append('<circle cx="%.1f" cy="%.1f" r="5" fill="#111"/><text x="%.1f" y="%.1f" font-size="11" font-weight="bold">%s</text>' % (X(a), Y(b), X(a) + 7, Y(b) + 4, html.escape(n.split(" (")[0])))
o.append('<g font-size="12">' + "".join('<rect x="%d" y="40" width="12" height="12" fill="%s"/><text x="%d" y="51">%s</text>' % (20 + i * 90, c, 36 + i * 90, k) for i, (k, c) in enumerate(COR.items())) + "</g>")
o.append('<line x1="20" y1="%d" x2="%d" y2="%d" stroke="#333" stroke-width="2"/><text x="%d" y="%d" font-size="12">100 m</text></svg>' % (Y(y0) + 5, 20 + 100 * E, Y(y0) + 5, 26 + 100 * E, Y(y0) + 9))
open(os.path.join(AQUI, "OK-LEITURA.svg"), "w", encoding="utf-8").write("\n".join(o))
