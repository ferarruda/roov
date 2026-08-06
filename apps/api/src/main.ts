import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AppException } from './common/errors/app.exception';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // O logger próprio do Nest é silenciado; o pino assume no passo abaixo.
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(AppConfigService);

  /**
   * Versionamento por URI: `/v1/...`.
   *
   * Escolhido em vez de versionamento por header porque é visível, fácil de
   * testar no navegador e trivial de rotear. Versionar depois é caro; agora
   * custa uma linha.
   */
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  /** Cabeçalhos de segurança padrão. Barato e elimina uma classe de problemas. */
  app.use(helmet());

  /**
   * CORS restrito à lista do ambiente.
   *
   * `credentials: true` combinado com origem `*` é proibido pelo navegador e é
   * falha de segurança real — por isso `CORS_ORIGINS` não tem default
   * permissivo no schema de ambiente.
   */
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * `whitelist` remove campos não declarados no DTO e `forbidNonWhitelisted`
       * rejeita a requisição que os enviou. Sem isso, um cliente poderia mandar
       * `{ role: "admin" }` num update de perfil e a propriedade chegaria
       * intacta na camada de dados — é assim que escalonamento de privilégio
       * acontece na prática.
       */
      whitelist: true,
      forbidNonWhitelisted: true,

      /** Converte tipos vindos de query string e path (sempre texto). */
      transform: true,
      transformOptions: { enableImplicitConversion: false },

      /**
       * Erro de validação sai no formato do catálogo, não no formato do Nest.
       * Garante que o cliente tenha um único caminho de tratamento de erro.
       */
      exceptionFactory: (errors) =>
        AppException.validationFailed(
          errors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints ?? {}).join('; '),
          })),
        ),
    }),
  );

  /**
   * Desligamento gracioso: encerra conexões abertas antes de morrer, em vez de
   * cortar requisições no meio. Também é o que dispara `onModuleDestroy` do
   * Prisma, devolvendo as conexões ao pool — importante no plano gratuito,
   * onde o limite de conexões é baixo.
   */
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
