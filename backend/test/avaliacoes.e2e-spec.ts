import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const SEGREDO_TESTE = 'segredo-ficticio-da-suite-de-avaliacoes';
const solicitante = {
  id: 1,
  nome: 'Pessoa Fictícia',
  email: 'pessoa@example.test',
  username: 'pessoa',
};
const avaliacao = {
  jogoId: 7,
  nota: 8,
  atualizadoEm: new Date('2026-11-18T12:30:00.000Z'),
};

const buscarAvaliacao =
  vi.fn<
    (
      consulta: Prisma.AvaliacaoFindUniqueArgs,
    ) => Promise<typeof avaliacao | null>
  >();
let app: INestApplication<App>;
let autorizacao: string;

async function gerarAutorizacao(expiresIn = 3600): Promise<string> {
  const token = await app
    .get(JwtService)
    .signAsync(
      { sub: String(solicitante.id) },
      { secret: SEGREDO_TESTE, expiresIn },
    );
  return 'Bearer ' + token;
}

beforeAll(async () => {
  vi.stubEnv('JWT_SECRET', SEGREDO_TESTE);
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({
      usuario: { findUnique: vi.fn().mockResolvedValue(solicitante) },
      avaliacao: { findUnique: buscarAvaliacao },
    })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  autorizacao = await gerarAutorizacao();
});

beforeEach(() => {
  buscarAvaliacao.mockReset();
});

afterAll(async () => {
  await app?.close();
  vi.unstubAllEnvs();
});

describe('GET /games/:id/ratings/me', () => {
  it('devolve apenas a nota da conta indicada pelo JWT', async () => {
    buscarAvaliacao.mockResolvedValue(avaliacao);

    await request(app.getHttpServer())
      .get('/games/7/ratings/me')
      .set('Authorization', autorizacao)
      .expect(200)
      .expect({
        ...avaliacao,
        atualizadoEm: avaliacao.atualizadoEm.toISOString(),
      });

    expect(buscarAvaliacao).toHaveBeenCalledExactlyOnceWith({
      where: { usuarioId_jogoId: { usuarioId: solicitante.id, jogoId: 7 } },
      select: { jogoId: true, nota: true, atualizadoEm: true },
    });
  });

  it('devolve 404 para um jogo inexistente', async () => {
    buscarAvaliacao.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/games/999/ratings/me')
      .set('Authorization', autorizacao)
      .expect(404);
  });

  it('devolve 404 quando só existe avaliação de outra conta', async () => {
    buscarAvaliacao.mockImplementation(({ where }) =>
      Promise.resolve(
        where.usuarioId_jogoId?.usuarioId === 2 ? avaliacao : null,
      ),
    );

    await request(app.getHttpServer())
      .get('/games/7/ratings/me')
      .set('Authorization', autorizacao)
      .expect(404);
  });
});

describe('validação de GET /games/:id/ratings/me', () => {
  it('devolve 400 para um ID não inteiro', async () => {
    await request(app.getHttpServer())
      .get('/games/1.5/ratings/me')
      .set('Authorization', autorizacao)
      .expect(400);

    expect(buscarAvaliacao).not.toHaveBeenCalled();
  });

  it.each(['ausente', 'inválido', 'expirado'])(
    'devolve 401 para token %s',
    async (situacao) => {
      const chamada = request(app.getHttpServer()).get('/games/7/ratings/me');
      if (situacao === 'inválido')
        chamada.set('Authorization', 'Bearer inválido');
      if (situacao === 'expirado')
        chamada.set('Authorization', await gerarAutorizacao(-1));

      await chamada.expect(401);
      expect(buscarAvaliacao).not.toHaveBeenCalled();
    },
  );
});
