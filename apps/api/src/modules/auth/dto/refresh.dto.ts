import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Usado por `/refresh` e `/logout`.
 *
 * O refresh token viaja no corpo da requisição, não em cookie httpOnly. É uma
 * escolha consciente para o MVP: cookie entre origens diferentes (frontend na
 * Vercel, API em outro domínio) exige `SameSite=None`, `Secure`, configuração
 * de CORS com credenciais e proteção contra CSRF — bastante complexidade antes
 * de existir o primeiro usuário.
 *
 * O custo é real e fica registrado: guardado em `localStorage`, o token é
 * legível por um ataque de XSS. A mitigação atual é a rotação com detecção de
 * reuso, que limita a janela de exploração. Migrar para cookie é a evolução
 * natural quando o produto sair da validação.
 */
export class RefreshDto {
  @IsString()
  @MinLength(20, { message: 'Token inválido.' })
  @MaxLength(200, { message: 'Token inválido.' })
  refreshToken!: string;
}
