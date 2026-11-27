import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  ApiIndisponivelError,
  cadastrarUsuario,
  ErroHttpApi,
} from '../servicos/api';
import './PaginaCadastro.css';

type EstadoCadastro =
  | { fase: 'ocioso' }
  | { fase: 'enviando' }
  | { fase: 'concluido' }
  | { fase: 'falhou'; mensagem: string };

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 409) {
    return erro.message;
  }
  if (erro instanceof ErroHttpApi && erro.statusCode === 400) {
    return 'Confira os campos obrigatórios e o formato do e-mail.';
  }
  if (erro instanceof ApiIndisponivelError) {
    return 'A API não respondeu. Tente novamente em instantes.';
  }
  return 'Não foi possível concluir o cadastro. Tente novamente.';
}

function lerCampo(formulario: FormData, nome: string): string {
  const valor = formulario.get(nome);
  return typeof valor === 'string' ? valor : '';
}

export function PaginaCadastro() {
  const [estado, setEstado] = useState<EstadoCadastro>({ fase: 'ocioso' });

  async function enviarCadastro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    setEstado({ fase: 'enviando' });
    try {
      await cadastrarUsuario({
        nome: lerCampo(formulario, 'nome'),
        email: lerCampo(formulario, 'email'),
        username: lerCampo(formulario, 'username'),
        senha: lerCampo(formulario, 'senha'),
      });
      setEstado({ fase: 'concluido' });
    } catch (erro: unknown) {
      setEstado({ fase: 'falhou', mensagem: descreverErro(erro) });
    }
  }

  return (
    <div className="cadastro-page">
      <header className="cadastro-header">
        <Link className="cadastro-brand" to="/cadastro">
          VORGAME
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/pesquisa">Pesquisar jogos</Link>
          <Link to="/login">Entrar</Link>
        </nav>
      </header>
      <main className="cadastro-main">
        <p className="cadastro-eyebrow">Junte-se à comunidade</p>
        <h1>Criar conta</h1>
        <p className="cadastro-intro">
          Cadastre-se para registrar suas avaliações de jogos.
        </p>
        {estado.fase === 'concluido' ? (
          <section className="cadastro-feedback" role="status">
            <h2>Conta criada com sucesso</h2>
            <p>Entre para acessar os recursos da sua conta.</p>
            <Link className="cadastro-button" to="/login">
              Ir para login
            </Link>
          </section>
        ) : (
          <form className="cadastro-form" onSubmit={enviarCadastro}>
            <label htmlFor="cadastro-nome">Nome</label>
            <input
              autoComplete="name"
              id="cadastro-nome"
              maxLength={191}
              name="nome"
              required
            />
            <label htmlFor="cadastro-email">E-mail</label>
            <input
              autoComplete="email"
              id="cadastro-email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
            <label htmlFor="cadastro-username">Nome de usuário</label>
            <input
              autoComplete="username"
              id="cadastro-username"
              maxLength={191}
              name="username"
              required
            />
            <label htmlFor="cadastro-senha">Senha</label>
            <input
              autoComplete="new-password"
              id="cadastro-senha"
              name="senha"
              required
              type="password"
            />
            {estado.fase === 'falhou' && (
              <p className="cadastro-error" role="alert">
                {estado.mensagem}
              </p>
            )}
            {estado.fase === 'enviando' && (
              <p className="cadastro-loading" role="status" aria-live="polite">
                Criando conta… A API pode levar até 1 minuto para responder.
              </p>
            )}
            <button
              className="cadastro-button"
              disabled={estado.fase === 'enviando'}
              type="submit"
            >
              {estado.fase === 'enviando' ? 'Enviando…' : 'Criar conta'}
            </button>
            <p className="cadastro-login-link">
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
