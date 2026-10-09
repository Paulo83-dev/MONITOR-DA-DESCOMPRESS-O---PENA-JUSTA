import type { AreaId, ItemId } from "./itens";

export type Tamanho = "compacta" | "padrao" | "ampliada";
export type Parede = "N" | "S" | "W" | "E";

/**
 * Posição de um móvel na sala. O centro da sala é (0, 0); x cresce para leste
 * e z para o sul. A parede N (z negativo) é a da televisão.
 */
export type Instancia = {
  item: ItemId;
  x: number;
  z: number;
  /** Rotação em torno do eixo vertical, em radianos. */
  rot?: number;
  /** Faz o móvel olhar para o ponto (x, z). Tem prioridade sobre `rot`. */
  olhar?: [number, number];
  /** Área da sala a que o móvel pertence. Sem área, o móvel aparece sempre. */
  area?: AreaId;
  /** Cor ou tipo do móvel. Na rede, é o vão entre os ganchos em metros (padrão "3.0"). */
  variante?: string;
  /** Parede em que o móvel está encostado (some quando a câmera passa dessa parede). */
  parede?: Parede;
  /** Lado de uso, para quem olha para a frente do móvel (bicicleta usada por um lado só). */
  lado?: "esquerda" | "direita";
  /** Porta: lado da dobradiça. A porta abre para dentro da sala. */
  dobradica?: "leste" | "oeste";
};

export type Layout = {
  rotulo: string;
  largura: number;
  profundidade: number;
  /** Área em m². */
  area: number;
  origem: string;
  /** Tapete emborrachado da área de exercício. */
  tapete?: { x: number; z: number; w: number; d: number };
  instancias: Instancia[];
};

const PI2 = Math.PI / 2;
const PI4 = Math.PI / 4;

/** Painéis de LED do forro, em grade regular. */
function paineis(largura: number, profundidade: number): Instancia[] {
  const cols = Math.max(2, Math.round(largura / 3));
  const rows = Math.max(2, Math.round(profundidade / 2.6));
  const out: Instancia[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      out.push({ item: "luz", x: -largura / 2 + ((i + 0.5) * largura) / cols, z: -profundidade / 2 + ((j + 0.5) * profundidade) / rows });
    }
  }
  return out;
}

/*
 * Os três tamanhos seguem a mesma lógica de planta: porta no canto sudeste
 * (parede do corredor), armários e bebedouro junto da entrada, TV na parede
 * norte com a passagem por trás do sofá, ruído decrescente de leste (entrada,
 * exercício) para oeste (leitura e cochilo). `npm run validar` confere porta,
 * folgas e rota de 0,90 m para cada combinação de áreas.
 */

const compacta: Layout = {
  rotulo: "Compacta",
  largura: 6,
  profundidade: 4,
  area: 24,
  origem: "Próxima da sala de cerca de 22 m² do CDP de Vila Independência (SP), com o mesmo programa: TV, leitura e relaxamento, exercício.",
  tapete: { x: 2.05, z: -1.05, w: 1.5, d: 1.9 },
  instancias: [
    // Descanso e TV: sofá-cama de frente para a TV, recarga na ponta.
    { item: "tv", x: 0.1, z: -1.79, area: "descanso", parede: "N" },
    { item: "wifi", x: 0.75, z: -1.75, area: "descanso", parede: "N" },
    { item: "sofacama", x: 0.1, z: 0.64, area: "descanso" },
    { item: "recarga", x: 1.3, z: -0.02, area: "descanso" },
    // Leitura e relaxamento, a oeste, de frente para o jardim vertical.
    { item: "massagem", x: -2.5, z: -1.05, rot: Math.PI, area: "leitura" },
    { item: "poltrona", x: -1.63, z: -1.225, rot: Math.PI, area: "leitura" },
    { item: "luminaria", x: -1.03, z: -1.7, rot: -PI2, area: "leitura" },
    { item: "estante", x: -2.84, z: 0.75, rot: PI2, area: "leitura", parede: "W" },
    { item: "plantas", x: -2.7, z: 1.7, variante: "arália", area: "leitura" },
    { item: "plantas", x: -1.84, z: 1.97, variante: "jardim", area: "leitura", parede: "S" },
    // Exercício, a nordeste, virado para a parede.
    { item: "bike", x: 1.9, z: -1.175, area: "exercicio" },
    // Apoio, junto da entrada.
    { item: "armarios", x: 2.79, z: 0, rot: -PI2, area: "apoio", parede: "E" },
    { item: "bebedouro", x: 2.825, z: 0.95, rot: -PI2, area: "apoio", parede: "E" },
    { item: "ar", x: 2.9, z: -1.1, rot: PI2, parede: "E" },
    { item: "porta", x: 2.39, z: 1.97, parede: "S" },
    ...paineis(6, 4),
  ],
};

const padrao: Layout = {
  rotulo: "Padrão",
  largura: 8,
  profundidade: 5,
  area: 40,
  origem: "Referência do Monitor: o plano não fixa tamanho. Cabe um canto de cochilo com sofá-cama, rede e uma bicicleta; a esteira não, com o recuo de segurança.",
  tapete: { x: 0.6, z: 1.75, w: 1.4, d: 1.5 },
  instancias: [
    // Cochilo, a noroeste, atrás do biombo.
    { item: "sofacama", x: -3, z: -2, rot: Math.PI, area: "cochilo", parede: "N" },
    { item: "biombo", x: -1.75, z: -1.5, rot: -PI2, area: "cochilo" },
    // Leitura e relaxamento, na parede oeste.
    { item: "poltrona", x: -3.225, z: 0, rot: -PI2, area: "leitura" },
    { item: "estante", x: -3.84, z: 0.95, rot: PI2, area: "leitura", parede: "W" },
    { item: "luminaria", x: -1.52, z: -0.5, rot: -PI2, area: "leitura" },
    { item: "massagem", x: -3.05, z: 2, rot: -PI2, area: "leitura" },
    { item: "plantas", x: -3.97, z: 1.94, rot: -PI2, variante: "jardim", area: "leitura", parede: "W" },
    { item: "plantas", x: 1.8, z: 2.22, variante: "arália", area: "leitura" },
    // Descanso e TV, com a rede no canto nordeste.
    { item: "tv", x: -0.35, z: -2.29, area: "descanso", parede: "N" },
    { item: "wifi", x: 0.3, z: -2.25, area: "descanso", parede: "N" },
    { item: "sofa", x: -0.35, z: -0.16, area: "descanso" },
    { item: "rede", x: 2.94, z: -1.44, rot: -PI4, area: "descanso" },
    // Convivência: pufe com recarga de celular.
    { item: "recarga", x: 1.1, z: -2.15, area: "convivencia" },
    { item: "pufe", x: 1.1, z: -1.5, rot: Math.PI, variante: "verde", area: "convivencia" },
    // Exercício, junto da parede sul.
    { item: "bike", x: 0.6, z: 1.775, rot: Math.PI, lado: "esquerda", area: "exercicio" },
    // Apoio: copa na parede do corredor, armários e bebedouro na entrada.
    { item: "copa", x: -0.85, z: 2.18, rot: Math.PI, area: "apoio", parede: "S" },
    { item: "armarios", x: 3.79, z: 0.5, rot: -PI2, area: "apoio", parede: "E" },
    { item: "bebedouro", x: 3.825, z: 1.4, rot: -PI2, area: "apoio", parede: "E" },
    { item: "ar", x: 3.9, z: 1.85, rot: PI2, parede: "E" },
    { item: "porta", x: 3.39, z: 2.47, parede: "S" },
    ...paineis(8, 5),
  ],
};

const ampliada: Layout = {
  rotulo: "Ampliada",
  largura: 10,
  profundidade: 6,
  area: 60,
  origem: "Referência do Monitor: o plano não fixa tamanho. Só aqui cabe a esteira com o recuo de segurança; o resto do espaço vai para cochilo, rede e convivência.",
  tapete: { x: 3.45, z: -1.93, w: 3.1, d: 2.15 },
  instancias: [
    // Cochilo, a noroeste: sofá-cama atrás do biombo e reclináveis na parede oeste.
    { item: "sofacama", x: -4, z: -2.5, rot: Math.PI, area: "cochilo", parede: "N" },
    { item: "biombo", x: -2.8, z: -2.05, rot: -PI2, area: "cochilo" },
    { item: "poltrona", x: -4.225, z: -0.45, rot: -PI2, area: "cochilo" },
    { item: "poltrona", x: -4.225, z: 0.45, rot: -PI2, area: "cochilo" },
    // Leitura e relaxamento: rede no canto sudoeste, estante e jardim vertical.
    { item: "rede", x: -4.05, z: 2.05, rot: -PI4, variante: "2.7", area: "leitura" },
    { item: "luminaria", x: -3, z: 1.3, rot: -PI2, area: "leitura" },
    { item: "estante", x: -2.35, z: 2.84, rot: Math.PI, area: "leitura", parede: "S" },
    { item: "plantas", x: -4.19, z: 2.97, variante: "jardim", area: "leitura", parede: "S" },
    // Descanso e TV, com a cadeira de massagem ao lado.
    { item: "tv", x: -0.9, z: -2.79, area: "descanso", parede: "N" },
    { item: "massagem", x: 0.45, z: -2.05, rot: Math.PI, area: "descanso" },
    { item: "wifi", x: -0.25, z: -2.75, area: "descanso", parede: "N" },
    { item: "sofa", x: -0.9, z: -0.76, area: "descanso" },
    // Convivência: pufe com recarga e mesa de jogos.
    { item: "recarga", x: 1.25, z: -2.75, area: "convivencia" },
    { item: "pufe", x: 1.25, z: -2.05, rot: Math.PI, variante: "ocre", area: "convivencia" },
    { item: "jogos", x: 1.27, z: 1.8, area: "convivencia" },
    // Exercício, a nordeste.
    { item: "esteira", x: 2.85, z: -1.825, area: "exercicio" },
    { item: "bike", x: 4.6, z: -2.125, lado: "esquerda", area: "exercicio" },
    // Apoio.
    { item: "copa", x: -0.88, z: 2.68, rot: Math.PI, area: "apoio", parede: "S" },
    { item: "armarios", x: 4.79, z: -0.2, rot: -PI2, area: "apoio", parede: "E" },
    { item: "bebedouro", x: 4.825, z: 0.7, rot: -PI2, area: "apoio", parede: "E" },
    { item: "ar", x: 4.9, z: 1.75, rot: PI2, parede: "E" },
    { item: "porta", x: 4.39, z: 2.97, parede: "S" },
    ...paineis(10, 6),
  ],
};

export const LAYOUTS: Record<Tamanho, Layout> = { compacta, padrao, ampliada };
export const TAMANHOS: Tamanho[] = ["compacta", "padrao", "ampliada"];
