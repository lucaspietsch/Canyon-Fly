import { Box3, Group, Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, PlaneGeometry, MeshBasicMaterial, DoubleSide, Raycaster, Vector2, Vector3, Plane, BoxHelper } from "three";
import { mat, canvasTex, texPlacaHD, placaLegivel, NIVEL } from "./lib.js";
import { escadaAluminio, escadaVerde } from "./plataforma.js";
import { camera360, cadeirinhaZip } from "./midia.js";
import layoutBase from "./layout.json";

/* ============================================================================================================
   EDITOR DO CENÁRIO
   Clique numa peça para selecionar; mova (setas ou arrastando no chão), gire, mude o tamanho, duplique, oculte ou apague.
   A "Loja" adiciona itens novos (operadores, escadas, bolsas, cadeirinha ZipRider, câmera 360, cones, placas...).
   Salvar guarda neste navegador; "Copiar pedido" gera o texto + o JSON do layout para colar na conversa com o Claude;
   "Print" gera a imagem da tela. Tudo é relativo ao cenário original, então um layout salvo continua valendo.
   Eixos do mundo: X = ao longo dos cabos (para o vão), Z = ao longo do deck (para a casinha), Y = altura. 1 m = 2,94 u.
   ============================================================================================================ */
const CHAVE = "sgv:cenario-layout";
const VERSAO = 3;                                                          // sobe quando o cenário-base muda de lugar (layouts salvos de versões antigas são ignorados)
const U = 2.94;
const rad = (d) => d * Math.PI / 180, deg = (r) => Math.round(r * 180 / Math.PI * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/* ---------------------------------------------------------------- catálogo da loja */
function catalogo({ pessoa3d, M, pele }){
  const pret = mat(0x15161a, { roughness: .8 }), lona = mat(0x6b5a40, { roughness: .95 }), laranja = mat(0xe8731a, { roughness: .6 });
  const cx = (w, h, d, ma, y = 0) => { const o = new Mesh(new BoxGeometry(w, h, d), ma); o.position.y = y + h / 2; return o; };
  const g = (...f) => { const gr = new Group(); f.forEach(o => gr.add(o)); return gr; };
  const pessoa = (nome, o) => { const p = pessoa3d(Object.assign({ nome, x: 0, y: 0, z: 0, yaw: 0, camisa: M(0x56642d), manga: M(0x56642d), calca: M(0x4a5729), pele: pele.media, capacete: M(0xe8731a, { roughness: .45, metalness: .1 }), cabelo: 0x1e140d, barba: false, oculos: true, pin: { barra: "#0a0a0a", pil: 1, mosq: "#ece3cf" } }, o)); const av = p.av; av.parent && av.parent.remove(av); av.position.set(0, 0, 0); av.rotation.y = 0; return av; };
  return [
    { tipo: "operador", nome: "Operador (capacete laranja)", grupo: "Pessoas", novo: () => pessoa("OPERADOR", {}) },
    { tipo: "operadora-morena", nome: "Operadora morena", grupo: "Pessoas", novo: () => pessoa("OPERADORA", { pele: pele.morena, cabelo: 0x241510, rabo: true, oculos: false, barba: false }) },
    { tipo: "operadora-loira", nome: "Operadora loira", grupo: "Pessoas", novo: () => pessoa("OPERADORA", { pele: pele.clara, cabelo: 0xdcbc5c, rabo: true, oculos: false, barba: false, olhos: 0x3b6ea8 }) },
    { tipo: "lider", nome: "Líder (capacete verde)", grupo: "Pessoas", novo: () => pessoa("LÍDER", { capacete: M(0x4a5d2f, { roughness: .5 }) }) },
    { tipo: "resgatista", nome: "Resgatista (capacete vermelho)", grupo: "Pessoas", novo: () => pessoa("RESGATISTA", { capacete: M(0xc22b2b, { roughness: .45 }) }) },
    { tipo: "cliente", nome: "Cliente (capacete branco)", grupo: "Pessoas", novo: () => pessoa("CLIENTE", { pin: null, camisa: M(0x2f6fb5), manga: M(0x2f6fb5), calca: M(0x3a3d44), pele: pele.clara, capacete: M(0xf2f6ff, { roughness: .4 }) }) },
    { tipo: "escada-aluminio", nome: "Escada de alumínio", grupo: "Estruturas", novo: () => { const r = new Group(); escadaAluminio(r, 0, 0, 0); return r; } },
    { tipo: "escada-verde", nome: "Escada verde de aço", grupo: "Estruturas", novo: () => { const r = new Group(); escadaVerde(r, 0, 0, 0, 0); return r; } },
    { tipo: "mourao", nome: "Mourão preto (cerca)", grupo: "Estruturas", novo: () => cx(.64, m4(1.4), .64, mat(0x16130f, { roughness: .9 })) },
    { tipo: "caixa", nome: "Caixa de madeira", grupo: "Estruturas", novo: () => cx(3, 2.5, 3, mat(0x3b2a1e, { roughness: .85 })) },
    { tipo: "banquinho", nome: "Banquinho de pinus", grupo: "Estruturas", novo: () => { const t = cx(1.4, .15, 1.4, mat(0xe0a050, { roughness: .6 }), 1.55); const gr = g(t); [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]].forEach(([x, z]) => { const p = cx(.1, 1.55, .1, mat(0x2a2c30)); p.position.x = x; p.position.z = z; gr.add(p); }); return gr; } },
    { tipo: "placa-aviso", nome: "Placa AVISO (vermelha)", grupo: "Sinalização", novo: () => { const t = texPlacaHD(256, 176, (c, w, h) => { c.fillStyle = "#c8202a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f5f2ec"; c.fillRect(10, 52, w - 20, 80); c.fillStyle = "#fff"; c.font = "bold 36px Arial"; c.textAlign = "center"; c.fillText("AVISO", w / 2, 40); c.fillStyle = "#222"; c.font = "bold 14px Arial"; ["ACESSO SOMENTE COM EQUIPAMENTOS", "DE SEGURANÇA E AUTORIZAÇÃO"].forEach((s, i) => c.fillText(s, w / 2, 82 + i * 20)); }); const p = placaLegivel(t, 2.2, 1.5); p.position.y = 1.6; return g(p); } },
    { tipo: "faixa-amarela", nome: "Faixa amarela no piso", grupo: "Sinalização", novo: () => { const f = cx(5, .04, .3, mat(0xe3b520, { roughness: .6 })); return f; } },
    { tipo: "cone", nome: "Cone de sinalização", grupo: "Sinalização", novo: () => { const k = new Mesh(new CylinderGeometry(.08, .42, 1.6, 16), mat(0xe8731a, { roughness: .6 })); k.position.y = .8; return g(k); } },
    { tipo: "bolsa-preta", nome: "Bolsa preta de EPI", grupo: "Equipamentos", novo: () => g(cx(1.5, 2.2, 1.0, pret), cx(1.52, .15, 1.02, mat(0xc23a2a), 1.1)) },
    { tipo: "bolsa-lona", nome: "Bolsa de lona (cadeirinha)", grupo: "Equipamentos", novo: () => cx(1.9, .7, 1.3, lona) },
    { tipo: "cadeirinha-zip", nome: "Cadeirinha ZipRider", grupo: "Equipamentos", novo: () => cadeirinhaZip() },
    { tipo: "camera-360", nome: "Câmera 360 no bastão", grupo: "Equipamentos", novo: () => camera360({ escala: 1, comprimento: 1.7 }) },
    { tipo: "corda-laranja", nome: "Corda laranja (rolo)", grupo: "Equipamentos", novo: () => { const t = new Mesh(new TorusGeometry(.5, .09, 8, 20), laranja); t.rotation.x = Math.PI / 2; t.position.y = .1; return g(t); } },
    { tipo: "radio", nome: "Rádio HT laranja", grupo: "Equipamentos", novo: () => { const r = cx(.28, .95, .2, laranja); return g(r); } }
  ];
}
const m4 = (v) => v * U;

export function criarEditor({ cam, ctl, renderer, el, cena, H, render }){
  const cen = H.cen;
  const pecas = new Map();                                               // id → { id, nome, obj, base, extra? }
  const baseDe = (o) => ({ p: o.position.clone(), r: o.rotation.y, s: o.scale.x, v: o.visible });
  (cen.pecas || []).forEach(p => pecas.set(p.id, { ...p, base: baseDe(p.obj) }));
  /* atores fixos (Pit e equipe) também podem ser reposicionados */
  if(H.AG){ const add = (id, nome, av) => { if(av && !pecas.has(id)) pecas.set(id, { id, nome, obj: av, base: baseDe(av) }); }; add("pit", "Pit (operador 4)", H.AVT_PIT); (H.npcs || []).forEach(p => add("pessoa-" + String(p.rotulo).toLowerCase(), p.rotulo, p.av)); }
  const SEGUE = { pit: "deck", "pessoa-weslley": "deck", "pessoa-marcos": "deck", "pessoa-thaynara": "casinha", "pessoa-renato": "casinha" };    // quem anda junto com a peça movida
  /* (os atores do recebimento são registrados mais tarde pelo jogo3d; ver registraSeguidores) */
  const extras = [];                                                     // { id, tipo, nome, obj }
  function registraSeguidores(){ pecas.forEach(p => { if(SEGUE[p.id] && !p.segue) p.segue = SEGUE[p.id]; }); }
  function sincSeguidores(){
    registraSeguidores();
    pecas.forEach(p => { if(p.ajusta) p.ajusta(); });
    pecas.forEach(p => { if(!p.segue) return; const T = cen.tf(p.segue), f = T.fwd(p.base.p.x, p.base.p.z), nx = f[0] - p.base.p.x, nz = f[1] - p.base.p.z, o = p.shift || { x: 0, z: 0, th: 0 };
      p.obj.position.x += nx - o.x; p.obj.position.z += nz - o.z; p.obj.rotation.y += T.th - o.th; p.shift = { x: nx, z: nz, th: T.th }; });
    cen.sincroniza();
  }
  let cat = null;
  const catalogoItens = () => (cat || (cat = catalogo({ pessoa3d: H.pessoa3d, M: H.M, pele: H.pele })));
  let seq = 1;

  /* ---------------------------------------------------------------- layout (relativo ao original) */
  const lerPeca = (p) => { if(p.trilho){ const dx0 = r2(p.obj.position.x - p.base.p.x); return { dx: dx0, dy: 0, dz: 0, ry: 0, s: 1, oculto: false }; } const o = p.obj, sh = p.shift || { x: 0, z: 0, th: 0 }; return { dx: r2(o.position.x - p.base.p.x - sh.x), dy: r2(o.position.y - p.base.p.y), dz: r2(o.position.z - p.base.p.z - sh.z), ry: deg(o.rotation.y - p.base.r - sh.th), s: r2(o.scale.x / p.base.s), oculto: !o.visible && p.base.v }; };
  const mudou = (l) => l.dx || l.dy || l.dz || l.ry || l.s !== 1 || l.oculto;
  function layoutAtual(){
    const itens = {}; pecas.forEach(p => { const l = lerPeca(p); if(mudou(l)) itens[p.id] = l; });
    return { versao: VERSAO, itens, extras: extras.map(e => ({ id: e.id, tipo: e.tipo, x: r2(e.obj.position.x), y: r2(e.obj.position.y), z: r2(e.obj.position.z), ry: deg(e.obj.rotation.y), s: r2(e.obj.scale.x) })) };
  }
  function aplicaLayout(L){
    pecas.forEach(p => { p.obj.position.copy(p.base.p); p.obj.rotation.y = p.base.r; p.obj.scale.setScalar(p.base.s); p.obj.visible = p.base.v; p.shift = { x: 0, z: 0, th: 0 }; });
    extras.splice(0).forEach(e => e.obj.parent && e.obj.parent.remove(e.obj));
    if(!L){ sincSeguidores(); return; }
    Object.entries(L.itens || {}).forEach(([id, l]) => { const p = pecas.get(id); if(!p) return; p.obj.position.set(p.base.p.x + l.dx, p.base.p.y + l.dy, p.base.p.z + l.dz); p.obj.rotation.y = p.base.r + rad(l.ry || 0); p.obj.scale.setScalar(p.base.s * (l.s || 1)); if(l.oculto) p.obj.visible = false; if(p.trilho){ p.obj.position.set(p.base.p.x + l.dx, p.base.p.y, p.base.p.z); } });
    (L.extras || []).forEach(e => { const o = criaExtra(e.tipo, e.id); if(!o) return; o.obj.position.set(e.x, e.y, e.z); o.obj.rotation.y = rad(e.ry || 0); o.obj.scale.setScalar(e.s || 1); });
    sincSeguidores();
  }
  function criaExtra(tipo, id){
    const item = catalogoItens().find(c => c.tipo === tipo); if(!item) return null;
    const obj = item.novo(); H.AG.add(obj);
    const ex = { id: id || (tipo + "-" + (seq++)), tipo, nome: item.nome, obj }; extras.push(ex);
    const n = parseInt(String(ex.id).split("-").pop(), 10); if(n >= seq) seq = n + 1;
    return ex;
  }
  const salvaLocal = () => { try{ localStorage.setItem(CHAVE, JSON.stringify(layoutAtual())); return true; }catch(_){ return false; } };
  const lerLocal = () => { try{ const s = localStorage.getItem(CHAVE); const l = s ? JSON.parse(s) : null; return l && l.versao === VERSAO ? l : null; }catch(_){ return null; } };
  /* layout oficial (arquivo do projeto) + o que o usuário salvou neste navegador */
  aplicaLayout(lerLocal() || layoutBase);

  /* ---------------------------------------------------------------- interface */
  let ui = null, ativo = false, sel = null, passo = 1, hist = [], listaEl = null, lojaEl = null, painelSel = null, rotuloSel = null, modal = null, helper = null;
  const FONTE = "font:600 13px ui-monospace,Consolas,'Courier New',monospace;color:#c9d28a;";
  const mk = (css, txt, pai, tag = "div") => { const e = document.createElement(tag); e.style.cssText = css; if(txt !== undefined) e.textContent = txt; if(pai) pai.appendChild(e); return e; };
  const BTN = "pointer-events:auto;user-select:none;-webkit-user-select:none;cursor:pointer;border:1.5px solid #8a9a3b;background:rgba(18,19,14,.82);color:#e9efc0;border-radius:10px;text-align:center;padding:8px 10px;min-width:38px;" + FONTE;
  const btn = (txt, fn, pai, extra = "", rot) => { const b = mk(BTN + extra, txt, pai, "button"); b.type = "button"; if(rot) b.setAttribute("aria-label", rot); b.addEventListener("pointerdown", e => { e.stopPropagation(); }); b.addEventListener("click", e => { e.stopPropagation(); fn(); }); return b; };
  const nomeDe = (r) => (r.nome || r.id);
  const registros = () => [...pecas.values(), ...extras];
  const porObj = (o) => { while(o){ const r = registros().find(x => x.obj === o); if(r) return r; o = o.parent; } return null; };

  function aviso(t){ if(!ui) return; const a = mk("position:absolute;left:50%;top:60px;transform:translateX(-50%);background:rgba(18,19,14,.92);border:1.5px solid #e0883a;border-radius:10px;padding:8px 14px;color:#ffd7a8;pointer-events:none;z-index:50;" + FONTE, t, ui); setTimeout(() => a.remove(), 2600); }
  function guardaHist(){ hist.push(JSON.stringify(layoutAtual())); if(hist.length > 60) hist.shift(); }
  function desfaz(){ const s = hist.pop(); if(!s){ aviso("Nada para desfazer"); return; } const id = sel && sel.id; aplicaLayout(JSON.parse(s)); sel = registros().find(r => r.id === id) || null; atualiza(); }

  function seleciona(r){
    sel = r || null;
    if(helper){ cena.remove(helper); helper = null; }
    if(sel){ helper = new BoxHelper(sel.obj, 0xffa23a); cena.add(helper); }
    atualiza();
  }
  function atualiza(){
    sincSeguidores();
    if(!ui) return;
    if(rotuloSel) rotuloSel.textContent = sel ? nomeDe(sel) + "  ·  x " + r2(sel.obj.position.x) + "  y " + r2(sel.obj.position.y) + "  z " + r2(sel.obj.position.z) + "  ·  giro " + deg(sel.obj.rotation.y) + "°  ·  tam " + r2(sel.obj.scale.x) : "Toque numa peça do cenário (ou escolha na lista) para editar";
    painelSel.style.display = sel ? "flex" : "none";
    if(listaEl){ listaEl.innerHTML = ""; registros().forEach(r => { const b = btn((r === sel ? "▶ " : "") + nomeDe(r) + (r.obj.visible ? "" : "  (excluído)"), () => { seleciona(r); olhaPara(r); }, listaEl, "display:block;width:100%;text-align:left;margin:3px 0;" + (r === sel ? "border-color:#e0883a;color:#ffd7a8;" : "")); void b; }); }
  }
  function olhaPara(r){ const b = new Box3().setFromObject(r.obj), c = b.getCenter(new Vector3()); if(isFinite(c.x)) ctl.target.set(c.x, c.y, c.z); }

  /* movimentos relativos à câmera: esquerda/direita/afastar/aproximar */
  const dirs = () => { const f = new Vector3(); cam.getWorldDirection(f); f.y = 0; if(f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize(); const d = new Vector3(f.z * -1, 0, f.x); d.set(-f.z, 0, f.x); return { f, d: new Vector3(f.z, 0, -f.x) }; };
  function mover(sx, sz, sy = 0){
    if(!sel) return; guardaHist(); const { f, d } = dirs(); const o = sel.obj;
    if(sel.trilho){ o.position.x += d.x * sx * passo + f.x * sz * passo; atualiza(); return; }
    o.position.addScaledVector(d, sx * passo).addScaledVector(f, sz * passo); o.position.y += sy * passo; atualiza();
  }
  const girar = (g) => { if(!sel) return; guardaHist(); sel.obj.rotation.y += rad(g); atualiza(); };
  const tamanho = (k) => { if(!sel) return; guardaHist(); sel.obj.scale.multiplyScalar(k); atualiza(); };
  function duplica(){ if(!sel) return; guardaHist(); const tipo = sel.tipo || (sel.extra && sel.tipo); if(sel.tipo){ const e = criaExtra(sel.tipo); e.obj.position.copy(sel.obj.position).add(new Vector3(2, 0, 2)); e.obj.rotation.copy(sel.obj.rotation); e.obj.scale.copy(sel.obj.scale); seleciona(e); } else { aviso("Peças originais não duplicam: use a Loja para adicionar um item igual"); } void tipo; }
  function apaga(){ if(!sel) return; guardaHist(); if(sel.tipo){ sel.obj.parent && sel.obj.parent.remove(sel.obj); extras.splice(extras.indexOf(sel), 1); seleciona(null); } else { sel.obj.visible = false; aviso("Peça excluída (a colisão dela também). Para trazer de volta: selecione na lista (aparece como «excluído») e toque em ↺ Original"); if(helper){ cena.remove(helper); helper = null; } atualiza(); } }
  function restaura(){ if(!sel) return; guardaHist(); if(sel.tipo){ aviso("Itens da Loja não têm original: apague ou mova"); return; } sel.obj.position.copy(sel.base.p); sel.obj.rotation.y = sel.base.r; sel.obj.scale.setScalar(sel.base.s); sel.obj.visible = sel.base.v; atualiza(); }
  function adiciona(tipo){ guardaHist(); const e = criaExtra(tipo); const t = ctl.target; e.obj.position.set(t.x, Math.max(NIVEL.CHAO, t.y - 2 > NIVEL.CHAO ? NIVEL.DECK : NIVEL.CHAO), t.z); e.obj.position.y = NIVEL.DECK; seleciona(e); aviso(e.nome + " adicionado no centro da tela. Arraste ou use as setas."); }

  /* ---------------------------------------------------------------- textos para o Claude, salvar, print */
  function descreve(){
    const L = layoutAtual(), linhas = [];
    Object.entries(L.itens).forEach(([id, l]) => { const p = pecas.get(id); const w = p.obj.getWorldPosition(new Vector3()); const q = []; if(l.dx || l.dz || l.dy) q.push("deslocar x " + l.dx + " u, y " + l.dy + " u, z " + l.dz + " u (≈ " + r2(l.dx / U) + " m, " + r2(l.dy / U) + " m, " + r2(l.dz / U) + " m)"); if(l.ry) q.push("girar " + l.ry + "°"); if(l.s !== 1) q.push("tamanho ×" + l.s); if(l.oculto) q.push("ocultar"); linhas.push("• " + nomeDe(p) + " (" + id + "): " + q.join("; ") + " → posição final x " + r2(w.x) + ", y " + r2(w.y) + ", z " + r2(w.z)); });
    L.extras.forEach(e => linhas.push("• ADICIONAR " + (extras.find(x => x.id === e.id) || {}).nome + " (" + e.tipo + ") em x " + e.x + ", y " + e.y + ", z " + e.z + ", giro " + e.ry + "°, tamanho ×" + e.s));
    const t = "Editei o cenário 3D no editor do sistema. Eixos: X ao longo dos cabos (para o vão), Z ao longo do deck (para a casinha), Y altura; 1 m = 2,94 u; giro em graus (anti-horário visto de cima = positivo).\n\n" + (linhas.length ? linhas.join("\n") : "(nenhuma alteração ainda)") + "\n\nO que preciso que você faça: [escreva aqui o que quer]\n\nLayout (JSON, para colar em t3d/src/layout.json):\n" + JSON.stringify(L);
    return t;
  }
  function copiaTexto(txt){ try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(() => aviso("Copiado!"), () => abreModal("Copie o texto abaixo", txt)); return; } }catch(_){ /* tenta o plano B */ } try{ const ta = document.createElement("textarea"); ta.value = txt; ta.style.cssText = "position:fixed;left:-9999px"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); if(ok){ aviso("Copiado!"); return; } }catch(_){ /* mostra o texto */ } abreModal("Copie o texto abaixo", txt); }
  function abreModal(titulo, txt, imagem){
    if(modal) modal.remove(); modal = mk("position:absolute;inset:0;background:rgba(5,6,3,.82);display:grid;place-items:center;z-index:60;pointer-events:auto;", undefined, ui);
    const c = mk("width:min(720px,94%);max-height:88%;overflow:auto;background:#1b1d15;border:2px solid #e0883a;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;", undefined, modal);
    mk("color:#e0883a;font-size:15px;text-transform:uppercase;letter-spacing:.6px;", titulo, c);
    if(imagem){ const im = document.createElement("img"); im.src = imagem; im.style.cssText = "max-width:100%;border-radius:8px;border:1px solid #3a3f27;"; c.appendChild(im); const a = mk(BTN + "text-decoration:none;display:block;", "⬇ Baixar a imagem", c, "a"); a.href = imagem; a.download = "cenario-" + Date.now() + ".png"; }
    if(txt){ const ta = mk("width:100%;min-height:200px;background:#0f100b;color:#d9e2a0;border:1px solid #3a3f27;border-radius:8px;padding:8px;box-sizing:border-box;" + FONTE, undefined, c, "textarea"); ta.value = txt; ta.readOnly = true; ta.addEventListener("focus", () => ta.select()); btn("Copiar o texto", () => copiaTexto(txt), c); }
    btn("Fechar", () => { modal.remove(); modal = null; }, c, "margin-top:4px;");
  }
  function print(){ if(helper) helper.visible = false; render(); let url = null; try{ url = renderer.domElement.toDataURL("image/png"); }catch(_){ url = null; } if(helper) helper.visible = true; abreModal("Print do cenário", descreve(), url); }
  /* tela cheia (com plano B para navegadores que não deixam, como o iPhone) */
  let fsEstilo = null, bFs = null;
  const emFs = () => document.fullscreenElement === el || fsEstilo !== null;
  function atualizaFs(){ if(bFs) bFs.textContent = emFs() ? "✕ Sair da tela cheia" : "⛶ Tela cheia"; }
  function entraFs(){
    const f = el.requestFullscreen || el.webkitRequestFullscreen;
    const plano = () => { if(fsEstilo === null){ fsEstilo = el.style.cssText; el.style.cssText += ";position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:2147483000;background:#0b0c08;"; try{ if(parent !== window) parent.postMessage({ sgv: "tela-cheia", on: true }, "*"); }catch(_){ /* sem página-mãe */ } } atualizaFs(); };
    if(!f){ plano(); return; }
    try{ const r = f.call(el); if(r && r.then) r.then(atualizaFs, plano); else atualizaFs(); }catch(_){ plano(); }
  }
  function saiFs(){
    if(document.fullscreenElement === el){ try{ document.exitFullscreen(); }catch(_){ /* já saiu */ } }
    if(fsEstilo !== null){ el.style.cssText = fsEstilo; fsEstilo = null; try{ if(parent !== window) parent.postMessage({ sgv: "tela-cheia", on: false }, "*"); }catch(_){ /* sem página-mãe */ } }
    atualizaFs();
  }
  const alternaFs = () => { if(emFs()) saiFs(); else entraFs(); };
  document.addEventListener("fullscreenchange", () => { atualizaFs(); });
  function salvar(){ const ok = salvaLocal(); aviso(ok ? "Layout salvo neste navegador" : "Este ambiente não permite salvar: use «Copiar pedido» e me envie o JSON"); }

  function montaUI(){
    ui = mk("position:absolute;inset:0;pointer-events:none;z-index:30;" + FONTE, undefined, el);
    const topo = mk("position:absolute;top:8px;left:8px;right:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;pointer-events:none;", undefined, ui);
    mk("pointer-events:none;background:rgba(18,19,14,.82);border:1.5px solid #e0883a;border-radius:10px;padding:8px 12px;color:#e0883a;text-transform:uppercase;letter-spacing:.6px;", "Editor do cenário", topo);
    mk("flex:1", undefined, topo);
    bFs = btn("⛶ Tela cheia", alternaFs, topo); atualizaFs(); btn("💾 Salvar", salvar, topo); btn("📋 Copiar pedido p/ o Claude", () => copiaTexto(descreve()), topo); btn("📷 Print", print, topo); btn("↩ Desfazer", desfaz, topo); const bcl = btn("☁ Clima", () => { cen.proximoClima(); try{ localStorage.setItem("sgv:clima", cen.climaAtual()); }catch(_){ /* sem armazenamento */ } bcl.textContent = "Clima: " + cen.climas[cen.climaAtual()].nome; }, topo);
    btn("⟲ Limpar tudo", () => { if(confirm("Voltar o cenário ao original?")){ guardaHist(); aplicaLayout(layoutBase); seleciona(null); } }, topo); btn("✕ Sair", () => API.editar(false), topo);
    /* lado esquerdo: peças e loja */
    const lado = mk("position:absolute;left:8px;top:58px;bottom:130px;width:min(250px,44%);display:flex;flex-direction:column;gap:6px;pointer-events:none;", undefined, ui);
    const abas = mk("display:flex;gap:6px;pointer-events:none;", undefined, lado);
    listaEl = mk("flex:1;overflow:auto;background:rgba(18,19,14,.86);border:1.5px solid #3a3f27;border-radius:10px;padding:6px;pointer-events:auto;", undefined, lado);
    lojaEl = mk("flex:1;overflow:auto;background:rgba(18,19,14,.86);border:1.5px solid #3a3f27;border-radius:10px;padding:6px;pointer-events:auto;display:none;", undefined, lado);
    [listaEl, lojaEl].forEach(e => { e.addEventListener("pointerdown", ev => ev.stopPropagation()); e.addEventListener("wheel", ev => ev.stopPropagation(), { passive: true }); });
    const aba = (t, qual) => btn(t, () => { listaEl.style.display = qual === 0 ? "block" : "none"; lojaEl.style.display = qual === 1 ? "block" : "none"; }, abas, "flex:1;");
    aba("Peças", 0); aba("🛒 Loja", 1);
    let grupoAtual = "";
    catalogoItens().forEach(it => { if(it.grupo !== grupoAtual){ grupoAtual = it.grupo; mk("color:#e0883a;margin:8px 0 2px;text-transform:uppercase;font-size:11px;", grupoAtual, lojaEl); } btn("+ " + it.nome, () => adiciona(it.tipo), lojaEl, "display:block;width:100%;text-align:left;margin:3px 0;"); });
    /* câmeras */
    const cams = mk("position:absolute;right:8px;top:58px;display:flex;flex-direction:column;gap:6px;pointer-events:none;", undefined, ui);
    const vista = (nome, p, a) => btn(nome, () => { cam.position.set(...p); ctl.target.set(...a); ctl.update(); }, cams);
    mk("pointer-events:none;color:#8f9a5c;font-size:11px;text-align:right;", "Vistas", cams);
    vista("Deck", [14, 2, 40], [0, -3, 5]); vista("Casinha", [-24, 4, 40], [-5, 0, 22]); vista("Pórtico", [-30, 6, 16], [-62, 0, -18]); vista("Cercado (alto)", [-10, 120, 120], [-20, -6, 0]); vista("Vão do cânion", [60, 10, 30], [400, -40, 0]); vista("Cachoeira", [620, -60, 60], [380, -300, -22]); vista("Portãozinho", [140, 4, 20], [160, -4, -2]);
    /* barra da peça selecionada */
    const base = mk("position:absolute;left:8px;right:8px;bottom:8px;display:flex;flex-direction:column;gap:6px;pointer-events:none;", undefined, ui);
    rotuloSel = mk("background:rgba(18,19,14,.86);border:1.5px solid #3a3f27;border-radius:10px;padding:7px 10px;pointer-events:none;color:#ffd7a8;", "", base);
    painelSel = mk("display:none;gap:6px;flex-wrap:wrap;pointer-events:none;align-items:center;", undefined, base);
    const gr = (t) => mk("display:flex;gap:4px;align-items:center;pointer-events:none;background:rgba(18,19,14,.5);border-radius:10px;padding:3px;", undefined, painelSel);
    let g1 = gr(); btn("◀", () => mover(-1, 0), g1, "", "Mover para a esquerda"); btn("▲", () => mover(0, 1), g1, "", "Afastar"); btn("▼", () => mover(0, -1), g1, "", "Aproximar"); btn("▶", () => mover(1, 0), g1, "", "Mover para a direita");
    g1 = gr(); btn("⇧ subir", () => mover(0, 0, 1), g1); btn("⇩ descer", () => mover(0, 0, -1), g1);
    g1 = gr(); btn("⟲ 15°", () => girar(15), g1); btn("⟳ 15°", () => girar(-15), g1); btn("⟲ 90°", () => girar(90), g1);
    g1 = gr(); btn("− tam.", () => tamanho(1 / 1.1), g1); btn("+ tam.", () => tamanho(1.1), g1);
    g1 = gr(); mk("pointer-events:none;color:#8f9a5c;", "passo", g1); [[.25, "¼ u"], [1, "1 u"], [3, "1 m"], [9, "3 m"]].forEach(([v, t]) => { const b = btn(t, () => { passo = v; ui.querySelectorAll("[data-passo]").forEach(x => { x.style.borderColor = x.dataset.passo == v ? "#e0883a" : "#8a9a3b"; }); }, g1); b.dataset.passo = v; if(v === passo) b.style.borderColor = "#e0883a"; });
    g1 = gr(); btn("⧉ Duplicar", duplica, g1); btn("🗑 Excluir", apaga, g1); btn("↺ Original", restaura, g1);
    atualiza();
  }

  /* ---------------------------------------------------------------- ponteiro: selecionar e arrastar no chão */
  const ray = new Raycaster(), pt = new Vector2(), plano = new Plane(new Vector3(0, 1, 0), 0), hit = new Vector3();
  let d0 = null, arrasta = null;
  const alvos = () => registros().filter(r => r.obj.visible).map(r => r.obj);
  function rayDe(e){ const r = renderer.domElement.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, cam); }
  function aoDown(e){
    if(!ativo || (e.target !== renderer.domElement)) return; d0 = [e.clientX, e.clientY]; arrasta = null; rayDe(e);
    if(sel){ const h = ray.intersectObject(sel.obj, true)[0]; if(h){ plano.set(new Vector3(0, 1, 0), -sel.obj.position.y); if(ray.ray.intersectPlane(plano, hit)){ arrasta = { off: sel.obj.position.clone().sub(hit), mov: false }; ctl.enabled = false; } } }
  }
  function aoMove(e){
    if(!ativo || !arrasta) return; rayDe(e); plano.set(new Vector3(0, 1, 0), -sel.obj.position.y);
    if(ray.ray.intersectPlane(plano, hit)){ if(!arrasta.mov){ guardaHist(); arrasta.mov = true; } sel.obj.position.x = hit.x + arrasta.off.x; if(!sel.trilho) sel.obj.position.z = hit.z + arrasta.off.z; atualiza(); }
  }
  function aoUp(e){
    if(!ativo) return; const foiArrasto = arrasta && arrasta.mov; arrasta = null; ctl.enabled = true;
    if(!d0 || foiArrasto) { d0 = null; return; }
    if(Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 5 || e.target !== renderer.domElement){ d0 = null; return; } d0 = null;
    rayDe(e); const h = ray.intersectObjects(alvos(), true)[0];
    if(h){ const r = porObj(h.object); if(r) seleciona(r); } else seleciona(null);
  }
  function aoTecla(e){
    if(!ativo || modal || e.target.tagName === "TEXTAREA") return;
    const k = e.key;
    if(k === "ArrowLeft"){ mover(-1, 0); e.preventDefault(); } else if(k === "ArrowRight"){ mover(1, 0); e.preventDefault(); } else if(k === "ArrowUp"){ mover(0, 1); e.preventDefault(); } else if(k === "ArrowDown"){ mover(0, -1); e.preventDefault(); }
    else if(k === "PageUp") mover(0, 0, 1); else if(k === "PageDown") mover(0, 0, -1); else if(k === "q" || k === "Q") girar(15); else if(k === "e" || k === "E") girar(-15);
    else if(k === "+" || k === "=") tamanho(1.1); else if(k === "-") tamanho(1 / 1.1); else if(k === "Delete" || k === "Backspace") apaga(); else if(k === "z" && (e.ctrlKey || e.metaKey)) desfaz(); else if(k === "Escape") API.editar(false);
  }
  const salvoCtl = {};
  const API = {
    editar(on){
      if(on === ativo) return ativo;
      if(on){
        ativo = true; salvoCtl.h = el.style.height; salvoCtl.mh = el.style.minHeight; el.style.height = "min(94vh, 1200px)"; el.style.minHeight = "560px"; try{ el.scrollIntoView({ block: "start" }); }catch(_){ /* sem rolagem */ } window.dispatchEvent(new Event("resize")); salvoCtl.max = ctl.maxDistance; salvoCtl.fov = cam.fov; ctl.maxDistance = 600; cam.far = 6000; cam.updateProjectionMatrix();
        if(H.trolleyModo) H.trolleyModo(true); sincSeguidores();
        montaUI(); cam.position.set(14, 2, 40); ctl.target.set(0, -3, 5); ctl.update(); hist = [];
        renderer.domElement.addEventListener("pointerdown", aoDown, true); window.addEventListener("pointermove", aoMove); window.addEventListener("pointerup", aoUp, true); window.addEventListener("keydown", aoTecla, true);
        if(H.vistaFrente){ /* mantém a câmera atual */ }
      } else {
        saiFs(); el.style.height = salvoCtl.h || ""; el.style.minHeight = salvoCtl.mh || ""; window.dispatchEvent(new Event("resize")); ativo = false; seleciona(null); ctl.maxDistance = salvoCtl.max || 70; ctl.enabled = true;
        renderer.domElement.removeEventListener("pointerdown", aoDown, true); window.removeEventListener("pointermove", aoMove); window.removeEventListener("pointerup", aoUp, true); window.removeEventListener("keydown", aoTecla, true);
        if(ui){ ui.remove(); ui = null; } if(modal){ modal = null; }
        if(H.trolleyModo) H.trolleyModo(false);
        if(H.vistaFrente) H.vistaFrente();
      }
      return ativo;
    },
    ativo: () => ativo, frame(){ if(helper && sel) helper.update(); },
    layout: layoutAtual, aplicaLayout, descreve, pecas,
    /* modo Construir (Pit): lista, criação, persistência */
    registros, catalogo: () => catalogoItens().map(c => ({ tipo: c.tipo, nome: c.nome, grupo: c.grupo })),
    criar: (tipo) => criaExtra(tipo), remove: (r) => { if(r && r.tipo){ r.obj.parent && r.obj.parent.remove(r.obj); extras.splice(extras.indexOf(r), 1); } else if(r){ r.obj.visible = false; } sincSeguidores(); },
    refresca: () => { sincSeguidores(); atualiza(); }, salvaLocal, guardaHist
  };
  void Mesh; void SphereGeometry;
  return API;
}
