import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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

  private obterSegredo(): string {
    const segredo = this.config.get<string>('JWT_SECRET');
    if (!segredo?.trim()) {
      throw new Error('JWT_SECRET deve ser configurado');
    }
    return segredo;
  }
}
