import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaDetalhesJogo } from './PaginaDetalhesJogo';
import { PaginaInicial } from './PaginaInicial';
import { PaginaPesquisa } from './PaginaPesquisa';

const cyberpunk = {
  id: 73,
  titulo: 'Cyberpunk 2077',
  capa: '',
  mediaAvaliacao: null,
  totalAvaliacoes: 0,
};
const terraria = { ...cyberpunk, id: 81, titulo: 'Terraria' };

function renderizar() {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="/jogos/:id" element={<PaginaDetalhesJogo />} />
        <Route path="/pesquisa" element={<PaginaPesquisa />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PaginaInicial', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mostra a arte local enquanto o catálogo ainda está carregando', () => {
    vi.spyOn(api, 'buscarJogos').mockReturnValue(new Promise(() => {}));
    renderizar();

    const selecao = screen.getByRole('region', { name: 'Seleção em destaque' });
    expect(
      within(selecao).getByRole('img', { name: /letreiros em Night City/ }),
    ).toHaveAttribute('src', '/midia/cyberpunk-night-city.webp');
    expect(within(selecao).getByRole('status')).toHaveTextContent(
      'Consultando jogos da seleção',
    );
  });

  it('resolve o destaque por título exato e abre a ficha pelo ID numérico recebido', async () => {
    vi.spyOn(api, 'buscarJogos').mockImplementation(async (termo) => ({
      resultados:
        termo === 'Cyberpunk 2077'
          ? [{ ...cyberpunk, id: 74, titulo: 'Cyberpunk 2077: Phantom Liberty' }, cyberpunk]
          : [],
    }));
    const consultar = vi.spyOn(api, 'consultarJogo').mockResolvedValue({
      ...cyberpunk,
      descricao: 'Descrição fictícia de teste.',
      genero: 'Aventura',
      plataformas: ['PC'],
    });
    renderizar();

    expect(
      screen.getByRole('link', { name: 'Explorar seleção' }),
    ).toHaveAttribute('href', '#selecao');
    const destaque = await screen.findByRole('link', {
      name: 'Ver ficha de Cyberpunk 2077',
    });
    expect(destaque).toHaveAttribute('href', '/jogos/73');
    await userEvent.click(destaque);
    expect(
      await screen.findByText('Descrição fictícia de teste.'),
    ).toBeInTheDocument();
    expect(consultar).toHaveBeenCalledWith(73);
  });

  it('pesquisa a partir da abertura e mantém o termo para voltar da ficha', async () => {
    vi.spyOn(api, 'buscarJogos').mockImplementation(async (termo) => ({
      resultados: termo === 'Terraria' ? [terraria] : [],
    }));
    vi.spyOn(api, 'consultarJogo').mockResolvedValue({
      ...terraria,
      descricao: 'Ficha fictícia.',
      genero: 'Aventura',
      plataformas: [],
    });
    renderizar();

    await userEvent.type(screen.getByRole('searchbox'), 'Terraria');
    await userEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
    const resultados = await screen.findByRole('list', {
      name: 'Resultados da pesquisa',
    });
    await userEvent.click(
      within(resultados).getByRole('link', { name: 'Terraria' }),
    );
    expect(await screen.findByText('Ficha fictícia.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Voltar à pesquisa' }),
    ).toHaveAttribute('href', '/pesquisa?q=Terraria');
  });

  it('leva à busca quando o título tem correspondência ambígua', async () => {
    vi.spyOn(api, 'buscarJogos').mockImplementation(async (termo) => ({
      resultados: termo === 'Cyberpunk 2077' ? [cyberpunk, { ...cyberpunk, id: 74 }] : [],
    }));
    renderizar();
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: 'Buscar Cyberpunk 2077' }),
    ).toHaveAttribute('href', '/pesquisa?q=Cyberpunk+2077');
  });

  it('permite repetir consultas com falha sem buscar novamente os demais títulos', async () => {
    let consultas = 0;
    const buscar = vi
      .spyOn(api, 'buscarJogos')
      .mockImplementation(async (termo) => {
        if (termo !== 'Cyberpunk 2077') return { resultados: [] };
        consultas += 1;
        if (consultas === 1) throw new api.ApiIndisponivelError('rede');
        return { resultados: [cyberpunk] };
      });
    renderizar();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Tentar novamente' }),
    );
    expect(
      await screen.findByRole('link', { name: 'Ver ficha de Cyberpunk 2077' }),
    ).toBeInTheDocument();
    expect(
      buscar.mock.calls.filter(([termo]) => termo !== 'Cyberpunk 2077'),
    ).toHaveLength(3);
  });
});
