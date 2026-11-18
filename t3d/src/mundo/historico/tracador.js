import {Group,Mesh,Shape,ExtrudeGeometry,CylinderGeometry,MeshStandardMaterial,Vector3} from 'three';
import {U} from '../config.js';
export const CORTE_CENTENARIA={dias:4,segundosJogo:4*24*3600};
export function criarProgressoCorte(segundos=0){
 const S={segundos:Math.max(0,Math.min(CORTE_CENTENARIA.segundosJogo,Number.isFinite(segundos)?segundos:0))};
 return{S,avanca(dt,taxa){if(Number.isFinite(dt)&&dt>0&&Number.isFinite(taxa)&&taxa>0)S.segundos=Math.min(CORTE_CENTENARIA.segundosJogo,S.segundos+dt*taxa);return S.segundos>=CORTE_CENTENARIA.segundosJogo;},get fracao(){return S.segundos/CORTE_CENTENARIA.segundosJogo;},get dia(){return Math.min(4,1+Math.floor(S.segundos/86400));}};
}
const down=new Vector3(0,-1,0);
/** IK de dois segmentos mantém as mãos nas pegas durante a puxada alternada. */
function segura(r,arm,target,side){r.tronco.updateWorldMatrix(true,true);const grip=r.tronco.worldToLocal(target.clone()),start=arm.pv.position.clone(),delta=grip.clone().sub(start),dist=delta.length(),l1=Math.abs(arm.co.position.y),l2=Math.abs(arm.mao.position.y),d=Math.max(.001,Math.min(dist,l1+l2-.001)),dir=delta.normalize(),a=(l1*l1-l2*l2+d*d)/(2*d),bend=new Vector3(side*.8,-.4,-.7);bend.addScaledVector(dir,-bend.dot(dir)).normalize();const elbow=start.clone().addScaledVector(dir,a).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-a*a)));arm.pv.quaternion.setFromUnitVectors(down,elbow.clone().sub(start).normalize());const fore=grip.sub(elbow).applyQuaternion(arm.pv.quaternion.clone().invert()).normalize();arm.co.quaternion.setFromUnitVectors(down,fore);}
export function criarTracador(workers){
 const g=new Group();g.name='serrote-tracador-duas-pessoas';const metal=new MeshStandardMaterial({color:0x929b9c,metalness:.65,roughness:.58}),wood=new MeshStandardMaterial({color:0x775132,roughness:.95});
 const half=1.65*U,width=.14*U,shape=new Shape();shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(half,-width);for(let i=0;i<90;i++){const x=half-i/90*2*half;shape.lineTo(x,-width);shape.lineTo(x-half/90,-width-.035*U);}shape.lineTo(-half,-width);shape.closePath();const blade=new Mesh(new ExtrudeGeometry(shape,{depth:.012*U,bevelEnabled:false}),metal);blade.rotation.x=Math.PI/2;g.add(blade);
 const pegas=[];for(const side of [1,-1]){const handle=new Mesh(new CylinderGeometry(.05*U,.05*U,.34*U,12),wood);handle.position.set(side*(half-.07*U),.17*U,-width/2);g.add(handle);pegas.push(handle);}
 function pose(t,base,fracao=0){const swing=Math.sin(t*2.8),z=base.z+(.99-1.98*fracao)*U;g.position.set(base.x+swing*.12*U,base.y+.80*U,z);g.visible=true;g.updateWorldMatrix(true,true);for(const [i,w]of workers.entries()){const side=i===0?1:-1;w.g.position.set(base.x+side*1.92*U+swing*.025*U,base.y,z);w.g.rotation.y=-side*Math.PI/2;w.rig.tronco.rotation.x=-side*swing*.12;for(const [j,arm]of [w.rig.bD,w.rig.bE].entries()){const target=pegas[i].getWorldPosition(new Vector3());target.y+=(j?-.055:.055)*U;segura(w.rig,arm,target,j?1:-1);}w.g.updateWorldMatrix(true,true);}}
 function dispose(){g.removeFromParent();g.traverse(o=>o.geometry?.dispose());metal.dispose();wood.dispose();}
 return{g,pegas,pose,dispose};
}
