import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { Request } from 'express';

export interface ResponseEnvelope<T> {
  data: T;
  meta: Record<string, unknown>;
}

/**
 * Envelopa toda resposta de sucesso em `{ data, meta }`.
 *
 * Por que padronizar: sem envelope, adicionar um metadado a um endpoint que
 * hoje devolve um array puro é mudança quebradora. Com envelope, `meta` cresce
 * sem tocar em `data`. O custo são alguns bytes por resposta.
 *
 * `requestId` viaja em toda resposta, não só nas de erro: rastrear uma
 * requisição bem-sucedida que produziu resultado errado é tão necessário
 * quanto rastrear uma que falhou.
 *
 * Nota: a primeira versão detectava respostas que já traziam `meta` própria,
 * para uso da paginação. Com a paginação removida do escopo do MVP, aquilo
 * virou ramificação sem nenhum chamador — e código morto envelhece mal, porque
 * ninguém o testa e todos assumem que funciona. Volta quando houver paginação
 * de verdade.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { id?: string }>();
    const requestId = request?.id;

    return next.handle().pipe(
      map((payload): ResponseEnvelope<T> => ({ data: payload, meta: { requestId } })),
    );
  }
}
