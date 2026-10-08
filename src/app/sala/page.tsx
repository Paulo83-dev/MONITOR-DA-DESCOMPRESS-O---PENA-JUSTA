import type { Metadata } from "next";
import SalaLoader from "@/components/sala/SalaLoader";

export const metadata: Metadata = {
  title: "Sala 3D",
  description: "Explore em 3D uma sala de descompressão de 24, 40 ou 60 m², com cada móvel ligado à sua fonte e ao preço de referência.",
};

export default function Sala() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Simulação 3D</p>
        <h1>Como a sala pode ser</h1>
        <p className="lead">
          Escolha o tamanho, ligue ou desligue as áreas e clique nos móveis. Cada item mostra de onde vem a referência: compras do Rio Grande do Norte, salas de São Paulo e do Acre, um estudo da UFAL ou uma sugestão do Monitor. É uma simulação ilustrativa, não um projeto oficial.
        </p>
      </header>
      <SalaLoader />
    </div>
  );
}
