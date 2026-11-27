import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErroIgdb, requisitarJsonIgdb } from './igdb.http.js';
import { type JogoIgdb, lerJogosIgdb, lerTokenIgdb } from './igdb.resposta.js';

const URL_TOKEN = 'https://id.twitch.tv/oauth2/token';
const URL_JOGOS = 'https://api.igdb.com/v4/games';
const CAMPOS_JOGO = 'id,name,summary,cover.image_id,genres.name,platforms.name';
const INTERVALO_BUSCAS_MS = 250;
const LIMITE_BUSCAS_ATIVAS = 8;

interface TokenIgdb {
  clientId: string;
  valor: string;
  renovarEm: number;
}

@Injectable()
export class IgdbAdaptador {
  private token?: TokenIgdb;
  private renovacao?: Promise<TokenIgdb>;
  private turnoBusca = Promise.resolve();
  private proximaBuscaEm = 0;
  private buscasAtivas = 0;

  constructor(private readonly config: ConfigService) {}

  async buscarPorTitulo(termo: string): Promise<JogoIgdb[]> {
    if (this.buscasAtivas >= LIMITE_BUSCAS_ATIVAS) throw new ErroIgdb('limite');
    this.buscasAtivas += 1;
    try {
      const token = await this.obterToken();
      return await this.agendarBusca(termo, token);
    } finally {
      this.buscasAtivas -= 1;
    }
  }

  private async consultarJogos(
    termo: string,
    token: TokenIgdb,
  ): Promise<JogoIgdb[]> {
    try {
      const resposta = await requisitarJsonIgdb(URL_JOGOS, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'text/plain; charset=utf-8',
          'Client-ID': token.clientId,
          Authorization: `Bearer ${token.valor}`,
        },
        body: `search ${JSON.stringify(termo)}; fields ${CAMPOS_JOGO};`,
      });
      return lerJogosIgdb(resposta);
    } catch (erro) {
      if (
        erro instanceof ErroIgdb &&
        erro.motivo === 'autenticacao' &&
        this.token === token
      ) {
        this.token = undefined;
      }
      throw erro;
    }
  }

  private agendarBusca(termo: string, token: TokenIgdb): Promise<JogoIgdb[]> {
    // Enfileira apenas o início da chamada para espaçar buscas concorrentes.
    const turno = this.turnoBusca.then(async () => {
      let espera = this.proximaBuscaEm - performance.now();
      while (espera > 0) {
        await new Promise<void>((resolver) => {
          setTimeout(resolver, Math.ceil(espera));
        });
        espera = this.proximaBuscaEm - performance.now();
      }
    });
    this.turnoBusca = turno;
    return turno.then(() => {
      const busca = this.consultarJogos(termo, token);
      this.proximaBuscaEm = performance.now() + INTERVALO_BUSCAS_MS;
      return busca;
    });
  }

  private async obterToken(): Promise<TokenIgdb> {
    if (this.token && performance.now() < this.token.renovarEm) {
      return this.token;
    }
    if (this.renovacao) return this.renovacao;

    this.renovacao = this.solicitarToken();
    try {
      this.token = await this.renovacao;
      return this.token;
    } finally {
      this.renovacao = undefined;
    }
  }

  private async solicitarToken(): Promise<TokenIgdb> {
    const clientId = this.config.get<string>('IGDB_CLIENT_ID')?.trim();
    const clientSecret = this.config.get<string>('IGDB_CLIENT_SECRET')?.trim();
    if (!clientId || !clientSecret) throw new ErroIgdb('configuracao');

    const solicitadoEm = performance.now();
    const resposta = await requisitarJsonIgdb(URL_TOKEN, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });
    const { token, validadeMs } = lerTokenIgdb(resposta);
    // Reserva tempo para buscas que aguardam a vez antes de usar o token.
    const margemMs = Math.min(2_000, validadeMs / 2);
    return {
      clientId,
      valor: token,
      renovarEm: solicitadoEm + validadeMs - margemMs,
    };
  }
}
