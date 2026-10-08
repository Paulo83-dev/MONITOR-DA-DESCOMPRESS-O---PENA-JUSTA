import { connection } from "next/server";
import { bancoConfigurado, consulta } from "@/db";

const FUSO = "America/Sao_Paulo";
const hojeNoBrasil = () => new Date().toLocaleDateString("sv-SE", { timeZone: FUSO });

async function totais() {
  const hoje = hojeNoBrasil();
  const [r] = await consulta<{ total: number; hoje: number; desde: string | null }>(
    `SELECT COALESCE(SUM(total), 0)::int AS total,
            COALESCE(MAX(total) FILTER (WHERE dia = $1::date), 0)::int AS hoje,
            MIN(dia)::text AS desde
       FROM visitas`,
    [hoje],
  );
  return { total: r?.total ?? 0, hoje: r?.hoje ?? 0, desde: r?.desde ?? hoje };
}

function indisponivel() {
  return Response.json({ ok: false, motivo: "contador-indisponivel" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

/** Devolve o total de visitas sem contar uma nova. */
export async function GET() {
  await connection();
  if (!bancoConfigurado()) return indisponivel();
  try {
    return Response.json({ ok: true, ...(await totais()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return indisponivel();
  }
}

/** Soma uma visita (o navegador só chama isto uma vez por dia) e devolve os totais. Não guarda IP. */
export async function POST() {
  if (!bancoConfigurado()) return indisponivel();
  try {
    await consulta(
      `INSERT INTO visitas (dia, total) VALUES ($1::date, 1)
       ON CONFLICT (dia) DO UPDATE SET total = visitas.total + 1`,
      [hojeNoBrasil()],
    );
    return Response.json({ ok: true, ...(await totais()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return indisponivel();
  }
}
