import { Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial } from "three";
import { canvasTex, placaLegivel, texPlacaHD } from "../../lib.js";
import { U } from "../config.js";
import { latLonParaMundo } from "../resgate/kml.js";
import { abrePainel } from "../lugares/sequoia-lunar.js";

/* ============================================================================================================
   CARRO DE PEDRA ("Carrinho de Pedra", "Autinho da Restinga Feia") + CAPELINHA DE SÃO CRISTÓVÃO — junto ao pórtico de entrada de Cambará do Sul
   (29°03'57,50"S 50°09'40,93"W, informado pelo Lucas). Fotos: carrinho de concreto/pedra pintado de BRANCO, com olhos de cílios e grade de faixas
   pretas na frente, armação de teto com a placa "CAMBARÁ DO SUL · TERRA DOS CÂNIONS", rachaduras; versão antiga AMARELA com faróis redondos.
   Lenda: [E] abre o painel (LENDA_CARRO). Gancho de missão futura: o vulto do padre pedindo carona na Restinga Feia (docs/MISSOES-PARCEIROS.md).
   ============================================================================================================ */
export const CARRO_PEDRA = { lat: -29.06597222, lon: -50.16136944 };
export const LENDA_CARRO = {
  titulo: "O Carro de Pedra da Restinga Feia",
  texto: "Junto ao pórtico de entrada de Cambará do Sul fica um pequeno carro esculpido em pedra, ao lado de uma capelinha de São Cristóvão, padroeiro dos motoristas e viajantes. O povo o chama de Carrinho de Pedra ou Autinho da Restinga Feia.",
  itens: [
    "Anos 1940: os caminhoneiros que levavam madeira da Serra para a capital temiam a subida do antigo Morro da Restinga Feia.",
    "Naquele ponto, contam, os motores perdiam força ou simplesmente apagavam, sem explicação.",
    "Logo depois aparecia na janela um vulto — um padre que teria morrido num acidente ali mesmo — pedindo carona para seguir viagem.",
    "Em 1955, para afastar o medo e pedir proteção na estrada, um grupo de motoristas encomendou o carrinho de pedra e o colocou junto de São Cristóvão.",
    "Até hoje muita gente buzina ao passar… só por garantia.",
  ],
};

export function criarCarroPedra(M, u, ruas){
  const { cen } = M, G = new Group(), T = (u && u.T) || [0, 0], Y = (x, z) => cen.relevo(x, z);
  const p0 = latLonParaMundo(CARRO_PEDRA.lat, CARRO_PEDRA.lon), cx = p0[0] + T[0], cz = p0[1] + T[1];
  /* de frente para a rua mais próxima (avenida até o pórtico) */
  /* o pórtico real fica além da borda do mapa da cidade (as distâncias de fora são comprimidas): o carrinho vai para o ponto da avenida mais perto
     da posição real — a saída sudoeste —, recuado 30 m para dentro e 12 m para o lado, de frente para a rua */
  let best = [1e18, cx + 1, cz, 1, 0];
  (ruas || []).forEach(L => { for(let i = 1; i < L.length; i++){ const [ax, az] = L[i - 1], [bx, bz] = L[i], vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((cx - ax) * vx + (cz - az) * vz) / l2)), px = ax + vx * t, pz = az + vz * t, d = (px - cx) ** 2 + (pz - cz) ** 2; if(d < best[0]){ const l = Math.sqrt(l2); best = [d, px, pz, vx / l, vz / l]; } } });
  const [, rx, rz, dx0, dz0] = best, sx = (cx - rx) * -dz0 + (cz - rz) * dx0 >= 0 ? 1 : -1;               // lado da rua onde fica a posição real
  const ox = rx - dx0 * 30 * U + -dz0 * sx * 12 * U, oz = rz - dz0 * 30 * U + dx0 * sx * 12 * U, fx = rx - dx0 * 30 * U - ox, fz = rz - dz0 * 30 * U - oz, fl = Math.hypot(fx, fz) || 1, yaw = Math.atan2(fx / fl, fz / fl);
  const g = new Group(); g.position.set(ox, Y(ox, oz), oz); g.rotation.y = yaw; G.add(g);                          // z local = frente do carro (para a rua)
  const branco = new MeshStandardMaterial({ color: 0xe9e7e0, roughness: .95 }), cinza = new MeshStandardMaterial({ color: 0x8f8c86, roughness: .95 }), escuro = new MeshStandardMaterial({ color: 0x2a2826, roughness: .9 });
  const bx = (mat, w, h, d, x, y, z, rx = 0) => { const m = new Mesh(new BoxGeometry(w * U, h * U, d * U), mat); m.position.set(x * U, y * U, z * U); m.rotation.x = rx; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  bx(cinza, 2.0, .25, 4.0, 0, .12, 0);                                                                       // laje de concreto
  bx(branco, 1.7, .75, 3.6, 0, .62, 0);                                                                      // corpo
  bx(branco, 1.6, .25, 1.3, 0, 1.08, 1.05, -.12);                                                            // capô
  bx(branco, 1.66, .45, .25, -0, .55 + .45, -1.6);                                                           // traseira alta
  for(const sx of [-1, 1]){ bx(branco, .12, .45, 2.2, sx * .79, 1.2, -.45); bx(escuro, .1, .5, .5, sx * .86, .35, 1.1); bx(escuro, .1, .5, .5, sx * .86, .35, -1.1); }   // laterais da cabine e rodas meio enterradas
  /* armação de teto (4 colunas + vigas) e placa */
  for(const [sx, sz] of [[-1, .2], [1, .2], [-1, -1.5], [1, -1.5]]) bx(branco, .14, .95, .14, sx * .72, 1.6, sz);
  bx(branco, 1.6, .12, 1.85, 0, 2.12, -.65);
  const tp = texPlacaHD(512, 64, (c, w, h) => { c.fillStyle = "#e9e7e0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#555"; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = "#222"; c.textAlign = "center"; c.font = "bold 30px sans-serif"; c.fillText("CAMBARÁ DO SUL · TERRA DOS CÂNIONS", w / 2, 43); });
  const pl = placaLegivel(tp, 1.75 * U, .24 * U, { verso: tp, cor: 0xe9e7e0 }); pl.position.set(0, 2.32 * U, .2 * U); g.add(pl);
  /* frente: grade de faixas pretas + olhos com cílios + rachaduras */
  const tf = canvasTex(256, 128, (c, w, h) => { c.fillStyle = "#e9e7e0"; c.fillRect(0, 0, w, h); c.fillStyle = "#151515"; for(let k = 0; k < 4; k++) c.fillRect(64, 40 + k * 20, 128, 10);
    for(const ex of [34, 222]){ c.fillStyle = "#151515"; c.beginPath(); c.ellipse(ex, 50, 18, 13, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#c9a23a"; c.beginPath(); c.arc(ex, 52, 6, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#151515"; c.lineWidth = 3; for(let k = -2; k <= 2; k++){ c.beginPath(); c.moveTo(ex + k * 7, 37); c.lineTo(ex + k * 9, 24); c.stroke(); } }
    c.strokeStyle = "#7a7770"; c.lineWidth = 1.5; for(let k = 0; k < 9; k++){ let x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.moveTo(x, y); for(let j = 0; j < 4; j++){ x += (Math.random() - .5) * 40; y += Math.random() * 20; c.lineTo(x, y); } c.stroke(); } }, { repeat: [1, 1] });
  const frente = new Mesh(new PlaneGeometry(1.7 * U, .85 * U), new MeshStandardMaterial({ map: tf, roughness: .95 })); frente.position.set(0, .7 * U, 1.81 * U); g.add(frente);
  /* capelinha de São Cristóvão (ao lado, 4 m à direita do carro) */
  const cap = new Group(); cap.position.set(3.6 * U, 0, -.4 * U); g.add(cap);
  const capMat = new MeshStandardMaterial({ color: 0xf2efe6, roughness: .9 }), telha = new MeshStandardMaterial({ color: 0x8a3a2a, roughness: .9 });
  const cb = new Mesh(new BoxGeometry(1.5 * U, 1.9 * U, 1.6 * U), capMat); cb.position.y = .95 * U + .2 * U; cb.castShadow = true; cap.add(cb);
  const base = new Mesh(new BoxGeometry(1.8 * U, .2 * U, 1.9 * U), cinza); base.position.y = .1 * U; cap.add(base);
  for(const s of [-1, 1]){ const t = new Mesh(new BoxGeometry(1.0 * U, .1 * U, 1.9 * U), telha); t.position.set(s * .42 * U, 2.35 * U, 0); t.rotation.z = -s * .62; cap.add(t); }
  const porta = new Mesh(new PlaneGeometry(.7 * U, 1.1 * U), new MeshStandardMaterial({ color: 0x3a5f8a })); porta.position.set(0, .8 * U, .81 * U); cap.add(porta);
  const santo = texPlacaHD(64, 96, (c, w, h) => { c.fillStyle = "#3a5f8a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2e6b0"; c.beginPath(); c.arc(w / 2, 26, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = "#c8a46a"; c.fillRect(w / 2 - 9, 38, 18, 40); c.fillStyle = "#f2d85a"; c.beginPath(); c.arc(w / 2, 26, 16, Math.PI, 0); c.lineWidth = 3; c.strokeStyle = "#f2d85a"; c.stroke(); });
  const imagem = new Mesh(new PlaneGeometry(.5 * U, .75 * U), new MeshStandardMaterial({ map: santo })); imagem.position.set(0, .85 * U, .815 * U); cap.add(imagem);
  for(const [w, h, y] of [[.08, .7, 3.0], [.4, .08, 3.1]]){ const c = new Mesh(new BoxGeometry(w * U, h * U, .08 * U), new MeshStandardMaterial({ color: 0x2a2826 })); c.position.set(0, y * U, .2 * U); cap.add(c); }
  /* hotspot da lenda e colisores */
  const wx = ox, wz = oz, colisores = [{ x0: wx - 2.2 * U, x1: wx + 2.2 * U, z0: wz - 2.2 * U, z1: wz + 2.2 * U, peca: "carro de pedra" }];
  const cxp = ox + Math.cos(yaw) * 3.6 * U, czp = oz - Math.sin(yaw) * 3.6 * U; colisores.push({ x0: cxp - 1.1 * U, x1: cxp + 1.1 * U, z0: czp - 1.1 * U, z1: czp + 1.1 * U, peca: "capela de São Cristóvão" });
  const hot = { id: "carro-de-pedra", x: wx, z: wz, r: 9 * U, rotulo: () => "Carro de Pedra — ouvir a lenda", acao: () => { if(M.terminal) M.terminal.msg("sobrenatural", "Dizem que aqui os motores apagavam… e um padre pedia carona."); abrePainel(M, { titulo: LENDA_CARRO.titulo, texto: LENDA_CARRO.texto, subtitulo: "A lenda", itens: LENDA_CARRO.itens, borda: "#3a5f8a" }); } };
  colisores.forEach(k => cen.colisores.push(k)); cen.hotspots.push(hot);
  G.userData.descartar = () => { colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); const i = cen.hotspots.indexOf(hot); if(i >= 0) cen.hotspots.splice(i, 1); };
  G.userData.pos = [wx, wz];
  return G;
}
