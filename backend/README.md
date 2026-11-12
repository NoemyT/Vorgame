# Backend — Vorgame

## Stack escolhida

| Responsabilidade | Tecnologia |
| --- | --- |
| Linguagem | TypeScript |
| Ambiente de execução | Node.js LTS compatível com as versões escolhidas de NestJS e Prisma, com npm |
| API REST | NestJS com adaptador Express |
| Validação de entradas | DTOs com `ValidationPipe`, `class-validator` e `class-transformer` |
| Persistência | Prisma ORM e Prisma Client |
| Banco de dados | MySQL com tabelas InnoDB |
| Migrações do banco | Prisma Migrate |
| Documentação OpenAPI | `@nestjs/swagger` |
| Testes | Jest e Supertest |

NestJS organiza a API em módulos, controllers e providers, alinhados ao monólito modular previsto. TypeScript será usado tanto no backend quanto no frontend. Prisma organiza o acesso tipado ao MySQL e a evolução do esquema por migrações; `@nestjs/swagger` permitirá documentar e conferir a implementação com o futuro contrato da API.

## Organização prevista

O backend seguirá o monólito modular em camadas definido no [ADR](../docs/2.%20ADR.md): apresentação HTTP, aplicação/domínio e persistência. Os módulos previstos são usuários/autenticação, catálogo, avaliações e reviews; sua implementação seguirá o recorte das histórias da entrega.

As regras de negócio pertencem à camada de aplicação/domínio. O acesso ao Prisma ficará na persistência, integrado ao NestJS por um provider. O esquema deve garantir a unicidade de e-mail, nome de usuário e avaliação por usuário/jogo; as operações de avaliação devem usar transações quando necessário para manter a consistência das notas e médias no MySQL/InnoDB.

O frontend acessará o backend por HTTP com corpos JSON. A conexão com o MySQL será configurada por `DATABASE_URL` no ambiente do backend, junto aos demais segredos. O navegador não acessará o banco diretamente.

## Estado atual

A stack está decidida, mas o backend ainda não foi implementado. Ainda não existem dependências instaláveis, migrações ou comandos de execução no repositório. As versões exatas das bibliotecas serão fixadas no manifesto e no arquivo de lock durante a implementação. O contrato dos endpoints continua pendente.

## Referências

- [NestJS](https://docs.nestjs.com/)
- [NestJS: integração com Prisma](https://docs.nestjs.com/recipes/prisma)
- [Prisma: MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction)
