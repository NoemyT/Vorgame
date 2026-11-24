import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface JogoResumo {
  id: number;
  titulo: string;
  capa: string;
  mediaAvaliacao: number | null;
  totalAvaliacoes: number;
}

export interface JogoDetalhado extends JogoResumo {
  descricao: string;
  genero: string;
  plataformas: string[];
}

const selecaoResumo = {
  id: true,
  titulo: true,
  capa: true,
  mediaAvaliacao: true,
  totalAvaliacoes: true,
} as const;

function lerPlataformas(valor: unknown): string[] {
  if (
    !Array.isArray(valor) ||
    !valor.every((plataforma) => typeof plataforma === 'string')
  ) {
    throw new Error('Plataformas do jogo devem ser uma lista de textos');
  }
  return valor;
}

@Injectable()
export class CatalogoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorTitulo(termo: string): Promise<JogoResumo[]> {
    // A collation do título ignora maiúsculas. O escape mantém o termo literal no LIKE.
    const tituloLiteral = termo.replace(/[\\%_]/g, '\\$&');
    const jogos = await this.prisma.jogo.findMany({
      where: { titulo: { contains: tituloLiteral } },
      select: selecaoResumo,
    });

    return jogos.map((jogo) => ({
      ...jogo,
      mediaAvaliacao: jogo.mediaAvaliacao?.toNumber() ?? null,
    }));
  }

  async buscarPorId(id: number): Promise<JogoDetalhado | null> {
    // Fora dos limites de INT, o identificador não pode existir no banco.
    if (id < -2_147_483_648 || id > 2_147_483_647) {
      return null;
    }

    const jogo = await this.prisma.jogo.findUnique({
      where: { id },
      select: {
        ...selecaoResumo,
        descricao: true,
        genero: true,
        plataformas: true,
      },
    });
    if (!jogo) {
      return null;
    }

    return {
      ...jogo,
      mediaAvaliacao: jogo.mediaAvaliacao?.toNumber() ?? null,
      plataformas: lerPlataformas(jogo.plataformas),
    };
  }
}
