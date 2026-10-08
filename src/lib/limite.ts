import "server-only";
import { consulta } from "@/db";

/**
 * Conta uma tentativa e diz se ainda está dentro do limite.
 * `janelaSeg` é o tamanho da janela de tempo em segundos.
 */
export async function dentroDoLimite(chave: string, max: number, janelaSeg: number) {
  const janela = Math.floor(Date.now() / 1000 / janelaSeg) * janelaSeg;
  const [r] = await consulta<{ contagem: number }>(
    `INSERT INTO limites (chave, janela, contagem) VALUES ($1, $2, 1)
     ON CONFLICT (chave, janela) DO UPDATE SET contagem = limites.contagem + 1
     RETURNING contagem`,
    [chave, janela],
  );
  return (r?.contagem ?? 1) <= max;
}

/** Apaga dados vencidos (assinaturas de IP com mais de 6 meses e contadores antigos). Roda de vez em quando. */
export async function limpezaPeriodica() {
  if (Math.random() > 0.03) return;
  await consulta(`DELETE FROM limites WHERE janela < $1`, [Math.floor(Date.now() / 1000) - 2 * 86400]);
  await consulta(`UPDATE mensagens SET ip_hash = '' WHERE ip_hash <> '' AND criado_em < now() - interval '6 months'`);
  await consulta(`DELETE FROM denuncias WHERE criado_em < now() - interval '6 months'`);
  await consulta(`DELETE FROM bloqueios WHERE criado_em < now() - interval '6 months'`);
}
