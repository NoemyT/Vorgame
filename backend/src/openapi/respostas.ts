import { ApiProperty, type ApiResponseOptions } from '@nestjs/swagger';

class ErroHttpResposta {
  @ApiProperty({ type: 'integer' })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiProperty()
  error!: string;
}

const rotulosHttp = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
};

export function erroHttp(
  status: keyof typeof rotulosHttp,
  description: string,
  message: string | string[],
): ApiResponseOptions {
  return {
    status,
    description,
    type: ErroHttpResposta,
    example: { statusCode: status, message, error: rotulosHttp[status] },
  };
}

export function estadoSaude(banco: 'ok' | 'erro') {
  return {
    type: 'object',
    required: ['api', 'banco'],
    properties: {
      api: { type: 'string', enum: ['ok'] },
      banco: { type: 'string', enum: [banco] },
    },
    example: { api: 'ok', banco },
  };
}

class UsuarioPublicoResposta {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ana Souza' })
  nome!: string;

  @ApiProperty({ example: 'anasouza' })
  username!: string;
}

export class UsuarioAutenticadoResposta extends UsuarioPublicoResposta {
  @ApiProperty({ format: 'email', example: 'ana@example.test' })
  email!: string;
}

export class UsuarioCadastradoResposta extends UsuarioAutenticadoResposta {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2026-11-18T12:00:00.000Z',
  })
  criadoEm!: string;
}

export class LoginResposta {
  @ApiProperty({
    example: 'token-ficticio',
    description: 'JWT com validade de uma hora.',
  })
  token!: string;

  @ApiProperty({ type: UsuarioPublicoResposta })
  usuario!: UsuarioPublicoResposta;
}

class JogoResumoResposta {
  @ApiProperty({ type: 'integer', example: 7 })
  id!: number;

  @ApiProperty({ example: 'Ecos de Órbita' })
  titulo!: string;

  @ApiProperty({
    format: 'uri',
    example: 'https://example.test/capas/ecos-de-orbita.webp',
  })
  capa!: string;

  @ApiProperty({ type: 'number', nullable: true, example: null })
  mediaAvaliacao!: number | null;

  @ApiProperty({ type: 'integer', example: 0 })
  totalAvaliacoes!: number;
}

export class BuscaJogosResposta {
  @ApiProperty({ type: [JogoResumoResposta] })
  resultados!: JogoResumoResposta[];
}

export class JogoDetalhadoResposta extends JogoResumoResposta {
  @ApiProperty({ example: 'Explore estações abandonadas.' })
  descricao!: string;

  @ApiProperty({ example: 'Aventura' })
  genero!: string;

  @ApiProperty({ type: [String], example: ['PC', 'Nintendo Switch'] })
  plataformas!: string[];
}

class NotaResposta {
  @ApiProperty({ type: 'integer', example: 7 })
  jogoId!: number;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 10, example: 8 })
  nota!: number;
}

export class AvaliacaoPropriaResposta extends NotaResposta {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2026-11-18T12:30:00.000Z',
  })
  atualizadoEm!: string;
}

export class AvaliacaoGravadaResposta extends NotaResposta {
  @ApiProperty({ type: 'number', example: 8.3 })
  mediaAvaliacao!: number;

  @ApiProperty({ type: 'integer', example: 4 })
  totalAvaliacoes!: number;
}
