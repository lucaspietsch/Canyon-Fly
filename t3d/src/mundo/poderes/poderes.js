import { criarKrig } from "./krig.js";
import { criarJackao } from "./jackao.js";
import { criarMohr } from "./mohr.js";
import { criarMary } from "./mary.js";
import { criarDiully } from "./diully.js";
import { criarKauling } from "./kauling.js";
import { criarCarlao } from "./carlao.js";
import { Group, Mesh, SphereGeometry, CylinderGeometry, BoxGeometry, CircleGeometry, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, MeshBasicMaterial, PointLight, AdditiveBlending, DoubleSide, TorusGeometry } from "three";
import { U } from "../config.js";
import { PODERES, PODERES_CFG, FALAS_LABIA } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DOS PERSONAGENS — Tupã (raio do céu) · Sepé Tiarajú (arco e flechas infinitas) · Pit (lábia) · Atiara (encantamento dos olhos).
   • Tecla V ou o botão na tela. Dados em data/poderes.js (recarga, alcance, mira).
   • Alvos: qualquer coisa registrada em M.poderes.registra({ tipo: "inimigo" | "pessoa" | "guardiao", pos(), raioM, aoRaio?, aoFlecha?, aoLabia?, aoOlhos? }). As lendas (Gritador, Boitatá, Anhangá) se registram aqui.
   • Bichos NUNCA levam dano: o raio e as flechas só ferem "inimigo" (espantalhos de treino, Gritador, amaldiçoados).
   Depuração (F3 aberto): Shift+V cria 3 espantalhos amaldiçoados e 1 visitante teimoso à frente.
   ============================================================================================================ */

export function criarPoderes(M){
  const S = { alvos: [], fx: [], flechas: [], cd: 0, hud: null, chip: null, barra: null, flash: null, ultId: null }, G = new Group(); M.cen.grupo.add(G);
  const chao = (x, z) => M.cen.chao(x, z, 1e9), rnd = Math.random;
  const def = () => PODERES[M.personagens && M.personagens.ativo] || null;
  const msg = (tipo, t) => { if(M.terminal) M.terminal.msg(tipo, t); };
  const registra = (a) => { S.alvos.push(a); return a; };
  const remove = (a) => { const i = S.alvos.indexOf(a); if(i >= 0) S.alvos.splice(i, 1); };

  /* ---------- mira ---------- */
  function naMira(J, d, tipos){
    const f = [Math.sin(J.yaw), Math.cos(J.yaw)], cos = Math.cos(d.cone * Math.PI / 180); let melhor = null, md = 1e9;
    for(const a of S.alvos){ if(a.morto || (tipos && !tipos.includes(a.tipo))) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > d.alcanceM * U || dist < .1) continue;
      if((dx * f[0] + dz * f[1]) / dist < cos) continue; if(dist < md){ md = dist; melhor = a; } }
    return melhor;
  }

  /* ---------- efeitos ---------- */
  const luzFx = (x, y, z, cor, inten, dist, vida) => { const l = new PointLight(cor, inten, dist); l.position.set(x, y, z); G.add(l); S.fx.push({ t: 0, vida, l, i0: inten }); };
  function relampago(x, z){
    const y0 = chao(x, z), alto = PODERES.tupa.alturaCeuM * U, pts = []; const N = 14; let px = x + (rnd() - .5) * 25 * U, pz = z + (rnd() - .5) * 25 * U;
    for(let i = 0; i <= N; i++){ const k = i / N, q = 1 - k; const jx = i === N ? 0 : (rnd() - .5) * 7 * U * q, jz = i === N ? 0 : (rnd() - .5) * 7 * U * q; pts.push(new Vector3(x + (px - x) * q + jx, y0 + alto * q, z + (pz - z) * q + jz)); }
    const grupo = new Group(), curva = new CatmullRomCurve3(pts);
    grupo.add(new Mesh(new TubeGeometry(curva, 40, .35 * U, 5, false), new MeshBasicMaterial({ color: 0xffffff })));
    grupo.add(new Mesh(new TubeGeometry(curva, 40, 1.3 * U, 6, false), new MeshBasicMaterial({ color: 0x9ec8ff, transparent: true, opacity: .28, blending: AdditiveBlending, depthWrite: false })));
    for(let b = 0; b < 3; b++){ const i = 3 + Math.floor(rnd() * 8), p = pts[i], q = [p, new Vector3(p.x + (rnd() - .5) * 14 * U, p.y - 8 * U, p.z + (rnd() - .5) * 14 * U), new Vector3(p.x + (rnd() - .5) * 22 * U, p.y - 20 * U, p.z + (rnd() - .5) * 22 * U)]; grupo.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(q), 8, .15 * U, 4, false), new MeshBasicMaterial({ color: 0xdfeaff }))); }
    G.add(grupo); S.fx.push({ t: 0, vida: .45, g: grupo, pisca: true });
    luzFx(x, y0 + 4 * U, z, 0xbcd6ff, 9, 70 * U, .5);
    const marca = new Mesh(new CircleGeometry(2.6 * U, 20), new MeshBasicMaterial({ color: 0x0c0c10, transparent: true, opacity: .55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); marca.rotation.x = -Math.PI / 2; marca.position.set(x, y0 + .08, z); G.add(marca); S.fx.push({ t: 0, vida: 25, g: marca, apaga: true });
    const cp = M.cam.position; if(Math.hypot(cp.x - x, cp.z - z) < 140 * U) clarao(.55);
  }
  function clarao(op){ const u = M.ui; if(!u) return; if(!S.flash){ S.flash = document.createElement("div"); S.flash.style.cssText = "position:absolute;inset:0;z-index:55;background:#eaf2ff;opacity:0;pointer-events:none;transition:opacity .35s;"; } if(!S.flash.parentNode) u.appendChild(S.flash); S.flash.style.transition = "none"; S.flash.style.opacity = String(op); requestAnimationFrame(() => { S.flash.style.transition = "opacity .45s"; S.flash.style.opacity = "0"; }); }
  function brilho(x, y, z, cor, n = 14, r = 2){ for(let i = 0; i < n; i++){ const m = new Mesh(new SphereGeometry(.12 * U, 6, 4), new MeshBasicMaterial({ color: cor, transparent: true, blending: AdditiveBlending, depthWrite: false })); m.position.set(x, y, z); const a = rnd() * 6.283, v = (1 + rnd() * 2.5) * r * U; G.add(m); S.fx.push({ t: 0, vida: .7 + rnd() * .5, g: m, v: [Math.cos(a) * v, (1 + rnd() * 3) * U, Math.sin(a) * v], sobe: true }); } }

  /* ---------- poderes ---------- */
  function raio(J, d){
    const a = naMira(J, d, ["inimigo"]); let x, z;
    if(a){ const p = a.pos(); x = p.x; z = p.z; } else { const dist = 26 * U; x = J.x + Math.sin(J.yaw) * dist; z = J.z + Math.cos(J.yaw) * dist; }
    relampago(x, z); msg("sobrenatural", a ? "Tupã chama o raio: o céu desce sobre " + a.nome + "." : "Tupã chama o raio: o céu desce à sua frente.");
    for(const o of S.alvos.slice()){ if(o.morto) continue; const p = o.pos(); if(Math.hypot(p.x - x, p.z - z) <= (d.raioM * U + (o.raioM || 1) * U) && o.aoRaio) o.aoRaio(d); }
    if(M.missoes && M.missoes.emite) M.missoes.emite("poder:raio", { acertou: !!a });
  }
  function flecha(J, d){
    const a = naMira(J, d, ["inimigo", "pessoa", "guardiao"]), o = new Vector3(J.x + Math.sin(J.yaw) * 1.2 * U, J.y + 3.6 * U, J.z + Math.cos(J.yaw) * 1.2 * U); let dir;
    if(a){ const p = a.pos(), alvoY = (p.y !== undefined ? p.y : chao(p.x, p.z)) + (a.alturaM || 1.4) * U; dir = new Vector3(p.x - o.x, alvoY - o.y, p.z - o.z).normalize(); dir.y += .02; dir.normalize(); }
    else dir = new Vector3(Math.sin(J.yaw), .06, Math.cos(J.yaw)).normalize();
    const g = new Group(), haste = new Mesh(new CylinderGeometry(.04 * U, .04 * U, 2.2 * U, 6), new MeshStandardMaterial({ color: 0x6b4a2a, roughness: .9 })); haste.rotation.x = Math.PI / 2; g.add(haste);
    const ponta = new Mesh(new CylinderGeometry(0, .12 * U, .4 * U, 6), new MeshStandardMaterial({ color: 0x9aa0a6, metalness: .6, roughness: .4 })); ponta.rotation.x = Math.PI / 2; ponta.position.z = 1.3 * U; g.add(ponta);
    for(const k of [-1, 1]){ const p = new Mesh(new BoxGeometry(.015 * U, .22 * U, .5 * U), new MeshStandardMaterial({ color: 0xb3472e, side: DoubleSide })); p.position.set(0, k * .06 * U, -.9 * U); g.add(p); const p2 = p.clone(); p2.rotation.z = Math.PI / 2; g.add(p2); }
    g.position.copy(o); G.add(g); S.flechas.push({ g, v: dir.multiplyScalar(d.velocidadeMS * U), t: 0, d });
  }
  function labia(J, d){
    const a = naMira(J, d, ["pessoa", "inimigo", "guardiao"]), fala = FALAS_LABIA[Math.floor(rnd() * FALAS_LABIA.length)];
    msg("info", ((M.personagens && M.personagens.def(M.personagens.ativo) || {}).nome || "Pit") + ": " + fala);
    if(!a){ msg("info", "Não há ninguém ao alcance para convencer (chegue mais perto e olhe de frente)."); M.ctx && M.ctx.mostraAviso("Ninguém para convencer"); return; }
    const p = a.pos(); brilho(p.x, (p.y || chao(p.x, p.z)) + 5 * U, p.z, 0xffd36a, 12, 1.2);
    const ok = a.aoLabia ? a.aoLabia(d) : false; if(ok === false) msg("info", a.nome + " não se deixa levar pela conversa.");
    if(M.missoes && M.missoes.emite) M.missoes.emite("poder:labia", { alvo: a.id, ok: ok !== false });
  }
  function olhos(J, d){
    const a = naMira(J, d), fau = (M.fauna && M.fauna.animais) ? M.fauna.animais.filter(q => q.x !== undefined && Math.hypot(q.x - J.x, q.z - J.z) < d.alcanceM * U && Math.sin(J.yaw) * (q.x - J.x) + Math.cos(J.yaw) * (q.z - J.z) > 0) : [];
    const topo = J.y + 5.4 * U, fx = J.x + Math.sin(J.yaw) * 1.4 * U, fz = J.z + Math.cos(J.yaw) * 1.4 * U;
    const alvo = a ? a.pos() : { x: J.x + Math.sin(J.yaw) * 14 * U, z: J.z + Math.cos(J.yaw) * 14 * U };
    for(let i = 0; i < 3; i++){ const m = new Mesh(new TorusGeometry(.6 * U, .05 * U, 6, 24), new MeshBasicMaterial({ color: 0xffcf5a, transparent: true, opacity: .8, blending: AdditiveBlending, depthWrite: false })); m.position.set(fx, topo, fz); m.lookAt(alvo.x, topo, alvo.z); G.add(m); S.fx.push({ t: -i * .18, vida: 1.2, g: m, anel: [alvo.x - fx, (chao(alvo.x, alvo.z) + 3 * U) - topo, alvo.z - fz] }); }
    luzFx(fx, topo, fz, 0xffcf5a, 3, 30 * U, .9);
    if(!a){ msg("sobrenatural", fau.length ? "Atiara encara os bichos: eles se acalmam e ficam olhando." : "Atiara fixa o olhar à frente. Nada para encantar por perto."); }
    else { msg("sobrenatural", "Os olhos de Atiara brilham: " + a.nome + " não consegue desviar o olhar."); if(a.aoOlhos) a.aoOlhos(d); }
    if(M.missoes && M.missoes.emite) M.missoes.emite("poder:olhos", { alvo: a ? a.id : null });
  }
  const USOS = { raio, arco: flecha, labia, olhos };
  const KR = criarKrig(M, { S, naMira, luzFx, msg, G, chao }); USOS.investida = (J, d) => KR.investida(J, d);
  const JK = criarJackao(M, { S, naMira, luzFx, msg, G, chao }); USOS.tiro = (J, d) => JK.tiro(J, d);
  const MH = criarMohr(M, { S, naMira, luzFx, msg, G, chao }); USOS.onda = (J, d) => MH.onda(J, d);
  const MY = criarMary(M, { S, naMira, luzFx, msg, G, chao }); USOS.fogo = (J, d) => MY.fogo(J, d);
  const DY = criarDiully(M, { S, naMira, luzFx, msg, G, chao }); USOS.telecinese = (J, d) => DY.acao(J, d);
  const KL = criarKauling(M, { S, naMira, luzFx, msg, G, chao }); USOS.grito = (J, d) => KL.grito(J, d);
  const CA = criarCarlao(M, { S, naMira, luzFx, msg, G, chao }); USOS.chute = (J, d) => CA.inicia(J, d);
  function usa(){
    const d = def(), J = M.jogador(); if(!d || !J || !M.andando() || S.cd > 0 || (M.personagens.S.tela)) return false;
    S.cd = d.recarga; S.cdMax = d.recarga; USOS[d.id](J, d); return true;
  }

  /* ---------- alvos de treino ---------- */
  function espantalho(x, z, nome = "Espantalho amaldiçoado"){
    const g = new Group(), pau = new MeshStandardMaterial({ color: 0x5a4028, roughness: 1 }), pano = new MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 });
    const poste = new Mesh(new CylinderGeometry(.09 * U, .11 * U, 3.6 * U, 8), pau); poste.position.y = 1.8 * U; g.add(poste);
    const braco = new Mesh(new CylinderGeometry(.07 * U, .07 * U, 2.6 * U, 8), pau); braco.rotation.z = Math.PI / 2; braco.position.y = 2.7 * U; g.add(braco);
    const corpo = new Mesh(new SphereGeometry(.7 * U, 12, 10), pano); corpo.scale.y = 1.25; corpo.position.y = 2.2 * U; g.add(corpo);
    const cab = new Mesh(new SphereGeometry(.5 * U, 12, 10), new MeshStandardMaterial({ color: 0xc9b98a, roughness: 1 })); cab.position.y = 3.6 * U; g.add(cab);
    const brasa = new MeshBasicMaterial({ color: 0xb06bff }); for(const sx of [-1, 1]){ const o = new Mesh(new SphereGeometry(.09 * U, 8, 6), brasa); o.position.set(sx * .18 * U, 3.68 * U, .44 * U); g.add(o); }
    const chapeu = new Mesh(new CylinderGeometry(.75 * U, .75 * U, .08 * U, 14), pau); chapeu.position.y = 3.95 * U; g.add(chapeu); const topo = new Mesh(new CylinderGeometry(.35 * U, .45 * U, .5 * U, 12), pau); topo.position.y = 4.2 * U; g.add(topo);
    g.position.set(x, chao(x, z), z); G.add(g);
    const a = registra({ id: "esp" + S.alvos.length, tipo: "inimigo", nome, raioM: 1, alturaM: 1.2, hp: PODERES.tupa.danoInimigo * 3, g, pos: () => g.position, t: 0, encantado: 0,
      dano(q){ if(a.morto) return; a.hp -= q; brilho(g.position.x, g.position.y + 3 * U, g.position.z, 0xb06bff, 10, 1.4); g.rotation.z = (rnd() - .5) * .3; if(a.hp <= 0){ a.morto = true; a.t = 0; msg("sobrenatural", nome + " desmancha em cinzas."); } },
      aoRaio(d){ a.dano(d.danoInimigo * 3); }, aoFlecha(d){ a.dano(d.danoInimigo); }, aoOlhos(d){ a.encantado = d.duracaoS; }, aoLabia(){ return false } });
    return a;
  }
  function visitante(x, z){
    const Mt = M.H.M, c = Mt(0x3a6ea5, { roughness: .9 }), rig = M.H.pessoa3d({ nome: "Visitante teimoso", x, y: chao(x, z), z, yaw: 0, camisa: c, manga: c, calca: Mt(0x2c2f3a), pele: M.H.pele.media, cabelo: 0x3a2a1c, barba: false });
    rig.capG.visible = false; rig.equip.forEach(o => { o.visible = false; }); rig.pernasA.grupo.visible = false; rig.estat.forEach(o => { o.visible = true; });
    const a = registra({ id: "vis" + S.alvos.length, tipo: "pessoa", nome: "o visitante teimoso", raioM: 1, alturaM: 1.5, rig, convencido: false, encantado: 0, pos: () => rig.av.position,
      aoLabia(){ if(a.convencido){ msg("info", "Visitante: “Já disse que concordo, moço!”"); return true; } a.convencido = true; a.virar = Math.PI; msg("info", "Visitante teimoso: “...Tá bom, você me convenceu. Eu volto para a trilha.”"); if(M.ctx) M.ctx.mostraAviso("Convencido!"); return true; },
      aoOlhos(d){ a.encantado = d.duracaoS; msg("sobrenatural", "O visitante fica parado, olhando fixo nos olhos dela."); } });
    return a;
  }
  function treino(J){ const f = [Math.sin(J.yaw), Math.cos(J.yaw)], l = [f[1], -f[0]];
    for(let i = 0; i < PODERES_CFG.espantalhosDebug; i++){ const d = (18 + i * 3) * U, s = (i - 1) * 8 * U; espantalho(J.x + f[0] * d + l[0] * s, J.z + f[1] * d + l[1] * s); }
    const v = visitante(J.x + f[0] * 12 * U + l[0] * 12 * U, J.z + f[1] * 12 * U + l[1] * 12 * U); v.rig.av.rotation.y = Math.atan2(J.x - v.pos().x, J.z - v.pos().z) + Math.PI;
    M.ctx && M.ctx.mostraAviso("Alvos de treino criados à frente (V = poder)"); }
  function limpaTreino(){ S.alvos.filter(a => /^(esp|vis)/.test(a.id)).forEach(a => { if(a.g && a.g.parent) a.g.parent.remove(a.g); if(a.rig && a.rig.av.parent) a.rig.av.parent.remove(a.rig.av); remove(a); }); }

  /* ---------- botão na tela ---------- */
  function hud(){
    if(!M.ui) return; if(!S.chip){ const c = document.createElement("div"); c.style.cssText = "position:absolute;left:50%;bottom:78px;transform:translateX(-50%);z-index:30;min-width:210px;padding:7px 14px 9px;border-radius:14px;border:2px solid #8a9a3b;background:rgba(14,18,10,.86);color:#ecebdd;font:700 13px ui-monospace,Consolas,monospace;text-align:center;cursor:pointer;pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:manipulation;";
      const t = document.createElement("div"); const b = document.createElement("div"); b.style.cssText = "height:5px;border-radius:3px;background:#2a3016;margin-top:6px;overflow:hidden;"; const bb = document.createElement("div"); bb.style.cssText = "height:100%;width:100%;background:#ffd36a;"; b.appendChild(bb); c.appendChild(t); c.appendChild(b); c.addEventListener("pointerdown", e => { e.stopPropagation(); e.preventDefault(); usa(); }); S.chip = c; S.txt = t; S.barra = bb; }
    if(!S.chip.parentNode) M.ui.appendChild(S.chip);
  }
  function tickHud(){
    const d = def(), mostra = !!d && M.andando() && !(M.personagens.S.tela);
    if(!mostra){ if(S.chip && S.chip.style.display !== "none") S.chip.style.display = "none"; return; }
    hud(); S.chip.style.display = "block"; const rotulo = "[V] " + d.nome; if(S.ultRot !== rotulo){ S.txt.textContent = rotulo; S.ultRot = rotulo; S.chip.title = d.texto; }
    S.barra.style.width = (S.cd > 0 ? (1 - S.cd / (S.cdMax || 1)) * 100 : 100) + "%"; S.barra.style.background = S.cd > 0 ? "#7a7a52" : "#ffd36a";
  }

  function tick(dt, J){
    KR.tick(dt); JK.tick(dt); MH.tick(dt); MY.tick(dt); DY.tick(dt); KL.tick(dt); CA.tick(dt);
    if(S.cd > 0) S.cd -= dt; tickHud();
    for(let i = S.fx.length - 1; i >= 0; i--){ const f = S.fx[i]; f.t += dt; if(f.t < 0) continue; const k = Math.min(1, f.t / f.vida);
      if(f.l){ f.l.intensity = f.i0 * (1 - k); }
      if(f.pisca && f.g){ f.g.visible = (Math.floor(f.t * 30) % 3) !== 2 || k < .3; f.g.scale.setScalar(1 - k * .4); }
      if(f.apaga && f.g){ f.g.material.opacity = .55 * (1 - k); }
      if(f.sobe && f.g){ f.g.position.x += f.v[0] * dt; f.g.position.y += f.v[1] * dt; f.g.position.z += f.v[2] * dt; f.v[1] -= 6 * U * dt; f.g.material.opacity = 1 - k; }
      if(f.anel && f.g){ f.g.position.x += f.anel[0] * dt / f.vida; f.g.position.y += f.anel[1] * dt / f.vida; f.g.position.z += f.anel[2] * dt / f.vida; f.g.scale.setScalar(1 + k * 1.6); f.g.material.opacity = .85 * (1 - k); }
      if(k >= 1){ if(f.g){ G.remove(f.g); f.g.traverse && f.g.traverse(o => { o.geometry && o.geometry.dispose(); }); } if(f.l) G.remove(f.l); S.fx.splice(i, 1); } }
    for(let i = S.flechas.length - 1; i >= 0; i--){ const f = S.flechas[i]; f.t += dt; const p = f.g.position; f.v.y -= f.d.gravidade * U * dt; const nx = p.x + f.v.x * dt, ny = p.y + f.v.y * dt, nz = p.z + f.v.z * dt;
      let bateu = null; for(const a of S.alvos){ if(a.morto || a.tipo === "bicho") continue; const q = a.pos(), gy = (q.y !== undefined ? q.y : chao(q.x, q.z)); if(Math.hypot(q.x - nx, q.z - nz) < (a.raioM || 1) * U * .9 && ny > gy - .5 * U && ny < gy + 4.5 * U){ bateu = a; break; } }
      const solo = chao(nx, nz);
      if(bateu){ p.set(nx, ny, nz); bateu.aoFlecha && bateu.aoFlecha(f.d); brilho(nx, ny, nz, 0xffe3a0, 8, .8); f.cravada = true; if(M.missoes && M.missoes.emite) M.missoes.emite("poder:arco", { alvo: bateu.id, tipo: bateu.tipo }); }
      else if(ny <= solo + .1 || f.t > 3){ p.set(nx, Math.max(ny, solo + .1), nz); f.cravada = true; }
      else { p.set(nx, ny, nz); f.g.lookAt(nx + f.v.x, ny + f.v.y, nz + f.v.z); }
      if(f.cravada){ f.g.lookAt(p.x + f.v.x, p.y + f.v.y, p.z + f.v.z); f.vida = (f.vida || 0) + dt; if(!f.parou){ f.parou = true; f.t = 3; f.v.set(0, 0, 0); } if(bateu) { G.remove(f.g); S.flechas.splice(i, 1); continue; } f.vida += dt; if(f.vida > 6){ G.remove(f.g); S.flechas.splice(i, 1); } } }
    for(const a of S.alvos.slice()){ if(a.morto){ a.t += dt; if(a.g){ const k = Math.min(1, a.t / .9); a.g.scale.setScalar(1 - k); if(k >= 1){ if(a.g.parent) a.g.parent.remove(a.g); remove(a); } } continue; }
      if(a.encantado > 0){ a.encantado -= dt; if(a.g) a.g.rotation.y += dt * 2; if(J && a.rig){ const dy = Math.atan2(J.x - a.rig.av.position.x, J.z - a.rig.av.position.z); a.rig.av.rotation.y += ((((dy - a.rig.av.rotation.y + 9.4248) % 6.2832) - 3.1416)) * Math.min(1, dt * 4); } }
      if(a.virar && a.rig){ a.rig.av.rotation.y += a.virar * dt * 1.5; a.virar *= Math.max(0, 1 - dt * 2); if(Math.abs(a.virar) < .02) a.virar = 0; }
      if(a.tick) a.tick(dt, J); }
  }
  function tecla(e){
    if(KR.tecla(e) || JK.tecla(e) || MH.tecla(e) || MY.tecla(e) || DY.tecla(e) || KL.tecla(e) || CA.tecla(e)) return true;
    if(e.code === PODERES_CFG.tecla && !e.repeat && !e.ctrlKey && !e.altKey){
      const dep = typeof M.depurando === "function" ? M.depurando() : !!M.depurando;
      if(e.shiftKey){ if(dep){ e.preventDefault(); const J = M.jogador(); if(J) treino(J); return true; } return false; }
      if(dep) return false;                                               // com F3 aberto a tecla V é de depuração das serpentes
      e.preventDefault(); usa(); return true; }
    return false;
  }
  const dispose = () => { limpaTreino(); S.fx.forEach(f => f.g && G.remove(f.g)); S.fx.length = 0; S.flechas.forEach(f => G.remove(f.g)); S.flechas.length = 0; if(S.chip) S.chip.remove(); if(S.flash) S.flash.remove(); };
  return { registra, remove, usa, tick, tecla, treino, limpaTreino, espantalho, visitante, relampago, naMira, def, S, alvos: S.alvos, krig: KR, jackao: JK, mohr: MH, mary: MY, diully: DY, kauling: KL, carlao: CA, aoTransformar: (id, on) => { KR.aoTransformar(id, on); JK.aoTransformar(id, on); MH.aoTransformar(id, on); MY.aoTransformar(id, on); DY.aoTransformar(id, on); KL.aoTransformar(id, on); CA.aoTransformar(id, on); }, info: () => { const s = [KR.info(), JK.info(), MH.info(), MY.info(), DY.info(), KL.info(), CA.info(), (def() ? "Poder: " + def().nome + (S.cd > 0 ? " (" + S.cd.toFixed(1) + " s)" : " pronto") : null)].filter(Boolean).join(" · "); return s || null; }, desliga: dispose };
}
