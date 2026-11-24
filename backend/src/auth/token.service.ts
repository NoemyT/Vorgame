import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const errosDeToken = [
  'JsonWebTokenError',
  'TokenExpiredError',
  'NotBeforeError',
];

function lerIdentificador(dados: unknown): number | null {
  if (typeof dados !== 'object' || dados === null) {
    return null;
  }
  const { sub, exp } = dados as Record<string, unknown>;
  if (
    typeof sub !== 'string' ||
    !/^[1-9]\d*$/.test(sub) ||
    typeof exp !== 'number' ||
    !Number.isInteger(exp)
  ) {
    return null;
  }

  const id = Number(sub);
  return id <= 2_147_483_647 ? id : null;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  emitir(usuarioId: number): Promise<string> {
    return this.jwt.signAsync(
      { sub: String(usuarioId) },
      { secret: this.obterSegredo() },
    );
  }

  async identificarUsuario(token: string): Promise<number | null> {
    const secret = this.obterSegredo();

    try {
      const dados = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        secret,
      });
      return lerIdentificador(dados);
    } catch (erro) {
      if (erro instanceof Error && errosDeToken.includes(erro.name)) {
        return null;
      }
      throw erro;
    }
  }

  private obterSegredo(): string {
    const segredo = this.config.get<string>('JWT_SECRET');
    if (!segredo?.trim()) {
      throw new Error('JWT_SECRET deve ser configurado');
    }
    return segredo;
  }
}
