import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { apararTexto, SenhaValida } from './validacao-auth.js';

export class LoginDto {
  @Transform(apararTexto)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  login!: string;

  @SenhaValida()
  senha!: string;
}
