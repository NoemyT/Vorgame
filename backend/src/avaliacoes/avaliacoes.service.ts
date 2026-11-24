import { Injectable } from '@nestjs/common';
import {
  AvaliacoesRepositorio,
  type DadosAvaliacao,
} from './avaliacoes.repositorio.js';

@Injectable()
export class AvaliacoesService {
  constructor(private readonly repositorio: AvaliacoesRepositorio) {}

  consultarPropria(jogoId: number, usuarioId: number) {
    return this.repositorio.buscarPropria(jogoId, usuarioId);
  }

  criar(dados: DadosAvaliacao) {
    return this.repositorio.criar(dados);
  }
}
