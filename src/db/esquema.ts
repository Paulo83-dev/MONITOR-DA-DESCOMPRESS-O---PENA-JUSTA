/**
 * Migrações do banco, aplicadas em ordem na primeira conexão de cada instância.
 * A posição na lista é o número da versão (a primeira é a versão 1).
 * Cada comando deve ser idempotente (IF NOT EXISTS), porque duas instâncias
 * podem migrar ao mesmo tempo.
 */
export const MIGRACOES: string[][] = [
  // 1: contador de visitas
  [
    `CREATE TABLE IF NOT EXISTS visitas (
       dia date PRIMARY KEY,
       total integer NOT NULL DEFAULT 0
     )`,
  ],
];

export type Executor = (texto: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export async function garantirEsquema(exec: Executor) {
  await exec(`CREATE TABLE IF NOT EXISTS esquema_versao (versao integer PRIMARY KEY)`);
  const [atual] = await exec(`SELECT COALESCE(MAX(versao), 0)::int AS v FROM esquema_versao`);
  const aplicada = Number(atual?.v ?? 0);
  for (let i = aplicada; i < MIGRACOES.length; i++) {
    for (const comando of MIGRACOES[i]) await exec(comando);
    await exec(`INSERT INTO esquema_versao (versao) VALUES ($1) ON CONFLICT DO NOTHING`, [i + 1]);
  }
}
