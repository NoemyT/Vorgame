export interface JogoResumo {
  id: number;
  titulo: string;
  capa: string;
  mediaAvaliacao: number | null;
  totalAvaliacoes: number;
}

export interface ResultadoBuscaJogos {
  resultados: JogoResumo[];
}

export interface JogoDetalhes extends JogoResumo {
  descricao: string;
  genero: string;
  plataformas: string[];
}

export interface AvaliacaoPropria {
  jogoId: number;
  nota: number;
  atualizadoEm: string;
}

export interface AvaliacaoGravada {
  jogoId: number;
  nota: number;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
}

function ehJogoResumo(corpo: unknown): corpo is JogoResumo {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const jogo = corpo as Record<string, unknown>;
  return (
    Number.isInteger(jogo.id) &&
    typeof jogo.titulo === 'string' &&
    typeof jogo.capa === 'string' &&
    (jogo.mediaAvaliacao === null || typeof jogo.mediaAvaliacao === 'number') &&
    Number.isInteger(jogo.totalAvaliacoes)
  );
}

export function ehResultadoBuscaJogos(
  corpo: unknown,
): corpo is ResultadoBuscaJogos {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const resposta = corpo as Record<string, unknown>;
  return (
    Array.isArray(resposta.resultados) &&
    resposta.resultados.every(ehJogoResumo)
  );
}

export function ehJogoDetalhes(corpo: unknown): corpo is JogoDetalhes {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const jogo = corpo as Record<string, unknown>;
  return (
    ehJogoResumo(corpo) &&
    typeof jogo.descricao === 'string' &&
    typeof jogo.genero === 'string' &&
    Array.isArray(jogo.plataformas) &&
    jogo.plataformas.every((plataforma) => typeof plataforma === 'string')
  );
}

export function ehAvaliacaoPropria(corpo: unknown): corpo is AvaliacaoPropria {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const avaliacao = corpo as Record<string, unknown>;
  return (
    Number.isInteger(avaliacao.jogoId) &&
    Number.isInteger(avaliacao.nota) &&
    Number(avaliacao.nota) >= 0 &&
    Number(avaliacao.nota) <= 10 &&
    typeof avaliacao.atualizadoEm === 'string'
  );
}

export function ehAvaliacaoGravada(corpo: unknown): corpo is AvaliacaoGravada {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const { jogoId, nota, mediaAvaliacao, totalAvaliacoes } = corpo as Record<
    string,
    unknown
  >;
  return (
    Number.isSafeInteger(jogoId) &&
    typeof nota === 'number' &&
    Number.isInteger(nota) &&
    nota >= 0 &&
    nota <= 10 &&
    typeof mediaAvaliacao === 'number' &&
    mediaAvaliacao >= 0 &&
    mediaAvaliacao <= 10 &&
    typeof totalAvaliacoes === 'number' &&
    Number.isInteger(totalAvaliacoes) &&
    totalAvaliacoes > 0
  );
}
