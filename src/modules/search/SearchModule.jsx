/**
 * Sistema Oficial de Pesquisa — ROOV Product, Cap. 9 e 49.
 *
 * Uma pesquisa única para o app inteiro. Um mesmo termo pode devolver lugares,
 * comunidades, pessoas, tags e localizações — e cada resultado leva para o
 * mesmo destino que qualquer outro fluxo levaria.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Search, TrendingUp, Users, X } from 'lucide-react';
import { DetailHeader } from '../../components/AppShell.jsx';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { Chip, EmptyState, Skeleton } from '../../components/ui/primitives.jsx';
import { searchService } from '../../services/index.js';
import { useRoov } from '../../state/RoovProvider.jsx';
import { CATEGORY_BY_ID } from '../../domain/taxonomy.js';

/** Sugestões contextuais: dependem do momento, não são uma lista fixa. */
function contextualSuggestions(moment) {
  const band = moment.band.id;
  if (band === 'amanhecer' || band === 'manha')
    return ['café tranquilo', 'parque para caminhar', 'padaria de bairro'];
  if (band === 'pico' || band === 'pausa')
    return ['almoço rápido', 'mercado', 'restaurante autêntico'];
  if (band === 'tarde') return ['museu', 'arte de rua', 'livraria com café'];
  if (band === 'golden-hour') return ['rooftop', 'mirante', 'pôr do sol'];
  return ['bar escondido', 'balada', 'jantar romântico'];
}

export function SearchModule() {
  const navigate = useNavigate();
  const { searchHistory, moment, actions } = useRoov();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState('tudo');

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults(null);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchService.query(trimmed).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [term]);

  const suggestions = useMemo(() => contextualSuggestions(moment), [moment]);

  const submit = (value) => {
    setTerm(value);
    actions.recordSearch(value);
  };

  const total = results
    ? results.places.length +
      results.communities.length +
      results.people.length +
      results.tags.length +
      results.locations.length
    : 0;

  return (
    <div className="flex h-full flex-col">
      <DetailHeader
        title="Pesquisar"
        onBack={() => navigate(-1)}
        right={
          term && (
            <button
              type="button"
              aria-label="Limpar"
              onClick={() => setTerm('')}
              className="glass flex h-9 w-9 items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )
        }
      />

      <div className="px-4 pt-3">
        <div className="glass flex h-12 items-center gap-2.5 rounded-full px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(term)}
            placeholder="Cidade, bairro, lugar, comunidade, vibe…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {!term.trim() ? (
          <div className="space-y-6">
            {searchHistory.length > 0 && (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  <Clock className="h-3 w-3" /> Recentes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item) => (
                    <Chip key={item} onClick={() => submit(item)}>
                      {item}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <TrendingUp className="h-3 w-3" /> {moment.headline}
              </h2>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <Chip key={item} onClick={() => submit(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
            </section>
          </div>
        ) : loading && !results ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : total === 0 ? (
          <EmptyState
            emoji="🔍"
            title={`Nada encontrado para "${term}"`}
            message="Tente uma vibe (“romântico”), um bairro ou o nome de uma comunidade."
          />
        ) : (
          <div className="space-y-6">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {[
                { id: 'tudo', label: `Tudo · ${total}` },
                { id: 'lugares', label: `Lugares · ${results.places.length}` },
                { id: 'comunidades', label: `Comunidades · ${results.communities.length}` },
                { id: 'pessoas', label: `Pessoas · ${results.people.length}` },
              ].map((option) => (
                <Chip
                  key={option.id}
                  active={scope === option.id}
                  onClick={() => setScope(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>

            {(scope === 'tudo' || scope === 'lugares') && results.places.length > 0 && (
              <Section title="Lugares">
                {results.places.map((place) => (
                  <PlaceCard key={place.id} place={place} variant="compact" />
                ))}
              </Section>
            )}

            {scope === 'tudo' && results.tags.length > 0 && (
              <Section title="Vibes e ambientes">
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((t) => (
                    <Chip key={t.id} onClick={() => submit(t.label)}>
                      <span aria-hidden>{t.emoji}</span> {t.label}
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {scope === 'tudo' && results.locations.length > 0 && (
              <Section title="Localizações">
                {results.locations.map((location) => (
                  <div
                    key={location}
                    className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  >
                    <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm">{location}</span>
                  </div>
                ))}
              </Section>
            )}

            {(scope === 'tudo' || scope === 'comunidades') && results.communities.length > 0 && (
              <Section title="Comunidades">
                {results.communities.map((community) => (
                  <Link
                    key={community.id}
                    to={`/comunidade/${community.id}`}
                    className="glass flex items-center gap-3 rounded-2xl p-2.5"
                  >
                    <img
                      src={community.cover}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{community.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                        <Users className="h-3 w-3" />
                        {community.membersCount.toLocaleString('pt-BR')} ·{' '}
                        <span style={{ color: CATEGORY_BY_ID[community.category]?.hex }}>
                          {CATEGORY_BY_ID[community.category]?.short}
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </Section>
            )}

            {(scope === 'tudo' || scope === 'pessoas') && results.people.length > 0 && (
              <Section title="Pessoas">
                {results.people.map((person) => (
                  <div key={person.id} className="glass flex items-center gap-3 rounded-2xl p-2.5">
                    <img
                      src={person.avatar}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{person.name}</p>
                      <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                        @{person.username}
                      </p>
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
