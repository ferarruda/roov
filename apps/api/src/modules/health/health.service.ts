import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type HealthStatus = 'ok' | 'degraded';

export interface HealthReport {
  status: HealthStatus;
  uptimeSeconds: number;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number | null };
  };
}

/**
 * Health check.
 *
 * Vai além de responder 200: verifica a dependência que realmente derruba a
 * aplicação. Um health check que só confirma que o processo está vivo mente —
 * o processo pode estar de pé com o banco inacessível, e o orquestrador
 * continuará mandando tráfego para ele.
 *
 * Decisão consciente: falha de banco devolve `degraded` com HTTP 200, não 503.
 * Motivo: em plano gratuito o banco costuma hibernar, e a primeira consulta
 * demora. Se o health check devolvesse 503, a hospedagem reiniciaria o
 * container em loop justamente quando o banco está acordando. O estado fica
 * visível no corpo da resposta e no log, que é onde ele deve ser lido.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthService.name);
  }

  async check(): Promise<HealthReport> {
    const startedAt = Date.now();
    let databaseUp = false;
    let latencyMs: number | null = null;

    try {
      await this.prisma.ping();
      databaseUp = true;
      latencyMs = Date.now() - startedAt;
    } catch (error) {
      this.logger.error({ err: error }, 'Health check: banco inacessível');
    }

    return {
      status: databaseUp ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database: { status: databaseUp ? 'up' : 'down', latencyMs },
      },
    };
  }
}
