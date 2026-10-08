import Link from "next/link";
import IndicadorNacional from "@/components/IndicadorNacional";
import MapaUF from "@/components/MapaUF";
import { NOVIDADES } from "@/data/novidades";
import { dataLonga } from "@/lib/formato";

export default function Painel() {
  const novidades = [...NOVIDADES].reverse();
  return (
    <>
      <section className="container hero" aria-labelledby="titulo">
        <p className="eyebrow">Plano Pena Justa · Eixo 2 · desvalorização dos servidores penais</p>
        <h1 id="titulo">Como andam as salas de descompressão dos policiais penais?</h1>
        <p className="lead">
          O Pena Justa manda criar espaços de descompressão nos estabelecimentos prisionais. Este painel reúne o que já foi informado, o que foi comprovado e o que foi noticiado, com a fonte de cada dado.
        </p>
        <IndicadorNacional />
      </section>

      <section className="secao" aria-labelledby="h-mapa">
        <div className="container">
          <div className="secao-topo">
            <p className="eyebrow">Estado por estado</p>
            <h2 id="h-mapa">Onde há salas, segundo as fontes públicas</h2>
          </div>
          <MapaUF />
        </div>
      </section>

      <section className="secao" aria-labelledby="h-novidades">
        <div className="container">
          <div className="secao-topo">
            <p className="eyebrow">Linha do tempo</p>
            <h2 id="h-novidades">Últimas novidades</h2>
          </div>
          <ol className="linha-do-tempo">
            {novidades.map((n) => (
              <li key={n.data + n.titulo} className="evento">
                <time dateTime={n.data}>{dataLonga(n.data)}</time>
                <div>
                  <h3>{n.titulo}{n.uf ? <> <span className="etiqueta">{n.uf}</span></> : null}</h3>
                  <p>{n.texto}</p>
                  <p className="fonte">
                    Fonte: <a href={n.fonte.url} target="_blank" rel="noopener noreferrer">{n.fonte.titulo}</a> ({n.fonte.orgao})
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="secao" aria-labelledby="h-explorar">
        <div className="container">
          <div className="secao-topo">
            <p className="eyebrow">Explore</p>
            <h2 id="h-explorar">Monte a sua sala, converse e baixe os documentos</h2>
          </div>
          <div className="entradas">
            <Link href="/sala" className="entrada">
              <h3>Sala em 3D</h3>
              <p>Escolha entre 24, 40 e 60 m², ligue as áreas e veja o móvel, a fonte e o preço de referência.</p>
              <span className="seta">Abrir a sala →</span>
            </Link>
            <Link href="/forum" className="entrada">
              <h3>Fórum anônimo</h3>
              <p>Conte como é a sala da sua unidade, tire dúvidas e troque ideias de montagem com outros policiais penais.</p>
              <span className="seta">Entrar no fórum →</span>
            </Link>
            <Link href="/documentos" className="entrada">
              <h3>Documentos</h3>
              <p>O Plano Nacional Pena Justa, o II Informe ao STF e outras normas, para baixar.</p>
              <span className="seta">Ver os documentos →</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
