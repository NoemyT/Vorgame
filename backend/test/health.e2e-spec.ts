import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { configurarApp } from '../src/configurar-app.js';

const ORIGEM_FRONTEND = 'https://vorgame.vercel.app';

async function criarApp(
  consulta: () => Promise<unknown>,
): Promise<INestApplication<App>> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ $queryRaw: vi.fn(consulta), $disconnect: vi.fn() })
    .compile();
  const app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  return app;
}

describe('GET /health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.CORS_ORIGIN = ORIGEM_FRONTEND;
  });

  afterEach(async () => {
    await app.close();
  });

  it('responde 200 quando o banco está acessível', async () => {
    app = await criarApp(() => Promise.resolve([{ 1: 1 }]));

    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ api: 'ok', banco: 'ok' });
  });

  it('responde 503 quando o banco está inacessível', async () => {
    app = await criarApp(() => Promise.reject(new Error('timeout')));

    await request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect({ api: 'ok', banco: 'erro' });
  });

  it('libera o CORS para a origem configurada', async () => {
    app = await criarApp(() => Promise.resolve([{ 1: 1 }]));

    await request(app.getHttpServer())
      .get('/health')
      .set('Origin', ORIGEM_FRONTEND)
      .expect('Access-Control-Allow-Origin', ORIGEM_FRONTEND);
  });

  it('não libera o CORS para outras origens', async () => {
    app = await criarApp(() => Promise.resolve([{ 1: 1 }]));

    const resposta = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://site-qualquer.com');

    expect(resposta.headers['access-control-allow-origin']).toBeUndefined();
  });
});
