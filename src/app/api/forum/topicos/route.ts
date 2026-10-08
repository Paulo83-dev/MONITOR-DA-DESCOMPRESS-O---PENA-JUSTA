import { connection, type NextRequest } from "next/server";
import { consulta } from "@/db";
import { CATEGORIAS } from "@/data/forum";
import { protegido, resposta, lerJson } from "@/lib/api";
import { esquemaTopico, lerEnvio, publicarMensagem } from "@/lib/forum";
import { limparLinha } from "@/lib/texto";

const POR_PAGINA = 20;

/** Lista os tópicos que têm ao menos uma mensagem visível, do mais recente para o mais antigo. */
export async function GET(req: NextRequest) {
  await connection();
  return protegido(async () => {
    const p = req.nextUrl.searchParams;
    const categoria = CATEGORIAS.some((c) => c.id === p.get("categoria")) ? p.get("categoria") : null;
    const uf = /^[A-Za-z]{2}$/.test(p.get("uf") ?? "") ? p.get("uf")!.toUpperCase() : null;
    const pagina = Math.max(0, Math.min(500, Number(p.get("pagina")) || 0));
    const linhas = await consulta<{
      id: number; titulo: string; categoria: string; uf: string | null; apelido: string;
      criado_em: string; ultima_atividade: string; mensagens: number;
    }>(
      `SELECT t.id, t.titulo, t.categoria, t.uf, t.apelido, t.criado_em, t.ultima_atividade,
              (SELECT count(*) FROM mensagens m WHERE m.topico_id = t.id AND m.status = 'visivel')::int AS mensagens
         FROM topicos t
        WHERE EXISTS (SELECT 1 FROM mensagens m WHERE m.topico_id = t.id AND m.status = 'visivel')
          AND ($1::text IS NULL OR t.categoria = $1)
          AND ($2::text IS NULL OR t.uf = $2)
        ORDER BY t.ultima_atividade DESC
        LIMIT $3 OFFSET $4`,
      [categoria, uf, POR_PAGINA + 1, pagina * POR_PAGINA],
    );
    return resposta({ ok: true, topicos: linhas.slice(0, POR_PAGINA), temMais: linhas.length > POR_PAGINA });
  });
}

/** Cria um tópico com a primeira mensagem. */
export async function POST(req: Request) {
  return protegido(async () => {
    const envio = lerEnvio(esquemaTopico, await lerJson(req));
    const titulo = limparLinha(envio.titulo);
    const [t] = await consulta<{ id: number }>(
      `INSERT INTO topicos (titulo, categoria, uf, apelido) VALUES ($1, $2, $3, $4) RETURNING id`,
      [titulo, envio.categoria, envio.uf ?? null, limparLinha(envio.apelido).slice(0, 24) || "Anônimo"],
    );
    try {
      const r = await publicarMensagem(req.headers, t.id, { ...envio, titulo }, true);
      if (r.descartado) await consulta(`DELETE FROM topicos WHERE id = $1`, [t.id]);
      return resposta({ ok: true, topicoId: t.id, mensagemId: r.id, status: r.status });
    } catch (e) {
      await consulta(`DELETE FROM topicos WHERE id = $1`, [t.id]); // não deixa tópico vazio se a mensagem foi recusada
      throw e;
    }
  });
}
