/**
 * Minha Biblioteca — ROOV Product, Cap. 14 e 42.
 *
 * Quatro compartimentos oficiais: Favoritos, Quero Conhecer, Experiências
 * Vividas e Coleções Personalizadas. Nenhum outro agrupamento é permitido.
 */

import { useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import {
  Chip,
  EmptyState,
  GhostButton,
  PrimaryButton,
  Sheet,
} from '../../components/ui/primitives.jsx';
import { LIBRARY_KINDS } from '../../domain/taxonomy.js';
import { applyFilters } from '../../engine/recommendation.js';
import { useRoov } from '../../state/RoovProvider.jsx';

export function LibraryView() {
  const { library, placeById, collections, filters, actions } = useRoov();
  const [kind, setKind] = useState('favorito');
  const [openCollection, setOpenCollection] = useState(null);
  const [creating, setCreating] = useState(false);

  const places = useMemo(() => {
    const ids = library.placeIdsOf(kind);
    const resolved = ids.map((id) => placeById[id]).filter(Boolean);
    // A biblioteca respeita os mesmos filtros globais dos outros módulos.
    return applyFilters(resolved, { ...filters, biblioteca: [] }, { library });
  }, [library, placeById, kind, filters]);

  const counts = Object.fromEntries(
    LIBRARY_KINDS.map((k) => [k.id, library.placeIdsOf(k.id).length]),
  );

  return (
    <div className="space-y-6 px-4 pb-6">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        {LIBRARY_KINDS.map((k) => (
          <Chip key={k.id} active={kind === k.id} color={k.color} onClick={() => setKind(k.id)}>
            {k.emoji} {k.label} · {counts[k.id]}
          </Chip>
        ))}
      </div>

      {places.length === 0 ? (
        <EmptyState
          emoji={LIBRARY_KINDS.find((k) => k.id === kind).emoji}
          title={`Nada em ${LIBRARY_KINDS.find((k) => k.id === kind).label}`}
          message="Toda experiência pode ser salva. Comece marcando um lugar no mapa ou no feed."
        />
      ) : (
        <div className="space-y-2">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} variant="compact" />
          ))}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">📚 Coleções</h2>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]"
          >
            <Plus className="h-3.5 w-3.5" /> nova
          </button>
        </div>

        <div className="space-y-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setOpenCollection(collection)}
              className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99]"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                style={{ background: `${collection.color}26` }}
              >
                {collection.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{collection.name}</span>
                <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                  {collection.description || `${collection.placeIds.length} lugares`}
                </span>
              </span>
              <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                {collection.placeIds.length}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </button>
          ))}
        </div>
      </section>

      <CollectionDetailSheet
        collection={openCollection}
        onClose={() => setOpenCollection(null)}
        placeById={placeById}
      />

      <NewCollectionSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(collection) => {
          actions.createCollection(collection);
          setCreating(false);
        }}
      />
    </div>
  );
}

function CollectionDetailSheet({ collection, onClose, placeById }) {
  if (!collection) return null;
  const places = collection.placeIds.map((id) => placeById[id]).filter(Boolean);

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${collection.emoji} ${collection.name}`}
      subtitle={collection.description || `${places.length} lugares`}
    >
      <div className="space-y-2 pb-2">
        {places.length === 0 ? (
          <EmptyState emoji="📭" title="Coleção vazia" message="Adicione lugares pelo Place Card." />
        ) : (
          places.map((place) => <PlaceCard key={place.id} place={place} variant="compact" />)
        )}
      </div>
    </Sheet>
  );
}

const EMOJIS = ['📚', '💘', '🌿', '🌃', '🧳', '🍽️', '💎', '🎧'];
const COLORS = ['#8B5CFF', '#FF0F7B', '#FF7A1A', '#FFB400', '#22C55E'];

function NewCollectionSheet({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [color, setColor] = useState(COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate({
      id: `col-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      emoji,
      color,
      placeIds: [],
    });
    setName('');
    setDescription('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nova coleção"
      subtitle="Agrupe experiências do seu jeito"
      footer={
        <div className="flex gap-2">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={!name.trim()}>
            Criar
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`h-11 w-11 rounded-xl border text-lg transition ${
                emoji === e ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-full border-2 transition ${
                color === c ? 'border-white' : 'border-transparent'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da coleção"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30"
        />
      </div>
    </Sheet>
  );
}
