import { Group, Mesh, SphereGeometry, CylinderGeometry, BoxGeometry, ConeGeometry, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, MeshBasicMaterial, PointLight, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, AdditiveBlending } from "three";
import { canvasTex } from "../../lib.js";
import { U } from "../config.js";

/* ============================================================================================================
   ANHANGÁ — espírito protetor da caça e da mata na tradição tupi ("anhanga": espírito, sombra, alma). Justiça na mata: castiga quem maltrata os bichos.
   • Forma principal: CERVO BRANCO GIGANTE, pelagem alva, galhada alta, olhos de BRASA que pulsam. NÃO há cruz na testa.
   • Metamorfoses: tatu · boi · pirarucu · humano — sempre com os mesmos olhos de brasa, trocando de corpo no meio de uma névoa.
   • Este arquivo só desenha e anima. Quem o põe no mundo (perto da Árvore Anciã e dos pontos encantados) é a Antiga Floresta da Olaria.
   Depuração (F3 aberto): Shift+' (aspas) ou Numpad* — Ctrl+' ou Numpad/ some — aparece à frente do jogador; de novo, troca de forma. Ctrl+' some com ele.
   ============================================================================================================ */

export const ANHANGA = {
  formas: ["cervo", "tatu", "boi", "pirarucu", "humano"],
  tempoTroca: 1.1,                                   // s de névoa em cada metade da metamorfose
  distanciaDebug: 13,                                // m à frente do jogador (Shift+' (aspas) ou Numpad* — Ctrl+' ou Numpad/ some)
  brasa: 0xff5a1c, brasaHalo: 0xff7a2a, pelo: 0xf3f0e8, osso: 0xe9e2cf
};

const mat = (c, o = {}) => new MeshStandardMaterial({ color: c, roughness: .92, ...o });

export function criaAnhanga(H){
  const C = ANHANGA, raiz = new Group(), formas = {}, olhosMat = new MeshBasicMaterial({ color: C.brasa }), halos = [];
  raiz.scale.setScalar(U);
  const pelo = mat(C.pelo, { emissive: 0x1a1812, emissiveIntensity: .5 }), osso = mat(C.osso, { roughness: .7 }), nariz = mat(0x2a2220, { roughness: .5 });
  const elip = (pai, m, rx, ry, rz, x, y, z) => { const o = new Mesh(new SphereGeometry(1, 20, 14), m); o.scale.set(rx, ry, rz); o.position.set(x, y, z); pai.add(o); return o; };
  const membro = (pai, m, a, b, r1, r2) => { const d = new Vector3().subVectors(b, a), L = d.length(), o = new Mesh(new CylinderGeometry(r2, r1, L, 10), m); o.position.copy(a).addScaledVector(d, .5); o.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), d.normalize()); pai.add(o); return o; };
  const tubo = (pai, m, pts, r) => { const o = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p => new Vector3(...p))), 16, r, 6, false), m); pai.add(o); return o; };
  /* olhos de brasa: núcleo vivo + halo + luz alaranjada (valem para todas as formas) */
  const olhos = (pai, x, y, z, esc = 1) => { for(const sx of [-1, 1]){ const o = new Mesh(new SphereGeometry(.05 * esc, 12, 8), olhosMat); o.position.set(sx * x, y, z); o.scale.set(1, .8, .6); pai.add(o);
      const h = new Mesh(new SphereGeometry(.09 * esc, 12, 8), new MeshBasicMaterial({ color: C.brasaHalo, transparent: true, opacity: .3, blending: AdditiveBlending, depthWrite: false })); h.position.copy(o.position); pai.add(h); halos.push(h); }
    const l = new PointLight(C.brasa, .8, 9); l.position.set(0, y, z + .15 * esc); pai.add(l); halos.luzes = (halos.luzes || []).concat(l); };

  /* ---------- CERVO BRANCO GIGANTE ---------- */
  { const g = new Group(); formas.cervo = g;
    elip(g, pelo, .52, .55, 1.0, 0, 1.75, 0); elip(g, pelo, .46, .5, .5, 0, 1.85, .62); elip(g, pelo, .4, .42, .5, 0, 1.7, -.75);
    membro(g, pelo, new Vector3(0, 2.0, .85), new Vector3(0, 2.95, 1.4), .3, .17);
    const cabeca = new Group(); cabeca.position.set(0, 3.05, 1.5); cabeca.rotation.x = .5; g.add(cabeca); g.userData.cabeca = cabeca;
    elip(cabeca, pelo, .17, .18, .34, 0, 0, .08); elip(cabeca, pelo, .11, .1, .2, 0, -.06, .38); elip(cabeca, nariz, .05, .04, .04, 0, -.05, .58);
    for(const sx of [-1, 1]){ const o = elip(cabeca, pelo, .06, .2, .1, sx * .18, .22, -.08); o.rotation.z = -sx * .55; o.rotation.x = -.2; }
    olhos(cabeca, .14, .08, .25);
    for(const sx of [-1, 1]){ const a = new Group(); a.position.set(sx * .1, .18, -.12); cabeca.add(a);
      const viga = [[0, 0, 0], [sx * .12, .4, -.08], [sx * .3, .85, -.05], [sx * .38, 1.3, .1], [sx * .32, 1.62, .32]]; tubo(a, osso, viga, .05);
      for(const [i, f] of [[1, [.45, .78, .2]], [2, [.62, 1.2, .1]], [3, [.6, 1.68, .3]], [2, [.2, 1.25, .55]]]) tubo(a, osso, [viga[i], [sx * f[0], f[1], f[2]]], .032); }
    for(const [x, z] of [[.3, .62], [-.3, .62], [.3, -.68], [-.3, -.68]]){ const pe = new Vector3(x, 0, z), jo = new Vector3(x, .78, z + (z > 0 ? .08 : -.12)), q = new Vector3(x, 1.5, z * .8);
      membro(g, pelo, q, jo, .2, .11); membro(g, pelo, jo, pe.clone().setY(.1), .1, .06); const c = new Mesh(new BoxGeometry(.13, .14, .17), nariz); c.position.set(x, .06, z + .03); g.add(c); }
    elip(g, pelo, .12, .16, .1, 0, 2.2, -1.0).rotation.x = -.6; }

  /* ---------- TATU ---------- */
  { const g = new Group(); formas.tatu = g; const faixas = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8d7f70"; c.fillRect(0, 0, w, h); for(let y = 0; y < h; y += 10){ c.fillStyle = "rgba(40,30,22,.55)"; c.fillRect(0, y, w, 2.5); } for(let x = 0; x < w; x += 12){ c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(x, 0, 1.5, h); } }, { repeat: [1, 1] });
    const casco = mat(0xffffff, { roughness: .8 }); casco.map = faixas; const dome = elip(g, casco, .52, .4, .82, 0, .55, 0); dome.rotation.x = 0;
    elip(g, mat(0x9a8d7e), .2, .2, .34, 0, .38, .86); elip(g, mat(0x9a8d7e), .1, .09, .2, 0, .33, 1.16); for(const sx of [-1, 1]){ const o = elip(g, mat(0x9a8d7e), .05, .15, .06, sx * .1, .56, .74); o.rotation.z = sx * -.2; }
    olhos(g, .13, .45, 1.04, .8); tubo(g, mat(0x8d7f70), [[0, .4, -.75], [0, .3, -1.1], [0, .12, -1.4]], .09);
    for(const [x, z] of [[.3, .5], [-.3, .5], [.3, -.45], [-.3, -.45]]){ membro(g, mat(0x9a8d7e), new Vector3(x, .4, z), new Vector3(x * 1.1, .05, z + .06), .12, .08); } }

  /* ---------- BOI ---------- */
  { const g = new Group(), boi = mat(0xd9d3c5, { emissive: 0x15130f, emissiveIntensity: .5 }); formas.boi = g;
    elip(g, boi, .62, .66, 1.05, 0, 1.4, 0); elip(g, boi, .5, .5, .5, 0, 1.55, .55).scale.y = .55; elip(g, boi, .34, .34, .44, 0, 1.9, .8);
    const cab = new Group(); cab.position.set(0, 1.55, 1.3); cab.rotation.x = .45; g.add(cab); elip(cab, boi, .26, .3, .44, 0, 0, .1); elip(cab, nariz, .17, .15, .16, 0, -.1, .45);
    for(const sx of [-1, 1]) tubo(cab, osso, [[sx * .2, .25, -.05], [sx * .5, .4, 0], [sx * .66, .8, .05], [sx * .58, 1.1, .2]], .06);
    for(const sx of [-1, 1]){ const o = elip(cab, boi, .06, .12, .14, sx * .27, .22, -.12); o.rotation.z = -sx * 1.0; } olhos(cab, .19, .1, .32, 1.1);
    for(const [x, z] of [[.34, .7], [-.34, .7], [.34, -.7], [-.34, -.7]]){ membro(g, boi, new Vector3(x, 1.1, z), new Vector3(x, .15, z), .2, .1); const c = new Mesh(new BoxGeometry(.2, .15, .24), nariz); c.position.set(x, .07, z); g.add(c); }
    tubo(g, boi, [[0, 1.9, -1.0], [0, 1.4, -1.3], [0, .7, -1.3]], .06); elip(g, nariz, .1, .2, .1, 0, .55, -1.3); }

  /* ---------- PIRARUCU ---------- */
  { const g = new Group(); formas.pirarucu = g; const esc = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#4a5a4a"; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(.55, "rgba(0,0,0,0)"); gr.addColorStop(.75, "rgba(190,30,26,.8)"); gr.addColorStop(1, "rgba(190,30,26,.95)"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      for(let y = 0; y < h; y += 8) for(let x = (y / 8 % 2) * 4; x < w; x += 8){ c.strokeStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.arc(x, y, 5, 0, 3.2); c.stroke(); } }, { repeat: [1, 1] });
    const corpo = mat(0xffffff, { roughness: .55 }); corpo.map = esc; const fg = new Group(); fg.position.y = 1.1; g.add(fg); g.userData.nado = fg;
    elip(fg, corpo, .3, .34, 1.45, 0, 0, 0);
    elip(fg, mat(0x3f4d3f), .22, .24, .42, 0, -.02, 1.35); elip(fg, mat(0x2a1a16), .16, .08, .26, 0, -.12, 1.62);
    olhos(fg, .2, .06, 1.52, .9); const cauda = elip(fg, mat(0xa3201c), .04, .42, .35, 0, 0, -1.55); g.userData.cauda = cauda;
    elip(fg, mat(0x3f4d3f), .03, .24, .55, 0, .36, -.7); for(const sx of [-1, 1]){ const o = elip(fg, mat(0x6b7a6b), .03, .2, .32, sx * .3, -.2, .9); o.rotation.z = sx * .8; } }

  /* ---------- HUMANO ---------- */
  { const g = new Group(); formas.humano = g; if(H && H.pessoa3d){ const M = H.M, c = M(0xe9e4d6, { roughness: .95 }), p = new Group();
      const rig = H.pessoa3d({ nome: "", x: 0, y: 0, z: 0, yaw: 0, camisa: c, manga: c, calca: c, pele: M(0xd9cfc0, { roughness: .8 }), cabelo: 0xe9e6e0, barba: false, rabo: true, olhos: C.brasa });
      rig.capG.visible = false; rig.ocG.visible = false; rig.equip.forEach(o => { o.visible = false; }); if(rig.nome) rig.nome.visible = false; rig.av.parent && rig.av.parent.remove(rig.av); rig.av.scale.setScalar(1.2 / U); p.add(rig.av); g.add(p); g.userData.rig = rig;
      olhos(rig.cab, .33, .08, .9, .85); } }
  for(const k in formas){ raiz.add(formas[k]); formas[k].visible = false; }

  /* névoa da metamorfose */
  const NP = 90, np = new Float32Array(NP * 3), seed = Array.from({ length: NP }, () => [Math.random() * 6.28, Math.random(), Math.random()]), ng = new BufferGeometry(); ng.setAttribute("position", new Float32BufferAttribute(np, 3));
  const nevoa = new Points(ng, new PointsMaterial({ color: 0xd8dde4, size: .55, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true })); nevoa.frustumCulled = false; raiz.add(nevoa);

  const S = { atual: "cervo", fase: "parado", t: 0, alvo: null, rel: 0, mist: 0 };
  const mostra = (k) => { for(const n in formas) formas[n].visible = n === k; S.atual = k; };
  mostra("cervo");
  const forma = (k) => { if(!formas[k] || k === S.atual && S.fase === "parado") return false; S.alvo = k; S.fase = "sai"; S.t = 0; return true; };
  const cicla = () => { const L = C.formas, i = (L.indexOf(S.alvo || S.atual) + 1) % L.length; return forma(L[i]) ? L[i] : null; };
  function tick(dt){
    S.rel += dt; const f = formas[S.atual], T = C.tempoTroca;
    if(S.fase === "sai"){ S.t += dt; const k = Math.min(1, S.t / T); f.scale.setScalar(1 - k * .35); f.position.y = -k * .5; S.mist = k; if(k >= 1){ f.scale.setScalar(1); f.position.y = 0; mostra(S.alvo); S.fase = "entra"; S.t = 0; } }
    else if(S.fase === "entra"){ S.t += dt; const k = Math.min(1, S.t / T), n = formas[S.atual]; n.scale.setScalar(.65 + k * .35); n.position.y = -(1 - k) * .5; S.mist = 1 - k; if(k >= 1){ n.scale.setScalar(1); n.position.y = 0; S.fase = "parado"; S.mist = 0; } }
    ng.attributes.position.needsUpdate = true; nevoa.material.opacity = Math.min(.85, S.mist * 1.1);
    for(let i = 0; i < NP; i++){ const s = seed[i], a = s[0] + S.rel * (.2 + s[2] * .3), r = .6 + s[1] * 2.2 * (.5 + S.mist * .6); np[i * 3] = Math.cos(a) * r; np[i * 3 + 1] = .1 + ((S.rel * (.25 + s[2] * .3) + s[1] * 3) % 1) * 2.8 * (.6 + S.mist); np[i * 3 + 2] = Math.sin(a) * r; }
    const pulso = .8 + .2 * Math.sin(S.rel * 2.6) + .08 * Math.sin(S.rel * 7.3); olhosMat.color.setRGB(1, .28 + .14 * pulso, .07); halos.forEach(h => { h.material.opacity = .22 + .3 * pulso; }); (halos.luzes || []).forEach(l => { l.intensity = .5 + .6 * pulso; });
    const c = formas.cervo.userData.cabeca; if(c){ c.rotation.x = .5 + Math.sin(S.rel * .5) * .08; c.rotation.y = Math.sin(S.rel * .33) * .22; }
    const p = formas.pirarucu.userData; if(p.nado){ p.nado.position.y = 1.1 + Math.sin(S.rel * 1.4) * .08; p.nado.rotation.z = Math.sin(S.rel * 1.2) * .05; p.cauda.rotation.y = Math.sin(S.rel * 3) * .5; }
  }
  const coloca = (x, y, z, yaw) => { raiz.position.set(x, y, z); raiz.rotation.y = yaw || 0; };
  return { g: raiz, formas: formas, S, forma, cicla, tick, coloca, get atual(){ return S.atual; } };
}
