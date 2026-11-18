import { HealthService } from './health.service.js';
import { PrismaService } from '../database/prisma.service.js';

function criarPrismaFalso(consulta: () => Promise<unknown>): PrismaService {
  return { $queryRaw: vi.fn(consulta) } as unknown as PrismaService;
}

describe('HealthService', () => {
  it('informa banco ok quando o SELECT 1 responde', async () => {
    const service = new HealthService(
      criarPrismaFalso(() => Promise.resolve([{ 1: 1 }])),
    );

    await expect(service.verificar()).resolves.toEqual({
      api: 'ok',
      banco: 'ok',
    });
  });

  it('informa banco com erro quando a consulta falha', async () => {
    const service = new HealthService(
      criarPrismaFalso(() => Promise.reject(new Error('conexão recusada'))),
    );

    await expect(service.verificar()).resolves.toEqual({
      api: 'ok',
      banco: 'erro',
    });
  });
});
