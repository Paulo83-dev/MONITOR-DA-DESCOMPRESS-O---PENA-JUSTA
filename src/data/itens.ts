import { FONTES, type Fonte } from "./fontes";

export type AreaId = "descanso" | "cochilo" | "exercicio" | "convivencia" | "leitura" | "apoio";

export const AREAS: { id: AreaId; rotulo: string; descricao: string }[] = [
  { id: "descanso", rotulo: "Descanso e TV", descricao: "Sofá, poltronas e televisão para os intervalos do plantão." },
  { id: "cochilo", rotulo: "Cochilo", descricao: "Poltronas reclináveis em canto reservado, com luz baixa." },
  { id: "exercicio", rotulo: "Exercício", descricao: "Esteiras e bicicletas sobre piso emborrachado." },
  { id: "convivencia", rotulo: "Convivência", descricao: "Mesa de jogos e pufes para conversar." },
  { id: "leitura", rotulo: "Leitura e relaxamento", descricao: "Estante, cadeira de massagem, plantas e luz direcionada." },
  { id: "apoio", rotulo: "Apoio", descricao: "Armários, bebedouro e copa." },
];

export type ItemId =
  | "sofa" | "poltrona" | "tv" | "wifi" | "pufe" | "jogos" | "esteira" | "bike" | "massagem"
  | "estante" | "luminaria" | "plantas" | "armarios" | "bebedouro" | "copa" | "biombo"
  | "ar" | "porta" | "luz";

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
};

const RN = FONTES.agoraRN;
const UFAL = FONTES.ufal;
const LOTE_RN =
  "O Rio Grande do Norte comprou poltronas, esteiras e sofás num único contrato de R$ 112.706,10 (10 poltronas, 10 esteiras e 15 sofás), sem preço por item.";

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
  },
  {
    id: "bike", n: 8, nome: "Bicicleta de spinning", alturaMarcador: 1.35,
    funcao: "Exercício aeróbico em pouco espaço.",
    origens: ["RN"],
    referencias: [{ fonte: RN, trecho: "O RN comprou 15 bicicletas ergométricas tipo spinning por R$ 18.585 no total." }],
    custos: [{ rotulo: "Bicicleta de spinning", qtd: 1, unitario: 1239, fonte: RN, obs: "Valor calculado: R$ 18.585 divididos por 15 bicicletas." }],
  },
  {
    id: "massagem", n: 9, nome: "Cadeira de massagem", alturaMarcador: 1.7,
    funcao: "Relaxamento muscular em pausas curtas.",
    origens: ["AC"],
    referencias: [
      { fonte: FONTES.acSalaRioBranco, trecho: "A sala do presídio feminino de Rio Branco (AC) tem cadeira de massagem, comprada com recursos do Fundo Nacional de Segurança Pública." },
    ],
    custos: [{ rotulo: "Cadeira de massagem", qtd: 1 }],
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
  },
  {
    id: "luminaria", n: 11, nome: "Luminária de leitura", alturaMarcador: 1.85,
    funcao: "Luz quente e direcionada para o canto de leitura.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Recomenda iluminação geral somada a luz direcionada na área de leitura." }],
    custos: [{ rotulo: "Luminária de piso", qtd: 1 }],
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
  },
  {
    id: "armarios", n: 13, nome: "Armários individuais", alturaMarcador: 2.05,
    funcao: "Guarda de pertences durante a pausa.",
    origens: ["UFAL"],
    referencias: [{ fonte: UFAL, trecho: "Inclui armário na lista de mobiliário da sala." }],
    custos: [{ rotulo: "Conjunto de armários", qtd: 1 }],
  },
  {
    id: "bebedouro", n: 14, nome: "Bebedouro", alturaMarcador: 1.6,
    funcao: "Hidratação perto da área de exercício.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [{ fonte: UFAL, trecho: "Destaca a importância da hidratação e de oferecer água e lanches leves no espaço." }],
    custos: [{ rotulo: "Bebedouro", qtd: 1 }],
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
  },
  {
    id: "biombo", n: 16, nome: "Biombo divisor", alturaMarcador: 1.9,
    funcao: "Separa o canto de cochilo do resto da sala para dar privacidade.",
    origens: ["Sugestão"],
    sugestao: true,
    referencias: [{ fonte: UFAL, trecho: "Os policiais ouvidos relataram falta de privacidade e barulho nos locais de descanso." }],
    custos: [{ rotulo: "Biombo", qtd: 1 }],
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
];

export const ITEM_POR_ID = Object.fromEntries(ITENS.map((i) => [i.id, i])) as Record<ItemId, Item>;
