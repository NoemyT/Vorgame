import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ApiIndisponivelError,
  consultarJogo,
  consultarMinhaAvaliacao,
  ErroHttpApi,
} from '../servicos/api';
import { obterToken } from '../servicos/sessao';
import {
  CabecalhoDetalhes,
  InformacoesJogo,
  PainelAvaliacao,
  PainelDetalhes,
  type EstadoAvaliacao,
  type EstadoDetalhes,
} from './ComponentesDetalhesJogo';
import './PaginaDetalhesJogo.css';

function lerIdJogo(valor: string | undefined): number | null {
  if (!valor || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) ? id : null;
}

function descreverErroDetalhes(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 400) {
    return 'O identificador do jogo é inválido.';
  }
  if (erro instanceof ErroHttpApi && erro.statusCode === 404) {
    return 'Jogo não encontrado.';
  }
  if (erro instanceof ApiIndisponivelError) {
    return 'Não foi possível carregar os detalhes. Verifique a conexão e tente novamente.';
  }
  return 'Não foi possível carregar os detalhes. Tente novamente.';
}

function permiteRepetirDetalhes(erro: unknown): boolean {
  return !(
    erro instanceof ErroHttpApi &&
    (erro.statusCode === 400 || erro.statusCode === 404)
  );
}

async function carregarDetalhes(
  id: number,
  estaAtivo: () => boolean,
  atualizar: (estado: EstadoDetalhes) => void,
) {
  try {
    const jogo = await consultarJogo(id);
    if (estaAtivo()) atualizar({ fase: 'concluido', jogo });
  } catch (erro: unknown) {
    if (!estaAtivo()) return;
    atualizar({
      fase: 'falhou',
      mensagem: descreverErroDetalhes(erro),
      repetir: permiteRepetirDetalhes(erro),
    });
  }
}

function useDadosJogo(idParam: string | undefined) {
  const [estado, setEstado] = useState<EstadoDetalhes>({
    fase: 'carregando',
  });
  const [tentativa, setTentativa] = useState(0);
  const id = lerIdJogo(idParam);

  useEffect(() => {
    let ativo = true;
    if (id !== null) void carregarDetalhes(id, () => ativo, setEstado);
    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  function tentarNovamente() {
    setEstado({ fase: 'carregando' });
    setTentativa((valor) => valor + 1);
  }

  const detalhes: EstadoDetalhes =
    id === null
      ? {
          fase: 'falhou',
          mensagem: 'O identificador do jogo é inválido.',
          repetir: false,
        }
      : estado;

  return { detalhes, id, tentativa, tentarNovamente };
}

async function carregarAvaliacaoPropria(
  id: number,
  estaAtivo: () => boolean,
  atualizar: (estado: EstadoAvaliacao) => void,
  expirarSessao: (autenticado: boolean) => void,
) {
  try {
    const avaliacao = await consultarMinhaAvaliacao(id);
    if (estaAtivo()) atualizar({ fase: 'com_nota', avaliacao });
  } catch (erro: unknown) {
    if (!estaAtivo()) return;
    if (erro instanceof ErroHttpApi && erro.statusCode === 404) {
      atualizar({ fase: 'sem_nota' });
    } else if (erro instanceof ErroHttpApi && erro.statusCode === 401) {
      expirarSessao(false);
      atualizar({ fase: 'visitante', sessaoExpirada: true });
    } else {
      atualizar({
        fase: 'falhou',
        mensagem: 'Não foi possível consultar sua avaliação.',
      });
    }
  }
}

function PainelAvaliacaoConectado({
  jogoId,
  expirarSessao,
}: {
  jogoId: number;
  expirarSessao: (autenticado: boolean) => void;
}) {
  const [estado, setEstado] = useState<EstadoAvaliacao>(() =>
    obterToken()
      ? { fase: 'carregando' }
      : { fase: 'visitante', sessaoExpirada: false },
  );
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    if (obterToken()) {
      void carregarAvaliacaoPropria(
        jogoId,
        () => ativo,
        setEstado,
        expirarSessao,
      );
    }
    return () => {
      ativo = false;
    };
  }, [expirarSessao, jogoId, tentativa]);

  function tentarNovamente() {
    if (!obterToken()) return;
    setEstado({ fase: 'carregando' });
    setTentativa((valor) => valor + 1);
  }

  return <PainelAvaliacao estado={estado} tentarNovamente={tentarNovamente} />;
}

function DetalhesJogo({ idParam }: { idParam: string | undefined }) {
  const [autenticado, setAutenticado] = useState(() => Boolean(obterToken()));
  const { detalhes, tentativa, tentarNovamente } = useDadosJogo(idParam);

  return (
    <div className="detalhes-page">
      <CabecalhoDetalhes autenticado={autenticado} />
      <main className="detalhes-main">
        <p className="detalhes-voltar">
          <Link to="/pesquisa">Voltar à pesquisa</Link>
        </p>
        <PainelDetalhes estado={detalhes} tentarNovamente={tentarNovamente} />
        {detalhes.fase === 'concluido' && (
          <>
            <InformacoesJogo jogo={detalhes.jogo} />
            <PainelAvaliacaoConectado
              expirarSessao={setAutenticado}
              jogoId={detalhes.jogo.id}
              key={`${detalhes.jogo.id}-${tentativa}`}
            />
          </>
        )}
      </main>
    </div>
  );
}

export function PaginaDetalhesJogo() {
  const { id } = useParams();
  return <DetalhesJogo idParam={id} key={id ?? 'jogo-sem-id'} />;
}
