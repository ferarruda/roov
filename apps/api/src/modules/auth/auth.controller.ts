import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, type AuthSession, type PublicUser } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/register */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthSession> {
    return this.auth.register(dto);
  }

  /**
   * POST /v1/auth/login
   *
   * `HttpCode(200)` porque o padrão do Nest para POST é 201 Created, e o login
   * não cria recurso — devolve uma sessão.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthSession> {
    return this.auth.login(dto);
  }

  /**
   * POST /v1/auth/refresh
   *
   * Público porque o access token já expirou quando esta rota é chamada — o
   * refresh token no corpo é a credencial. Exigir token válido aqui tornaria a
   * renovação impossível, que é justamente o problema que ela resolve.
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<AuthSession> {
    return this.auth.refresh(dto.refreshToken);
  }

  /**
   * POST /v1/auth/logout
   *
   * Também público, e pela mesma razão: sair com o access token vencido precisa
   * funcionar. A segurança não é afetada — quem apresenta um refresh token só
   * consegue invalidar aquele token específico, o que não causa dano a ninguém.
   * Exigir autenticação aqui deixaria sessões impossíveis de encerrar.
   */
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  /**
   * POST /v1/auth/change-password
   *
   * Protegida (rota nasce protegida, sem `@Public()`): quem troca a senha já
   * precisa ter uma sessão. Encerra todas as sessões ao final — ver
   * `AuthService.changePassword`.
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto);
  }

  /**
   * GET /v1/auth/me
   *
   * Perfil do usuário autenticado. Fica no módulo de auth, e não em `/users/me`,
   * porque `/users` é território da Fase 3.
   */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }
}
