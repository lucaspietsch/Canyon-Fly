import { PointLight, Mesh, SphereGeometry, MeshBasicMaterial, AdditiveBlending } from "three";
import { sessao } from "../seguranca/senha.js";

/* ============================================================================================================
   TRANSFORMAÇÃO AUTOMÁTICA DO OPERADOR NO TEMPO ANTIGO
   • Ao cruzar o pórtico da Vila Santana (época "1950") com um operador LOGADO em uso: clarão da cor dele, roupa de trabalho vira a
     "roupa de poder" (dados/personagens.js → `transformacao`) e os poderes do operador ficam ativos. Ao voltar ao presente ("2026"),
     volta sozinho ao uniforme da tirolesa e os poderes desligam. Nenhuma tecla é necessária.
   • A troca de roupa recolore os tecidos do boneco (os materiais com trama de tecido): camisa/manga e calça; o capacete também.
     As cores originais ficam guardadas em userData para a volta.
   • Velocidade: `transformacao.velocidade` (ex.: 2 = 100% mais rápido) entra no modo andar por cen.extraChao.velMult().
   ============================================================================================================ */
const CAMISA0 = 0x56642d, CALCA0 = 0x4a5729;                                                        // uniforme da tirolesa (constroiOperador / Pit)
export function criarTransformacao(M){
  const S = { ativa: false, id: null, luz: null, bolha: null, t: 0, cor: 0xffffff };
  const def = (id) => M.personagens && M.personagens.def(id);
  const operadorLogado = () => { const id = sessao.operador(); return id && M.personagens && M.personagens.ativo === id && def(id) && def(id).operador ? id : null; };
  const avatarDe = () => { const am = M.H && M.H.andarMod; const A = am && am.avatar ? am.avatar() : (M.ctx && M.ctx.avatar ? M.ctx.avatar() : null); return A && A.av ? A.av : null; };

  function tecidos(av){ const L = []; av.traverse(o => { if(o.isMesh && o.material && o.material.map && Math.abs(o.material.roughness - .92) < .01 && !L.includes(o.material)) L.push(o.material); }); return L; }
  function capacetes(av){ const L = []; av.traverse(o => { if(o.isMesh && o.material && !o.material.map && o.material.color && o.material.color.getHex() === 0xe8731a && !L.includes(o.material)) L.push(o.material); }); return L; }
  function veste(av, T, d0){
    tecidos(av).forEach(m => { if(m.userData.cor0 === undefined) m.userData.cor0 = m.color.getHex(); const c0 = m.userData.cor0; const cor = c0 === CALCA0 ? T.calca : T.camisa; m.color.setHex(cor); if(T.brilho && m.emissive){ m.emissive.setHex(cor); m.emissiveIntensity = T.brilho * .5; } });      // brilho na própria cor do tecido (o clarão é que leva a cor do operador)
    capacetes(av).forEach(m => { if(m.userData.cor0 === undefined) m.userData.cor0 = m.color.getHex(); m.color.setHex(T.capacete !== undefined ? T.capacete : T.cor); });
    if(T.cabelo !== undefined){ const d = d0 || def(S.id), c0 = (d && d.modelo && d.modelo.cabelo) || 0x1e140d;                                  // cabelo: material sem trama, roughness 1, na cor original do cabelo
      av.traverse(o => { if(o.isMesh && o.material && !o.material.map && o.material.roughness === 1 && o.material.color && (o.material.userData.cor0 === c0 || o.material.color.getHex() === c0)){ const m = o.material; if(m.userData.cor0 === undefined) m.userData.cor0 = m.color.getHex(); m.color.setHex(T.cabelo); if(T.brilhoCabelo && m.emissive){ m.emissive.setHex(T.cabelo); m.emissiveIntensity = T.brilhoCabelo; } } }); }
  }
  function despe(av){ av.traverse(o => { if(o.isMesh && o.material && o.material.userData && o.material.userData.cor0 !== undefined){ o.material.color.setHex(o.material.userData.cor0); if(o.material.emissive) { o.material.emissive.setHex(0); o.material.emissiveIntensity = 0; } } }); }
  function clarao(av, cor){
    limpaFx(); S.luz = new PointLight(cor, 0, 40, 1.6); S.luz.position.set(0, 3, 0); av.add(S.luz);
    S.bolha = new Mesh(new SphereGeometry(2.2, 20, 14), new MeshBasicMaterial({ color: cor, transparent: true, opacity: .0, blending: AdditiveBlending, depthWrite: false })); S.bolha.position.set(0, 2.4, 0); av.add(S.bolha); S.t = 0;
  }
  function limpaFx(){ [S.luz, S.bolha].forEach(o => { if(o && o.parent) o.parent.remove(o); }); if(S.bolha){ S.bolha.geometry.dispose(); S.bolha.material.dispose(); } S.luz = S.bolha = null; }

  function liga(id){
    const d = def(id), T = d && d.transformacao, av = avatarDe(); if(!T || !av) return false;
    S.ativa = true; S.id = id; S.cor = T.cor; veste(av, T); clarao(av, T.cor);
    if(M.terminal) M.terminal.msg("sobrenatural", d.nome + " se transforma: " + T.nome + ". " + (T.texto || ""));
    if(M.ctx) M.ctx.mostraAviso(T.nome + " — poderes ativos");
    if(M.poderes && M.poderes.aoTransformar) M.poderes.aoTransformar(id, true);
    return true;
  }
  function desliga(){
    if(!S.ativa) return; const av = avatarDe(), d = def(S.id); if(av) despe(av); limpaFx();
    if(M.terminal && d) M.terminal.msg("info", d.nome + " volta ao uniforme de trabalho da tirolesa. Poderes desativados.");
    if(M.poderes && M.poderes.aoTransformar) M.poderes.aoTransformar(S.id, false);
    S.ativa = false; S.id = null;
  }
  /* chamado pelos lugares quando a época muda ("1950" / "2026") e pelos personagens quando o jogador troca de boneco */
  function aoEpoca(e){ const id = operadorLogado(); if(e === "1950" && id){ if(!S.ativa || S.id !== id){ if(S.ativa) desliga(); liga(id); } } else if(S.ativa) desliga(); }
  function tick(dt){
    if(!S.ativa) return;
    if(S.luz){ S.t += dt; const k = S.t < .6 ? S.t / .6 : Math.max(0, 1 - (S.t - .6) / 1.4); S.luz.intensity = 60 * k; if(S.bolha){ S.bolha.material.opacity = .55 * k; S.bolha.scale.setScalar(1 + S.t * 1.6); } if(S.t > 2.2){ limpaFx(); } }
    const av = avatarDe(); if(av && av.userData._trajeDe !== S.id){ const d = def(S.id); if(d && d.transformacao){ veste(av, d.transformacao); av.userData._trajeDe = S.id; } }     // trocou de boneco (ou o rig foi recriado): reveste
    const ep = M.lugares && M.lugares.epoca ? M.lugares.epoca() : "2026"; if(ep !== "1950") desliga();
  }
  const velMult = () => { const d = S.ativa && def(S.id); return d && d.transformacao && d.transformacao.velocidade ? d.transformacao.velocidade : 1; };
  const info = () => (S.ativa ? "Transformado: " + (def(S.id) || {}).nome + " (" + def(S.id).transformacao.nome + ")" : (sessao.logado() ? "Operador logado: " + sessao.operador() : ""));
  /* para retratos: veste/despe um boneco qualquer com a roupa de poder de `id`, sem mexer no estado da transformação */
  const vesteEm = (av, id) => { const d = def(id); if(d && d.transformacao && av) veste(av, d.transformacao, d); };
  return { S, liga, desliga, aoEpoca, tick, velMult, info, ativa: () => S.ativa, desligaTudo: () => { desliga(); }, vesteEm, despeEm: (av) => av && despe(av) };
}
