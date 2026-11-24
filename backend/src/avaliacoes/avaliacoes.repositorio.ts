import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

function idArmazenavel(id: number): boolean {
  return id >= -2_147_483_648 && id <= 2_147_483_647;
}

@Injectable()
export class AvaliacoesRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  buscarPropria(jogoId: number, usuarioId: number) {
    if (!idArmazenavel(jogoId)) {
      return null;
    }
    return this.prisma.avaliacao.findUnique({
      where: { usuarioId_jogoId: { usuarioId, jogoId } },
      select: { jogoId: true, nota: true, atualizadoEm: true },
    });
  }
}
