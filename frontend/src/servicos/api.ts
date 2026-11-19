const TEMPO_LIMITE_MS = 90_000;

export type StatusServico = 'ok' | 'erro';

export interface StatusSaude {
  api: StatusServico;
  banco: StatusServico;
}

export class ApiIndisponivelError extends Error {
  constructor(motivo: string) {
    super(`A API não respondeu: ${motivo}`);
    this.name = 'ApiIndisponivelError';
  }
}

function obterUrlBase(): string {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new ApiIndisponivelError('VITE_API_BASE_URL não foi configurada');
  }
  return url.replace(/\/+$/, '');
}

function ehStatusSaude(corpo: unknown): corpo is StatusSaude {
  const candidato = corpo as Partial<StatusSaude> | null;
  return typeof candidato?.api === 'string' && typeof candidato?.banco === 'string';
}

export async function consultarSaude(): Promise<StatusSaude> {
  let resposta: Response;
  try {
    resposta = await fetch(`${obterUrlBase()}/health`, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    if (erro instanceof ApiIndisponivelError) throw erro;
    throw new ApiIndisponivelError(erro instanceof Error ? erro.message : String(erro));
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!ehStatusSaude(corpo)) {
    throw new ApiIndisponivelError(`resposta inesperada (HTTP ${resposta.status})`);
  }
  return corpo;
}
