import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  CapaJogo,
  CreditoIgdb,
  NotaComunidade,
} from '../componentes/ComponentesCatalogo';
import {
  ApiIndisponivelError,
  buscarJogos,
  ErroHttpApi,
  type JogoResumo,
} from '../servicos/api';
import './PaginaPesquisa.css';

type EstadoBusca =
  | { fase: 'ocioso' }
  | { fase: 'carregando'; termo: string }
  | { fase: 'concluido'; termo: string; resultados: JogoResumo[] }
  | { fase: 'falhou'; termo: string; mensagem: string };

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 400) {
    return 'Informe um título para pesquisar.';
  }
  if (erro instanceof ErroHttpApi && erro.statusCode === 503) {
    return 'A pesquisa de jogos está temporariamente indisponível. Tente novamente.';
  }
  if (erro instanceof ApiIndisponivelError) {
    return 'Não foi possível carregar os resultados. Verifique a conexão e tente novamente.';
  }
  return 'Não foi possível carregar os resultados. Tente novamente.';
}

function ResultadoJogo({ jogo }: { jogo: JogoResumo }) {
  return (
    <li className="pesquisa-resultado">
      <div className="pesquisa-capa">
        <CapaJogo carregamento="lazy" jogo={jogo} key={jogo.capa} />
      </div>
      <div className="pesquisa-detalhes">
        <h3>
          <Link to={`/jogos/${jogo.id}`}>{jogo.titulo}</Link>
        </h3>
        <NotaComunidade jogo={jogo} />
      </div>
    </li>
  );
}

function PainelResultados({
  estado,
  tentarNovamente,
}: {
  estado: EstadoBusca;
  tentarNovamente: () => void;
}) {
  if (estado.fase === 'ocioso') {
    return (
      <p className="pesquisa-mensagem" role="status">
        Digite o nome de um jogo para começar a pesquisa.
      </p>
    );
  }
  if (estado.fase === 'carregando') {
    return (
      <p aria-busy="true" className="pesquisa-mensagem" role="status">
        Buscando jogos… A API pode levar até 1 minuto para responder após ficar
        hibernada.
      </p>
    );
  }
  if (estado.fase === 'falhou') {
    return (
      <section className="pesquisa-erro">
        <p role="alert">{estado.mensagem}</p>
        <button onClick={tentarNovamente} type="button">
          Tentar novamente
        </button>
      </section>
    );
  }
  if (estado.resultados.length === 0) {
    return (
      <p className="pesquisa-mensagem" role="status">
        Nenhum jogo encontrado para “{estado.termo}”. Tente outro título.
      </p>
    );
  }
  return (
    <ul aria-label="Resultados da pesquisa" className="pesquisa-lista">
      {estado.resultados.map((jogo) => (
        <ResultadoJogo jogo={jogo} key={jogo.id} />
      ))}
    </ul>
  );
}

interface TelaPesquisaProps {
  termo: string;
  estado: EstadoBusca;
  enviarBusca: (evento: FormEvent<HTMLFormElement>) => void;
  alterarTermo: (termo: string) => void;
  tentarNovamente: () => void;
}

function CabecalhoPesquisa() {
  return (
    <header className="pesquisa-header">
      <Link className="pesquisa-brand" to="/pesquisa">
        VORGAME
      </Link>
      <nav aria-label="Navegação principal">
        <Link aria-current="page" to="/pesquisa">
          Pesquisar jogos
        </Link>
        <Link to="/login">Entrar</Link>
        <Link to="/cadastro">Criar conta</Link>
      </nav>
    </header>
  );
}

function TelaPesquisa({
  termo,
  estado,
  enviarBusca,
  alterarTermo,
  tentarNovamente,
}: TelaPesquisaProps) {
  return (
    <div className="pesquisa-page">
      <CabecalhoPesquisa />
      <main className="pesquisa-main">
        <p className="pesquisa-eyebrow">Descubra seu próximo jogo</p>
        <h1>Pesquisar jogos</h1>
        <form className="pesquisa-form" onSubmit={enviarBusca} role="search">
          <div>
            <label htmlFor="pesquisa-termo">Nome do jogo</label>
            <input
              autoComplete="off"
              id="pesquisa-termo"
              name="q"
              onChange={(evento) => alterarTermo(evento.currentTarget.value)}
              required
              value={termo}
            />
          </div>
          <button disabled={estado.fase === 'carregando'} type="submit">
            {estado.fase === 'carregando' ? 'Pesquisando…' : 'Pesquisar'}
          </button>
        </form>
        <CreditoIgdb />
        <section aria-label="Jogos encontrados" className="pesquisa-conteudo">
          <PainelResultados estado={estado} tentarNovamente={tentarNovamente} />
        </section>
      </main>
    </div>
  );
}

export function PaginaPesquisa() {
  const [termo, setTermo] = useState('');
  const [estado, setEstado] = useState<EstadoBusca>({ fase: 'ocioso' });

  async function executarBusca(consulta: string) {
    setEstado({ fase: 'carregando', termo: consulta });
    try {
      const resposta = await buscarJogos(consulta);
      setEstado({
        fase: 'concluido',
        termo: consulta,
        resultados: resposta.resultados,
      });
    } catch (erro: unknown) {
      setEstado({
        fase: 'falhou',
        termo: consulta,
        mensagem: descreverErro(erro),
      });
    }
  }

  function enviarBusca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const consulta = termo.trim();
    if (consulta) void executarBusca(consulta);
  }

  function tentarNovamente() {
    if (estado.fase === 'falhou') void executarBusca(estado.termo);
  }

  return (
    <TelaPesquisa
      alterarTermo={setTermo}
      enviarBusca={enviarBusca}
      estado={estado}
      tentarNovamente={tentarNovamente}
      termo={termo}
    />
  );
}
