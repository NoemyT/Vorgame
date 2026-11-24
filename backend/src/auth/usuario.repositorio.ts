import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

interface NovoUsuario {
  nome: string;
  email: string;
  username: string;
  senhaHash: string;
}

const selecaoPublica = {
  id: true,
  nome: true,
  email: true,
  username: true,
} as const;

export type UsuarioAutenticado = Prisma.UsuarioGetPayload<{
  select: typeof selecaoPublica;
}>;

const selecaoCadastro = {
  ...selecaoPublica,
  criadoEm: true,
} as const;

const selecaoLogin = {
  id: true,
  nome: true,
  username: true,
  senhaHash: true,
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

function falhaNaPersistencia(mensagem: string, erro: unknown): Error {
  // A mensagem original do Prisma pode carregar os dados enviados ao banco.
  const codigo =
    erro instanceof Prisma.PrismaClientKnownRequestError
      ? erro.code
      : undefined;
  return new Error(mensagem, { cause: codigo });
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
      throw falhaNaPersistencia('Falha ao gravar usuário', erro);
    }
  }

  async buscarParaLogin(login: string) {
    try {
      const usuarioPorEmail = await this.prisma.usuario.findUnique({
        where: { email: login },
        select: selecaoLogin,
      });
      if (usuarioPorEmail) {
        return usuarioPorEmail;
      }

      return await this.prisma.usuario.findUnique({
        where: { username: login },
        select: selecaoLogin,
      });
    } catch (erro) {
      throw falhaNaPersistencia('Falha ao consultar usuário para login', erro);
    }
  }

  async buscarPublicoPorId(id: number): Promise<UsuarioAutenticado | null> {
    try {
      return await this.prisma.usuario.findUnique({
        where: { id },
        select: selecaoPublica,
      });
    } catch (erro) {
      throw falhaNaPersistencia('Falha ao consultar usuário autenticado', erro);
    }
  }
}
