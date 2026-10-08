import { hash } from "bcryptjs";
import { connection } from "next/server";
import { consulta } from "@/db";
import { HttpErro, exigirModerador, lerJson, protegido, resposta } from "@/lib/api";

const USUARIO = /^[a-z0-9._-]{3,32}$/;

function senhaValida(s: unknown): string {
  if (typeof s !== "string" || s.length < 10 || s.length > 200) throw new HttpErro(400, "A senha precisa ter pelo menos 10 caracteres.");
  return s;
}

/** Lista os moderadores (só o administrador). */
export async function GET() {
  await connection();
  return protegido(async () => {
    await exigirModerador(true);
    const lista = await consulta(`SELECT usuario, papel, ativo, criado_em FROM moderadores ORDER BY id`);
    return resposta({ ok: true, moderadores: lista });
  });
}

/** Cria um moderador (só o administrador). */
export async function POST(req: Request) {
  return protegido(async () => {
    const adm = await exigirModerador(true);
    const dados = await lerJson(req);
    const usuario = typeof dados.usuario === "string" ? dados.usuario.trim().toLowerCase() : "";
    if (!USUARIO.test(usuario)) throw new HttpErro(400, "Usuário: de 3 a 32 letras minúsculas, números, ponto, hífen ou sublinhado.");
    const papel = dados.papel === "admin" ? "admin" : "moderador";
    const criados = await consulta(
      `INSERT INTO moderadores (usuario, senha_hash, papel) VALUES ($1, $2, $3) ON CONFLICT (usuario) DO NOTHING RETURNING id`,
      [usuario, await hash(senhaValida(dados.senha), 10), papel],
    );
    if (!criados.length) throw new HttpErro(409, "Já existe um moderador com esse usuário.");
    await consulta(`INSERT INTO acoes_moderacao (moderador, acao, detalhe) VALUES ($1, 'criar-moderador', $2)`, [adm.usuario, usuario]);
    return resposta({ ok: true });
  });
}

/** Ativa, desativa ou troca a senha de um moderador (só o administrador). */
export async function PATCH(req: Request) {
  return protegido(async () => {
    const adm = await exigirModerador(true);
    const dados = await lerJson(req);
    const usuario = typeof dados.usuario === "string" ? dados.usuario.trim().toLowerCase() : "";
    const [alvo] = await consulta<{ usuario: string }>(`SELECT usuario FROM moderadores WHERE usuario = $1`, [usuario]);
    if (!alvo) throw new HttpErro(404, "Moderador não encontrado.");
    if (typeof dados.ativo === "boolean") {
      if (!dados.ativo && usuario === adm.usuario) throw new HttpErro(400, "Você não pode desativar o seu próprio usuário.");
      await consulta(`UPDATE moderadores SET ativo = $2 WHERE usuario = $1`, [usuario, dados.ativo]);
      await consulta(`INSERT INTO acoes_moderacao (moderador, acao, detalhe) VALUES ($1, $2, $3)`, [adm.usuario, dados.ativo ? "ativar-moderador" : "desativar-moderador", usuario]);
    }
    if (dados.senha !== undefined) {
      await consulta(`UPDATE moderadores SET senha_hash = $2 WHERE usuario = $1`, [usuario, await hash(senhaValida(dados.senha), 10)]);
      await consulta(`INSERT INTO acoes_moderacao (moderador, acao, detalhe) VALUES ($1, 'trocar-senha', $2)`, [adm.usuario, usuario]);
    }
    return resposta({ ok: true });
  });
}
