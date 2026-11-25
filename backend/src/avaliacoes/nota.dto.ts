import { Injectable, ValidationPipe } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class NotaDto {
  @ApiProperty({ type: 'integer', minimum: 0, maximum: 10, example: 8 })
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
