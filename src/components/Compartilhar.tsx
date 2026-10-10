import BotaoCopiar from "@/components/BotaoCopiar";
import { linkWhatsApp, urlPublica } from "@/lib/compartilhar";

/** Botão do WhatsApp (um link comum, sem script de terceiros) e botão de copiar o endereço. */
export default function Compartilhar({ caminho = "/" }: { caminho?: string }) {
  return (
    <div className="compartilhar">
      <span className="rotulo">Passe adiante para os colegas</span>
      <a href={linkWhatsApp(caminho)} className="btn btn-primario" target="_blank" rel="noopener noreferrer">
        Compartilhar no WhatsApp
      </a>
      <BotaoCopiar url={urlPublica(caminho)} />
    </div>
  );
}
