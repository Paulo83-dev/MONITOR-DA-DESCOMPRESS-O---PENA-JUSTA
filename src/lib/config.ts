import "server-only";

/** Falta uma configuração obrigatória (por exemplo, um segredo na Vercel). */
export class ConfigAusente extends Error {
  constructor(nome: string) {
    super(`Variável de ambiente ausente: ${nome}`);
    this.name = "ConfigAusente";
  }
}

/**
 * Lê um segredo do ambiente. Em desenvolvimento usa um valor padrão para o site
 * funcionar sem configuração; em produção, a falta do segredo desliga o recurso.
 */
export function segredo(nome: string, padraoDev: string) {
  const valor = process.env[nome];
  if (valor && valor.length >= 16) return valor;
  if (process.env.NODE_ENV !== "production") return padraoDev;
  throw new ConfigAusente(nome);
}
