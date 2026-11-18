import {progressoPinheirais} from '../../../../data/missoes/pinheirais.js';
import { Group, Mesh, TorusGeometry, CircleGeometry, SphereGeometry, ShaderMaterial, MeshBasicMaterial, PointLight, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, AdditiveBlending, DoubleSide, Color } from "three";
import { U } from "../config.js";

/* ============================================================================================================
   PORTAL-FAVO (era violeta) — aparece sozinho, à frente do jogador, logo depois de escolher um personagem "de outro tempo" (Sepé, Tupã, Atiara).
   Atravessá-lo leva ao PASSADO (anos 1950): Vila Santana → vilas, Olaria e Cambará S/A cobertas de mata densa, com o dobro de bichos do parque, tom sépia.
   Lá aparece um portal de volta (favo também) que leva à praça. Pit (tempo atual) escolhido: o portal de ida some.
   Ajustes: PORTAL abaixo. Depuração: M.portal.abre() cria um à frente · M.portal.entra() atravessa na hora.
   ============================================================================================================ */
export const PORTAL = { distFrenteM: 9, raioM: 2.6, alturaM: 5.4, gatilhoM: 1.9, cor: 0x2fd06a, corOuro: 0xffb83a, corNucleo: 0x063d22, sumirLongeM: 140 };   // cores do vidro da Rua Coberta

export function criarPortal(M){
  const S = { p: null, volta: null, t: 0, viajando: false, cortina: null, oferecido:false };
  const msg = (t, s) => M.terminal && M.terminal.msg(t, s);
  const chao = (x, z) => M.cen.chao(x, z, 1e9);

  /* PORTAL-FAVO (pedido do Lucas): hexágono de favo de mel girando e pulsando, nas cores do vidro da Rua Coberta (verde-esmeralda + dourado),
     com vórtice de favos no meio, três molduras hexagonais girando em sentidos opostos, runas-favo orbitando, fagulhas douradas em espiral e brilho no chão. */
  function constroi(x, z, yaw, rotulo){
    const g = new Group(), H = PORTAL.alturaM * U, R = H / 2, verde = new Color(PORTAL.cor), ouro = new Color(PORTAL.corOuro), add = { transparent: true, blending: AdditiveBlending, depthWrite: false };
    const centro = new Group(); centro.position.y = R * 1.04; g.add(centro);
    /* molduras hexagonais (TorusGeometry com 6 segmentos = hexágono) */
    const moldura = (r, tubo, cor, op) => { const m = new Mesh(new TorusGeometry(r, tubo, 6, 6), new MeshBasicMaterial({ color: cor, ...add, opacity: op })); m.rotation.z = Math.PI / 6; centro.add(m); return m; };
    const aneis = [moldura(R, .2 * U, PORTAL.corOuro, 1), moldura(R * .9, .1 * U, PORTAL.cor, .95), moldura(R * 1.16, .07 * U, PORTAL.corOuro, .55), moldura(R * 1.05, .55 * U, PORTAL.cor, .16)];
    /* vórtice de favos (shader): células verdes que pulsam, bordas douradas, giro em espiral e clarão no centro */
    const mat = new ShaderMaterial({ ...add, side: DoubleSide, uniforms: { t: { value: 0 }, c1: { value: verde }, c2: { value: new Color(PORTAL.corNucleo) }, c3: { value: ouro } },
      vertexShader: "varying vec2 v; void main(){ v = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float t; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; varying vec2 v;
        const vec2 s = vec2(1.0, 1.7320508);
        float hx(vec2 p){ p = abs(p); return max(dot(p, s * .5), p.x); }
        vec4 hc(vec2 p){ vec4 c = floor(vec4(p, p - vec2(.5, 1.)) / s.xyxy) + .5; vec4 h = vec4(p - c.xy * s, p - (c.zw + .5) * s); return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy) : vec4(h.zw, c.zw + .5); }
        float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){ float r = length(v); float a = t * .7 + (1.0 - r) * 1.7; mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
          vec2 p = rot * v * (3.4 + 1.0 * sin(t * .5)) + vec2(0., t * .35); vec4 h = hc(p); float e = .5 - hx(h.xy);
          float pul = .5 + .5 * sin(t * 3.0 + rnd(h.zw) * 6.283 - r * 7.0);
          vec3 cel = mix(c2, c1, pul * .85) * (.55 + .45 * r);
          float linha = smoothstep(.07, .0, e); vec3 col = cel + c3 * linha * (1.2 + .8 * pul);
          col += mix(c3, vec3(1.0), .5) * pow(max(0.0, 1.0 - r * 1.25), 3.0) * (1.6 + .6 * sin(t * 4.0));
          float borda = smoothstep(1.0, .86, r / cos(.5236 - mod(atan(v.y, v.x) + .5236, 1.0472)) * .9);
          gl_FragColor = vec4(col * borda, 1.0); }` });
    const disco = new Mesh(new CircleGeometry(R * .9, 6, Math.PI / 6), mat); centro.add(disco);
    /* runas-favo orbitando */
    const runas = []; for(let i = 0; i < 6; i++){ const m = new Mesh(new TorusGeometry(.32 * U, .06 * U, 4, 6), new MeshBasicMaterial({ color: i % 2 ? PORTAL.cor : PORTAL.corOuro, ...add, opacity: .95 })); centro.add(m); runas.push(m); }
    /* fagulhas douradas em espiral + pólen verde subindo */
    const N = 160, pos = new Float32Array(N * 3), fase = Array.from({ length: N }, () => [Math.random() * 6.283, Math.random(), Math.random()]), geo = new BufferGeometry(); geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    const fagulhas = new Points(geo, new PointsMaterial({ color: 0xffd36a, size: .3 * U, ...add, opacity: .95 })); fagulhas.frustumCulled = false; centro.add(fagulhas);
    const N2 = 90, pos2 = new Float32Array(N2 * 3), fase2 = Array.from({ length: N2 }, () => [Math.random() * 6.283, Math.random(), Math.random()]), geo2 = new BufferGeometry(); geo2.setAttribute("position", new Float32BufferAttribute(pos2, 3));
    const polen = new Points(geo2, new PointsMaterial({ color: 0x7dffb0, size: .22 * U, ...add, opacity: .8 })); polen.frustumCulled = false; g.add(polen);
    /* brilho hexagonal no chão */
    const chaoM = new MeshBasicMaterial({ color: PORTAL.cor, ...add, opacity: .3, side: DoubleSide }), base = new Mesh(new CircleGeometry(R * 1.3, 6), chaoM); base.rotation.x = -Math.PI / 2; base.position.y = .08 * U; g.add(base);
    const luz = new PointLight(PORTAL.cor, 3, 45 * U); luz.position.set(0, R, 1.2 * U); g.add(luz);
    g.position.set(x, chao(x, z), z); g.rotation.y = yaw; M.cen.grupo.add(g);
    const o = { g, x, z, rotulo, t: Math.random() * 10, anim(dt){ o.t += dt; const t = o.t; mat.uniforms.t.value = t;
        aneis[0].rotation.z = Math.PI / 6 + t * .6; aneis[1].rotation.z = Math.PI / 6 - t * 1.1; aneis[2].rotation.z = Math.PI / 6 + t * .35; aneis[3].rotation.z = Math.PI / 6 - t * .2;
        const pul = 1 + .05 * Math.sin(t * 3.2); centro.scale.set(pul, pul, 1); aneis[3].material.opacity = .12 + .1 * Math.sin(t * 3.2); chaoM.opacity = .22 + .14 * Math.sin(t * 3.2);
        luz.intensity = 2.8 + 1.2 * Math.sin(t * 3.2); luz.color.copy(verde).lerp(ouro, .5 + .5 * Math.sin(t * 1.3));
        runas.forEach((m, i) => { const a = t * .9 + i * 1.0472, rr = R * 1.32 + .3 * U * Math.sin(t * 2 + i); m.position.set(Math.cos(a) * rr, Math.sin(a) * rr, .2 * U * Math.sin(t * 3 + i)); m.rotation.z = -t * 2 + i; m.rotation.y = t * 1.5; });
        for(let i = 0; i < N; i++){ const f = fase[i], k = (t * (.1 + f[2] * .15) + f[1]) % 1, a = f[0] + t * (.8 + f[2]) + k * 6, rr = R * (1.25 - k * 1.1); pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = Math.sin(a) * rr; pos[i * 3 + 2] = (f[1] - .5) * .8 * U + k * .6 * U; }
        for(let i = 0; i < N2; i++){ const f = fase2[i], k = (t * (.06 + f[2] * .08) + f[1]) % 1, a = f[0] + t * .3; pos2[i * 3] = Math.cos(a) * R * (.6 + f[2]); pos2[i * 3 + 1] = k * H * 1.5; pos2[i * 3 + 2] = Math.sin(a) * R * (.6 + f[2]) * .6; }
        geo.attributes.position.needsUpdate = true; geo2.attributes.position.needsUpdate = true; },
      dispose(){ g.parent && g.parent.remove(g); g.traverse(m => { m.geometry && m.geometry.dispose(); m.material && m.material.dispose && m.material.dispose(); }); } };
    return o;
  }
  const remove = (k) => { if(S[k]){ S[k].dispose(); S[k] = null; } };

  /* cortina verde-dourada (favo) ao atravessar */
  function cortina(ms, fn){
    const u = M.ui; if(!u){ fn(); return; } if(!S.cortina){ S.cortina = document.createElement("div"); S.cortina.style.cssText = "position:absolute;inset:0;z-index:80;background:radial-gradient(circle,#fff2c0 0%,#ffb83a 18%,#1f9e4e 55%,#03200f 100%);opacity:0;pointer-events:none;transition:opacity .7s;"; }
    if(!S.cortina.parentNode) u.appendChild(S.cortina); requestAnimationFrame(() => { S.cortina.style.opacity = "1"; }); setTimeout(() => { fn(); setTimeout(() => { S.cortina.style.opacity = "0"; }, 250); }, ms);
  }

  /* ---------- abre um portal de ida à frente do jogador ---------- */
  function abre(opc={}){
    if(!progressoPinheirais(M.missoes?.S.prog.concl).passado&&!(opc.debug&&M.opts?.debug)){M.ctx?.mostraAviso("Conclua as missões do centro para abrir o portal de 1950");return false;}S.oferecido=true;
    const J = M.jogador(); if(!J || S.p) return false; const d = PORTAL.distFrenteM * U, x = J.x + Math.sin(J.yaw) * d, z = J.z + Math.cos(J.yaw) * d;
    S.p = constroi(x, z, Math.atan2(J.x - x, J.z - z), "ida"); msg("sobrenatural", "O ar se rasga à sua frente: um favo de luz verde e dourada gira e se abre. Do outro lado, o passado."); M.ctx && M.ctx.mostraAviso("Portal-favo: atravesse para o passado"); return true;
  }
  function aoEscolher(d){
    if(!d || !M.andando()||M.ancestral?.ativo()) return;
    if(d.tempo === "outro"){ if(M.lugares && M.lugares.S.antigo) return; remove("p"); abre(); } else remove("p");
  }

  /* ---------- travessia ---------- */
  function destinoPassado(){
    const L = M.lugares, it = L && (L.item("vila-santana") || L.item("vila-ouro-verde")); if(!it) return null;
    const dx = it.centro[0] - (it.chegada ? it.chegada.x : it.centro[0]), dz = it.centro[1] - (it.chegada ? it.chegada.z : it.centro[1]), l = Math.hypot(dx, dz) || 1;
    return { x: it.centro[0], z: it.centro[1], yaw: Math.atan2(dx / l, dz / l) };
  }
  function entra(opc={}){
    if(!progressoPinheirais(M.missoes?.S.prog.concl).passado&&!(opc.debug&&M.opts?.debug))return false;
    if(S.viajando) return false; const dst = destinoPassado(); if(!dst){ msg("info", "O portal vibra, mas o KML ainda não trouxe as vilas."); return false; }
    S.viajando = true; msg("sobrenatural", "Você atravessa o portal. O tempo gira ao redor.");
    cortina(800, () => {
      remove("p"); M.lugares.entraAntigo(dst.x, dst.z); M.ctx.teleporta(dst.x, dst.z); const J = M.jogador(); if(M.H.andarMod && M.H.andarMod.colocar) M.H.andarMod.colocar(dst.x, dst.z, dst.yaw + Math.PI);
      setTimeout(() => { const j = M.jogador(); if(j && !S.volta){ const x = j.x + Math.sin(j.yaw) * 10 * U + Math.cos(j.yaw) * 5 * U, z = j.z + Math.cos(j.yaw) * 10 * U - Math.sin(j.yaw) * 5 * U; S.volta = constroi(x, z, Math.atan2(j.x - x, j.z - z), "volta"); }
        msg("sobrenatural", "Raia, 1950. A mata cobre tudo; os bichos andam sem medo da estrada. O portal de volta brilha atrás de você."); M.ctx.mostraAviso("1950 — Raia"); if(M.missoes && M.missoes.emite) M.missoes.emite("portal:passado", {}); S.viajando = false; }, 600);
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
    if(J&&!S.oferecido&&!M.lugares.S.antigo&&!M.ancestral?.ativo()&&progressoPinheirais(M.missoes?.S.prog.concl).passado)abre();
    for(const k of ["p", "volta"]){ const o = S[k]; if(!o) continue; o.anim(dt); if(!J || S.viajando) continue; const d = Math.hypot(J.x - o.x, J.z - o.z);
      if(d < PORTAL.gatilhoM * U){ if(k === "p") entra(); else volta(); return; }
      if(k === "p" && d > PORTAL.sumirLongeM * U){ remove("p"); msg("info", "O portal-favo se fecha. Escolha o personagem de novo para abri-lo."); } }
    /* o sépia do passado fica ligado enquanto durar */
    if(M.lugares && M.lugares.S.antigo){ const el = M.renderer && M.renderer.domElement; if(el && !el.style.filter) el.style.filter = "sepia(.65) contrast(.95) saturate(.8)"; }
  }
  return { fechaIda:()=>remove("p"),abre, aoEscolher, entra, volta, tick, S, desliga(){ remove("p"); remove("volta"); if(S.cortina) S.cortina.remove(); } };
}
