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
 * Paginação de verdade chegou na Fase 4 (`PlacesService.list`): quando o
 * controller já devolve `{ data, meta }` (contrato de cursor do D7 —
 * `nextCursor`/`hasMore`), este interceptor desembrulha em vez de aninhar de
 * novo, e mescla `requestId` na `meta` que já veio pronta.
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
      map((payload): ResponseEnvelope<T> => {
        if (hasOwnEnvelope(payload)) {
          return { data: payload.data as T, meta: { ...payload.meta, requestId } };
        }
        return { data: payload, meta: { requestId } };
      }),
    );
  }
}

/**
 * Reconhece um payload já formado como `{ data, meta }` — hoje só usado por
 * listagens paginadas. Checagem estrutural, não por tipo nominal: o
 * controller nunca declara "isto é um envelope", só devolve o formato.
 */
function hasOwnEnvelope(
  payload: unknown,
): payload is { data: unknown; meta: Record<string, unknown> } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload) &&
    'data' in payload &&
    'meta' in payload &&
    typeof (payload as { meta: unknown }).meta === 'object' &&
    (payload as { meta: unknown }).meta !== null
  );
}
