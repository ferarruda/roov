import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /**
   * Sem `MinLength`, mesma razão do `LoginDto`: o usuário já provou
   * identidade pelo token, mas a senha atual em si não deve ganhar uma regra
   * de formato que a distinga de "qualquer string errada".
   */
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  /** Mesma política do cadastro — ver `RegisterDto`. */
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(128, { message: 'Senha excede o tamanho máximo permitido.' })
  newPassword!: string;
}
