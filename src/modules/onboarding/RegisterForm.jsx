import { useState } from 'react';
import { AtSign, Lock, Mail, User } from 'lucide-react';
import { PrimaryButton, GhostButton } from '../../components/ui/primitives.jsx';
import { useAuth } from '../../state/AuthProvider.jsx';

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Validação leve no cliente, só para feedback rápido — a regra oficial é
  // a mesma do backend (RegisterDto) e quem decide de fato é a resposta da API.
  const canSubmit =
    email.trim().length > 0 &&
    username.length >= 3 &&
    username.length <= 30 &&
    USERNAME_PATTERN.test(username) &&
    name.trim().length >= 2 &&
    password.length >= 8 &&
    !submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await register({ email: email.trim(), username, name: name.trim(), password });
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar sua conta. Tente novamente.');
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
        <span className="mb-1.5 block text-sm font-semibold">Nome</span>
        <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
          <User className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Nome de usuário</span>
        <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
          <AtSign className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="seu_usuario"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
        <span className="mt-1 block px-1 text-[11px] text-[var(--muted-foreground)]">
          Letras minúsculas, números e underline. Entre 3 e 30 caracteres.
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Senha</span>
        <div className="glass flex h-11 items-center gap-2.5 rounded-full px-4">
          <Lock className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </label>

      <PrimaryButton type="submit" disabled={!canSubmit} className="mt-2">
        {submitting ? 'Criando conta…' : 'Criar conta'}
      </PrimaryButton>

      <GhostButton type="button" onClick={onSwitchToLogin}>
        Já tem conta? Entrar
      </GhostButton>
    </form>
  );
}
