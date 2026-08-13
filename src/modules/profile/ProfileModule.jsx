/**
 * Perfil — ROOV Product, Cap. 23, 38 e 53.
 *
 * Abas internas oficiais: Posts, Coleções e Visitados (Cap. 8).
 * A gamificação aparece como consequência do uso, nunca como placar — o DNA do
 * usuário é o dado mais importante da tela.
 */

import { useMemo, useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { PostCard } from '../../components/PostCard.jsx';
import { EmptyState, SegmentedTabs } from '../../components/ui/primitives.jsx';
import { useRoov } from '../../state/RoovProvider.jsx';
import { useAuth } from '../../state/AuthProvider.jsx';

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'colecoes', label: 'Coleções' },
  { id: 'visitados', label: 'Visitados' },
];

export function ProfileModule() {
  const { user, profile, posts, placeById, collections, library, userDna, actions } = useRoov();
  const { logout } = useAuth();
  const [tab, setTab] = useState('posts');

  const myPosts = useMemo(
    () => posts.filter((post) => post.authorId === user?.id),
    [posts, user],
  );

  const visited = useMemo(
    () => library.placeIdsOf('vivido').map((id) => placeById[id]).filter(Boolean),
    [library, placeById],
  );

  if (!user || !profile) return null;

  return (
    <div className="scrollbar-hide h-full overflow-y-auto safe-bottom">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-lg font-semibold">Perfil</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Sair"
            onClick={logout}
            className="glass flex h-9 w-9 items-center justify-center rounded-full"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Configurações"
            onClick={() => actions.toast('Configurações chegam na próxima sprint')}
            className="glass flex h-9 w-9 items-center justify-center rounded-full"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="space-y-6 px-4">
        <section className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-20 w-20 rounded-full border-2 border-[#8B5CFF] object-cover"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{user.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">@{user.username}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {user.city} — {user.state}
            </p>
          </div>
        </section>

        <p className="text-sm leading-relaxed">{user.bio}</p>

        {/* Nível e XP — Cap. 53 */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">
              Nível {profile.level} · {profile.levelLabel}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {profile.xp.toLocaleString('pt-BR')} XP
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="roov-gradient h-full rounded-full transition-all"
              style={{ width: `${Math.round(profile.progressToNext * 100)}%` }}
            />
          </div>
          {profile.nextLevel && (
            <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
              Faltam {(profile.nextLevel.minXp - profile.xp).toLocaleString('pt-BR')} XP para{' '}
              {profile.nextLevel.label}
            </p>
          )}
        </section>

        {/* DNA do usuário — o retrato de quem ele é dentro do produto */}
        <section className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold">Seu DNA ROOV</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{userDna.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {userDna.topTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted-foreground)]">
            Construído automaticamente pelo que você salva, vive e planeja. Nunca preenchido à mão.
          </p>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <Stat value={profile.stats.places} label="lugares" />
          <Stat value={myPosts.length} label="posts" />
          <Stat value={profile.stats.cities} label="cidades" />
          <Stat value={profile.stats.communities} label="grupos" />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Conquistas</h3>
          <div className="grid grid-cols-3 gap-2">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`glass rounded-2xl p-3 text-center ${badge.unlocked ? '' : 'opacity-45'}`}
                title={badge.description}
              >
                <div className="text-2xl">{badge.emoji}</div>
                <p className="mt-1 text-[11px] font-medium leading-tight">{badge.label}</p>
                {!badge.unlocked && badge.progress != null && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/50"
                      style={{ width: `${Math.round(badge.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <SegmentedTabs value={tab} onChange={setTab} options={TABS} />

        <div className="space-y-3 pb-4">
          {tab === 'posts' &&
            (myPosts.length === 0 ? (
              <EmptyState
                emoji="🎬"
                title="Nenhuma experiência publicada"
                message="Todo post pertence a um lugar e fortalece o DNA dele."
              />
            ) : (
              myPosts.map((post) => (
                <PostCard key={post.id} post={post} place={placeById[post.placeId]} />
              ))
            ))}

          {tab === 'colecoes' &&
            collections.map((collection) => (
              <div key={collection.id} className="glass rounded-2xl p-3">
                <p className="text-sm font-medium">
                  {collection.emoji} {collection.name}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {collection.placeIds.length} lugares
                </p>
              </div>
            ))}

          {tab === 'visitados' &&
            (visited.length === 0 ? (
              <EmptyState emoji="✅" title="Nenhuma experiência vivida marcada ainda" />
            ) : (
              visited.map((place) => (
                <PlaceCard key={place.id} place={place} variant="compact" />
              ))
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="glass rounded-2xl py-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
