import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    CatalogoModule,
  ],
})
export class AppModule {}
