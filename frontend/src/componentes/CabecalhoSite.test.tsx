import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CabecalhoSite } from './CabecalhoSite';

function renderizar(autenticado: boolean) {
  render(
    <MemoryRouter>
      <CabecalhoSite autenticado={autenticado} />
    </MemoryRouter>,
  );
}

describe('CabecalhoSite', () => {
  it('abre o menu por teclado, destaca a página aberta e devolve o foco no Escape', async () => {
    const usuario = userEvent.setup();
    renderizar(false);
    const abrir = screen.getByRole('button', { name: 'Abrir menu' });
    abrir.focus();
    await usuario.keyboard('{Enter}');

    const menu = await screen.findByRole('dialog', { name: 'Vorgame' });
    expect(
      within(menu).getByRole('link', { name: 'Explorar' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(menu).getByRole('link', { name: 'Criar conta' }),
    ).toHaveAttribute('href', '/cadastro');
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('mostra o estado de sessão ativa ao usuário autenticado', async () => {
    const usuario = userEvent.setup();
    renderizar(true);
    expect(screen.getByText('Sessão ativa')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const menu = await screen.findByRole('dialog');
    expect(within(menu).getByText('Sessão ativa')).toBeInTheDocument();
    expect(
      within(menu).queryByRole('link', { name: 'Entrar' }),
    ).not.toBeInTheDocument();
  });
});
