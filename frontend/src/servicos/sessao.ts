const CHAVE_TOKEN = 'vorgame_token';
const EVENTO_SESSAO = 'vorgame:sessao';

export function obterToken(): string | null {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string): void {
  sessionStorage.setItem(CHAVE_TOKEN, token);
  window.dispatchEvent(new Event(EVENTO_SESSAO));
}

export function limparToken(): void {
  sessionStorage.removeItem(CHAVE_TOKEN);
  window.dispatchEvent(new Event(EVENTO_SESSAO));
}

export function assinarSessao(atualizar: () => void) {
  window.addEventListener(EVENTO_SESSAO, atualizar);
  return () => window.removeEventListener(EVENTO_SESSAO, atualizar);
}

export function temSessao(): boolean {
  return Boolean(obterToken());
}
