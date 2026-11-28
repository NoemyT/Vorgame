import { afterEach, describe, expect, it, vi } from 'vitest';
import { gravarAvaliacao } from './api';

function simularResposta(status: number, corpo: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(corpo), { status })),
    ),
  );
}

describe('gravarAvaliacao', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it.each([
    ['criar', 'POST', '/games/7/ratings', 201],
    ['alterar', 'PUT', '/games/7/ratings/me', 200],
  ] as const)(
    'envia nota com Bearer ao %s',
    async (modo, method, rota, status) => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
      const resposta = {
        jogoId: 7,
        nota: 0,
        mediaAvaliacao: 0,
        totalAvaliacoes: 1,
      };
      simularResposta(status, resposta);

      await expect(gravarAvaliacao(7, 0, modo)).resolves.toEqual(resposta);
      expect(fetch).toHaveBeenCalledWith(
        `https://api.exemplo.com${rota}`,
        expect.objectContaining({
          method,
          headers: {
            Authorization: 'Bearer jwt-ficticio',
            'Content-Type': 'application/json',
          },
          body: '{"nota":0}',
        }),
      );
    },
  );
});
