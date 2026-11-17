import {Group,Mesh,Shape,ShapeGeometry,TubeGeometry,CatmullRomCurve3,Vector3,MeshStandardMaterial} from 'three';
export function criarOculosPit(pai){
 const g=new Group();g.name='pit-oculos-escuros';g.scale.set(.94,.62,.80);g.position.set(0,-.05,.32);pai.add(g);const frame=new MeshStandardMaterial({color:0x252a2e,roughness:.26,metalness:.68}),lens=new MeshStandardMaterial({color:0x111518,roughness:.19,metalness:.26});
 const edge=new MeshStandardMaterial({color:0x555e63,roughness:.25,metalness:.65});
 const line=(pts,r=.019,material=frame)=>{const m=new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),28,r,8,false),material);g.add(m);return m;};
 for(const s of [-1,1]){const shape=new Shape();shape.moveTo(s*.055,.17);shape.quadraticCurveTo(s*.10,.30,s*.43,.30);shape.quadraticCurveTo(s*.72,.29,s*.74,.10);shape.quadraticCurveTo(s*.76,-.11,s*.57,-.25);shape.quadraticCurveTo(s*.39,-.36,s*.19,-.22);shape.quadraticCurveTo(s*.065,-.10,s*.055,.17);const geo=new ShapeGeometry(shape,32);const m=new Mesh(geo,lens);m.position.z=.94;g.add(m);const pts=shape.getPoints(32).map(p=>[p.x,p.y,.954]);line(pts,.032);line(pts.map(([x,y,z])=>[x,y,z+.024]),.0065,edge);line([[s*.73,.14,.94],[s*.87,.14,.64],[s*.91,.12,.20],[s*.90,.015,-.06]],.030);}
 line([[-.075,.145,.96],[0,.185,.985],[.075,.145,.96]],.028);line([[-.58,.34,.94],[0,.34,.96],[.58,.34,.94]],.025);
 return g;
}
