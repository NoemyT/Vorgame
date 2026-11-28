import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { witcher } from '../catalogo/curadoria';
import { CampoSenha, PainelConta } from '../componentes/PainelConta';
import { Alert, AlertDescription } from '../componentes/ui/alert';
import { Button } from '../componentes/ui/button';
import { Input } from '../componentes/ui/input';
import {
  ApiIndisponivelError,
  cadastrarUsuario,
  ErroHttpApi,
} from '../servicos/api';

type EstadoCadastro =
  | { fase: 'ocioso' }
  | { fase: 'enviando' }
  | { fase: 'concluido' }
  | { fase: 'falhou'; mensagem: string };

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroHttpApi && erro.statusCode === 409)
    return erro.message;
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

function CamposCadastro() {
  return (
    <>
      <div className="conta-campo">
        <label htmlFor="cadastro-nome">Nome</label>
        <Input
          autoComplete="name"
          id="cadastro-nome"
          maxLength={191}
          name="nome"
          required
        />
      </div>
      <div className="conta-campo">
        <label htmlFor="cadastro-email">E-mail</label>
        <Input
          autoComplete="email"
          id="cadastro-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </div>
      <div className="conta-campo">
        <label htmlFor="cadastro-username">Nome de usuário</label>
        <Input
          autoComplete="username"
          id="cadastro-username"
          maxLength={191}
          name="username"
          required
        />
      </div>
      <CampoSenha autoComplete="new-password" id="cadastro-senha" />
    </>
  );
}

function FormularioCadastro({
  estado,
  enviar,
}: {
  estado: EstadoCadastro;
  enviar: (evento: FormEvent<HTMLFormElement>) => void;
}) {
  if (estado.fase === 'concluido') {
    return (
      <section className="conta-feedback" role="status">
        <h2>Conta criada com sucesso</h2>
        <p>Entre para acessar os recursos da sua conta.</p>
        <Button asChild>
          <Link to="/login">Ir para login</Link>
        </Button>
      </section>
    );
  }
  const enviando = estado.fase === 'enviando';
  return (
    <form className="conta-form" onSubmit={enviar}>
      <CamposCadastro />
      {estado.fase === 'falhou' && (
        <Alert variant="destructive">
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      {enviando && (
        <p role="status">
          Criando conta… A API pode levar até 1 minuto para responder.
        </p>
      )}
      <Button disabled={enviando} type="submit">
        {enviando ? 'Enviando…' : 'Criar conta'}
      </Button>
      <p className="conta-alternativa">
        Já tem uma conta?{' '}
        <Link className="link-texto" to="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
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
    <PainelConta
      arte={witcher}
      descricao="Cadastre-se para acessar sua conta e consultar suas notas."
      titulo="Criar conta"
    >
      <FormularioCadastro enviar={enviarCadastro} estado={estado} />
    </PainelConta>
  );
}
