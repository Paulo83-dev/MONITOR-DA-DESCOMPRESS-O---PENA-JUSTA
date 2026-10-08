import { connection } from "next/server";
import { consulta } from "@/db";
import { HttpErro, idDaRota, protegido, resposta } from "@/lib/api";

/** Um tópico com as mensagens. Mensagens ocultas ou removidas aparecem sem o texto. */
export async function GET(_req: Request, ctx: RouteContext<"/api/forum/topicos/[id]">) {
  await connection();
  return protegido(async () => {
    const id = idDaRota((await ctx.params).id);
    const [t] = await consulta<{ id: number; titulo: string; categoria: string; uf: string | null; apelido: string; criado_em: string }>(
      `SELECT id, titulo, categoria, uf, apelido, criado_em FROM topicos WHERE id = $1`,
      [id],
    );
    if (!t) throw new HttpErro(404, "Tópico não encontrado.");
    const mensagens = await consulta<{ id: number; corpo: string; apelido: string; da_moderacao: boolean; criado_em: string; status: string }>(
      `SELECT id, CASE WHEN status = 'visivel' THEN corpo ELSE '' END AS corpo, apelido, da_moderacao, criado_em, status
         FROM mensagens
        WHERE topico_id = $1 AND status IN ('visivel', 'oculta', 'removida')
        ORDER BY id
        LIMIT 500`,
      [id],
    );
    if (!mensagens.length) throw new HttpErro(404, "Tópico não encontrado.");
    return resposta({ ok: true, topico: t, mensagens });
  });
}
