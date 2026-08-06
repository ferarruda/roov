import { z } from 'zod';

/**
 * Contrato de ambiente da API.
 *
 * Regra: a aplicação NUNCA sobe com ambiente inválido. É preferível falhar no
 * boot, de forma barulhenta e legível, do que descobrir uma variável ausente
 * em produção, no meio de uma requisição, como `undefined`.
 *
 * Também não existe valor padrão para segredo ou endereço de banco: default
 * silencioso em configuração sensível é como um bug entra em produção
 * disfarçado de conveniência.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  /**
   * Origens do CORS. Sem default permissivo de propósito: `*` numa API que
   * carrega token de usuário é falha de segurança, não conveniência.
   */
  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS é obrigatório. Ex.: http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  /** Connection string da aplicação. Em produção, apontar para o pooler. */
  DATABASE_URL: z.string().url('DATABASE_URL precisa ser uma URL válida.'),

  /**
   * Connection string direta, usada só por migrations. Um pooler em modo
   * transaction não suporta os comandos DDL que o Prisma Migrate emite — por
   * isso as duas variáveis existem. Em Postgres local, são idênticas.
   */
  DIRECT_URL: z.string().url('DIRECT_URL precisa ser uma URL válida.'),

  /**
   * Segredo de assinatura dos access tokens (HS256).
   *
   * Mínimo de 32 caracteres: um segredo curto é quebrável por força bruta, e
   * quem quebra o segredo assina tokens de qualquer usuário, inclusive admin.
   * A validação garante que ninguém suba com `JWT_SECRET=secret`.
   */
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET precisa de no mínimo 32 caracteres.'),

  /**
   * Vida do access token. Curta de propósito: o access token não é revogável,
   * então a janela de uso de um token roubado é exatamente este valor.
   */
  JWT_ACCESS_TTL: z.string().default('15m'),

  /** Vida do refresh token, em dias. Este sim é revogável. */
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validador consumido pelo `ConfigModule`. Recebe `process.env` cru e devolve
 * o objeto tipado, ou lança com todos os erros de uma vez — não um por vez,
 * que obrigaria o desenvolvedor a descobrir os problemas em série.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuração de ambiente inválida:\n${details}\n\n` +
        'Confira o arquivo .env contra o .env.example.',
    );
  }

  return parsed.data;
}
