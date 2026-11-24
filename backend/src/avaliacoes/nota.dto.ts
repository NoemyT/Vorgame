import { Injectable, ValidationPipe } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';

export class NotaDto {
  @IsInt({ message: 'nota deve ser um número inteiro' })
  @Min(0, { message: 'nota deve estar entre 0 e 10' })
  @Max(10, { message: 'nota deve estar entre 0 e 10' })
  nota!: number;
}

@Injectable()
export class NotaPipe extends ValidationPipe {
  constructor() {
    super({ transform: true, whitelist: true });
  }
}
