declare module 'bcrypt' {
  export function hash(senha: string, custo: number): Promise<string>;
  export function compare(senha: string, hash: string): Promise<boolean>;
}
