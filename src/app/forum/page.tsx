import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fórum",
  description: "Fórum anônimo para policiais penais conversarem sobre as salas de descompressão.",
};

// Página provisória: o fórum completo entra na fase 2.
export default function Forum() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Fórum anônimo</p>
        <h1>Fórum em preparação</h1>
        <p className="lead">
          Aqui vai ser o espaço para policiais penais contarem como é a sala da própria unidade e trocarem ideias de montagem, sem precisar se identificar.
        </p>
      </header>
      <p className="leitura">
        Enquanto isso, leia as <Link href="/regras">regras do fórum</Link> e a <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </div>
  );
}
