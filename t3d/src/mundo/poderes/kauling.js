import { Group, Mesh, TorusGeometry, MeshBasicMaterial, AdditiveBlending } from "three";
import { U } from "../config.js";
import { PODERES } from "../../../../data/poderes.js";

/* ============================================================================================================
   PODERES DO KAULING (forma Peão gaúcho, só no tempo antigo): GRITO forte (tecla do poder, V) — anéis de som visíveis saem da boca e
   ARREMESSAM os inimigos no cone à frente, e a vegetação balança (rajada de vento); CRESCER (U) — fica crescerX vezes maior por crescerSeg s:
   a câmera se afasta, cada passo treme a câmera, os gritos ficam mais fortes; dentro da mata (copas baixas) ele encolhe sozinho;
   GRITO CURTO (I) — atordoa animais enfeitiçados e sombras sem ferir. Falas gaúchas no terminal a cada uso.
   ============================================================================================================ */
export function criarKauling(M, X){
  const S = { ativo: false, esc: 1, alvoEsc: 1, tCresc: 0, aneis: [], tremor: 0, cdCurto: 0, ultX: 0, ultZ: 0, passo: 0, g: new Group() };
  M.cen.grupo.add(S.g);
  const d = () => PODERES.kauling, T = () => M.transformacao;
  const ativo = () => S.ativo && M.personagens && M.personagens.ativo === "kauling" && T() && T().ativa();
  const fala = () => { const F = d().falas; X.msg("info", "Kauling: “" + F[Math.floor(Math.random() * F.length)] + "”"); };
  const avatar = () => { const am = M.H && M.H.andarMod; const A = am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); return A && A.av ? A.av : null; };
  function aoTransformar(id, on){ if(id !== "kauling") return; S.ativo = on; if(!on) encolhe(true); }
  const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const naMata = (x, z) => { const K = M.kml && M.kml.S; return !!K && K.poligonos.some(p => (p.tipo === "mata" || p.tipo === "mataBaixa") && emPoli(p.mundoPts || p.pts, x, z)); };
  /* ---- anéis de som ---- */
  function aneis(J, n, raioMax, cor){ const f = [Math.sin(J.yaw), Math.cos(J.yaw)], bx = J.x + f[0] * 1.2 * U * S.esc, by = J.y + 4.3 * U * S.esc, bz = J.z + f[1] * 1.2 * U * S.esc;
    for(let k = 0; k < n; k++){ const m = new Mesh(new TorusGeometry(.6 * U, .08 * U, 8, 36), new MeshBasicMaterial({ color: cor, transparent: true, opacity: .75, blending: AdditiveBlending, depthWrite: false })); m.position.set(bx, by, bz); m.lookAt(bx + f[0], by, bz + f[1]); S.g.add(m); S.aneis.push({ m, t: -k * .12, vida: .9, f, raioMax, o: [bx, by, bz] }); } }
  function empurra(J, raioM, forca, dano){ const f = [Math.sin(J.yaw), Math.cos(J.yaw)], cos = Math.cos(d().cone * Math.PI / 180 / 2); let n = 0;
    for(const a of X.S.alvos){ if(a.morto) continue; const p = a.pos(), dx = p.x - J.x, dz = p.z - J.z, dist = Math.hypot(dx, dz); if(dist > raioM * U || dist < .01 || (dx * f[0] + dz * f[1]) / dist < cos) continue; n++;
      const k = (1 - dist / (raioM * U) * .5) * forca * 9 * U; if(a.g){ a.g.position.x += dx / dist * k; a.g.position.z += dz / dist * k; a.g.position.y = X.chao(a.g.position.x, a.g.position.z); a.g.rotation.z = (Math.random() - .5) * 1.1; } if(dano && a.dano) a.dano(dano); } return n; }
  /* ---- GRITO forte ---- */
  function grito(J, dd){ const forte = S.esc > 1.5 ? 1.7 : 1; aneis(J, 5, dd.empurraM * U, 0xf0f0e0); const n = empurra(J, dd.empurraM * forte, forte, dd.danoInimigo * forte);
    if(M.vento && M.vento.forca) M.vento.forca("rajada"); X.luzFx(J.x, J.y + 4 * U, J.z, 0xfff2d0, 6, 20 * U, .4); S.tremor = .35 * forte; fala();
    X.msg("sobrenatural", "O grito ensurdecedor do Kauling arremessa " + n + " alvo(s) e sacode o capim e as copas." + (forte > 1 ? " (gigante: ainda mais forte)" : "")); if(M.ctx) M.ctx.mostraAviso(n ? "Grito! " + n + " arremessado(s)" : "Grito!"); }
  /* ---- GRITO curto: atordoa sem ferir ---- */
  function curto(J){ if(S.cdCurto > 0) return; const dd = d(); S.cdCurto = 6; aneis(J, 3, dd.gritoCurtoM * U, 0xcfe8ff); let n = 0; const R = dd.gritoCurtoM * U;
    ((M.fauna && M.fauna.animais) || []).forEach(a => { if(Math.hypot(a.x - J.x, a.z - J.z) < R){ a.atordoado = dd.atordoaSeg; n++; } });
    for(const a of X.S.alvos){ if(!a.morto && Math.hypot(a.pos().x - J.x, a.pos().z - J.z) < R){ a.encantado = Math.max(a.encantado || 0, dd.atordoaSeg); n++; } }
    fala(); X.msg("sobrenatural", "Grito curto: " + n + " alvo(s) param no lugar por " + dd.atordoaSeg + " s, sem ferir."); if(M.ctx) M.ctx.mostraAviso("Grito curto: " + n + " atordoado(s)"); }
  /* ---- CRESCER ---- */
  function cresce(){ const dd = d(); S.alvoEsc = dd.crescerX; S.tCresc = dd.crescerSeg; fala(); X.msg("sobrenatural", "Kauling cresce " + dd.crescerX + "× por " + dd.crescerSeg + " s: passos pesados, gritos mais fortes."); if(M.ctx) M.ctx.mostraAviso("Gigante! (" + dd.crescerSeg + " s · U encolhe)"); }
  function encolhe(silencio){ if(S.alvoEsc === 1 && S.esc === 1) return; S.alvoEsc = 1; S.tCresc = 0; if(!silencio){ X.msg("info", "Kauling volta ao tamanho normal."); if(M.ctx) M.ctx.mostraAviso("Tamanho normal"); } }
  function tecla(e){ if(!ativo() || e.repeat || e.ctrlKey || e.altKey || e.metaKey || (typeof M.depurando === "function" && M.depurando())) return false; const J = M.jogador(), k = d().teclas; if(!J) return false;
    if(e.code === k.crescer){ e.preventDefault(); if(S.alvoEsc > 1) encolhe(false); else cresce(); return true; } if(e.code === k.curto){ e.preventDefault(); curto(J); return true; } return false; }
  function tick(dt){ S.cdCurto = Math.max(0, S.cdCurto - dt);
    if(S.tCresc > 0){ S.tCresc -= dt; if(S.tCresc <= 0) encolhe(false); }
    const J = M.jogador();
    if(S.alvoEsc > 1 && J && naMata(J.x, J.z)){ encolhe(true); X.msg("info", "Copas baixas: Kauling encolhe para passar pela mata."); if(M.ctx) M.ctx.mostraAviso("Copas baixas: encolheu"); }
    if(!ativo() && S.alvoEsc > 1) S.alvoEsc = 1;
    S.esc += (S.alvoEsc - S.esc) * Math.min(1, dt * 2.5); const av = avatar(); if(av){ const alvo = .92 * S.esc; if(Math.abs(av.scale.x - alvo) > 1e-3) av.scale.setScalar(alvo); }
    if(S.esc > 1.3 && J){ const mov = Math.hypot(J.x - S.ultX, J.z - S.ultZ); S.passo += mov; if(S.passo > 3 * U * S.esc){ S.passo = 0; S.tremor = Math.max(S.tremor, .18 * S.esc); } } S.ultX = J ? J.x : 0; S.ultZ = J ? J.z : 0;
    if(S.tremor > 0){ S.tremor -= dt; const c = M.cam; if(c){ c.position.x += (Math.random() - .5) * S.tremor * .5; c.position.y += (Math.random() - .5) * S.tremor * .5; } }
    S.aneis = S.aneis.filter(a => { a.t += dt; if(a.t < 0) return true; const k = a.t / a.vida, r = .6 * U + k * a.raioMax * .5; a.m.scale.setScalar(r / (.6 * U)); a.m.position.set(a.o[0] + a.f[0] * k * a.raioMax * .9, a.o[1], a.o[2] + a.f[1] * k * a.raioMax * .9); a.m.material.opacity = .75 * (1 - k); if(k >= 1){ S.g.remove(a.m); a.m.geometry.dispose(); return false; } return true; }); }
  const escala = () => S.esc;
  const info = () => (ativo() ? "Kauling: V grito · " + d().teclas.crescer.replace("Key", "") + (S.esc > 1.3 ? " encolher (gigante " + S.esc.toFixed(1) + "×, " + Math.ceil(S.tCresc) + " s)" : " crescer") + " · " + d().teclas.curto.replace("Key", "") + " grito curto" + (S.cdCurto > 0 ? " (" + S.cdCurto.toFixed(0) + ")" : "") : "");
  return { grito, curto, cresce, encolhe, tecla, tick, aoTransformar, info, escala, S };
}
