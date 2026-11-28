import { Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import './CapaJogo.css';

interface CapaJogoProps {
  src?: string;
  titulo: string;
  prioridade?: boolean;
  alternativa?: string;
}

function ImagemCapa({ src, titulo, prioridade, alternativa }: CapaJogoProps) {
  const [quebrou, setQuebrou] = useState(false);
  if (!src?.trim() || quebrou) {
    return (
      <span className="capa-ausente">
        <Gamepad2 aria-hidden="true" />
        Capa indisponível
      </span>
    );
  }

  return (
    <img
      alt={alternativa ?? `Capa de ${titulo}`}
      decoding="async"
      loading={prioridade ? 'eager' : 'lazy'}
      onError={() => setQuebrou(true)}
      src={src}
    />
  );
}

export function CapaJogo(props: CapaJogoProps) {
  return (
    <div className="capa-jogo">
      <ImagemCapa key={props.src} {...props} />
    </div>
  );
}
