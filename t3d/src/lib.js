import { CanvasTexture, SRGBColorSpace, RepeatWrapping, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Mesh, Group, BoxGeometry, CylinderGeometry, Vector3 } from "three";

/* ------------------------------------------------------------------------------------------------
   Escala do cenário real: 1 metro = 2,94 unidades do 3D (é a escala do boneco do Pit: 1,75 m ≈ 5,1 u).
   O eixo X corre ao longo dos cabos (para o vão do cânion = +X); o eixo Z é a direção do comprimento do deck e do pórtico;
   Y é a altura. O trolley fica na origem, pendurado no cabo 07 (y = 1,35).
   ------------------------------------------------------------------------------------------------ */
export const U = 2.94;
export const m = (v) => v * U;

export const NIVEL = { DECK: -6.0, CHAO: -6.0 - 0.8 * U };           // topo do deck e chão (o deck fica ~0,8 m acima do chão)

/** textura desenhada em canvas */
export function canvasTex(w, h, desenhar, { repeat, aniso = 4, cor = true, hd = 1 } = {}){
  /* hd: superamostragem (o desenho continua em coordenadas w × h, o canvas fica hd vezes maior: texto nítido de perto) */
  const c = document.createElement("canvas"); c.width = w * hd; c.height = h * hd;
  const x = c.getContext("2d"); if(hd !== 1) x.scale(hd, hd); desenhar(x, w, h);
  const t = new CanvasTexture(c);
  if(cor) t.colorSpace = SRGBColorSpace;
  t.anisotropy = aniso;
  if(repeat){ t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

/** gerador pseudo-aleatório determinístico (o cenário é sempre igual) */
export function rng(seed = 1){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

export const mat = (cor, o = {}) => new MeshStandardMaterial({ color: cor, roughness: .8, metalness: .05, ...o });

/** caixa com extremos nas três direções (mais fácil de posicionar que centro + tamanho) */
export function caixa(pai, xa, xb, ya, yb, za, zb, material){
  const o = new Mesh(new BoxGeometry(xb - xa, yb - ya, zb - za), material);
  o.position.set((xa + xb) / 2, (ya + yb) / 2, (za + zb) / 2); pai.add(o); return o;
}
/** cilindro vertical (r em u, de ya a yb) */
export function coluna(pai, x, z, ya, yb, r, material, seg = 20, r2){
  const o = new Mesh(new CylinderGeometry(r2 ?? r, r, yb - ya, seg), material);
  o.position.set(x, (ya + yb) / 2, z); pai.add(o); return o;
}
/** barra entre dois pontos (cilindro fino) */
export function barra(pai, a, b, r, material, seg = 8){
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  const o = new Mesh(new CylinderGeometry(r, r, L, seg), material);
  o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  o.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(dx / L, dy / L, dz / L));
  pai.add(o); return o;
}
export const grupo = (pai, x = 0, y = 0, z = 0) => { const g = new Group(); g.position.set(x, y, z); if(pai) pai.add(g); return g; };

/** Textura de placa: 4× a resolução do desenho (256 → 1024 px), anisotropia 8 e mipmaps (padrão do CanvasTexture). */
export const texPlacaHD = (w, h, desenhar) => canvasTex(w, h, desenhar, { hd: 4, aniso: 8 });

/**
 * PLACA LEGÍVEL DOS DOIS LADOS. Causa do texto espelhado: a placa era UM plano com `side: DoubleSide`; visto por trás, o mesmo plano mostra a textura invertida
 * da esquerda para a direita. Aqui são DOIS planos de uma face só, colados costas com costas: a frente (+Z) e o verso (−Z, girado 180° em Y), cada um com a textura
 * no sentido certo para quem olha. `verso` pode ser outra textura, null (madeira lisa) ou omitido (repete a frente, legível). Aponte a frente com group.rotation.y.
 */
export function placaLegivel(frente, w, h, { verso, espessura = .03, cor = 0x4a3526 } = {}){
  const g = new Group(), geo = new PlaneGeometry(w, h), e = espessura / 2 + .004;
  const face = (mapa, z, giro) => { const p = new Mesh(geo, new MeshBasicMaterial({ map: mapa, color: 0xffffff })); p.position.z = z; p.rotation.y = giro; g.add(p); return p; };
  face(frente, e, 0);
  if(verso !== null) face(verso || frente, -e, Math.PI);
  else { const p = new Mesh(geo, new MeshStandardMaterial({ color: cor, roughness: .9 })); p.position.z = -e; p.rotation.y = Math.PI; g.add(p); }
  const miolo = new Mesh(new BoxGeometry(w, h, espessura), new MeshStandardMaterial({ color: cor, roughness: .9 })); g.add(miolo);
  return g;
}
