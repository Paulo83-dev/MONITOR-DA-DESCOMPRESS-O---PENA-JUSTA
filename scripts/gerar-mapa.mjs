// Gera src/data/mapa-uf.ts a partir das malhas geográficas do IBGE (limites das Unidades da Federação).
//
//   npm run gerar:mapa
//
// O resultado é salvo no repositório: o site não depende do IBGE para desenhar o mapa.
// Fonte dos dados: IBGE, Malhas geográficas (https://servicodados.ibge.gov.br/api/docs/malhas?versao=3).
import { writeFileSync } from "node:fs";

const URL_IBGE =
  "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&qualidade=minima&formato=application/vnd.geo+json";

const SIGLA_POR_CODIGO = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN",
  25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC",
  43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

const LARGURA = 1000; // largura do desenho, em unidades do SVG
const MARGEM = 8;
const MARGEM_DIREITA = 48; // espaço para as siglas fora do contorno, no oceano
const TOLERANCIA = 0.3; // simplificação das linhas, em unidades do SVG
const ILHA_MINIMA = 3; // ilhas com menos área que isto (unidades²) são descartadas
const CASAS = 1;

const resposta = await fetch(URL_IBGE);
if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
const geo = await resposta.json();
if (geo.features?.length !== 27) throw new Error(`Esperava 27 estados, vieram ${geo.features?.length}`);

// ---------- projeção ----------
// Equiretangular com a longitude comprimida pelo cosseno da latitude média do país: simples e fiel o bastante.
const LAT_MEDIA = -15;
const FATOR_X = Math.cos((LAT_MEDIA * Math.PI) / 180);
const anéis = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).flat(); // lista de anéis [lon, lat][]

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const f of geo.features) {
  for (const anel of anéis(f.geometry)) {
    for (const [lon, lat] of anel) {
      const x = lon * FATOR_X, y = -lat;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const escala = (LARGURA - 2 * MARGEM) / (maxX - minX);
const ALTURA = Math.round((maxY - minY) * escala + 2 * MARGEM);
const projetar = ([lon, lat]) => [(lon * FATOR_X - minX) * escala + MARGEM, (-lat - minY) * escala + MARGEM];

// ---------- geometria ----------
function areaAssinada(anel) {
  let a = 0;
  for (let i = 0; i < anel.length; i++) {
    const [x1, y1] = anel[i], [x2, y2] = anel[(i + 1) % anel.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function distSegmento(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function dentro(px, py, anel) {
  let d = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

function simplificar(pontos, tol) {
  if (pontos.length < 4) return pontos;
  const marcar = new Uint8Array(pontos.length);
  marcar[0] = marcar[pontos.length - 1] = 1;
  const pilha = [[0, pontos.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop();
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distSegmento(pontos[i][0], pontos[i][1], pontos[a], pontos[b]);
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) {
      marcar[idx] = 1;
      pilha.push([a, idx], [idx, b]);
    }
  }
  return pontos.filter((_, i) => marcar[i]);
}

/** Ponto do anel mais distante das bordas (onde cabe o rótulo) e a folga em volta dele. */
function pontoDeRotulo(anel) {
  const xs = anel.map((p) => p[0]), ys = anel.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const passo = Math.max(0.5, Math.min(x1 - x0, y1 - y0) / 40);
  let melhor = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: 0 };
  for (let x = x0; x <= x1; x += passo) {
    for (let y = y0; y <= y1; y += passo) {
      if (!dentro(x, y, anel)) continue;
      let r = Infinity;
      for (let i = 0; i < anel.length; i++) r = Math.min(r, distSegmento(x, y, anel[i], anel[(i + 1) % anel.length]));
      if (r > melhor.r) melhor = { x, y, r };
    }
  }
  return melhor;
}

const n = (v) => Number(v.toFixed(CASAS)).toString();

// ---------- montagem ----------
const estados = {};
let totalPontos = 0;
for (const f of geo.features) {
  const sigla = SIGLA_POR_CODIGO[Number(f.properties.codarea)];
  if (!sigla) throw new Error(`Código de estado desconhecido: ${f.properties.codarea}`);
  const projetados = anéis(f.geometry).map((anel) => anel.map(projetar));
  const principal = projetados.reduce((a, b) => (Math.abs(areaAssinada(b)) > Math.abs(areaAssinada(a)) ? b : a));
  const partes = projetados
    .filter((anel) => anel === principal || Math.abs(areaAssinada(anel)) >= ILHA_MINIMA)
    .map((anel) => simplificar(anel, TOLERANCIA))
    .filter((anel) => anel.length >= 3);
  totalPontos += partes.reduce((s, a) => s + a.length, 0);
  const d = partes.map((anel) => `M${anel.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`).join("");
  const rotulo = pontoDeRotulo(principal);
  estados[sigla] = {
    d,
    x: rotulo.x,
    y: rotulo.y,
    folga: rotulo.r,
    xMax: Math.max(...principal.map((p) => p[0])),
  };
}

// ---------- rótulos ----------
// Estados grandes levam a sigla dentro. Os pequenos ganham a sigla fora do contorno, numa coluna no oceano,
// ligada ao estado por uma linha.
const FOLGA_MINIMA = 22; // folga mínima (unidades do SVG) para a sigla caber dentro
const ESPACO_ENTRE_ROTULOS = 32;
const GRUPOS_FORA = [["RN", "PB", "PE", "AL", "SE"], ["ES", "RJ"]];
const DF_DESLOCAMENTO = [6, -46];

for (const sigla of Object.keys(estados)) estados[sigla].dentro = estados[sigla].folga >= FOLGA_MINIMA;

for (const grupo of GRUPOS_FORA) {
  const membros = grupo.filter((sg) => !estados[sg].dentro).sort((x, y) => estados[x].y - estados[y].y);
  if (!membros.length) continue;
  const coluna = Math.max(...membros.map((sg) => estados[sg].xMax)) + 12;
  let anterior = -Infinity;
  for (const sg of membros) {
    const y = Math.max(estados[sg].y, anterior + ESPACO_ENTRE_ROTULOS);
    estados[sg].fora = { x: coluna, y };
    anterior = y;
  }
}
if (!estados.DF.dentro) estados.DF.fora = { x: estados.DF.x + DF_DESLOCAMENTO[0], y: estados.DF.y + DF_DESLOCAMENTO[1] };

const ordem = Object.keys(estados).sort();
const corpo = ordem
  .map((sg) => {
    const e = estados[sg];
    const fora = e.fora ? `, fora: { x: ${n(e.fora.x)}, y: ${n(e.fora.y)} }` : "";
    return `  ${sg}: { d: ${JSON.stringify(e.d)}, x: ${n(e.x)}, y: ${n(e.y)}, dentro: ${e.dentro}${fora} },`;
  })
  .join("\n");

const arquivo = `// ARQUIVO GERADO por scripts/gerar-mapa.mjs. Não edite à mão: rode \`npm run gerar:mapa\`.
// Fonte: IBGE, malhas geográficas das Unidades da Federação (qualidade mínima), redesenhadas em SVG.

export const MAPA_LARGURA = ${LARGURA + MARGEM_DIREITA};
export const MAPA_ALTURA = ${ALTURA};

export type FormaUF = {
  /** Contorno em SVG. */
  d: string;
  /** Ponto do estado onde cabe a sigla (ou de onde parte a linha, quando a sigla fica fora). */
  x: number;
  y: number;
  /** A sigla cabe dentro do estado. */
  dentro: boolean;
  /** Posição da sigla fora do contorno, para estados pequenos. */
  fora?: { x: number; y: number };
};

export const MAPA_UF: Record<string, FormaUF> = {
${corpo}
};
`;
writeFileSync(new URL("../src/data/mapa-uf.ts", import.meta.url), arquivo);

console.log(`Mapa gerado: ${ordem.length} estados, ${totalPontos} pontos, ${(arquivo.length / 1024).toFixed(1)} KB, desenho ${LARGURA + MARGEM_DIREITA}×${ALTURA}.`);
console.log("Sigla dentro:", ordem.filter((sg) => estados[sg].dentro).join(" "));
console.log("Sigla fora:  ", ordem.filter((sg) => !estados[sg].dentro).join(" "));
