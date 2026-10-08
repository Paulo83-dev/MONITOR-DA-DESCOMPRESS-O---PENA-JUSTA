import { INDICADOR } from "@/data/ufs";
import { percentual } from "@/lib/formato";

const ESCALA_MAX = 60;

/** Barra em escala com o percentual apurado e as metas dos três anos. */
export default function IndicadorNacional() {
  const { apuradoAno1, metas } = INDICADOR;
  return (
    <div className="indicador">
      <div className="indicador-numero">
        <b>{percentual(apuradoAno1)}</b>
        <span>dos estabelecimentos prisionais com espaço de descompressão no Ano 1 (2025)</span>
      </div>
      <div className="escala" role="img" aria-label={`Apurado ${percentual(apuradoAno1)}. Metas: ${metas.map((m) => `Ano ${m.ano}, ${m.valor}%`).join("; ")}.`}>
        <div className="escala-trilho" style={{ marginTop: "1.5rem" }}>
          <div className="escala-barra" style={{ ["--v" as string]: apuradoAno1 }} />
          {metas.map((m) => (
            <div key={m.ano} className={`escala-marco${m.valor === 40 ? " m40" : ""}`} style={{ ["--v" as string]: m.valor }}>
              <span>{m.valor}%</span>
            </div>
          ))}
        </div>
        <div className="escala-eixo" aria-hidden="true">
          {[0, 10, 20, 30, 40, 50, 60].map((v) => (
            <span key={v} style={{ left: `${(v / ESCALA_MAX) * 100}%` }}>{v}</span>
          ))}
        </div>
      </div>
      <p className="indicador-nota">
        Metas do plano: {metas.map((m) => `Ano ${m.ano} (${m.periodo}), ${m.valor}%`).join("; ")}. A meta do Ano 1 foi considerada cumprida, mas só Ceará, Minas Gerais e São Paulo enviaram documentos. Fonte:{" "}
        <a href={INDICADOR.fonteApurado.url} target="_blank" rel="noopener noreferrer">II Informe de Monitoramento ao STF</a> e{" "}
        <a href={INDICADOR.fonteMeta.url} target="_blank" rel="noopener noreferrer">matriz do Plano Nacional</a>.
      </p>
    </div>
  );
}
