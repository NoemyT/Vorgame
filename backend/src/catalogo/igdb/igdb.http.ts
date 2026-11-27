const mensagens = {
  configuracao: 'Credenciais da IGDB devem ser configuradas no backend',
  autenticacao: 'A integração com a IGDB foi rejeitada na autenticação',
  limite: 'Limite de consultas à IGDB atingido',
  indisponivel: 'Não foi possível consultar a integração com a IGDB',
  rejeitada: 'A integração com a IGDB rejeitou a requisição',
  resposta_invalida: 'A integração com a IGDB retornou uma resposta inválida',
  timeout: 'A integração com a IGDB excedeu o tempo limite de resposta',
};

export class ErroIgdb extends Error {
  constructor(readonly motivo: keyof typeof mensagens) {
    super(mensagens[motivo]);
    this.name = 'ErroIgdb';
  }
}

function erroPorStatus(status: number): ErroIgdb {
  if (status === 401 || status === 403) return new ErroIgdb('autenticacao');
  if (status === 429) return new ErroIgdb('limite');
  if (status >= 500) return new ErroIgdb('indisponivel');
  return new ErroIgdb('rejeitada');
}

export async function requisitarJsonIgdb(
  url: string,
  opcoes: RequestInit,
): Promise<unknown> {
  const signal = AbortSignal.timeout(5_000);
  try {
    const resposta = await fetch(url, { ...opcoes, signal, redirect: 'error' });
    if (!resposta.ok) {
      void resposta.body?.cancel().catch(() => undefined);
      throw erroPorStatus(resposta.status);
    }
    return await resposta.json();
  } catch (erro) {
    if (erro instanceof ErroIgdb) throw erro;
    if (signal.aborted) throw new ErroIgdb('timeout');
    if (erro instanceof SyntaxError) throw new ErroIgdb('resposta_invalida');
    throw new ErroIgdb('indisponivel');
  }
}
