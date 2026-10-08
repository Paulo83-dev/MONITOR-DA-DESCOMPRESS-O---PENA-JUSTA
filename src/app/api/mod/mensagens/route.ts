import { connection, type NextRequest } from "next/server";
import { consulta } from "@/db";
import { exigirModerador, protegido, resposta } from "@/lib/api";

const FILTROS = {
  pendentes: `m.status = 'retida'`,
  denunciadas: `m.status IN ('visivel', 'oculta') AND EXISTS (SELECT 1 FROM denuncias d WHERE d.mensagem_id = m.id)`,
  ocultas: `m.status = 'oculta'`,
  recentes: `m.status <> 'removida'`,
} as const;

/** Fila da moderação: mensagens retidas, denunciadas, ocultas ou recentes. */
export async function GET(req: NextRequest) {
  await connection();
  return protegido(async () => {
    await exigirModerador();
    const pedido = req.nextUrl.searchParams.get("filtro") ?? "pendentes";
    const filtro = (Object.keys(FILTROS) as (keyof typeof FILTROS)[]).includes(pedido as keyof typeof FILTROS) ? (pedido as keyof typeof FILTROS) : "pendentes";
    const mensagens = await consulta(
      `SELECT m.id, m.topico_id, t.titulo, m.corpo, m.apelido, m.da_moderacao, m.criado_em, m.status, m.motivo,
              (SELECT count(*) FROM denuncias d WHERE d.mensagem_id = m.id)::int AS denuncias,
              (m.ip_hash <> '') AS tem_origem
         FROM mensagens m JOIN topicos t ON t.id = m.topico_id
        WHERE ${FILTROS[filtro]}
        ORDER BY m.id DESC
        LIMIT 100`,
    );
    const [c] = await consulta<{ pendentes: number; denunciadas: number; ocultas: number }>(
      `SELECT (SELECT count(*) FROM mensagens m WHERE ${FILTROS.pendentes})::int AS pendentes,
              (SELECT count(*) FROM mensagens m WHERE ${FILTROS.denunciadas})::int AS denunciadas,
              (SELECT count(*) FROM mensagens m WHERE ${FILTROS.ocultas})::int AS ocultas`,
    );
    return resposta({ ok: true, filtro, mensagens, contagens: c });
  });
}
