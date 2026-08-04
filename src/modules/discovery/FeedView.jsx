/**
 * Feed — ROOV Product, Cap. 19. Descoberta social.
 *
 * A ordem vem do Algoritmo Feed (Cap. 62): relevância, compatibilidade,
 * recência, distância e diversidade. Feed cronológico puro é proibido.
 */

import { useMemo } from 'react';
import { PostCard } from '../../components/PostCard.jsx';
import { EmptyState } from '../../components/ui/primitives.jsx';
import { rankFeed } from '../../engine/recommendation.js';
import { useRoov } from '../../state/RoovProvider.jsx';

export function FeedView({ visiblePlaceIds }) {
  const { posts, placeById, userDna, moment } = useRoov();

  const ranked = useMemo(() => {
    // O feed respeita os filtros globais: se o usuário filtrou "Gastronomia"
    // no mapa, o feed mostra experiências de gastronomia (Regra 07).
    const scoped = visiblePlaceIds
      ? posts.filter((post) => visiblePlaceIds.has(post.placeId))
      : posts;
    return rankFeed(scoped, {
      placeById,
      userAffinities: userDna.affinities,
      moment,
    });
  }, [posts, placeById, userDna, moment, visiblePlaceIds]);

  if (!ranked.length) {
    return (
      <EmptyState
        emoji="📷"
        title="Nenhuma experiência com esses filtros"
        message="Afrouxe os filtros ou seja o primeiro a publicar algo por aqui."
      />
    );
  }

  return (
    <div className="space-y-4 px-4 pb-6">
      {ranked.map(({ post, place }) => (
        <PostCard key={post.id} post={post} place={place} />
      ))}
    </div>
  );
}
