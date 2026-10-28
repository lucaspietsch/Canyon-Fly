import { Group, Mesh, Points, PointsMaterial, TubeGeometry, CatmullRomCurve3, Vector3, RepeatWrapping, CylinderGeometry, TorusGeometry, SphereGeometry, BoxGeometry, MeshStandardMaterial, MeshBasicMaterial, LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, PointLight, AdditiveBlending, DoubleSide, Color, BufferAttribute, OctahedronGeometry, PlaneGeometry, CanvasTexture, SRGBColorSpace } from "three";
import { canvasTex } from "../../lib.js";

/* ============================================================================================================
   MODELOS DOS PERSONAGENS ESPECIAIS (feitos sobre o boneco `pessoa3d` do jogo: mesmo esqueleto, mesma caminhada).
   • SEPÉ TIARAJÚ — liderança guarani histórica (corregedor de São Miguel das Missões, século XVIII). Representação sóbria e digna, sem caricatura: poncho de lã listrado (como nas
     representações históricas), faixa de pano na testa, cabelo longo, pés descalços sob o chiripá escuro, bastão de comando. Sem cocar, sem pintura, sem adereços de fantasia.
     (As cores vêm de dados/personagens.js: ajuste lá quando houver novas referências históricas e artísticas.)
   • TUPÃ — ser supremo da tradição guarani, trovão e céu: figura alta, manto azul-noite com pontos de luz, cabelo claro, halo discreto, luz própria suave e raios sutis ao redor.
   ============================================================================================================ */

const luzTex = (a, b, estrelas) => canvasTex(128, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); if(estrelas){ for(let i = 0; i < 70; i++){ c.fillStyle = "rgba(255,255,255," + (.35 + Math.random() * .6) + ")"; const r = Math.random() * 1.4 + .4; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, r, 0, 7); c.fill(); } } }, { repeat: [3, 1] });
const listras = (cores) => canvasTex(128, 128, (c, w, h) => { const hx = (n) => "#" + n.toString(16).padStart(6, "0"); let y = 0; const seq = [0, 1, 0, 2, 0, 1]; seq.forEach((k, i) => { const hh = i % 2 ? h * .1 : h * .2; c.fillStyle = hx(cores[k]); c.fillRect(0, y, w, hh + 1); y += hh; }); c.fillStyle = hx(cores[1]); c.fillRect(0, y, w, h - y); for(let i = 0; i < 600; i++){ c.fillStyle = "rgba(0,0,0,.07)"; c.fillRect(Math.random() * w, Math.random() * h, 2, 1); } }, { repeat: [3, 1] });

export function constroiSepe(H, def){
  const m = def.modelo, M = H.M, rig = H.pessoa3d({ nome: def.nome, x: 0, y: -50, z: 0, yaw: 0, camisa: M(m.camisa, { roughness: .95 }), manga: M(m.camisa, { roughness: .95 }), calca: M(m.calca, { roughness: .95 }), pele: M(m.pele, { roughness: .8 }), cabelo: m.cabelo, barba: false, rabo: true, olhos: 0x1a1008 });
  rig.capG.visible = false; rig.ocG.visible = false; rig.equip.forEach(o => { o.visible = false; });                      // sem cinto, mosquetão, corda e rádio do Pit
  const poncho = new Mesh(new CylinderGeometry(1.2, 2.1, 1.9, 32, 1, true), new MeshStandardMaterial({ map: listras(m.poncho), roughness: 1, side: DoubleSide })); poncho.position.set(0, 3.05, 0); rig.av.add(poncho);
  const gola = new Mesh(new TorusGeometry(1.18, .09, 8, 28), new MeshStandardMaterial({ color: m.poncho[2], roughness: 1 })); gola.rotation.x = Math.PI / 2; gola.position.y = 3.98; rig.av.add(gola);
  const touca = new Mesh(new SphereGeometry(1.06, 28, 16, 0, Math.PI * 2, 0, Math.PI * .5), new MeshStandardMaterial({ color: m.cabelo, roughness: 1 })); touca.position.set(0, .12, -.04); rig.cab.add(touca);
  const faixa = new Mesh(new TorusGeometry(1.03, .08, 8, 36), new MeshStandardMaterial({ color: m.poncho[0], roughness: 1 })); faixa.rotation.x = Math.PI / 2; faixa.position.y = .42; rig.cab.add(faixa);
  const baston = new Mesh(new CylinderGeometry(.07, .08, 5.2, 10), new MeshStandardMaterial({ color: 0x4a3018, roughness: .9 })); baston.position.set(0, -.4, 0); rig.bD.mao.add(baston); const topo = new Mesh(new SphereGeometry(.17, 12, 10), new MeshStandardMaterial({ color: 0xb08a3a, metalness: .5, roughness: .5 })); topo.position.y = 2.2; baston.add(topo);
  /* arco longo na mão esquerda e aljava nas costas (as flechas são infinitas: ver data/poderes.js) */
  const madeira = new MeshStandardMaterial({ color: 0x6a4524, roughness: .85 }), corda = new MeshStandardMaterial({ color: 0xe8dcc0, roughness: .9 });
  const arco = new Group(); arco.position.set(0, -.55, .1); arco.rotation.set(0, 0, 0); rig.bE.mao.add(arco);
  const curva = new Mesh(new TorusGeometry(1.7, .06, 6, 28, Math.PI * .8), madeira); curva.rotation.z = Math.PI / 2 - Math.PI * .4 + Math.PI; curva.rotation.y = 0; curva.position.set(.0, 0, -1.2); arco.add(curva);
  const fio = new Mesh(new CylinderGeometry(.014, .014, 2.1, 4), corda); fio.position.set(0, 0, -.28); arco.add(fio);
  const aljava = new Mesh(new CylinderGeometry(.22, .2, 1.6, 10), new MeshStandardMaterial({ color: 0x4a2c16, roughness: .95 })); aljava.position.set(.25, .9, -.8); aljava.rotation.z = -.3; rig.tronco.add(aljava);
  for(let i = 0; i < 5; i++){ const f = new Mesh(new CylinderGeometry(.03, .03, .5, 5), madeira); f.position.set(.25 + (i - 2) * .07 + .1, 1.85, -.8 + (i % 2) * .06); f.rotation.z = -.3; rig.tronco.add(f); const pe = new Mesh(new SphereGeometry(.07, 6, 4), new MeshStandardMaterial({ color: 0xb3472e })); pe.scale.set(.5, 1.4, .3); pe.position.set(.25 + (i - 2) * .07 + .1, 2.15, -.8 + (i % 2) * .06); rig.tronco.add(pe); }
  return { id: def.id, nome: def.nome, p: rig, tick(){ } };
}

/* pintura corporal de Tupã: pele com faixas azuis e pretas (zigue-zague e listras), como nas referências */
const pinturaTupa = (pele) => canvasTex(128, 128, (c, w, h) => { const hx = "#" + pele.toString(16).padStart(6, "0"); c.fillStyle = hx; c.fillRect(0, 0, w, h);
  for(let y = 0; y < h; y += 16){ c.fillStyle = (y / 16) % 2 ? "#0b0d1a" : "#1d3f9a"; c.fillRect(0, y + 2, w, 5); }
  c.strokeStyle = "#0b0d1a"; c.lineWidth = 3; c.beginPath(); for(let x = 0; x <= w; x += 8){ const yy = 8 + (x / 8 % 2) * 8; if(x) c.lineTo(x, yy); else c.moveTo(x, yy); } c.stroke();
  c.strokeStyle = "#2c63d8"; c.lineWidth = 2; c.beginPath(); for(let x = 0; x <= w; x += 8){ const yy = 72 + (x / 8 % 2) * 8; if(x) c.lineTo(x, yy); else c.moveTo(x, yy); } c.stroke();
  for(let i = 0; i < 160; i++){ c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect(Math.random() * w, Math.random() * h, 2, 1); } }, { repeat: [2, 2] });

/** TUPÃ — O Deus Criador: cabelo longo preto, grande cocar de penas douradas e brancas, faixa vermelha sobre os olhos, linhas pretas finas no rosto, pintura azul e preta no corpo,
    olhos branco-azulados brilhantes e raios. Parado por alguns segundos: faíscas, vento leve e o céu escurece (como se a tempestade chegasse). */
export function constroiTupa(H, def){
  const m = def.modelo, M = H.M, tinta = M(m.pele, { roughness: .8, emissive: 0x050a22, emissiveIntensity: .5 });
  const rig = H.pessoa3d({ nome: def.nome, x: 0, y: -50, z: 0, yaw: 0, camisa: tinta, manga: tinta, calca: M(m.calca, { roughness: .85 }), pele: M(m.pele, { roughness: .75 }), cabelo: m.cabelo, barba: false, rabo: false, olhos: 0xeaf6ff });
  rig.capG.visible = false; rig.ocG.visible = false; rig.equip.forEach(o => { o.visible = false; }); rig.av.scale.multiplyScalar(1.16);
  const cab = rig.cab, preto = new MeshStandardMaterial({ color: 0x07070b, roughness: .95 });
  /* cabelo longo e preto, caindo pelas costas */
  const cabelo = new Mesh(new CylinderGeometry(.7, .45, 4.6, 18), preto); cabelo.scale.z = .4; cabelo.position.set(0, -2.55, -.82); cab.add(cabelo); const franja = new Mesh(new SphereGeometry(1.07, 24, 14, 0, Math.PI * 2, 0, Math.PI * .46), preto); franja.position.set(0, .1, -.05); cab.add(franja);
  /* faixa vermelha atravessando os olhos + linhas pretas finas */
  const faixaOlhos = new Mesh(new TorusGeometry(1.02, .15, 8, 24, Math.PI * 1.9 * .5, (Math.PI * 170) / 180), new MeshStandardMaterial({ color: 0xb3171a, roughness: .7 })); faixaOlhos.rotation.x = Math.PI / 2; faixaOlhos.scale.set(1, 1, .75); faixaOlhos.position.y = .1; faixaOlhos.rotation.z = 0; cab.add(faixaOlhos);
  for(const sx of [-1, 1]) for(let k = 0; k < 3; k++){ const l = new Mesh(new BoxGeometry(.035, .34, .03), preto); l.position.set(sx * (.25 + k * .1), -.28, .92 - k * .04); l.rotation.z = sx * (.08 + k * .06); cab.add(l); }
  /* pintura corporal: faixas azuis e pretas no tronco e nos braços (a trama do uniforme recebe a cor da pele) */
  { const faixas = (pai, y, r, h, sz = 1) => { const bm = (k) => new MeshStandardMaterial({ color: k ? 0x1d3f9a : 0x0b0d1a, roughness: .7, emissive: k ? 0x0a1a4a : 0x000000, emissiveIntensity: .6, side: DoubleSide }); const q = new Mesh(new CylinderGeometry(r, r, h, 28, 1, true), bm(Math.round(y * 10) % 2)); q.position.y = y; q.scale.z = sz; pai.add(q); };
    for(let i = 0; i < 7; i++){ const y = .18 + i * .22; faixas(rig.tronco, y, .78 + (y / 1.7) * .12 + .012, .1, .76); }
    for(const b of [rig.bD, rig.bE]){ for(let i = 0; i < 4; i++) faixas(b.pv, -.2 - i * .24, .31 - i * .012, .09); for(let i = 0; i < 3; i++) faixas(b.co, -.25 - i * .27, .25 - i * .01, .09); } }
  /* olhos brilhantes branco-azulados */
  const brilho = new MeshBasicMaterial({ color: 0xe6f4ff }), halos = [];
  for(const sx of [-1, 1]){ const o = new Mesh(new SphereGeometry(.12, 12, 8), brilho); o.position.set(sx * .33, .1, .9); o.scale.set(1.3, .8, .5); cab.add(o);
    const h = new Mesh(new SphereGeometry(.26, 12, 8), new MeshBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: .35, blending: AdditiveBlending, depthWrite: false })); h.position.copy(o.position); h.position.z += .03; cab.add(h); halos.push(h); }
  /* grande cocar: leque de penas douradas e brancas atrás e acima da cabeça + faixa dourada na testa */
  const ouro = new MeshStandardMaterial({ color: 0xe0b02e, roughness: .55, metalness: .25 }), branco = new MeshStandardMaterial({ color: 0xf5f0e2, roughness: .8 }), ponta = new MeshStandardMaterial({ color: 0x8a1c1c, roughness: .8 });
  const cocar = new Group(); cocar.position.set(0, .55, -.35); cab.add(cocar); const penas = [];
  for(let fila = 0; fila < 2; fila++){ const n = fila ? 15 : 19, comp = fila ? 3.9 : 3.0;
    for(let i = 0; i < n; i++){ const f = (i / (n - 1) - .5) * (fila ? 2.7 : 3.0), pena = new Group(); const corpo = new Mesh(new SphereGeometry(1, 10, 8), (i + fila) % 2 ? branco : ouro); corpo.scale.set(.2, comp / 2, .05); corpo.position.y = comp / 2; pena.add(corpo);
      const bico = new Mesh(new SphereGeometry(1, 8, 6), ponta); bico.scale.set(.12, .38, .045); bico.position.y = comp * .93; pena.add(bico);
      pena.position.set(Math.sin(f) * .5, Math.cos(f) * .2, -.15 - fila * .22); pena.rotation.z = -f * .95; pena.rotation.x = -.38 - fila * .12; cocar.add(pena); penas.push({ g: pena, rz: pena.rotation.z, fase: Math.random() * 6 }); } }
  const testa = new Mesh(new TorusGeometry(1.04, .11, 8, 36), ouro); testa.rotation.x = Math.PI / 2; testa.position.y = .56; cab.add(testa);
  /* aura, luz própria e raios em volta do corpo */
  const aura = new Mesh(new SphereGeometry(3.1, 20, 14), new MeshBasicMaterial({ color: m.luz, transparent: true, opacity: .05, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })); aura.position.y = 3; rig.av.add(aura);
  const luz = new PointLight(0x4aa8ff, 1.4, 34); luz.position.set(0, 4, .8); rig.av.add(luz);
  /* choques elétricos azul-brilhante em volta do corpo: arcos em zigue-zague (cilindros finos: núcleo claro + brilho azul), refeitos várias vezes por segundo */
  const N = 12, SEG = 7, pos = new Float32Array(N * SEG * 2 * 3), arcos = new Group(); arcos.frustumCulled = false; rig.av.add(arcos);
  const geoSeg = new CylinderGeometry(1, 1, 1, 5), nucleo = new MeshBasicMaterial({ color: 0x8fd0ff }), brilhoAz = new MeshBasicMaterial({ color: 0x1a6dff, transparent: true, opacity: .7, blending: AdditiveBlending, depthWrite: false }), segs = [];
  for(let i = 0; i < N * SEG; i++){ const n = new Mesh(geoSeg, nucleo), b = new Mesh(geoSeg, brilhoAz); arcos.add(n, b); segs.push([n, b]); }
  const eixo = new Vector3(0, 1, 0), va = new Vector3(), vb = new Vector3(), vd = new Vector3();
  const poeSeg = (par, k) => { va.set(pos[k * 6], pos[k * 6 + 1], pos[k * 6 + 2]); vb.set(pos[k * 6 + 3], pos[k * 6 + 4], pos[k * 6 + 5]); vd.subVectors(vb, va); const L = vd.length() || .01;
    for(let j = 0; j < 2; j++){ const o = par[j]; o.position.copy(va).addScaledVector(vd, .5); o.quaternion.setFromUnitVectors(eixo, vd.clone().normalize()); o.scale.set(j ? .13 : .04, L * .5 + .07, j ? .13 : .04); } };
  /* faíscas */
  const NF = 36, fpos = new Float32Array(NF * 3), fg = new BufferGeometry(); fg.setAttribute("position", new Float32BufferAttribute(fpos, 3)); const faiscas = new Points(fg, new PointsMaterial({ color: 0xbfdcff, size: .16, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })); faiscas.frustumCulled = false; rig.av.add(faiscas);
  let t = 0, tr = 0, parado = 0, ult = null, intens = 0;
  function refaz(forca){ let k = 0; const base = .55 + .45 * forca;                                  // sempre há choques; ficam mais fortes quando ele está parado
    for(let i = 0; i < N; i++){ const a0 = Math.random() * 6.283, h0 = .5 + Math.random() * 5.6, r0 = 1.0 + Math.random() * 1.5, dir = Math.random() < .5 ? 1 : -1, viva = Math.random() < base; let x = Math.cos(a0) * r0, y = h0, z = Math.sin(a0) * r0;
      for(let s2 = 0; s2 < SEG; s2++){ const nx = x + (Math.random() - .5) * .9, ny = y + dir * (.2 + Math.random() * .5), nz = z + (Math.random() - .5) * .9; pos[k * 6] = x; pos[k * 6 + 1] = y; pos[k * 6 + 2] = z; pos[k * 6 + 3] = nx; pos[k * 6 + 4] = ny; pos[k * 6 + 5] = nz; poeSeg(segs[k], k); segs[k][0].visible = segs[k][1].visible = viva; k++; x = nx; y = ny; z = nz; } } }
  refaz(0);
  /* quando fica parado, o céu escurece (cortina azul-noite nas bordas) e o vento sopra */
  let cortina = null, ultTick = 0; const ui = () => (H.mundo && H.mundo.ui) || null;
  const mostraCortina = (k) => { const u = ui(); if(!u) return; if(!cortina){ cortina = document.createElement("div"); cortina.style.cssText = "position:absolute;inset:0;z-index:20;pointer-events:none;opacity:0;transition:opacity 1.2s;background:radial-gradient(ellipse at 50% 40%,rgba(10,16,48,0) 25%,rgba(6,9,34,.7) 100%);mix-blend-mode:multiply;"; } if(!cortina.parentNode) u.appendChild(cortina); cortina.style.opacity = String(k); };
  const vigia = setInterval(() => { if(cortina && performance.now() - ultTick > 700){ cortina.style.opacity = "0"; } }, 400);
  return { id: def.id, nome: def.nome, p: rig, dispose(){ clearInterval(vigia); if(cortina) cortina.remove(); },
    tick(dt){ t += dt; tr -= dt; ultTick = performance.now(); const pp = rig.av.position; if(ult && Math.hypot(pp.x - ult[0], pp.z - ult[1]) < .02) parado += dt; else parado = 0; ult = [pp.x, pp.z];
      const alvo = parado > 4 ? 1 : 0; intens += (alvo - intens) * Math.min(1, dt * .8); if(tr <= 0){ tr = .14 + Math.random() * .25 - intens * .08; refaz(intens); }
      mostraCortina(intens * .9); faiscas.material.opacity = intens * .9; for(let i = 0; i < NF; i++){ const a = t * (.6 + (i % 5) * .15) + i, r = 1.4 + (i % 7) * .22; fpos[i * 3] = Math.cos(a) * r; fpos[i * 3 + 1] = ((t * .5 + i * .37) % 1) * 6.5; fpos[i * 3 + 2] = Math.sin(a) * r; } fg.attributes.position.needsUpdate = true;
      const k = .8 + .2 * Math.sin(t * 2.2); luz.intensity = (.6 + .4 * k) * (1 + intens * 1.4); aura.scale.setScalar(1 + .04 * Math.sin(t * 1.7) + intens * .15); halos.forEach(h => { h.material.opacity = .3 + .2 * k + intens * .3; });
      cabelo.rotation.x = Math.sin(t * 1.3) * .03 * (1 + intens * 3); penas.forEach(p => { p.g.rotation.z = p.rz + Math.sin(t * 1.6 + p.fase) * .02 * (1 + intens * 4); }); } };
}

/* penas escuras e barradas (como as do cocar kaingang): fundo marrom-acinzentado com listras claras */
const penaBarrada = () => canvasTex(64, 128, (c, w, h) => { c.fillStyle = "#3a3330"; c.fillRect(0, 0, w, h); c.fillStyle = "#cfcac0"; for(let y = 6; y < h; y += 11){ c.beginPath(); c.moveTo(w / 2, y); c.lineTo(2, y - 7); c.lineTo(2, y - 2); c.lineTo(w / 2, y + 4); c.fill(); c.beginPath(); c.moveTo(w / 2, y); c.lineTo(w - 2, y - 7); c.lineTo(w - 2, y - 2); c.lineTo(w / 2, y + 4); c.fill(); } c.fillStyle = "#171210"; c.fillRect(w / 2 - 1, 0, 2, h); });
/* pele de cobra-coral: anéis vermelho, preto, amarelo, preto */
const peleCoral = () => { const t = canvasTex(128, 32, (c, w, h) => { c.fillStyle = "#c4161c"; c.fillRect(0, 0, w, h); c.fillStyle = "#0c0b0b"; c.fillRect(64, 0, 16, h); c.fillRect(112, 0, 16, h); c.fillStyle = "#e9c92a"; c.fillRect(80, 0, 32, h); }); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(10, 1); return t; };

/** ATIARA — indígena kaingang dos anos 1950: cabelo crespo, cocar de penas escuras com duas brancas, bandana vermelha, alargadores nas orelhas, osso atravessando o nariz,
    olhos luminosos e colar de cobra-coral. Peito nu, calça de pano rústico. (Cores e brilho dos olhos: dados/personagens.js → modelo.) */
export function constroiAtiara(H, def){
  const m = def.modelo, M = H.M, tinta = M(m.pele, { roughness: .8 });
  const rig = H.pessoa3d({ nome: def.nome, x: 0, y: -50, z: 0, yaw: 0, camisa: tinta, manga: tinta, calca: M(m.calca, { roughness: .95 }), pele: M(m.pele, { roughness: .75 }), cabelo: m.cabelo, barba: false, rabo: false, olhos: m.luz });
  rig.capG.visible = false; rig.ocG.visible = false; rig.equip.forEach(o => { o.visible = false; });
  const cab = rig.cab, preto = new MeshStandardMaterial({ color: 0x0a0807, roughness: 1 });
  /* cabelo crespo: calota preta com cachos */
  const calota = new Mesh(new SphereGeometry(1.07, 24, 14, 0, Math.PI * 2, 0, Math.PI * .5), preto); calota.position.set(0, .1, -.04); cab.add(calota);
  for(let i = 0; i < 46; i++){ const a = i * 2.399, r = Math.sqrt(i / 46), c = new Mesh(new SphereGeometry(.17 + (i % 3) * .02, 8, 6), preto); c.position.set(Math.sin(a) * r * .95, .2 + Math.cos(r * 1.5) * .86 * (1 - r * .15), Math.cos(a) * r * .95 - .05); cab.add(c); }
  /* bandana vermelha na testa, com nó e pontas atrás */
  const pano = new MeshStandardMaterial({ color: m.bandana, roughness: .85 });
  const banda = new Mesh(new TorusGeometry(1.03, .13, 8, 36), pano); banda.rotation.x = Math.PI / 2; banda.position.y = .38; banda.scale.set(1, 1, 1.02); cab.add(banda);
  const no = new Mesh(new SphereGeometry(.2, 10, 8), pano); no.position.set(0, .38, -1.05); cab.add(no);
  for(const sx of [-1, 1]){ const p = new Mesh(new BoxGeometry(.2, .75, .04), pano); p.position.set(sx * .13, -.0, -1.12); p.rotation.z = sx * .18; cab.add(p); }
  /* olhos luminosos */
  const brilho = new MeshBasicMaterial({ color: m.luz }), halos = [];
  for(const sx of [-1, 1]){ const o = new Mesh(new SphereGeometry(.13, 12, 8), brilho); o.position.set(sx * .33, .08, .9); o.scale.set(1.3, .8, .5); cab.add(o);
    const h = new Mesh(new SphereGeometry(.27, 12, 8), new MeshBasicMaterial({ color: m.luz, transparent: true, opacity: .35, blending: AdditiveBlending, depthWrite: false })); h.position.copy(o.position); h.position.z += .03; cab.add(h); halos.push(h); }
  /* alargadores de madeira nas orelhas */
  const madeira = new MeshStandardMaterial({ color: 0x7a4a24, roughness: .7 });
  for(const sx of [-1, 1]){ const a = new Mesh(new TorusGeometry(.17, .06, 8, 18), madeira); a.rotation.y = Math.PI / 2; a.position.set(sx * 1.05, -.22, .02); cab.add(a); const d = new Mesh(new CylinderGeometry(.13, .13, .05, 14), preto); d.rotation.z = Math.PI / 2; d.position.set(sx * 1.05, -.22, .02); cab.add(d); }
  /* osso atravessando o nariz */
  const osso = new Mesh(new CylinderGeometry(.045, .045, 1.15, 8), new MeshStandardMaterial({ color: 0xf1ead6, roughness: .55 })); osso.rotation.z = Math.PI / 2; osso.position.set(0, -.17, 1.0); cab.add(osso);
  for(const sx of [-1, 1]){ const pt = new Mesh(new SphereGeometry(.055, 8, 6), new MeshStandardMaterial({ color: 0xf1ead6, roughness: .55 })); pt.position.set(sx * .58, -.17, 1.0); cab.add(pt); }
  /* cocar: leque de penas escuras barradas em volta da cabeça, com duas penas brancas no alto */
  const barrada = new MeshStandardMaterial({ map: penaBarrada(), roughness: .9, side: DoubleSide }), branca = new MeshStandardMaterial({ color: 0xf5f0e2, roughness: .8, side: DoubleSide });
  const cocar = new Group(); cocar.position.set(0, .35, -.55); cocar.rotation.x = -.42; cab.add(cocar); const penas = [];
  for(let fila = 0; fila < 2; fila++){ const n = fila ? 17 : 21, comp = fila ? 2.6 : 2.1;
    for(let i = 0; i < n; i++){ const f = (i / (n - 1) - .5) * Math.PI * 1.45, pena = new Group(), corpo = new Mesh(new SphereGeometry(1, 10, 8), barrada); corpo.scale.set(.28, comp / 2, .05); corpo.position.y = comp / 2 + .9; pena.add(corpo);
      pena.rotation.z = -f; pena.position.z = -fila * .12; cocar.add(pena); penas.push({ g: pena, rz: -f, fase: Math.random() * 6 }); } }
  for(const sx of [-1, 1]){ const b = new Mesh(new SphereGeometry(1, 10, 8), branca); b.scale.set(.2, 1.5, .05); b.position.set(sx * .3, 3.25, .12); b.rotation.z = -sx * .18; cocar.add(b); }
  /* colar de cobra-coral: enrolada ao pescoço, a cabeça descansa no peito */
  const pts = [], N = 26;
  for(let i = 0; i < N; i++){ const t = (i / N) * Math.PI * 2, fr = Math.max(0, Math.cos(t)), x = Math.sin(t) * (.66 + .1 * fr), z = Math.cos(t) * (.5 + .27 * fr) + (fr > 0 ? 0 : -.02);
    const sup = 1.72 + .48 * Math.sqrt(Math.max(0, 1 - (x / .92) ** 2 - (z / .66) ** 2)); pts.push(new Vector3(x, Math.max(1.5 - .7 * fr ** 1.2 + .5, fr > .2 ? 2.02 - .75 * fr ** 1.4 : sup + .05), z)); }
  const cobra = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts, true), 140, .09, 8, true), new MeshStandardMaterial({ map: peleCoral(), roughness: .45 })); rig.tronco.add(cobra);
  const cabeca = new Mesh(new SphereGeometry(1, 12, 8), new MeshStandardMaterial({ color: 0x0c0b0b, roughness: .4 })); cabeca.scale.set(.12, .09, .2); cabeca.position.set(.12, 1.3, .84); cabeca.rotation.x = .35; rig.tronco.add(cabeca);
  const anel = new Mesh(new CylinderGeometry(.115, .115, .05, 10), new MeshStandardMaterial({ color: 0xe9c92a, roughness: .4 })); anel.rotation.x = Math.PI / 2 + .35; anel.position.set(.12, 1.35, .72); rig.tronco.add(anel);
  /* luz própria suave */
  const luz = new PointLight(m.luz, .5, 14); luz.position.set(0, 4.6, 1.6); rig.av.add(luz);
  let t = 0;
  return { id: def.id, nome: def.nome, p: rig, tick(dt){ t += dt; const k = .85 + .15 * Math.sin(t * 2.4); halos.forEach(h => { h.material.opacity = .28 + .2 * k; }); luz.intensity = .35 + .25 * k; penas.forEach(p => { p.g.rotation.z = p.rz + Math.sin(t * 1.4 + p.fase) * .012; }); } };
}

/* OPERADOR (vaga genérica, aparência padrão da equipe até a pessoa autorizar e enviar os dados): farda verde-oliva, capacete laranja, sem barba. */
/* duas tranças caindo pela frente dos ombros até o peito (Mary): tubo ao longo de uma curva + "gomos" (esferas) + elástico colorido na ponta.
   Fica no grupo do boneco (não acompanha o giro da cabeça); a cor é a do cabelo (modelo.cabelo), e a transformação recolore junto com o cabelo. */
function trancasFrontais(av, cor){
  const mat = new MeshStandardMaterial({ color: cor, roughness: 1 }), elast = new MeshStandardMaterial({ color: 0xc0392b, roughness: .8 });
  [-1, 1].forEach(sx => {
    const pts = [[.55, 4.45, .1], [.92, 4.05, .45], [1.0, 3.6, .8], [.9, 3.1, 1.0], [.8, 2.55, 1.02]].map(([x, y, z]) => new Vector3(sx * x, y, z));
    const curva = new CatmullRomCurve3(pts), tubo = new Mesh(new TubeGeometry(curva, 24, .12, 10, false), mat); tubo.name = "tranca"; av.add(tubo);
    for(let k = 1; k <= 7; k++){ const p = curva.getPoint(k / 8), g = new Mesh(new SphereGeometry(.15, 12, 10), mat); g.position.copy(p); g.scale.set(1, .8, 1); g.name = "tranca"; av.add(g); }
    const fim = curva.getPoint(1), e = new Mesh(new TorusGeometry(.12, .035, 8, 16), elast); e.position.copy(fim); e.rotation.x = Math.PI / 2; e.name = "tranca"; av.add(e);
    const ponta = new Mesh(new SphereGeometry(.1, 10, 8), mat); ponta.position.set(fim.x, fim.y - .18, fim.z); ponta.scale.set(.8, 1.4, .8); ponta.name = "tranca"; av.add(ponta);
  });
}
export function constroiOperador(H, def){
  const M = H.M, rig = H.pessoa3d({ nome: def.nome, x: 0, y: -50, z: 0, yaw: 0, camisa: M(0x56642d), manga: M(0x56642d), calca: M(0x4a5729), pele: H.pele.media, capacete: M(0xe8731a, { roughness: .45, metalness: .1 }), cabelo: (def.modelo && def.modelo.cabelo) || 0x1e140d, barba: !!(def.modelo && def.modelo.barba), pin: { barra: "#0a0a0a", pil: 1, mosq: "#ece3cf" } });      // barba por operador (dados/personagens.js → modelo.barba)
  if(def.modelo && def.modelo.trancas) trancasFrontais(rig.av, (def.modelo && def.modelo.cabelo) || 0x1e140d);
  return { id: def.id, nome: def.nome, p: rig, tick(){ } };
}

/* ============================================================================================================
   OPERADORAS (Diully, Mary): base feminina por cima do pessoa3d — rosto suave (sem barba/óculos), olhos com íris, pupila, reflexo, cílios e
   sobrancelhas finas, blush, batom, cabelo volumoso (mechas sólidas + cards translúcidos com fios), brincos, colar, pulseira; piscar e balanço
   do cabelo no tick. Efeitos da forma de poder em rig.fx (partículas douradas / fogo e gelo nas mãos), ligados pela transformação.
   Cores e opções em dados/personagens.js → modelo: { feminina, cabelo, olhos, labios, pele, rabo, trancas, coque, brincos, colar } e transformacao.
   ============================================================================================================ */
const texFios = (cor) => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d"); x.clearRect(0, 0, 64, 256);
  const hex = "#" + cor.toString(16).padStart(6, "0"); for(let k = 0; k < 26; k++){ const px = 2 + (k * 2.4 + (k % 3) * 1.3) % 60, a = .35 + ((k * 7) % 5) * .13; x.strokeStyle = hex; x.globalAlpha = a; x.lineWidth = 1.2 + (k % 2) * .8; x.beginPath(); x.moveTo(px, 0); x.quadraticCurveTo(px + (k % 2 ? 4 : -4), 128, px + (k % 3 - 1) * 5, 256); x.stroke(); }
  const tx = new CanvasTexture(c); tx.colorSpace = SRGBColorSpace; return tx; };
function particulas(n, cor, tam){ const g = new BufferGeometry(), pos = new Float32Array(n * 3); g.setAttribute("position", new BufferAttribute(pos, 3));
  const p = new Points(g, new PointsMaterial({ color: cor, size: tam, transparent: true, opacity: .9, depthWrite: false, blending: AdditiveBlending })); p.frustumCulled = false; p.visible = false; return { p, pos, n, vida: new Float32Array(n), seed: new Float32Array(n).map(() => Math.random()) }; }
export function constroiOperadora(H, def){
  const M = H.M, mo = def.modelo || {}, corCab = mo.cabelo || 0x3a2416, T = def.transformacao || {};
  const rabo = mo.rabo === "dia" ? (new Date().getDate() % 2 === 0) : !!mo.rabo;                                                      // "dia": rabo de cavalo em dias pares, solto nos ímpares
  const rig = H.pessoa3d({ nome: def.nome, x: 0, y: -50, z: 0, yaw: 0, camisa: M(0x56642d), manga: M(0x56642d), calca: M(0x4a5729), pele: mo.pele ? M(mo.pele, { roughness: .55 }) : H.pele.clara,
    capacete: M(0xe8731a, { roughness: .45, metalness: .1 }), cabelo: corCab, barba: false, oculos: false, olhos: mo.olhos || 0x5a3d26, labios: mo.labios || 0xc0506a, rabo, pin: { barra: "#0a0a0a", pil: 1, mosq: "#ece3cf" } });
  const av = rig.av, cab = rig.cab, mk = (g, mat, x, y, z, pai) => { const o = new Mesh(g, mat); o.position.set(x, y, z); (pai || cab).add(o); return o; };
  /* rosto mais suave: mandíbula e nariz menores, bochechas viram blush */
  const esf = cab.children.filter(o => o.isMesh && o.geometry.type === "SphereGeometry");
  if(esf[1]) esf[1].scale.set(.92, .86, .9); if(esf[4]) esf[4].scale.set(.8, .95, .9);
  [esf[2], esf[3]].forEach(b => { if(b){ b.material = M(0xe8a090, { roughness: .7, transparent: true, opacity: .38 }); b.scale.set(.7, .5, .4); b.position.y -= .06; b.position.z += .08; } });
  /* olhos: pupila, reflexo, cílios, delineado, sobrancelha fina */
  const pele = M(0xf1cdb8), lash = M(0x1a1010, { roughness: .8 });
  [-1, 1].forEach(sx => { mk(new SphereGeometry(.035, 8, 6), M(0x0a0806), sx * .33, .08, .955); mk(new SphereGeometry(.02, 6, 5), new MeshBasicMaterial({ color: 0xffffff }), sx * .31, .11, .965);
    const c = mk(new TorusGeometry(.165, .018, 6, 14, Math.PI), lash, sx * .33, .09, .93); c.rotation.z = 0; c.scale.set(1.1, .7, 1);                                    // cílios/delineado superior
    for(let k = 0; k < 4; k++){ const f = mk(new BoxGeometry(.012, .07, .012), lash, sx * (.2 + k * .085), .19, .92); f.rotation.z = sx * (-.2 - k * .12); }           // cílios soltos
    const sb = cab.children.find(o => o.isMesh && o.geometry.type === "BoxGeometry" && Math.abs(o.position.x - sx * .33) < .01 && Math.abs(o.position.y - .27) < .01); if(sb){ sb.scale.set(.95, .55, .6); sb.material = M(corCab, { roughness: .9 }); } });
  /* boca menor e fechada num sorriso suave: encolhe a boca aberta e os dentes do boneco base */
  cab.children.filter(o => o.isMesh && (o.geometry.type === "CircleGeometry" || (o.geometry.type === "PlaneGeometry" && Math.abs(o.position.y + .455) < .01))).forEach(o => { o.scale.multiplyScalar(.55); o.position.y += .03; });
  /* lábios: batom em dois tons (lábio superior + inferior) */
  const batom = M(mo.labios || 0xc0506a, { roughness: .35 }); mk(new TorusGeometry(.19, .04, 8, 16, Math.PI), batom, 0, -.46, .935).rotation.z = Math.PI; const li = mk(new SphereGeometry(.12, 12, 8), batom, 0, -.57, .93); li.scale.set(1.7, .5, .5);
  /* cabelo volumoso: mechas sólidas atrás e dos lados + cards translúcidos com fios; fica guardado para balançar */
  const matCab = M(corCab, { roughness: .5, metalness: .08 }), fios = new MeshStandardMaterial({ map: texFios(corCab), transparent: true, alphaTest: .15, side: DoubleSide, roughness: .5, depthWrite: false });
  const cabG = new Group(); cab.add(cabG); const mechas = [];
  const solto = !rabo && !mo.coque && !mo.trancas;
  if(solto){ for(let k = 0; k < 9; k++){ const a = -Math.PI * .72 + k * (Math.PI * 1.44 / 8), r = .78, comp = 2.0 + Math.abs(Math.sin(a)) * .5, me = mk(new CylinderGeometry(.11, .17, comp, 10), matCab, Math.sin(a) * r, -.25 - comp / 2, Math.cos(a) * r - .35, cabG); me.rotation.z = -Math.sin(a) * .12; me.rotation.x = -.08; mechas.push(me); }
    for(let k = 0; k < 10; k++){ const a = -Math.PI * .8 + k * (Math.PI * 1.6 / 9), r = .92, card = mk(new PlaneGeometry(.55, 2.4), fios, Math.sin(a) * r, -1.25, Math.cos(a) * r - .35, cabG); card.rotation.y = a + Math.PI; card.rotation.x = .05; mechas.push(card); } }
  else if(mo.coque){ const coque = mk(new SphereGeometry(.42, 16, 12), matCab, 0, -.35, -.95, cabG); coque.scale.set(1.1, .9, .9); mk(new TorusGeometry(.26, .05, 8, 16), M(mo.laco || 0xd14b7a, { roughness: .6 }), 0, -.35, -.95, cabG).rotation.y = .3;
    for(let k = 0; k < 6; k++){ const a = -Math.PI * .6 + k * (Math.PI * 1.2 / 5), card = mk(new PlaneGeometry(.4, 1.1), fios, Math.sin(a) * .9, -.75, Math.cos(a) * .9 - .4, cabG); card.rotation.y = a + Math.PI; mechas.push(card); } }
  if(rabo){ for(let k = 0; k < 5; k++){ const card = mk(new PlaneGeometry(.35, 1.6), fios, (k - 2) * .12, -1.15, -1.15 - Math.abs(k - 2) * .04, cabG); card.rotation.y = (k - 2) * .35; mechas.push(card); } }
  for(let k = 0; k < 4; k++){ const sx = k < 2 ? -1 : 1, f = mk(new PlaneGeometry(.3, .9), fios, sx * (.85 + (k % 2) * .08), -.55, .35 - (k % 2) * .3, cabG); f.rotation.y = sx * (Math.PI / 2 + .2); mechas.push(f); }   // fios que escapam do capacete nas laterais
  if(mo.trancas) trancasFrontais(av, corCab);
  /* acessórios: brincos, colar com pingente, pulseira/relógio */
  const ouro = M(0xd4af37, { roughness: .25, metalness: .9 }), prata = M(0xd8dde6, { roughness: .25, metalness: .9 }), metalA = mo.colar === "prata" ? prata : ouro;
  [-1, 1].forEach(sx => { if(mo.brincos === "argola"){ const b = mk(new TorusGeometry(.13, .018, 8, 20), metalA, sx * .92, -.3, -.04); b.rotation.y = Math.PI / 2; } else { mk(new SphereGeometry(.045, 10, 8), metalA, sx * .93, -.2, -.02); } });
  const colar = mk(new TorusGeometry(.44, .014, 8, 36), metalA, 0, 4.0, .05, av); colar.rotation.x = Math.PI / 2 + .25; mk(new SphereGeometry(.06, 10, 8), metalA, 0, 3.72, .5, av);
  if(rig.bE && rig.bE.mao){ const pul = mk(new TorusGeometry(.2, .025, 8, 20), metalA, 0, .12, 0, rig.bE.mao); pul.rotation.x = 0; if(mo.relogio !== false){ const rl = mk(new BoxGeometry(.14, .05, .12), M(0x202228, { roughness: .4, metalness: .6 }), 0, .12, .2, rig.bE.mao); rl.rotation.x = .2; } }
  if(rig.bD && rig.bD.mao) [0, 1].forEach(k => mk(new TorusGeometry(.045, .012, 6, 12), metalA, .08 - k * .1, -.05, .12, rig.bD.mao));                                   // anéis delicados
  /* ---- efeitos da forma de poder ---- */
  const fx = { on: false, t: 0, itens: [] };
  const maoD = rig.bD && rig.bD.mao, maoE = rig.bE && rig.bE.mao;
  if(T.particulas === "ouro"){ const P = particulas(90, 0xffd66a, .13); av.add(P.p); fx.itens.push({ P, tipo: "ouro" }); const l = new PointLight(0xffc860, 0, 9); l.position.set(0, 3, .6); l.visible = false; av.add(l); fx.luz = l; }
  if(T.maos){ if(T.maos.direita === "fogo" && maoD){ const P = particulas(70, 0xff7a1a, .16); maoD.add(P.p); fx.itens.push({ P, tipo: "fogo" }); const l = new PointLight(0xff8a30, 0, 6); l.visible = false; maoD.add(l); fx.luzD = l; }
    if(T.maos.esquerda === "gelo" && maoE){ const P = particulas(50, 0xbfe9ff, .1); maoE.add(P.p); fx.itens.push({ P, tipo: "gelo" }); const cr = new Group(); cr.visible = false; maoE.add(cr); fx.cristais = cr;
      for(let k = 0; k < 6; k++){ const c = new Mesh(new OctahedronGeometry(.07 + (k % 3) * .03, 0), new MeshStandardMaterial({ color: 0xd8f3ff, emissive: 0x7fd0ff, emissiveIntensity: .8, roughness: .1, metalness: .2, transparent: true, opacity: .85 })); const a = k / 6 * Math.PI * 2; c.position.set(Math.cos(a) * .28, -.1 + (k % 2) * .18, Math.sin(a) * .28); c.rotation.set(a, a * .7, 0); cr.add(c); }
      const l = new PointLight(0x9fd8ff, 0, 6); l.visible = false; maoE.add(l); fx.luzE = l; } }
  fx.liga = () => { fx.on = true; fx.itens.forEach(i => { i.P.p.visible = true; i.P.vida.fill(0); }); [fx.luz, fx.luzD, fx.luzE].forEach(l => { if(l){ l.visible = true; l.intensity = 0; } }); if(fx.cristais) fx.cristais.visible = true; };
  fx.desliga = () => { fx.on = false; fx.itens.forEach(i => { i.P.p.visible = false; }); [fx.luz, fx.luzD, fx.luzE].forEach(l => { if(l) l.visible = false; }); if(fx.cristais) fx.cristais.visible = false; };
  fx.tick = (dt) => { if(!fx.on) return; fx.t += dt; const pulso = .75 + .25 * Math.sin(fx.t * 3);
    if(fx.luz) fx.luz.intensity = 14 * pulso; if(fx.luzD) fx.luzD.intensity = 9 * (.7 + .3 * Math.sin(fx.t * 9)); if(fx.luzE) fx.luzE.intensity = 6 * pulso; if(fx.cristais) fx.cristais.rotation.y += dt * .8;
    fx.itens.forEach(({ P, tipo }) => { const a = P.pos; for(let k = 0; k < P.n; k++){ P.vida[k] -= dt; if(P.vida[k] <= 0){ P.vida[k] = .6 + P.seed[k] * 1.2; const r = tipo === "ouro" ? 1.1 + P.seed[k] * 1.1 : .22, ang = P.seed[k] * Math.PI * 2 + fx.t;
          a[k * 3] = Math.cos(ang) * r; a[k * 3 + 1] = tipo === "ouro" ? .3 + P.seed[k] * 4.6 : 0; a[k * 3 + 2] = Math.sin(ang) * r; }
        a[k * 3 + 1] += dt * (tipo === "fogo" ? 1.6 : tipo === "ouro" ? .5 : .35); if(tipo === "gelo"){ a[k * 3] += Math.sin(fx.t * 2 + k) * dt * .15; } }
      P.p.geometry.attributes.position.needsUpdate = true; P.p.material.opacity = .6 + .3 * Math.sin(fx.t * 5); }); };
  /* ---- piscar e balanço do cabelo ---- */
  const olhos = cab.children.filter(o => o.isMesh && o.geometry.type === "SphereGeometry" && Math.abs(Math.abs(o.position.x) - .33) < .02 && Math.abs(o.position.y - .08) < .02);
  let tPisca = 2 + Math.random() * 3, piscando = 0, tt = 0;
  function tick(dt){ tt += dt; tPisca -= dt; if(tPisca <= 0){ piscando = .13; tPisca = 2.5 + Math.random() * 3.5; } if(piscando > 0){ piscando -= dt; const s = piscando > 0 ? .15 : 1; olhos.forEach(o => { o.scale.y = s * (o.scale.x > 1 ? .8 : 1); }); }
    const v = .025 + (H.M && M.vento ? 0 : 0); mechas.forEach((me, k) => { me.rotation.z = (me.userData.rz0 === undefined ? (me.userData.rz0 = me.rotation.z) : me.userData.rz0) + Math.sin(tt * 1.7 + k * .9) * v; });
    fx.tick(dt); }
  return { id: def.id, nome: def.nome, p: rig, tick, fx, mechas };
}
