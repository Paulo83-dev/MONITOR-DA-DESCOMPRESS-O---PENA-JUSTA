import { AREAS, ITEM_POR_ID, type AreaId, type ItemId, type Zona } from "@/data/itens";
import type { Instancia, Layout } from "@/data/layouts";

/**
 * Validador de layout da sala 3D, sem navegador. Confere o que faz a planta
 * funcionar como projeto de interiores, e não só se um objeto bate em outro:
 * móvel dentro da sala, corpos sem sobreposição, folgas de uso livres,
 * abertura e aproximação da porta, giro de 1,50 m junto à entrada, visada da
 * TV e rota livre de 0,90 m da porta até cada móvel ligado.
 *
 * Coordenadas como em `layouts.ts`: x para leste, z para o sul, ângulos como
 * `rotation.y` do three.js. A frente nativa dos móveis é -z, exceto nos que
 * encostam pelo fundo (+z), listados em FRENTE_POSITIVA.
 */

type Pt = [number, number];
type Poligono = Pt[];
type TipoZona = Zona["tipo"];

type Peca = {
  inst: Instancia;
  nome: string;
  corpo: Poligono;
  zonas: { tipo: TipoZona; pol: Poligono }[];
};

export type ResultadoValidacao = { problemas: string[]; avisos: string[] };

/** Rota acessível (NBR 9050; conferir na norma) e giro de cadeira de rodas. */
export const ROTA_MIN = 0.9;
export const GIRO = 1.5;
const TOL = 0.01;
const CELULA = 0.025;

const FRENTE_POSITIVA = new Set<ItemId>(["tv", "armarios", "estante", "bebedouro", "copa"]);
/** Itens sem rota própria: acessórios, decoração ou divisórias. */
const SEM_ROTA = new Set<ItemId>(["tv", "wifi", "luminaria", "plantas", "biombo", "recarga", "ar", "porta", "luz"]);
const ASSENTOS_TV = new Set<ItemId>(["sofa", "sofacama", "poltrona"]);
const FOLHA_PORTA = 0.88;
/** Acessórios que só fazem sentido com um item principal na mesma área. */
const DEPENDE: Partial<Record<ItemId, ItemId[]>> = {
  wifi: ["tv"],
  luminaria: ["poltrona", "massagem", "rede", "sofa", "sofacama"],
  recarga: ["pufe", "sofa", "sofacama", "poltrona"],
  biombo: ["poltrona", "sofacama"],
};

const f2 = (n: number) => n.toFixed(2).replace(".", ",");

function anguloDe(inst: Instancia) {
  if (inst.olhar) return Math.atan2(-(inst.olhar[0] - inst.x), -(inst.olhar[1] - inst.z));
  return inst.rot ?? 0;
}

/** Converte um ponto local (lx, lz) do móvel para a sala. */
function paraSala(cx: number, cz: number, t: number, lx: number, lz: number): Pt {
  const c = Math.cos(t), s = Math.sin(t);
  return [cx + lx * c + lz * s, cz - lx * s + lz * c];
}

function retangulo(cx: number, cz: number, t: number, x0: number, x1: number, z0: number, z1: number): Poligono {
  return [paraSala(cx, cz, t, x0, z0), paraSala(cx, cz, t, x1, z0), paraSala(cx, cz, t, x1, z1), paraSala(cx, cz, t, x0, z1)];
}

/** Fuso: largura máxima no meio, pontas finas (pano de rede). */
function fuso(cx: number, cz: number, t: number, semi: number, meio: number, n = 16): Poligono {
  const ida: Pt[] = [];
  const volta: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    const h = meio * Math.sqrt(Math.max(0, 1 - u * u));
    ida.push(paraSala(cx, cz, t, u * semi, -h));
    volta.unshift(paraSala(cx, cz, t, u * semi, h));
  }
  return [...ida, ...volta.slice(1, -1)];
}

function montarPeca(inst: Instancia): Peca | null {
  const it = ITEM_POR_ID[inst.item];
  const dim = it.dimensoes;
  if (!dim || (inst.item === "plantas" && inst.variante === "jardim")) return null;
  const t = anguloDe(inst) + (FRENTE_POSITIVA.has(inst.item) ? Math.PI : 0);
  const { largura: w, profundidade: d } = dim;
  const { x, z } = inst;
  const corpo = dim.forma === "fuso" ? fuso(x, z, t, w / 2, d / 2) : retangulo(x, z, t, -w / 2, w / 2, -d / 2, d / 2);
  const zonas: Peca["zonas"] = [];
  for (const zn of dim.zonas) {
    const off = zn.afastamento ?? 0;
    const larg = zn.largura ?? w;
    if (zn.lado === "frente") zonas.push({ tipo: zn.tipo, pol: retangulo(x, z, t, -larg / 2, larg / 2, -d / 2 - off - zn.medida, -d / 2 - off) });
    else if (zn.lado === "tras") zonas.push({ tipo: zn.tipo, pol: retangulo(x, z, t, -larg / 2, larg / 2, d / 2 + off, d / 2 + off + zn.medida) });
    else if (zn.lado === "anel") {
      const p = zn.medidaPontas ?? zn.medida;
      zonas.push({
        tipo: zn.tipo,
        pol: dim.forma === "fuso" ? fuso(x, z, t, w / 2 + p, d / 2 + zn.medida) : retangulo(x, z, t, -w / 2 - p, w / 2 + p, -d / 2 - zn.medida, d / 2 + zn.medida),
      });
    } else {
      // Lados: a esquerda de quem olha para a frente (-z) é -x.
      let esq = zn.medida, dir = zn.medida;
      if (dim.ladoDeUso && zn.tipo === "leve") {
        if (inst.lado === "esquerda") esq = dim.ladoDeUso;
        else if (inst.lado === "direita") dir = dim.ladoDeUso;
        else esq = dir = dim.ladoDeUso;
      }
      zonas.push({ tipo: zn.tipo, pol: retangulo(x, z, t, -w / 2 - esq, -w / 2, -d / 2, d / 2) });
      zonas.push({ tipo: zn.tipo, pol: retangulo(x, z, t, w / 2, w / 2 + dir, -d / 2, d / 2) });
    }
  }
  return { inst, nome: `${it.nome.toLowerCase()} (${f2(x)}; ${f2(z)})`, corpo, zonas };
}

/* ---------- geometria de polígonos convexos ---------- */

function projetar(p: Poligono, ax: number, az: number): [number, number] {
  let mn = Infinity, mx = -Infinity;
  for (const [x, z] of p) {
    const v = x * ax + z * az;
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  return [mn, mx];
}

/** Penetração mínima entre dois polígonos convexos (teste de eixo separador). Zero ou menos: não se tocam. */
function penetracao(a: Poligono, b: Poligono) {
  let menor = Infinity;
  for (const p of [a, b]) {
    for (let i = 0; i < p.length; i++) {
      const [x0, z0] = p[i];
      const [x1, z1] = p[(i + 1) % p.length];
      const nx = z1 - z0, nz = -(x1 - x0);
      const len = Math.hypot(nx, nz);
      if (len < 1e-9) continue;
      const [a0, a1] = projetar(a, nx / len, nz / len);
      const [b0, b1] = projetar(b, nx / len, nz / len);
      const o = Math.min(a1, b1) - Math.max(a0, b0);
      if (o <= 0) return 0;
      if (o < menor) menor = o;
    }
  }
  return menor;
}

const sobrepoe = (a: Poligono, b: Poligono) => penetracao(a, b) > TOL;

function contem(p: Poligono, x: number, z: number) {
  let sinal = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, z0] = p[i];
    const [x1, z1] = p[(i + 1) % p.length];
    const c = (x1 - x0) * (z - z0) - (z1 - z0) * (x - x0);
    if (Math.abs(c) < 1e-12) continue;
    const s = c > 0 ? 1 : -1;
    if (sinal === 0) sinal = s;
    else if (s !== sinal) return false;
  }
  return true;
}

/** Distância de um ponto a um polígono convexo (zero se estiver dentro). */
function distanciaPonto(p: Poligono, x: number, z: number) {
  if (contem(p, x, z)) return 0;
  let d = Infinity;
  for (let i = 0; i < p.length; i++) {
    const [x0, z0] = p[i];
    const [x1, z1] = p[(i + 1) % p.length];
    const dx = x1 - x0, dz = z1 - z0;
    const l2 = dx * dx + dz * dz;
    const t = l2 ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / l2)) : 0;
    d = Math.min(d, Math.hypot(x - x0 - t * dx, z - z0 - t * dz));
  }
  return d;
}

/** Transformada de distância euclidiana exata (Felzenszwalb e Huttenlocher), em células ao quadrado. */
function distancia2(alvo: Uint8Array, nx: number, nz: number) {
  const INF = 1e12;
  const g = new Float64Array(nx * nz);
  for (let i = 0; i < nx * nz; i++) g[i] = alvo[i] ? 0 : INF;
  const linha = (f: Float64Array, n: number) => {
    const d = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0;
    zz[0] = -INF;
    zz[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= zz[k]) {
        k--;
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      zz[k] = s;
      zz[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (zz[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    return d;
  };
  const col = new Float64Array(nz);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) col[j] = g[j * nx + i];
    const d = linha(col, nz);
    for (let j = 0; j < nz; j++) g[j * nx + i] = d[j];
  }
  const lin = new Float64Array(nx);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) lin[i] = g[j * nx + i];
    const d = linha(lin, nx);
    for (let i = 0; i < nx; i++) g[j * nx + i] = d[i];
  }
  return g;
}

/* ---------- validação ---------- */

export function validarLayout(layout: Layout, areas?: Iterable<AreaId>): ResultadoValidacao {
  const ativas = new Set<AreaId>(areas ?? AREAS.map((a) => a.id));
  const { largura: W, profundidade: D } = layout;
  const insts = layout.instancias.filter((i) => !i.area || ativas.has(i.area));
  const pecas = insts.map(montarPeca).filter((p): p is Peca => p !== null);
  const problemas: string[] = [];
  const avisos: string[] = [];

  // Sentido: acessório sem o item principal na mesma área.
  for (const i of insts) {
    const precisa = DEPENDE[i.item];
    if (precisa && !insts.some((o) => o.area === i.area && precisa.includes(o.item))) {
      problemas.push(`${ITEM_POR_ID[i.item].nome.toLowerCase()} fica sem sentido sem ${precisa.map((p) => ITEM_POR_ID[p].nome.toLowerCase()).join(" ou ")} na área ${i.area}`);
    }
  }

  // Porta: na parede sul, abrindo para dentro.
  const porta = insts.find((i) => i.item === "porta");
  const zonasPorta: { nome: string; pol: Poligono }[] = [];
  let centroEntrada: Pt = [0, D / 2 - 1];
  if (!porta) problemas.push("a sala não tem porta");
  else if (porta.parede !== "S") problemas.push("o validador só conhece porta na parede sul");
  else {
    const leste = (porta.dobradica ?? "leste") === "leste";
    const hx = porta.x + (leste ? FOLHA_PORTA / 2 : -FOLHA_PORTA / 2);
    const zp = D / 2;
    const arco: Poligono = [[hx, zp]];
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * (Math.PI / 2);
      arco.push([hx + (leste ? -1 : 1) * FOLHA_PORTA * Math.cos(a), zp - FOLHA_PORTA * Math.sin(a)]);
    }
    zonasPorta.push({ nome: "abertura da porta", pol: arco });
    const fx = porta.x + (leste ? -FOLHA_PORTA / 2 : FOLHA_PORTA / 2);
    const ax0 = leste ? fx - 0.6 : fx, ax1 = leste ? fx : fx + 0.6;
    zonasPorta.push({ nome: "aproximação da porta (lado da fechadura)", pol: [[ax0, zp - 1.2], [ax1, zp - 1.2], [ax1, zp], [ax0, zp]] });
    centroEntrada = [porta.x, zp - 0.75];
  }

  // Visada de cada TV até o assento em frente.
  const visadas: { pol: Poligono; tv: Peca; assento: Peca }[] = [];
  for (const tv of pecas.filter((p) => p.inst.item === "tv")) {
    const t = anguloDe(tv.inst) + Math.PI;
    const f: Pt = [-Math.sin(t), -Math.cos(t)];
    const dTv = ITEM_POR_ID.tv.dimensoes!.profundidade;
    let melhor: { p: Peca; dist: number } | null = null;
    for (const p of pecas) {
      if (!ASSENTOS_TV.has(p.inst.item)) continue;
      const ts = anguloDe(p.inst);
      const fs: Pt = [-Math.sin(ts), -Math.cos(ts)];
      const vx = p.inst.x - tv.inst.x, vz = p.inst.z - tv.inst.z;
      const ao = vx * f[0] + vz * f[1];
      const lateral = Math.abs(vx * f[1] - vz * f[0]);
      if (ao < 1 || ao > 4.5 || lateral > 0.6 || fs[0] * f[0] + fs[1] * f[1] > -0.8) continue;
      if (!melhor || ao < melhor.dist) melhor = { p, dist: ao };
    }
    if (!melhor) {
      avisos.push(`${tv.nome}: nenhum assento de frente para a TV`);
      continue;
    }
    const dS = ITEM_POR_ID[melhor.p.inst.item].dimensoes!.profundidade;
    const ate = melhor.dist - dS / 2 - dTv / 2;
    const bx = tv.inst.x + f[0] * (dTv / 2), bz = tv.inst.z + f[1] * (dTv / 2);
    const rx = f[1] * 0.9, rz = -f[0] * 0.9;
    visadas.push({
      tv,
      assento: melhor.p,
      pol: [[bx - rx, bz - rz], [bx + rx, bz + rz], [bx + rx + f[0] * ate, bz + rz + f[1] * ate], [bx - rx + f[0] * ate, bz - rz + f[1] * ate]],
    });
    const olhoTela = melhor.dist - dS / 2 + 0.35 + dTv / 2 - 0.08;
    if (olhoTela < 1.5 || olhoTela > 3) avisos.push(`distância da tela ao olho de ${f2(olhoTela)} m (para 43", o usual é de 1,5 a 3,0 m)`);
  }

  // Móvel fora da sala.
  for (const p of pecas) {
    const fora = Math.max(...p.corpo.map(([x, z]) => Math.max(-W / 2 - x, x - W / 2, -D / 2 - z, z - D / 2)));
    if (fora > TOL) problemas.push(`${p.nome} sai da sala em ${f2(fora)} m`);
  }

  // Corpos contra corpos, folgas alheias, porta e visada.
  for (let i = 0; i < pecas.length; i++) {
    const a = pecas[i];
    for (let j = i + 1; j < pecas.length; j++) {
      const b = pecas[j];
      if (sobrepoe(a.corpo, b.corpo)) problemas.push(`${a.nome} bate em ${b.nome}`);
    }
    for (const b of pecas) {
      if (a === b) continue;
      for (const zn of b.zonas) {
        if (zn.tipo !== "acesso" && sobrepoe(a.corpo, zn.pol)) problemas.push(`${a.nome} invade a folga (${zn.tipo}) de ${b.nome}`);
      }
    }
    for (const zp of zonasPorta) if (sobrepoe(a.corpo, zp.pol)) problemas.push(`${a.nome} invade a ${zp.nome}`);
    for (const v of visadas) {
      if (a !== v.tv && a !== v.assento && sobrepoe(a.corpo, v.pol)) problemas.push(`${a.nome} fica na frente da TV`);
    }
  }

  // Folgas entre si: área de uso fixa não divide espaço; recuo de segurança não recebe área de uso.
  type Z = { dono: Peca; tipo: TipoZona; pol: Poligono };
  const todas: Z[] = pecas.flatMap((p) => p.zonas.filter((z) => z.tipo !== "acesso").map((z) => ({ dono: p, tipo: z.tipo, pol: z.pol })));
  for (let i = 0; i < todas.length; i++) {
    for (let j = i + 1; j < todas.length; j++) {
      const a = todas[i], b = todas[j];
      if (a.dono === b.dono || !sobrepoe(a.pol, b.pol)) continue;
      const tipos = new Set([a.tipo, b.tipo]);
      if (tipos.has("fixo")) problemas.push(`folga (${a.tipo}) de ${a.dono.nome} cruza a folga (${b.tipo}) de ${b.dono.nome}`);
      else if (tipos.has("seg") && tipos.has("leve")) avisos.push(`recuo de segurança cruza a folga de uso: ${a.dono.nome} e ${b.dono.nome}`);
    }
    const z = todas[i];
    if (z.tipo === "fixo" && zonasPorta[0] && sobrepoe(z.pol, zonasPorta[0].pol)) problemas.push(`folga de ${z.dono.nome} invade a abertura da porta`);
    for (const v of visadas) {
      if (z.dono !== v.assento && z.dono !== v.tv && sobrepoe(z.pol, v.pol)) problemas.push(`folga de ${z.dono.nome} invade a visada da TV`);
    }
  }

  // Grade: células livres, rota de 0,90 m a partir da porta, giro junto à entrada.
  const nx = Math.round(W / CELULA), nz = Math.round(D / CELULA);
  const bloqueio = new Uint8Array(nx * nz);
  const corpoCel = new Uint8Array(nx * nz);
  const polBloqueio: Poligono[] = [];
  const polCorpo: Poligono[] = [];
  const xc = (i: number) => -W / 2 + (i + 0.5) * CELULA;
  const zc = (j: number) => -D / 2 + (j + 0.5) * CELULA;
  const pintar = (pol: Poligono, alvo: Uint8Array) => {
    const xs = pol.map((p) => p[0]), zs = pol.map((p) => p[1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) + W / 2) / CELULA)), i1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) + W / 2) / CELULA));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) + D / 2) / CELULA)), j1 = Math.min(nz - 1, Math.ceil((Math.max(...zs) + D / 2) / CELULA));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (contem(pol, xc(i), zc(j))) alvo[j * nx + i] = 1;
  };
  for (const p of pecas) {
    polCorpo.push(p.corpo);
    polBloqueio.push(p.corpo, ...p.zonas.filter((z) => z.tipo === "fixo").map((z) => z.pol));
  }
  polBloqueio.push(...visadas.map((v) => v.pol));
  polBloqueio.forEach((pol) => pintar(pol, bloqueio));
  polCorpo.forEach((pol) => pintar(pol, corpoCel));

  const paredeDist = (i: number, j: number) => Math.min(xc(i) + W / 2, W / 2 - xc(i), zc(j) + D / 2, D / 2 - zc(j));
  const dBloq = distancia2(bloqueio, nx, nz);
  /**
   * Espaço livre em volta do centro da célula. A grade erra até meia célula;
   * perto do limite pedido, o valor é recalculado com a geometria exata.
   */
  const folga = (k: number, i: number, j: number, d2: Float64Array, pols: Poligono[], limite: number) => {
    const aprox = Math.min(Math.sqrt(d2[k]) * CELULA - CELULA / 2, paredeDist(i, j));
    if (Math.abs(aprox - limite) > CELULA * 1.5) return aprox;
    let d = paredeDist(i, j);
    for (const pol of pols) d = Math.min(d, distanciaPonto(pol, xc(i), zc(j)));
    return d;
  };

  // Giro de 1,50 m: algum ponto a até 1,6 m da porta com 0,75 m livres de móveis em volta.
  if (porta) {
    const dCorpo = distancia2(corpoCel, nx, nz);
    let ok = false;
    for (let j = 0; j < nz && !ok; j++) {
      for (let i = 0; i < nx; i++) {
        if (Math.hypot(xc(i) - porta.x, zc(j) - D / 2) > 1.6) continue;
        if (folga(j * nx + i, i, j, dCorpo, polCorpo, GIRO / 2) >= GIRO / 2 - TOL) { ok = true; break; }
      }
    }
    if (!ok) problemas.push(`não cabe o giro de ${f2(GIRO)} m junto à porta`);
  }

  const raio = ROTA_MIN / 2 - TOL;
  const nucleo = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (!bloqueio[k] && folga(k, i, j, dBloq, polBloqueio, raio) >= raio) nucleo[k] = 1;
  }
  // Semente: célula de núcleo mais próxima da entrada.
  let semente = -1, melhorD = Infinity;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (!nucleo[k]) continue;
    const d = Math.hypot(xc(i) - centroEntrada[0], zc(j) - centroEntrada[1]);
    if (d < melhorD) { melhorD = d; semente = k; }
  }
  const alcancado = new Uint8Array(nx * nz);
  if (semente < 0 || melhorD > 0.6) problemas.push("não há rota de 0,90 m a partir da porta");
  else {
    const fila = [semente];
    alcancado[semente] = 1;
    while (fila.length) {
      const k = fila.pop()!;
      const i = k % nx, j = (k - i) / nx;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const kk = jj * nx + ii;
        if (nucleo[kk] && !alcancado[kk]) { alcancado[kk] = 1; fila.push(kk); }
      }
    }
  }
  // Onde a pessoa chega: até 0,45 m de um ponto do núcleo alcançado.
  const dAlc = distancia2(alcancado, nx, nz);
  const chega = (k: number) => !bloqueio[k] && Math.sqrt(dAlc[k]) * CELULA <= raio + CELULA;
  for (const p of pecas) {
    if (SEM_ROTA.has(p.inst.item)) continue;
    const usaFixo = p.inst.item === "jogos" || p.inst.item === "rede";
    const alvos = p.zonas.filter((z) => (usaFixo ? z.tipo === "fixo" : z.tipo !== "fixo")).map((z) => z.pol);
    let n = 0;
    const marca = new Uint8Array(nx * nz);
    for (const pol of alvos) pintar(pol, marca);
    // Zonas fixas (mesa, rede) estão bloqueadas: vale chegar na borda delas.
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (!marca[k]) continue;
      if (usaFixo) {
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di, jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && !marca[jj * nx + ii] && chega(jj * nx + ii)) { n++; break; }
        }
      } else if (chega(k)) n++;
    }
    // Chegar a pelo menos 0,40 m da borda de uma mesa ou rede, ou a 0,04 m² da frente do móvel.
    if (n < (usaFixo ? 0.4 / CELULA : 0.04 / CELULA ** 2)) problemas.push(`sem rota de ${f2(ROTA_MIN)} m até ${p.nome}`);
  }

  return { problemas: [...new Set(problemas)], avisos: [...new Set(avisos)] };
}
