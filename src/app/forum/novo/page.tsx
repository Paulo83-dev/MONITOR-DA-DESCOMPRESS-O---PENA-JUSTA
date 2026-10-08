import type { Metadata } from "next";
import Link from "next/link";
import FormForum from "@/components/forum/FormForum";

export const metadata: Metadata = {
  title: "Novo tópico",
  robots: { index: false, follow: false },
};

export default function NovoTopico() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="ui"><Link href="/forum">← Todos os tópicos</Link></p>
        <h1>Novo tópico</h1>
        <p className="lead">Escreva com calma. Não cite nomes nem informações que comprometam a segurança de uma unidade.</p>
      </header>
      <div className="leitura">
        <FormForum modo="topico" />
      </div>
    </div>
  );
}
