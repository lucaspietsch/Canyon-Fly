import { Group, Mesh, InstancedMesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, ExtrudeGeometry, Shape, PlaneGeometry, MeshStandardMaterial, Matrix4, Vector3, Quaternion, Euler, Color } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U, LUGARES as C } from "../config.js";
import { aberto, centroide, quadro, inset, fitaReta, mat, semente, dentroPoli } from "./util.js";

/* ============================================================================================================
   VILA OURO VERDE (vila operária da fábrica Cambará S/A) — dentro do polígono "vila ouro verde" do KML.
   Ruas em U com a abertura voltada para a fábrica; casas de madeira e alvenaria (instanciadas) dos dois lados, armazém, capela, escola e campo de futebol dentro do U.
   ============================================================================================================ */

const pi = Math.PI;
const casaGeo = (() => { const w = 8.4, d = 6.4, h = 3, cum = 2.6, corpo = new BoxGeometry(w, h, d); corpo.translate(0, h / 2, 0); return corpo; })();
const telhadoGeo = (() => { const w = 9.6, d = 7.4, cum = 2.8, s = new Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, cum); s.closePath(); const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 3, -d / 2); return g; })();

export function criarVila(M, { poli, fabrica }){
  const { cen } = M, G = new Group(), P = aberto(poli), Y = (x, z) => cen.relevo(x, z), c0 = centroide(P), q = quadro(P), rnd = semente(9);
  const S = { colisores: [], hotspots: [], lampadas: null, t: 0 };
  /* eixo de abertura: o do quadro mais alinhado com a direção da fábrica */
  const ao = fabrica ? [fabrica[0] - c0[0], fabrica[1] - c0[1]] : [q.vx, q.vz], al = Math.hypot(ao[0], ao[1]) || 1;
  const eixos = [[q.ux, q.uz, q.w, q.d], [-q.ux, -q.uz, q.w, q.d], [q.vx, q.vz, q.d, q.w], [-q.vx, -q.vz, q.d, q.w]];
  let best = eixos[0], bd = -2; eixos.forEach(e => { const d = (e[0] * ao[0] + e[1] * ao[1]) / al; if(d > bd){ bd = d; best = e; } });
  const ox = best[0], oz = best[1], D = best[2] / U, W = best[3] / U, px = -oz, pz = ox;                                      // o = abertura; p = lateral; D, W em metros
  const Lc = (s, t) => [q.c[0] + (px * s + ox * t) * U, q.c[1] + (pz * s + oz * t) * U];
  const dentro = (s, t, m = 14) => dentroPoli(inset(P, m * U), ...Lc(s, t));
  /* o U cabe no polígono (que não é um retângulo): encolhe até os 4 cantos e os meios das ruas ficarem dentro */
  let k = 1, tb = -.34 * D, sa = .36 * W, tfim = .4 * D;
  for(; k > .3; k -= .04){ tb = -.34 * D * k; sa = .36 * W * k; tfim = .4 * D * k; const pts = [[-sa, tb], [sa, tb], [-sa, tfim], [sa, tfim], [0, tb], [-sa, (tb + tfim) / 2], [sa, (tb + tfim) / 2]]; if(pts.every(p => dentro(p[0], p[1], 40))) break; }

  const matRua = mat(0x8a7d66, { roughness: 1 }), matGrama = mat(0x86b24a, { roughness: 1 }), matBranco = mat(0xf0eee6), matTelhaV = mat(0xa5442e, { roughness: .8 }), matTelhaC = mat(0x7d8488, { roughness: .6, metalness: .3 }), matMadeira = mat(0x6b4a2c), matFerro = mat(0x24282c, { roughness: .6, metalness: .4 });
  matRua.polygonOffset = matGrama.polygonOffset = true; matRua.polygonOffsetFactor = -3; matRua.polygonOffsetUnits = -3; matGrama.polygonOffsetFactor = -2; matGrama.polygonOffsetUnits = -2;
  const ruas = [[[-sa, tb], [sa, tb]], [[-sa, tb], [-sa, tfim]], [[sa, tb], [sa, tfim]]];
  ruas.forEach(([a, b]) => G.add(fitaReta(Lc(...a), Lc(...b), 7 * U, Y, .3, matRua, 20)));

  /* ---------- casas ---------- */
  const casas = [];
  const passo = 19;
  /* orientação de cada casa: a fachada olha para a rua (direção do deslocamento lateral) */
  const colocaCasas = (s0, t0, s1, t1) => { const L = Math.hypot(s1 - s0, t1 - t0), n = Math.floor(L / passo), tx = (s1 - s0) / L, tz = (t1 - t0) / L;
    for(let i = 0; i < n; i++){ const k = (i + .5) / n, s = s0 + (s1 - s0) * k, t = t0 + (t1 - t0) * k;
      for(const sd of [-1, 1]){ const ls = s + (-tz) * 10.5 * sd, lt = t + tx * 10.5 * sd; if(!dentro(ls, lt, 10) || rnd() < .08) continue; const [x, z] = Lc(ls, lt), dxm = tz * sd, dzm = -tx * sd;       // vetor (local) da casa para a rua
        const wx = px * dxm + ox * dzm, wz = pz * dxm + oz * dzm; casas.push({ x, z, yaw: Math.atan2(wx, wz) }); } } };
  ruas.forEach(([a, b]) => colocaCasas(a[0], a[1], b[0], b[1]));
  {
    const n = casas.length; if(n){
      const imC = new InstancedMesh(casaGeo, mat(0xffffff, { roughness: .9 }), n), imT = new InstancedMesh(telhadoGeo, matTelhaV, n), mm = new Matrix4();
      const CORES = [0xe9e2cc, 0xd9c79a, 0xb8a88a, 0x9bb0a0, 0xc9d3dc, 0xe8cfa6, 0x8a6a4a, 0xc9a58a], TEL = [0xa5442e, 0x7d8488, 0x8a3a28];
      casas.forEach((c, i) => { const ey = Y(c.x, c.z); mm.compose(new Vector3(c.x, ey - .4, c.z), new Quaternion().setFromEuler(new Euler(0, c.yaw, 0)), new Vector3(U, U, U)); imC.setMatrixAt(i, mm); imT.setMatrixAt(i, mm);
        imC.setColorAt(i, new Color(CORES[Math.floor(rnd() * CORES.length)])); imT.setColorAt(i, new Color(TEL[Math.floor(rnd() * TEL.length)]));
        const hw = (Math.abs(Math.cos(c.yaw)) * 4.2 + Math.abs(Math.sin(c.yaw)) * 3.2) * U, hh = (Math.abs(Math.sin(c.yaw)) * 4.2 + Math.abs(Math.cos(c.yaw)) * 3.2) * U; S.colisores.push({ x0: c.x - hw, x1: c.x + hw, z0: c.z - hh, z1: c.z + hh }); });
      imC.castShadow = imT.castShadow = true; imC.receiveShadow = true; G.add(imC, imT);
    }
  }
  /* ---------- prédios: armazém, capela, escola ---------- */
  const predio = (s, t, w, d, h, corpoMat, telhaMat, cum = 3, yawL = 0) => {
    const [x, z] = Lc(s, t), g = new Group(), yaw = Math.atan2(ox, oz) + yawL, corpo = new Mesh(new BoxGeometry(w * U, h * U, d * U), corpoMat); corpo.position.y = h * U / 2; corpo.castShadow = corpo.receiveShadow = true; g.add(corpo);
    const sh = new Shape(); sh.moveTo(-w * U / 2 - U, 0); sh.lineTo(w * U / 2 + U, 0); sh.lineTo(0, cum * U); sh.closePath(); const tg = new ExtrudeGeometry(sh, { depth: (d + 1.4) * U, bevelEnabled: false }); tg.translate(0, h * U, -(d + 1.4) * U / 2); const tel = new Mesh(tg, telhaMat); tel.castShadow = true; g.add(tel);
    g.position.set(x, Y(x, z) - .3, z); g.rotation.y = yaw; G.add(g);
    const R = Math.hypot(w, d) * U / 2 * .78; S.colisores.push({ x0: x - R, x1: x + R, z0: z - R, z1: z + R }); return g;
  };
  if(dentro(0, tb - 34, 8)) { const a = predio(0, tb - 34, 34, 15, 6.5, mat(0xc9bfa0), matTelhaC, 3.2); const porta = new Mesh(new BoxGeometry(9 * U, 5 * U, .3 * U), matFerro); porta.position.set(0, 2.5 * U, 7.6 * U); a.add(porta); }   // armazém
  { const g = predio(0, tb + 30, 8, 12, 5, matBranco, matTelhaV, 3.4); const tor = new Mesh(new BoxGeometry(3 * U, 7 * U, 3 * U), matBranco); tor.position.set(0, 8.5 * U, -4.5 * U); g.add(tor); const tp = new Mesh(new ConeGeometry(2.4 * U, 3 * U, 4), matTelhaV); tp.position.set(0, 13.5 * U, -4.5 * U); tp.rotation.y = pi / 4; g.add(tp);
    const cr1 = new Mesh(new BoxGeometry(.25 * U, 2.2 * U, .25 * U), matFerro), cr2 = new Mesh(new BoxGeometry(1.2 * U, .25 * U, .25 * U), matFerro); cr1.position.set(0, 16 * U, -4.5 * U); cr2.position.set(0, 16.4 * U, -4.5 * U); g.add(cr1, cr2); }   // capela
  if(dentro(sa + 40, .1 * D, 8)) predio(sa + 40, .1 * D, 30, 9, 4, mat(0xe8d089), matTelhaV, 2.6, pi / 2);                                                                                                // escola
  /* ---------- campo de futebol ---------- */
  {
    const [fw, fh] = C.vila.campoM, [x, z] = Lc(0, tb + 85), tex = canvasTex(256, 160, (c, w, h) => { c.fillStyle = "#7fb04a"; c.fillRect(0, 0, w, h); for(let i = 0; i < 10; i++){ c.fillStyle = i % 2 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"; c.fillRect(i * w / 10, 0, w / 10, h); }
      c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 3; c.strokeRect(8, 8, w - 16, h - 16); c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w / 2, h - 8); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 20, 0, pi * 2); c.stroke(); c.strokeRect(8, h / 2 - 34, 30, 68); c.strokeRect(w - 38, h / 2 - 34, 30, 68); });
    const campo = new Mesh(new PlaneGeometry(fw * U, fh * U), new MeshStandardMaterial({ map: tex, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); campo.rotation.x = -pi / 2;
    const grp = new Group(); grp.position.set(x, Y(x, z) + .5, z); grp.rotation.y = Math.atan2(px, pz); grp.add(campo);
    for(const sd of [-1, 1]){ const tr = new Mesh(new BoxGeometry(.25 * U, 2.4 * U, 7.3 * U), matBranco); tr.position.set(sd * fw * U / 2, 1.2 * U, 0); grp.add(tr); for(const sz of [-1, 1]){ const po = new Mesh(new CylinderGeometry(.12 * U, .12 * U, 2.4 * U, 6), matBranco); po.position.set(sd * fw * U / 2, 1.2 * U, sz * 3.65 * U); grp.add(po); } }
    G.add(grp);
  }
  /* ---------- postes e árvores ---------- */
  {
    const pole = new CylinderGeometry(.22, .3, 15, 6), lamp = new SphereGeometry(.7, 8, 6), pos = []; pole.translate(0, 7.5, 0); lamp.translate(0, 15.2, 0);
    ruas.forEach(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 38); for(let i = 0; i <= n; i++){ const k = i / n; const s = a[0] + (b[0] - a[0]) * k + 4.5, t = a[1] + (b[1] - a[1]) * k; if(dentro(s, t, 6)) pos.push(Lc(s, t)); } });
    const matL = new MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd890, emissiveIntensity: .1 }), im1 = new InstancedMesh(pole, matFerro, Math.max(1, pos.length)), im2 = new InstancedMesh(lamp, matL, Math.max(1, pos.length)), mm = new Matrix4();
    pos.forEach((p, i) => { mm.compose(new Vector3(p[0], Y(p[0], p[1]), p[1]), new Quaternion(), new Vector3(1, 1, 1)); im1.setMatrixAt(i, mm); im2.setMatrixAt(i, mm); }); im1.count = im2.count = pos.length; G.add(im1, im2); S.lampadas = matL;
    const tr = new CylinderGeometry(.3, .4, 5, 6), cp = new SphereGeometry(3.2, 8, 6), arv = []; tr.translate(0, 2.5, 0); cp.translate(0, 7, 0);
    for(let i = 0; i < 90; i++){ const s = (rnd() - .5) * W * .8, t = (rnd() - .5) * D * .8; if(Math.abs(s) < sa + 14 && t < tfim + 10 && t > tb - 14) { if(rnd() < .85) continue; } if(dentro(s, t, 20)) arv.push(Lc(s, t)); }
    const imT = new InstancedMesh(tr, matMadeira, Math.max(1, arv.length)), imC = new InstancedMesh(cp, mat(0x5a8a3a, { roughness: 1 }), Math.max(1, arv.length));
    arv.forEach((p, i) => { const sc = .8 + rnd() * .8; mm.compose(new Vector3(p[0], Y(p[0], p[1]), p[1]), new Quaternion(), new Vector3(sc, sc, sc)); imT.setMatrixAt(i, mm); imC.setMatrixAt(i, mm); imC.setColorAt(i, new Color().setHSL(.24 + rnd() * .08, .5, .26 + rnd() * .1)); }); imT.count = imC.count = arv.length; imT.castShadow = imC.castShadow = true; G.add(imT, imC);
  }
  /* ---------- placa de entrada ---------- */
  {
    const [x, z] = Lc(0, tfim + 14), g = new Group(); g.position.set(x, Y(x, z), z); g.rotation.y = Math.atan2(ox, oz);
    for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.4 * U, 3.2 * U, .4 * U), matMadeira); po.position.set(sx * 3.6 * U, 1.6 * U, 0); g.add(po); }
    const tex = texPlacaHD(768, 256, (c, w, h) => { c.fillStyle = "#2c5a34"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f0e8c0"; c.lineWidth = 8; c.strokeRect(12, 12, w - 24, h - 24); c.fillStyle = "#f6f0d0"; c.textAlign = "center"; c.font = "bold 82px Arial"; c.fillText("VILA OURO VERDE", w / 2, 130); c.font = "34px Arial"; c.fillText("Cambará S/A", w / 2, 190); });
    const pl = placaLegivel(tex, 7.6 * U, 2.5 * U, { verso: tex, cor: 0x3a2a1a }); pl.position.set(0, 2.2 * U, 0); g.add(pl); G.add(g);
  }

  function tick(dt){ S.t += dt; if(S.lampadas){ const h = M.ciclo.hora(), noite = h < 5.8 || h >= 18; S.lampadas.emissiveIntensity += ((noite ? 2.2 : .08) - S.lampadas.emissiveIntensity) * Math.min(1, dt * 1.5); } }
  const dispose = () => { S.colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); };
  S.colisores.forEach(k => cen.colisores.push(k));
  return { g: G, tick, dispose, S, centro: c0, casas: casas.length };
}
