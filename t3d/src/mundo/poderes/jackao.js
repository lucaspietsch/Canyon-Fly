import { Group, Mesh, Sprite, SpriteMaterial, CanvasTexture, SphereGeometry, MeshBasicMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, SRGBColorSpace } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO JACKÃO (forma camuflada, só no tempo antigo): fuzil de balas infinitas (recarga só como animação), mira com o botão direito
   (zoom da câmera), 3 granadas por zona (fumaça + empurrão + dano em sombras; nada na mata), óculos de realidade aumentada (contorno e
   distância dos inimigos através de vegetação e névoa) e munição de choque (atordoa animais e sombras sem ferir). Teclas: data/poderes.js → jackao.
   Sem sangue: os alvos só piscam e recuam.
   ============================================================================================================ */
export function criarJackao(M, X){
  const S = { ativo: false, mirando: false, choque: false, oculos: false, balas: 0, recarregando: 0, granadas: 0, zona: null, fov0: null, marcas: new Map(), fumacas: [], tremor: 0, g: new Group() };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.jackao, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "jackao" && T() && T().ativa();
  const rotulo = (txt) => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "rgba(6,20,30,.72)"; x.fillRect(0, 0, 256, 64); x.strokeStyle = "#4fd8ff"; x.lineWidth = 3; x.strokeRect(2, 2, 252, 60); x.fillStyle = "#bff3ff"; x.font = "bold 26px ui-monospace, monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 128, 33); const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t; };
  function aoTransformar(id, on){ if(id !== "jackao") return; S.ativo = on; if(on){ S.balas = d().pente; S.granadas = d().granadasPorZona; S.zona = M.zonas && M.zonas.atual; } else { mira(false); oculos(false); } }
  if(M.zonas && M.zonas.aoMudar) M.zonas.aoMudar(() => { if(S.ativo){ S.granadas = d().granadasPorZona; X.msg("info", "Granadas recarregadas ao trocar de zona (" + S.granadas + ")."); } });
  /* ---- mira (botão direito) ---- */
  function mira(on){ const cam = M.cam; if(!cam) return; if(on && !S.mirando){ S.fov0 = cam.fov; cam.fov = Math.max(18, cam.fov * .5); cam.updateProjectionMatrix(); } else if(!on && S.mirando && S.fov0){ cam.fov = S.fov0; cam.updateProjectionMatrix(); } S.mirando = on; }
  const el = M.renderer && M.renderer.domElement;
  if(el){ el.addEventListener("contextmenu", e => { if(ativo()) e.preventDefault(); }); el.addEventListener("pointerdown", e => { if(ativo() && e.button === 2){ e.preventDefault(); mira(true); } }); window.addEventListener("pointerup", e => { if(e.button === 2) mira(false); }); }
  /* ---- tiro (tecla do poder) ---- */
  function animaisNaMira(J, coneG, alcM){ const f = [Math.sin(J.yaw), Math.cos(J.yaw)], cos = Math.cos(coneG * Math.PI / 180), L = []; ((M.fauna && M.fauna.animais) || []).forEach(a => { const dx = a.x - J.x, dz = a.z - J.z, dist = Math.hypot(dx, dz); if(dist < alcM * U && dist > .1 && (dx * f[0] + dz * f[1]) / dist > cos) L.push(a); }); return L; }
  function tiro(J, dd){
    if(S.recarregando > 0) return; if(S.balas <= 0){ S.recarregando = dd.recargaSeg; X.msg("info", "Recarregando o fuzil…"); if(M.ctx) M.ctx.mostraAviso("Recarregando"); return; }
    S.balas--; const cone = S.mirando ? dd.coneMira : dd.cone, f = [Math.sin(J.yaw), Math.cos(J.yaw)];
    X.luzFx(J.x + f[0] * 2.2, J.y + 4, J.z + f[1] * 2.2, 0xffd27a, 7, 9 * U, .08); S.tremor = S.mirando ? .08 : .16;      // clarão do cano e recuo
    const a = X.naMira(J, { cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao"]);
    if(S.choque){ const L = animaisNaMira(J, cone, dd.alcanceM); L.slice(0, 1).forEach(an => { an.atordoado = dd.choqueSeg; }); if(a) a.encantado = Math.max(a.encantado || 0, dd.choqueSeg); if(L.length || a) X.msg("sobrenatural", "Munição de choque: " + (L.length ? "animal imobilizado sem ferir" : "sombra atordoada") + "."); }
    else if(a && a.dano){ a.dano(dd.danoInimigo); }
    if(S.balas === 0){ S.recarregando = dd.recargaSeg; X.msg("info", "Pente vazio: recarregando…"); }
  }
  /* ---- granada ---- */
  function fumaca(x, y, z){ const n = 90, pos = new Float32Array(n * 3), g = new BufferGeometry(); for(let k = 0; k < n; k++){ pos[k * 3] = x + (Math.random() - .5) * 4 * U; pos[k * 3 + 1] = y + Math.random() * 2 * U; pos[k * 3 + 2] = z + (Math.random() - .5) * 4 * U; } g.setAttribute("position", new BufferAttribute(pos, 3));
    const p = new Points(g, new PointsMaterial({ color: 0x9a9a92, size: 1.6 * U, transparent: true, opacity: .55, depthWrite: false })); p.frustumCulled = false; S.g.add(p); S.fumacas.push({ p, pos, t: 0, vida: 7 }); }
  function granada(J){ if(S.granadas <= 0){ if(M.ctx) M.ctx.mostraAviso("Sem granadas nesta zona (recarregam ao trocar de zona)"); return; } S.granadas--; const dd = d(), f = [Math.sin(J.yaw), Math.cos(J.yaw)], gx = J.x + f[0] * dd.granadaM * U, gz = J.z + f[1] * dd.granadaM * U, gy = X.chao(gx, gz);
    X.msg("info", "Granada lançada (" + S.granadas + " restante(s))."); if(M.ctx) M.ctx.mostraAviso("Granada! (" + S.granadas + " restantes)");
    setTimeout(() => { X.luzFx(gx, gy + 2 * U, gz, 0xffa040, 26, 40 * U, .5); fumaca(gx, gy, gz); S.tremor = .5; const R = dd.granadaRaioM * U;
      for(const a of X.S.alvos){ if(a.morto) continue; const p = a.pos(), dx = p.x - gx, dz = p.z - gz, dist = Math.hypot(dx, dz); if(dist > R || dist < .01) continue; const k = (1 - dist / R) * 8 * U; if(a.g){ a.g.position.x += dx / dist * k; a.g.position.z += dz / dist * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } if(a.dano) a.dano(dd.danoInimigo * 3); }
      X.msg("sobrenatural", "A explosão empurra tudo em volta; a mata fica intacta."); }, dd.granadaSeg * 1000); }
  /* ---- óculos de realidade aumentada ---- */
  function oculos(on){ S.oculos = on; if(!on){ S.marcas.forEach(m => { S.g.remove(m.sp); S.g.remove(m.aro); }); S.marcas.clear(); } X.msg("info", on ? "Óculos de RA ligados: inimigos marcados através da mata e da névoa." : "Óculos de RA desligados."); if(M.ctx) M.ctx.mostraAviso(on ? "Óculos de RA ligados" : "Óculos de RA desligados"); }
  function atualizaMarcas(J){ const R = d().oculosM * U, vivos = new Set();
    for(const a of X.S.alvos){ if(a.morto || !(a.tipo === "inimigo" || a.tipo === "guardiao")) continue; const p = a.pos(), dist = Math.hypot(p.x - J.x, p.z - J.z); if(dist > R) continue; vivos.add(a);
      let m = S.marcas.get(a); const txt = (a.nome || "alvo").toUpperCase().slice(0, 14) + " " + Math.round(dist / U) + " m";
      if(!m){ const sp = new Sprite(new SpriteMaterial({ map: rotulo(txt), depthTest: false, depthWrite: false, transparent: true })); sp.scale.set(7 * U * .6, 1.75 * U * .6, 1); const aro = new Mesh(new SphereGeometry((a.raioM || 1) * U * 1.3, 10, 7), new MeshBasicMaterial({ color: 0x4fd8ff, wireframe: true, depthTest: false, transparent: true, opacity: .75 })); S.g.add(sp); S.g.add(aro); m = { sp, aro, txt: "", t: 0 }; S.marcas.set(a, m); }
      m.t += 1; if(m.txt !== txt && m.t % 10 === 0){ m.txt = txt; m.sp.material.map.dispose(); m.sp.material.map = rotulo(txt); m.sp.material.needsUpdate = true; }
      m.sp.position.set(p.x, p.y + ((a.alturaM || 1.5) + 1.6) * U, p.z); m.aro.position.set(p.x, p.y + (a.alturaM || 1.5) * U * .5, p.z); }
    S.marcas.forEach((m, a) => { if(!vivos.has(a)){ S.g.remove(m.sp); S.g.remove(m.aro); S.marcas.delete(a); } }); }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.granada){ e.preventDefault(); granada(J); return true; } if(e.code === k.oculos){ e.preventDefault(); oculos(!S.oculos); return true; }
    if(e.code === k.choque){ e.preventDefault(); S.choque = !S.choque; X.msg("info", S.choque ? "Munição de choque: atordoa sem ferir." : "Munição comum."); if(M.ctx) M.ctx.mostraAviso(S.choque ? "Munição de choque" : "Munição comum"); return true; } return false; }
  function tick(dt){ if(S.recarregando > 0){ S.recarregando -= dt; if(S.recarregando <= 0){ S.balas = d().pente; X.msg("info", "Fuzil recarregado."); } }
    if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .4; c.position.y += (Math.random() - .5) * S.tremor * .4; } }
    S.fumacas = S.fumacas.filter(f => { f.t += dt; const a = f.pos; for(let k = 0; k < a.length; k += 3){ a[k + 1] += dt * .9 * U; a[k] += (Math.random() - .5) * dt * U; } f.p.geometry.attributes.position.needsUpdate = true; f.p.material.opacity = .55 * Math.max(0, 1 - f.t / f.vida); if(f.t > f.vida){ S.g.remove(f.p); f.p.geometry.dispose(); return false; } return true; });
    if(S.oculos){ const J = M.jogador(); if(J && ativo()) atualizaMarcas(J); else oculos(false); } }
  const info = () => (ativo() ? "Jackão: " + (S.recarregando > 0 ? "recarregando" : S.balas + " balas") + (S.mirando ? " · mirando" : "") + (S.choque ? " · CHOQUE" : "") + " · granadas " + S.granadas + " · óculos RA " + (S.oculos ? "ON (" + S.marcas.size + " marcado(s))" : "off") : "");
  return { tiro, granada, oculos, mira, tecla, tick, aoTransformar, info, S };
}
