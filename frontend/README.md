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

## Integração prevista

O frontend será uma aplicação React com navegação no navegador, consumindo a API REST do backend NestJS em JSON. MySQL e Prisma serão utilizados exclusivamente pelo backend. As telas seguirão as [histórias de usuário](../docs/1.%20Hist%C3%B3rias%20de%20Usu%C3%A1rio%20%28Alta%29.md) e o recorte da entrega.

A URL da API será configurada pela variável `VITE_API_BASE_URL`. Variáveis expostas pelo Vite fazem parte do código entregue ao navegador; credenciais de banco e outros segredos pertencem ao backend.

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
| `npm run lint`  | Linter (oxlint)                              |
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

Página de status da Etapa 2 implementada: chama `GET /health` e exibe "API OK · Banco OK", com mensagens para carregamento (incluindo o tempo de despertar do Render), banco com erro e API indisponível. As telas das histórias serão implementadas na Etapa 6.

## Referências

- [React](https://react.dev/learn)
- [Vite: início e requisitos do ambiente](https://vite.dev/guide/)
- [Vite: variáveis de ambiente](https://vite.dev/guide/env-and-mode/)
