import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AvaliacoesController } from './avaliacoes.controller.js';
import { AvaliacoesRepositorio } from './avaliacoes.repositorio.js';
import { AvaliacoesService } from './avaliacoes.service.js';
import { MinhasAvaliacoesController } from './minhas-avaliacoes.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AvaliacoesController, MinhasAvaliacoesController],
  providers: [AvaliacoesService, AvaliacoesRepositorio],
})
export class AvaliacoesModule {}
