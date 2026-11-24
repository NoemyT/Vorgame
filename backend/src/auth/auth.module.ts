import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsuarioRepositorio } from './usuario.repositorio.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsuarioRepositorio],
})
export class AuthModule {}
