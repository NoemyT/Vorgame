import { Injectable } from '@nestjs/common';
import {
  CatalogoRepositorio,
  type JogoDetalhado,
  type JogoResumo,
} from './catalogo.repositorio.js';
import { IgdbAdaptador } from './igdb/igdb.adaptador.js';
import { ErroIgdb } from './igdb/igdb.http.js';
import type { JogoIgdb } from './igdb/igdb.resposta.js';

type ResultadoBusca =
  { tipo: 'concluida'; resultados: JogoResumo[] } | { tipo: 'indisponivel' };

function selecionarJogos(jogos: JogoIgdb[], termo: string): JogoIgdb[] {
  const tituloParcial = termo.toLowerCase();
  const selecionados = new Map<number, JogoIgdb>();
  for (const jogo of jogos) {
    if (
      jogo.titulo.toLowerCase().includes(tituloParcial) &&
      !selecionados.has(jogo.idExterno)
    ) {
      selecionados.set(jogo.idExterno, jogo);
    }
  }
  return [...selecionados.values()];
}

@Injectable()
export class CatalogoService {
  constructor(
    private readonly catalogoRepositorio: CatalogoRepositorio,
    private readonly igdb: IgdbAdaptador,
  ) {}

  async buscarPorTitulo(termo: string): Promise<ResultadoBusca> {
    let jogos: JogoIgdb[];
    try {
      jogos = await this.igdb.buscarPorTitulo(termo);
    } catch (erro) {
      if (erro instanceof ErroIgdb) return { tipo: 'indisponivel' };
      throw erro;
    }

    const resultados = await Promise.all(
      selecionarJogos(jogos, termo).map(({ generos, ...jogo }) =>
        this.catalogoRepositorio.salvarExterno({
          ...jogo,
          provedor: 'igdb',
          genero: generos.join(', ') || null,
        }),
      ),
    );
    return { tipo: 'concluida', resultados };
  }

  buscarPorId(id: number): Promise<JogoDetalhado | null> {
    return this.catalogoRepositorio.buscarPorId(id);
  }
}
