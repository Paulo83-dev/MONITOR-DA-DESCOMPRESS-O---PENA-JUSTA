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
  variante?: string;
  /** Parede em que o móvel está encostado (some quando a câmera passa dessa parede). */
  parede?: Parede;
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

const compacta: Layout = {
  rotulo: "Compacta",
  largura: 6,
  profundidade: 4,
  area: 24,
  origem: "Próxima da sala de cerca de 22 m² do CDP de Vila Independência (SP).",
  tapete: { x: 1.62, z: -1.03, w: 2.55, d: 1.9 },
  instancias: [
    { item: "tv", x: -1.5, z: -1.78, area: "descanso", parede: "N" },
    { item: "wifi", x: -0.85, z: -1.74, area: "descanso", parede: "N" },
    { item: "sofa", x: -1.4, z: 0.35, area: "descanso" },
    { item: "poltrona", x: -2.55, z: -0.75, olhar: [-1.5, -1.9], area: "descanso" },
    { item: "poltrona", x: -0.3, z: -0.75, olhar: [-1.5, -1.9], area: "descanso" },
    { item: "pufe", x: -0.98, z: 1.62, variante: "verde", area: "convivencia" },
    { item: "pufe", x: -0.32, z: 1.66, variante: "ocre", area: "convivencia" },
    { item: "jogos", x: 0.55, z: 1.15, area: "convivencia" },
    { item: "esteira", x: 1.05, z: -1.05, area: "exercicio" },
    { item: "bike", x: 2.25, z: -1.25, area: "exercicio" },
    { item: "massagem", x: -2.02, z: 1.22, olhar: [0.2, 0.9], area: "leitura" },
    { item: "estante", x: -2.83, z: 1.35, rot: PI2, area: "leitura", parede: "W" },
    { item: "luminaria", x: -2.72, z: 0.6, area: "leitura" },
    { item: "plantas", x: -0.28, z: -1.72, variante: "arália", area: "leitura" },
    { item: "plantas", x: -2.75, z: -1.75, variante: "zamioculca", area: "leitura" },
    { item: "plantas", x: -1.4, z: 1.93, variante: "jardim", area: "leitura", parede: "S" },
    { item: "armarios", x: 2.78, z: 0.85, rot: -PI2, area: "apoio", parede: "E" },
    { item: "bebedouro", x: 2.8, z: -0.1, rot: -PI2, area: "apoio", parede: "E" },
    { item: "ar", x: 0.55, z: 1.86, parede: "S" },
    { item: "porta", x: 2.45, z: 1.97, parede: "S" },
    ...paineis(6, 4),
  ],
};

const padrao: Layout = {
  rotulo: "Padrão",
  largura: 8,
  profundidade: 5,
  area: 40,
  origem: "Referência do Monitor: o plano não fixa tamanho. Cabe uma sala de cada tipo de ambiente com folga.",
  tapete: { x: 2.45, z: -1.6, w: 3.1, d: 1.8 },
  instancias: [
    // Parede norte: televisão, plantas e armários.
    { item: "tv", x: -2.4, z: -2.28, area: "descanso", parede: "N" },
    { item: "wifi", x: -1.75, z: -2.24, area: "descanso", parede: "N" },
    { item: "plantas", x: -3.65, z: -2.1, variante: "zamioculca", area: "leitura" },
    { item: "plantas", x: -0.8, z: -2.1, variante: "arália", area: "leitura" },
    { item: "armarios", x: 0.15, z: -2.29, area: "apoio", parede: "N" },
    // Descanso.
    { item: "sofa", x: -2.4, z: 0.0, area: "descanso" },
    { item: "poltrona", x: -3.45, z: -1.05, olhar: [-2.4, -2.4], area: "descanso" },
    { item: "poltrona", x: -1.35, z: -1.05, olhar: [-2.4, -2.4], area: "descanso" },
    // Exercício, no canto nordeste.
    { item: "esteira", x: 1.45, z: -1.6, area: "exercicio" },
    { item: "esteira", x: 2.4, z: -1.6, area: "exercicio" },
    { item: "bike", x: 3.15, z: -1.75, area: "exercicio" },
    { item: "bike", x: 3.7, z: -1.75, area: "exercicio" },
    // Convivência, no centro.
    { item: "jogos", x: -0.3, z: 0.5, area: "convivencia" },
    { item: "pufe", x: 0.95, z: 0.95, variante: "verde", area: "convivencia" },
    { item: "pufe", x: 1.65, z: 1.5, variante: "ocre", area: "convivencia" },
    // Leitura, no canto sudoeste.
    { item: "estante", x: -3.84, z: 1.6, rot: PI2, area: "leitura", parede: "W" },
    { item: "luminaria", x: -3.6, z: 0.3, area: "leitura" },
    { item: "massagem", x: -2.7, z: 1.6, olhar: [-0.5, 1.6], area: "leitura" },
    { item: "plantas", x: -1.5, z: 2.43, variante: "jardim", area: "leitura", parede: "S" },
    // Cochilo, junto à parede leste, com biombo separando do exercício.
    { item: "biombo", x: 3.2, z: -0.35, area: "cochilo" },
    { item: "poltrona", x: 3.35, z: 0.45, olhar: [0.5, 0.45], area: "cochilo" },
    { item: "poltrona", x: 3.35, z: 1.35, olhar: [0.5, 1.35], area: "cochilo" },
    // Apoio e entrada, na parede sul.
    { item: "bebedouro", x: 3.8, z: 2.15, rot: -PI2, area: "apoio", parede: "E" },
    { item: "copa", x: 1.1, z: 2.2, rot: Math.PI, area: "apoio", parede: "S" },
    { item: "ar", x: -0.3, z: 2.36, parede: "S" },
    { item: "porta", x: -3.0, z: 2.47, parede: "S" },
    ...paineis(8, 5),
  ],
};

const ampliada: Layout = {
  rotulo: "Ampliada",
  largura: 10,
  profundidade: 6,
  area: 60,
  origem: "Referência do Monitor: espaço para mais gente e para um canto de cochilo separado.",
  tapete: { x: 2.95, z: -1.95, w: 4.15, d: 2.1 },
  instancias: [
    // Parede norte: plantas, televisão e armários.
    { item: "plantas", x: -4.55, z: -2.5, variante: "zamioculca", area: "leitura" },
    { item: "tv", x: -3.2, z: -2.78, area: "descanso", parede: "N" },
    { item: "wifi", x: -2.55, z: -2.74, area: "descanso", parede: "N" },
    { item: "plantas", x: -1.3, z: -2.55, variante: "arália", area: "leitura" },
    { item: "armarios", x: 0.2, z: -2.79, area: "apoio", parede: "N" },
    // Descanso.
    { item: "sofa", x: -3.2, z: -0.7, area: "descanso" },
    { item: "poltrona", x: -4.5, z: -1.75, olhar: [-3.2, -2.9], area: "descanso" },
    { item: "poltrona", x: -1.9, z: -1.75, olhar: [-3.2, -2.9], area: "descanso" },
    // Exercício, no canto nordeste.
    { item: "esteira", x: 1.4, z: -2.15, area: "exercicio" },
    { item: "esteira", x: 2.35, z: -2.15, area: "exercicio" },
    { item: "esteira", x: 3.3, z: -2.15, area: "exercicio" },
    { item: "bike", x: 4.1, z: -2.4, area: "exercicio" },
    { item: "bike", x: 4.7, z: -2.4, area: "exercicio" },
    // Convivência, no centro.
    { item: "jogos", x: -0.6, z: 0.9, area: "convivencia" },
    { item: "jogos", x: 1.3, z: 0.9, area: "convivencia" },
    { item: "pufe", x: 0.3, z: 2.0, variante: "verde", area: "convivencia" },
    { item: "pufe", x: 1.0, z: 1.95, variante: "ocre", area: "convivencia" },
    // Leitura, no canto sudoeste.
    { item: "estante", x: -4.84, z: 2.0, rot: PI2, area: "leitura", parede: "W" },
    { item: "luminaria", x: -4.5, z: 0.7, area: "leitura" },
    { item: "massagem", x: -3.7, z: 2.0, olhar: [-1.5, 2.0], area: "leitura" },
    { item: "plantas", x: -2.2, z: 2.93, variante: "jardim", area: "leitura", parede: "S" },
    // Cochilo, junto à parede leste, com biombo separando do exercício.
    { item: "biombo", x: 3.9, z: -0.45, area: "cochilo" },
    { item: "poltrona", x: 4.3, z: 0.4, olhar: [1.5, 0.4], area: "cochilo" },
    { item: "poltrona", x: 4.3, z: 1.3, olhar: [1.5, 1.3], area: "cochilo" },
    { item: "poltrona", x: 4.3, z: 2.2, olhar: [1.5, 2.2], area: "cochilo" },
    // Apoio e entrada, na parede sul.
    { item: "bebedouro", x: 2.9, z: 2.8, rot: Math.PI, area: "apoio", parede: "S" },
    { item: "copa", x: 1.7, z: 2.7, rot: Math.PI, area: "apoio", parede: "S" },
    { item: "ar", x: -0.2, z: 2.86, parede: "S" },
    { item: "porta", x: -4.0, z: 2.97, parede: "S" },
    ...paineis(10, 6),
  ],
};

export const LAYOUTS: Record<Tamanho, Layout> = { compacta, padrao, ampliada };
export const TAMANHOS: Tamanho[] = ["compacta", "padrao", "ampliada"];
