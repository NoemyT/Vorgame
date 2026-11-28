# Frontend — Vorgame

## Stack escolhida

| Responsabilidade            | Tecnologia                            |
| --------------------------- | ------------------------------------- |
| Linguagem                   | TypeScript                            |
| Interface                   | React                                 |
| Desenvolvimento e build     | Vite, template `react-ts`             |
| Navegação                   | React Router                          |
| Estilos                     | CSS, Tailwind CSS 4 e tailwind-merge   |
| Componentes e ícones        | Radix UI, componentes locais baseados em shadcn/ui e Lucide React |
| Requisições HTTP            | API `fetch` do navegador              |
| Ambiente de desenvolvimento | Node.js 22 LTS, com npm               |
| Testes de componentes       | Vitest, jsdom e React Testing Library |
| Linter                      | oxlint                                |

React permite organizar as telas em componentes reutilizáveis, e TypeScript explicita os dados trocados com a API. Vite fornece o ambiente de desenvolvimento e o build da aplicação. CSS e Tailwind CSS organizam os estilos, com componentes reutilizáveis de interface. As requisições usam `fetch` sem biblioteca HTTP adicional.

## Integração com o catálogo

A aplicação React consome a API REST do Vorgame em JSON. A busca em `/pesquisa` usa `GET /games?q={termo}` e abre `/jogos/:id` com o ID numérico que o backend atribui ao jogo. A tela de detalhes usa esse mesmo ID para consultar os dados armazenados e a nota do usuário autenticado.

A URL da API vem de `VITE_API_BASE_URL`. O backend configura `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET` e faz o OAuth com a Twitch. A média exibida vem das avaliações do Vorgame.

Uma busca concluída com lista vazia indica que nenhum jogo foi encontrado. Uma falha de busca, incluindo `503`, exibe uma mensagem genérica com a opção **Tentar novamente**. As telas mostram texto alternativo e uma indicação de capa indisponível quando a URL está ausente ou a imagem falha ao carregar. Os detalhes também indicam a ausência de descrição, gênero ou plataformas.

O crédito visível [Dados de jogos: IGDB](https://www.igdb.com/) aparece no rodapé compartilhado. A página `/creditos` registra as fontes das imagens da página inicial e a geração da marca Vorgame com ImageGen.

A página inicial apresenta uma curadoria de títulos predefinidos, consultados pela API. Quando há uma correspondência exata e única, o link abre os detalhes pelo ID local; caso contrário, encaminha para a pesquisa.

## Organização

```
src/
  main.tsx              inicia a aplicação
  App.tsx               rotas (React Router)
  servicos/api.ts       camada de serviço: todas as chamadas à API passam por aqui
  servicos/sessao.ts    sessão JWT em sessionStorage
  servicos/catalogo-respostas.ts  tipos e validação das respostas do catálogo
  catalogo/            curadoria e apresentação de jogos
  componentes/         layout, capas, formulários e componentes de interface
  paginas/              telas e fluxos de avaliação
  testes/configurar.ts  configuração dos testes
vercel.json             faz todas as rotas abrirem o index.html (navegação do React Router)
```

Os componentes não chamam `fetch` diretamente: usam as funções de `servicos/api.ts`, que seguem o [contrato da API](../docs/7.%20Contrato%20da%20API.md).

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha o valor.

| Variável            | Uso                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Endereço da API, sem barra no final. Local: `http://localhost:3000`. Publicado: a URL do serviço no Render. |

## Como rodar localmente

```bash
cd frontend
npm ci
npm run dev   # http://localhost:5173
```

| Comando         | O que faz                                    |
| --------------- | -------------------------------------------- |
| `npm test`      | Testes de componentes e da camada de serviço |
| `npm run lint`  | Linter (oxlint; ESLint aguarda suporte ao TypeScript 7) |
| `npm run lint:fix` | Corrige automaticamente o que o Oxlint suporta |
| `npm run format` | Formata fontes e configurações com Prettier |
| `npm run build` | Gera a versão de produção em `dist/`         |

## Deploy na Vercel

| Campo            | Valor               |
| ---------------- | ------------------- |
| Root Directory   | `frontend`          |
| Framework Preset | Vite                |
| Build Command    | `npm run build`     |
| Output Directory | `dist`              |
| Variável         | `VITE_API_BASE_URL` |

## Telas e funcionalidades

| Rota | Funcionalidade |
| ---- | -------------- |
| `/` | Página inicial com destaques e curadoria de jogos |
| `/status` | Consulta à saúde da API e do banco |
| `/cadastro` | HU01 — Criar conta |
| `/login` | HU02 — Fazer login |
| `/pesquisa` | HU03 — Pesquisar jogos |
| `/jogos/:id` | HU04 — Visualizar detalhes e HU05 — Avaliar jogo |
| `/minhas-avaliacoes` | Consultar as avaliações da própria conta |
| `/creditos` | Créditos das imagens e da marca |

A pesquisa e os detalhes são públicos. Para avaliar, o usuário deve estar autenticado. A sessão usa JWT armazenado em `sessionStorage`; respostas HTTP 401 da camada de serviço limpam o token.

Na tela de detalhes, o usuário autenticado pode criar uma nota inteira de 0 a 10 ou alterar a nota existente. O serviço `gravarAvaliacao` utiliza `POST /games/{id}/ratings` para criação e `PUT /games/{id}/ratings/me` para alteração. Após salvar, a interface atualiza a nota pessoal, a média e o total de avaliações com a resposta da API.

A página de minhas avaliações usa `GET /ratings/me` e permite voltar aos detalhes de cada jogo avaliado. As telas tratam carregamento, falhas e estados vazios quando aplicável.

## Estado atual

O código final do frontend implementa as cinco histórias do escopo. A publicação de reviews (HU06) permanece adiada. Há testes automatizados de páginas, componentes e serviços, incluindo criação e alteração de notas, falhas de requisição e metadados ausentes. O roteiro de validação integrada está no [README do backend](../backend/README.md#roteiro-de-aceite-com-terraria).

O Oxlint está configurado para o frontend, mas ainda não aplica todos os limites de tamanho e complexidade definidos no AGENTS.md. A existência dos testes não substitui a execução do aceite na versão publicada.

## Referências

- [React](https://react.dev/learn)
- [Vite: início e requisitos do ambiente](https://vite.dev/guide/)
- [Vite: variáveis de ambiente](https://vite.dev/guide/env-and-mode/)
