import { EVENTOS } from "./config.js";

/* ============================================================================================================
   AGENDADOR DE EVENTOS ligado ao relógio do jogo
   Cada evento registrado: { id, cfg, dispara(info) }. O agendador dispara quando o relógio passa pelo horário (diário, ou a cada X horas listadas), sorteia a chance
   do dia, e NÃO dispara durante o salto do relógio clicável. Depois do salto, se a hora escolhida é exatamente a de um evento (ex.: 10:00 ou 21:00), o evento acontece
   logo em seguida. Ganchos para eventos futuros: agenda.registra({ id, cfg: EVENTOS.eclipseLunar, dispara }).
   ============================================================================================================ */
export function criarAgenda(M){
  const lista = []; let hAnt = null, esperas = [];
  const registra = (ev) => { lista.push(ev); return ev; };
  const passou = (t, a, b) => (a <= b ? (a < t && t <= b) : (t > a || t <= b));      // cruzou o horário t entre a e b (com a virada da meia-noite)

  function tick(dt, E){
    const h = E.h;
    if(hAnt === null) hAnt = h;
    if(!M.ciclo.emSalto() && !M.ciclo.relogio.pausa){
      lista.forEach(ev => { const c = ev.cfg; if(!c || !c.ativo) return; (c.horarios || []).forEach(t => { if(passou(t, hAnt, h) && Math.random() < (c.chance === undefined ? 1 : c.chance)) ev.dispara({ origem: "agenda", hora: t }); }); });
    }
    hAnt = h;
    esperas = esperas.filter(w => { w.t -= dt; if(w.t <= 0){ w.fn(); return false; } return true; });
  }
  /* depois do salto: eventos cujo horário é exatamente o escolhido acontecem logo em seguida (2 s) */
  function aoSalto(E){
    hAnt = E.h;
    const h = Math.round(E.h * 60) / 60;
    lista.forEach(ev => { const c = ev.cfg; if(!c || !c.ativo) return; (c.horarios || []).forEach(t => { if(Math.abs((((h - t + 12) % 24) + 24) % 24 - 12) < .02){ esperas.push({ t: 2, fn: () => ev.dispara({ origem: "salto", hora: t, sempre: true }) }); } }); });
  }
  return { registra, tick, aoSalto, lista, config: EVENTOS };
}
