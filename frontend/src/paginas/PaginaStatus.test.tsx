import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../servicos/api';
import { PaginaStatus } from './PaginaStatus';

describe('PaginaStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra "API OK · Banco OK" quando tudo responde', async () => {
    vi.spyOn(api, 'consultarSaude').mockResolvedValue({ api: 'ok', banco: 'ok' });

    render(<PaginaStatus />);

    expect(await screen.findByText('API OK · Banco OK')).toBeInTheDocument();
  });

  it('avisa quando o banco está com erro', async () => {
    vi.spyOn(api, 'consultarSaude').mockResolvedValue({ api: 'ok', banco: 'erro' });

    render(<PaginaStatus />);

    expect(await screen.findByText('API OK · Banco com erro')).toBeInTheDocument();
  });

  it('avisa quando a API está indisponível e permite tentar de novo', async () => {
    const consulta = vi
      .spyOn(api, 'consultarSaude')
      .mockRejectedValueOnce(new api.ApiIndisponivelError('Failed to fetch'))
      .mockResolvedValueOnce({ api: 'ok', banco: 'ok' });

    render(<PaginaStatus />);
    expect(await screen.findByText('API indisponível')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Verificar novamente' }));

    expect(await screen.findByText('API OK · Banco OK')).toBeInTheDocument();
    expect(consulta).toHaveBeenCalledTimes(2);
  });

  it('mostra aviso de espera enquanto consulta a API', () => {
    vi.spyOn(api, 'consultarSaude').mockReturnValue(new Promise(() => {}));

    render(<PaginaStatus />);

    expect(screen.getByText(/primeiro acesso pode levar cerca de um minuto/)).toBeInTheDocument();
  });
});
