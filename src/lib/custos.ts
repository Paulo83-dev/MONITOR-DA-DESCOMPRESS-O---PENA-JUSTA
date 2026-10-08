import { ITENS, type AreaId, type ItemId } from "@/data/itens";
import type { Fonte } from "@/data/fontes";
import type { Layout } from "@/data/layouts";

export type LinhaResumo = {
  item: ItemId;
  itemNome: string;
  rotulo: string;
  qtd: number;
  unitario?: number;
  subtotal?: number;
  fonte?: Fonte;
  obs?: string;
};

/** Quantas unidades de cada item existem na sala, considerando só as áreas ligadas. */
export function contagemDeItens(layout: Layout, areas: Set<AreaId>) {
  const c = new Map<ItemId, number>();
  for (const i of layout.instancias) {
    if (i.area && !areas.has(i.area)) continue;
    c.set(i.item, (c.get(i.item) ?? 0) + 1);
  }
  return c;
}

/**
 * Soma só o que tem preço de referência numa fonte. Linhas sem preço aparecem
 * à parte, para ninguém confundir o total com o custo real da sala.
 */
export function resumoDeCustos(layout: Layout, areas: Set<AreaId>) {
  const contagem = contagemDeItens(layout, areas);
  const linhas: LinhaResumo[] = [];
  for (const item of ITENS) {
    const n = contagem.get(item.id);
    if (!n) continue;
    for (const c of item.custos) {
      const qtd = c.qtd * n;
      linhas.push({
        item: item.id,
        itemNome: item.nome,
        rotulo: c.rotulo,
        qtd,
        unitario: c.unitario,
        subtotal: c.unitario === undefined ? undefined : c.unitario * qtd,
        fonte: c.fonte,
        obs: c.obs,
      });
    }
  }
  const comPreco = linhas.filter((l) => l.subtotal !== undefined);
  return {
    linhas,
    total: comPreco.reduce((s, l) => s + (l.subtotal ?? 0), 0),
    comPreco: comPreco.length,
    semPreco: linhas.length - comPreco.length,
  };
}
