import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiIndisponivelError, consultarSaude } from './api';

function simularResposta(status: number, corpo: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(corpo), { status })),
    ),
  );
}

describe('consultarSaude', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('chama /health na URL configurada e devolve o status', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com/');
    simularResposta(200, { api: 'ok', banco: 'ok' });

    await expect(consultarSaude()).resolves.toEqual({ api: 'ok', banco: 'ok' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.exemplo.com/health',
      expect.anything(),
    );
  });

  it('devolve o status também quando a API responde 503', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    simularResposta(503, { api: 'ok', banco: 'erro' });

    await expect(consultarSaude()).resolves.toEqual({
      api: 'ok',
      banco: 'erro',
    });
  });

  it('falha com erro claro quando a URL da API não foi configurada', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    await expect(consultarSaude()).rejects.toThrow('VITE_API_BASE_URL');
  });

  it('falha com ApiIndisponivelError quando a rede falha', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    await expect(consultarSaude()).rejects.toBeInstanceOf(ApiIndisponivelError);
  });
});
