/**
 * Agenda — ROOV Product, Cap. 15, 43 e 64.
 *
 * Organização por Hoje / Amanhã / Esta semana / Este mês / Sem data, com os
 * avisos do motor de agenda no topo de cada dia.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/primitives.jsx';
import { analyzeDay, groupAgenda } from '../../engine/agenda.js';
import { CATEGORY_BY_ID } from '../../domain/taxonomy.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const STATUS_STYLE = {
  planejado: { label: 'Planejado', color: 'var(--muted-foreground)' },
  confirmado: { label: 'Confirmado', color: 'var(--lib-vivido)' },
  concluido: { label: 'Concluído', color: 'var(--muted-foreground)' },
  cancelado: { label: 'Cancelado', color: 'var(--lib-favorito)' },
};

const SEVERITY_STYLE = {
  critical: 'border-[#FF0F7B]/40 bg-[#FF0F7B]/10',
  warning: 'border-[#FFB400]/40 bg-[#FFB400]/10',
  suggestion: 'border-[#8B5CFF]/40 bg-[#8B5CFF]/10',
  info: 'border-white/10 bg-white/5',
};

export function AgendaView() {
  const { agenda, placeById, moment, actions } = useRoov();

  const groups = useMemo(() => groupAgenda(agenda), [agenda]);

  if (!agenda.length) {
    return (
      <EmptyState
        emoji="📅"
        title="Nenhuma experiência planejada"
        message="Toda experiência pode virar plano. Use o botão Agenda no card de qualquer lugar."
      />
    );
  }

  return (
    <div className="space-y-6 px-4 pb-6">
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">
            {group.label}
          </h2>

          <DayInsights items={group.items} placeById={placeById} moment={moment} />

          <div className="space-y-2">
            {group.items.map((item) => (
              <AgendaCard
                key={item.id}
                item={item}
                place={placeById[item.placeId]}
                onRemove={() => actions.removeAgendaItem(item.id)}
                onToggleStatus={() =>
                  actions.updateAgendaItem({
                    ...item,
                    status: item.status === 'confirmado' ? 'planejado' : 'confirmado',
                  })
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DayInsights({ items, placeById, moment }) {
  const insights = useMemo(
    () => analyzeDay(items, placeById, moment),
    [items, placeById, moment],
  );
  if (!insights.length) return null;

  return (
    <div className="mb-3 space-y-2">
      {insights.slice(0, 3).map((insight) => (
        <div
          key={insight.id}
          className={`rounded-2xl border p-3 ${SEVERITY_STYLE[insight.severity]}`}
        >
          <p className="text-xs font-semibold">
            <span aria-hidden className="mr-1.5">
              {insight.emoji}
            </span>
            {insight.title}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            {insight.message}
          </p>
        </div>
      ))}
    </div>
  );
}

function AgendaCard({ item, place, onRemove, onToggleStatus }) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  if (!place) return null;

  const meta = CATEGORY_BY_ID[place.category];
  const status = STATUS_STYLE[item.status];

  return (
    <article className="glass flex gap-3 rounded-2xl p-3">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/5 py-2">
        <span className="text-sm font-semibold">{item.time}</span>
        <span className="text-[10px] text-[var(--muted-foreground)]">{item.duration}</span>
      </div>

      <div className="min-w-0 flex-1">
        <Link to={`/lugar/${place.id}`} className="block">
          <h3 className="truncate text-sm font-medium">{place.name}</h3>
          <p className="flex items-center gap-1 truncate text-[11px] text-[var(--muted-foreground)]">
            <MapPin className="h-3 w-3 shrink-0" />
            {place.neighborhood}
            <span className="mx-0.5">·</span>
            <span style={{ color: meta?.hex }}>{meta?.short}</span>
          </p>
        </Link>

        {item.notes && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            {item.notes}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleStatus}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px]"
            style={{ color: status.color }}
          >
            <Clock className="h-3 w-3" />
            {status.label}
          </button>

          {confirmingRemoval ? (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full bg-[var(--lib-favorito)]/20 px-2 py-1 text-[10px] text-[var(--lib-favorito)]"
              >
                remover
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRemoval(false)}
                className="px-1 text-[10px] text-[var(--muted-foreground)]"
              >
                cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-label="Remover da agenda"
              onClick={() => setConfirmingRemoval(true)}
              className="text-[var(--muted-foreground)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
