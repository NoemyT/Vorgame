import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  ParseIntPipe,
  PipeTransform,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BuscaJogosResposta,
  erroHttp,
  JogoDetalhadoResposta,
} from '../openapi/respostas.js';
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
@ApiTags('Catálogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  @ApiOperation({ summary: 'Pesquisar jogos por título' })
  @ApiQuery({
    name: 'q',
    required: true,
    schema: { type: 'string', minLength: 1 },
    description:
      'Trecho do título, sem distinção entre maiúsculas e minúsculas.',
    example: 'ecos',
  })
  @ApiOkResponse({
    type: BuscaJogosResposta,
    description:
      'Jogos encontrados. A lista fica vazia quando nenhum título corresponde ao termo.',
    examples: {
      comJogos: {
        summary: 'Busca com resultados',
        value: {
          resultados: [
            {
              id: 7,
              titulo: 'Ecos de Órbita',
              capa: 'https://example.test/capas/ecos-de-orbita.webp',
              mediaAvaliacao: null,
              totalAvaliacoes: 0,
            },
          ],
        },
      },
      semJogos: { summary: 'Busca sem resultados', value: { resultados: [] } },
    },
  })
  @ApiResponse(
    erroHttp(
      400,
      'Parâmetro q ausente ou vazio.',
      'q deve conter um termo de busca',
    ),
  )
  async buscar(@Query('q', TermoBuscaPipe) termo: string) {
    const resultados = await this.catalogoService.buscarPorTitulo(termo);
    return { resultados };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar os detalhes de um jogo' })
  @ApiParam({
    name: 'id',
    schema: { type: 'integer' },
    example: 7,
    description: 'Identificador do jogo.',
  })
  @ApiOkResponse({
    type: JogoDetalhadoResposta,
    description:
      'Detalhes do jogo. Sem avaliações, a média é nula e o total é zero.',
  })
  @ApiResponse(
    erroHttp(
      400,
      'ID deve ser um inteiro.',
      'Validation failed (numeric string is expected)',
    ),
  )
  @ApiResponse(erroHttp(404, 'Jogo não encontrado.', 'Jogo não encontrado'))
  async consultar(@Param('id', ParseIntPipe) id: number) {
    const jogo = await this.catalogoService.buscarPorId(id);
    if (!jogo) {
      throw new NotFoundException('Jogo não encontrado');
    }
    return jogo;
  }
}
