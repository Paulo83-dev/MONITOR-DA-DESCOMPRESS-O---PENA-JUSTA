"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CATEGORIAS, LIMITES } from "@/data/forum";
import { UFS_ORDENADAS } from "@/data/ufs";
import { apelidoGuardado, chamar, guardarApelido, guardarChave, novoToken } from "./cliente";

type Props =
  | { modo: "topico" }
  | { modo: "resposta"; topicoId: number; aoPublicar: () => void };

type Retorno = { topicoId?: number; mensagemId: number; status: "visivel" | "retida" };

/** Formulário de novo tópico ou de resposta. Anônimo: só pede um apelido, que pode ficar em branco. */
export default function FormForum(props: Props) {
  const router = useRouter();
  const abertoEm = useRef(0);
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0].id);
  const [uf, setUf] = useState("");
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [apelido, setApelido] = useState("");
  const [aceite, setAceite] = useState(false);
  const [comoModeracao, setComoModeracao] = useState(false);
  const [ehModerador, setEhModerador] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    abertoEm.current = Date.now();
    queueMicrotask(() => setApelido(apelidoGuardado()));
    let vivo = true;
    chamar<{ logado: boolean }>("/api/mod/sessao").then((r) => {
      if (vivo && r.ok && r.dados.logado) setEhModerador(true);
    });
    return () => { vivo = false; };
  }, []);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setAviso(null);
    setEnviando(true);
    const token = novoToken();
    const site = (e.currentTarget.elements.namedItem("site") as HTMLInputElement | null)?.value ?? "";
    const base = { corpo, apelido, token, tempoMs: Date.now() - abertoEm.current, site, aceite, comoModeracao: comoModeracao || undefined };
    const r =
      props.modo === "topico"
        ? await chamar<Retorno>("/api/forum/topicos", { corpo: { ...base, titulo, categoria, uf: uf || undefined } })
        : await chamar<Retorno>(`/api/forum/topicos/${props.topicoId}/mensagens`, { corpo: base });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    if (apelido.trim()) guardarApelido(apelido.trim());
    if (r.dados.mensagemId) guardarChave(r.dados.mensagemId, token);
    if (r.dados.status === "retida") {
      setAviso("Sua mensagem foi enviada e vai aparecer depois que a moderação revisar. Não precisa enviar de novo.");
      setCorpo("");
      setTitulo("");
      return;
    }
    setCorpo("");
    if (props.modo === "resposta") {
      props.aoPublicar();
    } else if (r.dados.topicoId) {
      router.push(`/forum/${r.dados.topicoId}`);
    }
  }

  return (
    <form className="form-forum" onSubmit={enviar} noValidate>
      {props.modo === "topico" ? (
        <>
          <div className="campo">
            <label htmlFor="f-categoria">Categoria</label>
            <select id="f-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
            </select>
            <p className="dica">{CATEGORIAS.find((c) => c.id === categoria)?.descricao}</p>
          </div>
          <div className="campo">
            <label htmlFor="f-uf">Estado (opcional)</label>
            <select id="f-uf" value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">Nenhum</option>
              {UFS_ORDENADAS.map((u) => <option key={u.sigla} value={u.sigla}>{u.nome} ({u.sigla})</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="f-titulo">Título</label>
            <input id="f-titulo" value={titulo} maxLength={LIMITES.titulo} onChange={(e) => setTitulo(e.target.value)} required autoComplete="off" />
          </div>
        </>
      ) : null}

      <div className="campo">
        <label htmlFor="f-corpo">{props.modo === "topico" ? "Mensagem" : "Sua resposta"}</label>
        <textarea id="f-corpo" value={corpo} maxLength={LIMITES.corpo} rows={props.modo === "topico" ? 8 : 5} onChange={(e) => setCorpo(e.target.value)} required />
        <p className="dica">{corpo.length} de {LIMITES.corpo} caracteres. Links são aceitos, no máximo dois por mensagem. Não envie fotos nem dados de pessoas.</p>
      </div>

      <div className="campo">
        <label htmlFor="f-apelido">Apelido (opcional)</label>
        <input id="f-apelido" value={apelido} maxLength={LIMITES.apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Anônimo" autoComplete="off" />
        <p className="dica">Aparece junto da mensagem. Evite um apelido que revele quem você é.</p>
      </div>

      {/* Campo-armadilha para robôs: pessoas não veem nem preenchem. */}
      <div className="armadilha" aria-hidden="true">
        <label htmlFor="f-site">Site</label>
        <input id="f-site" name="site" tabIndex={-1} autoComplete="off" />
      </div>

      {ehModerador ? (
        <label className="marcar">
          <input type="checkbox" checked={comoModeracao} onChange={(e) => setComoModeracao(e.target.checked)} />
          Publicar como Moderação
        </label>
      ) : null}

      <label className="marcar">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
        <span>Li as <Link href="/regras" target="_blank">regras do fórum</Link> e sei que a mensagem fica pública.</span>
      </label>

      {erro ? <p className="msg-erro" role="alert">{erro}</p> : null}
      {aviso ? <p className="msg-aviso" role="status">{aviso}</p> : null}

      <div>
        <button type="submit" className="btn btn-primario" disabled={enviando || !aceite || corpo.trim().length < 2 || (props.modo === "topico" && titulo.trim().length < 5)}>
          {enviando ? "Enviando…" : props.modo === "topico" ? "Publicar tópico" : "Publicar resposta"}
        </button>
      </div>
    </form>
  );
}
