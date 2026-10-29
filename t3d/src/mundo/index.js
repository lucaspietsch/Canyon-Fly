import { criarAnhangaMundo } from "./lenda/mundo.js";
import { criarPoderes } from "./poderes/poderes.js";
import { criarPortal } from "./portal/portal.js";
import { registraCenasTupa } from "./lenda/cenasTupa.js";
import { Vector3, Frustum, Matrix4 } from "three";
import { criarCiclo } from "./ciclo.js";
import { criarNevoa } from "./nevoa.js";
import { GAME_TIME_CONFIG, U, ESPECIES } from "./config.js";
import { criarFauna } from "./fauna/manager.js";
import { criarCamionetes } from "./icmbio/camionetes.js";
import { criarGente } from "./gente/gente.js";
import { criarFotos } from "./fotos.js";
import { criarMinimapa } from "./minimapa.js";
import { criarAgenda } from "./eventos/agenda.js";
import { EVENTOS } from "./eventos/config.js";
import { criarAeronaves } from "./eventos/aviao.js";
import { criarMeteoros } from "./eventos/meteoros.js";
import { criarHorizonte } from "./horizonte/horizonte.js";
import { criarKML, mundoParaLatLon } from "./resgate/kml.js";
import { PORT, cabY } from "../portico.js";
import { criarEstrada } from "./resgate/estrada.js";
import { criarZonas } from "./zonas.js";
import { criarCidade } from "./cidade/cidade.js";
import { criarLugares } from "./lugares/lugares.js";
import { criarDEM } from "./terreno/dem.js";
import { criarViagem } from "./viagem.js";
import { criarTerminal } from "./terminal.js";
import { criarMissoes } from "./missoes/missoes.js";
import { criarOperacao } from "./missoes/operacao/index.js";
import { criarDia1 } from "./dia1/dia1.js";
import { criarPersonagens } from "./personagens/personagens.js";
import { criarTransformacao } from "./personagens/transformacao.js";
import { sessao, confereLogin, modoDebug } from "./seguranca/senha.js";
import { criarCenaEstrada } from "./resgate/estradaCena.js";
import { criarResgate } from "./resgate/emergencia.js";
import { EMERGENCIA } from "./config.js";
import { KML_VEGETACAO, KML_DETALHES } from "./dados/kml-vegetacao.js";
import { KML as KMLCFG, ZONAS } from "./config.js";
import { criarVento } from "./vento.js";
import { criarCascata } from "./cascata.js";
import { criarVegetacao } from "./veg/index.js";
import { criarSapinhos } from "./fauna/sapinhos.js";
import { criarAves } from "./fauna/aves.js";
import { criarConflitos } from "./fauna/conflitos.js";
import { criarAndorinhas } from "./fauna/andorinhas.js";

/* ============================================================================================================
   MUNDO VIVO — junta o ciclo de 24 h, a neblina do cânion, as sombras próximas, o lobo-guará, os visitantes e o modo foto.
   Quem manda neste módulo é o quadro do trolley3d.js: mundo.tick(dt) roda a cada frame; o que é pesado (fauna, gente) só roda quando o Pit está andando.
   Teclas de depuração (F3 liga o painel): , . ±1 h · - = velocidade · 0 pausa · 1–5 horas prontas · N neblina · L chama o lobo · V visitantes
   ============================================================================================================ */

export function criarMundo({ cena, cam, renderer, el, luzes, H, opts }){
  const cen = H.cen;
  const ciclo = criarCiclo({ cena, luzes, ceu: cen.ceu, cen, renderer });
  const nevoa = criarNevoa({ pai: cen.grupo, chao: cen.campo.chao, fundoH: cen.campo.fundoH, ciclo });
  const M = { ciclo, nevoa, cen, cam, renderer, cena, el, H, opts, partes: [], ui: null, andando: () => !!(H.andarMod && H.andarMod.ativo()), jogador: () => (H.andarMod ? H.andarMod.estado() : null) };
  const vcam = new Vector3();

  /* ---- sombras: só perto do Pit (caixa de ±100 u em volta dele, mapa moderado) ---- */
  const sol = luzes.sol;
  const SH = { ligado: false, alvo: new Vector3() };
  renderer.shadowMap.enabled = true;
  sol.shadow.mapSize.set(1536, 1536);
  { const c = sol.shadow.camera; c.left = -105; c.right = 105; c.top = 105; c.bottom = -105; c.near = 20; c.far = 620; c.updateProjectionMatrix(); }
  sol.shadow.bias = -.0006; sol.shadow.normalBias = .35; sol.shadow.radius = 2.2;
  cena.add(sol.target);
  const marcaSombras = () => {
    if(SH.marcado) return; SH.marcado = true;
    cen.grupo.traverse(o => { if(o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.isInstancedMesh) o.receiveShadow = true; });
    cen.pecas.forEach(p => p.obj.traverse(o => { if(o.isMesh && !o.userData.semSombra) o.castShadow = true; }));
    const av = H.AVT_PIT; if(av) av.traverse(o => { if(o.isMesh) o.castShadow = true; });
    (H.npcs || []).forEach(p => p.av && p.av.traverse(o => { if(o.isMesh) o.castShadow = true; }));
  };
  function sombras(on, J){
    const E = ciclo.estado, deve = on && ciclo.ativo() && E.alt > 3 && !!J;
    if(deve !== SH.ligado){ SH.ligado = deve; sol.castShadow = deve; if(deve) marcaSombras(); }
    if(!deve) return;
    const e = 6, tx = Math.round(J.x / e) * e, tz = Math.round(J.z / e) * e;                // acompanha em passos (evita a sombra "tremer")
    sol.target.position.set(tx, J.y, tz); sol.target.updateMatrixWorld();
    sol.position.set(tx, J.y, tz).addScaledVector(E.sunDir, 330);
  }
  M.sombras = sombras;

  /* ---- módulos que se acoplam (lobo, visitantes, fotos): cada um entrega { tick(dt, J, E), liga(ui, ctx), desliga(), tecla(e), info() } ---- */
  M.registra = (p) => { M.partes.push(p); return p; };
  M.camionetes = criarCamionetes(M); M.registra({ zona: "parque", tick: (dt, J, E) => M.camionetes.tick(dt, J, E) });
  /* conquistas (toast + localStorage) */
  const conq = (() => { let guardadas = {}; try{ guardadas = JSON.parse(localStorage.getItem("sgv:conquistas") || "{}"); }catch(_){ guardadas = {}; }
    const toast = (t, d) => { if(!M.ui) return; const e = document.createElement("div"); e.style.cssText = "position:absolute;left:50%;top:104px;transform:translateX(-50%);z-index:60;pointer-events:none;background:linear-gradient(170deg,#2a2412,#3a2e14);border:2px solid #ffd36a;border-radius:14px;padding:10px 16px;color:#ffe9a8;text-align:center;font:700 14px system-ui,sans-serif;box-shadow:0 0 30px rgba(255,200,80,.45);max-width:88%;"; e.innerHTML = '<div style="font-size:11px;letter-spacing:1px;color:#ffd36a">CONQUISTA</div><div>🏅 ' + t + '</div><div style="font-weight:500;font-size:12px;opacity:.85">' + d + '</div>'; M.ui.appendChild(e); setTimeout(() => e.remove(), 5200); };
    const salva = () => { try{ localStorage.setItem("sgv:conquistas", JSON.stringify(guardadas)); }catch(_){ /* sem armazenamento */ } };
    return { dar(id, t, d){ if(guardadas[id]) return false; guardadas[id] = Date.now(); salva(); toast(t, d); return true; }, progresso(id, n, total, t, d){ if(n >= total) return this.dar(id, t, d); return false; }, tem: (id) => !!guardadas[id], todas: () => guardadas }; })();
  M.conquistas = conq;
    M.fauna = criarFauna(M);
  M.registra({ zona: "parque", tick: (dt, J, E) => M.fauna.tick(dt, J, E), info: () => M.fauna.info(), aoSalto: () => { M.fauna.animais.slice().forEach(a => { a.fim = true; }); } });
  M.fotos = criarFotos(M); M.registra(M.fotos); M.fovFoto = () => M.fotos.fovFoto();
    M.horizonte = criarHorizonte(M, luzes); M.registra({ tick: (dt, J, E) => M.horizonte.tick(dt, J, E), info: () => M.horizonte.info() });
  M.mapa = criarMinimapa(M); M.registra(M.mapa);
  M.personagens = criarPersonagens(M); M.registra({ tick: (dt) => M.personagens.tick(dt), tecla: (e) => M.personagens.tecla(e), info: () => M.personagens.info(), desliga: () => M.personagens.desliga() });
  M.transformacao = criarTransformacao(M); M.registra({ semCongelar: true, tick: (dt) => M.transformacao.tick(dt), info: () => M.transformacao.info(), desliga: () => M.transformacao.desligaTudo() }); M.cen.extraChao.velMult = () => M.transformacao.velMult(); M.cen.extraChao.alturaExtra = () => M.transformacao.alturaExtra(); M.cen.extraChao.escalaJogador = () => (M.poderes && M.poderes.kauling ? M.poderes.kauling.escala() : 1);
  M.login = { sessao, confereLogin, modoDebug };                                                                       // depuração no console: M.login.confereLogin("login", "senha")
  M.terminal = criarTerminal(M);
  M.missoes = criarMissoes(M); M.registra({ tick: (dt) => M.missoes.tick(dt), tecla: (e) => M.missoes.tecla(e), liga: (ui) => M.missoes.liga(ui), info: () => M.missoes.info(), desliga: () => M.missoes.desliga() }); M.operacao = criarOperacao(M); M.registra({ tick: (dt) => M.operacao.tick(dt), desliga: () => M.operacao.desliga() });
  M.dia1 = criarDia1(M); H.nomeJogador = () => M.dia1.nomeJogador(); M.registra(M.terminal);                                                  // abaixo do minimapa: missões, tirolesa, emergências, natureza, geral
  /* agenda de eventos (aviões e meteoros) */
  M.agenda = criarAgenda(M); M.aeronaves = criarAeronaves(M); M.meteoros = criarMeteoros(M, luzes);
  M.agenda.registra({ id: "monomotor", cfg: EVENTOS.monomotor, dispara: (i) => { if(M.aeronaves.voos.some(v => v.tipo === "monomotor")) return; M.aeronaves.iniciaMonomotor(i.baixo !== undefined ? i.baixo : Math.random() < EVENTOS.monomotor.chanceBaixo, i); } });
  M.agenda.registra({ id: "jato", cfg: EVENTOS.jato, dispara: (i) => { if(M.aeronaves.voos.filter(v => v.tipo === "jato").length < 2) M.aeronaves.iniciaJato(i); } });
  M.agenda.registra({ id: "meteoros", cfg: EVENTOS.meteoros, dispara: (i) => { if(!M.meteoros.estado.ativa) M.meteoros.inicia(i); } });
  M.registra({ tick: (dt, J, E) => { M.agenda.tick(dt, E); M.aeronaves.tick(dt, J, E); M.meteoros.tick(dt, J, E); }, info: () => [M.aeronaves.info(), M.meteoros.info()].filter(Boolean).join(" · "), desliga: () => { M.aeronaves.limpa(); M.meteoros.limpa(); }, aoSalto: () => { M.aeronaves.limpa(); M.meteoros.limpa(); M.agenda.aoSalto(ciclo.estado); } });
    M.gente = criarGente(M); M.registra({ zona: "parque", tick: (dt, J, E) => M.gente.tick(dt, J, E), liga: (ui) => M.gente.liga(ui), desliga: () => M.gente.desliga(), info: () => M.gente.info(), aoSalto: () => M.gente.aoSalto() });

  /* KML (estrada e áreas de mata), estrada para Cambará do Sul, bombeiro civil, equipe de resgate, ambulância */
    M.kml = criarKML(M); M.estrada = criarEstrada(M);
  M.cenaEstrada = criarCenaEstrada(M); M.registra({ tick: (dt, J) => M.cenaEstrada.tick(dt, J), info: () => M.cenaEstrada.info() });
  M.registra({ aoZona: (z, ant) => { if(z !== "parque"){ M.fauna.animais.slice().forEach(a => { a.fim = true; }); M.fauna.sapinhos.desliga(); M.fauna.aves.desliga(); } else M.gente.aoSalto(); } });                  // saiu do parque: some a fauna; voltou: a gente se ajusta à hora (como num salto de relógio)
  M.zonas = criarZonas(M); M.registra({ info: () => M.zonas.infoJogador() }); M.cidade = criarCidade(M); M.registra({ tick: (dt, J) => M.cidade.tick(dt, J), info: () => M.cidade.info() }); M.zonas.liga(); M.registra({ tick: (dt, J) => M.zonas.tick(dt, J) });
  M.registra({ tick: (dt, J, E) => M.fauna.antigo.tick(dt, J, E), info: () => M.fauna.antigo.info(), desliga: () => M.fauna.antigo.desliga() });                  // bichos do passado (só com o portal violeta), em qualquer zona
  M.portal = criarPortal(M); M.registra({ tick: (dt, J) => M.portal.tick(dt, J), desliga: () => M.portal.desliga() });
  M.poderes = criarPoderes(M); M.registra({ semCongelar: true, tick: (dt, J) => M.poderes.tick(dt, J), tecla: (e) => M.poderes.tecla(e), info: () => M.poderes.info(), desliga: () => M.poderes.desliga() });
  M.anhanga = criarAnhangaMundo(M); registraCenasTupa(M); M.registra({ tick: (dt) => M.anhanga.tick(dt), desliga: () => M.anhanga.some() });
  M.lugares = criarLugares(M); M.zonas.aoMudar(() => M.lugares.monta()); M.registra({ tick: (dt, J) => M.lugares.tick(dt, J), tecla: (e) => M.lugares.tecla(e), info: () => M.lugares.info(), desliga: () => M.lugares.desliga() });
  M.kml.aoCarregar(() => M.zonas.carregaKML());
  /* relatório da tirolesa no console (P0): âncoras do KML × posição no jogo, comprimento do cabo, desnível real pelo DEM */
  function relatorioTirolesa(){
    const K = M.kml.S, centro = (P) => P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]);
    const emPoli = (P, x, z) => { let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const L = K.poligonos.find(p => p.tipo === "lancamento" && /deck/i.test(p.nome)) || K.poligonos.find(p => p.tipo === "lancamento"), R = K.poligonos.find(p => p.tipo === "recebimento");
    if(!L || !R) return;
    const rp = K.pontos.find(q => q.tipo === "marcador" && emPoli(R.pts, q.pt[0], q.pt[1])), l = centro(L.pts), r = rp ? rp.pt : centro(R.pts);
    const horizM = Math.hypot(l[0] - r[0], l[1] - r[1]) / KMLCFG.escala, jogoM = Math.hypot(PORT.lanca - PORT.x, cabY(0, PORT.lanca) - cabY(0, 0)) / U, D = M.dem && M.dem.pronto ? M.dem : null;
    const aL = D ? D.altReal(l[0], l[1]) : null, aR = D ? D.altReal(r[0], r[1]) : null, desn = D ? aL - aR : null;
    console.info("Tirolesa (KML × jogo): lançamento KML x=" + l[0].toFixed(0) + " z=" + l[1].toFixed(0) + " u · no jogo x=" + (PORT.lanca + 6) + " z≈25 u · recebimento KML x=" + r[0].toFixed(0) + " z=" + r[1].toFixed(0) + " u · no jogo x≈0 z≈8 u"
      + "\n  distância horizontal real " + horizM.toFixed(0) + " m" + (D ? " · altitudes (DEM) lançamento " + aL.toFixed(0) + " m, recebimento " + aR.toFixed(0) + " m → desnível " + desn.toFixed(0) + " m · cabo reto esperado ≈ " + Math.hypot(horizM, desn).toFixed(0) + " m" : " · DEM ainda não carregado")
      + "\n  cabo no jogo: " + jogoM.toFixed(0) + " m (desnível de só " + Math.abs(cabY(0, PORT.lanca) - cabY(0, 0)) / U + " m: o desnível real ainda não foi aplicado ao cabo)");
  }
  M.kml.aoCarregar(relatorioTirolesa);                                                              // (o DEM, criado logo abaixo, chama de novo quando a elevação chega)
  M.viagem = criarViagem(M); M.registra({ tecla: (e) => M.viagem.tecla(e), info: () => M.viagem.info(), desliga: () => M.viagem.desliga() });
  M.dem = criarDEM(M); M.dem.aoCarregar(() => { M.cidade.refaz(); M.estrada.aplicaDEM(); M.cidade.refaz(); M.lugares.refaz(); }); M.dem.aoCarregar(relatorioTirolesa);                  // (a cidade zera o cache dos platôs antes de a pista ser refeita)
  try{ M.kml.carrega([KML_VEGETACAO, KML_DETALHES]); }catch(e){ console.warn("KML padrão:", e); }
  M.dem.carrega();                                                                                    // elevação real (data/terrain): chega em segundo plano e refaz a estrada/cidade
  /* o arquivo data/kml/parque.kml (se o servidor entregar) tem prioridade sobre a cópia embutida: troque o arquivo e recarregue a página */
  try{ if(typeof fetch === "function" && /^https?:/.test(location.protocol)){ const ler = (u) => fetch(u, { cache: "no-cache" }).then(r => r.ok ? r.text() : null).catch(() => null);
      Promise.all([ler(KMLCFG.arquivoPadrao), ler(KMLCFG.arquivoDetalhes)]).then(([a, b]) => { const ta = a && a.length > 200 ? a : KML_VEGETACAO, tb = b && b.length > 200 ? b : KML_DETALHES; if(ta.trim() !== KML_VEGETACAO.trim() || tb.trim() !== KML_DETALHES.trim()){ try{ M.kml.carrega([ta, tb]); }catch(e){ console.warn("KML arquivo:", e); } } }); } }catch(_){ /* sem fetch */ }
  M.vento = criarVento(M); M.registra({ tick: (dt, J, E) => M.vento.tick(dt, J, E), info: () => M.vento.info(), desliga: () => M.vento.parar() });
  M.cascata = criarCascata(M, M.vento); M.registra({ zona: "parque", tick: (dt, J, E) => M.cascata.tick(dt, J, E), info: () => M.cascata.info(), desliga: () => M.cascata.desliga() });
  M.vegetacao = criarVegetacao(M, M.vento); M.registra({ tick: (dt, J, E) => M.vegetacao.tick(dt, J, E), info: () => M.vegetacao.info(), tecla: (e) => M.vegetacao.placas.tecla(e), desliga: () => M.vegetacao.placas.desliga() }); M.kml.aoCarregar(() => M.vegetacao.regenera());
  M.fauna.sapinhos = criarSapinhos(M); M.registra({ zona: "parque", tick: (dt, J, E) => M.fauna.sapinhos.tick(dt, J, E), info: () => M.fauna.sapinhos.info(), desliga: () => M.fauna.sapinhos.desliga() });
  M.fauna.aves = criarAves(M); M.registra({ zona: "parque", tick: (dt, J, E) => M.fauna.aves.tick(dt, J, E), info: () => M.fauna.aves.info(), desliga: () => M.fauna.aves.desliga(), aoSalto: () => M.fauna.aves.desliga() });
  M.fauna.andorinhas = criarAndorinhas(M); M.registra({ zona: "parque", tick: (dt, J, E) => M.fauna.andorinhas.tick(dt, J, E), info: () => M.fauna.andorinhas.info(), desliga: () => M.fauna.andorinhas.desliga() });
  M.agenda.registra({ id: "andorinhas", cfg: EVENTOS.andorinhas, dispara: () => M.fauna.andorinhas.chega() });
  M.fauna.conflitos = criarConflitos(M); M.registra({ zona: "parque", tick: (dt, J) => M.fauna.conflitos.tick(dt, J), info: () => M.fauna.conflitos.info() });
  { const l0 = M.fauna.zonas.livre; M.fauna.zonas.livre = (x, z, r, f) => l0(x, z, r, f) && !M.vegetacao.turfeira.dentro(x, z) && M.vegetacao.turfeira.distTurfeira(x, z) > 3; }      // animais e pessoas não entram na turfeira
    M.resgate = criarResgate(M);
  M.registra({ tick: (dt, J, E) => M.resgate.tick(dt, J, E), liga: () => M.kml.liga(el), desliga: () => { M.kml.desliga(); M.resgate.desliga(); }, info: () => M.resgate.info(), aoSalto: () => M.resgate.aoSalto() });
  M.agenda.registra({ id: "emergencia", cfg: EMERGENCIA, dispara: (i) => { if(M.dia1 && M.dia1.suprimeEmergencia() && i.origem !== "debug") return; M.resgate.inicia(i); } });

  /* ---- clima do cenário ↔ ciclo ---- */
  ciclo.ao("salto", () => { nevoa.reajusta(ciclo.estado); M.partes.forEach(p => p.aoSalto && p.aoSalto(ciclo.estado)); });
  const aoClima = () => { const modo = cen.climaAtual(); ciclo.ligar(modo === "ciclo"); };
  cen.ouveClima.push(aoClima); aoClima();


  /* ---- relógio clicável: grade de 24 horas, pausa e velocidade normal ---- */
  let pr = null, prBotoes = [];
  const fechaRelogio = () => { if(pr){ pr.remove(); pr = null; prBotoes = []; } };
  function marcaHoraAtual(){ if(!pr) return; const h = Math.floor(ciclo.hora()); prBotoes.forEach((b, i) => { const atual = i === h; b.style.background = atual ? "rgba(224,136,58,.9)" : "rgba(18,19,14,.8)"; b.style.color = atual ? "#1a1408" : "#e9efc0"; b.style.borderColor = atual ? "#ffd7a8" : "#3a3f27"; }); if(pr._pausa) pr._pausa.textContent = ciclo.relogio.pausa ? "▶ Retomar" : "⏸ Pausar"; }
  function alternaRelogio(){
    if(pr){ fechaRelogio(); return; }
    if(!ciclo.ativo()) return;
    const BT = "pointer-events:auto;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;text-align:center;border:1.5px solid #3a3f27;border-radius:10px;background:rgba(18,19,14,.8);color:#e9efc0;" + FONTE + "font-size:14px;";
    pr = document.createElement("div"); pr.style.cssText = "position:absolute;inset:0;z-index:45;display:grid;place-items:center;pointer-events:auto;background:rgba(5,6,3,.45);";
    pr.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if(e.target === pr) fechaRelogio(); });
    const cx = document.createElement("div"); cx.style.cssText = "width:min(360px,92%);max-height:92%;overflow:auto;border:2px solid #e0883a;border-radius:16px;background:linear-gradient(170deg,#1b1d15,#23261b);padding:14px;box-shadow:0 0 40px rgba(224,136,58,.3);" + FONTE; pr.appendChild(cx);
    const topo = document.createElement("div"); topo.style.cssText = "display:flex;align-items:center;margin-bottom:10px;"; cx.appendChild(topo);
    const t = document.createElement("div"); t.style.cssText = "flex:1;color:#e0883a;text-transform:uppercase;letter-spacing:.7px;font-size:14px;"; t.textContent = "Escolher a hora"; topo.appendChild(t);
    const x = document.createElement("div"); x.style.cssText = BT + "padding:6px 12px;"; x.textContent = "✕"; x.setAttribute("role", "button"); x.setAttribute("aria-label", "Fechar"); x.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fechaRelogio(); }); topo.appendChild(x);
    const grade = document.createElement("div"); grade.style.cssText = "display:grid;grid-template-columns:repeat(6,1fr);gap:6px;"; cx.appendChild(grade); prBotoes = [];
    for(let h = 0; h < 24; h++){ const b = document.createElement("div"); b.style.cssText = BT + "padding:11px 0;"; b.textContent = String(h).padStart(2, "0") + ":00"; b.setAttribute("role", "button");
      b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); ciclo.irParaHora(h); fechaRelogio(); }); grade.appendChild(b); prBotoes.push(b); }
    const l2 = document.createElement("div"); l2.style.cssText = "display:flex;gap:8px;margin-top:10px;"; cx.appendChild(l2);
    const bt = (txt, fn) => { const b = document.createElement("div"); b.style.cssText = BT + "flex:1;padding:10px 6px;"; b.textContent = txt; b.setAttribute("role", "button"); b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); fn(); marcaHoraAtual(); }); l2.appendChild(b); return b; };
    pr._pausa = bt("⏸ Pausar", () => ciclo.alternaPausa()); bt("⏩ Velocidade normal", () => ciclo.normal());
    const dica = document.createElement("div"); dica.style.cssText = "margin-top:8px;color:#8f9a5c;font-size:11px;line-height:1.5;"; dica.textContent = "1 h de jogo = " + GAME_TIME_CONFIG.realSecondsPerGameHour + " s reais. Esc fecha."; cx.appendChild(dica);
    M.ui.appendChild(pr); marcaHoraAtual();
  }

  /* ---- painel F3 + HUD da hora ---- */
  let painel = null, hud = null, depurar = false, fps = 60, quadros = 0, tFps = performance.now(), cFps = 0;
  const FONTE = "font:600 12px ui-monospace,Consolas,'Courier New',monospace;color:#c9d28a;";
  function liga(ui, ctx){
    M.ui = ui; M.ctx = ctx;
    hud = document.createElement("div"); hud.style.cssText = "position:absolute;left:10px;top:54px;pointer-events:auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;background:rgba(18,19,14,.62);border:1.5px solid #3a3f27;border-radius:10px;padding:5px 10px;" + FONTE + "color:#e9efc0;font-size:14px;letter-spacing:.5px;"; ui.appendChild(hud); hud.title = "Clique para escolher a hora"; hud.setAttribute("role", "button");
    hud.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); alternaRelogio(); });
    painel = document.createElement("pre"); painel.style.cssText = "position:absolute;left:10px;top:92px;margin:0;pointer-events:none;background:rgba(5,6,3,.78);border:1.5px solid #8a9a3b;border-radius:10px;padding:8px 11px;display:" + (depurar ? "block" : "none") + ";line-height:1.45;" + FONTE; ui.appendChild(painel);
    M.partes.forEach(p => p.liga && p.liga(ui, ctx));
  }
  function desliga(){ fechaRelogio(); M.partes.forEach(p => p.desliga && p.desliga()); [hud, painel].forEach(x => x && x.remove()); hud = painel = null; M.ui = null; sombras(false, null); }
  const icone = () => { const E = ciclo.estado; return E.alt > -2 ? (E.alt > 4 ? "☀" : "🌅") : "🌙"; };
  function atualizaHud(){
    if(!hud) return;
    if(!ciclo.ativo()){ hud.textContent = "🕒 relógio parado (clima manual)"; hud.style.opacity = ".55"; return; }
    hud.style.opacity = "1"; const E = ciclo.estado; hud.textContent = icone() + " " + ciclo.horaTexto() + " · " + E.fase + (ciclo.relogio.pausa ? " ⏸" : "") + (ciclo.emSalto() ? " ⏩" : "");
  }
  function atualizaPainel(){
    if(!painel || !depurar) return;
    const E = ciclo.estado, r = renderer.info.render, linhas = [
      "FPS " + fps.toFixed(0) + "   chamadas " + r.calls + "   triângulos " + (r.triangles / 1000).toFixed(0) + "k",
      "Hora " + ciclo.horaTexto() + " (dia " + ciclo.diaJogo() + ", " + ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][ciclo.diaSemana()] + ")  ×" + ciclo.relogio.mult + (ciclo.relogio.pausa ? "  PAUSADO" : ""),
      "Sol " + E.alt.toFixed(1) + "°   Lua " + E.moonAlt.toFixed(0) + "° fase " + (E.luaFase * 100).toFixed(0) + "%   luz " + E.lum.toFixed(2),
      "Neblina: " + nevoa.nome()
    ];
    M.partes.forEach(p => { const t = p.info && p.info(); if(t) linhas.push(t); });
    linhas.push("", ", .  ±1 h    - =  velocidade    0  pausa    1-5  horas", "N  neblina   J  sem névoa atmosférica   K  3:00 lua nova   F6 lobo  F7 leão-baio  F8 graxaim  Shift+F6 veado/quati/gambá/lontra  (Ctrl = ir à zona)", "F4  camionetes   Shift+F4  equipe da trilha   F2  capivaras   Shift+F7  capivaras × leão-baio", "F9 monomotor   Shift+F9 voo baixo   F10 jato   F11 meteoros   (ou U / Shift+U / I / O)", "Y jararaca   Ctrl+Y urutu   V coral   (Shift = na frente de um grupo com guia)   P  copia posição + lat/long + rumo", ";  polígonos do KML   '  teleporta (turfeira · nascentes · arroio)   \  dia úmido (sapinhos)", "`  revoada de andorinhas   Shift+`  vão embora   6  fim da estrada   7  estrada 1× / 0,5×   8  altitudes do DEM   ;  mostra o KML (cores por tipo)", "[  conflito leão-baio × lobo-guará   Shift+[  graxaim cede ao lobo   ]  gralhas × gavião   Shift+]  quero-quero e ninho   /  mirante da cascata   Shift+/  revoada de papagaios   Shift+\\  qualidade baixa/média/alta", "T  vento: brisa → vento → rajada   F12 / B  emergência das 10h   Shift+B  comboio de descida   Ctrl+B  ir até o resgate   9  serpente na frente do comboio   L  carregar KML");
    painel.textContent = linhas.join("\n");
  }
  /* tecla P: copia a posição do jogador (u do jogo, lat/long reais, rumo, hora e zona) para colar numa mensagem de bug. Também sai no console. */
  function copiaPosicao(){
    const J = M.jogador(); if(!J){ M.ctx && M.ctx.mostraAviso("Posição: só no modo andar"); return; }
    const [la, lo] = mundoParaLatLon(J.x, J.z), rumo = ((Math.PI / 2 - J.yaw + KMLCFG.rotacao) * 180 / Math.PI % 360 + 360) % 360;
    const alt = M.dem && M.dem.pronto ? " · terreno real ≈ " + M.dem.altReal(J.x, J.z).toFixed(0) + " m" : "";
    const txt = "pos x=" + J.x.toFixed(1) + " y=" + J.y.toFixed(1) + " z=" + J.z.toFixed(1) + " u · lat " + la.toFixed(6) + " lon " + lo.toFixed(6) + " · rumo " + rumo.toFixed(0) + "°" + alt + " · " + ciclo.horaTexto() + " · " + (M.zonas && M.zonas.S ? M.zonas.S.nome : "");
    console.info("Posição (P): " + txt);
    const avisa = (ok) => M.ctx && M.ctx.mostraAviso((ok ? "Posição copiada: " : "Posição (copie do console): ") + txt);
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(() => avisa(true), () => avisa(false)); return; } }catch(_){ /* sem clipboard */ }
    avisa(false);
  }
  function tecla(e){
    if(M.gente && M.gente.dialogoAberto()){ if(e.code === "Escape" || e.code === "KeyE"){ M.gente.fechaDialogo(); } e.preventDefault(); return true; }
    if(pr && e.code === "Escape"){ e.preventDefault(); fechaRelogio(); return true; }
    if(e.code === "F3"){ e.preventDefault(); depurar = !depurar; if(painel) painel.style.display = depurar ? "block" : "none"; M.resgate.liga(depurar); return true; }      // M.depurando continua função (os módulos chamam M.depurando())
    if(e.code === "F12"){ e.preventDefault(); const ok = M.resgate.inicia({ origem: "debug" }); M.ctx.mostraAviso(ok ? "Emergência das 10h forçada" : "Já há uma emergência em andamento"); return true; }
    if(e.code === "KeyP" && !e.ctrlKey && !e.altKey && !e.metaKey && !(M.ctx && M.ctx.construindo && M.ctx.construindo())){ e.preventDefault(); copiaPosicao(); return true; }
    if(M.partes.some(p => p.tecla && p.tecla(e))) return true;
    const evK = e.code === "F9" ? (e.shiftKey ? "baixo" : "mono") : e.code === "F10" ? "jato" : e.code === "F11" ? "met" : depurar && e.code === "KeyU" ? (e.shiftKey ? "baixo" : "mono") : depurar && e.code === "KeyI" ? "jato" : depurar && e.code === "KeyO" ? "met" : null;
    if(evK){ e.preventDefault(); if(evK === "mono" || evK === "baixo"){ M.aeronaves.voos.filter(v => v.tipo === "monomotor").forEach(v => { v.t = 1; }); M.aeronaves.iniciaMonomotor(evK === "baixo", { origem: "debug" }); M.ctx.mostraAviso(evK === "baixo" ? "Monomotor em voo baixo (debug)" : "Monomotor, altitude normal (debug)"); }
      else if(evK === "jato"){ M.aeronaves.iniciaJato({ origem: "debug" }); M.ctx.mostraAviso("Avião de passageiros (debug)"); }
      else { if(ciclo.estado.alt > -6) ciclo.ajustaHora(21.0); M.meteoros.limpa(); M.meteoros.inicia({ origem: "debug" }); } return true; }
    if(e.code === "F4"){ e.preventDefault(); const t = e.shiftKey ? M.gente.teletransporteEquipe("trilha") : M.gente.teletransporteEquipe("est"); if(t){ M.ctx.teleporta(t[0], t[1]); M.ctx.mostraAviso(e.shiftKey ? "Equipe da trilha" : "Camionetes do ICMBio"); } else M.ctx.mostraAviso("A equipe da trilha só faz ronda das 8h às 17h30"); return true; }
    const FA = { F6: "lobo", F7: "puma", F8: "graxaim" }, FD = depurar ? { Digit6: "lobo", Digit7: "puma", Digit8: "graxaim" } : {}, esp = FA[e.code] || FD[e.code];
    if(e.code === "F2"){ e.preventDefault(); const f = M.fauna.capi.familia, z = M.fauna.zonas.ZONAS.agua; const alvo = f ? [f.mae.x - Math.sin(f.mae.yaw) * -30, f.mae.z - Math.cos(f.mae.yaw) * -30] : (z.teleporte || z.centro); M.ctx.teleporta(alvo[0], alvo[1]); M.ctx.mostraAviso(f ? "Família de capivaras" : "Margem do arroio (sem capivaras agora: Shift+F7 chama o encontro)"); return true; }
    if(e.code === "F7" && e.shiftKey){ e.preventDefault(); const ok = M.fauna.forcarEncontro(M.jogador(), M.ctx.teleporta); M.ctx.mostraAviso(ok ? "Encontro capivaras × leão-baio" : "Não foi possível montar o encontro aqui — tente de novo"); return true; }
    if(e.code === "F6" && e.shiftKey){ e.preventDefault(); const L = ["veado", "quati", "gamba", "lontra"], id = L[(M._novoBicho = ((M._novoBicho === undefined ? -1 : M._novoBicho) + 1) % L.length)], J = M.jogador();
      if(e.ctrlKey){ M.fauna.teletransporta(id, M.ctx.teleporta); M.ctx.mostraAviso("Zona: " + M.fauna.zonas.ZONAS[ESPECIES[id].zona].nome); } else { const ok = M.fauna.forcar(id, J, M.ctx.teleporta); M.ctx.mostraAviso(ok ? "Avistamento forçado: " + ESPECIES[id].nome : "Não foi possível posicionar o animal aqui — tente de novo"); } return true; }
    if(esp){ e.preventDefault(); const J = M.jogador(); if(e.ctrlKey){ M.fauna.teletransporta(esp, M.ctx.teleporta); M.ctx.mostraAviso("Zona: " + M.fauna.zonas.ZONAS[{ lobo: "recebimento", puma: "agua", graxaim: "estacionamento" }[esp]].nome); }
      else { const ok = M.fauna.forcar(esp, J, M.ctx.teleporta); M.ctx.mostraAviso(ok ? "Avistamento forçado: " + esp : "Não foi possível posicionar o animal aqui — tente de novo"); } return true; }
    if(!depurar) return false;
    switch(e.code){
      case "Comma": ciclo.pulaHoras(e.shiftKey ? -6 : -1); break; case "Period": ciclo.pulaHoras(e.shiftKey ? 6 : 1); break;
      case "Minus": case "NumpadSubtract": ciclo.acelera(.5); break; case "Equal": case "NumpadAdd": ciclo.acelera(2); break;
      case "Digit0": case "Numpad0": ciclo.alternaPausa(); break;
      case "Digit1": ciclo.ajustaHora(5.5); break; case "Digit2": ciclo.ajustaHora(12); break; case "Digit3": ciclo.ajustaHora(17.75); break; case "Digit4": ciclo.ajustaHora(21); break; case "Digit5": ciclo.ajustaHora(2.5); break;
      case "KeyN": nevoa.proximoEstado(); break;
      case "Insert": { const E = M.estrada, n = E.pts.length, q = E.amostra(Math.max(0, E.len - 120)); M.H.andarMod.colocar(q.x, q.z, Math.atan2(q.tx, q.tz) + Math.PI); M.ctx.mostraAviso("Fim da estrada (" + Math.round(E.len / U) + " m de percurso)"); void n; break; }
      case "Delete": { const f = M.estrada.setFator(M.estrada.fator === 1 ? .5 : 1); M.ctx.mostraAviso("Estrada comprimida: " + (f === 1 ? "1× (comprimento real)" : "0,5× (metade)") + " → " + Math.round(M.estrada.len / U) + " m · a cidade se reposiciona no fim"); break; }
      case "PageDown": { const D = M.dem, E = M.estrada; if(!D || !D.pronto){ M.ctx.mostraAviso(D ? D.info() : "sem DEM"); break; } const u = M.zonas.urbano[0], P0 = E.pts[0], B = E.S.provisorio, a = (la, lo) => D.alt(la, lo); const l0 = M.kml.latLonParaMundo ? 0 : 0; void l0;
        M.ctx.mostraAviso("Altitudes (DEM): parque ≈ " + D.altReal(0, 0).toFixed(0) + " m · saída da estrada ≈ " + D.altReal(E.realPos(0).x, E.realPos(0).z).toFixed(0) + " m · fim da estrada ≈ " + D.altReal(E.realPos(E.len).x, E.realPos(E.len).z).toFixed(0) + " m" + (u ? " · cidade ≈ " + D.altReal(u.centro[0] - M.zonas.T[0], u.centro[1] - M.zonas.T[1]).toFixed(0) + " m" : "")); void P0; void B; void a; break; }
      case "KeyB": { e.preventDefault(); if(e.ctrlKey){ const t = M.resgate.teletransporte(); M.ctx.teleporta(t[0], t[1]); M.ctx.mostraAviso("Indo até o resgate"); } else if(e.shiftKey){ const ok = M.resgate.pulaParaDescida(.6); M.ctx.mostraAviso(ok ? "Comboio de descida (debug)" : "Não foi possível montar o comboio"); } else { const ok = M.resgate.inicia({ origem: "debug" }); M.ctx.mostraAviso(ok ? "Emergência forçada" : "Já há uma emergência em andamento"); } break; }
      case "Digit9": { const s = M.resgate.forcaSerpente(["jararaca", "urutu", "coral"][Math.floor(Math.random() * 3)]); M.ctx.mostraAviso(s ? "Serpente cruzando à frente do comboio" : "Sem trecho de trilha para a serpente"); break; }
      case "KeyL": M.kml.selecionar(); break;
      case "Semicolon": { const on = M.kml.mostra(!M._poli); M._poli = on; M.ctx.mostraAviso(on ? M.kml.legenda() : "KML oculto"); break; }
      case "NumpadMultiply": case "NumpadDivide": { e.preventDefault(); const A = M.anhanga; if(e.ctrlKey || e.code === "NumpadDivide"){ A.some(); M.ctx.mostraAviso("Anhangá some (depuração)"); break; } const J = M.jogador(), nasceu = A.apareceDiante(J); const f = nasceu ? A.atual : A.cicla(); M.ctx.mostraAviso("Anhangá: " + (nasceu ? "aparece à frente (cervo)" : "metamorfose → " + f)); if(M.terminal) M.terminal.msg("sobrenatural", nasceu ? "Algo branco se move entre as árvores. Os olhos brilham como brasa." : "Anhangá muda de forma: " + f + "."); break; }
      case "Quote": { if(e.shiftKey || e.ctrlKey){ e.preventDefault(); const A = M.anhanga; if(e.ctrlKey || e.code === "NumpadDivide"){ A.some(); M.ctx.mostraAviso("Anhangá some (depuração)"); break; } const J = M.jogador(), nasceu = A.apareceDiante(J); const f = nasceu ? A.atual : A.cicla(); M.ctx.mostraAviso("Anhangá: " + (nasceu ? "aparece à frente (cervo)" : "metamorfose → " + f)); if(M.terminal) M.terminal.msg("sobrenatural", nasceu ? "Algo branco se move entre as árvores. Os olhos brilham como brasa." : "Anhangá muda de forma: " + f + "."); break; }  const T = M.vegetacao.turfeira, L = [...T.polis().map(p => ["Meio da turfeira", () => T.meio(p)]), ...T.nascentes().map((n, i) => ["Nascente " + (i + 1), () => ({ x: n.x + 8, z: n.z + 8 })]), ["Margem do Arroio Graxaim", () => { const A = M.cen.rios.ARROIO, q = A[Math.min(A.length - 1, 5)]; return { x: q[0] + 14, z: q[1] }; }]]; M._tp = ((M._tp === undefined ? -1 : M._tp) + 1) % L.length; const [nome, f] = L[M._tp], p = f(); if(p){ M.ctx.teleporta(p.x, p.z); M.ctx.mostraAviso("Teleporte: " + nome); } break; }
      case "BracketLeft": { e.preventDefault(); const J = M.jogador(), ok = e.shiftKey ? M.fauna.conflitos.graxaimLobo(J, true) : M.fauna.conflitos.pumaLobo(J, true); M.ctx.mostraAviso(ok ? (e.shiftKey ? "Conflito: o graxaim cede o lugar ao lobo-guará (depuração)" : "Conflito: leão-baio avança, lobo-guará se afasta (depuração)") : "Não foi possível montar a cena aqui — ande um pouco e tente de novo"); break; }
      case "BracketRight": { e.preventDefault(); const J = M.jogador(); let ok; if(e.shiftKey){ ok = M.fauna.aves.forcaQuero(J); M.ctx.mostraAviso(ok ? "Quero-quero com ninho à frente: chegue perto (depuração)" : "Sem campo aberto por perto para o ninho — vá até o campo e tente de novo"); } else { ok = M.fauna.aves.iniciaGaviao(J, true); M.ctx.mostraAviso(ok ? "Gavião sobrevoando o bando de gralhas (depuração)" : "Não foi possível montar a cena aqui"); } break; }
      case "Backquote": { if(e.shiftKey){ M.fauna.andorinhas.parte(); M.ctx.mostraAviso("Andorinhas: o bando vai embora"); } else { M.fauna.andorinhas.chega(180); M.ctx.mostraAviso("Revoada de andorinhas no vão (depuração)"); } break; }
      case "Slash": { e.preventDefault(); const C = M.cen.cascata; if(e.shiftKey){ M.fauna.aves.revoada(M.jogador()); M.ctx.mostraAviso("Revoada de papagaios (depuração)"); } else { const px = C.x - 52, pz = C.z + 24; M.H.andarMod.colocar(px, pz, Math.atan2(C.x - px, C.z - pz) + Math.PI); M.ctx.mostraAviso("Mirante da cascata Gravatá do Noivo"); } break; }
      case "Backslash": { if(e.shiftKey){ const L = ["baixa", "media", "alta"], q = (() => { try{ return localStorage.getItem("sgv:qualidade") || "media"; }catch(_){ return "media"; } })(), n = L[(L.indexOf(q) + 1) % 3]; try{ localStorage.setItem("sgv:qualidade", n); }catch(_){ /* sem armazenamento */ } M.ctx.mostraAviso("Qualidade: " + n + " (vale ao recarregar a página — ou use ?q=" + n + ")"); break; } const on = M.fauna.sapinhos.forcaUmido(); M.ctx.mostraAviso(on ? "Dia úmido forçado: mais sapinhos ativos" : "Umidade normal"); break; }
      case "KeyT": { const o = ["brisa", "vento", "rajada"], i = (M._vt = ((M._vt === undefined ? -1 : M._vt) + 1) % 3); M.vento.forca(o[i]); M.ctx.mostraAviso("Vento: " + o[i]); break; }
      case "KeyY": case "KeyV": { const id = e.code === "KeyV" ? "coral" : e.ctrlKey ? "urutu" : "jararaca", s = M.fauna.serp.frente(id, M.jogador(), e.shiftKey); /* P passou a copiar a posição; urutu = Ctrl+Y */ if(s && s.grupoRef){ const g = s.grupoRef; M.ctx.teleporta(g.x - Math.sin(g.yaw) * 16 * U, g.z - Math.cos(g.yaw) * 16 * U); } M.ctx.mostraAviso(s ? s.nome + (e.shiftKey ? (s.grupoRef ? " cruzando na frente de um grupo (debug)" : " cruzando (nenhum grupo com guia andando agora)") : " cruzando a trilha (debug)") : "Sem trecho de trilha adequado por perto"); break; }
      case "KeyJ": { const on = M.horizonte.alternaAtmos(); M.ctx.mostraAviso(on ? "Perspectiva atmosférica ligada" : "Paisagem distante SEM névoa atmosférica (geometria)"); break; }
      case "KeyK": if(e.shiftKey){ ciclo.luaNova(false); ciclo.ajustaHora(ciclo.hora()); } else { ciclo.luaNova(true); ciclo.ajustaHora(3); ciclo.relogio.pausa = true; M.ctx.mostraAviso("3:00 com lua nova (Shift+K desfaz)"); } break;
      default: return false;
    }
    e.preventDefault(); return true;
  }

  let ultT = performance.now();
  function tick(dt){
    const J = M.andando() ? M.jogador() : null;
    cam.getWorldPosition(vcam);
    const dtM = M.congelado ? dt * 1e-4 : dt;                                                                             // Pit parou o tempo: o mundo recebe dt≈0 (o jogador continua)
    ciclo.tick(dtM, vcam);
    if(ciclo.ativo()){ nevoa.tick(dtM, ciclo.estado, vcam, dtM * ciclo.segJogoPorSeg()); }
    else nevoa.grupo.visible = false;
    sombras(!!J, J);
    if(cen.paredao){ const n = nevoa.estado ? nevoa.estado.n : 0; cen.paredao.U.uWet.value += (Math.min(1, n * .45 + (ciclo.estado.h < 9.5 ? .2 : 0)) - cen.paredao.U.uWet.value) * Math.min(1, dt * .3); }
    const zAtual = M.zonas ? M.zonas.atual : "parque";
    M.partes.forEach(p => { if(p.zona && ZONAS.simulaSoNaZona && p.zona !== zAtual) return; p.tick && p.tick(p.semCongelar ? dt : dtM, J, ciclo.estado); });       // NPCs, fauna, partículas e sons só rodam na zona do jogador
    quadros++; const t = performance.now(); if(t - tFps > 500){ fps = quadros * 1000 / (t - tFps); quadros = 0; tFps = t; atualizaHud(); atualizaPainel(); marcaHoraAtual(); }
    void ultT; void Frustum; void Matrix4;
  }
  M.tick = tick; M.liga = liga; M.desliga = desliga; M.tecla = tecla; M.depurando = () => depurar; M.fps = () => fps;
  return M;
}
