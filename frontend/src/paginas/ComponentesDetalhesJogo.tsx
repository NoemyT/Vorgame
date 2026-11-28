import { CircleAlert, Star, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { rotuloMedia, rotuloTotal } from '../catalogo/apresentacao';
import { CapaJogo } from '../componentes/CapaJogo';
import { Alert, AlertDescription, AlertTitle } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Card } from '../componentes/ui/card';
import { Skeleton } from '../componentes/ui/skeleton';
import type { JogoDetalhes } from '../servicos/api';

export type EstadoDetalhes =
  | { fase: 'carregando' }
  | { fase: 'concluido'; jogo: JogoDetalhes }
  | { fase: 'falhou'; mensagem: string; repetir: boolean };

export type EstadoAvaliacao =
  | { fase: 'visitante'; sessaoExpirada: boolean }
  | { fase: 'carregando' }
  | { fase: 'sem_nota' }
  | { fase: 'com_nota'; nota: number }
  | { fase: 'falhou'; mensagem: string };

export function PainelDetalhes({
  estado,
  tentarNovamente,
}: {
  estado: EstadoDetalhes;
  tentarNovamente: () => void;
}) {
  if (estado.fase === 'concluido') return null;
  return (
    <div className="detalhes-espera">
      <h1>Detalhes do jogo</h1>
      {estado.fase === 'carregando' ? (
        <>
          <p className="introducao" role="status">
            Carregando detalhes… A API pode levar até 1 minuto para responder.
          </p>
          <Skeleton
            aria-hidden="true"
            className="mt-4 h-32 w-full rounded-lg"
          />
        </>
      ) : (
        <Alert className="mt-4">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{estado.mensagem}</AlertTitle>
          {estado.repetir && (
            <AlertDescription>
              <Button onClick={tentarNovamente} variant="outline">
                Tentar novamente
              </Button>
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  );
}

export function InformacoesJogo({ jogo }: { jogo: JogoDetalhes }) {
  const plataformas = jogo.plataformas.filter((plataforma) =>
    plataforma.trim(),
  );
  return (
    <section aria-labelledby="detalhes-titulo" className="detalhes-jogo">
      <CapaJogo prioridade src={jogo.capa} titulo={jogo.titulo} />
      <div className="detalhes-conteudo">
        <h1 id="detalhes-titulo">{jogo.titulo}</h1>
        <p className="detalhes-descricao">
          {jogo.descricao.trim() || 'Descrição indisponível.'}
        </p>
        <dl className="detalhes-metadados">
          <div>
            <dt>Gênero</dt>
            <dd>{jogo.genero.trim() || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Plataformas</dt>
            <dd>{plataformas.join(', ') || 'Não informadas'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function MediaComunidade({ jogo }: { jogo: JogoDetalhes }) {
  return (
    <section aria-labelledby="detalhes-media">
      <Card className="detalhes-painel">
        <h2 id="detalhes-media">
          <Star aria-hidden="true" size={21} /> Média da comunidade
        </h2>
        <p className="detalhes-valor">
          {rotuloMedia(jogo.mediaAvaliacao, jogo.totalAvaliacoes)}
        </p>
        {jogo.totalAvaliacoes > 0 && <p>{rotuloTotal(jogo.totalAvaliacoes)}</p>}
      </Card>
    </section>
  );
}

function NotaPessoal({
  estado,
  tentarNovamente,
}: {
  estado: EstadoAvaliacao;
  tentarNovamente: () => void;
}) {
  switch (estado.fase) {
    case 'carregando':
      return <p role="status">Consultando sua avaliação…</p>;
    case 'sem_nota':
      return <p role="status">Você ainda não avaliou este jogo.</p>;
    case 'com_nota':
      return (
        <p role="status">
          Sua avaliação atual: <strong>{estado.nota} de 10</strong>.
        </p>
      );
    case 'falhou':
      return (
        <>
          <p role="alert">{estado.mensagem}</p>
          <Button onClick={tentarNovamente} variant="outline">
            Tentar novamente
          </Button>
        </>
      );
    case 'visitante':
      return (
        <>
          {estado.sessaoExpirada && (
            <p role="alert">
              Sua sessão expirou. Entre novamente para avaliar.
            </p>
          )}
          <p>Entre na sua conta para avaliar este jogo.</p>
          <Button asChild variant="outline">
            <Link to="/login">Entrar para avaliar</Link>
          </Button>
        </>
      );
  }
}

export function PainelAvaliacao({
  estado,
  tentarNovamente,
  children,
}: {
  estado: EstadoAvaliacao;
  tentarNovamente: () => void;
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="minha-avaliacao-titulo">
      <Card className="detalhes-painel">
        <h2 id="minha-avaliacao-titulo">
          <UserRound aria-hidden="true" size={21} /> Sua avaliação
        </h2>
        <NotaPessoal estado={estado} tentarNovamente={tentarNovamente} />
        {children}
      </Card>
    </section>
  );
}
