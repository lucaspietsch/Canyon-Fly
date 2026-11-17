#!/usr/bin/env python3
"""Gera t3d/src/mundo/dados/vila-ok.js — Vila Oswaldo Kroeff no jogo, a partir de docs/vilas/ok-leitura.json (prints do Google Earth do Lucas).
- RUAS: junta os trechos da mesma rua vistos em prints diferentes (aliases abaixo) numa linha só; sem duplicar faixas.
- CASAS: tira duplicatas (o mesmo telhado aparece em 2 prints vizinhos), frente paralela e virada para a rua mais próxima.
- PONTOS (comércios, igrejas, escola): a casa mais próxima do alfinete vira aquele lugar (placa genérica — regra do Lucas).
Formato dos prédios = o mesmo da cidade (centro.js): [nome, x, y, largura, fundo, altura, tipo, ânguloRua, ruaX, ruaY], metros locais.
Rodar:  python3 docs/vilas/ok_prints.py && python3 docs/vilas/gera_vila_ok.py && (cd t3d && npm run build)"""
import os, json, math, random, importlib.util
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.dirname(os.path.dirname(AQUI))
sp = importlib.util.spec_from_file_location("okp", os.path.join(AQUI, "ok_prints.py")); OKP = importlib.util.module_from_spec(sp); sp.loader.exec_module(OKP)
D = json.load(open(os.path.join(AQUI, "ok-leitura.json"), encoding="utf-8"))

ALIAS = {  # nome no print (sem o código "OK-Mn ") → rua do jogo
  "rua osvaldo aranha": "rua osvaldo aranha", "rua osvaldo aranha (chegada no entroncamento)": "rua osvaldo aranha",
  "rua dom pedro ii": "rua osvaldo aranha", "rua dom pedro ii (fim norte)": "rua osvaldo aranha",          # a principal muda de nome no norte: no jogo é uma linha contínua
  "travessa dez": "travessa dez", "travessa dez (continuação para sudeste)": "travessa dez",
  "rua rui barbosa": "rua rui barbosa", "rua julio de castilhos": "rua julio de castilhos",
  "rua vinte e um de abril": "rua vinte e um de abril",
  "rua do topo (oeste)": "rua do topo oeste", "rua do topo (oeste) — vai até a Auto Elétrica": "rua do topo oeste",
  "rua do topo (leste)": "rua do topo leste", "rua do topo (leste) — passa na Pousada Recanto": "rua do topo leste",
  "rua dom pedro ii (trecho leste, 1)": "rua dom pedro ii leste", "rua dom pedro ii (trecho leste, 2)": "rua dom pedro ii leste 2",
}
def comp(L): return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(L, L[1:]))
def dist_linha(p, L):
    best = 1e9
    for (x0, y0), (x1, y1) in zip(L, L[1:]):
        vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy or 1e-9; t = max(0, min(1, ((p[0] - x0) * vx + (p[1] - y0) * vy) / L2)); best = min(best, math.hypot(x0 + t * vx - p[0], y0 + t * vy - p[1]))
    return best
grupos = {}
for k, pts in D["ruas"].items():
    nome = k.split(" ", 1)[1]; grupos.setdefault(ALIAS.get(nome, nome), []).append([tuple(p) for p in pts])
RUAS = {}
for nome, trechos in grupos.items():
    trechos.sort(key=comp, reverse=True); L = list(trechos[0])
    for t in trechos[1:]:
        antes, depois = [], []
        for p in t:
            if dist_linha(p, L) < 12: continue
            (antes if math.hypot(p[0] - L[0][0], p[1] - L[0][1]) < math.hypot(p[0] - L[-1][0], p[1] - L[-1][1]) else depois).append(p)
        antes.sort(key=lambda p: -math.hypot(p[0] - L[0][0], p[1] - L[0][1])); depois.sort(key=lambda p: math.hypot(p[0] - L[-1][0], p[1] - L[-1][1]))
        L = antes + L + depois
    if nome == "rua osvaldo aranha":                                                       # a principal é quase reta (SO→NE): ordena pela projeção no eixo e tira pontos colados
        ax = (L[-1][0] - L[0][0], L[-1][1] - L[0][1]); n = math.hypot(*ax); ax = (ax[0] / n, ax[1] / n)
        L.sort(key=lambda p: p[0] * ax[0] + p[1] * ax[1]); M = [L[0]]
        for p in L[1:]:
            if math.hypot(p[0] - M[-1][0], p[1] - M[-1][1]) > 15: M.append(p)
        L = M
    RUAS[nome] = L

def rua_proxima(x, y):
    best = (1e9, 0, x, y)
    for pts in RUAS.values():
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy or 1e-9; t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / L2)); px, py = x0 + t * vx, y0 + t * vy; d = math.hypot(px - x, py - y)
            if d < best[0]: best = (d, math.degrees(math.atan2(vy, vx)), px, py)
    return best

rnd = random.Random(11); CORES = ["branca", "bege", "amarelo-clara", "rosa", "verde", "cinza", "creme", "azul clara"]
casas = []
for cod, x, y, w, d in D["casas"]:
    if any(math.hypot(x - c[0], y - c[1]) < max(4, min(w, d) * .6) for c in casas): continue          # mesmo telhado em 2 prints
    casas.append([x, y, w, d, cod])
PONTOS = {  # pino → (nome no jogo, tipo, altura m, mínimo de largura/fundo)
  "Casa de oração": ("Templo — casa de oração", "publico", 5, 9), "Cabana Paradouro": ("Pousada (cabana) — placa genérica", "comercio", 6, 0),
  "Central do Lanche": ("Lancheria — placa genérica", "comercio", 4.5, 0), "Carmen Santos": ("Lojinha — placa genérica", "comercio", 4.5, 0),
  "Auto Elétrica": ("Oficina mecânica — placa genérica", "comercio", 5, 10), "Casa bom aconchego": ("Pousada (casa) — placa genérica", "comercio", 6, 0),
  "Mercado da Família": ("Mercado da vila — placa genérica", "comercio", 5, 12), "Pousada Recanto": ("Pousada — placa genérica", "comercio", 6, 0),
  "Toto Lanches": ("Lancheria delivery — placa genérica", "comercio", 4.5, 0), "Pousada Romeu": ("Pousada (2) — placa genérica", "comercio", 6, 0),
  "Transportes": ("Transportadora (galpão) — placa genérica", "comercio", 6, 14), "Igreja Assembleia de Deus (templo": ("Templo Assembleia de Deus (vila)", "publico", 7, 10),
  "Material de Construção": ("Loja de materiais — placa genérica", "comercio", 5, 12), "Escola Estadual": ("Escola Estadual da vila", "publico", 7, 25),
  "Guincho": ("Guincho 24h (garagem) — placa genérica", "comercio", 5, 10), "Capela Santa Catarina": ("Capela Santa Catarina", "publico", 8, 12),
  "Mercado (placa": ("Mercado do norte — placa genérica", "comercio", 5, 12), "Igreja Evangélica": ("Templo evangélico (norte)", "publico", 7, 10),
}
usadas = {}
for nomeP, (px, py) in D["pontos"].items():
    chave = next((k for k in PONTOS if nomeP.startswith(k)), None)
    if not chave: print("ponto sem regra:", nomeP); continue
    i = min(range(len(casas)), key=lambda j: math.hypot(casas[j][0] - px, casas[j][1] - py) - (max(casas[j][2], casas[j][3]) if PONTOS[chave][3] > 15 else 0))
    usadas[i] = PONTOS[chave]
P = []
for i, (x, y, w, d, cod) in enumerate(casas):
    dr, angR, fx, fy = rua_proxima(x, y)
    if dr < 6.5:                                                                                                   # telhado lido em cima da rua: afasta para a calçada
        ux, uy = (x - fx) / (dr or 1), (y - fy) / (dr or 1)
        if dr < .5: a = math.radians(angR); ux, uy = -math.sin(a), math.cos(a)
        x, y = fx + ux * (6.5 + d / 2), fy + uy * (6.5 + d / 2); dr, angR, fx, fy = rua_proxima(x, y)
    ang = (angR + 45) % 90 - 45
    if i in usadas:
        nome, tipo, alt, mn = usadas[i]; w, d = max(w, mn), max(d, mn * .8 if mn else d)
    else:
        alt = rnd.choice([4.5, 4.5, 4.5, 4.5, 7]); tipo = "casa"; cor = rnd.choice(CORES)
        nome = ("Casa genérica %s #%d (precisa de print · %s)" if alt < 6 else "Sobrado genérico %s #%d (precisa de print · %s)") % (cor, i + 1, cod)
        w, d = max(6, min(w, 16)), max(6, min(d, 16))
    P.append([nome, round(x, 1), round(y, 1), round(w, 1), round(d, 1), alt, tipo, round(ang, 1), round(fx, 1), round(fy, 1)])

LAT0, LON0, MLAT, MLON = OKP.LAT0, OKP.LON0, OKP.MLAT, OKP.MLON
ruas_ll = {n: [[round(LAT0 + y / MLAT, 8), round(LON0 + x / MLON, 8)] for x, y in L] for n, L in RUAS.items()}
saida = os.path.join(RAIZ, "t3d", "src", "mundo", "dados", "vila-ok.js")
open(saida, "w", encoding="utf-8").write(
  "/* GERADO por docs/vilas/gera_vila_ok.py — Vila Oswaldo Kroeff a partir dos prints do Google Earth do Lucas (docs/vilas/ok_prints.py). Não editar à mão.\n"
  "   RUAS_OK: { nome: [[lat, lon], …] }. PREDIOS_OK: mesmo formato de PREDIOS_CENTRO (metros locais a partir de ORIGEM_OK). */\n"
  "export const ORIGEM_OK = { lat: %r, lon: %r, mLat: %r, mLon: %r };\nexport const RUAS_OK = %s;\nexport const PREDIOS_OK = %s;\n" %
  (LAT0, LON0, MLAT, MLON, json.dumps(ruas_ll, ensure_ascii=False), json.dumps(P, ensure_ascii=False)))
print("ruas:", len(RUAS), {n: round(comp(L)) for n, L in RUAS.items()})
print("prédios:", len(P), "· lugares:", len(usadas), "· genéricas:", sum(1 for q in P if "precisa de print" in q[0]))
