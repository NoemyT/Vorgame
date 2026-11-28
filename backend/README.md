# Backend — Vorgame

## Stack escolhida

| Responsabilidade      | Tecnologia                                                               |
| --------------------- | ------------------------------------------------------------------------ |
| Linguagem             | TypeScript                                                               |
| Ambiente de execução  | Node.js 22 LTS, com npm                                                  |
| API REST              | NestJS 12 com adaptador Express                                          |
| Validação de entradas | DTOs com `ValidationPipe`, `class-validator` e `class-transformer`       |
| Persistência          | Prisma ORM 6 e Prisma Client                                             |
| Banco de dados        | MySQL com tabelas InnoDB, hospedado no TiDB Cloud (compatível com MySQL) |
| Migrações do banco    | Prisma Migrate                                                           |
| Documentação OpenAPI  | `@nestjs/swagger`                                                        |
| Testes                | Vitest e Supertest                                                       |

NestJS organiza a API em módulos, controllers e providers, alinhados ao monólito modular previsto. TypeScript é usado tanto no backend quanto no frontend. Prisma organiza o acesso tipado ao banco e a evolução do esquema por migrações; `@nestjs/swagger` permite documentar e conferir a implementação com o [contrato da API](../docs/7.%20Contrato%20da%20API.md).

## Organização

O backend segue o monólito modular em camadas definido no [ADR](../docs/2.%20ADR.md): apresentação HTTP, aplicação/domínio e persistência. Os módulos de usuários/autenticação, catálogo e avaliações estão implementados. O módulo de reviews permanece previsto na arquitetura, mas fora do escopo desta entrega.

As regras de negócio pertencem à camada de aplicação/domínio. O acesso ao Prisma fica na persistência, integrado ao NestJS pelo `PrismaService`. O esquema deve garantir a unicidade de e-mail, nome de usuário e avaliação por usuário/jogo; as operações de avaliação devem usar transações quando necessário para manter a consistência das notas e médias.

```
src/
  main.ts               inicia a API
  configurar-app.ts     CORS e encerramento da aplicação
  app.module.ts         módulo raiz
  database/             persistência: PrismaService (acesso ao banco)
  auth/                cadastro, login e autenticação JWT
  avaliacoes/          criação, alteração e consulta de notas
  catalogo/            busca e detalhes de jogos
  catalogo/igdb/        OAuth da Twitch, consulta à IGDB e normalização
  health/               rota GET /health
  openapi/              configuração e respostas OpenAPI
prisma/
  schema.prisma         esquema de usuários, jogos e avaliações
  migrations/           migrations SQL versionadas
  seed.mjs              carga inicial de jogos fictícios (opcional)
test/
  *.e2e-spec.ts         testes de saúde, autenticação, catálogo, avaliações e OpenAPI
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores. O arquivo `.env` nunca vai para o Git.

| Variável             | Uso                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | String de conexão do TiDB Cloud (MySQL), terminando em `?sslaccept=strict`                                       |
| `PORT`               | Porta da API. Local: 3000. No Render, é definida automaticamente.                                                |
| `CORS_ORIGIN`        | Endereços que podem chamar a API, separados por vírgula. Ex.: `http://localhost:5173,https://vorgame.vercel.app` |
| `JWT_SECRET`         | Segredo aleatório de alta entropia para o JWT HS256. Os tokens expiram em uma hora.                              |
| `IGDB_CLIENT_ID`     | Client ID do aplicativo confidencial cadastrado na Twitch                                                        |
| `IGDB_CLIENT_SECRET` | Client Secret do mesmo aplicativo                                                                                |

## Cadastro do aplicativo na Twitch

1. Entre no painel de desenvolvedores com uma conta Twitch de e-mail verificado e autenticação de dois fatores ativa. [Painel de aplicações](https://dev.twitch.tv/console/apps)
2. Registre uma aplicação, selecione o tipo **Confidential** e preencha o campo de redirecionamento com `http://localhost:3000`. O fluxo da IGDB dispensa redirecionamento. [Cadastro na IGDB](https://api-docs.igdb.com/#account-creation)
3. Abra **Manage**, copie o **Client ID** e use **New Secret** para gerar o **Client Secret**. Preencha as variáveis somente no ambiente do backend. [Cadastro de app na Twitch](https://dev.twitch.tv/docs/authentication/register-app/)

```dotenv
IGDB_CLIENT_ID=<client_id_do_app>
IGDB_CLIENT_SECRET=<client_secret_do_app>
```

O backend usa OAuth 2.0 `client_credentials` em `POST https://id.twitch.tv/oauth2/token`, mantém o token de aplicação em memória de acordo com sua validade e usa `Client-ID` e `Authorization: Bearer` em `POST https://api.igdb.com/v4/games`. O JWT do Vorgame autentica o usuário nas avaliações. [OAuth da Twitch](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow) · [Requisições à IGDB](https://api-docs.igdb.com/#requests)

## Uso da IGDB

- A IGDB limita a 4 requisições por segundo e a 8 requisições abertas simultaneamente. O adaptador espaça o início das consultas em pelo menos 250 ms, admite até 8 buscas em andamento ou na fila por instância e usa timeout de 5 segundos por requisição externa. Uma falha da fonte, incluindo `429`, vira `503` na busca do Vorgame. [Limites da IGDB](https://api-docs.igdb.com/#rate-limits)
- O Vorgame guarda o vínculo com o ID da IGDB e os metadados usados nos detalhes. A capa é armazenada como URL. A média e o total vêm das avaliações do Vorgame. [Regras de persistência](../docs/8.%20Modelo%20de%20Dados%20e%20Seed.md#regras-de-persistência) · [FAQ da IGDB sobre armazenamento](https://api-docs.igdb.com/#faq)
- A atribuição prevista para a pesquisa e os detalhes é [Dados de jogos: IGDB](https://www.igdb.com/). Esse crédito é exibido no rodapé compartilhado do frontend e na página de créditos.

## Como rodar localmente

```bash
cd backend
npm ci              # instala as dependências e gera o Prisma Client
npx prisma migrate deploy
npm run start:dev   # API em http://localhost:3000
```

| Comando              | O que faz                                         |
| -------------------- | ------------------------------------------------- |
| `npm test`           | Testes unitários                                  |
| `npm run test:e2e`   | Testes de ponta a ponta (sem banco real)          |
| `npm run lint`       | ESLint e Oxlint                                   |
| `npm run lint:fix`   | Corrige automaticamente o que os linters suportam |
| `npm run format`     | Formata fontes e configurações com Prettier       |
| `npm run build`      | Compila para `dist/`                              |
| `npm run start:prod` | Roda a versão compilada                           |

## Banco de dados

Com `DATABASE_URL` apontando para o banco-alvo, rode os comandos abaixo a partir de `backend/`. Para validar a instalação do zero, use um banco vazio e isolado.

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Para carregar os quatro jogos fictícios em um banco de desenvolvimento, execute `npx prisma db seed`. Reaplicar o seed atualiza os jogos pela `chaveSeed` e preserva avaliações, média e total. Esses jogos continuam acessíveis pelo ID local. A busca consulta a IGDB. Consulte o [modelo de dados e seed](../docs/8.%20Modelo%20de%20Dados%20e%20Seed.md).

## Rota de saúde

`GET /health` executa `SELECT 1` no banco. A busca é a rota usada para verificar a integração com a IGDB.

| Situação                | Resposta                                     |
| ----------------------- | -------------------------------------------- |
| API e banco funcionando | `200` com `{ "api": "ok", "banco": "ok" }`   |
| Banco inacessível       | `503` com `{ "api": "ok", "banco": "erro" }` |

## Documentação OpenAPI

- [Swagger UI](http://localhost:3000/docs)
- [Especificação JSON](http://localhost:3000/docs-json)

A documentação cobre as rotas de HU01 a HU05, a rota de saúde e `GET /ratings/me`, que lista as avaliações do usuário autenticado da atualização mais recente à mais antiga. Na interface, use **Authorize** com o token retornado por `POST /auth/login` para testar as rotas protegidas.

## Roteiro de aceite com Terraria

Use o backend com as credenciais da IGDB, um banco de desenvolvimento migrado e uma conta de teste.

1. Na [tela de pesquisa](http://localhost:5173/pesquisa), busque **Terraria**. Abra o resultado pelo título e anote o ID numérico em `/jogos/{id}`.
2. Cadastre uma conta de teste pelo frontend e faça login.
3. Abra novamente os detalhes de Terraria, selecione a nota 8 e salve a avaliação. Confira a nota pessoal, a média e o total de avaliações.
4. Altere a nota para 10 e confira a atualização dos agregados. Em um jogo sem outras notas, a média passa de 8,0 para 10,0 e o total permanece em 1.
5. Abra `/minhas-avaliacoes` e confira o jogo e a nota atual. Volte aos detalhes pelo item da lista.
6. Repita a busca e confirme que o ID local e a avaliação foram preservados.

Para verificar diretamente a API no Swagger, autentique-se com `POST /auth/login` e use o JWT em **Authorize**. As rotas `GET /games/{id}`, `GET /games/{id}/ratings/me` e `GET /ratings/me` permitem conferir os dados. A criação usa `POST /games/{id}/ratings` e a alteração usa `PUT /games/{id}/ratings/me`, ambas com corpo `{"nota": 8}` (ajuste a nota conforme o teste).

## Deploy no Render

| Campo             | Valor                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| Root Directory    | `backend`                                                                            |
| Build Command     | `npm ci && npm run build`                                                            |
| Start Command     | `npm run start:prod`                                                                 |
| Health Check Path | `/health`                                                                            |
| Variáveis         | `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET` |

Antes do deploy, aplique as migrations pendentes ao banco do ambiente com `npx prisma migrate deploy` e confira com `npx prisma migrate status`. O deploy das migrations não executa o seed automaticamente.

No plano gratuito, o backend hiberna após cerca de 15 minutos sem acesso. O primeiro acesso depois disso leva em torno de 30 segundos.

## Estado atual

O código final inclui os endpoints de criação, alteração e consulta de avaliações, além da listagem das notas da própria conta. O frontend consome essas rotas diretamente pela camada de serviço. Os registros de validação anteriores à conclusão do frontend são preservados abaixo.

- **Com respostas simuladas.** Os testes exercitam autenticação na Twitch, busca, erros da fonte e integração do catálogo. Com MariaDB isolado, foi verificado o vínculo entre busca, detalhes e gravação de nota.
- **Com a IGDB real.** Em 27/11/2026, o aceite via API em MariaDB isolado encontrou Terraria, abriu os detalhes e criou, consultou e alterou a nota da conta de teste. Uma nova busca confirmou o mesmo ID e os agregados da avaliação. [Verificações de persistência](../docs/8.%20Modelo%20de%20Dados%20e%20Seed.md#implementação-e-validação)

## Referências

- [NestJS](https://docs.nestjs.com/)
- [NestJS: integração com Prisma](https://docs.nestjs.com/recipes/prisma)
- [Prisma: MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction)
