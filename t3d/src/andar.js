import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, Vector3, Raycaster, MathUtils, Box3, BoxHelper } from "three";

/* ============================================================================================================
   ANDAR COM O PIT
   Modo de caminhada em tela cheia: terceira pessoa (ou primeira), colisão com cerca, casinha e trolley, pulo, corrida e interações.
   Teclado:  setas = andar · Espaço = pular · Shift (ou R) = correr · E = interagir · Q = câmera 1ª/3ª pessoa · Z/X = girar a câmera · C = centralizar · H = ajuda · Esc = sair
   Toque:    direcional na tela (esquerda), arrastar o dedo para olhar, botões Pular / Correr / Interagir.
   ============================================================================================================ */

/* pernas articuladas (quadril e joelho) com bota: substituem as pernas "paradas" do boneco enquanto ele anda */
export function criarPernas(av, m){
  const grupo = new Group(); av.add(grupo); grupo.visible = false;
  const quadril = [], joelho = [];
  const caixa = (g, w, h, d, mat, x, y, z) => { const o = new Mesh(new BoxGeometry(w, h, d), mat); o.position.set(x, y, z); g.add(o); return o; };
  const cil = (g, r1, r2, h, mat, x, y, z) => { const o = new Mesh(new CylinderGeometry(r1, r2, h, 22), mat); o.position.set(x, y, z); g.add(o); return o; };
  [-.52, .55].forEach(x => {
    const q = new Group(); q.position.set(x, 2.5, 0); grupo.add(q); quadril.push(q);
    cil(q, .46, .39, 1.15, m.calca, 0, -.55, 0);                                           // coxa
    caixa(q, .5, .5, .09, m.calca, x < 0 ? -.42 : .42, -.55, .26);                          // bolso cargo
    const j = new Group(); j.position.set(0, -1.1, 0); q.add(j); joelho.push(j);
    cil(j, .39, .35, .78, m.calca, 0, -.3, 0);                                             // canela
    const b = new Group(); b.position.set(0, -1.4, 0); j.add(b);                          // bota (origem no chão)
    caixa(b, .64, .12, 1.22, m.sola, 0, .06, .08);
    const bico = new Mesh(new SphereGeometry(.34, 18, 14), m.bota); bico.position.set(0, .3, .5); bico.scale.set(1, .72, 1.15); b.add(bico);
    caixa(b, .6, .42, .82, m.bota, 0, .33, 0);
    cil(b, .34, .36, .62, m.bota, 0, .72, -.12);
    for(let k = 0; k < 4; k++) caixa(b, .4, .035, .06, m.cad, 0, .48 + k * .1, .3 - k * .1);
    cil(b, .37, .37, .08, m.anel, 0, 1.05, -.12);
  });
  return { grupo, quadril, joelho };
}

const ang = (a) => { while(a > Math.PI) a -= 2 * Math.PI; while(a < -Math.PI) a += 2 * Math.PI; return a; };
const clamp = MathUtils.clamp;

export function criarAndar(c){
  const { cam, ctl, renderer, el, AV: AV0, H, opts, voltar } = c;
  let AV = AV0;
  const cen = H.cen;
  const R = .85;                                                  // raio do Pit nas colisões
  const TAN_MAX = Math.tan(40 * Math.PI / 180);                   // inclinação máxima caminhável (40°)
  let INI = cen.spawn, lugar = "rec";
  /* personagens jogáveis (Pit e Krig) e lugares (deck do recebimento e deck do lançamento) */
  const quem = () => { const l = H.personagens ? H.personagens() : [{ id: "pit", nome: "Pit", p: AV0 }]; return l.filter(x => x.p); };
  let idxP = 0, nomeP = "Pit";
  const spawnDe = (l) => (l === "lan" && cen.spawnLan ? cen.spawnLan : cen.spawn);
  const prepara = (P) => {                                      // guarda a pose original e troca pelas pernas articuladas
    P._st = { x: P.av.position.x, y: P.av.position.y, z: P.av.position.z, yaw: P.av.rotation.y, tx: P.tronco.rotation.x, ty: P.tronco.rotation.y, esc: P.bD.mao.children[0].scale.clone(), rock: P.bD.rock ? P.bD.rock.visible : false, nome: P.nome ? P.nome.rotation.y : 0,
      arm: [P.bD.pv.rotation.clone(), P.bD.co.rotation.clone(), P.bE.pv.rotation.clone(), P.bE.co.rotation.clone()] };
    P.pernasA.grupo.visible = true; P.estat.forEach(o => { o.visible = false; });
    if(P.bD.rock) P.bD.rock.visible = false;
    P.bD.mao.children[0].scale.set(1.08, 1.08, 1.08); P.av.visible = true;
  };
  const restaura = (P) => {                                     // devolve o boneco ao lugar e à pose em que estava
    if(!P._st) return; const o = P._st;
    P.pernasA.grupo.visible = false; P.estat.forEach(x => { x.visible = true; });
    P.bD.pv.rotation.copy(o.arm[0]); P.bD.co.rotation.copy(o.arm[1]); P.bE.pv.rotation.copy(o.arm[2]); P.bE.co.rotation.copy(o.arm[3]);
    if(P.bD.rock) P.bD.rock.visible = o.rock;
    P.bD.mao.children[0].scale.copy(o.esc); P.tronco.rotation.set(o.tx, o.ty, 0); P.av.visible = true;
    P.av.position.set(o.x, o.y, o.z); P.av.rotation.y = o.yaw; if(P.nome) P.nome.rotation.y = o.nome; P._st = null;
  };
  const W = { on: false, x: INI.x, z: INI.z, y: cen.chao(INI.x, INI.z), vy: 0, noChao: true, yaw: INI.yaw, camYaw: Math.PI, camOff: 0, manual: 0, camPitch: .34, dist: 15, fp: false, fpPitch: 0, correr: false, vel: 0, fase: 0, joy: { x: 0, y: 0 }, keys: new Set() };
  const lookAt = new Vector3(), camPos = new Vector3(), tmp = new Vector3(), ray = new Raycaster();
  const toque = (typeof matchMedia === "function" && matchMedia("(pointer:coarse)").matches) || "ontouchstart" in window;

  /* ---- colisores (retângulos no plano do chão; com y1, só bloqueiam quem está abaixo dessa altura) ---- */
  const C = cen.colisores;
  const bate = (x, z, y) => C.some(k => (!k.ativo || k.ativo()) && (k.y1 === undefined || y < k.y1 - .05) && x > k.x0 - R && x < k.x1 + R && z > k.z0 - R && z < k.z1 + R);
  const naCasa = () => cen.dentro(W.x, W.z, -.3);
  const chaoY = cen.chao;

  /* ---- modo CONSTRUIR: o Pit vai até a peça, pega, carrega e solta onde quer; a loja cria itens novos ---- */
  const NOCARRY = new Set(["deck", "portico", "pit"]);
  const B = { on: false, perto: null, carga: null, delta: new Vector3(), anch: 3, dyRel: 0, helper: null, box: new Box3(), t: 0, painel: null, loja: null, rotulo: null };
  const reg = () => (H.editor ? H.editor.registros() : []);
  const centro = (o) => { B.box.setFromObject(o); return B.box.getCenter(new Vector3()); };
  function acharPerto(){
    let melhor = null, md = 1e9;
    for(const r of reg()){
      if(NOCARRY.has(r.id) || !r.obj.visible) continue;
      B.box.setFromObject(r.obj); if(B.box.isEmpty()) continue;
      const dx = Math.max(B.box.min.x - W.x, 0, W.x - B.box.max.x), dz = Math.max(B.box.min.z - W.z, 0, W.z - B.box.max.z), d = Math.hypot(dx, dz), sc = d + .03 * B.box.min.distanceTo(B.box.max);   // empate: a peça menor
      if(d < 3.4 && sc < md){ md = sc; melhor = r; }
    }
    return melhor;
  }
  function mostraHelper(r){
    if(B.helper && B.helper.userData.r !== r){ B.helper.parent && B.helper.parent.remove(B.helper); B.helper = null; }
    if(r && !B.helper){ B.helper = new BoxHelper(r.obj, 0xffa23a); B.helper.userData.r = r; H.cen.grupo.parent.add(B.helper); }
    if(B.helper) B.helper.update();
  }
  function pegar(r){
    if(!r) return; if(H.editor) H.editor.guardaHist();
    const c = centro(r.obj), w = r.obj.getWorldPosition(new Vector3());
    B.delta.set(c.x - w.x, 0, c.z - w.z); B.box.setFromObject(r.obj);
    B.anch = Math.max(2.6, Math.max(B.box.max.x - B.box.min.x, B.box.max.z - B.box.min.z) / 2 + 1.8);
    B.dyRel = w.y - cen.chao(w.x, w.z); B.carga = r; B.perto = null; mostraAviso("Carregando: " + (r.nome || r.id) + " · F/G giram · E solta");
  }
  function soltar(){
    if(!B.carga) return; const r = B.carga; B.carga = null; if(H.editor){ H.editor.refresca(); H.editor.salvaLocal(); }
    mostraAviso("Solto: " + (r.nome || r.id) + " (layout salvo neste navegador)");
  }
  function giraCarga(a){
    const r = B.carga || B.perto; if(!r) return;
    if(r === B.carga){ const c = Math.cos(a), sn = Math.sin(a); const x = B.delta.x * c + B.delta.z * sn, z = -B.delta.x * sn + B.delta.z * c; B.delta.x = x; B.delta.z = z; }
    r.obj.rotation.y += a; if(H.editor) H.editor.refresca();
  }
  function apagaCarga(){ const r = B.carga || B.perto; if(!r) return; if(H.editor){ H.editor.guardaHist(); H.editor.remove(r); H.editor.salvaLocal(); } if(B.carga === r) B.carga = null; B.perto = null; mostraAviso("Excluído: " + (r.nome || r.id)); }
  function constroiTick(dt){
    if(!B.on || !H.editor) return;
    if(B.carga){
      const o = B.carga.obj;
      if(B.carga.trilho){ o.position.x = W.x; if(B.carga.ajusta) B.carga.ajusta(); mostraHelper(B.carga); B.perto = null; if(rotuloC) rotuloC.textContent = "Deslizando o trolley pelo cabo 07 (solte com E)"; return; }
      const f = new Vector3(Math.sin(W.yaw), 0, Math.cos(W.yaw)), tx = W.x + f.x * B.anch, tz = W.z + f.z * B.anch;
      const wy = cen.chao(tx, tz) + B.dyRel, tgt = new Vector3(tx - B.delta.x, wy, tz - B.delta.z);
      if(o.parent) o.parent.updateWorldMatrix(true, false); o.position.copy(o.parent ? o.parent.worldToLocal(tgt) : tgt);
      mostraHelper(B.carga); B.perto = null;
    } else {
      B.t -= dt; if(B.t <= 0){ B.t = .25; B.perto = acharPerto(); }
      mostraHelper(B.perto);
    }
    if(rotuloC) rotuloC.textContent = B.carga ? "Carregando: " + (B.carga.nome || B.carga.id) : B.perto ? "Perto de: " + (B.perto.nome || B.perto.id) : "Chegue perto de uma peça para pegar";
    if(btnPega) btnPega.textContent = B.carga ? "✋ Soltar" : "🤲 Pegar";
  }
  let rotuloC = null, btnPega = null;
  function montaConstruir(){
    if(B.painel) return;
    B.painel = mk("position:absolute;left:10px;top:60px;width:min(260px,46%);display:flex;flex-direction:column;gap:6px;pointer-events:none;", undefined, ui);
    rotuloC = mk("background:rgba(18,19,14,.9);border:1.5px solid #e0883a;border-radius:10px;padding:7px 10px;color:#ffd7a8;pointer-events:none;", "", B.painel);
    const linha = () => mk("display:flex;gap:6px;flex-wrap:wrap;pointer-events:none;", undefined, B.painel);
    const bt = (t, fn, p, rot) => { const x = mk(BTN + "padding:8px 10px;min-width:40px;", t, p); x.setAttribute("role", "button"); if(rot) x.setAttribute("aria-label", rot); x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(); }); return x; };
    let l = linha(); btnPega = bt("🤲 Pegar", () => { if(B.carga) soltar(); else pegar(B.perto); }, l); bt("⟲", () => giraCarga(Math.PI / 12), l, "Girar para a esquerda"); bt("⟳", () => giraCarga(-Math.PI / 12), l, "Girar para a direita"); bt("🗑", apagaCarga, l, "Excluir");
    l = linha(); bt("🛒 Loja", () => { B.loja.style.display = B.loja.style.display === "none" ? "block" : "none"; }, l); bt("🛠 Editor completo", () => { const ed = H.editor; desligar(); if(ed) setTimeout(() => ed.editar(true), 50); }, l);
    B.loja = mk("display:none;max-height:44vh;overflow:auto;background:rgba(18,19,14,.92);border:1.5px solid #3a3f27;border-radius:10px;padding:6px;pointer-events:auto;", undefined, B.painel);
    B.loja.addEventListener("pointerdown", e => e.stopPropagation()); B.loja.addEventListener("wheel", e => e.stopPropagation(), { passive: true });
    let g0 = ""; (H.editor ? H.editor.catalogo() : []).forEach(it => { if(it.grupo !== g0){ g0 = it.grupo; mk("color:#e0883a;margin:8px 0 2px;text-transform:uppercase;font-size:11px;", g0, B.loja); }
      const x = mk(BTN + "display:block;width:100%;text-align:left;margin:3px 0;padding:7px 9px;", "+ " + it.nome, B.loja); x.setAttribute("role", "button");
      x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if(B.carga) soltar(); const r = H.editor.criar(it.tipo); if(!r) return; r.obj.position.set(W.x, cen.chao(W.x, W.z), W.z); B.loja.style.display = "none"; pegar(r); }); });
  }
  function alternaConstruir(){
    B.on = !B.on; if(bConstruir) bConstruir.style.borderColor = B.on ? "#e0883a" : "#8a9a3b";
    if(B.on){ montaConstruir(); B.painel.style.display = "flex"; mostraAviso("Modo construir: chegue perto de uma peça e toque em Pegar (ou E)"); }
    else { if(B.carga) soltar(); B.painel && (B.painel.style.display = "none"); mostraHelper(null); B.perto = null; }
  }
  function limpaConstruir(){ if(B.carga) soltar(); B.on = false; B.perto = null; if(B.helper){ B.helper.parent && B.helper.parent.remove(B.helper); B.helper = null; } B.painel = null; B.loja = null; rotuloC = btnPega = null; }
  let bConstruir = null;

  /* ---- interações ---- */
  let avisoT = 0, aviso = null;
  const mostraAviso = (t) => { if(!aviso) return; aviso.textContent = t; aviso.style.opacity = "1"; clearTimeout(avisoT); avisoT = setTimeout(() => { if(aviso) aviso.style.opacity = "0"; }, 3200); };
  const emite = (id, padrao) => { if(opts && opts.aoInteragir && opts.aoInteragir(id) === true) return; padrao(); };
  const ir = (alvo) => { desligar(); if(opts && opts.aoIr) opts.aoIr(alvo); else { try{ parent.postMessage({ sgv: "ir", alvo }, "*"); }catch(_){ /* sem página-mãe */ } } };
  H.irPara = ir;                                                                     // missões: "Operar na Tirolesa" abre o jogo (Iniciar Turno) na página
  const ACOES = {
    trolley: () => emite("trolley", () => { desligar(); if(H.vistaFrente) H.vistaFrente(); }),
    computador: () => emite("computador", abrirComputador)
  };
  const todos = () => cen.hotspots.map(h => (h.id === "trolley" && opts && opts.rotuloTrolley ? { ...h, rotulo: () => opts.rotuloTrolley } : h));
  const APPS = (opts && opts.apps) || [["CheckList do Trolley · 3B", "trolcheck"], ["Relatório de Frenagem", "frenagem"], ["Trolley (peças)", "trolley"], ["Escala", "escala"], ["Procedimento · PAE · Memorial", "docs"]];
  let atual = null, painelPc = null;
  const interagir = () => {
    if(painelPc) return;
    if(B.on && (B.carga || B.perto)){ if(B.carga) soltar(); else pegar(B.perto); return; }
    if(!atual) return;
    if(ACOES[atual.id]) ACOES[atual.id]();
    else if(atual.acao) atual.acao();
    else if(atual.msg) mostraAviso(atual.msg);
  };

  /* ---- interface (DOM com estilo embutido: funciona em qualquer página) ---- */
  const FONTE = "font:600 13px ui-monospace,Consolas,'Courier New',monospace;color:#c9d28a;";
  const mk = (css, txt, pai, tag = "div") => { const e = document.createElement(tag); e.style.cssText = css; if(txt !== undefined) e.textContent = txt; if(pai) pai.appendChild(e); return e; };
  const BTN = "pointer-events:auto;user-select:none;-webkit-user-select:none;touch-action:none;cursor:pointer;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.72);color:#e9efc0;border-radius:14px;text-align:center;" + FONTE;
  let bPers = null, bLugar = null, bClima = null, titulo = null;
  let ui = null, joyBase = null, joyKnob = null, dica = null, ajuda = null, btnCorrer = null, btnInter = null;
  function montaUI(){
    ui = mk("position:absolute;inset:0;pointer-events:none;z-index:30;" + FONTE, undefined, el);
    const topo = mk("position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;pointer-events:none;", undefined, ui);
    titulo = mk("pointer-events:none;background:rgba(18,19,14,.72);border:1.5px solid #8a9a3b;border-radius:12px;padding:7px 12px;color:#e0883a;letter-spacing:.6px;text-transform:uppercase;", "Andando com " + nomeP, topo);
    mk("flex:1", undefined, topo);
    const b = (t, fn, rot) => { const x = mk(BTN + "padding:9px 13px;min-width:44px;", t, topo); x.setAttribute("role", "button"); x.setAttribute("aria-label", rot); x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(); }); return x; };
    bClima = b("☁", () => { cen.proximoClima(); try{ localStorage.setItem("sgv:clima2", cen.climaAtual()); }catch(_){ /* sem armazenamento */ } atualizaTitulo(); mostraAviso("Clima: " + cen.climas[cen.climaAtual()].nome); }, "Trocar o clima");
    bPers = b("👤 " + nomeP, () => trocaPersonagem(), "Trocar de personagem"); bLugar = b("📍 Recebimento", () => trocaLugar(), "Trocar de lugar"); atualizaTitulo();
    bConstruir = b("🔨", () => alternaConstruir(), "Construir: pegar, carregar e soltar peças do cenário"); bConstruir.style.minWidth = "36px"; bConstruir.style.padding = "9px 10px"; bConstruir.title = "Construir (B)";
    b("?", () => alternaAjuda(), "Ajuda"); b("👁", () => alternaCamera(), "Alternar câmera"); b("✕ Sair", () => desligar(), "Sair");
    dica = mk("position:absolute;left:50%;bottom:" + (toque ? "150px" : "46px") + ";transform:translateX(-50%);pointer-events:none;background:rgba(18,19,14,.82);border:1.5px solid #e0883a;border-radius:12px;padding:9px 16px;color:#ffd7a8;display:none;white-space:nowrap;max-width:92%;pointer-events:auto;cursor:pointer;", "", ui);
    dica.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); interagir(); });
    aviso = mk("position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:86%;text-align:center;pointer-events:none;background:rgba(18,19,14,.86);border:1.5px solid #8a9a3b;border-radius:12px;padding:9px 16px;opacity:0;transition:opacity .25s;", "", ui);
    ajuda = mk("position:absolute;left:12px;bottom:12px;pointer-events:none;background:rgba(18,19,14,.82);border:1.5px solid #3a3f27;border-radius:12px;padding:10px 14px;line-height:1.7;display:" + (toque ? "none" : "block") + ";", undefined, ui);
    ["↑ ↓   andar · ← →   girar (a câmera acompanha)", "Espaço    pular", "Shift / R   correr", "E   interagir", "Q   câmera 1ª / 3ª pessoa", "Z X / mouse   olhar em volta · C atrás do Pit", "B   construir (pegar/carregar peças) · F G girar · E pegar/soltar", "H   esconder esta ajuda · Esc   sair"].forEach(t => mk("white-space:pre;", t, ajuda));
    if(!toque) setTimeout(() => { if(ajuda && W.on) ajuda.style.opacity = ".55"; }, 7000);
    if(toque) montaToque();
  }
  function montaToque(){
    joyBase = mk("position:absolute;left:22px;bottom:26px;width:132px;height:132px;border-radius:50%;border:2px solid rgba(138,154,59,.8);background:rgba(18,19,14,.45);pointer-events:auto;touch-action:none;", undefined, ui);
    joyKnob = mk("position:absolute;left:41px;top:41px;width:50px;height:50px;border-radius:50%;background:rgba(224,136,58,.85);border:2px solid #ffd7a8;pointer-events:none;", undefined, joyBase);
    let pid = null;
    const mover = (e) => { const r = joyBase.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / 50, dy = (e.clientY - cy) / 50; const n = Math.hypot(dx, dy); if(n > 1){ dx /= n; dy /= n; }
      joyKnob.style.transform = `translate(${dx * 41}px,${dy * 41}px)`; W.joy.x = Math.abs(dx) < .12 ? 0 : dx; W.joy.y = Math.abs(dy) < .12 ? 0 : -dy; };
    joyBase.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); pid = e.pointerId; try{ joyBase.setPointerCapture(pid); }catch(_){ /* sem captura */ } mover(e); });
    joyBase.addEventListener("pointermove", e => { if(e.pointerId === pid) mover(e); });
    const fim = (e) => { if(e.pointerId !== pid) return; pid = null; joyKnob.style.transform = ""; W.joy.x = W.joy.y = 0; };
    joyBase.addEventListener("pointerup", fim); joyBase.addEventListener("pointercancel", fim);
    const grande = (t, css, fn) => { const x = mk(BTN + "position:absolute;display:grid;place-items:center;" + css, t, ui); x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(x); }); return x; };
    grande("PULAR", "right:24px;bottom:34px;width:92px;height:92px;border-radius:50%;font-size:14px;", () => pular());
    btnCorrer = grande("CORRER", "right:132px;bottom:26px;width:76px;height:76px;border-radius:50%;font-size:12px;", () => { W.correr = !W.correr; atualizaBotoes(); });
    btnInter = grande("INTERAGIR", "right:34px;bottom:140px;width:100px;height:62px;font-size:12px;", () => interagir());
    atualizaBotoes();
  }
  function atualizaBotoes(){ if(btnCorrer) btnCorrer.style.background = W.correr ? "rgba(224,136,58,.85)" : "rgba(18,19,14,.72)"; }
  function alternaAjuda(){ if(!ajuda) return; ajuda.style.display = ajuda.style.display === "none" ? "block" : "none"; ajuda.style.opacity = "1"; }
  /* o que o "mundo vivo" (fauna, gente, mapa, fotos) precisa saber e fazer dentro do modo andar */
  function ctxMundo(){
    return { mk, BTN, FONTE, toque, mostraAviso, construindo: () => B.on, fp: () => W.fp, setFp: (on) => { if(W.fp !== on){ W.fp = on; W.fpPitch = 0; AV.av.visible = !on; } }, olhar: () => ({ yaw: W.camYaw, pitch: W.fp ? W.fpPitch : 0 }),
      soltaTeclas: () => { W.keys.clear(); W.joy.x = W.joy.y = 0; W.vel = 0; }, teleporta: (x, z) => { W.x = x; W.z = z; W.y = cen.chao(x, z); W.vy = 0; W.noChao = true; W.snap = true; AV.av.position.set(W.x, W.y, W.z); },
      correndo: () => Math.abs(W.vel) > 11, avatar: () => AV };
  }
  function alternaCamera(){ W.fp = !W.fp; W.fpPitch = 0; AV.av.visible = !W.fp; mostraAviso(W.fp ? "Primeira pessoa" : "Terceira pessoa"); }

  /* ---- computador da casinha ---- */
  function abrirComputador(){
    if(!ui) return;
    painelPc = mk("position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,6,3,.72);pointer-events:auto;z-index:40;", undefined, ui);
    const cx = mk("width:min(440px,92%);border:2px solid #e0883a;border-radius:16px;background:linear-gradient(170deg,#1b1d15,#23261b);padding:18px;box-shadow:0 0 40px rgba(224,136,58,.3);", undefined, painelPc);
    mk("font-size:16px;color:#e0883a;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;", "Computador do receptivo", cx);
    mk("color:#8f9a5c;font-size:12px;margin-bottom:12px;", "Escolha o que abrir no sistema:", cx);
    APPS.forEach(([rot, alvo]) => { const b = mk(BTN + "padding:11px 14px;margin:6px 0;text-align:left;", rot, cx); b.setAttribute("role", "button"); b.addEventListener("pointerdown", e => { e.preventDefault(); fechaComputador(); ir(alvo); }); });
    const f = mk(BTN + "padding:10px 14px;margin-top:12px;border-color:#3a3f27;", "Fechar (Esc)", cx); f.setAttribute("role", "button"); f.addEventListener("pointerdown", e => { e.preventDefault(); fechaComputador(); });
  }
  function fechaComputador(){ if(painelPc){ painelPc.remove(); painelPc = null; } }

  /* ---- entrada: teclado, mouse e toque para olhar ---- */
  const TECLAS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
  function aoTeclaBaixo(e){
    if(!W.on) return;
    if(painelPc){ if(e.code === "Escape"){ fechaComputador(); e.preventDefault(); } return; }
    if(H.mundo && H.mundo.tecla(e)){ return; }                       // F3, depuração, modo foto, mapa (M)
    if(W.cinema){ if(H.cinemaTecla) H.cinemaTecla(e); e.preventDefault(); return; }       // cena de missão em andamento: o jogador só assiste (Esc pula, se a cena deixar)
    if(TECLAS.has(e.code)) e.preventDefault();
    const repetiu = e.repeat; W.keys.add(e.code);
    if(repetiu) return;
    switch(e.code){
      case "Space": pular(); break;
      case "KeyE": interagir(); break;
      case "KeyQ": alternaCamera(); break;
      case "KeyR": W.correr = !W.correr; atualizaBotoes(); mostraAviso(W.correr ? "Correndo" : "Andando"); break;
      case "KeyC": W.camOff = 0; W.manual = 0; W.camPitch = .34; break;
      case "KeyH": alternaAjuda(); break;
      case "KeyB": alternaConstruir(); break;
      case "KeyF": if(B.on) giraCarga(Math.PI / 12); break;
      case "KeyG": if(B.on) giraCarga(-Math.PI / 12); break;
      case "Delete": case "Backspace": if(B.on) apagaCarga(); break;
      case "Escape": if(!document.fullscreenElement) desligar(); break;
      default: break;
    }
  }
  function aoTeclaCima(e){ W.keys.delete(e.code); }
  let arrasta = null;
  const cv = renderer.domElement;
  function aoPonteiroBaixo(e){ if(!W.on || painelPc) return; if(e.pointerType === "mouse" && e.button !== 0) return; arrasta = { id: e.pointerId, x: e.clientX, y: e.clientY }; try{ cv.setPointerCapture(e.pointerId); }catch(_){ /* sem captura */ } }
  function aoPonteiroMove(e){
    if(!W.on || !arrasta || e.pointerId !== arrasta.id) return;
    const dx = e.clientX - arrasta.x, dy = e.clientY - arrasta.y; arrasta.x = e.clientX; arrasta.y = e.clientY;
    W.camOff -= dx * .0065; W.manual = 2.2;
    if(W.fp) W.fpPitch = clamp(W.fpPitch - dy * .005, -1.2, 1.2); else W.camPitch = clamp(W.camPitch + dy * .005, .06, 1.3);
  }
  function aoPonteiroCima(e){ if(arrasta && e.pointerId === arrasta.id) arrasta = null; }
  function aoRoda(e){ if(!W.on) return; e.preventDefault(); W.dist = clamp(W.dist + e.deltaY * .01, 7, 30); }
  let usouFs = false, estiloAntes = null;
  function aoTelaCheia(){ if(W.on && usouFs && !document.fullscreenElement){ usouFs = false; desligar(); } }

  /* ---- tela cheia (com plano B para navegadores que não deixam, como o iPhone) ---- */
  function entraTelaCheia(){
    const f = el.requestFullscreen || el.webkitRequestFullscreen;
    const plano = () => { if(estiloAntes === null){ estiloAntes = el.style.cssText; el.style.cssText += ";position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:2147483000;background:#0b0c08;"; try{ if(parent !== window) parent.postMessage({ sgv: "tela-cheia", on: true }, "*"); }catch(_){ /* sem página-mãe */ } } };
    if(!f){ plano(); return; }
    try{ const p = f.call(el); usouFs = true; if(p && p.catch) p.catch(() => { usouFs = false; plano(); }); }catch(_){ usouFs = false; plano(); }
  }
  function saiTelaCheia(){
    if(document.fullscreenElement === el){ usouFs = false; try{ document.exitFullscreen(); }catch(_){ /* já saiu */ } }
    if(estiloAntes !== null){ el.style.cssText = estiloAntes; estiloAntes = null; try{ if(parent !== window) parent.postMessage({ sgv: "tela-cheia", on: false }, "*"); }catch(_){ /* sem página-mãe */ } }
  }

  /* ---- movimento ---- */
  function pular(){ if(W.noChao){ W.vy = 15.5; W.noChao = false; } }
  function entrada(){
    const k = W.keys; let ix = 0, iy = 0;
    if(k.has("ArrowLeft")) ix -= 1;
    if(k.has("ArrowRight")) ix += 1;
    if(k.has("ArrowUp")) iy += 1;
    if(k.has("ArrowDown")) iy -= 1;
    ix += W.joy.x; iy += W.joy.y;
    const n = Math.hypot(ix, iy); if(n > 1){ ix /= n; iy /= n; }
    if(k.has("KeyZ")){ W.camOff += .03; W.manual = 1.2; }
    if(k.has("KeyX")){ W.camOff -= .03; W.manual = 1.2; }
    return { ix, iy, mag: Math.min(1, Math.hypot(ix, iy)), corre: W.correr || k.has("ShiftLeft") || k.has("ShiftRight") };
  }
  function passo(dt){
    /* estilo 3ª pessoa de jogo: ← → giram o Pit (a câmera acompanha por trás), ↑ anda para a frente, ↓ dá ré. Sem precisar do mouse. */
    const { ix, iy, corre } = entrada();
    W.yaw += -ix * (corre ? 2.6 : 2.2) * dt;
    const fv = cen.extraChao && cen.extraChao.fatorVel ? cen.extraChao.fatorVel(W.x, W.z, W.y) : 1;                         // turfeira: lento e encharcado
    const fa = cen.extraChao && cen.extraChao.fatorAgua ? cen.extraChao.fatorAgua(W.x, W.z, W.y) : 1;                         // água rasa: lento (canela/joelho)
    const fm = cen.extraChao && cen.extraChao.velMult ? cen.extraChao.velMult() : 1;                                           // transformação do operador (ex.: Krig 2×)
    const alvoV = (iy > 0 ? (corre ? 17 : 6.3) * iy : iy < 0 ? 3 * iy : 0) * fv * fa * fm;
    W.vel += (alvoV - W.vel) * Math.min(1, dt * 9);
    if(Math.abs(W.vel) > .05){
      const mx = Math.sin(W.yaw), mz = Math.cos(W.yaw);
      /* relevo: sobe mais devagar e desce um pouco mais rápido; acima de ~40° é parede (não sobe, desliza para trás) */
      const noTerreno = Math.abs(W.y - cen.relevo(W.x, W.z)) < 1.6, h0 = cen.relevo(W.x, W.z);
      const decl = noTerreno ? (cen.relevo(W.x + mx * 2, W.z + mz * 2) - h0) / 2 * Math.sign(W.vel) : 0;
      const f = clamp(1 - decl * .55, .62, 1.12);
      const dx = mx * W.vel * f * dt, dz = mz * W.vel * f * dt;
      const sobeOk = (nx, nz) => { if(!noTerreno) return true; const l = Math.hypot(nx - W.x, nz - W.z); return l < 1e-6 || (cen.relevo(nx, nz) - h0) / l <= TAN_MAX; };
      const fundo = (nx, nz) => { const b = cen.extraChao && cen.extraChao.bloqueado; if(b && b(nx, nz) && !b(W.x, W.z)){ if(!W.avisoAgua || performance.now() - W.avisoAgua > 3500){ W.avisoAgua = performance.now(); mostraAviso((cen.extraChao.motivoBloqueio && cen.extraChao.motivoBloqueio(nx, nz)) || "Água funda: só dá para andar no raso"); } return true; } return false; };       // não entra no fundo
      const preso = bate(W.x, W.z, W.y);                               // se por algum motivo já está encostado, deixa sair
      let moveu = 0;
      if(preso || (!bate(W.x + dx, W.z, W.y) && sobeOk(W.x + dx, W.z) && !fundo(W.x + dx, W.z))){ W.x += dx; moveu++; }
      if(preso || (!bate(W.x, W.z + dz, W.y) && sobeOk(W.x, W.z + dz) && !fundo(W.x, W.z + dz))){ W.z += dz; moveu++; }
      if(!moveu && noTerreno && !sobeOk(W.x + dx, W.z + dz)){ W.x -= dx * .35; W.z -= dz * .35; W.vel *= .6; }          // parede íngreme: escorrega um pouco para trás
    }
    if(cen.extraChao && cen.extraChao.limite){ const q = cen.extraChao.limite(W.x, W.z); W.x = q[0]; W.z = q[1]; } else { W.x = clamp(W.x, -1450, 3350); W.z = clamp(W.z, -960, 3750); }       // limites do mundo (a estrada para a cidade amplia o mapa ao longo do corredor)
    const chao = chaoY(W.x, W.z, W.y);
    if(!W.noChao){ W.vy -= 46 * dt; W.y += W.vy * dt; if(W.y <= chao){ W.y = chao; W.vy = 0; W.noChao = true; } }
    else if(chao > W.y && chao - W.y < 1.5){ W.y = chao - W.y < .6 ? W.y + (chao - W.y) * Math.min(1, dt * 45) : chao; }          // degrau (escada do deck) · subida do terreno, suavizada
    else if(W.y > chao + .01){ W.noChao = false; W.vy = 0; }       // saiu da borda do deck: cai
    else W.y = Math.abs(chao - W.y) < .6 ? W.y + (chao - W.y) * Math.min(1, dt * 45) : chao;
    W.fase += dt * (3 + Math.abs(W.vel) * .55) * (W.vel < -.1 ? -1 : 1);
  }
  function pose(){
    const av = AV.av, a = clamp(Math.abs(W.vel) / 17, 0, 1), passoK = Math.min(1, Math.abs(W.vel) / 6.3);
    const amp = .5 * passoK + .62 * a, f = W.fase, noAr = !W.noChao;
    const [qD, qE] = AV.pernasA.quadril, [jD, jE] = AV.pernasA.joelho;
    if(noAr){ qD.rotation.x = -.7; qE.rotation.x = -.35; jD.rotation.x = .9; jE.rotation.x = .6; }
    else { qD.rotation.x = Math.sin(f) * amp; qE.rotation.x = -Math.sin(f) * amp; jD.rotation.x = Math.max(0, -Math.cos(f)) * amp * 1.5; jE.rotation.x = Math.max(0, Math.cos(f)) * amp * 1.5; }
    const sw = noAr ? 0 : Math.sin(f) * amp;
    AV.bD.pv.rotation.set(noAr ? -.9 : sw * .9, 0, -.14); AV.bE.pv.rotation.set(noAr ? -.9 : -sw * .9, 0, .14);
    AV.bD.co.rotation.set(-.25 - amp * .7, 0, 0); AV.bE.co.rotation.set(-.25 - amp * .7, 0, 0);
    if(B.carga){ AV.bD.pv.rotation.set(-1.45, 0, -.12); AV.bE.pv.rotation.set(-1.45, 0, .12); AV.bD.co.rotation.set(-.2, 0, 0); AV.bE.co.rotation.set(-.2, 0, 0); }
    AV.tronco.rotation.x = .02 + a * .2; AV.tronco.rotation.y = noAr ? 0 : -Math.sin(f) * amp * .25;
    const bob = noAr || Math.abs(W.vel) < .3 ? 0 : Math.abs(Math.cos(f)) * (.1 + a * .12);
    av.position.set(W.x, W.y + bob, W.z); av.rotation.y = W.yaw;
    if(AV.nome) AV.nome.rotation.y = W.camYaw - W.yaw;                  // o nome sempre de frente para a câmera
  }
  function camera(dt){
    if(W.camLivre) return;                                       // depuração/testes: a câmera fica por conta de quem chama
    /* a câmera volta sozinha para trás do Pit; o mouse/dedo ou Z X só a desviam por um tempo */
    if(W.manual > 0) W.manual -= dt; else W.camOff -= W.camOff * Math.min(1, dt * (Math.abs(W.vel) > .5 ? 3.2 : 1.4));
    W.camOff = clamp(W.camOff, -Math.PI, Math.PI);
    const alvoYaw = W.yaw + Math.PI + W.camOff;
    if(W.snap) W.camYaw = alvoYaw; else W.camYaw += ang(alvoYaw - W.camYaw) * Math.min(1, dt * 7);
    if(W.fp){
      const dx = -Math.sin(W.camYaw) * Math.cos(W.fpPitch), dz = -Math.cos(W.camYaw) * Math.cos(W.fpPitch), dy = Math.sin(W.fpPitch);
      camPos.set(W.x - Math.sin(W.camYaw) * .6, W.y + 4.85, W.z - Math.cos(W.camYaw) * .6);
      cam.position.copy(camPos); lookAt.set(camPos.x + dx * 10, camPos.y + dy * 10, camPos.z + dz * 10); cam.lookAt(lookAt);
      const fov = (H.mundo && H.mundo.fovFoto && H.mundo.fovFoto()) || 70;
      if(cam.fov !== fov){ cam.fov = fov; cam.updateProjectionMatrix(); }
      return;
    }
    if(cam.fov !== 50){ cam.fov = 50; cam.updateProjectionMatrix(); }
    const dentro = naCasa();
    const dist = dentro ? Math.min(W.dist, 10) : W.dist, pit = dentro ? Math.max(W.camPitch, .62) : W.camPitch;
    const dx = Math.sin(W.camYaw) * Math.cos(pit), dy = Math.sin(pit), dz = Math.cos(W.camYaw) * Math.cos(pit);
    lookAt.set(W.x, W.y + 3.5, W.z);
    let d = dist;
    if(!dentro){                                                  // a câmera não atravessa as paredes da casinha
      tmp.set(dx, dy, dz).normalize(); ray.set(lookAt, tmp); ray.far = dist;
      const h = ray.intersectObjects(cen.paredes, false)[0]; if(h) d = Math.max(3, h.distance - .5);
    }
    tmp.set(lookAt.x + dx * d, Math.max(cen.chaoNivel + .8, lookAt.y + dy * d), lookAt.z + dz * d);
    /* a câmera não atravessa o relevo: se a linha até o Pit passa por dentro do terreno, ela se aproxima (e nunca fica abaixo do chão) */
    { let fr = 1; for(let i = 1; i <= 10; i++){ const t = i / 10, px = lookAt.x + (tmp.x - lookAt.x) * t, pz = lookAt.z + (tmp.z - lookAt.z) * t, py = lookAt.y + (tmp.y - lookAt.y) * t; if(py < cen.relevo(px, pz) + 1.4){ fr = Math.max(.1, (i - 1) / 10); break; } }
      if(fr < 1) tmp.set(lookAt.x + (tmp.x - lookAt.x) * fr, lookAt.y + (tmp.y - lookAt.y) * fr, lookAt.z + (tmp.z - lookAt.z) * fr);
      tmp.y = Math.max(tmp.y, cen.relevo(tmp.x, tmp.z) + 1.4); }
    if(W.snap){ cam.position.copy(tmp); W.snap = false; } else cam.position.lerp(tmp, Math.min(1, dt * 12));
    cam.lookAt(lookAt);
  }
  function mira(){
    let melhor = null, md = 1e9;
    for(const p of todos()){ const d = Math.hypot(W.x - p.x, W.z - p.z); if(d < p.r && d < md){ md = d; melhor = p; } }
    atual = melhor;
    if(!dica) return;
    if(B.on && (B.carga || B.perto)){ dica.style.display = "block"; dica.textContent = (toque ? "" : "[E] ") + (B.carga ? "Soltar " + (B.carga.nome || B.carga.id) : "Pegar " + (B.perto.nome || B.perto.id)); if(btnInter) btnInter.style.borderColor = "#e0883a"; return; }
    if(melhor){ dica.style.display = "block"; dica.textContent = (toque ? "" : "[E] ") + melhor.rotulo(); if(btnInter) btnInter.style.borderColor = "#e0883a"; }
    else { dica.style.display = "none"; if(btnInter) btnInter.style.borderColor = "#8a9a3b"; }
  }

  /* ---- escala real: o trolley (modelo ampliado para estudo) encolhe e fica coberto pela lona, como na plataforma ---- */
  function modoReal(on){
    cen.lona.visible = false;
    if(H.trolleyModo) H.trolleyModo(on);                          // o trolley fica em escala real, no cabo 07 (ou volta ao estudo ampliado)
  }

  function atualizaTitulo(){ if(titulo) titulo.textContent = "Andando com " + nomeP; if(bPers) bPers.textContent = "👤 " + nomeP; if(bClima) bClima.textContent = { ciclo: "🕒", nublado: "☁", dia: "☀", poente: "🌇" }[cen.climaAtual()]; if(bLugar) bLugar.textContent = "📍 " + (lugar === "lan" ? "Lançamento" : "Recebimento"); }
  function colocaNoLugar(){
    INI = spawnDe(lugar); const off = nomeP === "Krig" ? 2.4 : 0;
    Object.assign(W, { x: INI.x + off, z: INI.z, y: cen.chao(INI.x + off, INI.z), yaw: INI.yaw, vy: 0, noChao: true, vel: 0, camOff: 0, manual: 0, snap: true });
    AV.av.position.set(W.x, W.y, W.z); AV.av.rotation.y = W.yaw;
  }
  function trocaPersonagem(){
    if(H.abreTrocaPersonagem && H.abreTrocaPersonagem()) return;                                   // CanyonFly: tela de escolha de personagem
    const l = quem(); if(l.length < 2) return; restaura(AV);
    idxP = (idxP + 1) % l.length; AV = l[idxP].p; nomeP = l[idxP].nome; prepara(AV); colocaNoLugar(); atualizaTitulo(); mostraAviso("Agora você é o " + nomeP);
  }
  /* escolhe um personagem pelo id (CanyonFly: personagens desbloqueados) */
  function escolhePersonagem(id){ const l = quem(), k = l.findIndex(x => x.id === id); if(k < 0 || l[k].p === AV) return false; const velho = AV; restaura(velho); idxP = k; AV = l[k].p; nomeP = l[k].nome; prepara(AV); AV.av.position.set(W.x, W.y, W.z); AV.av.rotation.y = W.yaw; W.snap = true; afastaDoNovo(velho); atualizaTitulo(); mostraAviso("Agora você é " + nomeP); return true; }
  /* o boneco que ficou para trás volta ao seu posto; se o posto é onde o jogador está, ele dá um passo para o lado (senão os dois ficam sobrepostos) */
  function afastaDoNovo(velho){ const p = velho.av.position; if(Math.hypot(p.x - W.x, p.z - W.z) > 4.5) return; const c = Math.cos(W.yaw), s = Math.sin(W.yaw), cand = [[p.x + c * 4.5, p.z - s * 4.5], [p.x - c * 4.5, p.z + s * 4.5]];
    cand.sort((a, b) => Math.abs(cen.chao(a[0], a[1]) - p.y) - Math.abs(cen.chao(b[0], b[1]) - p.y)); p.x = cand[0][0]; p.z = cand[0][1]; }       // mantém a posição (não volta ao recebimento)
  function trocaLugar(){ lugar = lugar === "rec" ? "lan" : "rec"; colocaNoLugar(); atualizaTitulo(); mostraAviso(lugar === "lan" ? "Deck do lançamento (do outro lado do vão)" : "Deck do recebimento"); }

  /* ---- ligar / desligar ---- */
  const salvo = { arm: null };
  function ligar(){
    if(W.on) return true;
    Object.assign(W, { on: true, x: INI.x, z: INI.z, y: cen.chao(INI.x, INI.z), yaw: INI.yaw, vy: 0, noChao: true, vel: 0, fase: 0, fp: false, correr: false, camYaw: Math.PI + INI.yaw, camOff: 0, manual: 0, camPitch: .34, dist: 15, snap: true });
    W.keys.clear(); W.joy.x = W.joy.y = 0;
    ctl.enabled = false;
    /* boneco: saem as pernas "paradas", entram as articuladas e os braços ficam soltos */
    const l0 = quem(); if(!l0.some(x => x.p === AV)){ idxP = 0; AV = l0[0].p; nomeP = l0[0].nome; } else idxP = l0.findIndex(x => x.p === AV);
    prepara(AV); if(opts && opts.lugarInicial) lugar = opts.lugarInicial; colocaNoLugar();
    lookAt.set(W.x, W.y + 3.5, W.z);
    modoReal(true);
    montaUI(); entraTelaCheia();
    if(H.mundo) H.mundo.liga(ui, ctxMundo());
    window.addEventListener("keydown", aoTeclaBaixo, true); window.addEventListener("keyup", aoTeclaCima, true);
    cv.addEventListener("pointerdown", aoPonteiroBaixo); cv.addEventListener("pointermove", aoPonteiroMove); cv.addEventListener("pointerup", aoPonteiroCima); cv.addEventListener("pointercancel", aoPonteiroCima);
    cv.addEventListener("wheel", aoRoda, { passive: false }); document.addEventListener("fullscreenchange", aoTelaCheia);
    if(opts && opts.aoAndar) opts.aoAndar(true);
    return true;
  }
  function desligar(){
    if(!W.on) return;
    limpaConstruir(); W.on = false; fechaComputador();
    window.removeEventListener("keydown", aoTeclaBaixo, true); window.removeEventListener("keyup", aoTeclaCima, true);
    cv.removeEventListener("pointerdown", aoPonteiroBaixo); cv.removeEventListener("pointermove", aoPonteiroMove); cv.removeEventListener("pointerup", aoPonteiroCima); cv.removeEventListener("pointercancel", aoPonteiroCima);
    cv.removeEventListener("wheel", aoRoda); document.removeEventListener("fullscreenchange", aoTelaCheia);
    if(H.mundo) H.mundo.desliga();
    if(ui){ ui.remove(); ui = null; }
    joyBase = joyKnob = btnCorrer = btnInter = dica = aviso = ajuda = null;
    saiTelaCheia();
    /* boneco volta à pose e ao lugar originais */
    restaura(AV); AV = AV0; nomeP = "Pit"; idxP = 0; lugar = "rec"; INI = cen.spawn;
    modoReal(false);
    cen.tick(1, 9999, 9999);
    cam.fov = 38; cam.updateProjectionMatrix();
    ctl.enabled = true; ctl.target.copy(lookAt);
    if(voltar) voltar();
    if(opts && opts.aoAndar) opts.aoAndar(false);
  }
  /* ---- cena de missão (CanyonFly): a câmera e os atores passam a ser do diretor (H.cinemaQuadro); o mundo continua rodando ---- */
  function cinema(on){
    if(!!W.cinema === !!on) return; W.cinema = !!on; W.keys.clear(); W.joy.x = W.joy.y = 0; W.vel = 0;
    if(on){ AV.av.visible = false; if(arrasta) arrasta = null; }
    else { restaura(AV); prepara(AV); cam.clearViewOffset(); cam.fov = 70; cam.updateProjectionMatrix(); AV.av.position.set(W.x, W.y, W.z); AV.av.rotation.y = W.yaw; AV.av.visible = !W.fp; W.snap = true; }
  }
  function tick(dt){
    if(!W.on) return;
    if(W.cinema){ cen.tick(dt, W.x, W.z); if(H.cinemaQuadro) H.cinemaQuadro(dt); return; }
    passo(dt); pose(); cen.tick(dt, W.x, W.z); camera(dt); mira(); constroiTick(dt);
  }
  return {
    ligar, desligar, tick, cinema, emCinema: () => !!W.cinema, ativo: () => W.on,
    estado: () => ({ quem: nomeP, lugar, x: W.x, y: W.y, z: W.z, yaw: W.yaw, camYaw: W.camYaw, fp: W.fp, noChao: W.noChao, vel: W.vel, dentro: naCasa(), alvo: atual && atual.id }),
    dbgPerto: () => reg().map(r => { B.box.setFromObject(r.obj); return [r.id, B.box.isEmpty() ? null : [B.box.min.toArray().map(v => +v.toFixed(1)), B.box.max.toArray().map(v => +v.toFixed(1))]]; }).filter(x => /trolley|escada/.test(x[0])),
    colisoresEm: (x, z) => C.filter(k => x > k.x0 - R && x < k.x1 + R && z > k.z0 - R && z < k.z1 + R).map(k => ({ peca: k.peca, x0: +k.x0.toFixed(1), x1: +k.x1.toFixed(1), z0: +k.z0.toFixed(1), z1: +k.z1.toFixed(1), y1: k.y1, ativo: !k.ativo || !!k.ativo() })),
    camLivre: (v) => { W.camLivre = !!v; }, vista: (fp, pitch) => { if(fp !== undefined) W.fp = !!fp; if(pitch !== undefined){ W.camPitch = clamp(pitch, .06, 1.3); W.fpPitch = clamp(pitch - .34, -1.2, 1.2); } },  /* depuração/testes: câmera em 1ª pessoa e inclinação */     trocaPersonagem, escolhePersonagem, trocaLugar, teclas: W.keys, colocar: (x, z, giro) => { W.x = x; W.z = z; W.y = cen.chao(x, z); W.vy = 0; W.noChao = true; if(giro !== undefined){ W.camYaw = giro; W.camOff = 0; W.yaw = giro + Math.PI; } W.snap = true; }
  };
}
