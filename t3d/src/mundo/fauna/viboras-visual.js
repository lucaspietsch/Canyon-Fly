import {Group,Mesh,SphereGeometry,MeshStandardMaterial} from 'three';
import {canvasTex} from '../../lib.js';
export function perfilVibora(u,tipo='jararaca'){
 const cab=Math.exp(-(((u-.038)/.027)**2)),pescoco=Math.exp(-(((u-.105)/.038)**2)),cauda=1-.975*Math.max(0,Math.min(1,(u-.65)/.35))**1.25;
 return{largura:(.78+(tipo==='urutu'?1.22:1.05)*cab-.20*pescoco)*cauda,altura:(.72+.24*cab)*cauda};
}
export function texturaVibora(tipo){const tex=canvasTex(2048,256,(c,w,h)=>{
 const urutu=tipo==='urutu',base=urutu?'#514b43':'#776943';c.fillStyle=base;c.fillRect(0,0,w,h);
 const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(0,0,0,.12)');grad.addColorStop(.25,'rgba(0,0,0,.04)');grad.addColorStop(.55,'rgba(215,201,155,.18)');grad.addColorStop(.75,'rgba(220,208,169,.9)');grad.addColorStop(.95,'rgba(0,0,0,.10)');grad.addColorStop(1,'rgba(0,0,0,.12)');c.fillStyle=grad;c.fillRect(0,0,w,h);
 const count=urutu?14:18;for(let i=0;i<count;i++)for(const side of [-1,1]){const x=155+i*(w-155)/count+(side>0?20:0),y=(side<0?.10:.40)*h; c.beginPath();if(urutu){c.moveTo(x-34,y+18);c.bezierCurveTo(x-53,y-34,x+24,y-44,x+40,y-9);c.bezierCurveTo(x+46,y+18,x+15,y+38,x-3,y+22);c.lineTo(x+10,y+3);c.bezierCurveTo(x+17,y+18,x+29,y+4,x+15,y-5);c.bezierCurveTo(x-9,y-20,x-34,y-1,x-20,y+12);}else{c.moveTo(x-25,y+21);c.lineTo(x+3,y-29);c.lineTo(x+31,y+22);c.lineTo(x+12,y+18);c.lineTo(x+1,y+1);c.lineTo(x-10,y+20);}c.closePath();c.fillStyle=urutu?'#282521':'#302b1e';c.fill();c.strokeStyle=urutu?'#d8ccad':'#ad9c70';c.lineWidth=urutu?4:2;c.stroke();}
 // Escamas em losangos, com fileiras alternadas e sem ruído aleatório por quadro.
 c.lineWidth=.7;c.strokeStyle='rgba(19,20,14,.25)';for(let row=0;row<32;row++)for(let col=0;col<130;col++){const x=col*16+(row%2)*8,y=row*8;c.beginPath();c.moveTo(x,y-4);c.lineTo(x+8,y);c.lineTo(x,y+4);c.lineTo(x-8,y);c.closePath();c.stroke();}
 // Faixas pós-oculares e desenho no topo (v=.25), sem uma cruz genérica na jararaca.
 c.fillStyle='#302b23';for(const y of [.06,.43])c.fillRect(0,y*h,135,13);
 if(urutu){c.strokeStyle='#e3d6b7';c.lineWidth=3;c.beginPath();c.moveTo(24,.25*h);c.bezierCurveTo(45,.19*h,70,.20*h,87,.25*h);c.bezierCurveTo(70,.30*h,45,.31*h,24,.25*h);c.moveTo(49,.25*h);c.lineTo(102,.25*h);c.moveTo(73,.205*h);c.lineTo(73,.295*h);c.stroke();}
 },{hd:1,aniso:4});tex.flipY=false;return tex;}
export function criarRostoVibora(){const g=new Group(),mats=[],geos=[];const add=(x,y,z,a,b,c,col)=>{const geo=new SphereGeometry(1,14,10).scale(a,b,c),mat=new MeshStandardMaterial({color:col,roughness:.55});geos.push(geo);mats.push(mat);const mesh=new Mesh(geo,mat);mesh.position.set(x,y,z);g.add(mesh);};for(const s of [-1,1]){add(s*1.24,.33,.32,.19,.17,.18,0x92844d);add(s*1.35,.34,.40,.025,.13,.060,0x121b16);add(s*1.40,.39,.44,.012,.022,.018,0xe5d6a1);add(s*.75,.0,.80,.06,.065,.045,0x292c20);}return{g,dispose(){g.removeFromParent();geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());}};}
