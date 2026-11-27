import { MemoryRouter, Route, Routes } from 'react-router';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaDetalhesJogo } from './PaginaDetalhesJogo';
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
    <MemoryRouter initialEntries={['/pesquisa']}>
      <Routes>
        <Route path="/pesquisa" element={<PaginaPesquisa />} />
        <Route path="/jogos/:id" element={<PaginaDetalhesJogo />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function pesquisar(termo: string) {
  await userEvent.type(screen.getByLabelText('Nome do jogo'), termo);
  await userEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
}

afterEach(() => vi.restoreAllMocks());

it('exibe a nota da comunidade e abre os detalhes com o ID local', async () => {
  const buscar = vi
    .spyOn(api, 'buscarJogos')
    .mockResolvedValue({ resultados: [jogo] });
  const consultar = vi.spyOn(api, 'consultarJogo').mockResolvedValue({
    ...jogo,
    descricao: 'Explore uma estação abandonada.',
    genero: 'Aventura',
    plataformas: ['PC'],
  });
  renderizarPesquisa();
  await pesquisar('ecos');

  const resultados = await screen.findByRole('list', {
    name: 'Resultados da pesquisa',
  });
  expect(resultados).toHaveTextContent(
    'Nota média da comunidade do Vorgame: 9,4/10 · 12 avaliações',
  );
  expect(
    screen.getByRole('link', { name: 'Dados de jogos: IGDB' }),
  ).toHaveAttribute('href', 'https://www.igdb.com/');
  expect(
    within(resultados).getByRole('img', {
      name: 'Capa indisponível para Ecos de Órbita',
    }),
  ).toBeInTheDocument();
  const link = within(resultados).getByRole('link', { name: jogo.titulo });
  expect(link).toHaveAttribute('href', '/jogos/7');
  expect(buscar).toHaveBeenCalledWith('ecos');

  await userEvent.click(link);
  expect(
    await screen.findByRole('heading', { name: jogo.titulo }),
  ).toBeVisible();
  expect(consultar).toHaveBeenCalledWith(7);
});

it('mantém o resultado acessível quando a capa falha ao carregar', async () => {
  vi.spyOn(api, 'buscarJogos').mockResolvedValue({
    resultados: [{ ...jogo, capa: 'https://example.test/capa.jpg' }],
  });
  renderizarPesquisa();
  await pesquisar('ecos');

  const capa = await screen.findByRole('img', {
    name: 'Capa de Ecos de Órbita',
  });
  fireEvent.error(capa);

  expect(
    screen.getByRole('img', { name: 'Capa indisponível para Ecos de Órbita' }),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: jogo.titulo })).toBeVisible();
});

it('informa quando a pesquisa concluída não encontra jogos', async () => {
  vi.spyOn(api, 'buscarJogos').mockResolvedValue({ resultados: [] });
  renderizarPesquisa();
  await pesquisar('ausente');

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Nenhum jogo encontrado para “ausente”. Tente outro título.',
  );
});

it.each([
  {
    motivo: 'falha de rede',
    erro: new api.ApiIndisponivelError('rede'),
    mensagem: 'Verifique a conexão e tente novamente.',
  },
  {
    motivo: 'resposta 503',
    erro: new api.ErroHttpApi(503, 'Serviço indisponível'),
    mensagem: 'A pesquisa de jogos está temporariamente indisponível.',
  },
])('permite repetir a busca após $motivo', async ({ erro, mensagem }) => {
  const buscar = vi
    .spyOn(api, 'buscarJogos')
    .mockRejectedValueOnce(erro)
    .mockResolvedValue({ resultados: [jogo] });
  renderizarPesquisa();
  await pesquisar('ecos');

  expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
  expect(screen.queryByText(/nenhum jogo encontrado/i)).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );

  expect(await screen.findByRole('link', { name: jogo.titulo })).toBeVisible();
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
