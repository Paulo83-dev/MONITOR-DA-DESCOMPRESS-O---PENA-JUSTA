import { contarLinks, normalizar } from "./texto";

export type Avaliacao =
  | { acao: "publicar" }
  | { acao: "reter"; motivo: string };

/** Termos que mandam a mensagem para revisão. A lista é curta de propósito: a moderação humana decide o resto. */
const TERMOS_OFENSIVOS = [
  "filho da puta", "filha da puta", "fdp", "arrombado", "arrombada", "viado", "bicha", "sapatao", "traveco",
  "macaco", "crioulo", "neguinho", "retardado", "mongoloide", "vou te matar", "vou matar", "vou acabar com voce",
  "merece morrer", "merecem morrer", "te pego",
];

const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
const TELEFONE = /(?:\+?55\s?)?\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;

function contemTermo(texto: string) {
  const t = ` ${normalizar(texto).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  return TERMOS_OFENSIVOS.find((termo) => t.includes(` ${termo} `));
}

/**
 * Primeira triagem automática. Não bloqueia ninguém: mensagens suspeitas ficam
 * retidas até um moderador aprovar. Hoje usa regras simples; uma moderação por
 * IA pode entrar aqui depois, devolvendo a mesma `Avaliacao`.
 */
export function avaliar(...textos: string[]): Avaliacao {
  const texto = textos.join("\n");
  if (CPF.test(texto)) return { acao: "reter", motivo: "Parece conter CPF" };
  if (TELEFONE.test(texto)) return { acao: "reter", motivo: "Parece conter telefone" };
  if (EMAIL.test(texto)) return { acao: "reter", motivo: "Contém e-mail" };
  if (contarLinks(texto) > 2) return { acao: "reter", motivo: "Mais de dois links" };
  const termo = contemTermo(texto);
  if (termo) return { acao: "reter", motivo: "Termo ofensivo ou ameaça" };
  if (/(.)\1{11,}/u.test(texto)) return { acao: "reter", motivo: "Texto repetido (possível spam)" };
  return { acao: "publicar" };
}
