import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  ApiIndisponivelError,
  ErroHttpApi,
  iniciarSessao,
} from '../servicos/api';
import { salvarToken } from '../servicos/sessao';
import './PaginaLogin.css';

type EstadoLogin =
  | { fase: 'ocioso' }
  | { fase: 'enviando' }
  | { fase: 'concluido'; nome: string }
  | { fase: 'falhou'; mensagem: string };

function lerCampo(formulario: FormData, nome: string): string {
  const valor = formulario.get(nome);
  return typeof valor === 'string' ? valor : '';
}

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 401) {
    return 'E-mail/nome de usuário ou senha inválidos.';
  }
  if (erro instanceof ErroHttpApi && erro.statusCode === 400) {
    return 'Informe seu e-mail ou nome de usuário e a senha.';
  }
  if (erro instanceof ApiIndisponivelError) {
    return 'A API não respondeu. Tente novamente em instantes.';
  }
  return 'Não foi possível iniciar a sessão. Tente novamente.';
}

interface FormularioLoginProps {
  estado: EstadoLogin;
  enviar: (evento: FormEvent<HTMLFormElement>) => void;
}

function FormularioLogin({ estado, enviar }: FormularioLoginProps) {
  if (estado.fase === 'concluido') {
    return (
      <section className="login-feedback" role="status">
        <h2>Sessão iniciada</h2>
        <p>Olá, {estado.nome}. Sua conta está autenticada.</p>
        <p>Você poderá avaliar jogos enquanto esta sessão estiver ativa.</p>
      </section>
    );
  }

  const enviando = estado.fase === 'enviando';
  return (
    <form className="login-form" onSubmit={enviar}>
      <label htmlFor="login-identificador">E-mail ou nome de usuário</label>
      <input
        autoComplete="username"
        id="login-identificador"
        name="login"
        required
      />
      <label htmlFor="login-senha">Senha</label>
      <input
        autoComplete="current-password"
        id="login-senha"
        name="senha"
        required
        type="password"
      />
      {estado.fase === 'falhou' && (
        <p className="login-error" role="alert">
          {estado.mensagem}
        </p>
      )}
      {enviando && (
        <p className="login-loading" role="status" aria-live="polite">
          Entrando… A API pode levar até 1 minuto para responder.
        </p>
      )}
      <button className="login-button" disabled={enviando} type="submit">
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="login-register-link">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </form>
  );
}

export function PaginaLogin() {
  const [estado, setEstado] = useState<EstadoLogin>({ fase: 'ocioso' });

  async function enviarLogin(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    setEstado({ fase: 'enviando' });
    try {
      const sessao = await iniciarSessao({
        login: lerCampo(formulario, 'login'),
        senha: lerCampo(formulario, 'senha'),
      });
      salvarToken(sessao.token);
      setEstado({ fase: 'concluido', nome: sessao.usuario.nome });
    } catch (erro: unknown) {
      setEstado({ fase: 'falhou', mensagem: descreverErro(erro) });
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <Link className="login-brand" to="/">
          VORGAME
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/pesquisa">Pesquisar jogos</Link>
          <Link to="/cadastro">Criar conta</Link>
        </nav>
      </header>
      <main className="login-main">
        <p className="login-eyebrow">Bem-vindo de volta</p>
        <h1>Entrar</h1>
        <p className="login-intro">
          Acesse sua conta para continuar no Vorgame.
        </p>
        <FormularioLogin estado={estado} enviar={enviarLogin} />
      </main>
    </div>
  );
}
