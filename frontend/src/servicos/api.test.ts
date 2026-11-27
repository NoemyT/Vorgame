import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiIndisponivelError,
  buscarJogos,
  cadastrarUsuario,
  consultarJogo,
  consultarMinhaAvaliacao,
  consultarSaude,
  consultarUsuarioAutenticado,
  iniciarSessao,
} from './api';

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

  describe('autenticação', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      sessionStorage.clear();
    });

    it('envia login e senha para a rota aprovada e recebe o token', async () => {
      const dados = { login: 'anasouza', senha: 'senha-ficticia123' };
      const sessao = {
        token: 'jwt-ficticio',
        usuario: { id: 1, nome: 'Ana Souza', username: 'anasouza' },
      };
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      simularResposta(200, sessao);

      await expect(iniciarSessao(dados)).resolves.toEqual(sessao);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.exemplo.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        }),
      );
    });

    it('envia Bearer em /auth/me e remove o token após 401', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
      simularResposta(200, {
        id: 1,
        nome: 'Ana Souza',
        email: 'ana@example.test',
        username: 'anasouza',
      });

      await expect(consultarUsuarioAutenticado()).resolves.toMatchObject({
        id: 1,
        email: 'ana@example.test',
      });
      expect(fetch).toHaveBeenCalledWith(
        'https://api.exemplo.com/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer jwt-ficticio' },
        }),
      );

      simularResposta(401, {
        statusCode: 401,
        message: 'Token ausente ou inválido',
        error: 'Unauthorized',
      });
      await expect(consultarUsuarioAutenticado()).rejects.toMatchObject({
        statusCode: 401,
      });
      expect(sessionStorage.getItem('vorgame_token')).toBeNull();
    });

    it('limpa uma sessão anterior quando o login retorna credenciais inválidas', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      sessionStorage.setItem('vorgame_token', 'token-antigo');
      simularResposta(401, {
        statusCode: 401,
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
      });

      await expect(
        iniciarSessao({ login: 'ana', senha: 'senha-incorreta' }),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciais inválidas',
      });
      expect(sessionStorage.getItem('vorgame_token')).toBeNull();
    });
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

  describe('cadastrarUsuario', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    });

    it('envia os campos do contrato e devolve a conta criada', async () => {
      const dados = {
        nome: 'Ana Souza',
        email: 'ana@example.test',
        username: 'anasouza',
        senha: 'senha-ficticia123',
      };
      const usuario = {
        id: 1,
        nome: dados.nome,
        email: dados.email,
        username: dados.username,
        criadoEm: '2026-11-18T12:00:00.000Z',
      };
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com/');
      simularResposta(201, usuario);

      await expect(cadastrarUsuario(dados)).resolves.toEqual(usuario);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.exemplo.com/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        }),
      );
    });

    it('preserva o erro 409 de e-mail ou username duplicado', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      simularResposta(409, {
        statusCode: 409,
        message: 'Email já cadastrado',
        error: 'Conflict',
      });

      await expect(
        cadastrarUsuario({
          nome: 'Ana Souza',
          email: 'ana@example.test',
          username: 'anasouza',
          senha: 'senha-ficticia123',
        }),
      ).rejects.toMatchObject({
        name: 'ErroHttpApi',
        statusCode: 409,
        message: 'Email já cadastrado',
      });
    });

    it('reúne mensagens de validação HTTP 400', async () => {
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
      simularResposta(400, {
        statusCode: 400,
        message: ['email inválido', 'nome obrigatório'],
        error: 'Bad Request',
      });

      await expect(
        cadastrarUsuario({
          nome: '',
          email: 'inválido',
          username: 'anasouza',
          senha: 'senha-ficticia123',
        }),
      ).rejects.toMatchObject({
        name: 'ErroHttpApi',
        statusCode: 400,
        message: 'email inválido nome obrigatório',
      });
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

describe('buscarJogos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('codifica o termo e valida a resposta do contrato', async () => {
    const resposta = {
      resultados: [
        {
          id: 7,
          titulo: 'Ecos de Órbita',
          capa: '',
          mediaAvaliacao: 9.4,
          totalAvaliacoes: 12,
        },
      ],
    };
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com/');
    simularResposta(200, resposta);

    await expect(buscarJogos(' My Game & Co ')).resolves.toEqual(resposta);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.exemplo.com/games?q=My%20Game%20%26%20Co',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejeita uma busca vazia sem fazer requisição', async () => {
    const requisicao = vi.spyOn(globalThis, 'fetch');
    await expect(buscarJogos('   ')).rejects.toMatchObject({
      name: 'ErroHttpApi',
      statusCode: 400,
    });
    expect(requisicao).not.toHaveBeenCalled();
  });
});

describe('consultarJogo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it('consulta detalhes públicos na rota aprovada', async () => {
    const jogo = {
      id: 7,
      titulo: 'Ecos de Órbita',
      capa: '',
      descricao: 'Aventura espacial fictícia.',
      genero: 'Aventura',
      plataformas: ['PC', 'Nintendo Switch'],
      mediaAvaliacao: null,
      totalAvaliacoes: 0,
    };
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    simularResposta(200, jogo);

    await expect(consultarJogo(7)).resolves.toEqual(jogo);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.exemplo.com/games/7',
      expect.objectContaining({ method: 'GET', headers: {} }),
    );
  });

  it('preserva 404 para jogo inexistente', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    simularResposta(404, {
      statusCode: 404,
      message: 'Jogo não encontrado',
      error: 'Not Found',
    });

    await expect(consultarJogo(7)).rejects.toMatchObject({
      name: 'ErroHttpApi',
      statusCode: 404,
    });
  });

  it('não requisita detalhes com identificador inválido', async () => {
    const requisicao = vi.spyOn(globalThis, 'fetch');

    await expect(consultarJogo(Number.NaN)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(requisicao).not.toHaveBeenCalled();
  });
});

describe('consultarMinhaAvaliacao', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it('consulta a nota própria com Bearer JWT', async () => {
    const avaliacao = {
      jogoId: 7,
      nota: 8,
      atualizadoEm: '2026-11-18T12:30:00.000Z',
    };
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    simularResposta(200, avaliacao);

    await expect(consultarMinhaAvaliacao(7)).resolves.toEqual(avaliacao);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.exemplo.com/games/7/ratings/me',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer jwt-ficticio' },
      }),
    );
  });

  it('preserva 404 quando o usuário ainda não avaliou', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    simularResposta(404, {
      statusCode: 404,
      message: 'Avaliação não encontrada',
      error: 'Not Found',
    });

    await expect(consultarMinhaAvaliacao(7)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('remove o token quando a avaliação própria responde 401', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.exemplo.com');
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    simularResposta(401, {
      statusCode: 401,
      message: 'Token ausente ou inválido',
      error: 'Unauthorized',
    });

    await expect(consultarMinhaAvaliacao(7)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(sessionStorage.getItem('vorgame_token')).toBeNull();
  });
});
