import { consulta } from "@/db";
import { HttpErro, idDaRota, lerJson, protegido, resposta } from "@/lib/api";
import { esquemaMensagem, lerEnvio, publicarMensagem } from "@/lib/forum";

/** Responde a um tópico. */
export async function POST(req: Request, ctx: RouteContext<"/api/forum/topicos/[id]/mensagens">) {
  return protegido(async () => {
    const id = idDaRota((await ctx.params).id);
    const envio = lerEnvio(esquemaMensagem, await lerJson(req));
    const [t] = await consulta(
      `SELECT 1 FROM topicos t WHERE t.id = $1 AND EXISTS (SELECT 1 FROM mensagens m WHERE m.topico_id = t.id AND m.status IN ('visivel', 'oculta', 'removida'))`,
      [id],
    );
    if (!t) throw new HttpErro(404, "Tópico não encontrado.");
    const r = await publicarMensagem(req.headers, id, envio, false);
    return resposta({ ok: true, mensagemId: r.id, status: r.status });
  });
}
