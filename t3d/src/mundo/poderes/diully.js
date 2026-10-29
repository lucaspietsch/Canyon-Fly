import { Group, Mesh, TorusGeometry, MeshBasicMaterial, PointLight, Points, PointsMaterial, BufferGeometry, BufferAttribute, AdditiveBlending } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DA DIULLY (forma Sombra Dourada, só no tempo antigo): TELECINESE — V ergue o inimigo/objeto mirado (brilho dourado nas mãos e
   em volta dele) e o segura flutuando à frente; V de novo ARREMESSA longe (dano ao cair); Y BATE no chão (dano maior, poeira e tremor);
   botão direito do mouse = erguer e segurar enquanto pressionado (solta devagar ao largar, sem dano). U = LÁBIA no alvo mirado: pessoas
   (capangas, trabalhadores) entram num diálogo de convencimento com chance de sucesso. Teclas em data/poderes.js → diully.
   ============================================================================================================ */
export function criarDiully(M, X){
  const S = { ativo: false, seg: null, voando: [], anel: null, luz: null, cdChao: 0, cdLabia: 0, t: 0, g: new Group(), poeira: [] };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.diully, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "diully" && T() && T().ativa();
  function aoTransformar(id, on){ if(id !== "diully") return; S.ativo = on; if(!on) solta(true); }
  const anelDourado = () => { const a = new Mesh(new TorusGeometry(1.6 * U, .08 * U, 8, 32), new MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: .8, blending: AdditiveBlending, depthWrite: false })); a.rotation.x = Math.PI / 2; return a; };
  /* ---- erguer / segurar ---- */
  function ergue(J){ if(S.seg) return false; const dd = d(), a = X.naMira(J, { cone: dd.cone, alcanceM: dd.alcanceM }, ["inimigo", "guardiao", "pessoa"]); if(!a || !a.g){ if(M.ctx) M.ctx.mostraAviso("Nada para erguer na mira"); return false; }
    S.seg = { a, y0: a.g.position.y, enc0: a.encantado || 0 }; a.encantado = 999; S.anel = anelDourado(); S.g.add(S.anel); S.luz = new PointLight(0xffc860, 10, 14 * U); S.g.add(S.luz);
    X.msg("sobrenatural", "Diully ergue " + (a.nome || "o alvo") + " no ar com um brilho dourado."); if(M.ctx) M.ctx.mostraAviso("Erguido (V arremessa · Y bate no chão)"); return true; }
  function solta(suave){ if(!S.seg) return; const { a, enc0 } = S.seg; a.encantado = enc0; if(suave && a.g){ a.g.position.y = X.chao(a.g.position.x, a.g.position.z); } S.seg = null; if(S.anel){ S.g.remove(S.anel); S.anel = null; } if(S.luz){ S.g.remove(S.luz); S.luz = null; } }
  function arremessa(J, dd){ const { a } = S.seg, f = [Math.sin(J.yaw), Math.cos(J.yaw)]; solta(false); S.voando.push({ a, vx: f[0] * dd.arremessoMS * U, vy: 9 * U, vz: f[1] * dd.arremessoMS * U, t: 0 }); X.luzFx(a.g.position.x, a.g.position.y + 2 * U, a.g.position.z, 0xffd36a, 8, 16 * U, .4); X.msg("sobrenatural", "Diully arremessa " + (a.nome || "o alvo") + " para longe."); if(M.ctx) M.ctx.mostraAviso("Arremesso!"); }
  function bateChao(J){ if(!S.seg || S.cdChao > 0) return; const dd = d(), { a } = S.seg; solta(false); const p = a.g.position; p.y = X.chao(p.x, p.z); a.g.rotation.z = (Math.random() - .5) * .6; if(a.dano) a.dano(dd.danoChao);
    S.cdChao = 1.2; X.luzFx(p.x, p.y + U, p.z, 0xffd36a, 14, 20 * U, .4); poeira(p.x, p.y, p.z); M.poderes.krig && (M.poderes.krig.S.tremor = .45); X.msg("sobrenatural", "Diully bate " + (a.nome || "o alvo") + " contra o chão."); if(M.ctx) M.ctx.mostraAviso("Batida no chão!"); }
  function poeira(x, y, z){ const n = 60, g = new BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3); for(let k = 0; k < n; k++){ const a = Math.random() * Math.PI * 2, r = Math.random() * 2 * U; pos[k * 3] = x + Math.cos(a) * r; pos[k * 3 + 1] = y + .3 * U; pos[k * 3 + 2] = z + Math.sin(a) * r; vel[k * 3] = Math.cos(a) * 3 * U; vel[k * 3 + 1] = (1 + Math.random()) * U; vel[k * 3 + 2] = Math.sin(a) * 3 * U; }
    g.setAttribute("position", new BufferAttribute(pos, 3)); const p = new Points(g, new PointsMaterial({ color: 0xb8a98a, size: .9 * U, transparent: true, opacity: .6, depthWrite: false })); p.frustumCulled = false; S.g.add(p); S.poeira.push({ p, pos, vel, t: 0, vida: 1.6 }); }
  /* ---- ação da tecla do poder (V): ergue se não tem nada; arremessa se já segura ---- */
  function acao(J, dd){ if(S.seg) arremessa(J, dd); else ergue(J); }
  /* ---- Lábia com chance de sucesso ---- */
  function labia(J){ if(S.cdLabia > 0) return; const L = d().labia; S.cdLabia = L.recarga; const a = X.naMira(J, L, ["pessoa", "inimigo", "guardiao"]);
    if(!a){ X.msg("info", "Não há ninguém ao alcance para convencer."); if(M.ctx) M.ctx.mostraAviso("Ninguém para convencer"); return; }
    const p = a.pos(); X.luzFx(p.x, (p.y || X.chao(p.x, p.z)) + 5 * U, p.z, 0xffd36a, 10, 14 * U, 1.0);
    if(a.tipo !== "pessoa" || !a.aoLabia){ X.msg("info", "Diully: “Vamos conversar…” — " + (a.nome || "a criatura") + " não entende palavras."); if(M.ctx) M.ctx.mostraAviso("Não dá para convencer isso"); return; }
    const sorte = Math.random() < L.chance; X.msg("info", "Diully (sorriso confiante): “Olha, eu sei que você não quer confusão. Vamos resolver isso do nosso jeito?”");
    if(sorte){ const ok = a.aoLabia(L); X.msg("info", ok === false ? (a.nome || "A pessoa") + " hesita, mas não cede desta vez." : (a.nome || "A pessoa") + " abaixa a guarda e desiste — convencido(a) pela Lábia."); if(M.ctx) M.ctx.mostraAviso(ok === false ? "Quase…" : "Convencido!"); if(ok !== false) a.encantado = Math.max(a.encantado || 0, 30); }
    else { X.msg("info", (a.nome || "A pessoa") + ": “Conversa bonita não me compra.” — não convenceu (tente de novo)."); if(M.ctx) M.ctx.mostraAviso("Não convenceu"); }
    if(M.missoes && M.missoes.emite) M.missoes.emite("poder:labia", { alvo: a.id, ok: sorte }); }
  /* ---- botão direito: erguer e segurar ---- */
  const el = M.renderer && M.renderer.domElement;
  if(el){ el.addEventListener("contextmenu", e => { if(ativo()) e.preventDefault(); }); el.addEventListener("pointerdown", e => { if(ativo() && e.button === 2){ e.preventDefault(); const J = M.jogador(); if(J) ergue(J); } }); window.addEventListener("pointerup", e => { if(e.button === 2 && S.seg && ativo()) solta(true); }); }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.chao){ e.preventDefault(); bateChao(J); return true; } if(e.code === k.labia){ e.preventDefault(); labia(J); return true; } return false; }
  function tick(dt){ S.t += dt; S.cdChao = Math.max(0, S.cdChao - dt); S.cdLabia = Math.max(0, S.cdLabia - dt);
    if(S.seg){ const J = M.jogador(); if(!J || !ativo() || S.seg.a.morto){ solta(true); } else { const { a } = S.seg, f = [Math.sin(J.yaw), Math.cos(J.yaw)], tx = J.x + f[0] * 4 * U, tz = J.z + f[1] * 4 * U, ty = X.chao(tx, tz) + d().alturaM * U + Math.sin(S.t * 2.2) * .3 * U; a.g.position.x += (tx - a.g.position.x) * Math.min(1, dt * 6); a.g.position.z += (tz - a.g.position.z) * Math.min(1, dt * 6); a.g.position.y += (ty - a.g.position.y) * Math.min(1, dt * 6); a.g.rotation.y += dt * .8; a.g.rotation.z = Math.sin(S.t * 1.7) * .25;
        if(S.anel){ S.anel.position.set(a.g.position.x, a.g.position.y + 1.2 * U, a.g.position.z); S.anel.rotation.z += dt * 2; S.anel.material.opacity = .6 + .3 * Math.sin(S.t * 6); } if(S.luz){ S.luz.position.set(a.g.position.x, a.g.position.y + 2 * U, a.g.position.z); S.luz.intensity = 8 + 3 * Math.sin(S.t * 5); } } }
    S.voando = S.voando.filter(v => { v.t += dt; const p = v.a.g.position; v.vy -= 28 * U * dt; p.x += v.vx * dt; p.y += v.vy * dt; p.z += v.vz * dt; p.x += 0; const ch = X.chao(p.x, p.z); if(p.y <= ch){ p.y = ch; v.a.g.rotation.z = (Math.random() - .5) * 1.2; if(v.a.dano) v.a.dano(d().danoArremesso); X.luzFx(p.x, p.y + U, p.z, 0xffd36a, 8, 14 * U, .3); poeira(p.x, p.y, p.z); return false; } return v.t < 6; });
    S.poeira = S.poeira.filter(q => { q.t += dt; const a = q.pos, v = q.vel; for(let k = 0; k < a.length; k += 3){ a[k] += v[k] * dt; a[k + 1] += v[k + 1] * dt; a[k + 2] += v[k + 2] * dt; } q.p.geometry.attributes.position.needsUpdate = true; q.p.material.opacity = .6 * Math.max(0, 1 - q.t / q.vida); if(q.t > q.vida){ S.g.remove(q.p); q.p.geometry.dispose(); return false; } return true; }); }
  const info = () => (ativo() ? "Diully: " + (S.seg ? "segurando " + (S.seg.a.nome || "alvo") + " (V arremessa · " + d().teclas.chao.replace("Key", "") + " bate)" : "V ergue · botão direito segura") + " · " + d().teclas.labia.replace("Key", "") + " lábia" + (S.cdLabia > 0 ? " (" + S.cdLabia.toFixed(0) + ")" : "") : "");
  return { acao, ergue, solta, arremessa, bateChao, labia, tecla, tick, aoTransformar, info, S };
}
