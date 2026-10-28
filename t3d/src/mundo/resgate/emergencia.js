import { Mesh, BoxGeometry, MeshStandardMaterial, Group, BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, Points, PointsMaterial } from "three";
import { U, EMERGENCIA as C, PARQUE, GAME_TIME_CONFIG } from "../config.js";
import * as F from "../gente/falas.js";
import { criarQuad, criarAmb } from "./veiculo.js";
import { criarMaca } from "./maca.js";
import { criarNav } from "./nav.js";
import { radio as somRadio, buzina } from "./som.js";

/* ============================================================================================================
   BOMBEIRO CIVIL + EQUIPE DE RESGATE + AMBULÂNCIA + EMERGÊNCIA DAS 10H
   Roteiro (tempos em s reais, ver config.js › EMERGENCIA):
     ocioso → queda (9:50, torção do pé no mirante) → saida (chamado no rádio, capacete, quadriciclo) → sobe (quadriciclo pela trilha; desvia de gente pelo campo)
     → atende (exame, tala, gelo, chama a equipe) · equipe sobe a pé (3 correndo na frente, 2 com a maca vazia) → embarque na maca → desce (comboio MUITO lento: quadriciclo
     na frente, 4 carregando, o 5º consolando; desvia só de serpentes) → carga (ambulância) → fora (a ambulância segue pela estrada; volta 1 h de jogo depois) → ocioso.
   Fim do expediente: o bombeiro só vai embora depois que o último visitante sair (mesmo passando das 18h).
   Tudo que é pessoa vem do pool de gente (instanciado); veículos e maca são malhas únicas.
   ============================================================================================================ */

const rnd = (a, b) => a + Math.random() * (b - a), pick = (L) => L[Math.floor(Math.random() * L.length)], cl = (v, a, b) => Math.max(a, Math.min(b, v));
const ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };

const DEF_BOMB = { id: "bombeiro", nome: "Rafael Moreira", esc: 1.05, pele: 0xd9a37a, cabelo: 0x2a1c12 };
const DEF_EQ = [
  { id: "carla", nome: "Carla Brandão", f: true, tag: "enf", pele: 0xe6b996, cabelo: 0x3a2412, esc: .95 },
  { id: "diego", nome: "Diego Salvador", tag: "resg", pele: 0xa8714a, cabelo: 0x1a1410, esc: 1.07 },
  { id: "marta", nome: "Marta Quevedo", f: true, tag: "enf", pele: 0x8a5a3a, cabelo: 0x120c08, esc: .93 },
  { id: "paulo", nome: "Paulo Werner", tag: "resg", pele: 0xf1c9a5, cabelo: 0x6a4a2a, esc: 1.0 },
  { id: "ines", nome: "Inês Padilha", f: true, tag: "resg", pele: 0xc68a5e, cabelo: 0x1a1410, esc: .97 }
];
const RAPIDOS = [0, 3, 4], MACA2 = [1, 2], CONSOLA = 0;                       // quem corre na frente · quem leva a maca vazia · quem consola na descida
const TEMAS = [["seg", "Segurança na trilha"], ["acid", "O que fazer em caso de acidente"], ["torc", "Torção: primeiros socorros"], ["num", "Números de emergência"], ["equip", "O quadriciclo e o resgate"], ["tchau", "Tchau"]];
const RESP = {
  seg: "Calçado fechado, água, atenção no chão e nada de sair da trilha: a maioria dos acidentes aqui é torção de pé em pedra solta ou degrau molhado. Avise alguém do roteiro e volte antes de escurecer.",
  acid: "Primeiro, mantenha a calma e não mova quem se machucou sem necessidade. Chame ajuda, 193 ou o rádio do parque, diga onde está (trilha e mirante) e o que aconteceu. Fique com a vítima e não ofereça comida nem remédio.",
  torc: "Torceu o pé? Repouso, gelo envolvido num pano por uns 20 minutos, imobilização leve com bandagem e o pé elevado. Não force o apoio. Se inchar muito ou não conseguir pisar, procure atendimento: pode ser fratura.",
  num: "193 é o Corpo de Bombeiros e 192 é a ambulância (SAMU). Dentro do parque, o rádio da equipe e a portaria também chamam o resgate. Diga sempre o local da trilha e quantas pessoas estão feridas.",
  equip: "O quadriciclo me leva até o mirante em minutos, com a caixa de primeiros socorros. A equipe de resgate sobe a pé com a maca, e a ambulância espera aqui no estacionamento: ela nunca entra na trilha."
};

export function criarResgate(M){
  const { cen, ciclo } = M, G = M.gente, E0 = cen.estac, TM = G.PATHS[0], am = G.amostra, PKW = E0.PKW;
  const nav = criarNav(M), quad = criarQuad(M), amb = criarAmb(M), maca = criarMaca(), estrada = M.estrada;
  cen.grupo.add(maca.obj); maca.obj.visible = false;
  const chao = (x, z) => cen.chao(x, z, 1e9);
  /* lugares fixos no estacionamento (coordenadas locais do pátio) */
  const casa = { amb: PKW(-78, -34), ambYaw: E0.PKR + Math.PI + .1, quad: PKW(-60, -28), quadYaw: E0.PKR + Math.PI / 2, bomb: PKW(-62, -20), maca: PKW(-90, -22),
    equipe: [PKW(-74, -14), PKW(-69, -12), PKW(-80, -13), PKW(-85, -17), PKW(-71, -19)] };
  /* percurso no pátio até o início da trilha (evita o piquenique, o banheiro e o contêiner) */
  const patio = () => [PKW(-50, -36), PKW(60, -36), PKW(100, -36), PKW(110, -14)];
  const rotaAmb = () => { const e = estrada.pts, ini = casa.amb, L = [ini, PKW(-96, -30)]; L.push(...e.filter((p, i) => i > 0 || Math.hypot(p[0] - L[1][0], p[1] - L[1][1]) > 30 * U)); const r = montaRota(L); r.len = Math.min(r.len, C.ambulancia.rotaM * U); return r; };   // a ambulância some ao sair do mapa (rotaM)
  function montaRota(L){ const cum = [0]; for(let i = 1; i < L.length; i++) cum.push(cum[i - 1] + Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1])); const len = cum[cum.length - 1];
    const amostra = (s) => { s = cl(s, 0, len); let i = 0; while(i < L.length - 2 && cum[i + 1] < s) i++; const a = L[i], b = L[i + 1], l = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / l; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l }; };
    return { pts: L, len, amostra }; }
  const reverte = (r) => ({ pts: r.pts.slice().reverse(), len: r.len, amostra: (s) => { const q = r.amostra(r.len - s); return { x: q.x, z: q.z, tx: -q.tx, tz: -q.tz }; } });

  const S = { turno: "fora", fase: "ocioso", t: 0, B: null, eq: [], vit: null, acomp: [], hotB: null, tempo: 0, tIdle: 0, clockAntes: null, ambFora: false, ambSaidaAbs: 0, depurar: false, obs: 0, conquistou: false, ultCede: 0, ultFala: 0, snakeAvisada: new Set() };
  const C2 = { sub: 0, tsub: 0, qs: 0, qi: 0, latQ: 0, latC: 0, sC: 0, vC: 0, fase: 0, parou: 0, descansou: false, descansando: 0, gap: 8, rota: null, latPlan: 0, wp: 0, falaT: 0, vitFalaT: 0, equipePronta: [false, false, false, false, false], macaPos: null, macaChegou: false, rapidosChegaram: false, ambSt: { s: 0 }, ambRota: null, ambFase: 0, ambT: 0 };
  const pontosDebug = [];                                                                 // rota do quadriciclo (últimos pontos-alvo) para a visualização F3
  const diz = (P, txt, dur = 4.4, dist = 16) => { if(P && P.ativo && !P.oculto){ G.fala(P, txt, dur, dist * U); } };
  const agora = () => ciclo.diaJogo() * 24 + ciclo.estado.h;
  const aviso = (t) => { if(M.ctx) M.ctx.mostraAviso(t); };
  const radio = (P, txt, dur = 5, dist = 18) => { diz(P, txt, dur, dist); const J = M.jogador(); somRadio(J ? Math.hypot(P.x - J.x, P.z - J.z) / U : 40); };

  /* ---------- aparência ---------- */
  function veste(P, d, tipo){
    P.role = "staff"; P.esc = d.esc; const rm = tipo === "bomb";
    P.cor = { pele: d.pele, cabelo: d.cabelo, camisa: rm ? 0xc8161d : 0x1b2a4a, manga: rm ? 0xc8161d : 0x1b2a4a, calca: rm ? 0xb81419 : 0x1b2a4a, bota: 0x131316, luva: rm ? 0x1a1a1c : 0xe6e6e6, chapeu: rm ? 0xb01820 : 0x1b2a4a, mochila: rm ? 0xa81820 : 0x1d2d4d, capacete: 0xc0141a, garrafa: 0x777777, bastao: 0 };
    P.acess = { cabelo: true, rabo: !!d.f, chapeu: rm ? 2 : (d.f ? 2 : 0), mochila: true, garrafa: false, radio: true, faixas: true, tag: tipo, listra: rm ? 0 : 0xe8731a, capacete: false, colete: false, bastao: false, logoCostas: false, logoPeito: false };
  }
  function criaPessoas(){
    const B = G.alocaStaff(); if(!B) return false; veste(B, DEF_BOMB, "bomb"); B.nomeStaff = DEF_BOMB.nome;
    B.dialogoDef = { nome: DEF_BOMB.nome, funcao: "Bombeiro civil · brigada do parque", rodape: " · Parque Nacional da Serra Geral", saudacao: "Boa! Aqui é o bombeiro civil do parque. Posso ajudar em alguma coisa?", temas: TEMAS, resposta: (id) => RESP[id], tchau: pick(["Boa trilha, e cuidado onde pisa!", "Qualquer coisa, é só chamar. Boa visita!", "Tchau! Água e calçado fechado, hein?"]) };
    B.hotspot = { id: "bombeiro-civil", x: B.x, z: B.z, r: 3.4 * U, rotulo: () => "Conversar com o bombeiro civil", acao: () => { if(S.fase !== "ocioso" || S.turno === "saindo"){ diz(B, pick(F.EMERG.bombeiroNao), 3.6, 14); return; } G.abreDialogo(B); } }; cen.hotspots.push(B.hotspot);
    S.B = B; S.eq = [];
    DEF_EQ.forEach((d, i) => { const P = G.alocaStaff(); if(!P) return; veste(P, d, d.tag); P.nomeStaff = d.nome; P.slot = i; S.eq.push(P);
      P.hotspot = { id: "resgate-" + d.id, x: P.x, z: P.z, r: 3 * U, rotulo: () => "Falar com " + d.nome.split(" ")[0], acao: () => diz(P, S.fase !== "ocioso" ? pick(F.EMERG.bombeiroNao) : pick(["Tudo certo por aqui. Em emergência, 192 ou o rádio do parque.", "Estamos de prontidão com a maca e a ambulância.", "Ambulância aqui no pátio, mas nunca entra na trilha: a gente sobe a pé."]), 4, 14) }; cen.hotspots.push(P.hotspot); });
    return true;
  }
  function liberaPessoas(){ [S.B, ...S.eq, S.vit, ...S.acomp].forEach(P => { if(P) G.liberaStaff(P); }); S.B = null; S.eq = []; S.vit = null; S.acomp = []; }
  const muda = (P, x, z, yaw, modo = "idle") => { P.x = x; P.z = z; P.y = chao(x, z); P.yaw = yaw; P.modo = modo; P.vel = 0; P.oculto = false; P.tModo = rnd(3, 8); };
  function colocaCasa(){
    muda(S.B, ...casa.bomb, casa.quadYaw + Math.PI * .7); S.eq.forEach((P, i) => { const [x, z] = casa.equipe[i]; muda(P, x, z, Math.atan2(casa.equipe[(i + 1) % 5][0] - x, casa.equipe[(i + 1) % 5][1] - z)); });
    quad.colocar(casa.quad[0], casa.quad[1], casa.quadYaw); quad.mostra(true); quad.liga(false); quad.luzes(false); quad.giroflex(false); quad.capacete(false);
    amb.colocar(casa.amb[0], casa.amb[1], casa.ambYaw); amb.mostra(true); amb.giro(false); amb.sirene(false); amb.portas(false);
    maca.obj.visible = true; maca.obj.position.set(casa.maca[0], chao(casa.maca[0], casa.maca[1]) + .1 * U, casa.maca[1]); maca.obj.rotation.set(0, casa.quadYaw + .5, 0); maca.cintos.visible = false;
  }
  /* ---------- locomoção ---------- */
  function anda(P, x, z, v, dt, modo = "anda"){
    const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if(d < .15 * U){ P.vel = 0; return 0; }
    const vu = v * U, passo = Math.min(d, vu * dt); P.yaw += ang(Math.atan2(dx, dz) - P.yaw) * Math.min(1, dt * 8); P.x += dx / d * passo; P.z += dz / d * passo; P.vel = passo / Math.max(dt, 1e-3); P.modo = modo; P.fase += dt * (3 + v * 2.6); P.y = chao(P.x, P.z); return d - passo;
  }
  const trilhaXZ = (s, lat) => { const q = am(TM, s); return [q.x - q.tz * lat, q.z + q.tx * lat, q]; };
  function andaTrilha(P, s, lat, v, dt, dir = 1, modo = "anda"){ const [x, z] = trilhaXZ(s, lat); return anda(P, x, z, v, dt, modo); }
  const fica = (P, modo, olhaX, olhaZ) => { P.vel = 0; if(P.modo !== modo){ P.modo = modo; } if(olhaX !== undefined) P.yaw += ang(Math.atan2(olhaX - P.x, olhaZ - P.z) - P.yaw) * .25; };
  function capacete(P, on){ P.acess.capacete = on; P.acess.chapeu = on ? 0 : (P === S.B ? 2 : P.acess.chapeu); }

  /* ---------- planejamento do quadriciclo / comboio na trilha ---------- */
  function atualizaDebug(x, z){ pontosDebug.push([x, z]); if(pontosDebug.length > 80) pontosDebug.shift(); }
  const dirigeTrilha = (dt, o) => {
    const J = M.jogador(), pr = nav.proj(TM, quad.x, quad.z, C2.qi); C2.qi = pr.i; C2.qs = pr.s; C2.latQ = pr.lat; const dir = o.dir || 1;
    const obst = nav.obstaculos(TM, am, pr.i, { x: quad.x, z: quad.z }, { pessoas: o.pessoas, serpentes: o.serpentes, animais: o.animais, folgaPessoas: C.quad.folgaPessoas, folgaSerpente: C.serpente.folga, folgaAnimal: 16 }, 90 * U);
    const plano = nav.planeja(TM, am, pr.s, dir, C2.latPlan, obst, { adiante: Math.max(C.quad.detecta ? 0 : 0, C.quad.detectaPessoas) });
    C2.latPlan += cl(plano.lat - C2.latPlan, -2.6 * U * dt, 2.6 * U * dt);
    let vAlvo = o.vMax; const perto = obst.some(b => (dir > 0 ? b.s > pr.s && b.s < pr.s + 40 * U : b.s < pr.s && b.s > pr.s - 40 * U) && Math.abs(b.lat - C2.latQ) < 9 * U);
    if(!plano.ok){ vAlvo = o.pessoasAguarda ? 0 : C.quad.velCaminhada; if(plano.motivo === "pessoa" && S.tempo - S.ultBuz > 5){ S.ultBuz = S.tempo; buzina(J ? Math.hypot(quad.x - J.x, quad.z - J.z) / U : 30); } if(plano.motivo === "serpente" || plano.motivo === "animal") vAlvo = 0; }
    else if(plano.desvio || perto) vAlvo = Math.min(vAlvo, C.quad.velDesvio);
    const look = (6 + quad.v * .6) * U, q = am(TM, pr.s + dir * look), x = q.x - q.tz * C2.latPlan, z = q.z + q.tx * C2.latPlan;
    const yawAlvo = Math.atan2(x - quad.x, z - quad.z); atualizaDebug(x, z);
    quad.S.campo = Math.abs(C2.latQ) > nav.TL * 1.1; quad.S.terra = true; quad.tick(dt, { vAlvo, yawAlvo }, J);
    return { s: pr.s, plano, perto };
  };
  /* segue os pontos [x,z] no pátio (sem desvio por pessoas; pátio livre) */
  function dirigeWP(dt, pts, i, vAlvo){
    const J = M.jogador(), [x, z] = pts[i], d = Math.hypot(x - quad.x, z - quad.z); const yawAlvo = Math.atan2(x - quad.x, z - quad.z);
    quad.S.campo = false; quad.tick(dt, { vAlvo: d < 6 * U && i === pts.length - 1 ? 0 : vAlvo, yawAlvo }, J); return d;
  }
  function pilota(P){ const [x, y, z] = quad.assento(); P.x = x; P.z = z; P.y = y - .7 * P.esc; P.yaw = quad.yaw; P.modo = "pilota"; P.vel = 0; }
  function cedePessoas(x, z, r = 26){ if(S.tempo - S.ultCede > .7){ S.ultCede = S.tempo; G.cedeEspaco(x, z, r * U, 6); } }

  /* ============================== fases ============================== */
  const entra = (fase) => { S.fase = fase; S.t = 0; C2.sub = 0; C2.tsub = 0; };

  function inicia(info = {}){
    if(!C.ativo || S.fase !== "ocioso") return false;
    if(!S.B){ if(!criaPessoas()) return false; colocaCasa(); S.turno = "dentro"; }
    if(S.turno === "chegando"){ S.turno = "dentro"; muda(S.B, ...casa.bomb, casa.quadYaw + Math.PI * .7); cobertura.visible = false; quad.mostra(true); }
    if(S.turno === "saindo" || S.turno === "fora"){ S.turno = "dentro"; if(!S.B) return false; colocaCasa(); quad.obj.visible = true; cobertura.visible = false; }
    if(S.eq.length < 5) return false;
    S.clockAntes = ciclo.relogio.mult; ciclo.relogio.mult = S.clockAntes * C.relogioFator; S.relogioSlow = true;
    /* vítima + 2 acompanhantes chegam andando ao mirante do fim da trilha */
    const v = G.alocaStaff(), a1 = G.alocaStaff(), a2 = G.alocaStaff(); if(!v || !a1 || !a2){ [v, a1, a2].forEach(p => p && G.liberaStaff(p)); return false; }
    [v, a1, a2].forEach((P, i) => { G.aplicaAparencia(P, i === 0 ? "adulto" : "adulto"); P.staff = true; P.role = i === 0 ? "vitima" : "acompanhante"; P.acess.faixas = false; P.acess.tag = null; P.acess.capacete = false; P.acess.listra = 0; P.acess.radio = false; });
    const L = TM.len, s0 = L - 36 * U; [[v, 0], [a1, -1.6], [a2, 1.8]].forEach(([P, lat], i) => { const [x, z, q] = trilhaXZ(s0 - i * 1.2 * U, lat * U); muda(P, x, z, Math.atan2(q.tx, q.tz), "anda"); P.lat = lat * U; });
    S.vit = v; S.acomp = [a1, a2]; C2.vitS = s0; C2.tCai = null; C2.fazChamado = false; S.snakeAvisada.clear(); S.obs = 0; S.ultBuz = 0; C2.qi = 0; C2.latPlan = 0; pontosDebug.length = 0;
    aviso(info.origem === "debug" ? "Emergência (debug): visitante torceu o pé no mirante" : "Um visitante precisa de ajuda no mirante");
    entra("queda"); S.origem = info.origem || "agenda"; return true;
  }

  function faseQueda(dt){
    const [v, a1, a2] = [S.vit, ...S.acomp], L = TM.len, sCai = L - 12 * U;
    if(C2.tCai === null){
      C2.vitS = Math.min(sCai, C2.vitS + 3.4 * U * dt); andaTrilha(v, C2.vitS, 0, 1.15, dt); andaTrilha(a1, C2.vitS - 1.4 * U, -1.6 * U, 1.2, dt); andaTrilha(a2, C2.vitS - 2 * U, 2 * U, 1.2, dt);
      if(C2.vitS >= sCai - .2){ C2.tCai = S.t; v.modo = "tropeca"; v.vel = 0; diz(v, pick(F.EMERG.vitimaCai), 3, 20); }
    } else {
      const t = S.t - C2.tCai; v.vel = 0; const [vx, vz] = trilhaXZ(sCai, 0);
      if(t > 1.3) v.modo = "dor";
      [a1, a2].forEach((P, i) => { P.vel = 0; P.yaw += ang(Math.atan2(vx - P.x, vz - P.z) - P.yaw) * .3; if(t > 1.0 + i * .6 && P.modo !== "abaixa" && P.modo !== "radio") P.modo = i === 0 ? "abaixa" : "radio"; });
      if(t > 2.2 && !C2.falouA){ C2.falouA = true; diz(a1, pick(F.EMERG.acompanhanteCai), 4.5, 22); }
      if(t > 4.5 && !C2.falouB){ C2.falouB = true; diz(a2, pick(F.EMERG.acompanhanteCai), 4.5, 22); a2.modo = "radio"; }
      if(t >= C.chamadoSeg){ C2.falouA = C2.falouB = false; entra("saida"); }
    }
  }

  function faseSaida(dt){
    const B = S.B, d = C2.sub;
    if(d === 0){ B.modo = "radio"; B.vel = 0; if(S.t < .1) radio(B, F.EMERG.bombeiroRadioSai[0], 4.5, 20); if(S.t > 2.2){ C2.sub = 1; C2.tsub = S.t; } }
    else if(d === 1){ const r = anda(B, casa.quad[0] + 7, casa.quad[1] + 3, 2.4, dt); if(r < 1.2 * U){ C2.sub = 2; C2.tsub = S.t; B.vel = 0; } }
    else if(d === 2){ B.modo = "capacete"; B.vel = 0; const t = S.t - C2.tsub; if(t > .9 && !B.acess.capacete){ capacete(B, true); quad.capacete(false); } if(t > 1.8){ C2.sub = 3; C2.tsub = S.t; } }
    else if(d === 3){ pilota(B); quad.liga(true); quad.luzes(true); quad.giroflex(true); const t = S.t - C2.tsub; quad.tick(dt, { vAlvo: 0, yawAlvo: null }, M.jogador()); if(t > 1.2){ C2.wp = 0; C2.patio = patio(); entra("sobe"); aviso("Bombeiro civil a caminho do mirante"); } }
  }

  function faseSobe(dt){
    const B = S.B, J = M.jogador(); cedePessoas(quad.x, quad.z, 24);
    if(C2.sub === 0){                                                         // pelo pátio até o início da trilha
      const d = dirigeWP(dt, C2.patio, C2.wp, 4.2); if(d < 8 * U && C2.wp < C2.patio.length - 1) C2.wp++; if(C2.wp === C2.patio.length - 1 && d < 7 * U){ C2.sub = 1; C2.qi = 0; }
    } else if(C2.sub === 1){
      const r = dirigeTrilha(dt, { vMax: C.quad.velSobe, dir: 1, pessoas: true, serpentes: true, animais: true });
      if(r.perto && S.tempo - S.ultFala > 14 && C.quad.aviso){ S.ultFala = S.tempo; diz(B, pick(F.EMERG.quadPessoas), 3.4, 16); }
      if(r.s >= TM.len - 36 * U){ C2.sub = 2; C2.tsub = S.t; }
    } else if(C2.sub === 2){                                                  // estaciona
      quad.tick(dt, { vAlvo: 0, yawAlvo: null }, J); if(Math.abs(quad.v) < .15 || S.t - C2.tsub > 6){ C2.sub = 3; C2.tsub = S.t; C2.qxz = [quad.x, quad.z]; }
    } else if(C2.sub === 3){                                                  // tira o capacete e deixa no quadriciclo
      quad.tick(dt, { vAlvo: 0, yawAlvo: null }, J); const t = S.t - C2.tsub; B.vel = 0; B.modo = "capacete"; if(t < .05){ const s = Math.sin(quad.yaw), c = Math.cos(quad.yaw); B.x = quad.x + c * 2.6 * 1 + s * -2; B.z = quad.z - s * 2.6 + c * -2; B.y = chao(B.x, B.z); B.yaw = quad.yaw + Math.PI * .5; }
      if(t > .8 && B.acess.capacete){ capacete(B, false); B.acess.chapeu = 0; quad.capacete(true); quad.liga(false); }
      if(t > 1.6){ quad.giroflex(true); entra("atende"); }
    }
    if(C2.sub < 3) pilota(B);
  }

  function faseAtende(dt){
    const B = S.B, v = S.vit, L = TM.len, J = M.jogador(); quad.tick(dt, null, J); const [vx, vz, vq] = trilhaXZ(L - 12 * U, 0), tt = S.t;
    S.acomp.forEach((P, i) => { P.vel = 0; P.yaw += ang(Math.atan2(vx - P.x, vz - P.z) - P.yaw) * .2; if(P.modo !== "abaixa") P.modo = "abaixa"; });
    if(C2.sub === 0){ const r = anda(B, vx - vq.tx * 3.2 * 1 + vq.tz * 2.6, vz - vq.tz * 3.2 - vq.tx * 2.6, 2.2, dt); if(r < .5 * U){ C2.sub = 1; C2.tsub = tt; B.vel = 0; diz(B, pick(F.EMERG.bombeiroChega), 4.8, 18); } }
    else { B.vel = 0; B.yaw += ang(Math.atan2(vx - B.x, vz - B.z) - B.yaw) * .2; const t = tt - C2.tsub, tot = C.atendimentoSeg[0] + (C.atendimentoSeg[1] - C.atendimentoSeg[0]) * .5;
      B.modo = t < 5 ? "ajoelha" : "examina";
      if(t > 6 && !C2.f1){ C2.f1 = true; diz(B, F.EMERG.bombeiroExame[0], 4.6, 18); } if(t > 13 && !C2.f2){ C2.f2 = true; diz(B, F.EMERG.bombeiroExame[1], 4.6, 18); } if(t > 20 && !C2.f3){ C2.f3 = true; diz(B, F.EMERG.bombeiroExame[2], 4.6, 18); }
      if(t > tot - 7 && !C2.fRad){ C2.fRad = true; }
      if(C2.fRad && !C2.radioFeito){ B.modo = "radio"; if(!C2.radioT){ C2.radioT = t; radio(B, F.EMERG.bombeiroRadioMaca, 7, 22); } if(t - C2.radioT > 3.5){ C2.radioFeito = true; iniciaEquipe(); } }
      if(C2.radioFeito){ B.modo = "ajoelha"; if(t - C2.radioT > 8 && (t - C2.radioT) % 12 < dt){ diz(B, pick(F.EMERG.bombeiroAcalma), 4.6, 18); } }
      if(C2.radioFeito && C2.rapidosChegaram){ entra("espera"); }
    }
    equipeSobe(dt);
  }
  function faseEspera(dt){                                                    // os 3 que chegaram antes avaliam com o bombeiro até a maca chegar
    const B = S.B, L = TM.len, [vx, vz] = trilhaXZ(L - 12 * U, 0); quad.tick(dt, null, M.jogador()); B.vel = 0; B.modo = "ajoelha"; B.yaw += ang(Math.atan2(vx - B.x, vz - B.z) - B.yaw) * .2;
    S.acomp.forEach(P => { P.vel = 0; P.modo = "abaixa"; }); equipeSobe(dt);
    if(S.t > 12 && (S.t % 14) < dt) diz(B, pick(F.EMERG.bombeiroAcalma), 4.6, 18);
    if(C2.macaChegou){ entra("embarque"); iniciaEmbarque(); }
  }

  /* ---------- equipe a pé (3 rápidos + 2 com a maca vazia) ---------- */
  function iniciaEquipe(){
    C2.eqSt = S.eq.map((P, i) => ({ P, i, rap: RAPIDOS.includes(i), wp: 0, s: 0, estado: "patio", lat: (i % 2 ? 1 : -1) * 1.1 * U, chegou: false, falouCorre: false }));
    C2.patioEq = patio(); S.eq.forEach(P => { P.modo = "anda"; }); C2.macaCarrega = true; maca.cintos.visible = false; aviso("A equipe de resgate sobe a trilha correndo com a maca");
  }
  function equipeSobe(dt){
    if(!C2.eqSt) return; const L = TM.len, alvoRap = L - 15 * U, alvoMaca = L - 16 * U; let nRap = 0;
    C2.eqSt.forEach(e => {
      const P = e.P, v = e.rap ? C.equipe.velRapidos : C.equipe.velMaca;
      if(e.estado === "patio"){ const [x, z] = C2.patioEq[Math.min(e.wp, C2.patioEq.length - 1)] ; const r = anda(P, x + (e.i - 2) * 1.2, z + (e.i - 2) * .8, v, dt, "corre"); if(r < 6 * U){ if(e.wp < C2.patioEq.length - 1) e.wp++; else { e.estado = "trilha"; e.s = 0; } } }
      else if(e.estado === "trilha"){ e.s = Math.min(alvoRap, e.s + v * U * dt); const r = andaTrilha(P, e.s + (e.rap ? 0 : -1.6 * U * ((e.i === MACA2[0]) ? 0 : 1)), e.lat, v, dt, 1, "corre"); P.modo = e.rap ? "corre" : "carrega"; cedePessoas(P.x, P.z, 18);
        if(!e.falouCorre && e.rap && S.tempo - S.ultFala > 8){ e.falouCorre = true; S.ultFala = S.tempo; diz(P, pick(F.EMERG.equipeCorre), 3.8, 20); }
        if(e.s >= (e.rap ? alvoRap : alvoMaca) - 1){ e.estado = "chegou"; } void r; }
      else if(e.estado === "chegou"){ P.vel = 0; const [vx, vz] = trilhaXZ(L - 12 * U, 0); P.yaw += ang(Math.atan2(vx - P.x, vz - P.z) - P.yaw) * .2; if(e.rap){ P.modo = "ajoelha"; nRap++; } else P.modo = "abaixa"; }
    });
    /* maca vazia levada pelos dois */
    const m2 = C2.eqSt.filter(e => !e.rap); if(C2.macaCarrega && m2.length === 2 && !C2.macaChegou){ const [a, b] = m2.map(e => e.P), cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, yaw = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2; maca.obj.visible = true; maca.obj.position.set(cx, Math.max(a.y, b.y) + 2.3 * U + Math.abs(Math.sin(S.tempo * 7)) * .1, cz); maca.obj.rotation.set(0, (m2[0].s !== undefined ? Math.atan2(-(b.z - a.z), (b.x - a.x)) * 0 : 0) + (Math.atan2(am(TM, m2[0].s).tx, am(TM, m2[0].s).tz)), 0); void yaw;
      if(m2.every(e => e.estado === "chegou")){ C2.macaChegou = true; C2.macaCarrega = false; } }
    if(nRap === 3 && !C2.rapidosChegaram){ C2.rapidosChegaram = true; diz(C2.eqSt.find(e => e.rap).P, pick(F.EMERG.equipeChega), 4.6, 20); }
  }

  /* ---------- embarque na maca ---------- */
  function iniciaEmbarque(){
    const L = TM.len, [vx, vz, q] = trilhaXZ(L - 12 * U, 0), nx = -q.tz, nz = q.tx;
    C2.macaPos = [vx + nx * 5.2, vz + nz * 5.2]; C2.macaYaw = Math.atan2(q.tx, q.tz); maca.obj.visible = true; maca.obj.position.set(C2.macaPos[0], chao(C2.macaPos[0], C2.macaPos[1]) + .22 * U, C2.macaPos[1]); maca.obj.rotation.set(0, C2.macaYaw, 0); maca.cintos.visible = false;
    C2.vitDe = [S.vit.x, S.vit.z]; C2.emb = 0; C2.embFala = 0; S.eq.forEach((P, i) => { P.modo = "ajoelha"; });
  }
  function faseEmbarque(dt){
    const B = S.B, v = S.vit, tt = S.t, dur = C.embarqueSeg, [cx, cz] = C2.macaPos, yaw = C2.macaYaw, sn = Math.sin(yaw), cs = Math.cos(yaw); quad.tick(dt, null, M.jogador());
    /* pessoas ao redor da maca: 3 de um lado, bombeiro e as outras do outro */
    const lados = [[3.6, 1.6], [3.6, -1.6], [-3.6, 1.2], [-3.6, -1.2], [3.6, 0]];
    S.eq.forEach((P, i) => { if(i === CONSOLA){ const x = cx + cs * 0 + sn * -5, z = cz + -sn * 0 + cs * -5; anda(P, cx - sn * 6.4, cz - cs * 6.4, 2.2, dt); P.modo = "ajoelha"; return; } const [ox, oz] = lados[i % 5]; anda(P, cx + cs * ox + sn * oz, cz - sn * ox + cs * oz, 2.4, dt); if(P.vel < 1) { P.modo = "ajoelha"; P.yaw += ang(Math.atan2(cx - P.x, cz - P.z) - P.yaw) * .3; } });
    anda(B, cx + cs * -3.6 + sn * -1.6, cz + sn * 3.6 + cs * -1.6, 2.4, dt); if(B.vel < 1) { B.modo = "ajoelha"; B.yaw += ang(Math.atan2(cx - B.x, cz - B.z) - B.yaw) * .3; }
    const t = tt, u = cl((t - 3) / (dur - 6), 0, 1);
    if(t > 3){ /* vítima passa do chão para a maca */ const alvoX = cx - sn * -2.7 * 0 + sn * 2.6, alvoZ = cz + cs * 2.6; v.x = C2.vitDe[0] + (alvoX - C2.vitDe[0]) * u; v.z = C2.vitDe[1] + (alvoZ - C2.vitDe[1]) * u; v.y = chao(v.x, v.z) + u * .1 * U; v.yaw = yaw; v.modo = u > .35 ? "deitado" : "dor"; }
    if(t > 4 && !C2.embFalou1){ C2.embFalou1 = true; diz(S.eq[1], F.EMERG.equipeChega[2], 4.2, 18); } if(t > 8 && !C2.embFalou2){ C2.embFalou2 = true; diz(S.eq[CONSOLA], pick(F.EMERG.consola), 4.6, 18); }
    if(t > dur - 4 && !maca.cintos.visible){ maca.cintos.visible = true; diz(B, "Cintos presos. Vamos descer devagar.", 4, 18); }
    S.acomp.forEach(P => { P.vel = 0; P.modo = "idle"; });
    if(t >= dur){ entra("preparaDesce"); }
  }

  /* ---------- descida em comboio ---------- */
  function fasePreparaDesce(dt){
    const B = S.B, J = M.jogador(), d = C2.sub, L = TM.len; const qxz = C2.qxz || [quad.x, quad.z];
    if(d === 0){ const r = anda(B, qxz[0] + 3, qxz[1] + 2, 2.6, dt); S.eq.forEach(P => { P.modo = "abaixa"; P.vel = 0; }); if(r < 1.4 * U){ C2.sub = 1; C2.tsub = S.t; quad.capacete(false); } }
    else if(d === 1){ B.modo = "capacete"; B.vel = 0; const t = S.t - C2.tsub; if(t > .8 && !B.acess.capacete){ capacete(B, true); } if(t > 1.7){ C2.sub = 2; C2.tsub = S.t; quad.liga(true); quad.luzes(true); quad.giroflex(true); } }
    else { pilota(B); quad.tick(dt, { vAlvo: 0, yawAlvo: null }, J); if(S.t - C2.tsub > 1.2){ iniciaDescida(); } }
    S.acomp.forEach(P => { P.vel = 0; P.modo = "idle"; });
  }
  function iniciaDescida(){
    const L = TM.len; C2.sC = L - 12 * U; C2.vC = 0; C2.latC = 0; C2.latPlan = 0; C2.fase = 0; C2.descansou = false; C2.descansando = 0; C2.gap = rnd(C.comboio.quadAfasta[0], C.comboio.quadAfasta[1]); C2.falaT = rnd(3, 6); C2.vitFalaT = 5; C2.parteLote = false;
    C2.macaY = chao(...trilhaXZ(C2.sC, 0).slice(0, 2)) + 2.4 * U; maca.cintos.visible = true; C2.carregando = true; C2.ondeNoComboio = "trilha"; C2.rotaPatio = null; C2.qi = Math.max(0, TM.pts.length - 3); C2.qeMsg = false;
    S.acomp.forEach((P, i) => { P.s = C2.sC + (10 + i * 2.5) * U; P.lat = (i ? 1.2 : -1.2) * U; }); entra("desce"); aviso("Comboio descendo devagar com a vítima");
  }
  function layoutComboio(x, z, yaw){                                           // posições locais (u) em volta da maca
    const sn = Math.sin(yaw), cs = Math.cos(yaw), P = (ox, oz) => [x + cs * ox + sn * oz, z - sn * ox + cs * oz];
    return { fr: P(1.9, 1.8), fl: P(-1.9, 1.8), rr: P(1.9, -1.8), rl: P(-1.9, -1.8), head: P(0, -6.6), a1: P(-1.2, -11.5), a2: P(1.8, -14.2) };
  }
  function posicionaComboio(dt, x, z, yaw, v){
    const J = M.jogador(), lay = layoutComboio(x, z, yaw), carr = [S.eq[1], S.eq[2], S.eq[3], S.eq[4]], alvos = [lay.fr, lay.fl, lay.rr, lay.rl];
    C2.passo = (C2.passo || 0) + dt * (3 + v * 2.6);
    carr.forEach((P, i) => { P.x = alvos[i][0]; P.z = alvos[i][1]; P.y = chao(P.x, P.z); P.yaw = yaw; P.vel = v * U; P.fase = C2.passo; P.modo = v > .05 ? "carrega" : (C2.descansando > 0 ? "abaixa" : "carrega"); });
    const ys = carr.map(p => p.y), nivel = (ys[0] + ys[1] + ys[2] + ys[3]) / 4 + (C2.descansando > 0 ? .5 : 2.4) * (C2.descansando > 0 ? 1 : U / U); C2.macaY += (nivel - C2.macaY) * Math.min(1, dt * 3);
    maca.obj.position.set(x, C2.macaY + (v > .05 ? Math.sin(C2.passo * 2) * .012 * U : 0), z); maca.obj.rotation.set(0, yaw, 0); maca.obj.visible = true;
    const cH = S.eq[CONSOLA]; cH.x += (lay.head[0] - cH.x) * Math.min(1, dt * 4); cH.z += (lay.head[1] - cH.z) * Math.min(1, dt * 4); cH.y = chao(cH.x, cH.z); cH.yaw = yaw; cH.vel = v * U; cH.modo = v > .05 ? "anda" : "idle"; cH.fase = C2.passo;
    const vit = S.vit, sn = Math.sin(yaw), cs = Math.cos(yaw); vit.x = x + sn * 2.6; vit.z = z + cs * 2.6; vit.y = C2.macaY - .1 * U + .05; vit.yaw = yaw; vit.modo = "deitado"; vit.vel = 0;
    S.acomp.forEach((P, i) => { const al = i ? lay.a2 : lay.a1; P.x += (al[0] - P.x) * Math.min(1, dt * 1.4); P.z += (al[1] - P.z) * Math.min(1, dt * 1.4); P.y = chao(P.x, P.z); P.yaw = yaw; P.vel = v * U; P.modo = v > .05 ? "anda" : "idle"; P.fase = C2.passo + i * 1.7; });
    return lay;
  }
  function falasComboio(dt){
    C2.falaT -= dt; if(C2.falaT <= 0){ C2.falaT = rnd(C.comboio.falaCada[0], C.comboio.falaCada[1]); diz(S.eq[CONSOLA], pick(F.EMERG.consola), 5, 18); C2.vitFalaT = rnd(2.5, 4); }
    C2.vitFalaT -= dt; if(C2.vitFalaT <= 0){ C2.vitFalaT = 1e9; if(Math.random() < .8) diz(S.vit, pick(F.EMERG.vitimaResp), 3.6, 16); }
  }
  function faseDesce(dt){
    const B = S.B, J = M.jogador(), L = TM.len; pilota(B);
    if(C2.ondeNoComboio === "trilha"){
      /* serpentes (ou obstáculo de verdade) à frente: desvia pelo campo seguro ou espera */
      const pr = nav.proj(TM, quad.x, quad.z, C2.qi); C2.qi = pr.i;
      const obst = nav.obstaculos(TM, am, pr.i, { x: quad.x, z: quad.z }, { pessoas: false, serpentes: true, animais: false, folgaSerpente: C.serpente.folga }, 80 * U);
      const plano = nav.planeja(TM, am, C2.sC, -1, C2.latPlan, obst, { adiante: C2.gap / U + 22, atras: 9 });
      C2.latPlan += cl(plano.lat - C2.latPlan, -2.2 * U * dt, 2.2 * U * dt); C2.latC = C2.latPlan;
      const prox = obst.filter(b => b.s < C2.sC + 10 * U && b.s > C2.sC - (C2.gap + C.serpente.avisaA) * U), serp = prox.find(b => b.tipo === "serpente");
      if(serp && !S.snakeAvisada.has(serp.ref)){ S.snakeAvisada.add(serp.ref); radio(B, pick(plano.ok ? F.EMERG.serpente : F.EMERG.serpenteEspera), 5, 24); }
      let vAlvo = C.comboio.vel;
      if(!plano.ok){ vAlvo = 0; C2.espera = (C2.espera || 0) + dt; } else C2.espera = 0;
      /* parada para descanso no meio do caminho */
      const f = 1 - (C2.sC / L); if(C.comboio.descanso.ativo && !C2.descansou && C2.sC < L * (1 - C.comboio.descanso.em)){ C2.descansou = true; C2.descansando = C.comboio.descanso.seg; diz(B, "Pausa curta, vamos apoiar a maca com cuidado.", 4, 18); }
      if(C2.descansando > 0){ C2.descansando -= dt; vAlvo = 0; }
      /* aceleração suave */
      C2.vC += cl(vAlvo - C2.vC, -1.2 * dt, .6 * dt); C2.sC -= C2.vC * U * dt;
      const [cx, cz, q] = trilhaXZ(C2.sC, C2.latC), yaw = Math.atan2(-q.tx, -q.tz), lay = posicionaComboio(dt, cx, cz, yaw, C2.vC);
      /* quadriciclo guiando à frente */
      const gapAtual = (pr.s < C2.sC ? C2.sC - pr.s : 0) / U, erro = gapAtual - C2.gap, vq = cl(C2.vC - erro * .6, 0, C2.vC * 2 + .5); const look = 5 * U, q2 = am(TM, pr.s - look), x = q2.x - q2.tz * C2.latC, z = q2.z + q2.tx * C2.latC; atualizaDebug(x, z);
      quad.S.campo = Math.abs(pr.lat) > nav.TL * 1.1; quad.tick(dt, { vAlvo: vq, yawAlvo: Math.atan2(x - quad.x, z - quad.z) }, J);
      if(S.tempo - S.ultFala > 7 && G.gruposPerto(quad.x, quad.z, 45 * U).length){ S.ultFala = S.tempo; diz(B, pick(F.EMERG.abrePassagem), 4.4, 24); }
      cedePessoas(quad.x, quad.z, 26); cedePessoas(cx, cz, 18); falasComboio(dt); S.acomp.forEach((P, i) => { void lay; void P; });
      /* chegando ao fim da trilha: segue em linha reta pelo pátio até a ambulância */
      if(C2.sC <= 14 * U){ C2.ondeNoComboio = "patio"; C2.wpC = 0; const pts = patio().slice().reverse(); C2.patioRev = pts; C2.cx = cx; C2.cz = cz; C2.cyaw = yaw; C2.ptsLote = [...pts.slice(1), amb.pontoTras(3.5 * U)]; C2.ptsLote = C2.ptsLote.map(p => [p[0], p[1]]); C2.cI = 0; C2.cVel = C2.vC; }
    } else {
      /* pátio: o centro da maca anda pela poligonal; o quadriciclo vai ao seu lugar */
      const alvo = C2.ptsLote[C2.cI], dx = alvo[0] - C2.cx, dz = alvo[1] - C2.cz, d = Math.hypot(dx, dz), v = C.comboio.vel * 1.15; if(d > .5){ C2.cyaw += ang(Math.atan2(dx, dz) - C2.cyaw) * Math.min(1, dt * 2.2); C2.cx += dx / d * v * U * dt; C2.cz += dz / d * v * U * dt; }
      if(d < 1.4 * U && C2.cI < C2.ptsLote.length - 1) C2.cI++; else if(d < 1.4 * U && C2.cI === C2.ptsLote.length - 1){ entra("carga"); C2.quadLote = true; return; }
      posicionaComboio(dt, C2.cx, C2.cz, C2.cyaw, v); falasComboio(dt);
      /* quadriciclo vai estacionar no lugar de sempre */
      const dq = Math.hypot(casa.quad[0] - quad.x, casa.quad[1] - quad.z); if(dq > 8 * U){ quad.S.campo = false; quad.tick(dt, { vAlvo: 3.4, yawAlvo: Math.atan2(casa.quad[0] - quad.x, casa.quad[1] - quad.z) }, J); } else { quad.tick(dt, { vAlvo: 0, yawAlvo: null }, J); }
    }
    /* "Socorro em Ação": acompanhar de 12 a 60 m sem atrapalhar */
    if(J && !S.conquistou){ const d = Math.hypot(J.x - quad.x, J.z - quad.z) / U; if(d > C.conquista.de && d < C.conquista.ate){ S.obs += dt; if(S.obs >= C.conquista.seg){ S.conquistou = true; if(M.conquistas) M.conquistas.dar("socorro", "Socorro em Ação", "Acompanhou o resgate de longe, sem atrapalhar."); } } }
  }

  /* ---------- carga na ambulância ---------- */
  function faseCarga(dt){
    const B = S.B, J = M.jogador(), t = S.t, rear = amb.pontoTras(0), sn = Math.sin(amb.yaw), cs = Math.cos(amb.yaw);
    /* quadriciclo estaciona e o bombeiro volta à rotina */
    const dq = Math.hypot(casa.quad[0] - quad.x, casa.quad[1] - quad.z);
    if(C2.quadLote){ if(dq > 3 * U){ quad.S.campo = false; quad.tick(dt, { vAlvo: 3, yawAlvo: Math.atan2(casa.quad[0] - quad.x, casa.quad[1] - quad.z) }, J); pilota(B); } else { quad.tick(dt, { vAlvo: 0, yawAlvo: null }, J); if(Math.abs(quad.v) < .1){ C2.quadLote = false; C2.bombSai = true; C2.tB = t; } } }
    if(C2.bombSai){ const tb = t - C2.tB; if(tb < .1){ B.x = quad.x + 6; B.z = quad.z + 2; B.y = chao(B.x, B.z); } if(tb < 1.6){ B.modo = "capacete"; B.vel = 0; if(tb > .8 && B.acess.capacete){ capacete(B, false); quad.capacete(true); B.acess.chapeu = 2; } } else { quad.giroflex(false); quad.luzes(false); quad.liga(false); if(tb < 5) anda(B, casa.bomb[0], casa.bomb[1], 2.4, dt); else { B.modo = "radio"; B.vel = 0; } } }
    /* portas, maca para dentro, vítima some */
    const d = C2.cargaSub || 0; const ptsC = rear;
    if(d === 0){ amb.portas(true); C2.cargaSub = 1; C2.cT = t; }
    else if(d === 1){ const u = cl((t - C2.cT - 1.2) / 5, 0, 1); const alvo = [rear[0] + sn * (-2 * U) * 0, rear[1]]; C2.cyaw += ang(amb.yaw - C2.cyaw) * Math.min(1, dt * 3); const dx = rear[0] + sn * 2 * U - C2.cx, dz = rear[1] + cs * 2 * U - C2.cz; C2.cx += dx * Math.min(1, dt * 1.2); C2.cz += dz * Math.min(1, dt * 1.2); void alvo;
      if(u <= 0){ posicionaComboio(dt, C2.cx, C2.cz, C2.cyaw, 0); falasComboio(dt); } else { /* maca desliza para dentro */ const x = rear[0] - sn * (u * 4.5 * U - 1 * U) * -1, z = rear[1] - cs * (u * 4.5 * U - 1 * U) * -1; void x; void z; const ix = rear[0] + sn * (-u * 4.5 * U + 2.2 * U) * 1 * -1; void ix; const px = rear[0] + sn * (2.2 * U - u * 5 * U) * -1 * -1, pz = rear[1] + cs * (2.2 * U - u * 5 * U) * -1 * -1; void px; void pz;
        const fx = sn, fz = cs; const dist = 2.2 * U - u * 5.2 * U; const mx = rear[0] + fx * dist, mz = rear[1] + fz * dist; posicionaComboio(dt, mx, mz, amb.yaw + Math.PI, 0); const s2 = S.eq; s2[1].x = mx + cs * 3.6 - fx * -1; s2[2].x = mx - cs * 3.6; s2[2].z = mz + sn * 3.6; s2[1].z = mz - sn * 3.6; maca.obj.position.y = Math.max(maca.obj.position.y, chao(mx, mz) + .6 * U); }
      if(t - C2.cT > 7.5){ C2.cargaSub = 2; C2.cT2 = t; S.vit.oculto = true; maca.obj.visible = false; S.acomp.forEach(P => { P.modo = "idle"; }); amb.portas(false); diz(S.eq[CONSOLA], pick(F.EMERG.ambulanciaCarrega), 4, 18); } }
    else if(d === 2){ const tt = t - C2.cT2; const portas = [PKWnear(-1), PKWnear(1)]; void portas;
      S.eq.forEach((P, i) => { const alvo = i < 2 ? cabine(i) : rearEnter(); const r = anda(P, alvo[0], alvo[1], 3.2, dt); if(r < 1.2 * U) P.oculto = true; });
      if(tt > 3 && S.eq.every(P => P.oculto || Math.hypot(P.x - amb.x, P.z - amb.z) < 6 * U) || tt > 8){ S.eq.forEach(P => { P.oculto = true; }); partidaAmb(); } }
    /* acompanhantes chegam atrás do comboio (já vêm descendo pela trilha) */
    seguemAcompanhantes(dt);
  }
  const PKWnear = () => [amb.x, amb.z];
  const cabine = (i) => { const sn = Math.sin(amb.yaw), cs = Math.cos(amb.yaw), side = i ? -1 : 1; return [amb.x + sn * 1.6 * U + cs * side * 2.3 * U, amb.z + cs * 1.6 * U - sn * side * 2.3 * U]; };
  const rearEnter = () => amb.pontoTras(.4 * U);
  function seguemAcompanhantes(dt){
    S.acomp.forEach((P, i) => { if(P.oculto) return; if(!P.carro){ const E1 = E0.carros[i % E0.carros.length], [x, z] = PKW(E1[0], E1[1] + 4); P.carro = [x + i * 2, z]; } const r = anda(P, P.carro[0], P.carro[1], 1.7, dt); if(r < 1.4 * U){ P.oculto = true; } });
  }
  function partidaAmb(){
    C2.ambRota = rotaAmb(); C2.ambSt = { s: 0 }; amb.giro(true); amb.sirene(true); C2.ambFase = 1; S.ambFora = false; S.ambSaidaAbs = agora(); entra("saidaAmb");
    if(S.relogioSlow){ ciclo.relogio.mult = S.clockAntes || 1; S.relogioSlow = false; }
    S.tempo0 = S.tempo; aviso("A ambulância segue para Cambará do Sul");
  }
  function faseSaidaAmb(dt){
    const J = M.jogador(), r = C2.ambRota; const sobre = C2.ambSt.s;
    const vel = sobre < 40 * U ? 3.2 : C.ambulancia.vel; if(sobre < 14 * U) amb.portas(false);
    const fim = amb.segue(dt, r, C2.ambSt, vel, J);
    if(C.ambulancia.sirene === "saida" && sobre > (C.ambulancia.sireneM || 380) * U) amb.sirene(false);
    seguemAcompanhantes(dt);
    if(fim){ amb.parar(); amb.mostra(false); S.ambFora = true; entra("fora"); }
  }
  function faseFora(dt){
    seguemAcompanhantes(dt); amb.atualiza(dt, M.jogador());
    if(S.acomp.length && S.acomp.every(P => P.oculto)){ S.acomp.forEach(P => G.liberaStaff(P)); S.acomp = []; if(S.vit){ G.liberaStaff(S.vit); S.vit = null; } }
    const viagemH = C2.ambRota ? C2.ambRota.len / (C.ambulancia.vel * U) / GAME_TIME_CONFIG.realSecondsPerGameHour : 0;
    if(agora() >= S.ambSaidaAbs + C.ambulancia.retornoHoras - viagemH){ C2.ambRota = reverte(rotaAmb()); C2.ambSt = { s: 0 }; amb.mostra(true); amb.giro(false); amb.sirene(false); C2.ambFase = 2; entra("voltaAmb"); aviso("A ambulância voltou ao estacionamento"); }
  }
  function faseVoltaAmb(dt){
    const J = M.jogador(), r = C2.ambRota, rest = r.len - C2.ambSt.s, vel = rest < 28 * U ? Math.max(1.6, rest / U * .4) : C.ambulancia.vel;
    const fim = amb.segue(dt, r, C2.ambSt, vel, J);
    if(fim || rest < 3 * U){ amb.colocar(casa.amb[0], casa.amb[1], casa.ambYaw); amb.atualiza(0, J); amb.portas(true); entra("descarrega"); }
  }
  function faseDescarrega(dt){
    amb.atualiza(dt, M.jogador()); const t = S.t;
    if(t > 1.5 && !C2.sa){ C2.sa = true; const rear = amb.pontoTras(0); S.eq.forEach((P, i) => { muda(P, rear[0] + (i - 2) * 1.2, rear[1] + 1, casa.ambYaw + Math.PI, "anda"); P.oculto = false; }); }
    if(C2.sa){ S.eq.forEach((P, i) => { const [x, z] = casa.equipe[i]; const r = anda(P, x, z, 1.8, dt); if(r < 1) { P.modo = "idle"; } }); maca.obj.visible = true; maca.obj.position.set(casa.maca[0], chao(casa.maca[0], casa.maca[1]) + .1 * U, casa.maca[1]); maca.cintos.visible = false; }
    if(t > 9){ amb.portas(false); C2.sa = false; C2.cargaSub = 0; C2.eqSt = null; C2.macaChegou = false; C2.rapidosChegaram = false; C2.f1 = C2.f2 = C2.f3 = C2.fRad = C2.radioFeito = C2.radioT = C2.embFalou1 = C2.embFalou2 = false; C2.espera = 0; S.eq.forEach((P, i) => { P.modo = "idle"; }); entra("ocioso"); S.hojeFeito = true; S.dia = ciclo.diaJogo(); }
  }

  /* ---------- rotina e fim do expediente ---------- */
  const cobertura = new Mesh(new BoxGeometry(1.25 * U, .75 * U, 2.1 * U), new MeshStandardMaterial({ color: 0x4d5b58, roughness: 1 })); cobertura.visible = false; cen.grupo.add(cobertura);
  function ocioso(dt, J){
    const B = S.B, t = S.tempo; S.tIdle -= dt;
    if(S.turno === "chegando"){ const r = anda(B, casa.bomb[0], casa.bomb[1], 1.8, dt); if(r < 1.2 * U){ S.turno = "dentro"; B.modo = "idle"; cobertura.visible = false; quad.mostra(true); } return; }
    if(S.turno === "saindo"){ cobertura.position.set(quad.x, quad.mola ? 0 : chao(quad.x, quad.z) + .45 * U, quad.z); cobertura.position.y = chao(quad.x, quad.z) + .45 * U; cobertura.rotation.y = quad.yaw; if(!C2.saiSub){ C2.saiSub = 1; C2.saiT = 0; } C2.saiT += dt;
      if(C2.saiSub === 1){ const r = anda(B, quad.x + 6, quad.z + 3, 1.8, dt); if(r < 1.5 * U || C2.saiT > 8){ C2.saiSub = 2; C2.saiT = 0; } }
      else if(C2.saiSub === 2){ B.modo = "abaixa"; B.vel = 0; if(C2.saiT > 2.6){ cobertura.visible = true; quad.mostra(false); C2.saiSub = 3; C2.saiT = 0; } }
      else if(C2.saiSub === 3){ const e = estrada.pts, alvo = e[Math.min(e.length - 1, 8)]; const r = anda(B, alvo[0], alvo[1], 2.0, dt); if(r < 2 * U || C2.saiT > 60){ G.liberaStaff(B); if(B.hotspot){ const i = cen.hotspots.indexOf(B.hotspot); if(i >= 0) cen.hotspots.splice(i, 1); } S.B = null; S.turno = "fora"; C2.saiSub = 0; if(C.fimExpediente.equipeSaiTambem){ S.eq.forEach(P => G.liberaStaff(P)); S.eq = []; amb.mostra(false); maca.obj.visible = false; } } }
      return; }
    /* prontidão: confere equipamento, fala no rádio, conversa com a equipe, olha a trilha */
    quad.tick(dt, null, J); amb.atualiza(dt, J);
    if(S.tIdle <= 0 && !B.conversando){ S.tIdle = rnd(4, 9); const r = Math.random(); B.modo = r < .25 ? "radio" : r < .5 ? "conversa" : r < .65 ? "abaixa" : "idle"; B.tModo = 99; if(r >= .25 && r < .5){ const P = pick(S.eq); B.yaw = Math.atan2(P.x - B.x, P.z - B.z); } else if(r >= .65){ const [tx, tz] = TM.pts[0]; B.yaw = Math.atan2(tx - B.x, tz - B.z); } else B.yaw = Math.atan2(quad.x - B.x, quad.z - B.z) + rnd(-.5, .5); }
    B.vel = 0; S.eq.forEach(P => { if(P.conversando) return; if(Math.random() < dt * .12) { P.modo = pick(["conversa", "idle", "radio", "prancheta", "idle"]); } P.vel = 0; });
  }
  function gerencia(dt, J, E){
    const h = E.h, abre = C.fimExpediente.volta, fecha = PARQUE.fecha;
    if(S.turno === "fora" && !S.B && S.fase === "ocioso" && h >= abre && h < fecha - .5){ if(criaPessoas()){ colocaCasa(); const e = estrada.pts, p = e[Math.min(6, e.length - 1)]; S.B.x = p[0]; S.B.z = p[1]; S.B.y = chao(p[0], p[1]); S.B.modo = "anda"; S.turno = "chegando"; } }
    else if(S.turno === "fora" && S.B === null && S.eq.length === 0 && C.fimExpediente.equipeSaiTambem && h >= abre && h < fecha - .5){ /* a equipe volta junto */ }
    if(S.turno === "dentro" && S.fase === "ocioso" && C.fimExpediente.ativo){ const fim = h >= fecha && G.contaPessoas() === 0, forcado = h >= fecha + 5 || (h < abre - .3 && h < fecha - 8); if(fim || forcado){ S.turno = "saindo"; C2.saiSub = 0; } }
    if(S.turno === "fora" && !S.B && S.fase === "ocioso"){ cobertura.visible = true; quad.mostra(false); }
  }

  /* ---------- quadro ---------- */
  function tick(dt, J, E){
    S.tempo += dt; S.t += dt; gerencia(dt, J, E);
    if(!S.B){ amb.atualiza(dt, J); return; }
    switch(S.fase){
      case "ocioso": ocioso(dt, J); break; case "queda": faseQueda(dt); break; case "saida": faseSaida(dt); break; case "sobe": faseSobe(dt); break; case "atende": faseAtende(dt); break; case "espera": faseEspera(dt); break;
      case "embarque": faseEmbarque(dt); break; case "preparaDesce": fasePreparaDesce(dt); break; case "desce": faseDesce(dt); break; case "carga": faseCarga(dt); break; case "saidaAmb": faseSaidaAmb(dt); break;
      case "fora": faseFora(dt); break; case "voltaAmb": faseVoltaAmb(dt); break; case "descarrega": faseDescarrega(dt); break; default: break;
    }
    if(S.fase !== "ocioso" && S.fase !== "queda" && S.fase !== "saida" && S.fase !== "sobe" && S.fase !== "desce") quad.tick(0, null, J);
    if(S.fase === "queda" || S.fase === "saida") quad.tick(S.fase === "queda" ? dt : 0, null, J);
    if(S.fase !== "ocioso" || S.turno !== "dentro") S.eq.forEach(P => { if(P.hotspot){ P.hotspot.x = P.x; P.hotspot.z = P.z; } });
    if(S.depurar) atualizaLinhas();
    if(S.fase !== "voltaAmb" && S.fase !== "saidaAmb" && S.fase !== "fora" && S.fase !== "carga" && S.fase !== "descarrega") amb.atualiza(dt, J);
  }

  /* ---------- depuração (F3): rota do quadriciclo, pontos de desvio, estrada da ambulância ---------- */
  let dbg = null;
  function liga(on){
    S.depurar = on; if(!on){ if(dbg){ dbg.g.parent && dbg.g.parent.remove(dbg.g); dbg = null; } return; }
    const g = new Group(), mk = (cor) => new Line(new BufferGeometry(), new LineBasicMaterial({ color: cor, depthTest: false, transparent: true, opacity: .95 })); const rota = mk(0xffa000), estr = mk(0x30e060), trilha = mk(0x3090ff), pts = new Points(new BufferGeometry(), new PointsMaterial({ color: 0xff3080, size: 9, sizeAttenuation: false, depthTest: false }));
    [rota, estr, trilha, pts].forEach(o => { o.renderOrder = 20; o.frustumCulled = false; g.add(o); }); cen.grupo.add(g); dbg = { g, rota, estr, trilha, pts };
    const set = (l, P) => { const a = new Float32Array(P.length * 3); P.forEach((p, i) => { a[i * 3] = p[0]; a[i * 3 + 1] = chao(p[0], p[1]) + 3; a[i * 3 + 2] = p[1]; }); l.geometry.setAttribute("position", new Float32BufferAttribute(a, 3)); l.geometry.computeBoundingSphere(); };
    set(estr, rotaAmb().pts); set(trilha, TM.pts); dbg.set = set;
  }
  function atualizaLinhas(){ if(!dbg || !pontosDebug.length) return; dbg.set(dbg.rota, pontosDebug); dbg.set(dbg.pts, pontosDebug.filter((p, i) => i % 6 === 0)); }

  /* ---------- API ---------- */
  function reseta(){
    if(S.relogioSlow){ ciclo.relogio.mult = S.clockAntes || 1; S.relogioSlow = false; }
    [S.vit, ...S.acomp].forEach(P => P && G.liberaStaff(P)); S.vit = null; S.acomp = []; Object.keys(C2).forEach(k => { C2[k] = typeof C2[k] === "number" ? 0 : undefined; }); C2.sub = 0; C2.tsub = 0; C2.gap = 8;
    S.fase = "ocioso"; S.t = 0; amb.mostra(true); amb.giro(false); amb.sirene(false); amb.portas(false); amb.parar(); if(S.B){ colocaCasa(); capacete(S.B, false); S.B.acess.chapeu = 2; S.turno = "dentro"; }
  }
  /* pula direto para a descida (teste): vítima já na maca, comboio na metade da trilha */
  function pulaParaDescida(frac = .6){
    if(S.fase !== "ocioso" && S.fase !== "fora") reseta(); if(!S.B){ if(!criaPessoas()) return false; colocaCasa(); S.turno = "dentro"; }
    const v = G.alocaStaff(), a1 = G.alocaStaff(), a2 = G.alocaStaff(); if(!v) return false; [v, a1, a2].forEach((P, i) => { if(!P) return; G.aplicaAparencia(P, "adulto"); P.staff = true; P.role = "acompanhante"; P.acess.faixas = false; P.acess.tag = null; P.acess.radio = false; }); S.vit = v; S.acomp = [a1, a2].filter(Boolean);
    const L = TM.len, s = L * frac; C2.qxz = [0, 0]; const [x, z] = trilhaXZ(s, 0); S.eq.forEach(P => muda(P, x, z, 0)); muda(v, x, z, 0); S.acomp.forEach(P => muda(P, x, z, 0)); muda(S.B, x, z, 0); quad.colocar(...trilhaXZ(s - 10 * U, 0).slice(0, 2), Math.atan2(-am(TM, s).tx, -am(TM, s).tz)); quad.mostra(true); quad.capacete(false); capacete(S.B, true);
    S.clockAntes = ciclo.relogio.mult; ciclo.relogio.mult = S.clockAntes * C.relogioFator; S.relogioSlow = true; S.snakeAvisada.clear(); S.ultBuz = 0; S.obs = 0; C2.qi = Math.max(0, nav.proj(TM, quad.x, quad.z, 0, true).i); quad.liga(true); quad.luzes(true); quad.giroflex(true);
    iniciaDescida(); C2.sC = s; C2.macaY = chao(x, z) + 2.4 * U; C2.qi = nav.proj(TM, quad.x, quad.z, 0, true).i; return true;
  }
  const info = () => "Resgate: " + S.turno + " · " + S.fase + (S.fase !== "ocioso" ? " " + S.t.toFixed(0) + "s" : "") + (C2.sC ? " · s=" + (C2.sC / U).toFixed(0) + " m" : "") + (quad.v > .1 ? " · quad " + quad.v.toFixed(1) + " m/s" : "");
  const pontosMapa = () => { const L = []; if(S.fase !== "ocioso" && S.fase !== "queda" && S.fase !== "saida" || Math.abs(quad.v) > .3) L.push({ x: quad.x, z: quad.z, tipo: "bombeiro" }); if(amb.S.visivel && (["saidaAmb", "voltaAmb"].includes(S.fase))) L.push({ x: amb.x, z: amb.z, tipo: "ambulancia" }); return L; };
  const aoSalto = () => { if(S.fase !== "ocioso") reseta(); };
  const desliga = () => { reseta(); quad.desliga(); amb.parar(); [S.B, ...S.eq].forEach(P => P && G.liberaStaff(P)); S.B = null; S.eq = []; liga(false); };
  return { tick, inicia, pulaParaDescida, reseta, aoSalto, liga, info, pontosMapa, desliga, quad, amb, maca, nav, S, C2, casa, teletransporte: () => (S.fase === "queda" || S.fase === "atende" || S.fase === "espera" || S.fase === "embarque") ? trilhaXZ(TM.len - 30 * U, 0).slice(0, 2) : S.fase === "desce" && C2.ondeNoComboio === "trilha" ? [quad.x - Math.sin(quad.yaw) * 18 * U, quad.z - Math.cos(quad.yaw) * 18 * U] : [casa.bomb[0] + 8, casa.bomb[1]], forcaSerpente(id){ const x = quad.x, z = quad.z; const pr = nav.proj(TM, x, z, 0, true), s = pr.s - 16 * U, q = am(TM, Math.max(2, s)); return M.fauna.serp.emPonto(id || "jararaca", q.x - q.tz * 6, q.z + q.tx * 6, q.tz, -q.tx); } };
}
