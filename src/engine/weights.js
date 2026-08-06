/**
 * Sistema Oficial de Pesos — ROOV Product, Cap. 66.
 *
 * Toda decisão de ranking do produto passa por aqui. Nenhum módulo pode
 * inventar peso próprio: se um comportamento novo precisa influenciar o
 * algoritmo, ele ganha uma entrada nesta tabela.
 */

/** Peso de cada sinal comportamental na construção do DNA do Usuário. */
export const SIGNAL_WEIGHTS = {
  experienciaVivida: 1.0, // peso muito alto
  posts: 0.9,
  agenda: 0.75,
  pesquisaRecente: 0.7, // peso alto
  favorito: 0.6,
  quero: 0.5, // lugar salvo — peso médio
  comunidade: 0.4,
  curtida: 0.2, // peso baixo
  ignorado: -0.35, // peso negativo
};

/**
 * Pesos do Motor de Recomendação (Cap. 56).
 * `momento` pesa alto de propósito: Cap. 68 diz que o DNA do Momento vence o
 * histórico quando há conflito.
 */
export const RECOMMENDATION_WEIGHTS = {
  affinity: 0.34, // DNA Usuário × DNA Local
  moment: 0.28, // DNA Momento × DNA Local
  proximity: 0.18, // localização — vence histórico quando o usuário está longe
  novelty: 0.12, // descoberta > repetição (Cap. 71)
  social: 0.08, // movimento da comunidade — nunca é o fator principal
};

/** Pesos do Algoritmo Feed (Cap. 62). Feed cronológico puro é proibido. */
export const FEED_WEIGHTS = {
  relevance: 0.34,
  compatibility: 0.26,
  recency: 0.2,
  distance: 0.12,
  diversity: 0.08,
};

/** Algoritmo Comunidades (Cap. 61) — nº de membros nunca é fator principal. */
export const COMMUNITY_WEIGHTS = {
  dnaAffinity: 0.45,
  interests: 0.25,
  location: 0.22,
  size: 0.08,
};

/** Quanto uma tag de post pesa ao consolidar o DNA de um lugar (Cap. 58). */
export const DNA_GROUP_WEIGHTS = {
  ambiente: 1.0,
  vibe: 1.0,
  publico: 0.8,
  perfil: 0.8,
  ocasiao: 0.5,
  momento: 0.5,
};

/** Diversidade obrigatória: no máximo N lugares da mesma categoria seguidos. */
export const MAX_SAME_CATEGORY_STREAK = 2;
