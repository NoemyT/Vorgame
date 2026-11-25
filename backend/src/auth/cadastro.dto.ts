import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { apararTexto, SenhaValida } from './validacao-auth.js';

export class CadastroDto {
  @ApiProperty({ example: 'Ana Souza', minLength: 1, maxLength: 191 })
  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  nome!: string;

  @ApiProperty({ format: 'email', example: 'ana@example.test', maxLength: 254 })
  @Transform(apararTexto)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'anasouza', minLength: 1, maxLength: 191 })
  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  username!: string;

  @ApiProperty({
    example: 'senha-ficticia123',
    writeOnly: true,
    minLength: 1,
    description: 'Até 72 bytes em UTF-8.',
  })
  @SenhaValida()
  senha!: string;
}
