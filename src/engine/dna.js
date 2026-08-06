/**
 * Motores de DNA — ROOV Product, Cap. 12, 41, 57 e 58.
 *
 * Três DNAs, um único formato: lista de tags com peso normalizado por grupo.
 * O DNA nunca é editado à mão — sempre derivado de comportamento e de posts.
 */

import { DNA_GROUP_WEIGHTS, SIGNAL_WEIGHTS } from './weights.js';
import { TAG_GROUPS, tag } from '../domain/taxonomy.js';

const GROUP_OF_TAG = (() => {
  const map = {};
  for (const group of TAG_GROUPS) {
    for (const t of group.tags) map[t.id] = group.key;
  }
  return map;
})();

/** Grupos que compõem o DNA exibido de um lugar (Cap. 12). */
const DNA_GROUPS = ['ambiente', 'vibe', 'publico', 'perfil'];

function normalize(counts) {
  const max = Math.max(...Object.values(counts), 1);
  return Object.entries(counts)
    .map(([id, value]) => ({ id, weight: value / max }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * DNA do Local — consolida as tags dos posts do lugar.
 * Posts → Tags → Peso → Consolidação → DNA (Cap. 58).
 *
 * @param {import('../domain/types.js').Post[]} posts posts do lugar
 * @returns {import('../domain/types.js').Dna}
 */
export function buildPlaceDna(posts) {
  /** @type {Record<string, Record<string, number>>} */
  const buckets = { ambiente: {}, vibe: {}, publico: {}, perfil: {} };

  for (const post of posts) {
    // Posts mais recentes pesam mais: o DNA acompanha o lugar mudando de fase.
    const ageDays = daysSince(post.createdAt);
    const recency = 1 / (1 + ageDays / 180);

    for (const tagId of post.tags) {
      const group = GROUP_OF_TAG[tagId];
      if (!DNA_GROUPS.includes(group)) continue;
      const w = (DNA_GROUP_WEIGHTS[group] ?? 0.5) * recency;
      buckets[group][tagId] = (buckets[group][tagId] ?? 0) + w;
    }
  }

  return {
    ambiente: normalize(buckets.ambiente).slice(0, 4),
    vibe: normalize(buckets.vibe).slice(0, 4),
    publico: normalize(buckets.publico).slice(0, 3),
    perfil: normalize(buckets.perfil).slice(0, 3),
    contributions: posts.length,
  };
}

/**
 * Achata um DNA em um mapa `tagId -> peso`, para cálculo de afinidade.
 * @param {import('../domain/types.js').Dna} dna
 */
export function flattenDna(dna) {
  /** @type {Record<string, number>} */
  const flat = {};
  for (const group of DNA_GROUPS) {
    for (const ref of dna?.[group] ?? []) {
      flat[ref.id] = Math.max(flat[ref.id] ?? 0, ref.weight);
    }
  }
  return flat;
}

/**
 * As N tags mais fortes do DNA, prontas para exibição no Place Card.
 * Nunca retorna porcentagem — só identidade (Cap. 12).
 */
export function topDnaTags(dna, limit = 5) {
  if (!dna) return [];
  const pool = DNA_GROUPS.flatMap((group) =>
    (dna[group] ?? []).map((ref) => ({ ...ref, group })),
  );
  return pool
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((ref) => ({ ...tag(ref.id), group: ref.group, weight: ref.weight }));
}

/**
 * DNA do Usuário — Cap. 57. Construído observando, nunca perguntando.
 *
 * @param {Object} signals
 * @param {import('../domain/types.js').Place[]} signals.livedPlaces  experiências vividas
 * @param {import('../domain/types.js').Place[]} signals.favoritePlaces
 * @param {import('../domain/types.js').Place[]} signals.wantPlaces
 * @param {import('../domain/types.js').Place[]} signals.agendaPlaces
 * @param {string[]} signals.searches  termos pesquisados recentemente
 * @param {string[]} signals.dismissed ids de lugares ignorados
 */
export function buildUserDna(signals) {
  const {
    livedPlaces = [],
    favoritePlaces = [],
    wantPlaces = [],
    agendaPlaces = [],
    searches = [],
    dismissedPlaces = [],
  } = signals;

  /** @type {Record<string, number>} */
  const scores = {};
  /** @type {Record<string, number>} */
  const categories = {};

  const absorb = (places, weight) => {
    for (const place of places) {
      categories[place.category] = (categories[place.category] ?? 0) + weight;
      const flat = flattenDna(place.dna);
      for (const [tagId, tagWeight] of Object.entries(flat)) {
        scores[tagId] = (scores[tagId] ?? 0) + tagWeight * weight;
      }
    }
  };

  absorb(livedPlaces, SIGNAL_WEIGHTS.experienciaVivida);
  absorb(favoritePlaces, SIGNAL_WEIGHTS.favorito);
  absorb(wantPlaces, SIGNAL_WEIGHTS.quero);
  absorb(agendaPlaces, SIGNAL_WEIGHTS.agenda);
  absorb(dismissedPlaces, SIGNAL_WEIGHTS.ignorado);

  // Pesquisa recente tem peso alto e é o sinal mais volátil do sistema.
  for (const term of searches.slice(0, 8)) {
    const normalized = term.toLowerCase();
    for (const group of TAG_GROUPS) {
      for (const t of group.tags) {
        if (normalized.includes(t.label.toLowerCase())) {
          scores[t.id] = (scores[t.id] ?? 0) + SIGNAL_WEIGHTS.pesquisaRecente;
        }
      }
    }
  }

  const ranked = Object.entries(scores)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const max = ranked[0]?.[1] ?? 1;
  const affinities = Object.fromEntries(ranked.map(([id, value]) => [id, value / max]));

  const dominantCategory =
    Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'gastronomia';

  return {
    affinities,
    topTags: ranked.slice(0, 6).map(([id]) => tag(id)),
    dominantCategory,
    signalCount: livedPlaces.length + favoritePlaces.length + wantPlaces.length,
    summary: describeUser(ranked.map(([id]) => id)),
  };
}

const USER_ARCHETYPES = [
  { tags: ['sofisticado', 'exclusivo'], label: 'Buscador de experiências refinadas' },
  { tags: ['autentico', 'alternativo'], label: 'Explorador de cultura local' },
  { tags: ['tranquilo', 'zen'], label: 'Apreciador de momentos zen' },
  { tags: ['animado', 'festivo'], label: 'Energia de vida noturna' },
  { tags: ['contemplativo', 'inspirador'], label: 'Viajante contemplativo' },
  { tags: ['ao-ar-livre', 'aventureiro'], label: 'Explorador ao ar livre' },
  { tags: ['romantico', 'intimista'], label: 'Curador de momentos a dois' },
];

function describeUser(topTagIds) {
  const head = topTagIds.slice(0, 4);
  const match = USER_ARCHETYPES.find((a) => a.tags.some((t) => head.includes(t)));
  return match?.label ?? 'Explorador de experiências únicas';
}

/**
 * Afinidade entre dois DNAs (0–1). É o coração de toda recomendação.
 * Usa cosseno sobre o vetor de tags — tags em comum com peso alto nos dois
 * lados puxam o score para cima.
 */
export function dnaAffinity(userAffinities, placeDna) {
  const place = flattenDna(placeDna);
  const ids = Object.keys(place);
  if (ids.length === 0) return 0;

  let dot = 0;
  let normPlace = 0;
  let normUser = 0;

  for (const id of ids) {
    const u = userAffinities[id] ?? 0;
    dot += u * place[id];
    normPlace += place[id] ** 2;
    normUser += u ** 2;
  }
  // Só o que o usuário demonstrou interesse conta na norma dele.
  for (const [id, value] of Object.entries(userAffinities)) {
    if (!(id in place)) normUser += value ** 2;
  }

  if (normPlace === 0 || normUser === 0) return 0;
  return dot / (Math.sqrt(normPlace) * Math.sqrt(normUser));
}

/** Tags que o usuário e o lugar têm em comum — vira o "porque combina". */
export function sharedDnaTags(userAffinities, placeDna, limit = 3) {
  const place = flattenDna(placeDna);
  return Object.keys(place)
    .filter((id) => (userAffinities[id] ?? 0) > 0.25)
    .sort((a, b) => (userAffinities[b] ?? 0) * place[b] - (userAffinities[a] ?? 0) * place[a])
    .slice(0, limit)
    .map(tag);
}

function daysSince(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, (Date.now() - then) / 86_400_000);
}
