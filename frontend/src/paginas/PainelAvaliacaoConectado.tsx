import { useEffect, useState } from 'react';
import {
  consultarMinhaAvaliacao,
  ErroHttpApi,
  gravarAvaliacao,
  type AvaliacaoGravada,
} from '../servicos/api';
import { obterToken } from '../servicos/sessao';
import {
  PainelAvaliacao,
  type EstadoAvaliacao,
} from './ComponentesDetalhesJogo';
import { FormularioAvaliacao } from './FormularioAvaliacao';

async function carregarAvaliacaoPropria(
  id: number,
  estaAtivo: () => boolean,
  atualizar: (estado: EstadoAvaliacao) => void,
) {
  try {
    const avaliacao = await consultarMinhaAvaliacao(id);
    if (estaAtivo()) atualizar({ fase: 'com_nota', nota: avaliacao.nota });
  } catch (erro: unknown) {
    if (!estaAtivo()) return;
    if (erro instanceof ErroHttpApi && erro.statusCode === 404) {
      atualizar({ fase: 'sem_nota' });
    } else if (erro instanceof ErroHttpApi && erro.statusCode === 401) {
      atualizar({ fase: 'visitante', sessaoExpirada: true });
    } else {
      atualizar({
        fase: 'falhou',
        mensagem: 'Não foi possível consultar sua avaliação.',
      });
    }
  }
}

type EstadoEnvio =
  | { fase: 'ocioso' | 'salvando' | 'salvo' }
  | { fase: 'erro'; mensagem: string };

function deveReconsultar(erro: unknown, modo: 'criar' | 'alterar') {
  return (
    erro instanceof ErroHttpApi &&
    ((modo === 'criar' && erro.statusCode === 409) ||
      (modo === 'alterar' && erro.statusCode === 404))
  );
}

function useConsultaAvaliacao(jogoId: number) {
  const [estado, setEstado] = useState<EstadoAvaliacao>(() =>
    obterToken()
      ? { fase: 'carregando' }
      : { fase: 'visitante', sessaoExpirada: false },
  );
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    if (obterToken())
      void carregarAvaliacaoPropria(jogoId, () => ativo, setEstado);
    return () => {
      ativo = false;
    };
  }, [jogoId, tentativa]);

  function tentarNovamente() {
    if (!obterToken()) {
      setEstado({ fase: 'visitante', sessaoExpirada: true });
      return;
    }
    setEstado({ fase: 'carregando' });
    setTentativa((atual) => atual + 1);
  }

  return { estado, setEstado, tentarNovamente };
}

function useAvaliacao(
  jogoId: number,
  aoSalvar: (resultado: AvaliacaoGravada) => void,
) {
  const { estado, setEstado, tentarNovamente } = useConsultaAvaliacao(jogoId);
  const [envio, setEnvio] = useState<EstadoEnvio>({ fase: 'ocioso' });

  async function salvar(nota: number) {
    if (envio.fase === 'salvando') return;
    const modo = estado.fase === 'com_nota' ? 'alterar' : 'criar';
    setEnvio({ fase: 'salvando' });
    try {
      const resultado = await gravarAvaliacao(jogoId, nota, modo);
      setEstado({ fase: 'com_nota', nota: resultado.nota });
      setEnvio({ fase: 'salvo' });
      aoSalvar(resultado);
    } catch (erro: unknown) {
      if (erro instanceof ErroHttpApi && erro.statusCode === 401) {
        setEstado({ fase: 'visitante', sessaoExpirada: true });
        setEnvio({ fase: 'ocioso' });
        return;
      }
      const desatualizada = deveReconsultar(erro, modo);
      if (desatualizada) tentarNovamente();
      setEnvio({
        fase: 'erro',
        mensagem: desatualizada
          ? 'Sua avaliação mudou. Confira o estado atual antes de salvar novamente.'
          : 'Não foi possível salvar sua avaliação. Tente novamente.',
      });
    }
  }

  return { estado, envio, tentarNovamente, salvar };
}

export function PainelAvaliacaoConectado({
  jogoId,
  aoSalvar,
}: {
  jogoId: number;
  aoSalvar: (resultado: AvaliacaoGravada) => void;
}) {
  const { estado, envio, tentarNovamente, salvar } = useAvaliacao(
    jogoId,
    aoSalvar,
  );
  const podeAvaliar = estado.fase === 'com_nota' || estado.fase === 'sem_nota';
  return (
    <PainelAvaliacao estado={estado} tentarNovamente={tentarNovamente}>
      {podeAvaliar && (
        <FormularioAvaliacao
          nota={estado.fase === 'com_nota' ? estado.nota : undefined}
          salvar={(nota) => void salvar(nota)}
          salvando={envio.fase === 'salvando'}
        />
      )}
      {envio.fase === 'salvo' && <p role="status">Avaliação salva.</p>}
      {envio.fase === 'erro' && estado.fase !== 'visitante' && (
        <p role="alert">{envio.mensagem}</p>
      )}
    </PainelAvaliacao>
  );
}
