import { consulta } from "@/db";
import { LIMITES, MOTIVOS_DENUNCIA } from "@/data/forum";
import { HttpErro, idDaRota, lerJson, protegido, resposta } from "@/lib/api";
import { assinaturaDoIp } from "@/lib/ip";
import { dentroDoLimite } from "@/lib/limite";

/** Denuncia uma mensagem. Três denúncias de origens diferentes ocultam a mensagem até a moderação revisar. */
export async function POST(req: Request, ctx: RouteContext<"/api/forum/mensagens/[id]/denunciar">) {
  return protegido(async () => {
    const id = idDaRota((await ctx.params).id);
    const dados = await lerJson(req);
    const motivo = typeof dados.motivo === "string" && (MOTIVOS_DENUNCIA as readonly string[]).includes(dados.motivo) ? dados.motivo : null;
    const ip = assinaturaDoIp(req.headers);
    if (!(await dentroDoLimite(`den:${ip}`, 20, 3600))) throw new HttpErro(429, "Muitas denúncias em pouco tempo. Tente mais tarde.");

    const [m] = await consulta<{ status: string }>(`SELECT status FROM mensagens WHERE id = $1`, [id]);
    if (!m) throw new HttpErro(404, "Mensagem não encontrada.");
    await consulta(
      `INSERT INTO denuncias (mensagem_id, ip_hash, motivo) VALUES ($1, $2, $3) ON CONFLICT (mensagem_id, ip_hash) DO NOTHING`,
      [id, ip, motivo],
    );
    const [c] = await consulta<{ total: number }>(`SELECT count(*)::int AS total FROM denuncias WHERE mensagem_id = $1`, [id]);
    let ocultada = false;
    if (m.status === "visivel" && (c?.total ?? 0) >= LIMITES.denunciasParaOcultar) {
      await consulta(`UPDATE mensagens SET status = 'oculta', motivo = 'denuncias' WHERE id = $1 AND status = 'visivel'`, [id]);
      ocultada = true;
    }
    return resposta({ ok: true, ocultada });
  });
}
