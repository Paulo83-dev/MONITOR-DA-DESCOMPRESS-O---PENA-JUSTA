import { compare, hash, hashSync } from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";
import { consulta } from "@/db";
import { HttpErro, lerJson, protegido, resposta } from "@/lib/api";
import { assinaturaDoIp } from "@/lib/ip";
import { dentroDoLimite } from "@/lib/limite";
import { criarSessao } from "@/lib/sessao";

let hashFalso: string | null = null;

/** Compara dois textos em tempo constante (sem revelar, pelo tempo, onde eles diferem). */
function iguais(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Entrada da moderação. Se ainda não há moderadores, as variáveis MOD_ADMIN_* criam o administrador. */
export async function POST(req: Request) {
  return protegido(async () => {
    const dados = await lerJson(req);
    const usuario = typeof dados.usuario === "string" ? dados.usuario.trim().toLowerCase().slice(0, 64) : "";
    const senha = typeof dados.senha === "string" ? dados.senha.slice(0, 200) : "";
    if (!usuario || !senha) throw new HttpErro(400, "Informe o usuário e a senha.");

    const ip = assinaturaDoIp(req.headers);
    if (!(await dentroDoLimite(`login:${ip}`, 8, 900)) || !(await dentroDoLimite(`loginu:${usuario}`, 10, 900))) {
      throw new HttpErro(429, "Muitas tentativas. Espere alguns minutos e tente de novo.");
    }

    const [{ total }] = await consulta<{ total: number }>(`SELECT count(*)::int AS total FROM moderadores`);
    if (total === 0) {
      const u = process.env.MOD_ADMIN_USUARIO?.trim().toLowerCase();
      const s = process.env.MOD_ADMIN_SENHA;
      if (u && s && iguais(usuario, u) && iguais(senha, s)) {
        await consulta(
          `INSERT INTO moderadores (usuario, senha_hash, papel) VALUES ($1, $2, 'admin') ON CONFLICT (usuario) DO NOTHING`,
          [usuario, await hash(senha, 10)],
        );
        await criarSessao({ usuario, papel: "admin" });
        return resposta({ ok: true, usuario, papel: "admin", primeiroAcesso: true });
      }
      throw new HttpErro(401, "Usuário ou senha incorretos.");
    }

    const [m] = await consulta<{ usuario: string; senha_hash: string; papel: string; ativo: boolean }>(
      `SELECT usuario, senha_hash, papel, ativo FROM moderadores WHERE usuario = $1`,
      [usuario],
    );
    hashFalso ??= hashSync("sem-usuario", 10);
    const confere = await compare(senha, m?.senha_hash ?? hashFalso); // sempre compara, para o tempo não revelar se o usuário existe
    if (!m || !m.ativo || !confere) throw new HttpErro(401, "Usuário ou senha incorretos.");
    const papel = m.papel === "admin" ? "admin" : "moderador";
    await criarSessao({ usuario: m.usuario, papel });
    return resposta({ ok: true, usuario: m.usuario, papel });
  });
}
