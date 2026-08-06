/**
 * @roov/core — domínio e motores do ROOV.
 *
 * Este pacote é a ÚNICA implementação da inteligência do produto. Ele é
 * consumido pelo frontend (apps/web) e pela API (apps/api). Nunca deve existir
 * uma segunda cópia de qualquer algoritmo daqui.
 *
 * Invariante inegociável: este pacote é PURO.
 *   - sem NestJS, sem Prisma, sem React
 *   - sem acesso a rede, disco ou banco
 *   - sem DOM, sem `window`, sem `document`
 *   - sem `Date.now()` implícito: tempo entra como parâmetro
 *
 * O último item merece explicação: um motor que lê o relógio internamente não
 * é testável de forma determinística. Como o DNA do Momento depende de horário,
 * o instante atual precisa ser sempre um argumento.
 *
 * ESTADO: vazio de propósito. O conteúdo entra na Fase 6, quando `domain/` e
 * `engine/` migrarem de apps/web para cá, convertidos para TypeScript e
 * cobertos por testes de regressão. Ver FASE-1-DECISOES-TECNICAS.md, D2.
 */

export const CORE_VERSION = '0.1.0';
