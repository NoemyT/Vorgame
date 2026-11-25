import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { estadoSaude } from '../openapi/respostas.js';
import { HealthService, StatusSaude } from './health.service.js';

@Controller('health')
@ApiTags('Saúde')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar o estado da API e do banco' })
  @ApiOkResponse({
    description: 'API e banco disponíveis.',
    schema: estadoSaude('ok'),
  })
  @ApiServiceUnavailableResponse({
    description: 'Banco indisponível.',
    schema: estadoSaude('erro'),
  })
  async consultar(): Promise<StatusSaude> {
    const status = await this.healthService.verificar();
    if (status.banco === 'erro') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
