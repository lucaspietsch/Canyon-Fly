import { Group, Mesh, SphereGeometry, BufferGeometry, Float32BufferAttribute, TubeGeometry, CatmullRomCurve3, Vector3, MeshStandardMaterial, Color } from "three";

// Contorno contínuo de crânio e mandíbula. Os encaixes locais de cabelo e óculos são preservados.
export function geometriaCabeca(feminina = false, ate = Infinity){
  const aneis = [
    [-.94,.06,.10,.02],[-.86,.27,.34,.04],[-.72,.48,.49,.04],[-.50,feminina ? .60 : .65,.62,0],
    [-.25,.77,.70,-.02],[.05,.83,.75,-.05],[.32,.84,.75,-.08],[.58,.78,.69,-.10],
    [.82,.60,.54,-.12],[.98,.32,.28,-.12],[1.04,.02,.02,-.12]
  ].filter(([y]) => y <= ate);
  const contorno = new CatmullRomCurve3(aneis.map(([y,rx,rz]) => new Vector3(rx,y,rz)));
  const suaves = Array.from({length: 33}, (_,j) => { const p = contorno.getPoint(j/32); const z0 = .04 - .16 * Math.max(0, (p.y + .72) / 1.76); return [p.y,p.x,p.z,z0]; });
  const n = 40, pos = [], uv = [], indices = [];
  suaves.forEach(([y,rx,rz,z0],j) => {
    for(let i = 0; i <= n; i++){
      const a = i / n * Math.PI * 2; pos.push(Math.sin(a)*rx,y,Math.cos(a)*rz+z0); uv.push(i/n,j/(suaves.length-1));
      if(j && i < n){ const k = j*(n+1)+i; indices.push(k,k-n-1,k+1,k+1,k-n-1,k-n); }
    }
  });
  const g = new BufferGeometry(); g.setAttribute("position",new Float32BufferAttribute(pos,3));
  g.setAttribute("uv",new Float32BufferAttribute(uv,2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

export function criarRosto(cab,cfg){
  const pele = cfg.pele.clone(); pele.roughness = .82; pele.metalness = 0;
  const tom = (cor,mistura) => new MeshStandardMaterial({ color:pele.color.clone().lerp(new Color(cor),mistura),roughness:.83,metalness:0 });
  const sombra = tom(0x6b342a,.24), labio = tom(cfg.labios ?? 0x9c6359,cfg.feminina ? .32 : .20);
  const cabelo = cfg.cabelo.clone(); cabelo.metalness = 0;
  const por = (g,m,x,y,z,pai = cab) => { const o = new Mesh(g,m); o.position.set(x,y,z); pai.add(o); return o; };
  const oval = (m,x,y,z,sx,sy,sz,pai) => { const o = por(new SphereGeometry(1,20,14),m,x,y,z,pai); o.scale.set(sx,sy,sz); return o; };
  const linha = (pts,raio,m,pai = cab) => por(new TubeGeometry(new CatmullRomCurve3(pts.map(p => new Vector3(...p))),16,raio,6,false),m,0,0,0,pai);
  const cabeca = por(geometriaCabeca(cfg.feminina),pele,0,0,0); cabeca.name = "rosto";
  oval(pele,0,.01,.73,.105,.26,.12); oval(pele,0,-.16,.84,.125,.10,.13);
  for(const sx of [-1,1]){
    oval(pele,sx*.105,-.20,.78,.08,.055,.08); oval(sombra,sx*.10,-.225,.82,.03,.015,.018);
    oval(pele,sx*.84,-.10,-.08,.11,.22,.14); oval(sombra,sx*.905,-.10,-.035,.026,.125,.075);
  }
  // Olhos menores, íris e pupilas proporcionais e pálpebras na cor da pele.
  const branco = new MeshStandardMaterial({color:0xdcd8cc,roughness:.38,metalness:0});
  const iris = new MeshStandardMaterial({color:cfg.olhos ?? 0x4b3726,roughness:.4,metalness:0});
  const pupila = new MeshStandardMaterial({color:0x12100e,roughness:.28,metalness:0});
  const olhos = [];
  for(const sx of [-1,1]){
    const olho = new Group(); olho.position.set(sx*.33,.08,.685); cab.add(olho); olhos.push(olho);
    oval(branco,0,0,0,.165,.065,.05,olho); oval(iris,0,0,.046,.054,.055,.016,olho);
    oval(pupila,0,0,.060,.025,.032,.008,olho); oval(branco,-.014,.018,.068,.010,.009,.004,olho);
    linha([[-.17,0,.003],[-.08,.064,.035],[.07,.060,.035],[.17,0,.003]],.018,pele,olho);
    linha([[-.17,0,.003],[0,-.054,.032],[.17,0,.003]],.012,pele,olho);
    linha([[sx*.15,.24,.67],[sx*.31,.28,.68],[sx*.50,.23,.61]],cfg.feminina ? .021 : .032,cabelo);
  }
  // Boca fechada, com lábios discretos; sem dentes expostos permanentes.
  linha([[-.20,-.46,.635],[-.07,-.44,.665],[0,-.455,.677],[.07,-.44,.665],[.20,-.46,.635]],.021,labio);
  linha([[-.19,-.48,.635],[0,-.505,.661],[.19,-.48,.635]],.025,labio);
  linha([[-.18,-.467,.650],[0,-.473,.682],[.18,-.467,.650]],.008,sombra);
  return {cabeca,olhos,pele};
}
