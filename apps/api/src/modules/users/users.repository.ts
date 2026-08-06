import { Injectable } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface CreateUserData {
  email: string;
  username: string;
  name: string;
  passwordHash: string;
}

/**
 * Persistência de usuários.
 *
 * Nesta fase o módulo `users` é só isto: um repositório. Perfil, edição, avatar
 * e preferências são a Fase 3. A tabela existe agora porque autenticação sem
 * usuário não faz sentido — mas nada além do necessário para autenticar entra
 * aqui.
 *
 * Única camada do sistema autorizada a tocar o Prisma para esta entidade.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * O e-mail é normalizado para minúsculas na entrada, então a busca é direta.
   * Sem isso, `Ana@x.com` e `ana@x.com` criariam duas contas.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * Traduz a violação de unicidade do Postgres para o campo que a causou.
   *
   * Existe para o `AuthService` distinguir "e-mail já usado" de "username já
   * usado" sem precisar de duas consultas prévias — que, além de mais lentas,
   * não eliminariam a corrida entre a consulta e o insert. O banco é a única
   * autoridade confiável sobre unicidade.
   */
  static conflictField(error: unknown): 'email' | 'username' | null {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return null;
    }

    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [String(target)];

    if (fields.some((field) => field.includes('email'))) return 'email';
    if (fields.some((field) => field.includes('username'))) return 'username';
    return null;
  }
}
