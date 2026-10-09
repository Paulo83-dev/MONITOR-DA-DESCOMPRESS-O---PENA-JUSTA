import { FONTES, type Fonte } from "./fontes";

/** Data em que os dados deste arquivo foram conferidos pela última vez. */
export const ATUALIZADO_EM = "2026-10-09";

/** Referência nacional: indicador 2.5.1.1.1.1 do Pena Justa. */
export const INDICADOR = {
  codigo: "2.5.1.1.1.1",
  descricao: "Percentual de estabelecimentos prisionais com espaço de descompressão",
  metas: [
    { ano: 1, periodo: "2025", valor: 10 },
    { ano: 2, periodo: "2026", valor: 20 },
    { ano: 3, periodo: "2027", valor: 40 },
  ],
  apuradoAno1: 11.8,
  fonteMeta: FONTES.planoNacional,
  fonteApurado: FONTES.informe2,
} as const;

export type Situacao = "documentado" | "informado" | "em_implantacao" | "sem_informacao";

export const SITUACOES: Record<Situacao, { rotulo: string; descricao: string }> = {
  documentado: {
    rotulo: "Enviou documentos ao CNJ",
    descricao: "A UF informou ter espaços de descompressão e enviou documentos ao CNJ para o II Informe.",
  },
  informado: {
    rotulo: "Informou ter, sem documentos",
    descricao: "A UF informou ter espaços de descompressão, mas não enviou documentos que comprovem.",
  },
  em_implantacao: {
    rotulo: "Em implantação (notícia)",
    descricao: "Há notícia pública de contratação ou obra de salas, ainda sem confirmação do CNJ.",
  },
  sem_informacao: {
    rotulo: "Sem informação",
    descricao: "A UF não aparece entre as oito que informaram ter espaços de descompressão no II Informe.",
  },
};

export type Regiao = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";

export type UF = {
  sigla: string;
  nome: string;
  regiao: Regiao;
  situacao: Situacao;
  resumo: string;
  numeros?: { rotulo: string; valor: string }[];
  fontes: Fonte[];
};

const SEM_INFO =
  "Não consta entre as oito UFs que informaram ter espaços de descompressão no II Informe (Ano 1). Isso pode significar que não há ou que a informação não foi enviada ao CNJ.";
const INFORMOU =
  "Informou ao CNJ que tem espaços de descompressão nos estabelecimentos prisionais, mas não enviou documentos que comprovem.";

function semInfo(sigla: string, nome: string, regiao: Regiao): UF {
  return { sigla, nome, regiao, situacao: "sem_informacao", resumo: SEM_INFO, fontes: [FONTES.informe2] };
}
function informou(sigla: string, nome: string, regiao: Regiao, extra?: Partial<UF>): UF {
  return {
    sigla, nome, regiao,
    situacao: "informado",
    resumo: INFORMOU,
    fontes: [FONTES.informe2],
    ...extra,
  };
}

export const UFS: UF[] = [
  semInfo("RR", "Roraima", "Norte"),
  semInfo("AP", "Amapá", "Norte"),
  informou("AM", "Amazonas", "Norte"),
  semInfo("PA", "Pará", "Norte"),
  semInfo("MA", "Maranhão", "Nordeste"),
  semInfo("PI", "Piauí", "Nordeste"),
  {
    sigla: "CE", nome: "Ceará", regiao: "Nordeste",
    situacao: "documentado",
    resumo:
      "Informou ter espaços de descompressão e enviou documentos. Segundo o II Informe, a documentação do Ceará evidencia, de alguma forma, a existência desses espaços. O Ceará consta entre as UFs que contribuíram para o indicador nacional.",
    fontes: [FONTES.informe2],
  },
  {
    sigla: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste",
    situacao: "em_implantacao",
    resumo:
      "Não está entre as UFs que informaram ter espaços no Ano 1. Em setembro de 2026 foram publicados seis contratos para equipar 15 salas de descompressão em unidades prisionais estaduais, para descanso dos policiais penais nos intervalos dos plantões.",
    numeros: [
      { rotulo: "Salas previstas", valor: "15" },
      { rotulo: "Valor dos seis contratos", valor: "R$ 175.844,55" },
      { rotulo: "Licitação", valor: "Pregão Eletrônico nº 90027/2026" },
    ],
    fontes: [FONTES.agoraRN, FONTES.informe2],
  },
  informou("AC", "Acre", "Norte", {
    resumo:
      INFORMOU +
      " O governo do Acre divulgou salas de descompressão, inclusive no presídio feminino de Rio Branco, e afirma ter salas em 50% dos presídios. Esses dados são do próprio estado e não foram conferidos no texto original.",
    numeros: [{ rotulo: "Presídios com sala (dado do estado)", valor: "50%" }],
    fontes: [FONTES.informe2, FONTES.acDivisaoServidor, FONTES.acSalaRioBranco],
  }),
  semInfo("RO", "Rondônia", "Norte"),
  semInfo("MT", "Mato Grosso", "Centro-Oeste"),
  semInfo("TO", "Tocantins", "Norte"),
  semInfo("BA", "Bahia", "Nordeste"),
  semInfo("PE", "Pernambuco", "Nordeste"),
  semInfo("PB", "Paraíba", "Nordeste"),
  semInfo("MS", "Mato Grosso do Sul", "Centro-Oeste"),
  semInfo("GO", "Goiás", "Centro-Oeste"),
  informou("DF", "Distrito Federal", "Centro-Oeste"),
  semInfo("AL", "Alagoas", "Nordeste"),
  informou("SE", "Sergipe", "Nordeste"),
  informou("PR", "Paraná", "Sul"),
  {
    sigla: "SP", nome: "São Paulo", regiao: "Sudeste",
    situacao: "documentado",
    resumo:
      "Enviou documentos, e o II Informe diz que a documentação de São Paulo evidencia, de alguma forma, a existência dos espaços. No plano estadual, o estado afirma que 55,19% dos estabelecimentos já têm espaço de descompressão para os servidores. Em agosto de 2025, o CDP de Vila Independência inaugurou uma sala de cerca de 22 m².",
    numeros: [
      { rotulo: "Estabelecimentos com espaço (plano estadual)", valor: "55,19%" },
      { rotulo: "Meta mínima do plano estadual", valor: "40%" },
    ],
    fontes: [FONTES.informe2, FONTES.matrizSP, FONTES.sapVila],
  },
  {
    sigla: "MG", nome: "Minas Gerais", regiao: "Sudeste",
    situacao: "documentado",
    resumo:
      "Informou ter espaços e enviou documentos. O II Informe é inconsistente sobre Minas Gerais: o texto diz que só as documentações do Ceará e de São Paulo evidenciam a existência dos espaços, mas a tabela final lista Ceará e Minas Gerais como UFs que contribuíram para o indicador.",
    fontes: [FONTES.informe2],
  },
  semInfo("ES", "Espírito Santo", "Sudeste"),
  semInfo("SC", "Santa Catarina", "Sul"),
  semInfo("RJ", "Rio de Janeiro", "Sudeste"),
  semInfo("RS", "Rio Grande do Sul", "Sul"),
];

export const UFS_ORDENADAS = [...UFS].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function contagemPorSituacao() {
  const c: Record<Situacao, number> = { documentado: 0, informado: 0, em_implantacao: 0, sem_informacao: 0 };
  for (const uf of UFS) c[uf.situacao]++;
  return c;
}
