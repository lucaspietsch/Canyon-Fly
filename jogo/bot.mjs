import { createRequire } from 'module';
const pw = createRequire('/node-tools/node_modules/')('playwright');
export const SS='/tmp/claude-0/-home-user-terradoscanionsonline/4402a907-7914-5e13-a377-e2e9d32cc443/scratchpad/jogo/';
export async function abrir(vw=1280,vh=720,mobile=false){
  const b = await pw.chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:{width:vw,height:vh},isMobile:mobile,hasTouch:mobile});
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text())});
  await p.goto('file://'+SS+'index.html'); await p.waitForTimeout(500);
  const w = ms=>p.waitForTimeout(ms);
  const pos = id=>p.evaluate(id=>{ const h=window.__sim.hits().filter(h=>h.id===id).pop()||window.__sim.drags().filter(h=>h.id===id).pop(); return h?{x:h.x+h.w/2,y:h.y+h.h/2,S:window.__sim.S(),OY:window.__sim.OY(),en:h.en}:null},id);
  const click = async id=>{ await w(50); const r=await pos(id); if(!r) throw new Error('sem '+id+' em '+await st()+' passo '+await p.evaluate(()=>window.__sim.chk()?.i)); if(r.en===false) throw new Error('desabilitado '+id); await p.mouse.click(r.x*r.S,(r.y+r.OY)*r.S); await w(50); };
  const tryClick = async id=>{ const r=await pos(id); if(!r||r.en===false) return false; await p.mouse.click(r.x*r.S,(r.y+r.OY)*r.S); await w(50); return true; };
  const dragTo = async (id,tx,ty)=>{ const r=await pos(id); await p.mouse.move(r.x*r.S,(r.y+r.OY)*r.S); await p.mouse.down(); await p.mouse.move((r.x+(tx-r.x)/2)*r.S,(r.y+r.OY+(ty-r.y)/2)*r.S,{steps:4}); await p.mouse.move(tx*r.S,(ty+r.OY)*r.S,{steps:4}); await p.mouse.up(); await w(160); };
  const st = ()=>p.evaluate(()=>window.__sim.estado());
  const shot = n=>p.screenshot({path:SS+'s-'+n+'.png'});
  const ev = (f,a)=>p.evaluate(f,a);
  return {b,p,errs,w,pos,click,tryClick,dragTo,st,shot,ev};
}
export async function playClient(g, o={}){
  const {p,w,click,tryClick,dragTo,st,shot,ev}=g; const tag=o.tag||'';
  const cli = await ev(()=>window.__sim.T().fila[window.__sim.T().idx]);
  const via = o.via||3; await click('via'+via); await w(250);
  let lastI=-1;
  for(let guard=0; guard<400; guard++){
    const s=await st(); if(s!=='CHECKLIST') break;
    const i=await ev(()=>window.__sim.chk()?.i); if(i===undefined||i===null) break;
    const tipo=await ev(()=>window.__sim.chk()?null:null);
    const info=await ev(()=>{const c=window.__sim.chk(); return c?{i:c.i,d:c.d}:null}); if(!info) break;
    if(i!==lastI){ lastI=i; if(o.shots) await shot(tag+'c'+i); }
    if(i===0){ const ok=await ev(()=>{const c=window.__sim.chk().cli;const lim=c.vento>40?60:40;return c.total>=lim&&c.total<=110}); if(info.d.fase===1){ const fr=await ev(()=>window.__sim.chk().d.frases.map(f=>f[1])); await click('frase'+fr.indexOf(1)); continue;} if(ok) await click(o.errPeso?'recusar':'liberar'); else await click(o.errPeso?'liberar':'recusar'); if(o.errPeso){ await w(200); if(o.shots) await shot(tag+'erro'); o.errPeso=false; } continue; }
    if(i===1){ const ops=await ev(()=>window.__sim.chk().d.ops.map(x=>x[1])); const k=ops.indexOf(1); await click('op'+k); continue; }
    if(i===2){ if(info.d.fase===0){ for(const id of ['touca','oculos','capacete','cinto','cadeirinha']){ const ex=await ev(id=>window.__sim.drags().some(d=>d.id===id), id); if(ex) await dragTo(id,810,420); } } else { // esperar zona
        await ev(()=>{const d=window.__sim.chk().d; d.vel=0; d.pos=d.zona;}); await click('ajustar'); } continue; }
    if(i===3){ await dragTo('roldana', 640+(via===5?-250:via===1?250:0), 360); await w(900); continue; }
    if(i===4){ for(let k=0;k<3;k++){ await click('gate'+k); await click('trava'+k); } await click('conferir'); await w(1800); continue; }
    if(i===5){ const f=info.d.falha; if(f>=0&&!info.d.corrigido){ const col=f%3,row=Math.floor(f/3); await click('item'+f); await click('reportar'); await w(200); } else await click('tudook'); continue; }
    if(i===6){ const f=info.d.f; if(f===0){ await click('r1'); await w(300);} else if(f===2){ if(!(await tryClick('r2'))) await w(200);} else if(f===4){ await click('avancar'); } else await w(250); continue; }
    if(i===7){ const f=info.d.f; if(f===0){ await click('iniciar'); } else if(f===1) await w(300); else await click('gatilho'); continue; }
  }
  return cli;
}

export async function resolveExt(g){
  const {w,click,tryClick,ev,st,shot}=g; let ult=-1, tent=0;
  for(let guard=0; guard<400; guard++){
    const s=await st(); if(s!=='EXTRACAO') return;
    const info=await ev(()=>{const E=window.__sim.EXT(); const p=E.def.passos[E.i]; return {i:E.i,tipo:p.tipo,p:JSON.parse(JSON.stringify(p)),d:E.d,nome:p.nome}});
    if(info.i!==ult){ ult=info.i; if(g.shots) await shot('x-'+g.tagx+info.i); }
    const t=info.tipo;
    if(t==='radio'){ if(info.d.f===0) await click('chama'); else await w(300); }
    else if(t==='bloqueio'){ for(const v of [1,3,5]) await tryClick('bl'+v); }
    else if(t==='itens'){ for(let k=0;k<info.p.itens.length;k++){ if(info.p.itens[k][1] && !info.d.feitos.includes(k)) await tryClick('it'+k); } }
    else if(t==='toque'){ await click('toque'); }
    else if(t==='puxar'){ for(let k=0;k<info.p.n+1;k++){ if(!(await tryClick('puxa'))) break; await w(40);} }
    else if(t==='escolha'){ const k=info.p.ops.findIndex(o=>o[1]); await click('op'+k); }
    else if(t==='dupla'){ if(info.d.falha>=0 && !info.d.corrigido){ await click('ri'+info.d.falha); await click('rrep'); } else await click('rok'); }
    await w(60);
  }
}
export async function resolveRec(g){
  const {w,click,tryClick,ev,st,shot}=g;
  for(let guard=0; guard<600; guard++){
    const s=await st(); if(s!=='RECEBIMENTO') return;
    const r=await ev(()=>{const R=window.__sim.REC(); return {espera:R.espera,fim:R.fim,t:R.t}});
    if(r.espera==='dupla'){ if(g.shots) await shot('r-dupla'); await tryClick('pt1'); await tryClick('pt2'); }
    if(r.fim){ if(g.shots) await shot('r-fim'+(g.tagx||'')); await click('continuar'); return; }
    if(g.cordas && r.t>6.9){ await shot('r-cordas'); g.cordas=false; }
    if(r.t>8 && !r.espera){ await ev(()=>window.__sim.setT(Math.max(window.__sim.REC().t, 1))); }
    await w(150);
  }
}
