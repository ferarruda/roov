import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { HealthService } from './health.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Teste unitário: o único dublê aqui é o Prisma, porque o comportamento sob
 * teste é justamente "o que acontece quando o banco responde e quando não
 * responde". Nos módulos de negócio das próximas fases a regra é a oposta —
 * eles rodam contra Postgres real, porque mock de ORM testa o mock.
 */
describe('HealthService', () => {
  const buildLogger = () =>
    ({
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }) as unknown as PinoLogger;

  async function buildService(ping: jest.Mock) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: { ping } },
        { provide: PinoLogger, useValue: buildLogger() },
      ],
    }).compile();

    return moduleRef.get(HealthService);
  }

  it('reporta ok quando o banco responde', async () => {
    const service = await buildService(jest.fn().mockResolvedValue(undefined));

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.database.status).toBe('up');
    expect(report.checks.database.latencyMs).not.toBeNull();
  });

  it('reporta degraded sem lançar quando o banco falha', async () => {
    const service = await buildService(
      jest.fn().mockRejectedValue(new Error('connection refused')),
    );

    const report = await service.check();

    expect(report.status).toBe('degraded');
    expect(report.checks.database.status).toBe('down');
    expect(report.checks.database.latencyMs).toBeNull();
  });

  it('não vaza a mensagem de erro do banco no relatório', async () => {
    const service = await buildService(
      jest
        .fn()
        .mockRejectedValue(new Error('FATAL: password authentication failed')),
    );

    const report = await service.check();

    // Detalhe de conexão é material de reconhecimento. Fica no log, não na resposta.
    expect(JSON.stringify(report)).not.toContain('password');
  });
});
