# Habilidades dos personagens

Os controles principais continuam em **V**, com ações complementares em **Y/U/I** quando disponíveis. No toque, os botões correspondentes aparecem no painel de poderes. Operadores precisam estar na forma de poder no tempo antigo; Sepé, Tupã e Atiara usam suas habilidades próprias.

| Personagem | Upgrade | Como aproveitar |
| --- | --- | --- |
| Pit | Hologramas concentram ataques no inimigo mirado, com bônus de 35%. Com três projeções, V redireciona o grupo sem gastar energia. | Mire o inimigo e use V. Y troca o tipo, U hackeia e I para o tempo. O foco dura 6 s. |
| Krig | A investida causa impacto no trajeto e para antes de atravessar os colisores do cenário. | V avança pelo caminho livre; Y golpe no chão, U voo, I rugido. |
| Carlão | A sequência de quatro golpes da capoeira termina em uma armada dourada de maior alcance e dano. | Use Y em sequência, com pausas menores que 3 s. V/toque curto chuta; segurar e soltar causa explosão. I dá rasteira. |
| Jackão | Mira estabilizada por 0,75 s dobra o dano do próximo tiro. Munição de choque salta entre até três alvos próximos. | Botão direito estabiliza a mira; V dispara. Y granada, U RA, I alterna choque. |
| Diully | Suspender por 2 s carrega arremesso e batida até +60%; o impacto alcança inimigos próximos. | V ergue, aguarde carregar e use V para arremessar ou Y para bater. U usa Lábia. Após 8 s, o alvo é solto automaticamente. |
| Mary | O gelo congela até três alvos; fogo ou vapor consomem o congelamento para uma explosão elemental em área. | U congela, depois V lança fogo ou Y detona vapor. Cada impacto gera apenas uma explosão de vapor. |
| Mohr | A onda encharca por 8 s; avalanche causa 60% mais dano nos alvos molhados, e lama dura mais 2 s. | V prepara o combo; Y usa a encosta e I prende com lama. Água próxima mantém o bônus da onda. |
| Kauling | Na forma gigante, caminhar produz pisadas que atordoam alvos próximos, sem dano aos animais. | U cresce/encolhe; caminhe para produzir as pisadas. V grita, I usa o grito curto. |
| Sepé Tiarajú | Rajada de três flechas, com seleção de alvos distintos e compensação da trajetória. | V dispara no cone à frente. A colisão contínua evita atravessar inimigos com FPS baixo. |
| Tupã | Raios encadeados saltam entre até quatro inimigos, com dano decrescente e sem repetir dano em áreas sobrepostas. | Mire o primeiro inimigo e use V. Os saltos alcançam 14 m entre alvos. |
| Atiara | Encantamento em grupo atinge até quatro alvos no cone, incluindo animais que agora realmente se acalmam. | Aproxime-se, encare o grupo e use V. O efeito dura 8 s. |

## Controles e correções

- A recarga principal é independente por personagem e continua contando durante a troca. Voltar ao personagem não reinicia sua recarga.
- Tentativas recusadas por falta de alvo, forma de poder, energia, munição em recarga ou passagem livre não gastam a recarga principal.
- O botão principal aceita soltar/segurar o chute de Carlão também pelo toque. Cancelar o gesto ou perder o foco da janela cancela a carga.
- Trocar de Kauling restaura a escala do modelo anterior; o crescimento não altera os outros personagens.
- Renovar o gelo não duplica o temporizador ou os cristais. Os alvos das lendas controlam sua própria duração de encantamento, sem descontar duas vezes.
- Parar o tempo também reduz a simulação dos alvos registrados. Sistemas hackeados voltam ao normal mesmo se Pit deixar de ser o personagem ativo.
- A tela de seleção mostra as habilidades reais, substituindo o texto antigo de habilidades vazias.

## Ajustes e validação

Números de dano, alcance, duração, recarga e bônus ficam em `data/poderes.js`. As regras de mira, encadeamento e colisão contínua estão em `t3d/src/mundo/poderes/combate.js`.

Dentro de `t3d/`:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

`npm test` inclui as regras de combate, geometria dos personagens e NPCs. O teste de navegador executa os controladores reais contra alvos e terreno controlados: cobre os 11 personagens, combinações elementais, duração dos efeitos, recargas, bloqueios de uso, restauração após troca e clique curto/longo no botão de poder. A fixture usa um servidor local temporário e não modifica os salvamentos do jogo.

Também foi executado um smoke test no jogo completo: carregamento dos 11 rigs, troca de personagens, caminhada/corrida, tela de seleção com as descrições atualizadas e uso de Sepé, Tupã e Atiara, sem erros de JavaScript. Os testes de combate no navegador incluem 15 cenários e verificações de clique curto e longo.
