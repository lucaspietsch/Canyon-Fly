import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCoordenacao } from '../src/mundo/personagens/coordenacao.js';
test('Krig coordena pelo rádio no parque atual sem alterar objetivos',()=>{
 const mensagens=[],poses=[];let ouvinte;
 const M={zonas:{atual:'parque'},lugares:{epoca:()=> '2026'},terminal:{msg:(tipo,texto)=>mensagens.push([tipo,texto])},H:{jogo:{atores:{coord:{krigVisual:{radio:n=>poses.push(n)}}}}},missoes:{ouve:f=>ouvinte=f}};
 criarCoordenacao(M);ouvinte('inicia',{m:{titulo:'Inspeção'}});assert.match(mensagens[0][1],/Krig.*Coordenação.*Inspeção/);assert.equal(poses.length,1);
 M.zonas.atual='vila';ouvinte('inicia',{m:{titulo:'Outra'}});assert.equal(mensagens.length,1);
 M.zonas.atual='parque';M.lugares.epoca=()=> '1950';ouvinte('inicia',{m:{titulo:'Passado'}});assert.equal(mensagens.length,1);
});
