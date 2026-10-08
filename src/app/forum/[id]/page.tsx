import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TopicoView from "@/components/forum/TopicoView";

export const metadata: Metadata = {
  title: "Tópico",
  robots: { index: false, follow: false },
};

async function Carregador({ params }: { params: PageProps<"/forum/[id]">["params"] }) {
  const n = Number((await params).id);
  if (!Number.isInteger(n) || n < 1) notFound();
  return <TopicoView id={n} />;
}

export default function Topico(props: PageProps<"/forum/[id]">) {
  return (
    <div className="container pagina">
      <div className="leitura">
        <Suspense fallback={<p className="muted ui" role="status">Carregando…</p>}>
          <Carregador params={props.params} />
        </Suspense>
      </div>
    </div>
  );
}
