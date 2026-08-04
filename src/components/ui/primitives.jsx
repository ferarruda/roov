/**
 * Primitivas visuais do design system ROOV.
 * Vidro fosco sobre fundo quase preto, cantos generosos, gradiente só onde a
 * marca precisa aparecer.
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';

export function GlassCard({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`glass rounded-2xl ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Chip({ active = false, color, className = '', children, ...rest }) {
  const style = active && color ? { background: `${color}26`, borderColor: color, color } : undefined;
  return (
    <button
      type="button"
      style={style}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition ${
        active
          ? 'border-white/70 bg-white/15 text-white'
          : 'border-white/10 bg-white/5 text-[var(--muted-foreground)] hover:bg-white/10'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Tag({ color, className = '', children }) {
  return (
    <span
      style={color ? { background: `${color}1f`, color } : undefined}
      className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-[var(--muted-foreground)] ${className}`}
    >
      {children}
    </span>
  );
}

export function GradientBadge({ className = '', children }) {
  return (
    <span
      className={`roov-gradient inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${className}`}
    >
      {children}
    </span>
  );
}

export function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`glass flex h-10 w-10 items-center justify-center rounded-full text-[var(--foreground)] transition active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SegmentedTabs({ value, onChange, options, className = '' }) {
  return (
    <div className={`glass flex rounded-full p-1 ${className}`} role="tablist">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active ? 'bg-white text-black' : 'text-[var(--muted-foreground)]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Bottom sheet — o padrão de navegação secundária do app. */
export function Sheet({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="animate-sheet-up relative flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-[#0b0b0d]">
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
            )}
          </div>
          <IconButton label="Fechar" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="scrollbar-hide flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-white/10 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function PrimaryButton({ className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`roov-gradient w-full rounded-full py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`w-full rounded-full border border-white/15 bg-white/5 py-3 text-sm font-medium transition hover:bg-white/10 active:scale-[0.98] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({ emoji = '🧭', title, message, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="text-sm text-[var(--muted-foreground)]">{message}</p>}
      {action}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[70] flex justify-center px-6">
      <div className="animate-fade-up glass rounded-full px-4 py-2.5 text-sm shadow-xl">
        {toast.message}
      </div>
    </div>
  );
}
