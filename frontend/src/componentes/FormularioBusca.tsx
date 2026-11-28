import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { rotaPesquisa } from '../catalogo/apresentacao';
import { Button } from './ui/button';
import { Input } from './ui/input';
import './FormularioBusca.css';

export function FormularioBusca({
  termo = '',
  carregando = false,
  aoRepetir,
}: {
  termo?: string;
  carregando?: boolean;
  aoRepetir?: () => void;
}) {
  const id = useId();
  const navegar = useNavigate();
  const [vazio, setVazio] = useState(false);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = new FormData(evento.currentTarget).get('q');
    const consulta = typeof texto === 'string' ? texto.trim() : '';
    setVazio(!consulta);
    if (!consulta) return;
    if (consulta === termo) aoRepetir?.();
    else void navegar(rotaPesquisa(consulta));
  }

  return (
    <form className="formulario-busca" onSubmit={enviar} role="search">
      <label className="sr-only" htmlFor={id}>
        Nome do jogo
      </label>
      <div className="busca-controles">
        <div className="busca-campo">
          <Search aria-hidden="true" size={19} />
          <Input
            aria-describedby={vazio ? `${id}-erro` : undefined}
            aria-invalid={vazio || undefined}
            defaultValue={termo}
            id={id}
            name="q"
            onChange={() => setVazio(false)}
            placeholder="Buscar por título"
            required
            type="search"
          />
        </div>
        <Button disabled={carregando} size="lg" type="submit">
          {carregando ? 'Pesquisando…' : 'Pesquisar'}
        </Button>
      </div>
      {vazio && (
        <p id={`${id}-erro`} role="alert">
          Informe um título para pesquisar.
        </p>
      )}
    </form>
  );
}
