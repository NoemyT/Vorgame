import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { Prisma } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const segredo = 'segredo-ficticio-minhas-avaliacoes';
const usuario = {
  id: 1,
  nome: 'Pessoa Fictícia',
  email: 'pessoa@example.test',
  username: 'pessoa',
};
const registros = [
  { jogoId: 12, nota: 0, jogo: { titulo: 'Farol de Vidro', capa: '' } },
  {
    jogoId: 7,
    nota: 8,
    jogo: { titulo: 'Ecos de Órbita', capa: 'https://example.test/ecos.webp' },
  },
];
const listar =
  vi.fn<
    (consulta: Prisma.AvaliacaoFindManyArgs) => Promise<typeof registros>
  >();
let app: INestApplication<App>;
let autorizacao: string;

beforeAll(async () => {
  vi.stubEnv('JWT_SECRET', segredo);
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({
      usuario: { findUnique: vi.fn().mockResolvedValue(usuario) },
      avaliacao: { findMany: listar },
    })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
  const token = await app
    .get(JwtService)
    .signAsync({ sub: String(usuario.id) }, { secret: segredo });
  autorizacao = 'Bearer ' + token;
});

beforeEach(() => listar.mockReset());

afterAll(async () => {
  await app.close();
  vi.unstubAllEnvs();
});

describe('GET /ratings/me', () => {
  it('usa a conta do token mesmo que outra seja informada na URL', async () => {
    listar.mockResolvedValue(registros);
    await request(app.getHttpServer())
      .get('/ratings/me?usuarioId=2')
      .set('Authorization', autorizacao)
      .expect(200)
      .expect({
        avaliacoes: [
          { jogoId: 12, nota: 0, titulo: 'Farol de Vidro', capa: '' },
          {
            jogoId: 7,
            nota: 8,
            titulo: 'Ecos de Órbita',
            capa: 'https://example.test/ecos.webp',
          },
        ],
      });

    expect(listar).toHaveBeenCalledExactlyOnceWith({
      where: { usuarioId: 1 },
      orderBy: [{ atualizadoEm: 'desc' }, { id: 'desc' }],
      select: {
        jogoId: true,
        nota: true,
        jogo: { select: { titulo: true, capa: true } },
      },
    });
  });

  it('retorna lista vazia para uma conta sem avaliações', async () => {
    listar.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/ratings/me')
      .set('Authorization', autorizacao)
      .expect(200)
      .expect({ avaliacoes: [] });
  });

  it.each(['', 'Bearer token-ficticio-invalido'])(
    'recusa credencial inválida ou ausente (%s)',
    async (token) => {
      const chamada = request(app.getHttpServer()).get('/ratings/me');
      if (token) chamada.set('Authorization', token);
      await chamada.expect(401);
      expect(listar).not.toHaveBeenCalled();
    },
  );
});
