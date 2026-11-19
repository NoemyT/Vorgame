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
  schema.prisma         esquema do banco (tabelas a partir da Etapa 4)
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
| `npm run lint`       | Linter (oxlint)                          |
| `npm run build`      | Compila para `dist/`                     |
| `npm run start:prod` | Roda a versão compilada                  |

## Rota de saúde

`GET /health` executa `SELECT 1` no banco.

| Situação                | Resposta                                     |
| ----------------------- | -------------------------------------------- |
| API e banco funcionando | `200` com `{ "api": "ok", "banco": "ok" }`   |
| Banco inacessível       | `503` com `{ "api": "ok", "banco": "erro" }` |

## Deploy no Render

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Root Directory    | `backend`                      |
| Build Command     | `npm ci && npm run build`      |
| Start Command     | `npm run start:prod`           |
| Health Check Path | `/health`                      |
| Variáveis         | `DATABASE_URL` e `CORS_ORIGIN` |

No plano gratuito, o backend hiberna após cerca de 15 minutos sem acesso. O primeiro acesso depois disso leva em torno de 30 segundos.

## Estado atual

Esqueleto da Etapa 2 implementado: rota `/health` com consulta ao banco, CORS configurável e leitura de variáveis de ambiente. Os módulos de negócio serão implementados a partir da Etapa 5, seguindo o contrato da API.

## Referências

- [NestJS](https://docs.nestjs.com/)
- [NestJS: integração com Prisma](https://docs.nestjs.com/recipes/prisma)
- [Prisma: MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction)
