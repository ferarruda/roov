import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  /**
   * Normalizado para minúsculas na entrada.
   *
   * Sem isso, `Ana@x.com` e `ana@x.com` seriam contas distintas, porque a
   * restrição UNIQUE do Postgres diferencia maiúsculas. O usuário que se
   * cadastrou com maiúscula e tentou entrar com minúscula não conseguiria
   * — e não entenderia por quê.
   */
  @Transform(trimLower)
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(254, { message: 'E-mail excede o tamanho máximo permitido.' })
  email!: string;

  /**
   * Identificador público (@handle). Também normalizado para minúsculas:
   * `@Lia` e `@lia` devem ser a mesma pessoa.
   */
  @Transform(trimLower)
  @IsString()
  @Length(3, 30, {
    message: 'Nome de usuário deve ter entre 3 e 30 caracteres.',
  })
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'Nome de usuário aceita apenas letras minúsculas, números e underline.',
  })
  username!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: 'Nome deve ter entre 2 e 80 caracteres.' })
  name!: string;

  /**
   * Política de senha: apenas comprimento mínimo.
   *
   * Sem exigir maiúscula, número e símbolo — segue a recomendação atual do
   * NIST. Regras de composição produzem senhas previsíveis (`Senha@123`) e
   * empurram o usuário a reutilizar a mesma senha de sempre. Comprimento é o
   * que efetivamente aumenta a dificuldade.
   *
   * O teto de 128 caracteres não é estética: sem limite, alguém envia 10 MB de
   * texto e o Argon2 consome CPU do servidor tentando processar. É negação de
   * serviço barata de executar.
   */
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(128, { message: 'Senha excede o tamanho máximo permitido.' })
  password!: string;
}
