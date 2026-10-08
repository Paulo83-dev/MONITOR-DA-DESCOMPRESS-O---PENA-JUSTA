export const CATEGORIAS = [
  { id: "unidade", rotulo: "Minha unidade", descricao: "Como é (ou como não é) a sala de descompressão da sua unidade." },
  { id: "mobiliario", rotulo: "Mobiliário e montagem", descricao: "Móveis, equipamentos, preços e ideias para montar a sala." },
  { id: "plano", rotulo: "Pena Justa e normas", descricao: "O plano, as metas, as normas e o andamento nos estados." },
  { id: "sugestoes", rotulo: "Sugestões para o site", descricao: "Erros, dados novos, documentos que faltam e ideias para o Monitor." },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]["id"];
export const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c])) as Record<CategoriaId, (typeof CATEGORIAS)[number]>;

export const LIMITES = {
  titulo: 120,
  corpo: 4000,
  apelido: 24,
  tempoMinimoMs: 3000,
  denunciasParaOcultar: 3,
} as const;

export const MOTIVOS_DENUNCIA = [
  "Dados pessoais ou informação que compromete a segurança",
  "Ofensa, ameaça ou discriminação",
  "Acusação sem prova",
  "Propaganda ou spam",
  "Outro motivo",
] as const;

/** Nomes que fazem parecer que a mensagem é da moderação. */
export const APELIDOS_RESERVADOS = ["moderacao", "moderador", "moderadora", "admin", "administrador", "monitor", "sistema"];
