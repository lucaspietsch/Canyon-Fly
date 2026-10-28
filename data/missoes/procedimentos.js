/* PROCEDIMENTOS E CHECKLISTS DA OPERAÇÃO — copiados dos arquivos que já existem no projeto, sem inventar nada:
   • CHECKLISTS: build/checklist-atualizado.html (const ITENS): formulários 122 (Recebimento), 123 (Lançamento), 124 (Cadeirinhas/EPIs), 125 (Trolley diário) e a faixa normal do inclinômetro.
   • PROCEDIMENTOS, BRIEFING, ITENS_DUPLA, ITENS_RESG, EXTRACOES: jogo/index.html ("Iniciar Turno": etapas do lançamento, perguntas do briefing, dupla checagem, extração simples e moderada).
   Se o procedimento oficial mudar, atualize os arquivos de origem e gere de novo (node tools/gera_procedimentos.cjs). O que não existe nos arquivos de origem fica marcado "a definir". */
export const CHECKLISTS = {
 "rec": {
  "form": "122",
  "nome": "Recebimento (122)",
  "itens": [
   "Área devidamente sinalizada e isolada?",
   "Área de guarda de cadeirinhas, cintos e capacetes identificada?",
   "Linhas de vida (tipo trilho) conformes?",
   "Kit de resgate inspecionado e pronto? Com TAG?",
   "Cordas e fitas isentas de sujeira? Com TAG?",
   "Cabo de trabalho (robô/trolley) livre e conforme?",
   "Cordas em bom estado? Capa íntegra? Alma exposta?",
   "Sinais de queimaduras ou deformações nas cordas?",
   "Terminações das cordas sem desgaste excessivo?",
   "Pintura de sinalização de limitação no piso conforme?",
   "Escada com peça solta ou frouxidão?",
   "Guarda-corpo de isolamento conforme?",
   "Molas e batentes da frenagem retraídos ou com anomalia?",
   "Rádio de comunicação disponível e pessoas treinadas?",
   "Inspeção diária de capacetes, cadeirinhas e acessórios realizada?",
   "Pintura dos clips (grampos) dos cabos das ancoragens conforme?",
   "Pintura dos clips dos cabos de linha de vida conforme?",
   "Cabos de aço tensionados (verificar com inclinômetro)?",
   "Relatório de lubrificação no prazo?",
   "Check list trimestral geral no prazo?",
   "Relatório de torque e diâmetros em cabos no prazo?",
   "Maca e talas de imobilização disponíveis?",
   "Cabos de aço da área de frenagem conformes?",
   "Molas do sistema de frenagem fixas no tecnil e encaixadas nos batentes?",
   "Molas apresentam deformidades?",
   "Molas de frenagem retornam ao ponto correto de inércia?",
   "Cabos de aço da área das molas limpos, sem excesso de vaselina?",
   "Limpeza e lubrificação das molas no prazo?",
   "Escada da plataforma de inspeção/lubrificação das molas conforme?",
   "Vegetação devidamente aparada na região da plataforma de recebimento?"
  ]
 },
 "lan": {
  "form": "123",
  "nome": "Lançamento (123)",
  "itens": [
   "Área devidamente sinalizada e isolada?",
   "Área de guarda de cadeirinhas, cintos e capacetes identificada?",
   "Linhas de vida para corda auto seguro no deck conformes?",
   "Pontos de ancoragem para corda auto seguro conformes?",
   "Cordas e fitas isentas de sujeira? Com TAG?",
   "Cabo de trabalho (robô/trolley) livre e conforme?",
   "Cordas em bom estado? Capas íntegras? Alma exposta?",
   "Sinais de queimaduras ou deformações nas cordas?",
   "Terminações das cordas sem desgaste excessivo?",
   "Plataforma superior de montagem limpa e conforme?",
   "Portão de acesso à plataforma de lançamento com trava para fechar?",
   "Guarda-corpo de isolamento conforme?",
   "Pontos de ancoragem dos backups e backups conformes?",
   "Rádios de comunicação disponíveis e pessoas treinadas?",
   "Inspeção diária de capacetes, cadeirinhas e acessórios realizada?",
   "Pintura dos clips (grampos) dos cabos das ancoragens conforme?",
   "Pintura dos clips dos cabos de linha de vida conforme?",
   "Cabos de aço das vias tensionados (verificar com inclinômetro)?",
   "Relatório trimestral de lubrificação no prazo?",
   "Check list trimestral geral no prazo?",
   "Relatório de torque e diâmetros em cabos no prazo?",
   "Maca e talas de imobilização disponíveis?",
   "Mola do sistema de frenagem do trolley fixa no tecnil e encaixada no batente?",
   "Mola do cabo do trolley sem deformidades? Retorna ao ponto de inércia?",
   "Sistema de ancoragem do trolley conforme?",
   "Vegetação devidamente aparada/cortada na plataforma?"
  ]
 },
 "cad": {
  "form": "124",
  "nome": "Cadeirinhas, capacetes e acessórios (124)",
  "itens": [
   "Capacete com CA conforme? (visível)",
   "Cadeirinhas (todos os modelos) com CA ou UIAA conforme?",
   "Cintos de segurança (todos os modelos) com CA e conformes?",
   "Informações do fabricante visíveis?",
   "Capacetes com rachaduras ou outras anomalias?",
   "Fivelas de ajustes conformes?",
   "Desgastes excessivos ou cortes nas partes têxteis (ancoragem e costuras)?",
   "Abrasão nas partes têxteis que seguram cargas? \"Partes peludas\"?",
   "Pontos de costura cortada, desfiada ou partida?",
   "Cortes ou áreas endurecidas nas partes têxteis?",
   "Conectores e mosquetões com desgastes ou abrasão?",
   "Acessórios metálicos com deformação?",
   "Acessórios metálicos isentos de corrosão, fissuras ou anomalias?",
   "Local de armazenagem protegido de intempéries e conforme?",
   "Equipamentos limpos e organizados?",
   "Fitas de cadeirinhas e capacetes em boas condições?",
   "Fitas das cadeirinhas isentas de sinais de queimaduras?",
   "Toucas e elásticos para cabelos disponíveis? Recipientes para descartes?",
   "Kits Zip Rider montados e prontos para uso?",
   "Todos os equipamentos com TAG?"
  ]
 },
 "tro": {
  "form": "125",
  "nome": "Trolley diário (125)",
  "itens": [
   "\"Memorial Descritivo\", \"Manual de Operação\" e \"Plano de Manutenção\" disponíveis?",
   "Baterias carregadas e prontas para uso?",
   "Carregadores das baterias conformes?",
   "Voltímetro em conformidade?",
   "Conectores (tipo Anderson) entre bateria e trolley conformes?",
   "Voltagem para lançamento de subida igual ou maior que 37 Volts?",
   "Caixa do módulo fixa (proteção das placas eletrônicas)? Apresenta frouxidão?",
   "Botão emergência / liga-desliga / fim de curso / potenciômetro conformes?",
   "Alavancas de subida e descida conformes?",
   "Correias alinhadas e rodando corretamente?",
   "Carenagens metálicas bem fixas? Parafusos apertados?",
   "Superfície cortante nas bordas de alumínio ou aço?",
   "Polias sem ruídos e com rotação conforme?",
   "Barulho diferente no motor ao ligar para teste diário?",
   "Orifícios de ancoragem das malhas delta íntegros, sem desgaste ou alargamento?",
   "Malhas deltas com tags, inspeção em dia e fechadas com chave?",
   "Carga máxima do equipamento (165kg) sinalizada e visível?",
   "Ponto de ancoragem do paraquedas conforme?",
   "Paraquedas isento de furos, rasgos ou deformidades? Cordins internos conformes?",
   "Costuras das fitas e ponto de ancoragem do paraquedas conformes?",
   "Paraquedas com deformação com aumento de comprimento (teste prático)?",
   "Cordas, polias e mosquetões do freio do trolley (frenagem por atrito) conformes?",
   "Corda da \"polia de frenagem\" alinhada com o cabo de sustentação?",
   "\"Polia de frenagem por atrito\" (batedor) em boas condições? Rolamento livre?",
   "Pontos de ancoragem do sistema de frenagem sem movimentação indesejada ou rachaduras?",
   "Área do sistema de frenagem desobstruída, livre e sinalizada?",
   "\"Polia de frenagem\" posicionada para parar o trolley ao menos 3 m da porta de acesso?",
   "Após todos os testes o trolley funciona normalmente?"
  ]
 }
};
export const INCLINOMETRO = {"cabos":6,"faixaCabo":[0.9,1],"faixaTrolley":[0,0.05,0.1],"nota":"Cabos 1 a 6 costumam dar 0.9 ou 1.0; trolley 0.00, 0.05 ou 0.1 (checklist-atualizado.html)"};
export const PROCEDIMENTOS = [
 {
  "id": "pesagem",
  "tipo": "pesagem",
  "nome": "Conferir pesagem",
  "alvo": 14,
  "instrucao": "Some pessoa + mochila/bag e compare com os limites vigentes. Fora do limite: recuse com educação.",
  "explica": "O atrativo foi dimensionado para até 110 kg (pessoa + mochila somados) e o mínimo é 40 kg (60 kg com vento entre 40 e 60 km/h). Fora disso a descida é proibida."
 },
 {
  "id": "briefing",
  "tipo": "briefing",
  "nome": "Briefing de segurança",
  "alvo": 12,
  "instrucao": "O cliente pergunta. Dê a orientação correta do procedimento.",
  "explica": "O briefing segue o procedimento: celular e objetos na bolsa anexa, área de lançamento só com autorização verbal, olhos abertos, sem mexer em equipamentos."
 },
 {
  "id": "epi",
  "tipo": "epi",
  "nome": "Colocar e ajustar o EPI",
  "alvo": 30,
  "instrucao": "Arraste touca, óculos (se o cliente não trouxe os dele), capacete, cinto paraquedista e cadeirinha até o cliente. A touca vai por baixo do capacete. Depois ajuste as fitas na zona verde.",
  "explica": "EPI mal ajustado solta em uma queda ou escorrega no cinto: sempre ajuste antes de ancorar o cliente."
 },
 {
  "id": "roldana",
  "tipo": "roldana",
  "nome": "Conectar a roldana à via",
  "alvo": 14,
  "instrucao": "Arraste a roldana para o par de cabos da via escolhida (Via 1: cabos 1 e 2 · Via 3: cabos 3 e 4 · Via 5: cabos 5 e 6).",
  "explica": "A roldana só pode correr no par de cabos da via liberada. Via trocada = risco de colisão e cabo sem freio pronto."
 },
 {
  "id": "mosq",
  "tipo": "mosquetao",
  "nome": "Mosquetões: fechar, travar e conferir",
  "alvo": 20,
  "instrucao": "Em cada mosquetão: feche o gatilho, depois trave a rosca. Quando os três estiverem travados, confira puxando.",
  "explica": "Mosquetão fechado mas sem travar pode abrir sob carga. Feche, trave e puxe para conferir."
 },
 {
  "id": "dupla",
  "tipo": "dupla",
  "nome": "Dupla checagem (segundo operador)",
  "alvo": 20,
  "instrucao": "O segundo operador confere tudo com você. Marque o item errado, se houver, ou confirme que está tudo conforme.",
  "explica": "A dupla checagem é a barreira que neutraliza erro humano: um segundo par de olhos confere EPI e ancoragens antes de qualquer lançamento."
 },
 {
  "id": "radio",
  "tipo": "radio",
  "nome": "Rádio com o Recebimento",
  "alvo": 14,
  "instrucao": "Peça o status da via ao Recebimento, peça a confirmação e só avance depois das duas respostas.",
  "explica": "Sem a confirmação do Recebimento (via liberada, kit já desequipado) não há lançamento. O protocolo: \"QAP Recebimento, status da via X\" → \"Via X liberada\" → \"confirmação?\" → \"Confirmado\"."
 },
 {
  "id": "contagem",
  "tipo": "contagem",
  "nome": "Contagem e lançamento",
  "alvo": 8,
  "instrucao": "O Líder dá as boas-vindas, faz a contagem 3-2-1 e libera o cliente.",
  "explica": "O gatilho só é liberado após todas as etapas e a contagem."
 }
];
export const BRIEFING = [
 {
  "q": "O cliente pergunta: \"Posso levar o celular e a garrafa de água na mão?\"",
  "o": [
   [
    "Pode, desde que segure firme.",
    0
   ],
   [
    "Não: guarde na bolsa anexa à cadeirinha.",
    1
   ],
   [
    "Pode deixar no bolso aberto da jaqueta.",
    0
   ]
  ],
  "e": "Objetos soltos ou em bolsos abertos podem cair sobre outras pessoas ou no cânion. Vão na bolsa anexa à cadeirinha."
 },
 {
  "q": "Qual é o peso máximo permitido (pessoa + mochila somados)?",
  "o": [
   [
    "90 kg",
    0
   ],
   [
    "110 kg",
    1
   ],
   [
    "130 kg",
    0
   ]
  ],
  "e": "O atrativo foi dimensionado para até 110 kg, somando o peso da pessoa e da mochila."
 },
 {
  "q": "Quando o cliente pode entrar na área de lançamento?",
  "o": [
   [
    "Quando o portão estiver aberto.",
    0
   ],
   [
    "Só com autorização verbal do operador, equipado e ancorado.",
    1
   ],
   [
    "Assim que terminar o briefing.",
    0
   ]
  ],
  "e": "Mesmo com o portão aberto, só entra com autorização verbal, com cinto paraquedista, capacete e ancorado."
 },
 {
  "q": "Durante a descida, o que o cliente deve fazer?",
  "o": [
   [
    "Fechar os olhos e segurar o cabo.",
    0
   ],
   [
    "Tentar frear com as mãos.",
    0
   ],
   [
    "Manter os olhos abertos e não mexer nos equipamentos.",
    1
   ]
  ],
  "e": "Olhos abertos para apreciar a paisagem; mãos e objetos longe dos cabos e dos equipamentos."
 },
 {
  "q": "O cliente com mochila pode abrir ou reposicionar a bolsa no meio do percurso?",
  "o": [
   [
    "Sim, se precisar pegar algo.",
    0
   ],
   [
    "Não: é proibido abrir, tirar objetos ou reposicionar.",
    1
   ],
   [
    "Só para pegar o celular.",
    0
   ]
  ],
  "e": "Nas descidas com mochila é proibido abrir zíperes, tirar objetos ou tentar reposicionar a bolsa durante o percurso."
 },
 {
  "q": "Duas pessoas podem dividir a mesma cadeirinha?",
  "o": [
   [
    "Sim, criança com adulto.",
    0
   ],
   [
    "Não, nunca.",
    1
   ],
   [
    "Sim, se somarem até 110 kg.",
    0
   ]
  ],
  "e": "É proibido duas pessoas compartilharem a mesma cadeirinha: um cliente por vez, por cadeirinha."
 }
];
export const ITENS_DUPLA = [
 {
  "n": "Capacete",
  "ok": "Jugular afivelada e ajustada",
  "ruim": "Jugular solta, capacete balançando",
  "e": "Capacete sem jugular ajustada sai da cabeça em um impacto."
 },
 {
  "n": "Cinto paraquedista",
  "ok": "Fivelas travadas · ancoragem frontal ok",
  "ruim": "Fivela da perna aberta",
  "e": "Fivela aberta no cinto paraquedista é ponto de falha na ancoragem extra do cliente."
 },
 {
  "n": "Cadeirinha · abdominais",
  "ok": "Cintos abdominais clipados",
  "ruim": "Cinto abdominal sem clipar",
  "e": "Os cintos abdominais da cadeirinha precisam estar clipados antes de qualquer descida."
 },
 {
  "n": "Cadeirinha · vertical",
  "ok": "Cinto vertical (peitoral) clipado",
  "ruim": "Cinto vertical torcido e solto",
  "e": "O cinto vertical mantém o cliente na cadeirinha; torcido ou solto, ele pode escorregar."
 },
 {
  "n": "Mosquetão cervical",
  "ok": "Traseiro (anti-suicídio) travado",
  "ruim": "Mosquetão traseiro destravado",
  "e": "O mosquetão traseiro (anti-suicídio) precisa estar travado."
 },
 {
  "n": "Roldana esquerda",
  "ok": "Mosquetão travado no cabo esquerdo",
  "ruim": "Mosquetão esquerdo sem trava",
  "e": "Cada roldana é conferida, da esquerda para a direita; mosquetão sem trava abre sob carga."
 },
 {
  "n": "Roldana direita",
  "ok": "Mosquetão travado no cabo direito",
  "ruim": "Mosquetão direito sem trava",
  "e": "Cada roldana é conferida, da esquerda para a direita; mosquetão sem trava abre sob carga."
 },
 {
  "n": "Gatilho (manilha orca)",
  "ok": "Manilha orca fechada corretamente",
  "ruim": "Manilha orca mal fechada",
  "e": "A manilha orca (gatilho) precisa estar fechada corretamente antes do lançamento."
 },
 {
  "n": "Backup no cabo",
  "ok": "Corda de backup ancorada (cabo esquerdo)",
  "ruim": "Backup solto do cabo",
  "e": "O backup é a segunda barreira: precisa estar ancorado até o momento do lançamento."
 }
];
export const ITENS_RESG = [
 {
  "n": "Capacete vermelho",
  "ok": "Jugular afivelada",
  "ruim": "Jugular solta",
  "e": "Capacete sem jugular ajustada sai da cabeça."
 },
 {
  "n": "Cinto paraquedista 7Y",
  "ok": "Fivelas travadas",
  "ruim": "Fivela da perna aberta",
  "e": "O 7Y é o ponto de ancoragem do resgatista: fivela aberta é falha na ancoragem."
 },
 {
  "n": "Descensor",
  "ok": "Corda passada e trava funcionando",
  "ruim": "Corda passada ao contrário",
  "e": "Descensor com a corda invertida não freia como esperado."
 },
 {
  "n": "Ascensor ventral",
  "ok": "Preso no encordoamento",
  "ruim": "Sem mosquetão de trava",
  "e": "O ascensor ventral precisa estar travado no encordoamento."
 },
 {
  "n": "Link curto (2 mosq.)",
  "ok": "Fita com 2 mosquetões travados",
  "ruim": "Um mosquetão sem trava",
  "e": "O link curto liga polia com polia: os dois mosquetões precisam estar travados."
 },
 {
  "n": "Rádio comunicador",
  "ok": "Ligado e testado",
  "ruim": "Desligado",
  "e": "O resgatista precisa do rádio para avisar o coordenador e o APH."
 }
];
export const EXTRACOES = {
 "simples": {
  "titulo": "FASE 2 · EXTRAÇÃO SIMPLES",
  "sub": "Manobra tipo 1 · rajadas de vento pararam o cliente a 30 m das molas",
  "passos": [
   {
    "nome": "Comunicar a extração",
    "tipo": "radio",
    "txt": "Avise o Lançamento pelo rádio: haverá uma extração.",
    "chama": "📻 \"Extração simples na Via {via}: cliente parado a 30 m das molas\"",
    "resp": "Lançamento: Recebido, extração na Via {via}. Descidas suspensas."
   },
   {
    "nome": "Bloquear as descidas",
    "tipo": "bloqueio",
    "txt": "Certifique-se de que não há nenhuma via com usuários e bloqueie todas as descidas."
   },
   {
    "nome": "Pegar o kit de extração",
    "tipo": "itens",
    "txt": "Toque só nos itens de que a extração simples precisa.",
    "itens": [
     [
      "Polia de extração",
      1
     ],
     [
      "Corda longa",
      1
     ],
     [
      "Mosquetão com trava",
      1
     ],
     [
      "Cinto 7Y e kit de resgate completo",
      0,
      "Isso é para a extração moderada, com acesso ao cabo. Na simples, a polia vai pelo cabo com a corda."
     ]
    ]
   },
   {
    "nome": "Clipar a polia no cabo e na corda",
    "tipo": "toque",
    "txt": "Coloque a polia no cabo e clipe a corda nela.",
    "btn": "🔗 Clipar polia + corda",
    "alvo": "pul0"
   },
   {
    "nome": "Levar a polia até o cliente",
    "tipo": "puxar",
    "txt": "Empurre a polia pelo cabo até o cliente, 30 m. Toque várias vezes.",
    "btn": "➡ EMPURRAR",
    "n": 14,
    "campo": "pul"
   },
   {
    "nome": "Orientar o cliente",
    "tipo": "escolha",
    "txt": "A polia chegou. O que você diz ao cliente?",
    "ops": [
     [
      "\"Segure a corda com as duas mãos e fique calmo. Vamos puxar você.\"",
      1
     ],
     [
      "\"Solte-se da cadeirinha e agarre a corda.\"",
      0,
      "O cliente nunca se solta da cadeirinha: ele continua ancorado até o deck.",
      1
     ],
     [
      "\"Fique parado, não segure nada.\"",
      0,
      "Ele precisa segurar a corda para ser trazido; oriente com calma e clareza."
     ]
    ]
   },
   {
    "nome": "Puxar o cliente até o deck",
    "tipo": "puxar",
    "txt": "Puxe a corda até o deck, junto com os operadores presentes.",
    "btn": "⬅ PUXAR",
    "n": 18,
    "campo": "cli"
   }
  ]
 },
 "moderada": {
  "titulo": "FASE 3 · EXTRAÇÃO MODERADA",
  "sub": "Manobra tipo 2 · rajadas de 90 km/h pararam o cliente sobre o vão do cânion",
  "passos": [
   {
    "nome": "Primeira atitude",
    "tipo": "escolha",
    "txt": "O cliente (80 kg) parou sobre o vão. O que você faz primeiro?",
    "ops": [
     [
      "Pedir autorização ao coordenador pelo rádio.",
      1
     ],
     [
      "Me equipar e ir direto ao cabo.",
      0,
      "Sem autorização do coordenador não há extração: é ele quem determina as manobras.",
      1
     ],
     [
      "Esperar o vento passar sem avisar ninguém.",
      0,
      "A situação precisa ser comunicada de imediato ao coordenador."
     ]
    ]
   },
   {
    "nome": "Pedir autorização",
    "tipo": "radio",
    "txt": "Peça autorização ao coordenador.",
    "chama": "📻 \"Coordenador, solicito autorização para extração moderada na Via {via}\"",
    "resp": "Coordenador: Autorizado. Siga o PAE e mantenha o rádio aberto."
   },
   {
    "nome": "Bloquear as descidas",
    "tipo": "bloqueio",
    "txt": "Verifique se há vias liberadas e bloqueie imediatamente todas as descidas."
   },
   {
    "nome": "Equipar-se",
    "tipo": "itens",
    "txt": "Toque nos itens do resgatista.",
    "itens": [
     [
      "Cinto paraquedista 7Y",
      1
     ],
     [
      "Capacete vermelho",
      1
     ],
     [
      "Descensor",
      1
     ],
     [
      "Ascensor ventral",
      1
     ],
     [
      "Link curto com 2 mosquetões",
      1
     ],
     [
      "Rádio comunicador",
      1
     ],
     [
      "Cadeirinha ziprider",
      0,
      "A cadeirinha ziprider é do cliente. O resgatista usa o cinto 7Y."
     ]
    ],
    "equipa": true
   },
   {
    "nome": "Dupla checagem do resgatista",
    "tipo": "dupla",
    "txt": "Outro resgatista ou operador confere o seu equipamento. Marque o item errado, se houver."
   },
   {
    "nome": "Escolher a via de acesso",
    "tipo": "escolha",
    "txt": "Em qual via você se clipa? (Vias 2 e 4 são as intermediárias.)",
    "ops": [
     [
      "Via 1",
      0,
      "Nas vias de lançamento o peso baixa demais os cabos e o cliente pode se chocar contra o deck de chegada. Use uma via intermediária."
     ],
     [
      "Via 2 (intermediária)",
      1
     ],
     [
      "Via 3",
      0,
      "Nas vias de lançamento o peso baixa demais os cabos e o cliente pode se chocar contra o deck de chegada. Use uma via intermediária."
     ],
     [
      "Via 4 (intermediária)",
      1
     ],
     [
      "Via 5",
      0,
      "Nas vias de lançamento o peso baixa demais os cabos e o cliente pode se chocar contra o deck de chegada. Use uma via intermediária."
     ]
    ]
   },
   {
    "nome": "Clipar o encordoamento no cabo",
    "tipo": "toque",
    "txt": "Coloque a polia no cabo e clipe o encordoamento nela.",
    "btn": "🔗 Clipar encordoamento",
    "alvo": "res0"
   },
   {
    "nome": "Ir pelo cabo até o cliente",
    "tipo": "puxar",
    "txt": "Puxe-se pelo cabo até o cliente, sobre o vão do cânion.",
    "btn": "➡ PUXAR-SE",
    "n": 22,
    "campo": "res"
   },
   {
    "nome": "Clipar polia com polia",
    "tipo": "itens",
    "txt": "Ligue sua polia à polia do cliente com dois mosquetões em um link curto.",
    "itens": [
     [
      "Mosquetão 1 na polia do cliente",
      1
     ],
     [
      "Mosquetão 2 na sua polia",
      1
     ],
     [
      "Conferir as duas travas",
      1
     ]
    ]
   },
   {
    "nome": "Trazer o cliente até o deck",
    "tipo": "puxar",
    "txt": "Traga o cliente pelo cabo até o deck de chegada.",
    "btn": "⬅ TRAZER",
    "n": 22,
    "campo": "back"
   }
  ]
 }
};
/* legendas do recebimento (23,6 s de roteiro): [início s, fim s, texto] */
export const RECEBIMENTO_LEGENDAS = [
 [
  0,
  3.6,
  "Cliente chegando ao Deck de Recebimento…"
 ],
 [
  3.6,
  5.8,
  "Frenagem pelas molas dentro do limite seguro. Operadores se aproximam; a escada é posicionada."
 ],
 [
  5.8,
  7.8,
  "Clipando a cadeirinha em duas cordas que saem do mesmo ponto do chão: a branca à esquerda do cliente e a vermelha à direita."
 ],
 [
  8,
  9.6,
  "Desclipando a ancoragem anti-suicídio."
 ],
 [
  9.6,
  11.2,
  "Desclipando o cinto vertical (o “colete” de fita)."
 ],
 [
  11.2,
  12.8,
  "Desclipando o cinto horizontal da barriga."
 ],
 [
  12.8,
  14.8,
  "O cliente desce com cuidado pela escada."
 ],
 [
  14.8,
  19.6,
  "Cliente orientado a seguir a faixa até o receptivo. Operador retira as roldanas do cabo, uma por vez."
 ],
 [
  19.6,
  23.6,
  "No receptivo: retirada do capacete, da touca, dos óculos e do cinto paraquedista."
 ]
];
export const VENTO_TABELA = [ { ate: 40, min: 40, max: 110 }, { ate: 60, min: 60, max: 110 } ];
