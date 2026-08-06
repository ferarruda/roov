/**
 * Catálogo oficial de códigos de erro da API.
 *
 * Contrato: `code` é ESTÁVEL e legível por máquina. O frontend pode e deve
 * tomar decisões com base nele. `message` é para humanos, pode ser reescrita a
 * qualquer momento e pode ser traduzida — nenhum cliente deve compará-la.
 *
 * Regra de manutenção: um código, uma vez publicado, nunca muda de significado.
 * Se o significado mudar, cria-se um código novo. Renomear código é quebra de
 * contrato silenciosa, do tipo que só aparece na tela do usuário.
 */
export const ErrorCode = {
  /** Falha de validação de entrada. Acompanha `details` por campo. */
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  /** Requisição malformada que não é validação de campo. */
  BAD_REQUEST: 'BAD_REQUEST',

  /** Token ausente, expirado ou inválido. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',

  /** Autenticado, mas sem permissão para o recurso. */
  FORBIDDEN: 'FORBIDDEN',

  /** Recurso inexistente — ou existente e invisível para este usuário. */
  NOT_FOUND: 'NOT_FOUND',

  /** Conflito de estado: duplicidade, violação de unicidade. */
  CONFLICT: 'CONFLICT',

  /** Cursor de paginação corrompido ou forjado. */
  INVALID_CURSOR: 'INVALID_CURSOR',

  /** Limite de requisições excedido. */
  RATE_LIMITED: 'RATE_LIMITED',

  /** Falha não prevista. Nunca expõe detalhe interno ao cliente. */
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  /** Dependência externa indisponível (banco, storage, provedor de auth). */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
