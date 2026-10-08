"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { CATEGORIA_POR_ID, MOTIVOS_DENUNCIA, type CategoriaId } from "@/data/forum";
import { separarLinks } from "@/lib/texto";
import FormForum from "./FormForum";
import { chamar, chavesDasMinhasMensagens, dataHora, esquecerChave } from "./cliente";

type Mensagem = { id: number; corpo: string; apelido: string; da_moderacao: boolean; criado_em: string; status: "visivel" | "oculta" | "removida" };
type Dados = {
  topico: { id: number; titulo: string; categoria: CategoriaId; uf: string | null; apelido: string; criado_em: string };
  mensagens: Mensagem[];
};

/** Texto da mensagem: parágrafos preservados e links http(s) clicáveis. Nada é interpretado como HTML. */
function Texto({ corpo }: { corpo: string }) {
  return (
    <div className="mensagem-texto">
      {corpo.split(/\n{2,}/).map((par, i) => (
        <p key={i}>
          {par.split("\n").map((linha, j) => (
            <Fragment key={j}>
              {j > 0 ? <br /> : null}
              {separarLinks(linha).map((t, k) =>
                t.tipo === "link" ? (
                  <a key={k} href={t.href} target="_blank" rel="nofollow ugc noopener noreferrer">{t.valor}</a>
                ) : (
                  <Fragment key={k}>{t.valor}</Fragment>
                ),
              )}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

export default function TopicoView({ id }: { id: number }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [minhas, setMinhas] = useState<Record<string, string>>({});
  const [denunciando, setDenunciando] = useState<number | null>(null);
  const [motivo, setMotivo] = useState<string>(MOTIVOS_DENUNCIA[0]);
  const [avisos, setAvisos] = useState<Record<number, string>>({});

  const carregar = useCallback(async () => {
    const r = await chamar<Dados>(`/api/forum/topicos/${id}`);
    if (!r.ok) {
      setErro(r.status === 404 ? "Este tópico não existe ou ainda não foi publicado." : r.erro);
      return;
    }
    setErro(null);
    setDados(r.dados);
    setMinhas(chavesDasMinhasMensagens());
  }, [id]);

  useEffect(() => {
    queueMicrotask(carregar);
  }, [carregar]);

  async function denunciar(mensagemId: number) {
    const r = await chamar(`/api/forum/mensagens/${mensagemId}/denunciar`, { corpo: { motivo } });
    setDenunciando(null);
    setAvisos((a) => ({ ...a, [mensagemId]: r.ok ? "Denúncia enviada. Obrigado por avisar." : r.erro }));
    if (r.ok) carregar();
  }

  async function apagar(mensagemId: number) {
    const token = minhas[String(mensagemId)];
    if (!token) return;
    const r = await chamar(`/api/forum/mensagens/${mensagemId}`, { metodo: "DELETE", corpo: { token } });
    if (r.ok) {
      esquecerChave(mensagemId);
      carregar();
    } else {
      setAvisos((a) => ({ ...a, [mensagemId]: r.erro }));
    }
  }

  if (erro) {
    return (
      <div className="stack">
        <div className="aviso-caixa erro" role="alert"><h3>Não foi possível abrir</h3><p>{erro}</p></div>
        <p><Link href="/forum">Voltar ao fórum</Link></p>
      </div>
    );
  }
  if (!dados) return <p className="muted ui" role="status">Carregando…</p>;

  const { topico, mensagens } = dados;
  return (
    <div className="stack">
      <p className="ui"><Link href="/forum">← Todos os tópicos</Link></p>
      <header className="pagina-topo" style={{ gap: "0.5rem" }}>
        <p className="topico-meta">
          <span className="etiqueta">{CATEGORIA_POR_ID[topico.categoria]?.rotulo ?? topico.categoria}</span>
          {topico.uf ? <span className="etiqueta ok">{topico.uf}</span> : null}
        </p>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}>{topico.titulo}</h1>
      </header>

      <ol className="mensagens">
        {mensagens.map((m) => (
          <li key={m.id} className={`mensagem${m.da_moderacao ? " da-moderacao" : ""}`} id={`m${m.id}`}>
            <div className="mensagem-topo">
              <strong>{m.apelido}</strong>
              {m.da_moderacao ? <span className="etiqueta aviso">Moderação</span> : null}
              <time dateTime={m.criado_em} className="muted">{dataHora(m.criado_em)}</time>
            </div>
            {m.status === "visivel" ? (
              <Texto corpo={m.corpo} />
            ) : (
              <p className="muted ui mensagem-removida">
                {m.status === "oculta" ? "Mensagem ocultada, aguardando revisão da moderação." : "Mensagem removida."}
              </p>
            )}
            {m.status === "visivel" ? (
              <div className="mensagem-acoes">
                {denunciando === m.id ? (
                  <span className="denuncia-form">
                    <label htmlFor={`mot-${m.id}`} className="sr-only">Motivo da denúncia</label>
                    <select id={`mot-${m.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                      {MOTIVOS_DENUNCIA.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <button type="button" className="btn btn-sm btn-perigo" onClick={() => denunciar(m.id)}>Enviar denúncia</button>
                    <button type="button" className="btn btn-sm" onClick={() => setDenunciando(null)}>Cancelar</button>
                  </span>
                ) : (
                  <>
                    <button type="button" className="btn btn-sm" onClick={() => { setDenunciando(m.id); setAvisos((a) => ({ ...a, [m.id]: "" })); }}>Denunciar</button>
                    {minhas[String(m.id)] ? <button type="button" className="btn btn-sm" onClick={() => apagar(m.id)}>Apagar a minha mensagem</button> : null}
                  </>
                )}
                {avisos[m.id] ? <span className="muted ui" role="status">{avisos[m.id]}</span> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <section className="stack" aria-labelledby="h-responder">
        <h2 id="h-responder" style={{ fontSize: "1.4rem" }}>Responder</h2>
        <FormForum modo="resposta" topicoId={id} aoPublicar={carregar} />
      </section>
    </div>
  );
}
