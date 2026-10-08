"use client";

import dynamic from "next/dynamic";

/** A cena 3D só existe no navegador: carrega o Three.js sob demanda. */
const SalaViewer = dynamic(() => import("./SalaViewer"), {
  ssr: false,
  loading: () => (
    <div className="sala-carregando" role="status">
      Carregando a sala em 3D…
    </div>
  ),
});

export default function SalaLoader() {
  return <SalaViewer />;
}
