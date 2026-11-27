import { ConfigService } from '@nestjs/config';
import { IgdbAdaptador } from './igdb.adaptador.js';

const urlToken = 'https://id.twitch.tv/oauth2/token';
const urlJogos = 'https://api.igdb.com/v4/games';
const requisicao = vi.fn<typeof fetch>();
let adaptador: IgdbAdaptador;

function respostaToken(token = 'token-ficticio'): Response {
  return Response.json({ access_token: token, expires_in: 60 });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  requisicao.mockReset();
  requisicao.mockResolvedValueOnce(respostaToken());
  requisicao.mockImplementation(() => Promise.resolve(Response.json([])));
  vi.stubGlobal('fetch', requisicao);

  adaptador = new IgdbAdaptador(
    new ConfigService({
      IGDB_CLIENT_ID: 'cliente-ficticio',
      IGDB_CLIENT_SECRET: 'segredo-ficticio',
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('autentica e normaliza os metadados de uma única consulta à IGDB', async () => {
  requisicao.mockResolvedValueOnce(
    Response.json([
      {
        id: 321,
        name: ' Ecos de Órbita ',
        summary: 'Uma aventura fictícia.',
        cover: { image_id: 'capa321' },
        genres: [{ name: 'Aventura' }, { name: 'Estratégia' }],
        platforms: [{ name: 'PC' }],
      },
    ]),
  );

  await expect(adaptador.buscarPorTitulo('Ecos de Órbita')).resolves.toEqual([
    {
      idExterno: 321,
      titulo: 'Ecos de Órbita',
      descricao: 'Uma aventura fictícia.',
      capa: 'https://images.igdb.com/igdb/image/upload/t_cover_big/capa321.jpg',
      generos: ['Aventura', 'Estratégia'],
      plataformas: ['PC'],
    },
  ]);

  expect(requisicao).toHaveBeenCalledTimes(2);
  expect(requisicao).toHaveBeenNthCalledWith(
    1,
    urlToken,
    expect.objectContaining({ method: 'POST', redirect: 'error' }),
  );
  const corpoToken = requisicao.mock.calls[0][1]?.body;
  expect(corpoToken).toStrictEqual(
    new URLSearchParams({
      client_id: 'cliente-ficticio',
      client_secret: 'segredo-ficticio',
      grant_type: 'client_credentials',
    }),
  );
  expect(requisicao).toHaveBeenNthCalledWith(
    2,
    urlJogos,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Client-ID': 'cliente-ficticio',
        Authorization: 'Bearer token-ficticio',
      }),
      body: 'search "Ecos de Órbita"; fields id,name,summary,cover.image_id,genres.name,platforms.name;',
    }),
  );
});

it('preserva aspas e barras como parte do título e devolve uma lista vazia', async () => {
  await expect(
    adaptador.buscarPorTitulo('Ecos \\ "Finais"; Capítulo'),
  ).resolves.toEqual([]);
  expect(requisicao.mock.calls[1][1]?.body).toBe(
    String.raw`search "Ecos \\ \"Finais\"; Capítulo"; fields id,name,summary,cover.image_id,genres.name,platforms.name;`,
  );
});

it('representa metadados opcionais ausentes com valores vazios tipados', async () => {
  requisicao.mockResolvedValueOnce(
    Response.json([
      { id: 51, name: 'Brasa', cover: {}, genres: null, platforms: [{}] },
    ]),
  );

  await expect(adaptador.buscarPorTitulo('Brasa')).resolves.toEqual([
    {
      idExterno: 51,
      titulo: 'Brasa',
      descricao: null,
      capa: null,
      generos: [],
      plataformas: [],
    },
  ]);
});

it('compartilha o token e limita a quatro os inícios de busca por segundo', async () => {
  const inicios: number[] = [];
  requisicao.mockImplementation(() => {
    inicios.push(performance.now());
    return Promise.resolve(Response.json([]));
  });
  const buscas = Promise.all(
    Array.from({ length: 5 }, () => adaptador.buscarPorTitulo('Brasa')),
  );

  await vi.advanceTimersByTimeAsync(999);
  expect(inicios).toEqual([0, 250, 500, 750]);
  await vi.advanceTimersByTimeAsync(1);
  await expect(buscas).resolves.toHaveLength(5);
  expect(inicios).toEqual([0, 250, 500, 750, 1_000]);
  expect(
    requisicao.mock.calls.filter(([url]) => url === urlToken),
  ).toHaveLength(1);
});

it('rejeita sobrecarga local sem abrir novas consultas acima do limite', async () => {
  const buscas = Promise.all(
    Array.from({ length: 8 }, () => adaptador.buscarPorTitulo('Brasa')),
  );
  await expect(adaptador.buscarPorTitulo('Neon')).rejects.toMatchObject({
    motivo: 'limite',
  });
  await vi.advanceTimersByTimeAsync(1_750);
  await expect(buscas).resolves.toHaveLength(8);
  expect(requisicao).toHaveBeenCalledTimes(9);
});

it('compartilha a renovação do token vencido entre buscas concorrentes', async () => {
  await adaptador.buscarPorTitulo('Brasa');
  await vi.advanceTimersByTimeAsync(60_000);
  requisicao.mockResolvedValueOnce(respostaToken('token-renovado'));

  const buscas = Promise.all([
    adaptador.buscarPorTitulo('Brasa'),
    adaptador.buscarPorTitulo('Neon'),
  ]);
  await vi.advanceTimersByTimeAsync(250);
  await expect(buscas).resolves.toEqual([[], []]);

  expect(
    requisicao.mock.calls.filter(([url]) => url === urlToken),
  ).toHaveLength(2);
  for (const [, opcoes] of requisicao.mock.calls.slice(-2)) {
    expect(new Headers(opcoes?.headers).get('Authorization')).toBe(
      'Bearer token-renovado',
    );
  }
});

it('solicita outro token na busca seguinte se a IGDB o rejeitar', async () => {
  requisicao.mockResolvedValueOnce(new Response(null, { status: 401 }));
  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'autenticacao',
  });

  requisicao.mockResolvedValueOnce(respostaToken('token-novo'));
  const busca = adaptador.buscarPorTitulo('Brasa');
  await vi.advanceTimersByTimeAsync(250);
  await expect(busca).resolves.toEqual([]);
  expect(
    requisicao.mock.calls.filter(([url]) => url === urlToken),
  ).toHaveLength(2);
});

it('permite outra tentativa depois de uma resposta inválida no OAuth', async () => {
  requisicao.mockReset();
  requisicao
    .mockResolvedValueOnce(
      Response.json({ access_token: 'ficticio', expires_in: 0 }),
    )
    .mockResolvedValueOnce(respostaToken())
    .mockResolvedValueOnce(Response.json([]));

  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'resposta_invalida',
  });
  await expect(adaptador.buscarPorTitulo('Brasa')).resolves.toEqual([]);
  expect(requisicao).toHaveBeenCalledTimes(3);
});

it('informa credencial ausente antes de iniciar chamadas externas', async () => {
  adaptador = new IgdbAdaptador(
    new ConfigService({
      IGDB_CLIENT_ID: 'cliente-ficticio',
      IGDB_CLIENT_SECRET: ' ',
    }),
  );
  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'configuracao',
  });
  expect(requisicao).not.toHaveBeenCalled();
});

it.each([
  [400, 'rejeitada'],
  [429, 'limite'],
  [503, 'indisponivel'],
])(
  'classifica falha HTTP %i sem devolver o corpo externo',
  async (status, motivo) => {
    requisicao.mockResolvedValueOnce(
      new Response('detalhe-ficticio', { status }),
    );

    const busca = adaptador.buscarPorTitulo('Brasa');
    await expect(busca).rejects.toMatchObject({ name: 'ErroIgdb', motivo });
    await expect(busca).rejects.not.toThrow('detalhe-ficticio');
    expect(requisicao).toHaveBeenCalledTimes(2);
  },
);

it.each([
  ['lista inválida', { resultados: [] }],
  ['ID inválido', [{ id: '51', name: 'Brasa' }]],
  ['gênero inválido', [{ id: 51, name: 'Brasa', genres: [{ name: 2 }] }]],
])('rejeita a resposta com %s', async (_, dados) => {
  requisicao.mockResolvedValueOnce(Response.json(dados));
  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'resposta_invalida',
  });
});

it('distingue JSON inválido de uma falha de conexão', async () => {
  requisicao.mockResolvedValueOnce(new Response('{'));
  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'resposta_invalida',
  });

  requisicao.mockRejectedValueOnce(new TypeError('conexão recusada'));
  const busca = adaptador.buscarPorTitulo('Brasa');
  const falha = expect(busca).rejects.toMatchObject({ motivo: 'indisponivel' });
  await vi.advanceTimersByTimeAsync(250);
  await falha;
});

it('classifica o cancelamento da requisição por timeout', async () => {
  const controlador = new AbortController();
  const tempoLimite = vi
    .spyOn(AbortSignal, 'timeout')
    .mockReturnValue(controlador.signal);
  requisicao.mockImplementationOnce((_, opcoes) => {
    expect(opcoes?.signal).toBe(controlador.signal);
    controlador.abort();
    return Promise.reject(new Error('requisição cancelada'));
  });

  await expect(adaptador.buscarPorTitulo('Brasa')).rejects.toMatchObject({
    motivo: 'timeout',
  });
  expect(tempoLimite).toHaveBeenLastCalledWith(5_000);
});
