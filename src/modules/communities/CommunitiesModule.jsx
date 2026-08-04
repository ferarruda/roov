/**
 * Comunidades — ROOV Product, Cap. 16, 21 e 61.
 *
 * A ordem da lista vem do Algoritmo Comunidades: afinidade de DNA, interesses e
 * localização. Número de membros nunca é o fator principal — ele entra com peso
 * 0.08 só para desempatar.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Users } from 'lucide-react';
import { SearchBar } from '../../components/SearchBar.jsx';
import { SegmentedTabs, EmptyState } from '../../components/ui/primitives.jsx';
import { rankCommunities } from '../../engine/recommendation.js';
import { CATEGORY_BY_ID } from '../../domain/taxonomy.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const TABS = [
  { id: 'para-voce', label: 'Para você' },
  { id: 'minhas', label: 'Minhas' },
];

export function CommunitiesModule() {
  const { communities, userDna, user } = useRoov();
  const [tab, setTab] = useState('para-voce');

  const ranked = useMemo(
    () => rankCommunities(communities, { userDna, userCity: user?.city ?? 'São Paulo' }),
    [communities, userDna, user],
  );

  const list = tab === 'minhas' ? ranked.filter((r) => r.community.isMember) : ranked;

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-3 px-4 pb-3 pt-3">
        <SearchBar />
        <SegmentedTabs value={tab} onChange={setTab} options={TABS} />
      </header>

      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-4 safe-bottom">
        {list.length === 0 ? (
          <EmptyState
            emoji="👥"
            title="Você ainda não entrou em nenhuma comunidade"
            message="Comunidades são o jeito mais rápido de encontrar quem gosta do que você gosta."
          />
        ) : (
          list.map(({ community, reasons }) => (
            <CommunityCard key={community.id} community={community} reasons={reasons} />
          ))
        )}
      </div>
    </div>
  );
}

export function CommunityCard({ community, reasons = [] }) {
  const { actions } = useRoov();
  const meta = CATEGORY_BY_ID[community.category];

  return (
    <article className="glass overflow-hidden rounded-2xl">
      <Link to={`/comunidade/${community.id}`} className="block">
        <div className="relative h-28">
          <img src={community.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-base font-semibold">{community.name}</h3>
                {community.type === 'privada' && (
                  <Lock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                )}
              </div>
              <p className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {community.membersCount.toLocaleString('pt-BR')}
                </span>
                <span>·</span>
                <span>{community.postsToday} posts hoje</span>
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-1 text-[10px] font-medium"
              style={{ background: `${meta?.hex}33`, color: meta?.hex }}
            >
              {meta?.short}
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-3">
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          {community.description}
        </p>

        {reasons.length > 0 && (
          <p className="text-[11px] text-[var(--muted-foreground)]">· {reasons.join(' · ')}</p>
        )}

        <button
          type="button"
          onClick={() => actions.toggleCommunity(community.id, community.name, community.isMember)}
          className={`w-full rounded-full py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
            community.isMember
              ? 'border border-white/15 bg-white/5 text-[var(--foreground)]'
              : 'roov-gradient text-white'
          }`}
        >
          {community.isMember ? 'Participando' : community.type === 'privada' ? 'Pedir para entrar' : 'Entrar'}
        </button>
      </div>
    </article>
  );
}
