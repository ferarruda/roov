/**
 * Splash — a primeira coisa que o produto diz sobre si mesmo.
 *
 * "As pessoas não procuram lugares. Elas procuram momentos." (Cap. 2.1)
 */

import { useEffect } from 'react';

export function SplashScreen({ onComplete, duration = 1900 }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <button
      type="button"
      onClick={onComplete}
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#050505] px-10 text-center"
    >
      <span className="roov-gradient flex h-20 w-20 items-center justify-center rounded-3xl text-3xl shadow-2xl shadow-[#7B2DFF]/30">
        🧭
      </span>
      <h1 className="roov-gradient-text animate-fade-up text-4xl font-bold tracking-tight">ROOV</h1>
      <p
        className="animate-fade-up max-w-[260px] text-sm leading-relaxed text-[var(--muted-foreground)]"
        style={{ animationDelay: '120ms' }}
      >
        As pessoas não procuram lugares.
        <br />
        Elas procuram momentos.
      </p>
    </button>
  );
}
