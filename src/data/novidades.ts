import { FONTES, type Fonte } from "./fontes";

export type Novidade = {
  /** AAAA-MM-DD, ou AAAA-MM quando o dia não é conhecido. */
  data: string;
  titulo: string;
  texto: string;
  uf?: string;
  fonte: Fonte;
};

/** Ordem cronológica crescente; a página exibe da mais recente para a mais antiga. */
export const NOVIDADES: Novidade[] = [
  {
    data: "2025-02",
    titulo: "Pena Justa é lançado com meta para as salas de descompressão",
    texto:
      "A matriz do plano nacional fixa o indicador 2.5.1.1.1.1: 10% dos estabelecimentos prisionais com espaço de descompressão no Ano 1, 20% no Ano 2 e 40% no Ano 3.",
    fonte: FONTES.planoNacional,
  },
  {
    data: "2025-09-01",
    titulo: "CDP de Vila Independência (SP) inaugura sala de descompressão",
    texto:
      "Inaugurada em agosto de 2025, a sala ocupa cerca de 22 m² e tem sala de TV, computador, área de recreação física, leitura e relaxamento.",
    uf: "SP",
    fonte: FONTES.sapVila,
  },
  {
    data: "2026-08",
    titulo: "II Informe ao STF mede o Ano 1: 11,8% dos estabelecimentos",
    texto:
      "Oito UFs informaram ter espaços de descompressão, mas só Ceará, Minas Gerais e São Paulo enviaram documentos. O indicador do Ano 1 (10%) foi considerado implementado.",
    fonte: FONTES.informe2,
  },
  {
    data: "2026-09-08",
    titulo: "Rio Grande do Norte contrata equipamentos para 15 salas",
    texto:
      "Seis contratos, somando R$ 175.844,55, equipam salas para os policiais penais descansarem nos intervalos dos plantões. A entrega é em até 30 dias após a assinatura.",
    uf: "RN",
    fonte: FONTES.agoraRN,
  },
];
