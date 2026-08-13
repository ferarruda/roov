/**
 * Portão de entrada — login e cadastro reais.
 *
 * Visual espelha `SplashScreen.jsx`: mesmo badge gradiente, mesmo
 * `roov-gradient-text`. É a mesma marca falando, só que agora pedindo
 * credenciais em vez de contar a promessa do produto.
 */

import { useState } from 'react';
import { LoginForm } from './LoginForm.jsx';
import { RegisterForm } from './RegisterForm.jsx';

export function AuthModule() {
  const [mode, setMode] = useState('login');

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[var(--background)] px-6 pb-10 pt-14">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="roov-gradient flex h-16 w-16 items-center justify-center rounded-3xl text-2xl shadow-2xl shadow-[#7B2DFF]/30">
          🧭
        </span>
        <h1 className="roov-gradient-text text-3xl font-bold tracking-tight">ROOV</h1>
        <p className="max-w-[260px] text-sm leading-relaxed text-[var(--muted-foreground)]">
          {mode === 'login'
            ? 'Entre para continuar descobrindo experiências.'
            : 'Crie sua conta e comece a descobrir experiências.'}
        </p>
      </div>

      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  );
}
