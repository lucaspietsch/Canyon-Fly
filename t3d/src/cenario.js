import { ShaderMaterial, Vector4, Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, PlaneGeometry, InstancedMesh, MeshStandardMaterial, MeshBasicMaterial, FogExp2, BackSide, DoubleSide, Object3D, RepeatWrapping, Vector3 } from "three";
import { m, NIVEL, canvasTex, texPlacaHD, placaLegivel, rng, mat, caixa, coluna, barra, grupo } from "./lib.js";
import { criarPlataforma, guardaCorpo, DECK } from "./plataforma.js";
import { criarCasinha, CASA } from "./casinha.js";
import { criarPortico, PORT } from "./portico.js";
import { PARQUE_REAL } from "./mundo/dados/parque-real.js";
import { criarTerreno, texAguaCorrente, TERR } from "./terreno.js";
import { deformaLinha, criaParedao, materialRocha } from "./paredoes.js";
import { ShapeGeometry, Path, Shape, ExtrudeGeometry, BufferGeometry, Float32BufferAttribute, TubeGeometry, CatmullRomCurve3, TorusGeometry as TG2, CircleGeometry, AdditiveBlending, ConeGeometry, Color } from "three";

/* ============================================================================================================
   CENÁRIO REAL DA PLATAFORMA DE CHEGADA · Cânion Fortaleza
   Reúne: terreno de capim, cerca de mourões pretos com tela, portão com a placa TIROLESA, brita, casinha, deck, pórtico com molas e
   ancoragens, dois para-raios, estação meteorológica, fumódromo, trolley coberto por lona, o vão do cânion (≈ 900 m) com neblina e o
   lançamento do outro lado. 1 m = 2,94 u. Eixos: X ao longo dos cabos (vão = +X), Z ao longo do deck, Y para cima.
   ============================================================================================================ */
export const AREA = { x0: -92, x1: 157, z0: -25, z1: 62 };                // caixa que envolve o cercado (croqui do usuário)
const CASA_X0 = CASA.x0, CASA_X1 = CASA.x1;
const BORDA = 508;                                                          // x da borda do cânion (face do paredão do nosso lado): depois da cerca há ≈ 57 m de campo aberto               // cerca externa (≈ 88 m × 28 m: o polígono do Google Earth)
const FOG_COR = 0xcdd3d7;

function texCapim(){
  return canvasTex(256, 256, (c, w, h) => {
    const r = rng(2); c.fillStyle = "#6f7f36"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 2600; i++){ c.fillStyle = ["#5d6f2c", "#7d8c3c", "#8a8f45", "#4f6226", "#98984f"][i % 5]; c.fillRect(r() * w, r() * h, 1.4, 3 + r() * 5); }
    for(let i = 0; i < 18; i++){ c.fillStyle = "rgba(60,48,30,.14)"; c.beginPath(); c.ellipse(r() * w, r() * h, 12 + r() * 30, 8 + r() * 18, r() * 3, 0, 7); c.fill(); }
  }, { repeat: [60, 100] });
}
function texBrita(){
  return canvasTex(128, 128, (c, w, h) => { const r = rng(4); c.fillStyle = "#4a4a4a"; c.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ const t = 50 + Math.floor(r() * 70); c.fillStyle = `rgb(${t},${t},${t + 2})`; c.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 2); } }, { repeat: [6, 3] });
}
function texParedao(inverso = false){
  return canvasTex(256, 1024, (c, w, h) => {
    const r = rng(8);
    c.fillStyle = "#cdd3d7"; c.fillRect(0, 0, w, h);
    const rocha = (y0, y1) => {
      c.fillStyle = "#3f4a3a"; c.fillRect(0, y0, w, y1 - y0);
      for(let i = 0; i < 90; i++){ c.fillStyle = `rgba(${10 + r() * 20},${20 + r() * 30},${10 + r() * 20},${.2 + r() * .3})`; c.fillRect(r() * w, y0 + r() * (y1 - y0) * .5, 2 + r() * 8, 20 + r() * (y1 - y0)); }
      for(let i = 0; i < 24; i++){ c.fillStyle = "rgba(10,14,10,.4)"; c.fillRect(r() * w, y0, 1.5, y1 - y0); }
      c.fillStyle = "rgba(160,150,120,.25)"; c.fillRect(0, y0, w, 8);
    };
    const mistura = (y0, y1, deRocha) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, deRocha ? "rgba(205,211,215,0)" : "rgba(205,211,215,1)"); g.addColorStop(1, deRocha ? "rgba(205,211,215,1)" : "rgba(205,211,215,0)"); c.fillStyle = g; c.fillRect(0, y0, w, y1 - y0); };
    if(!inverso){ rocha(0, 130); mistura(70, 200, true); }                     // paredão: rocha no topo, some na neblina
    else { rocha(0, 520); mistura(260, 760, true); }                         // pico: topo de rocha, base na neblina
  }, { repeat: inverso ? [4, 1] : [14, 1] });
}
function texCeu(){
  return canvasTex(8, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9aa3aa"); g.addColorStop(.35, "#b9c0c6"); g.addColorStop(.5, "#d8dcde"); g.addColorStop(.52, "#cfd5d9"); g.addColorStop(1, "#bfc6cb"); c.fillStyle = g; c.fillRect(0, 0, w, h); });
}
function texNevoa(){
  return canvasTex(256, 256, (c, w, h) => {
    const r = rng(13); c.clearRect(0, 0, w, h);
    for(let i = 0; i < 70; i++){ const x = r() * w, y = r() * h, rad = 20 + r() * 50, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(240,243,244,${.18 + r() * .15})`); g.addColorStop(1, "rgba(240,243,244,0)"); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  });
}
function texTela(){
  return canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(40,44,40,.9)"; c.lineWidth = 2; for(let i = 0; i <= w; i += 16){ c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
}
function texTirolesa(){
  return texPlacaHD(256, 192, (c, w, h) => {
    c.fillStyle = "#e9f2f6"; c.fillRect(0, 0, w, h); c.fillStyle = "#f08a2a"; c.fillRect(0, 0, w, 36);
    c.fillStyle = "#fff"; c.font = "bold 24px Arial"; c.textAlign = "left"; c.fillText("TIROLESA", 10, 26); c.textAlign = "right"; c.font = "bold 13px Arial"; c.fillText("ICMBio · Urbia", w - 8, 24);
    c.fillStyle = "#33505c"; c.font = "bold 12px Arial"; c.textAlign = "left";
    ["Plataforma de chegada", "• Use sempre o equipamento de proteção", "• Não fume fora do fumódromo", "• Não ultrapasse a linha amarela", "• Cuidado com o piso molhado", "• Siga as orientações da equipe"].forEach((t, i) => c.fillText(t, 10, 58 + i * 20));
    c.fillStyle = "#1c7aa8"; c.fillRect(0, h - 12, w, 12);
  });
}
function texFumodromo(){
  return texPlacaHD(256, 200, (c, w, h) => {
    c.fillStyle = "#2f6b3a"; c.fillRect(0, 0, w, h); c.fillStyle = "#eaf3e4"; c.textAlign = "left";
    c.font = "bold 24px Arial"; c.fillText("FUMÓDROMO", 14, 34); c.font = "bold 11px Arial";
    ["NÃO POLUA NOSSO ESPAÇO.", "POR FAVOR, FUME SOMENTE AQUI", "SMOKING AREA · Please only smoke here", "ÁREA DE FUMADORES · Por favor fume solo aquí"].forEach((t, i) => c.fillText(t, 14, 56 + i * 15));
    c.fillStyle = "#6bc24a"; c.beginPath(); c.ellipse(60, 150, 34, 24, 0, 0, 7); c.fill(); c.fillStyle = "#fff"; c.fillRect(48, 132, 8, 8); c.fillRect(66, 132, 8, 8); c.fillStyle = "#111"; c.fillRect(51, 135, 3, 3); c.fillRect(69, 135, 3, 3);
    c.fillStyle = "#eaf3e4"; c.font = "bold 12px Arial"; c.fillText("urbia", 170, 176); c.fillText("ICMBio", 170, 192);
  });
}


/* ---- cânion de mata atlântica, rochas preto-azuladas com veios brancos, campos de altitude, céus ---- */
function texMata(){
  return canvasTex(512, 512, (c, w, h) => {
    const r = rng(21); c.fillStyle = "#244d2a"; c.fillRect(0, 0, w, h);
    const verdes = ["#1b3f22", "#2b6131", "#3a7a3a", "#4c9145", "#1a3a20", "#5aa24f", "#2f6a38"];
    for(let i = 0; i < 900; i++){ c.fillStyle = verdes[Math.floor(r() * verdes.length)]; c.globalAlpha = .55 + r() * .45; c.beginPath(); c.arc(r() * w, r() * h, 5 + r() * 16, 0, 7); c.fill(); }
    c.globalAlpha = 1; for(let i = 0; i < 70; i++){ c.fillStyle = "rgba(240,246,240,.07)"; c.beginPath(); c.ellipse(r() * w, r() * h, 20 + r() * 40, 4 + r() * 8, 0, 0, 7); c.fill(); }
    for(let i = 0; i < 40; i++){ c.fillStyle = "rgba(210,205,190,.35)"; c.fillRect(r() * w, r() * h, 2 + r() * 3, 20 + r() * 60); }    // pequenos veios de rocha entre a mata
  }, { repeat: [34, 22] });
}
function texRochaAzul(repeat = [3, 4]){
  return canvasTex(256, 512, (c, w, h) => {
    const r = rng(33); const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#4a5260"); g.addColorStop(.5, "#6b7480"); g.addColorStop(1, "#4d5563"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 160; i++){ c.fillStyle = `rgba(${200 + r() * 55},${205 + r() * 50},${220 + r() * 35},${.05 + r() * .16})`; c.fillRect(r() * w, r() * h * .4, 1.5 + r() * 5, 40 + r() * h * .9); }   // veios brancos escorridos
    for(let i = 0; i < 60; i++){ c.fillStyle = `rgba(60,90,130,${.06 + r() * .1})`; c.fillRect(r() * w, r() * h, 3 + r() * 10, 20 + r() * 120); }
    for(let i = 0; i < 14; i++){ c.fillStyle = "rgba(20,26,34,.22)"; c.fillRect(r() * w, 0, 1.5, h); }
    for(let i = 0; i < 30; i++){ c.fillStyle = "rgba(50,110,50,.35)"; c.beginPath(); c.arc(r() * w, r() * h, 3 + r() * 8, 0, 7); c.fill(); }     // musgo e samambaias
  }, { repeat });
}
function texAgua(){
  return canvasTex(128, 256, (c, w, h) => {
    const r = rng(55); c.fillStyle = "rgba(205,228,240,.82)"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 90; i++){ c.fillStyle = `rgba(255,255,255,${.25 + r() * .5})`; c.fillRect(r() * w, r() * h, 1.5 + r() * 4, 18 + r() * 90); }
    for(let i = 0; i < 40; i++){ c.fillStyle = `rgba(120,170,200,${.15 + r() * .25})`; c.fillRect(r() * w, r() * h, 2 + r() * 5, 20 + r() * 80); }
  }, { repeat: [3, 2] });
}
/** paredão do cânion em camadas (foto do lançamento): degrau de rocha clara no alto, saliência com mata, segundo degrau de rocha mais alto e a encosta de mata até o fundo.
    A textura cobre os 2650 u de altura (o topo da parede fica na base do canvas) e se repete na horizontal. */
function texCamadas(){
  return canvasTex(256, 1024, (c, w, h) => {
    const r = rng(41), k = h / 2650, Y = (d) => h - d * k;                                  // profundidade (u) → linha do canvas
    c.fillStyle = "#2f5a33"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 2600; i++){ c.fillStyle = ["#1d4426", "#2f6a36", "#3d7a3e", "#4f9148", "#27552e"][i % 5]; c.globalAlpha = .6 + r() * .4; c.beginPath(); c.ellipse(r() * w, Y(640) - r() * Y(640), 3 + r() * 9, (3 + r() * 9) * .21, 0, 0, 7); c.fill(); }   // encosta de mata
    c.globalAlpha = 1;
    const rocha = (d0, d1) => {
      const g = c.createLinearGradient(0, Y(d0), 0, Y(d1)); g.addColorStop(0, "#c9c6bb"); g.addColorStop(.5, "#aaa79d"); g.addColorStop(1, "#8d8b83"); c.fillStyle = g; c.fillRect(0, Y(d1), w, Y(d0) - Y(d1));
      for(let i = 0; i < 90; i++){ c.fillStyle = `rgba(${40 + r() * 30},${44 + r() * 30},${46 + r() * 30},${.06 + r() * .16})`; c.fillRect(r() * w, Y(d1) + r() * (Y(d0) - Y(d1)) * .4, 1 + r() * 3, (Y(d0) - Y(d1)) * (.3 + r() * .7)); }   // fendas verticais
      for(let i = 0; i < 14; i++){ c.fillStyle = "rgba(60,58,52,.16)"; c.fillRect(0, Y(d1) + r() * (Y(d0) - Y(d1)), w, 1); }                                                                                 // estratos
      for(let i = 0; i < 26; i++){ c.fillStyle = `rgba(${50 + r() * 30},${100 + r() * 40},${50 + r() * 20},.55)`; c.beginPath(); c.ellipse(r() * w, Y(d1) + r() * (Y(d0) - Y(d1)), 3 + r() * 8, (2 + r() * 5) * .21, 0, 0, 7); c.fill(); }     // musgo e arbustos
    };
    rocha(0, 175); rocha(300, 640);
    for(let i = 0; i < 700; i++){ c.fillStyle = ["#2b5a30", "#3f7d3d", "#4f9148", "#6a9a50"][i % 4]; c.globalAlpha = .8; c.beginPath(); c.ellipse(r() * w, Y(175) - r() * (Y(175) - Y(300)), 2 + r() * 7, (2 + r() * 7) * .21, 0, 0, 7); c.fill(); }          // saliência com mata
    c.globalAlpha = 1;
  }, { repeat: [1, 1] });
}
function texNeblinaQueda(){
  return canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); });
}
function texCampoAlt(){
  /* capim seco avermelhado dos campos de altitude (street view): touceiras marrom-avermelhadas, manchas de capim oliva e de terra */
  return canvasTex(256, 256, (c, w, h) => {
    const r = rng(2); c.fillStyle = "#8d7a55"; c.fillRect(0, 0, w, h);
    for(let i = 0; i < 3400; i++){ c.fillStyle = ["#7a5a42", "#9c7a52", "#6e5440", "#8a8a4a", "#ad8c5e", "#7f6446", "#93604a"][i % 7]; c.fillRect(r() * w, r() * h, 1.4, 3 + r() * 6); }
    for(let i = 0; i < 26; i++){ c.fillStyle = i % 3 ? "rgba(90,52,40,.18)" : "rgba(100,110,52,.16)"; c.beginPath(); c.ellipse(r() * w, r() * h, 12 + r() * 30, 8 + r() * 18, r() * 3, 0, 7); c.fill(); }
  }, { repeat: [90, 110] });
}
function texCeuModo(modo){
  return canvasTex(8, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if(modo === "dia"){ [[0, "#2f78c8"], [.3, "#5aa0e0"], [.46, "#a9d4f2"], [.5, "#d9ecf8"], [.52, "#c6e0ee"], [1, "#a8c8d8"]].forEach(([p, k]) => g.addColorStop(p, k)); }
    else if(modo === "poente"){ [[0, "#0e1a44"], [.16, "#262a6c"], [.3, "#7a3f86"], [.4, "#d4604f"], [.46, "#ff9a58"], [.495, "#ffd98a"], [.5, "#ffe9b0"], [.52, "#e7a273"], [1, "#6f5470"]].forEach(([p, k]) => g.addColorStop(p, k)); }
    else { [[0, "#9aa3aa"], [.35, "#b9c0c6"], [.5, "#d8dcde"], [.52, "#cfd5d9"], [1, "#bfc6cb"]].forEach(([p, k]) => g.addColorStop(p, k)); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}
const CLIMAS = {
  nublado: { nome: "Nublado", fog: 0xcdd3d7, dens: .00042, hemi: [0xdfe8ff, 0x2a2418, .9], amb: .35, sol: [0xffffff, 1.25, [6, 9, 12]], sol2: [0xffd6a0, .25], nevoa: 0xe4e8ea, nevoaK: 1, sol3d: 0 },
  dia: { nome: "Dia de sol", fog: 0xc4dcee, dens: .00026, hemi: [0xcfe6ff, 0x33402a, 1.0], amb: .4, sol: [0xfff4e0, 2.3, [6, 9, 12]], sol2: [0xcfe3ff, .5], nevoa: 0xf2f7fa, nevoaK: .45, sol3d: 1 },
  poente: { nome: "Pôr do sol", fog: 0xd89a78, dens: .00038, hemi: [0xffcfa0, 0x2a2230, .75], amb: .3, sol: [0xffa860, 1.7, [60, 8, -20]], sol2: [0x7a6ab8, .5], nevoa: 0xf0b890, nevoaK: .7, sol3d: 2 },
  ciclo: { nome: "Ciclo de 24 h", fog: 0xc4dcee, dens: .00011, hemi: [0xcfe6ff, 0x33402a, 1.0], amb: .4, sol: [0xfff4e0, 2.3, [6, 9, 12]], sol2: [0xcfe3ff, .5], nevoa: 0xf2f7fa, nevoaK: .45, sol3d: 0 }
};

/** lâmina de queda d'água: malha em arco (sai do lábio na horizontal e cai) + shader de fios de água que aceleram e se desfazem em borrifo */
function criaQueda(larg, alt, seed){
  const SEG = 56, geo = new PlaneGeometry(larg, alt, 6, SEG), pos = geo.attributes.position;
  for(let i = 0; i < pos.count; i++){ const depth = alt / 2 - pos.getY(i); pos.setZ(i, Math.min(1, Math.sqrt(Math.max(0, depth) / 22)) * 3.4); }
  geo.computeVertexNormals();
  const mt = new ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAlt: { value: alt }, uSeed: { value: seed }, uLum: { value: 1 }, uVento: { value: new Vector4(.8, .6, .2, 0) }, uQuali: { value: 1 } }, transparent: true, depthWrite: false, side: DoubleSide,
    vertexShader: `varying vec2 vUv; uniform float uT, uAlt, uSeed; uniform vec4 uVento; void main(){ vUv = uv; vec3 p = position; float rel = clamp((1.0 - uv.y), 0.0, 1.0); float sway = sin(uT * 0.8 + rel * 6.0 + uSeed) * (0.35 + 1.6 * uVento.z) * rel * rel; p.x += sway; p.z += uVento.z * 3.0 * rel * rel * (0.6 + 0.4 * sin(uT * 1.7 + uSeed)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uT, uAlt, uSeed, uLum;
      float h(float n){ return fract(sin(n * 127.1 + uSeed) * 43758.5453); }
      float vn(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h(i), h(i + 1.0), f); }
      void main(){
        float depth = (1.0 - vUv.y) * uAlt, rel = clamp(depth / uAlt, 0.0, 1.0), u = vUv.x;
        float flow = uT * (16.0 + sqrt(depth) * 0.9);
        float s1 = vn(u * 18.0) * vn(depth * 0.030 - flow * 0.075 + u * 7.0);
        float s2 = vn(u * 47.0 + 9.0) * vn(depth * 0.085 - flow * 0.13 + u * 29.0);
        float s3 = vn(u * 83.0 + 21.0) * vn(depth * 0.14 - flow * 0.24 + u * 61.0);                  // fios finos mais rápidos
        float dens = clamp(0.62 + 0.8 * s1 + 0.6 * s2 + 0.35 * s3, 0.0, 1.0);
        float sp = 0.16 + 0.30 * pow(rel, 0.7);
        float edge = smoothstep(0.0, sp, u) * smoothstep(1.0, 1.0 - sp, u);
        float fiosSoltos = step(0.82, vn(u * 29.0 + depth * 0.02 - flow * 0.05)) * step(0.55, s2) * smoothstep(0.1, 0.6, rel) * (1.0 - edge) * 0.8;       // bordas se desfazendo em gotas e fios que se separam
        edge = clamp(edge + fiosSoltos, 0.0, 1.0);
        float a = dens * edge * mix(0.92, 0.30, pow(rel, 0.75)) * smoothstep(0.0, 0.012, rel + 0.012);
        vec3 col = mix(vec3(0.93, 0.97, 1.0), vec3(0.72, 0.86, 0.96), s1 * 0.7) + 0.12 * smoothstep(0.75, 1.0, dens);
        gl_FragColor = vec4(col * uLum, a);
      }`
  });
  const w = new Mesh(geo, mt); w.rotation.y = Math.PI / 2; return w;
}

export function criarCenario({ ag, cena, M, luzes }){
  void M;
  const g = grupo(ag);
  const chao = NIVEL.CHAO;
  const colisores = [], hotspots = [], pecas = [], quedaMeshes = [];                      // pecas: o que o editor de cenário pode selecionar e mover
  cena.fog = new FogExp2(FOG_COR, .00042);
  const Object3D_ = Object3D; void Object3D_;

  /* ---------------------------------------------------------------- terreno, céu, vão do cânion */
  const ceuMatTex = new MeshBasicMaterial({ map: texCeuModo("nublado"), side: BackSide, depthWrite: false, fog: false });
  const ceu = new Mesh(new SphereGeometry(3800, 48, 24), ceuMatTex); ceu.position.y = 0; g.add(ceu);
  const sol3d = new Group(); ceu.add(sol3d); sol3d.position.set(3300, 240, -1500);
  { const disco = new Mesh(new CircleGeometry(150, 40), new MeshBasicMaterial({ color: 0xfff0b8, fog: false, depthWrite: false })); sol3d.add(disco);
    const halo = new Mesh(new CircleGeometry(520, 40), new MeshBasicMaterial({ color: 0xffa24a, transparent: true, opacity: .32, blending: AdditiveBlending, fog: false, depthWrite: false })); halo.position.z = -5; sol3d.add(halo); sol3d.lookAt(0, 0, 0); sol3d.visible = false; sol3d.userData.disco = disco; sol3d.userData.halo = halo; }
  const mata = texMata(), rochaAz = texRochaAzul();
  /* ---- forma real do vão (Google Earth): bolsão em cunha com a abertura para o norte (Rio da Pedra). O lado do recebimento é a borda em x = BORDA; ao sul a borda segue na diagonal até o fundo da cunha e sobe pelo lado leste até o lançamento. A "língua" de campo ao sul é um bloco sólido com a mesma altura do campo. ---- */
  /* trilha do mirante (KML do usuário, georreferenciado: x ao longo da linha deck → lançamento, 1 m = 2,94 u) */
  const TM = PARQUE_REAL.trilhaMirante.map(q => q.slice());
  const TB = PARQUE_REAL.trilhaBorda.map(q => q.slice());                                                                    // trilha da borda (KML): do estacionamento até a borda, lateral a ela, travessia de pedras no arroio e de volta à estrada
  const desl = (pts, d) => pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; return [q[0] + tz / l * d, q[1] - tx / l * d]; });
  /* ---- relevo do planalto (KMLs "parte da borda do cânion" + "borda continuidade"): o campo é um polígono com a borda do cânion como contorno (terra à direita de quem segue o contorno);
     fora dele é o vão (mata lá embaixo). O trecho de fechamento a sudoeste ainda não foi desenhado (fica fora de vista). O vale do riacho é uma malha separada, encaixada num furo do polígono. ---- */
  const BORDA_PTS_RETA = [...PARQUE_REAL.bordaCanion, ...PARQUE_REAL.bordaContinuidade].map(q => q.slice());
  const NORTE_POLI = [], NORTE_RIM = [], MID = m(450);                                                // paredões verticais até 450 m; abaixo, encosta de vale até o rio
  const emPoli = (ply, x, z) => { let c = false; for(let i = 0, j = ply.length - 1; i < ply.length; j = i++){ const [xi, zi] = ply[i], [xj, zj] = ply[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const FECHA_PTS = [[962.5, 4097], [-900, 4350], [-2600, 4000], [-2800, 300]];
  /* a borda do KML é reta em vários trechos: suaviza e DEFORMA com ruído em várias escalas (reentrâncias, pontas sobre o vão). Protege o trecho do arroio/cascata (o vale encaixa nele)
     e, perto de trilhas, a borda só avança para o vão. Tudo que usa a borda (polígono do platô, colisão do lábio, fauna, vale, paredão) usa esta MESMA linha. */
  const distSeg = (L, x, z) => { let d = 1e18; for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1; let t = ((x - a[0]) * vx + (z - a[1]) * vz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - a[0] - vx * t, dz = z - a[1] - vz * t; d = Math.min(d, dx * dx + dz * dz); } return Math.sqrt(d); };
  const smS = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const BORDA_PTS = (() => { const ply0 = [...BORDA_PTS_RETA, ...FECHA_PTS], den0 = (x, z) => emPoli(ply0, x, z);
    const dBox = (x, z) => Math.hypot(Math.max(0, 470 - x, x - 780), Math.max(0, -380 - z, z - 1070));
    return deformaLinha(BORDA_PTS_RETA, { seed: 11, passo: 22, A: [30, 13, 3.6], L: [600, 150, 40], dentro: den0, mascara: (x, z) => smS(0, 130, dBox(x, z)), pertoTrilha: (x, z) => 1 - smS(40, 95, Math.min(distSeg(TM, x, z), distSeg(TB, x, z))) }); })();
  const terraPoli = [...BORDA_PTS, ...FECHA_PTS];
  const densa = (pts, passo) => { const o = []; for(let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / passo)); for(let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(pts[pts.length - 1]); return o; };
  { const sh = new Shape(); sh.moveTo(terraPoli[0][0], -terraPoli[0][1]); terraPoli.slice(1).forEach(([x, z]) => sh.lineTo(x, -z)); sh.closePath();
    const furo = new Path(); [[TERR.x0, -330], [506, -330], [506, 1020], [TERR.x0, 1020]].forEach(([x, z], i) => (i ? furo.lineTo(x, -z) : furo.moveTo(x, -z))); furo.closePath(); sh.holes.push(furo);
    const fg = new ExtrudeGeometry(sh, { depth: MID, bevelEnabled: false, curveSegments: 1 }); fg.rotateX(-Math.PI / 2);
    const topo = texCampoAlt(); topo.repeat.set(1 / 9, 1 / 9); const latTx = texCamadas(); latTx.wrapS = latTx.wrapT = RepeatWrapping; latTx.repeat.set(1 / 140, 1 / 2650); latTx.offset.y = (2650 - MID) / 2650;
    const terra = new Mesh(fg, [new MeshStandardMaterial({ map: topo, roughness: 1 }), new MeshStandardMaterial({ map: latTx, roughness: 1 })]); terra.position.y = chao - .02 - MID; terra.material[1].visible = false; g.add(terra);                 // só o topo: a parede lateral agora é a malha natural (paredoes.js)
    /* friso de rocha ao longo do lábio (faixa vertical voltada para o vão); sgn = lado do vão em relação ao sentido do contorno */
    const rochaLabio = new MeshStandardMaterial({ map: texRochaAzul([1, 1]), color: 0xd8dde2, roughness: .95, side: DoubleSide });
    const dentroDe = (ply, x, z) => { let c = false; for(let i = 0, j = ply.length - 1; i < ply.length; j = i++){ const [xi, zi] = ply[i], [xj, zj] = ply[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const friso = (pts, ply) => { const rf = densa(pts, 8), pos = [], uv = [], idx = []; let ac = 0;
      rf.forEach((pt, i) => { const a = rf[Math.max(0, i - 1)], b = rf[Math.min(rf.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        let sg = 1; if(dentroDe(ply, pt[0] + tz * 3, pt[1] - tx * 3)) sg = -1;                                // o friso fica do lado de fora da terra (voltado para o vão)
        const x = pt[0] + sg * tz * 1.4, z = pt[1] - sg * tx * 1.4; if(i) ac += Math.hypot(pt[0] - rf[i - 1][0], pt[1] - rf[i - 1][1]);
        pos.push(x, chao - .02, z, x, chao - 150, z); uv.push(ac / 70, 1, ac / 70, 0); if(i) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2); });
      const fgm = new BufferGeometry(); fgm.setAttribute("position", new Float32BufferAttribute(pos, 3)); fgm.setAttribute("uv", new Float32BufferAttribute(uv, 2)); fgm.setIndex(idx); fgm.computeVertexNormals(); g.add(new Mesh(fgm, rochaLabio)); };
    // friso(BORDA_PTS, terraPoli);   (as camadas de rocha já vêm da textura do paredão)
    /* a outra margem do vão (KML "continuação da borda do Fortaleza"), ao norte: planalto do outro lado do Rio da Pedra */
    { const NORTE_PTS_RETA = [[-1987.7, 217.9], [-1066.8, -670.6], [-897.1, -871.4], [-1024.4, -962.3], [-842.6, -1204.3], [-1116.2, -1267.1], [-1426.1, -1137.8], [-1792.7, -1337.7], [-2218.4, -1210.8], [-3272.0, -1259.9], [-4587.0, -1501.6], [-5077.3, -1325.1], [-5384.7, -1352.3], [-5522.1, -1563.4], [-5273.3, -1723.8], [-5567.1, -1817.2], [-5835.3, -2043.9], [-5569.8, -2212.6], [-6178.5, -2611.0], [-6643.6, -2528.4], [-6823.0, -2417.0], [-6863.2, -2146.8], [-6793.6, -1783.8], [-6745.1, -1549.4], [-6711.1, -1253.0], [-6701.7, -1003.2], [-6458.4, -1018.5], [-6527.2, -773.3], [-6718.0, -650.8], [-7050.5, -826.6], [-7271.2, -1048.7], [-7600.9, -1169.3], [-7655.7, -1723.2], [-7764.8, -2048.4], [-8066.8, -2357.5], [-8448.9, -2460.9], [-8873.3, -2439.1], [-9784.3, -2756.3], [-10475.2, -2804.0], [-10960.3, -2864.0], [-10180.8, -3187.1], [-9773.6, -3005.7], [-9987.6, -3349.6], [-8722.8, -3437.1], [-7870.0, -3341.9], [-7795.7, -3750.7], [-7614.2, -4103.3], [-7261.8, -3626.8], [-6827.8, -3431.9], [-6487.4, -3528.9], [-6430.9, -3904.7], [-5617.6, -3415.4], [-5126.3, -3788.1], [-4604.1, -3591.1], [-4387.8, -3827.7], [-3505.6, -3894.0], [-2973.4, -3726.3], [-2354.3, -3743.9], [-1940.4, -3934.5], [-1494.9, -3913.0], [-1203.4, -4254.6], [-857.6, -3817.2], [-518.1, -4187.9], [-56.5, -4171.5], [309.3, -4940.1], [897.7, -4636.0], [1309.5, -4684.8], [1699.5, -4399.0], [2047.8, -4427.5], [2630.4, -4144.2], [2949.9, -4414.8], [3052.2, -4774.8], [3597.8, -5064.7], [3624.5, -5972.5], [3565.9, -6375.9], [4028.3, -6376.3], [4273.1, -6175.6], [4612.5, -6560.7], [5242.7, -6293.2], [5605.2, -6451.5], [5589.5, -6861.0], [6082.3, -7223.0], [5928.1, -8015.6], [6075.8, -8309.3], [6660.1, -8305.7], [7322.2, -8156.0], [7797.6, -8037.4], [8083.5, -8216.3], [8688.1, -8143.2], [9237.8, -8358.8], [9312.3, -8830.9], [9142.1, -9309.1], [9243.5, -9703.1], [9510.4, -9984.7]];
      const nzRaw = [...NORTE_PTS_RETA, [12000, -12000], [-13000, -12000], [-13000, 300]];
      const NORTE_PTS = deformaLinha(NORTE_PTS_RETA, { seed: 23, passo: 90, A: [170, 60, 14], L: [2600, 650, 170], dentro: (x, z) => emPoli(nzRaw, x, z) });                // a margem do outro lado também deixa de ser reta
      const nz = [...NORTE_PTS, [12000, -12000], [-13000, -12000], [-13000, 300]];                         // a terra fica ao norte da linha (a linha vai ao vértice e volta pelo outro lado)
      const shn = new Shape(); shn.moveTo(nz[0][0], -nz[0][1]); nz.slice(1).forEach(([x, z]) => shn.lineTo(x, -z)); shn.closePath();
      const fgn = new ExtrudeGeometry(shn, { depth: MID, bevelEnabled: false, curveSegments: 1 }); fgn.rotateX(-Math.PI / 2);
      const terraN = new Mesh(fgn, [new MeshStandardMaterial({ map: topo, roughness: 1 }), new MeshStandardMaterial({ map: latTx, roughness: 1 })]); terraN.position.y = chao - .02 - MID; terraN.material[1].visible = false; g.add(terraN);
      NORTE_POLI.push(...nz); NORTE_RIM.push(...NORTE_PTS); }
    /* parede invisível ao longo do lábio (só onde o Pit pode chegar): ele não cai no vão */
    const rc = densa(BORDA_PTS, 5);
    rc.forEach((pt, i) => { if(pt[0] < -1500 || pt[0] > 3400 || pt[1] < -1000 || pt[1] > 3800) return; const nx = rc[Math.min(rc.length - 1, i + 1)], dx = nx[0] - pt[0], dz = nx[1] - pt[1], l = Math.hypot(dx, dz) || 1, ox = dz / l * 2.2, oz = -dx / l * 2.2;
      colisores.push({ x0: Math.min(pt[0], nx[0]) + ox - 2.4, x1: Math.max(pt[0], nx[0]) + ox + 2.4, z0: Math.min(pt[1], nx[1]) + oz - 2.4, z1: Math.max(pt[1], nx[1]) + oz + 2.4 }); }); }
  const fundo = new Mesh(new PlaneGeometry(16000, 16000), new MeshStandardMaterial({ map: mata, color: 0x9ab89a, roughness: 1 })); fundo.rotation.x = -Math.PI / 2; fundo.position.set(2000, chao - 2650 - 4, 1500); g.add(fundo);
  /* ---- vale do cânion: paredões verticais até a metade; abaixo, encosta diagonal coberta de mata até o rio Tigre Preto, no fundo (KML "rio tigre preto") ---- */
  const FUNDO_H = 2650;
  const TIGRE = PARQUE_REAL.tigrePreto.map(q => q.slice());                                                                    // 0-3: o rio corre sobre o planalto norte; cruza o lábio entre 3 e 4 (cascata do Tigre Preto); 4-8: desce a encosta e faz a curva; 8-…: segue a coluna do cânion
  const FORT = PARQUE_REAL.arroioFortaleza.map(q => q.slice());                                                                  // arroio Fortaleza: 0-2 sobre o planalto, cai no vértice principal e segue até a confluência com o Tigre Preto
  const AXIS = TIGRE.slice(8), AXIS_W = [...FORT.slice(3), TIGRE[8]], axDens = [...densa(AXIS, 25), ...densa(AXIS_W, 25)], rimDens = [...densa(BORDA_PTS, 25), ...densa(NORTE_RIM, 25)];
  const minDist = (arr, x, z) => { let d = 1e18; for(let i = 0; i < arr.length; i++){ const dx = arr[i][0] - x, dz = arr[i][1] - z, q = dx * dx + dz * dz; if(q < d) d = q; } return Math.sqrt(d); };
  const noVazio = (x, z) => !emPoli(terraPoli, x, z) && !emPoli(NORTE_POLI, x, z);
  const Hvale = (x, z) => { if(!noVazio(x, z)) return -MID; const dw = minDist(rimDens, x, z), dr = minDist(axDens, x, z), t = dw / (dw + dr + .001), sv = t * t * (3 - 2 * t) * .35 + t * .65; return -(MID + (FUNDO_H - MID) * sv); };
  /* paredões naturais (camadas de basalto, saliências, balanços, tálus, liquens e umidade): malha única gerada no carregamento */
  const mapaParede = texCamadas(); mapaParede.wrapS = RepeatWrapping; const rochaM = materialRocha(mapaParede);
  { const p1 = criaParedao(BORDA_PTS, { dentro: (x, z) => emPoli(terraPoli, x, z), Hvale, chao, MID, seed: 3, material: rochaM.mat }); g.add(p1.mesh);
    const p2 = criaParedao(NORTE_RIM, { dentro: (x, z) => emPoli(NORTE_POLI, x, z), Hvale, chao, MID, seed: 7, material: rochaM.mat, escalaH: 2.2, talus: .35 }); g.add(p2.mesh); }
  let fitaRio = null;
  const tigreTex = texAguaCorrente(); tigreTex.wrapS = tigreTex.wrapT = RepeatWrapping;
  { const mataV = texMata(); mataV.wrapS = mataV.wrapT = RepeatWrapping; mataV.repeat.set(1, 1);
    const matV = new MeshStandardMaterial({ map: mataV, color: 0xcfe0c4, roughness: 1 });
    const malha = (x0, x1, z0, z1, cel) => { const nx = Math.ceil((x1 - x0) / cel), nz = Math.ceil((z1 - z0) / cel), pos = [], uv = [], terra_ = [], idx = [];
      for(let j = 0; j <= nz; j++) for(let i = 0; i <= nx; i++){ const x = x0 + i * cel, z = z0 + j * cel; terra_.push(!noVazio(x, z)); pos.push(x, chao + Hvale(x, z), z); uv.push(x / 110, z / 110); }
      for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){ const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if(terra_[a] && terra_[b] && terra_[c] && terra_[d]) continue; idx.push(a, c, b, b, c, d); }
      const ge = new BufferGeometry(); ge.setAttribute("position", new Float32BufferAttribute(pos, 3)); ge.setAttribute("uv", new Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals(); g.add(new Mesh(ge, matV)); };
    malha(-3600, 4600, -5300, 2100, 100); malha(-9000, -6000, -3500, -200, 70); malha(-12600, -9000, -4200, -1900, 80);                          // janela principal em volta do recebimento e do lançamento + trecho da cascata do Tigre Preto
    /* faixa de água (o rio) apoiada numa função de altura */
    const fita = (pts, larg, yFn) => { const cv = new CatmullRomCurve3(pts.map(q => new Vector3(q[0], 0, q[1])), false, "centripetal"), d = cv.getSpacedPoints(Math.max(2, Math.round(cv.getLength() / 30))).map(v => [v.x, v.z]), pos = [], uv = [], idx = []; let ac = 0;
      d.forEach((pt, i) => { const a = d[Math.max(0, i - 1)], b = d[Math.min(d.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; if(i) ac += Math.hypot(pt[0] - d[i - 1][0], pt[1] - d[i - 1][1]);
        const y = yFn(pt[0], pt[1]); pos.push(pt[0] - tz * larg / 2, y, pt[1] + tx * larg / 2, pt[0] + tz * larg / 2, y, pt[1] - tx * larg / 2); uv.push(0, ac / 40, 1, ac / 40); if(i) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2); });
      const ge = new BufferGeometry(); ge.setAttribute("position", new Float32BufferAttribute(pos, 3)); ge.setAttribute("uv", new Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals();
      g.add(new Mesh(ge, new MeshBasicMaterial({ map: tigreTex, color: 0xb8d4dc, transparent: true, opacity: .92, side: DoubleSide, depthWrite: false }))); };
    /* cada rio: corre sobre o planalto, cruza o lábio numa cascata, desce a encosta e segue a coluna do cânion */
    const rio = (pts, iC, nEncosta, wTerra, wEnc, wFundo, wQueda, seed) => {
      const P3 = pts[iC], P4 = pts[iC + 1], pt = (t) => [P3[0] + (P4[0] - P3[0]) * t, P3[1] + (P4[1] - P3[1]) * t]; let lo = 0, hi = 1;
      for(let k = 0; k < 40; k++){ const mid = (lo + hi) / 2; if(emPoli(NORTE_POLI, ...pt(mid))) lo = mid; else hi = mid; }
      const PC = pt(hi), dl = Math.hypot(P4[0] - P3[0], P4[1] - P3[1]), nrm = [(P4[0] - P3[0]) / dl, (P4[1] - P3[1]) / dl];
      fita([...pts.slice(0, iC + 1), PC], wTerra, () => chao + .35);                                      // sobre o planalto
      fita([[PC[0] + nrm[0] * 3, PC[1] + nrm[1] * 3], ...pts.slice(iC + 1, iC + 1 + nEncosta)], wEnc, (x, z) => chao + Hvale(x, z) + .9);   // desce a encosta
      const q = criaQueda(wQueda, MID, seed); q.rotation.y = Math.atan2(nrm[0], nrm[1]); q.position.set(PC[0] + nrm[0] * 1.6, chao - MID / 2, PC[1] + nrm[1] * 1.6); g.add(q); q.userData.queda = MID; quedaMeshes.push(q);
      if(wQueda > 12){ const q2 = criaQueda(wQueda * .65, MID, seed + 2); q2.rotation.y = q.rotation.y; q2.position.set(PC[0] + nrm[0] * 2.4 - nrm[1] * 8, chao - MID / 2, PC[1] + nrm[1] * 2.4 + nrm[0] * 8); g.add(q2); q2.userData.queda = MID; quedaMeshes.push(q2); }
      const nb = new Mesh(new PlaneGeometry(60 + wQueda * 3, 60 + wQueda * 3), new MeshBasicMaterial({ map: texNeblinaQueda(), transparent: true, depthWrite: false, opacity: .75, side: DoubleSide })); nb.rotation.x = -Math.PI / 2; nb.position.set(PC[0] + nrm[0] * 24, chao - MID + 3, PC[1] + nrm[1] * 24); g.add(nb);
      return PC; };
    rio(TIGRE, 3, 5, 24, 30, 44, 22, 91);                                                               // rio Tigre Preto (cascata do Tigre Preto)
    fita(AXIS, 44, () => chao - FUNDO_H + .8);                                                          // ...e segue a coluna do cânion, no fundo
    rio(FORT, 2, 1, 14, 18, 24, 12, 77);                                                                 // arroio Fortaleza: menos água, cai no vértice principal
    fita(AXIS_W, 24, () => chao - FUNDO_H + .8);
    fita(PARQUE_REAL.arroioGravata, 9, () => chao - FUNDO_H + .8);                                      // arroio Gravatá do Noivo: continua no fundo do cânion, depois da cascata
    fitaRio = fita; }
  const nevoa = texNevoa(); nevoa.wrapS = nevoa.wrapT = RepeatWrapping; nevoa.repeat.set(8, 12);
  const nevoas = [[-180, .28], [-700, .8]].map(([dy, op]) => { const n = new Mesh(new PlaneGeometry(6000, 9000), new MeshBasicMaterial({ map: nevoa, color: 0xe4e8ea, transparent: true, depthWrite: false, opacity: op, fog: false })); n.rotation.x = -Math.PI / 2; n.position.set(1200, chao + dy, 0); n.userData.op = op; g.add(n); return n; });
  const COLINAS = [];
  /* pico de rocha do outro lado e colinas de capim dourado do nosso lado do cercado */
  { 
    const seco = new MeshStandardMaterial({ map: texCampoAlt(), color: 0xe4dca8, roughness: 1 });
    /* máscara de atenuação em volta do Recebimento: as elevações perto dele ficam 60 % mais baixas, caindo suavemente para 30 % a 900 u e a 0 % a 1500 u (vista do cânion aberta, sem editar monte por monte) */
    const sS = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const reducao = (x, z) => { const d = Math.hypot(x - 30, z - 18); return d <= 900 ? .6 - .3 * sS(d / 900) : .3 * (1 - sS((d - 900) / 700)); };
    COLINAS.push(...[[-60, -150, 190, 38, 70], [-230, 560, 140, 28, 50], [-330, 60, 150, 32, 55], [90, -260, 280, 60, 120], [-470, 830, 170, 40, 70], [150, -140, 150, 30, 55]].map(([x, z, rx, ry, rz]) => [x, z, rx, ry * (1 - reducao(x, z)), rz]));
    COLINAS.forEach(([x, z, rx, ry, rz]) => { const h = new Mesh(new SphereGeometry(1, 64, 28), seco); h.scale.set(rx, ry, rz); h.position.set(x, chao - ry * .25, z); g.add(h); }); }
  /* altura do relevo das colinas (a mesma superfície do desenho: elipsoide enterrado 25 %): vale para o Pit, a câmera, as trilhas, as árvores, os NPCs e os animais */
  const colinaAltura = (x, z) => { let h = 0; for(let i = 0; i < COLINAS.length; i++){ const [cx, cz, rx, ry, rz] = COLINAS[i], dx = (x - cx) / rx, dz = (z - cz) / rz, s2 = dx * dx + dz * dz; if(s2 < 1){ const v = ry * (Math.sqrt(1 - s2) - .25); if(v > h) h = v; } } return h; };

  /* ---- vale do lado do vão (desce e sobe antes da borda), riacho, cachoeira de 3 quedas (30 m · 60 m · 400 m), araucárias em capões ---- */
  const ARROIO = PARQUE_REAL.arroioGraxaim.map(q => q.slice());                                                  // arroio do Graxaim (KML)
  const LQ = 15;                                                                           // a queda fica onde o arroio chega ao lábio (x = BORDA)                                                                              // eixo e largura da queda (u): de frente para quem desce a tirolesa
  const TREC_AUX = () => PARQUE_REAL.trilhaRecebimento.slice(3).map(q => q.slice());
  const cruzamentos = []; [TM, TB, TREC_AUX()].forEach(L => { for(let i = 0; i < L.length - 1; i++){ const A = L[i], B = L[i + 1], Ln = Math.hypot(B[0] - A[0], B[1] - A[1]); for(let d = 0; d < Ln; d += 6){ const x = A[0] + (B[0] - A[0]) * d / Ln, z = A[1] + (B[1] - A[1]) * d / Ln; let md = 1e9; for(let k = 0; k < ARROIO.length - 1; k++){ const a0 = ARROIO[k], b0 = ARROIO[k + 1], dx = b0[0] - a0[0], dz = b0[1] - a0[1], l2 = dx * dx + dz * dz || 1; let u = ((x - a0[0]) * dx + (z - a0[1]) * dz) / l2; u = Math.max(0, Math.min(1, u)); md = Math.min(md, Math.hypot(x - a0[0] - dx * u, z - a0[1] - dz * u)); } if(md < 14) cruzamentos.push([x, z]); } } });
  const terr = criarTerreno({ g, chao, borda: BORDA, caminho: ARROIO, texCampo: texCampoAlt, texRocha: () => texRochaAzul([1, 1]), texAgua: texAguaCorrente, evitar: cruzamentos });
  terr.setExtra(colinaAltura);
  const ZQ = terr.zq;                                                                                  // a queda fica onde o arroio chega ao lábio (x = BORDA)
  const aguaTex = texAgua(); aguaTex.wrapS = aguaTex.wrapT = RepeatWrapping;
  const yLabio = chao + terr.fundoEm(1e9) + .35;                                                         // a água chega ao lábio do cânion nesta altura
  const XR = (() => { for(let i = 0; i < BORDA_PTS.length - 1; i++){ const a = BORDA_PTS[i], b = BORDA_PTS[i + 1]; if(a[0] > 450 && a[0] < 600 && (a[1] - ZQ) * (b[1] - ZQ) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (ZQ - a[1]) / (b[1] - a[1]); } return BORDA; })();   // x do lábio onde o arroio cai
  const QUEDAS = [{ x: XR + 1.5, y0: yLabio, y1: yLabio - m(30) }, { x: XR + 4.5, y0: yLabio - m(30), y1: yLabio - m(30) - m(60) }, { x: XR + 7.5, y0: yLabio - m(90), y1: chao - MID + 2 }];     // as três quedas descem coladas ao paredão, uma saliência atrás da outra
  rochaM.U.uCasc.value.set(XR, chao - 380, ZQ); rochaM.U.uCascR.value = 1100;                  // umidade e liquens extras perto da cascata
  /* o arroio Gravata do Noivo (KML) segue no fundo da cascata: desce a encosta e vai de encontro ao rio Tigre Preto */
  { const GRAV = [[559.1, 8.9], [813.5, -134.1], [986.2, -178.1], [1118.8, -223.7], [1235.9, -272.3], [1246.3, -454.0], [1237.5, -699.2], [1257.3, -940.8], [1148.5, -1186.6], [1168.8, -1365.8], [1276.1, -1468.4], [1232.9, -1631.1], [1251.7, -1929.9], [1276.9, -2121.2], [1308.1, -2374.5]]; fitaRio([[QUEDAS[2].x + 5, ZQ], ...GRAV], 22, (x, z) => chao + Hvale(x, z) + .9); }
  {
    /* quedas: lâminas finas de água em arco (saem do lábio e caem), com fios brancos que aceleram, bordas moles e a água se desfazendo em borrifo no fim; a 3ª queda tem dois fios (como na foto) */
    const FIOS = [[{ dz: 0, w: 15 }, { dz: -10, w: 6.5 }, { dz: 11, w: 5.5 }], [{ dz: 0, w: 13 }, { dz: -9, w: 7 }, { dz: 10, w: 5 }], [{ dz: -9, w: 10 }, { dz: 6, w: 9 }, { dz: -1, w: 5 }, { dz: 16, w: 4 }]];     // mais água: véus lado a lado, cada um com o seu ritmo
    QUEDAS.forEach((q, i) => { const alt = q.y0 - q.y1;
      FIOS[i].forEach((f, k) => { const w = criaQueda(f.w * 1.6, alt, i * 7 + k * 3 + 1); w.position.set(q.x + 1.2 + k * .35, (q.y0 + q.y1) / 2, ZQ + f.dz * 1.3); g.add(w); w.userData.queda = alt; quedaMeshes.push(w); });
      const nb = new Mesh(new PlaneGeometry(40 + i * 10, 40 + i * 10), new MeshBasicMaterial({ map: texNeblinaQueda(), transparent: true, depthWrite: false, opacity: .7 - i * .08, side: DoubleSide })); nb.rotation.x = -Math.PI / 2; nb.position.set(q.x + 12, q.y1 + 2, ZQ); g.add(nb); });
    /* floresta na base e nas encostas do cânion: copas esféricas (instâncias) */
    const NA = 2400, arv = new InstancedMesh(new SphereGeometry(1, 7, 5), new MeshStandardMaterial({ color: 0x2f6a35, roughness: 1 }), NA), dm = new Object3D(); const rd = rng(91); let ni = 0;
    const cores = [0x2a5f30, 0x3a7a3a, 0x1f4a26, 0x4c9145, 0x336b38];
    for(let i = 0; i < 4200 && ni < NA; i++){ const x = -3600 + rd() * 8200, z = -5300 + rd() * 7400; if(!noVazio(x, z)) continue; if(x < QUEDAS[2].x + 50 && Math.abs(z - ZQ) < 50) continue; const e = 14 + rd() * 20, yv = chao + Hvale(x, z) + e * .45;
      dm.position.set(x, yv, z); dm.scale.set(e, e * .9, e); dm.updateMatrix(); arv.setMatrixAt(ni, dm.matrix); arv.setColorAt(ni, new Color(cores[i % 5])); ni++; }
    arv.count = ni; g.add(arv); }
  /* capões de araucária: pequenos grupos unidos, fora da faixa da tirolesa (z de -40 a 12) e longe do cercado e do riacho */
  /* as árvores agora vivem só dentro das áreas de mata do KML (mundo/veg/arvores.js); os antigos capões fixos foram removidos */

  /* lançamento do outro lado: pórtico de 6 palanques com travessa + cabine de teto plano (visto de longe, na neblina) */
  { const L = grupo(g, PORT.lanca, chao, 0); const pr = mat(0x1d1b18, { roughness: .9 });
    [PORT.z7, ...PORT.zs].forEach(zc => coluna(L, 0, zc, 0, m(3.6), .8, pr, 10)); caixa(L, -.8, .8, m(3.6), m(3.6) + 1.2, -2, PORT.zs[0] + 2, pr);
  }
  const lancamento = { x: PORT.lanca + 6, y: chao + .35, zs: [33, 25.5, 18] };
  { const L2 = grupo(g, PORT.lanca, chao, 0); caixa(L2, .5, 43, 0, .35, -6, 52, mat(0x6b4a2a, { roughness: .9 }));
    [[43, -6], [43, 52]].forEach(([x, z]) => coluna(L2, x, z, .35, 3.4, .22, mat(0x2a1d14), 8)); barra(L2, [43, 3.2, -6], [43, 3.2, 52], .2, mat(0x2a1d14), 8); }
  /* cabos do vão até o lançamento: 7 cabos paralelos */
  /* (os trechos até o x = 0 estão em portico.js; aqui nada a acrescentar) */

  /* ---------------------------------------------------------------- plataforma, casinha, pórtico */
  const plat = criarPlataforma({ ag: g });
  const casa = criarCasinha({ ag: g });
  const port = criarPortico({ ag: g, cena });
  plat.guardas.forEach(gd => pecas.push({ id: gd.id, nome: gd.nome, obj: gd.obj, excluivel: true }));
  plat.colisores.forEach(k => { k.peca = k.peca || 'deck'; }); casa.colisores.forEach(k => { k.peca = 'casinha'; }); port.colisores.forEach(k => { k.peca = 'portico'; });
  colisores.push(...plat.colisores, ...casa.colisores, ...port.colisores);
  pecas.push({ id: 'deck', nome: 'Deck (plataforma de chegada)', obj: plat.grupo }, { id: 'casinha', nome: 'Casinha do recebimento', obj: casa.grupo }, { id: 'portico', nome: 'Pórtico com molas e cabos', obj: port.grupo }, { id: 'escada-aluminio', nome: 'Escada de alumínio (deck)', obj: plat.escAlu }, { id: 'escada-verde', nome: 'Escada verde de aço (casinha)', obj: plat.escVerde });
  hotspots.push(...plat.hotspots, ...casa.hotspots, ...port.hotspots);

  /* ---------------------------------------------------------------- cerca externa (croqui do usuário) ----------------------------------------------------------------
     contorno (x para o vão, z para a direita do mapa): trapézio da frente (borda do vão inclinada, esquerda mais alta) + retângulo de trás, mais largo para a esquerda,
     com um recorte FORA da cerca embaixo da casinha (porta E abre para ele). A própria casinha faz parte da linha: entra-se pelo deck (porta F) e sai-se pela porta E. */
  const mourao = mat(0x16130f, { roughness: .9 });
  const tela = texTela();
  const lado = (ax, az, bx, bz, vaos = []) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 7.4)), ux = (bx - ax) / L, uz = (bz - az) / L, ang = Math.atan2(-uz, ux);
    for(let i = 0; i <= n; i++){
      const x = ax + ux * L * i / n, z = az + uz * L * i / n;
      if(vaos.some(([a, b]) => { const t = i / n * L; return t > a && t < b; })) continue;
      coluna(g, x, z, chao, chao + m(1.4), .32, mourao, 8);
      if(i % 4 === 2){ const e = barra(g, [x, chao + m(1.15), z], [x - uz * 4.2, chao + .1, z + ux * 4.2], .2, mourao, 6); void e; }
    }
    const trechos = []; let cur = 0;
    [...vaos].sort((p, q) => p[0] - q[0]).forEach(([a, b]) => { trechos.push([cur, a]); cur = b; }); trechos.push([cur, L]);
    trechos.forEach(([a, b]) => {
      if(b - a < 1) return; const t = tela.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set((b - a) / 3.5, 1);
      const p = new Mesh(new PlaneGeometry(b - a, m(1.15)), new MeshBasicMaterial({ map: t, transparent: true, alphaTest: .3, side: DoubleSide, depthWrite: false }));
      const c = (a + b) / 2; p.position.set(ax + ux * c, chao + m(.65), az + uz * c); p.rotation.y = ang; g.add(p);
      const nk = Math.abs(ux) > .02 && Math.abs(uz) > .02 ? Math.ceil((b - a) / 4) : 1;                    // trecho inclinado: colisão em vários blocos
      for(let q = 0; q < nk; q++){ const s0 = a + (b - a) * q / nk, s1 = a + (b - a) * (q + 1) / nk, xa = ax + ux * s0, xb = ax + ux * s1, za = az + uz * s0, zb = az + uz * s1;
        colisores.push({ x0: Math.min(xa, xb) - .25, x1: Math.max(xa, xb) + .25, z0: Math.min(za, zb) - .25, z1: Math.max(za, zb) + .25 }); }
    });
  };
  /* contorno da área do recebimento (KML do usuário; deslocado 5 u em z para caber o deck): canto esquerdo do vão (mais alto), canto direito do vão, fundo-direita, fundo-esquerda; o recorte da casinha segue o croqui */
  const ZN = -4.5, NX0 = -24;
  const PC0 = [155.3, -7.5], PC1 = [124.2, 53.9], PB1 = [-88.9, 55.2], PB0 = [-93.9, -15.6], PN0 = [NX0, -16.1], PF0 = [CASA_X1, -12.5];
  const GD = [10, 17.4], GCX = [8, 17];                                                             // portão D (resgate simples): z, alinhado aos cabos 05 e 06; portão C (trilha): x, junto à escadinha do deck
  const emD = (z) => [PC0[0] + (PC1[0] - PC0[0]) * (z - PC0[1]) / (PC1[1] - PC0[1]), z];
  const emC = (x) => [x, PC1[1] + (PB1[1] - PC1[1]) * (x - PC1[0]) / (PB1[0] - PC1[0])];
  const GDA = emD(GD[0]), GDB = emD(GD[1]), GCA = emC(GCX[1]), GCB = emC(GCX[0]);
  lado(PC0[0], PC0[1], PC1[0], PC1[1], [[Math.hypot(GDA[0] - PC0[0], GDA[1] - PC0[1]), Math.hypot(GDB[0] - PC0[0], GDB[1] - PC0[1])]]);        // borda do vão, com o portão D
  lado(PC1[0], PC1[1], PB1[0], PB1[1], [[Math.hypot(GCA[0] - PC1[0], GCA[1] - PC1[1]), Math.hypot(GCB[0] - PC1[0], GCB[1] - PC1[1])]]);        // lado direito, com o portão C
  lado(PB1[0], PB1[1], PB0[0], PB0[1]);                                                              // fundo (atrás das ancoragens)
  lado(PB0[0], PB0[1], PN0[0], PN0[1]);                                                              // lado esquerdo de trás, mais largo
  lado(NX0, PN0[1], NX0, ZN);                                                                        // parede do recorte (fora da cerca)
  lado(PF0[0], PF0[1], PC0[0], PC0[1]);                                                              // lado esquerdo da frente: começa na quina da casinha
  /* cercado do lançamento (KML "área total"): norte, leste e sul; o lado do vão (oeste) é a borda do cânion */
  { const A = [[2043.2, -7.2], [2033.0, 38.0], [2086.3, 52.9], [2076.8, 33.5], [2072.9, 31.7], [2072.1, 22.2], [2094.1, 32.9], [2095.0, -4.2]];
    const seg = (i, j) => lado(A[i][0], A[i][1], A[j][0], A[j][1]);
    seg(1, 2); seg(7, 0); seg(6, 7); seg(5, 6); seg(4, 5); seg(3, 4); seg(2, 3); }
  /* limites do mundo aberto: a borda do cânion e as extremidades do campo (invisíveis) */
  colisores.push({ x0: -1300, x1: -1284, z0: -900, z1: 1320 }); colisores.push({ x0: -1300, x1: BORDA + 30, z0: -900, z1: -884 }); colisores.push({ x0: -1300, x1: BORDA + 30, z0: 1300, z1: 1316 });
  /* portões de abrir e fechar (madeira escura, tela e ripas), com interação; abrem para fora */
  const portas = [];
  const portao = (id, nome, A, B, fora, rotAbre, rotFecha) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, ang = Math.atan2(-uz, ux);
    const est = { k: 0, alvo: 0, sinal: (-uz * fora[0] + ux * fora[1]) > 0 ? 1 : -1 }, pg = grupo(g, A[0], 0, A[1]); pg.rotation.y = ang; pecas.push({ id, nome, obj: pg });
    const pm = mat(0x2a1d14, { roughness: .9 });
    coluna(pg, 0, 0, chao, chao + m(1.5), .4, pm, 8); coluna(pg, L, 0, chao, chao + m(1.5), .4, pm, 8);
    const folha = grupo(pg, 0, 0, 0);
    caixa(folha, .3, L - .3, chao + m(.2), chao + m(.34), -.12, .12, pm); caixa(folha, .3, L - .3, chao + m(1.0), chao + m(1.14), -.12, .12, pm); caixa(folha, .3, .5, chao + m(.2), chao + m(1.14), -.12, .12, pm); caixa(folha, L - .5, L - .3, chao + m(.2), chao + m(1.14), -.12, .12, pm);
    barra(folha, [.4, chao + m(.25), 0], [L - .4, chao + m(1.1), 0], .1, pm, 5); barra(folha, [.4, chao + m(1.1), 0], [L - .4, chao + m(.25), 0], .1, pm, 5);
    const tg = tela.clone(); tg.needsUpdate = true; tg.wrapS = tg.wrapT = RepeatWrapping; tg.repeat.set(L / 3.5, 1); const pt = new Mesh(new PlaneGeometry(L - .8, m(.8)), new MeshBasicMaterial({ map: tg, transparent: true, alphaTest: .3, side: DoubleSide, depthWrite: false })); pt.position.set(L / 2, chao + m(.67), 0); folha.add(pt);
    const latch = new Mesh(new BoxGeometry(.3, .5, .5), mat(0xb6bbbf, { metalness: .8, roughness: .3 })); latch.position.set(L - .3, chao + m(.7), 0); folha.add(latch);
    est.folha = folha; portas.push(est);
    const cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2; est.cx = cx; est.cz = cz;
    colisores.push({ x0: Math.min(A[0], B[0]) - .35, x1: Math.max(A[0], B[0]) + .35, z0: Math.min(A[1], B[1]) - .35, z1: Math.max(A[1], B[1]) + .35, ativo: () => est.k < .5, peca: id });
    hotspots.push({ id, x: cx - fora[0] * 2.6, z: cz - fora[1] * 2.6, r: 4.5, rotulo: () => (est.alvo ? rotFecha : rotAbre), acao: () => { est.alvo = est.alvo ? 0 : 1; } });
    return est;
  };
  portao("portao-resgate", "Portão D · resgate simples (rumo ao vão)", GDA, GDB, [0.85, 0.52], "Abrir o portão de resgate", "Fechar o portão de resgate");
  portao("portao-trilha", "Portão C · trilha (rumo à estrada)", GCA, GCB, [-0.07, 1], "Abrir o portão da trilha", "Fechar o portão da trilha");

  /* portão FECHADO com a placa TIROLESA: parte da cerca, ao lado direito da porta E da casinha (não é peça solta nem abre) */
  { const gx0 = NX0, gx1 = CASA_X0, px = (gx0 + gx1) / 2;
    const pg = grupo(g, 0, 0, ZN);
    [gx0, gx1].forEach(x => { coluna(pg, x, 0, chao, chao + m(1.5), .42, mourao, 8); });
    barra(pg, [gx0, chao + m(1.4), 0], [gx1, chao + m(1.4), 0], .3, mourao, 8);
    const folhaX = [[gx0 + .4, px - .3], [px + .3, gx1 - .4]];
    folhaX.forEach(([a, b]) => { caixa(pg, a, b, chao + m(.25), chao + m(.38), -.12, .12, mourao); caixa(pg, a, b, chao + m(1.05), chao + m(1.18), -.12, .12, mourao); caixa(pg, a, a + .2, chao + m(.25), chao + m(1.18), -.12, .12, mourao); caixa(pg, b - .2, b, chao + m(.25), chao + m(1.18), -.12, .12, mourao); barra(pg, [a, chao + m(.3), 0], [b, chao + m(1.12), 0], .1, mourao, 5); barra(pg, [a, chao + m(1.12), 0], [b, chao + m(.3), 0], .1, mourao, 5); });
    const pl = placaLegivel(texTirolesa(), 4.2, 3.1); pl.position.set(px, chao + m(.95), -.22); pl.rotation.y = Math.PI; pg.add(pl);    // lê-se de fora (lado -z)
    colisores.push({ x0: gx0 - .4, x1: gx1 + .4, z0: ZN - .35, z1: ZN + .35 });
    hotspots.push({ id: "placa-tirolesa", x: px, z: ZN - 3.4, r: 4.2, rotulo: () => "Ler a placa da tirolesa", acao: null, msg: "TIROLESA · Plataforma de chegada. Use sempre o equipamento de proteção, não ultrapasse a linha amarela, cuidado com o piso molhado e fume somente no fumódromo." });
  }
  /* brita no recorte, junto ao portão e à saída da casinha */
  { const b = new Mesh(new PlaneGeometry(CASA_X0 - NX0 - 1.2, 15), new MeshStandardMaterial({ map: texBrita(), roughness: 1 })); b.rotation.x = -Math.PI / 2; b.position.set((NX0 + CASA_X0) / 2, chao + .03, (ZN + PN0[1]) / 2); g.add(b); pecas.push({ id: 'brita', nome: 'Chão de brita (cinza)', obj: b, excluivel: true }); }
  /* trilha ondulada do portão C até o arroio (o resto, pelo cânion, vem depois) */
  /* (a trilha que sai do portão C entra no circuito da trilha do recebimento, mais abaixo) */

  /* ---------------------------------------------------------------- estacionamento e trilhas (Google Earth + street view)
     o estacionamento fica a sudoeste (≈ 440 m do deck): pátio de cascalho, talude de pedra atrás, carros e ambulância na fila do talude, contêiner cinza, banheiro azul-esverdeado escondido atrás da moita,
     área de piquenique com mesas de madeira dentro de um guarda-corpo baixo, três placas azuis no início da trilha do mirante, cones e balizas listradas. A estrada de terra vermelha sai de lá. */
  const PK = { x: -500, z: 500 }, PKR = .771, PKc = Math.cos(PKR), PKs = Math.sin(PKR);                // pátio longo na diagonal (KML do estacionamento); o grupo gira para acompanhar o eixo
  const PKW = (lx, lz) => [PK.x + lx * PKc + lz * PKs, PK.z - lx * PKs + lz * PKc];
  const ESTAC = { PK, PKR, PKW, poli: null, lixeiras: [[2, 24], [4, 24], [6, 24]], carros: [[-38, -55], [-26, -55], [-14, -55], [-2, -55], [-8, 4], [14, 16], [-44, 12]], mesas: [[21, -20], [30, -20], [39, -20], [25.5, -7.5], [34, -7.5]], lanchonete: [-22, 8], banheiro: [8, -37], ambulancia: [-78, -34] };                      // local → mundo
  { const P = grupo(g, PK.x, 0, PK.z); P.rotation.y = PKR; pecas.push({ id: "estacionamento", nome: "Estacionamento (cascalho, carros, banheiro, piquenique)", obj: P });
    const col = (x0, x1, z0, z1) => { const q = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([a, b]) => PKW(a, b)); colisores.push({ x0: Math.min(...q.map(t => t[0])), x1: Math.max(...q.map(t => t[0])), z0: Math.min(...q.map(t => t[1])), z1: Math.max(...q.map(t => t[1])), peca: "estacionamento" }); };
    { const tb = texBrita(); tb.repeat.set(1 / 4, 1 / 4); const sh = new Shape(); const E = ESTAC.poli = [[-781.1, 755.8], [-738.3, 808.3], [-692.7, 792.1], [-711.8, 729.6], [-662.7, 669.7], [-556.5, 613.2], [-499.6, 563.6], [-423.3, 511.2], [-376.9, 479.5], [-381.7, 414.6], [-453.6, 444.8], [-476.5, 391.1], [-555.7, 436.5], [-607.9, 479.4], [-660.5, 587.6], [-737.8, 692.2], [-789.7, 715.7]]; sh.moveTo(E[0][0], -E[0][1]); E.slice(1).forEach(([x, z]) => sh.lineTo(x, -z)); sh.closePath();
      const gg = new ShapeGeometry(sh); gg.rotateX(-Math.PI / 2); const br = new Mesh(gg, new MeshStandardMaterial({ map: tb, roughness: 1 })); br.position.y = chao + .04; g.add(br); }
    const rocha = mat(0x7a6048, { roughness: 1 }), rocha2 = mat(0x9a9285, { roughness: 1 });
    const talude = new Mesh(new SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), rocha); talude.scale.set(62, 11, 9); talude.position.set(-6, chao, -68); P.add(talude);
    [[-30, -63, 3.4], [8, -62, 2.6], [30, -65, 4.1], [-52, -61, 2.2]].forEach(([x, z, r]) => { const pd = new Mesh(new SphereGeometry(r, 7, 5), rocha2); pd.scale.y = .6; pd.position.set(x, chao + r * .3, z); P.add(pd); });
    col(-56, 50, -76, -62);
    const roda = mat(0x151618, { roughness: .8 }), vidro = mat(0x2a3440, { roughness: .2, metalness: .3 });
    const carro = (x, z, rot, cor, comp = m(4.2)) => { const c = grupo(P, x, chao, z); c.rotation.y = rot;
      caixa(c, -comp / 2, comp / 2, m(.3), m(.9), -m(.8), m(.8), mat(cor, { roughness: .35, metalness: .45 })); caixa(c, -comp * .28, comp * .2, m(.9), m(1.45), -m(.72), m(.72), vidro);
      [[-.32, -.8], [-.32, .8], [.32, -.8], [.32, .8]].forEach(([fx, fz]) => { const w = new Mesh(new CylinderGeometry(m(.32), m(.32), m(.22), 12), roda); w.rotation.x = Math.PI / 2; w.position.set(fx * comp, m(.32), fz * m(.8)); c.add(w); });
      const r = Math.hypot(comp / 2, m(.8)); col(x - r * .75, x + r * .75, z - r * .75, z + r * .75); return c; };
    [[-38, -55, 0x2c2e30], [-26, -55, 0x8a8d86], [-14, -55, 0xe9e9e6], [-2, -55, 0x2a2d28]].forEach(([x, z, c]) => carro(x, z, Math.PI / 2 + .04, c));
    carro(-8, 4, .5, 0xa9adb0); carro(14, 16, -2.55, 0xc3c7ca); carro(-44, 12, 1.2, 0x8c8f93);
    /* a ambulância agora é um veículo de verdade (mundo/resgate/ambulancia.js): estaciona aqui, leva a vítima e sai pela estrada */
    { const c = grupo(P, 24, chao, -63); caixa(c, -m(3.4), m(3.4), 0, m(2.7), -m(1.3), m(1.3), mat(0x9aa0a4, { roughness: .6, metalness: .2 })); caixa(c, -m(3.45), m(3.45), m(2.7), m(2.8), -m(1.35), m(1.35), mat(0x6c7176));
      for(let i = 0; i < 4; i++) caixa(c, -m(2.8) + i * m(.4), -m(2.8) + i * m(.4) + .12, m(1.1), m(2.1), m(1.3), m(1.34), mat(0x62676b)); col(10, 38, -68, -57); }
    { const b = grupo(P, 8, chao, -47); caixa(b, -m(2.6), m(2.6), 0, m(2.9), -m(1.7), m(1.7), mat(0x2f8f8a, { roughness: .6 })); caixa(b, -m(2.8), m(2.8), m(2.9), m(3.15), -m(1.9), m(1.9), mat(0xb9c9d6, { roughness: .5 })); caixa(b, -m(.5), m(.5), 0, m(2.0), m(1.7), m(1.74), mat(0x1b3f3d));
      const bush = mat(0x3a5a2a, { roughness: 1 }), bush2 = mat(0x5a6a33, { roughness: 1 }); const rd = rng(33);
      for(let i = 0; i < 14; i++){ const r = 3 + rd() * 3.4, q = new Mesh(new SphereGeometry(r, 8, 6), i % 3 ? bush : bush2); q.scale.y = .8; q.position.set(-6 + rd() * 30 - 24, r * .55, 6 + rd() * 6); b.add(q); }
      { const pst = mat(0x2a1d14, { roughness: .9 }); coluna(b, -13, 4.5, 0, m(2.3), .22, pst, 8); const pb = placaLegivel(texPlacaHD(300, 120, (c, w, h) => { c.fillStyle = "#1e9aa0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e9f6f8"; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#f3fbfc"; c.font = "bold 34px Arial"; c.textAlign = "center"; c.fillText("BANHEIROS", w / 2 - 14, 62); c.font = "bold 40px Arial"; c.fillText("→", w - 42, 66); c.font = "bold 14px Arial"; c.fillText("atrás da moita · ao lado do contêiner", w / 2, 98); }), m(1.2), m(.5), { espessura: .12 }); pb.position.set(-13, m(2.0), 4.5); b.add(pb); }
      col(0, 16, -52, -42); hotspots.push({ id: "banheiro", x: PKW(8, -37)[0], z: PKW(8, -37)[1], r: 8, rotulo: () => "Ver o banheiro", acao: null, msg: "Banheiro do estacionamento: fica nos fundos, junto ao talude e ao contêiner, escondido atrás da moita. A ambulância de apoio fica do outro lado do pátio." }); }
    /* lanchonete de contêineres azul-turquesa (street view): 3 contêineres com frente de vidro, terraço de piso vermelho, guarda-sóis, mesas de pinus e três lixeiras verdes */
    { const L = grupo(P, -22, chao, 26), tq = mat(0x1e9aa0, { roughness: .55, metalness: .15 }), tqEs = mat(0x167f86, { roughness: .6 }), vd = new MeshStandardMaterial({ color: 0xbfe0e2, transparent: true, opacity: .35, roughness: .1 }), mad = mat(0xc9a36b, { roughness: .9 });
      const cw = m(12), ch = m(2.6), cd = m(2.4);
      caixa(L, -cw * 1.1, cw * .5 - 2, 0, ch, 0, cd, tq);                                    // corpo longo (2 contêineres)
      caixa(L, cw * .5, cw * 1.1, 0, ch, 0, cd, tqEs);                                       // contêiner da direita (porta aberta)
      caixa(L, -cw * 1.1, -cw * .78, 0, ch, -cd, 0, tq);                                     // contêiner de trás (formando o L)
      [[-cw * .75, -cw * .3], [cw * .02, cw * .4]].forEach(([x0, x1]) => caixa(L, x0, x1, m(.5), m(2.2), -.12, .12, vd));       // frentes de vidro
      const terraco = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#b5624a"; c.fillRect(0, 0, w, h); c.fillStyle = "#a4543e"; for(let i = 0; i < 8; i++){ c.fillRect(0, i * 8, w, 1); c.fillRect((i % 2) * 8 + i * 16 % 64, 0, 1, h); } }, { repeat: [14, 5] });
      const piso = new Mesh(new PlaneGeometry(cw * 1.7, m(6)), new MeshStandardMaterial({ map: terraco, roughness: .9 })); piso.rotation.x = -Math.PI / 2; piso.position.set(-cw * .15, .08, -m(3.2)); L.add(piso);
      [[-cw * .55, -m(3.2)], [cw * .3, -m(3.4)]].forEach(([x, z]) => { coluna(L, x, z, 0, m(2.5), .08, mat(0x777777), 6); const gs = new Mesh(new ConeGeometry(m(1.5), m(.5), 12), mat(0xefe7d4, { roughness: .8 })); gs.position.set(x, m(2.7), z); L.add(gs); });
      [[-cw * .6, -m(2.6)], [-cw * .1, -m(3.8)], [cw * .3, -m(2.8)]].forEach(([x, z]) => { const t = grupo(L, x, 0, z); caixa(t, -m(.9), m(.9), m(.72), m(.78), -m(.4), m(.4), mad); [-1, 1].forEach(sz => caixa(t, -m(.85), m(.85), m(.42), m(.47), sz * m(.65) - m(.1), sz * m(.65) + m(.1), mad)); });
      [0, 1, 2].forEach(i => coluna(L, cw * .62 + i * m(.7), -m(.7), 0, m(.9), .45, mat(0x2f7a45, { roughness: .8 }), 10));
      col(-22 - cw * 1.1, -22 + cw * 1.1, 26 - cd, 26 + cd);
      hotspots.push({ id: "lanchonete", x: PKW(-22, 12)[0], z: PKW(-22, 12)[1], r: 9, rotulo: () => "Ver a lanchonete", acao: null, msg: "Lanchonete de contêineres azul-turquesa, com terraço de piso vermelho, guarda-sóis e mesas de pinus, perto do início da trilha do mirante." }); }
    /* piquenique: 5 mesas de madeira com bancos dentro de um guarda-corpo baixo (duas travessas) */
    { const pq = grupo(P, 30, chao, -12), pino = mat(0xc9a36b, { roughness: .9 }), esc = mat(0x4a3526, { roughness: .9 });
      for(let i = 0; i < 5; i++){ const x = -9 + (i % 3) * 8.5, z = i < 3 ? -8 : 4.5; const t = grupo(pq, x, 0, z); t.rotation.y = i === 3 ? .15 : -.1; caixa(t, -m(.95), m(.95), m(.72), m(.78), -m(.42), m(.42), pino);
        [-1, 1].forEach(sx => caixa(t, sx * m(.7) - .12, sx * m(.7) + .12, 0, m(.72), -m(.34), m(.34), pino)); [-1, 1].forEach(sz => caixa(t, -m(.85), m(.85), m(.42), m(.47), sz * m(.7) - m(.12), sz * m(.7) + m(.12), pino)); }
      const trilho = (a, b) => { const Lg = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Lg / 8)); for(let i = 0; i <= n; i++) coluna(pq, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, 0, m(1.0), .22, esc, 8); [.6, .9].forEach(hh => barra(pq, [a[0], m(hh), a[1]], [b[0], m(hh), b[1]], .12, esc, 6)); };
      trilho([-14, -14], [16, -14]); trilho([16, -14], [16, 12]); trilho([-14, 12], [16, 12]);
      col(14, 46, -27, -25.5); }
    /* três placas azuis no início da trilha, cones e balizas */
    { const pl = grupo(P, 66, chao, 8); pl.rotation.y = -.6; const az = mat(0x1d7d92, { roughness: .6 }), pt = mat(0x2a2a2a, { roughness: .9 });
      const TXT = [["TRILHA DO MIRANTE", "Mirante do Fortaleza · 1,4 km"], ["TRILHA DA BORDA", "Paralela ao cânion · travessia do arroio"], ["CASCATA GRAVATA DO NOIVO", "Trilha à direita · cerca de 250 m"]];
      for(let i = 0; i < 3; i++){ caixa(pl, i * m(1.35), i * m(1.35) + m(1.25), m(.9), m(1.9), -.12, .12, az);
        const tx = texPlacaHD(300, 240, (c, w, h) => { c.fillStyle = "#1d7d92"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e9f6f8"; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = "#f3fbfc"; c.textAlign = "center";
          const palavras = TXT[i][0].split(" "), meio = Math.ceil(palavras.length / 2), l1 = palavras.slice(0, meio).join(" "), l2 = palavras.slice(meio).join(" ");
          c.font = "bold 34px Arial"; c.fillText(l1, w / 2, 84); if(l2) c.fillText(l2, w / 2, 126); c.fillStyle = "#cfeaf0"; c.font = "bold 17px Arial";
          const sub = TXT[i][1], cort = sub.length > 31 ? sub.lastIndexOf(" ", 30) : -1; if(cort > 0){ c.fillText(sub.slice(0, cort), w / 2, 176); c.fillText(sub.slice(cort + 1), w / 2, 200); } else c.fillText(sub, w / 2, 188); });
        const t = placaLegivel(tx, m(1.25), m(1.0), { espessura: .24 }); t.position.set(i * m(1.35) + m(.625), m(1.4), 0); pl.add(t); } [0, 1.35 * 3 - .1].forEach(d => coluna(pl, d * 2.94, 0, 0, m(2.0), .15, pt, 6));
      hotspots.push({ id: "placas-trilha", x: PKW(62, 6)[0], z: PKW(62, 6)[1], r: 7, rotulo: () => "Ler as placas da trilha", acao: null, msg: "Início da TRILHA DO MIRANTE: sai do estacionamento (estrada de terra), segue pela borda do cânion e chega ao mirante do Fortaleza, onde fica o lançamento, ≈ 55 m acima daqui. Cerca de 1,4 km." }); }
    for(let i = 0; i < 5; i++){ const c = new Mesh(new ConeGeometry(.6, 2.0, 10), mat(0xf0661c, { roughness: .6 })); c.position.set(52 + (i % 3) * 3 - 3, chao + 1, -2 + Math.floor(i / 3) * 5 + i); P.add(c); const f = new Mesh(new CylinderGeometry(.38, .46, .35, 10), mat(0xf2f2f0)); f.position.set(c.position.x, chao + 1.1, c.position.z); P.add(f); }
    [[-20, -8], [-4, -4], [40, 22]].forEach(([x, z]) => coluna(P, x, z, chao, chao + m(1.0), .18, mat(0xe6c21a, { roughness: .6 }), 8));
  }
  hotspots.forEach(h => { if(h.id === "banheiro" || h.id === "placas-trilha") h.peca = "estacionamento"; });
  const TERRA = 0xa8603f;                                                                                    // estrada de terra vermelha
  /* estrada do estacionamento até o cercado; dali a trilha da borda (paralela ao lábio do vão) vai ao lançamento; e uma trilha contorna o cercado por trás da casinha rumo à cascata */
  const ESTRADA = TM.slice(0, 9);                                                                          // trecho de estrada (do estacionamento até onde a trilha encosta na borda)
  /* trilha que passa pelo recebimento (KML, ajustada para não atravessar a cerca): do estacionamento pela trilha da borda, entra à direita, passa por trás da casinha, segue até a travessia do arroio, volta pela trilha de resgate (portão D), contorna a cerca e volta à estrada pela trilha do portão C */
  const TREC = PARQUE_REAL.trilhaRecebimento.map(q => q.slice());
  const TRD = [[GDA[0] + 5, 13.7], [GDA[0] + 18, 25], [147.6, 38.2]], TRC = [[(GCA[0] + GCB[0]) / 2, (GCA[1] + GCB[1]) / 2 + 2], [18, 62], [32.6, 67.8]];
  [ESTRADA, TM, TB, TREC].forEach(L => terr.aplana(L, 7));                                         // a trilha vira um corte plano no terreno do vale (borda suave)
  terr.trilha(ESTRADA, 7, TERRA);
  const TMD = []; const TODAS = () => [TM, TB, TREC].forEach(L => { for(let i = 0; i < L.length - 1; i++){ const a = L[i], b = L[i + 1], Ln = Math.hypot(b[0] - a[0], b[1] - a[1]); for(let d = 0; d < Ln; d += 8) TMD.push([a[0] + (b[0] - a[0]) * d / Ln, a[1] + (b[1] - a[1]) * d / Ln]); } });
  /* ponte de madeira (no lugar do boeiro real) onde a estrada cruza o arroio do Graxaim */
  /* acha onde uma trilha (lista de pontos) cruza o arroio: ponto da trilha mais perto do caminho da água e direção do trecho */
  const cruza = (lista) => { let best = null; for(let i = 0; i < lista.length - 1; i++){ const A = lista[i], B = lista[i + 1], Ln = Math.hypot(B[0] - A[0], B[1] - A[1]); for(let d = 0; d <= Ln; d += 2){ const x = A[0] + (B[0] - A[0]) * d / Ln, z = A[1] + (B[1] - A[1]) * d / Ln;
      terr.caminho.forEach(q => { const dd = Math.hypot(q[0] - x, q[1] - z); if(!best || dd < best.d) best = { d: dd, x: q[0], z: q[1], ang: Math.atan2(B[1] - A[1], B[0] - A[0]) }; }); } } return best; };
  const PONTE = (() => { const c = cruza(ESTRADA), L = 26, W = 8.4, y = chao + terr.base(c.x) + .4, madeiraP = mat(0x6a4a30, { roughness: .9 }), esc = mat(0x2a1d14, { roughness: .9 });
    const pt = grupo(g, c.x, 0, c.z); pt.rotation.y = -c.ang; pecas.push({ id: "ponte", nome: "Ponte da estrada (arroio do Graxaim)", obj: pt });
    caixa(pt, -L / 2, L / 2, y - .5, y, -W / 2, W / 2, madeiraP);
    [-1, 1].forEach(sx => { [-L / 2 + 2, L / 2 - 2].forEach(dx => coluna(pt, dx, sx * (W / 2 - .6), chao - 12, y, .45, esc, 8)); });
    [-1, 1].forEach(sz => { guardaCorpo(pt, [-L / 2, sz * W / 2], [L / 2, sz * W / 2], { y0: y }); });
    return { xc: c.x, zc: c.z, ang: c.ang, L, W, y }; })();
  TODAS();
  { /* moitas de capim e arbustos baixos espalhados nos campos (fora do cercado, do estacionamento e da estrada) */
    const rd = rng(88), N = 520, mo = new InstancedMesh(new SphereGeometry(1, 6, 4), new MeshStandardMaterial({ roughness: 1 }), N), dm = new Object3D(); let n = 0;
    const cores = [0x4d5a2c, 0x6a5238, 0x5b6a33, 0x7a4f3a, 0x3f4f2a];
    for(let i = 0; i < 4000 && n < N; i++){ const x = -1250 + rd() * 1520, z = -360 + rd() * 1200;
      if(x > AREA.x0 - 14 && x < AREA.x1 + 14 && z > AREA.z0 - 24 && z < AREA.z1 + 14) continue; if(Math.hypot(x - PK.x, z - PK.z) < 90) continue; if(x > TERR.vx0 - 4 && x < BORDA + 4) continue;
      if(TMD.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < 10)) continue; if(Math.abs(z + 66) < 6 && x > -190 && x < 320) continue;
      const e = 1.3 + rd() * 2.6; dm.position.set(x, chao + e * .3, z); dm.scale.set(e, e * .55, e); dm.rotation.y = rd() * 6; dm.updateMatrix(); mo.setMatrixAt(n, dm.matrix); mo.setColorAt(n, new Color(cores[n % 5])); n++; }
    mo.count = n; g.add(mo); }
  { /* lajes de pedra soltas no leito da estrada e balizas de madeira da trilha (street view do início da trilha do mirante) */
    const rd = rng(61), N = 150, lajes = new InstancedMesh(new BoxGeometry(1, .16, 1), new MeshStandardMaterial({ color: 0x8f8c87, roughness: 1 }), N), dm = new Object3D(); let n = 0;
    const pts = []; for(let i = 0; i < ESTRADA.length - 1; i++){ const a = ESTRADA[i], b = ESTRADA[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for(let d = 0; d < L; d += 9) pts.push([a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L, (b[0] - a[0]) / L, (b[1] - a[1]) / L]); }
    for(let i = 0; i < N; i++){ const q = pts[Math.floor(rd() * pts.length)], lat = (rd() - .5) * 5; const x = q[0] - q[3] * lat, z = q[1] + q[2] * lat; if(x > TERR.vx0 - 6) continue;
      dm.position.set(x, chao + .22, z); dm.rotation.y = rd() * 3; dm.scale.set(1.6 + rd() * 3.4, 1, 1.1 + rd() * 2.2); dm.updateMatrix(); lajes.setMatrixAt(n++, dm.matrix); }
    lajes.count = n; g.add(lajes);
    for(let i = 4; i < pts.length; i += 14){ const q = pts[i], x = q[0] + q[3] * 5.2, z = q[1] - q[2] * 5.2; if(x > TERR.vx0 - 6) break; coluna(g, x, z, chao, chao + 3.2, .12, mat(0x6a4a30, { roughness: .9 }), 6); coluna(g, x, z, chao + 2.7, chao + 3.2, .13, mat(0xf0f0ee, { roughness: .7 }), 6); } }
  terr.trilha(TM.slice(8), 5, 0xb89468);                                                                  // trilha do mirante pela borda até o lançamento
  terr.trilha(TB, 4.5, 0xb89468); terr.trilha(TREC, 4.5, 0xb89468); terr.trilha(TRD, 4, 0xb89468); terr.trilha(TRC, 4, 0xb89468);
  { /* travessia de pedras: onde a trilha da borda cruza o arroio */
    const best = cruza(TB), dx = Math.cos(best.ang), dz = Math.sin(best.ang), pedra = new MeshStandardMaterial({ map: texRochaAzul([1, 1]), roughness: 1 });
    for(let k = -3; k <= 3; k++){ const x = best.x + dx * k * 2.5, z = best.z + dz * k * 2.5, c = new Mesh(new CylinderGeometry(1.1 + (k & 1) * .2, 1.3, .7, 8), pedra); c.position.set(x, chao + terr.altura(x, z) + .9, z); g.add(c); } }

  /* ---------------------------------------------------------------- para-raios (I e J), estação meteorológica (K), fumódromo (H) */
  const galv = mat(0xb6bbbf, { metalness: .8, roughness: .35 }), fioM = mat(0x8e9296, { metalness: .6, roughness: .5 });
  const mastro = (x, z) => {
    const H = m(8), c = grupo(g, x, 0, z); pecas.push({ id: 'para-raio-' + (pecas.filter(p => p.id.startsWith('para-raio')).length + 1), nome: 'Para-raio ' + (pecas.filter(p => p.id.startsWith('para-raio')).length + 1), obj: c });
    coluna(c, 0, 0, chao, chao + H, .1, galv, 8);
    [0, 1, 2].forEach(i => { const a = i * 2.094 + .5; barra(c, [0, chao + H, 0], [Math.cos(a) * .5, chao + H + 1.1, Math.sin(a) * .5], .04, galv, 4); });
    const colar = new Mesh(new CylinderGeometry(.18, .18, .3, 10), galv); colar.position.set(0, chao + H * .62, 0); c.add(colar);
    [0, 1, 2].forEach(i => { const a = i * 2.094 + .5 + .3; barra(c, [0, chao + H * .62, 0], [Math.cos(a) * m(5.5), chao + .1, Math.sin(a) * m(5.5)], .022, fioM, 4); });
    caixa(c, -.5, .5, chao, chao + .1, -.5, .5, galv);
    colisores.push({ x0: x - .5, x1: x + .5, z0: z - .5, z1: z + .5, peca: 'para-raio-' + (pecas.filter(p => p.id.startsWith('para-raio')).length) });
  };
  { const cx = -9.5, cz = -26, h = (CASA.x1 - CASA.x0) / 2;                                          // I: cercado do tamanho da casinha, fora da cerca, à esquerda dela
    lado(cx - h, cz - h, cx + h, cz - h); lado(cx + h, cz - h, cx + h, cz + h); lado(cx + h, cz + h, cx - h, cz + h); lado(cx - h, cz + h, cx - h, cz - h);
    mastro(cx, cz); }
  mastro(26, 49);                                                                                   // J: dentro da cerca, perto do portão C
  { /* K: estação meteorológica, dentro da cerca, embaixo à direita */
    const x = -60, z = 44, c = grupo(g, x, 0, z), H = m(2.5); pecas.push({ id: 'estacao', nome: 'Estação meteorológica', obj: c });
    coluna(c, 0, 0, chao, chao + H, .1, galv, 8); caixa(c, -.6, .6, chao, chao + .08, -.6, .6, galv);
    const corpo = new Mesh(new SphereGeometry(.7, 14, 10), mat(0xe3dcc8, { roughness: .6 })); corpo.scale.set(1.5, .55, 1.0); corpo.position.set(0, chao + H + .15, 0); c.add(corpo);
    coluna(c, 0, 0, chao + H, chao + H + 1.1, .05, galv, 6);
    [0, 1, 2].forEach(i => { const a = i * 2.094; const cp = new Mesh(new SphereGeometry(.18, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8e8e0)); cp.position.set(Math.cos(a) * .45, chao + H + 1.1, Math.sin(a) * .45); c.add(cp); });
    for(let i = 0; i < 5; i++){ const d = new Mesh(new CylinderGeometry(.34, .34, .035, 12), mat(0xf1f1ec)); d.position.set(0, chao + H - .45 - i * .09, .4); c.add(d); }
    const pn = caixa(c, -.9, .9, 0, .08, -.5, .5, mat(0x23386b, { metalness: .4, roughness: .35 })); pn.position.set(.8, chao + H - .9, -.5); pn.rotation.z = .55;
    [0, 1, 2].forEach(i => { const a = i * 2.094 + .4; barra(c, [0, chao + H * .6, 0], [Math.cos(a) * m(2.5), chao + .1, Math.sin(a) * m(2.5)], .018, fioM, 4); });
    colisores.push({ x0: x - .5, x1: x + .5, z0: z - .5, z1: z + .5, peca: 'estacao' });
    hotspots.push({ id: "estacao", x, z, r: 4, rotulo: () => "Ver a estação meteorológica", acao: null, msg: "Estação meteorológica (anemômetro, termo-higrômetro e painel solar). Neste modelo ela não está ligada a dados reais." });
  }
  { /* H: fumódromo, fora da cerca à esquerda do recorte, SEM cercado: coluna-cinzeiro vermelha e branca e a placa verde */
    const FXm = -19, FZm = -44, f = grupo(g, FXm, 0, FZm); pecas.push({ id: 'fumodromo', nome: 'Fumódromo', obj: f });
    const mb = mat(0x3a2a1e, { roughness: .9 });
    coluna(f, -2.4, 0, chao, chao + m(1.0), .33, mat(0xf2f2f0, { roughness: .5 }), 14); coluna(f, -2.4, 0, chao + m(.62), chao + m(1.0), .34, mat(0xc62a2a, { roughness: .5 }), 14); caixa(f, -3.3, -1.5, chao, chao + .06, -.9, .9, mat(0x2a2c30, { metalness: .5 }));
    coluna(f, 2.8, 2.0, chao, chao + m(1.3), .22, mb, 8);
    const pl = placaLegivel(texFumodromo(), 3.6, 2.8); pl.position.set(2.8, chao + m(1.35), 1.85); pl.rotation.y = Math.PI; f.add(pl);
    hotspots.push({ id: "fumodromo", x: FXm, z: FZm + 5, r: 5.5, rotulo: () => "Ler a placa do fumódromo", acao: null, msg: "FUMÓDROMO · Não polua nosso espaço. Por favor, fume somente aqui." });
  }


  /* ---------------------------------------------------------------- polia de frenagem clipada no cabo 07, com a corda rosa/laranja que desce até o deck */
  { const pg = grupo(g, -9.5, 1.35, 0); pecas.push({ id: 'polia-frenagem', nome: 'Polia de frenagem + corda', obj: pg });
    const preto = mat(0x121316, { roughness: .55, metalness: .5 }), aco = mat(0x8a8f94, { metalness: .85, roughness: .3 });
    caixa(pg, -.45, .45, -.42, .42, -.2, .2, preto); caixa(pg, -.5, .5, -.12, .12, -.24, .24, mat(0x1c1d21, { metalness: .5, roughness: .5 }));
    const m1 = new Mesh(new TG2(.17, .03, 8, 16), aco); m1.scale.y = 1.4; m1.position.set(0, -.58, 0); pg.add(m1);
    const pts = [[0, -.7, 0], [.03, -1.9, .02], [-.04, -3.2, -.02], [.05, -4.6, .03], [.1, -6.5, .1], [.5, -7.25, .2]].map(p => new Vector3(...p));
    const corda = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 24, .055, 6, false), mat(0xd05a3a, { roughness: .8 })); pg.add(corda);
    const fita = new Mesh(new CylinderGeometry(.075, .075, .9, 8), mat(0xe58aa0, { roughness: .8 })); fita.position.set(0, -2.6, 0); pg.add(fita);
    const laco = new Mesh(new TG2(.38, .045, 6, 18), mat(0xf07a20, { roughness: .8 })); laco.rotation.x = Math.PI / 2; laco.position.set(.65, -7.2, .2); pg.add(laco);
    const verde = new Mesh(new CylinderGeometry(.03, .03, 2.4, 5), mat(0x2f7a4f)); verde.rotation.z = Math.PI / 2; verde.position.set(1.7, -7.25, .3); pg.add(verde);
    hotspots.push({ id: "polia-frenagem", x: -9.5, z: 5.5, r: 3.2, rotulo: () => "Ver a polia de frenagem", acao: null, msg: "Polia de frenagem clipada no cabo, presa por uma corda que desce até o deck. Quando o trolley chega, a polia aciona o fim de curso e ele para." }); }

  /* ---------------------------------------------------------------- trolley coberto por lona (modo caminhada) */
  const lonaG = grupo(g, 0, 0, 0); lonaG.visible = false;
  { const pano = mat(0x0f1011, { roughness: 1 }); const corpo = new Mesh(new SphereGeometry(1, 18, 14), pano); corpo.scale.set(2.1, 1.9, .95); corpo.position.set(0, -.9, 0); lonaG.add(corpo);
    const r = rng(6); for(let i = 0; i < 7; i++){ const d = new Mesh(new SphereGeometry(.42 + r() * .22, 8, 6), pano); d.position.set((r() - .5) * 3.2, -.5 - r() * 2, (r() - .5) * 1.2); lonaG.add(d); }
    coluna(lonaG, 0, 0, .5, 1.5, .12, mat(0x14151a), 8); caixa(lonaG, -.5, .5, 1.1, 1.8, -.4, .4, mat(0x1b1c20, { metalness: .5 }));                  // polia de frenagem sobre o cabo
    coluna(lonaG, 1.7, -1.0, NIVEL.DECK, .6, .05, mat(0xe0742a), 5);                                                                               // corda laranja
    hotspots.push({ id: "trolley", x: 0, z: 5.0, r: 3.8, rotulo: () => "Examinar o trolley", acao: null }); }                                          // trolley/lona (só bloqueia abaixo dele)

  /* ---------------------------------------------------------------- API para o modo caminhada */
  const LAN = { x0: PORT.lanca + .5, x1: PORT.lanca + 43, z0: -6, z1: 52 };                       // deck do lançamento (do outro lado do vão)
  colisores.push({ x0: PORT.lanca - 8, x1: PORT.lanca + .3, z0: -90, z1: 130 });                  // borda do vão: o Pit não cai no cânion
  colisores.push({ x0: LAN.x1 - .3, x1: LAN.x1 + .3, z0: LAN.z0, z1: LAN.z1, y1: chao + 3.4 });    // guarda-corpo do fundo
  /* ---- peças movidas no editor: colisão, chão, hotspots e a porta da casinha acompanham (posição, giro e tamanho) ---- */
  const porId = new Map(pecas.map(p => [p.id, p]));
  pecas.forEach(p => { p.base0 = { x: p.obj.position.x, y: p.obj.position.y, z: p.obj.position.z, r: p.obj.rotation.y, s: p.obj.scale.x }; });
  const ID = { th: 0, s: 1, dy: 0, fwd: (x, z) => [x, z], inv: (x, z) => [x, z] };
  const PAI = { "escada-aluminio": "deck", "escada-verde": "deck", "guarda-1": "deck", "guarda-2": "deck", "guarda-3": "deck", "guarda-4": "deck", "guarda-5": "deck" };                           // peças que são filhas de outra (seguem o pai)
  const tf = (id) => {
    const t0 = tfProprio(id); if(!PAI[id]) return t0; const tp = tfProprio(PAI[id]);
    return { th: t0.th + tp.th, s: t0.s * tp.s, dy: t0.dy + tp.dy, fwd: (x, z) => { const q = t0.fwd(x, z); return tp.fwd(q[0], q[1]); }, inv: (x, z) => { const q = tp.inv(x, z); return t0.inv(q[0], q[1]); } };
  };
  const tfProprio = (id) => {
    const p = porId.get(id); if(!p) return ID; const b = p.base0, o = p.obj;
    const s = o.scale.x / b.s, th = o.rotation.y - b.r, dx = o.position.x - b.x, dz = o.position.z - b.z, cs = Math.cos(th), sn = Math.sin(th);
    return { th, s, dy: o.position.y - b.y,
      fwd: (x, z) => { const px = (x - b.x) * s, pz = (z - b.z) * s; return [b.x + dx + px * cs + pz * sn, b.z + dz - px * sn + pz * cs]; },
      inv: (x, z) => { const qx = x - b.x - dx, qz = z - b.z - dz; return [b.x + (qx * cs - qz * sn) / s, b.z + (qx * sn + qz * cs) / s]; } };
  };
  const HS = { "aviso-queda": "deck", "porta-estreita": "casinha", "porta-estreita-dentro": "casinha", "porta-correr": "casinha", computador: "casinha", radios: "casinha", ganchos: "casinha", camera360: "casinha", "aviso-porta": "casinha", portico: "portico", estacao: "estacao", fumodromo: "fumodromo", "polia-frenagem": "polia-frenagem", "portao-resgate": "portao-resgate", "portao-trilha": "portao-trilha", banheiro: "estacionamento", lanchonete: "estacionamento", "placas-trilha": "estacionamento" };
  hotspots.forEach(h => { if(HS[h.id]){ h.peca = HS[h.id]; h._o = { x: h.x, z: h.z, r: h.r }; } });
  colisores.forEach(k => { if(k.peca){ k._o = { x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1 }; const ant = k.ativo; k.ativo = () => { const p = porId.get(k.peca); return (!p || p.obj.visible) && (!ant || ant()); }; } });
  const registraPeca = (p, hs = []) => {                                                    // peças criadas fora do cenário (ex.: o trolley) entram no editor e na colisão
    pecas.push(p); porId.set(p.id, p); p.base0 = { x: p.obj.position.x, y: p.obj.position.y, z: p.obj.position.z, r: p.obj.rotation.y, s: p.obj.scale.x };
    hs.forEach(id => { HS[id] = p.id; hotspots.filter(h => h.id === id).forEach(h => { h.peca = p.id; h._o = { x: h.x, z: h.z, r: h.r }; }); });
  };
  const spawn = { x: 3.5, z: 8.0, yaw: Math.PI };
  function sincroniza(){
    const cache = {}; const T = (id) => cache[id] || (cache[id] = tf(id));
    colisores.forEach(k => { if(!k.peca) return; const t = T(k.peca), o = k._o, pts = [[o.x0, o.z0], [o.x1, o.z0], [o.x1, o.z1], [o.x0, o.z1]].map(([x, z]) => t.fwd(x, z));
      k.x0 = Math.min(...pts.map(p => p[0])); k.x1 = Math.max(...pts.map(p => p[0])); k.z0 = Math.min(...pts.map(p => p[1])); k.z1 = Math.max(...pts.map(p => p[1])); });
    hotspots.forEach(h => { if(!h.peca) return; const t = T(h.peca), q = t.fwd(h._o.x, h._o.z); h.x = q[0]; h.z = q[1]; h.r = h._o.r * t.s; });
    const td = T("deck"), qs = td.fwd(3.5, 8.0); spawn.x = qs[0]; spawn.z = qs[1]; spawn.yaw = Math.PI + td.th;
  }
  /* chão sensível à altura: considera o deck, o terreno e as escadas (degraus e plataforma); escolhe a superfície mais alta que o Pit alcança (≤ y + 1,5), então ele SOBE as escadas andando */
  const SOBE = 1.5;
  const superficiesEscada = (id, x, z) => {
    const p = porId.get(id); if(!p || !p.obj.visible || !p.obj.userData.sup) return [];
    const u = p.obj.userData.sup, T = tf(id), q = T.inv(x, z), dx = q[0] - u.x, dz = q[1] - u.z, cs = Math.cos(u.giro), sn = Math.sin(u.giro), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs, r = [];
    u.caixas.forEach(([x0, x1, z0, z1, h]) => { if(lx >= x0 && lx <= x1 && lz >= z0 && lz <= z1) r.push(u.y0 + T.dy + h * T.s); });
    return r;
  };
  const EXTRA = { delta: null, rel: null, limite: null, superficies: [], fatorVel: null };                                       // ganchos de outros sistemas (turfeira, passarelas)
  const chaoY = (x, z, y = 1e9) => {
    if(x >= LAN.x0 && x <= LAN.x1 && z >= LAN.z0 && z <= LAN.z1) return chao + .35;
    let base; { const T = tf("deck"), q = T.inv(x, z), pp = plat.chao(q[0], q[1]); base = pp !== null ? pp + T.dy : (x > TERR.x0 ? chao + terr.altura(x, z) : chao) + colinaAltura(x, z); }
    { const Tc = tf("casinha"), qc = Tc.inv(x, z), pc = casa.chao(qc[0], qc[1]); if(pc !== null && porId.get("casinha").obj.visible) base = Math.max(base, pc + Tc.dy); }
    { const dx = x - PONTE.xc, dz = z - PONTE.zc, cs = Math.cos(PONTE.ang), sn = Math.sin(PONTE.ang), u = dx * cs + dz * sn, v = -dx * sn + dz * cs; if(Math.abs(u) <= PONTE.L / 2 && Math.abs(v) <= PONTE.W / 2 && PONTE.y <= y + SOBE + 4) base = Math.max(base, PONTE.y); }
    if(EXTRA.rel) base += EXTRA.rel(x, z);                                                              // corredor da estrada (ondulação, valetas): só fora do platô
    if(EXTRA.delta) base += EXTRA.delta(x, z);                                                          // turfeira: almofadas de musgo e pé afundando
    let melhor = base; const lim = y + SOBE;
    for(let i = 0; i < EXTRA.superficies.length; i++){ const h = EXTRA.superficies[i](x, z, y); if(h !== null && h !== undefined && h <= lim && h > melhor) melhor = h; }       // passarelas e outras superfícies extras
    ["escada-aluminio", "escada-verde"].forEach(id => superficiesEscada(id, x, z).forEach(h => { if(h <= lim && h > melhor) melhor = h; }));
    return melhor;
  };
  const dentroCasa = (x, z, f) => { const q = tf("casinha").inv(x, z); return casa.dentro(q[0], q[1], f); };
  /* clima: nublado (padrão), dia de sol e pôr do sol. Troca céu, névoa, cor e intensidade das luzes. */
  let climaAtual = "nublado"; const texCeus = { nublado: texCeuModo("nublado"), dia: texCeuModo("dia"), poente: texCeuModo("poente") };
  function clima(modo){
    const k = CLIMAS[modo]; if(!k) return climaAtual; climaAtual = modo;
    ceu.material = ceuMatTex; ceu.material.map = texCeus[modo === "ciclo" ? "dia" : modo]; ceu.material.needsUpdate = true; nevoas.forEach(n => { n.visible = modo !== "ciclo"; }); cena.fog.color.setHex(k.fog); cena.fog.density = k.dens;
    nevoas.forEach(n => { n.material.color.setHex(k.nevoa); n.material.opacity = n.userData.op * k.nevoaK; });
    sol3d.visible = k.sol3d > 0; sol3d.userData.disco.material.color.setHex(k.sol3d === 2 ? 0xffd9a0 : 0xffffff); sol3d.userData.halo.scale.setScalar(k.sol3d === 2 ? 1.6 : .7);
    if(luzes){ luzes.hemi.color.setHex(k.hemi[0]); luzes.hemi.groundColor.setHex(k.hemi[1]); luzes.hemi.intensity = k.hemi[2]; luzes.amb.intensity = k.amb; luzes.sol.color.setHex(k.sol[0]); luzes.sol.intensity = k.sol[1]; luzes.sol.position.set(...k.sol[2]); luzes.sol2.color.setHex(k.sol2[0]); luzes.sol2.intensity = k.sol2[1]; }
    return climaAtual;
  }
  const ordemClima = ["ciclo", "nublado", "dia", "poente"];
  const proximoClima = () => climaTudo(ordemClima[(ordemClima.indexOf(climaAtual) + 1) % ordemClima.length]);
  const ouveClima = [];
  const climaTudo = (modo) => { const r = clima(modo); ouveClima.forEach(f => f(r)); return r; };
  try{ const sv = localStorage.getItem("sgv:clima2"); if(sv && CLIMAS[sv]) clima(sv); else clima("ciclo"); }catch(_){ clima("ciclo"); }
  const tick = (dt, x, z) => {
    { const q = tf("casinha").inv(x, z); casa.tick(dt, q[0], q[1]); }
    portas.forEach(p => { if(p.cx !== undefined){ const d = Math.hypot(x - p.cx, z - p.cz); if(d < 9) p.alvo = 1; else if(d < 1e4 && d > 16) p.alvo = 0; }          // o portão abre sozinho quando o Pit chega perto (e fecha quando ele se afasta)
      p.k += (p.alvo - p.k) * Math.min(1, dt * 4); p.folha.rotation.y = -p.k * 1.6 * p.sinal; });                      // abrem para fora (rumo ao cânion)
    terr.wtex.offset.y -= dt * .5; tigreTex.offset.y -= dt * .6;
    quedaMeshes.forEach(w => { w.material.uniforms.uT.value += dt; });
  };
  terr.troncos.forEach(([x, z]) => colisores.push({ x0: x - .95, x1: x + .95, z0: z - .95, z1: z + .95 }));          // tronco das araucárias dos capões
  const tickAmb = tick;
  return { cascata: { x: XR, z: ZQ, quedas: QUEDAS, MID, chao, quedaMeshes, yBase: chao - MID + 2 }, paredao: rochaM, extraChao: EXTRA, ceuMatTex, nevoas, ouveClima, clima: climaTudo, lumUniformes: quedaMeshes.map(w => w.material.uniforms.uLum), trilhas: { TM, TB, TREC }, estac: ESTAC, colinas: COLINAS, relevo: (x, z) => chao + (x > TERR.x0 ? terr.altura(x, z) : 0) + colinaAltura(x, z) + (EXTRA.rel ? EXTRA.rel(x, z) : 0), colinaAltura, agua: (x, z) => terr.agua(x, z), pocos: terr.pocos, rios: { ARROIO, TIGRE, FORT, AXIS }, campo: { terraPoli, BORDA_PTS, emPoli, BORDA, fundoH: FUNDO_H, chao, norte: NORTE_POLI, norteRim: NORTE_RIM }, cabo7Meio: port.cabo7Meio, registraPeca, terreno: terr, tf, sincroniza, ceu, proximoClima, climaAtual: () => climaAtual, climas: CLIMAS, grupo: g, pecas, colisores, hotspots, tick, chao: chaoY, dentro: dentroCasa, paredes: casa.paredes, limites: casa.limites, casa, lona: lonaG, spawn, spawnLan: { x: PORT.lanca + 12, z: 26, yaw: -Math.PI / 2 }, lancamento, ceu, area: AREA, deck: DECK, chaoNivel: chao };
}
