import {Group,Mesh,SphereGeometry,CylinderGeometry,TubeGeometry,CatmullRomCurve3,Vector3,MeshStandardMaterial} from 'three';
import {perfilCorpo} from '../gente/geometrias.js';
export function constroiAtiara(H,def){
 const skin=new MeshStandardMaterial({color:def.modelo.pele,roughness:.8}),hair=new MeshStandardMaterial({color:0x20150f,roughness:.93}),fiber=new MeshStandardMaterial({color:0x937249,roughness:1}),rope=new MeshStandardMaterial({color:0xbaa077,roughness:1}),ink=new MeshStandardMaterial({color:0x292c26,roughness:1}),red=new MeshStandardMaterial({color:0x903e2e,roughness:1});
 const r=H.pessoa3d({nome:def.nome,x:0,y:-50,z:0,yaw:0,camisa:skin,manga:skin,calca:skin,pele:skin,cabelo:0x20150f,barba:false,oculos:false,olhos:0x3d3023});r.av.name='atiara';r.av.userData.referencia='Atiara short historia · prints recebidos';r.capG.visible=false;r.ocG.visible=false;r.equip.forEach(o=>o.visible=false);r.cab.scale.setScalar(.49);r.cab.position.y=4.75;
 const oval=(pai,m,x,y,z,a,b,c)=>{const o=new Mesh(new SphereGeometry(1,20,14),m);o.position.set(x,y,z);o.scale.set(a,b,c);pai.add(o);return o;};
 const line=(pai,pts,m,rad=.025)=>{const o=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,rad,7,false),m);pai.add(o);return o;};
 const body=r.tronco.children[0];body.geometry=perfilCorpo([[0,.66,.43],[.3,.69,.44],[.9,.80,.55],[1.40,.91,.62],[1.65,.91,.58],[1.95,.57,.38],[2.07,.29,.22]],32);body.material=skin;body.position.y=0;body.scale.set(1,1,1);for(const o of r.tronco.children.slice(1,8))o.visible=false;
 for(const side of [-1,1]){oval(r.tronco,skin,side*.39,1.32,.42,.37,.22,.16);for(let i=0;i<3;i++)oval(r.tronco,skin,side*.20,.42+i*.24,.44,.19,.12,.075);}
 // Cabelo longo liso, com mechas e pontas caindo por trás e pelos ombros.
 const hairG=new Group();r.cab.add(hairG);oval(hairG,hair,0,.50,-.14,1.02,.65,.92);for(let i=0;i<22;i++){const a=i/21*Math.PI*1.55+.23,x=Math.sin(a)*.78,z=-.10+Math.cos(a)*.63;line(hairG,[[x,.54,z],[x*1.05,-.30,z-.10],[x*1.03,-1.25,z-.15],[x*.88,-2.25-(i%3)*.13,z+.10]],hair,.085+(i%3)*.014);}
 for(const side of [-1,1])for(let i=0;i<6;i++)line(hairG,[[side*(.80+i*.025),.40,.30],[side*(.95+i*.035),-.60,.58],[side*(1.12+i*.03),-1.60,1.05],[side*(1.1+i*.03),-2.65,1.32]],hair,.12);
 // Pinturas geométricas derivadas dos prints, sem atribuir um significado tradicional.
 for(const s of [-1,1]){line(r.cab,[[s*.20,-.08,.91],[s*.72,-.12,.72]],red,.035);line(r.cab,[[s*.21,-.20,.89],[s*.67,-.22,.73],[s*.45,-.43,.74],[s*.43,-.65,.61]],ink,.025);line(r.cab,[[s*.68,-.29,.72],[s*.67,-.58,.59]],ink,.027);}line(r.cab,[[0,-.62,.81],[0,-.88,.43]],ink,.028);
 for(const b of [r.bD,r.bE]){b.pv.traverse(o=>{if(o.isMesh){o.material=skin;}});for(let i=0;i<3;i++)line(b.pv,[[.12+i*.10,-.18,.31],[.10+i*.10,-.76,.31]],i===1?red:ink,.024);}
 // Pernas e pés descalços nas poses paradas e na caminhada.
 for(const q of r.pernasA.quadril){q.traverse(o=>{if(o.isMesh){if(o.geometry.type==='BoxGeometry')o.visible=false;else o.material=skin;}});}for(const j of r.pernasA.joelho){for(const o of j.children)if(o.isMesh&&o.geometry.type==='CylinderGeometry'){o.geometry=new CylinderGeometry(.35,.24,1.16,22);o.position.y=-.52;}const boot=j.children.find(o=>o.isGroup);if(boot){boot.clear();oval(boot,skin,0,.23,.12,.27,.20,.48);for(let i=0;i<5;i++)oval(boot,skin,-.19+i*.085,.14,.51,.052,.075,.13-i*.012);}}
 r.estat.forEach(o=>o.visible=false);r.estat=r.pernasA.quadril.map(q=>{const g=q.clone(true);r.av.add(g);return g;});
 const skirt=new Mesh(new CylinderGeometry(.78,.94,.95,32,1,true),fiber);skirt.position.y=2.23;r.av.add(skirt);for(let i=0;i<42;i++){const a=i/42*Math.PI*2;line(r.av,[[Math.sin(a)*.78,2.70,Math.cos(a)*.78],[Math.sin(a)*.94,1.85-(i%5)*.04,Math.cos(a)*.94]],i%3?fiber:rope,.026);}
 line(r.av,[[-.7,2.70,.18],[0,2.65,.80],[.70,2.70,.14]],rope,.055);line(r.av,[[-.65,4.10,.52],[0,3.3,.72],[.60,2.73,.48]],rope,.042);
 const bow=new Group();bow.name='arco-de-atiara';r.av.add(bow);line(bow,[[-.62,2.55,-.75],[-1.05,4.30,-.91],[-.63,6.15,-.74]],fiber,.043);line(bow,[[-.62,2.55,-.75],[-.63,6.15,-.74]],rope,.012);
 const quiver=new Mesh(new CylinderGeometry(.25,.21,1.78,18),fiber);quiver.position.set(.60,4.22,-.77);quiver.rotation.z=-.20;r.av.add(quiver);for(let i=0;i<8;i++){const x=.40+(i%3)*.14,y=5.1+(i%2)*.14,z=-.90+Math.floor(i/3)*.12;line(r.av,[[x-.18,3.65,z],[x,y+.65,z]],rope,.015);oval(r.av,hair,x,y+.45,z,.055,.22,.024);}
 const futuro=new Group();futuro.name='atiara-roupa-2071';r.av.add(futuro);futuro.visible=false;const casaco=new MeshStandardMaterial({color:0x5c6048,roughness:1}),calca=new MeshStandardMaterial({color:0x4e493c,roughness:1});
 for(const side of [-1,1]){oval(futuro,casaco,side*.61,3.25,.30,.30,.91,.42);line(futuro,[[side*.30,4.02,.60],[side*.42,3.64,.72],[side*.37,2.48,.67]],rope,.035);}
 const mangas=[];for(const b of [r.bD,r.bE]){const g=new Mesh(new CylinderGeometry(.31,.32,.80,20),casaco);g.position.y=-.40;b.pv.add(g);g.visible=false;mangas.push(g);}
 const faixa=new Group();r.cab.add(faixa);faixa.visible=false;line(faixa,Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return[Math.sin(a)*.89,.30,Math.cos(a)*.77];}),rope,.065);oval(faixa,new MeshStandardMaterial({color:0x376b79}),.64,.92,-.24,.10,.43,.034);
 const pernasRoupa=[];for(const g of [...r.pernasA.quadril,...r.estat])g.traverse(o=>{if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop>.30)pernasRoupa.push(o);});
 let modo=false,t=0;return{id:def.id,nome:def.nome,p:r,epoca(ano){modo=String(ano)==='2071';futuro.visible=faixa.visible=modo;skirt.visible=!modo;mangas.forEach(o=>o.visible=modo);pernasRoupa.forEach(o=>o.material=modo?calca:skin);},tick(dt){t+=dt;hairG.rotation.z=Math.sin(t*1.4)*.012;}};
}
