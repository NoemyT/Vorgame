import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  erroHttp,
  LoginResposta,
  UsuarioAutenticadoResposta,
  UsuarioCadastradoResposta,
} from '../openapi/respostas.js';
import { AuthGuard, type RequisicaoAutenticada } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CadastroDto } from './cadastro.dto.js';
import { LoginDto } from './login.dto.js';

const mensagensConflito = {
  email: 'Email já cadastrado',
  username: 'Nome de usuário já cadastrado',
  desconhecido: 'Email ou nome de usuário já cadastrado',
};

@Controller('auth')
@ApiTags('Autenticação')
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
  @ApiOperation({ summary: 'Criar conta' })
  @ApiBody({ type: CadastroDto })
  @ApiCreatedResponse({
    type: UsuarioCadastradoResposta,
    description: 'Conta criada.',
  })
  @ApiResponse(
    erroHttp(400, 'Dados do cadastro inválidos.', ['email must be an email']),
  )
  @ApiResponse(
    erroHttp(
      409,
      'Email ou nome de usuário já cadastrado.',
      'Email já cadastrado',
    ),
  )
  async cadastrar(@Body() cadastro: CadastroDto) {
    const resultado = await this.authService.cadastrar(cadastro);
    if (resultado.tipo === 'conflito') {
      throw new ConflictException(mensagensConflito[resultado.campo]);
    }
    return resultado.usuario;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fazer login',
    description:
      'Aceita email ou nome de usuário. O email tem prioridade se o identificador corresponder a duas contas.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResposta, description: 'Sessão iniciada.' })
  @ApiResponse(
    erroHttp(400, 'Identificador ou senha inválidos.', [
      'login should not be empty',
    ]),
  )
  @ApiResponse(
    erroHttp(
      401,
      'Conta inexistente ou senha incorreta.',
      'Credenciais inválidas',
    ),
  )
  async login(@Body() credenciais: LoginDto) {
    const sessao = await this.authService.autenticar(credenciais);
    if (!sessao) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return sessao;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Consultar a conta autenticada' })
  @ApiBearerAuth()
  @ApiOkResponse({
    type: UsuarioAutenticadoResposta,
    description: 'Dados da conta.',
  })
  @ApiResponse(
    erroHttp(
      401,
      'Token ausente, inválido ou expirado.',
      'Token ausente ou inválido',
    ),
  )
  consultarUsuario(@Req() requisicao: RequisicaoAutenticada) {
    return requisicao.usuarioAutenticado;
  }
}
