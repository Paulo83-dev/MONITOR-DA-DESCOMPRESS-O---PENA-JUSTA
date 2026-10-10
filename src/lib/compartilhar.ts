import { SITE } from "@/data/site";

/** Endereço público de uma página do site, sempre no domínio de produção. */
export function urlPublica(caminho = "/") {
  return new URL(caminho, SITE.url).toString();
}

/** Link que abre o WhatsApp (aplicativo ou WhatsApp Web) com a mensagem e o endereço da página já escritos. */
export function linkWhatsApp(caminho = "/") {
  const texto = `${SITE.mensagemCompartilhar}\n${urlPublica(caminho)}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
