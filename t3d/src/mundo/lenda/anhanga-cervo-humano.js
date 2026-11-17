import {Group,Mesh,SphereGeometry,ConeGeometry,TubeGeometry,CatmullRomCurve3,Vector3,MeshStandardMaterial,MeshBasicMaterial} from 'three';
import {criarAnhangaHumano} from './anhanga-humano.js';
export function criarAnhangaCervoHumano(H){
 const visual=criarAnhangaHumano(H),r=visual.rig;for(const o of r.cab.children)o.visible=false;
 const bone=new MeshStandardMaterial({color:0xe6e0cc,roughness:.76}),dark=new MeshStandardMaterial({color:0x252c29,roughness:1}),red=new MeshStandardMaterial({color:0x8b2724,roughness:.8}),fire=new MeshBasicMaterial({color:0xff8b45});const skull=new Group();skull.name='anhanga-cranio-cervo';r.cab.add(skull);
 const oval=(p,m,x,y,z,a,b,c)=>{const o=new Mesh(new SphereGeometry(1,20,14),m);o.position.set(x,y,z);o.scale.set(a,b,c);p.add(o);return o;};
 const line=(p,pts,m,rad=.05)=>{const o=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),24,rad,7,false),m);p.add(o);return o;};
 oval(skull,bone,0,.2,0,.66,.76,.44);oval(skull,bone,0,-.48,.33,.29,.60,.39);oval(skull,dark,0,-.88,.65,.14,.13,.025);
 for(const side of [-1,1]){oval(skull,dark,side*.38,.15,.373,.21,.24,.065);oval(skull,fire,side*.38,.15,.438,.082,.10,.025);const ear=oval(skull,bone,side*.79,.59,-.06,.17,.46,.085);ear.rotation.z=-side*.88;const root=[side*.42,.69,-.15];const pts=[root,[side*.64,1.15,-.16],[side*1.1,1.75,-.05],[side*1.42,2.5,.08],[side*1.28,3.0,.20]];line(skull,pts,bone,.075);for(let i=1;i<4;i++){const a=pts[i];line(skull,[a,[side*(.95+i*.27),a[1]+.33,.25],[side*(1.20+i*.26),a[1]+.70,.40]],i===3?red:bone,.045);}line(skull,[[side*.20,-.20,.56],[side*.17,-.55,.72],[side*.10,-.88,.67]],red,.025);}
 line(skull,[[0,.71,.40],[0,.34,.46],[0,-.10,.49]],red,.035);
 const mane=new Group();mane.name='anhanga-manto-branco';r.tronco.add(mane);for(const side of [-1,1])for(let i=0;i<8;i++){const p=new Mesh(new ConeGeometry(.11,.75+(i%3)*.15,9),bone);p.position.set(side*(.55+i*.05),1.78-i*.09,-.2+i*.045);p.rotation.z=Math.PI+side*.28;mane.add(p);}
 return{rig:r,tick(t){skull.rotation.z=Math.sin(t*.6)*.01;}};
}
