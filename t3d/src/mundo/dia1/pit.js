import { U } from "../config.js";
import { DIA1 } from "../../../../data/missoes/dia1.js";

/* ============================================================================================================
   PIT — resgatista da equipe e companheiro do jogador no Dia 1.
   Anda junto (atrás e ao lado, sem atrapalhar a passagem), espera quando o jogador para, chama quando o jogador se afasta do objetivo, fala o tempo todo (balão + terminal).
   Modos: "segue" (padrão) · "fixo" (fica onde está, de frente para o jogador) · "oculto" (cenas em cinema, ou quando as cenas o usam como ator).
   ============================================================================================================ */
export function criaPit(M, D){
  const { H, cen } = M, C = DIA1.pit, S = { rig: null, modo: "oculto", fase: 0, vel: 0, ultFala: 0, chama: 0, dist0: null, anda: false, alvoFixo: null, falou: new Set() };
  const chao = (x, z) => cen.chao(x, z, 1e9);

  function constroi(){
    if(S.rig) return S.rig; const Mt = H.M;
    const r = H.pessoa3d({ nome: "PIT", x: 0, y: -50, z: 0, yaw: 0, camisa: Mt(0x56642d), manga: Mt(0x56642d), calca: Mt(0x4a5729), pele: H.pele.media, capacete: Mt(0xc22b2b, { roughness: .45, metalness: .1 }), cabelo: 0x1e140d, barba: true, pin: { barra: "#951c24", pil: 4, mosq: "#ece3cf" } });
    r.rotulo = "PIT"; r.av.visible = false; S.rig = r; return r;
  }
  const rig = () => S.rig || constroi();

  /* posição "de companheiro": atrás e à esquerda do jogador */
  function alvoSegue(J){ const a = J.camYaw !== undefined ? J.camYaw + Math.PI : J.yaw, d = C.distSegueM * U, c = Math.cos(a), s = Math.sin(a); return { x: J.x + s * d * .55 + c * d * .8, z: J.z + c * d * .55 - s * d * .8 }; }

  function coloca(x, z, yaw){ const r = rig(); r.av.position.set(x, chao(x, z), z); r.av.rotation.y = yaw || 0; S.vel = 0; }
  function aparece(J){ const J0 = J || M.jogador(); if(!J0) return; const p = alvoSegue(J0); coloca(p.x, p.z, J0.yaw); rig().av.visible = true; S.modo = "segue"; S.presente = true; }
  function oculta(){ if(S.rig) S.rig.av.visible = false; S.modo = "oculto"; }
  function fixa(x, z, yaw){ coloca(x, z, yaw); rig().av.visible = true; S.modo = "fixo"; S.alvoFixo = { x, z, yaw }; }
  const volta = () => { if(S.modo === "oculto") aparece(); else S.modo = "segue"; };

  /* animação de caminhada/parado: a mesma do jogo (pernas articuladas ao andar, braços balançando) */
  function anima(dt, andando, vel){
    const r = rig(), t = S.fase; r.pernasA.grupo.visible = andando; r.estat.forEach(o => { o.visible = !andando; });
    if(andando){ S.fase += dt * (4 + vel * .7); const amp = Math.min(1, vel / 6) * .55 + .12, f = S.fase, [qD, qE] = r.pernasA.quadril, [jD, jE] = r.pernasA.joelho;
      qD.rotation.x = Math.sin(f) * amp; qE.rotation.x = -Math.sin(f) * amp; jD.rotation.x = Math.max(0, -Math.cos(f)) * amp * 1.5; jE.rotation.x = Math.max(0, Math.cos(f)) * amp * 1.5;
      const sw = Math.sin(f) * amp; r.bD.pv.rotation.set(sw * .9, 0, -.14); r.bE.pv.rotation.set(-sw * .9, 0, .14); r.bD.co.rotation.set(-.3, 0, 0); r.bE.co.rotation.set(-.3, 0, 0); }
    else { S.fase += dt * 1.4; r.bD.pv.rotation.set(.05, 0, -.12); r.bD.co.rotation.set(-.3 + Math.sin(t) * .03, 0, 0); r.bE.pv.rotation.set(.05, 0, .12); r.bE.co.rotation.set(-.25, 0, 0); }
    if(r.bD.rock) r.bD.rock.visible = false; if(r.nome && r.nome.visible) r.nome.rotation.y = Math.atan2(M.cam.position.x - r.av.position.x, M.cam.position.z - r.av.position.z) - r.av.rotation.y;
  }

  function tick(dt, J){
    if(!S.rig || S.modo === "oculto" || !J) return; const r = S.rig, p = r.av.position; if(!r.av.visible) return;
    if(S.modo === "fixo"){ const dx = J.x - p.x, dz = J.z - p.z; let dy = Math.atan2(dx, dz) - r.av.rotation.y; while(dy > Math.PI) dy -= 6.283; while(dy < -Math.PI) dy += 6.283; r.av.rotation.y += dy * Math.min(1, dt * 3); anima(dt, false, 0); p.y += (chao(p.x, p.z) - p.y) * Math.min(1, dt * 12); return; }
    const al = alvoSegue(J), dx = al.x - p.x, dz = al.z - p.z, d = Math.hypot(dx, dz);
    if(d > 45 * U){ aparece(J); return; }                                              // ficou para trás (viagem rápida, teleporte): reaparece ao lado
    const parado = d < 1.2 * U; S.esperaT = parado ? (S.esperaT || 0) + dt : 0;
    let v = 0; if(!parado){ v = Math.min(C.velocidadeM * U * (d > 12 * U ? 1.6 : 1), d * 2.4); const k = Math.min(1, v * dt / d); p.x += dx * k; p.z += dz * k; r.av.rotation.y += (() => { let q = Math.atan2(dx, dz) - r.av.rotation.y; while(q > Math.PI) q -= 6.283; while(q < -Math.PI) q += 6.283; return q * Math.min(1, dt * 8); })(); }
    else { let q = Math.atan2(J.x - p.x, J.z - p.z) - r.av.rotation.y; while(q > Math.PI) q -= 6.283; while(q < -Math.PI) q += 6.283; r.av.rotation.y += q * Math.min(1, dt * 2.5); }
    p.y += (chao(p.x, p.z) - p.y) * Math.min(1, dt * 12); S.vel = v / U; anima(dt, v > 1.2, S.vel);
  }

  /* fala do Pit: balão + terminal (cinza: informação geral) */
  function fala(txt, o = {}){ if(!S.rig) return 0; return D.fala(S.rig, txt, { tipo: "info", maxU: 60 * U, ...o }); }
  const linhas = (lista, gapSeg = 4.5) => lista.forEach((t, i) => setTimeout(() => { if(S.modo !== "oculto") fala(t); }, i * gapSeg * 1000));
  const sorteia = (k) => { const L = DIA1.falas[k] || []; return L[Math.floor(Math.random() * L.length)]; };

  return { rig, constroi, aparece, oculta, fixa, volta, coloca, tick, fala, linhas, sorteia, S, get modo(){ return S.modo; }, set modo(v){ S.modo = v; } };
}
