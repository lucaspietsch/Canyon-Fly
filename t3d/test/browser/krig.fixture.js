import './fixture.js';
import { criarTransformacao } from '../../src/mundo/personagens/transformacao.js';
import { sessao } from '../../src/mundo/seguranca/senha.js';
const {M,P,activate,J}=window.test;
window.initKrig=()=>{activate('krig');const rig=M.personagens.rig;M.personagens.rig=id=>{const r=rig(id);r.fx.liga=()=>{};r.fx.desliga=()=>{};return r;};sessao.entra('krig');M.lugares.epoca=()=> '1950';M.transformacao=criarTransformacao(M);M.transformacao.liga('krig');return M.transformacao;};
window.flyStep=(t,dt=.05)=>{for(let left=t;left>1e-8;left-=dt){const n=Math.min(dt,left);M.transformacao.tick(n);P.tick(n,J);}};
