import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';

/**
 * Módulo de usuários — apenas persistência nesta fase.
 *
 * Sem controller: perfil, edição e preferências são a Fase 3. A tabela e o
 * repositório existem agora porque autenticação sem usuário não faz sentido.
 *
 * O repositório é exportado para que `AuthModule` o consuma. A dependência
 * aponta de auth para users, nunca o contrário — users não sabe que
 * autenticação existe.
 */
@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
