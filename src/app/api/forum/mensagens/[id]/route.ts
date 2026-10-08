import { consulta } from "@/db";
import { HttpErro, idDaRota, lerJson, protegido, resposta } from "@/lib/api";
import { resumoDoToken } from "@/lib/ip";

/** O autor apaga a própria mensagem, provando que tem a chave guardada no navegador. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/forum/mensagens/[id]">) {
  return protegido(async () => {
    const id = idDaRota((await ctx.params).id);
    const dados = await lerJson(req);
    const token = typeof dados.token === "string" && /^[a-f0-9]{32}$/.test(dados.token) ? dados.token : null;
    if (!token) throw new HttpErro(400, "Chave inválida.");
    const apagadas = await consulta(
      `UPDATE mensagens SET status = 'removida', motivo = 'autor'
        WHERE id = $1 AND token_hash = $2 AND status IN ('visivel', 'retida', 'oculta')
        RETURNING id`,
      [id, resumoDoToken(token)],
    );
    if (!apagadas.length) throw new HttpErro(403, "Não foi possível apagar esta mensagem deste navegador.");
    return resposta({ ok: true });
  });
}
