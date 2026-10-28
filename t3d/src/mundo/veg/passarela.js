import { InstancedMesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, DynamicDrawUsage, Color, Matrix4, Quaternion, Vector3, Euler, Group } from "three";
import { U, TURFEIRA as TF } from "../config.js";

/* ============================================================================================================
   PASSARELAS DE MADEIRA sobre as turfeiras
   Onde uma trilha entra numa turfeira (ou passa a menos de ~1,5 m da borda) o caminho vira uma passarela elevada: tábuas (com desgaste e musgo), vigas e pequenos pilares.
   Jogador e NPCs andam EM CIMA dela (altura de chão = convés, via cen.extraChao.superficies) e ficam presos à largura da passarela (latMax) — nunca pisam no banhado.
   ============================================================================================================ */

const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

export function criarPassarelas(M, base, turf){
  const { cen } = M, G = M.gente, grupo = new Group(); cen.grupo.add(grupo);
  const P = TF.passarela, S = { runs: [] }, meshes = [];
  const am = G.amostra;
  /* trechos onde a trilha toca a turfeira */
  function acha(){
    const L = []; G.PATHS.forEach(path => { let ini = null, ult = null;
      for(let s = 0; s <= path.len; s += 3){ const q = am(path, s), d = turf.distTurfeira(q.x, q.z), perto = d < 5; if(perto){ if(ini === null) ini = s; ult = s; } else if(ini !== null && s - ult > 30){ L.push({ path, s0: ini, s1: ult }); ini = null; } }
      if(ini !== null) L.push({ path, s0: ini, s1: ult }); });
    return L.filter(r => r.s1 - r.s0 > 6).map(r => ({ ...r, s0: Math.max(0, r.s0 - P.margem), s1: Math.min(r.path.len, r.s1 + P.margem) }));
  }
  const madeira = new MeshStandardMaterial({ color: 0xffffff, roughness: .95 });
  function constroi(r){
    const { path, s0, s1 } = r, passo = 2.5, n = Math.max(2, Math.round((s1 - s0) / passo)), run = { path: path.nome, pathRef: path, s0, s1, pts: [], largura: P.largura };
    const tab = new InstancedMesh(new BoxGeometry(P.largura, .2, passo * .88), madeira, n + 1), vig = new InstancedMesh(new BoxGeometry(.28, .3, passo * 1.05), madeira, (n + 1) * 2), pil = new InstancedMesh(new CylinderGeometry(.24, .28, 1, 6), madeira, Math.ceil(n / 3) * 2 + 4);
    [tab, vig, pil].forEach(m => { m.instanceMatrix.setUsage(DynamicDrawUsage); m.setColorAt(0, new Color(1, 1, 1)); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; grupo.add(m); meshes.push(m); });
    const M4 = new Matrix4(), Qn = new Quaternion(), V = new Vector3(), Sc = new Vector3(1, 1, 1), E = new Euler(), col = new Color();
    let ip = 0, iv = 0, ipl = 0;
    for(let k = 0; k <= n; k++){ const s = s0 + (s1 - s0) * k / n, q = am(path, s), yG = base.alturaNo(q.x, q.z), u = Math.min(k, n - k) / Math.max(1, Math.min(4, n / 2)), alt = P.altura * Math.min(1, .18 + u * .9); const y = yG + alt, yaw = Math.atan2(q.tx, q.tz);
      run.pts.push({ x: q.x, z: q.z, y, s }); E.set(0, yaw, (hash(k, 1, 3) - .5) * .02); Qn.setFromEuler(E); V.set(q.x, y - .1, q.z); Sc.set(1, 1, 1); M4.compose(V, Qn, Sc); tab.setMatrixAt(ip, M4); const t = .55 + .35 * hash(k, 2, 3), musgo = hash(k, 5, 3) > .8 ? .35 : 0; col.setRGB(.46 * t - musgo * .3, .36 * t + musgo * .22, .26 * t - musgo * .1); tab.setColorAt(ip, col); ip++;
      if(k % 1 === 0){ for(const side of [-1, 1]){ V.set(q.x - q.tz * side * (P.largura / 2 - .5), y - .32, q.z + q.tx * side * (P.largura / 2 - .5)); Sc.set(1, 1, 1); M4.compose(V, Qn, Sc); vig.setMatrixAt(iv, M4); col.setRGB(.3, .24, .17); vig.setColorAt(iv, col); iv++; } }
      if(k % 3 === 0){ for(const side of [-1, 1]){ const h = Math.max(.4, alt + .2), px = q.x - q.tz * side * (P.largura / 2 - .6), pz = q.z + q.tx * side * (P.largura / 2 - .6); V.set(px, yG + h / 2 - .1, pz); Qn.identity(); Sc.set(1, h, 1); M4.compose(V, Qn, Sc); pil.setMatrixAt(ipl, M4); col.setRGB(.26, .21, .15); pil.setColorAt(ipl, col); ipl++; } } }
    tab.count = ip; vig.count = iv; pil.count = ipl; [tab, vig, pil].forEach(m => { m.instanceMatrix.needsUpdate = true; if(m.instanceColor) m.instanceColor.needsUpdate = true; });
    S.runs.push(run); return run;
  }
  function gera(){ meshes.forEach(m => { grupo.remove(m); m.dispose(); }); meshes.length = 0; S.runs = []; acha().forEach(constroi); alimentaBase(); }
  /* superfície caminhável: convés em y interpolado, só dentro da largura */
  function superficie(x, z){
    for(let r = 0; r < S.runs.length; r++){ const run = S.runs[r], pts = run.pts; let hit = null;
      for(let i = 0; i < pts.length - 1; i++){ const a = pts[i], b = pts[i + 1]; if(Math.abs(x - a.x) > 8 && Math.abs(x - b.x) > 8) continue; if(Math.abs(z - a.z) > 8 && Math.abs(z - b.z) > 8) continue; const vx = b.x - a.x, vz = b.z - a.z, l2 = vx * vx + vz * vz || 1; let t = ((x - a.x) * vx + (z - a.z) * vz) / l2; if(t < 0 || t > 1) continue; const px = a.x + vx * t, pz = a.z + vz * t; if(Math.hypot(x - px, z - pz) <= run.largura / 2 + .05) hit = a.y + (b.y - a.y) * t + .0; if(hit !== null) return hit; } }
    return null;
  }
  /* largura útil (lat máxima, u) na posição s da trilha `nome`: dentro da passarela as pessoas ficam no centro */
  function latMax(nome, s){ for(const r of S.runs){ if(r.path === nome && s >= r.s0 - 1 && s <= r.s1 + 1) return P.largura / 2 - .7; } return 3.4; }
  function alimentaBase(){ base.excluir.push(() => false); }
  cen.extraChao.superficies.push(superficie);
  gera();
  return { S, gera, superficie, latMax, runs: () => S.runs, forca(nome, s0, s1){ const path = G.PATHS.find(p => p.nome === nome); if(!path) return null; const r = constroi({ path, s0, s1 }); return r; } };
}
