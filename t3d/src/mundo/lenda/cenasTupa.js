import { Group, Mesh, SphereGeometry, MeshBasicMaterial, PointLight, AdditiveBlending } from "three";
import { U } from "../config.js";
import { criaGritador, criaBoitata, gritoSom } from "./criaturas.js";

/* ============================================================================================================
   CENAS DA SÉRIE "TUPÃ" (data/missoes/tupa.js): Olhos de Brasa (Anhangá) · Eliminar o Gritador · O Boitatá.
   Textos das falas editáveis aqui. Tudo sobrenatural no terminal sai em roxo (tipo "sobrenatural").
   ============================================================================================================ */
const TEXTOS = {
  anhangaFalas: {
    quem: ["“Fui chamado de muitos nomes por quem veio de longe. Aqui, na língua antiga, sou o que a mata guarda: o espírito, a sombra, a alma. Anhangá.”"],
    nome: ["“‘Anhangá’ vem do tupi: espírito, sombra, alma. Dizem que sou o diabo — invenção de quem chegou depois. Não carrego cruz nenhuma na testa, Tupã. Olhe bem.”"],
    olhos: ["“Brasa que não apaga enquanto houver injustiça na mata. Quem maltrata bicho e caça por prazer vê meus olhos antes de ver o fim do caminho.”"],
    justica: ["“A justiça na mata é simples: quem toma só o que precisa, a mata perdoa. Quem fere por ferir, eu acompanho. Você traz o trovão, eu trago a sombra. Juntos, mantemos a conta em dia.”"]
  }
};
const frente = (J, m, lado = 0) => ({ x: J.x + Math.sin(J.yaw) * m * U + Math.cos(J.yaw) * lado * U, z: J.z + Math.cos(J.yaw) * m * U - Math.sin(J.yaw) * lado * U });

/* fogo-fátuo: 5 chamas azuladas que flutuam sobre o chão */
function fogoFatuo(M, x, z){
  const g = new Group(), L = [];
  for(let i = 0; i < 5; i++){ const m = new Mesh(new SphereGeometry(.28 * U, 10, 8), new MeshBasicMaterial({ color: 0x9fd8ff })); const h = new Mesh(new SphereGeometry(.8 * U, 10, 6), new MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: .25, blending: AdditiveBlending, depthWrite: false })); m.add(h); const a = i * 1.2566, r = (1 + (i % 2)) * 1.2 * U; m.userData = { a, r }; g.add(m); L.push(m); }
  const luz = new PointLight(0x7ec4ff, 2, 22 * U); luz.position.y = 2 * U; g.add(luz); g.position.set(x, M.cen.chao(x, z, 1e9), z); M.cen.grupo.add(g); let t = 0;
  const parte = { tick(dt){ t += dt; L.forEach((m, i) => { m.position.set(Math.cos(m.userData.a + t * .5) * m.userData.r, 1 * U + (Math.sin(t * 2 + i) + 1) * .5 * U, Math.sin(m.userData.a + t * .5) * m.userData.r); }); luz.intensity = 1.6 + Math.sin(t * 3) * .4; } };
  M.registra(parte); return { remove(){ g.parent && g.parent.remove(g); const i = M.partes.indexOf(parte); if(i >= 0) M.partes.splice(i, 1); } };
}

export function registraCenasTupa(M){
  const reg = (n, f) => M.missoes.registraCena(n, f), J = () => M.jogador(), msg = (t, s) => M.terminal && M.terminal.msg(t, s);
  const S = { gritador: null, boitata: null };
  const tremor = (ms = 600) => { const el = M.renderer && M.renderer.domElement; if(!el) return; const t0 = performance.now(); const f = () => { const k = (performance.now() - t0) / ms; if(k >= 1){ el.style.transform = ""; return; } el.style.transform = "translate(" + ((Math.random() - .5) * 14 * (1 - k)).toFixed(1) + "px," + ((Math.random() - .5) * 10 * (1 - k)).toFixed(1) + "px)"; requestAnimationFrame(f); }; f(); };

  /* ---------- 1. ANHANGÁ ---------- */
  reg("tupa.anhanga", async (X) => {
    const A = M.anhanga; X.msg("sobrenatural", "O vento para de repente. Cheira a brasa vinda da mata."); await X.espera(2.5);
    A.some(); A.apareceDiante(J()); const p = A.pos(); X.alvo({ x: p.x, z: p.z, rotulo: "Anhangá" });
    X.msg("sobrenatural", "Algo branco se move entre as árvores: um cervo gigante, com olhos de brasa."); M.ctx.mostraAviso("Anhangá"); await X.esperaCond(() => X.pertoDe(A.pos(), 10), 600);
    X.alvo(null); const visto = new Set(); let fim = false;
    while(!fim){
      const op = [["Quem é você?", "quem"], ["O que quer dizer “Anhangá”?", "nome"], ["Por que seus olhos são de brasa?", "olhos"], ["Fale da justiça na mata.", "justica"], ["Ver suas metamorfoses", "meta"], ["Encerrar a conversa", "fim"]];
      const r = await X.escolhe("Anhangá, o espírito da mata", op.map(o => o[0]), { etiqueta: "CONVERSA", corpo: ["Os olhos de brasa de Anhangá pulsam devagar. Sem cruz na testa, sem pressa."] }), k = op[r][1];
      if(k === "fim"){ if(!visto.has("justica")){ X.msg("sobrenatural", "Anhangá inclina a galhada: “Ainda não falamos da justiça na mata, Tupã.”"); continue; } fim = true; }
      else if(k === "meta"){ for(const f of ["tatu", "boi", "pirarucu", "humano", "cervo"]){ A.forma(f); X.msg("sobrenatural", "A névoa sobe… Anhangá toma a forma de " + ({ tatu: "um tatu", boi: "um boi", pirarucu: "um pirarucu", humano: "um homem", cervo: "cervo branco" }[f]) + ". Os olhos de brasa continuam os mesmos."); await X.espera(3.6); } visto.add("meta"); }
      else { visto.add(k); X.msg("sobrenatural", "Anhangá: " + TEXTOS.anhangaFalas[k][0]); await X.espera(1); }
    }
    X.msg("sobrenatural", "Anhangá se afasta entre as árvores. A névoa o leva."); await X.espera(2.5); A.some();
  });

  /* ---------- 2. GRITADOR ---------- */
  reg("tupa.gritador", async (X) => {
    const j = J(); X.msg("sobrenatural", "A noite está parada demais. Os grilos se calaram."); await X.espera(3);
    const G = S.gritador = criaGritador(M), q = frente(j, 55, 10); G.coloca(q.x, q.z); G.estado = "parado";
    const grita = (intens = 1) => { const J1 = J(), dx = G.pos().x - J1.x, dz = G.pos().z - J1.z, lado = Math.sin(Math.atan2(dx, dz) - J1.yaw); gritoSom(-lado, intens); tremor(500); msg("sobrenatural", "AAAAAAAAAAH! — o grito vem " + (lado > .3 ? "da esquerda" : lado < -.3 ? "da direita" : "de frente") + ", cada vez mais perto."); };
    await X.espera(1); grita(.7);
    const r = await X.escolhe("O grito vem da escuridão…", ["Gritar de volta", "Ficar em silêncio"], { etiqueta: "NUNCA RESPONDA AO GRITADOR", corpo: ["Dizem que quem responde ao Gritador é levado por ele."] });
    if(r === 0){ G.vel = 7; G.estado = "aproxima"; X.msg("emergencia", "Você respondeu! O Gritador corre na sua direção."); gritoSom(0, 1.3); tremor(900); await X.espera(4); M.missoes.falha("Você respondeu ao Gritador"); G.some(); S.gritador = null; return; }
    X.msg("sobrenatural", "Você prende a respiração. O vulto se vira, procurando de onde veio a resposta que nunca vem."); X.dica("[V] Raio de Tupã — mire de frente para o Gritador"); G.estado = "aproxima";
    let prox = 12, t = 0; const aoMorrer = new Promise(ok => { G.mortoCb = ok; });
    while(!G.morto){ await X.espera(.5); t += .5; prox -= .5; const J1 = J(), d = Math.hypot(G.pos().x - J1.x, G.pos().z - J1.z) / U;
      if(prox <= 0){ grita(.9 + Math.min(.6, (40 - d) / 80)); prox = 11 + Math.random() * 6; } if(d < 3.5){ X.msg("emergencia", "O Gritador te alcança."); gritoSom(0, 1.4); tremor(900); await X.espera(1.5); M.missoes.falha("O Gritador te alcançou"); G.some(); S.gritador = null; return; }
      if(t > 240){ X.msg("sobrenatural", "O Gritador perde o rastro e some na noite. Mas voltará."); G.some(); S.gritador = null; M.missoes.falha("O Gritador escapou"); return; } }
    await X.espera(2.5); X.dica(null); G.some(); S.gritador = null; X.msg("sobrenatural", "O silêncio volta à mata. Dizem que os gritos ajudam a triangular o tesouro dos jesuítas (em breve).");
  });

  /* ---------- 3. BOITATÁ ---------- */
  reg("tupa.boitata", async (X) => {
    const j = J(); X.msg("sobrenatural", "Uma luz baixa, alaranjada, corre ao longe, rente ao chão."); await X.espera(3);
    const B = S.boitata = criaBoitata(M), a0 = frente(j, 38, -14); B.coloca(a0.x, a0.z); let ferido = false; B.aoFerido = () => { ferido = true; B.brava = true; };
    X.msg("sobrenatural", "É o Boitatá: a serpente de fogo que guarda a mata. Não a ataque. Siga-a."); X.dica("Siga o Boitatá (não use poderes contra ele)");
    const dir = j.yaw, rota = [0, 1, 2, 3].map(i => ({ x: a0.x + Math.sin(dir + (i % 2 ? .6 : -.5)) * 55 * U * (i + 1) * .75, z: a0.z + Math.cos(dir + (i % 2 ? .6 : -.5)) * 55 * U * (i + 1) * .75 }));
    for(let i = 0; i < rota.length; i++){ B.vaiPara(rota[i].x, rota[i].z); X.alvo({ x: rota[i].x, z: rota[i].z, rotulo: "Boitatá" });
      const ok = await X.esperaCond(() => { if(ferido) return true; const h = B.pos(), J1 = J(); return Math.hypot(h.x - rota[i].x, h.z - rota[i].z) < 2 * U && Math.hypot(J1.x - h.x, J1.z - h.z) < 18 * U; }, 400);
      if(ferido){ X.msg("emergencia", "O fogo cerca você. O guardião não perdoa quem o fere."); await X.espera(2); B.some(); S.boitata = null; M.missoes.falha("Você feriu o Boitatá"); return; }
      if(!ok){ B.some(); S.boitata = null; M.missoes.falha("Você se perdeu do Boitatá"); return; }
      if(i < rota.length - 1) X.msg("sobrenatural", "O Boitatá espera, os olhos enormes fixos em você, e segue adiante."); }
    X.alvo(null); X.dica(null); const f = rota[rota.length - 1];
    S.fatuo = fogoFatuo(M, f.x, f.z);
    X.msg("sobrenatural", "No fim do caminho dorme o fogo-fátuo: chamas azuladas sobre o chão, onde a terra guarda algo. O Boitatá se enrola em volta delas, protegendo."); await X.espera(4);
    X.msg("sobrenatural", "Ele ergue os olhos de brasa para Tupã e se dissolve em fagulhas."); await X.espera(2.5); B.some(); S.boitata = null; await X.espera(6); if(S.fatuo){ S.fatuo.remove(); S.fatuo = null; }
  });

  M.registra({ tick: (dt, J1) => { if(S.gritador) S.gritador.tick(dt, J1); if(S.boitata) S.boitata.tick(dt, J1); }, desliga: () => { if(S.fatuo) S.fatuo.remove(); if(S.gritador) S.gritador.some(); if(S.boitata) S.boitata.some(); S.gritador = S.boitata = null; } });
  return S;
}
