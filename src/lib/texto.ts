/** Remove acentos e põe em minúsculas, para comparar palavras. */
export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Limpa o texto digitado: quebras de linha padronizadas, sem caracteres de controle, sem excesso de linhas em branco. */
export function limpar(texto: string) {
  return texto
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function limparLinha(texto: string) {
  return limpar(texto).replace(/\s+/g, " ");
}

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi;
const WWW_RE = /\bwww\.[^\s<>"')]+/gi;

export function contarLinks(texto: string) {
  return (texto.match(URL_RE)?.length ?? 0) + (texto.match(WWW_RE)?.length ?? 0);
}

export type Trecho = { tipo: "texto"; valor: string } | { tipo: "link"; valor: string; href: string };

/**
 * Separa o texto em trechos de texto puro e links http(s). Nada vira HTML:
 * quem renderiza usa elementos React, que escapam o conteúdo.
 */
export function separarLinks(texto: string): Trecho[] {
  const trechos: Trecho[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi)) {
    const inicio = m.index ?? 0;
    const valor = m[0].replace(/[.,;:!?]+$/, "");
    if (inicio > ultimo) trechos.push({ tipo: "texto", valor: texto.slice(ultimo, inicio) });
    const href = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
    try {
      const u = new URL(href);
      if (u.protocol === "http:" || u.protocol === "https:") trechos.push({ tipo: "link", valor, href: u.toString() });
      else trechos.push({ tipo: "texto", valor });
    } catch {
      trechos.push({ tipo: "texto", valor });
    }
    ultimo = inicio + valor.length;
  }
  if (ultimo < texto.length) trechos.push({ tipo: "texto", valor: texto.slice(ultimo) });
  return trechos;
}
