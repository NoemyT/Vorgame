---
name: Vorgame
description: Catálogo de jogos em azul-noite com busca direta, curadoria manual e arte de jogos reais.
colors:
  primary: "#a4ddff"
  primary-foreground: "#102538"
  background: "#0e141e"
  card: "#171f2c"
  secondary: "#202d3d"
  foreground: "#f0f4fa"
  muted-foreground: "#b1bed0"
  border: "#303c4d"
  input: "#64768b"
  destructive: "#ffb4b8"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(4rem, 7.4vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.93
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 3.65rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.93rem"
    fontWeight: 650
    lineHeight: 1.55
rounded:
  sm: "calc(0.75rem - 4px)"
  md: "calc(0.75rem - 2px)"
  lg: "0.75rem"
  xl: "calc(0.75rem + 4px)"
spacing:
  margem-site: "clamp(1rem, 4vw, 3rem)"
  grade-jogos: "clamp(0.7rem, 1.8vw, 1.45rem)"
  secoes-iniciais: "clamp(2.75rem, 6vw, 5.25rem)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  input-conta:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.75rem"
    height: "2.9rem"
  nav-catalogo:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    height: "4.5rem"
  atalho-estilo:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "2.5rem"
  card-nota:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "clamp(1rem, 3vw, 1.55rem)"
  alerta-erro:
    backgroundColor: "{colors.card}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  destaque-jogo:
    backgroundColor: "#162333"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.9rem 1.05rem"
---

# Sistema visual do Vorgame

## Overview

**Creative North Star: "Catálogo em azul-noite"**

O site combina títulos condensados, superfícies azul-noite e imagens de jogos reais. O azul-gelo marca pontos de interação e ajuda a localizar a busca, os links e a seção ativa.

A descoberta usa capa, título e uma descrição curta do jogo. Na pesquisa e nas fichas, os painéis compactos dão espaço aos nomes, às informações do catálogo e às notas disponíveis.

**Key Characteristics:**

- Barlow Condensed para títulos e DM Sans para leitura e controles.
- Contraste tonal, contornos finos e azul-gelo para ações e foco.
- Arte de jogos reais na abertura, nos blocos por estilo e nas telas de conta.

## Colors

### Primary

O azul-gelo (`primary`) aparece no preenchimento da ação principal, nos links, no foco e na navegação ativa. O azul-petróleo escuro (`primary-foreground`) mantém o texto legível sobre esse preenchimento.

### Neutral

O azul-noite (`background`) cobre a página. O azul-ardósia (`card`) destaca cartões, alertas e o painel do menu móvel, e o azul-ardósia mais claro (`secondary`) aparece nas superfícies em interação. O quase branco (`foreground`) é a cor de leitura principal. O cinza azulado (`muted-foreground`) serve a descrições e informações de apoio. As bordas dos painéis e as divisórias usam `border`. Os campos usam o contorno mais claro de `input`.

O rosa claro (`destructive`) acompanha mensagens de erro e indica campos inválidos quando aplicável.

## Typography

As famílias são servidas localmente em WOFF2. Barlow Condensed (700) compõe os títulos. DM Sans (400 a 700) atende ao texto corrido, à navegação e aos controles, com corpo-base de `1rem` e entrelinha de `1.55`.

- Na abertura, o título em caixa alta tem entrelinha curta (`0.93`) e a segunda linha em azul-gelo. O tamanho se ajusta em `56rem` e `44rem`.
- Títulos de página e de seção usam entrelinha de `1.08` e espaçamento de `-0.015em`. O texto introdutório de páginas internas respeita o limite de `62ch`.
- Notas e contagens na curadoria, na pesquisa e nos valores das fichas usam algarismos tabulares.

## Layout

O contêiner principal tem largura máxima de `78rem` e margem lateral fluida. As páginas de texto e pesquisa chegam a `60rem`. As telas de conta e as fichas chegam a `69rem`.

- **Abertura.** Título, busca e atalho para a seleção ficam à esquerda, com a imagem em escala ampla e o acesso ao jogo em destaque à direita. Em `56rem`, a coluna da arte perde largura. Em `44rem` ou menos, a imagem passa a ocupar o fundo e a grade segue em uma coluna, com busca e seleção antes do acesso ao jogo.
- **Descoberta.** A seleção tem quatro cartões em uma grade uniforme, com duas colunas a partir de `48rem` para baixo. No mosaico por estilo, RPG de ação ocupa duas linhas com arte horizontal. Roguelike e Mundo aberto usam capas laterais. Em `48rem` ou menos, os blocos ficam em uma coluna.
- **Conta.** Login e cadastro usam duas colunas quase iguais para formulário e imagem. Em `44rem` ou menos, o formulário vem primeiro, seguido da imagem em proporção `2:1`.
- **Catálogo.** Em `37rem` ou menos, título e nota empilham no resultado de busca. Na ficha, capa e informações passam para uma coluna, assim como os painéis de nota.

## Elevation & Depth

Divisórias de `1px` e superfícies de tons próximos separam as áreas de leitura. Os cartões da seleção e os painéis de conta e de nota retiram a sombra do cartão-base. O menu lateral usa uma sombra ampla e uma sobreposição preta a 50% para destacar o diálogo. Gradientes escurecem a paisagem atrás do texto na abertura e sustentam a legenda sobre a imagem nas telas de conta.

## Shapes

Cartões da curadoria, blocos por estilo e recortes de arte usam cantos arredondados de `0.75rem`. O cartão-base usa `xl`, enquanto botões e campos usam `md`. As imagens dos cartões ocupam o topo até a borda. O círculo em torno da seta do destaque tem `2.5rem` de diâmetro.

A marca é um V geométrico ramificado, criado com o ImageGen integrado e com fundo transparente. A marca usa um PNG otimizado de 256 px, exibido a 34 px junto ao nome. O favicon de 48 px deriva da mesma imagem. Os dois PNGs guardam nos metadados o prompt de geração. A página `/creditos` registra autoria e licença das imagens locais usadas pelo catálogo. Os arquivos WebP locais têm registros de proveniência em `frontend/public/midia/`.

## Components

### Botões e links

O botão principal usa azul-gelo com texto escuro. O contornado usa o fundo da página e o fantasma usa fundo transparente. Ambos recebem a superfície `secondary` ao passar o ponteiro. Links de texto usam azul-gelo e sublinhado nos contextos de leitura. Os controles compartilhados mostram um anel de foco e reduzem a opacidade quando desabilitados. Os atalhos por estilo usam botões contornados com ícone e texto. A âncora realça com borda azul-gelo o bloco correspondente.

### Busca e formulários

Na busca, lupa e campo ficam juntos ao botão, com altura mínima de `3.1rem` e largura total de até `34rem`. Campos de conta têm rótulos acima, altura mínima de `2.9rem` e anel azul-gelo no foco. O botão no campo de senha alterna a visibilidade e anuncia sua ação. Os formulários exibem o envio em andamento e mensagens de sucesso ou erro.

### Navegação

O cabeçalho fixado no topo reúne marca, catálogo e acesso à conta. No desktop, a página ativa é indicada pela cor azul-gelo e por uma linha sob o link do catálogo. Em `44rem` ou menos, ficam disponíveis os atalhos de pesquisa e menu. O menu é um diálogo que abre da direita, oferece um botão de fechar rotulado e fecha ao selecionar um destino. O atalho de teclado para ir ao conteúdo aparece ao receber foco.

### Destaque e cartões de jogos

Na abertura, o cartão do jogo em destaque e a região da imagem associada são clicáveis pelo mesmo link. O foco por teclado fica no cartão. O link abre a ficha quando o jogo é identificado no catálogo e abre a busca pelo título nos demais estados. Na seleção, todo o cartão leva ao jogo, com capa, estilo, título e descrição. A nota aparece quando os dados do catálogo estão disponíveis. No foco ou ao passar o ponteiro, o título fica azul-gelo e a capa amplia discretamente. As animações respeitam a preferência por movimento reduzido.

A arte principal entra uma vez em 620 ms. Mudanças de cor e contorno levam 160 ms. Capas e setas usam 240 ms com desaceleração. Com movimento reduzido, a imagem aparece diretamente, os atalhos saltam para o destino e as cores ainda identificam foco e interação.

## Do's and Don'ts

- **Use** a paleta de superfícies, contornos e foco do CSS global nos componentes novos.
- **Use** imagens dos jogos com autoria, licença e origem registradas.
- **Use** texto para comunicar carregamento, ausência de resultados e falhas recuperáveis.
- **Evite** usar apenas cor para indicar página ativa, erro ou foco.
