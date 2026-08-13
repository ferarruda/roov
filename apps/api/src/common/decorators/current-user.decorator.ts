import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser, RequestWithUser } from '../types/authenticated-user';

/**
 * Injeta o usuário autenticado no handler.
 *
 * Só é usável em rota protegida pelo guard. Numa rota `@Public()` o valor seria
 * `undefined` — por isso o retorno lança em vez de devolver `undefined`: é um
 * erro de programação, e falhar alto no desenvolvimento é melhor que propagar
 * `undefined` até virar comportamento estranho em produção.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new Error(
        '@CurrentUser() usado em rota sem autenticação. ' +
          'Remova o @Public() ou não use este decorator aqui.',
      );
    }

    return request.user;
  },
);
