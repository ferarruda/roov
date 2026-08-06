/**
 * Card de experiência do Feed — ROOV Product, Cap. 19.
 *
 * Um post nunca é "uma foto": é uma experiência vivida em um lugar. Por isso o
 * lugar aparece com o mesmo destaque do autor, e as tags do post ficam
 * visíveis — são elas que constroem o DNA daquele lugar.
 */

import { Link } from 'react-router-dom';
import { Bookmark, Heart, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { useRoov } from '../state/RoovProvider.jsx';
import { usersService } from '../services/index.js';
import { tag } from '../domain/taxonomy.js';
import { formatDistance } from '../engine/recommendation.js';

function timeAgo(iso) {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}min`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const days = Math.round(mins / 1440);
  if (days < 7) return `${days}d`;
  return `${Math.round(days / 7)}sem`;
}

export function PostCard({ post, place }) {
  const { library, likedPostIds, actions } = useRoov();
  const author = usersService.byIdSync(post.authorId);
  const liked = likedPostIds.includes(post.id);
  const saved = place ? library.has(place.id, 'quero') : false;

  return (
    <article className="glass overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 p-3">
        <img
          src={author?.avatar}
          alt={author?.name}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{author?.name}</p>
          {place && (
            <Link
              to={`/lugar/${place.id}`}
              className="flex items-center gap-1 truncate text-[11px] text-[var(--muted-foreground)]"
            >
              <MapPin className="h-3 w-3 shrink-0" />
              {place.name} · {place.neighborhood}
            </Link>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
          {timeAgo(post.createdAt)}
        </span>
      </header>

      <Link to={place ? `/lugar/${place.id}` : '#'} className="block">
        <img
          src={post.media[0]}
          alt={post.caption.slice(0, 60)}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover"
        />
      </Link>

      <div className="space-y-3 p-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => actions.toggleLike(post.id)}
            aria-pressed={liked}
            aria-label="Curtir"
            className="flex items-center gap-1.5 text-sm transition active:scale-95"
            style={liked ? { color: 'var(--lib-favorito)' } : undefined}
          >
            <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
            {post.likesCount.toLocaleString('pt-BR')}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <MessageCircle className="h-5 w-5" />
            {post.commentsCount}
          </span>
          <button
            type="button"
            aria-label="Compartilhar"
            onClick={() => actions.toast('Link da experiência copiado')}
            className="text-[var(--muted-foreground)] transition active:scale-95"
          >
            <Share2 className="h-5 w-5" />
          </button>
          {place && (
            <button
              type="button"
              aria-label="Salvar em Quero Conhecer"
              onClick={() => actions.toggleLibrary(place.id, 'quero', 'Quero Conhecer')}
              className="ml-auto transition active:scale-95"
              style={saved ? { color: 'var(--lib-quero)' } : { color: 'var(--muted-foreground)' }}
            >
              <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed">{post.caption}</p>

        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 5).map((id) => {
            const t = tag(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]"
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </span>
            );
          })}
        </div>

        {place && (
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Estas tags alimentam o DNA de {place.name} · {formatDistance(place.distanceKm)} de você
          </p>
        )}
      </div>
    </article>
  );
}
