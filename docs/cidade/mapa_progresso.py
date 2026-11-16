#!/usr/bin/env python3
"""Gera MAPA-PROGRESSO.svg e PROGRESSO.md a partir da lista LUGARES abaixo.
Coordenadas em metros: x = leste, y = norte, origem = câmera da Ref 01 (−29.0491915, −50.1451915), como no catálogo.
Status: "jogo" (já existe no jogo) · "feito" (montado nesta fase) · "parcial" · "falta".
Para atualizar: mude o status do lugar e rode  python3 docs/cidade/mapa_progresso.py"""
import os, html
AQUI = os.path.dirname(os.path.abspath(__file__))

# (nome, x, y, largura, altura, status, refs)  — retângulo centrado em (x, y); largura/altura 0 = ponto
LUGARES = [
    ("Praça (área)", -30, 25, 50, 40, "jogo", "KML"),
    ("Sequoia Lunar", -27, 18, 0, 0, "jogo", "KML"),
    ("Urna do Tempo", -2, 23, 0, 0, "jogo", "KML"),
    ("Calçada em favos de mel", -15, 12, 0, 0, "falta", "19 + fotos do Lucas"),
    ("Termômetro", -10, 30, 0, 0, "falta", "satélite"),
    ("Rua Coberta", -10, 0, 90, 6, "falta", "01 02 14 19 21"),
    ("Igreja Matriz São José", -24, 68, 14, 40, "falta", "01-06 11"),
    ("Rótula do Cambará", -42, 49, 0, 0, "falta", "11"),
    ("Casa paroquial (térrea)", -4, 75, 6, 30, "falta", "04 05"),
    ("Prédio de concreto inacabado", -12, 95, 16, 14, "falta", "05"),
    ("Salão Paroquial", -55, 71, 12, 34, "falta", "06 09 10 11"),
    ("Prefeitura", -30, 123, 28, 12, "falta", "07 08"),
    ("Centro Cultural Dr. Santo Bornéo", -75, 30, 15, 10, "falta", "13 14 15"),
    ("Casas oeste da Quinze de Março", -76, 58, 8, 32, "falta", "12 13 16 17"),
    ("Casa histórica do Sr. Gesmar", -48, -19, 8, 8, "falta", "18"),
    ("Sociedade XV de Março", 38, 24, 30, 24, "falta", "23 26-28 80"),
    ("Du Perau Gastro Pub ★", 22, 60, 12, 12, "falta", "29 30"),
    ("Casa térrea c/ bandeirinhas", 35, 53, 10, 8, "falta", "29"),
    ("Sobrado cinza nº 1152", 34, -10, 12, 10, "falta", "26 81"),
    ("Prédio 3 pav. canto sudeste", 15, -16, 14, 12, "falta", "25"),
    ("Casas sul da Dona Úrsula", 20, 106, 6, 7, "falta", "37-39", -9),
    ("· sul D. Úrsula 2", 27, 108, 6, 7, "falta", "37-39"),
    ("· sul D. Úrsula 3", 34, 110, 6, 7, "falta", "37-39"),
    ("· sul D. Úrsula 4", 41, 112, 6, 7, "falta", "37-39"),
    ("· sul D. Úrsula 5", 49, 114, 7, 7, "falta", "37-39"),
    ("· sul D. Úrsula 6", 60, 118, 8, 7, "falta", "37-39"),
    ("Casas norte da Dona Úrsula", 23, 131, 8, 7, "falta", "38 40-44", 10),
    ("· norte D. Úrsula 2", 34, 133, 8, 7, "falta", "40-44"),
    ("· norte D. Úrsula 3", 45, 138, 8, 7, "falta", "40-44"),
    ("Casa mal-assombrada", 62, 148, 12, 9, "falta", "45 47 48"),
    ("Casa histórica da esquina (alpendre vermelho)", 125, 127, 14, 12, "falta", "49-51"),
    ("Sobrado madeira escura", 77, 116, 12, 10, "falta", "52 53"),
    ("Chalé branco + casa vermelha", 112, 105, 10, 20, "falta", "55"),
    ("Ed. Pioneiro + vizinhos", 82, 75, 10, 22, "falta", "54 57"),
    ("Material de Construções Brentano ★", 125, 85, 16, 12, "falta", "56"),
    ("Pátio de materiais + araucária", 125, 65, 16, 12, "falta", "58"),
    ("Supermercado Brentano ★", 86, 45, 12, 30, "falta", "59-61 66"),
    ("Restaurante esquina NE", 120, 30, 12, 10, "falta", "63"),
    ("Casa de madeira rosa", 72, 22, 10, 9, "falta", "68 78 79", -9),
    ("Advocacia", 60, 22, 8, 9, "falta", "78 79", 9),
    ("Loja Thewes ★", 94, 3, 14, 12, "falta", "64 65 69 71 72", -10),
    ("Casa de trapeira (nº 96)", 125, 0, 12, 10, "falta", "62 70"),
    ("Sobrado de madeira amarela", 130, -15, 12, 10, "falta", "72 73"),
    ("Galpão de madeira", 82, -5, 8, 10, "falta", "69 74", -9),
    ("Casa de tábuas cinza", 71, -5, 10, 9, "falta", "74 75", 9),
    ("Loja Galochas", 58, -6, 9, 12, "falta", "76 77", -10),
]
RUAS = [  # (nome, [(x, y), ...])
    ("Av. Getúlio Vargas / RS-020", [(-90, -3), (0, -3), (60, 8), (150, 26)]),
    ("Rua Dona Úrsula", [(-90, 88), (-58, 92), (-2, 104), (93, 140), (150, 152)]),
    ("Rua Quinze de Março", [(-62, -30), (-66, 160)]),
    ("Rua Laurindo F. de Macedo", [(8, -30), (-5, 160)]),
    ("Rua Vinte de Setembro", [(115, -40), (95, 60), (88, 160)]),
]
COR = {"jogo": "#2e7dd7", "feito": "#2e9e4f", "parcial": "#e0a800", "falta": "#c9483f"}
NOME = {"jogo": "já no jogo", "feito": "feito", "parcial": "em andamento", "falta": "falta"}
X0, X1, Y0, Y1, E = -100, 160, -45, 165, 4.0
px = lambda x: (x - X0) * E
py = lambda y: (Y1 - y) * E

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
            o.append(f'<rect x="{px(x - w/2):.0f}" y="{py(y + h/2):.0f}" width="{w*E:.0f}" height="{h*E:.0f}" rx="3" fill="{c}" fill-opacity=".75" stroke="#222" stroke-width=".6"><title>{html.escape(nome)} — {NOME[st]} (refs {refs})</title></rect>')
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
        L.append(f"| {ic[st]} | {nome} | ({x:+d}, {y:+d}) | {refs} |")
    return "\n".join(L) + "\n"

if __name__ == "__main__":
    open(os.path.join(AQUI, "MAPA-PROGRESSO.svg"), "w", encoding="utf-8").write(svg())
    open(os.path.join(AQUI, "PROGRESSO.md"), "w", encoding="utf-8").write(md())
    print("ok:", len(LUGARES), "lugares")
