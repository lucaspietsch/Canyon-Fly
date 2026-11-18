import {Raycaster,Vector3} from 'three';
const ray=new Raycaster(),down=new Vector3(0,-1,0);
/** Apoia os atores nas faces efetivamente desenhadas do terreno urbano. */
export function pisoHistorico(M,x,z){const meshes=[];for(const g of M.cidade?.S.zonas.values()||[]){for(const o of g.children){if(o.isMesh)meshes.push(o);else if(o.children[0]?.isMesh)meshes.push(o.children[0]);}}if(M.estrada?.malha)meshes.push(M.estrada.malha);for(const o of meshes)o.updateWorldMatrix(true,false);ray.set(new Vector3(x,1000000,z),down);const hit=ray.intersectObjects(meshes,false)[0];return hit?hit.point.y+.02:M.cen.chao(x,z,1e9);}
