import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { cyberpunk } from '../catalogo/curadoria';
import { CampoSenha, PainelConta } from '../componentes/PainelConta';
import { Alert, AlertDescription } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Input } from '../componentes/ui/input';
import {
  ApiIndisponivelError,
  ErroHttpApi,
  iniciarSessao,
} from '../servicos/api';
import { salvarToken } from '../servicos/sessao';

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
      <section className="conta-feedback" role="status">
        <h2>Sessão iniciada</h2>
        <p>Olá, {estado.nome}. Sua conta está autenticada.</p>
        <Button asChild>
          <Link to="/pesquisa">Pesquisar jogos</Link>
        </Button>
      </section>
    );
  }

  const enviando = estado.fase === 'enviando';
  return (
    <form className="conta-form" onSubmit={enviar}>
      <div className="conta-campo">
        <label htmlFor="login-identificador">E-mail ou nome de usuário</label>
        <Input
          autoComplete="username"
          id="login-identificador"
          name="login"
          required
        />
      </div>
      <CampoSenha autoComplete="current-password" id="login-senha" />
      {estado.fase === 'falhou' && (
        <Alert variant="destructive">
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      {enviando && (
        <p role="status">
          Entrando… A API pode levar até 1 minuto para responder.
        </p>
      )}
      <Button disabled={enviando} type="submit">
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="conta-alternativa">
        Ainda não tem conta?{' '}
        <Link className="link-texto" to="/cadastro">
          Criar conta
        </Link>
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
    <PainelConta
      arte={cyberpunk}
      descricao="Acesse sua conta para consultar suas notas nas fichas dos jogos."
      titulo="Entrar"
    >
      <FormularioLogin estado={estado} enviar={enviarLogin} />
    </PainelConta>
  );
}
