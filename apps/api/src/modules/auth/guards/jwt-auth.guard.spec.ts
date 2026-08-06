import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from '../token.service';
import type { AppException } from '../../../common/errors/app.exception';

describe('JwtAuthGuard', () => {
  function buildContext(authorization?: string) {
    const request: Record<string, unknown> = { headers: { authorization } };

    return {
      request,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => undefined,
        getClass: () => undefined,
      } as unknown as ExecutionContext,
    };
  }

  function buildGuard(options: {
    isPublic?: boolean;
    verify?: jest.Mock;
  }) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(options.isPublic ?? false),
    } as unknown as Reflector;

    const tokens = {
      verifyAccessToken:
        options.verify ??
        jest.fn().mockResolvedValue({ sub: 'user-1', role: 'usuario' }),
    } as unknown as TokenService;

    return new JwtAuthGuard(reflector, tokens);
  }

  it('libera rota marcada como pública sem exigir token', async () => {
    const guard = buildGuard({ isPublic: true });
    const { context } = buildContext(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('anexa o usuário à requisição quando o token é válido', async () => {
    const guard = buildGuard({});
    const { context, request } = buildContext('Bearer token-valido');

    await guard.canActivate(context);

    expect(request.user).toEqual({ id: 'user-1', role: 'usuario' });
  });

  it('aceita o esquema Bearer em minúsculas', async () => {
    const guard = buildGuard({});
    const { context } = buildContext('bearer token-valido');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it.each([
    ['cabeçalho ausente', undefined],
    ['sem esquema', 'token-solto'],
    ['esquema errado', 'Basic dXNlcjpwYXNz'],
    ['Bearer sem token', 'Bearer '],
  ])('rejeita quando: %s', async (_caso, header) => {
    const guard = buildGuard({});
    const { context } = buildContext(header);

    await expect(guard.canActivate(context)).rejects.toThrow();
  });

  it('não revela por que o token falhou', async () => {
    const guard = buildGuard({
      verify: jest.fn().mockRejectedValue(new Error('jwt expired')),
    });
    const { context } = buildContext('Bearer token-expirado');

    const erro = (await guard.canActivate(context).catch((e) => e)) as AppException;

    // "jwt expired" ajudaria quem está sondando o formato do token.
    expect(erro.message).not.toContain('expired');
  });
});
