import "server-only";
import { createHash, createHmac } from "node:crypto";
import { segredo } from "./config";

/**
 * Assinatura irreversível do IP: HMAC com um segredo do servidor. Serve só para
 * limitar envios, impedir denúncias repetidas e bloquear abusos. O IP em si
 * nunca é guardado.
 */
export function assinaturaDoIp(headers: Headers) {
  const bruto = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
  return createHmac("sha256", segredo("IP_HASH_SECRET", "dev-ip-secret-nao-usar-em-producao")).update(bruto).digest("hex").slice(0, 32);
}

/** Resumo SHA-256 da chave secreta de autoria de uma mensagem. */
export function resumoDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
