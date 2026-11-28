import { useEffect, useState } from 'react';
import { rotaPesquisa } from '../catalogo/apresentacao';
import { jogosCurados, type JogoCurado } from '../catalogo/curadoria';
import { buscarJogos, type JogoResumo } from '../servicos/api';

type ResultadoCurado = JogoResumo | null | 'falhou';
export type ResultadosCurados = Partial<Record<string, ResultadoCurado>>;

function normalizar(titulo: string) {
  return titulo.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

async function resolverJogo(titulo: string): Promise<ResultadoCurado> {
  try {
    const { resultados } = await buscarJogos(titulo);
    const procurado = normalizar(titulo);
    const exatos = resultados.filter(
      (jogo) => normalizar(jogo.titulo) === procurado,
    );
    return exatos.length === 1 ? exatos[0] : null;
  } catch {
    return 'falhou';
  }
}

export function jogoResolvido(resultado?: ResultadoCurado): JogoResumo | null {
  return resultado && resultado !== 'falhou' ? resultado : null;
}

export function rotaCuradoria(titulo: string, resultado?: ResultadoCurado) {
  const jogo = jogoResolvido(resultado);
  return jogo ? `/jogos/${jogo.id}` : rotaPesquisa(titulo);
}

export function useCuradoria() {
  const [resultados, setResultados] = useState<ResultadosCurados>({});
  const [lote, setLote] = useState<readonly JogoCurado[]>(jogosCurados);

  useEffect(() => {
    let ativo = true;
    // O StrictMode descarta o primeiro efeito antes de iniciar as consultas.
    queueMicrotask(() => {
      if (!ativo) return;
      for (const { titulo } of lote) {
        void resolverJogo(titulo).then((resposta) => {
          if (ativo)
            setResultados((atual) => ({ ...atual, [titulo]: resposta }));
        });
      }
    });
    return () => {
      ativo = false;
    };
  }, [lote]);

  const falhas = jogosCurados.filter(
    ({ titulo }) => resultados[titulo] === 'falhou',
  );
  const carregando = jogosCurados.some(
    ({ titulo }) => resultados[titulo] === undefined,
  );

  function tentarNovamente() {
    setResultados((atual) =>
      Object.fromEntries(
        Object.entries(atual).filter(([, valor]) => valor !== 'falhou'),
      ),
    );
    setLote(falhas);
  }

  return {
    resultados,
    carregando,
    temFalha: falhas.length > 0,
    tentarNovamente,
  };
}
