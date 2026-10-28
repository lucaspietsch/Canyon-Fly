import { Vector3 } from "three";
import { U } from "../../config.js";

/* ============================================================================================================
   DIRETOR DE CENAS DA OPERAÇÃO (missões 1 a 7)
   Reaproveita as cenas 3D que o jogo da tirolesa já tem (jogo3d.js: lançamento, descida, recebimento, extração simples e moderada) dentro do mundo aberto:
   • modo CINEMA: o diretor assume a câmera e os atores (andar.js › cinema); o mundo continua rodando (vento, fauna, relógio). Espaço/Enter passa a fala; Esc acelera a cena.
   • modo MUNDO: os atores (equipe do recebimento) são animados no cenário sem tirar a câmera do jogador (missão 7: ver o recebimento do lançamento, a ~720 m).
   • falas em balão (balões da gente) + terminal, setas de tamanho constante na tela (laranja = operador, vermelho = resgatista) e botões de foto/salvar foto durante a descida.
   ============================================================================================================ */

const ROTULOS = { op4: "Denilson", op5: "Lorrany", lider2: "Carlos", coord: "Krig", op8: "Jhonatan", op6: "Thaynara", op7: "Weslley", op9: "Operador 9", lider3: "Renato", resg: "Marcos (resgatista)" };

export function criarDiretor(M){
  const H = M.H, G = () => H.jogo;
  const S = { cinema: false, mundo: false, fn: null, mundoFn: null, t: 0, acelera: false, fator: 5, passa: false, setas: [], elSetas: [], hud: null, foto: false, prox: new WeakMap(), ui: null, ult: null, antesFov: 0 };
  const v = new Vector3();

  /* ---------- atores e nomes ---------- */
  const A = () => (G() ? G().atores : {});
  const nomeDe = (rig) => { const a = A(); for(const k of Object.keys(ROTULOS)) if(a[k] === rig) return ROTULOS[k].replace(/ \(.*\)/, ""); return (rig && (rig.rotulo || "")) || "Pit"; };
  const prox = (rig) => { let p = S.prox.get(rig); if(!p){ p = { get x(){ return rig.av.position.x; }, get y(){ return rig.av.position.y; }, get z(){ return rig.av.position.z; }, esc: .82, ativo: true, oculto: false }; S.prox.set(rig, p); } return p; };
  /* fala: balão sobre a cabeça (visível de qualquer distância dentro da cena) + linha no terminal (laranja = operação da tirolesa) */
  function fala(rig, texto, o = {}){
    const dur = o.dur || Math.max(2.8, Math.min(7, texto.length * .055));
    try{ if(!o.semBalao && M.gente && M.gente.baloes && rig) M.gente.baloes.fala(prox(rig), texto, dur, 1e9, o.cor || null); }catch(_){ /* balão é só enfeite */ }
    M.terminal.msg(o.tipo || "tirolesa", (rig ? nomeDe(rig) + ": " : "") + texto, { unico: true });
    return dur;
  }
  const narra = (texto, tipo = "tirolesa") => M.terminal.msg(tipo, texto);

  /* ---------- cinema / mundo ---------- */
  function cinemaOn(){
    if(S.cinema || !G() || !H.andarMod) return false;
    G().salvaMundo(); G().modo.mundo = false; G().modo.acumula = false; G().papelOp6(null); if(M.dia1) M.dia1.pit.oculta();
    H.andarMod.cinema(true); H.cinemaQuadro = quadro; H.cinemaTecla = teclaCinema; S.cinema = true; S.acelera = false; S.t = 0; S.passa = false;
    if(M.ctx && M.ctx.soltaTeclas) M.ctx.soltaTeclas(); montaHud(); return true;
  }
  function cinemaOff(){
    if(!S.cinema) return; S.cinema = false; S.fn = null; S.acelera = false; H.cinemaQuadro = null; H.cinemaTecla = null;
    H.andarMod.cinema(false); G().restauraMundo(); G().papelOp6(null); escondeHud(); fotoHud(false); if(M.dia1 && M.dia1.ativo() && M.dia1.pit.S.presente) M.dia1.pit.aparece();
  }
  function quadro(dt){
    S.t += dt; const d = S.acelera ? dt * S.fator : dt;
    if(S.fn) S.fn(d, S.t); G().quadro(dt, S.t); G().rotulos(); atualizaSetas();
  }
  function teclaCinema(e){
    if(e.code === "Space" || e.code === "Enter" || e.code === "KeyE"){ S.passa = true; }
    else if(e.code === "Escape") S.acelera = !S.acelera;
  }
  const roda = (fn) => { S.fn = fn; };
  const consomePassa = () => { const p = S.passa; S.passa = false; return p; };

  /* modo mundo: anima os atores no cenário vivo sem mexer na câmera do jogador */
  function tick(dt){
    if(S.mundoFn && !S.cinema && G()){
      const g = G(), modo = g.modo; S.t += dt; modo.mundo = true; modo.acumula = false; g.escondeAgora(); modo.acumula = true;
      try{ S.mundoFn(S.acelera ? dt * S.fator : dt, S.t); }catch(err){ console.error("cena do mundo:", err); }
      g.atoresQuadro(dt, S.t); modo.acumula = false; const w = walker(); if(w) w.av.visible = !M.H.andarMod.estado().fp;
    }
    if(!S.cinema) atualizaSetas();
  }
  function mundoLiga(fn){ if(!S.mundoFn && G()){ G().salvaMundo(); if(M.dia1) M.dia1.pit.oculta(); } S.mundoFn = fn; G().modo.mundo = true; }
  function mundoDesliga(){ if(!S.mundoFn) return; S.mundoFn = null; if(G()){ G().modo.mundo = false; G().modo.acumula = false; G().restauraMundo(); } setSetas([]); if(M.dia1 && M.dia1.ativo() && M.dia1.pit.S.presente) M.dia1.pit.aparece(); }
  const walker = () => { const nome = H.andarMod && H.andarMod.estado().quem; const l = H.personagens ? H.personagens() : []; const q = l.find(x => x.nome === nome); return q && q.p; };

  /* ---------- setas sobre as pessoas (tamanho constante na tela, enxergam de longe) ---------- */
  function setSetas(lista){ S.setas = lista; S.elSetas.forEach(e => e.remove()); S.elSetas = []; if(!M.ui) return;
    lista.forEach(s => { const e = document.createElement("div"); e.textContent = "▼"; e.style.cssText = "position:absolute;left:0;top:0;z-index:27;pointer-events:none;font:900 26px/1 system-ui,sans-serif;color:" + s.cor + ";text-shadow:0 0 3px #000,0 0 3px #000,0 0 8px #000;transform:translate(-50%,-100%);display:none;"; M.ui.appendChild(e); S.elSetas.push(e); }); }
  function atualizaSetas(){
    if(!S.setas.length) return; const cam = M.cam, rd = M.renderer.domElement, w = rd.clientWidth, h = rd.clientHeight;
    S.setas.forEach((s, i) => { const e = S.elSetas[i]; if(!e) return; const rig = typeof s.rig === "function" ? s.rig() : s.rig; if(!rig || !rig.av.visible){ e.style.display = "none"; return; }
      rig.av.getWorldPosition(v); v.y += 7.4; v.project(cam); if(v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05){ e.style.display = "none"; return; }
      e.style.display = "block"; e.style.left = ((v.x * .5 + .5) * w) + "px"; e.style.top = ((-v.y * .5 + .5) * h) + "px"; });
  }

  /* ---------- botões da cena ---------- */
  function montaHud(){
    if(S.hud || !M.ui) return; const d = document.createElement("div"); d.style.cssText = "position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:33;pointer-events:none;background:rgba(0,0,0,.55);color:#e9efc0;border-radius:10px;padding:5px 12px;font:600 12px ui-monospace,Consolas,monospace;white-space:nowrap;";
    d.textContent = "Espaço / Enter: próxima fala · Esc: acelerar a cena"; M.ui.appendChild(d); S.hud = d;
  }
  function escondeHud(){ if(S.hud){ S.hud.remove(); S.hud = null; } }
  function fotoHud(on){
    S.foto = on; if(S.fotoEl){ S.fotoEl.remove(); S.fotoEl = null; } if(!on || !M.ui) return;
    const d = document.createElement("div"); d.style.cssText = "position:absolute;right:12px;bottom:60px;z-index:34;display:flex;gap:8px;pointer-events:auto;";
    const b = (t, f) => { const x = document.createElement("div"); x.textContent = t; x.style.cssText = "cursor:pointer;user-select:none;background:rgba(18,19,14,.8);border:1.5px solid #8a9a3b;color:#e9efc0;border-radius:12px;padding:10px 14px;font:700 14px system-ui,sans-serif;"; x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); f(); }); return x; };
    d.append(b("📷 Fotografar (F)", () => foto()), b("💾 Salvar foto", () => salvaFoto())); M.ui.appendChild(d); S.fotoEl = d;
  }
  function foto(){ if(M.fotos && M.fotos.tiraAgora){ M.fotos.tiraAgora(); M.terminal.msg("info", "Foto da câmera do pacote mídia tirada (Salvar foto para baixar)"); } }
  function salvaFoto(){ if(M.fotos && M.fotos.baixaUltima) M.fotos.baixaUltima(); }

  return { fala, narra, nomeDe, cinemaOn, cinemaOff, roda, consomePassa, tick, mundoLiga, mundoDesliga, setSetas, fotoHud, foto, salvaFoto, teclaCinema, walker, S, get em(){ return S.cinema; }, get acelera(){ return S.acelera; } };
}
