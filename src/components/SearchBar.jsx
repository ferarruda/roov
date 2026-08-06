/**
 * Barra de Pesquisa global — ROOV Product, Cap. 4.4 e 9.
 *
 * A pesquisa não pertence a nenhuma tela: pertence ao sistema. Este componente
 * é só o gatilho — sempre leva para a mesma rota `/buscar`, de onde quer que
 * tenha sido tocado.
 */

import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useRoov } from '../state/RoovProvider.jsx';

const PLACEHOLDERS = [
  'Buscar lugares, vibes, cidades…',
  'Onde tomar um café tranquilo?',
  'Qual bar combina com hoje?',
  'Onde assistir ao pôr do sol?',
];

export function SearchBar({ className = '' }) {
  const { moment } = useRoov();
  // O placeholder acompanha o momento: de manhã pergunta café, à noite bar.
  const placeholder =
    moment.band.id === 'golden-hour'
      ? PLACEHOLDERS[3]
      : moment.hour >= 20
        ? PLACEHOLDERS[2]
        : moment.hour <= 11
          ? PLACEHOLDERS[1]
          : PLACEHOLDERS[0];

  return (
    <Link
      to="/buscar"
      className={`glass flex h-11 flex-1 items-center gap-2.5 rounded-full px-4 ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
      <span className="truncate text-xs text-[var(--muted-foreground)]">{placeholder}</span>
    </Link>
  );
}
