import { consulta } from "@/db";
import { HttpErro, exigirModerador, idDaRota, lerJson, protegido, resposta } from "@/lib/api";

const ACOES = ["aprovar", "ocultar", "restaurar", "remover", "bloquear"] as const;
type Acao = (typeof ACOES)[number];

/** Aplica uma ação da moderação a uma mensagem e registra no histórico. */
export async function POST(req: Request, ctx: RouteContext<"/api/mod/mensagens/[id]">) {
  return protegido(async () => {
    const mod = await exigirModerador();
    const id = idDaRota((await ctx.params).id);
    const dados = await lerJson(req);
    const acao = ACOES.find((a) => a === dados.acao) as Acao | undefined;
    if (!acao) throw new HttpErro(400, "Ação desconhecida.");

    const [m] = await consulta<{ id: number; status: string; topico_id: number; ip_hash: string }>(
      `SELECT id, status, topico_id, ip_hash FROM mensagens WHERE id = $1`,
      [id],
    );
    if (!m) throw new HttpErro(404, "Mensagem não encontrada.");

    let detalhe: string | null = null;
    if (acao === "aprovar") {
      await consulta(`UPDATE mensagens SET status = 'visivel', motivo = NULL WHERE id = $1 AND status IN ('retida', 'oculta')`, [id]);
      await consulta(`UPDATE topicos SET ultima_atividade = now() WHERE id = $1`, [m.topico_id]);
    } else if (acao === "restaurar") {
      await consulta(`UPDATE mensagens SET status = 'visivel', motivo = NULL WHERE id = $1 AND status = 'oculta'`, [id]);
      await consulta(`DELETE FROM denuncias WHERE mensagem_id = $1`, [id]);
    } else if (acao === "ocultar") {
      await consulta(`UPDATE mensagens SET status = 'oculta', motivo = 'moderacao' WHERE id = $1 AND status = 'visivel'`, [id]);
    } else if (acao === "remover") {
      await consulta(`UPDATE mensagens SET status = 'removida', motivo = 'moderacao' WHERE id = $1`, [id]);
    } else if (acao === "bloquear") {
      if (!m.ip_hash) throw new HttpErro(400, "A assinatura de origem desta mensagem já foi apagada (mais de 6 meses).");
      await consulta(`INSERT INTO bloqueios (ip_hash, motivo) VALUES ($1, $2) ON CONFLICT (ip_hash) DO NOTHING`, [m.ip_hash, `mensagem ${id}`]);
      await consulta(`UPDATE mensagens SET status = 'removida', motivo = 'moderacao' WHERE id = $1`, [id]);
      detalhe = "origem bloqueada";
    }
    await consulta(`INSERT INTO acoes_moderacao (moderador, acao, mensagem_id, detalhe) VALUES ($1, $2, $3, $4)`, [mod.usuario, acao, id, detalhe]);
    return resposta({ ok: true });
  });
}
