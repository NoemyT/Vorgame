import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { UsuarioAutenticado } from './usuario.repositorio.js';

export type RequisicaoAutenticada = Request & {
  usuarioAutenticado: UsuarioAutenticado;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    const token = /^Bearer +(\S+)$/i.exec(
      requisicao.headers.authorization ?? '',
    )?.[1];
    if (!token) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }

    const usuario = await this.auth.autenticarToken(token);
    if (!usuario) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }

    requisicao.usuarioAutenticado = usuario;
    return true;
  }
}
