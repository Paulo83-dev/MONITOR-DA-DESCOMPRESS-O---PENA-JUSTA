import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regras do fórum",
  description: "O que pode e o que não pode ser publicado no fórum anônimo do Monitor da Descompressão.",
};

export default function Regras() {
  return (
    <div className="container pagina">
      <header className="pagina-topo">
        <p className="eyebrow">Fórum</p>
        <h1>Regras do fórum</h1>
        <p className="lead">O fórum é anônimo e feito para trocar informação útil sobre as salas de descompressão. Estas regras protegem quem escreve e quem trabalha nas unidades.</p>
      </header>

      <div className="stack leitura ui" style={{ fontSize: "1rem" }}>
        <h2>Pode</h2>
        <ul>
          <li>Contar como é (ou como não é) a sala de descompressão da sua unidade, sem identificar pessoas.</li>
          <li>Sugerir móveis, equipamentos e ajustes, de preferência com a fonte ou o preço de uma compra pública.</li>
          <li>Discutir o Plano Pena Justa, as normas e o andamento das metas.</li>
          <li>Apontar erros no Monitor, com o link que comprova.</li>
        </ul>

        <h2>Não pode</h2>
        <ul>
          <li>Citar nome, matrícula, CPF, telefone ou endereço de qualquer pessoa, nem foto de pessoas.</li>
          <li>Citar nome de pessoa presa ou dados do processo dela.</li>
          <li>Descrever rotinas, horários, efetivo, armamento, pontos cegos ou falhas de segurança de uma unidade.</li>
          <li>Acusar alguém de crime ou falta funcional sem prova. Use os canais oficiais, como corregedoria e ouvidoria.</li>
          <li>Ofender, ameaçar, discriminar ou assediar.</li>
          <li>Fazer propaganda, divulgar links suspeitos ou publicar a mesma mensagem várias vezes.</li>
          <li>Falar em nome de um órgão ou se passar por autoridade.</li>
        </ul>

        <h2>O que acontece quando alguém descumpre</h2>
        <ul>
          <li>Qualquer pessoa pode denunciar uma mensagem. Quando chega a três denúncias de origens diferentes, a mensagem é ocultada até a moderação revisar.</li>
          <li>Mensagens com palavras ofensivas, dados pessoais ou muitos links ficam retidas para revisão antes de aparecer.</li>
          <li>A moderação pode ocultar ou remover mensagens e bloquear a origem de abusos repetidos.</li>
        </ul>

        <h2>Lembretes</h2>
        <ul>
          <li>O fórum não substitui o canal oficial para denúncias. Em caso de risco, procure a chefia, a corregedoria ou a ouvidoria.</li>
          <li>Não é possível enviar fotos ou arquivos. Fotos do interior de unidades prisionais podem expor a segurança.</li>
          <li>Você pode apagar a sua própria mensagem pelo mesmo navegador em que a escreveu.</li>
          <li>Veja como tratamos os dados na <Link href="/privacidade">política de privacidade</Link>.</li>
        </ul>
      </div>
    </div>
  );
}
