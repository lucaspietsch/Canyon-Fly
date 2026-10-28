#!/usr/bin/env python3
"""Regenera t3d/src/mundo/dados/kml-vegetacao.js a partir de data/kml/parque.kml e data/kml/parque-detalhes.kml (cópias embutidas dos KML padrão do jogo)."""
import pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
def le(nome):
    t = (raiz / "data/kml" / nome).read_text(encoding="utf-8"); assert "`" not in t and "${" not in t; return t
a, b = le("parque.kml"), le("parque-detalhes.kml")
(raiz / "t3d/src/mundo/dados/kml-vegetacao.js").write_text(
    "/* Cópias embutidas de data/kml/parque.kml e data/kml/parque-detalhes.kml (regenerar: python3 build/kml_embutido.py). O jogo também lê esses arquivos em segundo plano. */\n"
    "export const KML_VEGETACAO = `" + a + "`;\nexport const KML_DETALHES = `" + b + "`;\n", encoding="utf-8")
print("ok", len(a), len(b))
