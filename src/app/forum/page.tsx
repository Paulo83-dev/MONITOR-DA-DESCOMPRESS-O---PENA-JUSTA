import type { Metadata } from "next";
import Link from "next/link";
import ForumLista from "@/components/forum/ForumLista";

export const metadata: Metadata = {
  title: "Fórum",
  description: "Fórum anônimo para policiais penais conversarem sobre as salas de descompressão.",
  robots: { index: false, follow: false },
};

export default function Forum() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Fórum anônimo</p>
        <h1>Converse sobre as salas de descompressão</h1>
        <p className="lead">
          Conte como é (ou como não é) a sala da sua unidade, tire dúvidas e troque ideias de montagem com outros policiais penais. Não pedimos nome nem e-mail.
        </p>
        <p className="fonte">
          Antes de escrever, leia as <Link href="/regras">regras</Link> e a <Link href="/privacidade">política de privacidade</Link>. Não cite nomes, dados de pessoas ou informações de segurança das unidades.
        </p>
      </header>
      <ForumLista />
    </div>
  );
}
