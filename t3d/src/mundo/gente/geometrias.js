import { SphereGeometry, TubeGeometry, CylinderGeometry, PlaneGeometry, BufferGeometry, Float32BufferAttribute, Vector3, CatmullRomCurve3, Color, TorusGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { geometriaCabeca } from "../personagens/rosto.js";

const caixa = (w,h,d,x=0,y=0,z=0,r=.06) => new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)).translate(x,y,z);
const oval = (x,y,z,rx,ry,rz) => new SphereGeometry(1,14,10).scale(rx,ry,rz).translate(x,y,z);
const junta = (...geos) => mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g));

// Perfil elíptico fechado, suave e compartilhado por todas as instâncias.
// Os extremos de raio zero fecham as peças sem tampas planas nas articulações.
export function perfilCorpo(aneis, segmentos = 20){
  const curva = new CatmullRomCurve3(aneis.map(([y,rx,rz]) => new Vector3(rx,y,rz)));
  const pos=[],uv=[],indices=[],filas=18;
  for(let j=0;j<=filas;j++){
    const p=curva.getPoint(j/filas);
    for(let i=0;i<=segmentos;i++){
      const a=i/segmentos*Math.PI*2;
      pos.push(Math.sin(a)*Math.max(0,p.x),p.y,Math.cos(a)*Math.max(0,p.z));uv.push(i/segmentos,j/filas);
      if(j && i<segmentos){const k=j*(segmentos+1)+i;indices.push(k,k-segmentos-1,k+1,k+1,k-segmentos-1,k-segmentos);}
    }
  }
  const g=new BufferGeometry();g.setAttribute("position",new Float32BufferAttribute(pos,3));g.setAttribute("uv",new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  // Os vértices duplicados da costura precisam da mesma normal.
  const n=g.attributes.normal;
  for(let j=0;j<=filas;j++){const a=j*(segmentos+1),b=a+segmentos,v=new Vector3().fromBufferAttribute(n,a).add(new Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
  return g;
}

// Só os pequenos detalhes do rosto usam cores fixas. Pele e cabelo continuam por pessoa.
function detalhesRosto(){
  const partes=[];
  const cor=(geo,hex)=>{const c=new Color(hex),a=[];for(let i=0;i<geo.attributes.position.count;i++)a.push(c.r,c.g,c.b);geo.setAttribute("color",new Float32BufferAttribute(a,3));partes.push(geo);};
  for(const s of [-1,1]){
    cor(oval(s*.155,.038,.350,.077,.030,.023),0xe4dfd3);
    cor(oval(s*.155,.038,.370,.025,.026,.008),0x4c3727);
    cor(oval(s*.155,.038,.377,.012,.016,.004),0x12100e);
    cor(oval(s*.155,.127,.327,.080,.013,.012),0x3a2b22);
  }
  cor(oval(0,-.222,.320,.087,.011,.012),0x986e63);
  return junta(...partes);
}

export function criarGeometriasPessoas(){
  const tronco = [[0,0,0],[.08,.49,.33],[.35,.54,.35],[.85,.60,.38],[1.35,.70,.41],[1.65,.72,.39],[1.85,.60,.32],[1.98,.28,.22],[2.03,0,0]];
  const colete = tronco.map(([y,x,z])=>[y*.92+.05,x?x+.055:0,z?z+.065:0]);
  const cabeca=junta(geometriaCabeca().scale(.47,.48,.50),oval(0,-.065,.416,.060,.055,.065),oval(0,.015,.365,.047,.12,.05),oval(-.405,-.045,-.04,.055,.105,.065),oval(.405,-.045,-.04,.055,.105,.065));
  const bota=junta(caixa(.56,.30,.86,0,-1.01,.14,.12),caixa(.58,.12,.90,0,-1.15,.14,.05),oval(0,-.85,-.06,.23,.30,.24));
  const mao=junta(oval(0,0,0,.15,.20,.085),oval(-.13,-.005,.015,.05,.105,.06),...[-.09,-.03,.03,.09].map((x,i)=>oval(x,-.17,.005,.035,.10-Math.abs(i-1)*.012,.04)));
  const cabelo=new SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.58).scale(.415,.51,.40).translate(0,.03,-.05);
  const capacete=junta(new SphereGeometry(.51,20,14,0,Math.PI*2,0,Math.PI*.55).scale(1,1,.94).translate(0,.10,-.01),caixa(.70,.05,.33,0,.08,.40,.02));
  const chapeu=junta(new CylinderGeometry(.78,.80,.065,40).scale(1,1,.89).translate(0,.27,0),new SphereGeometry(.51,28,18,0,Math.PI*2,0,Math.PI*.54).scale(1,.85,.93).translate(0,.27,0),new TorusGeometry(.50,.026,8,32).rotateX(Math.PI/2).scale(1,1,.93).translate(0,.29,0));
  const bone=junta(new SphereGeometry(.48,20,12,0,Math.PI*2,0,Math.PI*.52).translate(0,.10,-.02),caixa(.65,.045,.50,0,.10,.48,.02));
  const mochila=junta(caixa(.94,1.22,.50,0,0,0,.18),caixa(.72,.44,.13,0,-.28,-.31,.10),caixa(.80,.46,.10,0,.43,-.29,.13),caixa(.20,.55,.35,-.53,-.20,.02,.08),caixa(.20,.55,.35,.53,-.20,.02,.08),new TorusGeometry(.14,.035,8,20).scale(1,.8,1).translate(0,.72,.05));
  const alcas=junta(...[-1,1].map(s=>new TubeGeometry(new CatmullRomCurve3([new Vector3(s*.30,1.80,-.34),new Vector3(s*.48,1.55,.36),new Vector3(s*.43,.88,.45),new Vector3(s*.37,.35,-.22)]),20,.045,8,false)));
  const fecho=caixa(.12,.19,.065,0,.17,-.365,.025),gorro=junta(new SphereGeometry(.49,24,16,0,Math.PI*2,0,Math.PI*.57).scale(1,1.06,1).translate(0,.12,-.02),new TorusGeometry(.465,.07,10,32).rotateX(Math.PI/2).translate(0,.08,-.02),oval(0,.68,-.02,.12,.12,.12));
  const jaqueta=junta(perfilCorpo(colete),...[.27,.64,1.01,1.38,1.69].map((y,i)=>caixa([1.02,1.11,1.23,1.40,1.31][i],.39,[.77,.80,.85,.88,.79][i],0,y,0,.16)));
  const cameraParts=[];const tingir=(g,c)=>{g=g.index?g.toNonIndexed():g;const cor=new Color(c),a=[];for(let i=0;i<g.attributes.position.count;i++)a.push(cor.r,cor.g,cor.b);g.setAttribute('color',new Float32BufferAttribute(a,3));cameraParts.push(g);};
  tingir(caixa(.48,.31,.16,0,.13,.25,.045),0xb8844e);tingir(caixa(.45,.07,.17,0,.30,.25,.02),0xe8d9b7);tingir(new CylinderGeometry(.11,.12,.12,24).rotateX(Math.PI/2).translate(.035,.14,.39),0x292c29);tingir(new SphereGeometry(.085,20,16).scale(1,1,.17).translate(.035,.14,.46),0x46656b);tingir(caixa(.10,.045,.06,-.14,.35,.24,.015),0xe8d9b7);
  return {
    perna:perfilCorpo([[-1.20,0,0],[-1.16,.21,.22],[-.75,.25,.26],[-.25,.30,.30],[0,.25,.25],[.08,0,0]]),
    canela:perfilCorpo([[-1.12,0,0],[-1.04,.16,.17],[-.62,.20,.21],[-.28,.23,.24],[0,.21,.22],[.05,0,0]]),
    braco:perfilCorpo([[-.94,0,0],[-.88,.16,.17],[-.48,.21,.21],[-.08,.24,.23],[.09,.18,.18],[.14,0,0]]),
    antebraco:perfilCorpo([[-.88,0,0],[-.83,.115,.13],[-.52,.15,.17],[-.15,.18,.19],[.03,.16,.17],[.06,0,0]]),
    tronco:perfilCorpo(tronco),colete:perfilCorpo(colete),bota,mao,cabeca,rosto:detalhesRosto(),cabelo,
    pescoco:new CylinderGeometry(.16,.20,.38,16).translate(0,2.04,0),
    rabo:oval(0,-.20,-.39,.13,.35,.15),chapeu,bone,capacete,gorro,jaqueta,alcas,fecho,camera:junta(...cameraParts),
    mochila,garrafa:new CylinderGeometry(.14,.14,.72,12),bastao:new CylinderGeometry(.04,.05,3.8,8),
    celular:caixa(.28,.48,.045,0,0,0,.015),binoculo:junta(oval(-.14,0,0,.11,.12,.22),oval(.14,0,0,.11,.12,.22)),
    prancheta:caixa(.65,.88,.04,0,0,0,.012),radio:caixa(.20,.43,.15,0,0,0,.03),logo:new PlaneGeometry(1,1),
    faixa:new CylinderGeometry(.5,.5,1,24,1,true)
  };
}
