/* Ajustes das missões da operação (1 a 7): tudo provisório e configurável. Coordenadas em unidades do mundo (1 m = 2,94 u) a menos que diga "m". */
import { PORT } from "../../t3d/src/portico.js";

export const OPERACAO = {
  /* posto da atividade no deck do lançamento (onde aparece "Realizar Atividade" / "Operar na Tirolesa" / "Iniciar Turno") */
  posto: { x: PORT.lanca + 10, z: 8, yaw: -Math.PI / 2 },
  /* refeitório provisório (missão 6): dentro do cercado do recebimento. LOCAL A DEFINIR pelo dono do projeto. */
  refeitorio: { x: 88, z: 30, yaw: 0 },
  /* carona da missão 1: enquanto a praça real não existe, ao lado da praça provisória (dx, dz em metros a partir do ponto "Cambará do Sul (cidade)") */
  carona: { dx: 12, dz: 6, yaw: Math.PI / 2 },
  /* pontos da inspeção diária (missão 4) no deck do recebimento (unidades do mundo) */
  pontos: { clips: { x: -30, z: 25 }, inclinometro: { x: -10, z: 25 }, trolley: { x: 0, z: 5 }, equipamentos: { x: 20, z: 30 }, liberar: { x: -9, z: 0 } },
  via: 3,                                   // via usada nos clientes das missões (1, 3 ou 5)
  descidaSegundos: 42,                      // duração da descida (cena), em segundos reais
  comemoraAposM: 30,                        // m: o cliente comemora levantando os braços depois de se afastar disto e ganhar velocidade
  setasAlcanceM: 720,                       // as setas sobre a equipe do recebimento aparecem a esta distância (tamanho constante na tela)
  cliente: { capaceteCor: "#4DA3FF", escala: 1, pesoKg: 74, mochilaKg: 3 },
  inspecao: { horaInicio: 7.0, limite: 8 + 55 / 60, relogioFator: .3, minPorItem: .35 },       // missão 4
  almoco: { hora: 12 },                     // missão 6
  vento: { brisa: "brisa", forte: "vento" } // missão 5: modos do sistema de vento (M.vento.forca)
};
