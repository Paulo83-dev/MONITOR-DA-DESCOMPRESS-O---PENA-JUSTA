"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, ITENS, ITEM_POR_ID, type AreaId, type Item, type ItemId } from "@/data/itens";
import { LAYOUTS, TAMANHOS, type Tamanho } from "@/data/layouts";
import { contagemDeItens, resumoDeCustos } from "@/lib/custos";
import { dataCurta, reais } from "@/lib/formato";
import { SalaEngine, type Vista } from "./engine/SalaEngine";

const ROTULO_VISTA: Record<Vista, string> = {
  geral: "Visão geral",
  descanso: "Descanso e TV",
  cochilo: "Cochilo",
  exercicio: "Exercício",
  convivencia: "Convivência",
  leitura: "Leitura",
  apoio: "Apoio",
  planta: "Planta baixa",
};

function Referencias({ item }: { item: Item }) {
  return (
    <ul className="sala-refs">
      {item.referencias.map((r, i) => (
        <li key={i}>
          <span>{r.trecho}</span>{" "}
          <a href={r.fonte.url} target="_blank" rel="noopener noreferrer">
            {r.fonte.orgao}: {r.fonte.titulo}
          </a>
          {r.fonte.data ? ` (${dataCurta(r.fonte.data)})` : ""}
          {r.fonte.nota ? <em className="sala-nota"> {r.fonte.nota}</em> : null}
        </li>
      ))}
    </ul>
  );
}

function Custos({ item }: { item: Item }) {
  return (
    <ul className="sala-custos">
      {item.custos.map((c, i) => (
        <li key={i}>
          {c.qtd > 1 ? `${c.qtd} × ` : ""}
          {c.rotulo}:{" "}
          {c.unitario !== undefined ? (
            <strong>{reais(c.unitario)}</strong>
          ) : (
            <span className="sem-preco">preço não informado</span>
          )}
          {c.unitario !== undefined && c.fonte ? (
            <>
              {" "}
              <a href={c.fonte.url} target="_blank" rel="noopener noreferrer">fonte</a>
            </>
          ) : null}
          {c.obs ? <em className="sala-nota"> {c.obs}</em> : null}
        </li>
      ))}
    </ul>
  );
}

export default function SalaViewer() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SalaEngine | null>(null);
  const aplicado = useRef<Tamanho>("padrao");

  const [tamanho, setTamanho] = useState<Tamanho>("padrao");
  const [desligadas, setDesligadas] = useState<AreaId[]>([]);
  const [luz, setLuz] = useState<"plantao" | "relax">("plantao");
  const [paredes, setParedes] = useState<"pastel" | "neutro">("pastel");
  const [medidas, setMedidas] = useState(false);
  const [marcadores, setMarcadores] = useState(true);
  const [andando, setAndando] = useState(false);
  const [vista, setVista] = useState<Vista | null>("geral");
  const [selecionado, setSelecionado] = useState<ItemId | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const layout = LAYOUTS[tamanho];
  const areasDoLayout = useMemo(() => AREAS.filter((a) => layout.instancias.some((i) => i.area === a.id)), [layout]);
  const ativas = useMemo(
    () => new Set<AreaId>(areasDoLayout.map((a) => a.id).filter((id) => !desligadas.includes(id))),
    [areasDoLayout, desligadas],
  );
  const chaveAreas = [...ativas].sort().join(",");

  const resumo = useMemo(() => resumoDeCustos(layout, ativas), [layout, ativas]);
  const contagem = useMemo(() => contagemDeItens(layout, ativas), [layout, ativas]);
  const itensPresentes = ITENS.filter((i) => contagem.has(i.id));
  const vistas: Vista[] = ["geral", ...areasDoLayout.map((a) => a.id as Vista), "planta"];

  useEffect(() => {
    if (!hostRef.current || !viewerRef.current || !overlayRef.current) return;
    // Um canvas novo a cada montagem: depois de encerrado, o contexto WebGL de um canvas não volta.
    const canvas = document.createElement("canvas");
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Simulação 3D de uma sala de descompressão.");
    hostRef.current.appendChild(canvas);
    let engine: SalaEngine;
    try {
      engine = new SalaEngine({
        canvas,
        viewer: viewerRef.current,
        overlay: overlayRef.current,
        tamanho,
        areas: ativas,
        onSelect: setSelecionado,
        onVista: setVista,
        onWalk: setAndando,
        onReady: () => setPronto(true),
      });
    } catch {
      // Fora do corpo síncrono do efeito, para não encadear renderizações.
      canvas.remove();
      queueMicrotask(() => setErro("Seu navegador não conseguiu iniciar o WebGL. Tente outro navegador ou ative a aceleração de hardware. A lista de móveis abaixo descreve a sala."));
      return;
    }
    engineRef.current = engine;
    aplicado.current = tamanho;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __sala?: SalaEngine }).__sala = engine;
    return () => {
      engine.dispose();
      canvas.remove();
      engineRef.current = null;
    };
    // A cena é criada uma única vez; as mudanças seguintes chegam pelos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (aplicado.current !== tamanho) {
      aplicado.current = tamanho;
      e.setLayout(tamanho, ativas);
      e.setLighting(luz);
      e.irParaVista("geral", false);
    } else {
      e.setAreas(ativas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tamanho, chaveAreas]);

  const descricaoCanvas = `Simulação 3D de uma sala de descompressão de ${layout.area} m² com ${itensPresentes.map((i) => i.nome.toLowerCase()).join(", ")}.`;
  useEffect(() => {
    hostRef.current?.querySelector("canvas")?.setAttribute("aria-label", descricaoCanvas);
  }, [descricaoCanvas]);
  useEffect(() => { engineRef.current?.setLighting(luz); }, [luz]);
  useEffect(() => { engineRef.current?.setWalls(paredes); }, [paredes]);
  useEffect(() => { engineRef.current?.setDims(medidas); }, [medidas, tamanho]);
  useEffect(() => { engineRef.current?.setHotspots(marcadores); }, [marcadores]);

  function alternarArea(id: AreaId) {
    setDesligadas((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  const item = selecionado ? ITEM_POR_ID[selecionado] : null;

  function verNoTres(id: ItemId) {
    viewerRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    engineRef.current?.selectItem(id);
  }

  return (
    <div className="sala">
      <div className="sala-barra" role="group" aria-label="Tamanho da sala">
        <span className="rotulo">Tamanho</span>
        {TAMANHOS.map((t) => (
          <button key={t} type="button" className="btn" aria-pressed={tamanho === t} onClick={() => setTamanho(t)}>
            {LAYOUTS[t].rotulo} · {LAYOUTS[t].area} m²
          </button>
        ))}
      </div>
      <p className="sala-origem">{layout.largura.toLocaleString("pt-BR")} × {layout.profundidade.toLocaleString("pt-BR")} m. {layout.origem}</p>

      <div className="sala-barra" role="group" aria-label="Áreas da sala">
        <span className="rotulo">Áreas</span>
        {areasDoLayout.map((a) => (
          <button key={a.id} type="button" className="btn" aria-pressed={ativas.has(a.id)} title={a.descricao} onClick={() => alternarArea(a.id)}>
            {a.rotulo}
          </button>
        ))}
      </div>

      <div className="sala-barra" role="group" aria-label="Vistas">
        <span className="rotulo">Vistas</span>
        {vistas.map((v) => (
          <button key={v} type="button" className="btn btn-sm" aria-pressed={vista === v} onClick={() => engineRef.current?.irParaVista(v)}>
            {ROTULO_VISTA[v]}
          </button>
        ))}
      </div>

      <div ref={viewerRef} className="sala-viewer" data-andando={andando || undefined}>
        <div ref={hostRef} className="sala-canvas" />
        <div ref={overlayRef} className="sala-overlay" />
        {andando ? (
          <div className="sala-dica">Modo caminhar: <b>W A S D</b> ou setas para andar, arraste para olhar, <b>Esc</b> para sair</div>
        ) : null}
        {item ? (
          <aside className="sala-cartao" aria-live="polite">
            <div className="sala-cartao-topo">
              <span className="num">{item.n}</span>
              <h3>{item.nome}</h3>
              <button type="button" className="fechar" aria-label="Fechar detalhes" onClick={() => engineRef.current?.clearSelection()}>×</button>
            </div>
            <p className="origens">
              {item.origens.map((o) => <span key={o} className="etiqueta">{o}</span>)}
              {item.sugestao ? <span className="etiqueta aviso">sugestão do Monitor</span> : null}
              {contagem.get(item.id) ? <span className="muted"> {contagem.get(item.id)} na sala</span> : null}
            </p>
            <p>{item.funcao}</p>
            <h4>Onde isso aparece</h4>
            <Referencias item={item} />
            <h4>Preço de referência</h4>
            <Custos item={item} />
          </aside>
        ) : null}
        {andando ? (
          <div className="sala-teclado">
            <button type="button" className="sair" onClick={() => engineRef.current?.exitWalk()}>Sair do modo caminhar</button>
            {(["f", "l", "b", "r"] as const).map((d) => (
              <button
                key={d}
                type="button"
                data-dir={d}
                aria-label={{ f: "Andar para frente", l: "Andar para a esquerda", b: "Andar para trás", r: "Andar para a direita" }[d]}
                onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); engineRef.current?.andar(d, true); }}
                onPointerUp={() => engineRef.current?.andar(d, false)}
                onPointerCancel={() => engineRef.current?.andar(d, false)}
                onLostPointerCapture={() => engineRef.current?.andar(d, false)}
              >
                {{ f: "▲", l: "◀", b: "▼", r: "▶" }[d]}
              </button>
            ))}
          </div>
        ) : null}
        {!pronto || erro ? (
          <div className={`sala-status${erro ? " erro" : ""}`}>
            <p>{erro ?? "Carregando a sala em 3D…"}</p>
          </div>
        ) : null}
      </div>

      <div className="sala-barra sala-ferramentas">
        <div className="grupo" role="group" aria-label="Iluminação">
          <span className="rotulo">Iluminação</span>
          <button type="button" className="btn btn-sm" aria-pressed={luz === "plantao"} onClick={() => setLuz("plantao")}>Plantão</button>
          <button type="button" className="btn btn-sm" aria-pressed={luz === "relax"} onClick={() => setLuz("relax")}>Relaxamento</button>
        </div>
        <div className="grupo" role="group" aria-label="Cor das paredes">
          <span className="rotulo">Paredes</span>
          <button type="button" className="btn btn-sm" aria-pressed={paredes === "pastel"} onClick={() => setParedes("pastel")}>Pastel</button>
          <button type="button" className="btn btn-sm" aria-pressed={paredes === "neutro"} onClick={() => setParedes("neutro")}>Neutras</button>
        </div>
        <div className="grupo" role="group" aria-label="Exibição">
          <button type="button" className="btn btn-sm" aria-pressed={marcadores} onClick={() => setMarcadores((v) => !v)}>Números</button>
          <button type="button" className="btn btn-sm" aria-pressed={medidas} onClick={() => setMedidas((v) => !v)}>Medidas</button>
          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={andando}
            onClick={() => (andando ? engineRef.current?.exitWalk() : engineRef.current?.enterWalk())}
          >
            Modo caminhar
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => { engineRef.current?.clearSelection(); engineRef.current?.irParaVista("geral"); }}
          >
            Reiniciar
          </button>
        </div>
      </div>
      <p className="sala-ajuda">
        Arraste para girar, use a roda do mouse ou dois dedos para aproximar e o botão direito para mover. Clique em um número ou em um móvel para ver o que é e de onde vem a referência.
      </p>

      <section className="sala-custo" aria-labelledby="h-custo">
        <h3 id="h-custo">Custo estimado desta configuração</h3>
        <p className="sala-custo-total">
          <strong>{reais(resumo.total)}</strong> somando só o que tem preço de referência ({resumo.comPreco} linhas da tabela)
          {resumo.semPreco ? `. Outras ${resumo.semPreco} linhas não têm preço publicado em nenhuma fonte` : ""}.
        </p>
        <p className="muted">
          Os preços são os pagos pelo Rio Grande do Norte em 2026 numa compra para 15 salas. Para uma sala só, o valor pode ser diferente. O total não é um orçamento: deixa de fora tudo o que não tem preço publicado.
        </p>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr><th>Item</th><th className="d">Qtd.</th><th className="d">Unitário</th><th className="d">Subtotal</th></tr>
            </thead>
            <tbody>
              {resumo.linhas.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.rotulo}
                    {l.fonte && l.unitario !== undefined ? <> <a href={l.fonte.url} target="_blank" rel="noopener noreferrer">fonte</a></> : null}
                  </td>
                  <td className="d">{l.qtd}</td>
                  <td className="d">{l.unitario !== undefined ? reais(l.unitario) : <span className="sem-preco">não informado</span>}</td>
                  <td className="d">{l.subtotal !== undefined ? reais(l.subtotal) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th colSpan={3}>Total dos itens com preço</th><th className="d">{reais(resumo.total)}</th></tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="sala-itens" aria-labelledby="h-itens">
        <h3 id="h-itens">O que há nesta sala e de onde vem cada item</h3>
        <ol className="itens-lista">
          {itensPresentes.map((it) => (
            <li key={it.id} className="item-linha">
              <span className="num" aria-hidden="true">{it.n}</span>
              <div className="corpo">
                <h4>
                  {it.nome} <span className="muted">× {contagem.get(it.id)}</span>
                </h4>
                <p className="origens">
                  {it.origens.map((o) => <span key={o} className="etiqueta">{o}</span>)}
                </p>
                <p>{it.funcao}</p>
                <Referencias item={it} />
              </div>
              <button type="button" className="btn btn-sm" onClick={() => verNoTres(it.id)}>Ver no 3D</button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
