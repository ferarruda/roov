import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * Módulo de usuários.
 *
 * `UsersRepository` é exportado para que `AuthModule` o consuma — a
 * dependência aponta de auth para users, nunca o contrário. `users` não
 * importa nada de `auth`: `@CurrentUser()`/`AuthenticatedUser`, usados pelo
 * controller abaixo, vivem em `common`, exatamente para tornar isso possível
 * sem violar essa direção.
 *
 * Edição de informações — Fase 3. Avatar e preferências continuam de fora.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
