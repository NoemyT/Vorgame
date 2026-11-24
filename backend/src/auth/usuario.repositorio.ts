import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

interface NovoUsuario {
  nome: string;
  email: string;
  username: string;
  senhaHash: string;
}

const selecaoCadastro = {
  id: true,
  nome: true,
  email: true,
  username: true,
  criadoEm: true,
} as const;

type ResultadoCadastro =
  | {
      tipo: 'criado';
      usuario: Prisma.UsuarioGetPayload<{ select: typeof selecaoCadastro }>;
    }
  | { tipo: 'conflito'; campo: 'email' | 'username' | 'desconhecido' };

function campoDuplicado(alvo: unknown): 'email' | 'username' | 'desconhecido' {
  const nome = Array.isArray(alvo) ? alvo.join(',') : alvo;
  if (typeof nome === 'string') {
    if (nome.includes('email')) return 'email';
    if (nome.includes('username')) return 'username';
  }
  return 'desconhecido';
}

function falhaAoGravarUsuario(erro: unknown): Error {
  // A mensagem original do Prisma pode carregar os dados enviados ao banco.
  const codigo =
    erro instanceof Prisma.PrismaClientKnownRequestError
      ? erro.code
      : undefined;
  return new Error('Falha ao gravar usuário', { cause: codigo });
}

@Injectable()
export class UsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dados: NovoUsuario): Promise<ResultadoCadastro> {
    try {
      const usuario = await this.prisma.usuario.create({
        data: dados,
        select: selecaoCadastro,
      });
      return { tipo: 'criado', usuario };
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        return { tipo: 'conflito', campo: campoDuplicado(erro.meta?.target) };
      }
      throw falhaAoGravarUsuario(erro);
    }
  }
}
