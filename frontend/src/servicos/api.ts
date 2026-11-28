import { limparToken, obterToken } from './sessao';

import {
  ehAvaliacaoGravada,
  ehAvaliacaoPropria,
  ehJogoDetalhes,
  ehMinhasAvaliacoes,
  ehResultadoBuscaJogos,
  type AvaliacaoGravada,
  type AvaliacaoPropria,
  type JogoDetalhes,
  type MinhasAvaliacoes,
  type ResultadoBuscaJogos,
} from './catalogo-respostas';
export type {
  AvaliacaoGravada,
  AvaliacaoListada,
  AvaliacaoPropria,
  JogoDetalhes,
  JogoResumo,
  ResultadoBuscaJogos,
} from './catalogo-respostas';

const TEMPO_LIMITE_MS = 90_000;

export type StatusServico = 'ok' | 'erro';

export interface StatusSaude {
  api: StatusServico;
  banco: StatusServico;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  username: string;
  senha: string;
}

export interface DadosLogin {
  login: string;
  senha: string;
}

export interface UsuarioCadastrado {
  id: number;
  nome: string;
  email: string;
  username: string;
  criadoEm: string;
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  username: string;
}

export interface SessaoLogin {
  token: string;
  usuario: UsuarioLogado;
}

export interface UsuarioAutenticado extends UsuarioLogado {
  email: string;
}

export class ApiIndisponivelError extends Error {
  constructor(motivo: string) {
    super(`A API não respondeu: ${motivo}`);
    this.name = 'ApiIndisponivelError';
  }
}

export class ErroHttpApi extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroHttpApi';
    this.statusCode = statusCode;
  }
}

function obterUrlBase(): string {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new ApiIndisponivelError('VITE_API_BASE_URL não foi configurada');
  }
  return url.replace(/\/+$/, '');
}

function ehUsuarioCadastrado(corpo: unknown): corpo is UsuarioCadastrado {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const usuario = corpo as Record<string, unknown>;
  return (
    typeof usuario.id === 'number' &&
    typeof usuario.nome === 'string' &&
    typeof usuario.email === 'string' &&
    typeof usuario.username === 'string' &&
    typeof usuario.criadoEm === 'string'
  );
}

function ehUsuarioLogado(corpo: unknown): corpo is UsuarioLogado {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const usuario = corpo as Record<string, unknown>;
  return (
    typeof usuario.id === 'number' &&
    typeof usuario.nome === 'string' &&
    typeof usuario.username === 'string'
  );
}

function ehSessaoLogin(corpo: unknown): corpo is SessaoLogin {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const sessao = corpo as Record<string, unknown>;
  return typeof sessao.token === 'string' && ehUsuarioLogado(sessao.usuario);
}

function ehUsuarioAutenticado(corpo: unknown): corpo is UsuarioAutenticado {
  if (typeof corpo !== 'object' || corpo === null) return false;
  const usuario = corpo as Record<string, unknown>;
  return ehUsuarioLogado(corpo) && typeof usuario.email === 'string';
}

function obterMensagemErro(corpo: unknown): string {
  if (typeof corpo !== 'object' || corpo === null) {
    return 'Revise os dados enviados e tente novamente.';
  }
  const mensagem = (corpo as Record<string, unknown>).message;
  if (typeof mensagem === 'string') return mensagem;
  if (
    Array.isArray(mensagem) &&
    mensagem.every((item) => typeof item === 'string')
  ) {
    return mensagem.join(' ');
  }
  return 'Revise os dados enviados e tente novamente.';
}

async function lerCorpoJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json();
  } catch {
    throw new ApiIndisponivelError(
      `resposta inesperada (HTTP ${resposta.status})`,
    );
  }
}

interface OpcoesJson<T> {
  metodo: 'GET' | 'POST' | 'PUT';
  validar: (corpo: unknown) => corpo is T;
  dados?: unknown;
  token?: string;
}

async function requisitarJson<T>(
  rota: string,
  opcoes: OpcoesJson<T>,
): Promise<T> {
  const cabecalhos: Record<string, string> = {};
  if (opcoes.dados !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
  }
  if (opcoes.token) cabecalhos.Authorization = `Bearer ${opcoes.token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${obterUrlBase()}${rota}`, {
      method: opcoes.metodo,
      headers: cabecalhos,
      body:
        opcoes.dados === undefined ? undefined : JSON.stringify(opcoes.dados),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    if (erro instanceof ApiIndisponivelError) throw erro;
    throw new ApiIndisponivelError(
      erro instanceof Error ? erro.message : String(erro),
    );
  }

  const corpo = await lerCorpoJson(resposta);
  if (!resposta.ok) {
    if (resposta.status === 401) limparToken();
    const mensagem =
      resposta.status === 400 ||
      resposta.status === 401 ||
      resposta.status === 409
        ? obterMensagemErro(corpo)
        : 'Não foi possível concluir a solicitação no momento.';
    throw new ErroHttpApi(resposta.status, mensagem);
  }
  if (!opcoes.validar(corpo)) {
    throw new ApiIndisponivelError(
      `resposta inesperada (HTTP ${resposta.status})`,
    );
  }
  return corpo;
}

function ehStatusSaude(corpo: unknown): corpo is StatusSaude {
  const candidato = corpo as Partial<StatusSaude> | null;
  return (
    typeof candidato?.api === 'string' && typeof candidato?.banco === 'string'
  );
}

export async function cadastrarUsuario(
  dados: DadosCadastro,
): Promise<UsuarioCadastrado> {
  return requisitarJson('/auth/register', {
    metodo: 'POST',
    validar: ehUsuarioCadastrado,
    dados,
  });
}

export async function iniciarSessao(dados: DadosLogin): Promise<SessaoLogin> {
  return requisitarJson('/auth/login', {
    metodo: 'POST',
    validar: ehSessaoLogin,
    dados,
  });
}

export async function consultarUsuarioAutenticado(): Promise<UsuarioAutenticado> {
  const token = obterToken();
  if (!token) throw new ErroHttpApi(401, 'Token ausente ou inválido');
  return requisitarJson('/auth/me', {
    metodo: 'GET',
    validar: ehUsuarioAutenticado,
    token,
  });
}

export async function buscarJogos(termo: string): Promise<ResultadoBuscaJogos> {
  const busca = termo.trim();
  if (!busca) throw new ErroHttpApi(400, 'Informe um termo de busca.');
  return requisitarJson(`/games?q=${encodeURIComponent(busca)}`, {
    metodo: 'GET',
    validar: ehResultadoBuscaJogos,
  });
}

export async function consultarJogo(id: number): Promise<JogoDetalhes> {
  if (!Number.isInteger(id)) {
    throw new ErroHttpApi(400, 'O identificador do jogo deve ser inteiro.');
  }
  return requisitarJson(`/games/${id}`, {
    metodo: 'GET',
    validar: ehJogoDetalhes,
  });
}

export async function consultarMinhaAvaliacao(
  jogoId: number,
): Promise<AvaliacaoPropria> {
  const token = obterToken();
  if (!token) throw new ErroHttpApi(401, 'Token ausente ou inválido');
  if (!Number.isInteger(jogoId)) {
    throw new ErroHttpApi(400, 'O identificador do jogo deve ser inteiro.');
  }
  return requisitarJson(`/games/${jogoId}/ratings/me`, {
    metodo: 'GET',
    validar: ehAvaliacaoPropria,
    token,
  });
}

export async function listarMinhasAvaliacoes(): Promise<MinhasAvaliacoes> {
  const token = obterToken();
  if (!token) throw new ErroHttpApi(401, 'Token ausente ou inválido');
  return requisitarJson('/ratings/me', {
    metodo: 'GET',
    validar: ehMinhasAvaliacoes,
    token,
  });
}

export async function gravarAvaliacao(
  jogoId: number,
  nota: number,
  modo: 'criar' | 'alterar',
): Promise<AvaliacaoGravada> {
  const token = obterToken();
  if (!token) throw new ErroHttpApi(401, 'Token ausente ou inv?lido');
  if (
    !Number.isSafeInteger(jogoId) ||
    !Number.isInteger(nota) ||
    nota < 0 ||
    nota > 10
  ) {
    throw new ErroHttpApi(
      400,
      'Informe um identificador v?lido e uma nota inteira de 0 a 10.',
    );
  }
  const editar = modo === 'alterar';
  return requisitarJson(`/games/${jogoId}/ratings${editar ? '/me' : ''}`, {
    metodo: editar ? 'PUT' : 'POST',
    validar: ehAvaliacaoGravada,
    dados: { nota },
    token,
  });
}

export async function consultarSaude(): Promise<StatusSaude> {
  let resposta: Response;
  try {
    resposta = await fetch(`${obterUrlBase()}/health`, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    if (erro instanceof ApiIndisponivelError) throw erro;
    throw new ApiIndisponivelError(
      erro instanceof Error ? erro.message : String(erro),
    );
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!ehStatusSaude(corpo)) {
    throw new ApiIndisponivelError(
      `resposta inesperada (HTTP ${resposta.status})`,
    );
  }
  return corpo;
}
