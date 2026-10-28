import { SENHAS, OPERADORES, LOGIN_TESTE, SENHA_CFG } from "../../../../data/seguranca/senhas.js";

/* ============================================================================================================
   LOGIN E SENHA DO JOGO (operadores da tirolesa e portão da Vila Santana)
   • PBKDF2 (Web Crypto) com SHA-256, salt próprio por entrada e ≥ 100.000 iterações; compara com o hash de data/seguranca/senhas.js.
     A senha nunca fica gravada em lugar nenhum (nem em texto, nem em log).
   • Operador: login + senha. Erro sempre com a MESMA mensagem ("Login ou senha incorretos"), sem dizer qual dos dois errou.
   • Limite de tentativas com espera crescente (3 erros = 30 s, depois 60, 120…), por entrada, guardado no navegador.
   • Sessão do operador em sessionStorage: vale até fechar a aba; botão "Sair" encerra.
   • Login de teste (LOGIN_TESTE) só em modo debug: localhost/127.0.0.1 ou ?debug na URL.
   • Proteção do JOGO: como o site é estático, salt e hash vão junto com os arquivos. Não substitui autenticação de servidor.
   ============================================================================================================ */
const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
const enc = (s) => new TextEncoder().encode(s);
export async function hashSenha(senha, salt, iter = SENHA_CFG.iterMin){
  const k = await crypto.subtle.importKey("raw", enc(senha), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc(salt), iterations: Math.max(SENHA_CFG.iterMin, iter | 0) }, k, 256));
}
const confereHash = async (senha, e) => !!(e && e.salt && e.hash) && (await hashSenha(senha, e.salt, e.iter)) === e.hash;
export const modoDebug = () => { try{ return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /[?&]debug\b/.test(location.search); }catch(_){ return false; } };

/* ---------- tentativas (por entrada) ---------- */
const chave = (id) => SENHA_CFG.guardaChave + id;
function lerEstado(id){ try{ return JSON.parse(localStorage.getItem(chave(id)) || "{}"); }catch(_){ return {}; } }
function gravaEstado(id, s){ try{ localStorage.setItem(chave(id), JSON.stringify(s)); }catch(_){ /* sem armazenamento */ } }
/** segundos que ainda faltam para poder tentar de novo */
export function esperaRestante(id){ const s = lerEstado(id); return s.ate ? Math.max(0, Math.ceil((s.ate - Date.now()) / 1000)) : 0; }
function registraErro(id){
  const s = lerEstado(id); s.erros = (s.erros || 0) + 1; let espera = 0;
  if(s.erros >= SENHA_CFG.erros){ const k = Math.min(SENHA_CFG.esperaSeg.length - 1, s.erros - SENHA_CFG.erros); espera = SENHA_CFG.esperaSeg[k]; s.ate = Date.now() + espera * 1000; }
  gravaEstado(id, s); return { ok: false, espera, restam: Math.max(0, SENHA_CFG.erros - (s.erros % SENHA_CFG.erros || SENHA_CFG.erros)) };
}

/* ---------- portões com senha única (Vila Santana) ---------- */
export const temSenha = (id) => !!(SENHAS[id] && SENHAS[id].hash && SENHAS[id].salt);
/** confere uma tentativa de senha de portão: devolve { ok, espera, restam } */
export async function confere(id, senha){
  if(!temSenha(id)) return { ok: false, espera: 0, restam: 0, semSenha: true };
  const w = esperaRestante(id); if(w > 0) return { ok: false, espera: w, restam: 0 };
  if(await confereHash(senha, SENHAS[id])){ gravaEstado(id, {}); return { ok: true, espera: 0, restam: SENHA_CFG.erros }; }
  return registraErro(id);
}

/* ---------- operadores: login + senha ---------- */
const LOGIN_ID = "login";                                                                                    // as tentativas de login contam juntas, seja qual for o nome digitado
const normaliza = (t) => (t || "").trim().toLowerCase();
export const temLogin = (idPersonagem) => { const e = OPERADORES[idPersonagem]; return !!(e && e.login && e.salt && e.hash) || (modoDebug() && LOGIN_TESTE && LOGIN_TESTE.como === idPersonagem); };
export const algumLogin = () => Object.keys(OPERADORES).some(temLogin) || (modoDebug() && !!LOGIN_TESTE);
/** confere login + senha: devolve { ok, id?, espera, restam }. A mensagem de erro é sempre a mesma. */
export async function confereLogin(login, senha){
  const w = esperaRestante(LOGIN_ID); if(w > 0) return { ok: false, espera: w, restam: 0 };
  const l = normaliza(login);
  let id = null;
  for(const [k, e] of Object.entries(OPERADORES)){ if(e && e.login && normaliza(e.login) === l && e.salt && e.hash && await confereHash(senha, e)){ id = k; break; } }
  if(!id && modoDebug() && LOGIN_TESTE && normaliza(LOGIN_TESTE.login) === l && await confereHash(senha, LOGIN_TESTE)) id = LOGIN_TESTE.como;
  if(!id && !l){ await hashSenha(senha || "", "x"); }                                                        // custo parecido mesmo com login vazio (não revela nada pelo tempo)
  if(id){ gravaEstado(LOGIN_ID, {}); return { ok: true, id, espera: 0, restam: SENHA_CFG.erros }; }
  return registraErro(LOGIN_ID);
}

/* ---------- sessão do operador (até fechar a aba) ---------- */
export const sessao = {
  operador(){ try{ return sessionStorage.getItem(SENHA_CFG.sessaoChave) || null; }catch(_){ return null; } },
  logado(){ return !!this.operador(); },
  entra(id){ try{ sessionStorage.setItem(SENHA_CFG.sessaoChave, id); }catch(_){ /* sem armazenamento */ } },
  sai(){ try{ sessionStorage.removeItem(SENHA_CFG.sessaoChave); }catch(_){ /* sem armazenamento */ } }
};

/* ---------- janelas ---------- */
const CSS = {
  fundo: "position:absolute;inset:0;z-index:95;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;pointer-events:auto;",
  caixa: "width:min(380px,90vw);background:#15170f;border:2px solid #8a9a3b;border-radius:14px;padding:16px;color:#e9efc0;font:600 14px system-ui,sans-serif;",
  msg: "min-height:20px;margin-top:8px;font-size:12.5px;color:#ffb35a;",
  input: "width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1.5px solid #5d6b2c;background:#0c0e08;color:#fff;font:600 15px ui-monospace,monospace;margin-bottom:8px;",
  bt: "margin-top:6px;padding:9px 16px;border-radius:8px;border:1.5px solid #6aa84a;background:#25331a;color:#eaf5da;font:700 13px system-ui,sans-serif;cursor:pointer;"
};
function janela(ui, titulo, texto, campos){
  const el = document.createElement("div"); el.style.cssText = CSS.fundo;
  const cx = document.createElement("div"); cx.style.cssText = CSS.caixa;
  cx.innerHTML = "<div style='color:#ffd36a;font-size:16px;margin-bottom:6px'></div><div style='opacity:.85;margin-bottom:10px'></div>"; cx.children[0].textContent = titulo; cx.children[1].textContent = texto;
  const inputs = campos.map(c => { const i = document.createElement("input"); i.type = c.tipo; i.placeholder = c.rotulo; i.autocomplete = c.tipo === "password" ? "current-password" : "username"; i.autocapitalize = "off"; i.spellcheck = false; i.style.cssText = CSS.input; cx.appendChild(i); return i; });
  const msg = document.createElement("div"); msg.style.cssText = CSS.msg;
  const bt = document.createElement("button"); bt.type = "button"; bt.textContent = "Entrar"; bt.style.cssText = CSS.bt;
  const ca = document.createElement("button"); ca.type = "button"; ca.textContent = "Cancelar"; ca.style.cssText = CSS.bt + "margin-left:8px;border-color:#555;background:#222;";
  cx.append(msg, bt, ca); el.appendChild(cx); ui.appendChild(el); inputs[0].focus();
  return { el, inputs, msg, bt, ca };
}
/* espera crescente: controla a mensagem e o botão; devolve a função que liga o relógio */
function controlaEspera(idEspera, j, fim){
  let timer = null;
  const atualiza = () => { const w = esperaRestante(idEspera); if(w > 0){ j.msg.textContent = "Muitas tentativas. Aguarde " + w + " s para tentar de novo."; j.bt.disabled = true; } else { j.bt.disabled = false; if(j.msg.dataset.espera){ j.msg.textContent = ""; j.msg.dataset.espera = ""; } } return w; };
  const liga = () => { j.msg.dataset.espera = "1"; timer = timer || setInterval(atualiza, 500); atualiza(); };
  const encerra = (v) => { clearInterval(timer); window.removeEventListener("keydown", kd, true); j.el.remove(); fim(v); };
  const kd = (e) => { e.stopPropagation(); if(e.code === "Enter"){ e.preventDefault(); j.bt.click(); } else if(e.code === "Escape"){ e.preventDefault(); encerra(false); } };
  window.addEventListener("keydown", kd, true); j.ca.onclick = () => encerra(false);
  if(atualiza() > 0) liga();
  return { atualiza, liga, encerra };
}

/** janela de senha de portão: Promise<boolean>. `ui` é o elemento do jogo onde a janela entra. */
export function pedeSenha(ui, id, { titulo = "Senha", texto = "" } = {}){
  return new Promise((ok) => {
    if(!ui) return ok(false);
    const j = janela(ui, titulo, texto, [{ tipo: "password", rotulo: "Senha" }]), E = controlaEspera(id, j, ok);
    j.bt.onclick = async () => {
      if(E.atualiza() > 0) return; const r = await confere(id, j.inputs[0].value); j.inputs[0].value = "";
      if(r.ok) return E.encerra(true);
      if(r.semSenha){ j.msg.textContent = "Em breve: ainda não há senha cadastrada."; return; }
      if(r.espera > 0) E.liga(); else j.msg.textContent = "Senha incorreta.";
    };
  });
}
/** janela de login do operador: Promise<string|null> com o id do personagem logado (ou null). Já grava a sessão. */
export function pedeLogin(ui, { titulo = "Login do operador", texto = "Digite seu nome de login e a senha." } = {}){
  return new Promise((ok) => {
    if(!ui) return ok(null);
    const j = janela(ui, titulo, texto + (modoDebug() && LOGIN_TESTE ? " (modo debug: login de teste disponível)" : ""), [{ tipo: "text", rotulo: "Login" }, { tipo: "password", rotulo: "Senha" }]), E = controlaEspera(LOGIN_ID, j, ok);
    j.bt.onclick = async () => {
      if(E.atualiza() > 0) return; j.bt.disabled = true; j.msg.textContent = "Conferindo…";
      const r = await confereLogin(j.inputs[0].value, j.inputs[1].value); j.inputs[1].value = ""; j.bt.disabled = false;
      if(r.ok){ sessao.entra(r.id); return E.encerra(r.id); }
      if(r.espera > 0) E.liga(); else j.msg.textContent = "Login ou senha incorretos.";
    };
  });
}
