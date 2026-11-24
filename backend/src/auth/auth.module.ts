import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { UsuarioRepositorio } from './usuario.repositorio.js';

@Module({
  imports: [
    JwtModule.register({
      signOptions: { algorithm: 'HS256', expiresIn: '1h' },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, UsuarioRepositorio],
})
export class AuthModule {}
