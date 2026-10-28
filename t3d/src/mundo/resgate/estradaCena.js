import { Group, Mesh, InstancedMesh, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, CylinderGeometry, LineSegments, LineBasicMaterial, Matrix4, Quaternion, Vector3, Euler, Color, DynamicDrawUsage } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U, ESTRADA as C } from "../config.js";

/* ============================================================================================================
   CENÁRIO DA ESTRADA PARA A CIDADE — blocos (chunks) carregados por proximidade do jogador e descartados quando ele se afasta:
   • terreno do corredor (campos) em volta da estrada, com cor variada; descendo suavemente até o horizonte nas bordas
   • cercas de arame com moirões de madeira nos dois lados, com porteiras de tempos em tempos
   • bueiros (tubos de concreto) sob o aterro perto da turfeira
   • placa "Cambará do Sul" na saída do estacionamento (sempre legível, nunca espelhada)
   • capões de mata ao longo da estrada (polígonos gerados: viram mata para o sistema de árvores)
   Tudo em unidades do mundo (u). 1 m = 2,94 u.
   ============================================================================================================ */

const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s), sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; };

export function criarCenaEstrada(M){
  const { cen } = M, EST = M.estrada, grupo = new Group(); cen.grupo.add(grupo);
  const CH = 640, CARGA = 2600 * 1, DESCARGA = 3600, chunks = new Map();                       // blocos de 640 u de rota; carrega a < 2600 u do jogador, descarta a > 3600 u
  const S = { tt: 0, capoes: [], placa: null, ultJ: null };

  /* ---------- materiais compartilhados ---------- */
  const texCampo = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#8a9a4e"; c.fillRect(0, 0, w, h); for(let i = 0; i < 1600; i++){ const t = Math.random(); c.fillStyle = "rgba(" + (110 + t * 70 | 0) + "," + (120 + t * 60 | 0) + "," + (50 + t * 30 | 0) + ",.35)"; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2); } }, { repeat: [1, 1] });
  const matCampo = new MeshStandardMaterial({ map: texCampo, vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  const matMadeira = new MeshStandardMaterial({ color: 0x6b4a2c, roughness: .95 }), matConcreto = new MeshStandardMaterial({ color: 0xa9a59c, roughness: .9 }), matBranco = new MeshStandardMaterial({ color: 0xd9d4c4, roughness: .85 });
  const matFio = new LineBasicMaterial({ color: 0xb4b6ba });
  const geoPoste = new BoxGeometry(.38, 3.9, .38).translate(0, 1.95, 0), geoTubo = new CylinderGeometry(1, 1, 1, 14, 1, true).rotateZ(Math.PI / 2), geoBoca = new BoxGeometry(1, 1, 1);

  /* ---------- um bloco ---------- */
  function criaChunk(k){
    const g = new Group(), s0 = k * CH, s1 = Math.min(EST.len, s0 + CH); if(s1 <= s0) return null;
    /* terreno do corredor */
    const LAT = [-1, -.82, -.6, -.4, -.25, -.14, -.07, 0, .07, .14, .25, .4, .6, .82, 1].map(f => f * (EST.CW + EST.BORDA)), nl = LAT.length, nr = Math.max(2, Math.ceil((s1 - s0) / 40)), pos = [], col = [], uv = [], idx = [];
    for(let r = 0; r <= nr; r++){ const q = EST.amostra(s0 + (s1 - s0) * r / nr), nx = -q.tz, nz = q.tx;
      for(let c = 0; c < nl; c++){ const x = q.x + nx * LAT[c], z = q.z + nz * LAT[c], y = cen.relevo(x, z); pos.push(x, y - .02, z); const t = vn(x / 140, z / 140, 3), t2 = vn(x / 30, z / 30, 9); const k2 = .78 + .3 * t + .1 * t2; col.push(k2 * .95, k2, k2 * .8); uv.push(x / 150, z / 150); }
      if(r) for(let c = 0; c < nl - 1; c++){ const a = (r - 1) * nl + c, b = a + 1, d = r * nl + c, e = d + 1; idx.push(a, b, d, b, e, d); } }
    const geo = new BufferGeometry(); geo.setAttribute("position", new Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new Float32BufferAttribute(col, 3)); geo.setAttribute("uv", new Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const terr = new Mesh(geo, matCampo); terr.receiveShadow = true; terr.frustumCulled = true; g.add(terr);
    /* cercas */
    if(C.cercas.ativo){
      const lado = C.cercas.ladoM * U, esp = C.cercas.posteEspM * U, postes = [], fios = [], portoes = [], nPostes = Math.ceil((s1 - s0) / esp);
      for(const sg of [-1, 1]){ let ant = null;
        for(let i = 0; i <= nPostes; i++){ const s = s0 + i * esp; if(s > s1 + 1 || s < 60 * U){ ant = null; continue; } const q = EST.amostra(s), x = q.x - q.tz * lado * sg, z = q.z + q.tx * lado * sg;
          const per = C.cercas.portaoACadaM * U, cel = Math.floor(s / per), sPort = (cel + .25 + .5 * hash(cel, sg, 5)) * per, portao = !!C.cercas.portaoACadaM && Math.abs(s - sPort) < C.cercas.portaoLarguraM * U * .6 && hash(cel, sg, 7) < .75;
          const solo = cen.relevo(x, z);
          if(EST.proximo(x, z) && EST.proximo(x, z).d < EST.BED + 8) { ant = null; continue; }
          if(!portao) postes.push([x, solo, z, Math.atan2(q.tx, q.tz)]);
          if(portao){ portoes.push({ x, y: solo, z, yaw: Math.atan2(q.tx, q.tz) }); ant = null; continue; }
          if(ant && Math.hypot(x - ant[0], z - ant[2]) < esp * 1.6) for(const h of C.cercas.fios === 4 ? [.4, .7, 1.0, 1.25] : [.45, .85, 1.25]){ fios.push(ant[0], ant[1] + h * U, ant[2], x, solo + h * U, z); }
          ant = [x, solo, z]; } }
      if(postes.length){ const im = new InstancedMesh(geoPoste, matMadeira, postes.length), m4 = new Matrix4(), q4 = new Quaternion(), e = new Euler(); postes.forEach((p, i) => { e.set((hash(i, 1) - .5) * .06, p[3], (hash(i, 2) - .5) * .06); q4.setFromEuler(e); m4.compose(new Vector3(p[0], p[1] - .1, p[2]), q4, new Vector3(1, .9 + hash(i, 3) * .2, 1)); im.setMatrixAt(i, m4); }); im.frustumCulled = true; g.add(im); }
      if(fios.length){ const lg = new BufferGeometry(); lg.setAttribute("position", new Float32BufferAttribute(fios, 3)); g.add(new LineSegments(lg, matFio)); }
      portoes.forEach(p => g.add(criaPorteira(p)));
    }
    /* bueiros sob o aterro */
    const esp = C.bueiros.espacoM * U;
    for(let s = Math.ceil(s0 / esp) * esp; s < s1; s += esp){ const q = EST.amostra(s), pq = EST.proximo(q.x, q.z); if(!pq) continue; const lift = EST.liftEm(pq); if(lift < .7) continue; g.add(criaBueiro(q, lift, s)); }
    return g;
  }
  function criaPorteira(p){
    const g = new Group(), w = C.cercas.portaoLarguraM * U, h = 3.5; g.position.set(p.x, p.y, p.z); g.rotation.y = p.yaw;
    for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.5, 4.4, .5), matMadeira); po.position.set(sx * w / 2, 2.2, 0); g.add(po); }
    for(const yy of [.6, 1.4, 2.2, 3.0]){ const b = new Mesh(new BoxGeometry(w - .5, .22, .14), matBranco); b.position.set(0, yy, 0); g.add(b); }
    const d = new Mesh(new BoxGeometry(Math.hypot(w - .5, 2.4), .2, .13), matBranco); d.position.set(0, 1.8, 0); d.rotation.z = Math.atan2(2.4, w - .5); g.add(d); void h;
    return g;
  }
  function criaBueiro(q, lift, s){
    const g = new Group(), r = C.bueiros.diametroM * U / 2, len = (EST.BED + EST.TALUDE * .8) * 2 + C.bueiros.comprimentoExtraM * U;
    const solo = cen.relevo(q.x, q.z); g.position.set(q.x, solo + r * .1, q.z); g.rotation.y = Math.atan2(-q.tx, -q.tz);
    /* o tubo atravessa a estrada perpendicular ao eixo */
    const tubo = new Mesh(geoTubo, matConcreto); tubo.scale.set(len, r, r); tubo.material = new MeshStandardMaterial({ color: 0xa9a59c, roughness: .9, side: 2 }); g.add(tubo);
    for(const sg of [-1, 1]){ const boca = new Mesh(geoBoca, matConcreto); boca.scale.set(.7, r * 2.7, r * 3.6); boca.position.set(sg * (len / 2 + .2), r * .25, 0); g.add(boca);
      const furo = new Mesh(new CylinderGeometry(r * .95, r * .95, .3, 14).rotateZ(Math.PI / 2), new MeshBasicMaterial({ color: 0x15130f })); furo.position.set(sg * (len / 2 + .55), 0, 0); g.add(furo); }
    void lift; void s; return g;
  }

  /* ---------- carrega/descarrega por proximidade ---------- */
  function atualiza(J){
    if(!J || !EST.len) return; const nk = Math.ceil(EST.len / CH);
    for(let k = 0; k < nk; k++){ const mid = EST.amostra(Math.min(EST.len, (k + .5) * CH)), d = Math.hypot(mid.x - J.x, mid.z - J.z), c = chunks.get(k);
      if(!c && d < CARGA){ const g = criaChunk(k); if(g){ chunks.set(k, g); grupo.add(g); } }
      else if(c && d > DESCARGA){ grupo.remove(c); descarta(c); chunks.delete(k); } }
  }
  function descarta(g){ g.traverse(o => { if(o.geometry && o.geometry !== geoPoste && o.geometry !== geoTubo && o.geometry !== geoBoca) o.geometry.dispose(); if(o.isInstancedMesh) o.dispose && o.dispose(); }); }
  function limpa(){ chunks.forEach(g => { grupo.remove(g); descarta(g); }); chunks.clear(); }

  /* ---------- placa da saída do estacionamento ---------- */
  function criaPlaca(){
    if(S.placa){ S.placa.parent && S.placa.parent.remove(S.placa); }
    const q = EST.amostra(2.6 * U * 10), lado = EST.BED + 9, x = q.x - q.tz * lado, z = q.z + q.tx * lado, solo = cen.relevo(x, z), g = new Group();
    const tex = texPlacaHD(512, 256, (c, w, h) => { c.fillStyle = "#1f6b3c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f4f4ea"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#f4f4ea"; c.textAlign = "center"; c.font = "bold 50px Arial"; c.fillText(C.placa.texto, w * .5, 100);
      c.beginPath(); c.moveTo(70, 205); c.lineTo(70, 150); c.lineTo(50, 150); c.lineTo(85, 118); c.lineTo(120, 150); c.lineTo(100, 150); c.lineTo(100, 205); c.closePath(); c.fill(); c.font = "bold 46px Arial"; c.textAlign = "left"; c.fillText(C.placa.distanciaKm + " km", 150, 195); });
    const pl = placaLegivel(tex, 6.2, 3.1, { verso: null, cor: 0x2a4a34 }); pl.position.y = 6.2; g.add(pl);
    for(const sx of [-1, 1]){ const po = new Mesh(new BoxGeometry(.3, 6.2, .3), matMadeira); po.position.set(sx * 2.4, 3.1, -.3); g.add(po); }
    g.position.set(x, solo, z); g.rotation.y = Math.atan2(-q.tx, -q.tz);                                  // a frente aponta para quem sai do estacionamento (contra o sentido da estrada)
    cen.grupo.add(g); S.placa = g;
  }

  /* ---------- capões ao longo da estrada (polígonos de mata gerados) ---------- */
  function geraCapoes(){
    S.capoes = []; if(!C.capoes.ativo || !EST.len) return; const A = C.capoes; let s = 25 * U * 6;
    const turfeiras = ((M.kml && M.kml.S.poligonos) || []).filter(p => p.tipo === "banhado"), k0 = 0; void k0;
    while(s < EST.len - 40){ const h = hash(Math.floor(s), 77), q = EST.amostra(s); s += (A.espacoM[0] + (A.espacoM[1] - A.espacoM[0]) * hash(Math.floor(s), 78)) * U;
      const lado = hash(Math.floor(q.x), 79) < .5 ? -1 : 1, af = (A.afastaM[0] + (A.afastaM[1] - A.afastaM[0]) * h) * U, R = (A.raioM[0] + (A.raioM[1] - A.raioM[0]) * hash(Math.floor(q.z), 80)) * U, cx = q.x - q.tz * af * lado, cz = q.z + q.tx * af * lado;
      if(EST.proximo(cx, cz) && EST.proximo(cx, cz).d < EST.BED + R * .5 + 20) continue;
      if(turfeiras.some(p => p.pts.some(t => Math.hypot(t[0] - cx, t[1] - cz) < R + 60 * U / 2.94))) continue;
      const pts = []; for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2, rr = R * (.72 + .5 * hash(Math.floor(cx) + i, Math.floor(cz), 81)); pts.push([cx + Math.cos(a) * rr * 1.25, cz + Math.sin(a) * rr]); }
      const bb = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];
      S.capoes.push({ nome: "capão da estrada", tipo: "mata", pts, bb, gerado: true }); }
  }

  /* ---------- ciclo de vida ---------- */
  function refaz(){ limpa(); criaPlaca(); geraCapoes(); if(M.vegetacao && M.vegetacao.regenera) M.vegetacao.regenera(); if(M.horizonte && M.horizonte.recalcula) M.horizonte.recalcula(); }
  EST.aoMudar(refaz);
  function tick(dt, J){ S.tt += dt; if(!J) return; S.ultJ = J; if(S.tt > .5 || chunks.size === 0){ S.tt = 0; atualiza(J); } }
  void Color; void DynamicDrawUsage;
  refaz();
  return { tick, capoes: () => S.capoes, chunks, limpa, atualiza, info: () => "Estrada: " + Math.round(EST.len / U) + " m (fator " + EST.fator + ") · blocos " + chunks.size + " · capões " + S.capoes.length };
}
