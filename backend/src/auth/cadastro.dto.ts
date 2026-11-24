import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { apararTexto, SenhaValida } from './validacao-auth.js';

export class CadastroDto {
  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  nome!: string;

  @Transform(apararTexto)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  username!: string;

  @SenhaValida()
  senha!: string;
}
