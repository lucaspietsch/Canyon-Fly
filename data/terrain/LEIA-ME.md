# Elevação real (DEM)

O jogo lê **`elevacao.json`** + **`elevacao.bin`** desta pasta (grade lat/lon, altitudes em decímetros, int16). Sem esses arquivos o terreno de fora do platô usa só uma ondulação suave de reserva
(e o F3 mostra "Elevação real: não carregada").

Esta sessão de desenvolvimento não tinha acesso à internet, então o arquivo **ainda precisa ser gerado por você** (uma vez):

```bash
python3 tools/baixar_elevacao.py
git add data/terrain && git commit -m "elevação real SRTM 30 m" && git push
```

O script (só biblioteca padrão do Python 3) lê `data/kml/parque.kml`, calcula o retângulo que cobre parque + estrada + cidade + vilas com 2 km de margem, baixa os tiles
Terrarium (SRTM 30 m, sem chave e sem limite) e grava os dois arquivos. Opções: `--margem-km 3`, `--res-m 30`, `--fonte opentopodata`, `--tiles-dir pasta` (tiles locais).
No fim ele imprime as altitudes do marcador do parque, da saída e do fim da estrada: **o parque deve dar perto de 1.000 m e a cidade um pouco mais baixa**.
Ao mandar KMLs novos (resto da estrada, ruas), rode de novo: o retângulo acompanha os arquivos.
