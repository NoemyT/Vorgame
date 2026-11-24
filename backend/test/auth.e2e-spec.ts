import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { compare } from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const cadastro = {
  nome: 'Ana Souza',
  email: 'Ana@example.test',
  username: 'AnaSouza',
  senha: ' ' + 'á'.repeat(35) + ' ',
};

const usuario = {
  id: 7,
  nome: cadastro.nome,
  email: cadastro.email,
  username: cadastro.username,
  criadoEm: new Date('2026-11-18T12:00:00Z'),
};

const criarUsuario =
  vi.fn<(consulta: Prisma.UsuarioCreateArgs) => Promise<typeof usuario>>();
let app: INestApplication<App>;

beforeAll(async () => {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ usuario: { create: criarUsuario } })
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();
});

beforeEach(() => {
  criarUsuario.mockReset();
});

afterAll(async () => {
  await app.close();
});

function erroUnicidade(target: string) {
  return new Prisma.PrismaClientKnownRequestError('Valor duplicado', {
    code: 'P2002',
    clientVersion: '6.19.3',
    meta: { target },
  });
}

describe('POST /auth/register', () => {
  it('cadastra a conta com hash e retorna somente os campos públicos', async () => {
    criarUsuario.mockResolvedValue(usuario);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(cadastro)
      .expect(201)
      .expect({ ...usuario, criadoEm: usuario.criadoEm.toISOString() });

    expect(criarUsuario).toHaveBeenCalledExactlyOnceWith({
      data: {
        nome: cadastro.nome,
        email: cadastro.email,
        username: cadastro.username,
        senhaHash: expect.stringMatching(/^\$2[ab]\$12\$/),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        criadoEm: true,
      },
    });
    const [[{ data }]] = criarUsuario.mock.calls;
    await expect(compare(cadastro.senha, data.senhaHash)).resolves.toBe(true);
  });

  it.each([
    ['Usuario_email_key', 'Email já cadastrado'],
    ['Usuario_username_key', 'Nome de usuário já cadastrado'],
  ])('retorna 409 na violação de %s', async (alvo, message) => {
    criarUsuario.mockRejectedValue(erroUnicidade(alvo));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(cadastro)
      .expect(409)
      .expect({ statusCode: 409, message, error: 'Conflict' });
  });
});

describe('concorrência de POST /auth/register', () => {
  it('traduz a violação de unicidade também em cadastros concorrentes', async () => {
    criarUsuario
      .mockResolvedValueOnce(usuario)
      .mockRejectedValueOnce(erroUnicidade('Usuario_email_key'));

    const respostas = await Promise.all(
      [cadastro, cadastro].map((dados) =>
        request(app.getHttpServer()).post('/auth/register').send(dados),
      ),
    );

    expect(
      respostas.map((resposta) => resposta.status).sort((a, b) => a - b),
    ).toEqual([201, 409]);
  });
});

describe('validação de POST /auth/register', () => {
  it.each([
    {},
    { ...cadastro, nome: ' ' },
    { ...cadastro, username: ' ' },
    { ...cadastro, email: 'inválido' },
    { ...cadastro, senha: 123 },
    { ...cadastro, senha: ' ' },
    { ...cadastro, senha: 'á'.repeat(37) },
  ])('retorna 400 sem gravar o cadastro inválido %#', async (dados) => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(dados)
      .expect(400);

    expect(criarUsuario).not.toHaveBeenCalled();
  });
});
