import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export type StatusServico = 'ok' | 'erro';

export interface StatusSaude {
  api: StatusServico;
  banco: StatusServico;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verificar(): Promise<StatusSaude> {
    return { api: 'ok', banco: await this.verificarBanco() };
  }

  private async verificarBanco(): Promise<StatusServico> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      this.logger.error(`Falha ao consultar o banco: ${mensagem}`);
      return 'erro';
    }
  }
}
