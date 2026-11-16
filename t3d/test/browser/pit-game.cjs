// Teste integrado do bundle real. Antes: build e servidor HTTP na raiz (porta 8000).
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1000,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('canyonfly:perfil',JSON.stringify({nome:'Teste Pit',dia:1,fim:true,pulou:true})));
 await page.goto((process.env.PIT_GAME_URL||'http://127.0.0.1:8000/')+'?modo=teclado&debug');await page.click('#jogar');await page.waitForFunction(()=>window.ctl?.mundo?.personagens,null,{timeout:180000});
 const powers=await page.evaluate(()=>{
  ctl.andar(true);const M=ctl.mundo,P=M.poderes,am=ctl.andarMod,U=2.94,p=M.H.PIT_RIG,tests={};
  tests.modelo=!!p.pitVisual&&!p.pitVisual.armado;
  M.lugares.S.antigo=true;tests.semLogin=!M.transformacao.liga('pit');
  // Simula a sessão resultante do login PBKDF2, validado em senha-pit.test.mjs.
  sessionStorage.setItem('canyonfly:operador','pit');M.personagens.escolhe('pit');M.transformacao.aoEpoca('1950');
  tests.automatico=M.transformacao.ativa()&&p.pitVisual.armado;
  M.poderes.treino(M.jogador()); // mesma área de teste criada por Shift+V no debug
  const J=M.jogador(),a=P.espantalho(J.x,J.z+5*U,'Alvo do Pit');
  const states=[];
  for(const tipo of ['lobo','humano','assombracao']){P.pit.S.tipo=tipo;P.pit.S.energia=100;P.S.recargas.pit=0;P.usa();states.push(P.pit.S.holos.at(-1).tipo);}
  tests.familias=states.join(',')==='lobo,humano,assombracao';
  const hpInicial=a.hp;P.pit.S.foco=a;P.pit.S.focoT=6;for(let i=0;i<60;i++)P.tick(.05,J);tests.ataque=a.hp<hpInicial;
  let abriu=false;const dispose=P.pit.registraHackeavel('portao-debug',{pos:{x:J.x+Math.sin(J.yaw)*4*U,z:J.z+Math.cos(J.yaw)*4*U},hackear:()=>abriu=true});tests.hack=P.pit.hackeia(J)&&abriu;dispose();
  tests.q=M.tecla({code:'KeyQ',preventDefault(){}});
  p.av.updateMatrixWorld(true);tests.matrizes=true;p.av.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))tests.matrizes=false;});
  const snapshots=()=>{
    const water=[];M.cen.grupo.traverse(o=>{if(o.material?.uniforms)for(const [k,v]of Object.entries(o.material.uniforms))if(/time|^uT$/.test(k)&&typeof v.value==='number')water.push([o.uuid,k,v.value]);});
    return {water,offset:M.cen.terreno?.wtex?.offset.toArray(),npcs:M.H.npcs.map(p=>[p.av.position.toArray(),p.tronco.scale.toArray(),p.cab.rotation.toArray()]),fx:P.S.fx.map(f=>f.t),holos:P.pit.S.holos.map(h=>[h.t,h.root.position.toArray()])};
  };
  window.pitSnapshots=snapshots;M.tecla({code:'KeyF',preventDefault(){}});tests.f=M.congelado;
  window.pitBefore=snapshots();window.pitPos=am.estado();am.teclas.add('ArrowUp');return tests;
 });
 await page.waitForTimeout(1200);
 const freeze=await page.evaluate(()=>{const am=ctl.andarMod,M=ctl.mundo;am.teclas.clear();const after=pitSnapshots(),j=am.estado(),before=pitBefore;const froze=JSON.stringify(before)===JSON.stringify(after);const moved=Math.hypot(j.x-pitPos.x,j.z-pitPos.z)>0;const data={froze,moved,water:before.water.length,npcs:before.npcs.length,frozen:M.congelado,changes:Object.keys(before).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]))};M.poderes.pit.liberaTempo();M.lugares.S.antigo=false;M.transformacao.aoEpoca('2026');data.normal=!M.H.PIT_RIG.pitVisual.armado&&!M.transformacao.ativa();return data;});
 console.log(JSON.stringify({powers,freeze,errors}));assert.ok(Object.values(powers).every(Boolean),'poderes e identidade');assert.ok(freeze.froze&&freeze.moved&&freeze.frozen&&freeze.normal,'mundo imóvel, Pit se move e retorno normal');assert.deepEqual(errors,[]);
 if(process.env.PIT_SCREENSHOTS){const dir=path.resolve(__dirname,'../../../docs/media/pit');fs.mkdirSync(dir,{recursive:true});await page.evaluate(()=>{const p=ctl.mundo.H.PIT_RIG;p.bD.pv.rotation.set(.04,0,-.08);p.bD.co.rotation.set(-.1,0,0);p.bE.pv.rotation.set(.04,0,.08);p.bE.co.rotation.set(-.1,0,0);p.cab.rotation.set(0,0,0);p.nome.visible=false;});for(const armor of [false,true])for(const angle of [0,90]){const url=await page.evaluate(({armor,angle})=>ctl.mundo.personagens.retrato('pit',angle,{px:900,fundo:0x29333f,transformado:armor}),{armor,angle});fs.writeFileSync(path.join(dir,`pit-${armor?'armadura':'normal'}-${angle===0?'frente':'perfil'}.png`),Buffer.from(url.split(',')[1],'base64'));}}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
