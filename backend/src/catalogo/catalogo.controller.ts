import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  PipeTransform,
  Query,
} from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';

@Injectable()
class TermoBuscaPipe implements PipeTransform<unknown, string> {
  transform(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      throw new BadRequestException('q deve conter um termo de busca');
    }
    return valor.trim();
  }
}

@Controller('games')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  async buscar(@Query('q', TermoBuscaPipe) termo: string) {
    const resultados = await this.catalogoService.buscarPorTitulo(termo);
    return { resultados };
  }
}
