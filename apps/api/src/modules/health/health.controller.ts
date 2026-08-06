import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService, type HealthReport } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * GET /v1/health
   *
   * Rota pública e propositalmente sem autenticação: a hospedagem precisa
   * consultá-la antes de qualquer usuário existir. Por isso ela também não
   * expõe nada sensível — nem versão de dependência, nem endereço de banco.
   */
  @Public()
  @Get()
  check(): Promise<HealthReport> {
    return this.health.check();
  }
}
