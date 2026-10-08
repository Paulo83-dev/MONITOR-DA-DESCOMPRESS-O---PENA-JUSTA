import type { Metadata } from "next";
import PainelModeracao from "@/components/forum/PainelModeracao";

export const metadata: Metadata = {
  title: "Moderação",
  robots: { index: false, follow: false },
};

export default function Moderacao() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Área restrita</p>
        <h1>Moderação do fórum</h1>
      </header>
      <PainelModeracao />
    </div>
  );
}
