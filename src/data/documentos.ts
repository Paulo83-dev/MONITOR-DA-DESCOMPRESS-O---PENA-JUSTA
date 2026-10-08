export type Documento = {
  id: string;
  titulo: string;
  orgao: string;
  data: string;
  descricao: string;
  /** Caminho do arquivo hospedado neste site, quando houver. */
  arquivo?: string;
  tamanhoMB?: number;
  /** Página ou arquivo de origem, onde a versão oficial pode ser conferida. */
  fonteUrl: string;
  nota?: string;
};

export const DOCUMENTOS: Documento[] = [
  {
    id: "plano-nacional",
    titulo: "Plano Nacional Pena Justa: texto e matriz de implementação",
    orgao: "CNJ",
    data: "Fevereiro de 2025",
    descricao:
      "O plano completo, com o diagnóstico, as medidas e a matriz de implementação. As salas de descompressão estão nas páginas 167 e 168 do texto (diagnóstico e ação) e na página 357 do PDF (matriz, indicador 2.5.1.1.1.1).",
    arquivo: "/documentos/pena-justa-plano-nacional-e-matriz.pdf",
    tamanhoMB: 9.8,
    fonteUrl: "https://www.cnj.jus.br/pena-justa-plano-nacional/",
  },
  {
    id: "informe-2",
    titulo: "II Informe de Monitoramento ao Supremo Tribunal Federal",
    orgao: "CNJ",
    data: "Agosto de 2026",
    descricao:
      "Avalia a execução do plano de janeiro a dezembro de 2025. A situação dos espaços de descompressão está nas páginas 100 e 101 do PDF e na tabela de indicadores da página 261.",
    arquivo: "/documentos/pena-justa-ii-informe-monitoramento-stf.pdf",
    tamanhoMB: 4.1,
    fonteUrl: "https://www.cnj.jus.br/pena-justa-ii-informe-stf/",
  },
  {
    id: "caderno-orientador",
    titulo: "Caderno Orientador para os planos estaduais e distrital",
    orgao: "CNJ",
    data: "Fevereiro de 2025",
    descricao: "Explica como cada estado deve montar a matriz de implementação do seu plano local.",
    arquivo: "/documentos/pena-justa-caderno-orientador-planos-estaduais.pdf",
    tamanhoMB: 3.7,
    fonteUrl: "https://www.cnj.jus.br/pena-justa-caderno-ufs/",
  },
  {
    id: "dez-coisas",
    titulo: "10 coisas que você precisa saber sobre o Pena Justa",
    orgao: "CNJ",
    data: "2025",
    descricao: "Folheto curto. Um dos itens trata da valorização dos servidores penais e cita os espaços de descompressão e de refeição.",
    arquivo: "/documentos/pena-justa-10-coisas-que-voce-precisa-saber.pdf",
    tamanhoMB: 4.3,
    fonteUrl: "https://www.cnj.jus.br/pena-justa-10-coisas",
  },
  {
    id: "reforma",
    titulo: "Pena Justa Reforma: caderno de orientações",
    orgao: "CNJ",
    data: "Outubro de 2025",
    descricao: "Orientações para os planos estaduais de manutenção e ajustes dos estabelecimentos prisionais.",
    arquivo: "/documentos/pena-justa-reforma-caderno-orientacoes.pdf",
    tamanhoMB: 4.3,
    fonteUrl: "https://www.cnj.jus.br/reforma-caderno-orientacoes/",
  },
  {
    id: "matriz-sp",
    titulo: "Matriz de implementação do Plano Estadual de São Paulo",
    orgao: "TJSP",
    data: "2025",
    descricao:
      "Exemplo de plano estadual. A meta de descompressão está no item 2.87 (página 145 do PDF), com a nota de que o estado já tem 55,19% dos estabelecimentos com espaço.",
    arquivo: "/documentos/matriz-implementacao-plano-estadual-sao-paulo.pdf",
    tamanhoMB: 2.6,
    fonteUrl: "https://www.tjsp.jus.br/Download/CanaisComunicacao/GMF/matriz-de-implementacao-do-plano-estadual.pdf",
  },
  {
    id: "arquitetura-penal",
    titulo: "Diretrizes Básicas para Arquitetura Penal",
    orgao: "CNPCP / Ministério da Justiça",
    data: "2011",
    descricao:
      "Norma de referência para projetos de unidades prisionais. Traz os ambientes e as áreas mínimas dos módulos de agentes. Não prevê sala de descompressão.",
    arquivo: "/documentos/diretrizes-basicas-arquitetura-penal-cnpcp-2011.pdf",
    tamanhoMB: 0.7,
    fonteUrl: "https://www.conjur.com.br/wp-content/uploads/2023/09/resolucao-cnpcp-construcao-prisoes.pdf",
    nota: "Cópia publicada pelo Conjur.",
  },
  {
    id: "ufal",
    titulo: "Estudo de caso: sala de descompressão para o sistema prisional alagoano",
    orgao: "UFAL",
    data: "2022",
    descricao:
      "Trabalho de conclusão de curso em Design, com questionário aplicado a policiais penais e proposta de layout da sala. Fica só como link, porque os direitos pertencem à autora.",
    fonteUrl: "https://www.repositorio.ufal.br/handle/123456789/11536",
  },
  {
    id: "matriz-interativa",
    titulo: "Matriz interativa do Pena Justa",
    orgao: "CNJ",
    data: "Atualizada pelo CNJ",
    descricao: "Painel do CNJ para consultar as metas e os indicadores do plano.",
    fonteUrl: "https://pena-justa.seeu.pje.jus.br/",
  },
];
