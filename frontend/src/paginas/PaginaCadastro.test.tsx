import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaCadastro } from './PaginaCadastro';

const usuarioCriado = {
  id: 1,
  nome: 'Ana Souza',
  email: 'ana@example.test',
  username: 'anasouza',
  criadoEm: '2026-11-18T12:00:00.000Z',
};

async function preencherFormulario() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Ana Souza');
  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.test');
  await userEvent.type(screen.getByLabelText('Nome de usuário'), 'anasouza');
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-ficticia123');
}

function renderizarCadastro() {
  return render(
    <MemoryRouter>
      <PaginaCadastro />
    </MemoryRouter>,
  );
}

describe('PaginaCadastro', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia os campos exigidos e informa que a conta foi criada', async () => {
    const cadastro = vi
      .spyOn(api, 'cadastrarUsuario')
      .mockResolvedValue(usuarioCriado);
    renderizarCadastro();
    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(
      await screen.findByText('Conta criada com sucesso'),
    ).toBeInTheDocument();
    expect(cadastro).toHaveBeenCalledWith({
      nome: 'Ana Souza',
      email: 'ana@example.test',
      username: 'anasouza',
      senha: 'senha-ficticia123',
    });
  });

  it('mostra o conflito de unicidade retornado pela API', async () => {
    vi.spyOn(api, 'cadastrarUsuario').mockRejectedValue(
      new api.ErroHttpApi(409, 'Email já cadastrado'),
    );
    renderizarCadastro();
    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email já cadastrado',
    );
  });

  it('mantém o botão desabilitado e comunica a espera durante o envio', async () => {
    vi.spyOn(api, 'cadastrarUsuario').mockReturnValue(new Promise(() => {}));
    renderizarCadastro();
    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'A API pode levar até 1 minuto',
    );
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  });

  it('marca campos obrigatórios e valida o formato do e-mail', () => {
    renderizarCadastro();

    expect(screen.getByLabelText('Nome')).toBeRequired();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('E-mail')).toBeRequired();
    expect(screen.getByLabelText('Nome de usuário')).toBeRequired();
    expect(screen.getByLabelText('Senha')).toBeRequired();
  });
});
