import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar-app.js';

const PORTA_PADRAO = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);

  const porta = app.get(ConfigService).get<number>('PORT') ?? PORTA_PADRAO;
  await app.listen(porta, '0.0.0.0');
}

await bootstrap();
