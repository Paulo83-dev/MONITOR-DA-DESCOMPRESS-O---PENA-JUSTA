/**
 * Cadastro central das fontes citadas no site.
 * Toda informação exibida (situação de uma UF, preço de um móvel, notícia da
 * linha do tempo) deve apontar para uma destas entradas.
 */
export type Fonte = {
  titulo: string;
  orgao: string;
  url: string;
  /** Data da publicação (AAAA-MM-DD ou AAAA-MM quando só o mês é conhecido). */
  data?: string;
  /** Observação sobre a confiabilidade ou o estado da fonte. */
  nota?: string;
};

export const FONTES = {
  planoNacional: {
    titulo: "Plano Nacional Pena Justa: texto e matriz de implementação",
    orgao: "CNJ",
    url: "https://www.cnj.jus.br/wp-content/uploads/2025/02/2025-02-07-pena-justa-plano-e-matriz.pdf",
    data: "2025-02-07",
  },
  informe2: {
    titulo: "II Informe de Monitoramento ao Supremo Tribunal Federal (jan. a dez. de 2025)",
    orgao: "CNJ",
    url: "https://www.cnj.jus.br/wp-content/uploads/2026/08/pena-justa-ii-informe-stf.pdf",
    data: "2026-08",
  },
  estruturaPlano: {
    titulo: "Estrutura do plano Pena Justa",
    orgao: "CNJ",
    url: "https://www.cnj.jus.br/sistema-carcerario/plano-pena-justa/estrutura-do-plano/",
  },
  documentosCNJ: {
    titulo: "Pena Justa: documentos relevantes",
    orgao: "CNJ",
    url: "https://www.cnj.jus.br/sistema-carcerario/plano-pena-justa/documentos-relevantes/",
  },
  matrizInterativa: {
    titulo: "Matriz interativa do Pena Justa",
    orgao: "CNJ",
    url: "https://pena-justa.seeu.pje.jus.br/",
  },
  matrizSP: {
    titulo: "Matriz de implementação do Plano Estadual de São Paulo",
    orgao: "TJSP",
    url: "https://www.tjsp.jus.br/Download/CanaisComunicacao/GMF/matriz-de-implementacao-do-plano-estadual.pdf",
    nota: "Item 2.87 / código nacional 2.5.1.1.1.1, página 145 do PDF.",
  },
  dezCoisas: {
    titulo: "10 coisas que você precisa saber sobre o Pena Justa",
    orgao: "CNJ",
    url: "https://www.cnj.jus.br/pena-justa-10-coisas",
  },
  cnpcp2011: {
    titulo: "Diretrizes Básicas para Arquitetura Penal (Resolução CNPCP nº 9/2011)",
    orgao: "CNPCP / Ministério da Justiça",
    url: "https://www.conjur.com.br/wp-content/uploads/2023/09/resolucao-cnpcp-construcao-prisoes.pdf",
    data: "2011",
    nota: "Cópia publicada pelo Conjur.",
  },
  ufal: {
    titulo: "Estudo de caso: sala de descompressão para o sistema prisional alagoano",
    orgao: "UFAL (trabalho de conclusão de curso em Design)",
    url: "https://www.repositorio.ufal.br/handle/123456789/11536",
    data: "2022",
  },
  sapVila: {
    titulo: "CDP de Vila Independência inaugura sala de descanso para servidores",
    orgao: "Secretaria da Administração Penitenciária de SP",
    url: "https://www.sap.sp.gov.br/sec_adm_penitenciaria/Noticias/cdp-de-vila-independencia-inaugura-sala-de-descanso-para-servidores",
    data: "2025-09-01",
  },
  agoraRN: {
    titulo: "Governo do Estado vai criar “salas de descompressão” em 15 presídios do RN",
    orgao: "Agora RN",
    url: "https://agorarn.com.br/policia/governo-do-estado-vai-criar-salas-de-descompressao-em-15-presidios-do-rn/",
    data: "2026-09-08",
    nota: "A reportagem cita o Pregão Eletrônico nº 90027/2026 e não menciona o Pena Justa.",
  },
  amapaExpofeira: {
    titulo: "“Espaço de descompressão” garante alívio do estresse para profissionais da segurança",
    orgao: "Diário do Amapá",
    url: "https://www.diariodoamapa.com.br/cadernos/policia/espaco-de-descompressao-garante-alivio-do-estresse-para-profissionais-da-seguranca/",
    data: "2026-08-14",
    nota: "Espaço temporário para o plano de segurança da Expofeira 2026, atende várias corporações, não só policiais penais.",
  },
  acSalaRioBranco: {
    titulo: "Presídio feminino inaugura sala de descompressão em Rio Branco",
    orgao: "Agência de Notícias do Acre",
    url: "https://agencia.ac.gov.br/presidio-feminino-inaugura-sala-de-descompressao-em-rio-branco/",
    nota: "Informação obtida em trecho de busca. O portal estava fora do ar no período eleitoral e o texto completo não foi conferido.",
  },
  lawOfficerHampton: {
    titulo: "Virginia police using quiet rooms to decompress and rest",
    orgao: "Law Officer",
    url: "https://www.lawofficer.com/virginia-police-using-quiet-rooms-to-decompress-and-rest/",
    data: "2017-01-28",
    nota: "Salas de descanso da polícia de Hampton (Virgínia, EUA), não de sistema prisional.",
  },
  acDivisaoServidor: {
    titulo: "Divisão de Assistência ao Servidor Penitenciário promove o bem-estar de quem cuida do Sistema Penitenciário",
    orgao: "Agência de Notícias do Acre",
    url: "https://agencia.ac.gov.br/divisao-de-assistencia-ao-servidor-penitenciario-promove-o-bem-estar-de-quem-cuida-do-sistema-penitenciario/",
    nota: "Informação obtida em trecho de busca (salas em 50% dos presídios). O portal estava fora do ar e o texto completo não foi conferido.",
  },
} satisfies Record<string, Fonte>;

export type FonteId = keyof typeof FONTES;
