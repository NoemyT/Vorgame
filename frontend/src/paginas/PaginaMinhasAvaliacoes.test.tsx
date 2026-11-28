import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { salvarToken } from '../servicos/sessao';
import { PaginaMinhasAvaliacoes } from './PaginaMinhasAvaliacoes';

function renderizar(autenticado: boolean) {
  if (autenticado) salvarToken('token-ficticio');
  render(
    <MemoryRouter>
      <PaginaMinhasAvaliacoes />
    </MemoryRouter>,
  );
}

describe('PaginaMinhasAvaliacoes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('mostra carregamento e lista a capa, a nota zero e o link com ID local', async () => {
    const capa = 'https://example.test/ecos.webp';
    vi.spyOn(api, 'listarMinhasAvaliacoes').mockResolvedValue({
      avaliacoes: [{ jogoId: 7, titulo: 'Ecos de Órbita', capa, nota: 0 }],
    });
    renderizar(true);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    const link = await screen.findByRole('link', { name: /Ecos de Órbita/ });
    expect(link).toHaveAttribute('href', '/jogos/7');
    expect(link).toHaveTextContent('0/10');
    expect(link.querySelector('img')).toHaveAttribute('src', capa);
  });

  it('mostra um caminho para o catálogo quando ainda não há notas', async () => {
    vi.spyOn(api, 'listarMinhasAvaliacoes').mockResolvedValue({
      avaliacoes: [],
    });
    renderizar(true);

    expect(
      await screen.findByText('Você ainda não avaliou nenhum jogo.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Pesquisar jogos' }),
    ).toHaveAttribute('href', '/pesquisa');
  });

  it('permite repetir a consulta depois de uma falha', async () => {
    const listar = vi
      .spyOn(api, 'listarMinhasAvaliacoes')
      .mockRejectedValueOnce(new api.ApiIndisponivelError('rede'))
      .mockResolvedValueOnce({ avaliacoes: [] });
    renderizar(true);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(
      await screen.findByText('Você ainda não avaliou nenhum jogo.'),
    ).toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('pede login para um visitante sem consultar a API', () => {
    const listar = vi.spyOn(api, 'listarMinhasAvaliacoes');
    renderizar(false);

    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(listar).not.toHaveBeenCalled();
  });

  it('pede login quando a sessão expira', async () => {
    vi.spyOn(api, 'listarMinhasAvaliacoes').mockRejectedValue(
      new api.ErroHttpApi(401, 'Sessão expirada'),
    );
    renderizar(true);

    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
