import { lerJson, protegido, resposta } from "@/lib/api";
import { encerrarSessao } from "@/lib/sessao";

export async function POST(req: Request) {
  return protegido(async () => {
    await lerJson(req);
    await encerrarSessao();
    return resposta({ ok: true });
  });
}
