import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function lerOrigensPermitidas(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((origem) => origem.trim())
    .filter((origem) => origem.length > 0);
}

export function configurarApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.enableCors({
    origin: lerOrigensPermitidas(config.get<string>('CORS_ORIGIN')),
  });
  app.enableShutdownHooks();
}
