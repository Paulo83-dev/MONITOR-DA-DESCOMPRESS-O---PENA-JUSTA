"use client";

import { useEffect, useState } from "react";
import { dataCurta, numero } from "@/lib/formato";

type Totais = { total: number; hoje: number; desde: string };

const CHAVE = "mdj-ultima-visita";

/**
 * Contador de acessos. Cada navegador soma 1 por dia (marcado no localStorage);
 * nenhum IP é guardado. Se o banco não estiver disponível, o contador some.
 */
export default function Contador() {
  const [totais, setTotais] = useState<Totais | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      let contar = true;
      try {
        contar = localStorage.getItem(CHAVE) !== hoje;
      } catch {
        // Sem acesso ao armazenamento: conta, mas não marca (pode contar de novo na próxima visita).
      }
      // Marca antes de chamar, para duas montagens seguidas da página não contarem duas vezes.
      if (contar) {
        try { localStorage.setItem(CHAVE, hoje); } catch { /* ignora */ }
      }
      const desmarcar = () => {
        if (!contar) return;
        try { localStorage.removeItem(CHAVE); } catch { /* ignora */ }
      };
      try {
        const r = await fetch("/api/visitas", { method: contar ? "POST" : "GET" });
        if (!r.ok) { desmarcar(); return; }
        const dados = await r.json();
        if (!dados.ok) { desmarcar(); return; }
        if (!cancelado) setTotais({ total: dados.total, hoje: dados.hoje, desde: dados.desde });
      } catch {
        // Sem rede ou sem banco: o contador simplesmente não aparece e a visita fica para a próxima.
        desmarcar();
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, []);

  if (!totais) return null;
  return (
    <p className="contador">
      <b>{numero(totais.total)}</b> visitas desde {dataCurta(totais.desde)} · <b>{numero(totais.hoje)}</b> hoje
      <span className="muted"> (cada navegador conta uma vez por dia)</span>
    </p>
  );
}
