// Captura determinística do jogo: câmera lateral, sem HUD, 24 quadros/s.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const out=path.resolve(process.env.VIDEO_OUT||'/workspace/artifacts/videos-jogo');
const preview=process.env.PREVIEW==='1';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>raf(t=>{if(!window.capturePaused)fn(t);});HTMLElement.prototype.requestFullscreen=()=>Promise.resolve();localStorage.setItem('canyonfly:perfil',JSON.stringify({nome:'Produção',fim:true,pulou:true,dia:1}));});
  await p.goto(process.env.GAME_URL||'http://127.0.0.1:8062/?modo=teclado&q=baixa');await p.click('#jogar');
  await p.waitForFunction(()=>window.ctl?.mundo?.futuro&&ctl.mundo.kml.S.carregado,null,{timeout:180000});
  await p.evaluate(()=>{ctl.andar(true);const M=ctl.mundo;window.captureOrigin={...M.jogador()};M.congelado=true;M.H.andarMod.cinema(true);window.capturePaused=true;M.renderer.setPixelRatio(1);M.renderer.setSize(1280,720,false);M.cam.aspect=1280/720;M.cam.fov=48;M.cam.updateProjectionMatrix();});
  console.log('Jogo pronto');
  for(const scene of ['01-centro','02-anhanga','03-atiara-2071']){
   await p.evaluate(scene=>{
    const M=ctl.mundo;M.renderer.shadowMap.autoUpdate=true;
    if(scene==='01-centro'){M.ciclo.ajustaHora(11);const c=M.lugares.S.itens.find(p=>p.id==='praca').centro;M.ctx.teleporta(...c);M.lugares.tick(1,M.jogador());M.npcsCentro.tick(1,M.jogador());const J=M.jogador();window.captureView={x:J.x,y:J.y+3,z:J.z,dx:15,dy:13,dz:35,travel:22};}
    if(scene==='02-anhanga'){M.ctx.teleporta(captureOrigin.x,captureOrigin.z);M.lugares.tick(1,M.jogador());M.ciclo.ajustaHora(10);M.anhanga.apareceDiante(M.jogador());const a=M.anhanga.S.a;a.forma('cervoHumano');a.tick(1.2);a.tick(1.2);a.g.position.x+=30;a.g.position.y=M.cen.chao(a.g.position.x,a.g.position.z);const P=a.g.position;window.captureView={x:P.x,y:P.y+5,z:P.z,dx:0,dy:3,dz:23,travel:12};M.ctx.avatar().av.visible=false;}
    if(scene==='03-atiara-2071'){M.anhanga.some();M.missoes.S.prog.concl['v04-atiara']=true;M.futuro.entra();M.futuro.roupa();M.futuro.tick(0,M.jogador());M.ciclo.ajustaHora(7);M.ctx.avatar().av.visible=true;const J=M.jogador(),r=M.personagens.rig('atiara');r.epoca('2071');r.p.av.position.set(J.x,J.y,J.z);r.p.av.rotation.y=0;r.p.av.visible=true;if(r.p.nome)r.p.nome.visible=false;window.captureView={x:J.x,y:J.y+4,z:J.z-10,dx:13,dy:7,dz:34,travel:21};}
    if(M.ctx.avatar()?.nome)M.ctx.avatar().nome.visible=false;for(const r of M.H.npcs||[])if(r.nome)r.nome.visible=false;M.cena.traverse(o=>{if(o.isSprite)o.visible=false;});
   },scene);
   const dir=path.join(out,scene+'-frames');fs.mkdirSync(dir,{recursive:true});
   for(let i=0;i<(preview?1:96);i++){
    const data=await p.evaluate(({i,preview})=>{const M=ctl.mundo,v=captureView,t=preview?.5:i/95,s=t*t*(3-2*t);M.cam.position.set(v.x+v.dx+(s-.5)*v.travel,v.y+v.dy,v.z+v.dz);M.cam.lookAt(v.x,v.y,v.z);if(M.cen.ceu)M.cen.ceu.position.set(M.cam.position.x,0,M.cam.position.z);if(v.travel===12)M.anhanga.S.a.tick(1/24);M.renderer.render(M.cena,M.cam);M.renderer.shadowMap.autoUpdate=false;return M.renderer.domElement.toDataURL('image/jpeg',.94).split(',')[1];},{i,preview});
    const file=path.join(dir,String(i).padStart(4,'0')+'.jpg');fs.writeFileSync(file,Buffer.from(data,'base64'));
    if(i===0)fs.copyFileSync(file,path.join(out,scene+'-preview.jpg'));
    if(i%24===0)console.log(scene,i+'/96');
   }
   if(!preview){execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','24','-i',path.join(dir,'%04d.jpg'),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,scene+'.mp4')]);fs.rmSync(dir,{recursive:true});}
  }
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'captura.json'),JSON.stringify({resolucao:'1280x720',fps:24,segundosPorClipe:4,semAudio:true,origem:'Renderização do jogo atual; câmera lateral programada, sem HUD.',errors},null,2));console.log('Concluído',out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
