import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

export interface DadosAvaliacao {
  jogoId: number;
  usuarioId: number;
  nota: number;
}

export interface AvaliacaoGravada {
  jogoId: number;
  nota: number;
  mediaAvaliacao: number;
  totalAvaliacoes: number;
}

type ResultadoCriacao =
  | { tipo: 'gravada'; avaliacao: AvaliacaoGravada }
  | { tipo: 'jogo-inexistente' }
  | { tipo: 'duplicada' };

function idArmazenavel(id: number): boolean {
  return id >= -2_147_483_648 && id <= 2_147_483_647;
}

async function atualizarAgregados(
  transacao: Prisma.TransactionClient,
  jogoId: number,
) {
  const notas = await transacao.avaliacao.aggregate({
    where: { jogoId },
    _sum: { nota: true },
    _count: { _all: true },
  });
  const totalAvaliacoes = notas._count._all;
  if (notas._sum.nota === null || totalAvaliacoes === 0) {
    throw new Error('Não há notas para calcular a média da avaliação gravada');
  }

  const mediaAvaliacao = new Prisma.Decimal(notas._sum.nota)
    .div(totalAvaliacoes)
    .toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP);
  await transacao.jogo.update({
    where: { id: jogoId },
    data: { mediaAvaliacao, totalAvaliacoes },
    select: { id: true },
  });
  return { mediaAvaliacao: mediaAvaliacao.toNumber(), totalAvaliacoes };
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

  async criar(dados: DadosAvaliacao): Promise<ResultadoCriacao> {
    if (!idArmazenavel(dados.jogoId)) {
      return { tipo: 'jogo-inexistente' };
    }

    try {
      return await this.prisma.$transaction(
        async (transacao) => {
          const { jogoId, nota } = dados;
          // O bloqueio por jogo serializa as escritas que recalculam seus agregados.
          const jogos = await transacao.$queryRaw<
            { id: number }[]
          >`SELECT id FROM Jogo WHERE id = ${jogoId} FOR UPDATE`;
          if (jogos.length === 0) {
            return { tipo: 'jogo-inexistente' };
          }

          await transacao.avaliacao.create({
            data: dados,
            select: { id: true },
          });
          const agregados = await atualizarAgregados(transacao, jogoId);
          return { tipo: 'gravada', avaliacao: { jogoId, nota, ...agregados } };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        return { tipo: 'duplicada' };
      }
      throw erro;
    }
  }
}
