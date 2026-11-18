#!/usr/bin/env python3
"""RAIA (antiga Vila Santana) — leitura dos prints do Google Earth do Lucas (vista de mapa, câmera ~381 m, rumo 1,3°).
Calibrado pela linha amarela do KML do Lucas (estrada + linha da raia) que aparece nos prints: erro médio 4 m.
A Av. Primeiro de Maio fica EXATAMENTE em cima da raia antiga da hípica: no jogo (1950) ali é a pista, sem rua nem casas.
Origem local = centro do print RA-1.   Rodar: python3 docs/vilas/raia_prints.py && python3 docs/vilas/gera_vila_raia.py"""
import math, json, os
LAT0, LON0, MLAT, MLON = -28.97331136, -50.06026799, 110540.0, 97316.0
MPP0, CX, CY, RANGE0 = .378, 646, 480, 381.38565751          # calibrado (janela com a barra de projeto do Google Earth)
PRINTS = {
  "RA-1": dict(lat=-28.97331136, lon=-50.06026799, head=1.30030768, rng=381.38565751,
    ruas={"av quinze de novembro": [(175, 692), (450, 560), (700, 420), (1000, 282), (1050, 268)],
          "rua da curva (noroeste)": [(483, 393), (520, 330), (560, 290), (610, 268)],
          "rs-020 av sen alberto pasqualine": [(475, 738), (600, 640), (800, 540), (1000, 460), (1200, 390), (1366, 330)]},
    pontos={}),
  "RA-2": dict(lat=-28.97222054, lon=-50.05804784, head=1.30030768, rng=381.38565176,
    ruas={"av quinze de novembro": [(150, 738), (450, 610), (700, 460), (900, 365), (1100, 300), (1366, 285)],
          "travessa a": [(270, 275), (350, 425)], "travessa b": [(610, 275), (700, 450)], "travessa c": [(820, 270), (880, 355)],
          "rua caxias do sul": [(1230, 350), (1300, 400), (1366, 450)],
          "rs-020 av sen alberto pasqualine": [(430, 738), (800, 620), (1050, 520), (1180, 430), (1250, 350), (1300, 268)]},
    pontos={"Capela Santa Ana": (500, 275)}),
  "RA-3": dict(lat=-28.97125363, lon=-50.05707709, head=1.30030768, rng=376.94882835,
    ruas={"av sete de setembro": [(0, 560), (150, 505), (260, 445), (330, 405), (470, 330), (580, 268)],
          "av quinze de novembro": [(500, 730), (700, 625), (920, 505), (1100, 410), (1366, 268)],
          "rua sao joao": [(295, 420), (345, 535), (400, 640), (440, 738)],
          "rua sao pedro": [(470, 320), (540, 440), (600, 560), (650, 640)],
          "travessa c": [(780, 268), (830, 350), (900, 470), (925, 505)],
          "rua sao cristovao": [(1000, 268), (1050, 330), (1110, 415)],
          "rs-020 av sen alberto pasqualine": [(860, 738), (980, 600), (1100, 480), (1200, 360), (1225, 268)],
          "rua panambi": [(1215, 330), (1290, 390), (1366, 450)], "rua ijui": [(1130, 445), (1260, 560), (1366, 650)],
          "rua santa maria": [(1020, 580), (1110, 600), (1200, 680)], "rua caxias do sul": [(990, 640), (1050, 690), (1100, 738)]},
    pontos={"Capela Santa Ana": (260, 565), "Igreja Evangélica Assembleia de Deus": (455, 500)}),
  "RA-4": dict(lat=-28.97243567, lon=-50.0554952, head=1.30030768, rng=377.01412306,
    ruas={"rs-020 av sen alberto pasqualine": [(0, 610), (200, 530), (370, 440), (500, 360), (560, 300), (590, 268)],
          "av quinze de novembro": [(0, 445), (180, 372), (330, 300), (420, 268)], "travessa d": [(215, 268), (235, 310)],
          "rua caxias do sul": [(590, 300), (700, 410), (800, 530), (860, 610)],
          "rua santa maria": [(720, 268), (800, 360), (880, 460), (940, 500), (990, 530)],
          "rua ijui": [(880, 268), (940, 340), (990, 420), (1000, 480), (990, 530), (1015, 570), (1025, 620), (1030, 738)]},
    pontos={}),
  "RA-5": dict(lat=-28.97129222, lon=-50.05497922, head=1.30030768, rng=376.78570868,
    ruas={"av quinze de novembro": [(80, 640), (390, 505), (620, 410)],
          "rua sao jose": [(255, 275), (320, 400), (390, 505), (470, 640)], "rua sao cristovao": [(475, 275), (540, 375), (580, 425)],
          "rua sao pedro": [(20, 480), (80, 600), (110, 640)],
          "rs-020 av sen alberto pasqualine": [(330, 738), (470, 560), (600, 420), (670, 340), (695, 268)],
          "rua ijui": [(600, 445), (720, 540), (800, 630), (860, 700)], "rua panambi": [(690, 330), (780, 420), (870, 520), (960, 610), (1000, 650)],
          "rua santa maria": [(490, 585), (570, 600), (640, 650), (720, 738)], "rua caxias do sul": [(455, 630), (500, 680), (540, 738)],
          "rua ijui norte": [(860, 268), (950, 370), (990, 470)]},
    pontos={}),
  "RA-6": dict(lat=-28.97014912, lon=-50.05486138, head=1.30030768, rng=381.38558147,
    ruas={"rs-020 av sen alberto pasqualine": [(700, 268), (695, 400), (680, 560), (668, 650), (640, 738)],
          "rua do oeste": [(0, 560), (200, 500), (320, 440)], "rua sao jose": [(190, 520), (240, 640), (280, 738)],
          "rua sao cristovao": [(440, 590), (500, 640), (550, 738)],
          "rua cacequi": [(720, 310), (830, 420), (960, 580), (1050, 690)], "rua canoas": [(705, 490), (780, 560), (900, 680), (960, 738)],
          "rua candelaria": [(710, 495), (880, 480), (990, 410), (1080, 330)],
          "rua do nordeste 1": [(870, 268), (1000, 400), (1150, 560), (1270, 620)], "rua do nordeste 2": [(1050, 268), (1180, 400), (1290, 560), (1260, 625)]},
    pontos={}),
  "RA-7": dict(lat=-28.96937643, lon=-50.05393514, head=1.30030768, rng=381.38565673,
    ruas={"rs-020 av sen alberto pasqualine": [(430, 268), (470, 330), (490, 390), (480, 500), (460, 600), (450, 738)],
          "rua do oeste": [(255, 425), (350, 440), (460, 430)], "estrada rodeio bonito": [(470, 380), (560, 320), (620, 268)],
          "rua bom jesus": [(625, 268), (700, 380), (800, 490), (880, 580), (960, 680), (1010, 738)],
          "rua do meio": [(520, 345), (620, 450), (720, 560), (800, 640), (880, 738)],
          "rua cacequi": [(490, 540), (560, 600), (620, 680), (660, 738)], "rua candelaria": [(660, 710), (760, 620), (860, 545)],
          "rua do leste": [(860, 545), (960, 470), (1040, 400)], "estrada rodeio bonito leste": [(920, 268), (990, 320), (1050, 290), (1080, 268)]},
    pontos={}),
  "RA-8": dict(lat=-28.96831535, lon=-50.0536273, head=1.30030768, rng=381.38565664,
    ruas={"rs-020 av sen alberto pasqualine": [(510, 268), (470, 340), (420, 420), (380, 480), (370, 560), (385, 650), (400, 738)],
          "estrada do oeste (norte)": [(0, 540), (100, 500), (250, 470), (330, 430), (380, 340), (420, 268)],
          "estrada rodeio bonito": [(415, 680), (500, 610), (600, 540), (700, 495), (800, 520), (900, 610), (970, 600), (1050, 500), (1080, 440), (1060, 400), (1100, 360), (1200, 320), (1366, 268)],
          "rua bom jesus": [(560, 580), (620, 650), (680, 738)], "rua do meio": [(450, 650), (500, 738)]},
    pontos={}),
}
def px2m(P, px, py):
    mpp = MPP0 * P["rng"] / RANGE0; h = math.radians(P["head"]); sx = (px - CX) * mpp; sy = (CY - py) * mpp
    ox = (P["lon"] - LON0) * MLON; oy = (P["lat"] - LAT0) * MLAT
    return round(ox + sx * math.cos(h) + sy * math.sin(h), 1), round(oy - sx * math.sin(h) + sy * math.cos(h), 1)
if __name__ == "__main__":
    out = {"ruas": {}, "pontos": {}}
    for cod, P in PRINTS.items():
        for n, pts in P["ruas"].items(): out["ruas"][cod + " " + n] = [px2m(P, *p) for p in pts]
        for n, p in P["pontos"].items(): out["pontos"].setdefault(n, []).append(px2m(P, *p))
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "raia-leitura.json"), "w"), ensure_ascii=False, indent=1)
    for n, v in out["pontos"].items(): print(n, v)
