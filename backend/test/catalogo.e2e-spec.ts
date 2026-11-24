import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
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

const findMany = vi.fn<() => Promise<typeof jogos>>();
let app: INestApplication<App>;

beforeAll(async () => {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ jogo: { findMany } })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
});

beforeEach(() => {
  findMany.mockReset();
});

afterAll(async () => {
  await app.close();
});

describe('GET /games', () => {
  it('busca parte do título e devolve o resumo sem exigir autenticação', async () => {
    findMany.mockResolvedValue(jogos);

    await request(app.getHttpServer())
      .get('/games')
      .query({ q: '  COS  ' })
      .expect(200)
      .expect({ resultados: [{ ...jogos[0], mediaAvaliacao: 9.4 }, jogos[1]] });

    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { titulo: { contains: 'COS' } },
      select: {
        id: true,
        titulo: true,
        capa: true,
        mediaAvaliacao: true,
        totalAvaliacoes: true,
      },
    });
  });

  it('devolve lista vazia quando não há jogos correspondentes', async () => {
    findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/games?q=inexistente')
      .expect(200)
      .expect({ resultados: [] });
  });

  it('trata os caracteres do padrão SQL como parte do título', async () => {
    findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/games')
      .query({ q: '100%_\\' })
      .expect(200)
      .expect({ resultados: [] });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { titulo: { contains: '100\\%\\_\\\\' } },
      }),
    );
  });
});

describe('validação de GET /games', () => {
  it.each(['/games', '/games?q=', '/games?q=%20%20', '/games?q=a&q=b'])(
    'devolve 400 para %s sem consultar o banco',
    async (url) => {
      await request(app.getHttpServer()).get(url).expect(400).expect({
        statusCode: 400,
        message: 'q deve conter um termo de busca',
        error: 'Bad Request',
      });

      expect(findMany).not.toHaveBeenCalled();
    },
  );
});
