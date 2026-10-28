import { Vector3 } from "three";
import { U, FAUNA, ESPECIES, SERPENTES, AVES } from "./config.js";

/* ============================================================================================================
   MODO FOTO + GALERIA + CONQUISTAS
   F liga/desliga (primeira pessoa com zoom: roda do mouse ou + −) · Enter/Espaço/botão = fotografar (som de obturador, flash) · G abre a galeria.
   A foto sai só do 3D (sem a interface), reduzida e guardada em localStorage com espécie, data e hora do jogo e distância.
   Conquistas por espécie fotografada a distância respeitosa. Nenhuma opção de alimentar, tocar ou chamar o animal: a única interação é fotografar.
   ============================================================================================================ */

const NOMES = { lobo: "Lobo-guará", puma: "Leão-baio", graxaim: "Graxaim", veado: "Veado-campeiro", quati: "Quati", gamba: "Gambá-de-orelha-branca", lontra: "Lontra", capivara: "Capivara", cambaraensis: "Sapinho-de-Cambará", dorsalis: "Sapinho Melanophryniscus dorsalis", jararaca: "Jararaca", urutu: "Urutu-cruzeiro", coral: "Cobra-coral", tesoura: "Gavião-tesoura", caudaCurta: "Gavião-de-cauda-curta", rabo: "Gavião-de-rabo-branco", gralha: "Gralha-azul", papagaio: "Papagaio", picapau: "Pica-pau", sabia: "Sabiá", passarinho: "Passarinho", tucano: "Tucano", queroquero: "Quero-quero", curicaca: "Curicaca", gaviao: "Gavião" };
const CONQ = {
  lobo: ["obs", "Observador Consciente", "Fotografou um lobo-guará à distância respeitosa."], puma: ["raro", "Encontro Raro", "Fotografou o leão-baio, o felino mais arisco da serra."],
  graxaim: ["viz", "Vizinho do Campo", "Fotografou um graxaim sem se aproximar."], veado: ["veado", "Olhar do Campo", "Fotografou um veado-campeiro sem assustá-lo."], quati: ["quati", "Bando de Quatis", "Fotografou um quati sem oferecer comida."], gamba: ["gamba", "Visita da Noite", "Fotografou um gambá-de-orelha-branca à noite."], lontra: ["lontra", "Dona do Arroio", "Fotografou uma lontra à beira da água."], capivara: ["capi", "Capivara na Beira do Rio", "Fotografou uma capivara à distância respeitosa."],
  cambaraensis: ["joia", "Joia da Serra", "Fotografou o sapinho-de-Cambará, que só existe nesta região."], dorsalis: ["dors", "Sapinho de Barriga Vermelha", "Fotografou o Melanophryniscus dorsalis."],
  jararaca: ["jara", "Respeito à Jararaca", "Fotografou uma jararaca de longe, sem incomodar."], urutu: ["uru", "Cruz no Campo", "Fotografou o urutu-cruzeiro e a cruz na cabeça."], coral: ["cor", "Anéis da Mata", "Fotografou a cobra-coral de longe."],
  tesoura: ["tes", "Tesoura no Céu", "Fotografou o gavião-tesoura planando."], caudaCurta: ["cc", "Mergulho Certeiro", "Fotografou o gavião-de-cauda-curta em ação."], rabo: ["rb", "Sentinela da Placa", "Fotografou o gavião-de-rabo-branco."],
  gralha: ["gral", "Plantadora de Araucárias", "Fotografou a gralha-azul, a que espalha os pinhões da mata."], papagaio: ["papa", "Revoada Verde", "Fotografou papagaios passando."], picapau: ["pica", "Toc-toc na Mata", "Fotografou um pica-pau no tronco."], sabia: ["sabi", "Canto do Sabiá", "Fotografou um sabiá."], passarinho: ["pas", "Passarinheiro", "Fotografou um bando de passarinhos."],
  tucano: ["tuc", "Bico Colorido", "Fotografou um tucano no alto da mata."], queroquero: ["quero", "Sentinela do Campo", "Fotografou o quero-quero e respeitou o ninho."], curicaca: ["curi", "Casal de Curicacas", "Fotografou as curicacas no campo."], gaviao: ["gav", "Olho no Céu", "Fotografou um gavião sobrevoando a mata."]
};
const ARQ = "sgv:fotos";
const AVES_FOTO = { gralha: 1, papagaio: 1, picapau: 1, sabia: 1, passarinho: 1, tucano: 1, queroquero: 1, curicaca: 1, gaviao: 1 };

export function criarFotos(M){
  const { cam, renderer, cena } = M;
  const S = { ativo: false, fov: 60, zoom: 1, ui: null, el: null, info: null, fotos: [], galeria: null, flash: null, dica: null, aviso: null, ctx: null, ult: 0 };
  try{ S.fotos = JSON.parse(localStorage.getItem(ARQ) || "[]"); }catch(_){ S.fotos = []; }
  const salva = () => { for(let i = 0; i < 30; i++){ try{ localStorage.setItem(ARQ, JSON.stringify(S.fotos)); return; }catch(err){ if(err && /quota/i.test(err.name || "")) S.fotos.shift(); else return; } } };
  const v = new Vector3();
  const FONTE = "font:600 13px ui-monospace,Consolas,'Courier New',monospace;color:#c9d28a;";

  /* quem está no quadro: projeta o centro do corpo na tela */
  function noQuadro(){
    const L = [];
    M.fauna.animais.forEach(a => { v.set(a.x, a.y + a.altura * .6, a.z).project(cam); if(v.z < 1 && Math.abs(v.x) < .92 && Math.abs(v.y) < .92){ const J = M.jogador(); const d = J ? Math.hypot(a.x - J.x, a.z - J.z) / U : 99; L.push({ a, d, cx: Math.abs(v.x) + Math.abs(v.y) }); } });
    (M.fauna.serp ? M.fauna.serp.lista : []).forEach(a => { if(a.fim) return; v.set(a.x, a.pts[0].y + .6, a.z).project(cam); if(v.z < 1 && Math.abs(v.x) < .92 && Math.abs(v.y) < .92){ const J = M.jogador(); const d = J ? Math.hypot(a.x - J.x, a.z - J.z) / U : 99; L.push({ a, d, cx: Math.abs(v.x) + Math.abs(v.y), serp: true }); } });
    if(M.fauna.sapinhos){ M.fauna.sapinhos.lista.forEach(f => { if(f.esp === "perereca") return; v.set(f.x, f.y + f.esc * .5, f.z).project(cam); if(v.z < 1 && Math.abs(v.x) < .92 && Math.abs(v.y) < .92){ const J = M.jogador(); const d = J ? Math.hypot(f.x - J.x, f.z - J.z) / U : 99; L.push({ a: { id: f.esp, papel: null, submersa: 0, cfg: null }, d, cx: Math.abs(v.x) + Math.abs(v.y), sapo: f }); } }); }
    if(M.fauna.aves){ M.fauna.aves.lista.forEach(b => { if(b.fim) return; v.set(b.x, b.y, b.z).project(cam); if(v.z < 1 && Math.abs(v.x) < .92 && Math.abs(v.y) < .92){ const J = M.jogador(); const d = J ? Math.hypot(b.x - J.x, b.z - J.z) / U : 99; if(d > 70) return; L.push({ a: { id: b.esp, papel: null, submersa: 0, cfg: null }, d, cx: Math.abs(v.x) + Math.abs(v.y) + .15, ave: b }); } }); }
    L.sort((p, q) => p.cx - q.cx); return L;
  }
  const respeitosa = (a, d) => AVES_FOTO[a.id] ? d >= AVES.fotoDistM : (a.id === "cambaraensis" || a.id === "dorsalis") ? d >= .45 : SERPENTES.especies[a.id] ? (d >= SERPENTES.dist.alerta) : d >= FAUNA.conquistas.respeitosa * (ESPECIES[a.id] ? ESPECIES[a.id].fatorDist : (a.cfg ? a.cfg.fatorDist : 1)) - .01;

  /* ---------- obturador ---------- */
  let ac = null;
  function som(){
    try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime, buf = ac.createBuffer(1, ac.sampleRate * .09, ac.sampleRate), d = buf.getChannelData(0);
      for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3) * (i < d.length * .35 ? 1 : .5);
      const s = ac.createBufferSource(); s.buffer = buf; const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600; const g = ac.createGain(); g.gain.value = .35; s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t);
      const o = ac.createOscillator(), g2 = ac.createGain(); o.type = "square"; o.frequency.setValueAtTime(1500, t + .05); o.frequency.exponentialRampToValueAtTime(500, t + .1); g2.gain.setValueAtTime(.08, t + .05); g2.gain.exponentialRampToValueAtTime(.001, t + .12); o.connect(g2); g2.connect(ac.destination); o.start(t + .05); o.stop(t + .13); }catch(_){ /* sem áudio */ }
  }

  /* ---------- tirar a foto ---------- */
  function fotografa(){
    if(!S.ativo) return;
    const E = M.ciclo.estado, J = M.jogador(), L = noQuadro();
    som(); if(S.flash){ S.flash.style.transition = "none"; S.flash.style.opacity = ".85"; requestAnimationFrame(() => { S.flash.style.transition = "opacity .35s"; S.flash.style.opacity = "0"; }); }
    renderer.render(cena, cam);
    const src = renderer.domElement, W = 640, H = Math.round(W * src.height / src.width), c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").drawImage(src, 0, 0, W, H);
    let img = ""; try{ img = c.toDataURL("image/jpeg", .72); }catch(_){ img = ""; }
    try{ const W2 = Math.min(1600, src.width), c2 = document.createElement("canvas"); c2.width = W2; c2.height = Math.round(W2 * src.height / src.width); c2.getContext("2d").drawImage(src, 0, 0, c2.width, c2.height); S.ultimaFull = c2.toDataURL("image/jpeg", .92); }catch(_){ S.ultimaFull = img; }
    const reg = { id: Date.now() + Math.random(), img, hora: M.ciclo.horaTexto(), dia: M.ciclo.diaJogo(), t: Date.now(), especie: null, dist: null, respeitosa: false, noite: E.noite > .5, escondida: false, familia: false, n: 0 };
    /* sujeito principal: o mais central; capivaras contam como família se a adulta e pelo menos 2 filhotes estão no quadro */
    if(L.length){ const p = L[0]; reg.especie = p.a.id; reg.dist = p.d; reg.respeitosa = respeitosa(p.a, p.d); reg.n = L.length;
      if(p.a.id === "capivara"){ const caps = L.filter(q => q.a.id === "capivara"); reg.familia = caps.some(q => q.a.papel === "mae") && caps.filter(q => q.a.papel === "filhote").length >= 2; reg.escondida = caps.length >= 2 && caps.every(q => q.a.submersa > .75); } }
    { const ids = new Set(L.map(q => q.a.id)); reg.conf = (ids.has("lobo") && (ids.has("puma") || ids.has("graxaim"))) || (ids.has("gaviao") && ids.has("gralha")); reg.quero = L.some(q => q.ave && q.ave.estado === "mergulha"); }
    { const fs = L.filter(q => q.sapo); reg.par = fs.length >= 2 && fs.some(a => fs.some(b => b !== a && b.sapo.esp === a.sapo.esp && Math.hypot(a.sapo.x - b.sapo.x, a.sapo.z - b.sapo.z) < 2.4 * U)); reg.alertaV = fs.some(q => q.sapo.alerta > .55); }
    S.fotos.push(reg); if(S.fotos.length > 36) S.fotos.shift(); salva();
    conquistas(reg);
    if(S.info) S.info.textContent = "📷 foto salva" + (reg.especie ? " · " + NOMES[reg.especie] + " a " + reg.dist.toFixed(0) + " m" + (reg.respeitosa ? "" : " (perto demais, sem conquista)") : "");
  }
  /* "Salvar foto": baixa a imagem para o dispositivo (o navegador pede permissão/destino quando precisa) */
  function baixa(url, nome){ if(!url){ if(M.ctx) M.ctx.mostraAviso("Sem foto para salvar"); return false; } try{ const a = document.createElement("a"); a.href = url; a.download = nome || "canyonfly-foto.jpg"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); if(M.ctx) M.ctx.mostraAviso("Foto salva no dispositivo"); return true; }catch(_){ if(M.ctx) M.ctx.mostraAviso("Não foi possível salvar a foto"); return false; } }
  const nomeArq = (f) => "canyonfly-dia" + (f ? f.dia : 0) + "-" + (f ? f.hora.replace(":", "h") : "00h00") + ".jpg";
  function tiraAgora(){ const a = S.ativo; S.ativo = true; try{ fotografa(); }finally{ S.ativo = a; } }
  function conquistas(r){
    const C = M.conquistas; if(!C) return;
    if(r.especie && r.respeitosa){ const [id, t, d] = CONQ[r.especie]; C.dar(id, t, d); if(r.noite) C.dar("noite", "Olhos na Noite", "Fotografou um animal à noite, com os olhos brilhando."); }
    if(r.especie && r.respeitosa && ["jararaca", "urutu", "coral"].includes(r.especie)){ const ss = new Set(S.fotos.filter(f => f.respeitosa).map(f => f.especie)); if(ss.has("jararaca") && ss.has("urutu") && ss.has("coral")) C.dar("serpentes", "Observador de Serpentes", "Fotografou as três serpentes da trilha, todas de longe."); }
    if(r.par && r.respeitosa) C.dar("par", "Par na Turfeira", "Fotografou um casal de sapinhos na turfeira.");
    if(r.conf) C.dar("flag", "Flagrante na Natureza", "Fotografou um encontro natural entre animais: o maior avança, o menor cede, sem briga.");
    if(r.quero) C.dar("rasante", "Rasante Fotografado", "Fotografou o quero-quero defendendo o ninho em pleno rasante.");
    { const aves = new Set(S.fotos.filter(f => f.respeitosa && AVES_FOTO[f.especie]).map(f => f.especie)); if(aves.size >= 5) C.dar("orni", "Ornitólogo da Serra", "Fotografou cinco espécies de aves diferentes."); }
    if(r.alertaV) C.dar("sinal", "Sinal Vermelho", "Fotografou o alerta da barriga vermelha, de longe.");
    if(r.familia && r.respeitosa) C.dar("familia", "Família da Beira do Rio", "Fotografou a capivara com os filhotes.");
    if(r.escondida && r.respeitosa) C.dar("cabecas", "Só as Cabeças de Fora", "Fotografou as capivaras escondidas na água durante a passagem do leão-baio.");
    const sp = new Set(S.fotos.filter(f => f.especie && f.respeitosa).map(f => f.especie)); if(sp.size >= 3) C.dar("naturalista", "Naturalista", "Fotografou três espécies diferentes com respeito.");
    if(S.fotos.length >= 10) C.dar("caderno", "Caderno de Campo", "Tirou 10 fotos no parque.");
  }

  /* ---------- interface ---------- */
  function liga(ui, ctx){
    S.ctx = ctx; S.ui = ui;
    S.dica = document.createElement("div"); S.dica.style.cssText = "position:absolute;left:50%;bottom:92px;transform:translateX(-50%);pointer-events:none;background:rgba(18,19,14,.86);border:1.5px solid #8a9a3b;border-radius:12px;padding:8px 14px;display:none;text-align:center;white-space:nowrap;max-width:92%;" + FONTE + "color:#e9efc0;";
    ui.appendChild(S.dica);
    const btn = (t, css, fn, rot) => { const b = document.createElement("div"); b.style.cssText = "pointer-events:auto;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;text-align:center;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.72);color:#e9efc0;border-radius:14px;padding:9px 11px;" + FONTE + (css || ""); b.textContent = t; b.setAttribute("role", "button"); b.setAttribute("aria-label", rot); b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(); }); return b; };
    S.barra = document.createElement("div"); S.barra.style.cssText = "position:absolute;right:10px;top:290px;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    S.barra.appendChild(btn("📷", "", () => alterna(), "Modo foto (F)")); S.barra.appendChild(btn("🖼", "", () => abreGaleria(), "Galeria (G)")); ui.appendChild(S.barra);
    S.cams = document.createElement("div"); S.cams.style.cssText = "position:absolute;inset:0;pointer-events:none;display:none;z-index:31;";
    S.cams.innerHTML = '<div style="position:absolute;inset:7%;border:2px solid rgba(255,255,255,.55);border-radius:6px;"></div><div style="position:absolute;left:33.3%;top:7%;bottom:7%;width:1px;background:rgba(255,255,255,.25)"></div><div style="position:absolute;left:66.6%;top:7%;bottom:7%;width:1px;background:rgba(255,255,255,.25)"></div><div style="position:absolute;top:36%;left:7%;right:7%;height:1px;background:rgba(255,255,255,.25)"></div><div style="position:absolute;top:64%;left:7%;right:7%;height:1px;background:rgba(255,255,255,.25)"></div><div style="position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px;border:1.5px solid rgba(255,255,255,.7);border-radius:50%"></div>';
    S.info = document.createElement("div"); S.info.style.cssText = "position:absolute;left:50%;top:10%;transform:translateX(-50%);pointer-events:none;background:rgba(0,0,0,.55);border-radius:10px;padding:5px 12px;color:#fff;" + FONTE + "color:#fff;white-space:nowrap;"; S.cams.appendChild(S.info);
    const ctl = document.createElement("div"); ctl.style.cssText = "position:absolute;left:50%;bottom:6%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;pointer-events:none;";
    ctl.appendChild(btn("−", "font-size:18px;min-width:44px;", () => zoom(-1), "Menos zoom")); ctl.appendChild(btn("●", "font-size:22px;min-width:64px;color:#ff5a4a;border-color:#ff9a8a;", () => fotografa(), "Fotografar")); ctl.appendChild(btn("+", "font-size:18px;min-width:44px;", () => zoom(1), "Mais zoom")); ctl.appendChild(btn("✕", "min-width:44px;", () => alterna(false), "Sair do modo foto"));
    S.cams.appendChild(ctl); ui.appendChild(S.cams);
    S.flash = document.createElement("div"); S.flash.style.cssText = "position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:50;"; ui.appendChild(S.flash);
    S.roda = (e) => { if(!S.ativo) return; e.preventDefault(); e.stopImmediatePropagation(); zoom(e.deltaY < 0 ? 1 : -1); };
    renderer.domElement.addEventListener("wheel", S.roda, { capture: true, passive: false });
  }
  function desliga(){
    fechaGaleria(); if(S.ativo) alterna(false);
    renderer.domElement.removeEventListener("wheel", S.roda, { capture: true });
    [S.dica, S.barra, S.cams, S.flash].forEach(x => x && x.remove()); S.dica = S.barra = S.cams = S.flash = S.info = null;
  }
  function zoom(d){ S.zoom = Math.max(1, Math.min(16, S.zoom * (d > 0 ? 1.25 : .8))); S.fov = 60 / S.zoom; if(S.info) S.info.textContent = "zoom ×" + S.zoom.toFixed(1); }
  function alterna(on){
    if(!S.ui) return; const quer = on === undefined ? !S.ativo : on; if(quer === S.ativo) return;
    S.ativo = quer; S.zoom = 1; S.fov = 60; if(S.ctx) S.ctx.setFp(quer);
    S.cams.style.display = quer ? "block" : "none"; S.info.textContent = quer ? "Enter / Espaço fotografa · roda do mouse = zoom · F sai" : ""; if(quer && S.ctx) S.ctx.mostraAviso("Modo foto: mantenha distância dos animais");
  }

  /* ---------- galeria ---------- */
  function abreGaleria(){
    if(S.galeria || !S.ui) return; if(S.ctx && S.ctx.soltaTeclas) S.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:48;background:rgba(5,6,3,.82);pointer-events:auto;display:grid;place-items:center;" + FONTE; el.addEventListener("pointerdown", e => { e.stopPropagation(); });
    const cx = document.createElement("div"); cx.style.cssText = "width:min(760px,96%);max-height:94%;overflow:auto;border:2px solid #e0883a;border-radius:16px;background:linear-gradient(170deg,#1b1d15,#23261b);padding:14px;"; el.appendChild(cx);
    const top = document.createElement("div"); top.style.cssText = "display:flex;align-items:center;margin-bottom:10px;"; top.innerHTML = '<div style="flex:1;color:#e0883a;text-transform:uppercase;letter-spacing:.7px;font-size:14px">Galeria de fotos · ' + S.fotos.length + '</div>'; cx.appendChild(top);
    const x = document.createElement("div"); x.textContent = "✕"; x.style.cssText = "cursor:pointer;border:1.5px solid #3a3f27;border-radius:10px;padding:6px 12px;background:rgba(18,19,14,.8);color:#e9efc0;"; x.addEventListener("pointerdown", e => { e.preventDefault(); fechaGaleria(); }); top.appendChild(x);
    const C = M.conquistas ? M.conquistas.todas() : {}, nomesC = { obs: "Observador Consciente", raro: "Encontro Raro", viz: "Vizinho do Campo", capi: "Capivara na Beira do Rio", familia: "Família da Beira do Rio", cabecas: "Só as Cabeças de Fora", noite: "Olhos na Noite", naturalista: "Naturalista", caderno: "Caderno de Campo", serpentes: "Observador de Serpentes", joia: "Joia da Serra", par: "Par na Turfeira", sinal: "Sinal Vermelho", leitor: "Leitor da Serra", nascentes: "Guardião das Nascentes", pe: "Pé Leve", socorro: "Socorro em Ação", jara: "Respeito à Jararaca", uru: "Cruz no Campo", cor: "Anéis da Mata", tes: "Tesoura no Céu", cc: "Mergulho Certeiro", rb: "Sentinela da Placa", flag: "Flagrante na Natureza", amigo: "Amigo do Parque", sil: "Silêncio da Mata", conf: "Cada Um no Seu Espaço", gral: "Plantadora de Araucárias", papa: "Revoada Verde", pica: "Toc-toc na Mata", sabi: "Canto do Sabiá", pas: "Passarinheiro", tuc: "Bico Colorido", quero: "Sentinela do Campo", curi: "Casal de Curicacas", gav: "Olho no Céu", rasante: "Rasante Fotografado", orni: "Ornitólogo da Serra" };
    const cs = Object.keys(C).filter(k => nomesC[k]); const cq = document.createElement("div"); cq.style.cssText = "margin-bottom:10px;color:#ffd36a;font-size:12px;line-height:1.6;"; cq.textContent = cs.length ? "🏅 " + cs.map(k => nomesC[k]).join(" · ") : "Nenhuma conquista ainda: fotografe os animais de longe, em silêncio."; cx.appendChild(cq);
    const g = document.createElement("div"); g.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;"; cx.appendChild(g);
    if(!S.fotos.length){ const e = document.createElement("div"); e.textContent = "Sem fotos. Aperte F para fotografar."; g.appendChild(e); }
    S.fotos.slice().reverse().forEach(f => { const c = document.createElement("div"); c.style.cssText = "border:1.5px solid #3a3f27;border-radius:10px;overflow:hidden;background:#0d0e09;"; if(f.img){ const im = document.createElement("img"); im.src = f.img; im.style.cssText = "width:100%;display:block;"; c.appendChild(im); }
      const l = document.createElement("div"); l.style.cssText = "padding:6px 8px;font-size:11px;line-height:1.4;color:#c9d28a;"; l.textContent = (f.especie ? NOMES[f.especie] + (f.dist !== null ? " · " + f.dist.toFixed(0) + " m" : "") : "Paisagem") + " · dia " + f.dia + ", " + f.hora + (f.respeitosa ? " ✔" : ""); c.appendChild(l);
      const sv = document.createElement("div"); sv.textContent = "💾 Salvar foto"; sv.style.cssText = "cursor:pointer;padding:4px 8px 2px;font-size:11px;color:#9fd37a;"; sv.addEventListener("pointerdown", e => { e.preventDefault(); baixa(f.img, nomeArq(f)); }); if(f.img) c.appendChild(sv);
      const d = document.createElement("div"); d.textContent = "apagar"; d.style.cssText = "cursor:pointer;padding:4px 8px 6px;font-size:11px;color:#c98a7a;"; d.addEventListener("pointerdown", e => { e.preventDefault(); S.fotos = S.fotos.filter(q => q !== f); salva(); fechaGaleria(); abreGaleria(); }); c.appendChild(d); g.appendChild(c); });
    S.ui.appendChild(el); S.galeria = el;
  }
  function fechaGaleria(){ if(S.galeria){ S.galeria.remove(); S.galeria = null; } }

  /* ---------- tecla e quadro ---------- */
  function tecla(e){
    if(M.H && M.H.andarMod && M.H.andarMod.emCinema && M.H.andarMod.emCinema()){ if(e.code === "KeyF" && !e.repeat && M.operacao && M.operacao.diretor.S.foto){ tiraAgora(); e.preventDefault(); return true; } return false; }       // cena de missão: só a câmera do pacote mídia
    if(S.galeria){ if(e.code === "Escape" || e.code === "KeyG"){ fechaGaleria(); } e.preventDefault(); return true; }
    if(e.code === "KeyG" && !(S.ctx && S.ctx.construindo())){ abreGaleria(); e.preventDefault(); return true; }
    if(e.code === "KeyF" && !(S.ctx && S.ctx.construindo())){ alterna(); e.preventDefault(); return true; }
    if(S.ativo){
      if(e.code === "Enter" || e.code === "Space"){ if(!e.repeat) fotografa(); e.preventDefault(); return true; }
      if(e.code === "Escape"){ alterna(false); e.preventDefault(); return true; }
      if(e.code === "Equal" || e.code === "NumpadAdd"){ zoom(1); return true; } if(e.code === "Minus" || e.code === "NumpadSubtract"){ zoom(-1); return true; }
    }
    return false;
  }
  function tick(dt, J){
    if(!S.dica) return;
    /* dica "[F] Fotografar" + aviso educativo de proximidade */
    let t = "", cor = "#8a9a3b";
    const sf = J && M.fauna.sapinhos ? M.fauna.sapinhos.maisPerto(J.x, J.z) : null; const dsf = sf ? sf.d / U : 99;
    const sp = J && M.fauna.serp ? M.fauna.serp.lista.filter(s => !s.fim).map(s => ({ s, d: Math.hypot(s.x - J.x, s.z - J.z) / U })).sort((p, q) => p.d - q.d)[0] : null;
    if(sf && dsf >= .5 && dsf <= 4){ t = (sf.f.esp === "cambaraensis" ? "Sapinho-de-Cambará" : "Sapinho") + " — com cuidado, sem tocar. [F] Fotografar"; cor = "#c8382a"; }
    else if(sp && sp.d < SERPENTES.dist.fotoMax){ if(sp.d < SERPENTES.dist.alerta){ t = "Muito perto! Afaste-se da serpente"; cor = "#e0883a"; } else if(sp.d >= SERPENTES.dist.fotoMin - .01) t = sp.s.nome + " — mantenha distância. [F] Fotografar"; else t = "Chegando perto demais — afaste-se da serpente"; }
    else if(J){ const vis = M.fauna.animais.filter(a => a.visivel && !a.fim).map(a => ({ a, d: Math.hypot(a.x - J.x, a.z - J.z) / U })).sort((p, q) => p.d - q.d)[0];
      if(vis){ const f = vis.a.cfg ? vis.a.cfg.fatorDist : 1, aler = FAUNA.distancias.alerta * f;
        if(vis.d < aler){ t = "Muito perto! Afaste-se para não estressar o animal"; cor = "#e0883a"; } else if(vis.d < 60) t = vis.a.nome + " avistado — mantenha distância. [F] Fotografar"; } }
    S.dica.style.display = t ? "block" : "none"; if(t){ S.dica.textContent = t; S.dica.style.borderColor = cor; }
    if(S.ativo && S.info && !S.info.textContent.startsWith("📷") && S.zoom > 1){ /* mostra o zoom */ }
    S.ult += dt;
  }
  return { liga, desliga, tecla, tick, alterna, fotografa, tiraAgora, baixaUltima: () => baixa(S.ultimaFull || (S.fotos.length ? S.fotos[S.fotos.length - 1].img : ""), nomeArq(S.fotos[S.fotos.length - 1])), fovFoto: () => (S.ativo ? S.fov : 0), ativo: () => S.ativo, fotos: () => S.fotos, abreGaleria, info: () => "Fotos: " + S.fotos.length + (S.ativo ? " · modo foto ×" + S.zoom.toFixed(1) : "") };
}
