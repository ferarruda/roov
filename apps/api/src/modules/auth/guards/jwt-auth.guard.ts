import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException } from '../../../common/errors/app.exception';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { TokenService } from '../token.service';
import type { RequestWithUser } from '../../../common/types/authenticated-user';

/**
 * Guard global de autenticação.
 *
 * Registrado como `APP_GUARD`: toda rota exige token, exceto as marcadas com
 * `@Public()`.
 *
 * Responsabilidade estritamente limitada a *autenticação* — provar quem é o
 * usuário. Autorização (quem pode fazer o quê) não mora aqui; entra em fases
 * seguintes, num guard próprio, quando houver regra de permissão real. Misturar
 * as duas coisas produz um guard que ninguém consegue mudar sem medo.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & RequestWithUser>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw AppException.unauthenticated('Token de acesso ausente.');
    }

    try {
      const payload = await this.tokens.verifyAccessToken(token);

      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      /**
       * Motivo da falha — expirado, assinatura inválida, malformado — fica no
       * genérico de propósito. Detalhar ajuda quem está sondando a API a
       * entender o formato do token. Para o cliente legítimo a ação é a mesma
       * nos três casos: renovar a sessão.
       */
      throw AppException.unauthenticated('Token de acesso inválido ou expirado.');
    }
  }
}

/**
 * Extrai o token do cabeçalho `Authorization: Bearer <token>`.
 *
 * O esquema é comparado sem diferenciar maiúsculas porque a RFC 7235 assim
 * determina, e alguns clientes HTTP enviam `bearer` em minúsculas.
 */
function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, token] = header.split(' ');

  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;

  return token.trim() || null;
}
