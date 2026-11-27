import { MemoryRouter, Route, Routes } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaDetalhesJogo } from './PaginaDetalhesJogo';

const jogo = {
  id: 7,
  titulo: 'Ecos de Órbita',
  capa: '',
  descricao: 'Explore estações abandonadas e reconstrua uma expedição perdida.',
  genero: 'Aventura',
  plataformas: ['PC', 'Nintendo Switch'],
  mediaAvaliacao: 9.4,
  totalAvaliacoes: 12,
};

function renderizarDetalhes(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/jogos/${id}`]}>
      <Routes>
        <Route path="/jogos/:id" element={<PaginaDetalhesJogo />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaginaDetalhesJogo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('exibe os detalhes públicos e pede login ao visitante para avaliar', async () => {
    const consultar = vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    const nota = vi.spyOn(api, 'consultarMinhaAvaliacao');
    renderizarDetalhes();

    expect(
      await screen.findByRole('heading', { name: 'Ecos de Órbita' }),
    ).toBeInTheDocument();
    expect(screen.getByText(jogo.descricao)).toBeInTheDocument();
    expect(screen.getByText('Aventura')).toBeInTheDocument();
    expect(screen.getByText('PC, Nintendo Switch')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(
      'Média: 9,4/10 · Total: 12 avaliações',
    );
    expect(
      screen.getByRole('link', { name: 'Entrar para avaliar' }),
    ).toHaveAttribute('href', '/login');
    expect(consultar).toHaveBeenCalledWith(7);
    expect(nota).not.toHaveBeenCalled();
    expect(screen.queryByText(/review/i)).not.toBeInTheDocument();
  });

  it('mostra a nota atual para usuário autenticado', async () => {
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    vi.spyOn(api, 'consultarMinhaAvaliacao').mockResolvedValue({
      jogoId: 7,
      nota: 8,
      atualizadoEm: '2026-11-18T12:30:00.000Z',
    });
    renderizarDetalhes();

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Sua avaliação' }),
      ).toHaveTextContent('Sua avaliação atual: 8 de 10.');
    });
  });

  it('trata 404 da avaliação como usuário autenticado ainda sem nota', async () => {
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    vi.spyOn(api, 'consultarMinhaAvaliacao').mockRejectedValue(
      new api.ErroHttpApi(404, 'Avaliação não encontrada'),
    );
    renderizarDetalhes();

    expect(
      await screen.findByText('Você ainda não avaliou este jogo.'),
    ).toBeInTheDocument();
  });

  it('permite repetir a consulta após falha temporária', async () => {
    vi.spyOn(api, 'consultarJogo')
      .mockRejectedValueOnce(new api.ApiIndisponivelError('rede'))
      .mockResolvedValue(jogo);
    renderizarDetalhes();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verifique a conexão e tente novamente.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Ecos de Órbita' }),
    ).toBeInTheDocument();
  });

  it('não consulta a API para um identificador inválido', async () => {
    const consultar = vi.spyOn(api, 'consultarJogo');
    renderizarDetalhes('abc');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O identificador do jogo é inválido.',
    );
    expect(consultar).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Voltar à pesquisa' }),
    ).toHaveAttribute('href', '/pesquisa');
  });

  it('anuncia o carregamento enquanto espera os detalhes', () => {
    vi.spyOn(api, 'consultarJogo').mockReturnValue(new Promise(() => {}));
    renderizarDetalhes();

    expect(screen.getByRole('status')).toHaveTextContent(
      'A API pode levar até 1 minuto',
    );
  });
});
