import { FONTES, type Fonte } from "./fontes";

export type AreaId = "descanso" | "cochilo" | "exercicio" | "convivencia" | "leitura" | "apoio";

export const AREAS: { id: AreaId; rotulo: string; descricao: string }[] = [
  { id: "descanso", rotulo: "Descanso e TV", descricao: "Sofá e televisão para os intervalos do plantão; conforme o tamanho, também rede ou cadeira de massagem." },
  { id: "cochilo", rotulo: "Cochilo", descricao: "Sofá-cama e poltronas reclináveis em canto reservado, atrás do biombo." },
  { id: "exercicio", rotulo: "Exercício", descricao: "Bicicleta e, na sala maior, esteira, sobre piso emborrachado." },
  { id: "convivencia", rotulo: "Convivência", descricao: "Pufe com recarga de celular e, na sala maior, mesa de jogos." },
  { id: "leitura", rotulo: "Leitura e relaxamento", descricao: "Estante, poltrona, cadeira de massagem, rede, plantas e luz direcionada." },
  { id: "apoio", rotulo: "Apoio", descricao: "Armários, bebedouro e copa." },
];

export type ItemId =
  | "sofa" | "poltrona" | "tv" | "wifi" | "pufe" | "jogos" | "esteira" | "bike" | "massagem"
  | "estante" | "luminaria" | "plantas" | "armarios" | "bebedouro" | "copa" | "biombo"
  | "ar" | "porta" | "luz" | "sofacama" | "rede" | "recarga";

/** Uma linha de custo de um item: o que se compra, quantas unidades e o preço de referência, se houver. */
export type LinhaCusto = {
  rotulo: string;
  qtd: number;
  /** Preço unitário em reais. Ausente quando nenhuma fonte informa o preço do item. */
  unitario?: number;
  fonte?: Fonte;
  obs?: string;
};

export type Referencia = { fonte: Fonte; trecho: string };

/**
 * Faixa livre em volta de um móvel, usada pelo validador de layout.
 * - `fixo`: ninguém passa e nenhum móvel entra (encosto reclinado, quem está sentado à mesa).
 * - `leve`: nenhum móvel entra, mas a passagem pode cruzar (frente da estante, do armário).
 * - `seg`: recuo de segurança (esteira); a passagem pode cruzar, nenhum móvel nem área de uso entra.
 * - `acesso`: só indica por onde se chega ao móvel.
 */
export type Zona = {
  tipo: "fixo" | "leve" | "seg" | "acesso";
  /** `anel` envolve o móvel inteiro. */
  lado: "frente" | "tras" | "lados" | "anel";
  /** Profundidade da faixa, em metros. */
  medida: number;
  /** Largura da faixa; o padrão é a largura do móvel. */
  largura?: number;
  /** Distância entre o móvel e o começo da faixa. */
  afastamento?: number;
  /** Só no `anel`: quanto a faixa avança além das pontas (eixo da largura). */
  medidaPontas?: number;
};

export type Dimensoes = {
  /** Largura (eixo x do modelo) e profundidade (eixo da frente), em metros. */
  largura: number;
  profundidade: number;
  /** `fuso`: estreito nas pontas, como o pano de uma rede. */
  forma?: "retangulo" | "fuso";
  zonas: Zona[];
  /** Folga do lado de uso, quando o móvel é usado por um lado só (bicicleta). */
  ladoDeUso?: number;
  /** `modelo`: medida do modelo 3D, estimada; `fabricante`: folga indicada em manual de fabricante. */
  origem: "modelo" | "fabricante";
  nota?: string;
};

export type Item = {
  id: ItemId;
  n: number;
  nome: string;
  funcao: string;
  /** Etiquetas de origem exibidas ao lado do nome. */
  origens: string[];
  referencias: Referencia[];
  custos: LinhaCusto[];
  /** Item que não aparece em nenhuma fonte e foi incluído pelo Monitor como sugestão. */
  sugestao?: boolean;
  /** Altura (m) do marcador numérico na cena 3D. */
  alturaMarcador: number;
  /** Ocupação no piso e folgas de uso. Ausente nos itens de parede, forro ou em cima de outro móvel. */
  dimensoes?: Dimensoes;
};

const RN = FONTES.agoraRN;
const UFAL = FONTES.ufal;
const LOTE_RN =
  "O Rio Grande do Norte comprou poltronas, esteiras e sofás num único contrato de R$ 112.706,10 (10 poltronas, 10 esteiras e 15 sofás), sem preço por item.";
const FRENTE_090: Zona[] = [{ tipo: "leve", lado: "frente", medida: 0.9 }];
const ACESSO_LATERAL: Zona = { tipo: "acesso", lado: "lados", medida: 0.3 };

export const ITENS: Item[] = [
  {
    id: "sofa", n: 1, nome: "Sofá de 3 lugares", alturaMarcador: 1.05,
    funcao: "Descanso sentado e convivência nos intervalos do plantão.",
    origens: ["RN", "UFAL"],
    referencias: [
      { fonte: RN, trecho: "O RN contratou 15 sofás de 3 lugares." },
      { fonte: UFAL, trecho: "Recomenda couro, corino ou corvin no sofá, por serem impermeáveis e fáceis de limpar." },
    ],
    custos: [{ rotulo: "Sofá de 3 lugares", qtd: 1, fonte: RN, obs: LOTE_RN }],
    dimensoes: { largura: 1.9, profundidade: 0.88, zonas: [ACESSO_LATERAL], origem: "modelo", nota: "A frente fica livre pela visada da TV." },
  },
  {
    id: "poltrona", n: 2, nome: "Poltrona reclinável", alturaMarcador: 1.35,
    funcao: "Repouso com as pernas elevadas depois de horas de trabalho em pé.",
    origens: ["RN", "UFAL"],
    referencias: [
      { fonte: RN, trecho: "O RN contratou 10 poltronas reclináveis." },
      { fonte: UFAL, trecho: "Inclui “cadeira de descanso” no mobiliário da sala." },
    ],
    custos: [{ rotulo: "Poltrona reclinável", qtd: 1, fonte: RN, obs: LOTE_RN }],
    dimensoes: {
      largura: 0.8, profundidade: 0.95,
      zonas: [{ tipo: "leve", lado: "frente", medida: 0.6 }, { tipo: "fixo", lado: "tras", medida: 0.3 }, ACESSO_LATERAL],
      origem: "modelo", nota: "À frente, o apoio de pés aberto; atrás, o encosto reclinado.",
    },
  },
  {
    id: "tv", n: 3, nome: "Smart TV de 43\" com rack e painel ripado", alturaMarcador: 1.75,
    funcao: "Lazer e desligamento da rotina da unidade. O painel ripado deixa o canto mais aconchegante.",
    origens: ["RN", "SP", "UFAL"],
    referencias: [
      { fonte: RN, trecho: "O RN comprou 15 smart TVs de 43 polegadas por cerca de R$ 19,2 mil no total." },
      { fonte: FONTES.sapVila, trecho: "A sala do CDP de Vila Independência (SP) tem sala de TV." },
      { fonte: UFAL, trecho: "Lista TV e rack no mobiliário e sugere painel ripado na parede da área de TV." },
    ],
    custos: [
      { rotulo: "Smart TV de 43\"", qtd: 1, unitario: 1280, fonte: RN, obs: "Valor calculado: cerca de R$ 19,2 mil divididos por 15 TVs." },
      { rotulo: "Rack e painel ripado", qtd: 1 },
    ],
    dimensoes: { largura: 1.8, profundidade: 0.42, zonas: [], origem: "modelo", nota: "A visada até o assento em frente fica livre." },
  },
  {
    id: "wifi", n: 4, nome: "Roteador Wi-Fi", alturaMarcador: 0.78,
    funcao: "Internet para falar com a família e se distrair durante a pausa.",
    origens: ["RN"],
    referencias: [{ fonte: RN, trecho: "O RN comprou 15 roteadores Wi-Fi TP-Link EX521, a R$ 265 cada." }],
    custos: [{ rotulo: "Roteador Wi-Fi", qtd: 1, unitario: 265, fonte: RN }],
  },
  {
    id: "pufe", n: 5, nome: "Pufe", alturaMarcador: 0.7,
    funcao: "Assento informal que muda a postura e o clima do ambiente.",
    origens: ["RN", "UFAL"],
    referencias: [
      { fonte: RN, trecho: "O RN comprou 15 pufes gigantes por R$ 12.361,05 no total." },
      { fonte: UFAL, trecho: "Inclui pufes no mobiliário da sala." },
    ],
    custos: [{ rotulo: "Pufe gigante", qtd: 1, unitario: 824.07, fonte: RN, obs: "Valor calculado: R$ 12.361,05 divididos por 15 pufes." }],
    dimensoes: { largura: 0.72, profundidade: 0.72, zonas: [{ tipo: "leve", lado: "frente", medida: 0.3 }], origem: "modelo" },
  },
  {
    id: "jogos", n: 6, nome: "Mesa de jogos com 4 bancos", alturaMarcador: 1.05,
    funcao: "Jogos rápidos de tabuleiro ou cartas que aproximam a equipe.",
    origens: ["RN", "UFAL"],
    referencias: [
      { fonte: RN, trecho: "O RN comprou 60 bancos para mesas de jogos, a R$ 150,29 cada. A reportagem não cita o preço das mesas." },
      { fonte: UFAL, trecho: "Lista mesas de jogos no mobiliário e sugere parede verde pastel nessa área." },
    ],
    custos: [
      { rotulo: "Banco para mesa de jogos", qtd: 4, unitario: 150.29, fonte: RN },
      { rotulo: "Mesa de jogos", qtd: 1 },
    ],
    dimensoes: {
      largura: 1.58, profundidade: 1.58, zonas: [{ tipo: "fixo", lado: "anel", medida: 0.41 }],
      origem: "modelo", nota: "Mesa de 0,90 m com 0,75 m livres de cada lado para sentar e levantar.",
    },
  },
  {
    id: "esteira", n: 7, nome: "Esteira elétrica", alturaMarcador: 1.65,
    funcao: "Exercício leve para aliviar a tensão acumulada.",
    origens: ["RN", "SP"],
    referencias: [
      { fonte: RN, trecho: "O RN contratou 10 esteiras elétricas." },
      { fonte: FONTES.sapVila, trecho: "A sala do CDP de Vila Independência (SP) tem área de recreação física." },
    ],
    custos: [{ rotulo: "Esteira elétrica", qtd: 1, fonte: RN, obs: LOTE_RN }],
    dimensoes: {
      largura: 0.75, profundidade: 1.75,
      zonas: [{ tipo: "leve", lado: "frente", medida: 0.3 }, { tipo: "seg", lado: "lados", medida: 0.5 }, { tipo: "seg", lado: "tras", medida: 2 }],
      origem: "fabricante",
      nota: "Recuo de 2,0 m atrás e 0,5 m dos lados, conforme o manual da esteira Assault AirRunner (que cita normas ASTM e EN).",
    },
  },
  {
    id: "bike", n: 8, nome: "Bicicleta de spinning", alturaMarcador: 1.35,
    funcao: "Exercício aeróbico em pouco espaço.",
    origens: ["RN"],
    referencias: [{ fonte: RN, trecho: "O RN comprou 15 bicicletas ergométricas tipo spinning por R$ 18.585 no total." }],
    custos: [{ rotulo: "Bicicleta de spinning", qtd: 1, unitario: 1239, fonte: RN, obs: "Valor calculado: R$ 18.585 divididos por 15 bicicletas." }],
    dimensoes: {
      largura: 0.55, profundidade: 1.15, ladoDeUso: 0.6,
      zonas: [{ tipo: "leve", lado: "lados", medida: 0.15 }, { tipo: "leve", lado: "tras", medida: 0.3 }],
      origem: "modelo", nota: "0,60 m livres do lado de montar.",
    },
  },
  {
    id: "massagem", n: 9, nome: "Cadeira de massagem", alturaMarcador: 1.7,
    funcao: "Relaxamento muscular em pausas curtas.",
    origens: ["AC"],
    referencias: [
      { fonte: FONTES.acSalaRioBranco, trecho: "A sala do presídio feminino de Rio Branco (AC) tem cadeira de massagem, comprada com recursos do Fundo Nacional de Segurança Pública." },
    ],
    custos: [{ rotulo: "Cadeira de massagem", qtd: 1 }],
    dimensoes: {
      largura: 0.8, profundidade: 1.3,
      zonas: [{ tipo: "leve", lado: "frente", medida: 0.6 }, { tipo: "fixo", lado: "tras", medida: 0.3 }, ACESSO_LATERAL],
      origem: "modelo", nota: "À frente, o apoio de pernas reclinado; atrás, o encosto.",
    },
  },
  {
    id: "estante", n: 10, nome: "Estante de livros", alturaMarcador: 2.1,
    funcao: "Leitura silenciosa, longe da tela.",
    origens: ["SP", "UFAL"],
    referencias: [
      { fonte: FONTES.sapVila, trecho: "A sala do CDP de Vila Independência (SP) tem espaço para leitura e relaxamento." },
      { fonte: UFAL, trecho: "Propõe uma área de leitura na sala." },
    ],
    custos: [{ rotulo: "Estante com livros", qtd: 1 }],
    dimensoes: { largura: 1, profundidade: 0.32, zonas: FRENTE_090, origem: "modelo" },
  },
  {
    id: "luminaria", n: 11, nome: "Luminária de leitura", alturaMarcador: 1.85,
    funcao: "Luz quente e direcionada para o canto de leitura.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Recomenda iluminação geral somada a luz direcionada na área de leitura." }],
    custos: [{ rotulo: "Luminária de piso", qtd: 1 }],
    dimensoes: { largura: 0.4, profundidade: 0.4, zonas: [], origem: "modelo", nota: "Só a base; a cúpula fica acima de quem está sentado." },
  },
  {
    id: "plantas", n: 12, nome: "Plantas e jardim vertical", alturaMarcador: 2.3,
    funcao: "Contato com a natureza e um pouco mais de conforto acústico.",
    origens: ["UFAL", "AC"],
    referencias: [
      { fonte: UFAL, trecho: "Sugere plantas que toleram ar-condicionado (arália, zamioculca), ervas aromáticas como alecrim e design biofílico." },
      { fonte: FONTES.acSalaRioBranco, trecho: "A sala do presídio feminino de Rio Branco (AC) tem plantas." },
    ],
    custos: [{ rotulo: "Plantas e jardim vertical", qtd: 1 }],
    dimensoes: { largura: 0.45, profundidade: 0.45, zonas: [], origem: "modelo", nota: "Vaso. O jardim vertical fica na parede e não ocupa piso." },
  },
  {
    id: "armarios", n: 13, nome: "Armários individuais", alturaMarcador: 2.05,
    funcao: "Guarda de pertences durante a pausa.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Inclui armário na lista de mobiliário da sala." }],
    custos: [{ rotulo: "Conjunto de armários", qtd: 1 }],
    dimensoes: { largura: 1.2, profundidade: 0.42, zonas: FRENTE_090, origem: "modelo" },
  },
  {
    id: "bebedouro", n: 14, nome: "Bebedouro", alturaMarcador: 1.6,
    funcao: "Hidratação perto da área de exercício.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [{ fonte: UFAL, trecho: "Destaca a importância da hidratação e de oferecer água e lanches leves no espaço." }],
    custos: [{ rotulo: "Bebedouro", qtd: 1 }],
    dimensoes: { largura: 0.35, profundidade: 0.35, zonas: [{ tipo: "leve", lado: "frente", medida: 0.9, largura: 0.6 }], origem: "modelo" },
  },
  {
    id: "copa", n: 15, nome: "Copa com cafeteira e frigobar", alturaMarcador: 1.55,
    funcao: "Café, água e lanche leve sem sair do ambiente.",
    origens: ["AP", "Sugestão"],
    sugestao: true,
    referencias: [
      { fonte: FONTES.amapaExpofeira, trecho: "O espaço de descompressão do governo do Amapá na Expofeira 2026 tem copa, banheiros acessíveis e refeitório climatizado." },
      { fonte: UFAL, trecho: "Sugere lanches leves e saudáveis e muita água nesses espaços." },
    ],
    custos: [{ rotulo: "Bancada com cafeteira e frigobar", qtd: 1 }],
    dimensoes: { largura: 1.9, profundidade: 0.64, zonas: FRENTE_090, origem: "modelo", nota: "Fica na parede com ponto de água." },
  },
  {
    id: "biombo", n: 16, nome: "Biombo divisor", alturaMarcador: 1.9,
    funcao: "Separa o canto de cochilo do resto da sala para dar privacidade.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [{ fonte: UFAL, trecho: "Os policiais ouvidos relataram falta de privacidade e barulho nos locais de descanso." }],
    custos: [{ rotulo: "Biombo", qtd: 1 }],
    dimensoes: { largura: 1.5, profundidade: 0.2, zonas: [], origem: "modelo" },
  },
  {
    id: "ar", n: 17, nome: "Ar-condicionado silencioso", alturaMarcador: 2.68,
    funcao: "Conforto térmico sem ruído nem umidade.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Recomenda ar-condicionado para o conforto térmico. Calor foi uma das queixas dos policiais penais ouvidos." }],
    custos: [{ rotulo: "Ar-condicionado split", qtd: 1 }],
  },
  {
    id: "porta", n: 18, nome: "Porta maciça com fechadura digital", alturaMarcador: 2.3,
    funcao: "Privacidade e acesso restrito à equipe.",
    origens: ["UFAL"],
    referencias: [
      { fonte: UFAL, trecho: "Propõe porta de madeira sólida com fechadura digital e um local isolado, longe dos presos." },
    ],
    custos: [{ rotulo: "Porta com fechadura digital", qtd: 1 }],
  },
  {
    id: "luz", n: 19, nome: "Iluminação geral e de relaxamento", alturaMarcador: 2.72,
    funcao: "Luz geral para o plantão e luz quente para relaxar. Compare com o botão Iluminação.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Recomenda iluminação geral e direcionada, quente e fria." }],
    custos: [{ rotulo: "Painel de LED no forro", qtd: 1 }],
  },
  {
    id: "sofacama", n: 20, nome: "Sofá-cama", alturaMarcador: 1.0,
    funcao: "Deitar de verdade numa pausa longa do plantão de 24 horas; fechado, vira sofá.",
    origens: ["EUA"],
    referencias: [
      { fonte: FONTES.lawOfficerHampton, trecho: "As salas de descanso da polícia de Hampton (EUA) têm poltronas reclináveis, futons (sofás-cama) e TV." },
    ],
    custos: [{ rotulo: "Sofá-cama", qtd: 1 }],
    dimensoes: {
      largura: 1.9, profundidade: 0.9,
      zonas: [{ tipo: "fixo", lado: "frente", medida: 0.5 }, { tipo: "leve", lado: "frente", medida: 0.6, afastamento: 0.5 }, ACESSO_LATERAL],
      origem: "modelo", nota: "Aberto, avança 0,50 m à frente (cama); depois, 0,60 m de acesso.",
    },
  },
  {
    id: "rede", n: 21, nome: "Rede de descanso", alturaMarcador: 1.25,
    funcao: "Balançar e cochilar numa rede presa em ganchos de parede, num canto da sala.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [
      { fonte: UFAL, trecho: "Na pesquisa da UFAL, 47,9% dos policiais penais ouvidos têm só 2 horas de descanso no plantão." },
    ],
    custos: [{ rotulo: "Rede com ganchos de parede", qtd: 1 }],
    dimensoes: {
      largura: 2.2, profundidade: 0.9, forma: "fuso",
      zonas: [{ tipo: "fixo", lado: "anel", medida: 0.45, medidaPontas: 0.35 }],
      origem: "modelo",
      nota: "Pano de 2,20 m; ganchos a 2,7–3,0 m um do outro, em parede de alvenaria; 0,45 m de balanço de cada lado.",
    },
  },
  {
    id: "recarga", n: 22, nome: "Estação de recarga de celular", alturaMarcador: 0.95,
    funcao: "Carregar o celular durante a pausa, sentado ao lado.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [{ fonte: RN, trecho: "O RN comprou 15 roteadores Wi-Fi para as salas de descompressão." }],
    custos: [{ rotulo: "Mesa lateral com tomadas USB", qtd: 1 }],
    dimensoes: { largura: 0.45, profundidade: 0.45, zonas: [], origem: "modelo" },
  },
];

export const ITEM_POR_ID = Object.fromEntries(ITENS.map((i) => [i.id, i])) as Record<ItemId, Item>;
