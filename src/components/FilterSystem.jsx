/**
 * Sistema Oficial de Filtros — ROOV Product, Cap. 10.
 *
 * Regra 07 (Cap. 7): todo módulo usa exatamente este sistema. Não existe filtro
 * exclusivo de uma tela. Os filtros são cumulativos, removíveis individualmente
 * e permanecem durante toda a navegação — por isso vivem no estado global e não
 * no estado local de cada módulo.
 *
 * Ordem oficial das etapas:
 *   Categoria → Tipo → Ambiente → Vibe → Público → Perfil
 *   → Biblioteca → Distância → Ordenação
 */

import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import {
  AMBIENTES,
  CATEGORIES,
  CATEGORY_BY_ID,
  EMPTY_FILTERS,
  LIBRARY_KINDS,
  PERFIS,
  PLACE_TYPES,
  PRICE_RANGES,
  PUBLICOS,
  SORT_OPTIONS,
  VIBES,
  countActiveFilters,
  tag,
} from '../domain/taxonomy.js';
import { useRoov } from '../state/RoovProvider.jsx';
import { Chip, GhostButton, PrimaryButton, Sheet } from './ui/primitives.jsx';

export function FilterButton({ onClick }) {
  const { filters } = useRoov();
  const count = countActiveFilters(filters);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Filtros"
      className="glass relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95"
    >
      <SlidersHorizontal className="h-4 w-4" />
      {count > 0 && (
        <span className="roov-gradient absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/** Chips do que está aplicado. Cada um remove só a si mesmo. */
export function ActiveFilterChips({ className = '' }) {
  const { filters, actions } = useRoov();
  const chips = [];

  if (filters.category) {
    chips.push({
      key: `cat-${filters.category}`,
      label: CATEGORY_BY_ID[filters.category].label,
      color: CATEGORY_BY_ID[filters.category].hex,
      remove: () => actions.patchFilters({ category: null, placeTypes: [] }),
    });
  }
  for (const type of filters.placeTypes) {
    chips.push({
      key: `type-${type}`,
      label: type,
      remove: () =>
        actions.patchFilters({ placeTypes: filters.placeTypes.filter((t) => t !== type) }),
    });
  }
  for (const group of ['ambiente', 'vibe', 'publico', 'perfil']) {
    for (const id of filters[group]) {
      const t = tag(id);
      chips.push({
        key: `${group}-${id}`,
        label: `${t.emoji} ${t.label}`,
        remove: () =>
          actions.patchFilters({ [group]: filters[group].filter((v) => v !== id) }),
      });
    }
  }
  for (const kind of filters.biblioteca) {
    const meta = LIBRARY_KINDS.find((k) => k.id === kind);
    chips.push({
      key: `lib-${kind}`,
      label: `${meta.emoji} ${meta.label}`,
      color: meta.color,
      remove: () =>
        actions.patchFilters({ biblioteca: filters.biblioteca.filter((k) => k !== kind) }),
    });
  }
  for (const price of filters.priceRange) {
    chips.push({
      key: `price-${price}`,
      label: PRICE_RANGES.find((p) => p.id === price).label,
      remove: () =>
        actions.patchFilters({ priceRange: filters.priceRange.filter((p) => p !== price) }),
    });
  }
  if (filters.maxDistanceKm !== EMPTY_FILTERS.maxDistanceKm) {
    chips.push({
      key: 'distance',
      label: `até ${filters.maxDistanceKm} km`,
      remove: () => actions.patchFilters({ maxDistanceKm: EMPTY_FILTERS.maxDistanceKm }),
    });
  }
  if (filters.sort !== EMPTY_FILTERS.sort) {
    chips.push({
      key: 'sort',
      label: SORT_OPTIONS.find((s) => s.id === filters.sort).label,
      remove: () => actions.patchFilters({ sort: EMPTY_FILTERS.sort }),
    });
  }

  if (!chips.length) return null;

  return (
    <div className={`scrollbar-hide flex gap-2 overflow-x-auto ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          style={chip.color ? { borderColor: `${chip.color}66`, color: chip.color } : undefined}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] backdrop-blur"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-70" />
        </button>
      ))}
      <button
        type="button"
        onClick={actions.resetFilters}
        className="shrink-0 px-2 text-[11px] text-[var(--muted-foreground)] underline"
      >
        limpar
      </button>
    </div>
  );
}

/** Atalho de categoria — sempre visível, é a primeira etapa do funil. */
export function CategoryRail({ className = '' }) {
  const { filters, actions } = useRoov();
  return (
    <div className={`scrollbar-hide flex gap-2 overflow-x-auto ${className}`}>
      <Chip
        active={!filters.category}
        onClick={() => actions.patchFilters({ category: null, placeTypes: [] })}
      >
        Tudo
      </Chip>
      {CATEGORIES.map((category) => (
        <Chip
          key={category.id}
          active={filters.category === category.id}
          color={category.hex}
          onClick={() =>
            actions.patchFilters({
              category: filters.category === category.id ? null : category.id,
              placeTypes: [],
            })
          }
        >
          {category.short}
        </Chip>
      ))}
    </div>
  );
}

/**
 * Painel completo. Trabalha sobre um rascunho local e só grava no estado
 * global ao aplicar — assim o usuário pode explorar combinações sem que a
 * lista atrás fique piscando.
 */
export function FilterSheet({ open, onClose, resultCount }) {
  const { filters, actions } = useRoov();
  const [draft, setDraft] = useState(filters);

  // Reabrir o painel deve refletir o que está aplicado hoje.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setDraft(filters);
  }

  const toggleIn = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));

  const placeTypes = draft.category ? PLACE_TYPES[draft.category] : [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtros"
      subtitle="Combine quantos quiser — eles valem em todo o app"
      footer={
        <div className="flex gap-2">
          <GhostButton onClick={() => setDraft(EMPTY_FILTERS)}>Limpar</GhostButton>
          <PrimaryButton
            onClick={() => {
              actions.setFilters(draft);
              onClose();
            }}
          >
            Aplicar{resultCount != null ? ` · ${resultCount}` : ''}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <Group label="Categoria principal">
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              color={category.hex}
              active={draft.category === category.id}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  category: d.category === category.id ? null : category.id,
                  placeTypes: [],
                }))
              }
            >
              {category.label}
            </Chip>
          ))}
        </Group>

        {placeTypes.length > 0 && (
          <Group label="Tipo do local">
            {placeTypes.map((type) => (
              <Chip
                key={type}
                active={draft.placeTypes.includes(type)}
                onClick={() => toggleIn('placeTypes', type)}
              >
                {type}
              </Chip>
            ))}
          </Group>
        )}

        <TagGroup label="Ambiente" tags={AMBIENTES} selected={draft.ambiente} onToggle={(id) => toggleIn('ambiente', id)} />
        <TagGroup label="Vibe & Sensação" tags={VIBES} selected={draft.vibe} onToggle={(id) => toggleIn('vibe', id)} />
        <TagGroup label="Público" tags={PUBLICOS} selected={draft.publico} onToggle={(id) => toggleIn('publico', id)} />
        <TagGroup label="Perfil do local" tags={PERFIS} selected={draft.perfil} onToggle={(id) => toggleIn('perfil', id)} />

        <Group label="Classificação da biblioteca">
          {LIBRARY_KINDS.map((kind) => (
            <Chip
              key={kind.id}
              color={kind.color}
              active={draft.biblioteca.includes(kind.id)}
              onClick={() => toggleIn('biblioteca', kind.id)}
            >
              {kind.emoji} {kind.label}
            </Chip>
          ))}
        </Group>

        <Group label="Preço">
          {PRICE_RANGES.map((price) => (
            <Chip
              key={price.id}
              active={draft.priceRange.includes(price.id)}
              onClick={() => toggleIn('priceRange', price.id)}
            >
              {price.label} · {price.hint}
            </Chip>
          ))}
        </Group>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Distância
            </p>
            <span className="text-xs">até {draft.maxDistanceKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={draft.maxDistanceKm}
            onChange={(e) => setDraft((d) => ({ ...d, maxDistanceKm: Number(e.target.value) }))}
            className="w-full accent-[#8B5CFF]"
          />
        </div>

        <Group label="Ordenação">
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              active={draft.sort === option.id}
              onClick={() => setDraft((d) => ({ ...d, sort: option.id }))}
            >
              {option.label}
            </Chip>
          ))}
        </Group>
      </div>
    </Sheet>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TagGroup({ label, tags, selected, onToggle }) {
  return (
    <Group label={label}>
      {tags.map((t) => (
        <Chip key={t.id} active={selected.includes(t.id)} onClick={() => onToggle(t.id)}>
          <span aria-hidden>{t.emoji}</span>
          {t.label}
        </Chip>
      ))}
    </Group>
  );
}
