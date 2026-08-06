import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  /** Mesma normalização do cadastro — caso contrário o login não encontra a conta. */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(254)
  email!: string;

  /**
   * Sem `MinLength` aqui, de propósito.
   *
   * Validar comprimento no login informaria a um atacante que senhas têm no
   * mínimo 8 caracteres, e devolveria erro de validação em vez de credencial
   * inválida — duas respostas diferentes onde deve haver uma só. O teto
   * permanece, porque protege a CPU.
   */
  @IsString()
  @MaxLength(128)
  password!: string;
}
