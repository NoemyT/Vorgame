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

type ResultadoGravacao =
  { tipo: 'gravada'; avaliacao: AvaliacaoGravada } | { tipo: 'inexistente' };

type ResultadoCriacao = ResultadoGravacao | { tipo: 'duplicada' };

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
    try {
      return await this.gravar(dados, (transacao) =>
        transacao.avaliacao.create({ data: dados, select: { id: true } }),
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

  async alterarPropria(dados: DadosAvaliacao): Promise<ResultadoGravacao> {
    const { jogoId, usuarioId, nota } = dados;
    try {
      return await this.gravar(dados, (transacao) =>
        transacao.avaliacao.update({
          where: { usuarioId_jogoId: { jogoId, usuarioId } },
          data: { nota },
          select: { id: true },
        }),
      );
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2025'
      ) {
        return { tipo: 'inexistente' };
      }
      throw erro;
    }
  }

  private async gravar(
    { jogoId, nota }: DadosAvaliacao,
    salvarNota: (transacao: Prisma.TransactionClient) => Promise<unknown>,
  ): Promise<ResultadoGravacao> {
    if (!idArmazenavel(jogoId)) {
      return { tipo: 'inexistente' };
    }

    return this.prisma.$transaction(
      async (transacao) => {
        // O bloqueio serializa escritas no mesmo jogo. ReadCommitted lê as notas já confirmadas após o bloqueio.
        const jogos = await transacao.$queryRaw<
          { id: number }[]
        >`SELECT id FROM Jogo WHERE id = ${jogoId} FOR UPDATE`;
        if (jogos.length === 0) {
          return { tipo: 'inexistente' };
        }

        await salvarNota(transacao);
        const agregados = await atualizarAgregados(transacao, jogoId);
        return { tipo: 'gravada', avaliacao: { jogoId, nota, ...agregados } };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
