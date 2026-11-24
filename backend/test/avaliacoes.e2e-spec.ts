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
const bloquearJogo = vi.fn<() => Promise<{ id: number }[]>>();
const criarAvaliacao = vi.fn<() => Promise<{ id: number }>>();
const agregarNotas =
  vi.fn<() => Promise<{ _sum: { nota: number }; _count: { _all: number } }>>();
const atualizarJogo = vi.fn<() => Promise<{ id: number }>>();
const transacao = {
  $queryRaw: bloquearJogo,
  avaliacao: { create: criarAvaliacao, aggregate: agregarNotas },
  jogo: { update: atualizarJogo },
};
const executarTransacao = vi.fn(
  (executar: (cliente: typeof transacao) => Promise<unknown>) =>
    executar(transacao),
);
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
      $transaction: executarTransacao,
    })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  autorizacao = await gerarAutorizacao();
});

beforeEach(() => {
  buscarAvaliacao.mockReset();
  bloquearJogo.mockReset();
  criarAvaliacao.mockReset();
  agregarNotas.mockReset();
  atualizarJogo.mockReset();
  executarTransacao.mockClear();
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

describe('POST /games/:id/ratings', () => {
  it.each([
    { nota: 0, soma: 0, total: 1, media: 0 },
    { nota: 10, soma: 33, total: 4, media: 8.3 },
  ])(
    'cria nota $nota e atualiza os agregados na mesma transação',
    async ({ nota, soma, total, media }) => {
      bloquearJogo.mockResolvedValue([{ id: 7 }]);
      criarAvaliacao.mockResolvedValue({ id: 1 });
      agregarNotas.mockResolvedValue({
        _sum: { nota: soma },
        _count: { _all: total },
      });
      atualizarJogo.mockResolvedValue({ id: 7 });

      await request(app.getHttpServer())
        .post('/games/7/ratings')
        .set('Authorization', autorizacao)
        .send({ nota, usuarioId: 999 })
        .expect(201)
        .expect({
          jogoId: 7,
          nota,
          mediaAvaliacao: media,
          totalAvaliacoes: total,
        });

      expect(executarTransacao).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function),
        { isolationLevel: 'ReadCommitted' },
      );
      expect(criarAvaliacao).toHaveBeenCalledExactlyOnceWith({
        data: { jogoId: 7, usuarioId: solicitante.id, nota },
        select: { id: true },
      });
      expect(atualizarJogo).toHaveBeenCalledExactlyOnceWith({
        where: { id: 7 },
        data: {
          mediaAvaliacao: new Prisma.Decimal(media),
          totalAvaliacoes: total,
        },
        select: { id: true },
      });
    },
  );
});

describe('erros de POST /games/:id/ratings', () => {
  it('retorna 404 se o jogo não existir', async () => {
    bloquearJogo.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post('/games/999/ratings')
      .set('Authorization', autorizacao)
      .send({ nota: 8 })
      .expect(404);

    expect(criarAvaliacao).not.toHaveBeenCalled();
  });

  it('retorna 409 se a avaliação já existir', async () => {
    bloquearJogo.mockResolvedValue([{ id: 7 }]);
    criarAvaliacao.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Avaliação duplicada', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await request(app.getHttpServer())
      .post('/games/7/ratings')
      .set('Authorization', autorizacao)
      .send({ nota: 8 })
      .expect(409);

    expect(atualizarJogo).not.toHaveBeenCalled();
  });
});

describe('validação de POST /games/:id/ratings', () => {
  it.each([
    {},
    { nota: -1 },
    { nota: 11 },
    { nota: 3.5 },
    { nota: '8' },
    { nota: null },
  ])('retorna 400 para corpo inválido %#', async (corpo) => {
    await request(app.getHttpServer())
      .post('/games/7/ratings')
      .set('Authorization', autorizacao)
      .send(corpo)
      .expect(400);

    expect(executarTransacao).not.toHaveBeenCalled();
  });

  it.each(['ausente', 'inválido', 'expirado'])(
    'retorna 401 para token %s',
    async (situacao) => {
      const chamada = request(app.getHttpServer())
        .post('/games/7/ratings')
        .send({ nota: 8 });
      if (situacao === 'inválido')
        chamada.set('Authorization', 'Bearer invalido');
      if (situacao === 'expirado')
        chamada.set('Authorization', await gerarAutorizacao(-1));

      await chamada.expect(401);
      expect(executarTransacao).not.toHaveBeenCalled();
    },
  );
});
