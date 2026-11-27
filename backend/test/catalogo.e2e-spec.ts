import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { IgdbAdaptador } from '../src/catalogo/igdb/igdb.adaptador.js';
import { ErroIgdb } from '../src/catalogo/igdb/igdb.http.js';
import type { JogoIgdb } from '../src/catalogo/igdb/igdb.resposta.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const jogos = [
  {
    id: 1,
    titulo: 'Ecos de Órbita',
    capa: 'https://exemplo.test/capas/ecos-de-orbita.webp',
    mediaAvaliacao: new Prisma.Decimal('9.4'),
    totalAvaliacoes: 2,
  },
  {
    id: 2,
    titulo: 'Ecos do Subsolo',
    capa: 'https://exemplo.test/capas/ecos-do-subsolo.webp',
    mediaAvaliacao: null,
    totalAvaliacoes: 0,
  },
];

const detalhes = {
  descricao: 'Explore uma estação abandonada.',
  genero: 'Aventura',
  plataformas: ['PC', 'Nintendo Switch'],
};

type JogoDetalhadoNoBanco = (typeof jogos)[number] & typeof detalhes;
const jogoIgdb: JogoIgdb = {
  idExterno: 1234,
  titulo: jogos[0].titulo,
  capa: jogos[0].capa,
  descricao: detalhes.descricao,
  generos: ['Aventura', 'Estratégia'],
  plataformas: detalhes.plataformas,
};
const buscarIgdb = vi.fn<IgdbAdaptador['buscarPorTitulo']>();
const upsert = vi.fn<() => Promise<(typeof jogos)[number]>>();
const update = vi.fn<() => Promise<(typeof jogos)[number]>>();
const findUnique = vi.fn<() => Promise<JogoDetalhadoNoBanco | null>>();
let app: INestApplication<App>;

beforeAll(async () => {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(IgdbAdaptador)
    .useValue({ buscarPorTitulo: buscarIgdb })
    .overrideProvider(PrismaService)
    .useValue({ jogo: { upsert, update, findUnique } })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
});

beforeEach(() => {
  buscarIgdb.mockReset();
  upsert.mockReset();
  update.mockReset();
  findUnique.mockReset();
});

afterAll(async () => {
  await app.close();
});

it('devolve apenas resumos da IGDB por título, com o ID e a média locais', async () => {
  buscarIgdb.mockResolvedValue([
    jogoIgdb,
    { ...jogoIgdb, idExterno: 1235, titulo: 'Jardim de Brasa' },
    jogoIgdb,
  ]);
  upsert.mockResolvedValue(jogos[0]);

  await request(app.getHttpServer())
    .get('/games')
    .query({ q: '  COS  ' })
    .expect(200)
    .expect({ resultados: [{ ...jogos[0], mediaAvaliacao: 9.4 }] });

  expect(buscarIgdb).toHaveBeenCalledExactlyOnceWith('COS');
  expect(upsert).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      where: { provedor_idExterno: { provedor: 'igdb', idExterno: 1234n } },
      create: {
        provedor: 'igdb',
        idExterno: 1234n,
        titulo: jogoIgdb.titulo,
        capa: jogoIgdb.capa,
        descricao: jogoIgdb.descricao,
        genero: 'Aventura, Estratégia',
        plataformas: jogoIgdb.plataformas,
      },
    }),
  );
});

it('devolve lista vazia sem gravar jogos quando a IGDB não encontra títulos', async () => {
  buscarIgdb.mockResolvedValue([]);

  await request(app.getHttpServer())
    .get('/games?q=inexistente')
    .expect(200)
    .expect({ resultados: [] });
  expect(upsert).not.toHaveBeenCalled();
});

it.each(['timeout', 'limite', 'resposta_invalida', 'configuracao'] as const)(
  'responde 503 sem expor o erro %s da IGDB',
  async (motivo) => {
    buscarIgdb.mockRejectedValue(new ErroIgdb(motivo));

    await request(app.getHttpServer()).get('/games?q=ecos').expect(503).expect({
      statusCode: 503,
      message: 'A pesquisa de jogos está temporariamente indisponível',
      error: 'Service Unavailable',
    });
    expect(upsert).not.toHaveBeenCalled();
  },
);

it('preenche campos ausentes na criação e os ignora na atualização', async () => {
  buscarIgdb.mockResolvedValue([
    { ...jogoIgdb, capa: null, descricao: null, generos: [], plataformas: [] },
  ]);
  upsert.mockResolvedValue({ ...jogos[0], capa: '' });
  await request(app.getHttpServer()).get('/games?q=ecos').expect(200);
  expect(upsert).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      create: expect.objectContaining({
        capa: '',
        descricao: '',
        genero: '',
        plataformas: [],
      }),
      update: {
        titulo: jogoIgdb.titulo,
        capa: undefined,
        descricao: undefined,
        genero: undefined,
        plataformas: undefined,
      },
    }),
  );
});

it('armazena textos longos dentro dos limites Unicode das colunas', async () => {
  const prefixoDescricao = 'x'.repeat(65_534);
  buscarIgdb.mockResolvedValue([
    {
      ...jogoIgdb,
      titulo: 'Ecos ' + '🌙'.repeat(190),
      descricao: prefixoDescricao + '🌙',
    },
  ]);
  upsert.mockResolvedValue(jogos[0]);

  await request(app.getHttpServer()).get('/games?q=ecos').expect(200);
  expect(upsert).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      create: expect.objectContaining({
        titulo: 'Ecos ' + '🌙'.repeat(186),
        descricao: prefixoDescricao,
      }),
    }),
  );
});

it('reutiliza o ID local ao disputar a inserção e abre os detalhes pelo link direto', async () => {
  buscarIgdb.mockResolvedValue([jogoIgdb]);
  upsert.mockResolvedValueOnce(jogos[0]).mockRejectedValueOnce(
    new Prisma.PrismaClientKnownRequestError('Identidade externa duplicada', {
      code: 'P2002',
      clientVersion: 'teste',
    }),
  );
  update.mockResolvedValue(jogos[0]);
  findUnique.mockResolvedValue({ ...jogos[0], ...detalhes });
  const resposta = { resultados: [{ ...jogos[0], mediaAvaliacao: 9.4 }] };
  await Promise.all([
    request(app.getHttpServer())
      .get('/games?q=ecos')
      .expect(200)
      .expect(resposta),
    request(app.getHttpServer())
      .get('/games?q=ecos')
      .expect(200)
      .expect(resposta),
  ]);
  expect(update).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      where: { provedor_idExterno: { provedor: 'igdb', idExterno: 1234n } },
      data: expect.not.objectContaining({ mediaAvaliacao: expect.anything() }),
    }),
  );
  buscarIgdb.mockRejectedValue(new ErroIgdb('indisponivel'));
  await request(app.getHttpServer())
    .get('/games/1')
    .expect(200)
    .expect({ ...jogos[0], ...detalhes, mediaAvaliacao: 9.4 });
  expect(buscarIgdb).toHaveBeenCalledTimes(2);
});

describe('validação de GET /games', () => {
  it.each(['/games', '/games?q=', '/games?q=%20%20', '/games?q=a&q=b'])(
    'devolve 400 para %s antes de buscar ou gravar jogos',
    async (url) => {
      await request(app.getHttpServer()).get(url).expect(400).expect({
        statusCode: 400,
        message: 'q deve conter um termo de busca',
        error: 'Bad Request',
      });

      expect(buscarIgdb).not.toHaveBeenCalled();
      expect(upsert).not.toHaveBeenCalled();
    },
  );
});

describe('GET /games/:id', () => {
  it.each([
    { jogo: jogos[0], mediaAvaliacao: 9.4 },
    { jogo: jogos[1], mediaAvaliacao: null },
  ])(
    'retorna os detalhes públicos do jogo $jogo.id',
    async ({ jogo, mediaAvaliacao }) => {
      findUnique.mockResolvedValue({ ...jogo, ...detalhes });

      await request(app.getHttpServer())
        .get(`/games/${jogo.id}`)
        .expect(200)
        .expect({ ...jogo, ...detalhes, mediaAvaliacao });

      expect(findUnique).toHaveBeenCalledExactlyOnceWith({
        where: { id: jogo.id },
        select: {
          id: true,
          titulo: true,
          capa: true,
          descricao: true,
          genero: true,
          plataformas: true,
          mediaAvaliacao: true,
          totalAvaliacoes: true,
        },
      });
    },
  );

  it('retorna 404 quando o jogo não existe', async () => {
    findUnique.mockResolvedValue(null);

    await request(app.getHttpServer()).get('/games/999').expect(404).expect({
      statusCode: 404,
      message: 'Jogo não encontrado',
      error: 'Not Found',
    });
  });

  it('retorna 404 para um inteiro fora do intervalo de IDs do banco', async () => {
    await request(app.getHttpServer()).get('/games/2147483648').expect(404);

    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe('validação de GET /games/:id', () => {
  it.each(['abc', '1.5'])('retorna 400 para o ID %s', async (id) => {
    await request(app.getHttpServer()).get(`/games/${id}`).expect(400).expect({
      statusCode: 400,
      message: 'Validation failed (numeric string is expected)',
      error: 'Bad Request',
    });

    expect(findUnique).not.toHaveBeenCalled();
  });
});
