import { useState } from 'react';
import type { JogoResumo } from '../servicos/api';
import './ComponentesCatalogo.css';

interface CapaJogoProps {
  jogo: Pick<JogoResumo, 'titulo' | 'capa'>;
  carregamento?: 'eager' | 'lazy';
}

export function CapaJogo({ jogo, carregamento }: CapaJogoProps) {
  const [falhou, setFalhou] = useState(false);

  if (!jogo.capa || falhou) {
    return (
      <span aria-label={`Capa indisponível para ${jogo.titulo}`} role="img">
        Capa indisponível
      </span>
    );
  }

  return (
    <img
      alt={`Capa de ${jogo.titulo}`}
      loading={carregamento}
      onError={() => setFalhou(true)}
      src={jogo.capa}
    />
  );
}

export function CreditoIgdb() {
  return (
    <p className="catalogo-credito">
      <a href="https://www.igdb.com/">Dados de jogos: IGDB</a>
    </p>
  );
}

interface NotaComunidadeProps {
  jogo: Pick<JogoResumo, 'mediaAvaliacao' | 'totalAvaliacoes'>;
  className?: string;
}

export function NotaComunidade({ jogo, className }: NotaComunidadeProps) {
  const { mediaAvaliacao, totalAvaliacoes } = jogo;
  return (
    <p className={className}>
      <strong>Nota média da comunidade do Vorgame:</strong>{' '}
      {mediaAvaliacao === null ? (
        'Ainda sem avaliações'
      ) : (
        <>
          {mediaAvaliacao.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          /10 <span aria-hidden="true">·</span> {totalAvaliacoes}{' '}
          {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
        </>
      )}
    </p>
  );
}
