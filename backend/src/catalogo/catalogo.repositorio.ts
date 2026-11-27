import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

export interface DadosJogoExterno {
  provedor: string;
  idExterno: number;
  titulo: string;
  capa: string | null;
  descricao: string | null;
  genero: string | null;
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

function limitarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  // VARCHAR conta caracteres Unicode, e slice usa índices UTF-16.
  let restantes = limite;
  let fim = 0;
  for (const caractere of texto) {
    if (restantes === 0) break;
    restantes -= 1;
    fim += caractere.length;
  }
  return texto.slice(0, fim);
}

function limitarDescricao(texto: string | null): string | undefined {
  if (texto === null) return undefined;
  if (Buffer.byteLength(texto, 'utf8') <= 65_535) return texto;

  // TEXT limita bytes. O decoder descarta um caractere UTF-8 cortado no final.
  const bytes = Buffer.from(texto, 'utf8').subarray(0, 65_535);
  return new TextDecoder().decode(bytes, { stream: true });
}

function prepararMetadados(dados: DadosJogoExterno) {
  return {
    titulo: limitarTexto(dados.titulo, 191),
    capa: dados.capa && dados.capa.length <= 2_048 ? dados.capa : undefined,
    descricao: limitarDescricao(dados.descricao),
    genero: dados.genero ? limitarTexto(dados.genero, 191) : undefined,
    plataformas: dados.plataformas.length ? dados.plataformas : undefined,
  };
}

@Injectable()
export class CatalogoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async salvarExterno(dados: DadosJogoExterno): Promise<JogoResumo> {
    const identidade = {
      provedor: dados.provedor,
      idExterno: BigInt(dados.idExterno),
    };
    const where = { provedor_idExterno: identidade };
    const update = prepararMetadados(dados);
    const create = {
      ...identidade,
      titulo: update.titulo,
      capa: update.capa ?? '',
      descricao: update.descricao ?? '',
      genero: update.genero ?? '',
      plataformas: update.plataformas ?? [],
    };

    const jogo = await this.gravarExterno({ where, create, update });
    return {
      ...jogo,
      mediaAvaliacao: jogo.mediaAvaliacao?.toNumber() ?? null,
    };
  }

  private async gravarExterno({
    where,
    create,
    update,
  }: Prisma.JogoUpsertArgs) {
    try {
      return await this.prisma.jogo.upsert({
        where,
        create,
        update,
        select: selecaoResumo,
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        // No MySQL, o upsert do Prisma pode disputar a inserção com outra busca.
        return this.prisma.jogo.update({
          where,
          data: update,
          select: selecaoResumo,
        });
      }
      throw erro;
    }
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
