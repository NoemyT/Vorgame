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

NestJS organiza a API em módulos, controllers e providers, alinhados ao monólito modular previsto. TypeScript será usado tanto no backend quanto no frontend. Prisma organiza o acesso tipado ao banco e a evolução do esquema por migrações; `@nestjs/swagger` permitirá documentar e conferir a implementação com o [contrato da API](../docs/7.%20Contrato%20da%20API.md).

## Organização

O backend segue o monólito modular em camadas definido no [ADR](../docs/2.%20ADR.md): apresentação HTTP, aplicação/domínio e persistência. Os módulos previstos são usuários/autenticação, catálogo, avaliações e reviews; sua implementação seguirá o recorte das histórias da entrega.

As regras de negócio pertencem à camada de aplicação/domínio. O acesso ao Prisma fica na persistência, integrado ao NestJS pelo `PrismaService`. O esquema deve garantir a unicidade de e-mail, nome de usuário e avaliação por usuário/jogo; as operações de avaliação devem usar transações quando necessário para manter a consistência das notas e médias.

```
src/
  main.ts               inicia a API
  configurar-app.ts     CORS e encerramento da aplicação
  app.module.ts         módulo raiz
  database/             persistência: PrismaService (acesso ao banco)
  health/               rota GET /health
prisma/
  schema.prisma         esquema de usuários, jogos e avaliações
  migrations/           migrations SQL versionadas
  seed.mjs              carga inicial do catálogo
test/
  health.e2e-spec.ts    testes de ponta a ponta da rota /health
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores. O arquivo `.env` nunca vai para o Git.

| Variável       | Uso                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | String de conexão do TiDB Cloud (MySQL), terminando em `?sslaccept=strict`                                       |
| `PORT`         | Porta da API. Local: 3000. No Render, é definida automaticamente.                                                |
| `CORS_ORIGIN`  | Endereços que podem chamar a API, separados por vírgula. Ex.: `http://localhost:5173,https://vorgame.vercel.app` |
| `JWT_SECRET`   | Segredo aleatório de alta entropia para o JWT HS256. Os tokens expiram em uma hora. |

O navegador não acessa o banco diretamente.

## Como rodar localmente

```bash
cd backend
npm ci              # instala as dependências e gera o Prisma Client
npm run start:dev   # API em http://localhost:3000
```

| Comando              | O que faz                                |
| -------------------- | ---------------------------------------- |
| `npm test`           | Testes unitários                         |
| `npm run test:e2e`   | Testes de ponta a ponta (sem banco real) |
| `npm run lint`       | ESLint e Oxlint                          |
| `npm run lint:fix`   | Corrige automaticamente o que os linters suportam |
| `npm run format`     | Formata fontes e configurações com Prettier |
| `npm run build`      | Compila para `dist/`                     |
| `npm run start:prod` | Roda a versão compilada                  |

## Banco de dados

Com `DATABASE_URL` apontando para o banco-alvo, rode os comandos abaixo a partir de `backend/`. Para validar a instalação do zero, use um banco vazio e isolado.

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma db seed
```

O seed pode ser reaplicado. Ele atualiza os dados dos quatro jogos pela `chaveSeed` e preserva as avaliações, a média e o total. Consulte o [modelo de dados e seed](../docs/8.%20Modelo%20de%20Dados%20e%20Seed.md).

## Rota de saúde

`GET /health` executa `SELECT 1` no banco.

| Situação                | Resposta                                     |
| ----------------------- | -------------------------------------------- |
| API e banco funcionando | `200` com `{ "api": "ok", "banco": "ok" }`   |
| Banco inacessível       | `503` com `{ "api": "ok", "banco": "erro" }` |

## Documentação OpenAPI

- [Swagger UI](http://localhost:3000/docs)
- [Especificação JSON](http://localhost:3000/docs-json)

A documentação cobre as rotas de HU01 a HU05 e a rota de saúde. Na interface, use **Authorize** com o token retornado por `POST /auth/login` para testar as rotas protegidas.

## Deploy no Render

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Root Directory    | `backend`                      |
| Build Command     | `npm ci && npm run build`      |
| Start Command     | `npm run start:prod`           |
| Health Check Path | `/health`                      |
| Variáveis         | `DATABASE_URL`, `CORS_ORIGIN` e `JWT_SECRET` |

No plano gratuito, o backend hiberna após cerca de 15 minutos sem acesso. O primeiro acesso depois disso leva em torno de 30 segundos.

## Estado atual

O backend inclui `/health`, busca e detalhes de jogos, cadastro, login, consulta da conta autenticada e as três rotas de avaliação. A migration inicial cria as tabelas de usuários, jogos e avaliações, e o seed carrega o catálogo.

## Referências

- [NestJS](https://docs.nestjs.com/)
- [NestJS: integração com Prisma](https://docs.nestjs.com/recipes/prisma)
- [Prisma: MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction)
