import { connection } from "next/server";
import { protegido, resposta } from "@/lib/api";
import { lerSessao } from "@/lib/sessao";

/** Diz se há moderador logado neste navegador. */
export async function GET() {
  await connection();
  return protegido(async () => {
    const s = await lerSessao();
    return resposta({ ok: true, logado: Boolean(s), usuario: s?.usuario ?? null, papel: s?.papel ?? null });
  });
}
