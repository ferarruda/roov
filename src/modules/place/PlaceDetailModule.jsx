/**
 * Ficha do Lugar — destino comum de todos os fluxos de descoberta (Cap. 5.3).
 *
 * Ordem da página segue o Place Card completo (Cap. 13): galeria → identidade
 * → DNA ROOV → experiências da comunidade → lugares com DNA parecido.
 * Nunca exibe nota, estrela ou porcentagem.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Share2 } from 'lucide-react';
import { DetailHeader } from '../../components/AppShell.jsx';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { DnaPanel } from '../../components/DnaStrip.jsx';
import { PostCard } from '../../components/PostCard.jsx';
import { EmptyState, GhostButton, Skeleton } from '../../components/ui/primitives.jsx';
import { placesService, postsService } from '../../services/index.js';
import { experienceTitle } from '../../engine/recommendation.js';
import { isOpenAt } from '../../engine/moment.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function PlaceDetailModule() {
  const { id } = useParams();
  const { placeById, moment, actions } = useRoov();
  const [place, setPlace] = useState(placeById[id] ?? null);
  const [posts, setPosts] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPlace(placeById[id] ?? null);
    setPhotoIndex(0);
    let cancelled = false;
    Promise.all([placesService.byId(id), postsService.byPlace(id), placesService.similarTo(id)]).then(
      ([fresh, placePosts, similarPlaces]) => {
        if (cancelled) return;
        if (fresh) setPlace(fresh);
        setPosts(placePosts);
        setSimilar(similarPlaces);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, placeById]);

  if (!place) {
    return (
      <div>
        <DetailHeader title="Carregando" />
        <div className="space-y-4 p-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const open = isOpenAt(place.hours, moment.hour, moment.weekday);

  return (
    <div className="scrollbar-hide h-full overflow-y-auto pb-10">
      <DetailHeader
        title={place.name}
        right={
          <button
            type="button"
            aria-label="Compartilhar"
            onClick={() => actions.toast('Link do lugar copiado')}
            className="glass flex h-9 w-9 items-center justify-center rounded-full"
          >
            <Share2 className="h-4 w-4" />
          </button>
        }
      />

      {/* Galeria */}
      <div className="relative">
        <img
          src={place.photos[photoIndex]}
          alt={place.name}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505] to-transparent" />
        {place.photos.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {place.photos.map((photo, i) => (
              <button
                key={photo}
                type="button"
                aria-label={`Foto ${i + 1}`}
                onClick={() => setPhotoIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-7 px-4 pt-4">
        {/* A experiência antes do estabelecimento (Regra 01) */}
        <p className="text-xs font-medium text-[var(--muted-foreground)]">
          {experienceTitle(place, moment)}
        </p>

        <PlaceCard place={place} variant="full" />

        <section>
          <h2 className="mb-3 text-base font-semibold">DNA ROOV</h2>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            A identidade deste lugar segundo quem já esteve aqui. Não é nota, é retrato.
          </p>
          <DnaPanel dna={place.dna} />
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Funcionamento</h2>
          <div className="glass space-y-2 rounded-2xl p-4 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <span className={open ? 'text-[var(--lib-vivido)]' : ''}>
                {open ? 'Aberto agora' : 'Fechado agora'}
              </span>
              <span className="text-[var(--muted-foreground)]">
                · {place.hours.open} às {place.hours.close}
              </span>
            </p>
            {place.hours.closedOn?.length > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Fechado {place.hours.closedOn.map((d) => WEEKDAYS[d]).join(', ')}
              </p>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              {place.neighborhood} · {place.city} — {place.state}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Experiências aqui</h2>
            <Link to="/criar" className="text-xs text-[var(--muted-foreground)] underline">
              publicar a sua
            </Link>
          </div>
          {posts === null ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : posts.length === 0 ? (
            <EmptyState
              emoji="🎬"
              title="Ninguém contou essa história ainda"
              message="Seja a primeira pessoa a registrar uma experiência neste lugar."
              action={
                <Link to="/criar" className="w-full max-w-[220px]">
                  <GhostButton>Criar experiência</GhostButton>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} place={place} />
              ))}
            </div>
          )}
        </section>

        {similar.length > 0 && (
          <section>
            <h2 className="mb-1 text-base font-semibold">DNA parecido</h2>
            <p className="mb-3 text-xs text-[var(--muted-foreground)]">
              Lugares diferentes que entregam uma sensação próxima.
            </p>
            <div className="space-y-2">
              {similar.map((similarPlace) => (
                <PlaceCard key={similarPlace.id} place={similarPlace} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
