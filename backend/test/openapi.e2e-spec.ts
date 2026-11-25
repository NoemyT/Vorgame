import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject, OperationObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const operacoes = [
  ['/auth/register', 'post', ['201', '400', '409'], false],
  ['/auth/login', 'post', ['200', '400', '401'], false],
  ['/auth/me', 'get', ['200', '401'], true],
  ['/games', 'get', ['200', '400'], false],
  ['/games/{id}', 'get', ['200', '400', '404'], false],
  ['/games/{id}/ratings/me', 'get', ['200', '400', '401', '404'], true],
  ['/games/{id}/ratings', 'post', ['201', '400', '401', '404', '409'], true],
  ['/games/{id}/ratings/me', 'put', ['200', '400', '401', '404'], true],
  ['/health', 'get', ['200', '503'], false],
] as const;

let app: INestApplication<App>;
let documento: OpenAPIObject;

function operacao(
  rota: string,
  metodo: 'get' | 'post' | 'put',
): OperationObject {
  const encontrada = documento.paths[rota]?.[metodo];
  if (!encontrada) {
    throw new Error(`Operação OpenAPI ausente para ${metodo} ${rota}`);
  }
  return encontrada;
}

function conteudoResposta(operacao: OperationObject, status: string) {
  const resposta = operacao.responses[status];
  return resposta && 'content' in resposta
    ? resposta.content?.['application/json']
    : undefined;
}

beforeAll(async () => {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();
  app = modulo.createNestApplication<INestApplication<App>>();
  configurarApp(app);
  await app.init();

  const resposta = await request(app.getHttpServer())
    .get('/docs-json')
    .expect('Content-Type', /json/)
    .expect(200);
  documento = resposta.body as OpenAPIObject;
});

afterAll(async () => {
  await app.close();
});

describe('Rotas da documentação OpenAPI', () => {
  it('serve a interface Swagger e seus recursos', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/docs')
      .expect(200);
    expect(resposta.text).toContain('Swagger UI');
    await request(app.getHttpServer()).get('/docs/swagger-ui.css').expect(200);
  });

  it('declara o esquema Bearer e limita a documentação às rotas implementadas', () => {
    expect(documento.openapi).toMatch(/^3\./);
    expect(documento.security).toBeUndefined();
    expect(documento.components?.securitySchemes?.bearer).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(Object.keys(documento.paths).sort()).toEqual(
      [...new Set(operacoes.map(([rota]) => rota))].sort(),
    );
  });

  it.each(operacoes)(
    'documenta %s (%s) e suas respostas',
    (rota, metodo, status, protegida) => {
      const definicao = operacao(rota, metodo);
      expect(Object.keys(definicao.responses).sort()).toEqual(
        [...status].sort(),
      );
      expect(definicao.security).toEqual(
        protegida ? [{ bearer: [] }] : undefined,
      );
      for (const codigo of status) {
        expect(conteudoResposta(definicao, codigo)?.schema).toBeDefined();
      }
    },
  );
});

describe('Parâmetros e corpos OpenAPI', () => {
  it('documenta a consulta e os identificadores de jogo obrigatórios', () => {
    expect(operacao('/games', 'get').parameters).toMatchObject([
      {
        name: 'q',
        in: 'query',
        required: true,
        schema: { type: 'string', minLength: 1 },
      },
    ]);
    for (const [rota, metodo] of operacoes.filter(([rota]) =>
      rota.includes('{id}'),
    )) {
      expect(operacao(rota, metodo).parameters).toMatchObject([
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      ]);
    }
  });

  it.each([
    [
      '/auth/register',
      'post',
      'CadastroDto',
      ['nome', 'email', 'username', 'senha'],
    ],
    ['/auth/login', 'post', 'LoginDto', ['login', 'senha']],
    ['/games/{id}/ratings', 'post', 'NotaDto', ['nota']],
    ['/games/{id}/ratings/me', 'put', 'NotaDto', ['nota']],
  ] as const)('usa o DTO aprovado em %s (%s)', (rota, metodo, dto, campos) => {
    expect(operacao(rota, metodo).requestBody).toMatchObject({
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/' + dto } },
      },
    });
    expect(documento.components?.schemas?.[dto]).toMatchObject({
      required: campos,
    });
  });
});

describe('Esquemas e exemplos OpenAPI', () => {
  it('inclui lista vazia e média nula sem avaliações', () => {
    const busca = conteudoResposta(operacao('/games', 'get'), '200');
    expect(busca?.schema).toEqual({
      $ref: '#/components/schemas/BuscaJogosResposta',
    });
    expect(busca?.examples?.semJogos).toMatchObject({
      value: { resultados: [] },
    });
    expect(busca?.examples?.comJogos).toMatchObject({
      value: { resultados: [{ mediaAvaliacao: null, totalAvaliacoes: 0 }] },
    });
    expect(documento.components?.schemas?.JogoDetalhadoResposta).toMatchObject({
      properties: {
        plataformas: { type: 'array', items: { type: 'string' } },
        mediaAvaliacao: { type: 'number', nullable: true, example: null },
      },
    });
  });

  it('documenta nota inteira, datas e o formato de erros', () => {
    const esquemas = documento.components?.schemas;
    expect(esquemas?.NotaDto).toMatchObject({
      properties: { nota: { type: 'integer', minimum: 0, maximum: 10 } },
    });
    expect(esquemas?.AvaliacaoPropriaResposta).toMatchObject({
      properties: { atualizadoEm: { type: 'string', format: 'date-time' } },
    });
    expect(esquemas?.ErroHttpResposta).toMatchObject({
      required: ['statusCode', 'message', 'error'],
      properties: {
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      },
    });
    const erro = conteudoResposta(operacao('/auth/me', 'get'), '401');
    expect(erro?.example).toEqual({
      statusCode: 401,
      message: 'Token ausente ou inválido',
      error: 'Unauthorized',
    });
  });
});

it.each([
  [
    '/auth/register',
    'post',
    {
      status: '201',
      nome: 'UsuarioCadastradoResposta',
      campos: ['id', 'nome', 'email', 'username', 'criadoEm'],
    },
  ],
  [
    '/auth/login',
    'post',
    { status: '200', nome: 'LoginResposta', campos: ['token', 'usuario'] },
  ],
  [
    '/auth/me',
    'get',
    {
      status: '200',
      nome: 'UsuarioAutenticadoResposta',
      campos: ['id', 'nome', 'email', 'username'],
    },
  ],
  [
    '/games/{id}',
    'get',
    {
      status: '200',
      nome: 'JogoDetalhadoResposta',
      campos: [
        'id',
        'titulo',
        'capa',
        'descricao',
        'genero',
        'plataformas',
        'mediaAvaliacao',
        'totalAvaliacoes',
      ],
    },
  ],
  [
    '/games/{id}/ratings/me',
    'get',
    {
      status: '200',
      nome: 'AvaliacaoPropriaResposta',
      campos: ['jogoId', 'nota', 'atualizadoEm'],
    },
  ],
  [
    '/games/{id}/ratings',
    'post',
    {
      status: '201',
      nome: 'AvaliacaoGravadaResposta',
      campos: ['jogoId', 'nota', 'mediaAvaliacao', 'totalAvaliacoes'],
    },
  ],
  [
    '/games/{id}/ratings/me',
    'put',
    {
      status: '200',
      nome: 'AvaliacaoGravadaResposta',
      campos: ['jogoId', 'nota', 'mediaAvaliacao', 'totalAvaliacoes'],
    },
  ],
] as const)(
  'documenta os campos da resposta de %s (%s)',
  (rota, metodo, { status, nome, campos }) => {
    expect(conteudoResposta(operacao(rota, metodo), status)?.schema).toEqual({
      $ref: '#/components/schemas/' + nome,
    });
    const esquema = documento.components?.schemas?.[nome];
    if (!esquema || !('properties' in esquema)) {
      throw new Error('Esquema de resposta ausente');
    }
    expect(Object.keys(esquema.properties ?? {}).sort()).toEqual(
      [...campos].sort(),
    );
    expect(esquema.required?.slice().sort()).toEqual([...campos].sort());
  },
);

it('mantém o corpo próprio do 503 de saúde', () => {
  const resposta = conteudoResposta(operacao('/health', 'get'), '503');
  expect(resposta?.schema).toMatchObject({
    required: ['api', 'banco'],
    example: { api: 'ok', banco: 'erro' },
  });
});
