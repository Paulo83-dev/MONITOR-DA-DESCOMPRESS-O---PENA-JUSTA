import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import Contador from "@/components/Contador";
import Logo from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import { ATUALIZADO_EM } from "@/data/ufs";
import { NAVEGACAO, SITE } from "@/data/site";
import { linkWhatsApp } from "@/lib/compartilhar";
import { dataCurta } from "@/lib/formato";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
const corpo = Source_Serif_4({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.nome, template: `%s · ${SITE.nome}` },
  description: SITE.descricao,
  applicationName: SITE.nome,
  openGraph: { title: SITE.nome, description: SITE.descricao, siteName: SITE.nome, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1719" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
      <body>
        <header className="cabecalho">
          <div className="container">
            <Link href="/" className="marca">
              <Logo />
              <span>
                {SITE.nome}
                <small>Pena Justa · indicador 2.5.1.1.1.1</small>
              </span>
            </Link>
            <nav className="nav" aria-label="Principal">
              <Suspense
                fallback={
                  <ul>
                    {NAVEGACAO.map((n) => (
                      <li key={n.href}><Link href={n.href}>{n.rotulo}</Link></li>
                    ))}
                  </ul>
                }
              >
                <NavLinks />
              </Suspense>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="rodape">
          <div className="container">
            <Contador />
            <ul>
              <li><Link href="/regras">Regras do fórum</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer">Compartilhar no WhatsApp</a></li>
              <li><a href={SITE.repositorio} target="_blank" rel="noopener noreferrer">Código e dados no GitHub</a></li>
            </ul>
            <p>
              Projeto independente, sem vínculo com o CNJ, o Ministério da Justiça ou qualquer secretaria. Dados conferidos em {dataCurta(ATUALIZADO_EM)}. Cada informação tem a fonte indicada ao lado.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
