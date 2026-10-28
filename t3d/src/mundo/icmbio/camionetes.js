import { criarCamionete, luzesDaCamionete } from "./veiculos.js";
import { CAMIONETES } from "../config.js";

/* coloca as 3 camionetes no estacionamento (perto da saída para a trilha), com colisão; os faróis acendem à noite */
export function criarCamionetes(M){
  const { cen } = M, E = cen.estac, L = luzesDaCamionete(), lista = [];
  CAMIONETES.vagas.forEach(v => {
    const T = criarCamionete(v), [x, z] = E.PKW(v.lx, v.lz);
    T.position.set(x, cen.chao(x, z, 1e9), z); T.rotation.y = E.PKR + v.giro; cen.grupo.add(T);
    /* colisor: caixa alinhada ao mundo que envolve o retângulo girado (5,3 m × 1,85 m) */
    const cs = Math.abs(Math.cos(T.rotation.y)), sn = Math.abs(Math.sin(T.rotation.y)), hx = (cs * 1.0 + sn * 2.7) * 2.94, hz = (sn * 1.0 + cs * 2.7) * 2.94;
    cen.colisores.push({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });
    lista.push({ obj: T, x, z, numero: v.numero, rot: T.rotation.y });
  });
  const dirV = (T, d) => { const a = T.rotation.y; return [Math.sin(a) * d, Math.cos(a) * d]; };
  return {
    lista, posicoes: () => lista.map(v => [v.x, v.z]),
    /* ponto à porta da camionete (onde a equipe fica / entra) */
    porta: (i, lado = -1) => { const v = lista[i], a = v.rot; return [v.x + Math.cos(a) * lado * 5.9 + Math.sin(a) * 1.7, v.z - Math.sin(a) * lado * 5.9 + Math.cos(a) * 1.7]; },
    frente: (i, d) => { const v = lista[i], a = v.rot; return [v.x + Math.sin(a) * d, v.z + Math.cos(a) * d]; },
    tick(dt, J, Eciclo){
      const noite = Eciclo.noite > .35 ? Math.min(1, (Eciclo.noite - .35) * 2.2) : 0;
      L.farol.emissiveIntensity = CAMIONETES.faroisNoite ? noite * 1.6 : 0; L.lanterna.emissiveIntensity = noite * .9;
      L.giro.emissiveIntensity = CAMIONETES.giroflexNoite ? (Math.sin(performance.now() / 120) > 0 ? 2.2 : .1) * noite : 0;
    }
  };
}
