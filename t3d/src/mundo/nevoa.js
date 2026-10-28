import { ShaderMaterial, Mesh, PlaneGeometry, Group, MathUtils, Vector2, Vector3 } from "three";
import { texRuido } from "./ruido.js";

/* ============================================================================================================
   NEBLINA DO CÂNION ("viração" que sobe do litoral)
   Camadas de névoa em altura com ruído animado, só no vão do cânion (a borda e os campos continuam limpos; nada de fog global pesado).
   Estados: 0 sem neblina · 1 leve no fundo · 2 cânion "cheio" (mar de nuvens logo abaixo da borda). O nível é contínuo (0–2) e muda devagar.
   Probabilidade: madrugada e amanhecer (some ao longo da manhã); às vezes volta no fim da tarde. Sorteio por dia de jogo.
   ============================================================================================================ */

const sstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const VERT = "varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }";
const FRAG = `varying vec2 vW; uniform sampler2D uN; uniform vec3 uCol; uniform float uOp, uT, uSeed, uScl, uFade, uTopo; uniform vec2 uWind;
void main(){
  vec2 p = vW * uScl + uWind * uT + uSeed;
  float a = texture2D(uN, p).r, b = texture2D(uN, p * 2.7 + .37).g, c = texture2D(uN, p * 6.1 + .71).b;
  float n = a * .55 + b * .3 + c * .15;
  float m = smoothstep(.33, .73, n);
  vec3 col = uCol * (.9 + .18 * (b - .5) + uTopo * .1 * (c - .5));
  gl_FragColor = vec4(col, uOp * m * uFade);
}`;

export function criarNevoa({ pai, chao, fundoH, ciclo }){
  const G = new Group(); G.position.set(1200, 0, 0); pai.add(G);
  const fundo = chao - fundoH, N = texRuido();
  const prof = [60, 150, 290, 470, 710, 1040, 1480, 2020, 2540];
  const mkMat = (op, scl, seed) => new ShaderMaterial({ uniforms: { uN: { value: N }, uCol: { value: new Vector3(1, 1, 1) }, uOp: { value: op }, uT: { value: 0 }, uSeed: { value: seed }, uScl: { value: scl }, uFade: { value: 1 }, uTopo: { value: 0 }, uWind: { value: new Vector2(.004, .002) } },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false });
  const geo = new PlaneGeometry(6000, 9000);
  const camadas = prof.map((d, i) => { const mt = mkMat(.2 + i * .012, 1 / (2200 + i * 150), i * .173); const m = new Mesh(geo, mt); m.rotation.x = -Math.PI / 2; m.renderOrder = 2 + i; G.add(m); return { m, mt, y0: chao - d, ob: .2 + i * .012 }; });
  const topos = [0, 1].map(k => { const mt = mkMat(.8, 1 / 1800, 3.1 + k * .41); const m = new Mesh(geo, mt); m.rotation.x = -Math.PI / 2; m.renderOrder = 20 + k; G.add(m); return { m, mt, off: -k * 38 }; });
  G.renderOrder = 2;

  const S = { n: 0, alvo: 0, forcado: null, topo: fundo };
  const sorteio = (d) => { let s = ((d * 40503) ^ 0x9e3779b1) >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const nivelDia = (d) => { const r = sorteio(d)(), r2 = sorteio(d + 977)(), r3 = sorteio(d + 4421)(); return { alba: r < .30 ? 0 : r < .66 ? 1 : 2, tarde: r2 < .64 ? 0 : r2 < .92 ? 1 : 2, tardeOn: r3 }; };
  /* nível pretendido pela hora (0–2) */
  function alvoDaHora(h, dia){
    const A = nivelDia(dia), B = nivelDia(dia + 1);
    let alba = 0;
    if(h < 11) alba = A.alba * (h < 3 ? .55 + .45 * sstep(0, 3, h) : 1) * (1 - sstep(8, 11, h));
    let tarde = 0;
    if(h >= 16.2) tarde = A.tarde * sstep(16.2, 17.6, h) * (1 - sstep(21, 23.5, h)); 
    let noite = 0; if(h >= 21) noite = B.alba * .55 * sstep(21, 24, h);
    return Math.max(alba, tarde, noite);
  }

  function tick(dt, E, camPos, dtJogo){
    const real = dtJogo === undefined ? dt : dtJogo;
    const alvo = S.forcado !== null ? S.forcado : alvoDaHora(E.h, E.dia);
    S.alvo = alvo;
    const taxa = Math.max(real / 5400, dt * .03);                                   // ≈ 1 nível a cada 90 min de jogo (ou ~35 s reais): transições lentas
    S.n += MathUtils.clamp(alvo - S.n, -taxa, taxa);
    const n = S.n;
    const topo = n <= 1 ? fundo - 150 + (fundoH * .22 + 150) * n : fundo + fundoH * .22 + (fundoH - fundoH * .22 - 55) * (n - 1);
    S.topo = topo;
    const col = E.nevoa, lum = Math.max(.12, E.lum);
    const wx = E.vento[0] * 1.2 * 0.6, wz = E.vento[1] * 1.2 * .6;
    const cy = camPos.y;
    G.visible = n > .02;
    if(!G.visible) return;
    camadas.forEach(c => {
      const a = sstep(topo + 90, topo - 340, c.y0) * sstep(0, .5, n + (c.y0 < fundo + fundoH * .3 ? .35 : 0));
      c.m.position.y = c.y0; c.m.visible = a > .01; if(!c.m.visible) return;
      const u = c.mt.uniforms; u.uOp.value = c.ob * a * (n > 1 ? 1.25 : 1); u.uCol.value.set(col[0] * lum, col[1] * lum, col[2] * lum); u.uT.value += dt; u.uWind.value.set(wx, wz);
      u.uFade.value = sstep(10, 90, Math.abs(cy - c.y0));
    });
    topos.forEach((t, k) => {
      const a = sstep(.2, 1.1, n) * (k ? .55 : 1) * (n > 1 ? 1 : .7);
      t.m.position.y = topo + t.off; t.m.visible = a > .01; if(!t.m.visible) return;
      const u = t.mt.uniforms; u.uOp.value = a * .88; u.uCol.value.set(Math.min(1, col[0] * lum * 1.04), Math.min(1, col[1] * lum * 1.04), Math.min(1, col[2] * lum * 1.04)); u.uT.value += dt; u.uWind.value.set(wx * .8, wz * .8); u.uTopo.value = 1;
      u.uFade.value = sstep(10, 90, Math.abs(cy - (topo + t.off)));
    });
  }
  return {
    tick, estado: S, grupo: G,
    forca(v){ S.forcado = v; }, reajusta(E){ if(S.forcado === null) S.n = alvoDaHora(E.h, E.dia); }, instante(n){ S.forcado = n; S.n = n; },
    proximoEstado(){ const o = S.forcado === null ? 0 : S.forcado + 1; S.forcado = o > 2 ? null : o; return S.forcado; },
    nome: () => (S.forcado === null ? "auto " : "") + ["sem neblina", "neblina leve", "cânion cheio"][Math.round(S.n)] + " (" + S.n.toFixed(2) + ")"
  };
}
