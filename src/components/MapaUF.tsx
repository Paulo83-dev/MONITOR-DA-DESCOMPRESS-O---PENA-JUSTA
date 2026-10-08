"use client";

import { useState } from "react";
import { SITUACOES, UFS, UFS_ORDENADAS, contagemPorSituacao, type Situacao } from "@/data/ufs";
import { dataCurta } from "@/lib/formato";

const ORDEM: Situacao[] = ["documentado", "informado", "em_implantacao", "sem_informacao"];

/** Mapa do Brasil em grade (um quadrado por UF) com a situação de cada estado e painel de detalhes. */
export default function MapaUF() {
  const [sigla, setSigla] = useState<string | null>(null);
  const uf = UFS.find((u) => u.sigla === sigla) ?? null;
  const contagem = contagemPorSituacao();

  return (
    <div className="stack">
      <div className="mapa-bloco">
        <div>
          <div className="mapa" role="group" aria-label="Mapa do Brasil por estado">
            {UFS.map((u) => (
              <button
                key={u.sigla}
                type="button"
                className={`uf s-${u.situacao}`}
                style={{ gridColumn: u.col + 1, gridRow: u.row + 1 }}
                aria-pressed={sigla === u.sigla}
                aria-label={`${u.nome}: ${SITUACOES[u.situacao].rotulo}`}
                onClick={() => setSigla(sigla === u.sigla ? null : u.sigla)}
              >
                {u.sigla}
              </button>
            ))}
          </div>
          <div className="legenda" aria-label="Legenda do mapa">
            {ORDEM.map((s) => (
              <span key={s}><i className={`s-${s}`} />{SITUACOES[s].rotulo}</span>
            ))}
          </div>
        </div>

        <div className="uf-detalhe" aria-live="polite">
          {uf ? (
            <>
              <div>
                <p className="eyebrow">{uf.regiao}</p>
                <h3>{uf.nome}</h3>
              </div>
              <p><span className={`etiqueta ${uf.situacao === "documentado" ? "ok" : uf.situacao === "em_implantacao" ? "aviso" : ""}`}>{SITUACOES[uf.situacao].rotulo}</span></p>
              <p>{uf.resumo}</p>
              {uf.numeros ? (
                <dl>
                  {uf.numeros.map((n) => (
                    <div key={n.rotulo}>
                      <dt>{n.rotulo}</dt>
                      <dd>{n.valor}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <div>
                <h4>Fontes</h4>
                <ul>
                  {uf.fontes.map((f) => (
                    <li key={f.url}>
                      <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a>
                      <span className="muted"> · {f.orgao}{f.data ? `, ${dataCurta(f.data)}` : ""}</span>
                      {f.nota ? <span className="muted"> ({f.nota})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <h3>Escolha um estado</h3>
              <p className="muted">Clique em uma sigla do mapa para ver o que se sabe sobre as salas de descompressão naquela UF e de onde vem cada informação.</p>
              <div className="resumo-situacoes">
                {ORDEM.map((s) => (
                  <span key={s}><b>{contagem[s]}</b>{SITUACOES[s].rotulo}</span>
                ))}
              </div>
              <p className="fonte">As cores mostram o que foi informado ao CNJ ou noticiado, não uma vistoria. “Sem informação” não prova que a UF não tenha salas.</p>
            </>
          )}
        </div>
      </div>

      <details className="tabela-detalhe">
        <summary className="btn btn-sm">Ver todos os estados em tabela</summary>
        <div className="tabela-rolagem" style={{ marginTop: "0.75rem" }}>
          <table>
            <thead>
              <tr><th>UF</th><th>Estado</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {UFS_ORDENADAS.map((u) => (
                <tr key={u.sigla}>
                  <td className="codigo">{u.sigla}</td>
                  <td>{u.nome}</td>
                  <td>{SITUACOES[u.situacao].rotulo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
