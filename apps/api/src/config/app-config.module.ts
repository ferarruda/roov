import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.schema';

/**
 * Configuração global. `Global` é usado com parcimônia no projeto — aqui é
 * justificado: configuração é infraestrutura transversal, e importar este
 * módulo em cada feature seria ruído sem benefício.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Validação executada uma vez, no boot. Ambiente inválido derruba o processo.
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
