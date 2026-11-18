/* Missões só cadastradas ("em breve"), sem implementação. Pré-requisitos já definidos. */
export const missoesEmBreve = [
  { id: "m08-em-breve", numero: 8, serie: "principal", titulo: "Missão 8", descricao: "Em breve: ir embora (~17:30), descer a trilha com o Pit, ajudar o SAMU e voltar com a equipe no mesmo carro.", emBreve: true, prereq: { missoes: ["m07-operar-lancamento"] }, etapas: [] },
  { id: "m09-em-breve", numero: 9, serie: "principal", titulo: "Missão 9", descricao: "Em breve.", emBreve: true, prereq: { missoes: ["m08-em-breve"] }, etapas: [] },
  { id: "m10-em-breve", numero: 10, serie: "principal", titulo: "Missão 10", descricao: "Em breve.", emBreve: true, prereq: { missoes: ["m09-em-breve"] }, etapas: [] },
  /* ---- série "vila": lendas e histórias da Vila Oswaldo Kroeff, da Vila Santana (1950) e da Antiga Floresta da Olaria. Só cadastradas: as etapas são editáveis aqui quando forem escritas. ---- */
  /* ---- série "lendas": assombrações, lendas e seres mitológicos. A 1ª é o Capa Preta, no pavilhão de pedra da Cambará S/A (t3d/src/mundo/lugares/pavilhao.js). ---- */
  { id: "l01-capa-preta", numero: 1, serie: "lendas", titulo: "O Capa Preta", descricao: "Em breve: no pavilhão de pedra da Cambará S/A, um vulto de capa preta voa sob a abóbada e assusta os trabalhadores do turno da noite. Vá até lá depois das 19h.", emBreve: true, prereq: { missoes: ["m07-operar-lancamento"] }, etapas: [] },
  { id: "v02-lobisomem", numero: 2, serie: "vila", titulo: "O Lobisomem", descricao: "Em breve: história de lobisomem contada na vila.", emBreve: true, prereq: { missoes: ["m07-operar-lancamento"] }, etapas: [] },
  { id: "v04-atiara", numero: 4, serie: "vila", titulo: "Atiara", descricao: "Em breve: a história de Atiara, nos anos 1950, entre a Raia (antiga Vila Santana) e a fábrica.", emBreve: true, prereq: { missoes: ["m07-operar-lancamento"] }, etapas: [] },
];
