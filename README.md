# Monitor da Descompressão

Site que acompanha a implantação das **salas de descompressão para policiais penais** previstas no
**Plano Nacional Pena Justa** (indicador 2.5.1.1.1.1, meta de 40% dos estabelecimentos prisionais).

- **Painel**: indicador nacional, mapa por estado e linha do tempo, cada dado com a fonte.
- **Sala 3D**: simulação interativa (24, 40 e 60 m²) com a fonte e o preço de referência de cada móvel.
- **Documentos**: o Plano Pena Justa e outros documentos públicos, para baixar.
- **Fórum anônimo** e **contador de visitas** (usam banco de dados).

Projeto independente, sem vínculo com o CNJ, o Ministério da Justiça ou qualquer secretaria.

## Como rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem `DATABASE_URL`, o site usa um banco local em arquivo (PGlite, pasta `.pglite/`),
então contador e fórum funcionam sem instalar nada. Para ajustar variáveis, copie `.env.example` para `.env.local`.

Antes de enviar mudanças:

```bash
npm run lint
npm run build
```

## Como atualizar os dados do monitor

Os dados ficam em arquivos TypeScript, sem banco, e o histórico do Git mostra quem mudou o quê:

| Arquivo | O que tem |
|---|---|
| `src/data/ufs.ts` | Situação de cada UF no mapa, números e fontes. Atualize `ATUALIZADO_EM` ao conferir. |
| `src/data/novidades.ts` | Linha do tempo. |
| `src/data/itens.ts` | Móveis da sala 3D: função, fontes, preços de referência. |
| `src/data/layouts.ts` | Posição dos móveis em cada tamanho de sala. |
| `src/data/documentos.ts` | Lista de downloads (PDFs em `public/documentos/`). |
| `src/data/fontes.ts` | Cadastro das fontes citadas. |

Regra do projeto: **toda informação precisa apontar para uma fonte pública**. Se um dado não foi conferido no texto
original, a fonte deve trazer essa ressalva em `nota`.

## Publicar na Vercel

1. Na Vercel, **Add New → Project** e importe este repositório (framework: Next.js, sem mudar nada).
2. Em **Storage**, crie um banco **Neon (Postgres)** pelo Marketplace e conecte ao projeto.
   Isso cria a variável `DATABASE_URL`. As tabelas são criadas sozinhas na primeira requisição.
3. Em **Settings → Environment Variables**, defina (valores longos e aleatórios):

   | Variável | Para quê |
   |---|---|
   | `SESSION_SECRET` | Assinar o login da moderação. |
   | `IP_HASH_SECRET` | Gerar a assinatura irreversível de IP usada contra spam. |
   | `MOD_ADMIN_USUARIO` / `MOD_ADMIN_SENHA` | Criar o administrador no primeiro login da moderação. |

   Gere um segredo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Faça o **Redeploy**. Cada `git push` na branch `main` publica automaticamente.

## Tecnologia

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Three.js (sala 3D),
Postgres (Neon em produção, PGlite em desenvolvimento). Sem biblioteca de interface: o CSS é próprio.

## Licenças

- **Código**: [MIT](LICENSE).
- **Textos e dados do monitor** (`src/data/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt-br), citando este projeto.
- **PDFs em `public/documentos/`**: documentos públicos de terceiros (CNJ, TJSP, CNPCP), mantidos como cópia de
  conveniência. Os direitos e a versão oficial são de cada órgão; os links de origem estão em `src/data/documentos.ts`.
