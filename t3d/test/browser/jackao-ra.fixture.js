import './fixture.js';
import { WebGLRenderer, Scene, Color, FogExp2, Mesh, BoxGeometry, SphereGeometry, MeshBasicMaterial } from 'three';
const {M,P,U,target,activate,step}=window.test;
const renderer=new WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(800,600);document.body.replaceChildren(renderer.domElement);
const scene=new Scene();scene.background=new Color(0x86918b);scene.fog=new FogExp2(0x86918b,.035);scene.add(M.cen.grupo);
const muro=new Mesh(new BoxGeometry(42,30,2),new MeshBasicMaterial({color:0x193c27}));muro.position.set(0,10,40);scene.add(muro);
M.cam.aspect=4/3;M.cam.position.set(0,6,0);M.cam.lookAt(0,6,120);M.cam.updateProjectionMatrix();
window.fogTest=()=>{
 activate('jackao');const a=target('gritador-escondido',0,40);a.nome='Gritador';
 const corpo=new Mesh(new SphereGeometry(1,24,16),new MeshBasicMaterial({color:0x201b26}));corpo.scale.set(1.2,2.5,1);corpo.position.y=4;a.g.add(corpo);
 const cab=new Mesh(new SphereGeometry(.9,24,16),corpo.material);cab.position.y=7;a.g.add(cab);
 const conta=()=>{renderer.render(scene,M.cam);const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');x.drawImage(renderer.domElement,0,0);const px=x.getImageData(0,0,800,600).data;let cyan=0;for(let i=0;i<px.length;i+=4)if(px[i+1]>130&&px[i+2]>170&&px[i+2]>px[i]*1.25)cyan++;return cyan;};
 P.jackao.oculos(false);const sem=conta();P.jackao.oculos(true);step(.1);const com=conta(),m=P.jackao.S.marcas.get(a);return {ok:com>sem+50&&m.sp.material.fog===false&&m.linhas.length===2&&m.txt.includes('40 m'),sem,com,txt:m.txt,depth:m.sp.material.depthTest,nevoa:scene.fog.density};
};window.fogCapture=()=>renderer.domElement.toDataURL();
