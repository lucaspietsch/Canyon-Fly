import {Group,Mesh,SphereGeometry,TubeGeometry,CatmullRomCurve3,Vector3} from 'three';
// Bigode cheio com pontas levantadas e cavanhaque curto, conforme a referência.
export function criarBarbaPit(pai,material){
 const g=new Group();g.name='pit-bigode-e-cavanhaque';pai.add(g);
 for(const s of [-1,1]){
  const curva=new CatmullRomCurve3([new Vector3(s*.025,-.305,.785),new Vector3(s*.19,-.29,.795),new Vector3(s*.37,-.305,.755),new Vector3(s*.53,-.275,.69),new Vector3(s*.66,-.19,.615)]),n=32,k=12,geo=new TubeGeometry(curva,n,1,k,false),p=geo.attributes.position;
  for(let j=0;j<=n;j++){const t=j/n,c=curva.getPointAt(t),r=.064*(1-t)**.8+.002;for(let v=0;v<=k;v++){const i=j*(k+1)+v;p.setXYZ(i,c.x+(p.getX(i)-c.x)*r,c.y+(p.getY(i)-c.y)*r*.77,c.z+(p.getZ(i)-c.z)*r);}}geo.computeVertexNormals();const m=new Mesh(geo,material);m.name='pit-bigode-'+(s<0?'esquerdo':'direito');g.add(m);
 }
 const patch=(name,x,y,z,a,b,c)=>{const m=new Mesh(new SphereGeometry(1,24,16).scale(a,b,c),material);m.name=name;m.position.set(x,y,z);g.add(m);};
 patch('pit-barba-queixo',0,-.685,.565,.205,.13,.105);
 patch('pit-barba-ponta',0,-.815,.43,.12,.065,.07);
 patch('pit-barba-sob-labio',0,-.565,.645,.082,.052,.037);
 return g;
}
