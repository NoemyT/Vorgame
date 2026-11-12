# Frontend — Vorgame

## Stack escolhida

| Responsabilidade | Tecnologia |
| --- | --- |
| Linguagem | TypeScript |
| Interface | React |
| Desenvolvimento e build | Vite, template `react-ts` |
| Navegação | React Router |
| Estilos | CSS |
| Requisições HTTP | API `fetch` do navegador |
| Ambiente de desenvolvimento | Node.js LTS compatível com o Vite escolhido e com as ferramentas do backend, com npm |
| Testes de componentes | Vitest e React Testing Library |

React permite organizar as telas em componentes reutilizáveis, e TypeScript explicita os dados trocados com a API. Vite fornece o ambiente de desenvolvimento e o build da aplicação. CSS e `fetch` atendem às necessidades iniciais sem bibliotecas adicionais de estilos ou de requisições.

## Integração prevista

O frontend será uma aplicação React com navegação no navegador, consumindo a API REST do backend NestJS em JSON. MySQL e Prisma serão utilizados exclusivamente pelo backend. As telas seguirão as [histórias de usuário](../docs/1.%20Hist%C3%B3rias%20de%20Usu%C3%A1rio%20%28Alta%29.md) e o recorte da entrega.

A URL da API será configurada pela variável `VITE_API_BASE_URL`. Variáveis expostas pelo Vite fazem parte do código entregue ao navegador; credenciais de banco e outros segredos pertencem ao backend.

## Estado atual

A stack está decidida, mas o frontend ainda não foi implementado. Ainda não existem `package.json`, telas ou comandos de execução no repositório. As versões exatas das bibliotecas serão fixadas no manifesto e no arquivo de lock durante a implementação. Os tipos e as chamadas HTTP deverão seguir o futuro contrato da API.

## Referências

- [React](https://react.dev/learn)
- [Vite: início e requisitos do ambiente](https://vite.dev/guide/)
- [Vite: variáveis de ambiente](https://vite.dev/guide/env-and-mode/)
