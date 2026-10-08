const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR");

export const reais = (valor: number) => brl.format(valor);
export const numero = (valor: number) => num.format(valor);
export const percentual = (valor: number) => `${String(Number(valor.toFixed(2))).replace(".", ",")}%`;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-09-08" vira "8 de setembro de 2026"; "2026-08" vira "agosto de 2026"; "2022" fica "2022". */
export function dataLonga(iso: string) {
  const [a, m, d] = iso.split("-");
  if (!m) return a;
  const mes = MESES[Number(m) - 1];
  return d ? `${Number(d)} de ${mes} de ${a}` : `${mes} de ${a}`;
}

/** "2026-09-08" vira "08/09/2026". */
export function dataCurta(iso: string) {
  const [a, m, d] = iso.split("-");
  return d ? `${d}/${m}/${a}` : m ? `${m}/${a}` : a;
}
