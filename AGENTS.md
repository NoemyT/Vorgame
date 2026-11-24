# Vorgame — guia de código

Vorgame é uma rede social para pesquisar jogos e registrar avaliações. O protótipo cobre HU01–HU05; reviews ficam adiadas.  
A arquitetura obrigatória é um monólito modular em camadas, com API NestJS e persistência Prisma em MySQL/TiDB.

## Documentos de referência

- [Histórias de usuário e escopo](docs/1.%20Hist%C3%B3rias%20de%20Usu%C3%A1rio%20%28Alta%29.md)
- [ADR-001 e ADR-002](docs/2.%20ADR.md)
- [Diagrama de contexto](docs/3.%20Diagrama%20de%20Contexto.png), [containers](docs/4.%20Diagrama%20de%20Container.png), [componentes](docs/5.%20Diagrama%20de%20Componentes.png) e [classes](docs/6.%20Diagrama%20de%20C%C3%B3digo.png)
- [Contrato da API](docs/7.%20Contrato%20da%20API.md)

Em conflito, ADRs e contrato aprovados prevalecem sobre este guia. Não invente decisões para lacunas: registre-as e peça confirmação.

## Camadas e responsabilidades

### Backend

| Camada | Pode | Não pode |
|---|---|---|
| Controller HTTP (`*.controller.ts`) | Receber requisições, validar DTOs com `ValidationPipe`, chamar o service e mapear respostas/exceções HTTP. | Implementar regras de negócio, acessar Prisma ou calcular resultados de domínio. |
| Aplicação/domínio (`*.service.ts`) | Executar casos de uso e regras; decidir resultados e coordenar operações. Para avaliações, solicitar uma operação atômica que grave a nota e atualize a média. | Importar/injetar `PrismaService`, escrever SQL ou depender de detalhes HTTP. |
| Acesso a dados | Encapsular Prisma, consultas, persistência e transações; expor operações tipadas para os services. | Conter validação HTTP ou decisões de negócio independentes do banco. |

Prisma só pode ser acessado na camada de dados. Nenhuma regra de negócio fica no controller. Mantenha fronteiras dos módulos Usuários/Autenticação, Catálogo e Avaliações; Reviews continua adiado até decisão de escopo.

### Frontend

| Camada | Pode | Não pode |
|---|---|---|
| Páginas (`src/paginas/`) | Compor telas/rotas, controlar estado de tela e chamar serviços de API. | Chamar `fetch`/Axios ou conhecer detalhes de persistência. |
| Componentes React | Renderizar dados e estados, receber props e emitir eventos; manter lógica local de apresentação. | Fazer chamadas HTTP ou conter regras de negócio do backend. |
| Serviço de API (`src/servicos/`) | Ser o único ponto de chamadas HTTP; usar `fetch`, `VITE_API_BASE_URL`, tipos e contrato JSON. | Acessar banco ou duplicar regras de domínio. |

Não use `fetch`/Axios dentro de componentes ou páginas. O frontend acessa o backend, nunca o banco.

## Nomes e contrato

- Use os termos do domínio em português: `jogo`, `avaliacao`, `usuario` e `review`; preserve nomes de campos e rotas já aprovados no contrato.
- NestJS: módulos em `*.module.ts`, controllers em `*.controller.ts`, services em `*.service.ts`; nomes de classes em PascalCase e métodos/variáveis em camelCase.
- React: componentes e páginas em PascalCase (`PaginaStatus.tsx`); hooks começam com `use`; funções e variáveis em camelCase.
- Rotas, métodos, DTOs e formatos de resposta devem seguir [Contrato da API](docs/7.%20Contrato%20da%20API.md). Não renomeie `/auth/*`, `/games/*` ou campos JSON sem aprovação.

## Limites verificáveis

- Máximo **50 linhas executáveis por função**, ignorando linhas em branco e comentários.
- Máximo **4 parâmetros por função**.
- Complexidade ciclomática máxima **10**.
- Máximo **300 linhas não vazias e não comentadas por arquivo de código**.

Os limites reduzem funções e arquivos difíceis de revisar numa equipe pequena. Extraia funções/coordenadores coesos quando excedidos; não os contorne desativando regras. ESLint aplica esses limites no backend. O lint do frontend permanece Oxlint enquanto o parser ESLint/type-aware não suportar o TypeScript 7 do projeto.

## Erros e comentários

- Use exceções NestJS específicas (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`, `ServiceUnavailableException`) para os casos correspondentes; não use `catch` genérico para esconder falhas.
- Erros HTTP seguem o formato NestJS do contrato: `{ "statusCode": número, "message": texto ou lista, "error": texto }`. Jogo inexistente e usuário que ainda não avaliou retornam **404**, conforme contrato.
- Mensagens devem indicar o problema sem revelar segredos ou dados internos. Capture exceções apenas quando puder tratá-las ou traduzi-las explicitamente.
- Comente o **porquê** de uma decisão não óbvia; não mantenha código comentado.

## Testes

- Use Vitest; backend também usa Supertest; frontend usa React Testing Library e `user-event`.
- Todo endpoint e todo componente com lógica comportamental deve nascer com teste que cubra sucesso e falhas/estados relevantes.
- Backend: `npm test` e `npm run test:e2e`. Frontend: `npm test`.
- Testes usam dados fictícios; não dependem de credenciais ou banco real quando um provider pode ser isolado.

## Segurança e privacidade

- Segredos, inclusive segredo JWT e string de conexão TiDB, existem somente em variáveis de ambiente do backend. Nunca os inclua em código, frontend, logs ou exemplos.
- Mantenha `.env.example` atualizado apenas com nomes e placeholders sem credenciais. Não leia, mostre ou versione `.env`.
- Valide entradas na borda HTTP; não confie em tipos TypeScript como validação em runtime.
- Armazene apenas dados pessoais necessários ao caso de uso (LGPD); nunca registre senha, token ou string de conexão em log.
- Use dados fictícios em exemplos, testes, seeds e capturas.

## Dependências

- Antes de adicionar pacote, confira se a capacidade já existe e se o pacote é mantido/compatível. Justifique a necessidade e obtenha aprovação do grupo para novas dependências.
- `class-validator`, `class-transformer` e `@nestjs/swagger` estão previstos no ADR-002 e serão adicionados na etapa de backend, após aprovação do grupo. DTOs, validação e OpenAPI devem então seguir o ADR e o contrato.
- Não altere versões de runtime ou stack para contornar incompatibilidades sem aprovação. Atualmente TypeScript 7 no frontend não é suportado pelo `typescript-eslint` disponível; além disso, a versão verificada de `eslint-plugin-jsx-a11y` declara suporte até ESLint 9. Por isso, ESLint e `eslint-plugin-jsx-a11y` no frontend estão pendentes. Acessibilidade continua obrigatória e será lintada quando houver versões compatíveis.

## Requisitos de interface

- Telas com dados assíncronos apresentam estados de carregamento, erro e lista vazia. O Render gratuito pode levar cerca de **1 minuto** para responder após hibernar.
- Inclua rótulos acessíveis, contraste legível, foco visível e operação por teclado. Use elementos HTML semânticos e texto alternativo apropriado.
- A URL da API vem somente de `VITE_API_BASE_URL`; nenhuma credencial pode ser exposta por variável `VITE_*`.

## Fluxo de trabalho

- Implemente e revise **um endpoint ou componente por vez**, preservando o escopo do protótipo.
- Prefira mudanças pequenas e coesas; não misture refatorações não relacionadas. O agente não cria commits sem pedido explícito do grupo.
- Ao concluir, informe arquivos alterados, comportamento, testes/lint executados e limitações pendentes.

## Modelo de prompt do grupo

```text
Contexto: produto, arquitetura aprovada e estado atual relevante.
Tarefa: um endpoint, componente ou mudança pequena, com escopo explícito.
Critérios de qualidade: comportamento, testes e regras deste AGENTS.md.
Restrições: arquivos/áreas proibidos, segurança, dependências e limites.
Formato de saída: resumo, arquivos alterados, validações e pendências.
```

## Checklist de revisão

- [ ] Segue ADRs, histórias e contrato; não inventa decisões pendentes.
- [ ] Responsabilidades respeitam as camadas; Prisma/fetch estão nos locais permitidos.
- [ ] Entradas validadas e erros específicos no formato da API.
- [ ] Funções/arquivos respeitam limites; lint e formatter passam.
- [ ] Testes cobrem o endpoint/componente e seus estados relevantes.
- [ ] Sem segredos, dados pessoais desnecessários ou senhas em logs.
- [ ] Interface acessível e com loading/erro/vazio quando aplicável.
- [ ] Dependências novas foram verificadas, justificadas e aprovadas.
- [ ] Resumo final informa mudanças, verificações e lacunas.

## Pendências conhecidas — não decidir sem o grupo

- Detalhes operacionais do JWT (expiração, renovação, logout e armazenamento) ainda não estão especificados.
- O grupo informa que modelo e seeds foram definidos, mas ainda não estão registrados em `backend/prisma/schema.prisma`; confirmar e registrar a decisão aprovada antes de implementar persistência.
- A compatibilidade do parser ESLint com TypeScript 7 e do `eslint-plugin-jsx-a11y` com ESLint 10 precisa ser resolvida antes de ativar ESLint no frontend.
