/** Chamada à API do site. Devolve sempre um objeto simples, sem lançar erro. */
export type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string; motivo?: string; status: number };

export async function chamar<T = Record<string, unknown>>(url: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<Resultado<T>> {
  try {
    const r = await fetch(url, {
      method: opcoes.metodo ?? (opcoes.corpo === undefined ? "GET" : "POST"),
      headers: opcoes.corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok || dados.ok === false) {
      return { ok: false, erro: dados.erro ?? "Não foi possível completar o pedido.", motivo: dados.motivo, status: r.status };
    }
    return { ok: true, dados: dados as T };
  } catch {
    return { ok: false, erro: "Sem conexão com o servidor. Verifique a internet e tente de novo.", status: 0 };
  }
}

const CHAVE_TOKENS = "mdj-forum-chaves";
const CHAVE_APELIDO = "mdj-forum-apelido";

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento: o recurso que depende dele simplesmente não aparece.
  }
}

export const novoToken = () => {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

/** Chaves das mensagens que este navegador escreveu (permitem apagar a própria mensagem). */
export const chavesDasMinhasMensagens = () => ler<Record<string, string>>(CHAVE_TOKENS, {});
export function guardarChave(mensagemId: number, token: string) {
  const mapa = chavesDasMinhasMensagens();
  mapa[String(mensagemId)] = token;
  gravar(CHAVE_TOKENS, mapa);
}
export function esquecerChave(mensagemId: number) {
  const mapa = chavesDasMinhasMensagens();
  delete mapa[String(mensagemId)];
  gravar(CHAVE_TOKENS, mapa);
}
export const apelidoGuardado = () => ler<string>(CHAVE_APELIDO, "");
export const guardarApelido = (apelido: string) => gravar(CHAVE_APELIDO, apelido);

export function dataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
