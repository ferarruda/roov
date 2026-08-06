import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

/**
 * Cliente Prisma como serviço do Nest.
 *
 * Responsabilidade única: ciclo de vida da conexão. Nenhuma regra de negócio
 * entra aqui, e nenhum módulo de feature instancia `PrismaClient` por conta
 * própria — várias instâncias significam vários pools de conexão, e banco
 * gerenciado em plano gratuito costuma ter limite baixo de conexões.
 *
 * Fronteira arquitetural: apenas arquivos `*.repository.ts` podem injetar este
 * serviço. Controllers e services nunca tocam o Prisma diretamente. É o que
 * mantém o acesso a dados trocável e os testes viáveis.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    super({
      // Erros e avisos do driver vão para o nosso logger estruturado, não
      // para stdout cru — em produção, log fora do formato JSON é log perdido.
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit(): Promise<void> {
    /**
     * `$connect` explícito no boot em vez de conexão preguiçosa na primeira
     * query. Assim, banco inacessível derruba a aplicação imediatamente, em
     * vez de produzir a primeira falha na cara de um usuário.
     */
    await this.$connect();
    this.logger.info('Conexão com o banco estabelecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Verificação de vida usada pelo health check. */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
