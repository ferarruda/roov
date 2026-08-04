/**
 * Detalhe da Comunidade — Cap. 16 e 44.
 *
 * Uma comunidade é um recorte do produto inteiro: tem feed próprio, lugares
 * próprios e membros. Reutiliza os mesmos componentes globais, sem inventar
 * padrão novo (Cap. 8).
 */

import { useEffect, useMemo, useState } from 'react';
import { Lock, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { DetailHeader } from '../../components/AppShell.jsx';
import { PostCard } from '../../components/PostCard.jsx';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { EmptyState, SegmentedTabs, Skeleton } from '../../components/ui/primitives.jsx';
import { communitiesService } from '../../services/index.js';
import { CATEGORY_BY_ID, tag } from '../../domain/taxonomy.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'sobre', label: 'Sobre' },
];

export function CommunityDetailModule() {
  const { id } = useParams();
  const { communities, placeById, actions } = useRoov();
  const [posts, setPosts] = useState(null);
  const [tab, setTab] = useState('feed');

  const community = communities.find((c) => c.id === id);

  useEffect(() => {
    let cancelled = false;
    communitiesService.postsOf(id).then((result) => {
      if (!cancelled) setPosts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const places = useMemo(() => {
    if (!posts) return [];
    const ids = [...new Set(posts.map((p) => p.placeId))];
    return ids.map((placeId) => placeById[placeId]).filter(Boolean);
  }, [posts, placeById]);

  if (!community) {
    return (
      <div>
        <DetailHeader title="Comunidade" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const meta = CATEGORY_BY_ID[community.category];

  return (
    <div className="scrollbar-hide h-full overflow-y-auto pb-10">
      <DetailHeader title={community.name} />

      <div className="relative h-40">
        <img src={community.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{community.name}</h1>
            {community.type === 'privada' && <Lock className="h-4 w-4" />}
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-white/75">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {community.membersCount.toLocaleString('pt-BR')} membros
            </span>
            <span>·</span>
            <span style={{ color: meta?.hex }}>{meta?.label}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <button
          type="button"
          onClick={() => actions.toggleCommunity(community.id, community.name, community.isMember)}
          className={`w-full rounded-full py-3 text-sm font-semibold transition active:scale-[0.98] ${
            community.isMember
              ? 'border border-white/15 bg-white/5'
              : 'roov-gradient text-white'
          }`}
        >
          {community.isMember ? `Participando · ${community.role}` : 'Entrar na comunidade'}
        </button>

        <SegmentedTabs value={tab} onChange={setTab} options={TABS} />

        {tab === 'feed' &&
          (posts === null ? (
            <Skeleton className="h-72 w-full rounded-2xl" />
          ) : posts.length === 0 ? (
            <EmptyState emoji="💬" title="Nenhuma experiência ainda" />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} place={placeById[post.placeId]} />
              ))}
            </div>
          ))}

        {tab === 'lugares' && (
          <div className="space-y-2">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} variant="compact" />
            ))}
          </div>
        )}

        {tab === 'sobre' && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              {community.description}
            </p>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Sobre o que se fala aqui
              </p>
              <div className="flex flex-wrap gap-1.5">
                {community.tags.map((tagId) => {
                  const t = tag(tagId);
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
                    >
                      <span aria-hidden>{t.emoji}</span>
                      {t.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="glass rounded-2xl p-4 text-xs text-[var(--muted-foreground)]">
              <p>Tipo: comunidade {community.type}</p>
              <p className="mt-1">Cidade: {community.city}</p>
              <p className="mt-1">Seu papel: {community.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
