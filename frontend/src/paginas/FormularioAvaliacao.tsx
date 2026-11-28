import { useId, type FormEvent } from 'react';
import { Button } from '../componentes/ui/button';

const notas = Array.from({ length: 11 }, (_, indice) => indice);

export function FormularioAvaliacao({
  nota,
  salvando,
  salvar,
}: {
  nota?: number;
  salvando: boolean;
  salvar: (nota: number) => void;
}) {
  const id = useId();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const valor = new FormData(evento.currentTarget).get('nota');
    if (typeof valor === 'string' && valor !== '') salvar(Number(valor));
  }

  return (
    <form
      className="formulario-avaliacao"
      onSubmit={enviar}
      aria-busy={salvando}
    >
      <div>
        <label htmlFor={id}>Sua nota (0 a 10)</label>
        <select
          defaultValue={nota ?? ''}
          disabled={salvando}
          id={id}
          name="nota"
          required
        >
          <option disabled value="">
            Escolha uma nota
          </option>
          {notas.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
      </div>
      <Button disabled={salvando} type="submit">
        {salvando
          ? 'Salvando…'
          : nota === undefined
            ? 'Avaliar jogo'
            : 'Salvar nova nota'}
      </Button>
    </form>
  );
}
