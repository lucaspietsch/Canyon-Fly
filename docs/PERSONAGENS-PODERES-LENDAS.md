# Personagens, poderes e lendas (prévia para teste)

## Personagens (tela 👤 do modo andar e Urna do Tempo)
**Prévia para teste:** Sepé, Tupã e Atiara já aparecem liberados na seleção. Krig deixou de ser jogável: é só NPC da operação. Para voltar ao desbloqueio por missão/evento, `desbloqueadoPadrao: false` em `t3d/src/mundo/dados/personagens.js`.

| Personagem | Como liberar | Poder (tecla **V** ou o botão na tela) |
|---|---|---|
| Pit | padrão | **Lábia** — convence quem está à frente (até 18 m) |
| Sepé Tiarajú | abrir a Urna do Tempo na praça | **Arco e flechas infinitas** — uma flecha a cada 0,45 s; só fere "inimigos" |
| Tupã | presenciar o raio na Sequoia Lunar | **Raio de Tupã** — raio do céu sobre inimigos (3,2 s de recarga) |
| Atiara | *em breve* (missão do tesouro amaldiçoado). Modelo pronto | **Encantamento dos olhos** — prende quem encara (8 s) |

Ajustes (recarga, alcance, mira, duração): `data/poderes.js`. Bichos nunca levam dano: raio e flechas só ferem "inimigo" (espantalhos de treino, Gritador).

**Para testar os poderes agora:** abra o F3 e use **Shift+V** → surgem 3 espantalhos amaldiçoados e um visitante teimoso à frente. Depois fecha o F3 (a tecla V com o F3 aberto é a depuração das serpentes) e use **V**.

## Aparências
- **Tupã**: cabelo preto comprido, grande cocar dourado/branco, faixa vermelha nos olhos, pintura azul/preta, olhos branco-azulados brilhantes. Parado ~4 s: faíscas, vento e o céu escurece.
- **Sepé Tiarajú**: poncho listrado, faixa na testa, bastão de comando + **arco longo** e **aljava** com flechas.
- **Atiara** (kaingang, anos 1950): cabelo crespo, cocar de penas escuras com duas brancas, **bandana vermelha**, **alargadores** de madeira nas orelhas, **osso atravessando o nariz**, olhos luminosos (âmbar), **colar de cobra-coral** (vermelho/preto/amarelo). Cores e brilho: `modelo` em `t3d/src/mundo/dados/personagens.js`.
- Os personagens especiais não têm mais o cinto, o mosquetão e o rádio do Pit. Quem sai de cena (Pit) fica ao lado, sem se sobrepor a você.

## Anhangá
Cervo branco gigante, **olhos de brasa** que pulsam, **sem cruz na testa**. Metamorfoses (com névoa): tatu · boi · pirarucu · humano — os olhos de brasa permanecem.
Depuração (F3 aberto): **Shift+'** (aspas) ou **Numpad\*** aparece à frente; de novo troca de forma; **Ctrl+'** ou **Numpad/** some. Código: `t3d/src/mundo/lenda/anhanga.js`.

## Série de missões "Tupã" (tela J) — só com Tupã em uso
1. **Olhos de Brasa** — vá à Vila Ouro Verde (viagem rápida), encontre o Anhangá e converse (significado do nome, olhos de brasa, justiça na mata, metamorfoses).
2. **Eliminar o Gritador** — a partir das 22h. O Gritador grita (som espacial: sai mais pelo lado em que ele está). **Nunca responda**: ficar em silêncio e chamar o raio [V] quando ele chegar perto (2 raios). Responder, ser alcançado ou demorar > 4 min = falha (repete amanhã).
3. **O Boitatá** — a partir das 18h, depois da missão 2. Serpente de fogo guardiã: **não a ataque** (qualquer poder contra ela = falha). Siga-a por 4 pontos até o fogo-fátuo.
4. **O Equilíbrio da Mata** — *em breve* (missão final de Tupã e Anhangá).

Atalhos de teste no painel de missões (J): Home/End/PageUp (pular/completar objetivo). Hora: com F3, Digit4 = 21h, "." avança 1 h. Textos das falas: `t3d/src/mundo/lenda/cenasTupa.js`; etapas: `data/missoes/tupa.js`.
As criaturas (Gritador, Boitatá) estão com **aparência provisória**, até chegarem as referências.

## Portal violeta e o passado (anos 1950)
- Ao **escolher Sepé, Tupã ou Atiara**, um **portal violeta** abre sozinho 9 m à frente. Atravessar leva à **Vila Santana, 1950** (tom sépia). Escolher o Pit fecha o portal de ida.
- No passado, **vilas, Olaria e Cambará S/A viram mata densa** (≈ 4× mais árvores que o parque, com clareira de 16 m onde você chega; a mata acompanha você) e **a vila Ouro Verde e a fábrica somem**. Há **o dobro de bichos do parque**: lobo-guará, graxaim, veado-campeiro, quati e gambá (leão-baio e lontra não entram: dependem do arroio do parque). Alvos em `t3d/src/mundo/fauna/antigo.js` → `ANTIGO.alvo`.
- Um **portal de volta** aparece perto de onde você chegou e leva à praça (presente).
- O portão com senha da Vila Santana continua existindo para o presente; pelo portal você entra sem a senha.
- Depuração: `M.portal.abre()` cria um portal à frente; `M.portal.entra()` / `M.portal.volta()` atravessam na hora. Ajustes: `PORTAL` em `t3d/src/mundo/portal/portal.js`.
