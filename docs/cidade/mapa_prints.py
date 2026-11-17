#!/usr/bin/env python3
"""Mapa de PRINTS QUE FALTAM: lê os prédios gerados (t3d/src/mundo/dados/cidade-centro.js) e o catálogo (mapa_progresso.py)
e marca no mapa:
  verde   = prédio com print do Street View (pronto para detalhar)
  laranja = prédio só visto no satélite (precisa de print da fachada)
  vermelho = casa GENÉRICA provisória (não sabemos como é — precisa de print), agrupada em TRECHOS numerados
Gera docs/cidade/MAPA-PRINTS.svg (geral), MAPA-PRINTS-CENTRO.svg (zoom no centro) e PRINTS-FALTANDO.md (lista com link do Street View).
Rodar depois de gera_cidade.py:  python3 docs/cidade/mapa_prints.py"""
import os, json, math, re, html, importlib.util
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.dirname(os.path.dirname(AQUI))
def carrega(nome):
    s = importlib.util.spec_from_file_location(nome, os.path.join(AQUI, nome + ".py")); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
G = carrega("gera_cidade"); MP = carrega("mapa_progresso")
txt = open(os.path.join(RAIZ, "t3d/src/mundo/dados/cidade-centro.js"), encoding="utf-8").read()
P = json.loads(re.search(r"PREDIOS_CENTRO = (\[.*\]);", txt, re.S).group(1))
REFS = {l[0]: l[6] for l in MP.LUGARES}
SIGLA = {"avenida getulio vargas": "AV", "rua dona ursula": "DU", "rua quinze de marco": "QM", "rua laurindo francisco de macedo": "LM",
         "rua vinte de setembro": "VS", "rua joaquim pereira": "JP", "rua joao francisco riter": "JR", "rua dom pedro ii": "DP",
         "rua padre joao paza": "PP", "rua procopio freire dos santos": "PF", "rua tradicao": "TR", "rua osvaldo kroeff": "OK",
         "rua nartecia pereira": "NP", "rua coronel vicente pereira": "CV", "rua dalfro filho": "DF"}
BONITO = {k: k.replace("avenida", "Av.").replace("rua", "R.").title().replace("Ii", "II").replace(" De ", " de ").replace(" Dos ", " dos ") for k in SIGLA}

def rua_de(x, y):
    best = (1e9, None, 0)
    for nome, pts in G.RUAS.items():
        acum = 0
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            vx, vy = x1 - x0, y1 - y0; L = math.hypot(vx, vy); t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / (L * L)))
            d = math.hypot(x0 + t * vx - x, y0 + t * vy - y)
            if d < best[0]: best = (d, nome, acum + t * L, 1 if (vx * (y - y0) - vy * (x - x0)) > 0 else -1)
            acum += L
    return best[1], best[2], best[3]

def classe(nome):
    if "precisa de print" in nome: return "gen"
    r = REFS.get(nome, "")
    if not r: return "sv"
    toks = r.split()
    return "sat" if all(t == "sat" or re.fullmatch(r"[A-Z]\d", t) for t in toks) else "sv"

# trechos: casas genéricas da mesma rua e do mesmo lado, em blocos de até 6 casas seguidas (≈ 100 m)
gen = [p for p in P if classe(p[0]) == "gen"]
porRua = {}
for p in gen:
    r, s, lado = rua_de(p[1], p[2]); porRua.setdefault((r, lado), []).append((s, p))
TRECHOS = []
for r in SIGLA:
    blocos = []
    for lado in (1, -1):
        L = sorted(porRua.get((r, lado), []), key=lambda t: t[0]); cur = []
        for s, p in L:
            if cur and (len(cur) >= 6 or s - cur[-1][0] > 40): blocos.append((lado, cur)); cur = []
            cur.append((s, p))
        if cur: blocos.append((lado, cur))
    blocos.sort(key=lambda b: b[1][0][0])
    for i, (lado, b) in enumerate(blocos, 1):
        xs = [p[1] for _, p in b]; ys = [p[2] for _, p in b]; cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
        # câmera do Street View: no meio da rua, em frente ao trecho
        _, fx, fy = G.rua_proxima(cx, cy)
        lon, lat = G.ll(fx, fy)
        TRECHOS.append(dict(cod="%s-%02d" % (SIGLA[r], i), rua=r, n=len(b), cx=cx, cy=cy, lat=lat, lon=lon, casas=[p for _, p in b]))

def svg(arq, x0, x1, y0, y1, esc, rotulos_sat=True):
    W, H = (x1 - x0) * esc + 40, (y1 - y0) * esc + 90
    X = lambda x: 20 + (x - x0) * esc; Y = lambda y: 70 + (y1 - y) * esc
    o = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" font-family="sans-serif">' % (W, H), '<rect width="100%" height="100%" fill="#f6f4ee"/>']
    for nome, pts in G.RUAS.items():
        o.append('<polyline points="%s" fill="none" stroke="#d5cebf" stroke-width="%.1f" stroke-linecap="round"/>' % (" ".join("%.1f,%.1f" % (X(a), Y(b)) for a, b in pts), max(4, 12 * esc)))
    for nome, pts in G.RUAS.items():
        a, b = pts[len(pts) // 2]
        o.append('<text x="%.1f" y="%.1f" font-size="%d" fill="#8a7f68" font-style="italic">%s</text>' % (X(a) + 4, Y(b) - 4, 11 if esc < 1 else 13, html.escape(BONITO[nome])))
    cor = {"sv": "#3a9a4a", "sat": "#e8902a", "gen": "#d8423a"}
    for p in P:
        c = classe(p[0]); w = max(2.5, p[3] * esc); d = max(2.5, p[4] * esc)
        o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" fill-opacity="%s" transform="rotate(%.1f %.1f %.1f)"/>' %
                 (X(p[1]) - w / 2, Y(p[2]) - d / 2, w, d, cor[c], ".55" if c == "gen" else ".9", -p[7], X(p[1]), Y(p[2])))
        if c == "sat" and rotulos_sat and x0 < p[1] < x1 and y0 < p[2] < y1:
            o.append('<text x="%.1f" y="%.1f" font-size="10" fill="#a8600f">%s</text>' % (X(p[1]) + w / 2 + 2, Y(p[2]) + 3, html.escape(p[0][:28])))
    for t in TRECHOS:
        if not (x0 < t["cx"] < x1 and y0 < t["cy"] < y1): continue
        o.append('<g><rect x="%.1f" y="%.1f" width="40" height="15" rx="4" fill="#fff" stroke="#d8423a"/><text x="%.1f" y="%.1f" font-size="11" font-weight="bold" fill="#b02a22" text-anchor="middle">%s</text></g>' %
                 (X(t["cx"]) - 20, Y(t["cy"]) - 7.5, X(t["cx"]), Y(t["cy"]) + 4, t["cod"]))
    n = {k: sum(1 for p in P if classe(p[0]) == k) for k in cor}
    o.append('<text x="20" y="26" font-size="18" font-weight="bold" fill="#333">Cambará do Sul — onde faltam prints</text>')
    o.append('<g font-size="13"><rect x="20" y="38" width="12" height="12" fill="#3a9a4a"/><text x="38" y="49">com print Street View (%d)</text>'
             '<rect x="210" y="38" width="12" height="12" fill="#e8902a"/><text x="228" y="49">só satélite — precisa print (%d)</text>'
             '<rect x="450" y="38" width="12" height="12" fill="#d8423a" fill-opacity=".55"/><text x="468" y="49">casa genérica — precisa print (%d), em %d trechos</text></g>' % (n["sv"], n["sat"], n["gen"], len(TRECHOS)))
    o.append("</svg>")
    open(os.path.join(AQUI, arq), "w", encoding="utf-8").write("\n".join(o))

def md():
    sv = "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=%.6f,%.6f"
    o = ["# Prints que faltam — Cambará do Sul", "", "Gerado por `docs/cidade/mapa_prints.py`. Mapas: `MAPA-PRINTS.svg` (geral) e `MAPA-PRINTS-CENTRO.svg`.", "",
         "Cada **trecho** é um lado de rua com até 6 casas genéricas seguidas (~100 m). O link abre o Street View no meio da rua em frente ao trecho — gire a câmera para o lado das casas.", "",
         "## Prédios só vistos no satélite (precisam de print da fachada)", "", "| Prédio | x, y (m) | Street View |", "|---|---|---|"]
    for p in P:
        if classe(p[0]) == "sat":
            lon, lat = G.ll(p[8], p[9]); o.append("| %s | %+.0f, %+.0f | [abrir](%s) |" % (p[0], p[1], p[2], sv % (lat, lon)))
    o += ["", "## Trechos de casas genéricas", ""]
    for r in SIGLA:
        ts = [t for t in TRECHOS if t["rua"] == r]
        if not ts: continue
        o += ["### %s — %d trechos, %d casas" % (BONITO[r], len(ts), sum(t["n"] for t in ts)), "", "| Trecho | casas | x, y (m) | Street View |", "|---|---|---|---|"]
        o += ["| **%s** | %d | %+.0f, %+.0f | [abrir](%s) |" % (t["cod"], t["n"], t["cx"], t["cy"], sv % (t["lat"], t["lon"])) for t in ts] + [""]
    open(os.path.join(AQUI, "PRINTS-FALTANDO.md"), "w", encoding="utf-8").write("\n".join(o) + "\n")

if __name__ == "__main__":
    svg("MAPA-PRINTS.svg", -800, 1160, -950, 700, .62)
    svg("MAPA-PRINTS-CENTRO.svg", -330, 380, -230, 330, 1.8)
    md()
    print("trechos:", len(TRECHOS), "· genéricas:", len(gen), "· só satélite:", sum(1 for p in P if classe(p[0]) == "sat"))
