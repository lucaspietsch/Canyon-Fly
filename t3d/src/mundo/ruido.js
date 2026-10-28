import { DataTexture, RGBAFormat, UnsignedByteType, RepeatWrapping, LinearFilter } from "three";

/* Textura de ruído periódico (4 canais independentes, 4 oitavas): o céu e a neblina leem dela em vez de calcular ruído no shader (barato em notebook). */
let cache = null;
export function texRuido(N = 256){
  if(cache) return cache;
  const d = new Uint8Array(N * N * 4);
  for(let c = 0; c < 4; c++){
    let s = (1234567 + c * 7919) >>> 0; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const campo = new Float32Array(N * N);
    let soma = 0;
    for(let o = 0; o < 4; o++){
      const G = 4 << o, lat = new Float32Array(G * G); for(let i = 0; i < lat.length; i++) lat[i] = r();
      const amp = Math.pow(.5, o); soma += amp;
      for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){
        const fx = x / N * G, fy = y / N * G, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = lat[(y0 % G) * G + x0 % G], b = lat[(y0 % G) * G + (x0 + 1) % G], e = lat[((y0 + 1) % G) * G + x0 % G], f = lat[((y0 + 1) % G) * G + (x0 + 1) % G];
        campo[y * N + x] += amp * (a + (b - a) * sx + (e - a) * sy + (a - b - e + f) * sx * sy);
      }
    }
    for(let i = 0; i < N * N; i++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round(campo[i] / soma * 255)));
  }
  const t = new DataTexture(d, N, N, RGBAFormat, UnsignedByteType);
  t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = t.minFilter = LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return (cache = t);
}
