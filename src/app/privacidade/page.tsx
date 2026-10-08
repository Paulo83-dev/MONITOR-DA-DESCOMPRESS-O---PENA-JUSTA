import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados o Monitor da Descompressão guarda, por quanto tempo e para quê.",
};

export default function Privacidade() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">LGPD</p>
        <h1>Política de privacidade</h1>
        <p className="lead">Em resumo: não pedimos nome, e-mail nem cadastro. Guardamos o mínimo para o site funcionar e para barrar abusos.</p>
      </header>

      <div className="stack leitura ui" style={{ fontSize: "1rem" }}>
        <h2>Navegação e contador de visitas</h2>
        <ul>
          <li>O contador soma uma visita por navegador por dia. Para isso, o seu navegador guarda a data da última visita (no armazenamento local). Não guardamos IP, nome ou qualquer dado que identifique você.</li>
          <li>O site não usa cookies de publicidade nem ferramentas de rastreamento de terceiros.</li>
          <li>A hospedagem (Vercel) registra dados técnicos de acesso por razões de segurança e funcionamento, conforme a política dela.</li>
        </ul>

        <h2>Fórum anônimo</h2>
        <ul>
          <li>Para publicar, você escolhe um apelido, que aparece com a mensagem. Não pedimos e-mail nem cadastro. Evite apelidos que revelem quem você é.</li>
          <li>Guardamos o texto, o apelido, a data e o estado da mensagem (visível, retida, oculta ou removida).</li>
          <li>Para barrar spam e abuso, guardamos uma assinatura irreversível do endereço IP (um código gerado com uma chave secreta do servidor, que não permite descobrir o IP). Ela serve apenas para limitar o número de mensagens por período, impedir denúncias repetidas da mesma origem e bloquear abusos. É apagada depois de 6 meses.</li>
          <li>Para você poder apagar a sua própria mensagem, o navegador guarda uma chave secreta daquela mensagem. Se você limpar os dados do navegador, perde essa possibilidade. Aí, só a moderação consegue apagar.</li>
          <li>As mensagens podem ser lidas por qualquer pessoa. Não publique nada que você não queira que fique público.</li>
        </ul>

        <h2>Moderação</h2>
        <ul>
          <li>Moderadores têm usuário e senha. As senhas são guardadas de forma criptografada e as ações da moderação ficam registradas.</li>
          <li>Mensagens podem ser ocultadas ou removidas para cumprir as <Link href="/regras">regras do fórum</Link> ou por ordem judicial.</li>
        </ul>

        <h2>Seus direitos</h2>
        <ul>
          <li>Você pode pedir a remoção de mensagem que exponha dados pessoais seus ou de terceiros. Use o botão Denunciar na mensagem ou abra uma solicitação no{" "}
            <a href={SITE.repositorio} target="_blank" rel="noopener noreferrer">repositório do projeto</a>.</li>
          <li>Como não guardamos dados que identifiquem pessoas, não há cadastro para consultar, corrigir ou apagar além das mensagens.</li>
        </ul>

        <p className="fonte">Última atualização: outubro de 2026. Este texto descreve o que o site faz hoje e será atualizado se algo mudar, por exemplo quando houver login por e-mail.</p>
      </div>
    </div>
  );
}
