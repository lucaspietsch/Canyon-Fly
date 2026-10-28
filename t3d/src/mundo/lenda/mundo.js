import { criaAnhanga, ANHANGA } from "./anhanga.js";
import { U } from "../config.js";

/* Anhangá no mundo: por ora só a presença de depuração (a Antiga Floresta da Olaria o colocará perto da Árvore Anciã e dos pontos encantados). */
export function criarAnhangaMundo(M){
  const S = { a: null, vivo: false };
  const some = () => { if(S.a && S.a.g.parent) S.a.g.parent.remove(S.a.g); S.vivo = false; };
  function apareceDiante(J){
    if(S.vivo) return false; if(!J) return false; if(!S.a){ S.a = criaAnhanga(M.H); S.alvo = M.poderes.registra({ id: "anhanga", tipo: "guardiao", nome: "Anhangá", raioM: 2.2, alturaM: 2.4, pos: () => S.a.g.position,
      aoRaio(){ if(M.terminal) M.terminal.msg("sobrenatural", "O raio cai e se apaga nos olhos de brasa: Anhangá não teme o trovão de Tupã."); }, aoFlecha(){ if(M.terminal) M.terminal.msg("sobrenatural", "A flecha atravessa a névoa. Anhangá apenas inclina a galhada."); },
      aoLabia(){ if(M.terminal) M.terminal.msg("sobrenatural", "Anhangá ouve, mas não se deixa convencer por palavras: ele julga por atos."); return true; }, aoOlhos(){ if(M.terminal) M.terminal.msg("sobrenatural", "Os olhos de brasa encaram os olhos de Atiara. Nenhum dos dois desvia."); } }); }
    const d = ANHANGA.distanciaDebug * U, yaw = J.camYaw !== undefined ? J.camYaw : J.yaw, x = J.x - Math.sin(yaw) * d, z = J.z - Math.cos(yaw) * d;
    M.cen.grupo.add(S.a.g); S.a.coloca(x, M.cen.chao(x, z, 1e9), z, Math.atan2(J.x - x, J.z - z)); S.vivo = true; return true;
  }
  return { apareceDiante, some, pos: () => S.a ? S.a.g.position : { x: 0, z: 0 }, forma: (f) => S.a && S.a.forma(f), cicla: () => S.a && S.a.cicla(), get atual(){ return S.a ? S.a.atual : "cervo"; }, tick: (dt) => { if(S.vivo && S.a) S.a.tick(dt); }, S };
}
