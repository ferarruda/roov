/**
 * Explorar — ROOV Product, Cap. 20, 60 e 63.
 *
 * Recomendações inteligentes, nunca listas genéricas. Todas as seções são
 * dinâmicas: se o motor não achar conteúdo relevante o suficiente para uma
 * seção, ela simplesmente não existe naquele momento.
 */

import { useMemo } from 'react';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { EmptyState, SectionTitle } from '../../components/ui/primitives.jsx';
import { buildExploreSections } from '../../engine/recommendation.js';
import { useRoov } from '../../state/RoovProvider.jsx';

export function ExploreView({ places }) {
  const { userDna, moment, knownPlaceIds } = useRoov();

  const sections = useMemo(
    () =>
      buildExploreSections({
        places,
        userAffinities: userDna.affinities,
        moment,
        knownPlaceIds,
        userDna,
      }),
    [places, userDna, moment, knownPlaceIds],
  );

  if (!sections.length) {
    return (
      <EmptyState
        emoji="✨"
        title="Sem recomendações com esses filtros"
        message="O Explorar precisa de espaço para sugerir. Tente remover alguns filtros."
      />
    );
  }

  return (
    <div className="space-y-7 pb-6">
      <MomentCard />

      {sections.map((section) => (
        <section key={section.id}>
          <SectionTitle title={section.title} subtitle={section.subtitle} />
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {section.items.map((item) => (
              <div key={item.placeId} className="w-[260px] shrink-0 snap-start">
                <PlaceCard
                  place={item.place}
                  experience={item.experience}
                  reasons={item.reasons}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** O DNA do Momento explicado em linguagem humana, nunca como score. */
function MomentCard() {
  const { moment, userDna } = useRoov();

  return (
    <div className="px-4">
      <div
        className="rounded-2xl border border-white/10 p-4"
        style={{
          background: `linear-gradient(135deg, ${moment.color}26 0%, rgba(255,255,255,0.04) 70%)`,
        }}
      >
        <p className="text-xs text-[var(--muted-foreground)]">
          {moment.weekdayLabel} · {String(moment.hour).padStart(2, '0')}h ·{' '}
          {moment.weather.emoji} {moment.weather.tempC}°C
        </p>
        <h2 className="mt-1 text-lg font-semibold">{moment.headline}</h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {userDna.summary} · {moment.city}
        </p>
        {userDna.topTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {userDna.topTags.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px]"
              >
                <span aria-hidden>{t.emoji}</span>
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
