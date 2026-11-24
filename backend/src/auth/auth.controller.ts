import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CadastroDto } from './cadastro.dto.js';
import { LoginDto } from './login.dto.js';

const mensagensConflito = {
  email: 'Email já cadastrado',
  username: 'Nome de usuário já cadastrado',
  desconhecido: 'Email ou nome de usuário já cadastrado',
};

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    validationError: { target: false, value: false },
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async cadastrar(@Body() cadastro: CadastroDto) {
    const resultado = await this.authService.cadastrar(cadastro);
    if (resultado.tipo === 'conflito') {
      throw new ConflictException(mensagensConflito[resultado.campo]);
    }
    return resultado.usuario;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credenciais: LoginDto) {
    const sessao = await this.authService.autenticar(credenciais);
    if (!sessao) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return sessao;
  }
}
