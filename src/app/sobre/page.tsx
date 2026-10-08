import type { Metadata } from "next";
import Link from "next/link";
import { FONTES } from "@/data/fontes";
import { SITE } from "@/data/site";
import { ATUALIZADO_EM, INDICADOR, SITUACOES } from "@/data/ufs";
import { dataCurta } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Sobre",
  description: "O que o Plano Pena Justa prevê sobre as salas de descompressão, como o Monitor classifica cada estado e como corrigir um dado.",
};

export default function Sobre() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Sobre o Monitor</p>
        <h1>O que o plano prevê e como este site funciona</h1>
        <p className="lead">
          Um resumo do que está escrito no Pena Justa sobre as salas de descompressão e das regras que o Monitor usa para mostrar o andamento.
        </p>
      </header>

      <section className="duas-colunas" aria-labelledby="h-plano">
        <div className="stack leitura">
          <h2 id="h-plano">O Pena Justa em poucas linhas</h2>
          <p>
            O Pena Justa é o Plano Nacional para o Enfrentamento do Estado de Coisas Inconstitucional nas Prisões Brasileiras. O Supremo Tribunal Federal exigiu o plano ao julgar a ADPF 347, em outubro de 2023. O Conselho Nacional de Justiça (CNJ) e o Ministério da Justiça e Segurança Pública, por meio da Secretaria Nacional de Políticas Penais, elaboraram o texto, lançado em fevereiro de 2025 com três anos de execução.
          </p>
          <p>
            Cada estado e o Distrito Federal fizeram um plano local a partir da matriz nacional. As salas de descompressão estão no Eixo 2, no problema da desvalorização dos servidores penais. O plano diz que esses espaços devem oferecer condições para refeições, descanso e para aliviar as tensões e o estresse das jornadas, e pede atenção às servidoras, que muitas vezes não encontram espaços adequados.
          </p>
          <p className="fonte">
            Fonte: <a href={FONTES.planoNacional.url} target="_blank" rel="noopener noreferrer">Plano Nacional Pena Justa</a>, páginas 133 e 167 a 168 (diagnóstico e ação) e página 357 do PDF (matriz).
          </p>
        </div>
        <div className="stack">
          <h3>Do eixo ao indicador</h3>
          <ol className="cadeia ui">
            <li><span className="nivel">Eixo 2</span><span className="texto">Qualidade da ambiência, dos serviços prestados e da estrutura prisional</span></li>
            <li><span className="nivel">Problema</span><span className="texto">Desvalorização dos(as) servidores(as) penais</span></li>
            <li><span className="nivel">Ação mitigadora</span><span className="texto">Promover a saúde e a segurança no trabalho</span></li>
            <li><span className="nivel">Medida</span><span className="texto">Adequar os espaços físicos com vista ao exercício profissional</span></li>
            <li><span className="nivel">Meta geral</span><span className="texto">Criação de espaços de descompressão nos estabelecimentos prisionais aos(às) servidores(as) penais</span></li>
            <li><span className="nivel">Indicador {INDICADOR.codigo}</span><span className="texto">{INDICADOR.descricao}</span></li>
          </ol>
        </div>
      </section>

      <section className="stack" aria-labelledby="h-metas">
        <h2 id="h-metas">A meta, no formato da matriz</h2>
        <div className="ficha" role="group" aria-label="Ficha do indicador na matriz nacional">
          <div className="ficha-topo">Eixo 2 · Desvalorização dos(as) servidores(as) penais · Promover a saúde e a segurança no trabalho</div>
          <div className="ficha-linha"><span>Medida</span><span>Adequar os espaços físicos com vista ao exercício profissional</span></div>
          <div className="ficha-linha"><span>Atores</span><span>MJSP · Secretarias estaduais de administração penitenciária ou congêneres · Escola Nacional de Serviços Penais (ESPEN) · Escolas estaduais penitenciárias</span></div>
          <div className="ficha-linha"><span>Indicador</span><span>{INDICADOR.descricao}</span></div>
          <div className="ficha-metas">
            <div><span>Meta final</span><b>40%</b></div>
            {INDICADOR.metas.map((m) => (
              <div key={m.ano}><span>Ano {m.ano} ({m.periodo})</span><b>{m.valor}%</b></div>
            ))}
          </div>
          <div className="ficha-codigo"><span>Código do indicador</span><b>{INDICADOR.codigo}</b></div>
        </div>
        <div className="tabela-rolagem">
          <table>
            <caption className="fonte" style={{ captionSide: "bottom", textAlign: "left", padding: "0.6rem 0.85rem" }}>
              Indicadores da mesma ação mitigadora na matriz nacional.
            </caption>
            <thead><tr><th>Código</th><th>Indicador</th><th>Metas</th></tr></thead>
            <tbody>
              <tr><td className="codigo">2.5.1.1.1.1</td><td>Estabelecimentos com espaço de descompressão</td><td className="d">10% · 20% · 40%</td></tr>
              <tr><td className="codigo">2.5.1.1.2.1</td><td>Estabelecimentos com espaço adequado para refeições</td><td className="d">30% · 60% · 100%</td></tr>
              <tr><td className="codigo">2.5.1.2.1.1</td><td>Núcleos de Saúde e Qualidade de Vida implantados (saúde mental)</td><td className="d">por UF</td></tr>
              <tr><td className="codigo">2.5.1.2.2.1</td><td>Política de Saúde Integral dos Trabalhadores do Sistema Prisional</td><td className="d">ato normativo</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="duas-colunas" aria-labelledby="h-nao-define">
        <div className="stack leitura">
          <h2 id="h-nao-define">O que o plano não define</h2>
          <div className="aviso-caixa atencao">
            <h3>Sem tamanho, layout ou lista de móveis</h3>
            <p>
              O Pena Justa fixa a meta e o indicador, mas não define área mínima, layout nem mobiliário. Até {dataCurta(ATUALIZADO_EM)} não encontramos nota técnica do CNJ, da SENAPPEN ou do CNPCP com esse detalhamento. Cada estado decide o projeto da própria sala.
            </p>
          </div>
          <p>
            As Diretrizes Básicas para Arquitetura Penal (Resolução CNPCP nº 9/2011) são a referência nacional para projetos de unidades. Elas preveem ambientes para os agentes, mas nenhum é uma sala de descompressão. A sala é, portanto, um espaço a mais, diferente do dormitório e do refeitório. A <Link href="/sala">simulação em 3D</Link> usa as referências de estados e de um estudo da UFAL para sugerir como ela pode ser montada.
          </p>
        </div>
        <div className="tabela-rolagem">
          <table>
            <caption className="fonte" style={{ captionSide: "bottom", textAlign: "left", padding: "0.6rem 0.85rem" }}>
              Ambientes para agentes nas Diretrizes Básicas para Arquitetura Penal (CNPCP, 2011).
            </caption>
            <thead><tr><th>Ambiente</th><th className="d">Área mínima</th></tr></thead>
            <tbody>
              <tr><td>Dormitório dos agentes (5% do efetivo)</td><td className="d">3,60 m² por beliche</td></tr>
              <tr><td>Sala para agentes</td><td className="d">9,00 m²</td></tr>
              <tr><td>Sala de chefia dos agentes</td><td className="d">9,00 m²</td></tr>
              <tr><td>Instalação sanitária para agentes</td><td className="d">2,25 m²</td></tr>
              <tr><td>Vestiários masculino e feminino</td><td className="d">conforme projeto</td></tr>
              <tr><td>Refeitório para agentes e funcionários</td><td className="d">sem área fixa</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack leitura" aria-labelledby="h-metodo">
        <h2 id="h-metodo">Como o Monitor classifica cada estado</h2>
        <p>O mapa usa quatro situações. Elas dizem o que foi informado ou noticiado, não o que uma vistoria encontrou.</p>
        <dl className="stack ui" style={{ margin: 0 }}>
          {(Object.keys(SITUACOES) as (keyof typeof SITUACOES)[]).map((s) => (
            <div key={s}>
              <dt><b>{SITUACOES[s].rotulo}</b></dt>
              <dd style={{ margin: 0 }}>{SITUACOES[s].descricao}</dd>
            </div>
          ))}
        </dl>
        <p>
          Os dados ficam em arquivos públicos do repositório e são atualizados à mão, a partir de documentos e notícias, com a data da última conferência ({dataCurta(ATUALIZADO_EM)}). “Sem informação” significa só que a UF não aparece entre as que informaram ter espaços no II Informe, o que não prova que ela não tenha salas.
        </p>
      </section>

      <section className="stack leitura" aria-labelledby="h-corrigir">
        <h2 id="h-corrigir">Encontrou um erro ou tem uma informação nova?</h2>
        <p>
          Conte no <Link href="/forum">fórum</Link>, na categoria “Sugestões para o site”, de preferência com o link da fonte. Quem conhece o código também pode propor a correção direto no{" "}
          <a href={SITE.repositorio} target="_blank" rel="noopener noreferrer">repositório do GitHub</a>.
        </p>
        <p className="muted ui" style={{ fontSize: "0.875rem" }}>
          Este é um projeto independente. Não tem vínculo com o CNJ, o Ministério da Justiça, a SENAPPEN ou qualquer secretaria estadual, e a simulação 3D é ilustrativa: não substitui projeto arquitetônico.
        </p>
      </section>
    </div>
  );
}
