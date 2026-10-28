import { ShaderMaterial, Vector2, Vector3, Matrix3, MathUtils } from "three";
import { texRuido } from "./ruido.js";
import { GAME_TIME_CONFIG, VIA_LACTEA as MW } from "./config.js";

/* ============================================================================================================
   CICLO DE 24 HORAS — Cânion Fortaleza (lat ≈ −29,2°, primavera)
   Relógio do jogo (1 dia = 24 min reais por padrão), sol e lua com trajetória real, céu em shader (gradiente por altura do sol, disco do sol,
   estrelas com cintilação, Via Láctea, lua com fase, nuvens que andam com o vento) e as luzes da cena.
   Tudo interpolado pela altura do sol: nada troca de uma hora para outra.
   Ganchos para eventos futuros (meteoros, eclipses): ciclo.registrar({ id, ativo(E), tick(dt, E), modifica(E) }) e ciclo.ao("amanhecer", fn).
   ============================================================================================================ */

const LAT = -29.2 * Math.PI / 180, SL = Math.sin(LAT), CL = Math.cos(LAT);
const D2R = Math.PI / 180;
const NASC = 5 + 54 / 60, POENTE = 18 + 56 / 60, MERIDIANO = (NASC + POENTE) / 2;       // nasce ~5h50 e se põe ~19h (hora do relógio do jogo)

const hex = (s) => [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255];
const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const sstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* paleta por altura do sol (graus). zen: zênite · hM/hT: horizonte de manhã / de tarde · sol: luz direta · hs/hg: hemisfério céu/chão · nM/nT: cor da névoa · cl: nuvem iluminada · cd: nuvem na sombra · st: estrelas */
const K = [
  { a: -20, zen: "#01030a", hM: "#04060e", hT: "#04060e", sun: "#9fb4ff", sI: 0, hs: "#0a1430", hg: "#050607", hI: .10, am: .10, nM: "#2b3a5c", nT: "#2b3a5c", cl: "#141a28", cd: "#06080d", st: 1 },
  { a: -14, zen: "#030818", hM: "#0f1838", hT: "#0d1230", sun: "#9fb4ff", sI: 0, hs: "#0c1838", hg: "#06070a", hI: .12, am: .11, nM: "#34436a", nT: "#2e3a5e", cl: "#1c2338", cd: "#0a0d16", st: 1 },
  { a: -8, zen: "#0d1a42", hM: "#4a4678", hT: "#40335f", sun: "#ff9a6a", sI: 0, hs: "#242a52", hg: "#14110f", hI: .22, am: .17, nM: "#5c5a86", nT: "#4e4068", cl: "#5b5380", cd: "#1a1c33", st: .75 },
  { a: -4, zen: "#1f3470", hM: "#a87494", hT: "#8a4e6a", sun: "#ff7a3a", sI: 0, hs: "#4a4a82", hg: "#241a16", hI: .35, am: .21, nM: "#c796a8", nT: "#a06070", cl: "#c78c9c", cd: "#3b3560", st: .22 },
  { a: -1, zen: "#3a5694", hM: "#ffa58c", hT: "#ff9650", sun: "#ff8a48", sI: .5, hs: "#a08aa8", hg: "#3a2a20", hI: .5, am: .26, nM: "#ffc8c4", nT: "#ffb878", cl: "#ffb7a0", cd: "#6a587a", st: 0 },
  { a: 2, zen: "#4f7cc4", hM: "#ffcaa6", hT: "#ffc072", sun: "#ffa662", sI: 1.05, hs: "#c8c0cc", hg: "#403428", hI: .62, am: .30, nM: "#ffe2da", nT: "#ffd6a2", cl: "#ffd8c0", cd: "#8a8aa8", st: 0 },
  { a: 7, zen: "#4f86cf", hM: "#e6dcd8", hT: "#f2d6a2", sun: "#ffd8a6", sI: 1.65, hs: "#d4def0", hg: "#38402c", hI: .80, am: .34, nM: "#f6eeea", nT: "#f8e6c8", cl: "#fff0e4", cd: "#9aa6bc", st: 0 },
  { a: 16, zen: "#3f82d4", hM: "#bcd8ee", hT: "#c4d9ea", sun: "#ffedc8", sI: 2.05, hs: "#cfe6ff", hg: "#33402a", hI: .95, am: .38, nM: "#f3f6f8", nT: "#f5f4ee", cl: "#ffffff", cd: "#9fb0c6", st: 0 },
  { a: 35, zen: "#2f76c8", hM: "#a9d4f2", hT: "#a9d4f2", sun: "#fff4e0", sI: 2.3, hs: "#cfe6ff", hg: "#33402a", hI: 1.0, am: .4, nM: "#f2f7fa", nT: "#f2f7fa", cl: "#ffffff", cd: "#a2b2c8", st: 0 },
  { a: 80, zen: "#2a6fc0", hM: "#b2dcf4", hT: "#b2dcf4", sun: "#fff4e0", sI: 2.3, hs: "#cfe6ff", hg: "#33402a", hI: 1.0, am: .4, nM: "#f2f7fa", nT: "#f2f7fa", cl: "#ffffff", cd: "#a2b2c8", st: 0 }
].map(k => ({ a: k.a, zen: hex(k.zen), hM: hex(k.hM), hT: hex(k.hT), sun: hex(k.sun), sI: k.sI, hs: hex(k.hs), hg: hex(k.hg), hI: k.hI, am: k.am, nM: hex(k.nM), nT: hex(k.nT), cl: hex(k.cl), cd: hex(k.cd), st: k.st }));
const CAMPOS = Object.keys(K[0]).filter(c => c !== "a");

function amostra(alt){
  let i = 0; while(i < K.length - 2 && alt > K[i + 1].a) i++;
  const A = K[i], B = K[i + 1], t = MathUtils.clamp((alt - A.a) / (B.a - A.a), 0, 1), r = {};
  CAMPOS.forEach(c => { r[c] = typeof A[c] === "number" ? A[c] + (B[c] - A[c]) * t : mixA(A[c], B[c], t); });
  return r;
}

const VERT = "varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }";
const FRAG = `
varying vec3 vD;
uniform sampler2D uN;
uniform vec3 uZen, uHor, uSun, uMoon, uSunCol, uCl, uCd, uMoonUp;
uniform float uTime, uStars, uSunVis, uMoonVis, uCover, uLum, uGlow, uDim, uMW;
uniform vec2 uWind;
uniform mat3 uStarM;
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main(){
  vec3 d = normalize(vD); float y = d.y;
  float g = pow(clamp(y, 0.0, 1.0), 0.42);
  vec3 col = mix(uHor, uZen, g);
  if(y < 0.0) col = mix(uHor, uHor * .62, clamp(-y * 6.0, 0.0, 1.0));
  float sd = max(dot(d, uSun), 0.0);
  /* brilho do horizonte do lado do sol (amanhecer e entardecer) */
  vec2 hs = normalize(uSun.xz + 1e-5), hd = normalize(d.xz + 1e-5);
  col += uSunCol * uGlow * pow(1.0 - abs(y), 5.0) * pow(max(dot(hs, hd), 0.0), 2.5) * .55;
  col += uSunCol * uSunVis * (pow(sd, 6.0) * .22 + pow(sd, 90.0) * .55);
  col += uSunCol * uSunVis * smoothstep(.99955, .99985, sd) * 4.0;
  /* estrelas, Via Láctea (no referencial celeste que gira com a hora) */
  if(uStars > .01 && y > -.05){
    vec3 s = uStarM * d;
    vec3 c = s * 115.0, ci = floor(c), cf = c - ci;
    float r1 = h13(ci), r2 = h13(ci + 7.7);
    vec3 pos = vec3(.5) + (vec3(h13(ci + 1.3), h13(ci + 2.9), h13(ci + 4.1)) - .5) * .6;
    float dist = length(cf - pos);
    float br = step(.952, r1) * smoothstep(.3, .0, dist) * (.45 + .75 * r2) * (.78 + .22 * sin(uTime * (2.0 + r2 * 5.0) + r1 * 40.0));
    float vis = uStars * smoothstep(-.03, .12, y);
    vec3 gn = normalize(vec3(-.0548, -.8734, .4837));            // polo norte galáctico (RA 192,86° Dec +27,13°)
    vec3 gc = normalize(vec3(-.0558, -.8727, -.4859));           // centro galáctico
    float lat = dot(s, gn), cw = smoothstep(.15, 1.0, dot(s, gc) * .5 + .5); cw *= cw;
    float larg = .1 + .2 * cw;                                   // a faixa alarga perto do núcleo (a "cauda" larga e brilhante)
    float band = exp(-pow(lat / larg, 2.0));
    float n1 = texture2D(uN, s.xy * 1.7 + s.z * .5).g * .6 + texture2D(uN, s.yz * 5.2 + .3).b * .4;
    float poeira = smoothstep(.5, .8, n1);                     // faixas escuras de poeira cortando a faixa
    float gran = .55 + .9 * texture2D(uN, s.xz * 13.0 + s.y * 7.0).r;     // nuvens estelares granuladas
    float mw = band * (.22 + .95 * cw) * (1.0 - .62 * poeira * band) * gran * uMW * .9;
    vec3 corMW = mix(vec3(.62, .72, .98), vec3(1.0, .88, .62), cw * .9) * mw;
    float perto = 1.0 + 1.6 * band * uMW;                        // mais estrelas junto da faixa
    float br2 = step(.952 - .05 * band * uMW, r1) * smoothstep(.3, .0, dist) * (.45 + .75 * r2) * (.78 + .22 * sin(uTime * (2.0 + r2 * 5.0) + r1 * 40.0));
    br = max(br, br2 * .8) * perto * .7 + br * .3;
    col += vec3(.92, .94, 1.0) * br * vis * 2.0 + corMW * vis * 1.9;
  }
  /* lua com fase (iluminada pelo sol de verdade: a fase sai da geometria) */
  float md = dot(d, uMoon);
  if(uMoonVis > .01 && md > .9985){
    vec3 b1 = normalize(cross(uMoonUp, uMoon)), b2 = cross(uMoon, b1);
    float R = .0118;
    vec2 p = vec2(dot(d, b1), dot(d, b2)) / R;
    float rr = dot(p, p);
    if(rr < 1.0){
      vec3 n = vec3(p, sqrt(1.0 - rr));
      vec3 L = vec3(dot(uSun, b1), dot(uSun, b2), -dot(uSun, uMoon));
      float lit = smoothstep(-.04, .12, dot(n, L));
      float mar = texture2D(uN, p * .22 + .5).r;
      vec3 mc = mix(vec3(.62, .6, .56), vec3(.93, .92, .86), smoothstep(.38, .62, mar));
      vec3 moon = mc * (lit + .035);
      col = mix(col, moon, uMoonVis * smoothstep(1.0, .94, rr));
    }
  }
  col += vec3(.5, .6, .85) * pow(max(md, 0.0), 160.0) * uMoonVis * .16;
  /* nuvens */
  if(y > .0 && uCover > .02){
    vec2 uv = d.xz / (y * .85 + .13) * .55 + uWind * uTime;
    float a = texture2D(uN, uv * .30).r * .62 + texture2D(uN, uv * 1.15 + .31).g * .38;
    float cov = smoothstep(1.0 - uCover, 1.0 - uCover + .24, a) * smoothstep(.0, .17, y);
    float a2 = texture2D(uN, (uv + uSun.xz * .05) * .30).r * .62 + texture2D(uN, (uv + uSun.xz * .05) * 1.15 + .31).g * .38;
    float sh = clamp(.62 + (a - a2) * 5.0, 0.0, 1.0);
    vec3 cc = mix(uCd, uCl, sh) * uDim;
    cc += uSunCol * pow(sd, 5.0) * .35 * uSunVis * (1.0 - cov * .3);
    col = mix(col, cc, cov * .94);
  }
  col += (h13(vec3(gl_FragCoord.xy, uTime * 3.0)) - .5) * (1.6 / 255.0);          // dithering: sem faixas (banding) nos degradês escuros
  gl_FragColor = vec4(col, 1.0);
}`;

export function criarCiclo({ cena, luzes, ceu, cen, renderer }){
  const U = {
    uN: { value: texRuido() }, uZen: { value: new Vector3() }, uHor: { value: new Vector3() }, uSun: { value: new Vector3(0, 1, 0) }, uMoon: { value: new Vector3(0, 1, 0) }, uMoonUp: { value: new Vector3(0, 1, 0) },
    uSunCol: { value: new Vector3() }, uCl: { value: new Vector3() }, uCd: { value: new Vector3() }, uTime: { value: 0 }, uStars: { value: 0 }, uSunVis: { value: 1 }, uMoonVis: { value: 0 },
    uCover: { value: .4 }, uLum: { value: 1 }, uGlow: { value: 0 }, uDim: { value: 1 }, uMW: { value: 0 }, uWind: { value: new Vector2(.004, .002) }, uStarM: { value: new Matrix3() }
  };
  const matCeu = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, side: 1, depthWrite: false, fog: false });

  /* relógio do jogo */
  const T0 = Date.now();
  const R = { dia: 0, h: 8.5, mult: 1, pausa: false, ativo: false, salto: null };
  const base = new Date(T0); const diaAno0 = Math.floor((base - new Date(base.getFullYear(), 0, 0)) / 864e5);
  const ouvintes = {}; const ganchos = [];
  const emite = (n, v) => (ouvintes[n] || []).forEach(f => { try{ f(v); }catch(_){ /* ouvinte com erro não derruba o relógio */ } });

  const ENU = { E: [0, 0, 0], N: [0, 0, 0] };
  const th = 1.15;                                                         // o eixo X do mundo aponta para o rumo 65,9° (norte → leste)
  const dirMundo = (azRad, altRad) => { const c = Math.cos(altRad); return new Vector3(Math.cos(azRad - th) * c, Math.sin(altRad), Math.sin(azRad - th) * c); };
  const eqParaHor = (dec, Hr) => {
    const sa = SL * Math.sin(dec) + CL * Math.cos(dec) * Math.cos(Hr), alt = Math.asin(MathUtils.clamp(sa, -1, 1));
    let az = Math.acos(MathUtils.clamp((Math.sin(dec) - sa * SL) / (Math.cos(alt) * CL + 1e-9), -1, 1)); if(Math.sin(Hr) > 0) az = 2 * Math.PI - az;
    return { alt, az };
  };
  const fase = (h) => h < 4.5 ? "Madrugada" : h < 7 ? "Amanhecer" : h < 17 ? "Dia" : h < 19.5 ? "Entardecer" : "Noite";

  /* estado calculado a cada quadro */
  const E = { h: R.h, dia: 0, alt: 0, az: 0, sunDir: new Vector3(0, 1, 0), moonDir: new Vector3(0, 1, 0), moonAlt: -1, moonFrac: 0, lum: 1, noite: 0, tarde: 0, hor: [0, 0, 0], zen: [0, 0, 0], nevoa: [1, 1, 1], fog: [1, 1, 1], nuvemLit: [1, 1, 1], cobertura: .4, vento: [.004, .002], fase: "Dia", fasePct: 0, luaFase: 0, sunI: 2, escurece: 1, ocultaSol: 0 };
  const naoIluminados = [];                                                 // materiais sem luz (MeshBasic) que escurecem à noite
  const registraNaoIluminado = (mt) => { if(mt && mt.color && !mt.userData.semCiclo && !mt.userData._cic){ mt.userData._cic = mt.color.clone(); naoIluminados.push(mt); } };
  let lumAplicada = -1;

  const JD0 = 2451550.26, SINOD = 29.530588;
  function recalcula(){
    const jd = T0 / 864e5 + 2440587.5 + R.dia + R.h / 24 + (R.luaOffset || 0);
    const N = diaAno0 + R.dia, dec = -23.44 * D2R * Math.cos(2 * Math.PI * (N + 10) / 365);
    const Hs = (R.h - MERIDIANO) * 15 * D2R;
    const s = eqParaHor(dec, Hs); E.alt = s.alt / D2R; E.az = s.az;
    E.sunDir.copy(dirMundo(s.az, s.alt));
    /* lua: ângulo de fase real (idade da lua) e declinação com ciclo de 27,3 dias */
    const idade = (((jd - JD0) % SINOD) + SINOD) % SINOD, elong = idade / SINOD * 2 * Math.PI, decM = 23 * D2R * Math.sin(2 * Math.PI * (jd - JD0) / 27.32 + 1.2);
    const m = eqParaHor(decM, Hs - elong); E.moonAlt = m.alt / D2R; E.moonDir.copy(dirMundo(m.az, m.alt));
    E.luaFase = idade / SINOD; E.moonFrac = (1 - Math.cos(elong)) / 2;
    /* referencial das estrelas: mundo → leste/norte/cima → eixo celeste (que gira com o tempo sideral) */
    const cE = Math.cos(Math.PI / 2 - th), sE = Math.sin(Math.PI / 2 - th), Ew = [cE, 0, sE], Nw = [Math.cos(th), 0, -Math.sin(th)], Uw = [0, 1, 0];
    const Xc = [0, -SL, CL], Yc = [1, 0, 0], Zc = [0, CL, SL];
    const enuDe = (r) => [r[0] * Ew[0] + r[1] * Nw[0] + r[2] * Uw[0], r[0] * Ew[1] + r[1] * Nw[1] + r[2] * Uw[1], r[0] * Ew[2] + r[1] * Nw[2] + r[2] * Uw[2]];
    const linhas = [enuDe(Xc), enuDe(Yc), enuDe(Zc)];                          // linhas = eixos celestes escritos no mundo
    const raSol = 2 * Math.PI * (N - 79) / 365.25, lst = raSol + Hs, cL = Math.cos(lst), sL = Math.sin(lst);
    const r0 = linhas[0], r1 = linhas[1], r2 = linhas[2];
    const a = r0.map((v, i) => v * cL - r1[i] * sL), b = r0.map((v, i) => v * sL + r1[i] * cL);
    U.uStarM.value.set(a[0], a[1], a[2], b[0], b[1], b[2], r2[0], r2[1], r2[2]);
  }

  /* sorteio por dia: cobertura de nuvens e vento */
  const sorteioDia = (d) => { let s = (d * 2654435761 + 12345) >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

  function aplica(dt){
    const alt = E.alt, k = amostra(alt);
    E.tarde = sstep(11.5, 13.5, R.h);
    const hor = mixA(k.hM, k.hT, E.tarde), nev = mixA(k.nM, k.nT, E.tarde);
    const noite = 1 - sstep(-8, 1, alt), diaK = sstep(-1, 8, alt);
    E.noite = noite; E.hor = hor; E.zen = k.zen; E.nevoa = nev;
    const luaUp = sstep(-3, 9, E.moonAlt), luaLuz = E.moonFrac * luaUp * (1 - diaK);
    E.lum = Math.max(sstep(-10, 6, alt) * .93 + .07, .09 + luaLuz * .12);
    E.fase = fase(R.h);
    const r = sorteioDia(Math.floor(R.dia + diaAno0)), cob = .26 + r() * .36, vx = (r() - .5) * .012, vz = (r() - .5) * .012;
    E.cobertura = cob + .08 * Math.sin(R.dia * 1.7 + R.h * .35); E.vento = [vx, vz + .0025];
    E.escurece = 1; E.ocultaSol = 0; E.sunI = k.sI;
    ganchos.forEach(g => { if(g.modifica) g.modifica(E); });                  // ex.: eclipse solar escurece o céu
    /* uniformes do céu */
    U.uZen.value.set(...k.zen); U.uHor.value.set(...hor); U.uSun.value.copy(E.sunDir); U.uMoon.value.copy(E.moonDir);
    const up = new Vector3(0, 1, 0); if(Math.abs(E.moonDir.y) > .98) up.set(1, 0, 0); U.uMoonUp.value.copy(up);
    U.uSunCol.value.set(...k.sun); U.uCl.value.set(...mixA(k.cl, hor, .18 * (1 - diaK))); U.uCd.value.set(...k.cd);
    U.uTime.value += dt; U.uStars.value = k.st * (1 - E.cobertura * .55) * E.escurece; U.uSunVis.value = sstep(-5, -.5, alt) * (1 - E.ocultaSol); U.uMoonVis.value = luaUp * (.2 + .8 * noite) * (E.moonFrac > .015 ? 1 : .6);
    /* Via Láctea: 21:30 tênue → 3:00 pico → ~4:30 some; lua alta/cheia a apaga; lua nova = máximo */
    { const hh = R.h; let v = 0; if(hh >= MW.ini || hh < MW.pico){ const ph = ((hh - MW.ini + 24) % 24) / (((MW.pico - MW.ini) + 24) % 24); v = Math.pow(Math.max(0, Math.min(1, ph)), MW.expoente); } else if(hh < MW.fim) v = 1 - sstep(MW.pico, MW.fim, hh);
      const escuro = 1 - sstep(-18, -8, alt), semLua = 1 - .88 * E.moonFrac * sstep(-2, 12, E.moonAlt); E.viaLactea = v * escuro * semLua * (1 - .5 * Math.max(0, E.cobertura)); U.uMW.value = Math.max(0, E.viaLactea) * (MW.forca || 1); }
    U.uCover.value = Math.max(0, E.cobertura); U.uGlow.value = sstep(-9, -1, alt) * (1 - sstep(2, 14, alt)); U.uDim.value = E.escurece; U.uWind.value.set(E.vento[0], E.vento[1]);
    /* luzes: o sol (que projeta sombra) e, de noite, a lua; a segunda direcional é o enchimento do dia e vira luar */
    const sI = k.sI * E.escurece * (1 - E.ocultaSol * .96);
    luzes.sol.color.setRGB(...k.sun); luzes.sol.intensity = sI; luzes.sol.position.copy(E.sunDir).multiplyScalar(100);
    const luar = luaLuz * .75 * E.escurece;
    const noiteK = 1 - diaK;
    luzes.sol2.color.setRGB(...mixA([.81, .89, 1], [.6, .71, 1], noiteK));
    luzes.sol2.position.set(-E.sunDir.x * 100, 40, -E.sunDir.z * 100).lerp(E.moonDir.clone().multiplyScalar(100), noiteK);
    luzes.sol2.intensity = diaK * .5 * E.escurece + luar;
    luzes.hemi.color.setRGB(...k.hs); luzes.hemi.groundColor.setRGB(...k.hg); luzes.hemi.intensity = (k.hI + luaLuz * .12) * (.55 + .45 * E.escurece); luzes.amb.intensity = k.am + luaLuz * .05; luzes.amb.color.setRGB(...mixA([1, 1, 1], [.78, .84, 1], noiteK));
    /* névoa global só de leve (a névoa do cânion é feita em camadas, ver nevoa.js) */
    const fc = mixA(hor, [hor[0] * .8, hor[1] * .8, hor[2] * .85], .3); E.fog = fc; cena.fog.color.setRGB(fc[0], fc[1], fc[2]); cena.fog.density = .00011;
    if(ceu && ceu.userData.sol3d) ceu.userData.sol3d.visible = false;
    /* materiais sem iluminação acompanham a luz do dia */
    if(Math.abs(E.lum - lumAplicada) > .01){ lumAplicada = E.lum; naoIluminados.forEach(mt => { mt.color.copy(mt.userData._cic).multiplyScalar(E.lum); }); }
    if(cen && cen.lumUniformes) cen.lumUniformes.forEach(u => { u.value = E.lum; });
  }

  function ligar(on){
    if(on === R.ativo) return; R.ativo = on;
    if(on){ ceu.material = matCeu; if(!R.preparado){ R.preparado = true; if(cen && cen.grupo) cen.grupo.traverse(o => { if(o.isMesh && o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(mt => { if(mt.isMeshBasicMaterial && o !== ceu && !(o.parent === ceu)) registraNaoIluminado(mt); }); } }); } recalcula(); aplica(0); }
    else { naoIluminados.forEach(mt => mt.color.copy(mt.userData._cic)); lumAplicada = -1; if(cen && cen.lumUniformes) cen.lumUniformes.forEach(u => { u.value = 1; }); }
  }

  let hAnt = R.h;
  function tick(dt, camPos){
    if(!R.ativo) return;
    const avanca = (dh) => { R.h += dh; while(R.h >= 24){ R.h -= 24; R.dia++; emite("novoDia", R.dia); } while(R.h < 0){ R.h += 24; R.dia--; } };
    if(R.salto){                                                            // clique no relógio: o céu "corre" até a hora escolhida em ~1,5 s
      const S = R.salto; S.t += dt; const k = Math.min(1, S.t / S.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, alvo = S.d * e;
      avanca(alvo - S.feito); S.feito = alvo;
      if(k >= 1){ R.salto = null; hAnt = R.h; emite("salto", { h: R.h, dia: R.dia }); }
    } else if(!R.pausa) avanca(dt * R.mult / GAME_TIME_CONFIG.realSecondsPerGameHour);
    if(R.salto){ hAnt = R.h; E.h = R.h; E.dia = R.dia; recalcula(); aplica(dt); return; }
    [["amanhecer", NASC], ["meioDia", MERIDIANO], ["entardecer", 17], ["anoitecer", POENTE + .5], ["meiaNoite", 0]].forEach(([n, hh]) => { if((hAnt < hh && R.h >= hh) || (hAnt > R.h && hh <= R.h && n !== "meiaNoite")) emite(n, R.h); });
    hAnt = R.h; E.h = R.h; E.dia = R.dia;
    recalcula(); aplica(dt);
    ganchos.forEach(g => { if(g.tick && (!g.ativo || g.ativo(E))) g.tick(dt, E); });
    void camPos;
  }

  return {
    ligar, tick, estado: E, relogio: R,
    ao: (n, f) => { (ouvintes[n] = ouvintes[n] || []).push(f); },
    registrar: (g) => { ganchos.push(g); return g; },
    registraNaoIluminado,
    hora: () => R.h, diaJogo: () => R.dia, ativo: () => R.ativo,
    horaTexto: () => { const hh = Math.floor(R.h), mm = Math.floor((R.h - hh) * 60); return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); },
    diaSemana: () => (new Date(T0 + R.dia * 864e5)).getDay(),
    diaUtil: () => { const d = (new Date(T0 + R.dia * 864e5)).getDay(); return d >= 1 && d <= 5; },
    ajustaHora(h){ R.h = ((h % 24) + 24) % 24; hAnt = R.h; if(R.ativo){ recalcula(); aplica(0); } },
    pulaHoras(d){ let h = R.h + d; while(h >= 24){ h -= 24; R.dia++; emite("novoDia", R.dia); } while(h < 0){ h += 24; R.dia--; } R.h = h; hAnt = h; if(R.ativo){ recalcula(); aplica(0); } },
    irParaHora(h){ let d = (((h - R.h) % 24) + 24) % 24; if(d > 12) d -= 24; if(Math.abs(d) < .005) return; R.salto = { d, t: 0, dur: GAME_TIME_CONFIG.saltoSeg, feito: 0 }; emite("saltoInicio", { de: R.h, para: h }); },
    emSalto: () => !!R.salto, normal(){ R.mult = 1; R.pausa = false; },
    segJogoPorSeg: () => 3600 / GAME_TIME_CONFIG.realSecondsPerGameHour * (R.pausa ? 0 : R.mult),
    luaNova(on){ if(!on){ R.luaOffset = 0; return; } R.luaOffset = 0; const jd = T0 / 864e5 + 2440587.5 + R.dia + R.h / 24, idade = (((jd - 2451550.26) % 29.530588) + 29.530588) % 29.530588; R.luaOffset = (29.530588 - idade) % 29.530588; if(R.luaOffset > 14.7) R.luaOffset -= 29.530588; },
    acelera(f){ R.mult = MathUtils.clamp(R.mult * f, .125, 256); }, alternaPausa(){ R.pausa = !R.pausa; return R.pausa; },
    posicoes: { NASC, POENTE, MERIDIANO },
    _fase: fase
  };
}
