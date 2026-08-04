/**
 * Motor Oficial de Recomendação — ROOV Product, Cap. 56, 60 a 63 e 71.
 *
 * Regras que este arquivo é obrigado a respeitar:
 *  - a recomendação sempre começa pela experiência, nunca pelo estabelecimento;
 *  - popularidade nunca é o fator principal;
 *  - diversidade é obrigatória;
 *  - descoberta vale mais que repetição.
 */

import {
  COMMUNITY_WEIGHTS,
  FEED_WEIGHTS,
  MAX_SAME_CATEGORY_STREAK,
  RECOMMENDATION_WEIGHTS,
} from './weights.js';
import { dnaAffinity, sharedDnaTags, topDnaTags } from './dna.js';
import { isOpenAt, momentAffinity } from './moment.js';
import { CATEGORY_BY_ID, tag } from '../domain/taxonomy.js';

/**
 * Título da experiência que o lugar entrega neste momento.
 * É o que aparece antes do nome do lugar em toda recomendação.
 */
export function experienceTitle(place, moment) {
  const [first, second] = topDnaTags(place.dna, 2);
  const band = moment?.band?.id;

  if (band === 'golden-hour' && hasTag(place, 'rooftop')) return 'Ver o pôr do sol lá de cima';
  if (band === 'noite' && hasTag(place, 'festivo')) return 'Uma noite que não acaba cedo';
  if (band === 'amanhecer' && hasTag(place, 'ao-ar-livre')) return 'Começar o dia ao ar livre';
  if (hasTag(place, 'romantico')) return 'Um encontro a dois sem pressa';
  if (hasTag(place, 'zen')) return 'Desacelerar por algumas horas';
  if (place.category === 'gastronomia' && hasTag(place, 'autentico'))
    return 'Comer como quem mora aqui';
  if (place.category === 'passeios') return 'Descobrir a cidade por dentro';

  if (first && second) return `Um rolê ${first.label.toLowerCase()} e ${second.label.toLowerCase()}`;
  if (first) return `Um momento ${first.label.toLowerCase()}`;
  return `Conhecer ${place.name}`;
}

function hasTag(place, tagId) {
  return ['ambiente', 'vibe', 'publico', 'perfil'].some((g) =>
    (place.dna?.[g] ?? []).some((r) => r.id === tagId && r.weight > 0.4),
  );
}

/**
 * Pontua um lugar para o usuário no momento atual.
 *
 * @param {import('../domain/types.js').Place} place
 * @param {Object} ctx
 * @param {Record<string, number>} ctx.userAffinities
 * @param {ReturnType<import('./moment.js').buildMomentDna>} ctx.moment
 * @param {Set<string>} [ctx.knownPlaceIds] lugares que o usuário já salvou/viveu
 * @returns {import('../domain/types.js').Recommendation & {place: any, breakdown: object}}
 */
export function scorePlace(place, ctx) {
  const { userAffinities, moment, knownPlaceIds = new Set() } = ctx;

  const affinity = dnaAffinity(userAffinities, place.dna);
  const momentScore = momentAffinity(place, moment);
  const proximity = proximityScore(place.distanceKm);
  // Descoberta vale mais que repetição: o que ele já conhece perde novidade.
  const novelty = knownPlaceIds.has(place.id) ? 0.1 : freshnessScore(place);
  const social = socialScore(place);

  const score =
    affinity * RECOMMENDATION_WEIGHTS.affinity +
    momentScore * RECOMMENDATION_WEIGHTS.moment +
    proximity * RECOMMENDATION_WEIGHTS.proximity +
    novelty * RECOMMENDATION_WEIGHTS.novelty +
    social * RECOMMENDATION_WEIGHTS.social;

  return {
    placeId: place.id,
    place,
    score,
    experience: experienceTitle(place, moment),
    reasons: buildReasons(place, { userAffinities, moment, affinity, proximity }),
    breakdown: { affinity, moment: momentScore, proximity, novelty, social },
  };
}

function proximityScore(km = 0) {
  if (km <= 1) return 1;
  if (km <= 3) return 0.85;
  if (km <= 6) return 0.65;
  if (km <= 12) return 0.4;
  return 0.2;
}

function freshnessScore(place) {
  const ageDays = (Date.now() - new Date(place.createdAt).getTime()) / 86_400_000;
  if (Number.isNaN(ageDays)) return 0.5;
  if (ageDays < 30) return 1;
  if (ageDays < 120) return 0.7;
  return 0.45;
}

function socialScore(place) {
  // Log para que um lugar com 10.000 saves não esmague um com 300.
  return Math.min(1, Math.log10(1 + (place.savesCount ?? 0)) / 4);
}

/**
 * Motivos legíveis. O usuário nunca deve perceber que existe um algoritmo
 * (Cap. 71), então a explicação é sempre humana — nunca "score 0.82".
 */
function buildReasons(place, { userAffinities, moment, affinity, proximity }) {
  const reasons = [];
  const shared = sharedDnaTags(userAffinities, place.dna, 2);

  if (affinity > 0.35 && shared.length) {
    reasons.push(`Combina com seu lado ${shared.map((t) => t.label.toLowerCase()).join(' e ')}`);
  }
  if (!isOpenAt(place.hours, moment.hour, moment.weekday)) {
    reasons.push(`Fechado agora · abre às ${place.hours?.open ?? '--:--'}`);
  } else if (momentAffinity(place, moment) > 0.4) {
    reasons.push(`Faz sentido ${moment.band.label.toLowerCase()}`);
  }
  if (proximity >= 0.85) {
    reasons.push(`A ${formatDistance(place.distanceKm)} de você`);
  }
  if (reasons.length === 0) {
    reasons.push(`${CATEGORY_BY_ID[place.category]?.label ?? ''} em ${place.neighborhood}`);
  }
  return reasons;
}

export function formatDistance(km) {
  if (km == null) return '—';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * Diversidade obrigatória: reordena para não repetir a mesma categoria em
 * sequência, sem destruir a ordem de relevância.
 */
export function enforceDiversity(items, getCategory = (i) => i.place?.category) {
  const out = [];
  const pending = [...items];

  while (pending.length) {
    let index = 0;
    if (out.length >= MAX_SAME_CATEGORY_STREAK) {
      const streak = out.slice(-MAX_SAME_CATEGORY_STREAK).map(getCategory);
      const monotone = streak.every((c) => c === streak[0]);
      if (monotone) {
        const alt = pending.findIndex((i) => getCategory(i) !== streak[0]);
        if (alt > -1) index = alt;
      }
    }
    out.push(pending.splice(index, 1)[0]);
  }
  return out;
}

/**
 * Algoritmo Explorar — Cap. 60 e 63.
 * Todas as seções são dinâmicas: uma seção sem conteúdo relevante simplesmente
 * não é renderizada, em vez de virar uma lista genérica.
 */
export function buildExploreSections({ places, userAffinities, moment, knownPlaceIds, userDna }) {
  const scored = places
    .map((p) => scorePlace(p, { userAffinities, moment, knownPlaceIds }))
    .sort((a, b) => b.score - a.score);

  const openNow = scored.filter((r) => isOpenAt(r.place.hours, moment.hour, moment.weekday));

  const sections = [
    {
      id: 'agora',
      title: 'Experiências para agora',
      subtitle: moment.headline,
      items: enforceDiversity(
        [...openNow].sort((a, b) => b.breakdown.moment - a.breakdown.moment).slice(0, 6),
      ),
    },
    {
      id: 'para-voce',
      title: 'Porque combina com você',
      subtitle: userDna?.summary,
      items: enforceDiversity(
        scored.filter((r) => r.breakdown.affinity > 0.2).slice(0, 6),
      ),
    },
    {
      id: 'perto',
      title: 'Hoje perto de você',
      subtitle: moment.city,
      items: scored
        .filter((r) => (r.place.distanceKm ?? 99) <= 4)
        .sort((a, b) => a.place.distanceKm - b.place.distanceKm)
        .slice(0, 6),
    },
    {
      id: 'novidades',
      title: 'Novas descobertas',
      subtitle: 'Lugares que ainda não passaram por você',
      items: enforceDiversity(
        scored
          .filter((r) => !knownPlaceIds.has(r.placeId))
          .sort((a, b) => b.breakdown.novelty - a.breakdown.novelty || b.score - a.score)
          .slice(0, 6),
      ),
    },
    {
      id: 'em-alta',
      title: 'Em alta',
      subtitle: 'Movimento da comunidade nos últimos dias',
      items: [...scored].sort((a, b) => b.breakdown.social - a.breakdown.social).slice(0, 6),
    },
  ];

  return sections.filter((s) => s.items.length >= 2);
}

/**
 * Algoritmo Feed — Cap. 62. Feed cronológico puro é proibido.
 *
 * @param {import('../domain/types.js').Post[]} posts
 */
export function rankFeed(posts, { placeById, userAffinities, moment }) {
  const seenCategories = [];

  const scored = posts.map((post) => {
    const place = placeById[post.placeId];
    const compatibility = place ? dnaAffinity(userAffinities, place.dna) : 0;
    const relevance = place ? momentAffinity(place, moment) : 0;
    const recency = recencyScore(post.createdAt);
    const distance = proximityScore(place?.distanceKm);
    const diversity = seenCategories.includes(place?.category) ? 0.3 : 1;
    seenCategories.push(place?.category);

    const score =
      relevance * FEED_WEIGHTS.relevance +
      compatibility * FEED_WEIGHTS.compatibility +
      recency * FEED_WEIGHTS.recency +
      distance * FEED_WEIGHTS.distance +
      diversity * FEED_WEIGHTS.diversity;

    return { post, place, score };
  });

  return enforceDiversity(
    scored.sort((a, b) => b.score - a.score),
    (i) => i.place?.category,
  );
}

function recencyScore(iso) {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (Number.isNaN(hours)) return 0.5;
  if (hours < 6) return 1;
  if (hours < 24) return 0.85;
  if (hours < 72) return 0.6;
  if (hours < 168) return 0.4;
  return 0.2;
}

/**
 * Algoritmo Comunidades — Cap. 61.
 * Número de membros nunca é o fator principal.
 */
export function rankCommunities(communities, { userDna, userCity }) {
  return communities
    .map((community) => {
      const dnaScore = community.tags.reduce(
        (acc, tagId) => acc + (userDna.affinities[tagId] ?? 0),
        0,
      ) / Math.max(community.tags.length, 1);

      const interests = community.category === userDna.dominantCategory ? 1 : 0.3;
      const location = community.city === userCity ? 1 : 0.35;
      const size = Math.min(1, Math.log10(1 + community.membersCount) / 5);

      const score =
        dnaScore * COMMUNITY_WEIGHTS.dnaAffinity +
        interests * COMMUNITY_WEIGHTS.interests +
        location * COMMUNITY_WEIGHTS.location +
        size * COMMUNITY_WEIGHTS.size;

      const reasons = [];
      if (dnaScore > 0.3) {
        const match = community.tags
          .filter((t) => (userDna.affinities[t] ?? 0) > 0.3)
          .slice(0, 2)
          .map((t) => tag(t).label);
        if (match.length) reasons.push(`Fala sobre ${match.join(' e ')}`);
      }
      if (location === 1) reasons.push(`Ativa em ${community.city}`);

      return { community, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Sistema Oficial de Filtros aplicado — Cap. 10.
 * Filtros são cumulativos e valem igual em todos os módulos.
 */
export function applyFilters(places, filters, { library } = {}) {
  const query = filters.query?.trim().toLowerCase();

  let result = places.filter((place) => {
    if (filters.category && place.category !== filters.category) return false;
    if (filters.placeTypes.length && !filters.placeTypes.includes(place.placeType)) return false;
    if (filters.priceRange.length && !filters.priceRange.includes(place.priceRange)) return false;
    if ((place.distanceKm ?? 0) > filters.maxDistanceKm) return false;

    for (const group of ['ambiente', 'vibe', 'publico', 'perfil']) {
      const wanted = filters[group];
      if (!wanted?.length) continue;
      const ids = new Set((place.dna?.[group] ?? []).map((r) => r.id));
      if (!wanted.every((id) => ids.has(id))) return false;
    }

    if (filters.biblioteca.length) {
      const kinds = library?.kindsOf(place.id) ?? [];
      if (!filters.biblioteca.some((k) => kinds.includes(k))) return false;
    }

    if (query) {
      const haystack = [
        place.name,
        place.placeType,
        place.neighborhood,
        place.city,
        ...topDnaTags(place.dna, 6).map((t) => t.label),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case 'distancia':
      result = [...result].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      break;
    case 'novidade':
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'movimento':
      result = [...result].sort((a, b) => (b.savesCount ?? 0) - (a.savesCount ?? 0));
      break;
    default:
      break;
  }
  return result;
}
