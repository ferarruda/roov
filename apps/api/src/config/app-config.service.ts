import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/**
 * Acesso tipado à configuração.
 *
 * Por que não usar `ConfigService` diretamente nos módulos: `config.get('PORT')`
 * devolve `unknown` ou obriga a repetir o tipo em cada chamada, e um erro de
 * digitação no nome da variável só aparece em runtime. Aqui o compilador
 * garante que `config.port` existe e é `number`.
 *
 * O custo é uma classe fina. O retorno é que nenhuma variável de ambiente pode
 * ser lida errada em nenhum ponto do sistema.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get port(): number {
    return this.get('PORT');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get jwtSecret(): string {
    return this.get('JWT_SECRET');
  }

  get jwtAccessTtl(): string {
    return this.get('JWT_ACCESS_TTL');
  }

  get refreshTokenTtlDays(): number {
    return this.get('REFRESH_TOKEN_TTL_DAYS');
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.get('LOG_LEVEL');
  }
}
