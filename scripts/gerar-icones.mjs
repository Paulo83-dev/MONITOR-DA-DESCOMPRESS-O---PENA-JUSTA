// Gera os ícones do site: o símbolo de pausa (o intervalo no plantão) em branco sobre o verde-azulado do site.
//
//   npm run gerar:icones
//
// Cria: src/app/icon.svg, src/app/apple-icon.png (180×180) e src/app/favicon.ico (16, 32 e 48 px).
// O Next.js lê esses arquivos e acrescenta sozinho as tags de ícone no <head>.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const FUNDO = "#28666B"; // mesmo verde-azulado do site (--accent)
const BRANCO = "#FFFFFF";

/**
 * Quadrado de 512 unidades com duas barras de pausa.
 * `raio` arredonda os cantos (0 = quadrado cheio, usado no ícone do iPhone, que o sistema arredonda).
 * `barra` e `altura` ajustam a espessura e a altura das barras: em tamanho pequeno elas ficam mais grossas.
 */
function icone({ raio = 0.22, barra = 84, altura = 260, vao = 52 } = {}) {
  const x1 = 256 - vao / 2 - barra;
  const x2 = 256 + vao / 2;
  const y = (512 - altura) / 2;
  const r = Math.round(barra * 0.4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" rx="${Math.round(512 * raio)}" fill="${FUNDO}"/>
<rect x="${x1}" y="${y}" width="${barra}" height="${altura}" rx="${r}" fill="${BRANCO}"/>
<rect x="${x2}" y="${y}" width="${barra}" height="${altura}" rx="${r}" fill="${BRANCO}"/>
</svg>
`;
}

const png = (conteudo, px) => sharp(Buffer.from(conteudo), { density: 384 }).resize(px, px).png({ compressionLevel: 9 }).toBuffer();

// ---------- icon.svg (navegadores modernos) ----------
writeFileSync(new URL("../src/app/icon.svg", import.meta.url), icone());

// ---------- apple-icon.png (tela inicial do iPhone: quadrado cheio, o iOS arredonda sozinho) ----------
writeFileSync(new URL("../src/app/apple-icon.png", import.meta.url), await png(icone({ raio: 0, barra: 92, altura: 280 }), 180));

// ---------- favicon.ico (16, 32 e 48 px, cada um em PNG) ----------
const tamanhos = [
  { px: 16, conteudo: icone({ raio: 0.2, barra: 100, altura: 300, vao: 56 }) },
  { px: 32, conteudo: icone({ raio: 0.2, barra: 92, altura: 280, vao: 54 }) },
  { px: 48, conteudo: icone({ raio: 0.22, barra: 88, altura: 270 }) },
];
const imagens = await Promise.all(tamanhos.map(async (t) => ({ px: t.px, dados: await png(t.conteudo, t.px) })));
const cabecalho = Buffer.alloc(6);
cabecalho.writeUInt16LE(0, 0); // reservado
cabecalho.writeUInt16LE(1, 2); // tipo: ícone
cabecalho.writeUInt16LE(imagens.length, 4);
let deslocamento = 6 + 16 * imagens.length;
const entradas = imagens.map((im) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(im.px, 0); // largura
  e.writeUInt8(im.px, 1); // altura
  e.writeUInt8(0, 2); // cores
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por pixel
  e.writeUInt32LE(im.dados.length, 8);
  e.writeUInt32LE(deslocamento, 12);
  deslocamento += im.dados.length;
  return e;
});
writeFileSync(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([cabecalho, ...entradas, ...imagens.map((i) => i.dados)]));

console.log("Ícones gerados: src/app/icon.svg, src/app/apple-icon.png (180×180) e src/app/favicon.ico (16, 32 e 48 px).");
