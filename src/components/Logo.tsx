/**
 * Marca do site: o mesmo símbolo de pausa do ícone da aba (src/app/icon.svg),
 * em branco sobre o verde-azulado. As cores são fixas, para a marca ser a mesma nos dois temas.
 */
export default function Logo({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 512 512" aria-hidden="true" focusable="false" className="logo">
      <rect width="512" height="512" rx="113" fill="#28666B" />
      <rect x="146" y="126" width="84" height="260" rx="34" fill="#FFFFFF" />
      <rect x="282" y="126" width="84" height="260" rx="34" fill="#FFFFFF" />
    </svg>
  );
}
