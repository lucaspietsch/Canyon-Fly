import { Group, Mesh, CylinderGeometry, TorusGeometry, BoxGeometry, SphereGeometry, Vector3, Quaternion, MathUtils } from "three";
import { mat, NIVEL } from "./lib.js";
import { camera360, cadeirinhaZip } from "./midia.js";
import { PORT, cabY } from "./portico.js";
import { escadaAluminio } from "./plataforma.js";

/* ============================================================================================================
   JOGO DA TIROLESA EM 3D (v2): o cenário real, o Pit e a equipe, o cliente com EPI, a roldana na via e as cenas do jogo.
   A interface do jogo (HUD, painéis, botões) continua 2D por cima; este módulo posiciona atores e câmera a cada quadro:
     menu · plataforma (lançamento, vista dos 6 cabos) · descida · recebimento (deck) · extração simples · extração moderada.
   Vias: 1 = cabos 01+02 · 3 = cabos 03+04 · 5 = cabos 05+06. Vista do lançamento (olhando para -x), da esquerda p/ direita: 5 | 3 | 1.
   Equipe do lançamento: Pit (op. 4, o jogador), Lorrany (op. 5), Denilson (líder 2), Jhonatan (coordenador).
   Equipe do recebimento: Thaynara (op. 6), Weslley (op. 7), Renato (líder 3), Marcos (resgatista 8).
   ============================================================================================================ */
const VIAS = { 1: [0, 1], 3: [2, 3], 5: [4, 5] };
const Y = new Vector3(0, 1, 0), v1 = new Vector3(), v2 = new Vector3();
const LX = PORT.lanca;                                  // x do lançamento
const DECK_REC = NIVEL.DECK, DECK_LAN = NIVEL.CHAO + .35;
const clamp = MathUtils.clamp, lerp = MathUtils.lerp;
const ease = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

export function criarJogo3D({ ag, cam, renderer, pessoa3d, M, pele, equipe, lancamento, ceu, pit, T, lona, cen, trolleyModo }){
  const metal = mat(0x8a8f94, { metalness: .85, roughness: .3 }), amar = mat(0xe3b520, { roughness: .7 });
  const zVia = (v) => (PORT.zs[VIAS[v][0]] + PORT.zs[VIAS[v][1]]) / 2;
  const yVia = (v, x) => (cabY(VIAS[v][0], x) + cabY(VIAS[v][1], x)) / 2;
  const ZI = (PORT.zs[1] + PORT.zs[2]) / 2, yInter = (x) => (cabY(1, x) + cabY(2, x)) / 2;     // via intermediária 2 (cabos 02 e 03)

  /* ---------------------------------------------------------------- equipe */
  const pessoa = (nome, o) => pessoa3d(Object.assign({ nome, x: 0, y: 0, z: 0, yaw: 0, camisa: M(0x56642d), manga: M(0x56642d), calca: M(0x4a5729), pele: pele.media, capacete: M(0xe8731a, { roughness: .45, metalness: .1 }), cabelo: 0x1e140d, barba: false, oculos: true, pin: { barra: "#0a0a0a", pil: 1, mosq: "#ece3cf" } }, o));
  const renato = pessoa("RENATO", { pele: pele.parda, barba: true, pin: { barra: "#951c24", pil: 0, mosq: "#ece3cf" } });
  const marcos = pessoa("MARCOS", { pele: pele.media, capacete: M(0xc22b2b, { roughness: .45, metalness: .1 }), barba: true });
  /* Krig, o coordenador (laranja e verde, mosquetão azul) e Carlos, o líder (bottom vermelho com 1 grau, mosquetão branco): ficam no lançamento */
  const krig = pessoa("KRIG", { pele: pele.clara, barba: true, camisa: M(0xe8731a, { roughness: .7 }), manga: M(0x56642d), pin: { barra: "#e8731a", pil: 1, mosq: "#3b82e0" } });
  const carlos = pessoa("CARLOS", { pele: pele.parda, barba: false, capacete: M(0x4a5d2f, { roughness: .5 }), pin: { barra: "#951c24", pil: 1, mosq: "#ece3cf" } });
  /* lançamento: Krig (coord.), Carlos (líder), Denilson (op. 4), Lorrany (op. 5), Jhonatan.   recebimento: Pit, Thaynara, Weslley, Renato (líder 3), Marcos (resgatista) */
  const op = { op4: equipe[3], op5: equipe[2], lider2: carlos, coord: krig, op8: equipe[4], op6: pit, op7: equipe[1], op9: equipe[0], lider3: renato, resg: marcos };
  const filaP = [0, 1, 2].map(i => pessoa("", { pin: null, camisa: M([0xb04a2a, 0x2a7ab0, 0x7a2ab0][i]), manga: M([0xb04a2a, 0x2a7ab0, 0x7a2ab0][i]), calca: M(0x3a3d44), capacete: M(0xf2f6ff, { roughness: .4 }), pele: [pele.clara, pele.parda, pele.media][i] }));
  filaP.forEach(p => { p.nome.visible = false; });

  /* ---------------------------------------------------------------- cliente: capacete, touca, óculos, colete, cinta, cadeirinha, cinto paraquedista, pacote mídia */
  const capCli = M(0xf2f6ff, { roughness: .4 });
  const cliente = pessoa("", { pin: null, camisa: M(0x2f6fb5), manga: M(0x2f6fb5), calca: M(0x3a3d44), pele: pele.clara, capacete: capCli, cabelo: 0x3a2a1c });
  cliente.nome.visible = false;
  const av = cliente.av;
  /* cadeirinha ZipRider (vídeos): assento-bolsa preto com faixa vermelha e argola em D, encosto em Y com alças largas, ombreiras; ela vai sentada, o cliente preso por várias fitas */
  const criaZip = () => cadeirinhaZip(metal);
  const grp = () => { const g = new Group(); av.add(g); return g; };
  const gParaq = grp(), gColete = grp(), gCinta = grp(), gSeat = grp();
  [-.5, .72].forEach(x => { const t = new Mesh(new TorusGeometry(.52, .075, 8, 18), amar); t.rotation.x = Math.PI / 2; t.position.set(x, 1.95, .05); gParaq.add(t); });
  [-1, 1].forEach(sx => { const f = new Mesh(new BoxGeometry(.12, 2.1, .06), mat(0x222428)); f.position.set(sx * .45, 3.4, .86); f.rotation.z = sx * -.22; gParaq.add(f); const d = new Mesh(new BoxGeometry(.12, 2.0, .06), mat(0x222428)); d.position.set(sx * .4, 3.4, -.84); d.rotation.z = sx * .2; gParaq.add(d); });
  [-1, 1].forEach(sx => { const f = new Mesh(new BoxGeometry(.2, 1.9, .07), mat(0xe0742a)); f.position.set(sx * .62, 3.35, .9); f.rotation.z = sx * .08; gColete.add(f); });
  { const c = new Mesh(new TorusGeometry(1.0, .1, 8, 24), amar); c.rotation.x = Math.PI / 2; c.position.set(0, 2.6, 0); c.scale.set(1, .8, 1); gCinta.add(c); }
  gSeat.add(criaZip());
  { const nuca = new Mesh(new SphereGeometry(1.0, 20, 12, 0, Math.PI * 2, 0, Math.PI * .42), mat(0x15161a, { roughness: .95 })); nuca.position.set(0, .12, 0); cliente.cab.add(nuca); cliente.touca = nuca; }
  cliente.bD.rock.visible = false;
  const bastao = camera360({ escala: 1.0, comprimento: 1.5 }); bastao.rotation.set(.25, 0, 0); bastao.position.set(0, -.05, .05); cliente.bE.mao.add(bastao);
  { const cordao = new Mesh(new CylinderGeometry(.025, .025, .9, 6), mat(0xe0b020)); cordao.position.set(.5, 3.7, -.85); cordao.rotation.z = .3; av.add(cordao); const an = new Mesh(new TorusGeometry(.13, .035, 8, 12), metal); an.position.set(.4, 4.15, -.8); av.add(an); }
  const epiTodo = { capacete: true, touca: true, oculos: true, harness: true, colete: true, cinta: true, seat: true };
  const epi = (e) => { cliente.capG.visible = !!e.capacete; cliente.touca.visible = !!e.touca; cliente.ocG.visible = !!e.oculos; gParaq.visible = !!e.harness; gColete.visible = !!e.colete; gCinta.visible = !!e.cinta; gSeat.visible = !!e.seat; };
  epi(epiTodo);

  /* roldana (duas rodas, uma em cada cabo da via) e as cordas que a ligam à cadeirinha */
  const roldana = new Group(); ag.add(roldana);
  const larg = Math.abs(PORT.zs[1] - PORT.zs[0]);
  [-1, 1].forEach(s => { const r = new Mesh(new CylinderGeometry(.34, .34, .22, 18), metal); r.rotation.x = Math.PI / 2; r.position.set(0, .35, s * larg / 2); roldana.add(r);
    const pl = new Mesh(new BoxGeometry(.9, .8, .09), mat(0x2d4a7a, { metalness: .5, roughness: .45 })); pl.position.set(0, 0, s * (larg / 2 + .14)); roldana.add(pl); });
  { const barra = new Mesh(new BoxGeometry(.5, .3, larg + .5), mat(0x2d4a7a, { metalness: .5, roughness: .45 })); barra.position.y = -.35; roldana.add(barra);
    const olhal = new Mesh(new TorusGeometry(.2, .05, 8, 16), metal); olhal.position.y = -.65; roldana.add(olhal); }
  const corda = (cor, r = .05) => { const o = new Mesh(new CylinderGeometry(r, r, 1, 6), mat(cor, { roughness: .8 })); ag.add(o); o.visible = false; return o; };
  const fitas = [corda(0x17181c, .14), corda(0x17181c, .14)];                       // alças pretas da cadeirinha até a roldana
  const cadeiraVazia = criaZip(); ag.add(cadeiraVazia); cadeiraVazia.visible = false;
  const cordasR = [corda(0xf1efe8), corda(0xc22b2b)];            // cadeirinha → roldana
  const cordasS = [corda(0xf1efe8, .06), corda(0xc22b2b, .06)];  // chão → cadeirinha (recebimento)
  const liga = (o, a, b) => { v1.copy(b).sub(a); const L = Math.max(.001, v1.length()); o.position.copy(a).addScaledVector(v1, .5); o.scale.set(1, L, 1); o.quaternion.setFromUnitVectors(Y, v1.normalize()); o.visible = true; };

  /* polia de extração (simples) e polia do resgatista (moderada) */
  const polia = new Group(); ag.add(polia);
  { const c = new Mesh(new BoxGeometry(.9, .8, .4), mat(0x121316, { roughness: .55, metalness: .5 })); polia.add(c); const m1 = new Mesh(new TorusGeometry(.17, .03, 8, 16), metal); m1.position.y = -.55; polia.add(m1); polia.visible = false; }
  const cordaPolia = corda(0x7fe0ff, .06);
  const escada = escadaAluminio(ag, 0, 0, 0); escada.visible = false;
  const alvoMarca = new Mesh(new TorusGeometry(.9, .06, 8, 24), mat(0xff7a00)); alvoMarca.rotation.x = Math.PI / 2; ag.add(alvoMarca); alvoMarca.visible = false;

  /* modo mundo (missões): as cenas animam os atores no cenário vivo sem trocar clima nem câmera; `acumula` deixa várias cenas (lançamento + recebimento) somarem atores no mesmo quadro */
  const MODO = { mundo: false, acumula: false };
  const clima = (c) => { if(cen && !MODO.mundo) cen.clima(c); };
  const esc = () => { if(!MODO.acumula) escondeTodos(); };
  const thaynara = pessoa("THAYNARA", {}); thaynara.av.visible = false;                     // operadora 6 "reserva": ocupa o lugar do Pit quando o jogador está em outro ponto (missão 7)
  const todos = [pit, thaynara, ...equipe, renato, marcos, krig, carlos, cliente, ...filaP];
  const escondeTodos = () => { todos.forEach(p => { p.av.visible = false; }); roldana.visible = false; cordasR.concat(cordasS, fitas).forEach(c => { c.visible = false; }); cadeiraVazia.visible = false; polia.visible = false; cordaPolia.visible = false; escada.visible = false; alvoMarca.visible = false; };

  /* ---------------------------------------------------------------- poses e caminhada */
  const POSE = {
    idle: (p, t) => { p.bD.pv.rotation.set(.05, 0, -.12); p.bD.co.rotation.set(-.3, 0, 0); p.bE.pv.rotation.set(.05, 0, .12); p.bE.co.rotation.set(-.25, 0, 0); },
    radio: (p, t) => { p.bD.pv.rotation.set(-.3, 0, -.55); p.bD.co.rotation.set(0, 0, -2.4); p.bE.pv.rotation.set(.05, 0, .12); p.bE.co.rotation.set(-.25, 0, 0); },
    trabalho: (p, t) => { const s = Math.sin(t * 5) * .12; p.bD.pv.rotation.set(-1.15 + s, 0, -.2); p.bD.co.rotation.set(-.5, 0, 0); p.bE.pv.rotation.set(-1.15 - s, 0, .2); p.bE.co.rotation.set(-.5, 0, 0); },
    apontar: (p, t) => { p.bD.pv.rotation.set(-1.45, 0, -.12); p.bD.co.rotation.set(0, 0, 0); p.bE.pv.rotation.set(.05, 0, .12); p.bE.co.rotation.set(-.25, 0, 0); },
    cumprimento: (p, t) => { p.bD.pv.rotation.set(0, 0, -2.5); p.bD.co.rotation.set(0, 0, -.3 + Math.sin(t * 8) * .35); p.bE.pv.rotation.set(.05, 0, .12); p.bE.co.rotation.set(-.25, 0, 0); },
    pendurado: (p, t) => { p.bD.pv.rotation.set(0, 0, -2.75); p.bD.co.rotation.set(0, 0, 0); p.bE.pv.rotation.set(0, 0, 2.75); p.bE.co.rotation.set(0, 0, 0); },
    sentadoAgarra: (p, t) => { p.bD.pv.rotation.set(0, 0, -2.7); p.bD.co.rotation.set(0, 0, -.2); p.bE.pv.rotation.set(0, 0, 2.7); p.bE.co.rotation.set(0, 0, .2); },
    sentado: (p, t) => { const b = Math.sin(t * 1.7) * .06; p.bD.pv.rotation.set(0, 0, -1.55 + b); p.bD.co.rotation.set(0, 0, 0); p.bE.pv.rotation.set(-1.1, 0, .35); p.bE.co.rotation.set(-1.0, 0, 0); },
    comemora: (p, t) => { const w = Math.sin(t * 7) * .22; p.bD.pv.rotation.set(0, 0, -2.9 + w); p.bD.co.rotation.set(0, 0, -.1 + w * .5); p.bE.pv.rotation.set(0, 0, 2.9 - w); p.bE.co.rotation.set(0, 0, .1 - w * .5); },
    suspenso: (p, t) => { p.bD.pv.rotation.set(0, 0, -2.8); p.bD.co.rotation.set(0, 0, 0); p.bE.pv.rotation.set(0, 0, 2.8); p.bE.co.rotation.set(0, 0, 0); }
  };
  const estadoAtor = new Map();
  const ator = (p, x, y, z, yaw, pose = "idle", opcoes = {}) => {
    const s = estadoAtor.get(p) || { x, z, fase: Math.random() * 6, ult: pose };
    s.alvo = { x, y, z, yaw }; s.pose = pose; s.suspenso = !!opcoes.suspenso; s.snap = opcoes.snap; estadoAtor.set(p, s);
    p.av.visible = true; if(s.primeiro === undefined || opcoes.snap){ p.av.position.set(x, y, z); p.av.rotation.y = yaw; s.x = x; s.z = z; s.primeiro = false; }
  };
  const andaVis = (p, anda) => { p.pernasA.grupo.visible = anda; p.estat.forEach(o => { o.visible = !anda; }); };
  function animaAtores(dt, t){
    estadoAtor.forEach((s, p) => {
      if(!p.av.visible) return;
      const a = s.alvo; if(s.suspenso){ p.av.position.set(a.x, a.y, a.z); p.av.rotation.y = a.yaw; return; }
      /* os atores deslizam até a posição pedida (a cena manda, o ator anda) */
      const dx = a.x - p.av.position.x, dz = a.z - p.av.position.z, d = Math.hypot(dx, dz);
      const k = d > 40 ? 1 : Math.min(1, dt * 9);
      p.av.position.x += dx * k; p.av.position.z += dz * k; p.av.position.y += (a.y - p.av.position.y) * Math.min(1, dt * 12);
      let dyaw = a.yaw - p.av.rotation.y; while(dyaw > Math.PI) dyaw -= 2 * Math.PI; while(dyaw < -Math.PI) dyaw += 2 * Math.PI; p.av.rotation.y += dyaw * Math.min(1, dt * 8);
      const vel = dt > 0 ? Math.hypot(p.av.position.x - s.x, p.av.position.z - s.z) / dt : 0; s.x = p.av.position.x; s.z = p.av.position.z;
      const anda = !s.suspenso && vel > 1.2 && d > .15 && d < 40;
      andaVis(p, anda);
      if(anda){
        s.fase += dt * (4 + vel * .9); const amp = clamp(vel / 6, .25, 1) * .55, f = s.fase;
        const [qD, qE] = p.pernasA.quadril, [jD, jE] = p.pernasA.joelho;
        qD.rotation.x = Math.sin(f) * amp; qE.rotation.x = -Math.sin(f) * amp; jD.rotation.x = Math.max(0, -Math.cos(f)) * amp * 1.5; jE.rotation.x = Math.max(0, Math.cos(f)) * amp * 1.5;
        const sw = Math.sin(f) * amp; p.bD.pv.rotation.set(sw * .9, 0, -.14); p.bE.pv.rotation.set(-sw * .9, 0, .14); p.bD.co.rotation.set(-.3, 0, 0); p.bE.co.rotation.set(-.3, 0, 0);
      } else (POSE[s.pose] || POSE.idle)(p, t);
      if(p.bD.rock) p.bD.rock.visible = false; p.bD.mao.children[0].scale.set(1.08, 1.08, 1.08);
      if(p.nome && p.nome.visible) p.nome.rotation.y = Math.atan2(cam.position.x - p.av.position.x, cam.position.z - p.av.position.z) - p.av.rotation.y;
    });
  }

  /* cliente pendurado na via (v) ou na via intermediária; devolve a posição de pés e dos dois pontos da cadeirinha */
  const PES = 6.4;
  const sentadoPose = (pose) => pose === "sentado" || pose === "sentadoAgarra" || pose === "comemora";
  function penduraCliente(x, z, yCabo, yaw, pose = "pendurado", t = 0, pyFixo){
    roldana.visible = true; roldana.position.set(x, yCabo, z);
    const sent = sentadoPose(pose), py = pyFixo !== undefined ? pyFixo : yCabo - (sent ? 4.7 : PES + .9);
    ator(cliente, x, py, z, yaw, pose, { suspenso: true, snap: true });
    cliente.av.position.set(x, py, z); cliente.av.rotation.y = yaw; andaVis(cliente, false); POSE[pose](cliente, t);
    cliente.pernasA.grupo.visible = sent; cliente.estat.forEach(o => { o.visible = !sent; });
    if(sent){ const [qD, qE] = cliente.pernasA.quadril, [jD, jE] = cliente.pernasA.joelho; qD.rotation.x = qE.rotation.x = -1.4; jD.rotation.x = .35 + Math.sin(t * 2) * .1; jE.rotation.x = .5 + Math.sin(t * 2 + 1) * .1; cliente.tronco.rotation.x = -.18; cliente.cab.rotation.x = -.12; }
    else { cliente.tronco.rotation.x = 0; cliente.cab.rotation.x = 0; }
    cliente.av.updateMatrixWorld(true);
    const A = cliente.av.localToWorld(new Vector3(-.98, 2.35, .3)), B = cliente.av.localToWorld(new Vector3(.98, 2.35, .3));      // argolas laterais do assento
    const SA = cliente.av.localToWorld(new Vector3(-.55, 4.1, -.62)), SB = cliente.av.localToWorld(new Vector3(.55, 4.1, -.62));  // topo do encosto
    liga(fitas[0], SA, new Vector3(x, yCabo - .3, z - larg / 2)); liga(fitas[1], SB, new Vector3(x, yCabo - .3, z + larg / 2));
    const E = cliente.av.localToWorld(new Vector3(0, 2.9, 1.0));
    liga(cordasR[0], E, new Vector3(x, yCabo - .5, z - larg / 2)); liga(cordasR[1], E, new Vector3(x, yCabo - .5, z + larg / 2));
    return { A, B, pes: py };
  }

  /* ---------------------------------------------------------------- câmera */
  const C = { p: new Vector3(0, 0, 0), a: new Vector3(), fov: 40, rapido: true, off: 0 };
  const camPara = (p, a, fov = 40, rapido = false, off = 0) => {
    if(MODO.mundo) return; C.p.set(p[0], p[1], p[2]); C.a.set(a[0], a[1], a[2]); C.fov = fov; if(rapido || C.rapido) C.snap = true; C.off = off; };
  const alvoAtual = new Vector3();
  function aplicaCamera(dt){
    if(MODO.mundo) return;
    const k = C.snap ? 1 : Math.min(1, dt * 3.2);
    cam.position.lerp(C.p, k); alvoAtual.lerp(C.a, k); C.snap = false; cam.lookAt(alvoAtual); if(ceu) ceu.position.set(cam.position.x, 0, cam.position.z);
    if(Math.abs(cam.fov - C.fov) > .05){ cam.fov = lerp(cam.fov, C.fov, k); }
    const w = renderer.domElement.clientWidth || 1, h = renderer.domElement.clientHeight || 1;
    cam.setViewOffset(w, h, 0, h * C.off, w, h); cam.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------------- cenas ---------------------------------------------------------------- */
  const ZMEIO = (PORT.zs[0] + PORT.zs[5]) / 2;                    // meio dos cabos 01–06
  const LP = LX + 6;                                  // primeira fila de pessoas no deck do lançamento (de frente para os cabos, olhando para -x)
  const lanFila = (n) => filaP.forEach((p, i) => { if(i < n) ator(p, LP + 4 + i * .9, DECK_LAN, -2 + i * 1.6, -Math.PI / 2 - .5, "idle"); });
  const equipeLancamento = (t, chk) => {
    const z = chk ? zVia(chk.via) : ZMEIO;
    ator(op.op4, LP, DECK_LAN, z - 5, -Math.PI / 2 - .9, chk && chk.pose === "trabalho" ? "trabalho" : "idle");
    ator(op.op5, LP, DECK_LAN, z + 5, -Math.PI / 2 + .8, "radio");
    ator(op.lider2, LP + 4, DECK_LAN, 4, -Math.PI / 2 + .3, "idle");
    ator(op.coord, LP + 4, DECK_LAN, 44, -Math.PI / 2 - .3, "radio");
    ator(op.op8, LP + 7, DECK_LAN, 30, -Math.PI / 2 - .2, "idle");
  };
  const camLancamento = (z = ZMEIO, d = -30, alt = -0.2) => camPara([LX - d, alt, z - 4], [LX - 90, -1.0, z], 46, false, .1);

  const API = {
    pronto: true,
    /* o menu: panorama do deck de lançamento */
    menu(t){
      clima("poente"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false; epi(epiTodo);
      equipeLancamento(t, null); lanFila(3);
      ator(cliente, LP + 2, DECK_LAN, ZMEIO - 6, -Math.PI / 2 + .3, "idle"); epi(epiTodo);
      const a = t * .06; camPara([LX + 30 + Math.sin(a) * 2, 0.5, ZMEIO - 8.5 + Math.cos(a) * 5], [LX - 70, -1.0, ZMEIO], 48, false, .08);
    },
    /* a plataforma e o checklist: cliente espera fora dos cabos e só se aproxima totalmente equipado */
    plataforma(o){
      clima("dia"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false;
      const chk = o.chk, via = chk ? chk.via : null, z = via ? zVia(via) : ZMEIO;
      equipeLancamento(o.t, chk); lanFila(o.fila || 0);
      if(o.cli){
        epi(o.equip || {}); capCli.color.set(o.cli.capaceteCor || "#F2F6FF"); av.scale.setScalar(.92 * (o.cli.escala || 1));
        const x = LP, zc = o.pronto && via ? z : 4;
        ator(cliente, x + (o.pronto ? 0 : 1.6), DECK_LAN, o.pronto ? z : zc, o.pronto ? -Math.PI / 2 : -Math.PI / 2 - .7, "idle");
        POSE.idle(cliente, o.t);
      }
      camLancamento(z);
    },
    /* a descida vista pela câmera 360 do bastão (pacote mídia): à frente do cliente, olhando para ele, grande-angular, cânion embaixo */
    descida(o){
      clima("dia"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false;
      const D = o.D, via = D.via, p = clamp(D.t / .86, 0, 1), x = lerp(LX + 3, D.xFim || 58, p), z = zVia(via), yC = yVia(via, x);
      capCli.color.set(D.cli.capaceteCor || "#F2F6FF"); av.scale.setScalar(.92 * (D.cli.escala || 1)); epi(epiTodo);
      const bal = Math.sin(o.t * 1.4) * .05, py = yC - 4.7;
      penduraCliente(x, z, yC, -Math.PI / 2 + bal, D.comemora ? "comemora" : "sentado", o.t);
      if(D.tras){ camPara([x + 9 + (D.recua || 0), py + 3.4 + Math.sin(o.t * .8) * .25, z + Math.sin(o.t * .6) * .8], [x - 14, py + 1.0, z], 62, !!D.corte, 0); return; }
      const u = D.uau || 0, ahead = 5.4 + u * .8 + Math.sin(o.t * 1.1) * .25, up = 3.6 + Math.sin(o.t * .9) * .3;
      camPara([x - ahead, py + up, z + Math.sin(o.t * .7) * .6], [x, py + 2.2, z], 100, true, 0);
    },
    /* o recebimento (23,6 s de roteiro): chega, freia nas molas, escada, dupla checagem, desequipagem e receptivo */
    recebimento(o){
      clima("poente"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false;
      const R = o.R, t = R.t, via = R.via, z = zVia(via), ch = R.cli;
      capCli.color.set(ch.capaceteCor || "#F2F6FF"); av.scale.setScalar(.92 * (ch.escala || 1));
      const XC = 14, repouso = XC - .32 * 30;
      let bx;
      if(R.t0 >= 3.8) bx = repouso;
      else if(t < 2.0) bx = lerp(90, XC, t / 2.0);
      else if(t < 2.9) bx = XC - R.maxComp * 30 * Math.sin(Math.PI / 2 * ((t - 2) / .9));
      else if(t < 3.8) bx = lerp(XC - R.maxComp * 30, repouso, ease((t - 2.9) / .9));
      else bx = repouso;
      R.comp = clamp((XC - bx) / 30, 0, 1);
      const yC = yVia(via, bx), pendurado = t < 12.8, pySent = DECK_REC + .45;
      /* equipamento que vai saindo na ordem do procedimento (a cadeirinha ZipRider fica na roldana quando o cliente se levanta) */
      epi({ capacete: t < 19.8, touca: t < 20.6, oculos: t < 21.4, harness: t < 22.2, colete: t < 11.2, cinta: t < 12.8, seat: t < 12.8 });
      const desce = ease((t - 12.8) / 2.0), anda = ease((t - 14.8) / 4.8);
      const pcs = cen && cen.tf ? cen.tf("casinha") : { fwd: (x, z) => [x, z] }, rq = pcs.fwd(-10.3, -1.3);
      const base = { x: repouso - 2.2, z: z - 1.2 }, recebe = { x: rq[0], z: rq[1] };
      let info;
      if(pendurado){ info = penduraCliente(bx, z, yC, -Math.PI / 2, t < 5.6 ? "sentado" : "sentadoAgarra", o.t, pySent); }
      else {
        const px = t < 14.8 ? lerp(bx, base.x, desce) : lerp(base.x, recebe.x, anda), pz = t < 14.8 ? lerp(z, base.z, desce) : lerp(base.z, recebe.z, anda);
        const py = t < 14.8 ? lerp(pySent, DECK_REC, desce) : DECK_REC, andando = t > 14.8 && t < 19.6;
        ator(cliente, px, py, pz, andando ? Math.atan2(recebe.x - px, recebe.z - pz) : (t > 23.6 ? Math.PI * .75 : -Math.PI / 2), t > 23.6 ? "cumprimento" : "idle", { snap: !andando && t < 14.8 });
        cliente.av.position.set(px, py, pz); cliente.tronco.rotation.x = 0; cliente.cab.rotation.x = 0;
        info = { A: new Vector3(px - .7, py + 3.2, pz), B: new Vector3(px + .7, py + 3.2, pz) };
        /* cadeirinha vazia: pendurada na roldana até o operador subir na escada e retirar; depois no chão ao lado da escada */
        if(t < 17.4){
          roldana.visible = true; roldana.position.set(bx, yC, z); cadeiraVazia.visible = true; cadeiraVazia.position.set(bx, pySent, z); cadeiraVazia.rotation.set(0, -Math.PI / 2, 0);
          liga(fitas[0], v2.set(bx, pySent + 4.1, z - .55), v1.set(bx, yC - .3, z - larg / 2)); liga(fitas[1], new Vector3(bx, pySent + 4.1, z + .55), new Vector3(bx, yC - .3, z + larg / 2));
        } else if(t < 22){ cadeiraVazia.visible = true; cadeiraVazia.position.set(base.x + 1.4, DECK_REC + .02, base.z - 2.2); cadeiraVazia.rotation.set(-Math.PI / 2 + .1, 0, 0.6); }
      }
      /* cordas do chão até a cadeirinha (a branca e a vermelha saem do mesmo ponto) */
      const gp = new Vector3(base.x + 3.2, DECK_REC + .1, z - 3.6);
      [[0, 6.4, info.A], [1, 7.2, info.B]].forEach(([i, ini, alvo]) => { if(t > ini && t < 12.8){ const k = ease((t - ini) / .6); liga(cordasS[i], gp, v2.copy(gp).lerp(alvo, k).clone()); } });
      R.ptPos3 = [info.A.clone(), info.B.clone()];
      /* escada (acompanha a altura dos pés do cliente) */
      if(t > 5.6 && t < 15.4){ escada.visible = true; escada.position.set(bx - 1.2, DECK_REC, z - 4.4); escada.rotation.y = 0; const h = clamp((pySent + 2.2 - DECK_REC) / 3.2, .7, 3.2); escada.scale.set(1, h, 1); }
      /* equipe do deck */
      const resp = R.espera === "dupla";
      ator(op.op6, t < 3.8 ? 6 : t < 5.6 ? lerp(6, base.x - 3.2, ease((t - 3.8) / 1.8)) : t < 17.4 ? base.x - 3.2 : t < 19.6 ? lerp(base.x - 3.2, -5, ease((t - 17.4) / 2.2)) : -5,
        DECK_REC, t < 3.8 ? z - 7 : t < 5.6 ? lerp(z - 7, base.z + 1.5, ease((t - 3.8) / 1.8)) : t < 17.4 ? base.z + 1.5 : t < 19.6 ? lerp(base.z + 1.5, 1.5, ease((t - 17.4) / 2.2)) : 1.5,
        t < 3.8 ? Math.PI * .2 : (t > 24 ? 0 : Math.PI / 2), t < 3.8 ? "radio" : (t > 24 ? "cumprimento" : (t > 15.2 && t < 17.4 ? "trabalho" : "idle")));
      const wq = pcs.fwd(-5.2, 3);
      ator(op.op9, t < 7 ? wq[0] : t < 8.6 ? lerp(wq[0], base.x + 3, ease((t - 7) / 1.6)) : base.x + 3, DECK_REC, t < 7 ? wq[1] : t < 8.6 ? lerp(wq[1], z - 1.2, ease((t - 7) / 1.6)) : z - 1.2, -Math.PI * .15, t > 24 ? "cumprimento" : (t > 12 && t < 14 ? "apontar" : "idle"));
      ator(op.op7, t < 6 ? 30 : t < 7.6 ? lerp(30, base.x + 1.5, ease((t - 6) / 1.6)) : base.x + 1.5, DECK_REC, t < 6 ? z - 9 : t < 7.6 ? lerp(z - 9, z + 3.6, ease((t - 6) / 1.6)) : z + 3.6, -Math.PI * .2, t > 7.6 && t < 12 ? "apontar" : (t > 24 ? "cumprimento" : "idle"));
      ator(op.lider3, 14, DECK_REC, 2, Math.PI / 2 - .6, t > 13 ? "apontar" : "radio");
      ator(op.resg, 22, DECK_REC, z - 5, -Math.PI / 2 + .6, "idle");
      camRec(o, bx, yC, z, t);
    },
    /* extração simples: cliente parado a 30 m das molas; polia de extração e corda vindas do deck */
    extSimples(o){
      clima("nublado"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false;
      const E = o.E, sc = E.sc, D = o.D, z = zVia(D.via), XC = 14, repouso = XC - .32 * 30, xFar = repouso + 88;
      const bx = lerp(xFar, repouso, sc.cli), yC = yVia(D.via, bx);
      capCli.color.set(D.cli.capaceteCor || "#F2F6FF"); av.scale.setScalar(.92 * (D.cli.escala || 1)); epi(epiTodo);
      penduraCliente(bx, z, yC, -Math.PI / 2);
      const trab = E.def.passos[E.i] && E.def.passos[E.i].tipo === "puxar";
      ator(op.resg, repouso + 4, DECK_REC, z - 3.5, Math.PI / 2, trab ? "trabalho" : "idle");
      ator(op.op6, repouso + 7.5, DECK_REC, z - 5.5, Math.PI / 2, trab && sc.cli > 0 ? "trabalho" : "idle");
      ator(op.op7, repouso + 11, DECK_REC, z - 3.4, Math.PI / 2, trab && sc.cli > 0 ? "trabalho" : "radio");
      ator(op.lider3, 14, DECK_REC, 2, Math.PI / 2 - .6, "radio");
      if(sc.pul0){ const px = lerp(repouso + 3, bx - 3, sc.cli > 0 ? 1 : sc.pul), py = yVia(D.via, px) + .1; polia.visible = true; polia.position.set(px, py, z); polia.rotation.y = 0;
        liga(cordaPolia, new Vector3(repouso + 3, DECK_REC + .2, z - 3.5), new Vector3(px, py - .7, z)); }
      if(sc.cli < .02){ alvoMarca.visible = true; alvoMarca.position.set(bx, yC + 1.4, z); }
      const mx = (bx + repouso) / 2;
      camPara([Math.max(bx, repouso) + 22, DECK_REC + 4.5, z - 32], [mx, yC - 3, z], 46, false, .12);
    },
    /* extração moderada: resgatista vai pela via intermediária até o cliente parado sobre o vão */
    extModerada(o){
      clima("nublado"); esc(); T.visible = true; if(trolleyModo) trolleyModo(true); lona.visible = false;
      const E = o.E, sc = E.sc, D = o.D, back = sc.back, zc = zVia(D.via), xCli = lerp(900, 24, back);
      const yC = yVia(D.via, xCli);
      capCli.color.set(D.cli.capaceteCor || "#F2F6FF"); av.scale.setScalar(.92 * (D.cli.escala || 1)); epi(epiTodo);
      penduraCliente(xCli, zc, yC, -Math.PI / 2);
      const noCabo = sc.res0 && (sc.res > 0 || back > 0), rx = sc.res0 ? lerp(10, xCli - 6, back > 0 ? 1 : sc.res) : 10;
      if(noCabo){ const ry = yInter(rx); polia.visible = true; polia.position.set(rx, ry, ZI); ator(op.resg, rx, ry - PES - .5, ZI, -Math.PI / 2, "suspenso", { suspenso: true, snap: true });
        op.resg.av.position.set(rx, ry - PES - .5, ZI); andaVis(op.resg, false); POSE.suspenso(op.resg, 0); }
      else ator(op.resg, 10, DECK_REC, ZI - 2, -Math.PI / 2, "idle");
      ator(op.lider3, 8, DECK_REC, ZI + 6, -Math.PI / 2, "radio"); ator(op.op6, 11, DECK_REC, ZI - 6, -Math.PI / 2, "idle");
      const xm = noCabo ? (rx + xCli) / 2 : xCli * .55, span = Math.max(30, Math.abs(xCli - (noCabo ? rx : 10)) + 26);
      camPara([xm + 12, yC - 10, zc - 24 - span * .55], [xm, yC - 5, zc], 52, false, .1);
    },
    /* equipe do recebimento esperando o cliente (missão 7, vista do lançamento) */
    recebimentoEspera(via = 3){
      const z = zVia(via), pcs = cen && cen.tf ? cen.tf("casinha") : { fwd: (x, zz) => [x, zz] }, wq = pcs.fwd(-5.2, 3);
      ator(op.op6, 6, DECK_REC, z - 7, Math.PI * .2, "radio"); ator(op.op9, wq[0], DECK_REC, wq[1], -Math.PI * .15, "idle"); ator(op.op7, 30, DECK_REC, z - 9, -Math.PI * .2, "idle");
      ator(op.lider3, 14, DECK_REC, 2, Math.PI / 2 - .6, "radio"); ator(op.resg, 22, DECK_REC, z - 5, -Math.PI / 2 + .6, "idle");
    },
    fim(t){ API.menu(t); },
    /* projeção 3D → coordenadas lógicas do jogo (para botões e áreas de toque acima da cena) */
    proj(x, y, z, S, OY){ v1.set(x, y, z).project(cam); const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight; return { x: (v1.x * .5 + .5) * w / S, y: (-v1.y * .5 + .5) * h / S - OY, ok: v1.z < 1 }; },
    viaZ: zVia, lanX: LX,
    quadro(dt, t){ animaAtores(dt, t); aplicaCamera(dt); },
    rotulos(){ todos.forEach(p => { if(p.av.visible && p.nome && p.nome.visible) p.nome.rotation.y = Math.atan2(cam.position.x - p.av.position.x, cam.position.z - p.av.position.z) - p.av.rotation.y; }); },
    atores: op, cliente, roldana, epi, escondeTodos
  };
  function camRec(o, bx, yC, z, t){
    if(t < 14.8){ const chega = t < 3.8; camPara([chega ? bx + 14 : bx + 6, DECK_REC + (chega ? 6 : 9), z + 17], [chega ? bx - 4 : bx - 1, DECK_REC + (chega ? 6 : 3.4), z - (chega ? 0 : 1)], chega ? 52 : 44, false, .12); }
    else if(t < 19.6){ const k = ease((t - 14.8) / 4.8); camPara([lerp(bx + 4, 10, k), DECK_REC + 4.2, lerp(z + 12, 16, k)], [lerp(bx - 1, -8, k), DECK_REC + 3.2, lerp(z - 1, 0, k)], 46, false, .12); }
    else camPara([10, DECK_REC + 4.5, 16], [-8, DECK_REC + 3.4, 0], 46, false, .12);
  }

  /* cenas de teste ("fotos") */
  API.cenasTeste = {
    plataforma: () => API.plataforma({ t: 1, chk: { via: 3, pose: "trabalho" }, cli: { capaceteCor: "#4DA3FF", escala: 1 }, equip: { capacete: true, touca: true, oculos: true, harness: true, colete: true, cinta: true, seat: true }, pronto: true, fila: 3 }),
    menu: () => API.menu(2),
    descida: () => API.descida({ t: 1, D: { via: 3, t: .35, uau: .7, cli: { capaceteCor: "#7CE0C3", escala: 1 } } }),
    recebimento: () => API.recebimento({ R: { t: 9, t0: 0, via: 3, cli: { capaceteCor: "#FFE066", escala: 1 }, maxComp: .6, espera: null } }),
    recebimento3: () => API.recebimento({ R: { t: 14, t0: 0, via: 3, cli: { capaceteCor: "#FFE066", escala: 1 }, maxComp: .6, espera: null } }),
    recebimento2: () => API.recebimento({ R: { t: 17, t0: 0, via: 3, cli: { capaceteCor: "#FFE066", escala: 1 }, maxComp: .6, espera: null } }),
    extSimples: () => API.extSimples({ E: { sc: { pul0: true, pul: .5, cli: 0 }, def: { passos: [{ tipo: "puxar" }] }, i: 0 }, D: { via: 3, cli: { capaceteCor: "#F2F6FF", escala: 1 } } }),
    extModerada: () => API.extModerada({ E: { sc: { res0: true, res: .6, back: 0 } }, D: { via: 3, cli: { capaceteCor: "#F2F6FF", escala: 1 } } })
  };
  alvoAtual.set(LX - 70, 0, ZMEIO);
  /* fora do jogo (cenário/editor): equipe do recebimento junto ao deck, equipe do lançamento no deck do outro lado */
  escondeTodos();
  const FIXOS = [[renato, 14, DECK_REC, 2, Math.PI / 2 - .6, "Renato"], [marcos, 22, DECK_REC, 20, -Math.PI / 2 + .6, "Marcos"], [krig, LP + 4, DECK_LAN, 44, -Math.PI / 2 - .3, "Krig"], [carlos, LP + 4, DECK_LAN, 4, -Math.PI / 2 + .3, "Carlos"]];
  const POS0 = new Map();
  const fixo = (p, x, y, z, yaw, rotulo) => { p.av.visible = true; p.av.position.set(x, y, z); p.av.rotation.y = yaw; if(cen && cen.pecas && rotulo) cen.pecas.push({ id: "pessoa-" + rotulo.toLowerCase(), nome: rotulo, obj: p.av }); };
  FIXOS.forEach(f => fixo(...f));
  [equipe[0], equipe[1], equipe[2], equipe[3], equipe[4]].forEach(p => { if(p) p.av.visible = true; });
  /* guarda o lugar atual de cada ator (inclusive o que o editor do cenário moveu) antes de uma cena de missão mexer neles */
  API.salvaMundo = () => { MODO.vis0 = { T: T.visible, lona: lona.visible }; POS0.clear(); [equipe[0], equipe[1], equipe[2], equipe[3], equipe[4], renato, marcos, krig, carlos].forEach(p => { if(p) POS0.set(p, { x: p.av.position.x, y: p.av.position.y, z: p.av.position.z, r: p.av.rotation.y }); }); };
  /* depois de uma cena de missão: tudo volta ao lugar do cenário (os atores voltam à pose parada) */
  API.restauraMundo = () => {
    estadoAtor.clear(); escondeTodos(); if(MODO.vis0){ T.visible = MODO.vis0.T; lona.visible = MODO.vis0.lona; }
    POS0.forEach((q, p) => { p.av.visible = true; p.av.position.set(q.x, q.y, q.z); p.av.rotation.y = q.r; andaVis(p, false); POSE.idle(p, 0); p.tronco.rotation.set(0, 0, 0); p.cab.rotation.x = 0; });
    cliente.av.visible = false; thaynara.av.visible = false; epi(epiTodo); av.scale.setScalar(.92);
  };
  API.modo = MODO; API.camPara = camPara; API.atoresQuadro = animaAtores; API.thaynara = thaynara; API.pose = POSE; API.escondeAgora = escondeTodos;
  API.papelOp6 = (rig) => { op.op6 = rig || pit; };
  return API;
}
