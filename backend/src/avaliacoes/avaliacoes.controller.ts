import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, type RequisicaoAutenticada } from '../auth/auth.guard.js';
import {
  AvaliacaoGravadaResposta,
  AvaliacaoPropriaResposta,
  erroHttp,
} from '../openapi/respostas.js';
import { AvaliacoesService } from './avaliacoes.service.js';
import { NotaDto, NotaPipe } from './nota.dto.js';

@Controller('games/:id/ratings')
@UseGuards(AuthGuard)
@ApiTags('Avaliações')
@ApiBearerAuth()
@ApiParam({
  name: 'id',
  schema: { type: 'integer' },
  example: 7,
  description: 'Identificador do jogo.',
})
@ApiResponse(
  erroHttp(
    401,
    'Token ausente, inválido ou expirado.',
    'Token ausente ou inválido',
  ),
)
export class AvaliacoesController {
  constructor(private readonly avaliacoes: AvaliacoesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consultar a própria avaliação' })
  @ApiOkResponse({
    type: AvaliacaoPropriaResposta,
    description: 'Nota do usuário autenticado.',
  })
  @ApiResponse(
    erroHttp(
      400,
      'ID deve ser um inteiro.',
      'Validation failed (numeric string is expected)',
    ),
  )
  @ApiResponse(
    erroHttp(
      404,
      'Jogo inexistente ou usuário ainda sem avaliação para este jogo.',
      'Jogo ou avaliação não encontrado',
    ),
  )
  async consultarPropria(
    @Param('id', ParseIntPipe) jogoId: number,
    @Req() requisicao: RequisicaoAutenticada,
  ) {
    const avaliacao = await this.avaliacoes.consultarPropria(
      jogoId,
      requisicao.usuarioAutenticado.id,
    );
    if (!avaliacao) {
      throw new NotFoundException('Jogo ou avaliação não encontrado');
    }
    return avaliacao;
  }

  @Post()
  @ApiOperation({ summary: 'Avaliar um jogo' })
  @ApiBody({ type: NotaDto })
  @ApiCreatedResponse({
    type: AvaliacaoGravadaResposta,
    description: 'Nota gravada com a média e o total atualizados.',
  })
  @ApiResponse(
    erroHttp(
      400,
      'ID inválido ou nota ausente, não inteira ou fora de 0 a 10.',
      ['nota deve estar entre 0 e 10'],
    ),
  )
  @ApiResponse(erroHttp(404, 'Jogo não encontrado.', 'Jogo não encontrado'))
  @ApiResponse(
    erroHttp(
      409,
      'O usuário já avaliou este jogo.',
      'Você já avaliou este jogo',
    ),
  )
  async criar(
    @Param('id', ParseIntPipe) jogoId: number,
    @Body(NotaPipe) corpo: NotaDto,
    @Req() requisicao: RequisicaoAutenticada,
  ) {
    const resultado = await this.avaliacoes.criar({
      jogoId,
      usuarioId: requisicao.usuarioAutenticado.id,
      nota: corpo.nota,
    });
    if (resultado.tipo === 'inexistente') {
      throw new NotFoundException('Jogo não encontrado');
    }
    if (resultado.tipo === 'duplicada') {
      throw new ConflictException('Você já avaliou este jogo');
    }
    return resultado.avaliacao;
  }

  @Put('me')
  @ApiOperation({ summary: 'Alterar a própria avaliação' })
  @ApiBody({ type: NotaDto })
  @ApiOkResponse({
    type: AvaliacaoGravadaResposta,
    description: 'Nota alterada e média recalculada. O total permanece igual.',
  })
  @ApiResponse(
    erroHttp(
      400,
      'ID inválido ou nota ausente, não inteira ou fora de 0 a 10.',
      ['nota deve estar entre 0 e 10'],
    ),
  )
  @ApiResponse(
    erroHttp(
      404,
      'Jogo inexistente ou usuário ainda sem avaliação para este jogo.',
      'Jogo ou avaliação não encontrado',
    ),
  )
  async alterarPropria(
    @Param('id', ParseIntPipe) jogoId: number,
    @Body(NotaPipe) corpo: NotaDto,
    @Req() requisicao: RequisicaoAutenticada,
  ) {
    const resultado = await this.avaliacoes.alterarPropria({
      jogoId,
      usuarioId: requisicao.usuarioAutenticado.id,
      nota: corpo.nota,
    });
    if (resultado.tipo === 'inexistente') {
      throw new NotFoundException('Jogo ou avaliação não encontrado');
    }
    return resultado.avaliacao;
  }
}
