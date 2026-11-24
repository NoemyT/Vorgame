import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { TokenService } from './token.service.js';
import { UsuarioRepositorio } from './usuario.repositorio.js';

const CUSTO_BCRYPT = 12;
// Comparação fictícia com o mesmo custo quando a conta não existe.
const HASH_CONTA_AUSENTE =
  '$2b$12$bMUhsy9zyaE6MRGc/f3Oy.gDT2TMEqYveSVQ0FGBAWSCEnyKs9hOa';

interface DadosCadastro {
  nome: string;
  email: string;
  username: string;
  senha: string;
}

interface Credenciais {
  login: string;
  senha: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly tokens: TokenService,
  ) {}

  async cadastrar({ senha, ...usuario }: DadosCadastro) {
    const senhaHash = await hash(senha, CUSTO_BCRYPT);
    return this.usuarios.criar({ ...usuario, senhaHash });
  }

  async autenticar({ login, senha }: Credenciais) {
    const usuario = await this.usuarios.buscarParaLogin(login);
    const senhaCorreta = await compare(
      senha,
      usuario?.senhaHash ?? HASH_CONTA_AUSENTE,
    );
    if (!usuario || !senhaCorreta) {
      return null;
    }

    const { id, nome, username } = usuario;
    const token = await this.tokens.emitir(id);
    return { token, usuario: { id, nome, username } };
  }

  buscarUsuarioAutenticado(id: number) {
    return this.usuarios.buscarPublicoPorId(id);
  }
}
