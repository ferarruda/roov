/**
 * Criar Experiência — ROOV Product, Cap. 5.5 e 11.
 *
 * Duas regras estruturais governam esta tela:
 *   Regra 02 — todo post pertence obrigatoriamente a um lugar;
 *   Cap. 11  — toda postagem precisa das tags obrigatórias (ambiente, vibe,
 *              público e perfil), porque são elas que constroem o DNA.
 *
 * O fluxo é: escolher lugar → mídia e relato → tags → publicar.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Search } from 'lucide-react';
import { DetailHeader } from '../../components/AppShell.jsx';
import { Chip, EmptyState, PrimaryButton } from '../../components/ui/primitives.jsx';
import { DnaStrip } from '../../components/DnaStrip.jsx';
import { TAG_GROUPS, tag as resolveTag } from '../../domain/taxonomy.js';
import { formatDistance } from '../../engine/recommendation.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const STEPS = ['lugar', 'relato', 'tags'];

export function CreateModule() {
  const navigate = useNavigate();
  const { places, actions } = useRoov();

  const [step, setStep] = useState('lugar');
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState(null);
  const [caption, setCaption] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? places.filter((p) =>
          [p.name, p.placeType, p.neighborhood].join(' ').toLowerCase().includes(q),
        )
      : [...places].sort((a, b) => a.distanceKm - b.distanceKm);
    return pool.slice(0, 12);
  }, [places, query]);

  /** Quais grupos obrigatórios ainda faltam — o usuário vê isso o tempo todo. */
  const missingGroups = useMemo(() => {
    const covered = new Set();
    for (const tagId of selectedTags) {
      const group = TAG_GROUPS.find((g) => g.tags.some((t) => t.id === tagId));
      if (group) covered.add(group.key);
    }
    return TAG_GROUPS.filter((g) => g.required && !covered.has(g.key));
  }, [selectedTags]);

  const toggleTag = (id) =>
    setSelectedTags((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
    );

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      await actions.publishPost({
        placeId: place.id,
        media: [place.photos[photoIndex]],
        caption: caption.trim(),
        tags: selectedTags,
      });
      navigate(`/lugar/${place.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DetailHeader
        title="Nova experiência"
        onBack={() => {
          const index = STEPS.indexOf(step);
          if (index === 0) navigate(-1);
          else setStep(STEPS[index - 1]);
        }}
      />

      <div className="flex gap-1.5 px-4 pt-3">
        {STEPS.map((s) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition ${
              STEPS.indexOf(s) <= STEPS.indexOf(step) ? 'roov-gradient' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-4 pt-4">
        {step === 'lugar' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Onde foi?</h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Toda experiência acontece em algum lugar — é ele que ganha DNA com o seu post.
              </p>
            </div>

            <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar lugar"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>

            <div className="space-y-2">
              {matches.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setPlace(option);
                    setPhotoIndex(0);
                    setStep('relato');
                  }}
                  className="glass flex w-full items-center gap-3 rounded-2xl p-2.5 text-left"
                >
                  <img
                    src={option.photos[0]}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{option.name}</span>
                    <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                      {option.placeType} · {option.neighborhood} ·{' '}
                      {formatDistance(option.distanceKm)}
                    </span>
                  </span>
                </button>
              ))}
              {matches.length === 0 && (
                <EmptyState emoji="📍" title="Nenhum lugar encontrado com esse nome" />
              )}
            </div>
          </div>
        )}

        {step === 'relato' && place && (
          <div className="space-y-4">
            <div className="glass flex items-center gap-3 rounded-2xl p-3">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{place.name}</p>
                <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                  {place.neighborhood} · {place.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('lugar')}
                className="shrink-0 text-[11px] text-[var(--muted-foreground)] underline"
              >
                trocar
              </button>
            </div>

            <div>
              <h2 className="text-base font-semibold">Escolha a imagem</h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                No app nativo isso vira câmera e galeria. Aqui, escolha uma foto do lugar.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {place.photos.map((photo, i) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    className={`relative overflow-hidden rounded-2xl border-2 transition ${
                      photoIndex === i ? 'border-white' : 'border-transparent'
                    }`}
                  >
                    <img src={photo} alt="" className="aspect-square w-full object-cover" />
                    {photoIndex === i && (
                      <span className="roov-gradient absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Conte a experiência</span>
              <textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="O que aconteceu, o que valeu a pena, o que você faria diferente…"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30"
              />
            </label>

            <PrimaryButton onClick={() => setStep('tags')} disabled={!caption.trim()}>
              Continuar
            </PrimaryButton>
          </div>
        )}

        {step === 'tags' && place && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Como foi essa experiência?</h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Estas tags constroem o DNA de {place.name}. Sem elas, o lugar não ganha identidade.
              </p>
            </div>

            {missingGroups.length > 0 && (
              <p className="rounded-2xl border border-[#FFB400]/40 bg-[#FFB400]/10 p-3 text-[11px]">
                Ainda faltam: {missingGroups.map((g) => g.label).join(', ')}.
              </p>
            )}

            {TAG_GROUPS.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  {group.label}
                  {group.required && <span className="ml-1 text-[#FFB400]">*</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((t) => (
                    <Chip
                      key={t.id}
                      active={selectedTags.includes(t.id)}
                      onClick={() => toggleTag(t.id)}
                    >
                      <span aria-hidden>{t.emoji}</span>
                      {t.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}

            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold">Prévia do que você adiciona ao DNA</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTags.length === 0 ? (
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Nenhuma tag escolhida ainda.
                  </span>
                ) : (
                  selectedTags.map((id) => {
                    const t = resolveTag(id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px]"
                      >
                        <span aria-hidden>{t.emoji}</span>
                        {t.label}
                      </span>
                    );
                  })
                )}
              </div>
              <p className="mt-3 text-[11px] text-[var(--muted-foreground)]">DNA atual do lugar</p>
              <DnaStrip dna={place.dna} limit={4} className="mt-1.5" />
            </div>

            {error && (
              <p className="rounded-2xl border border-[#FF0F7B]/40 bg-[#FF0F7B]/10 p-3 text-[11px]">
                {error}
              </p>
            )}

            <PrimaryButton
              onClick={publish}
              disabled={publishing || missingGroups.length > 0 || !caption.trim()}
            >
              {publishing ? 'Publicando…' : 'Publicar experiência'}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
