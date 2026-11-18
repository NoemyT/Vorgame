import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService, StatusSaude } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async consultar(): Promise<StatusSaude> {
    const status = await this.healthService.verificar();
    if (status.banco === 'erro') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
