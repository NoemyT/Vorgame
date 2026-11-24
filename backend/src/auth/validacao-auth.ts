import { ValidateBy } from 'class-validator';

export function apararTexto({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function SenhaValida(): PropertyDecorator {
  return ValidateBy({
    name: 'senhaValida',
    validator: {
      validate: (valor: unknown) =>
        typeof valor === 'string' &&
        valor.trim().length > 0 &&
        Buffer.byteLength(valor, 'utf8') <= 72,
      defaultMessage: () =>
        'senha deve conter texto e ter até 72 bytes em UTF-8',
    },
  });
}
