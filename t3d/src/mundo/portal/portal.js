import { Group, Mesh, TorusGeometry, CircleGeometry, SphereGeometry, ShaderMaterial, MeshBasicMaterial, PointLight, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, AdditiveBlending, DoubleSide, Color } from "three";
import { U } from "../config.js";

/* ============================================================================================================
   PORTAL VIOLETA — aparece sozinho, à frente do jogador, logo depois de escolher um personagem "de outro tempo" (Sepé, Tupã, Atiara).
   Atravessá-lo leva ao PASSADO (anos 1950): Vila Santana → vilas, Olaria e Cambará S/A cobertas de mata densa, com o dobro de bichos do parque, tom sépia.
   Lá aparece um portal de volta (violeta também) que leva à praça. Pit (tempo atual) escolhido: o portal de ida some.
   Ajustes: PORTAL abaixo. Depuração: M.portal.abre() cria um à frente · M.portal.entra() atravessa na hora.
   ============================================================================================================ */
export const PORTAL = { distFrenteM: 9, raioM: 2.6, alturaM: 5.4, gatilhoM: 1.9, cor: 0xa24dff, corNucleo: 0x4b1a9e, sumirLongeM: 140 };

export function criarPortal(M){
  const S = { p: null, volta: null, t: 0, viajando: false, cortina: null };
  const msg = (t, s) => M.terminal && M.terminal.msg(t, s);
  const chao = (x, z) => M.cen.chao(x, z, 1e9);

  function constroi(x, z, yaw, rotulo){
    const g = new Group(), R = PORTAL.raioM * U, H = PORTAL.alturaM * U, cor = new Color(PORTAL.cor);
    const anel = new Mesh(new TorusGeometry(R, .22 * U, 12, 48), new MeshBasicMaterial({ color: PORTAL.cor })); anel.scale.y = H / (2 * R); anel.position.y = H / 2; g.add(anel);
    const halo = new Mesh(new TorusGeometry(R, .7 * U, 10, 48), new MeshBasicMaterial({ color: PORTAL.cor, transparent: true, opacity: .22, blending: AdditiveBlending, depthWrite: false })); halo.scale.y = H / (2 * R); halo.position.y = H / 2; g.add(halo);
    const mat = new ShaderMaterial({ transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, uniforms: { t: { value: 0 }, c1: { value: cor }, c2: { value: new Color(PORTAL.corNucleo) } },
      vertexShader: "varying vec2 v; void main(){ v = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec2 v; void main(){ float r = length(v); if(r > 1.0) discard; float a = atan(v.y, v.x); float esp = sin(a * 5.0 + r * 9.0 - t * 2.6) * .5 + .5; float anel = smoothstep(1.0, .75, r); vec3 col = mix(c2, c1, esp * (.4 + r * .6)); float brilho = pow(1.0 - r, 2.0) * .5 + esp * .5; gl_FragColor = vec4(col * (.7 + brilho), anel * (.55 + .35 * esp)); }" });
    const disco = new Mesh(new CircleGeometry(1, 48), mat); disco.scale.set(R, H / 2, 1); disco.position.y = H / 2; g.add(disco);
    const N = 70, pos = new Float32Array(N * 3), fase = Array.from({ length: N }, () => [Math.random() * 6.283, Math.random(), Math.random()]), geo = new BufferGeometry(); geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    const fagulhas = new Points(geo, new PointsMaterial({ color: 0xd9b3ff, size: .32 * U, transparent: true, opacity: .9, blending: AdditiveBlending, depthWrite: false })); fagulhas.frustumCulled = false; g.add(fagulhas);
    const luz = new PointLight(PORTAL.cor, 3, 40 * U); luz.position.set(0, H / 2, 1.2 * U); g.add(luz);
    g.position.set(x, chao(x, z), z); g.rotation.y = yaw; M.cen.grupo.add(g);
    const o = { g, x, z, rotulo, t: Math.random() * 10, anim(dt){ o.t += dt; mat.uniforms.t.value = o.t; halo.material.opacity = .18 + .08 * Math.sin(o.t * 3); luz.intensity = 2.6 + .8 * Math.sin(o.t * 2.1);
        for(let i = 0; i < N; i++){ const f = fase[i], a = f[0] + o.t * (.5 + f[2] * .8), k = (o.t * (.12 + f[2] * .2) + f[1]) % 1; pos[i * 3] = Math.cos(a) * R * (.9 + .25 * f[1]); pos[i * 3 + 1] = H / 2 + Math.sin(a) * H / 2 * (.9 + .25 * f[1]) + k * .4 * U; pos[i * 3 + 2] = (f[1] - .5) * 1.4 * U; } geo.attributes.position.needsUpdate = true; },
      dispose(){ g.parent && g.parent.remove(g); g.traverse(m => { m.geometry && m.geometry.dispose(); }); } };
    return o;
  }
  const remove = (k) => { if(S[k]){ S[k].dispose(); S[k] = null; } };

  /* cortina violeta ao atravessar */
  function cortina(ms, fn){
    const u = M.ui; if(!u){ fn(); return; } if(!S.cortina){ S.cortina = document.createElement("div"); S.cortina.style.cssText = "position:absolute;inset:0;z-index:80;background:radial-gradient(circle,#7a2cff 0%,#2a0a66 70%,#12042e 100%);opacity:0;pointer-events:none;transition:opacity .7s;"; }
    if(!S.cortina.parentNode) u.appendChild(S.cortina); requestAnimationFrame(() => { S.cortina.style.opacity = "1"; }); setTimeout(() => { fn(); setTimeout(() => { S.cortina.style.opacity = "0"; }, 250); }, ms);
  }

  /* ---------- abre um portal de ida à frente do jogador ---------- */
  function abre(){
    const J = M.jogador(); if(!J || S.p) return false; const d = PORTAL.distFrenteM * U, x = J.x + Math.sin(J.yaw) * d, z = J.z + Math.cos(J.yaw) * d;
    S.p = constroi(x, z, Math.atan2(J.x - x, J.z - z), "ida"); msg("sobrenatural", "O ar se rasga à sua frente: um portal violeta se abre. Do outro lado, o passado."); M.ctx && M.ctx.mostraAviso("Portal violeta: atravesse para o passado"); return true;
  }
  function aoEscolher(d){
    if(!d || !M.andando()) return;
    if(d.tempo === "outro"){ if(M.lugares && M.lugares.S.antigo) return; remove("p"); abre(); } else remove("p");
  }

  /* ---------- travessia ---------- */
  function destinoPassado(){
    const L = M.lugares, it = L && (L.item("vila-santana") || L.item("vila-ouro-verde")); if(!it) return null;
    const dx = it.centro[0] - (it.chegada ? it.chegada.x : it.centro[0]), dz = it.centro[1] - (it.chegada ? it.chegada.z : it.centro[1]), l = Math.hypot(dx, dz) || 1;
    return { x: it.centro[0], z: it.centro[1], yaw: Math.atan2(dx / l, dz / l) };
  }
  function entra(){
    if(S.viajando) return false; const dst = destinoPassado(); if(!dst){ msg("info", "O portal vibra, mas o KML ainda não trouxe as vilas."); return false; }
    S.viajando = true; msg("sobrenatural", "Você atravessa o portal. O tempo gira ao redor.");
    cortina(800, () => {
      remove("p"); M.lugares.entraAntigo(dst.x, dst.z); M.ctx.teleporta(dst.x, dst.z); const J = M.jogador(); if(M.H.andarMod && M.H.andarMod.colocar) M.H.andarMod.colocar(dst.x, dst.z, dst.yaw + Math.PI);
      setTimeout(() => { const j = M.jogador(); if(j && !S.volta){ const x = j.x + Math.sin(j.yaw) * 10 * U + Math.cos(j.yaw) * 5 * U, z = j.z + Math.cos(j.yaw) * 10 * U - Math.sin(j.yaw) * 5 * U; S.volta = constroi(x, z, Math.atan2(j.x - x, j.z - z), "volta"); }
        msg("sobrenatural", "Vila Santana, 1950. A mata cobre tudo; os bichos andam sem medo da estrada. O portal de volta brilha atrás de você."); M.ctx.mostraAviso("1950 — Vila Santana"); if(M.missoes && M.missoes.emite) M.missoes.emite("portal:passado", {}); S.viajando = false; }, 600);
    });
    return true;
  }
  function volta(){
    if(S.viajando) return false; S.viajando = true; msg("sobrenatural", "Você volta pelo portal. O presente te recebe.");
    cortina(800, () => {
      remove("volta"); M.lugares.saiAntigo(); const it = M.lugares.item("praca") || M.lugares.item("praca-sequoia"), c = it && (it.chegada || { x: it.centro[0], z: it.centro[1], yaw: 0 });
      if(c){ M.ctx.teleporta(c.x, c.z); if(M.H.andarMod && M.H.andarMod.colocar) M.H.andarMod.colocar(c.x, c.z, (c.yaw || 0) + Math.PI); }
      const el = M.renderer && M.renderer.domElement; if(el) el.style.filter = ""; setTimeout(() => { M.ctx.mostraAviso("De volta ao presente"); S.viajando = false; }, 500); });
    return true;
  }

  function tick(dt, J){
    for(const k of ["p", "volta"]){ const o = S[k]; if(!o) continue; o.anim(dt); if(!J || S.viajando) continue; const d = Math.hypot(J.x - o.x, J.z - o.z);
      if(d < PORTAL.gatilhoM * U){ if(k === "p") entra(); else volta(); return; }
      if(k === "p" && d > PORTAL.sumirLongeM * U){ remove("p"); msg("info", "O portal violeta se fecha. Escolha o personagem de novo para abri-lo."); } }
    /* o sépia do passado fica ligado enquanto durar */
    if(M.lugares && M.lugares.S.antigo){ const el = M.renderer && M.renderer.domElement; if(el && !el.style.filter) el.style.filter = "sepia(.65) contrast(.95) saturate(.8)"; }
  }
  return { abre, aoEscolher, entra, volta, tick, S, desliga(){ remove("p"); remove("volta"); if(S.cortina) S.cortina.remove(); } };
}
