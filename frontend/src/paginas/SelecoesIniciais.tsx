import {
  ArrowUpRight,
  CircleAlert,
  Dices,
  Map,
  Swords,
} from 'lucide-react';
import { Link } from 'react-router';
import { rotuloMedia, rotuloTotal } from '../catalogo/apresentacao';
import {
  cyberpunk,
  gta,
  isaac,
  jogosCurados,
  witcher,
  type JogoCurado,
} from '../catalogo/curadoria';
import { CapaJogo } from '../componentes/CapaJogo';
import { Alert, AlertDescription, AlertTitle } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Card } from '../componentes/ui/card';
import { Skeleton } from '../componentes/ui/skeleton';
import {
  jogoResolvido,
  rotaCuradoria,
  type ResultadosCurados,
  type useCuradoria,
} from './useCuradoria';

function CartaoCurado({
  selecao,
  resultados,
}: {
  selecao: JogoCurado;
  resultados: ResultadosCurados;
}) {
  const resultado = resultados[selecao.titulo];
  const jogo = jogoResolvido(resultado);
  return (
    <li>
      <Card className="cartao-jogo">
        <Link
          aria-label={selecao.titulo}
          to={rotaCuradoria(selecao.titulo, resultado)}
        >
          {resultado === undefined && !selecao.imagem ? (
            <Skeleton aria-hidden="true" className="capa-esqueleto" />
          ) : (
            <CapaJogo
              src={jogo?.capa || selecao.imagem}
              titulo={selecao.titulo}
              alternativa={!jogo?.capa ? selecao.alternativa : undefined}
            />
          )}
          <div className="cartao-jogo-texto">
            <span className="cartao-estilo">{selecao.estilo}</span>
            <h3>
              {selecao.titulo} <ArrowUpRight size={17} aria-hidden="true" />
            </h3>
            <p>{selecao.descricao}</p>
            {jogo && (
              <p className="nota-cartao">
                <strong>
                  {rotuloMedia(jogo.mediaAvaliacao, jogo.totalAvaliacoes)}
                </strong>
                {jogo.totalAvaliacoes > 0 && (
                  <span>{rotuloTotal(jogo.totalAvaliacoes)}</span>
                )}
              </p>
            )}
          </div>
        </Link>
      </Card>
    </li>
  );
}

export function SelecaoInicial({
  curadoria,
}: {
  curadoria: ReturnType<typeof useCuradoria>;
}) {
  const { resultados, carregando, temFalha, tentarNovamente } = curadoria;
  return (
    <section
      className="secao-inicial"
      id="selecao"
      aria-labelledby="titulo-selecao"
    >
      <div className="secao-topo">
        <div>
          <h2 id="titulo-selecao">Seleção em destaque</h2>
          <p>Quatro jogos escolhidos pela curadoria do Vorgame.</p>
        </div>
        <Link className="secao-link" to="/pesquisa">
          Pesquisar no catálogo <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      {carregando && (
        <p className="sr-only" role="status">
          Consultando jogos da seleção…
        </p>
      )}
      {temFalha && !carregando && (
        <Alert className="aviso-curadoria">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Parte da seleção está indisponível</AlertTitle>
          <AlertDescription>
            <Button onClick={tentarNovamente} size="sm" variant="outline">
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <ul className="grade-jogos">
        {jogosCurados.map((selecao) => (
          <CartaoCurado
            key={selecao.titulo}
            resultados={resultados}
            selecao={selecao}
          />
        ))}
      </ul>
    </section>
  );
}

const estilos: { id: string; nome: string; icone: typeof Swords; jogos: JogoCurado[] }[] = [
  {
    id: 'rpg',
    nome: 'RPG de ação',
    icone: Swords,
    jogos: [witcher, cyberpunk],
  },
  { id: 'roguelike', nome: 'Roguelike', icone: Dices, jogos: [isaac] },
  { id: 'mundo-aberto', nome: 'Mundo aberto', icone: Map, jogos: [gta] },
];

function FaixaEstilo({
  estilo,
  resultados,
}: {
  estilo: (typeof estilos)[number];
  resultados: ResultadosCurados;
}) {
  const { id, nome, jogos } = estilo;
  const destaque = jogos[0];
  return (
    <section
      className={`estilo estilo-${id}`}
      id={`estilo-${id}`}
      aria-labelledby={`titulo-${id}`}
      tabIndex={-1}
    >
      {destaque.imagem ? (
        <img alt="" decoding="async" loading="lazy" src={destaque.imagem} />
      ) : (
        <CapaJogo src={jogoResolvido(resultados[destaque.titulo])?.capa} titulo={destaque.titulo} />
      )}
      <div className="estilo-conteudo">
        <h3 id={`titulo-${id}`}>{nome}</h3>
        <ul>
          {jogos.map(({ titulo, descricao }) => (
            <li key={titulo}>
              <Link to={rotaCuradoria(titulo, resultados[titulo])}>
                <span>{titulo}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <p>{descricao}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ExploreEstilos({
  resultados,
}: {
  resultados: ResultadosCurados;
}) {
  return (
    <section className="secao-inicial" aria-labelledby="titulo-estilos">
      <div className="secao-topo">
        <div>
          <h2 id="titulo-estilos">Explore por estilo</h2>
          <p>Escolha o tipo de experiência que você quer jogar.</p>
        </div>
        <nav className="atalhos-estilo" aria-label="Estilos de jogo">
          {estilos.map(({ id, nome, icone: Icone }) => (
            <Button asChild key={id} size="sm" variant="outline">
              <a href={`#estilo-${id}`}>
                <Icone size={16} aria-hidden="true" />
                {nome}
              </a>
            </Button>
          ))}
        </nav>
      </div>
      <div className="grade-estilos">
        {estilos.map((estilo) => (
          <FaixaEstilo
            key={estilo.id}
            estilo={estilo}
            resultados={resultados}
          />
        ))}
      </div>
    </section>
  );
}
