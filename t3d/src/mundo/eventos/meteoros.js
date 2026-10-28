import { Mesh, PlaneGeometry, MeshBasicMaterial, Vector3, Matrix4, DoubleSide, AdditiveBlending, MathUtils, Color } from "three";
import { canvasTex } from "../../lib.js";
import { EVENTOS } from "./config.js";

/* ============================================================================================================
   CHUVA DE METEOROS (todo dia às 21:00, 30–40 min de jogo)
   Pool de meteoros reutilizáveis (planos finos com gradiente, blending aditivo): nenhum objeto novo por meteoro. Todos partem de um mesmo ponto do céu (radiante).
   Intensidade em curva natural (começa com 1–2, pico perto de 21:15, vai diminuindo). 1–2 bólidos por noite: maiores, mais lentos, iluminam a cena e deixam rastro.
   Nesta janela as nuvens diminuem. Reações: visitantes olham para cima ("Fiz um pedido!"), guias explicam a origem (poeira espacial a 80–100 km).
   ============================================================================================================ */

const sstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);

export function criarMeteoros(M, luzes){
  const { cen, cam, ciclo } = M, C = EVENTOS.meteoros, R = 3400, th = 1.15;
  const dirMundo = (az, alt) => { const a = az * Math.PI / 180, e = alt * Math.PI / 180, c = Math.cos(e); return new Vector3(Math.cos(a - th) * c, Math.sin(e), Math.sin(a - th) * c); };
  const rad = dirMundo(C.radiante.az, C.radiante.alt);
  const tex = canvasTex(128, 16, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.7, "rgba(255,255,255,.55)"); g.addColorStop(.93, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,1)"); c.fillStyle = g; c.fillRect(0, 0, w, h); const m2 = c.createLinearGradient(0, 0, 0, h); m2.addColorStop(0, "rgba(0,0,0,.95)"); m2.addColorStop(.5, "rgba(0,0,0,0)"); m2.addColorStop(1, "rgba(0,0,0,.95)"); c.globalCompositeOperation = "destination-out"; c.fillStyle = m2; c.fillRect(0, 0, w, h); }, { cor: false });
  const pool = []; const geo = new PlaneGeometry(1, 1);
  for(let i = 0; i < 26; i++){ const m = new Mesh(geo, new MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false })); m.visible = false; m.renderOrder = 4; m.frustumCulled = false; cen.grupo.add(m); pool.push({ m, vivo: false, t: 0, dur: 1, bolido: false, rastro: false }); }
  const COR = [0xffffff, 0xffffff, 0xd8ffe0, 0xfff2b8, 0xcfe8ff];
  const S = { ativa: false, h0: 0, durH: .6, bolidos: [], ultReacao: -99, relogio: 0, guiaFalou: false, flash: 0 };

  function lanca(bolido = false){
    const p = pool.find(q => !q.vivo); if(!p) return;
    const a = Math.random() * 6.283, up = Math.abs(rad.y) > .9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0), t0 = new Vector3().crossVectors(rad, up).normalize(), t1 = new Vector3().crossVectors(rad, t0);
    p.t = new Vector3().addScaledVector(t0, Math.cos(a)).addScaledVector(t1, Math.sin(a));
    p.rho = (6 + Math.random() * 34) * Math.PI / 180; p.arco = (bolido ? rnd(18, 34) : rnd(7, 24)) * Math.PI / 180; p.cauda = p.arco * (bolido ? .5 : rnd(.25, .5));
    p.dur = bolido ? rnd(2.2, 3.2) : rnd(.3, 1.2) * (p.arco / .3); p.dur = MathUtils.clamp(p.dur, .3, bolido ? 3.4 : 1.2); p.t0 = 0; p.vivo = true; p.bolido = bolido; p.rastro = false; p.larg = bolido ? 14 : rnd(2.2, 4.5); p.m.material.color.setHex(bolido ? 0xe8ffd8 : COR[Math.floor(Math.random() * COR.length)]); p.m.visible = true; p.fade = 0;
  }
  const dir = new Vector3(), tg = new Vector3(), rt = new Vector3(), pos = new Vector3(), Mx = new Matrix4();
  function posiciona(p, alpha, comp){
    dir.copy(rad).multiplyScalar(Math.cos(alpha)).addScaledVector(p.t, Math.sin(alpha)).normalize();
    tg.copy(rad).multiplyScalar(-Math.sin(alpha)).addScaledVector(p.t, Math.cos(alpha)).normalize();
    rt.crossVectors(tg, dir).normalize();
    Mx.makeBasis(tg.clone().multiplyScalar(comp * R), rt.clone().multiplyScalar(p.larg), dir.clone());
    pos.copy(cam.position).addScaledVector(dir, R); Mx.setPosition(pos); p.m.matrix.copy(Mx); p.m.matrixAutoUpdate = false; p.m.matrixWorldNeedsUpdate = true; return dir.y;
  }

  function inicia(info = {}){
    S.ativa = true; S.h0 = info.origem === "debug" ? ciclo.hora() : (info.hora !== undefined ? info.hora : ciclo.hora()); S.durH = rnd(C.duracaoMin[0], C.duracaoMin[1]) / 60; S.guiaFalou = false; S.ultReacao = -99; S.ult = 0;
    const nb = Math.round(rnd(C.bolidos[0], C.bolidos[1])); S.bolidos = Array.from({ length: nb }, () => rnd(.2, .8)); S.bolidosFeitos = 0;
    if(M.ctx) M.ctx.mostraAviso("🌠 Chuva de meteoros começando — olhe para o céu");
    lanca(false); setTimeout(() => lanca(false), 1100);
    if(M.gente) M.gente.reageCeu("meteoro", { dur: 12 });
  }
  const fase = (h) => { let d = h - S.h0; if(d < -12) d += 24; return d / S.durH; };

  function tick(dt, J, E){
    S.relogio += dt; S.flash += (0 - S.flash) * Math.min(1, dt * 3);
    const cc = C.limpaCeu;
    const vis = (1 - sstep(-12, -4, E.alt)) * (1 - .35 * (E.moonFrac || 0) * Math.max(0, Math.min(1, (E.moonAlt || 0) / 30)));
    if(S.ativa){
      const f = fase(E.h);
      if(f > 1 || f < -.05){ S.ativa = false; }
      else {
        const lam = C.porSegBase + (C.porSegPico - C.porSegBase) * Math.exp(-Math.pow((f - C.picoEm) / .27, 2)), pausa = ciclo.relogio.pausa ? 0 : 1;
        if(Math.random() < lam * dt * pausa) lanca(false);
        S.bolidos.forEach((b, i) => { if(!S.bolidos[i + 100] && f > b){ S.bolidos[i] = 9; lanca(true); S.flash = 1; if(M.gente) M.gente.reageCeu("bolido", { dur: 10 }); S.bolidoOk = true; } });
        if(S.relogio - S.ultReacao > 7 && M.gente && Math.random() < dt * .4){ S.ultReacao = S.relogio; M.gente.reageCeu("meteoro", { dur: 8 }); }
      }
    }
    /* desenha */
    pool.forEach(p => {
      if(!p.vivo) return; p.t0 += dt; const k = p.t0 / p.dur;
      if(p.rastro){ p.fade -= dt / 5; if(p.fade <= 0){ p.vivo = false; p.m.visible = false; return; } const al = p.alphaRastro; posiciona(p, p.rho + p.arco * .5, p.arco * 1.1); p.m.material.opacity = Math.max(0, p.fade) * .35 * vis; void al; return; }
      if(k >= 1){ if(p.bolido){ p.rastro = true; p.fade = 1; p.larg *= .45; p.alphaRastro = 1; return; } p.vivo = false; p.m.visible = false; return; }
      const head = p.rho + p.arco * sstep(0, 1, k * .95 + .02 * k), alphaC = head - p.cauda / 2 * (p.bolido ? 1 : (.5 + .5 * Math.sin(Math.PI * k)));
      const y = posiciona(p, alphaC, p.cauda * (p.bolido ? 1 : (.55 + .45 * Math.sin(Math.PI * Math.min(1, k * 1.05)))));
      p.m.visible = y > .015; p.m.material.opacity = Math.min(1, Math.sin(Math.PI * Math.min(1, k)) * 1.6) * vis * (p.bolido ? 1 : .95);
      if(p.bolido) S.flash = Math.max(S.flash, Math.sin(Math.PI * k));
    });
    /* o bólido ilumina a cena por um instante */
    if(S.flash > .02){ luzes.amb.intensity += .55 * S.flash * vis; luzes.hemi.intensity += .35 * S.flash * vis; }
  }

  /* menos nuvens entre 20:30 e 22:00 (céu limpo para a chuva) e nas madrugadas (para a Via Láctea) */
  ciclo.registrar({ id: "ceu-limpo", modifica(E){ const h = E.h, jan = sstep(cc0, cc0 + .5, h) * (1 - sstep(cc1 - .3, cc1, h)); let k = 1 - .88 * jan; if(h < 5.2) k *= .55 + .45 * sstep(3, 5.2, h); if(h > 23) k *= .7; E.cobertura *= k; } });
  const cc0 = C.limpaCeu[0], cc1 = C.limpaCeu[1];
  return { tick, inicia, estado: S, lanca, info: () => (S.ativa ? "Meteoros: fase " + (fase(ciclo.estado.h) * 100).toFixed(0) + "%" : ""), limpa(){ S.ativa = false; pool.forEach(p => { p.vivo = false; p.m.visible = false; }); } };
  void Color;
}
