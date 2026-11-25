import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { apararTexto, SenhaValida } from './validacao-auth.js';

export class LoginDto {
  @ApiProperty({
    example: 'anasouza',
    minLength: 1,
    maxLength: 254,
    description: 'Email ou nome de usuário.',
  })
  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  login!: string;

  @ApiProperty({
    example: 'senha-ficticia123',
    writeOnly: true,
    minLength: 1,
    description: 'Até 72 bytes em UTF-8.',
  })
  @SenhaValida()
  senha!: string;
}
