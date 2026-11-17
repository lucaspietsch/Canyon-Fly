import test from 'node:test';
import assert from 'node:assert/strict';
import {escolheTrilha} from '../src/mundo/trilha.js';
test('trilhas acompanham cenas e retornam ao ambiente',()=>{
 for(const [contexto,esperado] of [[{},'ambiente'],[{descida:true,terror:true},'tirolesa'],[{tupaEvento:true,escolha:true},'tupa'],[{sepeEvento:true,terror:true},'sepe'],[{escolha:true},'personagens'],[{transformando:true},'personagens'],[{terror:true,personagem:'sepe'},'terror'],[{personagem:'sepe'},'sepe'],[{personagem:'tupa'},'tupa']])assert.equal(escolheTrilha(contexto),esperado);
});
