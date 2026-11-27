import { ErroIgdb } from './igdb.http.js';

export interface JogoIgdb {
  idExterno: number;
  titulo: string;
  capa: string | null;
  descricao: string | null;
  generos: string[];
  plataformas: string[];
}

function lerRegistro(valor: unknown): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new ErroIgdb('resposta_invalida');
  }
  return valor as Record<string, unknown>;
}

function lerTexto(valor: unknown): string | null {
  if (valor == null) return null;
  if (typeof valor !== 'string') throw new ErroIgdb('resposta_invalida');
  return valor.trim() || null;
}

function lerInteiroPositivo(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor <= 0) {
    throw new ErroIgdb('resposta_invalida');
  }
  return valor;
}

function lerCapa(valor: unknown): string | null {
  if (valor == null) return null;
  const idImagem = lerTexto(lerRegistro(valor).image_id);
  if (!idImagem) return null;
  if (!/^[a-z0-9_-]+$/i.test(idImagem)) throw new ErroIgdb('resposta_invalida');
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${idImagem}.jpg`;
}

function lerNomes(valor: unknown): string[] {
  if (valor == null) return [];
  if (!Array.isArray(valor)) throw new ErroIgdb('resposta_invalida');
  return valor.flatMap((item: unknown) => {
    const nome = lerTexto(lerRegistro(item).name);
    return nome === null ? [] : [nome];
  });
}

function lerJogo(valor: unknown): JogoIgdb {
  const jogo = lerRegistro(valor);
  const titulo = lerTexto(jogo.name);
  if (!titulo) throw new ErroIgdb('resposta_invalida');
  return {
    idExterno: lerInteiroPositivo(jogo.id),
    titulo,
    capa: lerCapa(jogo.cover),
    descricao: lerTexto(jogo.summary),
    generos: lerNomes(jogo.genres),
    plataformas: lerNomes(jogo.platforms),
  };
}

export function lerJogosIgdb(valor: unknown): JogoIgdb[] {
  if (!Array.isArray(valor)) throw new ErroIgdb('resposta_invalida');
  return valor.map(lerJogo);
}

export function lerTokenIgdb(valor: unknown): {
  token: string;
  validadeMs: number;
} {
  const resposta = lerRegistro(valor);
  const token = lerTexto(resposta.access_token);
  if (!token) throw new ErroIgdb('resposta_invalida');
  return { token, validadeMs: lerInteiroPositivo(resposta.expires_in) * 1_000 };
}
