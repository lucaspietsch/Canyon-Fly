import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, CanvasTexture, RepeatWrapping, AdditiveBlending, PointLight, SRGBColorSpace } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";
import { criarQuadrupede, SPEC } from "../fauna/modelos.js";

/* ============================================================================================================
   PODERES DO PIT (forma Armadura, só no tempo antigo): HOLOGRAMAS — V projeta um holograma à frente (lobo-guará AZUL = fraco; assombração
   VIOLETA = forte), com linhas de varredura e tremulação; seguem o Pit e atacam sozinhos quando um inimigo chega perto; somem após holoSeg ou
   quando a energia acaba. Y troca o tipo. HACKEAR (U) — portão trancado por perto abre; máquinas e luzes da fábrica/vila apagam por hackSeg.
   PARAR O TEMPO (I) — por pararSeg tudo congela (M.congelado: partes do mundo recebem dt≈0), tela dessaturada com glitch; só o Pit se move.
   Armadura: o Pit é o boneco base — a transformação recolore a roupa de preto e aqui entram as linhas azul/violeta pulsantes, o visor e o
   CardPuter com tela brilhante na mão. Teclas em data/poderes.js → pit.
   ============================================================================================================ */
export function criarPit(M, X){
  const S = { ativo: false, tipo: "lobo", holos: [], energia: 100, cdTempo: 0, parado: 0, g: new Group(), arm: null, linhas: [], t: 0, hacks: [] };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.pit, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "pit" && T() && T().ativa();
  const avatar = () => { const am = M.H && M.H.andarMod; return am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); };
  /* ---- material holográfico: cor aditiva + linhas de varredura + tremulação ---- */
  const scan = (() => { const c = document.createElement("canvas"); c.width = 8; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#ffffff"; x.fillRect(0, 0, 8, 64); x.fillStyle = "#5a5a5a"; for(let k = 0; k < 64; k += 4) x.fillRect(0, k, 8, 2); const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(1, 6); t.colorSpace = SRGBColorSpace; return t; })();
  const holoMat = (cor) => new MeshBasicMaterial({ color: cor, map: scan, transparent: true, opacity: .6, blending: AdditiveBlending, depthWrite: false });
  function corpoLobo(cor){ const r = criarQuadrupede(SPEC.lobo, { clonar: true }); const m = holoMat(cor); r.root.traverse(o => { if(o.isMesh) o.material = m; }); return { root: r.root, mat: m, pernas: r.pernas, cauda: r.cauda, alturaM: 1.0, raioM: .8 }; }
  function corpoAssombracao(cor){ const g = new Group(), m = holoMat(cor), e = (rx, ry, rz, x, y, z) => { const o = new Mesh(new SphereGeometry(1, 14, 10), m); o.scale.set(rx, ry, rz); o.position.set(x, y, z); g.add(o); return o; };
    e(.45, 1.3, .32, 0, 1.9, 0); e(.3, .4, .3, 0, 3.2, .05); for(const sx of [-1, 1]){ const b = new Mesh(new CylinderGeometry(.07, .06, 2.4, 6), m); b.position.set(sx * .45, 1.8, 0); b.rotation.z = sx * .25; g.add(b); const p = new Mesh(new CylinderGeometry(.1, .08, 1.7, 6), m); p.position.set(sx * .18, .85, 0); g.add(p); }
    const capuz = new Mesh(new SphereGeometry(.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * .6), m); capuz.position.set(0, 3.35, 0); g.add(capuz); g.scale.setScalar(U); return { root: g, mat: m, pernas: [], cauda: [], alturaM: 1.7, raioM: .6 }; }
  /* ---- hologramas ---- */
  function projeta(J, dd){ const forte = S.tipo === "assombracao", custo = dd.holoCusto * (forte ? 1.5 : 1);
    if(S.holos.length >= dd.maxHolos){ if(M.ctx) M.ctx.mostraAviso("Limite de " + dd.maxHolos + " hologramas"); return; } if(S.energia < custo){ if(M.ctx) M.ctx.mostraAviso("Energia do CardPuter insuficiente (" + Math.round(S.energia) + "%)"); return; }
    S.energia -= custo; const cor = forte ? 0xb44cff : 0x4fd8ff, c = forte ? corpoAssombracao(cor) : corpoLobo(cor), f = [Math.sin(J.yaw), Math.cos(J.yaw)], x = J.x + f[0] * 4 * U + f[1] * (S.holos.length - 1) * 2.5 * U, z = J.z + f[1] * 4 * U - f[0] * (S.holos.length - 1) * 2.5 * U;
    c.root.position.set(x, X.chao(x, z), z); c.root.rotation.y = J.yaw; S.g.add(c.root); const luz = new PointLight(cor, 3, 8 * U); luz.position.set(0, 2 * U, 0); c.root.add(luz);
    S.holos.push({ ...c, luz, tipo: S.tipo, t: 0, vida: dd.holoSeg, cdAtaque: 0, fase: Math.random() * 6, alvo: null, nome: forte ? "assombração holográfica" : "lobo-guará holográfico" });
    X.luzFx(x, X.chao(x, z) + 2 * U, z, cor, 8, 12 * U, .4); X.msg("sobrenatural", "O CardPuter projeta " + (forte ? "uma assombração VIOLETA (forte)" : "um lobo-guará AZUL (fraco)") + ": linhas de varredura tremulam no ar."); if(M.ctx) M.ctx.mostraAviso("Holograma: " + (forte ? "assombração (forte)" : "lobo-guará (fraco)") + " · energia " + Math.round(S.energia) + "%"); }
  function some(h, motivo){ S.g.remove(h.root); h.root.traverse(o => { if(o.isMesh && o.geometry) o.geometry.dispose(); }); if(motivo) X.msg("info", "O holograma " + h.nome.split(" ")[0] + " se desfaz (" + motivo + ")."); }
  function tickHolos(dt, J){ const dd = d(); const hostil = X.S.alvos.some(a => !a.morto && (a.tipo === "inimigo" || a.tipo === "guardiao") && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < dd.holoAlcanceM * U);
    S.holos = S.holos.filter((h, i) => { h.t += dt; h.cdAtaque -= dt; if(h.t > h.vida){ some(h, "tempo esgotado"); return false; } if(S.energia <= 0 && h.t > 2){ some(h, "energia acabou"); return false; }
      h.mat.opacity = .45 + .2 * Math.sin(h.t * 23 + h.fase) + (Math.random() < .04 ? .3 : 0); h.root.position.y = X.chao(h.root.position.x, h.root.position.z) + .15 * U + Math.sin(h.t * 3 + h.fase) * .08 * U; scan.offset.y = (scan.offset.y + dt * .6) % 1;
      let alvo = null; if(hostil){ let md = 1e9; for(const a of X.S.alvos){ if(a.morto || !(a.tipo === "inimigo" || a.tipo === "guardiao")) continue; const p = a.pos(), dist = Math.hypot(p.x - h.root.position.x, p.z - h.root.position.z); if(dist < md && dist < dd.holoAlcanceM * 1.5 * U){ md = dist; alvo = a; } } }
      const dest = alvo ? alvo.pos() : { x: J.x + Math.sin(J.yaw + Math.PI + (i - 1) * .7) * 3.5 * U, z: J.z + Math.cos(J.yaw + Math.PI + (i - 1) * .7) * 3.5 * U };
      const dx = dest.x - h.root.position.x, dz = dest.z - h.root.position.z, dist = Math.hypot(dx, dz), parar = alvo ? 1.6 * U : 1.5 * U;
      if(dist > parar){ const v = dd.holoVelMS * U * (alvo ? 1.4 : 1) * dt, k = Math.min(1, v / dist); h.root.position.x += dx * k; h.root.position.z += dz * k; h.root.rotation.y = Math.atan2(dx, dz); h.pernas.forEach((p, q) => { if(p && p.rotation) p.rotation.x = Math.sin(h.t * 10 + q * Math.PI / 2) * .5; }); }
      else if(alvo && h.cdAtaque <= 0){ h.cdAtaque = .8; if(alvo.dano) alvo.dano(dd.holoDano[h.tipo]); X.luzFx(alvo.pos().x, alvo.pos().y + 2 * U, alvo.pos().z, h.tipo === "lobo" ? 0x4fd8ff : 0xb44cff, 5, 8 * U, .2); }
      return true; }); }
  /* ---- hackear ---- */
  function hackeia(J){ const dd = d(), R = dd.hackM * U, V = M.lugares && M.lugares.S && M.lugares.S.vivos; let feito = [];
    const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    if(V){ V.forEach((v, id) => { const o = v.o, c = v.it && v.it.centro; if(!o) return; const perto = (c && Math.hypot(c[0] - J.x, c[1] - J.z) < R) || (v.it && v.it.pts && emPoli(v.it.pts, J.x, J.z));      // dentro do lugar (polígono do KML) ou a hackM do centro
      if(id === "vila-santana" && o.abre && !o.S.aberta && (perto || (o.entrada && Math.hypot(o.entrada[0] - J.x, o.entrada[1] - J.z) < R))){ o.abre(); feito.push("portão da Vila Santana aberto"); }
      if((id === "fabrica" || id === "vila-ouro-verde") && perto && o.g && !o.g.userData.hack){ o.g.userData.hack = true; const luzes = []; o.g.traverse(n => { if(n.isLight){ luzes.push([n, n.intensity]); n.intensity = 0; } if(n.isMesh && n.material && n.material.emissive && n.material.emissiveIntensity > 0){ luzes.push([n.material, n.material.emissiveIntensity, "em"]); n.material.emissiveIntensity = 0; } });
        S.hacks.push({ g: o.g, luzes, t: dd.hackSeg }); feito.push(id === "fabrica" ? "máquinas e luzes da fábrica desligadas" : "luzes da vila apagadas"); } }); }
    if(!feito.length){ X.msg("info", "CardPuter: nenhum sistema hackeável por perto (portões trancados, máquinas e luzes da área industrial)."); if(M.ctx) M.ctx.mostraAviso("Nada para hackear aqui"); return; }
    X.luzFx(J.x, J.y + 3 * U, J.z, 0x4fd8ff, 8, 14 * U, .5); X.msg("sobrenatural", "CardPuter: " + feito.join("; ") + "."); if(M.ctx) M.ctx.mostraAviso("Hackeado: " + feito.join(", ")); }
  /* ---- parar o tempo ---- */
  const el = () => M.renderer && M.renderer.domElement;
  function paraTempo(){ if(S.cdTempo > 0 || S.parado > 0){ if(M.ctx) M.ctx.mostraAviso("Parar o tempo: recarga " + Math.ceil(S.cdTempo) + " s"); return; } S.parado = d().pararSeg; S.cdTempo = d().pararRecarga; M.congelado = true; if(el()) el().style.filter = "saturate(.35) contrast(1.12)"; X.msg("sobrenatural", "O CardPuter congela o tempo por " + d().pararSeg + " s: aves, água, partículas e inimigos param — só o Pit se move."); if(M.ctx) M.ctx.mostraAviso("TEMPO PARADO"); }
  function liberaTempo(){ M.congelado = false; S.parado = 0; const e = el(); if(e){ e.style.filter = (M.lugares && M.lugares.epoca && M.lugares.epoca() === "1950") ? "sepia(.65) contrast(.95) saturate(.8)" : ""; e.style.transform = ""; } X.msg("info", "O tempo volta a correr."); }
  /* ---- armadura: linhas pulsantes, visor e CardPuter no boneco base ---- */
  function veste(A0){ const A = A0 || avatar(); if(!A || !A.av || (S.arm && !A0)) return; const g = new Group(); if(!A0) S.arm = g; else { A.av.userData.armRetrato = g; } A.av.add(g); const cores = [0x3f7cff, 0xb44cff];
    [[-.55, 1.35, .9, .05, 1.5], [.55, 1.35, .9, .05, 1.5], [0, .6, .9, 1.3, .05], [-1.0, 1.0, .1, .05, 1.2], [1.0, 1.0, .1, .05, 1.2], [0, 1.75, -.88, 1.2, .05]].forEach(([x, y, z, w, h], i) => { const m = new MeshStandardMaterial({ color: cores[i % 2], emissive: cores[i % 2], emissiveIntensity: 1.2, roughness: .3 }); const o = new Mesh(new BoxGeometry(w, h, .04), m); o.position.set(x, y + 2.2, z); if(Math.abs(x) >= 1) o.rotation.y = Math.PI / 2; g.add(o); S.linhas.push(o); });
    const vis = new Mesh(new BoxGeometry(1.3, .3, .14), new MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x4f7cff, emissiveIntensity: 1, transparent: true, opacity: .7, roughness: .1 })); const cab = A.cab || A.av.getObjectByName("cabeca"); if(cab){ vis.scale.copy(cab.scale); vis.position.set(cab.position.x, cab.position.y + .08 * cab.scale.y, cab.position.z + .92 * cab.scale.z); } else { vis.position.set(0, 4.53, .92); } g.add(vis); S.linhas.push(vis);
    if(A.bD && A.bD.mao){ const cp = new Group(); cp.position.set(0, -.05, .3); cp.rotation.x = -.6; A.bD.mao.add(cp); S.cardputer = cp; cp.add(new Mesh(new BoxGeometry(.5, .08, .36), new MeshStandardMaterial({ color: 0x15161a, roughness: .5, metalness: .5 }))); const tela = new Mesh(new BoxGeometry(.4, .02, .2), new MeshBasicMaterial({ color: 0x5ff0d0 })); tela.position.set(0, .05, -.04); cp.add(tela); S.tela = tela; } }
  function despe(){ if(S.arm && S.arm.parent) S.arm.parent.remove(S.arm); S.arm = null; S.linhas = []; if(S.cardputer && S.cardputer.parent) S.cardputer.parent.remove(S.cardputer); S.cardputer = null; }
  const vesteEm = (av) => { if(av.userData.armRetrato) return; const A = avatar(); veste({ av, bD: A && A.av === av ? A.bD : null }); };
  const despeEm = (av) => { const g = av.userData.armRetrato; if(g){ av.remove(g); av.userData.armRetrato = null; } if(S.cardputer && !S.arm && S.cardputer.parent){ S.cardputer.parent.remove(S.cardputer); S.cardputer = null; } S.linhas = S.linhas.filter(o => o.parent && o.parent !== g); };
  const corpo = (tipo) => (tipo === "assombracao" ? corpoAssombracao(0xb44cff) : corpoLobo(0x4fd8ff));
  function aoTransformar(id, on){ if(id !== "pit") return; S.ativo = on; if(on){ S.energia = 100; setTimeout(veste, 50); } else { despe(); S.holos.forEach(h => some(h, null)); S.holos = []; if(M.congelado) liberaTempo(); } }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.tipo){ e.preventDefault(); S.tipo = S.tipo === "lobo" ? "assombracao" : "lobo"; if(M.ctx) M.ctx.mostraAviso("Holograma: " + (S.tipo === "lobo" ? "lobo-guará AZUL (fraco)" : "assombração VIOLETA (forte)")); return true; }
    if(e.code === k.hack){ e.preventDefault(); hackeia(J); return true; } if(e.code === k.tempo){ e.preventDefault(); paraTempo(); return true; } return false; }
  function tick(dt){ S.t += dt; S.cdTempo = Math.max(0, S.cdTempo - dt); if(S.parado > 0){ S.parado -= dt; const e = el(); if(e) e.style.transform = Math.random() < .12 ? "translateX(" + ((Math.random() - .5) * 4).toFixed(1) + "px)" : ""; if(S.parado <= 0) liberaTempo(); }
    if(!S.ativo) return; S.energia = Math.min(100, S.energia + d().holoRecarga * dt); const J = M.jogador(); if(J) tickHolos(dt, J);
    if(!S.arm && ativo()) veste(); S.linhas.forEach((o, i) => { if(o.material.emissiveIntensity !== undefined) o.material.emissiveIntensity = .7 + .6 * Math.sin(S.t * 3 + i * .9); }); if(S.tela) S.tela.material.color.setHSL(.45 + .05 * Math.sin(S.t * 2), 1, .55 + .1 * Math.sin(S.t * 7));
    S.hacks = S.hacks.filter(h => { h.t -= dt; if(h.t <= 0){ h.luzes.forEach(([n, v, em]) => { if(em) n.emissiveIntensity = v; else n.intensity = v; }); h.g.userData.hack = false; X.msg("info", "Os sistemas hackeados voltam a funcionar."); return false; } return true; }); }
  const info = () => (ativo() ? "Pit: V holograma (" + (S.tipo === "lobo" ? "lobo azul" : "assombração violeta") + ") " + S.holos.length + "/" + d().maxHolos + " · energia " + Math.round(S.energia) + "% · " + d().teclas.tipo.replace("Key", "") + " tipo · " + d().teclas.hack.replace("Key", "") + " hackear · " + d().teclas.tempo.replace("Key", "") + " parar tempo" + (S.parado > 0 ? " (PARADO " + S.parado.toFixed(1) + ")" : S.cdTempo > 0 ? " (" + Math.ceil(S.cdTempo) + ")" : "") : "");
  return { projeta, hackeia, paraTempo, liberaTempo, tecla, tick, aoTransformar, info, S, vesteEm, despeEm, corpo };
}
