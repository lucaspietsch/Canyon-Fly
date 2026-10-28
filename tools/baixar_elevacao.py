#!/usr/bin/env python3
"""
Baixa a ELEVAÇÃO REAL (SRTM 30 m, via tiles "Terrarium" do Mapzen/AWS — sem chave de API e sem limite de requisições) para o retângulo que cobre TODOS os elementos
do KML do jogo (parque, estrada, cidade, vilas) mais uma margem (padrão 2 km), e grava:

    data/terrain/elevacao.bin   altitudes em DECÍMETROS (int16 little-endian), grade regular lat/lon, linha 0 = norte, coluna 0 = oeste
    data/terrain/elevacao.json  metadados: limites, resolução, nx/nz, escala (10 = decímetros), altitude mínima/máxima, fonte, data

O jogo só lê esses dois arquivos (funciona no Live Server, sem internet). Só biblioteca padrão do Python 3 (urllib, zlib, struct, json).

USO (na pasta do projeto, no terminal do VS Code):
    python3 tools/baixar_elevacao.py                      # usa todos os data/kml/*.kml (parque + detalhes), margem 2 km, ~30 m por pixel
    python3 tools/baixar_elevacao.py --margem-km 3 --res-m 30
    python3 tools/baixar_elevacao.py --fonte opentopodata # alternativa: API OpenTopoData (SRTM 30 m), mais lenta (1 req/s, 100 pontos por requisição)
    python3 tools/baixar_elevacao.py --tiles-dir pasta    # lê os tiles de uma pasta local (z/x/y.png) em vez da internet (teste/offline)
    python3 tools/baixar_elevacao.py --sintetico          # SÓ PARA TESTE: gera um relevo falso suave (NÃO use no jogo de verdade)
Depois: git add data/terrain && git commit -m "elevação real" && git push

Confira no final: o parque deve estar perto de 1.000 m e a cidade um pouco mais baixa (o script imprime as altitudes dos pontos principais).
"""
import argparse, glob, io, json, math, os, re, struct, sys, time, urllib.request, zlib, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
ZOOM = 12                                      # ~33 m por pixel a -29° de latitude

# ---------------------------------------------------------------- KML → limites
def coords_do_kml(caminho):
    txt = open(caminho, encoding="utf-8").read()
    pts = []
    for bloco in re.findall(r"<coordinates>(.*?)</coordinates>", txt, re.S):
        for t in bloco.split():
            p = t.split(",")
            if len(p) >= 2:
                try: pts.append((float(p[1]), float(p[0])))     # (lat, lon)
                except ValueError: pass
    return pts

def limites(pts, margem_km):
    lat0 = min(p[0] for p in pts); lat1 = max(p[0] for p in pts); lon0 = min(p[1] for p in pts); lon1 = max(p[1] for p in pts)
    m_lat = margem_km / 111.32; m_lon = margem_km / (111.32 * math.cos(math.radians((lat0 + lat1) / 2)))
    return lat0 - m_lat, lat1 + m_lat, lon0 - m_lon, lon1 + m_lon

# ---------------------------------------------------------------- PNG (decodificador mínimo: 8 bits, sem entrelaçamento, RGB/RGBA)
def ler_png(dados):
    assert dados[:8] == b"\x89PNG\r\n\x1a\n", "não é PNG"
    pos = 8; idat = b""; w = h = ct = bd = il = 0
    while pos < len(dados):
        n, = struct.unpack(">I", dados[pos:pos + 4]); tipo = dados[pos + 4:pos + 8]; corpo = dados[pos + 8:pos + 8 + n]; pos += 12 + n
        if tipo == b"IHDR": w, h, bd, ct, _, _, il = struct.unpack(">IIBBBBB", corpo)
        elif tipo == b"IDAT": idat += corpo
        elif tipo == b"IEND": break
    assert bd == 8 and il == 0 and ct in (2, 6), "PNG não suportado (esperado 8 bits RGB/RGBA sem entrelaçamento)"
    bpp = 3 if ct == 2 else 4; raw = zlib.decompress(idat); stride = w * bpp; out = bytearray(h * stride); ant = bytearray(stride); p = 0
    for y in range(h):
        f = raw[p]; linha = bytearray(raw[p + 1:p + 1 + stride]); p += 1 + stride
        if f == 1:
            for i in range(bpp, stride): linha[i] = (linha[i] + linha[i - bpp]) & 255
        elif f == 2:
            for i in range(stride): linha[i] = (linha[i] + ant[i]) & 255
        elif f == 3:
            for i in range(stride): linha[i] = (linha[i] + (((linha[i - bpp] if i >= bpp else 0) + ant[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = linha[i - bpp] if i >= bpp else 0; b = ant[i]; c = ant[i - bpp] if i >= bpp else 0; pa = abs(b - c); pb = abs(a - c); pc = abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c); linha[i] = (linha[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = linha; ant = linha
    return w, h, bpp, out

def escrever_png(w, h, rgb):
    def chunk(t, d): c = struct.pack(">I", len(d)) + t + d; return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    raw = b"".join(b"\x00" + bytes(rgb[y * w * 3:(y + 1) * w * 3]) for y in range(h))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")

# ---------------------------------------------------------------- tiles Web Mercator
def tile_de(lat, lon, z):
    n = 2 ** z; x = (lon + 180) / 360 * n; y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

class Tiles:
    def __init__(self, pasta=None): self.cache = {}; self.pasta = pasta
    def pegar(self, z, x, y):
        k = (z, x, y)
        if k in self.cache: return self.cache[k]
        if self.pasta:
            with open(os.path.join(self.pasta, str(z), str(x), str(y) + ".png"), "rb") as f: dados = f.read()
        else:
            ult = None
            for tent in range(4):
                try:
                    req = urllib.request.Request(URL_TILES.format(z=z, x=x, y=y), headers={"User-Agent": "sgv-elevacao/1.0"})
                    with urllib.request.urlopen(req, timeout=40) as r: dados = r.read(); break
                except Exception as e: ult = e; time.sleep(2 ** tent)
            else: raise SystemExit("Falha ao baixar o tile %s/%s/%s: %s\nSe a rede bloqueia o endereço, rode em outra máquina ou use --tiles-dir/--fonte opentopodata." % (z, x, y, ult))
        w, h, bpp, px = ler_png(dados); self.cache[k] = (w, h, bpp, px); return self.cache[k]
    def alt(self, lat, lon, z=ZOOM):
        fx, fy = tile_de(lat, lon, z); tx, ty = int(fx), int(fy); w, h, bpp, px = self.pegar(z, tx, ty)
        u = (fx - tx) * w - .5; v = (fy - ty) * h - .5; x0 = math.floor(u); y0 = math.floor(v); a = u - x0; b = v - y0
        def val(ix, iy):
            t = self
            if 0 <= ix < w and 0 <= iy < h: i = (iy * w + ix) * bpp; return px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768
            return self.alt_vizinho(tx, ty, ix, iy, z)
        return (val(x0, y0) * (1 - a) + val(x0 + 1, y0) * a) * (1 - b) + (val(x0, y0 + 1) * (1 - a) + val(x0 + 1, y0 + 1) * a) * b
    def alt_vizinho(self, tx, ty, ix, iy, z):
        w, h, bpp, _ = self.pegar(z, tx, ty); dx = 0 if 0 <= ix < w else (-1 if ix < 0 else 1); dy = 0 if 0 <= iy < h else (-1 if iy < 0 else 1)
        w2, h2, bpp2, px = self.pegar(z, tx + dx, ty + dy); i = (((iy % h2) * w2) + (ix % w2)) * bpp2; return px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768

# ---------------------------------------------------------------- OpenTopoData (alternativa)
def alt_opentopo(lista, dataset="srtm30m"):
    saida = []
    for i in range(0, len(lista), 100):
        lote = lista[i:i + 100]; url = "https://api.opentopodata.org/v1/%s?locations=%s" % (dataset, "|".join("%.6f,%.6f" % p for p in lote))
        for tent in range(6):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "sgv-elevacao/1.0"}), timeout=60) as r: res = json.load(r)["results"]; break
            except Exception as e: time.sleep(2 ** tent)
        else: raise SystemExit("OpenTopoData não respondeu.")
        saida += [(q["elevation"] if q["elevation"] is not None else 0) for q in res]; time.sleep(1.1)
        if (i // 100) % 20 == 0: print("  %d/%d pontos" % (i, len(lista)), flush=True)
    return saida

# ---------------------------------------------------------------- relevo falso (só teste)
def alt_sintetico(lat, lon):
    return 1000 - (lon + 49.96) * -300 - 40 * math.sin(lat * 900) * math.cos(lon * 700) - 25 * math.sin(lon * 2300 + 1) + 20 * math.cos(lat * 1700)

def main():
    ap = argparse.ArgumentParser(description="Baixa a elevação real (SRTM 30 m) para o retângulo do KML do jogo.")
    ap.add_argument("--kml", default=None, help="um .kml (padrão: TODOS os de data/kml/*.kml)"); ap.add_argument("--saida", default=os.path.join(RAIZ, "data/terrain"))
    ap.add_argument("--margem-km", type=float, default=2.0); ap.add_argument("--res-m", type=float, default=30.0)
    ap.add_argument("--fonte", choices=["tiles", "opentopodata"], default="tiles"); ap.add_argument("--tiles-dir"); ap.add_argument("--sintetico", action="store_true")
    a = ap.parse_args()
    arqs = [a.kml] if a.kml else sorted(glob.glob(os.path.join(RAIZ, "data/kml/*.kml"))); pts = [p for f in arqs for p in coords_do_kml(f)]; assert pts, "KML sem coordenadas: " + str(arqs)
    lat0, lat1, lon0, lon1 = limites(pts, a.margem_km)
    dlat = a.res_m / 111320.0; dlon = a.res_m / (111320.0 * math.cos(math.radians((lat0 + lat1) / 2)))
    nz = int(math.ceil((lat1 - lat0) / dlat)) + 1; nx = int(math.ceil((lon1 - lon0) / dlon)) + 1
    print("Retângulo: lat %.5f..%.5f  lon %.5f..%.5f  → grade %d × %d (%.1f mil pontos)" % (lat0, lat1, lon0, lon1, nx, nz, nx * nz / 1000))
    tiles = Tiles(a.tiles_dir); grade = []
    t0 = time.time()
    if a.sintetico: print("ATENÇÃO: relevo SINTÉTICO (teste). Não use no jogo.")
    if a.fonte == "opentopodata" and not a.sintetico and not a.tiles_dir:
        lista = [(lat1 - j * dlat, lon0 + i * dlon) for j in range(nz) for i in range(nx)]; v = alt_opentopo(lista); grade = [v[j * nx:(j + 1) * nx] for j in range(nz)]
    else:
        for j in range(nz):
            lat = lat1 - j * dlat; linha = []
            for i in range(nx):
                lon = lon0 + i * dlon; linha.append(alt_sintetico(lat, lon) if a.sintetico else tiles.alt(lat, lon))
            grade.append(linha)
            if j % 40 == 0: print("  linha %d/%d  (%.0fs)" % (j, nz, time.time() - t0), flush=True)
    mn = min(min(l) for l in grade); mx = max(max(l) for l in grade)
    os.makedirs(a.saida, exist_ok=True)
    dados = bytearray()
    for l in grade:
        for v in l: dados += struct.pack("<h", max(-32768, min(32767, int(round(v * 10)))))
    open(os.path.join(a.saida, "elevacao.bin"), "wb").write(dados)
    meta = {"lat0": lat1, "lon0": lon0, "dlat": dlat, "dlon": dlon, "nx": nx, "nz": nz, "escala": 10, "min": round(mn, 1), "max": round(mx, 1), "fonte": ("sintetico (TESTE)" if a.sintetico else a.fonte + (" " + a.tiles_dir if a.tiles_dir else " SRTM 30 m")), "gerado": datetime.datetime.now().isoformat(timespec="seconds"), "nota": "linha 0 = norte (lat0), coluna 0 = oeste (lon0); altitude = valor / escala (m)"}
    json.dump(meta, open(os.path.join(a.saida, "elevacao.json"), "w"), indent=1)
    print("Altitude mínima %.0f m · máxima %.0f m" % (mn, mx))
    def amostra(lat, lon):
        i = (lon - lon0) / dlon; j = (lat1 - lat) / dlat; i0 = int(max(0, min(nx - 2, math.floor(i)))); j0 = int(max(0, min(nz - 2, math.floor(j)))); fx = i - i0; fy = j - j0
        return (grade[j0][i0] * (1 - fx) + grade[j0][i0 + 1] * fx) * (1 - fy) + (grade[j0 + 1][i0] * (1 - fx) + grade[j0 + 1][i0 + 1] * fx) * fy
    print("Parque (marcador): %.0f m · saída da estrada: %.0f m · fim da estrada KML: %.0f m" % (amostra(-29.06594, -49.96361), amostra(*pts_estrada(a.kml or os.path.join(RAIZ, 'data/kml/parque.kml'))[0]), amostra(*pts_estrada(a.kml or os.path.join(RAIZ, 'data/kml/parque.kml'))[-1])))
    print("Gravado em", a.saida, "→ agora: git add data/terrain && git commit -m 'elevação real' && git push")

def pts_estrada(caminho):
    txt = open(caminho, encoding="utf-8").read()
    for m in re.finditer(r"<Placemark.*?</Placemark>", txt, re.S):
        b = m.group(0)
        if "LineString" in b and re.search(r"estrada", b, re.I):
            return [(float(t.split(",")[1]), float(t.split(",")[0])) for t in re.search(r"<coordinates>(.*?)</coordinates>", b, re.S).group(1).split()]
    return [(-29.06594, -49.96361)]

if __name__ == "__main__":
    main()
