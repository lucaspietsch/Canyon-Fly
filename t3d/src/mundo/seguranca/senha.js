import { SENHAS, SENHA_CFG } from "../../../../data/seguranca/senhas.js";

/* ============================================================================================================
   PORTÃO DE SENHA DO JOGO (Vila Santana e personagens dos operadores)
   • Calcula o SHA-256 de  salt + ":" + senha  (Web Crypto) e compara com o hash cadastrado em data/seguranca/senhas.js. A senha nunca fica gravada em lugar nenhum.
   • Limite de tentativas com espera crescente (padrão: 3 erros = 30 s, depois 60 s, 120 s...), guardado por entrada no navegador.
   • Proteção do JOGO: como o site é estático, o hash e o salt vão junto com os arquivos. Não substitui autenticação de servidor.
   ============================================================================================================ */
const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
export async function hashSenha(senha, salt){ const d = new TextEncoder().encode(salt + ":" + senha); return hex(await crypto.subtle.digest("SHA-256", d)); }

export const temSenha = (id) => !!(SENHAS[id] && SENHAS[id].hash && SENHAS[id].salt);
const chave = (id) => SENHA_CFG.guardaChave + id;
function lerEstado(id){ try{ return JSON.parse(localStorage.getItem(chave(id)) || "{}"); }catch(_){ return {}; } }
function gravaEstado(id, s){ try{ localStorage.setItem(chave(id), JSON.stringify(s)); }catch(_){ /* sem armazenamento */ } }
/* segundos que ainda faltam para poder tentar de novo */
export function esperaRestante(id){ const s = lerEstado(id); return s.ate ? Math.max(0, Math.ceil((s.ate - Date.now()) / 1000)) : 0; }

/* confere uma tentativa: devolve { ok, espera, restam } */
export async function confere(id, senha){
  if(!temSenha(id)) return { ok: false, espera: 0, restam: 0, semSenha: true };
  const w = esperaRestante(id); if(w > 0) return { ok: false, espera: w, restam: 0 };
  const h = await hashSenha(senha, SENHAS[id].salt), s = lerEstado(id);
  if(h === SENHAS[id].hash){ gravaEstado(id, {}); return { ok: true, espera: 0, restam: SENHA_CFG.erros }; }
  s.erros = (s.erros || 0) + 1; let espera = 0;
  if(s.erros >= SENHA_CFG.erros){ const k = Math.min(SENHA_CFG.esperaSeg.length - 1, s.erros - SENHA_CFG.erros); espera = SENHA_CFG.esperaSeg[k]; s.ate = Date.now() + espera * 1000; }
  gravaEstado(id, s); return { ok: false, espera, restam: Math.max(0, SENHA_CFG.erros - (s.erros % SENHA_CFG.erros || SENHA_CFG.erros)) };
}

/* janela de senha: devolve uma Promise<boolean>. `ui` é o elemento do jogo onde a janela entra. */
export function pedeSenha(ui, id, { titulo = "Senha", texto = "" } = {}){
  return new Promise((ok) => {
    if(!ui) return ok(false);
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:95;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;pointer-events:auto;";
    const cx = document.createElement("div"); cx.style.cssText = "width:min(380px,90vw);background:#15170f;border:2px solid #8a9a3b;border-radius:14px;padding:16px;color:#e9efc0;font:600 14px system-ui,sans-serif;";
    const msg = document.createElement("div"); msg.style.cssText = "min-height:20px;margin-top:8px;font-size:12.5px;color:#ffb35a;";
    cx.innerHTML = "<div style='color:#ffd36a;font-size:16px;margin-bottom:6px'></div><div style='opacity:.85;margin-bottom:10px'></div>"; cx.children[0].textContent = titulo; cx.children[1].textContent = texto;
    const inp = document.createElement("input"); inp.type = "password"; inp.autocomplete = "off"; inp.style.cssText = "width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1.5px solid #5d6b2c;background:#0c0e08;color:#fff;font:600 15px ui-monospace,monospace;";
    const bt = document.createElement("button"); bt.type = "button"; bt.textContent = "Entrar"; bt.style.cssText = "margin-top:10px;padding:9px 16px;border-radius:8px;border:1.5px solid #6aa84a;background:#25331a;color:#eaf5da;font:700 13px system-ui,sans-serif;cursor:pointer;";
    const ca = document.createElement("button"); ca.type = "button"; ca.textContent = "Cancelar"; ca.style.cssText = bt.style.cssText + "margin-left:8px;border-color:#555;background:#222;";
    cx.append(inp, msg, bt, ca); el.appendChild(cx); ui.appendChild(el); inp.focus(); let timer = null;
    const fim = (v) => { clearInterval(timer); window.removeEventListener("keydown", kd, true); el.remove(); ok(v); };
    const atualizaEspera = () => { const w = esperaRestante(id); if(w > 0){ msg.textContent = "Muitas tentativas. Aguarde " + w + " s para tentar de novo."; bt.disabled = true; } else { bt.disabled = false; if(msg.dataset.espera){ msg.textContent = ""; msg.dataset.espera = ""; } } return w; };
    const tenta = async () => {
      if(atualizaEspera() > 0) return; const r = await confere(id, inp.value); inp.value = "";
      if(r.ok) return fim(true);
      if(r.semSenha){ msg.textContent = "Em breve: ainda não há senha cadastrada."; return; }
      if(r.espera > 0){ msg.dataset.espera = "1"; timer = timer || setInterval(atualizaEspera, 500); atualizaEspera(); } else msg.textContent = "Senha incorreta.";
    };
    const kd = (e) => { e.stopPropagation(); if(e.code === "Enter"){ e.preventDefault(); tenta(); } else if(e.code === "Escape"){ e.preventDefault(); fim(false); } };
    window.addEventListener("keydown", kd, true); bt.onclick = tenta; ca.onclick = () => fim(false);
    if(atualizaEspera() > 0){ msg.dataset.espera = "1"; timer = setInterval(atualizaEspera, 500); }
  });
}
