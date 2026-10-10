"use client";

import { useState } from "react";

type Estado = "ocioso" | "copiado" | "falhou";

/** Copia um endereço para a área de transferência e avisa o resultado. Se o navegador não deixar, mostra o link para a pessoa copiar. */
export default function BotaoCopiar({ url }: { url: string }) {
  const [estado, setEstado] = useState<Estado>("ocioso");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setEstado("copiado");
      setTimeout(() => setEstado("ocioso"), 4000);
    } catch {
      setEstado("falhou");
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={copiar}>Copiar link</button>
      <span className="fonte" role="status">
        {estado === "copiado" ? "Link copiado." : estado === "falhou" ? `Não foi possível copiar. O link é ${url}` : ""}
      </span>
    </>
  );
}
