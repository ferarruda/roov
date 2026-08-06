/**
 * Sistema Oficial de Navegação — ROOV Product, Cap. 8.
 *
 * Estrutura principal: quatro abas (Mapa, Comunidades, Salvos, Perfil) e um
 * Floating Action Button central para Criar Post. Telas de detalhe e a
 * pesquisa escondem a barra: são navegação secundária, não destino.
 */

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Map, Plus, User, Users } from 'lucide-react';
import { useRoov } from '../state/RoovProvider.jsx';
import { Toast } from './ui/primitives.jsx';

const TABS = [
  { to: '/', label: 'Mapa', icon: Map, end: true },
  { to: '/comunidades', label: 'Comunidades', icon: Users },
  { to: '/salvos', label: 'Salvos', icon: Bookmark },
  { to: '/perfil', label: 'Perfil', icon: User },
];

/** Rotas onde a barra inferior não aparece. */
const FULLSCREEN_PREFIXES = ['/lugar/', '/comunidade/', '/buscar', '/criar'];

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useRoov();

  const hideNav = FULLSCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-[var(--background)]">
      <main className="scrollbar-hide flex-1 overflow-y-auto">{children}</main>

      {!hideNav && (
        <nav className="absolute inset-x-0 bottom-0 z-50 border-t border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="flex items-end justify-around px-2 pb-5 pt-2">
            {TABS.slice(0, 2).map((tab) => (
              <TabLink key={tab.to} tab={tab} />
            ))}

            <button
              type="button"
              aria-label="Criar experiência"
              onClick={() => navigate('/criar')}
              className="-mt-7 flex flex-col items-center"
            >
              <span className="roov-gradient flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/50 transition active:scale-95">
                <Plus className="h-6 w-6 text-white" />
              </span>
            </button>

            {TABS.slice(2).map((tab) => (
              <TabLink key={tab.to} tab={tab} />
            ))}
          </div>
        </nav>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function TabLink({ tab }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `flex min-w-[62px] flex-col items-center gap-1 py-1 transition ${
          isActive ? 'text-white' : 'text-[var(--muted-foreground)]'
        }`
      }
    >
      <Icon className="h-[22px] w-[22px]" />
      <span className="text-[10px]">{tab.label}</span>
    </NavLink>
  );
}

/** Cabeçalho das telas de navegação secundária. */
export function DetailHeader({ title, onBack, right }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-[#050505]/85 px-4 py-3 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Voltar"
        onClick={onBack ?? (() => navigate(-1))}
        className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
      {right}
    </header>
  );
}
