import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, TubeGeometry, PlaneGeometry, InstancedMesh, MeshStandardMaterial, MeshBasicMaterial, Object3D, Quaternion, Vector3, Curve, DoubleSide } from "three";
import { m, NIVEL, canvasTex, texPlacaHD, placaLegivel, rng, mat, caixa, coluna, barra, grupo } from "./lib.js";

/* ============================================================================================================
   PÓRTICO DE PALANQUES + CABOS COM MOLA + ANCORAGENS NA ROCHA (fotos; 1 m = 2,94 u)
   - 7 palanques de madeira preta (Ø ≈ 0,5 m, ≈ 3,8 m): CABO 01–06 numa laje comprida e CABO 07 sozinho numa laje quadrada;
     viga horizontal preta no topo com as placas VIA 01–05 (cada via fica ENTRE dois cabos vizinhos);
   - cabos de aço saindo dos palanques rumo ao vão; os cabos 01–06 levam colunas de mola + tecnil (escalonadas), o 07 (trolley) é liso;
   - atrás dos palanques: cabos no chão, olhais de aço inox na rocha com protetores amarelos e argolas laranja (sistema de multiplicação).
   ============================================================================================================ */
/* todos os 7 cabos ficam NA MESMA ALTURA: o dobro da altura de um personagem acima do deck (Pit ≈ 4,7 u → 9,4 u; deck em y = -6 → y = 3,4), paralelos e retos
   do palanque ao lançamento (só descem 2,4 u em 2100 u). */
export const Y_COMUM = 3.4;
const Y_LANCA = 1.0, XR = 30;
const xFimMola = (k) => PORT.x + .9 + 30 + (5 - k) * 5.5 + 2;
export const cabY = (k, x) => Y_COMUM + (Y_LANCA - Y_COMUM) * Math.max(0, x) / PORT.lanca;      // k: 0..5 = cabos 01..06; 6 = cabo 07 (todos iguais)
/* mapa do usuário: da casinha para o lado direito: cabo 07 (z = 0), depois 06, 05, 04, 03, 02, 01 (≈ 2 m entre eles). O pórtico fica 27 m atrás do deck. */
export const PORT = { x: -50, zs: [40.7, 34.7, 28.7, 22.7, 16.7, 10.7], z7: 0, lanca: 2043 };
const R_POSTE = .74, H_POSTE = Y_COMUM - NIVEL.CHAO + 1.5, Y_FIO = Y_COMUM;                    // altura do fio no palanque (y)

const placaTx = (t1, t2) => texPlacaHD(128, 96, (c, w, h) => { c.fillStyle = "#4a7a45"; c.fillRect(0, 0, w, h); c.fillStyle = "#eef4e8"; c.textAlign = "center"; c.font = "bold 22px Arial"; c.fillText(t1, w / 2, 36); c.font = "bold 40px Arial"; c.fillText(t2, w / 2, 78); });
const placaVia = (t) => texPlacaHD(160, 56, (c, w, h) => { c.fillStyle = "#4a7a45"; c.fillRect(0, 0, w, h); c.fillStyle = "#eef4e8"; c.textAlign = "center"; c.font = "bold 30px Arial"; c.fillText(t, w / 2, 40); });

export function criarPortico({ ag, cena }){
  void cena;
  const g = grupo(ag);
  const chao = NIVEL.CHAO, yTopo = chao + H_POSTE;
  const madeira = mat(0x15130f, { roughness: .85 }), concreto = mat(0x8c8e8a, { roughness: .95 });
  const colisores = [];
  const zs = [...PORT.zs, PORT.z7];

  /* lajes de concreto */
  caixa(g, PORT.x - 2.7, PORT.x + 2.7, chao, chao + .5, PORT.zs[5] - 2.4, PORT.zs[0] + 2.4, concreto);
  caixa(g, PORT.x - 2.0, PORT.x + 2.0, chao, chao + .45, PORT.z7 - 2.0, PORT.z7 + 2.0, concreto);
  /* palanques */
  const fita = mat(0x2c6a3e, { roughness: .9 }), aco = mat(0xa9aeb2, { metalness: .8, roughness: .35 }), cintaM = mat(0xc9ccce, { metalness: .6, roughness: .4 });
  zs.forEach((z, i) => {
    const y0 = chao + (i === 6 ? .45 : .5);
    coluna(g, PORT.x, z, y0, yTopo - .5, R_POSTE, madeira, 20);
    coluna(g, PORT.x, z, yTopo - 1.2, yTopo + .15, R_POSTE + .02, madeira, 20);
    /* voltas de cabo de aço sobre fita verde no meio do fuste (onde o cabo de frenagem prende) */
    const yw = Y_FIO;
    const fv = coluna(g, PORT.x, z, yw - 1.0, yw - .1, R_POSTE + .04, fita, 20); void fv;
    for(let k = 0; k < 3; k++){ const t = new Mesh(new TorusGeometry(R_POSTE + .06, .06, 6, 20), aco); t.rotation.x = Math.PI / 2; t.position.set(PORT.x, yw - .85 + k * .22, z); g.add(t); }
    /* cinta metálica clara perto do topo + placa verde "CABO 0n" voltada para o vão (+x) */
    coluna(g, PORT.x, z, yTopo - 2.2, yTopo - 1.9, R_POSTE + .05, cintaM, 20);
    const pl = placaLegivel(placaTx("CABO", `0${i + 1}`), 1.25, .95, { espessura: .04 }); pl.position.set(PORT.x + R_POSTE + .03, yTopo - 3.6, z); pl.rotation.y = Math.PI / 2; g.add(pl);
    colisores.push({ x0: PORT.x - R_POSTE - .1, x1: PORT.x + R_POSTE + .1, z0: z - R_POSTE - .1, z1: z + R_POSTE + .1 });
  });
  /* viga horizontal (tubo grosso preto) com "joelhos" nos palanques 01–06 e placas VIA */
  const yViga = yTopo - .5;
  const viga = new Mesh(new CylinderGeometry(.62, .62, Math.abs(PORT.zs[5] - PORT.zs[0]) + 2.6, 22), madeira); viga.rotation.x = Math.PI / 2; viga.position.set(PORT.x, yViga, (PORT.zs[0] + PORT.zs[5]) / 2); g.add(viga);
  PORT.zs.forEach(z => { const j = new Mesh(new SphereGeometry(.78, 16, 12), madeira); j.position.set(PORT.x, yViga - .05, z); g.add(j); });
  for(let i = 0; i < 5; i++){ const z = (PORT.zs[i] + PORT.zs[i + 1]) / 2; const pv = placaLegivel(placaVia(`VIA 0${i + 1}`), 1.35, .5, { espessura: .04 }); pv.position.set(PORT.x + .66, yViga + .02, z); pv.rotation.y = Math.PI / 2; g.add(pv); }
  /* fios finos em X entre palanques (estais) com "borboletas" amarelas */
  const fio = mat(0x2b2d30, { metalness: .6, roughness: .5 }), amarelo = mat(0xe7c21c, { roughness: .6 });
  for(let i = 0; i < 5; i++){ const a = [PORT.x + .9, yViga - .2, PORT.zs[i]], b = [PORT.x + .9, chao + 1.4, PORT.zs[i + 1]], c = [PORT.x + .9, chao + 1.4, PORT.zs[i]], d = [PORT.x + .9, yViga - .2, PORT.zs[i + 1]];
    barra(g, a, b, .035, fio, 4); barra(g, c, d, .035, fio, 4);
    [.35, .65].forEach(t => caixa(g, a[0] - .1, a[0] + .1, a[1] + (b[1] - a[1]) * t - .08, a[1] + (b[1] - a[1]) * t + .08, a[2] + (b[2] - a[2]) * t - .09, a[2] + (b[2] - a[2]) * t + .09, amarelo)); }

  /* ---------------------------------------------------------------- cabos de aço */
  const cabo = mat(0x7d8286, { metalness: .85, roughness: .4 });
  const dir = new Vector3(), q = new Quaternion(), UP = new Vector3(0, 1, 0);
  const segmento = (a, b, r = .1) => { segmento.ultimo = (a2, b2) => { segmento(a2, b2); return segmento.malha; }; dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = dir.length(); dir.normalize();
    const o = new Mesh(new CylinderGeometry(r, r, L, 8), cabo); o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); o.quaternion.setFromUnitVectors(UP, dir); g.add(o); segmento.malha = o; return { L, dir: dir.clone() }; };
  const xs = PORT.x + .9;
  const colunas = [];
  let cabo7Meio = null;
  zs.forEach((z, k) => {
    const a = [xs, Y_FIO, z], c = [PORT.lanca, Y_LANCA, z];
    if(k === 6){ segmento(a, [-20, Y_COMUM, z]); cabo7Meio = segmento.ultimo([-20, Y_COMUM, z], [20, cabY(6, 20), z]); segmento([20, cabY(6, 20), z], c); }
    else { const e = [xFimMola(k), Y_FIO, z], s1 = segmento(a, e); segmento(e, c); colunas.push({ k, a, dir: s1.dir, L: s1.L }); }
  });

  /* colunas de mola + tecnil (escalonadas: a do cabo mais baixo é a mais curta). Geometria única instanciada. */
  const branco = new MeshStandardMaterial({ color: 0xdcdcd4, roughness: .55 }), molaM = new MeshStandardMaterial({ color: 0xb9bec2, metalness: .85, roughness: .3 });
  const tecnil = new CylinderGeometry(.52, .52, .55, 14);
  class Helice extends Curve { getPoint(t, alvo = new Vector3()){ const a = t * Math.PI * 2 * 6; return alvo.set(Math.cos(a) * .46, t * 1.0 - .5, Math.sin(a) * .46); } }
  const mola = new TubeGeometry(new Helice(), 90, .045, 5, false);
  const total = colunas.reduce((s, c) => s + Math.floor((34 + (5 - c.k) * 6 - 1.6) / 1.55) + 1, 0);
  const iT = new InstancedMesh(tecnil, branco, total + 8), iM = new InstancedMesh(mola, molaM, total + 8);
  const o3 = new Object3D(); let n = 0;
  colunas.forEach(({ k, a, dir: d }) => {
    const comp = 30 + (5 - k) * 5.5, passo = 1.55;                                 // cabo 06 (k=5) → 30 u; cabo 01 (k=0) → 57,5 u
    const base = new Vector3(a[0] + 2.2, 0, a[2]);
    const origem = new Vector3(a[0], a[1], a[2]);
    for(let s = 1.6; s < comp; s += passo){
      const p = origem.clone().addScaledVector(d, s);
      q.setFromUnitVectors(UP, d);
      o3.position.copy(p); o3.quaternion.copy(q); o3.scale.set(1, 1, 1); o3.updateMatrix(); iT.setMatrixAt(n, o3.matrix);
      o3.position.copy(origem.clone().addScaledVector(d, s + .75)); o3.updateMatrix(); iM.setMatrixAt(n, o3.matrix);
      n++;
    }
    /* batente no fim da coluna */
    const fim = origem.clone().addScaledVector(d, comp + .2);
    const bt = new Mesh(new CylinderGeometry(.62, .62, .6, 12), mat(0x1c1d20, { metalness: .5, roughness: .5 })); bt.position.copy(fim); bt.quaternion.copy(q); g.add(bt);
    void base;
  });
  iT.count = n; iM.count = n; iT.instanceMatrix.needsUpdate = true; iM.instanceMatrix.needsUpdate = true; g.add(iT, iM);

  /* ---------------------------------------------------------------- ancoragens na rocha, atrás dos palanques */
  const rocha = new Group(); g.add(rocha);
  const r = rng(21), pedra = mat(0x8a5f3a, { roughness: .95 }), pedra2 = mat(0x6e5648, { roughness: .95 }), agua = new MeshStandardMaterial({ color: 0x4d5f66, roughness: .1, metalness: .3, transparent: true, opacity: .8 });
  for(let i = 0; i < 26; i++){ const w = 6 + r() * 12, d = 6 + r() * 10, x = PORT.x - 30 + r() * 36, z = -8 + r() * 56; const p = caixa(rocha, x - w / 2, x + w / 2, chao + .02, chao + .12 + r() * .3, z - d / 2, z + d / 2, r() > .45 ? pedra : pedra2); p.rotation.y = r() * .5; }
  [[PORT.x - 14, 6, 10, 6], [PORT.x - 22, 26, 8, 5]].forEach(([x, z, w, d]) => { const p = new Mesh(new CylinderGeometry(1, 1, .05, 18), agua); p.scale.set(w / 2, 1, d / 2); p.position.set(x, chao + .42, z); rocha.add(p); });
  const fiosChao = mat(0x2a2c2f, { metalness: .7, roughness: .5 });
  const nO = 7 * 6; const iOlhal = new InstancedMesh(new TorusGeometry(.26, .06, 6, 12), mat(0xb8bcc0, { metalness: .9, roughness: .25 }), nO), iAmar = new InstancedMesh(new BoxGeometry(.2, .16, .2), amarelo, nO * 3);
  let no = 0, na = 0;
  const argolas = new Group(); g.add(argolas);
  zs.forEach((z, k) => {
    const zc = z + (r() - .5) * .3, yz = chao + .3;
    barra(g, [PORT.x - 2.5, yz, zc], [PORT.x - 48, yz + .15, zc], .09, fiosChao, 6);
    for(let i = 0; i < 6; i++){
      const x = PORT.x - i * 5 - r() * 2;
      o3.position.set(x, yz + .1, zc); o3.rotation.set(0, Math.PI / 2, 0); o3.quaternion.setFromEuler(o3.rotation); o3.scale.set(1, 1, 1); o3.updateMatrix(); iOlhal.setMatrixAt(no++, o3.matrix);
      for(let j = 0; j < 3; j++){ o3.position.set(x + 1.1 + j * .7, yz + .22, zc + (j % 2 ? .06 : -.06)); o3.rotation.set(0, 0, 0); o3.quaternion.setFromEuler(o3.rotation); o3.updateMatrix(); iAmar.setMatrixAt(na++, o3.matrix); }
    }
    /* argola laranja oval no trecho de capim (multiplicação) */
    const ar = new Mesh(new TorusGeometry(.55, .13, 8, 20), mat(0xf07a1c, { roughness: .45 })); ar.scale.set(1.8, 1, 1); ar.position.set(PORT.x + 10 - (k % 3) * 2.2, yz + .1, zc); ar.rotation.x = Math.PI / 2; argolas.add(ar);
  });
  iOlhal.count = no; iAmar.count = na; iOlhal.instanceMatrix.needsUpdate = true; iAmar.instanceMatrix.needsUpdate = true; rocha.add(iOlhal, iAmar);
  /* valas escuras no capim, de onde os cabos descem */
  zs.forEach(z => caixa(g, PORT.x - 16, PORT.x - 2.7, chao - .02, chao + .03, z - .5, z + .5, mat(0x1a140e, { roughness: 1 })));

  const hotspots = [
    { id: "portico", x: PORT.x + 5.2, z: 20, r: 9, rotulo: () => "Ler as placas do pórtico", acao: null, msg: "Pórtico de ancoragem: placas CABO 01 a 07 e VIA 01 a 05. Cada via fica entre dois cabos; as vias 1, 3 e 5 usam os pares 1+2, 3+4 e 5+6. O cabo 07 é o do trolley." }
  ];
  return { grupo: g, colisores, hotspots, yTopo, cabo7Meio };
}
