/**
 * Edição de informações do perfil — Fase 3, corte 2.
 *
 * Só os campos que hoje têm fonte real (`PATCH /v1/users/me`): nome, bio,
 * cidade, estado e país. `username`/`email` ficam de fora de propósito —
 * ver plano do corte.
 */

import { useState } from 'react';
import { GhostButton, PrimaryButton, Sheet } from '../../components/ui/primitives.jsx';
import { useAuth } from '../../state/AuthProvider.jsx';

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30';

export function EditProfileSheet({ open, onClose, user }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim().length >= 2 && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message ?? 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Editar perfil"
      subtitle="Essas informações aparecem no seu perfil público"
      footer={
        <div className="flex gap-2">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? 'Salvando…' : 'Salvar'}
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 pb-2">
        {error && (
          <p className="rounded-2xl border border-[#FF0F7B]/40 bg-[#FF0F7B]/10 p-3 text-[11px]">
            {error}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você"
            maxLength={280}
            rows={3}
            className={`${fieldClass} resize-none rounded-2xl`}
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-semibold">Cidade</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade"
              className={fieldClass}
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-semibold">Estado</span>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="UF"
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">País</span>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Seu país"
            className={fieldClass}
          />
        </label>
      </div>
    </Sheet>
  );
}
