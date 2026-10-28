import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Shape, Path, ExtrudeGeometry, CylinderGeometry, BoxGeometry, TorusGeometry,
  RingGeometry, PlaneGeometry, CircleGeometry, RepeatWrapping, BackSide, InstancedMesh, ConeGeometry, Object3D, Quaternion, Euler, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial, Mesh, AmbientLight, DirectionalLight, HemisphereLight,
  Vector3, Raycaster, Vector2, CanvasTexture, AdditiveBlending, CatmullRomCurve3, TubeGeometry, Color, SRGBColorSpace, DoubleSide, MathUtils
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { criarCasinha } from "./casinha.js";
import { criarCenario } from "./cenario.js";
import { criarAndar, criarPernas } from "./andar.js";
import { criarJogo3D } from "./jogo3d.js";
import { criarEditor } from "./editor.js";
import { criarMundo } from "./mundo/index.js";
import { cabY } from "./portico.js";

/* Medidas em "unidades" (largura do trolley = 10). Frente = +Z (lado da tirolesa / operador); costas = -Z. */
const W = 10, H = 7.6, D = 3.6, CABO_Y = 1.35;

function coracao(esc = 1, dx = 0, dy = 0){
  const P = (x, y) => [((x - 50) / 96 * W) * esc + dx, ((46 - y) / 84 * H) * esc + dy];
  const s = new Shape(), m = (...a) => s.moveTo(...P(...a)), b = (a, c, d) => s.bezierCurveTo(...P(...a), ...P(...c), ...P(...d));
  /* formato provisório: o "V" do topo foi quase aberto (só um leve arco) e a ponta de baixo virou uma base reta de cantos arredondados, até chegarem as fotos de todos os ângulos */
  m(42, 85); b([39, 85], [37, 83], [35, 81]); b([18, 66], [2, 46], [2, 28]); b([2, 12], [14, 4], [28, 4]); b([38, 4], [45, 6.4], [50, 7.2]);
  b([55, 6.4], [62, 4], [72, 4]); b([86, 4], [98, 12], [98, 28]); b([98, 46], [82, 66], [65, 81]); b([63, 83], [61, 85], [58, 85]);
  return s;
}
function anel(ext, int, prof, bisel = 0.04){
  const s = coracao(ext), h = coracao(int);
  s.holes.push(new Path(h.getPoints(40).reverse()));
  const g = new ExtrudeGeometry(s, { depth: prof, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 2, curveSegments: 40 });
  g.translate(0, 0, -prof / 2); return g;
}
function placa(esc, prof, bisel = 0.03){
  const g = new ExtrudeGeometry(coracao(esc), { depth: prof, bevelEnabled: bisel > 0, bevelSize: bisel, bevelThickness: bisel, bevelSegments: 2, curveSegments: 40 });
  g.translate(0, 0, -prof / 2); return g;
}
const mat = (cor, o = {}) => new MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.55, metalness: 0.25 }, o));
function tex(w, h, desenhar){
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); desenhar(x, w, h);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}

/* Posições das peças (no sistema do trolley) conforme a foto frontal. vista: f = frente, b = costas (tampa removida), l = lados. */
export const POS = {
  sobedesce:{ p:[1.44, 2.27, D / 2 + .12], vista:"f", d:3.2 },
  ligadesliga:{ p:[1.51, 1.67, D / 2 + .15], vista:"f", d:3.2 },
  potenciometro:{ p:[1.6, 0.99, D / 2 + .13], vista:"f", d:3.2 },
  emergencia:{ p:[1.67, 0.28, D / 2 + .2], vista:"f", d:3.2 },
  voltimetros:{ p:[2.55, 0.28, D / 2 + .1], vista:"f", d:3.4 },
  alavanca:{ p:[3.52, 2.42, D / 2 + .3], vista:"f", d:3.6 },
  logo:{ p:[-1.52, 1.75, D / 2 + .05], vista:"f", d:5 },
  mosquetoes:{ p:[-3.7, -2.0, D / 2], vista:"f", d:5 },
  fimcurso:{ p:[5.15, 0.95, 0.4], vista:"l", d:4.2 },
  tampa:{ p:[0, 0, -D / 2 - .1], vista:"b", d:9 },
  baterias:{ p:[-4.35, -1.45, 0], vista:"e", d:7.5 },
  avatar:{ p:[-7.0, -3.4, 3.6], vista:"f", d:11 },
  placa:{ p:[2.62, -0.28, D / 2 + .14], vista:"f", d:3.2 },
  furo:{ p:[4.9, CABO_Y + 0.4, 0], vista:"l", d:4.2 },
  motor1:{ p:[2.45, -1.0, -0.7], vista:"b", d:7.5 },
  motor2:{ p:[-2.45, -1.0, -0.7], vista:"b", d:7.5 },
  vulcanizadas:{ p:[-1.3, CABO_Y + 0.95, 0], vista:"b", d:4.6 },
  simples:{ p:[5.9, CABO_Y + 0.35, 0.2], vista:"l", d:5.2 },
  correias:{ p:[0, CABO_Y + 1.0, -0.5], vista:"b", d:7 },
  embreagem:{ p:[3.1, 2.3, -0.4], vista:"b", d:4.2 },
  eletronica:{ p:[0, -0.35, -1.1], vista:"b", d:4.8 },
  modulo:{ p:[1.85, -1.9, -1.5], vista:"b", d:6 },
  mod_placa:{ p:[1.75, -1.9, -0.45], vista:"b", d:2.6, mod:1 }, mod_diss:{ p:[1.9, -1.9, -0.45], vista:"b", d:2.4, mod:1 },
  mod_rele:{ p:[1.7, -1.88, -0.4], vista:"b", d:2.4, mod:1 }, mod_cap:{ p:[1.75, -2.07, -0.4], vista:"b", d:2.4, mod:1 },
  mod_wago:{ p:[2.2, -1.9, -0.4], vista:"b", d:2.6, mod:1 }, mod_fus:{ p:[2.05, -2.19, -0.38], vista:"b", d:2.2, mod:1 },
  mod_term:{ p:[1.9, -2.19, -0.37], vista:"b", d:2.2, mod:1 }, mod_ind:{ p:[1.75, -2.19, -0.4], vista:"b", d:2.2, mod:1 },
  mod_sc:{ p:[1.58, -2.19, -0.38], vista:"b", d:2.2, mod:1 }, mod_fio:{ p:[2.05, -1.65, -0.38], vista:"b", d:2.6, mod:1 }
};

export function montar(el, opts = {}){
  let renderer;
  try{ renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false }); }
  catch(e){ return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;outline:none";
  const cena = new Scene(), cam = new PerspectiveCamera(38, 1, 0.1, 9000);
  const hemi = new HemisphereLight(0xdfe8ff, 0x2a2418, 0.9), amb = new AmbientLight(0xffffff, 0.35); cena.add(hemi); cena.add(amb);
  const sol = new DirectionalLight(0xffffff, 2.1); sol.position.set(6, 9, 12); cena.add(sol);
  const sol2 = new DirectionalLight(0xffd6a0, 1.0); sol2.position.set(-8, 3, -12); cena.add(sol2);

  const mundo = new Group(); cena.add(mundo);            // gira junto: cabo + trolley (a inclinação do cabo muda durante a subida)
  const T = new Group(); mundo.add(T);
  const partes = {};                   // id -> Group
  const H = {};                        // peças móveis (usadas pelo modo jogo)
  const nova = (id) => { const g = new Group(); g.userData.id = id; partes[id] = g; T.add(g); return g; };

  /* corpo: casca oca + aro de borracha + placa frontal */
  const casca = new Mesh(anel(1.0, 0.93, D), mat(0x4b525a, { metalness: 0.5, roughness: 0.45 })); T.add(casca);
  const aro = new Mesh(anel(1.045, 0.985, D * 0.985, 0.05), mat(0x16181a, { roughness: 0.8, metalness: 0.05 })); T.add(aro);
  const frontal = new Mesh(placa(0.985, 0.16), mat(0xcdd1d3, { metalness: 0.55, roughness: 0.38 })); frontal.position.z = D / 2 - 0.02; T.add(frontal);

  /* logo (anéis), texto Urbia e SGV: todos na frente */
  const lg = nova("logo");
  /* logo da Urbia: bola do meio e 5 anéis ao redor, cada vez mais finos para a borda (sem as listras brancas) */
  [[0.78, 0.94], [1.08, 1.21], [1.36, 1.46], [1.6, 1.68], [1.8, 1.85]].forEach(([r0, r1]) => { const a = new Mesh(new RingGeometry(r0, r1, 72), mat(0x2d6a74, { metalness: .2, roughness: .5, side: DoubleSide })); a.position.set(-1.52, 1.75, D / 2 + .11); lg.add(a); });
  const n = new Mesh(new RingGeometry(0, 0.5, 48), mat(0x2d6a74)); n.position.set(-1.52, 1.75, D / 2 + .112); lg.add(n);
  const texto = new Mesh(new PlaneGeometry(5.2, 1.6), new MeshBasicMaterial({ transparent: true, map: tex(520, 160, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.fillStyle = "#2d6a74"; x.font = "bold 128px Arial Black, Arial, sans-serif"; x.textAlign = "center"; x.fillText("urbia", w / 2, 122);
  }) })); texto.position.set(0, -0.95, D / 2 + .115); lg.add(texto);
  /* logomarca da Serra Geral Vertical: centralizada, em laranja claro luminoso (usa a imagem da marca, se enviada em opts.logo) */
  const logoCv = (cor, w, h) => { const cvs = document.createElement("canvas"); cvs.width = w; cvs.height = h; const t = new CanvasTexture(cvs); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
    const pinta = (img) => { const x = cvs.getContext("2d"); x.clearRect(0, 0, w, h);
      if(img){ const k = Math.min(w / img.width, h / img.height); const iw = img.width * k, ih = img.height * k; x.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih); x.globalCompositeOperation = "source-in"; x.fillStyle = cor; x.fillRect(0, 0, w, h); x.globalCompositeOperation = "source-over"; }
      else { x.fillStyle = cor; x.textAlign = "center"; x.font = "bold " + h * .32 + "px Arial"; x.fillText("SERRA GERAL", w / 2, h * .5); x.fillText("VERTICAL", w / 2, h * .8); }
      t.needsUpdate = true; };
    pinta(null); if(opts.logo){ const im = new Image(); im.onload = () => pinta(im); im.src = opts.logo; } return t; };
  H.logoCv = logoCv;
  /* logomarca única: letras preto-esverdeadas com brilho neon laranja em volta, que pulsa e corre suavemente */
  const neon = (() => { const W2 = 700, H2 = 340, cvs = document.createElement("canvas"); cvs.width = W2; cvs.height = H2; const cx = cvs.getContext("2d"), g2 = document.createElement("canvas"); g2.width = W2; g2.height = H2; const c2 = g2.getContext("2d"), dk = document.createElement("canvas"); dk.width = W2; dk.height = H2; const cd = dk.getContext("2d");
    const t = new CanvasTexture(cvs); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; let img = null;
    const prepara = () => { cd.clearRect(0, 0, W2, H2); const mg = 56, k = Math.min((W2 - 2 * mg) / (img ? img.width : 1), (H2 - 2 * mg) / (img ? img.height : 1)); if(img){ const iw = img.width * k, ih = img.height * k; cd.drawImage(img, (W2 - iw) / 2, (H2 - ih) / 2, iw, ih); cd.globalCompositeOperation = "source-in"; cd.fillStyle = "#0c1a10"; cd.fillRect(0, 0, W2, H2); cd.globalCompositeOperation = "source-over"; }
      else { cd.fillStyle = "#0c1a10"; cd.textAlign = "center"; cd.font = "bold 100px Arial"; cd.fillText("SERRA GERAL", W2 / 2, 150); cd.fillText("VERTICAL", W2 / 2, 260); } };
    const pinta = (tt) => { const pulso = .5 + .5 * Math.sin(tt * 1.7), blur = 14 + 14 * pulso;
      c2.clearRect(0, 0, W2, H2); c2.save(); c2.shadowColor = "rgba(255,138,30," + (.75 + .25 * pulso) + ")"; c2.shadowBlur = blur; for(let k = 0; k < 3; k++) c2.drawImage(dk, 0, 0); c2.restore();
      /* faixa de luz que corre da esquerda para a direita, modulando a intensidade do brilho */
      const pos = ((tt * .22) % 1.4 - .2) * W2, gr = c2.createLinearGradient(pos - W2 * .5, 0, pos + W2 * .5, 0); gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(.5, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,.5)");
      c2.globalCompositeOperation = "destination-in"; c2.fillStyle = gr; c2.fillRect(0, 0, W2, H2); c2.globalCompositeOperation = "source-over";
      cx.clearRect(0, 0, W2, H2); cx.drawImage(g2, 0, 0); cx.drawImage(dk, 0, 0); t.needsUpdate = true; };
    prepara(); pinta(0);
    if(opts.logo){ const im = new Image(); im.onload = () => { img = im; prepara(); pinta(0); }; im.src = opts.logo; }
    return { t, pinta }; })();
  const sgv = new Mesh(new PlaneGeometry(4.0, 1.94), new MeshBasicMaterial({ transparent: true, map: neon.t, depthWrite: false })); sgv.position.set(0, -2.32, D / 2 + .13); lg.add(sgv);
  H.neonPinta = neon.pinta;

  /* painel de controle */
  const etiqueta = (x, y, w = 0.95) => { const m = new Mesh(new PlaneGeometry(w, 0.1), new MeshBasicMaterial({ color: 0xd8a36a })); m.position.set(x, y, D / 2 + .118); return m; };
  const zf = D / 2 + .115;
  /* painel de comandos (de cima para baixo): 1 Sobe/Desce · 2 Liga/Desliga · 3 Potenciômetro · 4 Emergência · 5 Voltímetros */
  const rot = (w, h, f) => new MeshBasicMaterial({ transparent: true, map: tex(w * 200, h * 200, f) });
  let g = nova("sobedesce");
  { /* 1) o de cima: seletor deslizante de 3 posições (esquerda sobe, direita desce, meio neutro) */
    const tr = new Mesh(new BoxGeometry(0.7, 0.2, 0.12), mat(0x15171a)); tr.position.set(1.44, 2.27, zf + .06); g.add(tr);
    const fe = new Mesh(new BoxGeometry(0.5, 0.05, 0.02), mat(0x050505)); fe.position.set(1.44, 2.27, zf + .125); g.add(fe);
    const al = new Mesh(new BoxGeometry(0.14, 0.3, 0.1), mat(0x050505, { roughness: .4 })); al.position.set(1.44, 2.27, zf + .17); g.add(al); H.sdAl = al;               // alavanca no meio = neutro
    [-0.28, 0, 0.28].forEach(dx => { const tk = new Mesh(new BoxGeometry(0.025, 0.07, 0.02), mat(0xe9e9e9)); tk.position.set(1.44 + dx, 2.44, zf + .125); g.add(tk); });
    const lb = new Mesh(new PlaneGeometry(0.86, 0.2), rot(.86, .2, (c, w, h) => { c.fillStyle = "#1b1b1b"; c.font = "bold " + h * .42 + "px Arial"; c.textAlign = "center"; c.fillText("SOBE", w * .17, h * .64); c.fillText("0", w * .5, h * .64); c.fillText("DESCE", w * .82, h * .64); }));
    lb.position.set(1.44, 2.6, zf + .122); g.add(lb); const fita = new Mesh(new PlaneGeometry(0.9, 0.24), new MeshBasicMaterial({ color: 0xd8a36a })); fita.position.set(1.44, 2.6, zf + .118); g.add(fita); }
  g = nova("ligadesliga");
  { /* 2) seletor giratório: direita liga, esquerda desliga */
    const base = new Mesh(new BoxGeometry(0.78, 0.5, 0.05), mat(0xe9e9e9)); base.position.set(1.51, 1.67, zf + .025); g.add(base);
    const k = new Mesh(new CylinderGeometry(0.17, 0.2, 0.22, 28), mat(0x111214, { roughness: .4 })); k.rotation.x = Math.PI / 2; k.position.set(1.51, 1.65, zf + .14); g.add(k);
    const pv = new Group(); pv.position.set(1.51, 1.65, zf + .26); g.add(pv); H.ligPv = pv;
    const ip = new Mesh(new BoxGeometry(0.04, 0.2, 0.03), mat(0xe8e8e8)); ip.position.set(0, 0.1, 0); pv.add(ip); pv.rotation.z = 0.9;                    // aponta para a esquerda (desligado)
    const lb = new Mesh(new PlaneGeometry(0.78, 0.18), rot(.78, .18, (c, w, h) => { c.fillStyle = "#1b1b1b"; c.font = "bold " + h * .5 + "px Arial"; c.textAlign = "center"; c.fillText("DESLIGA", w * .24, h * .66); c.fillText("LIGA", w * .83, h * .66); }));
    lb.position.set(1.51, 1.92, zf + .056); g.add(lb); const fita = new Mesh(new PlaneGeometry(0.9, 0.1), new MeshBasicMaterial({ color: 0xd8a36a })); fita.position.set(1.51, 1.95, zf + .052); g.add(fita); }
  g = nova("potenciometro");
  { /* 3) potenciômetro: mínimo à esquerda, máximo à direita */
    const base = new Mesh(new BoxGeometry(0.8, 0.52, 0.05), mat(0xe9e9e9)); base.position.set(1.6, 0.99, zf + .025); g.add(base);
    const k = new Mesh(new CylinderGeometry(0.17, 0.2, 0.22, 28), mat(0x0b0b0c, { roughness: .35 })); k.rotation.x = Math.PI / 2; k.position.set(1.6, 0.97, zf + .14); g.add(k);
    const pv = new Group(); pv.position.set(1.6, 0.97, zf + .26); g.add(pv); H.potPv = pv;
    const ip = new Mesh(new BoxGeometry(0.04, 0.2, 0.03), mat(0xe8e8e8)); ip.position.set(0, 0.1, 0); pv.add(ip); pv.rotation.z = 1.0;
    const lb = new Mesh(new PlaneGeometry(0.8, 0.2), rot(.8, .2, (c, w, h) => { c.fillStyle = "#1b1b1b"; c.font = "bold " + h * .5 + "px Arial"; c.textAlign = "center"; c.fillText("MÍN", w * .15, h * .66); c.fillText("MÁX", w * .85, h * .66); c.fillText("◀ ━━ ▶", w * .5, h * .66); }));
    lb.position.set(1.6, 1.27, zf + .056); g.add(lb); const fita = new Mesh(new PlaneGeometry(0.9, 0.08), new MeshBasicMaterial({ color: 0xd8a36a })); fita.position.set(1.6, 1.36, zf + .052); g.add(fita); }
  g = nova("emergencia");
  { const pv = new Group(); pv.position.set(1.67, 0.28, zf + .13); g.add(pv); H.emPv = pv; H.emZ = zf + .13;
    const b = new Mesh(new CylinderGeometry(0.3, 0.34, 0.26, 32), mat(0x9a3a28, { roughness: .35 })); b.rotation.x = Math.PI / 2; pv.add(b);
    const tq = new Mesh(new BoxGeometry(0.34, 0.05, 0.02), mat(0xf0e4cf)); tq.position.set(0.1, 0, 0.14); pv.add(tq);
    const a = new Mesh(new TorusGeometry(0.36, 0.035, 12, 36), mat(0xd7d7d7)); a.position.set(1.67, 0.28, zf + .02); g.add(a); g.add(etiqueta(1.67, -0.15, 1.1)); }
  g = nova("voltimetros");
  { const t1 = H.vt1 = tex(128, 64, (x, w, h) => { x.fillStyle = "#050606"; x.fillRect(0, 0, w, h); x.fillStyle = "#ff3b2f"; x.font = "bold 34px monospace"; x.textAlign = "center"; x.fillText("41.9", w / 2, 44); });
    const t2 = H.vt2 = tex(128, 64, (x, w, h) => { x.fillStyle = "#050606"; x.fillRect(0, 0, w, h); x.fillStyle = "#ff3b2f"; x.font = "bold 34px monospace"; x.textAlign = "center"; x.fillText("41.7", w / 2, 44); });
    [[0.5, t1], [0.14, t2]].forEach(([y, t]) => { const bx = new Mesh(new BoxGeometry(0.78, 0.36, 0.12), mat(0x101214)); bx.position.set(2.62, y, zf + .06); g.add(bx);
      const v = new Mesh(new PlaneGeometry(0.6, 0.26), new MeshBasicMaterial({ map: t })); v.position.set(2.62, y, zf + .125); g.add(v); }); }
  g = nova("placa");
  { const pl = new Mesh(new PlaneGeometry(0.98, 0.4), new MeshBasicMaterial({ map: tex(294, 120, (x, w, h) => { x.fillStyle = "#f4f1e6"; x.fillRect(0, 0, w, h); x.strokeStyle = "#c0392b"; x.lineWidth = 8; x.strokeRect(5, 5, w - 10, h - 10); x.fillStyle = "#c0392b"; x.textAlign = "center"; x.font = "bold 26px Arial"; x.fillText("CARGA MÁXIMA", w / 2, 46); x.fillStyle = "#1b1b1b"; x.font = "bold 46px Arial"; x.fillText("165 kg", w / 2, 98); }) })); pl.position.set(2.62, -0.28, zf + .045); g.add(pl); }
  g = nova("alavanca");
  { const base = new Mesh(new CylinderGeometry(0.32, 0.36, 0.14, 28), mat(0x3a3f45)); base.rotation.x = Math.PI / 2; base.position.set(3.52, 2.42, zf + .07); g.add(base);
    const hastei = new Mesh(new CylinderGeometry(0.16, 0.2, 0.7, 20), mat(0x8a5230, { roughness: .45, metalness: .5 })); hastei.rotation.set(Math.PI / 2 - 0.5, 0, 0.35); hastei.position.set(3.58, 2.55, zf + .45); g.add(hastei); H.lev = [hastei];
    const hex = new Mesh(new CylinderGeometry(0.2, 0.2, 0.12, 6), mat(0xb9a07a)); hex.rotation.set(Math.PI / 2 - 0.5, 0, 0.35); hex.position.set(3.7, 2.72, zf + .78); g.add(hex); H.lev.push(hex); }
  g = nova("mosquetoes");
  { /* malhas rápidas: 7 de cada lado, penduradas nas bordas de baixo */
    [[-3.78, -1.95, 1], [3.78, -1.95, -1]].forEach(([x, y, s]) => { for(let i = 0; i < 7; i++){ const t = new Mesh(new TorusGeometry(0.3, 0.045, 10, 26), mat(0xaeb4b8, { metalness: .8, roughness: .3 })); t.scale.set(.75, 1.3, 1); t.position.set(x + s * i * .1, y - i * .06, zf + .1 + (i % 2) * .02); t.rotation.set(0, s * 0.5, s * 0.2); g.add(t); } }); }

  /* cabo que atravessa o trolley (a 1/3 do topo) */
  const cb = new Group(); T.add(cb);   // só desenho, não é um componente clicável
  const cabo = new Group(); mundo.add(cabo);   // o cabo fica parado quando o trolley sobe (desengrenado)
  { const c = new Mesh(new CylinderGeometry(0.09, 0.09, 26, 16), mat(0x9aa0a4, { metalness: .8, roughness: .35 })); c.rotation.z = Math.PI / 2; c.position.set(0, CABO_Y, 0); cabo.add(c);
    [-1, 1].forEach(s => { const bu = new Mesh(new CylinderGeometry(0.24, 0.3, 0.5, 20), mat(0x101214)); bu.rotation.z = Math.PI / 2; bu.position.set(s * 5.0, CABO_Y, 0); cb.add(bu); }); }

  /* fim de curso nas bordas, junto ao cabo (esquerda e direita) */
  const fc = nova("fimcurso");
  { [-1, 1].forEach(s => { const cx = s * 5.18;
      const cx2 = new Mesh(new BoxGeometry(0.34, 0.52, 0.5), mat(0xe0b020, { roughness: .5 })); cx2.position.set(cx, 0.8, 0.5); fc.add(cx2);
      const br = new Mesh(new CylinderGeometry(0.03, 0.03, 0.8, 8), mat(0x2b2b2b)); br.position.set(cx + s * .25, 1.05, 0.5); br.rotation.z = s * 0.35; fc.add(br);
      const ro = new Mesh(new CylinderGeometry(0.13, 0.13, 0.12, 16), mat(0x111111)); ro.rotation.x = Math.PI / 2; ro.position.set(cx + s * .42, 1.42, 0.5); fc.add(ro); (H.fcRo = H.fcRo || {})[s] = ro; (H.fcCx = H.fcCx || {})[s] = cx2; }); }

  /* polias simples: pequenas, rolam sobre o cabo, em cima dos botões de fim de curso (engrenado ou não) */
  const ps = nova("simples");
  { [-1, 1].forEach(s => {
      [5.62, 6.2].forEach(ax => { const x = s * ax, y = CABO_Y + 0.3;
        const r = new Mesh(new CylinderGeometry(0.3, 0.3, 0.2, 28), mat(0xb7bdc1, { metalness: .75, roughness: .35 })); r.rotation.x = Math.PI / 2; r.position.set(x, y, 0); ps.add(r); (H.simplesR = H.simplesR || []).push(r);
        [-1, 1].forEach(f => { const mk = new Mesh(new BoxGeometry(0.46, 0.012, 0.05), mat(0x4a5057, { metalness: .6 })); mk.position.y = f * 0.13; r.add(mk); const mk2 = mk.clone(); mk2.rotation.y = Math.PI / 2; r.add(mk2); });
        [-1, 1].forEach(f => { const fl = new Mesh(new CylinderGeometry(0.33, 0.33, 0.025, 28), mat(0x8f959a, { metalness: .8 })); fl.rotation.x = Math.PI / 2; fl.position.set(x, y, f * 0.105); ps.add(fl); });
        const hub = new Mesh(new CylinderGeometry(0.09, 0.09, 0.3, 14), mat(0x3a3f44, { metalness: .6 })); hub.rotation.x = Math.PI / 2; hub.position.set(x, y, 0); ps.add(hub); });
      const br = new Mesh(new BoxGeometry(1.5, 0.08, 0.34), mat(0x4a5057, { metalness: .6 })); br.position.set(s * 5.9, CABO_Y + 0.72, 0); ps.add(br);
      [5.62, 6.2].forEach(ax => { const po = new Mesh(new BoxGeometry(0.05, 0.4, 0.05), mat(0x4a5057, { metalness: .6 })); po.position.set(s * ax, CABO_Y + 0.52, 0.13); ps.add(po); });
      const lig = new Mesh(new BoxGeometry(0.5, 0.1, 0.34), mat(0x4a5057, { metalness: .6 })); lig.position.set(s * 5.1, CABO_Y + 0.66, 0); ps.add(lig); }); }

  /* interior (visível com a tampa de trás removida) */
  const interior = new Group(); T.add(interior);
  const dentro = (id) => { const g = new Group(); g.userData.id = id; partes[id] = g; interior.add(g); return g; };
  /* furo de inspeção: perto de onde passa o cabo, na lateral direita (vista da frente) */
  g = nova("furo");
  { const an = new Mesh(new TorusGeometry(0.2, 0.05, 10, 28), mat(0xb9bec2, { metalness: .8 })); an.rotation.y = Math.PI / 2; an.position.set(4.82, CABO_Y + 0.4, 0); g.add(an);
    const di = new Mesh(new CircleGeometry(0.16, 24), mat(0x000000)); di.rotation.y = Math.PI / 2; di.position.set(4.8, CABO_Y + 0.4, 0); g.add(di); }

  /* caixa externa de baterias: lateral esquerda, parte de baixo (vista da frente), com porta de grade fina de losangos laranja */
  const caixaL = nova("baterias"); caixaL.position.set(-3.83, -0.99, 0); caixaL.rotation.z = -2.38;     // x local = para fora; y local = para a ponta de baixo
  const BL = 2.9, BH2 = 1.5, BD = 0.7;
  H.caixa = caixaL; H.BD = BD; H.BL = BL; H.BH2 = BH2; H.bats = {};
  { const cinza = mat(0x2b2f33, { roughness: .6, metalness: .5 });
    [[0, BH2 / 2 + 0.04, BD, 0.08, BL], [0, -BH2 / 2 - 0.04, BD, 0.08, BL]].forEach(([x, y, w, h, l]) => { const p = new Mesh(new BoxGeometry(w, h, l), cinza); p.position.set(BD / 2, y, 0); caixaL.add(p); });
    [-1, 1].forEach(sz => { const p = new Mesh(new BoxGeometry(BD, BH2 + 0.16, 0.08), cinza); p.position.set(BD / 2, 0, sz * (BL / 2 + 0.04)); caixaL.add(p); });
    const fundo = new Mesh(new BoxGeometry(0.04, BH2, BL), mat(0x050606, { roughness: .9 })); fundo.position.set(0.02, 0, 0); caixaL.add(fundo);
    [[1, -0.37, 0x28496e], [2, 0.37, 0x1f3a5c]].forEach(([n, y, cor]) => {
      const bg = new Group(); const b = new Mesh(new BoxGeometry(0.55, 0.66, 2.6), mat(cor, { roughness: .55 })); bg.add(b);
      const tt = new Mesh(new PlaneGeometry(1.7, 0.4), new MeshBasicMaterial({ transparent: true, map: tex(220, 50, (c, w, h) => { c.fillStyle = "#e9e9e9"; c.font = "bold 30px Arial"; c.textAlign = "center"; c.fillText("BATERIA " + n, w / 2, 36); }) }));
      tt.position.set(0.282, 0, 0); tt.rotation.set(0, Math.PI / 2, Math.PI); bg.add(tt);
      [[-0.9, 0xc03030], [0.9, 0x222222]].forEach(([dz, cc]) => { const t = new Mesh(new CylinderGeometry(0.09, 0.09, 0.14, 12), mat(cc)); t.rotation.z = Math.PI / 2; t.position.set(0.3, 0.18, dz); bg.add(t); });
      bg.position.set(0.35, y, 0); caixaL.add(bg); H.bats[n] = { g: bg, y }; }); }
  const portaB = new Group(); portaB.position.set(BD + 0.02, BH2 / 2 + 0.1, 0); caixaL.add(portaB); H.porta = portaB;
  { const PH = BH2 + 0.12;
    const grade = tex(512, 300, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "#f08a1c"; c.lineWidth = 3.2; const pp = 22;
      for(let k = -h; k < w + h; k += pp){ c.beginPath(); c.moveTo(k, 0); c.lineTo(k + h * 0.62, h); c.stroke(); c.beginPath(); c.moveTo(k + h * 0.62, 0); c.lineTo(k, h); c.stroke(); }
      c.lineWidth = 16; c.strokeStyle = "#e0701a"; c.strokeRect(8, 8, w - 16, h - 16); });
    const gm = new MeshStandardMaterial({ map: grade, transparent: true, alphaTest: 0.2, side: DoubleSide, color: 0xffffff, emissive: 0x2a1204, roughness: .5, metalness: .5 });
    const pl = new Mesh(new PlaneGeometry(BL + 0.1, PH), gm); pl.rotation.y = Math.PI / 2; pl.position.set(0, -(PH / 2) - 0.02, 0); portaB.add(pl);
    const al = new Mesh(new BoxGeometry(0.1, 0.1, 0.5), mat(0x1b1b1b)); al.position.set(0.04, -PH + 0.12, 0); portaB.add(al);
    const pino = new Mesh(new CylinderGeometry(0.05, 0.05, BL + 0.2, 10), mat(0xb9bec2, { metalness: .85 })); pino.rotation.x = Math.PI / 2; portaB.add(pino); }

  /* motores 1 e 2: cada um é um motor preto (eixo horizontal), acoplamento laranja e redutor de alumínio, com corrente preta subindo para as polias */
  function motor(id, lado){            // lado: +1 = x positivo (esquerda da tela, vendo por trás), -1 = x negativo; o redutor fica para o centro
    const g = dentro(id), s = lado, y = -1.0, z = -0.7, mx = (v) => s * v;
    const m = new Mesh(new CylinderGeometry(0.5, 0.5, 1.25, 32), mat(0x151618, { roughness: .6, metalness: .45 })); m.rotation.z = Math.PI / 2; m.position.set(mx(3.0), y, z); g.add(m);
    const fl = new Mesh(new CylinderGeometry(0.56, 0.56, 0.1, 32), mat(0x9ea3a8, { metalness: .8, roughness: .4 })); fl.rotation.z = Math.PI / 2; fl.position.set(mx(2.32), y, z); g.add(fl);
    const eixo = new Mesh(new CylinderGeometry(0.14, 0.14, 0.9, 16), mat(0xb8bcc0, { metalness: .85, roughness: .3 })); eixo.rotation.z = Math.PI / 2; eixo.position.set(mx(1.95), y, z); g.add(eixo);
    const ac = new Mesh(new CylinderGeometry(0.3, 0.3, 0.55, 28), mat(0xe8731a, { roughness: .5, metalness: .15 })); ac.rotation.z = Math.PI / 2; ac.position.set(mx(1.95), y, z); g.add(ac);
    const ch = new Mesh(new BoxGeometry(0.2, 0.2, 0.06), mat(0x4a4d52)); ch.position.set(mx(1.95), y + 0.05, z + 0.3); g.add(ch);      // chaveta no acoplamento
    const rd = new Mesh(new BoxGeometry(0.75, 0.95, 0.95), mat(0xb9bec2, { metalness: .75, roughness: .4 })); rd.position.set(mx(1.28), y, z); g.add(rd);
    const rf = new Mesh(new CylinderGeometry(0.28, 0.28, 0.1, 24), mat(0x6f7478, { metalness: .8 })); rf.rotation.x = Math.PI / 2; rf.position.set(mx(1.28), y, z - 0.52); g.add(rf);
    const co = new Mesh(new CylinderGeometry(0.2, 0.2, 0.34, 20), mat(0x8e9397, { metalness: .8 })); co.rotation.x = Math.PI / 2; co.position.set(mx(0.78), y + 0.1, z); g.add(co);   // saída do redutor
    return g;
  }
  motor("motor1", 1); motor("motor2", -1);   // vistos por trás (tampa removida): o Motor 1 fica à esquerda da tela e o Motor 2 à direita
  g = dentro("vulcanizadas");
  { [-1.3, 1.3].forEach(x => { const r = new Mesh(new CylinderGeometry(0.95, 0.95, 0.55, 40), mat(0x0e0e0f, { roughness: .9, metalness: 0 })); r.rotation.x = Math.PI / 2; r.position.set(x, CABO_Y + 0.95, 0); g.add(r);
      const hub = new Mesh(new CylinderGeometry(0.3, 0.3, 0.7, 20), mat(0xaeb4b8, { metalness: .8 })); hub.rotation.x = Math.PI / 2; hub.position.copy(r.position); g.add(hub); }); }
  /* correias: polia vulcanizada da esquerda -> Motor 1; da direita -> Motor 2; e uma entre as duas polias vulcanizadas */
  function faixa(c1, r1, c2, r2, esp, larg){
    const d = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]), a0 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]), ph = Math.acos(MathUtils.clamp((r1 - r2) / d, -1, 1)), N = 20;
    const hull = (e) => { const P = []; for(let i = 0; i <= N; i++){ const an = a0 + ph + (2 * Math.PI - 2 * ph) * i / N; P.push(new Vector2(c1[0] + (r1 + e) * Math.cos(an), c1[1] + (r1 + e) * Math.sin(an))); }
      for(let i = 0; i <= N; i++){ const an = a0 - ph + (2 * ph) * i / N; P.push(new Vector2(c2[0] + (r2 + e) * Math.cos(an), c2[1] + (r2 + e) * Math.sin(an))); } return P; };
    const sh = new Shape(hull(esp)); sh.holes.push(new Path(hull(0)));
    const g = new ExtrudeGeometry(sh, { depth: larg, bevelEnabled: false }); g.translate(0, 0, -larg / 2); return g; }
  const belt = mat(0x0a0a0b, { roughness: .85, metalness: .1 });
  g = dentro("correias");
  { const HY = CABO_Y + 0.95, ZB = -0.62, ZM = -0.42;
    [-1, 1].forEach(s => {
      const hx = s * 1.3, mx2 = s * 0.78, my = -0.9;
      const pa = new Mesh(new CylinderGeometry(0.32, 0.32, 0.14, 24), mat(0x6e7378, { metalness: .8 })); pa.rotation.x = Math.PI / 2; pa.position.set(hx, HY, ZB); g.add(pa);          // polia pequena na vulcanizada
      const pm = new Mesh(new CylinderGeometry(0.17, 0.17, 0.14, 20), mat(0x6e7378, { metalness: .8 })); pm.rotation.x = Math.PI / 2; pm.position.set(mx2, my, ZB); g.add(pm);           // polia na saída do redutor
      const b = new Mesh(faixa([hx, HY], 0.32, [mx2, my], 0.17, 0.05, 0.12), belt); b.position.z = ZB; g.add(b);
      const pc = new Mesh(new CylinderGeometry(0.34, 0.34, 0.12, 24), mat(0x6e7378, { metalness: .8 })); pc.rotation.x = Math.PI / 2; pc.position.set(hx, HY, ZM); g.add(pc); });   // polia para a correia do meio
    const bm = new Mesh(faixa([1.3, HY], 0.34, [-1.3, HY], 0.34, 0.05, 0.12), belt); bm.position.z = ZM; g.add(bm); }
  g = dentro("embreagem");
  { const base = new Mesh(new CylinderGeometry(0.45, 0.45, 0.3, 24), mat(0x3a3f45)); base.rotation.x = Math.PI / 2; base.position.set(3.52, 2.42, -0.2); g.add(base);
    const haste = new Mesh(new CylinderGeometry(0.1, 0.1, 3.2, 14), mat(0x8a5230, { metalness: .5 })); haste.rotation.x = Math.PI / 2; haste.position.set(3.52, 2.42, 0.6); g.add(haste);
    const garfo = new Mesh(new BoxGeometry(1.8, 0.14, 0.5), mat(0xb9a07a)); garfo.position.set(2.5, 2.1, -0.2); garfo.rotation.z = -0.28; g.add(garfo); }
  g = dentro("eletronica");
  { const pl = new Mesh(new BoxGeometry(1.4, 1.0, 0.12), mat(0x1c6b3a, { roughness: .7 })); pl.position.set(0, -0.25, -1.2); g.add(pl);
    [[-.35, .1], [.3, .1], [-.3, -.4], [.4, -.4]].forEach(([x, y]) => { const c = new Mesh(new BoxGeometry(.4, .28, .25), mat(0x121417)); c.position.set(x, y - .2, -1.35); g.add(c); }); }
  /* fiação (provisória) */
  const fios = new Group(); interior.add(fios);
  [[0xc03030, [[-0.7, -1.0, -0.7], [-0.9, -0.6, -1.15], [-0.4, -0.2, -1.3]]], [0x202020, [[0.7, -1.0, -0.7], [0.9, -0.6, -1.15], [0.4, -0.1, -1.3]]],
   [0xe0b020, [[0, 0.3, -1.25], [0, 1.5, -1.0], [-1.5, 2.6, -1.2]]], [0xe0b020, [[0, 0.3, -1.25], [0.5, 1.6, -1.0], [1.5, 2.6, -1.2]]]].forEach(([cor, pts]) => {
    const t = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p => new Vector3(...p))), 20, 0.05, 6, false), mat(cor)); fios.add(t); });

  /* ===== módulo elétrico: caixa de proteção acoplada, embaixo à esquerda (vista por trás), com tampa articulada ===== */
  const MX = 1.85, MY = -1.9, MZ0 = -0.22, MW = 0.92, MH = 0.8, MD = 1.15;     // centro (x,y), plano da base (z) e dimensões
  const modulo = dentro("modulo");
  const preto = mat(0x1b1c1f, { roughness: .55, metalness: .35 });
  { const base = new Mesh(new BoxGeometry(MW, MH, 0.05), preto); base.position.set(MX, MY, MZ0); modulo.add(base);
    [[0, MH / 2, MW, 0.05], [0, -MH / 2, MW, 0.05]].forEach(([x, y, w, h]) => { const p = new Mesh(new BoxGeometry(w, h, MD), preto); p.position.set(MX + x, MY + y, MZ0 - MD / 2); modulo.add(p); });
    [[-MW / 2], [MW / 2]].forEach(([x]) => { const p = new Mesh(new BoxGeometry(0.05, MH, MD), preto); p.position.set(MX + x, MY, MZ0 - MD / 2); modulo.add(p); });
    const aba = new Mesh(new BoxGeometry(MW + 0.28, 0.07, 0.04), preto); aba.position.set(MX, MY - MH / 2 - 0.02, MZ0 - 0.1); modulo.add(aba);   // flange de fixação (acoplada)
    [-1, 1].forEach(s => { const par = new Mesh(new CylinderGeometry(0.035, 0.035, 0.07, 10), mat(0xb9bec2, { metalness: .85 })); par.rotation.x = Math.PI / 2; par.position.set(MX + s * (MW / 2 + 0.1), MY - MH / 2 - 0.02, MZ0 - 0.1); modulo.add(par); }); }
  /* tampa articulada: dobradiça na borda de fora (x maior) */
  const dobr = new Group(); dobr.position.set(MX + MW / 2, MY, MZ0 - MD); modulo.add(dobr);
  { const lid = new Mesh(new BoxGeometry(MW, MH, 0.05), mat(0x2a2c30, { roughness: .45, metalness: .45 })); lid.position.set(-MW / 2, 0, -0.025); dobr.add(lid);
    const bor = new Mesh(new BoxGeometry(MW + 0.04, MH + 0.04, 0.02), preto); bor.position.set(-MW / 2, 0, -0.01); dobr.add(bor);
    const et = new Mesh(new PlaneGeometry(0.7, 0.3), new MeshBasicMaterial({ transparent: true, map: tex(350, 150, (c, w, h) => { c.fillStyle = "#e0a21b"; c.fillRect(0, 0, w, h); c.fillStyle = "#1b1b1b"; c.font = "bold 40px Arial"; c.textAlign = "center"; c.fillText("MÓDULO", w / 2, 62); c.fillText("ELÉTRICO", w / 2, 112); }) })); et.position.set(-MW / 2, 0.02, -0.056); et.rotation.y = Math.PI; dobr.add(et);
    [[-0.38, 0.32], [-0.38, -0.32], [-MW + 0.06, 0.32], [-MW + 0.06, -0.32]].forEach(([x, y]) => { const p = new Mesh(new CylinderGeometry(0.03, 0.03, 0.04, 10), mat(0xb9bec2, { metalness: .85 })); p.rotation.x = Math.PI / 2; p.position.set(x < -0.4 ? x : x, y, -0.06); dobr.add(p); }); }
  /* conteúdo (coordenadas locais: x para a direita, y para cima, z para quem olha por trás) */
  const interno = new Group(); interno.position.set(MX, MY, MZ0 - 0.04); interno.rotation.y = Math.PI; modulo.add(interno);
  const mp = (lx, ly, lz) => [MX - lx, MY + ly, MZ0 - 0.04 - lz];      // local -> mundo (para posicionar os marcadores)
  const sub = (id) => { const g = new Group(); g.userData.id = id; partes[id] = g; interno.add(g); return g; };
  const placaM = new Mesh(new BoxGeometry(0.8, 0.68, 0.02), mat(0xd1581a, { roughness: .6 })); placaM.position.z = 0.01; interno.add(placaM);
  let s = sub("mod_placa");
  { const pcb = new Mesh(new BoxGeometry(0.56, 0.48, 0.018), mat(0x1f7a3d, { roughness: .6 })); pcb.position.set(0.1, 0, 0.03); s.add(pcb);
    const dp = new Mesh(new BoxGeometry(0.15, 0.06, 0.02), mat(0x0b0c0d)); dp.position.set(-0.02, 0.2, 0.05); s.add(dp);
    const dg = new Mesh(new PlaneGeometry(0.13, 0.045), new MeshBasicMaterial({ map: tex(130, 45, (c, w, h) => { c.fillStyle = "#050606"; c.fillRect(0, 0, w, h); c.fillStyle = "#ff3b2f"; c.font = "bold 34px monospace"; c.textAlign = "center"; c.fillText("00.0", w / 2, 34); }) })); dg.position.set(-0.02, 0.2, 0.061); s.add(dg);
    [0.17, 0.23, 0.29, 0.35].forEach(x => { const b = new Mesh(new BoxGeometry(0.05, 0.05, 0.05), mat(0x2b8f4e)); b.position.set(x, 0.205, 0.06); s.add(b); const pa = new Mesh(new CylinderGeometry(0.014, 0.014, 0.02, 10), mat(0xc9ced2, { metalness: .85 })); pa.rotation.x = Math.PI / 2; pa.position.set(x, 0.205, 0.092); s.add(pa); }); }
  s = sub("mod_diss");
  { [-0.12, -0.05].forEach(x => [0.12, 0.05, -0.02, -0.09].forEach(y => { const d = new Mesh(new BoxGeometry(0.06, 0.05, 0.055), mat(0xa9aeb2, { metalness: .7, roughness: .4 })); d.position.set(x, y, 0.065); s.add(d);
      for(let i = -1; i <= 1; i++){ const f = new Mesh(new BoxGeometry(0.06, 0.004, 0.06), mat(0xd2d6d9, { metalness: .8 })); f.position.set(x, y + i * 0.015, 0.07); s.add(f); } })); }
  s = sub("mod_rele");
  { [[0.18, 0.09], [0.12, -0.05]].forEach(([x, y]) => { const r = new Mesh(new BoxGeometry(0.2, 0.13, 0.12), mat(0x121315, { roughness: .5 })); r.position.set(x, y, 0.1); s.add(r); }); }
  s = sub("mod_cap");
  { [0.0, 0.07, 0.14, 0.21, 0.28].forEach((x, i) => { const c = new Mesh(new CylinderGeometry(0.032, 0.032, 0.1, 18), mat(0x1c5a3a, { roughness: .4, metalness: .3 })); c.rotation.x = Math.PI / 2; c.position.set(x, -0.17, 0.08); s.add(c);
      const tp = new Mesh(new CylinderGeometry(0.027, 0.027, 0.004, 18), mat(0xd8d0b4, { metalness: .8 })); tp.rotation.x = Math.PI / 2; tp.position.set(x, -0.17, 0.132); s.add(tp); }); }
  s = sub("mod_wago");
  { [0.25, 0.12, -0.02, -0.15, -0.27].forEach((y, i) => { const w = new Mesh(new BoxGeometry(0.1, 0.075, 0.07), new MeshStandardMaterial({ color: 0xd6dde0, transparent: true, opacity: .55, roughness: .2 })); w.position.set(-0.34, y, 0.07); s.add(w);
      const o = new Mesh(new BoxGeometry(0.1, 0.03, 0.074), mat(0xe8731a)); o.position.set(-0.34, y + 0.02, 0.071); s.add(o); }); }
  s = sub("mod_fus");
  { const v = new Mesh(new CylinderGeometry(0.018, 0.018, 0.12, 12), new MeshStandardMaterial({ color: 0xe9eef0, transparent: true, opacity: .55 })); v.rotation.z = Math.PI / 2; v.position.set(-0.2, -0.29, 0.05); s.add(v);
    [-0.06, 0.06].forEach(dx => { const cp = new Mesh(new CylinderGeometry(0.022, 0.022, 0.026, 12), mat(0xc9a55a, { metalness: .85 })); cp.rotation.z = Math.PI / 2; cp.position.set(-0.2 + dx, -0.29, 0.05); s.add(cp); });
    const fi = new Mesh(new CylinderGeometry(0.004, 0.004, 0.11, 6), mat(0xb0b0b0)); fi.rotation.z = Math.PI / 2; fi.position.set(-0.2, -0.29, 0.05); s.add(fi); }
  s = sub("mod_term");
  { const d = new Mesh(new CylinderGeometry(0.035, 0.035, 0.012, 20), mat(0x1c4fa8, { roughness: .5 })); d.rotation.x = Math.PI / 2; d.position.set(-0.05, -0.29, 0.045); s.add(d);
    [-0.012, 0.012].forEach(dx => { const pn = new Mesh(new CylinderGeometry(0.003, 0.003, 0.05, 6), mat(0xc9ced2, { metalness: .9 })); pn.position.set(-0.05 + dx, -0.32, 0.04); s.add(pn); }); }
  s = sub("mod_ind");
  { const b = new Mesh(new TorusGeometry(0.045, 0.02, 12, 28), mat(0xb87333, { metalness: .7, roughness: .35 })); b.position.set(0.1, -0.29, 0.06); s.add(b);
    const n = new Mesh(new TorusGeometry(0.045, 0.014, 8, 24), mat(0x2b2b2b)); n.position.set(0.1, -0.29, 0.06); n.scale.set(1.02, 1.02, .5); s.add(n); }
  s = sub("mod_sc");
  { const c = new Mesh(new CylinderGeometry(0.05, 0.05, 0.12, 22), mat(0x1c3f7a, { roughness: .45, metalness: .3 })); c.rotation.x = Math.PI / 2; c.position.set(0.27, -0.29, 0.08); s.add(c);
    const tp = new Mesh(new CylinderGeometry(0.044, 0.044, 0.004, 22), mat(0xd8d0b4, { metalness: .8 })); tp.rotation.x = Math.PI / 2; tp.position.set(0.27, -0.29, 0.142); s.add(tp);
    const tx = new Mesh(new PlaneGeometry(0.1, 0.06), new MeshBasicMaterial({ transparent: true, map: tex(100, 60, (c2, w, h) => { c2.fillStyle = "#e9e9e9"; c2.font = "bold 22px Arial"; c2.textAlign = "center"; c2.fillText("SC", w / 2, 36); }) })); tx.position.set(0.27, -0.29, 0.144); s.add(tx); }
  s = sub("mod_fio");
  { const cores = [0xd02828, 0x111111, 0xe0c020, 0x7a3fb0, 0x2a9d5a, 0xe8731a, 0xd02828, 0xe0c020];
    const rotas = [[[-0.34, 0.25], [-0.2, 0.3], [0.17, 0.24]], [[-0.34, 0.12], [-0.22, 0.2], [0.23, 0.24]], [[-0.34, -0.02], [-0.2, -0.06], [0.29, 0.24]], [[-0.34, -0.15], [-0.25, 0.0], [0.35, 0.24]],
      [[-0.34, -0.27], [-0.28, -0.22], [-0.2, -0.26]], [[-0.34, -0.27], [-0.1, -0.33], [0.1, -0.35], [0.27, -0.35]], [[-0.34, 0.12], [-0.15, 0.28], [0.35, 0.3]], [[-0.34, -0.15], [-0.18, -0.2], [0.0, -0.23]]];
    rotas.forEach((r, i) => { const pts = r.map(([x, y], j) => new Vector3(x, y, 0.075 + 0.03 * (j % 2) + 0.01 * i)); s.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.008, 6, false), mat(cores[i], { roughness: .6 }))); });
    [[-0.5, 0.25], [-0.5, 0.12], [-0.5, -0.02], [-0.5, -0.15], [-0.5, -0.27]].forEach(([x, y], i) => { s.add(new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(-0.34, y, 0.07), new Vector3(-0.44, y + 0.02, 0.1), new Vector3(x - 0.1, y + 0.05, 0.2), new Vector3(x - 0.2, y + 0.1, 0.4)]), 14, 0.01, 6, false), mat([0xd02828, 0x111111, 0xe0c020, 0x2a9d5a, 0x7a3fb0][i]))); }); }
  const LOC = { mod_placa:[0.1, 0.0, 0.06], mod_diss:[-0.085, 0.03, 0.07], mod_rele:[0.15, 0.02, 0.1], mod_cap:[0.14, -0.17, 0.08], mod_wago:[-0.34, -0.02, 0.07],
    mod_fus:[-0.2, -0.29, 0.05], mod_term:[-0.05, -0.29, 0.05], mod_ind:[0.1, -0.29, 0.06], mod_sc:[0.27, -0.29, 0.08], mod_fio:[-0.1, 0.27, 0.09] };
  Object.entries(LOC).forEach(([k, l]) => { POS[k].p = mp(...l); });
  Object.keys(partes).filter(k => k.startsWith("mod_")).forEach(k => { partes[k].visible = false; });
  let modAberta = false, modT = 0;

  /* tampa de trás removível */
  const tampa = nova("tampa"); T.remove(tampa); T.add(tampa);
  { const pl = new Mesh(placa(0.93, 0.14), mat(0x6b737b, { metalness: .6, roughness: .45 })); pl.position.z = -D / 2 - 0.04; tampa.add(pl);
    [[-3.4, 2.6], [3.4, 2.6], [-2.4, -2.2], [2.4, -2.2], [0, -3.1], [0, 3.0]].forEach(([x, y]) => { const p = new Mesh(new CylinderGeometry(0.14, 0.14, 0.12, 12), mat(0xb9bec2, { metalness: .8 })); p.rotation.x = Math.PI / 2; p.position.set(x, y, -D / 2 - .14); tampa.add(p); }); }

  /* =====================================================================
     AVATAR 3D do Líder de Operações + deck de madeira (ambiente 3D em expansão). Ativado com opts.avatar.
     Baseado na ilustração: capacete verde-oliva com aro laranja, óculos escuros, barba, farda verde, cinto de segurança preto/vermelho
     com mosquetão, rádio no ombro, pulseiras, botas marrons, polegar para cima.
     ===================================================================== */
  let avatar = null, avatar2 = null;
  if(opts.avatar || opts.lider){
    const ag = new Group(); (opts.lider ? cena : mundo).add(ag); ag.userData.id = "avatar"; partes.avatar = ag;
    const M = (cor, o = {}) => mat(cor, Object.assign({ roughness: .75, metalness: .05 }, o));
    const luva = M(0x0d0d0f, { roughness: .78, metalness: .05 }), piel = M(0xd8a077), barba = M(0x2a1a11, { roughness: .95 }), oliva = M(0x56642d), calca = M(0x4a5729), bota = M(0x5a3a22, { roughness: .9 }), preto = M(0x131315, { roughness: .6 }), vermelho = M(0xc8392b), metal = M(0xcfd4d8, { metalness: .85, roughness: .3 }), laranja = M(0xe8731a), capac = M(0x4a5d2f, { roughness: .5, metalness: .15 });
    /* deck de madeira */
    const tdeck = tex(512, 256, (x, w, h) => { x.fillStyle = "#8a5a2c"; x.fillRect(0, 0, w, h); for(let i = 0; i < 8; i++){ x.fillStyle = i % 2 ? "#7c4f25" : "#9a6532"; x.fillRect(0, i * h / 8, w, h / 8 - 4); x.fillStyle = "#33200f"; x.fillRect(0, i * h / 8 + h / 8 - 4, w, 4); for(let k = 0; k < 6; k++){ x.fillStyle = "rgba(40,24,10,.35)"; x.fillRect((k * 97 + i * 53) % w, i * h / 8 + 6, 38, 2); } } });
    tdeck.wrapS = tdeck.wrapT = RepeatWrapping; tdeck.repeat.set(3, 2);
    H.tdeck = tdeck; H.AG = ag;
    if(opts.lider){
    /* ===== AMBIENTE: cercado completo (deck grande de madeira, casinha, cerca), grama em volta e paisagem com céu de pôr do sol ===== */
    const DW = 70, DD = 46, DZ = 2.5, CASA_W = 14, CASA_D = 10;                                     // largura e profundidade do deck (cercado), centro em z
    tdeck.repeat.set(DW / 8.7, DD / 6.5);
    H.amb = { DW, DD, DZ };
    const deck = new Mesh(new BoxGeometry(DW, 0.5, DD), new MeshStandardMaterial({ map: tdeck, roughness: .85 })); deck.position.set(0, -6.25, DZ); ag.add(deck);
    const viga = new Mesh(new BoxGeometry(DW, .6, DD), M(0x3b2612)); viga.position.set(0, -6.75, DZ); ag.add(viga);
    /* grama ao redor */
    const tgr = tex(256, 256, (x, w, h) => { x.fillStyle = "#4a6a2a"; x.fillRect(0, 0, w, h); for(let i = 0; i < 1800; i++){ x.fillStyle = ["#3d5a22", "#56782f", "#6c8c3c", "#324c1c"][i % 4]; x.fillRect((i * 97) % w, (i * 57 + (i >> 3) * 13) % h, 2, 5 + i % 4); } });
    tgr.wrapS = tgr.wrapT = RepeatWrapping; tgr.repeat.set(70, 70);
    const grama = new Mesh(new PlaneGeometry(700, 700), new MeshStandardMaterial({ map: tgr, roughness: 1 })); grama.rotation.x = -Math.PI / 2; grama.position.set(0, -6.5, 0); ag.add(grama);
    /* cerca do cercado (esquerda, direita e fundo; a frente fica aberta para a câmera) */
    { const cm = M(0xd9d4c4, { roughness: .7 }), poste = M(0x3b2a18);
      const trecho = (x0, z0, x1, z1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 4)); for(let k = 0; k <= n; k++){ const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; const pp = new Mesh(new BoxGeometry(.28, 1.8, .28), poste); pp.position.set(x, -5.1, z); ag.add(pp); }
        const l = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0); [-5.3, -4.5].forEach(y => { const r = new Mesh(new BoxGeometry(.12, .12, l), cm); r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = ang; ag.add(r); }); };
      trecho(-DW / 2, DZ - DD / 2 + CASA_D, -DW / 2, DZ + DD / 2 - 6); trecho(DW / 2, DZ - DD / 2, DW / 2, DZ + DD / 2 - 6); trecho(-DW / 2 + CASA_W, DZ - DD / 2, DW / 2, DZ - DD / 2); }
    /* casinha (receptivo): sala em que dá para entrar, encostada no canto de trás à esquerda do cercado (provisória até as fotos) */
    H.casa = criarCasinha({ ag, M, x0: -DW / 2 + CASA_W / 2, z0: DZ - DD / 2 + CASA_D / 2, w: CASA_W, d: CASA_D });
    /* paisagem: céu de pôr do sol, sol e montanhas em camadas (cilindro panorâmico) */
    { const tc = tex(32, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0e1a44"); g.addColorStop(.16, "#262a6c"); g.addColorStop(.3, "#7a3f86"); g.addColorStop(.4, "#d4604f"); g.addColorStop(.46, "#ff9a58"); g.addColorStop(.495, "#ffd98a"); g.addColorStop(.5, "#ffe9b0"); g.addColorStop(.5001, "#3a3350"); g.addColorStop(1, "#1d1b30"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
      const skyG = new Group(); ag.add(skyG); H.skyG = skyG; H.mts = [];
      const ceu = new Mesh(new SphereGeometry(600, 32, 20), new MeshBasicMaterial({ map: tc, side: BackSide, depthWrite: false, fog: false })); ceu.position.y = 0; skyG.add(ceu);
      const sol = new Mesh(new CircleGeometry(15, 40), new MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: .95, depthWrite: false })); sol.position.set(-140, 14, -420); sol.lookAt(0, 0, 0); skyG.add(sol);
      const halo = new Mesh(new CircleGeometry(48, 40), new MeshBasicMaterial({ color: 0xffa24a, transparent: true, opacity: .28, depthWrite: false, blending: AdditiveBlending })); halo.position.set(-140, 14, -415); halo.lookAt(0, 0, 0); skyG.add(halo);
      [[330, 0x4a3a78, 1.0, 5], [270, 0x382e66, .8, 11], [215, 0x2a2650, .6, 17]].forEach(([r, cor, esc, sem], idx) => {
        const tm = tex(2048, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "#fff"; x.beginPath(); x.moveTo(0, h); for(let i = 0; i <= w; i += 8){ const a = i / w * 6.2832; const y = h * .62 - (Math.sin(a * 3 + sem) * 38 + Math.sin(a * 7 + sem * 2) * 20 + Math.sin(a * 17 + sem) * 8) * esc - 30 * esc; x.lineTo(i, y); } x.lineTo(w, h); x.fill(); });
        const m = new Mesh(new CylinderGeometry(r, r, 34 * esc + 22, 64, 1, true), new MeshBasicMaterial({ map: tm, color: cor, transparent: true, side: BackSide, depthWrite: false, fog: false })); m.position.y = -6.4 + (34 * esc + 22) / 2; ag.add(m); H.mts.push({ m, f: .0005 * (idx + 1) }); }); }
    } else {
            H.cen = criarCenario({ ag, cena, M, luzes: { hemi, amb, sol, sol2 } }); H.casa = H.cen; H.amb = H.cen.area;
      /* o trolley fica no cabo 07 (z = 0), perto das duas escadas; só desliza pela linha do cabo (desengrenado). No estudo 3D (órbita) ele continua ampliado, na origem. */
      H.trolleyX = 3.5; H.trolleyReal = false;
      const posT = () => {
        cabo.visible = !H.trolleyReal; if(H.cen.cabo7Meio) H.cen.cabo7Meio.visible = !!H.trolleyReal;     // estudo: a barra do cabo é do próprio modelo; cenário: vale o cabo 07 do pórtico
        if(!H.trolleyReal){ T.scale.setScalar(1); T.position.set(0, 0, 0); T.rotation.z = 0; return; }
        const x = Math.max(-58, Math.min(150, H.trolleyX)), y = cabY(6, x), dy = (cabY(6, x + 1) - cabY(6, x - 1)) / 2;
        T.scale.setScalar(.36); T.position.set(x, y - 1.35 * .36, 0); T.rotation.z = Math.atan(dy);
      };
      H.trolleyModo = (real) => { H.trolleyReal = !!real; posT(); };
      H.cen.registraPeca({ id: "trolley", nome: "Trolley (só desliza pelo cabo 07)", obj: T, trilho: true, ajusta: () => { H.trolleyX = Math.max(-58, Math.min(150, T.position.x)); posT(); } }, ["trolley"]);
    }
    if(opts.lider){
    /* ferramentas no deck: corda, bolsa com cinto e notebook */
    { const tfolha = tex(256, 340, (x, w, h) => { x.fillStyle = "#f6f3ea"; x.fillRect(0, 0, w, h); x.fillStyle = "#e0883a"; x.fillRect(0, 0, w, 44); x.fillStyle = "#1b1b1b"; x.font = "bold 22px Arial"; x.textAlign = "center"; x.fillText("CHECKLIST", w / 2, 31);
        x.strokeStyle = "#8b8678"; x.lineWidth = 1.5; for(let r = 0; r < 14; r++){ const y = 64 + r * 19; x.beginPath(); x.moveTo(14, y); x.lineTo(w - 14, y); x.stroke(); x.fillStyle = "#4a7a2a"; x.fillRect(w - 44, y - 12, 8, 8); x.fillStyle = "#b8b3a4"; x.fillRect(22, y - 11, 60 + (r * 37) % 110, 5); } });
      const mTop = new MeshStandardMaterial({ map: tfolha, roughness: .9 }), mFolha = M(0xf1eee4, { roughness: .95 }), mLado = M(0xd9d5c8, { roughness: .95 });
      [[-3.6, 4.5, 9, .12], [-2.1, 4.9, 6, -.2], [-3.0, 6.2, 11, .3]].forEach(([x, z, n, rot]) => { const g = new Group(); g.position.set(x, -6.0, z); g.rotation.y = rot; ag.add(g);
        for(let k = 0; k < n; k++){ const f = new Mesh(new BoxGeometry(1.3, .07, 1.75), k === n - 1 ? [mLado, mLado, mTop, mLado, mLado, mLado] : (k % 3 ? mFolha : mLado)); f.position.set((k % 2 ? .03 : -.02), .04 + k * .075, (k % 3 - 1) * .02); f.rotation.y = (k % 5 - 2) * .012; g.add(f); }
        const prancheta = new Mesh(new BoxGeometry(1.34, .05, 1.8), M(0x6b4a2a, { roughness: .8 })); prancheta.position.y = -.005 + .02; prancheta.visible = false; g.add(prancheta);
        const clipe = new Mesh(new BoxGeometry(.5, .1, .16), M(0xb9bec2, { metalness: .85, roughness: .3 })); clipe.position.set(0, .06 + n * .075, -.78); g.add(clipe); }); }
    { const bolsa = new Mesh(new BoxGeometry(1.7, .8, 1.1), preto); bolsa.position.set(-4.1, -5.65, 6.0); bolsa.rotation.y = .4; ag.add(bolsa); const lis = new Mesh(new BoxGeometry(1.72, .14, 1.12), vermelho); lis.position.copy(bolsa.position); lis.position.y += .1; lis.rotation.y = .4; ag.add(lis); }
    { const nb = new Group(); nb.position.set(-5.4, -5.95, 5.3); nb.rotation.y = .25; ag.add(nb); const base = new Mesh(new BoxGeometry(1.9, .08, 1.25), M(0x2a2c30, { metalness: .5 })); nb.add(base);
      const tl = tex(256, 160, (x, w, h) => { x.fillStyle = "#1b1208"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffa23a"; x.font = "bold 11px monospace"; for(let i = 0; i < 11; i++){ x.globalAlpha = .55 + (i % 3) * .15; x.fillText(["$ checklist --trolley", "[ok] baterias 41.9 V", "[ok] correias", "[ok] fim de curso", "> escala --hoje", "> caixa --mes", "[ok] frenagem molas", "$ sgv --operacao", "> trolley 3d", "[ok] seguranca", "_"][i], 10, 18 + i * 13); } });
      const tela = new Mesh(new BoxGeometry(1.9, 1.2, .05), new MeshBasicMaterial({ map: tl })); tela.position.set(0, .64, -.6); tela.rotation.x = -.28; nb.add(tela); }
    }
    const pessoa3d = (cfg) => {
      const av = new Group(); av.position.set(cfg.x, cfg.y, cfg.z); av.rotation.y = cfg.yaw; av.scale.setScalar(0.92); ag.add(av); let nomeLb = null;
      const mesh = (g, m, x = 0, y = 0, z = 0, pai) => { const o = new Mesh(g, m); o.position.set(x, y, z); (pai || av).add(o); return o; };
      const oliva = cfg.camisa, manga = cfg.manga || cfg.camisa, calca = cfg.calca;
      const P = cfg.pele || piel, CAP = cfg.capacete || capac, cabelo = M(cfg.cabelo || 0x1e140d, { roughness: 1 });
    /* corpo — tecido com trama, botas com sola e cadarço, joelhos, bolsos cargo, alças de perna */
    const trama = tex(128, 128, (x, w, h) => { x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h); for(let k = 0; k < w; k += 4){ x.fillStyle = "rgba(0,0,0,.09)"; x.fillRect(k, 0, 1.4, h); x.fillRect(0, k, w, 1.4); } for(let q = 0; q < 700; q++){ x.fillStyle = "rgba(0,0,0," + (.02 + (q % 5) * .01) + ")"; x.fillRect((q * 53) % w, (q * 29) % h, 2, 2); } });
    trama.wrapS = trama.wrapT = RepeatWrapping; trama.repeat.set(5, 5);
    const tec = (m) => { const c = m.clone(); c.map = trama; c.roughness = .92; return c; };
    const oliva2 = tec(oliva), manga2 = tec(manga), calca2 = tec(calca), solaM = M(0x16130f, { roughness: .95 }), cadM = M(0xcfc6b0, { roughness: .8 });
    const botaPe = (x, z, rot) => { const g = new Group(); g.position.set(x, 0, z); g.rotation.y = rot; av.add(g);
      mesh(new BoxGeometry(.64, .12, 1.22), solaM, 0, .06, .08, g);
      const bico = mesh(new SphereGeometry(.34, 18, 14), bota, 0, .3, .5, g); bico.scale.set(1.0, .72, 1.15);
      mesh(new BoxGeometry(.6, .42, .82), bota, 0, .33, .0, g).scale.set(1, 1, 1);
      mesh(new CylinderGeometry(.34, .36, .62, 20), bota, 0, .72, -.12, g);
      for(let k = 0; k < 4; k++) mesh(new BoxGeometry(.4, .035, .06), cadM, 0, .48 + k * .1, .3 - k * .1, g);
      mesh(new CylinderGeometry(.37, .37, .08, 20), M(0x2a1c10, { roughness: .9 }), 0, 1.05, -.12, g); return g; };
    const estat = [botaPe(-.5, .0, .05), botaPe(.78, .22, -.28)];
    const perna = (x, z, rz, tz) => { const g = new Group(); g.position.set(x, 1.0, z); g.rotation.z = rz; av.add(g);
      mesh(new CylinderGeometry(.33, .3, 1.0, 22), calca2, 0, .32, 0, g); mesh(new CylinderGeometry(.46, .38, 1.05, 22), calca2, 0, 1.1, 0, g);
      mesh(new SphereGeometry(.34, 16, 12), calca2, 0, .86, .04, g); mesh(new BoxGeometry(.5, .5, .09), calca2, x < 0 ? -.4 : .4, .95, .26, g);                      // bolso cargo
      mesh(new BoxGeometry(.38, .05, .1), calca2, x < 0 ? -.4 : .4, 1.17, .3, g); mesh(new TorusGeometry(.45, .05, 8, 24), preto, 0, 1.45, 0, g).rotation.x = Math.PI / 2;   // alça de perna do cinto
      mesh(new CylinderGeometry(.34, .33, .1, 20), tec(manga), 0, -.17, 0, g); return g; };
    estat.push(perna(-.5, 0, .02), perna(.72, .12, -.2));
    mesh(new SphereGeometry(.98, 24, 16), calca2, 0, 2.55, -.03, av).scale.set(1, .6, .72);
    const tronco = new Group(); tronco.position.set(0, 2.2, 0); av.add(tronco);
    mesh(new CylinderGeometry(.9, .78, 1.7, 36), oliva2, 0, .88, 0, tronco).scale.z = .76;
    mesh(new SphereGeometry(.92, 30, 18, 0, Math.PI * 2, 0, Math.PI * .5), oliva2, 0, 1.72, 0, tronco).scale.set(1, .52, .72);                    // ombros em declive
    mesh(new CylinderGeometry(.4, .46, .3, 20), oliva2, 0, 2.05, 0, tronco);                                                                     // gola
    mesh(new TorusGeometry(.41, .06, 10, 22), M(0x15161a), 0, 2.1, .02, tronco).rotation.x = Math.PI / 2;                                        // camiseta preta no pescoço
    [-1, 1].forEach(sx => { const o = mesh(new SphereGeometry(.45, 20, 14), manga2, sx * 1.0, 1.65, 0, tronco); o.scale.set(1, .95, .95); });
    for(let k = 0; k < 3; k++) mesh(new BoxGeometry(.5 - k * .05, .018, .02), oliva, 0, .35 + k * .5, .66 + k * .02, tronco);                      // dobras
    /* cinto de segurança (preto, com listras vermelhas), mosquetão e corda */
    const equipN0 = tronco.children.length;
    mesh(new CylinderGeometry(.93, .93, .2, 28), preto, 0, .0, 0, tronco);
    [-1, 1].forEach(sx => { const f = mesh(new BoxGeometry(.2, 1.9, .1), preto, sx * .42, 1.0, .84, tronco); f.rotation.z = sx * .2; const v = mesh(new BoxGeometry(.06, 1.88, .11), vermelho, sx * .42, 1.0, .85, tronco); v.rotation.z = sx * .2; });
    mesh(new BoxGeometry(1.4, .13, .1), preto, 0, 1.15, .86, tronco); mesh(new BoxGeometry(.26, .2, .12), metal, 0, 1.15, .9, tronco);
    const mosq = mesh(new TorusGeometry(.2, .05, 10, 20), metal, 0, .42, .95, tronco); mosq.scale.y = 1.5; mesh(new TorusGeometry(.26, .07, 10, 22), laranja, .35, -.1, .88, tronco);
    mesh(new CylinderGeometry(.3, .3, .2, 14), metal, -.7, -.18, .8, tronco).rotation.x = Math.PI / 2;
    for(let k = 0; k < 3; k++){ const nó = mesh(new TorusGeometry(.2 + k * .04, .06, 8, 18), k % 2 ? M(0x56642d) : laranja, .55 + k * .1, -.5 - k * .08, .8, tronco); nó.rotation.set(1.2, .3 * k, k); }
    /* rádio no ombro */
    mesh(new BoxGeometry(.34, .66, .2), preto, .72, 1.45, .84, tronco); mesh(new CylinderGeometry(.025, .025, .55, 6), preto, .84, 2.0, .84, tronco);
    mesh(new BoxGeometry(.2, .12, .02), new MeshBasicMaterial({ color: 0xff8a1e }), .72, 1.55, .95, tronco);
    const equipN1 = tronco.children.length;                                                                                // cinto, mosquetão, corda e rádio: personagens especiais os escondem (rig.equip)
    /* braço direito (à esquerda da tela): polegar para cima; esquerdo: mão na cintura */
    const braco = (sx) => { const pv = new Group(); pv.position.set(sx * 1.05, 1.65, 0); tronco.add(pv); mesh(new CylinderGeometry(.33, .26, 1.05, 22), manga2, 0, -.52, 0, pv);
      const co = new Group(); co.position.set(0, -1.05, 0); pv.add(co); mesh(new SphereGeometry(.27, 16, 12), manga2, 0, 0, 0, co); mesh(new CylinderGeometry(.27, .22, 1.0, 22), manga2, 0, -.5, 0, co);
      mesh(new TorusGeometry(.265, .07, 10, 24), manga2, 0, -.14, 0, co).rotation.x = Math.PI / 2;                                                    // manga dobrada no cotovelo
      mesh(new CylinderGeometry(.24, .24, .22, 22), M(0x1e2024, { roughness: .5, metalness: .3 }), 0, -.96, 0, co); mesh(new BoxGeometry(.28, .06, .02), laranja, 0, -.97, .25, co);   // relógio/pulseira
      const mao = new Group(); mao.position.set(0, -1.2, 0); co.add(mao); const palma = mesh(new SphereGeometry(.31, 20, 16), luva, 0, 0, 0, mao); return { pv, co, mao }; };
    const bD = braco(-1), bE = braco(1);
    /* bottom da escala no braço (barra, pílulas e mosquetão conforme a pessoa) */
    /* bottom da escala, desenhado exatamente como nas imagens (viewBox 460x580) */
    const desenhaBottom = (x, pin) => {
      const borda = { '#e8731a': '#c85f0e', '#951c24': '#7a1219', '#0a0a0a': '#4a4d5e' }[pin.barra] || '#4a4d5e';
      const rrp = (a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
      rrp(30, 30, 400, 520, 42); x.fillStyle = '#1c1d29'; x.fill(); x.lineWidth = 12; x.strokeStyle = '#0e0e16'; x.stroke();
      rrp(55, 55, 350, 470, 26); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.10)'; x.stroke();
      rrp(80, 80, 130, 420, 14); x.fillStyle = pin.barra; x.fill(); x.lineWidth = 5; x.strokeStyle = borda; x.stroke();
      for(let i = 0; i < pin.pil; i++){ const y = 424 - i * 68; rrp(94, y + 6, 104, 54, 27); x.fillStyle = '#b8ad93'; x.fill(); rrp(94, y, 104, 54, 27); x.fillStyle = '#ece3cf'; x.fill(); }
      const cr = new Path2D('M375 218C380 140 262 130 262 215L290 415C296 450 356 450 358 415L376 236');
      x.lineCap = 'round'; x.lineWidth = 16; x.strokeStyle = pin.mosq; x.stroke(cr);
      x.lineCap = 'butt'; x.lineWidth = 5; x.strokeStyle = '#1c1d29'; x.beginPath(); x.moveTo(374, 224); x.lineTo(384, 224); x.moveTo(350, 372); x.lineTo(366, 372); x.stroke();
    };
        if(cfg.pin) { const pin = cfg.pin, tp = tex(460, 580, (x) => desenhaBottom(x, { barra: pin.barra, pil: pin.pil, mosq: pin.mosq }));
      [[bD, -1], [bE, 1]].forEach(([b, sx]) => { const pl = new Mesh(new PlaneGeometry(.56, .705), new MeshBasicMaterial({ map: tp, transparent: true, side: DoubleSide })); pl.position.set(sx * .31, -.5, .0); pl.rotation.y = sx * Math.PI / 2; b.pv.add(pl); }); }
    bD.pv.rotation.set(-.3, 0, -.85); bD.co.rotation.set(0, 0, -2.3);
    /* mão do sinal de rock 🤘: palma + 5 dedos. Indicador e mindinho para cima; médio e anelar dobrados sobre a palma; polegar cruzado por cima deles. Os dedos apontam para -y (para cima na tela com o braço erguido). */
    { const m = new Group(); bD.mao.add(m); bD.rock = m; bD.mao.children[0].scale.set(.95, .95, .62);
      const dedo = (x, comp, r) => { const g = new Group(); g.position.set(x, -.2, 0); m.add(g); const a = mesh(new CylinderGeometry(r, r * .92, comp, 10), luva, 0, -comp / 2, 0, g); mesh(new SphereGeometry(r * .93, 10, 8), luva, 0, -comp, 0, g); return g; };
      dedo(-.185, .5, .062);                 // indicador (lado do polegar)
      dedo(.2, .42, .056);                   // mindinho
      [-.065, .075].forEach((x, i) => { const g = new Group(); g.position.set(x, -.2, .06); m.add(g); const a = mesh(new CylinderGeometry(.06, .056, .2, 10), luva, 0, -.02, .05, g); a.rotation.x = Math.PI / 2 - .35; mesh(new SphereGeometry(.065, 10, 8), luva, 0, .0, .15, g); });   // médio e anelar dobrados
      const pol = new Group(); pol.position.set(-.27, -.04, .09); m.add(pol); const pc = mesh(new CylinderGeometry(.068, .06, .34, 10), luva, 0, 0, 0, pol); pc.rotation.set(.35, 0, Math.PI / 2 - .55); mesh(new SphereGeometry(.07, 10, 8), luva, .1, -.1, .12, pol); }
    bE.pv.rotation.set(.1, 0, .5); bE.co.rotation.set(0, 0, -1.4);
    /* cabeça — rosto com nariz, orelhas, bochechas, barba com textura, bigode, boca sorrindo, óculos escuros e capacete detalhado */
    const cab = new Group(); cab.position.set(0, 4.45, 0); av.add(cab);
    const pescoco = mesh(new CylinderGeometry(.34, .4, .5, 20), P, 0, 3.85, 0);
    mesh(new SphereGeometry(.88, 36, 28), P, 0, 0, 0, cab).scale.set(.97, 1.08, 1.0);
    mesh(new SphereGeometry(.6, 24, 18), P, 0, -.47, .2, cab).scale.set(1.05, .95, .95);                                      // mandíbula
    [-1, 1].forEach(sx => { mesh(new SphereGeometry(.3, 16, 12), M(0xdc9a78, { roughness: .6 }), sx * .45, -.22, .62, cab); });   // bochechas
    mesh(new SphereGeometry(.16, 16, 12), M(0xd39673, { roughness: .6 }), 0, -.12, .9, cab).scale.set(1, 1.1, 1.05);              // nariz
    mesh(new CylinderGeometry(.07, .1, .38, 10), P, 0, .1, .85, cab).rotation.x = .18;
    [-1, 1].forEach(sx => { const orelha = mesh(new SphereGeometry(.19, 14, 10), M(0xcf8f6c, { roughness: .6 }), sx * .88, -.08, -.08, cab); orelha.scale.set(.5, 1, .8); mesh(new SphereGeometry(.1, 10, 8), M(0x8a5338), sx * .93, -.08, -.04, cab).scale.set(.4, 1, .7); });
    if(cfg.barba !== false){
    const stub = tex(128, 128, (x, w, h) => { x.fillStyle = "#2b1a10"; x.fillRect(0, 0, w, h); for(let q = 0; q < 900; q++){ x.fillStyle = ["#3a2417", "#1d110a", "#46301f"][q % 3]; x.fillRect((q * 47) % w, (q * 31) % h, 2, 3); } });
    stub.wrapS = stub.wrapT = RepeatWrapping; stub.repeat.set(4, 3);
    const mBarba = new MeshStandardMaterial({ map: stub, roughness: 1 });
    const bar = mesh(new SphereGeometry(.92, 36, 18, 0, Math.PI * 2, Math.PI * .52, Math.PI * .4), mBarba, 0, -.02, .03, cab); bar.scale.set(1.0, 1.04, 1.03);   // barba cobrindo o maxilar
    mesh(new SphereGeometry(.33, 16, 12), mBarba, 0, -.9, .62, cab).scale.set(1, 1.15, .8);                                      // cavanhaque
    [-1, 1].forEach(sx => { const bg = mesh(new SphereGeometry(.2, 14, 10), mBarba, sx * .17, -.33, .86, cab); bg.scale.set(1.25, .55, .6); bg.rotation.z = sx * -.22; });   // bigode
    [-1, 1].forEach(sx => mesh(new BoxGeometry(.08, .34, .14), mBarba, sx * .84, -.12, .16, cab));                                // costeletas
    }
    const boca = mesh(new CircleGeometry(.27, 24, Math.PI, Math.PI), M(0x1a0a08), 0, -.5, .915, cab); boca.scale.set(1.1, .8, 1);       // sorriso aberto (meia-lua para baixo)
    boca.rotation.z = 0; const dentes = mesh(new PlaneGeometry(.4, .09), M(0xf5f1e8, { roughness: .35 }), 0, -.455, .922, cab);
    mesh(new TorusGeometry(.3, .028, 8, 20, Math.PI), M(0x9a5a4a, { roughness: .5 }), 0, -.5, .92, cab).rotation.z = Math.PI;
    const ocG = new Group(); cab.add(ocG);
    if(cfg.oculos !== false){
    /* óculos escuros */
    const lenteM = new MeshStandardMaterial({ map: tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#5f7aa0"); g.addColorStop(.35, "#10151e"); g.addColorStop(1, "#05070a"); x.fillStyle = g; x.fillRect(0, 0, w, h); }), roughness: .12, metalness: .7 });
    [-1, 1].forEach(sx => { const le = mesh(new SphereGeometry(.28, 22, 16), lenteM, sx * .33, .06, .84, ocG); le.scale.set(1.05, .78, .34); le.rotation.z = sx * -.07;
      const aroL = mesh(new TorusGeometry(.29, .028, 8, 28), preto, sx * .33, .06, .87, ocG); aroL.scale.set(1.08, .8, 1); aroL.rotation.z = sx * -.07;
      const hastea = mesh(new BoxGeometry(.05, .08, .95), preto, sx * .87, .08, .4, ocG); hastea.rotation.y = sx * .17; });
    mesh(new BoxGeometry(.2, .05, .06), preto, 0, .1, .9, ocG);
    } else {
      [-1, 1].forEach(sx => { const o = mesh(new SphereGeometry(.13, 14, 10), M(0xf4f1ea, { roughness: .3 }), sx * .33, .08, .84, cab); o.scale.set(1.25, .8, .5); mesh(new SphereGeometry(.07, 10, 8), M(cfg.olhos || 0x3a2a1c, { roughness: .3 }), sx * .33, .08, .9, cab); mesh(new BoxGeometry(.34, .045, .06), cabelo, sx * .33, .27, .88, cab).rotation.z = sx * .1; });
      mesh(new TorusGeometry(.2, .035, 8, 16, Math.PI), M(cfg.labios || 0x9a5a4a, { roughness: .4 }), 0, -.48, .93, cab).rotation.z = Math.PI;
    }
    const capG = new Group(); cab.add(capG);
    /* capacete: casca, aba frontal, ventilações, ajuste traseiro, jugular com fivela e cabelo escapando nas laterais */
    mesh(new SphereGeometry(1.03, 36, 20, 0, Math.PI * 2, 0, Math.PI * .45), CAP, 0, .12, 0, capG);
    const aro = mesh(new TorusGeometry(1.0, .075, 12, 48), cfg.capacete ? preto : laranja, 0, .12 + Math.cos(Math.PI * .45) * 1.03, 0, capG); aro.rotation.x = Math.PI / 2;
    const aba = mesh(new BoxGeometry(1.35, .06, .5), CAP, 0, .2, .98, capG); aba.rotation.x = .26; aba.scale.x = 1;
    mesh(new BoxGeometry(1.37, .03, .07), laranja, 0, .165, 1.2, capG).rotation.x = .26;
    for(let k = 0; k < 9; k++){ const ph = -Math.PI * .5 + (k + .5) * Math.PI / 9, th = .3 * Math.PI; const pos = new Vector3(Math.sin(th) * Math.cos(ph) * 1.025, Math.cos(th) * 1.025 + .12, Math.sin(th) * Math.sin(ph) * 1.025); const vt = new Mesh(new BoxGeometry(.13, .02, .3), M(0x10150b)); vt.position.copy(pos); vt.lookAt(0, .12, 0); capG.add(vt); }
    const dial = mesh(new CylinderGeometry(.2, .2, .1, 20), preto, 0, .12, -1.04, capG); dial.rotation.x = Math.PI / 2; mesh(new BoxGeometry(.5, .14, .12), preto, 0, .1, -.98, capG);
    [-1, 1].forEach(sx => { const pts = [new Vector3(sx * .9, .1, .1), new Vector3(sx * .92, -.45, .1), new Vector3(sx * .7, -.98, .28), new Vector3(sx * .2, -1.0, .66)]; mesh(new TubeGeometry(new CatmullRomCurve3(pts), 18, .03, 6, false), preto, 0, 0, 0, capG); });
    mesh(new BoxGeometry(.2, .12, .09), metal, 0, -1.0, .7, capG);
    [-1, 1].forEach(sx => mesh(new SphereGeometry(.5, 14, 10, 0, Math.PI * 2, 0, Math.PI * .4), cabelo, sx * .62, -.2, -.28, cab).rotation.z = sx * 1.4);
    if(cfg.rabo){ mesh(new SphereGeometry(.34, 14, 10), cabelo, 0, -.15, -1.0, cab); const rb = mesh(new CylinderGeometry(.2, .12, 1.5, 12), cabelo, 0, -.95, -1.12, cab); rb.rotation.x = -.18; mesh(new SphereGeometry(.14, 10, 8), cabelo, 0, -1.72, -1.2, cab); mesh(new TorusGeometry(.2, .05, 8, 14), M(0xc23a5a), 0, -.4, -1.05, cab).rotation.x = Math.PI / 2; }
    /* nome do boneco */
    { const lb = new Mesh(new PlaneGeometry(1.7, .5), new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide, map: tex(340, 100, (x, w, h) => { x.fillStyle = "rgba(14,16,10,.78)"; x.beginPath(); x.roundRect ? x.roundRect(4, 8, w - 8, h - 16, 22) : x.rect(4, 8, w - 8, h - 16); x.fill(); x.strokeStyle = "#e0883a"; x.lineWidth = 4; x.stroke(); x.fillStyle = "#ffb36b"; x.font = "bold " + Math.min(54, Math.floor(300 / (cfg.nome.length * .72))) + "px Arial"; x.textAlign = "center"; x.fillText(cfg.nome, w / 2, 66); }) }));
      lb.position.set(0, 6.55, 0); lb.rotation.y = -.28; av.add(lb); nomeLb = lb; }
      { const tsh = tex(128, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(.6, "rgba(0,0,0,.25)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
        const sh = new Mesh(new PlaneGeometry(4.2, 3.2), new MeshBasicMaterial({ map: tsh, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(.1, .03, .1); av.add(sh); }
      const pernasA = criarPernas(av, { calca: calca2, bota, sola: solaM, cad: cadM, anel: M(0x2a1c10, { roughness: .9 }) });
      return { tronco, cab, bD, bE, t: 0, av, nome: nomeLb, estat, pernasA, capG, ocG, equip: tronco.children.slice(equipN0, equipN1) };
    };
    const criaLider = (AV, cfg) => {
      const { av, bD, bE, tronco, cab } = AV;
      const mesh = (g, m, x = 0, y = 0, z = 0, pai) => { const o = new Mesh(g, m); o.position.set(x, y, z); (pai || av).add(o); return o; };
      /* ---------- Pit trabalhando: escada plataforma, caminhada, alcance com o dedo e toque nos comandos ---------- */
      const mkPonta = (m, sg) => { const g = new Group(); m.add(g);
        const f = new Group(); f.position.set(sg * -.185, -.2, 0); g.add(f); mesh(new CylinderGeometry(.062, .057, .55, 10), luva, 0, -.275, 0, f); mesh(new SphereGeometry(.058, 10, 8), luva, 0, -.55, 0, f);
        [-.065, .075, .2].forEach(x => { const q = new Group(); q.position.set(sg * x, -.2, .06); g.add(q); const a = mesh(new CylinderGeometry(.058, .054, .2, 10), luva, 0, -.02, .05, q); a.rotation.x = Math.PI / 2 - .35; mesh(new SphereGeometry(.064, 10, 8), luva, 0, 0, .15, q); });
        const pg = new Group(); pg.position.set(sg * -.27, -.04, .09); g.add(pg); const pc = mesh(new CylinderGeometry(.066, .06, .3, 10), luva, 0, 0, 0, pg); pc.rotation.set(.3, 0, sg * (Math.PI / 2 - .55)); return g; };
      bD.ponta = mkPonta(bD.mao, 1); bE.mao.children[0].scale.set(.95, .95, .62); bE.ponta = mkPonta(bE.mao, -1);
      bD.rock.visible = false;
      /* rádio laranja na mão direita (aparece só durante a comunicação) */
      const radioG = new Group(); radioG.visible = false; bD.mao.add(radioG);
      { const rl = M(0xf08a1c, { roughness: .45 }), rp = M(0x1a1b1e, { roughness: .6 });
        const cor = new Mesh(new BoxGeometry(.34, .8, .2), rl); cor.position.set(0, -.28, .06); radioG.add(cor);
        const tela = new Mesh(new BoxGeometry(.22, .14, .02), new MeshBasicMaterial({ color: 0x9ff0b8 })); tela.position.set(0, -.12, .17); radioG.add(tela);
        const alto = new Mesh(new BoxGeometry(.2, .16, .02), rp); alto.position.set(0, -.52, .17); radioG.add(alto);
        const ant = new Mesh(new CylinderGeometry(.03, .03, .55, 8), rp); ant.position.set(.11, -.9, .06); radioG.add(ant);
        const bot = new Mesh(new CylinderGeometry(.045, .045, .08, 10), rp); bot.rotation.x = Math.PI / 2; bot.position.set(-.1, -.27, .19); radioG.add(bot); }
      /* escada plataforma com rodinhas, corrimão e degraus */
      const esc = new Group(); ag.add(esc); const aco = M(0xb9bec2, { metalness: .75, roughness: .4 }), amar = M(0xe0a21b, { roughness: .6 });
      { const TOP = 3.8, PW = 2.5, PD = 1.9;
        const pl = new Mesh(new BoxGeometry(PW, .14, PD), M(0x8e9399, { metalness: .6, roughness: .5 })); pl.position.set(0, TOP, 0); esc.add(pl);
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => { const p = new Mesh(new CylinderGeometry(.06, .06, TOP, 8), aco); p.position.set(sx * (PW / 2 - .08), TOP / 2, sz * (PD / 2 - .08)); esc.add(p);
          const rd = new Mesh(new CylinderGeometry(.14, .14, .1, 14), preto); rd.rotation.z = Math.PI / 2; rd.position.set(sx * (PW / 2 - .08), .14, sz * (PD / 2 - .08)); esc.add(rd); }));
        [-1, 1].forEach(sx => { const tr = new Mesh(new BoxGeometry(.06, .06, PD), amar); tr.position.set(sx * (PW / 2 - .08), TOP + .95, 0); esc.add(tr); [-1, 1].forEach(sz => { const pp = new Mesh(new CylinderGeometry(.04, .04, .95, 8), amar); pp.position.set(sx * (PW / 2 - .08), TOP + .47, sz * (PD / 2 - .08)); esc.add(pp); }); });
        const fd = new Mesh(new BoxGeometry(PW, .06, .06), amar); fd.position.set(0, TOP + .95, -PD / 2 + .08); esc.add(fd);
        /* degraus descendo para o lado da câmera (+z) */
        const nd = 5; for(let i = 0; i < nd; i++){ const k = (i + 1) / (nd + .4); const dg = new Mesh(new BoxGeometry(PW - .5, .08, .5), M(0x7f858c, { metalness: .6 })); dg.position.set(0, TOP * (1 - k), PD / 2 + .2 + k * 2.6); esc.add(dg); }
        [-1, 1].forEach(sx => { const l = Math.hypot(2.6 + .2, TOP); const lat = new Mesh(new BoxGeometry(.06, l, .08), aco); lat.position.set(sx * (PW / 2 - .3), TOP / 2, PD / 2 + 1.5); lat.rotation.x = -Math.atan2(2.8, TOP); esc.add(lat); }); }
      const L = { fila: [], tar: null, fase: "ocioso", t: 0, st: { x: cfg.x, z: cfg.z, y: cfg.y, yaw: .55 }, alvoSt: null, plat: { x: cfg.x + 1.6, z: cfg.z + .2 }, platY: cfg.platY, braco: null, k: 0, anda: 0, rock: false, rockK: 0 };
      av.position.set(L.st.x, L.st.y, L.st.z); av.rotation.y = L.st.yaw; esc.position.set(L.plat.x, -6.0 + cfg.platY, L.plat.z);
      const qRestD = new Quaternion().setFromEuler(new Euler(.1, 0, -.5)), qRestE = new Quaternion().setFromEuler(new Euler(.1, 0, .5));
      const qCoRestD = new Quaternion().setFromEuler(new Euler(0, 0, 1.4)), qCoRestE = new Quaternion().setFromEuler(new Euler(0, 0, -1.4));
      const qRock = new Quaternion().setFromEuler(new Euler(-.3, 0, -.85)), qCoRock = new Quaternion().setFromEuler(new Euler(0, 0, -2.3));
      const pontos = {   /* ponto a tocar (no sistema do trolley, ou mundo para as caixas) */
        sd: () => T.localToWorld(new Vector3(1.44, 2.27, zf + .3)), lig: () => T.localToWorld(new Vector3(1.51, 1.67, zf + .3)), pot: () => T.localToWorld(new Vector3(1.6, 0.97, zf + .3)),
        emer: () => T.localToWorld(new Vector3(1.67, 0.28, zf + .42)), ferro: () => T.localToWorld(new Vector3(3.52, 2.42, zf + .75)),
        "fim-1": () => T.localToWorld(new Vector3(-5.62, 1.42, .5)), fim1: () => T.localToWorld(new Vector3(5.62, 1.42, .5)),
        lona: () => new Vector3(-4.2, 0.2, 2.9), radio: () => new Vector3(2.4, 0, 40), bat: () => { caixa_ref.updateMatrixWorld(true); return caixa_ref.localToWorld(new Vector3(.9, 0, 0)); }, porta: () => { caixa_ref.updateMatrixWorld(true); return caixa_ref.localToWorld(new Vector3(1.0, .3, 0)); } };
      const estacao = (id, W) => {
        if(id === "radio") return { x: -2.6, z: 5.6, y: -6.0, plat: false, face: 1 };
        if(id === "fim1") return { x: W.x + 1.9, z: 1.5, y: -2.2, plat: true, face: -1 };
        if(id === "bat" || id === "porta") return { x: W.x - 2.2, z: W.z + 1.3, y: -6.0, plat: false, face: 1 };
        if(id === "lona") return { x: -6.4, z: 3.3, y: -2.2, plat: true, face: 1 };
        if(id === "fim-1") return { x: W.x - 1.8, z: 1.6, y: -2.2, plat: true, face: 1 };
        return { x: W.x - 1.2, z: 3.15, y: -2.2, plat: true, face: 1 };
      };
      const U = 1.05, LL = 1.52, UP = new Vector3(0, 1, 0), AB = new Vector3(0, -1, 0);
      const alcance = (arm, sx, Wav) => {                 // Wav: ponto alvo no sistema do boneco
        const sh = new Vector3(sx * 1.05, 3.85, 0), d = Wav.clone().sub(sh); let dist = Math.min(U + LL - .05, Math.max(1.2, d.length())); const dh = d.clone().normalize();
        const al = Math.acos(MathUtils.clamp((U * U + dist * dist - LL * LL) / (2 * U * dist), -1, 1)), ph = Math.acos(MathUtils.clamp((U * U + LL * LL - dist * dist) / (2 * U * LL), -1, 1));
        const n = new Vector3().crossVectors(dh, UP).normalize(); if(n.lengthSq() < 1e-4) n.set(1, 0, 0);
        const up = dh.clone().applyAxisAngle(n, -al), qA = new Quaternion().setFromUnitVectors(AB, up);
        const nLoc = n.clone().applyQuaternion(qA.clone().invert()), qC = new Quaternion().setFromAxisAngle(nLoc, Math.PI - ph);
        return { qA, qC };
      };
      let caixa_ref = null;
      L.ligar = () => { caixa_ref = partes.baterias; };
      L.ligar();
      AV.tarefa = (id, fn) => { if(L.fila.length > 2){ fn(); return; } L.fila.push({ id, fn }); };
      L.tick = (dt) => {
        const st = L.st;
        if(L.rock){ L.rockK = Math.min(1, L.rockK + dt * 2.2); } else L.rockK = Math.max(0, L.rockK - dt * 2.2);
        if(!L.tar && L.fila.length){ const t = L.fila.shift(); const aqui = (cfg.platY === 0) === (mundo.position.x < 400); const W = (aqui && pontos[t.id]) ? pontos[t.id]() : null; if(W){ const e = estacao(t.id, W); e.y += mundo.position.y; if(Math.abs(e.x - st.x) > 60){ st.x = e.x; st.z = e.z; st.y = e.y; L.plat.x = e.x; L.plat.z = e.z + .1; } L.platY = e.plat ? mundo.position.y : L.platY; L.tar = { t, W, e, ok: false, fn: false, h: 0 }; L.fase = "ir"; L.t = 0; } else t.fn(); }
        const tr = L.tar;
        if(tr){ const e = tr.e;
          const dx = e.x - st.x, dz = e.z - st.z, dy = e.y - st.y, dd = Math.hypot(dx, dz, dy);
          if(L.fase === "ir"){
            const v = 6.5 * dt; if(dd <= v){ st.x = e.x; st.z = e.z; st.y = e.y; L.fase = "alcancar"; L.t = 0; } else { st.x += dx / dd * v; st.z += dz / dd * v; st.y += dy / dd * v; L.anda = Math.min(1, L.anda + dt * 6); }
            const yawAlvo = Math.atan2(tr.W.x - st.x, tr.W.z - st.z); let dyw = yawAlvo - st.yaw; while(dyw > Math.PI) dyw -= 2 * Math.PI; while(dyw < -Math.PI) dyw += 2 * Math.PI; st.yaw += dyw * Math.min(1, dt * 9);
            if(e.plat){ L.plat.x += (e.x - L.plat.x) * Math.min(1, dt * 7); L.plat.z += (e.z + .1 - L.plat.z) * Math.min(1, dt * 7); }
          } else {
            L.anda = Math.max(0, L.anda - dt * 8);
            const yawAlvo = Math.atan2(tr.W.x - st.x, tr.W.z - st.z); let dyw = yawAlvo - st.yaw; while(dyw > Math.PI) dyw -= 2 * Math.PI; while(dyw < -Math.PI) dyw += 2 * Math.PI; st.yaw += dyw * Math.min(1, dt * 9);
            if(e.plat){ L.plat.x += (e.x - L.plat.x) * Math.min(1, dt * 9); L.plat.z += (e.z + .1 - L.plat.z) * Math.min(1, dt * 9); }
            if(L.fase === "alcancar"){ L.t += dt; tr.h = Math.min(1, L.t / .38); if(tr.h >= 1){ L.fase = "toque"; L.t = 0; tr.t.fn(); } }
            else if(L.fase === "toque"){ L.t += dt; tr.h = 1; if(L.t > .32 && !(tr.t.id === "radio" && L.radioOn)){ L.fase = "recolher"; L.t = 0; } }
            else if(L.fase === "recolher"){ L.t += dt; tr.h = Math.max(0, 1 - L.t / .3); if(L.t >= .3){ L.tar = null; L.fase = "ocioso"; } }
          }
        } else L.anda = Math.max(0, L.anda - dt * 8);
        AV.nome.rotation.y = -st.yaw; av.position.set(st.x, st.y + (L.anda > .01 ? Math.abs(Math.sin(AV.t * 14)) * .1 * L.anda : 0), st.z); av.rotation.y = st.yaw;
        esc.position.set(L.plat.x, -6.0 + (L.platY || 0), L.plat.z);
        /* braços */
        const h = tr ? tr.h : 0; let Wd = null;
        let usaD = true, trabalha = h > 0 && tr && L.fase !== "ir";
        if(tr){ av.updateMatrixWorld(true); const Wav = av.worldToLocal(tr.W.clone()); usaD = Math.sin(st.yaw) >= 0; L.braco = usaD ? "D" : "E"; L.Wav = tr.t.id === "radio" ? new Vector3(-.12, 3.62, 1.38) : Wav; }
        const braco = L.braco === "E" ? bE : bD, sx = L.braco === "E" ? 1 : -1, outro = braco === bD ? bE : bD;
        const qRest = braco === bD ? qRestD : qRestE, qCoRest = braco === bD ? qCoRestD : qCoRestE;
        if(tr && h > 0){ const r = alcance(braco, sx, L.Wav); braco.pv.quaternion.slerpQuaternions(qRest, r.qA, h); braco.co.quaternion.slerpQuaternions(qCoRest, r.qC, h); }
        else if(!tr){ bD.pv.quaternion.slerpQuaternions(qRestD, qRock, L.rockK); bD.co.quaternion.slerpQuaternions(qCoRestD, qCoRock, L.rockK); bE.pv.quaternion.copy(qRestE); bE.co.quaternion.copy(qCoRestE); }
        if(tr){ const o = outro === bD ? [qRestD, qCoRestD] : [qRestE, qCoRestE]; outro.pv.quaternion.copy(o[0]); outro.co.quaternion.copy(o[1]); if(!(h > 0)){ braco.pv.quaternion.copy(qRest); braco.co.quaternion.copy(qCoRest); } }
        radioG.visible = !!(tr && tr.t.id === "radio"); if(radioG.visible) AV.cab.rotation.x = -.08;
        const mostraRock = !tr && L.rockK > .5; bD.rock.visible = mostraRock; bD.ponta.visible = false; bE.ponta.visible = false;
        const pa = mostraRock ? [.95, .95, .62] : [1.08, 1.08, 1.08]; bD.mao.children[0].scale.set(pa[0], pa[1], pa[2]); bE.mao.children[0].scale.set(1.08, 1.08, 1.08);
      };
      AV.lider = L.tick;
      AV.rock = (on) => { L.rock = !!on; };
      AV.radio = (on) => { if(on){ L.radioOn = true; L.fila.push({ id: "radio", fn: () => {} }); } else L.radioOn = false; };
      AV.limpa = () => { L.radioOn = false; L.fila.length = 0; L.tar = null; L.fase = "ocioso"; L.rock = false; };
    };
    avatar = pessoa3d({ nome: "Pit", x: 3.5, y: -6.0, z: 8, yaw: Math.PI, camisa: oliva, manga: oliva, calca: calca, pin: { barra: "#951c24", pil: 4, mosq: "#ece3cf" } });
    if(opts.lider){ criaLider(avatar, { x: 3.5, y: -6.0, z: 8, platY: 0 });
      /* Krig, o coordenador: igual ao Pit, de laranja e verde, trabalha no lançamento (fim do percurso) */
      avatar2 = pessoa3d({ nome: "Krig", x: 1593, y: 324.0, z: 8, yaw: .3, camisa: M(0xe8731a, { roughness: .7 }), manga: M(0x56642d), calca: M(0x4a5729), pin: { barra: "#e8731a", pil: 1, mosq: "#3b82e0" } });
      criaLider(avatar2, { x: 1593, y: 324.0, z: 8, platY: 330 }); }
    else if(H.cen){
      /* equipe do receptivo (2) e do lançamento (3): iguais ao Pit, mas de capacete laranja */
      const cap = M(0xe8731a, { roughness: .45, metalness: .1 }), verde = M(0x56642d), calcaV = M(0x4a5729);
      const pele = { clara: M(0xe6b996), morena: M(0xb27a52), media: M(0xd8a077), parda: M(0xa8714a) };
      const eq = [
        { nome: "THAYNARA", local: "rec", x: -5.2, z: 3, alvo: [-9.5, -1], pele: pele.morena, cabelo: 0x241510, rabo: true, barba: false, oculos: false, falaMsg: "THAYNARA · Operadora do recebimento. Recebe o cliente na chegada, ajuda a descer do deck e confere o equipamento." },
        { nome: "WESLLEY", local: "rec", x: 8.5, z: -1.5, alvo: [3.5, 0], pele: pele.parda, cabelo: 0x1e140d, barba: true, oculos: true, falaMsg: "WESLLEY · Operador do recebimento. Segura a escada e guia o cliente pela linha amarela." },
        { nome: "LORRANY", local: "lan", i: 0, pele: pele.clara, cabelo: 0xdcbc5c, rabo: true, barba: false, oculos: false, olhos: 0x3b6ea8 },
        { nome: "DENILSON", local: "lan", i: 1, pele: pele.media, cabelo: 0x1e140d, barba: true, oculos: true },
        { nome: "JHONATAN", local: "lan", i: 2, pele: pele.parda, cabelo: 0x1e140d, barba: false, oculos: true }
      ];
      H.npcs = []; H.pessoa3d = pessoa3d; H.M = M; H.pele = pele;
      eq.forEach((e, k) => {
        const L = H.cen.lancamento;
        const x = e.local === "rec" ? e.x : L.x, z = e.local === "rec" ? e.z : L.zs[e.i], y = e.local === "rec" ? -6.0 : L.y;
        const yaw = e.local === "rec" ? Math.atan2(e.alvo[0] - x, e.alvo[1] - z) : -Math.PI / 2 + (e.i - 1) * .25;
        const p = pessoa3d({ nome: e.nome, x, y, z, yaw, camisa: oliva, manga: oliva, calca: calcaV, pele: e.pele, capacete: cap, cabelo: e.cabelo, rabo: e.rabo, barba: e.barba, oculos: e.oculos, olhos: e.olhos, pin: { barra: "#0a0a0a", pil: 1 + k % 3, mosq: "#ece3cf" } });
        p.bD.rock.visible = false; p.bD.mao.children[0].scale.set(1.08, 1.08, 1.08);
        p.bD.pv.rotation.set(k % 2 ? -.2 : .05, 0, -.12); p.bD.co.rotation.set(k % 2 ? -1.3 : -.3, 0, 0);
        p.bE.pv.rotation.set(.05, 0, .12); p.bE.co.rotation.set(-.25, 0, 0);
        p.nome.rotation.y = 0; p.fase = k * 1.7; p.base = yaw; p.rotulo = e.nome; H.npcs.push(p);
        if(e.local === "rec"){ H.cen.colisores.push({ x0: x - .7, x1: x + .7, z0: z - .7, z1: z + .7 }); H.cen.hotspots.push({ id: "npc-" + e.nome.toLowerCase(), x, z, r: 3.4, rotulo: () => "Falar com " + e.nome, acao: null, msg: e.falaMsg }); }
      });
    }
  }

  /* cena: ajustes de câmera e controles */
  const ctl = new OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = 2.2; ctl.maxDistance = 70; ctl.zoomSpeed = 0.9; ctl.rotateSpeed = 0.8;
  const KC = opts.avatar ? 1.32 : 1;                    // com o ambiente 3D (deck e avatar) a câmera recua para dar mais espaço
  const base = { f: [0, 0.6 * KC - (KC > 1 ? 2 : 0), 21 * KC], b: [0, 1, -21 * KC], l: [21 * KC, 3, 7], e: [-21 * KC, -4, 7] };
  if(H.cen) Object.assign(base, { f: [9, -1, 30], b: [-9, 1, -30], l: [31, 3, 8], e: [-24, -2, 10] });
  let tampaOn = true, tampaT = 1, tween = null, selecionada = null;
  cam.position.set(...base.f); ctl.target.set(0, 0, 0);

  const cor = (g, c) => g.traverse(o => { if(o.isMesh && o.material && o.material.emissive){ o.material.emissive.set(c); } });
  const marcadores = {};
  function criarMarcador(id){
    const b = document.createElement("button"); b.type = "button"; b.className = "mk"; b.dataset.id = id; b.setAttribute("aria-label", opts.nome ? opts.nome(id) : id);
    b.textContent = opts.numero ? opts.numero(id) : ""; el.appendChild(b); marcadores[id] = b; }
  if(!opts.jogo) Object.keys(POS).filter(k => partes[k]).forEach(criarMarcador);

  function tempo(t){ return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function voar(pos, alvo, ms = 800){
    tween = { t0: performance.now(), ms, p0: cam.position.clone(), a0: ctl.target.clone(), p1: new Vector3(...pos), a1: new Vector3(...alvo) };
  }
  function vista(nome){
    if(nome === "b"){ definirTampa(false); }
    if(nome === "f" && !tampaOn){ /* mantém */ }
    voar(base[nome], [0, 0, 0]); selecionar(null);
  }
  function foco(id){
    const p = POS[id]; if(!p) return;
    if(p.vista === "b" && id !== "tampa") definirTampa(false);
    if(p.mod) definirModulo(true);
    const w = new Vector3(...p.p), dir = p.vista === "f" ? new Vector3(0.15, 0.1, 1) : p.vista === "b" ? new Vector3(-0.15, 0.15, -1) : p.vista === "e" ? new Vector3(-0.73, -0.69, 0.3) : new Vector3(1, 0.2, 0.35);
    dir.normalize(); voar([w.x + dir.x * p.d, w.y + dir.y * p.d, w.z + dir.z * p.d], [w.x, w.y, w.z]);
    selecionar(id);
  }
  function selecionar(id){
    if(selecionada && partes[selecionada]) cor(partes[selecionada], 0x000000);
    selecionada = id; if(id && partes[id]) cor(partes[id], 0x1b3a40);
    Object.values(marcadores).forEach(m => m.classList.toggle("sel", m.dataset.id === id));
    if(opts.aoSelecionar) opts.aoSelecionar(id);
  }
  function definirModulo(on){ modAberta = on; Object.keys(POS).filter(k => POS[k].mod).forEach(k => { partes[k].visible = on; }); if(opts.aoModulo) opts.aoModulo(on); }
  function definirTampa(on){ tampaOn = on; interior.visible = true; if(opts.aoTampa) opts.aoTampa(on); }

  /* ANDAR COM O PIT (só no ambiente com avatar, sem o modo de jogo do líder) */
  let andarMod = null;
  if(avatar && !opts.lider && H.cen){
    H.vistaFrente = () => vista("f");
    H.T = T;
    andarMod = criarAndar({ cam, ctl, renderer, el, AV: avatar, H, opts, voltar: () => vista("f") });
    H.andarMod = andarMod;
        if(!opts.jogo3d){ try{ H.mundo = criarMundo({ cena, cam, renderer, el, luzes: { hemi, amb, sol, sol2 }, H, opts }); }catch(err){ console.error("mundo vivo:", err); } }
  }
  if(avatar && !opts.lider && H.cen){
    H.jogo = criarJogo3D({ ag: H.AG, cam, renderer, pessoa3d: H.pessoa3d, M: H.M, pele: H.pele, equipe: H.npcs, lancamento: H.cen.lancamento, ceu: H.cen.ceu, cen: H.cen, pit: avatar, T, lona: H.cen.lona });
    H.personagens = () => [{ id: "pit", nome: (H.nomeJogador ? H.nomeJogador() : "Pit"), p: avatar }, ...(H.extraPersonagens ? H.extraPersonagens() : [])];
    H.AVT_PIT = avatar.av; H.editor = criarEditor({ cam, ctl, renderer, el, cena, H, render: () => renderer.render(cena, cam) });
    if(opts.jogo3d){ ctl.enabled = false; renderer.domElement.style.pointerEvents = "none"; Object.values(marcadores).forEach(b => { b.style.display = "none"; }); }
  }
  const andando = () => !!(andarMod && andarMod.ativo());
  const editando = () => !!(H.editor && H.editor.ativo());

  /* seleção por toque/clique (sem arrastar) */
  const ray = new Raycaster(), pt = new Vector2(); let d0 = null;
  renderer.domElement.addEventListener("pointerdown", e => { d0 = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if(andando() || editando()) return;
    if(!d0 || Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 5) return;
    if(J){ J.clique(e); return; }
    const r = renderer.domElement.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pt, cam);
    const alvos = []; Object.entries(partes).forEach(([id, g]) => { if(id === "tampa" && !tampaOn) return; if(tampaOn && (g.parent === interior || g.parent === interno || id === "modulo")) return; if(!g.visible) return; g.traverse(o => { if(o.isMesh && o.visible){ o.userData.pid = id; alvos.push(o); } }); });
    const hit = ray.intersectObjects(alvos, false)[0];
    if(hit) foco(hit.object.userData.pid);
  });
  renderer.domElement.addEventListener("pointermove", e => {
    if(J || andando() || editando()) return;
    const r = renderer.domElement.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pt, cam); const alvos = []; Object.entries(partes).forEach(([id, g]) => { if(id === "tampa" && !tampaOn) return; if(tampaOn && (g.parent === interior || g.parent === interno || id === "modulo")) return; if(!g.visible) return; g.traverse(o => { if(o.isMesh){ o.userData.pid = id; alvos.push(o); } }); });
    const hit = ray.intersectObjects(alvos, false)[0]; renderer.domElement.style.cursor = hit ? "pointer" : "grab"; });
  el.addEventListener("click", e => { const m = e.target.closest(".mk"); if(m){ e.stopPropagation(); foco(m.dataset.id); } });

  function ajustar(){ const w = el.clientWidth || 600, h = el.clientHeight || 400; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  new ResizeObserver(ajustar).observe(el); ajustar();

  /* =====================================================================
     MODO JOGO (opts.jogo): lona, caixa externa de baterias com porta de grade laranja, ferro (chave) de desengrenar, comandos animados
     ===================================================================== */
  let J = null;
  if(opts.jogo){
    mundo.add(partes.simples);                      // polias simples ficam no cabo quando o trolley sobe
    H.lev.forEach(o => { o.visible = false; });     // o ferro (chave) passa a ser uma peça solta
    const A = {};                                    // animações suaves: nome -> { v, t }
    const ani = (n, t, v0) => { const a = A[n] || (A[n] = { v: v0 === undefined ? t : v0, t }); a.t = t; return a; };
    const av = n => A[n].v;
    const lerp = (a, b, k) => a + (b - a) * k;
    const lerp2 = lerp, ease2 = k => sm(Math.max(0, Math.min(1, k)));
    const sm = k => k * k * (3 - 2 * k);
    const reg = {};                                  // alvos clicáveis: id -> { obj, anc() }
    const regis = (id, obj, anc) => { reg[id] = { obj, anc }; };
    const zb = -D / 2 - 0.1;                          // face de trás (tampa)

    /* --- lona preta de proteção --- */
    const lona = new Group(); cena.add(lona);
    { const pano = mat(0x0c0d0e, { roughness: .96, metalness: 0 });
      const corpo = new Mesh(placa(1.08, D + 0.9, 0.12), pano); corpo.scale.set(1.28, 1.02, 1); lona.add(corpo);
      for(let i = 0; i < 9; i++){ const d = new Mesh(new BoxGeometry(0.12 + (i % 3) * 0.05, 5.8 - (i % 4) * 0.7, 0.09), mat(0x050505, { roughness: 1 })); d.position.set(-5.2 + i * 1.3, (i % 2) * 0.2 - 0.1, (D + 0.9) / 2 + 0.1 + (i % 2) * 0.03); d.rotation.z = (i - 4) * 0.025; lona.add(d); }
      const lb = new Mesh(new PlaneGeometry(3.6, 0.8), new MeshBasicMaterial({ transparent: true, map: tex(360, 80, (c, w, h) => { c.fillStyle = "#56601f"; c.font = "bold 28px Arial"; c.textAlign = "center"; c.fillText("LONA · toque para tirar", w / 2, 50); }) }));
      lb.position.set(0, 0.2, (D + 0.9) / 2 + 0.22); lona.add(lb); H.lonaLb = lb; }
    regis("lona", lona, () => [0, 0.4, D / 2 + 0.6]);

    /* --- caixa externa de baterias: lateral esquerda de baixo (porta de grade de losangos laranja) --- */
    const caixa = H.caixa, porta = H.porta, bats = H.bats, BD = H.BD;
    const loc = (x, y, z) => { mundo.updateMatrixWorld(true); const v = new Vector3(x, y, z); caixa.localToWorld(v); mundo.worldToLocal(v); return [v.x, v.y, v.z]; };
    [1, 2].forEach(n => { ani("bat" + n, 0, 0); regis("bat" + n, bats[n].g, () => loc(bats[n].g.position.x + 0.3, bats[n].y, 0)); });
    regis("porta", porta, () => loc(BD + 0.35, 0.1, 0.9));
    ani("porta", 1, 1);           // 1 = aberta (ao começar), 0 = fechada

    /* --- ferro (chave de desengrenar) --- */
    const ferro = new Group(); T.add(ferro);
    { const fm = mat(0x8a5230, { roughness: .45, metalness: .55 });
      const eixo = new Mesh(new CylinderGeometry(0.11, 0.11, 0.5, 6), fm); eixo.rotation.x = Math.PI / 2; eixo.position.z = 0.2; ferro.add(eixo);
      const cab = new Mesh(new CylinderGeometry(0.09, 0.09, 1.5, 14), fm); cab.rotation.z = Math.PI / 2; cab.position.set(0.75, 0, 0.44); ferro.add(cab);
      const pun = new Mesh(new CylinderGeometry(0.14, 0.14, 0.6, 14), mat(0x141414, { roughness: .8 })); pun.rotation.z = Math.PI / 2; pun.position.set(1.4, 0, 0.44); ferro.add(pun); }
    ani("fenc", 0, 0); ani("fgir", 0, 0);
    const soq = new Mesh(new CylinderGeometry(0.11, 0.11, 0.04, 6), mat(0x050505)); soq.rotation.x = Math.PI / 2; soq.position.set(3.52, 2.42, zf + .15); T.add(soq);
    regis("ferro", ferro, () => { const p = ferro.position; return [p.x + 0.6 * Math.cos(ferro.rotation.z), p.y + 0.6 * Math.sin(ferro.rotation.z), p.z + 0.5]; });
    /* seta: sentido anti-horário, 90° */
    const seta = new Group(); seta.position.set(3.52, 2.42, zf + .75); T.add(seta);
    { const smat = new MeshBasicMaterial({ color: 0xe0883a });
      const arc = new Mesh(new TorusGeometry(1.0, 0.045, 8, 36, Math.PI / 2), smat); seta.add(arc);
      const ponta = new Mesh(new CylinderGeometry(0, 0.14, 0.3, 12), smat); ponta.position.set(0, 1.0, 0); ponta.rotation.z = Math.PI / 2; seta.add(ponta); }
    seta.visible = false;

    /* --- fim de curso: rolete clicável de cada lado --- */
    [-1, 1].forEach(sd => { regis("fim" + sd, [H.fcRo[sd], H.fcCx[sd]], () => [H.fcRo[sd].position.x, H.fcRo[sd].position.y, H.fcRo[sd].position.z + 0.3]); ani("fim" + sd, 0, 0); });

    regis("furo", partes.furo, () => [4.9, CABO_Y + 0.4 + T.position.y, 0]);

    /* --- estado dos comandos (valores animados) --- */
    ani("sd", 0, 0); ani("lig", 0, 0); ani("pot", 0, 0); ani("emP", 0, 0); ani("emG", 0, 0); ani("rise", 0, 0); ani("lonaT", 0, 0);
    ani("pot", 0.5, 0.5); ani("sd", -1, -1);          // ao começar: sobe/desce em SOBE e potenciômetro no meio (para o jogador colocar tudo em neutro)
    const pintaVolt = (t, txt, on) => { const c = t.image, x = c.getContext("2d"); x.fillStyle = "#050606"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = on ? "#ff3b2f" : "#3a1512"; x.font = "bold 34px monospace"; x.textAlign = "center"; x.fillText(txt, c.width / 2, 44); t.needsUpdate = true; };
    pintaVolt(H.vt1, "----", false); pintaVolt(H.vt2, "----", false);

    /* destaque pulsante dos alvos da etapa + marcadores */
    let dicas = [], mj = {}, relogioJ = 0;
    const lista = (a) => Array.isArray(a.obj) ? a.obj : [a.obj];
    const emis = (obj, k) => (obj === lona) ? 0 :  (Array.isArray(obj) ? obj : [obj]).forEach(ob => ob.traverse(o => { if(o.isMesh && o.material && o.material.emissive && o !== H.lonaLb){ o.material.emissive.setRGB(0.4 * k, 0.2 * k, 0.03 * k); } }));
    function marcar(ids){
      Object.keys(mj).forEach(k => { if(!ids.includes(k)){ mj[k].remove(); delete mj[k]; if(reg[k]) emis(reg[k].obj, 0); } });
      ids.forEach(k => { if(mj[k] || !reg[k]) return; const b = document.createElement("button"); b.type = "button"; b.className = "mk"; b.dataset.id = k; b.textContent = "●"; b.setAttribute("aria-label", "alvo " + k); el.appendChild(b); mj[k] = b; });
      dicas = ids.slice();
    }
    el.addEventListener("click", e => { const m = e.target.closest(".mk"); if(m && m.dataset.id && reg[m.dataset.id]){ e.stopPropagation(); if(opts.aoJogo) opts.aoJogo(m.dataset.id, { marcador: true }); } }, true);

    /* câmeras */
    const CAM = {
      frente: [[0, 0.8, 24], [0, 0.2, 0]], painel: [[5.0, 2.6, 15.5], [1.9, 1.0, 2]], costas: [[0, -1.0, -13.5], [0, -1.6, -3]], bateria: [[-4.5, -2.4, 15], [-5.4, -2.0, 0.8]],
      ferro: [[9.5, 2.8, 15.5], [2.6, 0.9, 2]], furo: [[13.5, 3.2, 6.5], [4.7, 1.6, 0]], fimE: [[-9.8, 3, 10.5], [-5.2, 1.1, 0.5]], fimD: [[9.8, 3, 10.5], [5.2, 1.1, 0.5]]
    };
    function camera(n, ms){ const c = CAM[n]; if(!c) return; const mp = mundo.position; voar([c[0][0] + mp.x, c[0][1] + mp.y, c[0][2]], [c[1][0] + mp.x, c[1][1] + mp.y, c[1][2]], ms || 900); }

    function aplicar(){
      const e = k => sm(Math.max(0, Math.min(1, k)));
      /* lona */
      const lt = e(av("lonaT")); lona.position.set(0, 9 * lt, 4 * lt); lona.rotation.x = -0.5 * lt; lona.visible = lt < 0.98;
      lona.traverse(o => { if(o.isMesh && o.material){ o.material.transparent = true; o.material.opacity = 1 - lt * 0.9; } });
      /* comandos */
      H.sdAl.position.x = 1.44 + av("sd") * 0.28;
      H.ligPv.rotation.z = lerp(0.9, -0.9, av("lig"));
      H.potPv.rotation.z = lerp(1.0, -1.0, av("pot"));
      H.emPv.position.z = H.emZ - 0.1 * av("emP"); H.emPv.rotation.z = -av("emG");
      /* sobe */
      T.position.y = 0.22 * e(av("rise"));
      /* ferro */
      const f1 = e(av("fenc")), f2 = e(av("fgir"));
      ferro.position.set(lerp(5.2, 3.52, f1), lerp(-2.5, 2.42, f1), lerp(zf + 1.6, zf + .15, f1) + Math.sin(Math.PI * f1) * 1.2);
      ferro.rotation.set(0, lerp(-0.4, 0, f1), lerp(0.5, 0, f1) + f2 * Math.PI / 2);
      /* porta (1 = aberta) e baterias (entram pela porta, no sentido -x local) */
      const po = e(av("porta")); porta.rotation.z = po * Math.PI / 2;
      [1, 2].forEach(n => { const k = e(av("bat" + n)); bats[n].g.position.x = lerp(2.9, 0.35, k); });
      /* o que está escondido pela lona */
      const sob = lt > 0.25; caixa.visible = sob; ferro.visible = sob;
      /* fim de curso */
      [-1, 1].forEach(sd => { const ro = H.fcRo[sd], k = av("fim" + sd); ro.position.x = sd * 5.18 + sd * (0.42 - 0.22 * k); });
    }

    /* animação (chamada a cada quadro) */
    function tick(dt){
      relogioJ += dt;
      Object.values(A).forEach(a => { const d = a.t - a.v; a.v = Math.abs(d) < 0.0008 ? a.t : a.v + d * Math.min(1, dt * 6.5); });
      aplicar();
      const k = 0.45 + 0.45 * Math.sin(relogioJ * 5);
      dicas.forEach(id => { if(reg[id]) emis(reg[id].obj, k); });
      seta.visible = seta.userData.on && av("fgir") < 0.05; seta.rotation.z = 0;
      Object.entries(mj).forEach(([id, b]) => { const r = reg[id]; if(!r) return; const a = r.anc(); const p = new Vector3(a[0], a[1], a[2]); mundo.localToWorld(p);
        p.project(cam); const vis = p.z < 1 && (lona.visible ? id === "lona" : true);
        b.style.display = vis ? "" : "none"; b.style.left = ((p.x * .5 + .5) * el.clientWidth) + "px"; b.style.top = ((-p.y * .5 + .5) * el.clientHeight) + "px"; });
    }
    /* clique no 3D */
    function clique(e){
      const r = renderer.domElement.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pt, cam);
      const alvos = [];
      Object.entries(reg).forEach(([id, a]) => { if(lona.visible && id !== "lona") return; lista(a).forEach(ob => { if(ob.visible) ob.traverseVisible(o => { if(o.isMesh){ o.userData.jid = id; alvos.push(o); } }); }); });
      const hit = ray.intersectObjects(alvos, false)[0]; if(!hit) return;
      if(opts.aoJogo) opts.aoJogo(hit.object.userData.jid, { dx: hit.point.x, dy: hit.point.y });
    }
    /* carga: 12 bolsas zip (maleta de lona preta), 2 haulbags (mochilas pretas) e 1 haulbag de câmeras (amarela/laranja, listra preta, logo SGV) penduradas nas malhas rápidas */
    const bolsas = { L: [], R: [] };
    { const preto = mat(0x0b0b0d, { roughness: .92, metalness: .02, emissive: 0x17181c }), cinza = mat(0x3a3d42, { roughness: .6, metalness: .5 }), amarelo = mat(0xf2a31b, { roughness: .8 });
      const alca = (y, r = .13) => { const a = new Mesh(new TorusGeometry(r, .022, 8, 18, Math.PI), preto); a.position.set(0, y, 0); return a; };
      const mkZip = () => { const g = new Group(); const b = new Mesh(new BoxGeometry(0.6, 0.7, 0.3), preto); g.add(b);
        const zp = new Mesh(new BoxGeometry(0.56, 0.025, 0.31), cinza); zp.position.y = 0.33; g.add(zp); const bolso = new Mesh(new BoxGeometry(0.4, 0.28, 0.02), mat(0x16171a, { roughness: .9 })); bolso.position.set(0, -0.1, 0.16); g.add(bolso); g.add(alca(0.35, .14)); return g; };
      const mkHaul = () => { const g = new Group(); const b = new Mesh(new BoxGeometry(0.56, 0.86, 0.4), preto); g.add(b);
        [-1, 1].forEach(sx => { const f = new Mesh(new BoxGeometry(0.07, 0.6, 0.02), cinza); f.position.set(sx * .16, 0, 0.21); g.add(f); }); const bol = new Mesh(new BoxGeometry(0.4, 0.26, 0.05), mat(0x15161a, { roughness: .9 })); bol.position.set(0, -.22, .22); g.add(bol); g.add(alca(0.43, .12)); return g; };
      const mkCam = () => { const g = new Group(); const b = new Mesh(new BoxGeometry(0.46, 0.48, 0.3), amarelo); g.add(b); const lst = new Mesh(new BoxGeometry(0.47, 0.08, 0.31), preto); lst.position.y = 0.14; g.add(lst);
        const lg2 = new Mesh(new PlaneGeometry(0.34, 0.16), new MeshBasicMaterial({ transparent: true, map: logoCv("#111111", 340, 160), depthWrite: false })); lg2.position.set(0, -0.06, 0.152); g.add(lg2); g.add(alca(0.24, .1)); return g; };
      const fab = { z: mkZip, h: mkHaul, c: mkCam };
      const slots = [[-3.95, -3.05], [-4.85, -3.05], [-5.75, -3.05], [-4.4, -4.2], [-5.3, -4.2], [-6.2, -4.2], [-3.5, -4.2]];
      const mkLiga = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const m = new Mesh(new CylinderGeometry(0.012, 0.012, d, 6), cinza); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); m.rotation.z = Math.atan2(-(b[0] - a[0]), b[1] - a[1]); return m; };
      const gb = new Group(); T.add(gb);
      [["L", -1], ["R", 1]].forEach(([lado, sg]) => { slots.forEach(([sx, sy], i) => {
        const slot = new Group(); slot.visible = false; slot.userData.tipos = {};
        Object.entries(fab).forEach(([k, f]) => { const bg = f(); bg.scale.setScalar(1.45); bg.position.set(sg * Math.abs(sx), sy, zf + .25 + (i % 2) * .12); bg.visible = false; slot.add(bg); slot.userData.tipos[k] = bg; });
        const mx = sg * (3.78 + i * .1) * 1, my = -1.95 - i * .06; slot.add(mkLiga([sg * (3.78 + i * .1), my], [sg * Math.abs(sx), sy + .62])); slot.children[slot.children.length - 1].position.z = zf + .12;
        gb.add(slot); bolsas[lado].push(slot); }); });
      H.fabBolsa = fab; }

    /* mola com tecnil que aciona o fim de curso nas pontas do cabo (lançamento à direita, recebimento à esquerda) */
    const molaFim = (sg) => { const g = new Group(); cena.add(g); const cob = mat(0xb9bec2, { metalness: .85, roughness: .3 }), ouro = mat(0xd4a437, { metalness: .8, roughness: .35 });
      const placa = new Mesh(new CylinderGeometry(0.78, 0.78, 0.14, 28), mat(0x2b2f33, { metalness: .5 })); placa.rotation.z = Math.PI / 2; g.add(placa);
      const bobina = new Group(); g.add(bobina); for(let i = 0; i < 9; i++){ const r = new Mesh(new TorusGeometry(0.52, 0.075, 10, 24), cob); r.rotation.y = Math.PI / 2; r.position.x = sg * (0.2 + i * 0.2); bobina.add(r); }
      const tec = new Mesh(new CylinderGeometry(0.17, 0.17, 0.55, 16), ouro); tec.rotation.z = Math.PI / 2; tec.position.x = sg * 2.25; g.add(tec); const anel = new Mesh(new TorusGeometry(0.2, 0.04, 8, 18), ouro); anel.rotation.y = Math.PI / 2; anel.position.x = sg * 2.0; g.add(anel);
      g.position.set(sg * 16, CABO_Y, 0); return { g, bobina }; };
    /* ===== PERCURSO DE 720 m: o trolley sai do deck do Pit e sobe pelo cabo até o lançamento, com a paisagem passando ao fundo (só o lado dos botões) ===== */
    const KX = 2.2, HH = 330, clampM = m => Math.max(0, Math.min(720, m));
    const pY = m => HH * Math.pow(clampM(m) / 720, 2.2), pAng = m => Math.atan((HH * 2.2 / 720 * Math.pow(clampM(m) / 720, 1.2)) / KX);
    const mL = molaFim(1), mR = molaFim(-1);                                 // esquerda: junto ao deck (recebimento) · direita: no lançamento
    if(H.AG){ const AG = H.AG; const xe = KX * 720, ye = pY(720), ae = pAng(720), rs = Math.sin(ae), rc = Math.cos(ae);
      mL.g.position.set(-14, CABO_Y, 0);
      mR.g.position.set(xe + 8.2 * rc - CABO_Y * rs, ye + 8.2 * rs + CABO_Y * rc, 0); mR.g.rotation.z = ae;
      /* cabo longo, parado, seguindo o percurso (curva que vai ficando mais inclinada) */
      const pts = []; for(let m = -30; m <= 760; m += 10) pts.push(new Vector3(KX * m, pY(m) + CABO_Y * Math.cos(pAng(m)), 0));
      const cl = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), 260, 0.075, 8, false), mat(0x9aa0a4, { metalness: .8, roughness: .35 })); AG.add(cl);
      /* vale lá embaixo, com mata, paredão do cânion ao fundo e a plataforma de lançamento no alto */
      const tv = tex(256, 256, (x, w, h) => { x.fillStyle = "#2c4a24"; x.fillRect(0, 0, w, h); for(let i = 0; i < 2500; i++){ x.fillStyle = ["#223a1b", "#34562a", "#1b3016", "#3f6330"][i % 4]; x.fillRect((i * 83) % w, (i * 61 + (i >> 2) * 7) % h, 3, 3); } });
      tv.wrapS = tv.wrapT = RepeatWrapping; tv.repeat.set(60, 40);
      const vale = new Mesh(new PlaneGeometry(5000, 3000), new MeshStandardMaterial({ map: tv, roughness: 1 })); vale.rotation.x = -Math.PI / 2; vale.position.set(1100, -300, -500); AG.add(vale);
      const trc = tex(256, 512, (x, w, h) => { x.fillStyle = "#8a5a3c"; x.fillRect(0, 0, w, h); for(let i = 0; i < 28; i++){ x.fillStyle = ["#7a4a30", "#9a6a46", "#6b3f29", "#a77752"][i % 4]; x.fillRect(0, i * h / 28, w, h / 28 - 3); } for(let i = 0; i < 120; i++){ x.fillStyle = "rgba(30,20,12,.25)"; x.fillRect((i * 71) % w, (i * 37) % h, 3, 40 + i % 30); } });
      trc.wrapS = trc.wrapT = RepeatWrapping; trc.repeat.set(30, 3);
      const mrock = new MeshStandardMaterial({ map: trc, roughness: .95 });
      const parede = new Mesh(new BoxGeometry(2200, 300, 60), mrock); parede.position.set(1150, -150, -460); AG.add(parede);
      const parede2 = new Mesh(new BoxGeometry(700, 360, 60), mrock); parede2.position.set(1500, -120, -300); AG.add(parede2);
      const penhasco = new Mesh(new BoxGeometry(40, 300, 700), mrock); penhasco.position.set(350, -156, 0); AG.add(penhasco);                   // borda do platô onde fica o deck
      const mesa = new Mesh(new BoxGeometry(260, 623.5, 160), mrock); mesa.position.set(xe + 80, 11.75, 0); AG.add(mesa);
      const tdk = new MeshStandardMaterial({ map: H.tdeck, roughness: .85 });
      const dk2 = new Mesh(new BoxGeometry(240, .5, 140), tdk); dk2.position.set(xe + 80, 323.75, 0); AG.add(dk2);
      const ca = new Mesh(new BoxGeometry(34, 14, 24), mat(0x6b6155, { roughness: .9 })); ca.position.set(xe + 140, 331, -40); AG.add(ca);
      const te = new Mesh(new BoxGeometry(38, 1.4, 28), mat(0x2a2e34)); te.position.set(xe + 140, 338.4, -40); AG.add(te);
      [-1, 1].forEach(sz => { for(let k = 0; k < 9; k++){ const pp = new Mesh(new BoxGeometry(.4, 4, .4), mat(0x3b2a18)); pp.position.set(xe - 36 + k * 24, 326, sz * 68); AG.add(pp); } const rl = new Mesh(new BoxGeometry(200, .25, .25), mat(0xd9d4c4)); rl.position.set(xe + 60, 327.6, sz * 68); AG.add(rl); });
      const tl = tex(256, 64, (x, w, h) => { x.fillStyle = "#1a2a1a"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffb36b"; x.font = "bold 26px Arial"; x.textAlign = "center"; x.fillText("LANÇAMENTO", w / 2, 42); });
      const pl = new Mesh(new PlaneGeometry(26, 6.5), new MeshBasicMaterial({ map: tl })); pl.position.set(xe + 80, 336, 70.5); AG.add(pl);
      /* mata no vale */
      const N = 700, arv = new InstancedMesh(new ConeGeometry(1, 3, 6), new MeshStandardMaterial({ color: 0x1f3d1d, roughness: 1 }), N), dm = new Object3D(); let sd = 7;
      const rd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for(let i = 0; i < N; i++){ const x = 360 + rd() * 1700, z = -420 + rd() * 560, e = 5 + rd() * 9; dm.position.set(x, -300 + e * 1.5, z); dm.scale.set(e * .5, e, e * .5); dm.updateMatrix(); arv.setMatrixAt(i, dm.matrix); } AG.add(arv); }
    if(H.AG) H.AG.updateMatrixWorld(true);
    let prevP = new Vector3(0, 0, 0);
    const tr = (id, fn) => { const q = (mundo.position.x > 400 && avatar2 && avatar2.tarefa) ? avatar2 : avatar; return (q && q.tarefa) ? q.tarefa(id, fn) : fn(); };
    J = {
      tick, clique, marcar, camera, liderRock: on => { if(avatar && avatar.rock) avatar.rock(on); }, liderRadio: on => { if(avatar && avatar.radio) avatar.radio(on); },
      lona: on => tr("lona", () => { ani("lonaT", on ? 0 : 1); }),
      carga: (l, r) => { [["L", l], ["R", r]].forEach(([lado, lista]) => bolsas[lado].forEach((slot, i) => { const tp = lista[i]; slot.visible = !!tp; Object.entries(slot.userData.tipos).forEach(([k, g]) => { g.visible = k === tp; }); })); },
      deslocar: m => { (H.simplesR || []).forEach(r => { r.rotation.y = -m * 0.5; });
        const x = KX * m, y = pY(m); mundo.position.set(x, y, 0); mundo.rotation.z = pAng(m);
        const d = new Vector3(x - prevP.x, y - prevP.y, 0);
        if(d.lengthSq() > 0){ cam.position.add(d); ctl.target.add(d); if(tween){ ["p0", "a0", "p1", "a1"].forEach(k => tween[k].add(d)); } prevP.set(x, y, 0); }
        if(H.skyG){ H.skyG.position.set(x, y, 0); H.mts.forEach(o => { o.m.position.x = x; o.m.rotation.y = x * o.f; }); }
        const ap = ease2((m - 716) / 4), apl = ease2((4 - m) / 4); mR.bobina.scale.x = 1 - .25 * ap; mL.bobina.scale.x = 1 - .25 * apl; },
      comando: (c, v) => tr(c, () => { ani(c === "emer" ? "emP" : c, v); }),
      destravar: () => tr("emer", () => { ani("emG", 0.9); setTimeout(() => { ani("emP", 0); A.emG.v = 0; A.emG.t = 0; }, 380); }),
      valor: n => A[n] ? A[n].t : 0,
      porta: aberta => tr("porta", () => ani("porta", aberta ? 1 : 0)),
      bateria: (n, dentro) => tr("bat", () => ani("bat" + n, dentro ? 1 : 0)),
      ferro: (enc, gir) => tr("ferro", () => { ani("fenc", enc ? 1 : 0); ani("fgir", gir ? 1 : 0); ani("rise", gir ? 1 : 0); }),
      seta: on => { seta.userData.on = on; },
      fim: (sd) => tr("fim" + sd, () => { ani("fim" + sd, 1); setTimeout(() => ani("fim" + sd, 0), 900); }),
      volt: (a, b, on) => { pintaVolt(H.vt1, a, on); pintaVolt(H.vt2, b, on); },
      reiniciar(){
        [avatar, avatar2].forEach(q => { if(q && q.limpa) q.limpa(); });
        ani("lonaT", 0, 0); ani("sd", -1, -1); ani("lig", 0, 0); ani("pot", 0.5, 0.5); ani("emP", 0, 0); ani("emG", 0, 0); ani("rise", 0, 0);
        ani("fenc", 0, 0); ani("fgir", 0, 0); ani("porta", 1, 1); ani("bat1", 0, 0); ani("bat2", 0, 0); ani("fim-1", 0, 0); ani("fim1", 0, 0);
        seta.userData.on = false; pintaVolt(H.vt1, "----", false); pintaVolt(H.vt2, "----", false); marcar([]);
      }
    };
  }

  const v = new Vector3(), cp = new Vector3();
  let vivo = true, ult = performance.now();
  function quadro(){
    if(!vivo) return; requestAnimationFrame(quadro);
    if(el.clientWidth === 0 || el.clientHeight === 0) return;      // (offsetParent seria nulo em tela cheia)
    const agora = performance.now(), dtq = Math.min(0.05, (agora - ult) / 1000); ult = agora; if(J) J.tick(dtq);
    if(H.neonPinta){ H.neonT = (H.neonT || 0) + dtq; H.neonC = (H.neonC || 0) + 1; if(H.neonC % 3 === 0) H.neonPinta(H.neonT); }
    [avatar, avatar2].forEach(AVT => { if(!AVT) return; AVT.t += dtq; const t = AVT.t; AVT.tronco.scale.y = 1 + .012 * Math.sin(t * 2.1); AVT.cab.rotation.set(0.03 * Math.sin(t * 1.3), .22 + .16 * Math.sin(t * .7), .05 * Math.sin(t * 1.1)); if(AVT.lider) AVT.lider(dtq); else AVT.bD.co.rotation.z = -2.3 + .07 * Math.sin(t * 3.2); });
    if(tween){ const k = Math.min(1, (performance.now() - tween.t0) / tween.ms), e = tempo(k);
      cam.position.lerpVectors(tween.p0, tween.p1, e); ctl.target.lerpVectors(tween.a0, tween.a1, e); if(k >= 1) tween = null; }
    /* tampa: desliza para trás ao ser removida */
    const alvoT = tampaOn ? 1 : 0; tampaT += (alvoT - tampaT) * 0.12; tampa.position.z = (1 - tampaT) * -9; tampa.rotation.y = (1 - tampaT) * 0.5; tampa.visible = tampaT > 0.02;
    modT += ((modAberta ? 1 : 0) - modT) * 0.14; dobr.rotation.y = -modT * 1.95;
    if(opts.jogo3d && H.jogo) H.jogo.quadro(dtq, performance.now() / 1000); else if(andando()) andarMod.tick(dtq); else ctl.update();
    if(H.mundo) H.mundo.tick(dtq);
      if(H.cen && !andando()) H.cen.tick(dtq, 9999, 9999);
      if(H.cen && H.cen.ceu) H.cen.ceu.position.set(cam.position.x, 0, cam.position.z);
      if(H.jogo && !opts.jogo3d) H.jogo.rotulos();
      if(H.npcs){ const tn = performance.now() / 1000; H.npcs.forEach(p => { const s = Math.sin(tn * 1.3 + p.fase); p.tronco.scale.y = 1 + s * .008; p.cab.rotation.y = Math.sin(tn * .45 + p.fase) * .35; p.cab.rotation.x = Math.sin(tn * .7 + p.fase * 2) * .04; p.nome.rotation.y = Math.atan2(cam.position.x - p.av.position.x, cam.position.z - p.av.position.z) - p.av.rotation.y; }); }
    if(H.editor) H.editor.frame();
    renderer.render(cena, cam);
    cam.getWorldPosition(cp);
    Object.entries(marcadores).forEach(([id, m]) => {
      if(andando()){ m.style.display = "none"; return; }
      const p = POS[id]; v.set(...p.p).project(cam);
      const frente = cp.z > 0.5, tras = cp.z < -0.5;
      let ok = p.vista === "f" ? frente : p.vista === "b" ? (tras && (!tampaOn || id === "tampa")) : p.vista === "e" ? cp.x < -3 : p.vista === "l" ? cp.x > 3 : true;
      if(id === "tampa") ok = tras && tampaOn;
      if(p.mod) ok = ok && modAberta;
      ok = ok && v.z < 1;
      m.style.display = ok ? "" : "none";
      m.style.left = ((v.x * .5 + .5) * el.clientWidth) + "px"; m.style.top = ((-v.y * .5 + .5) * el.clientHeight) + "px";
    });
  }
  quadro();

  return {
    editar: (on) => (H.editor ? H.editor.editar(on !== false) : false), editando, editor: H.editor, _cena: cena, jogo3d: H.jogo, cena: (n) => { if(!H.jogo || !H.jogo.cenasTeste[n]) return false; H.jogo.cenasTeste[n](); return true; },
    camera: (p, a) => { tween = null; ctl.maxDistance = Math.max(70, Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]) + 5); cam.position.set(...p); ctl.target.set(...a); ctl.update(); },
    mundo: H.mundo, andar: (on) => (andarMod ? (on === false ? andarMod.desligar() : andarMod.ligar()) : false), andando, podeAndar: !!andarMod, andarDbg: () => andarMod && andarMod.estado(), andarMod,
    foco, vista, selecionar, tampa: definirTampa, tampaOn: () => tampaOn, modulo: definirModulo, moduloAberto: () => modAberta,
    dbg: () => ({ pit: avatar && avatar.av.position.toArray(), krig: avatar2 && avatar2.av.position.toArray(), mundo: mundo.position.toArray(), tp: avatar2 && !!avatar2.tarefa }),
    jogo: J, destruir(){ vivo = false; try{ renderer.dispose(); renderer.domElement.remove(); }catch(_){ /* já liberado */ } }
  };
}
