# Frontend — Vorgame

## Stack escolhida

| Responsabilidade            | Tecnologia                            |
| --------------------------- | ------------------------------------- |
| Linguagem                   | TypeScript                            |
| Interface                   | React                                 |
| Desenvolvimento e build     | Vite, template `react-ts`             |
| Navegação                   | React Router                          |
| Estilos                     | CSS                                   |
| Requisições HTTP            | API `fetch` do navegador              |
| Ambiente de desenvolvimento | Node.js 22 LTS, com npm               |
| Testes de componentes       | Vitest, jsdom e React Testing Library |
| Linter                      | oxlint                                |

React permite organizar as telas em componentes reutilizáveis, e TypeScript explicita os dados trocados com a API. Vite fornece o ambiente de desenvolvimento e o build da aplicação. CSS e `fetch` atendem às necessidades iniciais sem bibliotecas adicionais de estilos ou de requisições.

## Integração com o catálogo

A aplicação React consome a API REST do Vorgame em JSON. A busca em `/pesquisa` usa `GET /games?q={termo}` e abre `/jogos/:id` com o ID numérico que o backend atribui ao jogo. A tela de detalhes usa esse mesmo ID para consultar os dados armazenados e a nota do usuário autenticado.

A URL da API vem de `VITE_API_BASE_URL`. O backend configura `IGDB_CLIENT_ID` e `IGDB_CLIENT_SECRET` e faz o OAuth com a Twitch. A média exibida vem das avaliações do Vorgame.

Uma busca concluída com lista vazia indica que nenhum jogo foi encontrado. Uma falha de busca, incluindo `503`, exibe uma mensagem genérica com a opção **Tentar novamente**. As telas mostram texto alternativo e avisam quando o campo de capa está vazio. Os detalhes indicam quando o jogo vem sem plataformas.

O crédito visível [Dados de jogos: IGDB](https://www.igdb.com/), o tratamento de erros de carregamento de capa e a indicação de descrição ou gênero ausentes estão pendentes.

## Organização

```
src/
  main.tsx              inicia a aplicação
  App.tsx               rotas (React Router)
  servicos/api.ts       camada de serviço: todas as chamadas à API passam por aqui
  paginas/              telas
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

## Estado atual

O frontend tem telas de status, cadastro, login, busca e detalhes. Em detalhes, o visitante recebe um link para entrar, e o usuário autenticado vê sua nota ou a indicação de que ainda não avaliou o jogo. A criação e a alteração da nota podem ser feitas no Swagger, conforme o [roteiro de aceite](../backend/README.md#roteiro-de-aceite-com-terraria).

## Referências

- [React](https://react.dev/learn)
- [Vite: início e requisitos do ambiente](https://vite.dev/guide/)
- [Vite: variáveis de ambiente](https://vite.dev/guide/env-and-mode/)
