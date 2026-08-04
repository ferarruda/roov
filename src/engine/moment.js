/**
 * DNA do Momento — ROOV Product, Cap. 59. O motor mais dinâmico do produto.
 *
 * Considera horário, dia da semana, estação e clima e devolve um conjunto de
 * tags contextuais com peso. Na Regra de Prioridade (Cap. 68) o momento vence
 * o histórico: sábado 23h não é hora de recomendar café, mesmo que o usuário
 * ame café.
 */

/** Faixas de horário — cada uma tem identidade própria e tags associadas. */
const TIME_BANDS = [
  {
    id: 'amanhecer',
    from: 5,
    to: 8,
    label: 'Amanhecer',
    emoji: '🌅',
    color: '#FF7A1A',
    tags: { contemplativo: 0.9, tranquilo: 0.8, 'ao-ar-livre': 0.7, zen: 0.6 },
  },
  {
    id: 'manha',
    from: 8,
    to: 11,
    label: 'Energia Matinal',
    emoji: '⚡',
    color: '#FFC83D',
    tags: { energizante: 0.8, aconchegante: 0.7, tranquilo: 0.6, 'area-verde': 0.5 },
  },
  {
    id: 'pico',
    from: 11,
    to: 13,
    label: 'Pico do Dia',
    emoji: '☀️',
    color: '#FFC83D',
    tags: { movimentado: 0.8, autentico: 0.7, amigos: 0.6 },
  },
  {
    id: 'pausa',
    from: 13,
    to: 15,
    label: 'Pausa do Meio-Dia',
    emoji: '☕',
    color: '#FF6A2A',
    tags: { aconchegante: 0.9, relaxante: 0.8, intimista: 0.5 },
  },
  {
    id: 'tarde',
    from: 15,
    to: 17,
    label: 'Tarde Leve',
    emoji: '🌤️',
    color: '#8B5CFF',
    tags: { tranquilo: 0.8, descolado: 0.7, 'ao-ar-livre': 0.7, inspirador: 0.5 },
  },
  {
    id: 'golden-hour',
    from: 17,
    to: 19,
    label: 'Golden Hour',
    emoji: '🌇',
    color: '#FF7A1A',
    tags: { contemplativo: 1, rooftop: 0.9, romantico: 0.8, memoravel: 0.6 },
  },
  {
    id: 'inicio-noite',
    from: 19,
    to: 21,
    label: 'Início da Noite',
    emoji: '🌆',
    color: '#8B5CFF',
    tags: { romantico: 0.8, sofisticado: 0.8, intimista: 0.7, casal: 0.6 },
  },
  {
    id: 'noite',
    from: 21,
    to: 24,
    label: 'Vida Noturna',
    emoji: '🌃',
    color: '#FF0F7B',
    tags: { animado: 1, festivo: 0.9, energizante: 0.8, movimentado: 0.7 },
  },
  {
    id: 'madrugada',
    from: 0,
    to: 5,
    label: 'Madrugada',
    emoji: '🌙',
    color: '#7B2DFF',
    tags: { alternativo: 0.8, animado: 0.7, reservado: 0.5 },
  },
];

/** Simulação de clima. Trocar por integração real no `services/weather.js`. */
const WEATHER_PRESETS = {
  sunny: { label: 'Ensolarado', emoji: '☀️', outdoorFriendly: true },
  partly_cloudy: { label: 'Parcialmente nublado', emoji: '⛅', outdoorFriendly: true },
  cloudy: { label: 'Nublado', emoji: '☁️', outdoorFriendly: true },
  rainy: { label: 'Chuva', emoji: '🌧️', outdoorFriendly: false },
  storm: { label: 'Tempestade', emoji: '⛈️', outdoorFriendly: false },
};

function bandFor(hour) {
  return TIME_BANDS.find((b) => hour >= b.from && hour < b.to) ?? TIME_BANDS[0];
}

const WEEKDAY_LABELS = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
];

/**
 * Constrói o DNA do Momento para um instante.
 *
 * @param {Object} [ctx]
 * @param {Date} [ctx.now]
 * @param {keyof WEATHER_PRESETS} [ctx.condition]
 * @param {number} [ctx.tempC]
 * @param {string} [ctx.city]
 */
export function buildMomentDna(ctx = {}) {
  const now = ctx.now ?? new Date();
  const hour = now.getHours();
  const weekday = now.getDay();
  const band = bandFor(hour);

  const condition = ctx.condition ?? inferCondition(now);
  const weather = WEATHER_PRESETS[condition] ?? WEATHER_PRESETS.partly_cloudy;

  /** @type {Record<string, number>} */
  const tags = { ...band.tags };

  // Fim de semana amplifica o social; dia útil amplifica o prático.
  const isWeekend = weekday === 0 || weekday === 6;
  if (isWeekend) {
    bump(tags, 'amigos', 0.4);
    bump(tags, 'festivo', 0.3);
    bump(tags, 'ao-ar-livre', 0.3);
  } else {
    bump(tags, 'reservado', 0.25);
    bump(tags, 'aconchegante', 0.2);
  }

  // Clima ruim empurra o usuário para dentro; clima bom, para fora.
  if (!weather.outdoorFriendly) {
    bump(tags, 'aconchegante', 0.6);
    bump(tags, 'intimista', 0.4);
    tags['ao-ar-livre'] = Math.min(tags['ao-ar-livre'] ?? 0, 0.1);
    tags['area-verde'] = Math.min(tags['area-verde'] ?? 0, 0.1);
    tags.rooftop = Math.min(tags.rooftop ?? 0, 0.1);
  } else {
    bump(tags, 'ao-ar-livre', 0.25);
  }

  return {
    hour,
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday],
    isWeekend,
    band,
    label: band.label,
    emoji: band.emoji,
    color: band.color,
    weather: { condition, tempC: ctx.tempC ?? seasonalTemp(now), ...weather },
    city: ctx.city ?? 'São Paulo, SP',
    tags,
    /** Frase curta exibida no topo do Explorar. */
    headline: headlineFor(band, weather, isWeekend),
  };
}

function bump(map, key, value) {
  map[key] = Math.min(1, (map[key] ?? 0) + value);
}

/** Sem serviço de clima conectado, o dia se comporta de forma plausível. */
function inferCondition(now) {
  const month = now.getMonth();
  const rainySeason = month >= 10 || month <= 2; // verão no hemisfério sul
  if (rainySeason && now.getDate() % 3 === 0) return 'rainy';
  if (now.getDate() % 4 === 0) return 'cloudy';
  if (now.getHours() >= 18) return 'partly_cloudy';
  return 'sunny';
}

function seasonalTemp(now) {
  const month = now.getMonth();
  const base = month >= 10 || month <= 2 ? 27 : month >= 5 && month <= 7 ? 17 : 22;
  return base + (now.getHours() >= 18 ? -4 : 0);
}

function headlineFor(band, weather, isWeekend) {
  if (!weather.outdoorFriendly) return `${weather.emoji} ${weather.label} — experiências abrigadas`;
  if (band.id === 'golden-hour') return '🌇 Golden hour rolando agora';
  if (band.id === 'noite' && isWeekend) return '🌃 Noite de fim de semana';
  if (band.id === 'amanhecer') return '🌅 A cidade acabou de acordar';
  return `${band.emoji} ${band.label}`;
}

/**
 * Compatibilidade entre um lugar e o momento atual (0–1).
 * Considera o DNA e também o horário de funcionamento — recomendar um lugar
 * fechado é o pior erro que o motor pode cometer.
 */
export function momentAffinity(place, moment) {
  const dnaScore = tagOverlap(place, moment.tags);
  const openNow = isOpenAt(place.hours, moment.hour, moment.weekday);
  // Lugar fechado não é descartado, mas cai bastante: pode entrar como "para depois".
  return openNow ? dnaScore : dnaScore * 0.25;
}

function tagOverlap(place, momentTags) {
  const entries = Object.entries(momentTags);
  if (entries.length === 0) return 0;
  const placeTags = new Set(
    ['ambiente', 'vibe', 'publico', 'perfil'].flatMap((g) =>
      (place.dna?.[g] ?? []).map((r) => r.id),
    ),
  );
  let hit = 0;
  let total = 0;
  for (const [id, weight] of entries) {
    total += weight;
    if (placeTags.has(id)) hit += weight;
  }
  return total === 0 ? 0 : hit / total;
}

/** @param {{open:string, close:string, closedOn?:number[]}} hours */
export function isOpenAt(hours, hour, weekday) {
  if (!hours) return true;
  if (hours.closedOn?.includes(weekday)) return false;
  const open = toMinutes(hours.open);
  let close = toMinutes(hours.close);
  if (close <= open) close += 24 * 60; // fecha depois da meia-noite
  const nowMin = hour * 60;
  return nowMin >= open && nowMin <= close;
}

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function fromMinutes(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "2h30" | "45min" → minutos */
export function parseDuration(text) {
  const hours = /(\d+)\s*h/.exec(text ?? '');
  const mins = /(\d+)\s*min/.exec(text ?? '');
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}
