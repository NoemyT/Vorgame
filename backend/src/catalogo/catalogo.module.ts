import { Module } from '@nestjs/common';
import { CatalogoController } from './catalogo.controller.js';
import { CatalogoRepositorio } from './catalogo.repositorio.js';
import { CatalogoService } from './catalogo.service.js';
import { IgdbAdaptador } from './igdb/igdb.adaptador.js';

@Module({
  controllers: [CatalogoController],
  providers: [CatalogoService, CatalogoRepositorio, IgdbAdaptador],
})
export class CatalogoModule {}
