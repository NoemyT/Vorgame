import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaLogin } from './PaginaLogin';

const sessao = {
  token: 'jwt-ficticio',
  usuario: { id: 1, nome: 'Ana Souza', username: 'anasouza' },
};

function renderizarLogin() {
  return render(
    <MemoryRouter>
      <PaginaLogin />
    </MemoryRouter>,
  );
}

async function preencherLogin() {
  await userEvent.type(
    screen.getByLabelText('E-mail ou nome de usuário'),
    'anasouza',
  );
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-ficticia123');
}

describe('PaginaLogin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('inicia sessão e guarda o JWT apenas em sessionStorage', async () => {
    const login = vi.spyOn(api, 'iniciarSessao').mockResolvedValue(sessao);
    renderizarLogin();
    await preencherLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Sessão iniciada')).toBeInTheDocument();
    expect(
      screen.getByText('Olá, Ana Souza. Sua conta está autenticada.'),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem('vorgame_token')).toBe('jwt-ficticio');
    expect(login).toHaveBeenCalledWith({
      login: 'anasouza',
      senha: 'senha-ficticia123',
    });
  });

  it('exibe erro de credenciais inválidas sem iniciar sessão', async () => {
    vi.spyOn(api, 'iniciarSessao').mockRejectedValue(
      new api.ErroHttpApi(401, 'Credenciais inválidas'),
    );
    renderizarLogin();
    await preencherLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail/nome de usuário ou senha inválidos.',
    );
    expect(sessionStorage.getItem('vorgame_token')).toBeNull();
  });

  it('comunica a espera e bloqueia novo envio enquanto autentica', async () => {
    vi.spyOn(api, 'iniciarSessao').mockReturnValue(new Promise(() => {}));
    renderizarLogin();
    await preencherLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'A API pode levar até 1 minuto',
    );
    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
  });

  it('exige o identificador e a senha', () => {
    renderizarLogin();

    expect(screen.getByLabelText('E-mail ou nome de usuário')).toBeRequired();
    expect(screen.getByLabelText('Senha')).toBeRequired();
  });

  it('mostra e oculta a senha sem submeter o formulário', async () => {
    const login = vi.spyOn(api, 'iniciarSessao');
    const usuario = userEvent.setup();
    renderizarLogin();

    const senha = screen.getByLabelText('Senha');
    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
    await usuario.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(senha).toHaveAttribute('type', 'password');
    expect(login).not.toHaveBeenCalled();
  });
});
