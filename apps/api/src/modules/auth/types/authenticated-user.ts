import type { UserRole } from '@prisma/client';

/**
 * Usuário autenticado, tal como o guard o disponibiliza.
 *
 * Contém apenas o que veio do token — id e papel. Não é a entidade `User`
 * completa, e isso é intencional: se fosse, cada requisição custaria uma
 * consulta ao banco. Handlers que precisam do perfil inteiro o buscam
 * explicitamente, e essa consulta fica visível no código em vez de escondida
 * no guard.
 */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/** Request do Express com o usuário anexado pelo guard. */
export interface RequestWithUser {
  user?: AuthenticatedUser;
}
