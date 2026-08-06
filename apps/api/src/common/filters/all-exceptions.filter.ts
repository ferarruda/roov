import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import type { Request } from 'express';
import { AppException, type ErrorDetail } from '../errors/app.exception';
import { ErrorCode } from '../errors/error-code';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
    requestId?: string;
  };
}

/**
 * O corpo de uma `HttpException` genérica é `string | object` — o framework não
 * garante formato. Estes dois leitores tratam esse valor como o que ele é:
 * desconhecido. Usar `as any` aqui desligaria a checagem exatamente no ponto do
 * sistema que mais recebe dado imprevisível.
 */
function extractMessage(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) return undefined;

  const message = (response as Record<string, unknown>).message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === 'string').join('; ');
  }
  return undefined;
}

function extractDetails(response: unknown): ErrorDetail[] {
  if (typeof response !== 'object' || response === null) return [];

  const details = (response as Record<string, unknown>).details;
  if (!Array.isArray(details)) return [];

  return details.filter(
    (item): item is ErrorDetail =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ErrorDetail).message === 'string',
  );
}

/**
 * Filtro global de exceções.
 *
 * Garante três coisas, sem exceção:
 *  1. Toda resposta de erro tem exatamente o mesmo formato — o cliente nunca
 *     precisa de dois caminhos de tratamento.
 *  2. Detalhe interno nunca vaza. Stack trace, mensagem do Postgres e nome de
 *     tabela são material de reconhecimento para um atacante. Vão para o log,
 *     nunca para o corpo da resposta.
 *  3. Todo erro carrega o `requestId`, ligando o que o usuário viu ao que foi
 *     registrado no log. Sem isso, suporte vira adivinhação.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();
    const requestId = request?.id;

    const { status, body } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 5xx é defeito nosso: log completo, com stack.
      this.logger.error(
        { err: exception, requestId, path: request?.url },
        'Erro não tratado',
      );
    } else {
      // 4xx é uso incorreto do cliente: registrado, mas sem alarme.
      this.logger.warn(
        {
          requestId,
          path: request?.url,
          code: body.error.code,
          status,
        },
        'Requisição rejeitada',
      );
    }

    httpAdapter.reply(
      ctx.getResponse(),
      { error: { ...body.error, requestId } },
      status,
    );
  }

  private normalize(exception: unknown): {
    status: number;
    body: ErrorEnvelope;
  } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
          },
        },
      };
    }

    /**
     * `HttpException` genérica: vem do próprio Nest (404 de rota inexistente,
     * 400 do ValidationPipe, 401 de guard). Traduzimos para o nosso catálogo
     * para que o cliente nunca receba um formato de erro diferente só porque
     * o erro nasceu dentro do framework.
     */
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      const message =
        typeof response === 'string'
          ? response
          : extractMessage(response) ?? exception.message;

      const details = extractDetails(response);

      return {
        status,
        body: {
          error: {
            code: this.codeForStatus(status),
            message: Array.isArray(message) ? message.join('; ') : message,
            details,
          },
        },
      };
    }

    // Qualquer outra coisa é defeito desconhecido. Mensagem genérica, sempre.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Erro interno. Tente novamente em instantes.',
          details: [],
        },
      },
    };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
    }
  }
}
