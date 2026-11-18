import {Group,Mesh,SphereGeometry,ConeGeometry,TubeGeometry,CatmullRomCurve3,Vector3,MeshStandardMaterial,MeshBasicMaterial} from 'three';
/** Silhueta lupina: dorso curvado, focinho, orelhas altas e garras articuladas. */
export function criarVisualLobisomem(){
 const g=new Group(),tronco=new Group(),arms=[],legs=[];g.name='lobisomem-olaria';g.add(tronco);
 const pelo=new MeshStandardMaterial({color:0x242b32,roughness:1}),juba=new MeshStandardMaterial({color:0x111820,roughness:1}),pele=new MeshStandardMaterial({color:0x41454a,roughness:.95}),osso=new MeshStandardMaterial({color:0xd8c9a6,roughness:.65}),boca=new MeshStandardMaterial({color:0x160c12,roughness:1}),olho=new MeshBasicMaterial({color:0xffdf71});
 const oval=(p,m,x,y,z,a,b,c)=>{const o=new Mesh(new SphereGeometry(1,16,12),m);o.position.set(x,y,z);o.scale.set(a,b,c);p.add(o);return o;};
 const tube=(p,m,pts,r)=>{const o=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),12,r,6,false),m);p.add(o);return o;};
 oval(tronco,pelo,0,1.9,0,.48,.75,.31);oval(tronco,pelo,0,2.35,.05,.75,.53,.44);oval(tronco,juba,0,2.50,-.24,.69,.57,.38);
 for(const s of [-1,1]){oval(tronco,pelo,s*.35,2.35,.34,.35,.28,.20);for(let i=0;i<8;i++){const f=new Mesh(new ConeGeometry(.12,.45,6),juba);f.position.set(s*(.44+i*.035),2.60-i*.09,-.15);f.rotation.z=Math.PI+s*.6;tronco.add(f);}}

 const head=new Group();head.position.set(0,2.85,.28);head.rotation.x=.12;tronco.add(head);oval(head,pelo,0,0,0,.36,.40,.35);oval(head,pele,0,-.15,.38,.24,.19,.40);oval(head,boca,0,-.25,.47,.20,.08,.31);oval(head,juba,0,-.09,.72,.16,.095,.10);
 for(const s of [-1,1]){const ear=new Mesh(new ConeGeometry(.16,.50,7),pelo);ear.position.set(s*.25,.40,-.06);ear.rotation.z=-s*.24;head.add(ear);oval(head,olho,s*.19,.065,.29,.075,.045,.025);oval(head,juba,s*.20,.13,.28,.15,.055,.07);for(let i=0;i<3;i++){const tooth=new Mesh(new ConeGeometry(.035,i===0?.17:.09,7),osso);tooth.position.set(s*(.15-i*.03),-.27,.38+i*.09);tooth.rotation.z=Math.PI;head.add(tooth);}}
 for(const s of [-1,1]){
  const arm=new Group();arm.position.set(s*.68,2.43,.03);tronco.add(arm);oval(arm,pelo,s*.08,-.30,0,.25,.44,.25);oval(arm,pelo,s*.18,-.84,.11,.19,.40,.20);oval(arm,pele,s*.19,-1.22,.20,.21,.24,.13);
  for(let i=0;i<4;i++){const x=s*.19+(i-1.5)*.10;tube(arm,pele,[[x,-1.25,.22],[x,-1.48,.25],[x,-1.56,.32]],.045);tube(arm,osso,[[x,-1.49,.30],[x,-1.60,.40],[x,-1.55,.48]],.025);}arms.push(arm);
  const leg=new Group();leg.position.set(s*.31,1.47,-.05);g.add(leg);oval(leg,pelo,0,-.24,.08,.28,.48,.28);tube(leg,pelo,[[0,-.49,.14],[0,-.86,-.12],[0,-1.27,.04]],.13);oval(leg,pele,0,-1.37,.20,.19,.10,.34);for(let i=0;i<3;i++)tube(leg,osso,[[(i-1)*.11,-1.36,.40],[(i-1)*.11,-1.40,.57]],.025);legs.push(leg);
 }
 tube(g,juba,[[0,1.55,-.25],[0,1.15,-.65],[0,.73,-.87]],.11);
 function tick(t,ataque=-1,fase=0,movendo=false){tronco.position.y=Math.sin(t*2)*.025;head.rotation.y=Math.sin(t*.7)*.05;arms.forEach((a,i)=>{const hit=i===ataque?Math.sin(Math.min(1,fase)*Math.PI):0;a.rotation.x=-hit*1.8+(movendo?Math.sin(t*10+i*Math.PI)*.3:0);a.rotation.z=(i?1:-1)*(.1+hit*.65);});legs.forEach((l,i)=>l.rotation.x=movendo?Math.sin(t*10+i*Math.PI)*.35:0);}
 return{g,arms,tick,dispose(){const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());}};
}
