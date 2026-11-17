import {Color} from 'three';
import {criarCambaraensis,geometriasCambaraensis,COMPRIMENTO_CAMBARAENSIS} from './cambaraensis-visual.js';
export const COMPRIMENTO_DORSALIS=COMPRIMENTO_CAMBARAENSIS;
// Ilhas de vermelho separadas por pele escura, em vez de um ventre vermelho uniforme.
function mancha(x,z,cx,cz,rx,rz,fase){const X=(x-cx)/rx,Z=(z-cz)/rz,a=Math.atan2(Z,X),r=1+.12*Math.sin(a*5+fase)+.08*Math.sin(a*3-fase);return X*X+Z*Z<r*r;}
export function geometriasDorsalis(){
 const geo=geometriasCambaraensis();
 for(const [key,g]of Object.entries(geo)){if(key==='olhos')continue;const p=g.attributes.position,c=g.attributes.color;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let hex=0x202621;
   if(key==='corpo'){const ilha=mancha(x,z,-.13,.14,.105,.12,.8)||mancha(x,z,.14,-.015,.10,.14,2.1)||mancha(x,z,-.015,-.245,.22,.085,1.2);if(y<-.035&&ilha)hex=0xc02a24;else if(y>.27)hex=i%3?0x30352c:0x242b23;else if(y>.18&&Math.abs(x)<.013&&z>-.28&&z<.26)hex=0x643d31;}
   else if(key==='cabeca'){if(y<-.07&&mancha(x,z,-.10,.07,.085,.11,1))hex=0xb62c23;else if(y>.13)hex=0x30362d;}
   else if(y<-.16&&x>.075)hex=0xb52c25;
   else if(y>-.06&&i%7===0)hex=0x3c3f2c;
   const v=new Color(hex);c.setXYZ(i,v.r,v.g,v.b);
  }
 }
 return geo;
}
export function criarDorsalis(pai,max=22){return criarCambaraensis(pai,max,{geo:geometriasDorsalis(),nome:'sapinho-de-barriga-vermelha',especie:'Melanophryniscus dorsalis',rugosidade:.44});}
