// Regras compartilhadas em unidades do mundo; os dados de habilidades continuam em metros.
export const hostil = a => !!a && !a.morto && (a.tipo === "inimigo" || a.tipo === "guardiao");
export function emCone(J, p, alcance, cone){
  const dx=p.x-J.x,dz=p.z-J.z,dist=Math.hypot(dx,dz);
  return Number.isFinite(dist) && dist<=alcance && (dist<.001 || (dx*Math.sin(J.yaw)+dz*Math.cos(J.yaw))/dist>=Math.cos(cone*Math.PI/180));
}
export function alvosEmCone(alvos,J,alcance,cone,tipos){
  return alvos.filter(a=>!a.morto&&(!tipos||tipos.includes(a.tipo))&&emCone(J,a.pos(),alcance,cone)).sort((a,b)=>Math.hypot(a.pos().x-J.x,a.pos().z-J.z)-Math.hypot(b.pos().x-J.x,b.pos().z-J.z));
}
export function encadeia(alvos,primeiro,raio,max){
  if(!primeiro)return[];const cadeia=[primeiro],usados=new Set(cadeia);
  while(cadeia.length<max){const p=cadeia.at(-1).pos();let proximo=null,menor=raio;
    for(const a of alvos){if(!hostil(a)||usados.has(a))continue;const q=a.pos(),dist=Math.hypot(q.x-p.x,q.z-p.z);if(dist<=menor){menor=dist;proximo=a;}}
    if(!proximo)break;cadeia.push(proximo);usados.add(proximo);
  }return cadeia;
}
// Interseção contínua entre o movimento de um projétil e um cilindro vertical.
// Evita que flechas atravessem alvos entre dois quadros, inclusive com FPS baixo.
export function impactoSegmento(de,ate,p,raio,yMin,yMax){
  const dx=ate.x-de.x,dz=ate.z-de.z,ox=de.x-p.x,oz=de.z-p.z,A=dx*dx+dz*dz;
  let inicio=0,fim=1;
  if(A<1e-10){if(ox*ox+oz*oz>raio*raio)return null;}
  else{const B=2*(ox*dx+oz*dz),C=ox*ox+oz*oz-raio*raio,D=B*B-4*A*C;if(D<0)return null;const r=Math.sqrt(D);inicio=Math.max(inicio,(-B-r)/(2*A));fim=Math.min(fim,(-B+r)/(2*A));}
  const dy=ate.y-de.y;
  if(Math.abs(dy)<1e-10){if(de.y<yMin||de.y>yMax)return null;}
  else{const a=(yMin-de.y)/dy,b=(yMax-de.y)/dy;inicio=Math.max(inicio,Math.min(a,b));fim=Math.min(fim,Math.max(a,b));}
  return inicio<=fim&&fim>=0&&inicio<=1?Math.max(0,inicio):null;
}
export function descarta(obj){
  if(!obj)return;obj.removeFromParent();const geos=new Set(),mats=new Set();obj.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)mats.add(m);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
}
