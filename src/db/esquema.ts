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
  // 2: fórum anônimo e moderação
  [
    `CREATE TABLE IF NOT EXISTS topicos (
       id serial PRIMARY KEY,
       titulo text NOT NULL,
       categoria text NOT NULL,
       uf char(2),
       apelido text NOT NULL,
       criado_em timestamptz NOT NULL DEFAULT now(),
       ultima_atividade timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS mensagens (
       id serial PRIMARY KEY,
       topico_id integer NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
       corpo text NOT NULL,
       apelido text NOT NULL,
       da_moderacao boolean NOT NULL DEFAULT false,
       criado_em timestamptz NOT NULL DEFAULT now(),
       status text NOT NULL DEFAULT 'visivel',
       motivo text,
       token_hash text NOT NULL,
       ip_hash text NOT NULL DEFAULT ''
     )`,
    `CREATE INDEX IF NOT EXISTS mensagens_topico_idx ON mensagens (topico_id, id)`,
    `CREATE INDEX IF NOT EXISTS mensagens_status_idx ON mensagens (status, criado_em)`,
    `CREATE TABLE IF NOT EXISTS denuncias (
       id serial PRIMARY KEY,
       mensagem_id integer NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
       ip_hash text NOT NULL,
       motivo text,
       criado_em timestamptz NOT NULL DEFAULT now(),
       UNIQUE (mensagem_id, ip_hash)
     )`,
    `CREATE TABLE IF NOT EXISTS moderadores (
       id serial PRIMARY KEY,
       usuario text NOT NULL UNIQUE,
       senha_hash text NOT NULL,
       papel text NOT NULL DEFAULT 'moderador',
       ativo boolean NOT NULL DEFAULT true,
       criado_em timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS acoes_moderacao (
       id serial PRIMARY KEY,
       moderador text NOT NULL,
       acao text NOT NULL,
       mensagem_id integer,
       detalhe text,
       criado_em timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS limites (
       chave text NOT NULL,
       janela bigint NOT NULL,
       contagem integer NOT NULL DEFAULT 0,
       PRIMARY KEY (chave, janela)
     )`,
    `CREATE TABLE IF NOT EXISTS bloqueios (
       ip_hash text PRIMARY KEY,
       motivo text,
       criado_em timestamptz NOT NULL DEFAULT now()
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
