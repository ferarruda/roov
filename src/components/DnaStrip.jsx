/**
 * DNA ROOV — ROOV Product, Cap. 12.
 *
 * Regras inegociáveis desta exibição:
 *  - nunca mostrar porcentagem;
 *  - nunca mostrar nota;
 *  - nunca mostrar estrela.
 * O DNA representa identidade, não qualidade. A força relativa de uma tag é
 * comunicada só pela ordem e pela opacidade, jamais por número.
 */

import { topDnaTags } from '../engine/dna.js';
import { TAG_GROUPS, tag as resolveTag } from '../domain/taxonomy.js';

/** Faixa compacta usada dentro do ROOV Place Card. */
export function DnaStrip({ dna, limit = 4, className = '' }) {
  const tags = topDnaTags(dna, limit);
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-[var(--foreground)]/85"
          style={{ opacity: 0.65 + t.weight * 0.35 }}
        >
          <span aria-hidden>{t.emoji}</span>
          {t.label}
        </span>
      ))}
    </div>
  );
}

/**
 * DNA completo, agrupado — usado no Place Detail.
 * Mostra sempre os quatro grupos oficiais: Ambiente, Vibe, Público e Perfil.
 */
export function DnaPanel({ dna, className = '' }) {
  if (!dna) return null;
  const groups = TAG_GROUPS.filter((g) => g.required);

  return (
    <div className={`space-y-3 ${className}`}>
      {groups.map((group) => {
        const refs = dna[group.key] ?? [];
        if (!refs.length) return null;
        return (
          <div key={group.key}>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {refs.map((ref) => {
                const t = resolveTag(ref.id);
                return (
                  <span
                    key={ref.id}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
                    style={{ opacity: 0.6 + ref.weight * 0.4 }}
                  >
                    <span aria-hidden>{t.emoji}</span>
                    {t.label}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="pt-1 text-[11px] text-[var(--muted-foreground)]">
        DNA construído por {dna.contributions ?? 0}{' '}
        {dna.contributions === 1 ? 'experiência' : 'experiências'} da comunidade.
      </p>
    </div>
  );
}
