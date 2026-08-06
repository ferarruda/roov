import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';

/**
 * Módulo raiz.
 *
 * Mantido deliberadamente magro: só compõe módulos. Nenhuma regra de negócio
 * mora aqui. Cada fase do roadmap adiciona exatamente uma linha em `imports`.
 */
@Module({
  imports: [
    AppConfigModule,

    /**
     * Log estruturado em JSON. Não é preciosismo: `console.log` produz texto
     * que nenhuma ferramenta consegue filtrar, e a Fase 12 pede
     * observabilidade. Formato certo desde o início custa zero; converter
     * depois significa reescrever todas as chamadas de log do sistema.
     */
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,

          /**
           * Correlation id. Aceita `x-request-id` vindo de fora (útil quando
           * houver proxy ou fila na frente) e gera um quando não existe. O
           * mesmo id volta no cabeçalho da resposta e dentro do envelope —
           * é o que liga o relato de um usuário à linha exata do log.
           */
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const existing = req.headers['x-request-id'];
            const id =
              (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },

          /**
           * Redação de dados sensíveis. Vale para LGPD e para higiene básica:
           * token em log é credencial vazada, e log costuma ir para um terceiro.
           */
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },

          // Ruído: health check bate a cada poucos segundos em produção.
          autoLogging: {
            ignore: (req: IncomingMessage) => req.url === '/v1/health',
          },

          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        },
      }),
    }),

    PrismaModule,

    // ─── Módulos de funcionalidade ────────────────────────────────────────
    HealthModule,
    UsersModule,
    AuthModule,
    // Fase 3 → evolução do domínio de usuários (perfil, preferências)
    // Fase 4 → PlacesModule
  ],
  providers: [
    /**
     * Registrados como providers, e não em `main.ts`, porque ambos dependem de
     * injeção (logger e adapter HTTP). Registro global via `APP_FILTER` /
     * `APP_INTERCEPTOR` é a forma correta quando há dependências.
     */
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },

    /**
     * Guard global: toda rota exige autenticação, salvo `@Public()`.
     *
     * A ordem importa. O Nest executa guards ANTES dos interceptors, então uma
     * requisição sem token é rejeitada antes de qualquer handler rodar.
     */
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
