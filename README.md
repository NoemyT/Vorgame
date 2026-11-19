# Vorgame

Rede social de avaliação de jogos, desenvolvida com apoio de IA para a disciplina de TSI.

No produto completo, o usuário cria uma conta, pesquisa jogos, consulta seus detalhes, dá notas de 0 a 10 e publica reviews. Este repositório reúne a documentação do projeto e o código do protótipo.

## Escopo do protótipo desta entrega

| História                              | Situação nesta entrega                      |
| ------------------------------------- | ------------------------------------------- |
| HU01 — Criar conta                    | Incluída                                    |
| HU02 — Fazer login                    | Incluída                                    |
| HU03 — Pesquisar jogos                | Incluída (pública, sem login)               |
| HU04 — Visualizar detalhes de um jogo | Incluída (pública), sem exibição de reviews |
| HU05 — Avaliar jogo                   | Incluída (exige login)                      |
| HU06 — Publicar review                | Adiada                                      |

**Fluxo de demonstração:** criar conta → fazer login → pesquisar um jogo → abrir os detalhes → dar uma nota → alterar a nota e conferir a média atualizada.

O catálogo de jogos é local: fica no MySQL e é carregado por uma carga inicial. Integração com APIs externas de jogos e tela administrativa de catálogo ficam fora do protótipo.

O detalhamento do recorte e os critérios de aceite estão em [Histórias de Usuário](docs/1.%20Hist%C3%B3rias%20de%20Usu%C3%A1rio%20%28Alta%29.md).

## Arquitetura

Monólito modular em camadas (apresentação HTTP → aplicação/domínio → persistência), com API REST e um banco MySQL único. Os módulos são Usuários/Autenticação, Catálogo, Avaliações e Reviews (este último previsto, mas adiado). A justificativa e as alternativas descartadas estão no [ADR-001](docs/2.%20ADR.md).

## Stack

Definida no [ADR-002](docs/2.%20ADR.md).

| Parte        | Tecnologias                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Backend      | Node.js, TypeScript, NestJS (adaptador Express), validação com DTOs e `class-validator`, OpenAPI com `@nestjs/swagger` |
| Persistência | MySQL (InnoDB), Prisma ORM e Prisma Migrate                                                                            |
| Frontend     | React, TypeScript, Vite, React Router, CSS, `fetch`                                                                    |
| Testes       | Vitest e Supertest no backend; Vitest e React Testing Library no frontend                                              |

Detalhes de cada parte em [backend/README.md](backend/README.md) e [frontend/README.md](frontend/README.md).

## Documentação (`/docs`)

| Arquivo                                                                                        | Conteúdo                                                   |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [1. Histórias de Usuário (Alta)](docs/1.%20Hist%C3%B3rias%20de%20Usu%C3%A1rio%20%28Alta%29.md) | HU01 a HU06, recorte do protótipo e critérios de aceitação |
| [2. ADR](docs/2.%20ADR.md)                                                                     | ADR-001 (arquitetura) e ADR-002 (stack)                    |
| [3. Diagrama de Contexto](docs/3.%20Diagrama%20de%20Contexto.png)                              | C4 nível 1: usuário e Vorgame, com catálogo local          |
| [4. Diagrama de Container](docs/4.%20Diagrama%20de%20Container.png)                            | C4 nível 2: aplicação web, backend e banco                 |
| [5. Diagrama de Componentes](docs/5.%20Diagrama%20de%20Componentes.png)                        | C4 nível 3: módulos do backend                             |
| [6. Diagrama de Código](docs/6.%20Diagrama%20de%20C%C3%B3digo.png)                             | C4 nível 4: classes Usuário, Jogo, Avaliação e Review      |
| [7. Contrato da API](docs/7.%20Contrato%20da%20API.md)                                         | Endpoints do protótipo com entrada, saída e erros          |

## Estrutura do repositório

```
/docs       documentação: histórias, ADRs, diagramas C4 e contrato da API
/backend    API REST em NestJS (esqueleto com a rota /health)
/frontend   aplicação web em React (página de status)
```

## Hospedagem

| Parte    | Plataforma                                                                    |
| -------- | ----------------------------------------------------------------------------- |
| Banco    | TiDB Cloud (compatível com MySQL), combinado com o professor no lugar do Neon |
| Backend  | Render                                                                        |
| Frontend | Vercel                                                                        |

## Estado atual

Fatia mínima ponta a ponta publicada:

- Frontend: https://vorgame.vercel.app
- API (rota de saúde): https://vorgame-api.onrender.com/health

**Atenção ao primeiro acesso:** o backend no plano gratuito do Render hiberna após cerca de 15 minutos sem uso. O primeiro acesso depois disso levou aproximadamente 30 segundos (medido em 19/11). Os acessos seguintes respondem normalmente. **Bloqueadores de anúncio** podem barrar as chamadas do site à API. Se a página mostrar "API indisponível", desative o bloqueador para este site e recarregue.
