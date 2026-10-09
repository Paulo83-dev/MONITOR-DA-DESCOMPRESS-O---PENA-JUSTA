"use client";

import { useState } from "react";
import { FONTES } from "@/data/fontes";
import { MAPA_ALTURA, MAPA_LARGURA, MAPA_UF } from "@/data/mapa-uf";
import { SITUACOES, UFS, UFS_ORDENADAS, contagemPorSituacao, type Situacao } from "@/data/ufs";
import { dataCurta } from "@/lib/formato";

const ORDEM: Situacao[] = ["documentado", "informado", "em_implantacao", "sem_informacao"];

// O DF é uma ilha dentro de Goiás: desenhar por último para ele não ficar escondido.
const ORDEM_DE_DESENHO = [...UFS].sort((a, b) => Number(a.sigla === "DF") - Number(b.sigla === "DF"));
const POR_SIGLA = [...UFS].sort((a, b) => a.sigla.localeCompare(b.sigla));

/** Mapa do Brasil com os estados clicáveis, siglas dos estados pequenos fora do contorno e painel de detalhes. */
export default function MapaUF() {
  const [sigla, setSigla] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const uf = UFS.find((u) => u.sigla === sigla) ?? null;
  const contagem = contagemPorSituacao();
  const alternar = (s: string) => setSigla((atual) => (atual === s ? null : s));
  const realces = [...new Set([sobre, sigla].filter((s): s is string => Boolean(s)))];

  return (
    <div className="stack">
      <div className="mapa-bloco">
        <div className="mapa-coluna">
          <svg
            className="mapa-svg"
            viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
            role="group"
            aria-label="Mapa do Brasil por estado. Para escolher um estado pelo teclado, use os botões com as siglas abaixo do mapa."
          >
            <defs>
              <pattern id="mapa-hachura" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect className="hachura-fundo" width="9" height="9" />
                <line className="hachura-linha" x1="0" y1="0" x2="0" y2="9" strokeWidth="3.4" />
              </pattern>
            </defs>

            <g>
              {ORDEM_DE_DESENHO.map((u) => (
                <path
                  key={u.sigla}
                  d={MAPA_UF[u.sigla].d}
                  fillRule="evenodd"
                  className={`uf-forma s-${u.situacao}`}
                  aria-hidden="true"
                  onClick={() => alternar(u.sigla)}
                  onPointerEnter={() => setSobre(u.sigla)}
                  onPointerLeave={() => setSobre(null)}
                >
                  <title>{`${u.nome}: ${SITUACOES[u.situacao].rotulo}`}</title>
                </path>
              ))}
            </g>

            {/* Contorno por cima, para o realce não ficar escondido atrás do estado vizinho. */}
            <g pointerEvents="none">
              {realces.map((s) => (
                <path key={s} d={MAPA_UF[s].d} fillRule="evenodd" className={`uf-realce${s === sigla ? " escolhido" : ""}`} />
              ))}
            </g>

            <g aria-hidden="true">
              {UFS.map((u) => {
                const f = MAPA_UF[u.sigla];
                if (f.dentro) {
                  return (
                    <text key={u.sigla} x={f.x} y={f.y} className={`mapa-sigla s-${u.situacao}`} textAnchor="middle" dominantBaseline="central" pointerEvents="none">
                      {u.sigla}
                    </text>
                  );
                }
                if (!f.fora) return null;
                return (
                  <g key={u.sigla} className="mapa-fora" onClick={() => alternar(u.sigla)} onPointerEnter={() => setSobre(u.sigla)} onPointerLeave={() => setSobre(null)}>
                    <line x1={f.x} y1={f.y} x2={f.fora.x - 3} y2={f.fora.y} className="mapa-linha" />
                    <circle cx={f.x} cy={f.y} r="3.4" className="mapa-ponto" />
                    <rect x={f.fora.x - 2} y={f.fora.y - 16} width="52" height="32" className="mapa-toque" />
                    <text x={f.fora.x + 4} y={f.fora.y} className="mapa-sigla fora" dominantBaseline="central">
                      {u.sigla}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="legenda" aria-label="Legenda do mapa">
            {ORDEM.map((s) => (
              <span key={s}><i className={`s-${s}`} />{SITUACOES[s].rotulo}</span>
            ))}
          </div>

          <div className="uf-chips" role="group" aria-label="Escolher um estado">
            {POR_SIGLA.map((u) => (
              <button
                key={u.sigla}
                type="button"
                className={`uf-chip s-${u.situacao}`}
                aria-pressed={sigla === u.sigla}
                aria-label={`${u.nome}: ${SITUACOES[u.situacao].rotulo}`}
                title={u.nome}
                onClick={() => alternar(u.sigla)}
              >
                {u.sigla}
              </button>
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
              <p className="muted">Clique em um estado do mapa (ou na sigla dele) para ver o que se sabe sobre as salas de descompressão naquela UF e de onde vem cada informação.</p>
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

      <p className="fonte">
        Limites dos estados:{" "}
        <a href={FONTES.ibgeMalhas.url} target="_blank" rel="noopener noreferrer">{FONTES.ibgeMalhas.orgao}, malhas geográficas</a>, com os contornos simplificados.
      </p>
    </div>
  );
}
