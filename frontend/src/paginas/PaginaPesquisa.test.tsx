import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaPesquisa } from './PaginaPesquisa';

const jogo = {
  id: 7,
  titulo: 'Ecos de Órbita',
  capa: '',
  mediaAvaliacao: 9.4,
  totalAvaliacoes: 12,
};

function renderizarPesquisa() {
  return render(
    <MemoryRouter>
      <PaginaPesquisa />
    </MemoryRouter>,
  );
}

async function pesquisar(termo: string) {
  await userEvent.type(screen.getByLabelText('Nome do jogo'), termo);
  await userEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
}

describe('PaginaPesquisa', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mostra resultados, média e link para detalhes', async () => {
    const buscar = vi
      .spyOn(api, 'buscarJogos')
      .mockResolvedValue({ resultados: [jogo] });
    renderizarPesquisa();
    await pesquisar('ecos');

    expect(
      await screen.findByRole('link', { name: 'Ecos de Órbita' }),
    ).toHaveAttribute('href', '/jogos/7');
    expect(screen.getByText('Média: 9,4/10 · 12 avaliações')).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledWith('ecos');
  });

  it('informa quando a pesquisa não encontra jogos', async () => {
    vi.spyOn(api, 'buscarJogos').mockResolvedValue({ resultados: [] });
    renderizarPesquisa();
    await pesquisar('ausente');

    expect(
      await screen.findByText(
        'Nenhum jogo encontrado para “ausente”. Tente outro título.',
      ),
    ).toBeInTheDocument();
  });

  it('permite repetir a busca após falha temporária', async () => {
    const buscar = vi
      .spyOn(api, 'buscarJogos')
      .mockRejectedValueOnce(new api.ApiIndisponivelError('rede'))
      .mockResolvedValue({ resultados: [jogo] });
    renderizarPesquisa();
    await pesquisar('ecos');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verifique a conexão e tente novamente.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(
      await screen.findByRole('link', { name: 'Ecos de Órbita' }),
    ).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(buscar).toHaveBeenLastCalledWith('ecos');
  });

  it('anuncia carregamento enquanto espera a API', async () => {
    vi.spyOn(api, 'buscarJogos').mockReturnValue(new Promise(() => {}));
    renderizarPesquisa();
    await pesquisar('ecos');

    expect(screen.getByRole('status')).toHaveTextContent(
      'A API pode levar até 1 minuto',
    );
    expect(screen.getByRole('button', { name: 'Pesquisando…' })).toBeDisabled();
  });
});
