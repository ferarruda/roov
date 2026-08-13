import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UsersRepository } from './users.repository';
import type { UpdateUserDto } from './dto/update-user.dto';

/** Perfil devolvido ao cliente. Nunca inclui `passwordHash`. */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: User['status'];
  role: User['role'];
}

/**
 * Projeção pública do usuário.
 *
 * Escrita como lista explícita de campos, e não como `delete user.passwordHash`,
 * de propósito: com a lista, um campo sensível adicionado no futuro fica de
 * fora por padrão. Com o `delete`, ele vazaria até alguém lembrar de removê-lo
 * — segurança que depende de memória humana não é segurança.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    city: user.city,
    state: user.state,
    country: user.country,
    status: user.status,
    role: user.role,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  /** Edição de informações — Fase 3. Nunca aceita `username`/`email` aqui. */
  async update(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.users.update(userId, dto);
    return toPublicUser(user);
  }
}
