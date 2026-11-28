import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';
import { rotaPesquisa } from '../catalogo/apresentacao';
import {
  ApiIndisponivelError,
  consultarJogo,
  ErroHttpApi,
  type AvaliacaoGravada,
} from '../servicos/api';
import {
  InformacoesJogo,
  MediaComunidade,
  PainelDetalhes,
  type EstadoDetalhes,
} from './ComponentesDetalhesJogo';
import { PainelAvaliacaoConectado } from './PainelAvaliacaoConectado';
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

  function atualizarMedia(avaliacao: AvaliacaoGravada) {
    setEstado((atual) => {
      if (atual.fase !== 'concluido') return atual;
      const { mediaAvaliacao, totalAvaliacoes } = avaliacao;
      return {
        fase: 'concluido',
        jogo: { ...atual.jogo, mediaAvaliacao, totalAvaliacoes },
      };
    });
  }

  return { detalhes, tentativa, tentarNovamente, atualizarMedia };
}

function rotaDeVolta(origem: unknown) {
  if (
    origem &&
    typeof origem === 'object' &&
    'termo' in origem &&
    typeof origem.termo === 'string'
  ) {
    return rotaPesquisa(origem.termo);
  }
  return '/pesquisa';
}

function DetalhesJogo({ idParam }: { idParam: string | undefined }) {
  const { detalhes, tentativa, tentarNovamente, atualizarMedia } =
    useDadosJogo(idParam);
  const { state } = useLocation();

  return (
    <main className="limite pagina pagina-detalhes">
      <Link className="detalhes-voltar" to={rotaDeVolta(state)}>
        <ArrowLeft aria-hidden="true" size={17} /> Voltar à pesquisa
      </Link>
      <PainelDetalhes estado={detalhes} tentarNovamente={tentarNovamente} />
      {detalhes.fase === 'concluido' && (
        <>
          <InformacoesJogo jogo={detalhes.jogo} />
          <div className="detalhes-notas">
            <MediaComunidade jogo={detalhes.jogo} />
            <PainelAvaliacaoConectado
              aoSalvar={atualizarMedia}
              jogoId={detalhes.jogo.id}
              key={`${detalhes.jogo.id}-${tentativa}`}
            />
          </div>
        </>
      )}
    </main>
  );
}

export function PaginaDetalhesJogo() {
  const { id } = useParams();
  return <DetalhesJogo idParam={id} key={id ?? 'jogo-sem-id'} />;
}
