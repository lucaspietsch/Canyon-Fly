#!/usr/bin/env python3
"""Gera t3d/src/mundo/dados/kml-cidade.js (ruas reais do centro, em KML) e t3d/src/mundo/dados/cidade-centro.js (prédios em blocos)
a partir das coordenadas do catálogo (docs/cidade/REFERENCIAS-STREET-VIEW.md) e de mapa_progresso.py.
Coordenadas locais: x = leste, y = norte, em metros; origem = câmera da Ref 01 (−29.0491915, −50.1451915).
Rodar:  python3 docs/cidade/gera_cidade.py"""
import os, json, importlib.util, math
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.dirname(os.path.dirname(AQUI))
LAT0, LON0, MLAT, MLON = -29.0491915, -50.1451915, 110540.0, 97316.0
ll = lambda x, y: (LON0 + x / MLON, LAT0 + y / MLAT)

# ruas reais (traçado aproximado, ±10–15 m, a partir dos prints de satélite/mapa e do KML da avenida do Lucas)
RUAS = {
  "avenida getulio vargas": [(1108, 300), (829, 219), (631, 141), (300, 59), (110, 20), (-125, -19), (-205, -38), (-359, -96), (-433, -149), (-511, -229), (-586, -306), (-669, -401), (-744, -489)],
  "rua dona ursula": [(-604, -53), (-300, 25), (-58, 92), (-2, 104), (93, 140), (150, 144), (300, 190), (479, 243)],
  "rua quinze de marco": [(-60, -12), (-64, 60), (-68, 160)],
  "rua laurindo francisco de macedo": [(9, -8), (3, 60), (-3, 160)],
  "rua vinte de setembro": [(125, -120), (115, -40), (100, 20), (95, 60), (88, 160), (75, 240), (70, 300)],
  "rua joaquim pereira": [(-129, 277), (4, 287), (122, 303), (286, 339)],
  "rua joao francisco riter": [(-662, 21), (-400, 95), (-181, 157)],
  "rua dom pedro ii": [(-155, 136), (-140, 0), (-119, -136)],
  "rua padre joao paza": [(-468, -251), (-342, -199), (-180, -155), (-39, -121), (150, -80), (411, -34)],
  "rua procopio freire dos santos": [(61, -185), (260, -138)],
  "rua tradicao": [(300, 59), (343, -76), (366, -153), (390, -197), (471, -254)],
  "rua osvaldo kroeff": [(240, -20), (226, 73), (223, 110), (215, 300)],
  "rua nartecia pereira": [(296, 130), (450, 205), (610, 287)],
  "rua coronel vicente pereira": [(545, 140), (526, 287), (518, 431), (532, 481)],
  "rua dalfro filho": [(458, 200), (453, 319)],
}

def kml():
    pm = []
    for nome, pts in RUAS.items():
        c = " ".join("%.8f,%.8f,0" % ll(x, y) for x, y in pts)
        pm.append("<Placemark><name>%s</name><LineString><coordinates>%s</coordinates></LineString></Placemark>" % (nome, c))
    return '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>ruas do centro</name>' + "".join(pm) + "</Document></kml>"

def rua_proxima(x, y):
    """ângulo (graus, ±45 — só o desvio da rua) e ponto mais próximo das ruas REAIS do jogo (RUAS acima): a frente do prédio fica paralela e virada para ela"""
    best = (1e9, 0, x, y)
    for pts in RUAS.values():
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy; t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / L2)); px, py = x0 + t * vx, y0 + t * vy; d = math.hypot(px - x, py - y)
            if d < best[0]: best = (d, math.degrees(math.atan2(vy, vx)), px, py)
    return (best[1] + 45) % 90 - 45, best[2], best[3]

def predios():
    sp = importlib.util.spec_from_file_location("m", os.path.join(AQUI, "mapa_progresso.py")); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
    fora = ("Praça", "Rua Coberta", "Sequoia", "Urna", "Termômetro", "favos", "Rótula", "Pátio")
    out = []
    for nome, x, y, w, h, st, refs, *_ in m.LUGARES:
        if not w or not h or any(k in nome for k in fora): continue
        nome = nome.lstrip("· ")
        alto = 13 if "4 pavimentos" in nome else 7 if any(k in nome for k in ("hospital", "Pousada Bela", "Eco Hotel", "Escola", "madeireira")) else 6 if "Galpão" in nome else 3.5 if "Quiosques" in nome else 2 if "muro e jardim" in nome else 12 if "Igreja" in nome else 7 if any(k in nome for k in ("Sociedade", "Supermercado", "Thewes", "Pioneiro", "Prédio", "obrado", "Brentano", "Salão", "Prefeitura")) else 4.5
        tipo = "igreja" if "Igreja Matriz" in nome else "publico" if any(k in nome for k in ("Assembleia", "Casa do Turista", "Posto de Saúde", "hospital", "Pentecostal", "Missionário", "Escola")) else "publico" if any(k in nome for k in ("Prefeitura", "Salão", "Sociedade", "Centro Cultural")) else "comercio" if any(k in nome for k in ("★", "Loja", "Supermercado", "Pub", "Material", "Restaurante", "Advocacia", "Pioneiro", "Pizzaria", "Prédio comercial", "Lojinha", "Agência", "Cottage", "Lancheria", "Confeitaria", "Galpão Costaneira", "Casarão Cantina", "Vitrine", "Pizza Retrô", "Bikers", "salmão", "Posto de combustível", "Rádio", "Empório", "Flor de Anis", "Casa Nostra", "Churrasco", "Quiosques", "Sabores", "Dois Irmãos", "Hamburgueria", "Cooperativa", "Galpão branco", "Prédio amarelo")) else "casa"
        ang, fx, fy = rua_proxima(x, y)
        if "sat" in refs or "SV-N" in refs or "SV-I1" in refs:          # posição aproximada (satélite/Street View): afasta da rua até a calçada
            dmin = 6 + 2.2 + min(w, h) / 2 + .5; dx, dy = x - fx, y - fy; dd = math.hypot(dx, dy) or 1
            if dd < dmin: x, y = round(fx + dx / dd * dmin, 1), round(fy + dy / dd * dmin, 1); ang, fx, fy = rua_proxima(x, y)
        out.append([nome, x, y, w, h, alto, tipo, round(ang, 1), round(fx, 1), round(fy, 1)])
    return out

CORES_GEN = ["branca", "bege", "amarelo-clara", "rosa", "verde", "cinza", "creme", "azul clara"]
def genericas(P):
    """Casas GENÉRICAS (provisórias) nos trechos de rua que ainda não têm nenhum prédio do catálogo: preenchem a cidade até chegarem os prints.
    Ficam a cada ~16 m dos dois lados da rua, afastadas da calçada e longe de outras ruas, da praça e dos prédios já catalogados."""
    import random
    rnd = random.Random(7); ocup = [(q[1], q[2], max(q[3], q[4]) / 2 + 4) for q in P]; out = []; k = 0
    segs = [(a, b) for pts in RUAS.values() for a, b in zip(pts, pts[1:])]
    def dist_rua(x, y):
        best = 1e9
        for (x0, y0), (x1, y1) in segs:
            vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy; t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / L2)); best = min(best, math.hypot(x0 + t * vx - x, y0 + t * vy - y))
        return best
    for nome, pts in RUAS.items():
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            Ls = math.hypot(x1 - x0, y1 - y0); tx, ty = (x1 - x0) / Ls, (y1 - y0) / Ls
            for i in range(int(Ls / 16) + 1):
                cx, cy = x0 + tx * i * 16, y0 + ty * i * 16
                for lado in (-1, 1):
                    w, d = rnd.choice([7, 8, 9, 10]), rnd.choice([8, 9, 10])
                    off = 6 + 2.2 + d / 2 + 1.5; x, y = cx - ty * lado * off, cy + tx * lado * off
                    if -60 < x < 5 and 10 < y < 50: continue                                                  # praça
                    if dist_rua(x, y) < off - .5: continue                                                    # perto de outra rua (esquina)
                    if any(math.hypot(x - a, y - b) < r + max(w, d) / 2 for a, b, r in ocup): continue
                    k += 1; cor = rnd.choice(CORES_GEN); alt = rnd.choice([4.5, 4.5, 4.5, 7])
                    nomeG = "Casa genérica %s #%d (precisa de print)" % (cor, k) if alt < 6 else "Sobrado genérico %s #%d (precisa de print)" % (cor, k)
                    ang, fx, fy = rua_proxima(x, y); out.append([nomeG, round(x, 1), round(y, 1), w, d, alt, "casa", round(ang, 1), round(fx, 1), round(fy, 1)])
                    ocup.append((x, y, max(w, d) / 2 + 2))
    return out

if __name__ == "__main__":
    d = os.path.join(RAIZ, "t3d", "src", "mundo", "dados")
    open(os.path.join(d, "kml-cidade.js"), "w", encoding="utf-8").write("/* GERADO por docs/cidade/gera_cidade.py — ruas reais do centro de Cambará do Sul (traçado aproximado dos prints do Lucas). Não editar à mão. */\nexport const KML_CIDADE = `" + kml() + "`;\n")
    P = predios(); P += genericas(P)
    open(os.path.join(d, "cidade-centro.js"), "w", encoding="utf-8").write("/* GERADO por docs/cidade/gera_cidade.py — prédios do centro em blocos: [nome, x leste m, y norte m, largura m, fundo m, altura m, tipo, ângulo da rua (graus), ponto da rua mais próxima x, y]. Origem = Ref 01 (−29.0491915, −50.1451915). */\nexport const ORIGEM_CENTRO = { lat: %r, lon: %r, mLat: %r, mLon: %r };\nexport const PREDIOS_CENTRO = %s;\n" % (LAT0, LON0, MLAT, MLON, json.dumps(P, ensure_ascii=False)))
    print("ruas:", len(RUAS), "· prédios:", len(P), "(", sum(1 for q in P if "genéric" in q[0]), "genéricos )")
