import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface JogoResumo {
  id: number;
  titulo: string;
  capa: string;
  mediaAvaliacao: number | null;
  totalAvaliacoes: number;
}

@Injectable()
export class CatalogoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorTitulo(termo: string): Promise<JogoResumo[]> {
    // A collation do título ignora maiúsculas. O escape mantém o termo literal no LIKE.
    const tituloLiteral = termo.replace(/[\\%_]/g, '\\$&');
    const jogos = await this.prisma.jogo.findMany({
      where: { titulo: { contains: tituloLiteral } },
      select: {
        id: true,
        titulo: true,
        capa: true,
        mediaAvaliacao: true,
        totalAvaliacoes: true,
      },
    });

    return jogos.map((jogo) => ({
      ...jogo,
      mediaAvaliacao: jogo.mediaAvaliacao?.toNumber() ?? null,
    }));
  }
}
