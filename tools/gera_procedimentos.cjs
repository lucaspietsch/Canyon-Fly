const fs=require('fs'),vm=require('vm');
const ck=fs.readFileSync(__dirname+'/../build/checklist-atualizado.html','utf8');
let a=ck.indexOf('const ITENS = {'), b=ck.indexOf('const FOLHAS');
const ITENS=vm.runInNewContext('('+ck.slice(a+'const ITENS = '.length, b).trim().replace(/;$/,'')+')');
const FAIXA = { cabo:[0.9,1.0], trolley:[0,0.05,0.1] };
const jg=fs.readFileSync(__dirname+'/../jogo/index.html','utf8');
const pick=(nome)=>{ const i=jg.indexOf('const '+nome+' = '); const j=jg.indexOf('\n];',i); return vm.runInNewContext('('+jg.slice(i+('const '+nome+' = ').length,j+2)+')'); };
const PROC=pick('PROCEDIMENTOS'),BRIEF=pick('BRIEFING'),DUPLA=pick('ITENS_DUPLA'),RESG=pick('ITENS_RESG');
const i=jg.indexOf('const EXT_DEF = '), j=jg.indexOf('\nfunction iniciaExt');
const EXT=vm.runInNewContext('('+jg.slice(i+'const EXT_DEF = '.length,j).trim().replace(/;$/,'')+')');
const li=jg.indexOf('legendas: ['), lf=jg.indexOf('] };',li);
const LEG=vm.runInNewContext('('+jg.slice(li+'legendas: '.length,lf+1)+')');
const tab=jg.match(/ventoTabela: (\[[^\]]*\])/)[1];
const out=`/* PROCEDIMENTOS E CHECKLISTS DA OPERAÇÃO — copiados dos arquivos que já existem no projeto, sem inventar nada:
   • CHECKLISTS: build/checklist-atualizado.html (const ITENS): formulários 122 (Recebimento), 123 (Lançamento), 124 (Cadeirinhas/EPIs), 125 (Trolley diário) e a faixa normal do inclinômetro.
   • PROCEDIMENTOS, BRIEFING, ITENS_DUPLA, ITENS_RESG, EXTRACOES: jogo/index.html ("Iniciar Turno": etapas do lançamento, perguntas do briefing, dupla checagem, extração simples e moderada).
   Se o procedimento oficial mudar, atualize os arquivos de origem e gere de novo (node tools/gera_procedimentos.cjs). O que não existe nos arquivos de origem fica marcado "a definir". */
export const CHECKLISTS = ${JSON.stringify({ rec: { form:"122", nome:"Recebimento (122)", itens: ITENS["122"] }, lan: { form:"123", nome:"Lançamento (123)", itens: ITENS["123"] }, cad: { form:"124", nome:"Cadeirinhas, capacetes e acessórios (124)", itens: ITENS["124"] }, tro: { form:"125", nome:"Trolley diário (125)", itens: ITENS["125"] } },null,1)};
export const INCLINOMETRO = ${JSON.stringify({ cabos: 6, faixaCabo: FAIXA.cabo, faixaTrolley: FAIXA.trolley, nota: "Cabos 1 a 6 costumam dar 0.9 ou 1.0; trolley 0.00, 0.05 ou 0.1 (checklist-atualizado.html)" })};
export const PROCEDIMENTOS = ${JSON.stringify(PROC,null,1)};
export const BRIEFING = ${JSON.stringify(BRIEF,null,1)};
export const ITENS_DUPLA = ${JSON.stringify(DUPLA,null,1)};
export const ITENS_RESG = ${JSON.stringify(RESG,null,1)};
export const EXTRACOES = ${JSON.stringify(EXT,null,1)};
/* legendas do recebimento (23,6 s de roteiro): [início s, fim s, texto] */
export const RECEBIMENTO_LEGENDAS = ${JSON.stringify(LEG,null,1)};
export const VENTO_TABELA = ${tab.replace(/(\w+):/g,'$1:')};
`;

fs.writeFileSync(__dirname+'/../data/missoes/procedimentos.js',out);
console.log(out.length, Object.keys(EXT), PROC.length, BRIEF.length, DUPLA.length);
