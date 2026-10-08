import "server-only";
import { MIGRACOES, garantirEsquema, type Executor } from "./esquema";

export class SemBanco extends Error {
  constructor() {
    super("Banco de dados não configurado");
    this.name = "SemBanco";
  }
}

type Banco = { exec: Promise<Executor>; esquema: number };
type Global = typeof globalThis & { __mdjBanco?: Banco };

function urlDoBanco() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

/** Há banco disponível? Em produção, só com DATABASE_URL; em desenvolvimento, sempre (PGlite). */
export function bancoConfigurado() {
  return Boolean(urlDoBanco()) || process.env.NODE_ENV !== "production";
}

async function iniciar(): Promise<Executor> {
  const url = urlDoBanco();
  let exec: Executor;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    exec = async (texto, params = []) => (await sql.query(texto, params)) as Record<string, unknown>[];
  } else if (process.env.NODE_ENV !== "production") {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite("./.pglite");
    await db.waitReady;
    exec = async (texto, params = []) => (await db.query(texto, params)).rows as Record<string, unknown>[];
  } else {
    throw new SemBanco();
  }
  await garantirEsquema(exec);
  return exec;
}

/** Executa uma consulta SQL parametrizada ($1, $2...). Nunca monte SQL concatenando texto do usuário. */
export async function consulta<T = Record<string, unknown>>(texto: string, params: unknown[] = []): Promise<T[]> {
  const g = globalThis as Global;
  if (!g.__mdjBanco) {
    const exec = iniciar().catch((e) => {
      g.__mdjBanco = undefined;
      throw e;
    });
    g.__mdjBanco = { exec, esquema: MIGRACOES.length };
  }
  const banco = g.__mdjBanco;
  const exec = await banco.exec;
  // Em desenvolvimento a conexão sobrevive a recargas de código: aplica migrações que apareceram depois.
  if (banco.esquema !== MIGRACOES.length) {
    banco.esquema = MIGRACOES.length;
    await garantirEsquema(exec);
  }
  return (await exec(texto, params)) as T[];
}
