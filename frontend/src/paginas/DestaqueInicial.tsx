import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { cyberpunk } from '../catalogo/curadoria';
import { FormularioBusca } from '../componentes/FormularioBusca';
import { Button } from '../componentes/ui/button';
import {
  jogoResolvido,
  rotaCuradoria,
  type ResultadosCurados,
} from './useCuradoria';
import './DestaqueInicial.css';

export function DestaqueInicial({
  resultados,
}: {
  resultados: ResultadosCurados;
}) {
  const jogo = resultados[cyberpunk.titulo];
  return (
    <section className="hero-catalogo" aria-labelledby="titulo-inicial">
      <picture className="hero-arte">
        <source
          media="(max-width: 700px)"
          srcSet="/midia/cyberpunk-night-city-800.webp"
        />
        <img
          alt={cyberpunk.alternativa}
          fetchPriority="high"
          height={900}
          src={cyberpunk.imagem}
          width={1600}
        />
      </picture>
      <div className="limite hero-grade">
        <div className="hero-texto">
          <h1 id="titulo-inicial">
            Encontre seu <span>próximo jogo.</span>
          </h1>
          <p>
            Busque um título ou explore jogos escolhidos para você conhecer.
          </p>
          <FormularioBusca />
          <a className="hero-explorar" href="#selecao">
            <ArrowDown size={18} aria-hidden="true" /> Explorar seleção
          </a>
        </div>
        <Link
          aria-label={
            jogoResolvido(jogo)
              ? `Ver ficha de ${cyberpunk.titulo}`
              : `Buscar ${cyberpunk.titulo}`
          }
          className="hero-jogo"
          to={rotaCuradoria(cyberpunk.titulo, jogo)}
        >
          <div>
            <span className="hero-jogo-titulo">{cyberpunk.titulo}</span>
            <p>{cyberpunk.descricao}</p>
          </div>
          <span className="hero-jogo-icone">
            <ArrowUpRight aria-hidden="true" size={23} />
          </span>
        </Link>
      </div>
    </section>
  );
}

export function ChamadaConta({ autenticado }: { autenticado: boolean }) {
  if (autenticado) return null;
  return (
    <section className="chamada-conta" aria-labelledby="titulo-chamada">
      <div>
        <h2 id="titulo-chamada">As suas notas têm um lugar.</h2>
        <p>Entre no Vorgame para ver suas notas nas fichas dos jogos.</p>
      </div>
      <div className="chamada-acoes">
        <Button asChild size="lg">
          <Link to="/cadastro">Criar conta</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/login">Entrar</Link>
        </Button>
      </div>
    </section>
  );
}
