import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { User } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TokenService } from './token.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

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

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

/** Status que impedem autenticação, independentemente da senha estar correta. */
const BLOCKED_STATUSES: ReadonlyArray<User['status']> = [
  'suspenso',
  'banido',
  'excluido',
];

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(dto: RegisterDto): Promise<AuthSession> {
    const passwordHash = await this.passwords.hash(dto.password);

    let user: User;
    try {
      user = await this.users.create({
        email: dto.email,
        username: dto.username,
        name: dto.name,
        passwordHash,
      });
    } catch (error) {
      /**
       * Deixamos o banco decidir sobre unicidade em vez de consultar antes.
       * Consultar-e-depois-inserir tem uma janela de corrida entre as duas
       * operações; a restrição UNIQUE não tem.
       */
      const field = UsersRepository.conflictField(error);

      if (field === 'email') {
        throw AppException.conflict('Este e-mail já está cadastrado.');
      }
      if (field === 'username') {
        throw AppException.conflict('Este nome de usuário já está em uso.');
      }
      throw error;
    }

    this.logger.info({ userId: user.id }, 'Usuário cadastrado');

    return this.createSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.users.findByEmail(dto.email);

    /**
     * Enumeração de usuários.
     *
     * Se e-mail inexistente devolvesse "usuário não encontrado" e senha errada
     * devolvesse "senha incorreta", qualquer pessoa poderia descobrir quem tem
     * conta no ROOV testando endereços. A mensagem é idêntica nos dois casos.
     *
     * Resta a diferença de tempo: sem usuário não há verificação de hash, e a
     * resposta volta mais rápido. Por isso executamos o Argon2 mesmo quando o
     * usuário não existe, contra um hash descartável.
     */
    if (!user) {
      await this.passwords.verifyAgainstDummy(dto.password);
      throw AppException.unauthenticated('E-mail ou senha inválidos.');
    }

    const passwordMatches = await this.passwords.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      this.logger.warn({ userId: user.id }, 'Tentativa de login com senha inválida');
      throw AppException.unauthenticated('E-mail ou senha inválidos.');
    }

    if (BLOCKED_STATUSES.includes(user.status)) {
      /**
       * Mensagem distinta aqui é intencional e não vaza nada: quem chegou até
       * este ponto já provou conhecer a senha, então a existência da conta não
       * é mais segredo para ele. E o usuário precisa entender por que não
       * consegue entrar.
       */
      throw AppException.forbidden(
        'Esta conta não está disponível. Entre em contato com o suporte.',
      );
    }

    return this.createSession(user);
  }

  /**
   * Renova a sessão, rotacionando o refresh token.
   *
   * Rotação significa que o token usado é revogado e um novo é emitido. Sem
   * isso, um refresh token roubado valeria 30 dias em silêncio. Com rotação, o
   * atacante e o usuário legítimo passam a competir pelo mesmo token, e a
   * segunda tentativa dispara a detecção de reuso abaixo.
   */
  async refresh(refreshToken: string): Promise<AuthSession> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored) {
      throw AppException.unauthenticated('Sessão inválida.');
    }

    /**
     * Detecção de reuso.
     *
     * Um token já revogado sendo apresentado outra vez significa uma de duas
     * coisas: ou o token vazou, ou o cliente repetiu uma requisição. Não há
     * como distinguir — e o custo de errar é assimétrico. Encerrar todas as
     * sessões força um login novo no pior caso, e corta o acesso do atacante
     * no caso ruim.
     */
    if (stored.revokedAt) {
      this.logger.warn(
        { userId: stored.userId },
        'Reuso de refresh token detectado — todas as sessões revogadas',
      );
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw AppException.unauthenticated('Sessão inválida.');
    }

    if (stored.expiresAt <= new Date()) {
      throw AppException.unauthenticated('Sessão expirada.');
    }

    const user = await this.users.findById(stored.userId);

    if (!user || BLOCKED_STATUSES.includes(user.status)) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw AppException.unauthenticated('Sessão inválida.');
    }

    await this.refreshTokens.revoke(stored.id);

    return this.createSession(user);
  }

  /**
   * Logout.
   *
   * Revoga apenas a sessão apresentada, não todas — sair no celular não deve
   * derrubar o notebook.
   *
   * Não lança quando o token não existe: logout precisa ser idempotente. Um
   * cliente que já apagou o token local e tenta sair de novo deve receber
   * sucesso, não erro.
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (stored && !stored.revokedAt) {
      await this.refreshTokens.revoke(stored.id);
    }
  }

  /** Perfil do usuário autenticado. */
  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      // Token válido de usuário removido: sessão sem dono.
      throw AppException.unauthenticated('Sessão inválida.');
    }

    return toPublicUser(user);
  }

  private async createSession(user: User): Promise<AuthSession> {
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      role: user.role,
    });

    const { token, tokenHash } = this.tokens.generateRefreshToken();

    await this.refreshTokens.create({
      tokenHash,
      userId: user.id,
      expiresAt: this.tokens.refreshTokenExpiresAt(),
    });

    return { accessToken, refreshToken: token, user: toPublicUser(user) };
  }
}

/**
 * Projeção pública do usuário.
 *
 * Escrita como lista explícita de campos, e não como `delete user.passwordHash`,
 * de propósito: com a lista, um campo sensível adicionado no futuro fica de
 * fora por padrão. Com o `delete`, ele vazaria até alguém lembrar de removê-lo
 * — segurança que depende de memória humana não é segurança.
 */
function toPublicUser(user: User): PublicUser {
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
