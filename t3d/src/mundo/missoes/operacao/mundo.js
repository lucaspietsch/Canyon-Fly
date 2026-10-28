import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, TorusGeometry } from "three";
import { texPlacaHD, placaLegivel } from "../../../lib.js";
import { PORT } from "../../../portico.js";
import { U } from "../../config.js";
import { OPERACAO } from "../../../../../data/missoes/operacao.js";

/* ============================================================================================================
   COISAS FÍSICAS DAS MISSÕES DA OPERAÇÃO (tudo provisório e configurável em data/missoes/operacao.js):
   • posto da atividade no lançamento (onde fica "Realizar Atividade" / "Operar na Tirolesa" / "Iniciar Turno")
   • refeitório provisório no cercado do recebimento (missão 6) — local a confirmar com o dono do projeto
   • carro da carona + motorista NPC na praça de Cambará do Sul (missão 1)
   ============================================================================================================ */
const mate = (cor, o = {}) => new MeshStandardMaterial({ color: cor, roughness: .85, metalness: .05, ...o });

export function criarMundoOperacao(M){
  const { cen, H } = M, C = OPERACAO, S = { posto: null, refeitorio: null, carro: null, motorista: null };
  const y0 = (x, z) => cen.chao(x, z, 1e9);
  const placa = (txt, sub, w, h, cor = "#1c5a8a") => { const tex = texPlacaHD(512, Math.round(512 * h / w), (c, ww, hh) => { c.fillStyle = cor; c.fillRect(0, 0, ww, hh); c.strokeStyle = "#f4f4ea"; c.lineWidth = 6; c.strokeRect(8, 8, ww - 16, hh - 16); c.fillStyle = "#f4f4ea"; c.textAlign = "center"; c.font = "bold " + (sub ? 50 : 62) + "px Arial"; c.fillText(txt, ww / 2, sub ? hh * .5 : hh * .6); if(sub){ c.font = "bold 28px Arial"; c.fillText(sub, ww / 2, hh * .8); } }); return placaLegivel(tex, w, h, { verso: tex, cor: 0x2a2a2a }); };

  /* ---------- posto da atividade no lançamento ---------- */
  function posto(){
    if(S.posto) return S.posto; const p = C.posto, g = new Group(), y = y0(p.x, p.z); g.position.set(p.x, y, p.z); g.rotation.y = p.yaw;
    const ma = mate(0x3b3f45), pe = new Mesh(new BoxGeometry(1.6, 3.4, 1.2), ma); pe.position.y = 1.7; g.add(pe);
    const tela = new Mesh(new BoxGeometry(2.4, 1.5, .25), mate(0x15171a)); tela.position.set(0, 3.9, 0); tela.rotation.x = -.25; g.add(tela);
    const pl = placa("ATIVIDADE", "tirolesa · lançamento", 3.4, 1.3, "#7a3b10"); pl.position.set(0, 5.6, .1); g.add(pl);
    const luz = new Mesh(new CylinderGeometry(.18, .18, .2, 10), mate(0xff8a2a, { emissive: 0xff7a00, emissiveIntensity: .9 })); luz.position.set(0, 3.55, .55); g.add(luz);
    M.cena.add(g); S.posto = { g, p: { x: p.x, z: p.z } }; return S.posto;
  }

  /* ---------- refeitório provisório ---------- */
  function refeitorio(){
    if(S.refeitorio) return S.refeitorio; const p = C.refeitorio, g = new Group(), y = y0(p.x, p.z); g.position.set(p.x, y, p.z); g.rotation.y = p.yaw;
    const madeira = mate(0x6b4a2a), telha = mate(0x8a3b2a), piso = mate(0x9a8a6a);
    const L = 26, Wd = 15;
    const lage = new Mesh(new BoxGeometry(L, .4, Wd), piso); lage.position.y = .2; g.add(lage);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]){ const po = new Mesh(new BoxGeometry(.5, 6, .5), madeira); po.position.set(sx * (L / 2 - .5), 3.4, sz * (Wd / 2 - .5)); g.add(po); }
    const tel = new Mesh(new BoxGeometry(L + 2, .35, Wd + 2), telha); tel.position.y = 6.6; tel.rotation.z = .04; g.add(tel);
    const balcao = new Mesh(new BoxGeometry(L - 6, 2.4, 1.4), mate(0x8a6a44)); balcao.position.set(0, 1.4, -Wd / 2 + 1.6); g.add(balcao);
    for(let i = 0; i < 3; i++){ const mesa = new Mesh(new BoxGeometry(6, .3, 2.6), madeira); mesa.position.set(-8 + i * 8, 2.1, 2.5); g.add(mesa);
      for(const sz of [-1.9, 1.9]){ const b = new Mesh(new BoxGeometry(6, .25, .9), madeira); b.position.set(-8 + i * 8, 1.4, 2.5 + sz); g.add(b); } }
    const pl = placa("REFEITÓRIO", "provisório · local a definir", 8, 2.2, "#35522b"); pl.position.set(0, 5.4, -Wd / 2 + .4); g.add(pl);
    M.cena.add(g); cen.colisores.push({ x0: p.x - L * .5, x1: p.x + L * .5, z0: p.z - Wd * .5, z1: p.z + Wd * .5, y1: y + 8, peca: "refeitorio-provisorio" });
    S.refeitorio = { g, bal: { x: p.x + Math.sin(p.yaw) * 0, z: p.z - Wd * .5 + 4 } }; return S.refeitorio;
  }

  /* ---------- carro da carona + motorista ---------- */
  function carro(x, z, yaw){
    if(S.carro){ S.carro.position.set(x, y0(x, z), z); S.carro.rotation.y = yaw; S.carro.traverse(o => { if(o.isMesh && o.material && o.material.color && o.userData.cor === 1) o.material.color.set(M.dia1 && M.dia1.ativo() ? 0xf2f2ee : 0x2c5d8f); }); return S.carro; }
    const dia1 = !!(M.dia1 && M.dia1.ativo()), g = new Group(), azul = mate(dia1 ? 0xf2f2ee : 0x2c5d8f, { metalness: .4, roughness: .45 }), vidro = mate(0x9ccbe8, { roughness: .1, metalness: .6 }), pn = mate(0x16181b);
    const casco = new Mesh(new BoxGeometry(5.4, 1.5, 12), azul); casco.position.y = 2.3; g.add(casco);
    const cabine = new Mesh(new BoxGeometry(4.8, 1.5, 6), azul); cabine.position.set(0, 3.7, -.4); g.add(cabine);
    const jan = new Mesh(new BoxGeometry(4.9, .9, 5.4), vidro); jan.position.set(0, 3.8, -.4); g.add(jan);
    for(const sx of [-1, 1]) for(const sz of [-1, 1]){ const r = new Mesh(new CylinderGeometry(1.15, 1.15, .9, 14), pn); r.rotation.z = Math.PI / 2; r.position.set(sx * 2.7, 1.15, sz * 3.8); g.add(r); }
    for(const sx of [-1, 1]){ const f = new Mesh(new BoxGeometry(.9, .5, .15), mate(0xfff1c0, { emissive: 0xffe9a0, emissiveIntensity: .4 })); f.position.set(sx * 1.8, 2.6, 6.05); g.add(f); }
    casco.userData.cor = 1; cabine.userData.cor = 1; g.position.set(x, y0(x, z), z); g.rotation.y = yaw; M.cena.add(g); S.carro = g; return g;
  }
  function motorista(x, z, yaw){
    if(M.dia1 && M.dia1.ativo()){ const P = M.dia1.pit; P.fixa(x, z, yaw); S.motorista = P.rig(); return S.motorista; }
    if(S.motorista){ S.motorista.av.position.set(x, y0(x, z), z); S.motorista.av.rotation.y = yaw; return S.motorista; }
    const Mt = H.M, p = H.pessoa3d({ nome: "", x, y: y0(x, z), z, yaw, camisa: Mt(0x3a6a4a), manga: Mt(0x3a6a4a), calca: Mt(0x2d3140), pele: H.pele.parda, cabelo: 0x2b1d12, barba: true, pin: null });
    p.nome.visible = false; p.capG.visible = false; p.rotulo = "MOTORISTA"; S.motorista = p; p.av.visible = true; return p;
  }
  /* ponto da carona: vem de config (ou, enquanto a praça real não existe, de ao lado da praça provisória) */
  function pontoCarona(){
    const c = C.carona; if(c.fn) return c.fn(M);
    const d = M.viagem.todos().find(q => q.id === "cidade"); if(!d) return null;
    return { x: d.pos.x + c.dx * U, z: d.pos.z + c.dz * U, yaw: c.yaw };
  }
  function mostraCarona(on){ const p = pontoCarona(); if(!p) return null; if(!on){ if(S.carro) S.carro.visible = false; if(S.motorista) S.motorista.av.visible = false; return p; }
    const k = carro(p.x, p.z, p.yaw); k.visible = true; const dia1 = !!(M.dia1 && M.dia1.ativo()); const sx = Math.cos(p.yaw), sz = -Math.sin(p.yaw), mo = motorista(p.x + sx * 5.2, p.z + sz * 5.2, p.yaw + Math.PI / 2); mo.av.visible = true; return p; }

  return { posto, refeitorio, carro, motorista, pontoCarona, mostraCarona, S, placa };
}
