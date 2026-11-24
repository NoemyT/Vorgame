import { Injectable } from '@nestjs/common';
import {
  CatalogoRepositorio,
  type JogoResumo,
} from './catalogo.repositorio.js';

@Injectable()
export class CatalogoService {
  constructor(private readonly catalogoRepositorio: CatalogoRepositorio) {}

  buscarPorTitulo(termo: string): Promise<JogoResumo[]> {
    return this.catalogoRepositorio.buscarPorTitulo(termo);
  }
}
