import { Group, Mesh, BoxGeometry, ConeGeometry, TorusGeometry, MeshStandardMaterial, Matrix4, Quaternion, Vector3, Euler } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { U } from "../config.js";
import { canvasTex } from "../../lib.js";
import { latLonParaMundo } from "../resgate/kml.js";
import { PREDIOS_CENTRO, ORIGEM_CENTRO as O } from "../dados/cidade-centro.js";

/* ============================================================================================================
   CENTRO DE CAMBARÁ DO SUL — primeira montagem (blocos) a partir do catálogo dos prints do Lucas (docs/cidade/REFERENCIAS-STREET-VIEW.md):
   • prédios em blocos (paredes + telhado de 4 águas), cada um com a frente PARALELA À RUA mais próxima (mesmo que fique torto — pedido do Lucas), com colisão;
   • Igreja Matriz São José com a torre (posição triangulada por 5 vistas);
   • Rua Coberta: EXATAMENTE 10 arcos em forma de favo de mel (hexágono), girados alguns graus e cravados no solo, só na frente da praça.
   Coordenadas dos dados: metros locais (x leste, y norte) a partir da Ref 01; aqui viram lat/lon → mundo (latLonParaMundo) + o deslocamento da cidade (u.T).
   Gerado por docs/cidade/gera_cidade.py — para mudar posições/medidas, edite o gerador e rode de novo.
   ============================================================================================================ */

const COR = { casa: [0xefe4cf, 0xb04a32], publico: [0xf2ead2, 0x8b4a2b], comercio: [0xf7f5f0, 0x64666c], igreja: [0xf6f2e8, 0x8e9196] };
/* cor da parede pelo que o catálogo diz de cada prédio (nome) */
const CORES_NOME = [[/salmão/i, 0xe9a58a], [/Bikers/i, 0x2a2a2c], [/magenta/i, 0xd77aa8], [/ocre/i, 0xd4a24a], [/verde-acinzentad/i, 0x9fb0a0], [/marrom/i, 0x7a5638], [/cinza-escura/i, 0x4a4a4e], [/pedra\)/i, 0x8a8478], [/Pizzaria/i, 0x3a3a3e], [/Dois Irmãos/i, 0xe6d6b8], [/alpendre vermelho|Chalé branco|tábuas brancas|branca de madeira/i, 0xf4f4f0], [/rosa-avermelhada/i, 0xd98a80], [/mostarda/i, 0xd9b55a], [/bege/i, 0xe6d6b8], [/tijolo inacabado/i, 0xa8583a], [/rosa/i, 0xe9b7b9], [/amarel/i, 0xf0d77e], [/verde/i, 0xa9c4a0], [/lil[aá]s/i, 0xc3b1dc], [/vermelh/i, 0xc0554a], [/cinza|t[aá]buas/i, 0xa9a49a], [/madeira escura/i, 0x6e5440], [/Prefeitura/i, 0xf0d77e], [/Sociedade/i, 0xf1e3c2], [/Thewes/i, 0xf3d6d6], [/Pioneiro/i, 0xd9776a], [/concreto/i, 0xb8b4ac]];
const corDe = (nome, tipo) => { for(const [re, c] of CORES_NOME) if(re.test(nome)) return c; return (COR[tipo] || COR.casa)[0]; };
/* texturas de fachada (1 ladrilho = 3,2 m de largura × 1 pavimento de 3,2 m): fundo BRANCO (a cor vem do material), janelas/portas por cima */
const MOD = 3.2;
function texFachada(tipo){
  return canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(0,0,0,.06)"; c.fillRect(0, h - 4, w, 4);            // rodapé
    if(tipo === "igreja"){ c.fillStyle = "#3f5f7a"; c.beginPath(); c.moveTo(22, 58); c.lineTo(22, 22); c.arc(32, 22, 10, Math.PI, 0); c.lineTo(42, 58); c.fill(); c.strokeStyle = "#f4f1e8"; c.lineWidth = 2; c.stroke(); c.fillStyle = "#d9d3c2"; c.fillRect(0, 0, 4, h); c.fillRect(w - 4, 0, 4, h); return; }
    if(tipo === "madeira"){ c.fillStyle = "rgba(0,0,0,.16)"; for(let x = 0; x < w; x += 8) c.fillRect(x, 0, 1.5, h); c.fillStyle = "#6a8aa0"; c.fillRect(22, 18, 20, 24); c.strokeStyle = "#f4f1e8"; c.lineWidth = 3; c.strokeRect(22, 18, 20, 24); return; }   // tábua e mata-junta
    if(tipo === "comercio"){ c.fillStyle = "#53697a"; c.fillRect(8, 18, 48, 36); c.strokeStyle = "#2c2c2c"; c.lineWidth = 2; c.strokeRect(8, 18, 48, 36); c.beginPath(); c.moveTo(32, 18); c.lineTo(32, 54); c.stroke(); return; }
    if(tipo === "publico"){ c.fillStyle = "#5a3b24"; c.fillRect(20, 12, 24, 40); c.fillStyle = "#7a9ab0"; c.fillRect(23, 15, 18, 20); c.strokeStyle = "#f4f1e8"; c.lineWidth = 3; c.strokeRect(19, 11, 26, 42); return; }
    c.fillStyle = "#6a8aa0"; c.fillRect(22, 18, 20, 24); c.strokeStyle = "#f4f1e8"; c.lineWidth = 2; c.strokeRect(22, 18, 20, 24); c.beginPath(); c.moveTo(32, 18); c.lineTo(32, 42); c.moveTo(22, 30); c.lineTo(42, 30); c.stroke();
    c.fillStyle = "#8a3a2a"; c.fillRect(12, 17, 8, 26); c.fillRect(44, 17, 8, 26);                                               // venezianas
  }, { repeat: [1, 1] });
}
function texTorre(){
  return canvasTex(64, 256, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "#e3ddcc"; c.fillRect(0, 0, 5, h); c.fillRect(w - 5, 0, 5, h);
    c.fillStyle = "#2a2a2a"; for(const x of [16, 36]){ c.beginPath(); c.moveTo(x, 62); c.lineTo(x, 30); c.arc(x + 6, 30, 6, Math.PI, 0); c.lineTo(x + 12, 62); c.fill(); }     // campanário: 2 aberturas em arco lado a lado
    c.fillStyle = "#3f5f7a"; c.beginPath(); c.arc(32, 120, 9, 0, Math.PI * 2); c.fill();                                                   // óculo
    c.fillStyle = "#5a3b24"; c.beginPath(); c.moveTo(20, 256); c.lineTo(20, 206); c.arc(32, 206, 12, Math.PI, 0); c.lineTo(44, 256); c.fill();       // porta principal em arco
  }, { repeat: [1, 1] });
}
/* UV da caixa 1×1×1 (faces ±x, ±x, ±y, ±y, ±z, ±z; 4 vértices cada): ladrilhos de MOD m; topo/fundo no canto (só cor) */
function uvCaixa(g, wM, dM, hM, soLongos = false){ const uv = g.attributes.uv; for(let f = 0; f < 6; f++) for(let k = 0; k < 4; k++){ const i = f * 4 + k; let lado = f < 2 ? dM : f > 3 ? wM : 0; if(soLongos && lado && lado < Math.max(wM, dM)) lado = 0;      /* igreja: janelas só nas laterais compridas */
  if(!lado){ uv.setXY(i, .02, .98); continue; } uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(lado / MOD)), uv.getY(i) * Math.max(1, Math.round(hM / MOD))); } uv.needsUpdate = true; }

export function criarCentro(M, u){
  const { cen } = M, G = new Group(), T = u.T || [0, 0];
  const mundo = (x, y) => { const p = latLonParaMundo(O.lat + y / O.mLat, O.lon + x / O.mLon); return [p[0] + T[0], p[1] + T[1]]; };
  const Y = (x, z) => cen.relevo(x, z);
  /* eixo local (metros) → vetor no mundo (u por metro) */
  const eixo = (x, y, ang) => { const a = mundo(x, y), b = mundo(x + Math.cos(ang), y + Math.sin(ang)); return [b[0] - a[0], b[1] - a[1]]; };
  const geos = new Map(), add = (cor, g, tex = "") => { const k = tex + "|" + cor; if(!geos.has(k)) geos.set(k, []); geos.get(k).push(g); };
  const TEX = { madeira: texFachada("madeira"), casa: texFachada("casa"), comercio: texFachada("comercio"), publico: texFachada("publico"), igreja: texFachada("igreja"), torre: texTorre() };
  for(const t of ["casa", "comercio", "publico", "igreja", "madeira"]){ TEX[t].wrapS = TEX[t].wrapT = 1000; }
  const pisos = [], colisores = [], m4 = new Matrix4(), q = new Quaternion(), e = new Euler(), v = new Vector3(), s = new Vector3();

  /* ---------- prédios em blocos ---------- */
  for(const [nome, x, y, w, d, alt, tipo, angG, fx0, fy0] of PREDIOS_CENTRO){
    const a = angG * Math.PI / 180, [cx, cz] = mundo(x, y), ex = eixo(x, y, a), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]);
    const W = w * le, D = d * le, H = alt * U, ey = [-ex[1], ex[0]], amostra = [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([i, j]) => Y(cx + (ex[0] * w * i + ey[0] * d * j) / 2, cz + (ex[1] * w * i + ey[1] * d * j) / 2));
    const temInterior = /Du Perau|Brentano|Thewes/.test(nome), y0 = temInterior ? Math.max(...amostra) + .05 : Math.min(...amostra.slice(0, 3)) - .3;   /* com interior: piso acima do terreno mais alto (o gramado não atravessa o chão) */
    const cTelha = /Sabores/.test(nome) ? 0x5f8a3a : /Galpão|rosa-avermelhada/.test(nome) ? 0x8f9296 : /tábuas brancas/.test(nome) ? 0x6a2a2a : (COR[tipo] || COR.casa)[1], cParede = corDe(nome, tipo), texP = tipo === "casa" && /madeira|tábuas|Chalé|chalé|Galpão/.test(nome) ? "madeira" : tipo;
    e.set(0, yaw, 0); q.setFromEuler(e);
    const oco = /Du Perau|Brentano|Thewes/.test(nome), aberto = /Garagem coberta|muro e jardim|combustível/.test(nome);                                                                    /* prédios com interior visitável: paredes ocas e porta aberta */
    if(!oco && !aberto){ const par = new BoxGeometry(1, 1, 1); uvCaixa(par, w, d, alt, tipo === "igreja"); par.applyMatrix4(m4.compose(v.set(cx, y0 + H / 2, cz), q, s.set(W, H, D))); add(cParede, par, texP); }
    /* frente: lado do bloco virado para a rua mais próxima (a igreja: para a praça, ao sul) */
    const [fx, fy] = /Igreja/.test(nome) ? [x, y - 60] : /Thewes/.test(nome) ? [x, y + 20] : [fx0, fy0], fp = mundo(fx, fy), vx = fp[0] - cx, vz = fp[1] - cz;
    const ux = [Math.cos(yaw), -Math.sin(yaw)], uz = [Math.sin(yaw), Math.cos(yaw)], px = vx * ux[0] + vz * ux[1], pz = vx * uz[0] + vz * uz[1];
    const frenteX = Math.abs(px) > Math.abs(pz), sg = Math.sign(frenteX ? px : pz) || 1, meioFundo = (frenteX ? w : d) / 2, meioLarg = (frenteX ? d : w) / 2;
    /* ponto/peça no sistema da FACHADA: a = ao longo da fachada (m), b = para fora (m, 0 = parede), h = altura (m) */
    const P = (a, b, h) => { const lx = frenteX ? sg * (meioFundo + b) : a, lz = frenteX ? -a * sg : sg * (meioFundo + b); return [cx + (lx * ux[0] + lz * uz[0]) * le, y0 + h * U, cz + (lx * ux[1] + lz * uz[1]) * le]; };
    const peca = (a, b, h, la, pb, ah, cor, tex) => { const [qx, qy, qz] = P(a, b, h + ah / 2), g = new BoxGeometry(1, 1, 1); if(tex) uvCaixa(g, la, pb, ah);
      g.applyMatrix4(m4.compose(v.set(qx, qy, qz), q, frenteX ? s.set(pb * le, ah * U, la * le) : s.set(la * le, ah * U, pb * le))); add(cor, g, tex || ""); };
    /* telhado: chalés e casas antigas com empena (duas águas, cumeeira perpendicular à rua); o resto 4 águas */
    const empena = /Chalé|chalé|Galochas|mal-assombrada|trapeira|Casa histórica|tábuas|Igreja/.test(nome);
    if(/combustível/.test(nome)){ for(const [i, j] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) peca(i * meioLarg * .6, j * meioFundo * .5 - meioFundo, 0, .35, .35, 4.6, 0xe8e8e8); peca(0, -meioFundo, 4.6, 2 * meioLarg, 2 * meioFundo * .9, .6, 0x1c8a3a); for(const a of [-meioLarg * .3, meioLarg * .3]) peca(a, -meioFundo, 0, .8, 1.4, 1.8, 0xd8d8d8); peca(meioLarg + 3, -meioFundo, 0, 6, 6, 3.2, 0xf4f4f0); }   // posto: cobertura verde sobre 4 pilares, 2 bombas e lojinha
    else if(/muro e jardim/.test(nome)){ peca(0, -.2, 0, 2 * meioLarg, .4, 2.0, 0xb0453a); peca(0, -.2, 2.0, 2 * meioLarg, .45, .2, 0xf4f4f0); peca(-meioLarg * .5, -meioFundo, 0, .6, .6, 9, 0x4a3a2a); peca(-meioLarg * .5, -meioFundo, 6, 4, 4, 1.2, 0x2f5a2a); peca(meioLarg * .4, -meioFundo * 1.2, 0, .6, .6, 8, 0x4a3a2a); peca(meioLarg * .4, -meioFundo * 1.2, 5.5, 4, 4, 1.2, 0x2f5a2a); }   // muro vermelho e branco do Café do Casarão, araucárias no jardim
    else if(aberto){ for(const [i, j] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) peca(i * (meioLarg - .2), j * (meioFundo - .2) - meioFundo, 0, .15, .15, 2.4, 0x5a5a5a); peca(0, -meioFundo, 2.4, 2 * meioLarg + .4, 2 * meioFundo + .4, .08, 0x9a9a96); peca(0, -meioFundo, 0, 1.8, 4.0, 1.4, 0x1e2630); }   // garagem: telha ondulada sobre postes, carro escuro
    else if(/concreto|tijolo inacabado|Quiosques/.test(nome)){ if(/Quiosques/.test(nome)){ peca(0, -meioFundo, alt, 2 * meioLarg, 2 * meioFundo, .2, 0x6a5a4a); } else { for(const [i, j] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) peca(i * (meioLarg - .3), j * (meioFundo - .3) - meioFundo, alt, .4, .4, 2.6, 0x8a8a86); peca(0, -meioFundo, alt, 2 * meioLarg, 2 * meioFundo, .25, 0x9a9a96); } }   // laje vazia em cima, pilares à mostra
    else if(empena){ const rh = meioLarg * 1.15, g = new ConeGeometry(Math.SQRT1_2, 1, 4); g.rotateY(Math.PI / 4);
      const sx = frenteX ? W * 1.08 : W * 1.1, sz = frenteX ? D * 1.1 : D * 1.08; g.scale(1, 1, 1);
      /* duas águas = "pirâmide esticada" cortada: usa um prisma triangular */
      const t = new BoxGeometry(1, 1, 1), pos = t.attributes.position; for(let i = 0; i < pos.count; i++){ if(pos.getY(i) > 0){ if(frenteX) pos.setZ(i, 0); else pos.setX(i, 0); } } pos.needsUpdate = true; t.computeVertexNormals();
      t.applyMatrix4(m4.compose(v.set(cx, y0 + H + rh / 2, cz), q, s.set(sx, rh, sz))); add(cTelha, t); g.dispose(); }
    else { const rh = Math.min(W, D) * .42, tel = new ConeGeometry(Math.SQRT1_2, 1, 4); tel.rotateY(Math.PI / 4);
      tel.applyMatrix4(m4.compose(v.set(cx, y0 + H + rh / 2, cz), q, s.set(W * 1.08, rh, D * 1.08))); add(cTelha, tel); }
    /* porta na fachada (comércio: porta de vidro larga) */
    if(!/Igreja/.test(nome) && !oco && !aberto){ if(tipo === "comercio") peca(0, .05, 0, 2.4, .2, 2.6, 0x2f3d48); else peca(0, .05, 0, 1.1, .2, 2.2, 0x5a3b24); }
    /* ---- detalhes dos prédios principais (catálogo) ---- */
    if(oco){ /* ===== INTERIORES VISITÁVEIS (layout provisório até as fotos do Lucas): casca oca com porta aberta + conteúdo por tipo ===== */
      { const O = P(0, 0, 0), A = P(1, 0, 0), B = P(0, 1, 0), av = [A[0] - O[0], A[2] - O[2]], bv = [B[0] - O[0], B[2] - O[2]];        /* piso caminhável do interior + rampa na porta (o personagem pisa no piso, não afunda) */
        pisos.push({ O, av, bv, aa: av[0] * av[0] + av[1] * av[1], bb: bv[0] * bv[0] + bv[1] * bv[1], L: meioLarg, F: 2 * meioFundo, y: y0 + .08 * U }); }
      const F = 2 * meioFundo, L2 = meioLarg, t = .3, porta = 1.2, rot = nome.replace(/[^\wÀ-ú ]/g, "").trim(), cc = (a, b, la, pb, nomeP) => { const c = [P(a - la / 2, b - pb / 2, 0), P(a + la / 2, b - pb / 2, 0), P(a - la / 2, b + pb / 2, 0), P(a + la / 2, b + pb / 2, 0)];
        colisores.push({ x0: Math.min(...c.map(p => p[0])), x1: Math.max(...c.map(p => p[0])), z0: Math.min(...c.map(p => p[2])), z1: Math.max(...c.map(p => p[2])), peca: rot + ":" + nomeP }); };
      const parede = (a, b, la, pb, h, ah, nomeP) => { peca(a, b, h, la, pb, ah, cParede, tipo); if(h < 1) cc(a, b, la, pb, nomeP); };
      const tipoI = /Du Perau/.test(nome) ? "pub" : /Supermercado/.test(nome) ? "mercado" : /Material/.test(nome) ? "material" : "loja";
      const PISO = { pub: 0x7a5638, mercado: 0xdad7cf, material: 0xa8a49c, loja: 0xc8b090 }, FORRO = { pub: 0x4a3524, mercado: 0xeeeeea, material: 0x8a8f94, loja: 0xf1ece2 };
      parede((-L2 - porta) / 2, -t / 2, L2 - porta, t, 0, alt, "frente esq"); parede((L2 + porta) / 2, -t / 2, L2 - porta, t, 0, alt, "frente dir"); peca(0, -t / 2, 2.6, porta * 2, t, alt - 2.6, cParede, tipo);   // fachada com a porta aberta
      parede(0, -F + t / 2, 2 * L2, t, 0, alt, "fundo"); for(const l of [-1, 1]) parede(l * (L2 - t / 2), -F / 2, t, F, 0, alt, "lado");
      peca(0, -F / 2, -2.5, 2 * L2, F, 2.5, 0x9a958c); peca(0, -F / 2, 0, 2 * L2 - .1, F - .1, .08, PISO[tipoI]);                                   /* base (fundação) até o terreno + piso */ peca(0, -F / 2, alt - .15, 2 * L2, F, .15, FORRO[tipoI]);                                    // piso e forro
      const CORES = [0xc0392b, 0xe67e22, 0xf1c40f, 0x27ae60, 0x2980b9, 0x8e44ad, 0xecf0f1, 0x34495e];
      if(tipoI === "pub"){ /* DU PERAU GASTRO PUB */
        peca(0, -F + 1.3, 0, L2 * 1.3, .7, 1.1, 0x5a3b24); peca(0, -F + 1.3, 1.1, L2 * 1.35, .8, .08, 0x2a2a2a); cc(0, -F + 1.3, L2 * 1.3, .7, "balcão");      // balcão do bar
        peca(-1, -F + 1.3, 1.18, .5, .3, .5, 0xb8bcc2); peca(-.4, -F + 1.3, 1.18, .5, .3, .5, 0xb8bcc2);                                                   // chopeiras
        peca(0, -F + .45, 1.4, L2 * 1.3, .3, 1.6, 0x3a2a1a); for(let i = 0; i < 10; i++) peca(-L2 * .6 + i * L2 * .13, -F + .45, 1.55 + (i % 2) * .5, .12, .12, .32, [0x2f6a3a, 0x7a3a1a, 0xd8b04a][i % 3]);   // garrafas
        for(const a of [-L2 * .55, 0, L2 * .55]) for(const b of [-F * .3, -F * .55]){ peca(a, b, .72, 1.1, 1.1, .08, 0x8a6a44); peca(a, b, 0, .15, .15, .72, 0x3a2a1a); cc(a, b, 1.1, 1.1, "mesa"); for(const da of [-.85, .85]) peca(a + da, b, 0, .4, .4, .45, 0x5a3b24); }
        peca(0, 1.5, 0, 2 * L2 * .95, 3, .15, 0x8a6a44); for(const l of [-1, 1]) peca(l * L2 * .55, 2.95, .15, L2 * .8, .1, .9, 0x5a3b24);                     // varanda de tábuas
        peca(0, .1, 2.75, 3.2, .12, .7, 0x1a1a1a);                                                                                                         // placa (nome só com autorização)
      } else if(tipoI === "mercado"){ /* SUPERMERCADO BRENTANO: corredores de prateleiras, geladeiras no fundo, caixas na frente */
        const nC = Math.max(2, Math.floor((2 * L2 - 3) / 2.6)), comp = F * .55, b0 = -F * .5;
        for(let k = 0; k < nC; k++){ const a = -L2 + 2.2 + k * 2.6; if(Math.abs(a) < 1.4) continue; peca(a, b0, 0, .9, comp, 1.9, 0xd0d0d0); cc(a, b0, .9, comp, "gôndola");
          for(let n = 0; n < 4; n++) for(const lado of [-1, 1]) peca(a + lado * .47, b0, .25 + n * .42, .06, comp * .96, .3, CORES[(k * 3 + n + (lado > 0 ? 4 : 0)) % CORES.length]); }       // produtos coloridos dos dois lados
        peca(0, -F + .6, 0, 2 * L2 * .9, 1.0, 2.0, 0xf4f6f8); peca(0, -F + 1.12, .3, 2 * L2 * .88, .05, 1.5, 0x9cc4dc); cc(0, -F + .6, 2 * L2 * .9, 1.0, "geladeiras");     // geladeiras de vidro no fundo
        for(const a of [-L2 * .55, L2 * .55]){ peca(a, -2.6, 0, 2.2, .8, .95, 0x5a5f66); peca(a, -2.6, .95, 2.2, .85, .05, 0x2a2a2a); peca(a + .7, -2.6, .95, .4, .3, .35, 0x1f1f1f); cc(a, -2.6, 2.2, .8, "caixa"); }   // caixas
        for(let k = 0; k < 4; k++){ peca(-L2 + 1 + k * .55, -1.2, 0, .5, .9, .95, 0x9aa2aa); }                                                                // carrinhos de compra
      } else if(tipoI === "material"){ /* MATERIAL DE CONSTRUÇÕES BRENTANO: estantes altas nas laterais, balcão, paletes de blocos, tábuas, cimento e tintas */
        for(const l of [-1, 1]){ peca(l * (L2 - .9), -F * .55, 0, 1.2, F * .75, 2.6, 0x7a7f86); cc(l * (L2 - .9), -F * .55, 1.2, F * .75, "estante");
          for(let n = 0; n < 4; n++) peca(l * (L2 - 1.55), -F * .55, .3 + n * .6, .1, F * .72, .35, [0x8a6a44, 0xb8b4ac, 0xc0392b, 0x2980b9][n]); }
        peca(0, -2.8, 0, L2 * .9, .8, 1.05, 0x6a4a2c); peca(0, -2.8, 1.05, L2 * .95, .9, .06, 0x2a2a2a); cc(0, -2.8, L2 * .9, .8, "balcão");                 // balcão
        for(const [a, b] of [[-L2 * .35, -F * .55], [L2 * .05, -F * .55], [-L2 * .35, -F * .8]]){ peca(a, b, 0, 1.2, 1.2, .15, 0x8a6a44); peca(a, b, .15, 1.1, 1.1, .9, 0xb4b0a8); cc(a, b, 1.2, 1.2, "palete"); }     // paletes de blocos
        peca(L2 * .3, -F * .8, 0, 1.0, 3.6, .5, 0xa07a4a); cc(L2 * .3, -F * .8, 1.0, 3.6, "tábuas");                                                         // pilha de tábuas
        for(let k = 0; k < 6; k++) peca(L2 * .05 + (k % 3) * .5, -F * .8 + Math.floor(k / 3) * .6, 0, .45, .5, .25 * (1 + (k % 2)), 0xc8c4bc);              // sacos de cimento
        for(let k = 0; k < 8; k++) peca(-L2 * .05 + (k % 4) * .35, -4.6, 0, .3, .3, .35, CORES[k % CORES.length]);                                          // latas de tinta
      } else { /* LOJA THEWES: moda (araras, manequins, provador) e casa (prateleiras de cama/mesa/banho) */
        for(const a of [-L2 * .5, 0]) for(const b of [-F * .3, -F * .6]){ peca(a, b, 0, .08, .08, 1.5, 0x2a2a2a); peca(a + 1.6, b, 0, .08, .08, 1.5, 0x2a2a2a); peca(a + .8, b, 1.45, 1.7, .06, .06, 0x2a2a2a);   // arara
          for(let n = 0; n < 7; n++) peca(a + .15 + n * .22, b, .65, .16, .5, .78, CORES[(n * 2 + Math.round(b)) % CORES.length]); cc(a + .8, b, 1.8, .6, "arara"); }          // roupas
        for(const a of [-L2 * .7, -L2 * .4]){ peca(a, -1.4, 0, .35, .35, .15, 0x2a2a2a); peca(a, -1.4, .15, .32, .22, 1.3, 0xe8ddd0); peca(a, -1.4, 1.45, .2, .2, .25, 0xe8ddd0); }   // manequins na vitrine
        peca(L2 * .55, -F * .3, 0, 2.2, .7, 1.0, 0xf4efe6); peca(L2 * .55, -F * .3, 1.0, 2.3, .8, .05, 0x8a6a44); cc(L2 * .55, -F * .3, 2.2, .7, "caixa");   // caixa
        peca(-L2 + 1.0, -F + 1.0, 0, 1.6, 1.6, 2.2, 0xd8cfc0); peca(-L2 + 1.0, -F + 1.82, .1, 1.2, .04, 1.9, 0x7a3a4a); cc(-L2 + 1.0, -F + 1.0, 1.6, 1.6, "provador");   // provador com cortina
        peca(L2 - .5, -F * .65, 0, .7, F * .5, 2.1, 0xf4efe6); cc(L2 - .5, -F * .65, .7, F * .5, "prateleira casa"); for(let n = 0; n < 4; n++) peca(L2 - .9, -F * .65, .25 + n * .5, .12, F * .48, .3, [0xe8c4b8, 0xb8d4e8, 0xf4f0e0, 0xc8e0c0][n]);   // cama, mesa e banho
        peca(L2 * .35, -F + 1.1, 0, 2.0, .9, .45, 0x6a7a8a); peca(L2 * .35, -F + .75, .45, 2.0, .2, .5, 0x6a7a8a); cc(L2 * .35, -F + 1.1, 2.0, .9, "sofá");   // sofá de mostruário
      }
    }

    if(/Sociedade/.test(nome)){ for(const lado of [-1, 1]){ peca(lado * 2.6, 1.4, 0, 2.2, 2.8, .5, 0xa8483a); peca(lado * 2.6, 1.0, 0, 2.2, 2.0, 1.0, 0xa8483a); } peca(0, 1.2, 3.4, 4.2, 2.4, .25, 0x7a4a2a); peca(0, .06, 3.1, w * .98, .1, .35, 0x7a4a2a); }     // escadaria dupla, marquise de cobre e faixa marrom
    if(/Igreja/.test(nome)){ peca(0, 6.5, 0, 9, 3, .5, 0xd8d2c4); peca(0, 5.5, 0, 9, 1.6, 1.0, 0xd8d2c4); peca(0, 4.6, 0, 9, 1.2, 1.5, 0xd8d2c4); for(const l of [-1, 1]){ peca(l * (w / 2 - .6), .25, 0, 1.0, .5, alt, 0xe0dacb); } peca(0, .25, alt - .6, w, .5, .6, 0xe0dacb); }       // escadaria diante da torre, pilastras e cornija na fachada                                      // escadaria na frente (praça)
    if(/mal-assombrada/.test(nome)){ const sO = frenteX ? 1 : -1; /* casa enorme (Lucas: A e B são uma casa só): bay de vidro com frontão e terraço de grade numa ponta (Refs 45/47), varanda fechada de vidro com terracinho na outra (Ref 44) */
      peca(-sO * (meioLarg - 2.4), 1.2, 0, 4.0, 2.4, 3.6, 0x9fc0d4); peca(-sO * (meioLarg - 2.4), 1.2, 3.6, 4.4, 2.6, .2, 0xe8e2d4); peca(-sO * (meioLarg - 2.4), 2.45, 3.8, 4.4, .08, .9, 0x2a2a2a); peca(-sO * (meioLarg - 2.4), .1, 3.8, 3.0, .2, 1.6, 0xe8e2d4);
      peca(sO * (meioLarg - 2.2), .9, 0, 4.0, 1.8, 3.0, 0xb8d0dc); peca(sO * (meioLarg - 2.2), .9, 3.0, 4.2, 2.0, .15, 0xe8e2d4); peca(sO * (meioLarg - 2.2), 1.85, 3.15, 4.2, .06, .8, 0x2a2a2a);
      peca(0, 3.0, 0, 2 * meioLarg + 2, .4, .7, 0x8a847a); } if(/mal-assombrada|trapeira/.test(nome)) peca(meioLarg * .3, -meioFundo * .6, alt, .9, .9, /mal-assombrada/.test(nome) ? 5.0 : 3.2, 0x8a4a34);         // chaminé de tijolo (alta na casa mal-assombrada)           // bay de vidro na ponta e chaminé de tijolo
    if(/amarela/.test(nome)){ peca(meioLarg * .5, -meioFundo * .5, alt, 1, 1, 5.5, 0x8a4a34); }                                                                                   // chaminé de tijolo muito alta
    if(/Supermercado/.test(nome)){ peca(0, .06, alt - 1.6, Math.min(8, w * .9), .15, 1.0, 0xffffff); }                                                                              // placa branca do letreiro (texto: só com autorização)
    if(/Thewes|Galochas|Material|Restaurante/.test(nome)){ peca(0, .7, 2.7, w * .7, 1.4, .15, 0x2a2a2a); }
    /* ---- demais prédios do catálogo ---- */
    if(/Salão Paroquial/.test(nome)){ peca(0, 1.4, 2.8, meioLarg * 1.6, 2.8, .2, 0x7a4a2a); for(const l of [-1, 1]) peca(l * meioLarg * .7, 2.6, 0, .3, .3, 2.8, 0xf2ead2); }        // alpendre na frente (sul, para a rótula)
    if(/Prefeitura/.test(nome)){ peca(0, 1.2, 0, 6, 2.4, .5, 0xd8d2c4); peca(0, .7, .5, 6, 1.4, .5, 0xd8d2c4); for(const k of [-1, 0, 1]){ peca(k * 1.2 + meioLarg * .55, 4, 0, .12, .12, 7, 0xd8d8d8); peca(k * 1.2 + meioLarg * .55 + .45, 4, 6.2, .8, .05, .5, [0x1c8a3a, 0xc0392b, 0xf1c40f][k + 1]); } }   // escadaria e 3 mastros com bandeiras
    if(/Centro Cultural/.test(nome)){ peca(0, .9, 0, 4, 1.8, .4, 0xd8d2c4); peca(0, 1.6, 3.0, 4.4, 3.2, .2, 0x8a4a2b); for(const l of [-1, 1]) peca(l * 2, 3.0, 0, .3, .3, 3.0, 0xf2ead2); }      // escadinha e varanda de entrada
    if(/alpendre vermelho/.test(nome)){ peca(meioLarg * .55, -.9, 0, meioLarg * .8, 1.8, 2.8, 0xc0554a); peca(meioLarg * .2, .1, 0, .35, .35, 2.8, 0xffffff); peca(0, 2.5, 0, 2 * meioLarg + 3, .3, 1.0, 0xf4f4f0); }   // alpendre recuado vermelho com coluna e muro branco
    if(/madeira escura/.test(nome)){ for(const a of [-meioLarg * .5, meioLarg * .5]){ peca(a, .7, 3.4, 2.4, 1.4, .15, 0x5a3b24); peca(a, 1.35, 3.55, 2.4, .1, 1.0, 0x5a3b24); } peca(0, 0, 0, 2 * meioLarg, .05, 3.2, 0xf4f4f0); }   // 2 varandas de madeira no andar de cima, térreo branco
    if(/Pioneiro/.test(nome)){ peca(0, .02, 0, 2 * meioLarg, .1, 3.3, 0xa8c8dc); peca(0, .08, alt - 1.2, 2 * meioLarg * .7, .1, .7, 0xffffff); for(let k = 0; k < 3; k++) peca(0, .9 - k * .3, k * .2, 2.2, .6, .2, 0xb03a2a); }   // térreo azul-claro, faixa do nome, escadinha vermelha
    if(/Restaurante/.test(nome)){ peca(0, .03, .4, 2 * meioLarg * .85, .08, 2.2, 0x6a8aa0); peca(meioLarg * .7, 1.5, 0, 1.2, 3.0, .3, 0xbcb8b0); }    // janelões de vidro e rampa
    if(/madeira rosa/.test(nome)){ peca(0, 0, -1.6, 2 * meioLarg, 2 * meioFundo, 1.6, 0x8a847a); peca(0, 1.6, -.6, 3.2, 3.2, .6, 0x8a847a); peca(0, 1.0, 0, 3.2, 2.0, .6, 0x8a847a); }   // porão e escadaria larga de pedra
    if(/Advocacia/.test(nome)){ peca(0, .06, 2.6, 3.0, .1, .6, 0x3a3a3a); }                                                                       // placa cinza-escura (genérica)
    if(/trapeira/.test(nome)){ for(const l of [-1, 1]) peca(l * meioLarg * .4, -meioFundo * .4, alt + .4, 1.4, 1.2, 1.4, 0xffffff); for(let k = 0; k < 3; k++) peca(0, .9 - k * .3, k * .25, 2.0, .6, .25, 0xb03a2a); }   // 2 trapeiras e escada de degraus vermelhos
    if(/amarela/.test(nome)){ peca(meioLarg + 1.6, -meioFundo, 0, 3.0, 4.0, .15, 0x8a6a44); for(const [i, j] of [[0, -1], [0, 1]]) peca(meioLarg + 2.9, -meioFundo + j * 1.8, 0, .2, .2, 2.6, 0x5a3b24); peca(meioLarg + 1.6, -meioFundo, 2.6, 3.2, 4.2, .1, 0xb8b8b4); }   // pergolado com fibrocimento
    if(/Galpão/.test(nome)){ peca(0, -.05, 0, 2 * meioLarg * .7, .1, 2.6, 0x2a2622); }                                                           // garagem aberta
    if(/tábuas cinza/.test(nome)){ peca(0, 0, -.8, 2 * meioLarg + .2, 2 * meioFundo + .2, .8, 0x7a756c); }                                     // base de pedras empilhadas
    if(/Galochas/.test(nome)){ for(const l of [-1, 1]){ peca(l * meioLarg * .55, .05, .4, 1.6, .1, 1.8, 0x53697a); peca(l * meioLarg * .25, .2, 2.4, .2, .2, .35, 0x2a2a2a); } peca(0, 1.4, 0, 3.0, 1.4, .3, 0x8a847a); }   // 2 vitrines, lampiões, degraus de pedra
    if(/bandeirinhas/.test(nome)){ for(const l of [-1, 1]){ peca(l * 1.4, 1.2, 0, .08, .08, 3.0, 0xd8d8d8); peca(l * 1.4 + .35, 1.2, 2.5, .6, .04, .4, l < 0 ? 0x1c8a3a : 0xc0392b); } }   // duas bandeirinhas na entrada
    if(/1152/.test(nome)){ peca(0, .06, alt - .2, 1.6, .15, 1.6, 0xf4f4f0); peca(0, .1, alt + .2, 1.0, .1, 1.0, 0x8a6a44); for(const l of [-1, 1]) peca(l * meioLarg * .5, .03, .3, meioLarg * .8, .08, 2.2, 0x53697a); }   // frontão com emblema redondo e 2 lojas de vidro
    if(/Chalé branco/.test(nome)){ peca(-meioLarg * .4, .5, 0, meioLarg, 1.0, 2.8, 0x2a2a2a); peca(-meioLarg * .4, 1.0, 2.8, meioLarg * 1.1, 1.2, .12, 0x1a1a1a); }   // comercinho no térreo com toldo preto
    /* ---- 2ª leva do catálogo ---- */
    if(/Pizzaria/.test(nome)){ peca(0, .05, 3.6, 2 * meioLarg * .7, .1, 2.0, 0x6a8aa0); peca(0, .1, alt, 2 * meioLarg * .8, .2, 1.4, 0xa07a4a); peca(0, .2, alt + .6, 1.0, .1, 1.0, 0x7a1a2a); }     // janelão de vidro, frontão de madeira, logo redondo bordô
    if(/chaminé e bay/.test(nome)){ peca(0, .9, 0, 3.2, 1.8, 3.2, 0x9fc0d4); peca(meioLarg * .5, -meioFundo * .5, alt, .8, .8, 2.8, 0x8a4a34); peca(0, 3.0, 0, 2 * meioLarg, .3, 1.2, 0xa8583a); }   // bay arredondado, chaminé, muro de tijolo e grade
    if(/topo em arco/.test(nome)){ peca(0, .05, alt, 2 * meioLarg * .8, .3, 1.4, 0xf0d77e); peca(0, .8, 2.6, 2 * meioLarg * .8, 1.2, .12, 0x7a3a2a); }       // platibanda em arco e toldo
    if(/palmeira/.test(nome)){ peca(meioLarg * .5, 2.5, 0, .5, .5, 7, 0x6a5a3a); peca(meioLarg * .5, 2.5, 7, 3.6, 3.6, .8, 0x3f7a35); peca(0, 4.2, 0, 2 * meioLarg + 2, .25, 1.4, 0x2a2a2a); }   // palmeira grande e muro com grade escura
    if(/letreiro verde/.test(nome)) peca(0, .1, 3.4, 2 * meioLarg * .8, .12, .8, 0x1c8a3a);                                                           // letreiro verde (genérico: rede nacional)
    if(/eletrodomésticos/.test(nome)) peca(0, .1, 3.0, 2 * meioLarg * .8, .12, .8, 0xf4f4f0);
    if(/Cooperativa/.test(nome)){ peca(0, .1, 3.2, 2 * meioLarg, .12, .7, 0x1c7a3a); peca(-meioLarg + .4, .05, 0, .8, .1, 3.2, 0xc8c4bc); }               // faixa verde e parede de pedra
    if(/Sabores/.test(nome)){ for(const l of [-1, 1]) peca(l * meioLarg * .6, .1, 0, 1.6, .3, alt, 0x6e6a62); peca(0, .05, 1.0, 2.6, .1, 3.2, 0x8ab0c4); peca(0, 2.4, 0, 2 * meioLarg, 1.5, .5, 0x8a6aaa); }   // pilares de pedra, janela triangular, canteiro de lavanda
    if(/Dois Irmãos|Hamburgueria/.test(nome)){ peca(0, .05, .4, 2 * meioLarg * .75, .08, 2.2, 0x53697a); peca(0, .1, 3.0, 2 * meioLarg * .8, .12, .7, /Dois/.test(nome) ? 0x3a3a3a : 0x6a2a8a); }
    if(/Hamburgueria/.test(nome)){ peca(0, .7, 3.3, 2 * meioLarg * .8, 1.4, .15, 0x6a4a2c); peca(0, 1.35, 3.45, 2 * meioLarg * .8, .08, .9, 0x6a4a2c); }
    if(/janelas azuis/.test(nome)) for(let k = -2; k <= 2; k++) peca(k * meioLarg * .35, .05, 2.2, 1.4, .1, .7, 0x2a6aa8);                       // basculantes azuis
    if(/azulejos/.test(nome)) peca(-meioLarg * .4, .05, .5, 3.0, .1, 2.0, 0x2a5aa8);
    if(/4 pavimentos/.test(nome)) for(let n = 1; n < 4; n++) peca(0, .6, n * 3.2, 2 * meioLarg * .8, 1.2, .15, 0xe0e0e0);                         // sacadas
    if(/Casa do Turista/.test(nome)){ peca(meioLarg * .7, .05, .4, 3.2, .1, 2.4, 0x3a7a5a); for(let k = 0; k < 4; k++) peca(-meioLarg - 4 + k * 1.2, 6, 0, .12, .12, 8, 0xf4f4f4);       // mural e 4 mastros
      peca(-meioLarg - 9, 6, 0, 2.2, 2.2, .6, 0x3f7a35); peca(-meioLarg - 9, 6, .6, .8, .8, 2.6, 0xa0522d); peca(-meioLarg - 8.4, 6, .6, 1.2, .8, .7, 0xa0522d); peca(-meioLarg - 8.4, 6, 2.5, 1.2, .8, .7, 0xa0522d); }   // escultura do "C" (de Cambará)
    if(/Assembleia/.test(nome)){ peca(0, 1.5, 0, 4.5, 3, alt + 4, 0xe6d6b8); peca(0, 3.05, 2, 3.2, .1, 4, 0x2a3a4a); for(const l of [-1, 1]) peca(l * meioLarg * .85, .5, 0, 1, 1, alt, 0xd8cfb8); }   // torre frontal com janelão escuro e colunas
    /* ---- 3ª leva ---- */
    if(/Rádio/.test(nome)){ peca(meioLarg * .5, -meioFundo, 0, .3, .3, 22, 0xc0392b); for(let k = 1; k < 5; k++) peca(meioLarg * .5, -meioFundo, k * 4.4, .9, .1, .3, 0xe8e8e8); }        // mastro da rádio
    if(/hospital/.test(nome)){ peca(0, .1, alt - 1.2, 1.4, .1, .4, 0xc0392b); peca(0, .1, alt - 1.7, .4, .1, 1.4, 0xc0392b); peca(0, 2.5, 0, 6, 5, .15, 0x8a8a8a); }   // cruz vermelha e acesso de ambulância
    if(/Bikers/.test(nome)) peca(0, .1, 2.8, 2 * meioLarg * .8, .12, .8, 0xf4f4f4);                                                                 // letreiro branco (nome real só com autorização)
    if(/cruz de madeira/.test(nome)){ peca(0, 2.2, 0, .25, .25, 3.2, 0x6a4a2c); peca(0, 2.2, 2.2, 1.4, .25, .25, 0x6a4a2c); }
    if(/Pousada|Hostel|Refúgio/.test(nome)) peca(0, 1.2, 0, 2 * meioLarg * .5, 2.4, .2, 0x8a6a44);                                               // deck de entrada
    /* ---- 4ª leva ---- */
    if(/madeireira/.test(nome)){ for(let k = 0; k < 6; k++) peca(-meioLarg * .8 + k * meioLarg * .32, 6, 0, 2.4, 8, 1.4 + (k % 3) * .4, 0x7a5a3a); }        // pilhas de toras no pátio
    if(/Escola/.test(nome)){ peca(meioLarg * .8, 4, 0, .12, .12, 7, 0xe8e8e8); peca(meioLarg * .8 + .45, 4, 6.2, .8, .05, .5, 0x1c8a3a); peca(0, 6, 0, 2 * meioLarg, .1, 1.6, 0x2a2a2a); }   // mastro e grade do pátio
    if(/Templo Missionário/.test(nome)){ peca(0, .1, alt - .4, .25, .1, 1.6, 0x6a4a2c); peca(0, .1, alt + .3, .9, .1, .25, 0x6a4a2c); }
    /* ---- casas da Rua Dona Úrsula (Refs 37–44) ---- */
    if(/térrea bege/.test(nome)) peca(0, 1.6, 0, 2 * meioLarg, .08, .8, 0x2a2a2a);                                                                 // grade baixa na frente
    if(/varanda de madeira/.test(nome)){ peca(0, .7, 3.3, 2 * meioLarg * .85, 1.4, .15, 0x6a4a2c); peca(0, 1.35, 3.45, 2 * meioLarg * .85, .08, .9, 0x6a4a2c); for(const l of [-1, 1]) peca(l * meioLarg * .4, 1.3, 0, .2, .2, 3.3, 0x6a4a2c); }   // varanda de madeira no andar de cima
    if(/branca de madeira/.test(nome)) peca(0, .8, 0, 1.6, 1.6, .25, 0xf4f4f0);                                                                // varandinha da porta
    if(/tijolo inacabado/.test(nome)){ peca(0, 1.6, 0, 2 * meioLarg + 1, .06, 2.2, 0x8a8f94); for(const a of [-meioLarg * .6, 0, meioLarg * .6]) peca(a, .5, 0, .12, .12, alt + 1.2, 0x9a7a4a); for(const h of [2.4, 4.8]) peca(0, .5, h, 2 * meioLarg, .1, .12, 0x9a7a4a); }   // tapume de chapa e andaime de madeira
    if(/rosa-avermelhada/.test(nome)){ peca(0, .05, alt, 2 * meioLarg * .6, .1, 1.3, 0xf4f4f0); for(const l of [-1, 1]) peca(l * meioLarg * .4, -meioFundo * .3, alt + .6, .7, .1, .7, 0xdedede); peca(meioLarg + .6, 1.0, 0, .5, .5, 1.4, 0xa8583a); }   // frontão de lambri branco, 2 parabólicas, pilar de tijolo com medidor
    if(/portão branco/.test(nome)) peca(meioLarg * .5, 1.6, 0, 2.6, .1, 1.7, 0xf4f4f0);                                                       // portão branco de duas folhas
    if(/707/.test(nome)){ peca(-meioLarg * .6, .05, 0, 2.2, .1, 3.2, 0xc8c4bc); peca(0, .6, 3.4, 2.6, 1.2, .12, 0x4a3524); peca(0, 1.2, 3.5, 2.6, .05, 1.0, 0xa8d0e0); peca(0, .05, alt + .2, 2 * meioLarg * .7, .12, .25, 0x4a3524); }   // pedra filetada, sacadinha de vidro e tesoura de madeira
    if(/tábuas brancas/.test(nome)) peca(meioLarg * .6, 1.6, 0, 2.2, .8, .45, 0xa07a4a);                                                     // pilha de tábuas no chão
    if(/Casa histórica do Sr/.test(nome)){ peca(meioLarg * .5, -meioFundo * .5, alt, .9, .9, 3.0, 0x8a4a34); peca(0, 1.5, 0, 2 * meioLarg + 2, .25, .9, 0xf4f4f0); }   // chaminé e muro                                                                          // toldo/marquise sobre a vitrine
    /* colisor: caixa alinhada aos eixos que cobre o bloco girado (um pouco menor para não travar nas quinas) */
    const c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw)), hx = (W * c + D * sn) / 2 * .86, hz = (W * sn + D * c) / 2 * .86;
    if(!oco && !aberto) colisores.push({ x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, peca: "predio:" + nome });
  }

  /* ---------- Morro das Antenas: 2 torres (uma de concreto listrada vermelho e branco, outra treliçada) — marco visual a leste ---------- */
  for(const [mx, my, Hm, listrada] of [[712, -52, 42, true], [726, -44, 36, false]]){ const [tx, tz] = mundo(mx, my), y0 = Y(tx, tz) - .3;
    if(listrada){ for(let k = 0; k < 8; k++){ const h = Hm / 8, g = new BoxGeometry(2 * U, h * U, 2 * U); g.translate(tx, y0 + (k + .5) * h * U, tz); add(k % 2 ? 0xf4f4f4 : 0xc0392b, g); } }
    else { for(const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]){ const g = new BoxGeometry(.25 * U, Hm * U, .25 * U); g.translate(tx + dx * .9 * U, y0 + Hm * U / 2, tz + dz * .9 * U); add(0xb8bcc2, g); } for(let k = 1; k < 10; k++){ const g = new BoxGeometry(2 * U, .15 * U, 2 * U); g.translate(tx, y0 + k * Hm / 10 * U, tz); add(0xb8bcc2, g); } }
    colisores.push({ x0: tx - 1.2 * U, x1: tx + 1.2 * U, z0: tz - 1.2 * U, z1: tz + 1.2 * U, peca: "antena" }); }

  /* ---------- torre da Igreja Matriz São José (−24, +51,5) ---------- */
  { const [tx, tz] = mundo(-24, 51.5), ex = eixo(-24, 51.5, 3.9 * Math.PI / 180), le = Math.hypot(ex[0], ex[1]), yaw = Math.atan2(-ex[1], ex[0]), y0 = Y(tx, tz) - .3, L = 6 * le, H = 25 * U;
    e.set(0, yaw, 0); q.setFromEuler(e);
    const tor = new BoxGeometry(1, 1, 1); tor.applyMatrix4(m4.compose(v.set(tx, y0 + H / 2, tz), q, s.set(L, H, L))); add(COR.igreja[0], tor, "torre");
    const pt = new ConeGeometry(Math.SQRT1_2, 1, 4); pt.rotateY(Math.PI / 4); pt.applyMatrix4(m4.compose(v.set(tx, y0 + H + 3 * U, tz), q, s.set(L * 1.1, 6 * U, L * 1.1))); add(COR.igreja[1], pt);
    const cz1 = new BoxGeometry(.25 * U, 2.2 * U, .25 * U); cz1.translate(tx, y0 + H + 7.1 * U, tz); add(0x3a3a3a, cz1);
    const cz2 = new BoxGeometry(1.2 * U, .25 * U, .25 * U); cz2.translate(tx, y0 + H + 7.5 * U, tz); add(0x3a3a3a, cz2);
    colisores.push({ x0: tx - L * .5, x1: tx + L * .5, z0: tz - L * .5, z1: tz + L * .5, peca: "torre da igreja" });
  }

  /* ---------- Rua Coberta: 10 arcos-favo (hexágonos) na frente da praça, da esquina da Quinze de Março (x −56) à da Laurindo (x −2), y ≈ +6 (faixa entre a avenida e o gramado) ---------- */
  { const N = 10, xa = -56, xb = -2, yr = 10.5, R = 5.2 * U, tubo = .32 * U, giro = Math.PI / 6 + .17;   // ~10° de giro sobre o próprio plano
    const a0 = mundo(xa, yr), a1 = mundo(xb, yr), dx = a1[0] - a0[0], dz = a1[1] - a0[1], yaw = Math.atan2(dx, dz);
    for(let k = 0; k < N; k++){ const t = k / (N - 1), px = a0[0] + dx * t, pz = a0[1] + dz * t, py = Y(px, pz) + R * .72;   // centro baixo: a ponta de baixo do hexágono fica enterrada
      const g = new TorusGeometry(R, tubo, 4, 6); g.rotateZ(giro); g.rotateY(yaw); g.translate(px, py, pz); add(0xa82b22, g); }
    /* longarinas ligando os arcos pelo alto */
    const Lr = Math.hypot(dx, dz), nx = -dz / Lr, nz = dx / Lr;
    for(const lado of [-1, 1]){ const off = R * .55 * lado, my = Y((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2) + R * 1.55;
      const b = new BoxGeometry(.35 * U, .35 * U, Lr); b.rotateY(yaw); b.translate((a0[0] + a1[0]) / 2 + nx * off, my, (a0[1] + a1[1]) / 2 + nz * off); add(0xa82b22, b); }
  }

  /* ---------- malhas finais (uma por cor) ---------- */
  geos.forEach((lista, k) => { const [tex, cor] = k.split("|"), g = mergeGeometries(lista); lista.forEach(x => x.dispose()); const m = new Mesh(g, new MeshStandardMaterial({ color: +cor, roughness: .9, map: TEX[tex] || null })); m.castShadow = true; m.receiveShadow = true; G.add(m); });

  /* superfície caminhável da cidade: piso dos interiores, rampa da porta e um pouco acima do chão nas ruas/calçadas (os pés não afundam) */
  const bb = u.bb, M0 = 60;
  const superficie = (x, z) => {
    if(x < bb[0] - M0 || x > bb[1] + M0 || z < bb[2] - M0 || z > bb[3] + M0) return null;
    for(const p of pisos){ const dx = x - p.O[0], dz = z - p.O[2], a = (dx * p.av[0] + dz * p.av[1]) / p.aa, b = (dx * p.bv[0] + dz * p.bv[1]) / p.bb;
      if(Math.abs(a) <= p.L && b <= 0 && b >= -p.F) return p.y;
      if(Math.abs(a) <= 1.6 && b > 0 && b <= 3){ const t = Y(x, z); return Math.max(t + .3, p.y + (t - p.y) * (b / 3)); } }
    return Y(x, z) + .3; };
  const EX = cen.extraChao; if(EX && EX.superficies) EX.superficies.push(superficie);
  /* colisores entram no cenário enquanto o centro existir */
  colisores.forEach(k => cen.colisores.push(k));
  G.userData.descartar = () => { colisores.forEach(k => { const i = cen.colisores.indexOf(k); if(i >= 0) cen.colisores.splice(i, 1); }); if(EX && EX.superficies){ const i = EX.superficies.indexOf(superficie); if(i >= 0) EX.superficies.splice(i, 1); } };
  return G;
}
