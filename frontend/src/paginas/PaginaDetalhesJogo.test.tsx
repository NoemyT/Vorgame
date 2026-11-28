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

  it('consulta novamente a nota quando outra sessão já avaliou o jogo', async () => {
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    const consultar = vi
      .spyOn(api, 'consultarMinhaAvaliacao')
      .mockRejectedValueOnce(new api.ErroHttpApi(404, 'Sem nota'))
      .mockResolvedValueOnce({
        jogoId: 7,
        nota: 7,
        atualizadoEm: '2026-11-18T12:30:00.000Z',
      });
    vi.spyOn(api, 'gravarAvaliacao').mockRejectedValue(
      new api.ErroHttpApi(409, 'Já avaliado'),
    );
    renderizarDetalhes();

    await userEvent.selectOptions(await screen.findByRole('combobox'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Avaliar jogo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sua avaliação mudou',
    );
    expect(await screen.findByRole('combobox')).toHaveValue('7');
    expect(
      screen.getByRole('button', { name: 'Salvar nova nota' }),
    ).toBeEnabled();
    expect(consultar).toHaveBeenCalledTimes(2);
  });

  it('exibe a média da comunidade e oferece login para consultar a nota própria', async () => {
    const consultar = vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    const nota = vi.spyOn(api, 'consultarMinhaAvaliacao');
    renderizarDetalhes();

    expect(
      await screen.findByRole('heading', { name: 'Ecos de Órbita' }),
    ).toBeInTheDocument();
    expect(screen.getByText(jogo.descricao)).toBeInTheDocument();
    expect(screen.getByText('Aventura')).toBeInTheDocument();
    expect(screen.getByText('PC, Nintendo Switch')).toBeInTheDocument();
    const media = screen.getByRole('region', { name: 'Média da comunidade' });
    expect(media).toHaveTextContent('9,4/10');
    expect(media).toHaveTextContent('12 avaliações');
    expect(
      screen.getByRole('link', { name: 'Entrar para avaliar' }),
    ).toHaveAttribute('href', '/login');
    expect(consultar).toHaveBeenCalledWith(7);
    expect(nota).not.toHaveBeenCalled();
    expect(screen.queryByText(/review/i)).not.toBeInTheDocument();
  });

  it('cria uma nota zero e permite editá-la com a média atualizada na ficha', async () => {
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    vi.spyOn(api, 'consultarJogo').mockResolvedValue({
      ...jogo,
      mediaAvaliacao: null,
      totalAvaliacoes: 0,
    });
    vi.spyOn(api, 'consultarMinhaAvaliacao').mockRejectedValue(
      new api.ErroHttpApi(404, 'Sem nota'),
    );
    const gravar = vi
      .spyOn(api, 'gravarAvaliacao')
      .mockResolvedValueOnce({
        jogoId: 7,
        nota: 0,
        mediaAvaliacao: 0,
        totalAvaliacoes: 1,
      })
      .mockResolvedValueOnce({
        jogoId: 7,
        nota: 10,
        mediaAvaliacao: 10,
        totalAvaliacoes: 1,
      });
    renderizarDetalhes();

    const campo = await screen.findByRole('combobox', {
      name: 'Sua nota (0 a 10)',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Avaliar jogo' }));
    expect(gravar).not.toHaveBeenCalled();
    await userEvent.selectOptions(campo, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Avaliar jogo' }));

    expect(await screen.findByText('Avaliação salva.')).toBeInTheDocument();
    expect(gravar).toHaveBeenNthCalledWith(1, 7, 0, 'criar');
    const media = screen.getByRole('region', { name: 'Média da comunidade' });
    expect(media).toHaveTextContent('0,0/10');
    await userEvent.selectOptions(campo, '10');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova nota' }),
    );
    expect(gravar).toHaveBeenNthCalledWith(2, 7, 10, 'alterar');
    expect(media).toHaveTextContent('10,0/10');
    expect(media).toHaveTextContent('1 avaliação');
    expect(campo).toHaveValue('10');
  });

  it('mantém a nota escolhida quando a gravação falha e permite repetir', async () => {
    sessionStorage.setItem('vorgame_token', 'jwt-ficticio');
    vi.spyOn(api, 'consultarJogo').mockResolvedValue(jogo);
    vi.spyOn(api, 'consultarMinhaAvaliacao').mockResolvedValue({
      jogoId: 7,
      nota: 8,
      atualizadoEm: '2026-11-18T12:30:00.000Z',
    });
    const gravar = vi
      .spyOn(api, 'gravarAvaliacao')
      .mockRejectedValueOnce(new api.ApiIndisponivelError('rede'))
      .mockResolvedValueOnce({
        jogoId: 7,
        nota: 9,
        mediaAvaliacao: 9.5,
        totalAvaliacoes: 12,
      });
    renderizarDetalhes();

    const campo = await screen.findByRole('combobox');
    expect(campo).toHaveValue('8');
    await userEvent.selectOptions(campo, '9');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova nota' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar',
    );
    expect(campo).toHaveValue('9');
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nova nota' }),
    );
    expect(await screen.findByText('Avaliação salva.')).toBeInTheDocument();
    expect(gravar).toHaveBeenCalledTimes(2);
  });

  it('explica a ausência de descrição, plataformas, gênero e média', async () => {
    vi.spyOn(api, 'consultarJogo').mockResolvedValue({
      ...jogo,
      descricao: '',
      genero: '',
      plataformas: [],
      mediaAvaliacao: null,
      totalAvaliacoes: 0,
    });
    renderizarDetalhes();

    expect(
      await screen.findByText('Descrição indisponível.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Não informado')).toBeInTheDocument();
    expect(screen.getByText('Não informadas')).toBeInTheDocument();
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
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
