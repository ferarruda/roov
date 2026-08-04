/**
 * Salvos — ROOV Product, Cap. 22. Organização pessoal.
 *
 * Duas abas internas, exatamente como o Cap. 8 define:
 *   Minha Biblioteca (Cap. 14) e Agenda (Cap. 15).
 *
 * "Descobrir é apenas o primeiro passo" — este módulo é o que transforma
 * intenção em planejamento.
 */

import { useMemo, useState } from 'react';
import { SearchBar } from '../../components/SearchBar.jsx';
import { FilterButton, FilterSheet } from '../../components/FilterSystem.jsx';
import { SegmentedTabs } from '../../components/ui/primitives.jsx';
import { useRoov } from '../../state/RoovProvider.jsx';
import { LibraryView } from './LibraryView.jsx';
import { AgendaView } from './AgendaView.jsx';

const TABS = [
  { id: 'biblioteca', label: 'Minha Biblioteca' },
  { id: 'agenda', label: 'Agenda' },
];

export function SavedModule() {
  const [tab, setTab] = useState('biblioteca');
  const [filterOpen, setFilterOpen] = useState(false);
  const { library, agenda } = useRoov();

  const counts = useMemo(
    () => ({
      biblioteca: Object.keys(library.byPlace).length,
      agenda: agenda.length,
    }),
    [library, agenda],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-3 px-4 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <SearchBar />
          {tab === 'biblioteca' && <FilterButton onClick={() => setFilterOpen(true)} />}
        </div>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({ ...t, label: `${t.label} · ${counts[t.id]}` }))}
        />
      </header>

      <div className="scrollbar-hide flex-1 overflow-y-auto safe-bottom">
        {tab === 'biblioteca' ? <LibraryView /> : <AgendaView />}
      </div>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}
