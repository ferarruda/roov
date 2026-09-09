/**
 * Configurações — Fase 3, corte 3: só troca de senha por enquanto.
 *
 * Sucesso aqui encerra a sessão (o backend revoga tudo) — não precisa
 * fechar o sheet manualmente: `status` vira `'anonymous'` e `AuthGate`
 * desmonta a árvore inteira, Perfil incluso, em favor da tela de login.
 */

import { useState } from 'react';
import { GhostButton, PrimaryButton, Sheet } from '../../components/ui/primitives.jsx';
import { useAuth } from '../../state/AuthProvider.jsx';

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:border-white/30';

export function SettingsSheet({ open, onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      setError('As senhas novas não coincidem.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      // Sem onClose(): a troca de status pra 'anonymous' já desmonta o sheet.
    } catch (err) {
      setError(err.message ?? 'Não foi possível trocar a senha. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Configurações"
      subtitle="Trocar senha"
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

        <p className="text-[11px] text-[var(--muted-foreground)]">
          Trocar a senha encerra sua sessão em todos os aparelhos — você vai
          precisar entrar de novo com a senha nova.
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Senha atual</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Sua senha atual"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Nova senha</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Confirmar nova senha</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            className={fieldClass}
          />
        </label>
      </div>
    </Sheet>
  );
}
