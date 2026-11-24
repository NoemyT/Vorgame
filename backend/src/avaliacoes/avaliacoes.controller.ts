import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequisicaoAutenticada } from '../auth/auth.guard.js';
import { AvaliacoesService } from './avaliacoes.service.js';

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
}
