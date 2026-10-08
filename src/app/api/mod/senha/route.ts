import { compare, hash } from "bcryptjs";
import { consulta } from "@/db";
import { HttpErro, exigirModerador, lerJson, protegido, resposta } from "@/lib/api";

/** O moderador troca a própria senha. */
export async function POST(req: Request) {
  return protegido(async () => {
    const mod = await exigirModerador();
    const dados = await lerJson(req);
    const atual = typeof dados.atual === "string" ? dados.atual : "";
    const nova = typeof dados.nova === "string" ? dados.nova : "";
    if (nova.length < 10 || nova.length > 200) throw new HttpErro(400, "A nova senha precisa ter pelo menos 10 caracteres.");
    const [m] = await consulta<{ senha_hash: string }>(`SELECT senha_hash FROM moderadores WHERE usuario = $1`, [mod.usuario]);
    if (!m || !(await compare(atual, m.senha_hash))) throw new HttpErro(403, "A senha atual não confere.");
    await consulta(`UPDATE moderadores SET senha_hash = $2 WHERE usuario = $1`, [mod.usuario, await hash(nova, 10)]);
    await consulta(`INSERT INTO acoes_moderacao (moderador, acao, detalhe) VALUES ($1, 'trocar-propria-senha', $1)`, [mod.usuario]);
    return resposta({ ok: true });
  });
}
