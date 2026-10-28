import { Group, Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial } from "three";
import { canvasTex, mat } from "./lib.js";

/* ============================================================================================================
   PACOTE MÍDIA: câmera 360° (estilo Insta360) com a etiqueta "CAMERA 2", presa por cordão amarelo trançado a um bastão (pau de selfie)
   preto telescópico com fita isolante. O cliente leva a câmera clipada numa das ancoragens do cinto, nas costas (escápula), e segura o
   bastão com a mão esquerda. Tamanho real: câmera ≈ 4,6 × 12,5 cm; bastão ≈ 60 cm fechado. 1 m = 2,94 u.
   ============================================================================================================ */
const etiqueta = () => canvasTex(64, 200, (c, w, h) => {
  c.fillStyle = "#ecebe6"; c.fillRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI / 2);
  c.fillStyle = "#6a625a"; c.font = "bold 36px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("CAMERA 2", 0, 0); c.restore();
});

/** devolve um grupo com origem no cabo do bastão (base do bastão em y = 0; o bastão sobe em +y e a câmera fica no topo, lente para +z) */
export function camera360({ escala = 1, comprimento = 1.7, cordao = true } = {}){
  const g = new Group();
  const preto = mat(0x0e0f11, { roughness: .45, metalness: .25 }), fosco = mat(0x1a1b1e, { roughness: .8 }), amar = mat(0xe0b020, { roughness: .9 });
  const pole = new Mesh(new CylinderGeometry(.045, .045, comprimento, 14), preto); pole.position.y = comprimento / 2; g.add(pole);
  const base = new Mesh(new CylinderGeometry(.052, .052, comprimento * .45, 14), mat(0x15161a, { roughness: .95 })); base.position.y = comprimento * .225; g.add(base);   // empunhadura
  const fita = new Mesh(new CylinderGeometry(.049, .049, .12, 14), mat(0x050506, { roughness: .6 })); fita.position.y = comprimento * .52; g.add(fita);                // fita isolante
  const cam = new Group(); cam.position.y = comprimento + .2; g.add(cam);
  const corpo = new Mesh(new BoxGeometry(.15, .4, .12), preto); cam.add(corpo);
  const lenteGuard = new Mesh(new BoxGeometry(.15, .18, .02), preto); lenteGuard.position.set(0, .12, .069); cam.add(lenteGuard);
  [1, -1].forEach(s => {
    const lente = new Mesh(new CylinderGeometry(.052, .056, .035, 18), mat(0x040508, { roughness: .15, metalness: .8 })); lente.rotation.x = Math.PI / 2; lente.position.set(0, .12, s * .075); cam.add(lente);
    const vidro = new Mesh(new SphereGeometry(.04, 14, 10), mat(0x182230, { roughness: .05, metalness: .9 })); vidro.position.set(0, .12, s * .09); vidro.scale.z = .5; cam.add(vidro);
  });
  const et = new Mesh(new PlaneGeometry(.062, .2), new MeshBasicMaterial({ map: etiqueta() })); et.position.set(0, -.02, .0705); cam.add(et);
  [-.025, .025].forEach(x => { const led = new Mesh(new BoxGeometry(.018, .008, .006), new MeshBasicMaterial({ color: 0xffffff })); led.position.set(x, .0, .072); cam.add(led); });
  [[-.045, -.08], [.045, -.08], [-.045, .06], [.045, .06]].forEach(([x, y]) => { const f = new Mesh(new BoxGeometry(.016, .06, .006), fosco); f.position.set(x, y - .03, .071); cam.add(f); });
  const nuca = new Mesh(new CylinderGeometry(.034, .034, .16, 12), mat(0x2a2b2e, { metalness: .6, roughness: .4 })); nuca.position.y = comprimento + .02; g.add(nuca);
  if(cordao){
    for(let k = 0; k < 6; k++){ const v = new Mesh(new TorusGeometry(.056, .016, 6, 14), amar); v.rotation.x = Math.PI / 2; v.position.y = comprimento * .3 + k * .03; g.add(v); }   // voltas de cordão na empunhadura
    const no = new Mesh(new TorusGeometry(.05, .02, 6, 12), amar); no.rotation.x = Math.PI / 2; no.position.y = comprimento - .02; g.add(no);
    const solto = new Mesh(new CylinderGeometry(.012, .012, 1.3, 6), amar); solto.position.set(.12, comprimento * .2 - .5, 0); solto.rotation.z = .08; g.add(solto);               // ponta solta do cordão
    const mosq = new Mesh(new TorusGeometry(.07, .014, 8, 16), mat(0x7c8085, { metalness: .85, roughness: .3 })); mosq.scale.y = 1.5; mosq.position.set(.14, comprimento * .2 - 1.15, 0); g.add(mosq);   // mosquetão de aço
  }
  g.scale.setScalar(escala);
  return g;
}

/** cadeirinha ZipRider (vídeos): assento-bolsa preto com faixa vermelha e argola em D, encosto em Y e alças de peito */
export function cadeirinhaZip(metal = mat(0x8a8f94, { metalness: .85, roughness: .3 })){
  const g = new Group(), pr = mat(0x17181c, { roughness: .85 }), pr2 = mat(0x2a2c33, { roughness: .8 }), vm = mat(0xd4302a, { roughness: .6 });
  const box = (w, h, d, ma, x, y, z, rx = 0) => { const o = new Mesh(new BoxGeometry(w, h, d), ma); o.position.set(x, y, z); o.rotation.x = rx; g.add(o); return o; };
  box(1.9, .38, 1.55, pr2, 0, 2.05, .25); box(1.92, .12, 1.57, vm, 0, 2.3, .25);
  box(1.0, 1.7, .22, pr, 0, 3.2, -.62, -.12); box(.3, .7, .2, pr, -.55, 3.95, -.62); box(.3, .7, .2, pr, .55, 3.95, -.62);
  [-1, 1].forEach(s => { box(.22, 1.5, .08, pr, s * .62, 3.2, .62, .1); box(.07, .7, .1, mat(0xc9ced2), s * .62, 3.5, .66); });
  const an = new Mesh(new TorusGeometry(.22, .06, 8, 16), metal); an.position.set(0, 2.2, .98); g.add(an);
  [-1, 1].forEach(s => { const m1 = new Mesh(new TorusGeometry(.12, .04, 8, 12), metal); m1.position.set(s * .98, 2.35, .3); m1.rotation.y = Math.PI / 2; g.add(m1); });
  return g;
}
