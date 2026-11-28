import { ArrowUpRight, CircleAlert } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { rotuloMedia, rotuloTotal } from '../catalogo/apresentacao';
import { CapaJogo } from '../componentes/CapaJogo';
import { FormularioBusca } from '../componentes/FormularioBusca';
import { Alert, AlertDescription, AlertTitle } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Skeleton } from '../componentes/ui/skeleton';
import {
  ApiIndisponivelError,
  buscarJogos,
  ErroHttpApi,
  type JogoResumo,
} from '../servicos/api';
import './PaginaPesquisa.css';

type EstadoBusca =
  | { fase: 'carregando' }
  | { fase: 'concluido'; resultados: JogoResumo[] }
  | { fase: 'falhou'; mensagem: string };

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 400) {
    return 'Informe um título para pesquisar.';
  }
  if (erro instanceof ApiIndisponivelError) {
    return 'Verifique a conexão e tente novamente.';
  }
  return 'Não foi possível obter os resultados. Tente novamente.';
}

async function consultar(termo: string): Promise<EstadoBusca> {
  try {
    const { resultados } = await buscarJogos(termo);
    return { fase: 'concluido', resultados };
  } catch (erro: unknown) {
    return { fase: 'falhou', mensagem: descreverErro(erro) };
  }
}

function ResultadoJogo({ jogo, termo }: { jogo: JogoResumo; termo: string }) {
  const id = useId();
  return (
    <li>
      <Link
        aria-describedby={`${id}-nota`}
        aria-labelledby={id}
        className="pesquisa-resultado"
        state={{ termo }}
        to={`/jogos/${jogo.id}`}
      >
        <CapaJogo src={jogo.capa} titulo={jogo.titulo} />
        <h3 id={id}>{jogo.titulo}</h3>
        <div className="pesquisa-nota" id={`${id}-nota`}>
          <strong>
            {rotuloMedia(jogo.mediaAvaliacao, jogo.totalAvaliacoes)}
          </strong>
          <span>{rotuloTotal(jogo.totalAvaliacoes)}</span>
        </div>
        <ArrowUpRight aria-hidden="true" size={20} />
      </Link>
    </li>
  );
}

function EstadoResultados({
  estado,
  termo,
  repetir,
}: {
  estado: EstadoBusca;
  termo: string;
  repetir: () => void;
}) {
  if (estado.fase === 'carregando') {
    return (
      <div className="estado-pesquisa">
        <p role="status">
          Buscando jogos… A API pode levar até 1 minuto para responder.
        </p>
        <Skeleton aria-hidden="true" className="h-20 w-full rounded-lg" />
      </div>
    );
  }
  if (estado.fase === 'falhou') {
    return (
      <Alert className="estado-pesquisa">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Não foi possível carregar a pesquisa</AlertTitle>
        <AlertDescription>
          <p>{estado.mensagem}</p>
          <Button onClick={repetir} variant="outline">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!estado.resultados.length) {
    return (
      <p className="estado-pesquisa" role="status">
        Nenhum jogo encontrado para “{termo}”. Tente outro título.
      </p>
    );
  }
  return (
    <section
      aria-labelledby="titulo-resultados"
      className="resultados-pesquisa"
    >
      <h2 id="titulo-resultados">Resultados para “{termo}”</h2>
      <ul aria-label="Resultados da pesquisa">
        {estado.resultados.map((jogo) => (
          <ResultadoJogo jogo={jogo} key={jogo.id} termo={termo} />
        ))}
      </ul>
    </section>
  );
}

function ConsultaPesquisa({ termo }: { termo: string }) {
  const [estado, setEstado] = useState<EstadoBusca>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (ativo)
        void consultar(termo).then((resposta) => {
          if (ativo) setEstado(resposta);
        });
    });
    return () => {
      ativo = false;
    };
  }, [termo, tentativa]);

  function repetir() {
    setEstado({ fase: 'carregando' });
    setTentativa((valor) => valor + 1);
  }

  return (
    <>
      <FormularioBusca
        aoRepetir={repetir}
        carregando={estado.fase === 'carregando'}
        termo={termo}
      />
      <EstadoResultados estado={estado} repetir={repetir} termo={termo} />
    </>
  );
}

export function PaginaPesquisa() {
  const [parametros] = useSearchParams();
  const termo = parametros.get('q')?.trim() ?? '';

  return (
    <main className="limite pagina pagina-pesquisa">
      <h1>Pesquisar jogos</h1>
      <p className="introducao">
        Encontre um título e compare as notas da comunidade.
      </p>
      {termo ? (
        <ConsultaPesquisa key={termo} termo={termo} />
      ) : (
        <FormularioBusca />
      )}
    </main>
  );
}
