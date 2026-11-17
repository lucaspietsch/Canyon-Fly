#!/usr/bin/env python3
"""Gera MAPA-PROGRESSO.svg e PROGRESSO.md a partir da lista LUGARES abaixo.
Coordenadas em metros: x = leste, y = norte, origem = câmera da Ref 01 (−29.0491915, −50.1451915), como no catálogo.
Status: "jogo" (já existe no jogo) · "feito" (montado nesta fase) · "parcial" · "parcial".
Para atualizar: mude o status do lugar e rode  python3 docs/cidade/mapa_progresso.py"""
import os, html
AQUI = os.path.dirname(os.path.abspath(__file__))

# (nome, x, y, largura, altura, status, refs)  — retângulo centrado em (x, y); largura/altura 0 = ponto
LUGARES = [
    ("Praça (área)", -30, 25, 60, 42, "jogo", "KML"),
    ("Sequoia Lunar", -27, 18, 0, 0, "jogo", "KML"),
    ("Urna do Tempo", -2, 23, 0, 0, "jogo", "KML"),
    ("Calçada em favos de mel", -15, 12, 0, 0, "parcial", "19 + fotos do Lucas"),
    ("Termômetro", -10, 30, 0, 0, "falta", "satélite"),
    ("Rua Coberta", -30, 0, 60, 6, "parcial", "01 02 14 19 21 + Lucas: 10 arcos-favo"),
    ("Igreja Matriz São José", -24, 71.5, 14, 40, "parcial", "01-06 11"),
    ("Rótula do Cambará", -42, 49, 0, 0, "falta", "11"),
    ("Casa paroquial (térrea)", -4, 75, 6, 30, "parcial", "04 05"),
    ("Prédio de concreto inacabado", -12, 95, 16, 14, "parcial", "05"),
    ("Salão Paroquial", -55, 71, 12, 34, "parcial", "06 09 10 11"),
    ("Prefeitura", -30, 123, 28, 12, "parcial", "07 08"),
    ("Centro Cultural Dr. Santo Bornéo", -75, 30, 15, 10, "parcial", "13 14 15"),
    ("Casas oeste da Quinze de Março", -76, 58, 8, 32, "parcial", "12 13 16 17"),
    ("Casa histórica do Sr. Gesmar", -48, -19, 8, 8, "parcial", "18"),
    ("Sociedade XV de Março", 38, 24, 30, 24, "parcial", "23 26-28 80"),
    ("Du Perau Gastro Pub ★", 22, 60, 12, 12, "parcial", "29 30"),
    ("Casa térrea c/ bandeirinhas", 35, 53, 10, 8, "parcial", "29"),
    ("Sobrado cinza nº 1152", 34, -10, 12, 10, "parcial", "26 81"),
    ("Prédio 3 pav. canto sudeste", 15, -16, 14, 12, "parcial", "25"),
    ("Casa térrea bege (D. Úrsula)", 20, 100.6, 6, 7, "parcial", "37"),
    ("Sobrado bege com varanda de madeira", 26, 102.4, 5.5, 8, "parcial", "37 38"),
    ("Casa branca de madeira nº 125 (trapeira)", 32.5, 104.9, 5.5, 8, "parcial", "39"),
    ("Prédio de tijolo inacabado (obra)", 49, 110.6, 8, 9, "parcial", "42"),
    ("Casa térrea rosa-avermelhada", 60, 115.3, 9, 8, "parcial", "42 43"),
    ("Casa térrea avermelhada c/ portão branco", 24, 126, 5.5, 8, "parcial", "40"),
    ("Sobrado bege-mostarda nº 707", 34, 130.3, 7, 9, "parcial", "40"),
    ("Casinha antiga de tábuas brancas", 41.5, 132.2, 5, 7, "parcial", "41"),
    ("Garagem coberta", 50, 134.9, 5, 6, "parcial", "41"),
    ("Casa mal-assombrada", 63, 145, 22, 10, "parcial", "41 44 45 47 48"),
    ("Casa histórica da esquina (alpendre vermelho)", 125, 127, 14, 12, "parcial", "49-51"),
    ("Sobrado madeira escura", 77, 116, 12, 10, "parcial", "52 53"),
    ("Chalé branco + casa vermelha", 112, 105, 10, 20, "parcial", "55"),
    ("Ed. Pioneiro + vizinhos", 82, 75, 10, 22, "parcial", "54 57"),
    ("Material de Construções Brentano ★", 125, 85, 16, 12, "parcial", "56"),
    ("Pátio de materiais + araucária", 125, 65, 16, 12, "falta", "58"),
    ("Supermercado Brentano ★", 86, 45, 12, 30, "parcial", "59-61 66"),
    ("Restaurante esquina NE", 120, 30, 12, 10, "parcial", "63"),
    ("Casa de madeira rosa", 72, 22, 10, 9, "parcial", "68 78 79", -9),
    ("Advocacia", 60, 22, 8, 9, "parcial", "78 79", 9),
    ("Loja Thewes ★", 94, 3, 14, 12, "parcial", "64 65 69 71 72", -10),
    ("Casa de trapeira (nº 96)", 125, 0, 12, 10, "parcial", "62 70"),
    ("Sobrado de madeira amarela", 130, -15, 12, 10, "parcial", "72 73"),
    ("Galpão de madeira", 82, -5, 8, 10, "parcial", "69 74", -9),
    ("Casa de tábuas cinza", 71, -5, 10, 9, "parcial", "74 75", 9),
    ("Loja Galochas", 58, -6, 9, 12, "parcial", "76 77", -10),
    # --- demais prédios do catálogo (2ª leva) ---
    ("Construção comprida rosa-magenta", -77, 44.5, 10, 7, "parcial", "12 13"),
    ("Casa rosa com chaminé e bay", -77, 55, 10, 9, "parcial", "12 13"),
    ("Lojinha de topo em arco (amarelo)", -76, 68.5, 8, 7, "parcial", "12"),
    ("Casa branca térrea com palmeira", -72, 17, 10, 10, "parcial", "16"),
    ("Pizzaria Recanto da Pizza", -72, 3, 9, 10, "parcial", "16 17 22"),
    ("Café do Casarão (muro e jardim)", -32, -24, 14, 10, "parcial", "18 20 22"),
    ("Prédio comercial branco térreo", -17, -21, 10, 9, "parcial", "23"),
    ("Loja de rede (letreiro verde)", -3, -20, 12, 10, "parcial", "23 24"),
    ("Loja de eletrodomésticos (vermelha)", 18.5, 73, 13, 12, "parcial", "31 32"),
    ("Prédio comercial térreo branco (Laurindo)", 17.5, 86, 14, 10, "parcial", "33"),
    ("Sobrado da esquina Laurindo × D. Úrsula", 9, 94, 8, 8, "parcial", "34 37"),
    ("Sobrado antigo amarelo-ocre", 11, 121, 6, 8, "parcial", "38"),
    ("Secretaria de Educação (madeira amarelo-bordô)", 17.5, 123.5, 6, 8, "parcial", "38 40"),
    ("Casa verde-acinzentada com alpendre", 80, 90, 9, 7, "parcial", "54"),
    ("Chalé de madeira marrom elevado", 80, 98, 8, 7, "parcial", "54"),
    ("Sobrado claro (Vinte de Setembro)", 79, 106, 8, 7, "parcial", "54"),
    ("Quiosques da Rua Coberta", -24.5, 6.5, 15, 6, "parcial", "01 21"),
    ("Sabores da Querência (chalé de pedra)", 328, 34, 10, 10, "parcial", "SV-I1 I11"),
    ("Dois Irmãos confeitaria", 270, 68, 8, 10, "parcial", "SV-I6"),
    ("Hamburgueria (sacada de madeira)", 261, 66, 8, 9, "parcial", "SV-I6"),
    ("Loja de roupas cinza-escura", 303, 70, 8, 9, "parcial", "SV-I7"),
    ("Cooperativa de crédito (faixa verde)", 314, 72, 10, 10, "parcial", "SV-I7"),
    ("Galpão branco de janelas azuis", 284, 40, 14, 8, "parcial", "SV-I2"),
    ("Prédio amarelo com azulejos azuis", 268, 38, 10, 8, "parcial", "SV-I2"),
    ("Prédio de 4 pavimentos com sacadas", 254, 36, 12, 10, "parcial", "SV-I2"),
    ("Casa do Turista", 580, 128, 24, 10, "parcial", "SV-L2"),
    ("Templo Assembleia de Deus", 919, 258, 14, 22, "parcial", "SV-L"),
]
RUAS = [  # (nome, [(x, y), ...])
    ("Av. Getúlio Vargas / RS-020", [(-90, -3), (0, -3), (60, 8), (150, 26)]),
    ("Rua Dona Úrsula", [(-90, 88), (-58, 92), (-2, 104), (93, 140), (150, 152)]),
    ("Rua Quinze de Março", [(-62, -30), (-66, 160)]),
    ("Rua Laurindo F. de Macedo", [(8, -30), (-5, 160)]),
    ("Rua Vinte de Setembro", [(115, -40), (95, 60), (88, 160)]),
]
COR = {"jogo": "#2e7dd7", "feito": "#2e9e4f", "parcial": "#e0a800", "falta": "#c9483f"}
NOME = {"jogo": "já no jogo", "feito": "feito", "parcial": "em andamento (blocos)", "falta": "falta"}
X0, X1, Y0, Y1, E = -100, 160, -45, 165, 4.0
px = lambda x: (x - X0) * E
py = lambda y: (Y1 - y) * E

import math
def angulo_rua(x, y):
    """Ângulo (graus, sentido anti-horário a partir do leste) da rua mais próxima — a frente da casa fica paralela a ela."""
    best, ang = 1e9, 0.0
    for _, pts in RUAS:
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            vx, vy = x1 - x0, y1 - y0; L2 = vx * vx + vy * vy
            t = max(0, min(1, ((x - x0) * vx + (y - y0) * vy) / L2)); d = math.hypot(x0 + t * vx - x, y0 + t * vy - y)
            if d < best: best, ang = d, math.degrees(math.atan2(vy, vx))
    ang = (ang + 45) % 90 - 45   # só o desvio da rua: o prédio mantém o lado comprido onde estava
    return ang

def svg():
    W, H = (X1 - X0) * E, (Y1 - Y0) * E + 70
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" font-family="sans-serif" font-size="10">',
         f'<rect width="100%" height="100%" fill="#f6f4ee"/>']
    for nome, pts in RUAS:
        d = " ".join(f"{px(x):.0f},{py(y):.0f}" for x, y in pts)
        o.append(f'<polyline points="{d}" fill="none" stroke="#cfc8b8" stroke-width="22" stroke-linecap="round"/>')
        o.append(f'<text x="{px(pts[-1][0]) - 6:.0f}" y="{py(pts[-1][1]) + 14:.0f}" fill="#7a705c" text-anchor="end" font-style="italic">{html.escape(nome)}</text>')
    for nome, x, y, w, h, st, refs, *dy in LUGARES:
        dy = dy[0] if dy else 0
        c = COR[st]
        if w and h:
            rot = 0 if "Praça" in nome or "Rua Coberta" in nome else -angulo_rua(x, y)
            o.append(f'<rect transform="rotate({rot:.1f} {px(x):.1f} {py(y):.1f})" x="{px(x - w/2):.0f}" y="{py(y + h/2):.0f}" width="{w*E:.0f}" height="{h*E:.0f}" rx="3" fill="{c}" fill-opacity=".75" stroke="#222" stroke-width=".6"><title>{html.escape(nome)} — {NOME[st]} (refs {refs})</title></rect>')
        else:
            o.append(f'<circle cx="{px(x):.0f}" cy="{py(y):.0f}" r="6" fill="{c}" stroke="#222" stroke-width=".6"><title>{html.escape(nome)} — {NOME[st]}</title></circle>')
        if nome.startswith("·"): continue
        o.append(f'<text x="{px(x):.0f}" y="{py(y + dy) + 3:.0f}" text-anchor="middle" fill="#111" stroke="#f6f4ee" stroke-width="2.5" paint-order="stroke">{html.escape(nome)}</text>')
    yl = (Y1 - Y0) * E + 20
    for i, st in enumerate(COR):
        n = sum(1 for l in LUGARES if l[5] == st)
        o.append(f'<rect x="{20 + i*200}" y="{yl}" width="14" height="14" fill="{COR[st]}"/><text x="{40 + i*200}" y="{yl + 11}" font-size="12">{NOME[st]} ({n})</text>')
    o.append(f'<text x="20" y="{yl + 38}" font-size="11" fill="#555">Norte para cima · 1 quadradinho da grade do catálogo = 1 m × 4 px · origem = Ref 01 (sul da praça) · posições aproximadas</text>')
    o.append('</svg>')
    return "\n".join(o)

def md():
    L = ["# Progresso da cidade (Cambará do Sul)", "",
         "Gerado por `mapa_progresso.py` — mapa: [`MAPA-PROGRESSO.svg`](MAPA-PROGRESSO.svg). "
         "Status: 🔵 já no jogo · 🟢 feito · 🟡 em andamento · 🔴 falta.", ""]
    ic = {"jogo": "🔵", "feito": "🟢", "parcial": "🟡", "falta": "🔴"}
    tot = len(LUGARES); ok = sum(1 for l in LUGARES if l[5] in ("jogo", "feito"))
    L += [f"**{ok} de {tot} prontos.**", "", "| | Lugar | Posição (x, y) m | Refs |", "|---|---|---|---|"]
    for nome, x, y, w, h, st, refs, *_ in LUGARES:
        nome = nome.lstrip("· ")
        L.append(f"| {ic[st]} | {nome} | ({x:+g}, {y:+g}) | {refs} |")
    return "\n".join(L) + "\n"

if __name__ == "__main__":
    open(os.path.join(AQUI, "MAPA-PROGRESSO.svg"), "w", encoding="utf-8").write(svg())
    open(os.path.join(AQUI, "PROGRESSO.md"), "w", encoding="utf-8").write(md())
    import json
    json.dump({"L": [list(l[:7]) for l in LUGARES], "R": RUAS}, open(os.path.join(AQUI, "previa-3d-dados.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print("ok:", len(LUGARES), "lugares")
