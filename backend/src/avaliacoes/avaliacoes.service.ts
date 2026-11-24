import { Injectable } from '@nestjs/common';
import { AvaliacoesRepositorio } from './avaliacoes.repositorio.js';

@Injectable()
export class AvaliacoesService {
  constructor(private readonly repositorio: AvaliacoesRepositorio) {}

  consultarPropria(jogoId: number, usuarioId: number) {
    return this.repositorio.buscarPropria(jogoId, usuarioId);
  }
}
