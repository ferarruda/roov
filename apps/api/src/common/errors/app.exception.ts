import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code';

export interface ErrorDetail {
  /** Campo ou caminho relacionado ao erro. Ex.: `dna.ambiente[0]`. */
  field?: string;
  message: string;
}

/**
 * Exceção da aplicação.
 *
 * Toda falha esperada do sistema deve ser lançada como `AppException`, nunca
 * como `HttpException` crua. Motivo: `HttpException` carrega status HTTP, que
 * é detalhe de transporte; o que o cliente precisa é do `code` estável.
 *
 * Estende `HttpException` para continuar aproveitando o pipeline do Nest, mas
 * o `code` é o dado de primeira classe. O status HTTP vira consequência.
 *
 * Os construtores estáticos existem para evitar o erro mais comum nesse tipo
 * de classe: alguém combinar um `code` com um status que não corresponde
 * (`NOT_FOUND` devolvido com 200, por exemplo).
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details: ErrorDetail[];

  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus,
    details: ErrorDetail[] = [],
  ) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }

  static notFound(message = 'Recurso não encontrado.'): AppException {
    return new AppException(
      ErrorCode.NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
    );
  }

  static badRequest(
    message = 'Requisição inválida.',
    details: ErrorDetail[] = [],
  ): AppException {
    return new AppException(
      ErrorCode.BAD_REQUEST,
      message,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }

  static validationFailed(
    details: ErrorDetail[],
    message = 'Os dados enviados são inválidos.',
  ): AppException {
    return new AppException(
      ErrorCode.VALIDATION_FAILED,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }

  static unauthenticated(
    message = 'Autenticação necessária.',
  ): AppException {
    return new AppException(
      ErrorCode.UNAUTHENTICATED,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(
    message = 'Você não tem permissão para esta ação.',
  ): AppException {
    return new AppException(
      ErrorCode.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN,
    );
  }

  static conflict(message = 'Conflito de estado.'): AppException {
    return new AppException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
  }

  static invalidCursor(
    message = 'Cursor de paginação inválido.',
  ): AppException {
    return new AppException(
      ErrorCode.INVALID_CURSOR,
      message,
      HttpStatus.BAD_REQUEST,
    );
  }

  static serviceUnavailable(
    message = 'Serviço temporariamente indisponível.',
  ): AppException {
    return new AppException(
      ErrorCode.SERVICE_UNAVAILABLE,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
