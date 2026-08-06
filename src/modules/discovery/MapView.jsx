/**
 * Mapa — ROOV Product, Cap. 18. Descoberta geográfica.
 *
 * Fluxo: abrir mapa → pesquisar → filtrar → selecionar local → preview →
 * abrir → salvar → agenda → post.
 *
 * O canvas aqui é uma projeção equirretangular simples sobre um grid, não um
 * tile server: mantém o front rodando sem chave de API. Trocar por MapLibre ou
 * Google Maps significa substituir só `project()` e o `<div>` de fundo — os
 * pins, o preview e os filtros continuam iguais.
 */

import { useMemo, useRef, useState } from 'react';
import { Camera, Locate, Minus, Plus, Trees, UtensilsCrossed, Wine } from 'lucide-react';
import { PlaceCard } from '../../components/PlaceCard.jsx';
import { EmptyState } from '../../components/ui/primitives.jsx';
import { CATEGORY_BY_ID } from '../../domain/taxonomy.js';
import { useRoov } from '../../state/RoovProvider.jsx';

const CATEGORY_ICONS = {
  entretenimento: Wine,
  gastronomia: UtensilsCrossed,
  natureza: Trees,
  passeios: Camera,
};

/** Bounding box de São Paulo usado pela projeção. */
const BOUNDS = { minLat: -23.68, maxLat: -23.46, minLng: -46.76, maxLng: -46.56 };

function project({ lat, lng }) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: clamp(x, 4, 96), y: clamp(y, 6, 94) };
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function MapView({ places }) {
  const { moment, library } = useRoov();
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const pins = useMemo(
    () => places.map((place) => ({ place, ...project(place.coords) })),
    [places],
  );

  const selected = places.find((p) => p.id === selectedId) ?? null;

  const startDrag = (point) => {
    drag.current = { x: point.x - offset.x, y: point.y - offset.y };
  };
  const moveDrag = (point) => {
    if (!drag.current) return;
    setOffset({ x: point.x - drag.current.x, y: point.y - drag.current.y });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="relative h-full">
      <div
        className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={(e) => startDrag({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => moveDrag({ x: e.clientX, y: e.clientY })}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchMove={(e) => moveDrag({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={endDrag}
        onClick={() => setSelectedId(null)}
      >
        <div
          className="absolute inset-0 origin-center transition-transform duration-100"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        >
          <MapCanvas />

          {pins.map(({ place, x, y }) => {
            const meta = CATEGORY_BY_ID[place.category];
            const Icon = CATEGORY_ICONS[place.category];
            const active = place.id === selectedId;
            const inLibrary = library.kindsOf(place.id).length > 0;

            return (
              <button
                key={place.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(active ? null : place.id);
                }}
                aria-label={place.name}
                className="absolute -translate-x-1/2 -translate-y-full transition"
                style={{ left: `${x}%`, top: `${y}%`, zIndex: active ? 30 : 10 }}
              >
                <span
                  className={`flex items-center justify-center rounded-full border-2 shadow-lg transition ${
                    active ? 'h-11 w-11' : 'h-8 w-8'
                  }`}
                  style={{
                    background: `${meta.hex}e6`,
                    borderColor: inLibrary ? '#FFFFFF' : `${meta.hex}`,
                  }}
                >
                  <Icon className={active ? 'h-5 w-5 text-white' : 'h-4 w-4 text-white'} />
                </span>
                {active && (
                  <span className="mt-1 block whitespace-nowrap rounded-full bg-black/75 px-2 py-0.5 text-[10px] backdrop-blur">
                    {place.name}
                  </span>
                )}
              </button>
            );
          })}

          {/* Posição do usuário, no centro do bounding box */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: '50%', top: '50%' }}
          >
            <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#8B5CFF] shadow-[0_0_0_6px_rgba(139,92,255,0.25)]" />
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute right-3 top-3 z-40 flex flex-col gap-2">
        <MapControl label="Aproximar" onClick={() => setZoom((z) => clamp(z + 0.25, 0.75, 2.5))}>
          <Plus className="h-4 w-4" />
        </MapControl>
        <MapControl label="Afastar" onClick={() => setZoom((z) => clamp(z - 0.25, 0.75, 2.5))}>
          <Minus className="h-4 w-4" />
        </MapControl>
        <MapControl
          label="Centralizar"
          onClick={() => {
            setOffset({ x: 0, y: 0 });
            setZoom(1);
          }}
        >
          <Locate className="h-4 w-4" />
        </MapControl>
      </div>

      {/* Preview do pin selecionado — estado "preview" do Place Card */}
      {selected && (
        <div className="animate-fade-up absolute inset-x-3 bottom-3 z-40">
          <PlaceCard place={selected} variant="preview" />
        </div>
      )}

      {!selected && places.length > 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-20 text-center text-[11px] text-[var(--muted-foreground)]">
          {places.length} lugares · {moment.headline}
        </p>
      )}

      {places.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050505]/70">
          <EmptyState
            emoji="🗺️"
            title="Nenhum lugar com esses filtros"
            message="Remova algum filtro para ver mais experiências por aqui."
          />
        </div>
      )}
    </div>
  );
}

function MapControl({ label, children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="glass flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95"
      {...rest}
    >
      {children}
    </button>
  );
}

/** Fundo do mapa: grid + manchas verdes e rio, só para dar leitura espacial. */
function MapCanvas() {
  return (
    <div className="absolute inset-0 bg-[#0c0c10]">
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="absolute left-[30%] top-[52%] h-32 w-40 rounded-full bg-[#1b3d2a]/50 blur-2xl" />
      <div className="absolute left-[62%] top-[70%] h-36 w-36 rounded-full bg-[#1b3d2a]/45 blur-2xl" />
      <div className="absolute left-[12%] top-[18%] h-28 w-32 rounded-full bg-[#1b3d2a]/40 blur-2xl" />
      <div
        className="absolute inset-y-0 left-[46%] w-10 -skew-x-12 bg-[#12233a]/70 blur-sm"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
    </div>
  );
}
