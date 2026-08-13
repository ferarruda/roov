import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { PrimaryButton, GhostButton } from '../../components/ui/primitives.jsx';
import { useAuth } from '../../state/AuthProvider.jsx';

export function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(err.message ?? 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-2xl border border-[#FF0F7B]/40 bg-[#FF0F7B]/10 p-3 text-[11px]">
          {error}
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">E-mail</span>
        <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
          <Mail className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Senha</span>
        <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
          <Lock className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </label>

      <PrimaryButton type="submit" disabled={!canSubmit} className="mt-2">
        {submitting ? 'Entrando…' : 'Entrar'}
      </PrimaryButton>

      <GhostButton type="button" onClick={onSwitchToRegister}>
        Ainda não tem conta? Criar conta
      </GhostButton>
    </form>
  );
}
