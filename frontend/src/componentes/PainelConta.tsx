import { Eye, EyeOff } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { JogoCurado } from '../catalogo/curadoria';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import './PainelConta.css';

export function CampoSenha({
  id,
  autoComplete,
}: {
  id: string;
  autoComplete: 'current-password' | 'new-password';
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="conta-campo">
      <label htmlFor={id}>Senha</label>
      <div className="campo-senha">
        <Input
          autoComplete={autoComplete}
          id={id}
          name="senha"
          required
          type={visivel ? 'text' : 'password'}
        />
        <Button
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          className="senha-acao"
          onClick={() => setVisivel(!visivel)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {visivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}

export function PainelConta({
  titulo,
  descricao,
  arte,
  children,
}: {
  titulo: string;
  descricao: string;
  arte: JogoCurado;
  children: ReactNode;
}) {
  return (
    <main className="limite pagina pagina-conta">
      <Card className="conta-painel">
        <h1>{titulo}</h1>
        <p className="conta-introducao">{descricao}</p>
        {children}
      </Card>
      <figure className="conta-arte">
        <img alt={arte.alternativa} decoding="async" src={arte.imagem} />
        <figcaption>{arte.titulo}</figcaption>
      </figure>
    </main>
  );
}
