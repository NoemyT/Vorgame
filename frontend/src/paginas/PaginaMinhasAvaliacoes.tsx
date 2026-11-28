import { ArrowUpRight, CircleAlert } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { CapaJogo } from '../componentes/CapaJogo';
import { Alert, AlertDescription, AlertTitle } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Skeleton } from '../componentes/ui/skeleton';
import {
  ErroHttpApi,
  listarMinhasAvaliacoes,
  type AvaliacaoListada,
} from '../servicos/api';
import { assinarSessao, temSessao } from '../servicos/sessao';
import './PaginaMinhasAvaliacoes.css';

type EstadoLista =
  | { fase: 'carregando' | 'falhou' | 'visitante' }
  | { fase: 'concluida'; avaliacoes: AvaliacaoListada[] };

async function carregarAvaliacoes(): Promise<EstadoLista> {
  try {
    const { avaliacoes } = await listarMinhasAvaliacoes();
    return { fase: 'concluida', avaliacoes };
  } catch (erro: unknown) {
    return {
      fase:
        erro instanceof ErroHttpApi && erro.statusCode === 401
          ? 'visitante'
          : 'falhou',
    };
  }
}

function ConviteLogin() {
  return (
    <div className="minhas-avaliacoes-estado">
      <p>Entre na sua conta para ver suas avaliações.</p>
      <Button asChild>
        <Link to="/login">Entrar</Link>
      </Button>
    </div>
  );
}

function ListaAvaliacoes({ avaliacoes }: { avaliacoes: AvaliacaoListada[] }) {
  if (!avaliacoes.length) {
    return (
      <div className="minhas-avaliacoes-estado">
        <p role="status">Você ainda não avaliou nenhum jogo.</p>
        <Button asChild>
          <Link to="/pesquisa">Pesquisar jogos</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul aria-label="Jogos que você avaliou" className="minhas-avaliacoes-lista">
      {avaliacoes.map(({ jogoId, titulo, capa, nota }) => (
        <li key={jogoId}>
          <Link className="minha-avaliacao-item" to={`/jogos/${jogoId}`}>
            <CapaJogo src={capa} titulo={titulo} alternativa="" />
            <div>
              <h2>{titulo}</h2>
              <p>
                Sua nota <strong>{nota}/10</strong>
              </p>
            </div>
            <ArrowUpRight aria-hidden="true" size={20} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PainelMinhasAvaliacoes({
  estado,
  repetir,
}: {
  estado: EstadoLista;
  repetir: () => void;
}) {
  switch (estado.fase) {
    case 'carregando':
      return (
        <div className="minhas-avaliacoes-estado">
          <p role="status">Carregando suas avaliações…</p>
          <Skeleton aria-hidden="true" className="h-20 w-full" />
        </div>
      );
    case 'falhou':
      return (
        <Alert className="minhas-avaliacoes-estado">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar suas avaliações</AlertTitle>
          <AlertDescription>
            <Button onClick={repetir} variant="outline">
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      );
    case 'visitante':
      return <ConviteLogin />;
    case 'concluida':
      return <ListaAvaliacoes avaliacoes={estado.avaliacoes} />;
  }
}

function ConsultaMinhasAvaliacoes() {
  const [estado, setEstado] = useState<EstadoLista>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (ativo)
        void carregarAvaliacoes().then((resposta) => {
          if (ativo) setEstado(resposta);
        });
    });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function repetir() {
    setEstado({ fase: 'carregando' });
    setTentativa((atual) => atual + 1);
  }

  return <PainelMinhasAvaliacoes estado={estado} repetir={repetir} />;
}

export function PaginaMinhasAvaliacoes() {
  const autenticado = useSyncExternalStore(assinarSessao, temSessao);
  return (
    <main className="limite pagina">
      <h1>Minhas avaliações</h1>
      <p className="introducao">
        Consulte suas notas e abra a ficha de cada jogo.
      </p>
      {autenticado ? <ConsultaMinhasAvaliacoes /> : <ConviteLogin />}
    </main>
  );
}
