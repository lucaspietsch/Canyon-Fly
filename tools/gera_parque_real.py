#!/usr/bin/env python3
"""Gera t3d/src/mundo/dados/parque-real.js a partir de data/kml/parque-detalhes.kml: trilhas, bordas, rios/arroios e polígonos do parque já em coordenadas do jogo (u, 1 m = 2,927 u no KML).
Uso:  python3 tools/gera_parque_real.py   (rode de novo sempre que trocar o KML)  ·  usa a mesma origem/rotação/escala de t3d/src/mundo/config.js → KML"""
import math, pathlib, re, json
raiz = pathlib.Path(__file__).resolve().parent.parent
cfg = (raiz / "t3d/src/mundo/config.js").read_text(encoding="utf-8")
ref = re.search(r"ref:\s*\{\s*lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)\s*\},\s*rotacao:\s*([\d.]+),\s*escala:\s*([\d.]+)", cfg)
LAT0, LON0, TH, ESC = (float(ref.group(i)) for i in (1, 2, 3, 4)); R = 6371008.8
def norm(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t); t = "".join(c for c in t if not unicodedata.combining(c)).lower(); t = re.sub(r"(.)\1+", r"\1", t); return re.sub(r"[^a-z0-9]+", " ", t).strip()
def mundo(lon, lat):
    dN = (lat - LAT0) * math.pi / 180 * R; dE = (lon - LON0) * math.pi / 180 * R * math.cos(LAT0 * math.pi / 180); d = math.hypot(dE, dN); b = math.atan2(dE, dN)
    return [round(math.cos(b - TH) * d * ESC, 1), round(math.sin(b - TH) * d * ESC, 1)]
txt = (raiz / "data/kml/parque-detalhes.kml").read_text(encoding="utf-8"); itens = {}
for pm in re.finditer(r"<Placemark.*?</Placemark>", txt, re.S):
    b = pm.group(0); nome = re.search(r"<name>(.*?)</name>", b, re.S); nome = nome.group(1).strip() if nome else ""
    geom = "P" if "<Polygon" in b else "L" if "<LineString" in b else "T"
    c = re.search(r"<coordinates>(.*?)</coordinates>", b, re.S).group(1).split(); pts = [mundo(*map(float, x.split(",")[:2])) for x in c]
    itens[norm(nome)] = (nome, geom, pts)
def pega(chave): return itens[norm(chave)][2]
saida = {
  "marcador": pega("marcador de local sem titulo")[0], "trilhaMirante": pega("trilha do mirante"), "trilhaBorda": pega("trilha da borda"), "trilhaRecebimento": pega("trilha que passa pelo recebimento"),
  "arroioGraxaim": pega("aroio do graxaim"), "tigrePreto": pega("rio tigre preto"), "arroioFortaleza": pega("aroio fortaleza"), "arroioGravata": pega("aroio gravata do noivo"),
  "bordaCanion": pega("parte da bora do canion"), "bordaContinuidade": pega("borda continuidade"), "bordaFortaleza": pega("continuacao borda fortaleza"),
  "areaRecebimento": pega("area do recebimento"), "deckLancamento": pega("deck e casinha lancamento"), "areaLancamento": pega("area total lancamento"), "estacionamento": pega("estacionamento"),
}
js = "/* GERADO por tools/gera_parque_real.py a partir de data/kml/parque-detalhes.kml — não edite à mão. Coordenadas do jogo (u). */\nexport const PARQUE_REAL = " + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n"
(raiz / "t3d/src/mundo/dados/parque-real.js").write_text(js, encoding="utf-8")
print("ok:", {k: (len(v) if isinstance(v[0], list) else 1) for k, v in saida.items()})
