import "server-only";
import { SemBanco } from "@/db";
import { ConfigAusente } from "./config";
import { lerSessao, type Sessao } from "./sessao";

/** Erro que vira uma resposta HTTP com mensagem para a pessoa. */
export class HttpErro extends Error {
  constructor(public status: number, mensagem: string, public motivo?: string) {
    super(mensagem);
  }
}

const SEM_CACHE = { "Cache-Control": "no-store" };

export const resposta = (dados: unknown, status = 200) => Response.json(dados, { status, headers: SEM_CACHE });

export const respostaErro = (status: number, mensagem: string, motivo?: string) =>
  Response.json({ ok: false, erro: mensagem, motivo }, { status, headers: SEM_CACHE });

/** Executa o tratador e transforma erros conhecidos em respostas claras. */
export async function protegido(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpErro) return respostaErro(e.status, e.message, e.motivo);
    if (e instanceof SemBanco || e instanceof ConfigAusente) {
      return respostaErro(503, "O fórum ainda está em configuração. Volte em breve.", "em-configuracao");
    }
    console.error("Erro na API:", e instanceof Error ? e.message : e);
    return respostaErro(500, "Algo deu errado. Tente de novo em instantes.");
  }
}

/** Lê o corpo JSON e confere que o pedido veio do próprio site (bloqueia pedidos de outras origens). */
export async function lerJson(req: Request): Promise<Record<string, unknown>> {
  const origem = req.headers.get("origin");
  if (origem) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    try {
      if (host && new URL(origem).host !== host) throw new HttpErro(403, "Pedido de origem não permitida.");
    } catch (e) {
      if (e instanceof HttpErro) throw e;
      throw new HttpErro(403, "Pedido de origem não permitida.");
    }
  }
  if (!req.headers.get("content-type")?.includes("application/json")) throw new HttpErro(415, "Formato não aceito.");
  try {
    const dados = await req.json();
    if (dados && typeof dados === "object" && !Array.isArray(dados)) return dados as Record<string, unknown>;
  } catch {
    // cai no erro abaixo
  }
  throw new HttpErro(400, "Não foi possível ler os dados enviados.");
}

export async function exigirModerador(apenasAdmin = false): Promise<Sessao> {
  const s = await lerSessao();
  if (!s) throw new HttpErro(401, "Entre com o seu usuário de moderação.", "sem-sessao");
  if (apenasAdmin && s.papel !== "admin") throw new HttpErro(403, "Só o administrador pode fazer isso.");
  return s;
}

export function idDaRota(valor: string) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 2_000_000_000) throw new HttpErro(404, "Não encontrado.");
  return n;
}
