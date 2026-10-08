"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CATEGORIAS, CATEGORIA_POR_ID, type CategoriaId } from "@/data/forum";
import { UFS_ORDENADAS } from "@/data/ufs";
import { chamar, dataHora } from "./cliente";

type Topico = { id: number; titulo: string; categoria: CategoriaId; uf: string | null; apelido: string; criado_em: string; ultima_atividade: string; mensagens: number };
type Lista = { topicos: Topico[]; temMais: boolean };

export default function ForumLista() {
  const [categoria, setCategoria] = useState("");
  const [uf, setUf] = useState("");
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<{ texto: string; configuracao: boolean } | null>(null);

  const carregar = useCallback(async (p: number, cat: string, estado: string) => {
    setCarregando(true);
    const q = new URLSearchParams({ pagina: String(p) });
    if (cat) q.set("categoria", cat);
    if (estado) q.set("uf", estado);
    const r = await chamar<Lista>(`/api/forum/topicos?${q}`);
    setCarregando(false);
    if (!r.ok) {
      setErro({ texto: r.erro, configuracao: r.motivo === "em-configuracao" });
      return;
    }
    setErro(null);
    setTopicos((antigos) => (p === 0 ? r.dados.topicos : [...antigos, ...r.dados.topicos]));
    setTemMais(r.dados.temMais);
    setPagina(p);
  }, []);

  useEffect(() => {
    queueMicrotask(() => carregar(0, categoria, uf));
  }, [carregar, categoria, uf]);

  return (
    <div className="stack">
      <div className="forum-filtros">
        <div className="sala-barra" role="group" aria-label="Categorias">
          <button type="button" className="btn btn-sm" aria-pressed={categoria === ""} onClick={() => setCategoria("")}>Todas</button>
          {CATEGORIAS.map((c) => (
            <button key={c.id} type="button" className="btn btn-sm" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)} title={c.descricao}>
              {c.rotulo}
            </button>
          ))}
        </div>
        <div className="campo campo-linha">
          <label htmlFor="filtro-uf">Estado</label>
          <select id="filtro-uf" value={uf} onChange={(e) => setUf(e.target.value)}>
            <option value="">Todos</option>
            {UFS_ORDENADAS.map((u) => <option key={u.sigla} value={u.sigla}>{u.nome}</option>)}
          </select>
        </div>
        <Link href="/forum/novo" className="btn btn-primario">Novo tópico</Link>
      </div>

      {erro ? (
        <div className={`aviso-caixa ${erro.configuracao ? "atencao" : "erro"}`} role="alert">
          <h3>{erro.configuracao ? "Fórum em configuração" : "Não foi possível carregar"}</h3>
          <p>{erro.texto}</p>
        </div>
      ) : null}

      {!erro && !carregando && topicos.length === 0 ? (
        <div className="aviso-caixa">
          <h3>Ainda não há tópicos aqui</h3>
          <p>Seja a primeira pessoa a escrever. Conte como é a sala da sua unidade ou pergunte o que quiser sobre as salas de descompressão.</p>
        </div>
      ) : null}

      {topicos.length ? (
        <ul className="topicos">
          {topicos.map((t) => (
            <li key={t.id}>
              <Link href={`/forum/${t.id}`} className="topico">
                <h3>{t.titulo}</h3>
                <p className="topico-meta">
                  <span className="etiqueta">{CATEGORIA_POR_ID[t.categoria]?.rotulo ?? t.categoria}</span>
                  {t.uf ? <span className="etiqueta ok">{t.uf}</span> : null}
                  <span>por {t.apelido}</span>
                  <span>{t.mensagens} {t.mensagens === 1 ? "mensagem" : "mensagens"}</span>
                  <span>última atividade em {dataHora(t.ultima_atividade)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {carregando ? <p className="muted ui" role="status">Carregando…</p> : null}
      {temMais && !carregando ? (
        <div><button type="button" className="btn" onClick={() => carregar(pagina + 1, categoria, uf)}>Ver mais tópicos</button></div>
      ) : null}
    </div>
  );
}
