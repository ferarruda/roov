/**
 * Módulo de Descoberta — reúne Mapa, Feed e Explorar sob a mesma aba.
 *
 * Cap. 8 define exatamente estas três abas internas, e Cap. 5.3 diz que os três
 * caminhos convergem para o mesmo destino: o ROOV Place Card. Por isso os três
 * compartilham o mesmo header, a mesma pesquisa e o mesmo conjunto de filtros.
 */

import { useMemo, useState } from 'react';
import { Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../../components/SearchBar.jsx';
import {
  ActiveFilterChips,
  CategoryRail,
  FilterButton,
  FilterSheet,
} from '../../components/FilterSystem.jsx';
import { SegmentedTabs, Skeleton } from '../../components/ui/primitives.jsx';
import { applyFilters } from '../../engine/recommendation.js';
import { useRoov } from '../../state/RoovProvider.jsx';
import { MapView } from './MapView.jsx';
import { FeedView } from './FeedView.jsx';
import { ExploreView } from './ExploreView.jsx';

const VIEWS = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'feed', label: 'Feed' },
  { id: 'explorar', label: 'Explorar' },
];

export function DiscoveryModule() {
  const { ready, places, filters, library, user, moment } = useRoov();
  const [view, setView] = useState('mapa');
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () => applyFilters(places, filters, { library }),
    [places, filters, library],
  );

  const visiblePlaceIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);

  return (
    <div className="flex h-full flex-col">
      <header className="z-40 space-y-2 px-4 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <SearchBar />
          <FilterButton onClick={() => setFilterOpen(true)} />
          <Link to="/perfil" className="shrink-0">
            <img
              src={user?.avatar}
              alt="Seu perfil"
              className="h-11 w-11 rounded-full border-2 border-[#8B5CFF] object-cover"
            />
          </Link>
        </div>

        <CategoryRail />
        <ActiveFilterChips />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
            <Navigation className="h-3 w-3" />
            {moment.city}
          </span>
          <SegmentedTabs
            value={view}
            onChange={setView}
            options={VIEWS}
            className="w-[210px]"
          />
        </div>
      </header>

      <div className="scrollbar-hide relative flex-1 overflow-y-auto safe-bottom">
        {!ready ? (
          <LoadingList />
        ) : view === 'mapa' ? (
          <div className="h-full min-h-[520px]">
            <MapView places={filtered} />
          </div>
        ) : view === 'feed' ? (
          <FeedView visiblePlaceIds={visiblePlaceIds} />
        ) : (
          <ExploreView places={filtered} />
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={filtered.length}
      />
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-4 px-4 pt-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-56 w-full rounded-2xl" />
      ))}
    </div>
  );
}
