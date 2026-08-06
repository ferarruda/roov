/**
 * Sistema Oficial de Tags e de Filtros — ROOV Product, Cap. 10 e 11.
 *
 * Tags nunca são texto livre: são entidades com id, label, emoji, grupo e peso.
 * Toda tag alimenta o DNA ROOV (Cap. 12), então esta é a única fonte de verdade
 * para categorias, tipos de local, ambiente, vibe, público e perfil.
 */

/** @typedef {'entretenimento'|'gastronomia'|'natureza'|'passeios'} CategoryId */

/** Categoria Principal — sempre obrigatória em um post (Cap. 11). */
export const CATEGORIES = [
  {
    id: 'entretenimento',
    label: 'Entretenimento',
    short: 'Entretê',
    color: 'var(--cat-entretenimento)',
    hex: '#8B5CFF',
    icon: 'Wine',
  },
  {
    id: 'gastronomia',
    label: 'Gastronomia',
    short: 'Gastro',
    color: 'var(--cat-gastronomia)',
    hex: '#FF2D8D',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'natureza',
    label: 'Natureza & Outdoor',
    short: 'Natureza',
    color: 'var(--cat-natureza)',
    hex: '#FF7A1A',
    icon: 'Trees',
  },
  {
    id: 'passeios',
    label: 'Passeios & Turismo',
    short: 'Passeios',
    color: 'var(--cat-passeios)',
    hex: '#FFC83D',
    icon: 'Camera',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/** Tipo do Local — depende da categoria principal. */
export const PLACE_TYPES = {
  entretenimento: ['Bar', 'Rooftop', 'Balada', 'Lounge', 'Casa de Show', 'Cervejaria', 'Pub'],
  gastronomia: [
    'Restaurante',
    'Fine Dining',
    'Café',
    'Padaria',
    'Mercado',
    'Comida de Rua',
    'Confeitaria',
  ],
  natureza: ['Parque', 'Praia', 'Trilha', 'Cachoeira', 'Mirante', 'Lagoa', 'Jardim Botânico'],
  passeios: ['Museu', 'Teatro', 'Ponto Turístico', 'Arte de Rua', 'Centro Histórico', 'Galeria'],
};

/**
 * Ambiente — como o lugar é fisicamente.
 * @type {{id:string,label:string,emoji:string}[]}
 */
export const AMBIENTES = [
  { id: 'aconchegante', label: 'Aconchegante', emoji: '🛋️' },
  { id: 'sofisticado', label: 'Sofisticado', emoji: '✨' },
  { id: 'rustico', label: 'Rústico', emoji: '🪵' },
  { id: 'moderno', label: 'Moderno', emoji: '🏙️' },
  { id: 'ao-ar-livre', label: 'Ao Ar Livre', emoji: '🌳' },
  { id: 'intimista', label: 'Intimista', emoji: '🎶' },
  { id: 'movimentado', label: 'Movimentado', emoji: '👥' },
  { id: 'reservado', label: 'Reservado', emoji: '🕯️' },
  { id: 'historico', label: 'Histórico', emoji: '🏛️' },
  { id: 'area-verde', label: 'Área Verde', emoji: '🍃' },
  { id: 'rooftop', label: 'Rooftop', emoji: '🌇' },
  { id: 'aquatico', label: 'Aquático', emoji: '🌊' },
];

/** Vibe & Sensação — o que se sente no lugar. */
export const VIBES = [
  { id: 'romantico', label: 'Romântico', emoji: '❤️' },
  { id: 'animado', label: 'Animado', emoji: '🎉' },
  { id: 'tranquilo', label: 'Tranquilo', emoji: '🌿' },
  { id: 'energizante', label: 'Energizante', emoji: '⚡' },
  { id: 'contemplativo', label: 'Contemplativo', emoji: '🌅' },
  { id: 'zen', label: 'Zen', emoji: '🧘' },
  { id: 'festivo', label: 'Festivo', emoji: '🥳' },
  { id: 'relaxante', label: 'Relaxante', emoji: '😌' },
  { id: 'inspirador', label: 'Inspirador', emoji: '💡' },
  { id: 'memoravel', label: 'Memorável', emoji: '🏆' },
  { id: 'surpreendente', label: 'Surpreendente', emoji: '🤩' },
  { id: 'divertido', label: 'Divertido', emoji: '😄' },
  { id: 'aventureiro', label: 'Aventureiro', emoji: '🌎' },
  { id: 'nostalgico', label: 'Nostálgico', emoji: '📻' },
];

/** Público — para quem o lugar funciona. */
export const PUBLICOS = [
  { id: 'casal', label: 'Casal', emoji: '💑' },
  { id: 'amigos', label: 'Amigos', emoji: '🤝' },
  { id: 'familia', label: 'Família', emoji: '👨‍👩‍👧' },
  { id: 'sozinho', label: 'Sozinho', emoji: '🚶' },
  { id: 'pet-friendly', label: 'Pet Friendly', emoji: '🐶' },
  { id: 'kids', label: 'Kids', emoji: '🧒' },
  { id: 'lgbtqia', label: 'LGBTQIA+', emoji: '🏳️‍🌈' },
  { id: 'grupos', label: 'Grupos', emoji: '👯' },
];

/** Perfil do Local — posicionamento. */
export const PERFIS = [
  { id: 'autentico', label: 'Autêntico', emoji: '🧭' },
  { id: 'exclusivo', label: 'Exclusivo', emoji: '👑' },
  { id: 'alternativo', label: 'Alternativo', emoji: '🌈' },
  { id: 'descolado', label: 'Descolado', emoji: '🎨' },
  { id: 'iconico', label: 'Icônico', emoji: '📸' },
  { id: 'escondido', label: 'Hidden Gem', emoji: '💎' },
  { id: 'tematico', label: 'Temático', emoji: '🎭' },
  { id: 'natural', label: 'Natural', emoji: '🌺' },
];

/** Ocasião — tag opcional (Cap. 11). */
export const OCASIOES = [
  { id: 'date', label: 'Date', emoji: '💘' },
  { id: 'aniversario', label: 'Aniversário', emoji: '🎂' },
  { id: 'negocios', label: 'Negócios', emoji: '💼' },
  { id: 'comemoracao', label: 'Comemoração', emoji: '🍾' },
  { id: 'role-casual', label: 'Rolê casual', emoji: '🙌' },
  { id: 'turismo', label: 'Turismo', emoji: '🧳' },
];

/** Momento Ideal — tag opcional, conversa direto com o DNA do Momento. */
export const MOMENTOS = [
  { id: 'manha', label: 'Manhã', emoji: '🌅' },
  { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
  { id: 'tarde', label: 'Tarde', emoji: '🌤️' },
  { id: 'golden-hour', label: 'Golden Hour', emoji: '🌇' },
  { id: 'noite', label: 'Noite', emoji: '🌆' },
  { id: 'madrugada', label: 'Madrugada', emoji: '🌃' },
];

/** Faixa de preço — 1 a 4. Nunca é nota, é contexto financeiro. */
export const PRICE_RANGES = [
  { id: 1, label: '$', hint: 'Econômico' },
  { id: 2, label: '$$', hint: 'Moderado' },
  { id: 3, label: '$$$', hint: 'Caro' },
  { id: 4, label: '$$$$', hint: 'Premium' },
];

/**
 * Classificação da Biblioteca — Cap. 14.
 * É filtro (Cap. 10) e é ação no Place Card (Cap. 13) ao mesmo tempo.
 */
export const LIBRARY_KINDS = [
  {
    id: 'favorito',
    label: 'Favoritos',
    singular: 'Favorito',
    emoji: '❤️',
    color: 'var(--lib-favorito)',
    icon: 'Heart',
  },
  {
    id: 'quero',
    label: 'Quero Conhecer',
    singular: 'Quero Conhecer',
    emoji: '⭐',
    color: 'var(--lib-quero)',
    icon: 'Star',
  },
  {
    id: 'vivido',
    label: 'Experiências Vividas',
    singular: 'Vivido',
    emoji: '✅',
    color: 'var(--lib-vivido)',
    icon: 'CircleCheck',
  },
];

export const LIBRARY_BY_ID = Object.fromEntries(LIBRARY_KINDS.map((k) => [k.id, k]));

/** Ordenação — última etapa do Sistema Oficial de Filtros. */
export const SORT_OPTIONS = [
  { id: 'relevancia', label: 'Relevância' },
  { id: 'distancia', label: 'Mais perto' },
  { id: 'novidade', label: 'Novidades' },
  { id: 'movimento', label: 'Em alta' },
];

/** Índice global de tags: usado pelo DNA e pela pesquisa. */
export const TAG_INDEX = Object.fromEntries(
  [...AMBIENTES, ...VIBES, ...PUBLICOS, ...PERFIS, ...OCASIOES, ...MOMENTOS].map((t) => [t.id, t]),
);

export const TAG_GROUPS = [
  { key: 'ambiente', label: 'Ambiente', tags: AMBIENTES, required: true },
  { key: 'vibe', label: 'Vibe & Sensação', tags: VIBES, required: true },
  { key: 'publico', label: 'Público', tags: PUBLICOS, required: true },
  { key: 'perfil', label: 'Perfil do Local', tags: PERFIS, required: true },
  { key: 'ocasiao', label: 'Ocasião', tags: OCASIOES, required: false },
  { key: 'momento', label: 'Momento Ideal', tags: MOMENTOS, required: false },
];

/** Resolve uma tag por id, em qualquer grupo. */
export function tag(id) {
  return TAG_INDEX[id] ?? { id, label: id, emoji: '🏷️' };
}

/** Estado vazio canônico do Sistema Oficial de Filtros. */
export const EMPTY_FILTERS = {
  query: '',
  category: null,
  placeTypes: [],
  ambiente: [],
  vibe: [],
  publico: [],
  perfil: [],
  biblioteca: [],
  priceRange: [],
  maxDistanceKm: 25,
  sort: 'relevancia',
};

/** Quantos filtros o usuário aplicou — alimenta o badge do botão de filtro. */
export function countActiveFilters(filters) {
  let n = 0;
  if (filters.category) n += 1;
  n += filters.placeTypes.length;
  n += filters.ambiente.length;
  n += filters.vibe.length;
  n += filters.publico.length;
  n += filters.perfil.length;
  n += filters.biblioteca.length;
  n += filters.priceRange.length;
  if (filters.maxDistanceKm !== EMPTY_FILTERS.maxDistanceKm) n += 1;
  if (filters.sort !== EMPTY_FILTERS.sort) n += 1;
  return n;
}
