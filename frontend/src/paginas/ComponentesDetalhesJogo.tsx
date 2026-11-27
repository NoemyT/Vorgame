import { Link } from 'react-router';
import { CapaJogo, NotaComunidade } from '../componentes/ComponentesCatalogo';
import type { AvaliacaoPropria, JogoDetalhes } from '../servicos/api';

export type EstadoDetalhes =
  | { fase: 'carregando' }
  | { fase: 'concluido'; jogo: JogoDetalhes }
  | { fase: 'falhou'; mensagem: string; repetir: boolean };

export type EstadoAvaliacao =
  | { fase: 'visitante'; sessaoExpirada: boolean }
  | { fase: 'carregando' }
  | { fase: 'sem_nota' }
  | { fase: 'com_nota'; avaliacao: AvaliacaoPropria }
  | { fase: 'falhou'; mensagem: string };

export function CabecalhoDetalhes({ autenticado }: { autenticado: boolean }) {
  return (
    <header className="detalhes-header">
      <Link className="detalhes-brand" to="/pesquisa">
        VORGAME
      </Link>
      <nav aria-label="Navegação principal">
        <Link to="/pesquisa">Pesquisar jogos</Link>
        {autenticado ? (
          <span aria-label="Sessão autenticada">Sessão autenticada</span>
        ) : (
          <>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Criar conta</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function PainelDetalhes({
  estado,
  tentarNovamente,
}: {
  estado: EstadoDetalhes;
  tentarNovamente: () => void;
}) {
  if (estado.fase === 'carregando') {
    return (
      <p className="detalhes-mensagem" aria-busy="true" role="status">
        Carregando detalhes… A API pode levar até 1 minuto para responder após
        ficar hibernada.
      </p>
    );
  }
  if (estado.fase === 'falhou') {
    return (
      <section className="detalhes-erro">
        <p role="alert">{estado.mensagem}</p>
        {estado.repetir && (
          <button onClick={tentarNovamente} type="button">
            Tentar novamente
          </button>
        )}
      </section>
    );
  }
  return null;
}

export function InformacoesJogo({ jogo }: { jogo: JogoDetalhes }) {
  return (
    <section aria-labelledby="detalhes-titulo" className="detalhes-jogo">
      <div className="detalhes-capa">
        <CapaJogo jogo={jogo} key={jogo.capa} />
      </div>
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
            <dd>
              {jogo.plataformas.length > 0
                ? jogo.plataformas.join(', ')
                : 'Não informadas'}
            </dd>
          </div>
        </dl>
        <NotaComunidade className="detalhes-media" jogo={jogo} />
      </div>
    </section>
  );
}

export function PainelAvaliacao({
  estado,
  tentarNovamente,
}: {
  estado: EstadoAvaliacao;
  tentarNovamente: () => void;
}) {
  return (
    <section
      aria-labelledby="minha-avaliacao-titulo"
      className="detalhes-avaliacao"
    >
      <h2 id="minha-avaliacao-titulo">Sua avaliação</h2>
      {estado.fase === 'carregando' && (
        <p aria-live="polite" role="status">
          Consultando sua avaliação…
        </p>
      )}
      {estado.fase === 'visitante' && (
        <>
          {estado.sessaoExpirada && (
            <p role="alert">
              Sua sessão expirou. Entre novamente para avaliar.
            </p>
          )}
          <p>Entre na sua conta para avaliar este jogo.</p>
          <Link to="/login">Entrar para avaliar</Link>
        </>
      )}
      {estado.fase === 'sem_nota' && (
        <p role="status">Você ainda não avaliou este jogo.</p>
      )}
      {estado.fase === 'com_nota' && (
        <p role="status">
          Sua avaliação atual: <strong>{estado.avaliacao.nota} de 10</strong>.
        </p>
      )}
      {estado.fase === 'falhou' && (
        <>
          <p role="alert">{estado.mensagem}</p>
          <button onClick={tentarNovamente} type="button">
            Tentar novamente
          </button>
        </>
      )}
    </section>
  );
}
