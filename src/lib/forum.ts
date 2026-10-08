import "server-only";
import { z } from "zod";
import { consulta } from "@/db";
import { APELIDOS_RESERVADOS, CATEGORIAS, LIMITES } from "@/data/forum";
import { HttpErro } from "./api";
import { assinaturaDoIp, resumoDoToken } from "./ip";
import { dentroDoLimite, limpezaPeriodica } from "./limite";
import { avaliar } from "./moderacao";
import { lerSessao } from "./sessao";
import { limpar, limparLinha, normalizar } from "./texto";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

const base = {
  corpo: z.string().min(2, "Escreva a mensagem.").max(LIMITES.corpo, `A mensagem pode ter até ${LIMITES.corpo} caracteres.`),
  apelido: z.string().max(LIMITES.apelido * 2).optional().default(""),
  token: z.string().regex(/^[a-f0-9]{32}$/, "Chave inválida."),
  tempoMs: z.number().min(0),
  site: z.string().optional(),
  aceite: z.literal(true, { message: "Marque que leu as regras." }),
  comoModeracao: z.boolean().optional(),
};

export const esquemaMensagem = z.object(base);
export const esquemaTopico = z.object({
  ...base,
  titulo: z.string().min(5, "O título precisa de pelo menos 5 letras.").max(LIMITES.titulo, `O título pode ter até ${LIMITES.titulo} caracteres.`),
  categoria: z.enum(CATEGORIAS.map((c) => c.id) as [string, ...string[]]),
  uf: z.enum(UFS).optional(),
});

export function lerEnvio<T extends z.ZodType>(esquema: T, dados: unknown): z.infer<T> {
  const r = esquema.safeParse(dados);
  if (!r.success) throw new HttpErro(400, r.error.issues[0]?.message ?? "Confira os campos e tente de novo.");
  return r.data;
}

type Envio = z.infer<typeof esquemaMensagem> & { titulo?: string };

export type Publicacao = { id: number; status: "visivel" | "retida"; descartado?: boolean };

/**
 * Valida e grava uma mensagem: honeypot, tempo mínimo, bloqueio, limites de envio,
 * apelido e triagem automática. Devolve o estado final da mensagem.
 */
export async function publicarMensagem(headers: Headers, topicoId: number, envio: Envio, ehNovoTopico: boolean): Promise<Publicacao> {
  if (envio.site) return { id: 0, status: "visivel", descartado: true }; // robô: finge que deu certo
  if (envio.tempoMs < LIMITES.tempoMinimoMs) throw new HttpErro(400, "Você enviou rápido demais. Espere um instante e tente de novo.");

  const ip = assinaturaDoIp(headers);
  const [bloqueado] = await consulta(`SELECT 1 FROM bloqueios WHERE ip_hash = $1`, [ip]);
  if (bloqueado) throw new HttpErro(403, "Não foi possível publicar a partir deste acesso.");

  const moderador = envio.comoModeracao ? await lerSessao() : null;
  if (envio.comoModeracao && !moderador) throw new HttpErro(401, "Entre na moderação para responder como moderação.");

  if (!moderador) {
    const limiteOk =
      (await dentroDoLimite(`msg:${ip}`, 5, 600)) &&
      (await dentroDoLimite(`msgdia:${ip}`, 40, 86400)) &&
      (!ehNovoTopico || (await dentroDoLimite(`top:${ip}`, 3, 3600)));
    if (!limiteOk) throw new HttpErro(429, "Você publicou muitas vezes em pouco tempo. Tente de novo mais tarde.");
  }

  let apelido = limparLinha(envio.apelido).slice(0, LIMITES.apelido) || "Anônimo";
  if (moderador) apelido = "Moderação";
  else if (APELIDOS_RESERVADOS.some((r) => normalizar(apelido).replace(/[^a-z]/g, "").includes(r))) {
    throw new HttpErro(400, "Esse apelido lembra a moderação. Escolha outro.");
  }

  const corpo = limpar(envio.corpo);
  if (corpo.length < 2) throw new HttpErro(400, "Escreva a mensagem.");
  const avaliacao = moderador ? ({ acao: "publicar" } as const) : avaliar(corpo, envio.titulo ?? "", apelido);
  const status = avaliacao.acao === "publicar" ? "visivel" : "retida";

  const [m] = await consulta<{ id: number }>(
    `INSERT INTO mensagens (topico_id, corpo, apelido, da_moderacao, status, motivo, token_hash, ip_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [topicoId, corpo, apelido, Boolean(moderador), status, avaliacao.acao === "reter" ? avaliacao.motivo : null, resumoDoToken(envio.token), ip],
  );
  if (status === "visivel") await consulta(`UPDATE topicos SET ultima_atividade = now() WHERE id = $1`, [topicoId]);
  await limpezaPeriodica();
  return { id: m.id, status };
}
