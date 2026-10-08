import type { Metadata } from "next";
import { DOCUMENTOS } from "@/data/documentos";

export const metadata: Metadata = {
  title: "Documentos",
  description: "Baixe o Plano Nacional Pena Justa, o II Informe ao STF e outros documentos sobre as salas de descompressão.",
};

export default function Documentos() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Para baixar</p>
        <h1>Documentos</h1>
        <p className="lead">
          Cópias de documentos públicos usados no Monitor. Em caso de dúvida, vale sempre a versão oficial, que tem o link ao lado.
        </p>
      </header>

      <ul className="docs ui">
        {DOCUMENTOS.map((d) => (
          <li key={d.id} className="doc">
            <div>
              <h3>{d.titulo}</h3>
              <p className="doc-meta">{d.orgao} · {d.data}{d.tamanhoMB ? ` · PDF, ${d.tamanhoMB.toLocaleString("pt-BR")} MB` : ""}</p>
              <p>{d.descricao}</p>
              {d.nota ? <p className="fonte">{d.nota}</p> : null}
            </div>
            <div className="doc-acoes">
              {d.arquivo ? (
                <a className="btn btn-primario" href={d.arquivo} download>
                  Baixar PDF
                </a>
              ) : null}
              <a className="btn" href={d.fonteUrl} target="_blank" rel="noopener noreferrer">
                {d.arquivo ? "Ver na fonte" : "Abrir na fonte"}
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="fonte leitura">
        Está faltando um documento? Sugira no fórum, na categoria “Sugestões para o site”, com o link da fonte oficial.
      </p>
    </div>
  );
}
