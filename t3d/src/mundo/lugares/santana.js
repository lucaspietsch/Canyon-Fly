import { Group, Mesh, InstancedMesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, Matrix4, Vector3, Quaternion, Euler } from "three";
import { placaLegivel, texPlacaHD } from "../../lib.js";
import { U, LUGARES as C } from "../config.js";
import { pedeSenha, temSenha, sessao } from "../seguranca/senha.js";
import { aberto, dentroPoli, inset, mat } from "./util.js";

/* ============================================================================================================
   VILA SANTANA (anos 1950) — pórtico no ponto onde a estrada ENTRA no polígono "vila santana" do KML, portão trancado e passagem de época.
   • O portão só abre com a senha da entrada "vila-santana" de data/seguranca/senhas.js (só o hash SHA-256 com salt fica no jogo; sem hash cadastrado = "em breve"; 3 erros = 30 s de espera, crescente).
   • Enquanto trancada, a área da vila é fechada a pé (zonas.bloqueios) — não dá para contornar o portão pelo campo.
   • Aberto, quem cruza o pórtico muda de época: dentro da vila é 1950 (tom sépia, "M.lugares.epoca()" = "1950"); fora, é o presente ("2026"). A abertura fica guardada neste navegador, como o desbloqueio de personagens.
   ============================================================================================================ */

export const ID_SENHA = "vila-santana", CHAVE = "canyonfly:santana:aberta";
const pi = Math.PI;

export function criarSantana(M, { poli }){
  const { cen } = M, G = new Group(), P = aberto(poli), E = M.estrada, Y = (x, z) => cen.relevo(x, z);
  const S = { colisores: [], hotspots: [], aberta: false, anim: 0, epoca: "2026", t: 0, ultDentro: false };
  try{ S.aberta = localStorage.getItem(CHAVE) === "1"; }catch(_){ /* sem armazenamento */ }
  const grande = inset(P, -4 * U);                                                                          // área fechada: o polígono um pouco maior
  /* ponto de entrada: 1º ponto da estrada dentro do polígono (o pórtico fica uns passos antes, do lado de fora) */
  let i0 = E.pts.findIndex(p => dentroPoli(P, p[0], p[1]));
  if(i0 <= 0){ let d = 1e18; E.pts.forEach((p, i) => { const q = (p[0] - (P[0][0])) ** 2 + (p[1] - P[0][1]) ** 2; if(q < d){ d = q; i0 = i; } }); }
  i0 = Math.max(2, i0);
  const a = E.pts[i0 - 2], b = E.pts[i0], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / tl, tz = (b[1] - a[1]) / tl, nx = -tz, nz = tx;
  const px = E.pts[i0 - 1][0], pz = E.pts[i0 - 1][1], meia = E.BED + 2.4 * U;                                  // meia largura do vão do pórtico
  S.entrada = { x: px, z: pz, tx, tz };
  const pedra = mat(0xb9b09a, { roughness: .95 }), madeira = mat(0x5a3d22, { roughness: .95 }), ferro = mat(0x24282c, { roughness: .6, metalness: .45 });
  const g = new Group(); g.position.set(px, Y(px, pz), pz); g.rotation.y = Math.atan2(tx, tz); G.add(g);                  // z local = sentido da entrada (para dentro da vila)
  /* pilares de pedra, viga e letreiro */
  for(const sx of [-1, 1]){ const pil = new Mesh(new BoxGeometry(2.2 * U, 7 * U, 2.2 * U), pedra); pil.position.set(sx * meia, 3.5 * U, 0); pil.castShadow = true; g.add(pil);
    const topo = new Mesh(new BoxGeometry(2.8 * U, .5 * U, 2.8 * U), pedra); topo.position.set(sx * meia, 7.2 * U, 0); g.add(topo);
    const lamp = new Mesh(new SphereGeometry(.55 * U, 8, 6), new MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffc060, emissiveIntensity: .1 })); lamp.position.set(sx * meia, 8 * U, 0); g.add(lamp); S.lampadas = (S.lampadas || []).concat(lamp.material);
    const cx = px + nx * sx * meia, cz = pz + nz * sx * meia; S.colisores.push({ x0: cx - 1.6 * U, x1: cx + 1.6 * U, z0: cz - 1.6 * U, z1: cz + 1.6 * U }); }
  const viga = new Mesh(new BoxGeometry(meia * 2 + 2.2 * U, .9 * U, 1.1 * U), madeira); viga.position.set(0, 6.6 * U, 0); g.add(viga);
  const tex = texPlacaHD(768, 192, (c, w, h) => { c.fillStyle = "#3d2a17"; c.fillRect(0, 0, w, h); c.strokeStyle = "#d9c08a"; c.lineWidth = 7; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#f0dca8"; c.textAlign = "center"; c.font = "bold 84px Georgia"; c.fillText("VILA SANTANA", w / 2, 118); c.font = "italic 34px Georgia"; c.fillText("fundada em 1950", w / 2, 164); });
  const pl = placaLegivel(tex, meia * 1.7, .5 * meia * .5, { verso: tex, cor: 0x2a1c0e }); pl.position.set(0, 5.6 * U, 0); g.add(pl);
  /* portão de duas folhas (fechado: atravessa o vão) */
  const folhas = [-1, 1].map(sx => { const f = new Group(); f.position.set(sx * meia, 0, 0); const corpo = new Mesh(new BoxGeometry(meia, 4.6 * U, .3 * U), madeira); corpo.position.set(-sx * meia / 2, 2.3 * U, 0); f.add(corpo);
    for(let k = 0; k < 5; k++){ const bar = new Mesh(new BoxGeometry(meia, .22 * U, .4 * U), ferro); bar.position.set(-sx * meia / 2, (.6 + k * .9) * U, 0); f.add(bar); } g.add(f); return { f, sx }; });
  /* cerquinha de pedra dos dois lados */
  for(const sx of [-1, 1]) for(let k = 1; k <= 5; k++){ const m = new Mesh(new BoxGeometry(4 * U, 1.6 * U, .7 * U), pedra); m.position.set(sx * (meia + 2.2 * U + k * 4 * U - 2 * U), .8 * U, 0); g.add(m); }
  /* colisores do portão fechado */
  const gate = []; for(let k = -meia; k <= meia; k += 3.2 * U){ const cx = px + nx * k, cz = pz + nz * k; gate.push({ x0: cx - 2, x1: cx + 2, z0: cz - 2, z1: cz + 2, ativo: () => !S.aberta }); }
  S.colisores.push(...gate);
  /* época por quem está dentro da vila (aberto) */
  const hot = { id: "portao-santana", x: px, z: pz, r: 9 * U, rotulo: () => (S.aberta ? "Pórtico da Vila Santana" : sessao.logado() ? "Portão trancado — [E] abrir (operador autorizado)" : temSenha(ID_SENHA) ? "Portão trancado — [E] digitar a senha" : "Portão trancado (em breve)"), acao: () => interage() };
  S.hotspots.push(hot);
  const motivo = "Vila Santana: o portão está trancado";
  const bloq = { f: (x, z) => !S.aberta && !(M.lugares && M.lugares.S.antigo) && dentroPoli(grande, x, z), motivo };
  M.zonas.bloqueios.push(bloq);

  async function interage(){
    if(S.aberta){ M.ctx.mostraAviso("O portão está aberto"); return; }
    if(sessao.logado()){ if(M.terminal) M.terminal.msg("info", "Portão da Vila Santana: aberto pelo login do operador."); abre(); return; }           // operador logado: o login dele já autoriza
    if(M.terminal) M.terminal.msg("info", temSenha(ID_SENHA) ? "Portão da Vila Santana: trancado." : "Portão da Vila Santana: trancado. Ainda não há senha cadastrada (em breve).");
    M.ctx.soltaTeclas && M.ctx.soltaTeclas();
    const ok = await pedeSenha(M.ui, ID_SENHA, { titulo: "Portão da Vila Santana", texto: "Digite a senha para abrir o portão." });
    if(ok) abre();
  }
  function abre(){ S.aberta = true; S.anim = 0; try{ localStorage.setItem(CHAVE, "1"); }catch(_){ /* sem armazenamento */ } if(M.terminal) M.terminal.msg("sobrenatural", "O portão da Vila Santana se abre. O ar ao redor parece vir de outro tempo."); M.ctx.mostraAviso("Portão aberto"); if(M.missoes && M.missoes.emite) M.missoes.emite("santana:aberto", {}); }
  const tranca = () => { S.aberta = false; try{ localStorage.removeItem(CHAVE); }catch(_){ /* sem armazenamento */ } };

  /* transição de época: cortina escura + tom sépia */
  const cortina = document.createElement("div"); cortina.style.cssText = "position:absolute;inset:0;z-index:60;background:#d8c9a0;opacity:0;pointer-events:none;transition:opacity .9s;";
  function mudaEpoca(e){ S.epoca = e; if(M.transformacao) M.transformacao.aoEpoca(e); if(M.ui && !cortina.parentNode) M.ui.appendChild(cortina); cortina.style.opacity = ".92"; setTimeout(() => { const el = M.renderer && M.renderer.domElement; if(el) el.style.filter = e === "1950" ? "sepia(.65) contrast(.95) saturate(.8)" : ""; cortina.style.opacity = "0"; }, 700);
    if(M.terminal) M.terminal.msg("sobrenatural", e === "1950" ? "Você cruza o pórtico: Vila Santana, 1950." : "Você volta ao presente."); if(M.missoes && M.missoes.emite) M.missoes.emite("epoca", { epoca: e }); }

  /* polígonos do tempo antigo (KML): a época 1950 vale em todos eles, depois do pórtico (ou com operador logado) */
  function dentroAntigo(x, z){ const K = M.kml && M.kml.S; if(!K) return false; return K.poligonos.some(e => (e.tipo === "olaria" || e.tipo === "industrial" || e.tipo === "fabrica" || (e.tipo === "vila" && /ouro/i.test(e.nome))) && dentroPoli(e.mundoPts || e.pts, x, z)); }
  function tick(dt, J){
    S.t += dt; if(S.anim < 1 && S.aberta){ S.anim = Math.min(1, S.anim + dt / 1.6); } const k = S.aberta ? S.anim : 0; folhas.forEach(({ f, sx }) => { f.rotation.y = sx * k * 1.45; });
    if(S.lampadas){ const h = M.ciclo.hora(), noite = h < 5.8 || h >= 18 || S.epoca === "1950" && h < 6.2; S.lampadas.forEach(m => { m.emissiveIntensity += ((noite ? 2 : .1) - m.emissiveIntensity) * Math.min(1, dt * 1.5); }); }
    if(!J) return; const dentro = dentroPoli(P, J.x, J.z) || dentroAntigo(J.x, J.z);                                         // anos 50 = Vila Santana + Olaria + área industrial + Cambará S/A + Vila Ouro Verde
    if(M.lugares && M.lugares.S.antigo){ if(S.epoca !== "1950") mudaEpoca("1950"); S.ultDentro = dentro; return; }                    // veio pelo portal violeta: tudo é 1950
    if(!S.aberta && dentro && sessao.logado()) abre();                                                                      // chegou por viagem rápida com login: abre sozinho
    if(dentro !== S.ultDentro || (S.epoca === "1950" && !S.aberta && !dentro)){ S.ultDentro = dentro; if(S.aberta || !dentro) mudaEpoca(dentro ? "1950" : "2026"); }
  }
  const dispose = () => { S.colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); S.hotspots.forEach(h => { const i = cen.hotspots.indexOf(h); if(i >= 0) cen.hotspots.splice(i, 1); });
    const i = M.zonas.bloqueios.indexOf(bloq); if(i >= 0) M.zonas.bloqueios.splice(i, 1); const antigo = M.lugares && M.lugares.S.antigo, el = M.renderer && M.renderer.domElement; if(el && !antigo) el.style.filter = ""; if(!antigo) S.epoca = "2026"; cortina.remove(); };
  S.colisores.forEach(k => cen.colisores.push(k)); S.hotspots.forEach(h => cen.hotspots.push(h));
  return { g: G, tick, dispose, S, abre, tranca, interage, epoca: () => S.epoca, entrada: S.entrada };
}
