import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const bundle=new URL('../dist/trolley3d.min.js',import.meta.url),index=new URL('../../index.html',import.meta.url);
const hash=createHash('sha256').update(await readFile(bundle)).digest('hex').slice(0,12);
const html=await readFile(index,'utf8');
if(!/const BUNDLE = "[^"]+";/.test(html))throw new Error('Referência ao bundle não encontrada em index.html');
await writeFile(index,html.replace(/const BUNDLE = "[^"]+";/,'const BUNDLE = "t3d/dist/trolley3d.min.js?v='+hash+'";'));
console.log('Versão do jogo: '+hash);
