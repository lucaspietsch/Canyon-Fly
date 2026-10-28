import { PERSONAGENS } from "../dados/personagens.js";
import { constroiSepe, constroiTupa, constroiAtiara, constroiOperador } from "./modelos.js";
import { temLogin, pedeLogin, sessao } from "../seguranca/senha.js";

/* ============================================================================================================
   SISTEMA DE PERSONAGENS JOGÁVEIS (CanyonFly): cada um com nome, aparência, época, habilidades (vazio por enquanto) e estado bloqueado/desbloqueado.
   • Lista em dados/personagens.js. Desbloqueios e personagem ativo ficam salvos em localStorage ("sgv:personagens", com try/catch).
   • Tela de escolha: botão 👤 do modo andar, ou `M.personagens.abreTela()` (usada pela Urna do Tempo e pelo evento do raio).
   • API: lista() · desbloqueado(id) · desbloqueia(id, motivo) · escolhe(id) · ativo · pertenceAoOutroTempo() (só Sepé e Tupã entram na Vila Santana).
   ============================================================================================================ */

const CHAVE = "sgv:personagens";

export function criarPersonagens(M){
  const { H } = M, S = { desb: {}, ativo: "pit", rigs: {}, tela: null, ui: null };
  try{ const j = JSON.parse(localStorage.getItem(CHAVE) || "{}"); S.desb = j.desb || {}; S.ativo = j.ativo || "pit"; }catch(_){ /* sem armazenamento */ }
  if(!PERSONAGENS.some(p => p.id === S.ativo)) S.ativo = "pit";                                    // salvo antigo (ex.: Krig, que agora é só NPC)
  const salva = () => { try{ localStorage.setItem(CHAVE, JSON.stringify({ desb: S.desb, ativo: S.ativo })); }catch(_){ /* sem armazenamento */ } };
  const def = (id) => PERSONAGENS.find(p => p.id === id);
  const desbloqueado = (id) => { const d = def(id); return !!d && !d.emBreve && (d.desbloqueadoPadrao || (d.operador ? (sessao.operador() === id && temLogin(id)) : !!S.desb[id])); };      // operador: só enquanto a sessão de login dele estiver aberta nesta aba (sessionStorage)
  const emBreve = (d) => !!d && (d.emBreve || (d.operador && !d.desbloqueadoPadrao && !temLogin(d.id)));
  const lista = () => PERSONAGENS.map(p => ({ ...p, desbloqueado: desbloqueado(p.id), ativo: S.ativo === p.id, emBreve: emBreve(p) }));

  /* rigs (bonecos) dos desbloqueados que não são do jogo base: criados na primeira vez que o jogador os escolhe */
  function rig(id){
    if(S.rigs[id]) return S.rigs[id]; const d = def(id); if(!d || d.hub) return null;
    try{ const r = id === "sepe" ? constroiSepe(H, d) : id === "tupa" ? constroiTupa(H, d) : id === "atiara" ? constroiAtiara(H, d) : d.operador ? constroiOperador(H, d) : null; if(r){ S.rigs[id] = r; } return r; }catch(e){ console.warn("personagem", id, e); return null; }
  }
  /* o modo andar pergunta quem existe (ver trolley3d.js → H.personagens): os desbloqueados com boneco entram na lista */
  H.extraPersonagens = () => PERSONAGENS.filter(p => !p.hub && desbloqueado(p.id)).map(p => rig(p.id)).filter(Boolean).map(r => ({ id: r.id, nome: r.nome, p: r.p }));
  H.abreTrocaPersonagem = () => { abreTela(); return true; };

  function desbloqueia(id, motivo){
    const d = def(id); if(!d || d.emBreve || desbloqueado(id)) return false; S.desb[id] = Date.now(); salva();
    if(M.terminal) M.terminal.msg("missao", "Personagem desbloqueado: " + d.nome + (motivo ? " (" + motivo + ")" : "")); if(M.ctx) M.ctx.mostraAviso("Personagem desbloqueado: " + d.nome); return true;
  }
  function escolhe(id){
    const d = def(id); if(!d || !desbloqueado(id)) return false; const am = H.andarMod; if(!am) return false;
    const ok = id === "pit" ? am.escolhePersonagem(id) : (rig(id) ? am.escolhePersonagem(id) : false);
    if(ok || S.ativo === id){ S.ativo = id; salva(); if(M.terminal) M.terminal.msg("info", "Personagem: " + d.nome); if(ok && M.portal) M.portal.aoEscolher(d); if(M.transformacao) M.transformacao.aoEpoca(M.lugares && M.lugares.epoca ? M.lugares.epoca() : "2026"); } return ok;
  }
  const pertenceAoOutroTempo = () => { const d = def(S.ativo); return !!d && d.tempo === "outro"; };

  /* ---------- tela de escolha ---------- */
  function abreTela(opc = {}){
    if(S.tela || !M.ui) return; if(M.ctx && M.ctx.soltaTeclas) M.ctx.soltaTeclas();
    const el = document.createElement("div"); el.style.cssText = "position:absolute;inset:0;z-index:70;background:rgba(5,6,12,.86);display:flex;align-items:center;justify-content:center;pointer-events:auto;font:600 13px ui-monospace,Consolas,monospace;color:#e9efc0;";
    const cx = document.createElement("div"); cx.style.cssText = "width:min(94%,920px);max-height:92%;overflow:auto;background:rgba(18,19,14,.96);border:2px solid #8a9a3b;border-radius:16px;padding:16px 18px;";
    const t = document.createElement("div"); t.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"; t.innerHTML = "<span style='font-size:18px;color:#ffd36a'>" + (opc.titulo || "Escolha o personagem") + "</span>"; const x = document.createElement("span"); x.textContent = "✕ Esc";
    if(sessao.logado()){ const sa = document.createElement("button"); sa.type = "button"; const dl = def(sessao.operador()); sa.textContent = "Sair (" + (dl ? dl.nome : sessao.operador()) + ")"; sa.style.cssText = "margin-left:auto;margin-right:12px;padding:6px 12px;border-radius:8px;border:1.5px solid #a55;background:#2a1414;color:#f5dada;font:700 12px system-ui,sans-serif;cursor:pointer;"; sa.onclick = () => { sai(); fechaTela(); }; t.appendChild(sa); } x.style.cssText = "cursor:pointer;border:1px solid #8a9a3b;border-radius:8px;padding:4px 10px;"; x.onclick = () => fechaTela(); t.appendChild(x); cx.appendChild(t);
    const grade = document.createElement("div"); grade.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;"; cx.appendChild(grade);
    lista().forEach(p => { const c = document.createElement("div"); const novo = opc.destaque === p.id;
      c.style.cssText = "border:2px solid " + (p.ativo ? "#ffd36a" : p.desbloqueado ? "#5a6a2b" : "#3a3a3a") + ";border-radius:12px;padding:10px 12px;opacity:" + (p.desbloqueado ? 1 : .6) + ";" + (novo ? "box-shadow:0 0 18px #9fc8ff;" : "") + (p.desbloqueado ? "cursor:pointer;" : "");
      c.innerHTML = "<div style='font-size:15px;color:" + (p.desbloqueado ? "#e9efc0" : "#9a9a8a") + "'>" + (p.desbloqueado ? "" : "🔒 ") + p.nome + (p.ativo ? "  · em uso" : "") + "</div><div style='opacity:.75;margin:3px 0'>" + p.epoca + "</div><div style='opacity:.85;font-size:12px;line-height:1.45'>" + (p.desbloqueado ? p.aparencia : (p.emBreve ? "Em breve." : (p.desbloqueio ? p.desbloqueio.texto : "Bloqueado."))) + "</div>" + (p.habilidades.length ? "" : "<div style='opacity:.5;font-size:11px;margin-top:4px'>Habilidades: (vazio por enquanto)</div>");
      if(p.desbloqueado) c.onclick = () => { fechaTela(); escolhe(p.id); };
      else if(p.operador && !p.emBreve) c.onclick = async () => { c.style.cursor = "wait"; if(M.ctx && M.ctx.soltaTeclas) M.ctx.soltaTeclas(); const id = await pedeLogin(M.ui, { titulo: "Login do operador — " + p.nome, texto: "Entre com seu nome de login e a senha. A sessão vale até fechar a aba." }); c.style.cursor = ""; if(id){ fechaTela(); if(M.terminal) M.terminal.msg("info", "Operador logado: " + (def(id) || {}).nome); escolhe(id); } };
      grade.appendChild(c); });
    el.appendChild(cx); M.ui.appendChild(el); S.tela = el; el.addEventListener("pointerdown", e => e.stopPropagation());
  }
  function fechaTela(){ if(S.tela){ S.tela.remove(); S.tela = null; } }
  function tecla(e){ if(S.tela){ if(e.code === "Escape"){ fechaTela(); } e.preventDefault(); return true; } return false; }
  function tick(dt){ const r = S.rigs[S.ativo]; if(r && r.tick) r.tick(dt); }
  /* encerra a sessão do operador: volta ao Pit (ou ao primeiro desbloqueado) e desfaz a transformação */
  function sai(){ const id = sessao.operador(); sessao.sai(); if(M.transformacao) M.transformacao.desliga(); if(S.ativo === id) escolhe("pit"); if(M.terminal) M.terminal.msg("info", "Sessão do operador encerrada."); if(M.ctx) M.ctx.mostraAviso("Você saiu"); }
  const operadorLogado = () => sessao.operador();
  return { lista, desbloqueado, desbloqueia, escolhe, abreTela, fechaTela, tecla, tick, rig, def, pertenceAoOutroTempo, sai, operadorLogado, S, get ativo(){ return S.ativo; }, info: () => "Personagem: " + S.ativo, desliga: fechaTela };
}
