import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { consulta } from "@/db";
import { segredo } from "./config";

const COOKIE = "mdj_mod";
const DURACAO_S = 8 * 3600;

export type Sessao = { usuario: string; papel: "admin" | "moderador" };

const chave = () => new TextEncoder().encode(segredo("SESSION_SECRET", "dev-session-secret-nao-usar-em-producao-0123456789"));

export async function criarSessao(s: Sessao) {
  const token = await new SignJWT({ papel: s.papel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.usuario)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_S}s`)
    .sign(chave());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACAO_S,
  });
}

/** Lê o cookie e confere no banco se o moderador continua ativo (e qual é o papel atual dele). */
export async function lerSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const [m] = await consulta<{ usuario: string; papel: string; ativo: boolean }>(
      `SELECT usuario, papel, ativo FROM moderadores WHERE usuario = $1`,
      [payload.sub],
    );
    if (!m || !m.ativo) return null;
    return { usuario: m.usuario, papel: m.papel === "admin" ? "admin" : "moderador" };
  } catch {
    return null;
  }
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}
