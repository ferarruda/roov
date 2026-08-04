/**
 * Fluxo de Organização — ROOV Product, Cap. 5.4.
 *
 * As cinco ações que qualquer lugar aceita, em qualquer tela, com exatamente o
 * mesmo comportamento:
 *   ❤️ Favoritar · ⭐ Quero Conhecer · ✅ Experiência Vivida
 *   📚 Adicionar em Coleção · 📅 Adicionar à Agenda
 *
 * As duas últimas precisam de um passo extra, então vivem em sheets globais
 * montados uma única vez pelo provider — assim um card no meio de uma lista
 * abre o mesmo fluxo que a tela de detalhe.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CalendarPlus, CircleCheck, FolderPlus, Heart, Plus, Star } from 'lucide-react';
import { useRoov } from '../state/RoovProvider.jsx';
import { LIBRARY_KINDS } from '../domain/taxonomy.js';
import { GhostButton, PrimaryButton, Sheet } from './ui/primitives.jsx';

const ICONS = { Heart, Star, CircleCheck };

const PlaceActionsContext = createContext(null);

export function PlaceActionsProvider({ children }) {
  const { collections, agenda, actions } = useRoov();
  const [collectionTarget, setCollectionTarget] = useState(null);
  const [agendaTarget, setAgendaTarget] = useState(null);

  const value = useMemo(
    () => ({
      openCollections: setCollectionTarget,
      openAgenda: setAgendaTarget,
    }),
    [],
  );

  return (
    <PlaceActionsContext.Provider value={value}>
      {children}
      <CollectionSheet
        place={collectionTarget}
        collections={collections}
        onClose={() => setCollectionTarget(null)}
        actions={actions}
      />
      <AgendaSheet
        place={agendaTarget}
        agenda={agenda}
        onClose={() => setAgendaTarget(null)}
        actions={actions}
      />
    </PlaceActionsContext.Provider>
  );
}

export function usePlaceActions() {
  const ctx = useContext(PlaceActionsContext);
  if (!ctx) throw new Error('usePlaceActions precisa estar dentro de <PlaceActionsProvider>.');
  return ctx;
}

/**
 * Classificação da Biblioteca — três botões, sempre na mesma ordem.
 * @param {{place: object, size?: 'sm'|'md', showLabels?: boolean}} props
 */
export function LibraryActionRow({ place, size = 'md', showLabels = false, className = '' }) {
  const { library, actions } = useRoov();
  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {LIBRARY_KINDS.map((kind) => {
        const Icon = ICONS[kind.icon];
        const active = library.has(place.id, kind.id);
        return (
          <button
            key={kind.id}
            type="button"
            aria-label={kind.singular}
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              actions.toggleLibrary(place.id, kind.id, kind.label);
            }}
            style={active ? { color: kind.color, borderColor: kind.color } : undefined}
            className={`flex ${showLabels ? 'flex-1 gap-1.5 rounded-full px-3' : `${dimension} justify-center rounded-full`} items-center border border-white/10 bg-white/5 text-[var(--muted-foreground)] transition active:scale-95 ${
              showLabels ? 'h-10 text-xs font-medium' : ''
            }`}
          >
            <Icon className={iconSize} fill={active ? 'currentColor' : 'none'} />
            {showLabels && <span>{kind.singular}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Ações secundárias: coleção e agenda. */
export function PlanActionRow({ place, className = '' }) {
  const { openCollections, openAgenda } = usePlaceActions();
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => openCollections(place)}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium transition active:scale-95"
      >
        <FolderPlus className="h-4 w-4" />
        Coleção
      </button>
      <button
        type="button"
        onClick={() => openAgenda(place)}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium transition active:scale-95"
      >
        <CalendarPlus className="h-4 w-4" />
        Agenda
      </button>
    </div>
  );
}

/* ─── Sheets ──────────────────────────────────────────────────────────────── */

function CollectionSheet({ place, collections, onClose, actions }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');

  if (!place) return null;

  const submitNew = () => {
    if (!name.trim()) return;
    const collection = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      description: '',
      emoji,
      color: '#8B5CFF',
      placeIds: [place.id],
    };
    actions.createCollection(collection);
    setName('');
    setCreating(false);
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Adicionar em coleção"
      subtitle={place.name}
      footer={
        creating ? (
          <div className="flex gap-2">
            <GhostButton onClick={() => setCreating(false)}>Cancelar</GhostButton>
            <PrimaryButton onClick={submitNew} disabled={!name.trim()}>
              Criar coleção
            </PrimaryButton>
          </div>
        ) : (
          <GhostButton onClick={() => setCreating(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nova coleção
            </span>
          </GhostButton>
        )
      }
    >
      {creating ? (
        <div className="space-y-3 pb-2">
          <div className="flex gap-2">
            {['📚', '💘', '🌿', '🌃', '🧳', '🍽️', '💎'].map((e) => (
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
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da coleção"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30"
          />
        </div>
      ) : (
        <div className="space-y-2 pb-2">
          {collections.map((collection) => {
            const inside = collection.placeIds.includes(place.id);
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => actions.toggleInCollection(collection.id, place.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  inside ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                  style={{ background: `${collection.color}26` }}
                >
                  {collection.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{collection.name}</span>
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">
                    {collection.placeIds.length} lugares
                  </span>
                </span>
                {inside && <CircleCheck className="h-5 w-5 text-[var(--lib-vivido)]" />}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function AgendaSheet({ place, agenda, onClose, actions }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('2h');
  const [notes, setNotes] = useState('');

  if (!place) return null;

  const already = agenda.filter((item) => item.placeId === place.id);

  const submit = () => {
    actions.addAgendaItem({
      id: `ag-${Date.now()}`,
      placeId: place.id,
      date,
      time,
      duration,
      notes: notes.trim(),
      status: 'planejado',
    });
    setNotes('');
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Adicionar à agenda"
      subtitle={place.name}
      footer={<PrimaryButton onClick={submit}>Planejar experiência</PrimaryButton>}
    >
      <div className="space-y-4 pb-2">
        {already.length > 0 && (
          <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted-foreground)]">
            Você já tem {already.length} {already.length === 1 ? 'plano' : 'planos'} aqui.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Data</span>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Hora</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Duração</span>
          <div className="flex gap-2">
            {['45min', '1h30', '2h', '3h'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className={`flex-1 rounded-xl border py-2.5 text-xs transition ${
                  duration === option
                    ? 'border-white bg-white/15 text-white'
                    : 'border-white/10 bg-white/5 text-[var(--muted-foreground)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted-foreground)]">Observações</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reservar mesa, levar documento, chegar antes…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30"
          />
        </label>
      </div>
    </Sheet>
  );
}
