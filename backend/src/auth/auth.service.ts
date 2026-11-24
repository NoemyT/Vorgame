import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UsuarioRepositorio } from './usuario.repositorio.js';

const CUSTO_BCRYPT = 12;

interface DadosCadastro {
  nome: string;
  email: string;
  username: string;
  senha: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly usuarios: UsuarioRepositorio) {}

  async cadastrar({ senha, ...usuario }: DadosCadastro) {
    const senhaHash = await hash(senha, CUSTO_BCRYPT);
    return this.usuarios.criar({ ...usuario, senhaHash });
  }
}
