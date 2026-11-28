import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, type RequisicaoAutenticada } from '../auth/auth.guard.js';
import { erroHttp } from '../openapi/respostas.js';
import { AvaliacoesService } from './avaliacoes.service.js';

class AvaliacaoListadaResposta {
  @ApiProperty({ type: 'integer', example: 7 })
  jogoId!: number;

  @ApiProperty({ example: 'Ecos de Órbita' })
  titulo!: string;

  @ApiProperty({ example: 'https://example.test/capas/ecos.webp' })
  capa!: string;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 10, example: 8 })
  nota!: number;
}

class MinhasAvaliacoesResposta {
  @ApiProperty({ type: [AvaliacaoListadaResposta] })
  avaliacoes!: AvaliacaoListadaResposta[];
}

@Controller('ratings/me')
@UseGuards(AuthGuard)
@ApiTags('Avaliações')
@ApiBearerAuth()
export class MinhasAvaliacoesController {
  constructor(private readonly avaliacoes: AvaliacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar avaliações do usuário autenticado' })
  @ApiOkResponse({
    type: MinhasAvaliacoesResposta,
    description:
      'Avaliações da conta, da atualização mais recente à mais antiga.',
  })
  @ApiResponse(
    erroHttp(
      401,
      'Token ausente, inválido ou expirado.',
      'Token ausente ou inválido',
    ),
  )
  async listar(@Req() requisicao: RequisicaoAutenticada) {
    const avaliacoes = await this.avaliacoes.listarProprias(
      requisicao.usuarioAutenticado.id,
    );
    return { avaliacoes };
  }
}
