/**
 * ROOV Place Card — ROOV Product, Cap. 13.
 *
 * Componente oficial para representar QUALQUER local no aplicativo. Regra 06
 * (Cap. 7): nenhum módulo pode desenhar seu próprio card de lugar.
 *
 * Estrutura fixa: Imagem → Nome → Localização → DNA ROOV → Classificação da
 * Biblioteca → Botões.
 *
 * Estados: preview · compacto · expandido · completo.
 */

import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { DnaStrip } from './DnaStrip.jsx';
import { LibraryActionRow, PlanActionRow } from './PlaceActions.jsx';
import { CATEGORY_BY_ID, LIBRARY_BY_ID, PRICE_RANGES } from '../domain/taxonomy.js';
import { formatDistance } from '../engine/recommendation.js';
import { isOpenAt } from '../engine/moment.js';
import { useRoov } from '../state/RoovProvider.jsx';

/** Selo da classificação que o usuário deu ao lugar. */
function LibraryFlags({ placeId }) {
  const { library } = useRoov();
  const kinds = library.kindsOf(placeId);
  if (!kinds.length) return null;
  return (
    <span className="flex items-center gap-0.5" aria-label="Sua classificação">
      {kinds.map((kind) => (
        <span key={kind} className="text-[11px]" title={LIBRARY_BY_ID[kind]?.label}>
          {LIBRARY_BY_ID[kind]?.emoji}
        </span>
      ))}
    </span>
  );
}

function OpenStatus({ place }) {
  const { moment } = useRoov();
  const open = isOpenAt(place.hours, moment.hour, moment.weekday);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] ${
        open ? 'text-[var(--lib-vivido)]' : 'text-[var(--muted-foreground)]'
      }`}
    >
      <Clock className="h-3 w-3" />
      {open ? 'Aberto agora' : `Abre ${place.hours?.open ?? '--:--'}`}
    </span>
  );
}

function CategoryDot({ category }) {
  const meta = CATEGORY_BY_ID[category];
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hex }} />
      {meta.short}
    </span>
  );
}

/**
 * @param {Object} props
 * @param {import('../domain/types.js').Place} props.place
 * @param {'preview'|'compact'|'expanded'|'full'} [props.variant]
 * @param {string} [props.experience] título da experiência (recomendações)
 * @param {string[]} [props.reasons] motivos legíveis da recomendação
 * @param {number} [props.rank] posição, quando o card aparece em uma lista ordenada
 */
export function PlaceCard({ place, variant = 'expanded', experience, reasons = [], rank }) {
  if (!place) return null;
  if (variant === 'compact') return <CompactCard place={place} rank={rank} />;
  if (variant === 'preview') return <PreviewCard place={place} />;
  if (variant === 'full') return <FullCard place={place} />;
  return <ExpandedCard place={place} experience={experience} reasons={reasons} rank={rank} />;
}

/** Estado expandido — o padrão em listas e carrosséis. */
function ExpandedCard({ place, experience, reasons, rank }) {
  const meta = CATEGORY_BY_ID[place.category];

  return (
    <article className="glass overflow-hidden rounded-2xl">
      <Link to={`/lugar/${place.id}`} className="block">
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={place.photos[0]}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          {rank != null && (
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-xs font-semibold backdrop-blur">
              {rank}
            </span>
          )}

          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur"
            style={{ background: `${meta?.hex}33`, color: meta?.hex }}
          >
            {place.placeType}
          </span>

          {/* A experiência vem antes do nome: o local é consequência (Regra 01). */}
          <div className="absolute inset-x-0 bottom-0 p-3">
            {experience && (
              <p className="mb-0.5 text-[11px] font-medium text-white/75">{experience}</p>
            )}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold">{place.name}</h3>
              <LibraryFlags placeId={place.id} />
            </div>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/70">
              <MapPin className="h-3 w-3 shrink-0" />
              {place.neighborhood} · {formatDistance(place.distanceKm)}
            </p>
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-3">
        <DnaStrip dna={place.dna} limit={4} />

        {reasons.length > 0 && (
          <ul className="space-y-1">
            {reasons.slice(0, 2).map((reason) => (
              <li key={reason} className="text-[11px] text-[var(--muted-foreground)]">
                · {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CategoryDot category={place.category} />
            <OpenStatus place={place} />
          </div>
          <LibraryActionRow place={place} size="sm" />
        </div>
      </div>
    </article>
  );
}

/** Estado compacto — listas densas, resultados de pesquisa, coleções. */
function CompactCard({ place, rank }) {
  return (
    <Link
      to={`/lugar/${place.id}`}
      className="glass flex items-center gap-3 rounded-2xl p-2.5 transition active:scale-[0.99]"
    >
      {rank != null && (
        <span className="w-5 shrink-0 text-center text-sm font-semibold text-[var(--muted-foreground)]">
          {rank}
        </span>
      )}
      <img
        src={place.photos[0]}
        alt={place.name}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-medium">{place.name}</h3>
          <LibraryFlags placeId={place.id} />
        </div>
        <p className="truncate text-[11px] text-[var(--muted-foreground)]">
          {place.placeType} · {place.neighborhood} · {formatDistance(place.distanceKm)}
        </p>
        <DnaStrip dna={place.dna} limit={2} className="mt-1.5" />
      </div>
      <LibraryActionRow place={place} size="sm" className="shrink-0" />
    </Link>
  );
}

/** Estado preview — o que abre ao tocar num pin do mapa. */
function PreviewCard({ place }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <Link to={`/lugar/${place.id}`} className="flex gap-3 p-3">
        <img
          src={place.photos[0]}
          alt={place.name}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold">{place.name}</h3>
            <LibraryFlags placeId={place.id} />
          </div>
          <p className="truncate text-[11px] text-[var(--muted-foreground)]">
            {place.placeType} · {formatDistance(place.distanceKm)}
          </p>
          <DnaStrip dna={place.dna} limit={3} className="mt-1.5" />
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-white/10 p-3">
        <LibraryActionRow place={place} size="sm" />
        <PlanActionRow place={place} className="flex-1" />
      </div>
    </div>
  );
}

/** Estado completo — cabeçalho da ficha do lugar. */
function FullCard({ place }) {
  const meta = CATEGORY_BY_ID[place.category];
  const price = PRICE_RANGES.find((p) => p.id === place.priceRange);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: `${meta?.hex}26`, color: meta?.hex }}
          >
            {place.placeType} · {meta?.label}
          </span>
          <h1 className="text-2xl font-semibold">{place.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {place.neighborhood} · {place.city}
            </span>
            <span>·</span>
            <span>{formatDistance(place.distanceKm)}</span>
            <span>·</span>
            <span title={price?.hint}>{price?.label}</span>
          </p>
          <div className="mt-2">
            <OpenStatus place={place} />
          </div>
        </div>
      </div>

      <LibraryActionRow place={place} showLabels />
      <PlanActionRow place={place} />
    </div>
  );
}
