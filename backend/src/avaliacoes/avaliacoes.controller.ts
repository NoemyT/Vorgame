import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequisicaoAutenticada } from '../auth/auth.guard.js';
import { AvaliacoesService } from './avaliacoes.service.js';
import { NotaDto, NotaPipe } from './nota.dto.js';

@Controller('games/:id/ratings')
@UseGuards(AuthGuard)
export class AvaliacoesController {
  constructor(private readonly avaliacoes: AvaliacoesService) {}

  @Get('me')
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
    if (resultado.tipo === 'jogo-inexistente') {
      throw new NotFoundException('Jogo não encontrado');
    }
    if (resultado.tipo === 'duplicada') {
      throw new ConflictException('Você já avaliou este jogo');
    }
    return resultado.avaliacao;
  }
}
