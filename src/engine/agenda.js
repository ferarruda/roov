/**
 * Algoritmo da Agenda — ROOV Product, Cap. 64.
 *
 * A agenda não é uma lista de compromissos: é planejamento assistido. O motor
 * lê o roteiro do dia e avisa o que o usuário não teria como saber sozinho —
 * lugar fechado no horário, deslocamento impossível, janela ociosa, clima
 * incompatível com atividade externa.
 *
 * Nada aqui bloqueia o usuário. São avisos, nunca travas.
 */

import { fromMinutes, isOpenAt, parseDuration, toMinutes } from './moment.js';
import { topDnaTags } from './dna.js';

/** Distância aproximada em km entre dois pontos (Haversine). */
export function distanceBetween(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const toRad = (deg) => (deg * Math.PI) / 180;

/** Tempo de deslocamento estimado em minutos — trânsito de cidade grande. */
export function travelMinutes(km) {
  if (km < 0.5) return 8;
  if (km < 1.5) return 15;
  if (km < 3) return 22;
  if (km < 6) return 32;
  if (km < 12) return 48;
  return 65;
}

const OUTDOOR_CATEGORIES = new Set(['natureza', 'passeios']);

/**
 * Analisa um dia da agenda e devolve avisos ordenados por severidade.
 *
 * @param {import('../domain/types.js').AgendaItem[]} items itens do mesmo dia, em ordem de horário
 * @param {Record<string, import('../domain/types.js').Place>} placeById
 * @param {ReturnType<import('./moment.js').buildMomentDna>} moment
 */
export function analyzeDay(items, placeById, moment) {
  const insights = [];
  if (!items.length) return insights;

  const weekday = new Date(`${items[0].date}T12:00:00`).getDay();

  items.forEach((item, index) => {
    const place = placeById[item.placeId];
    if (!place) return;

    const startMin = toMinutes(item.time);
    const endMin = startMin + parseDuration(item.duration);

    // 1. Lugar fechado no horário planejado — o erro mais caro para o usuário.
    if (!isOpenAt(place.hours, Math.floor(startMin / 60), weekday)) {
      insights.push({
        id: `closed-${item.id}`,
        severity: 'critical',
        emoji: '🔒',
        title: `${place.name} pode estar fechado`,
        message: place.hours?.closedOn?.includes(weekday)
          ? `Este lugar não abre neste dia da semana.`
          : `Funciona das ${place.hours.open} às ${place.hours.close} — você planejou ${item.time}.`,
        itemId: item.id,
      });
    }

    // 2. Atividade ao ar livre em dia ruim.
    if (!moment.weather.outdoorFriendly && OUTDOOR_CATEGORIES.has(place.category)) {
      insights.push({
        id: `weather-${item.id}`,
        severity: 'warning',
        emoji: moment.weather.emoji,
        title: `${place.name} é ao ar livre`,
        message: `Previsão de ${moment.weather.label.toLowerCase()}. Vale ter um plano B abrigado.`,
        itemId: item.id,
      });
    }

    // 3. Deslocamento entre uma experiência e a próxima.
    const next = items[index + 1];
    if (next) {
      const nextPlace = placeById[next.placeId];
      const km = distanceBetween(place.coords, nextPlace?.coords);
      const travel = travelMinutes(km);
      const gap = toMinutes(next.time) - endMin;

      if (km > 0.4 && gap < travel) {
        insights.push({
          id: `travel-${item.id}`,
          severity: 'warning',
          emoji: '🚗',
          title: 'Tempo de deslocamento apertado',
          message: `São ~${km.toFixed(1)} km até ${nextPlace?.name} (${travel} min). Chegar às ${fromMinutes(
            endMin + travel + 5,
          )} seria mais realista.`,
          itemId: item.id,
        });
      } else if (gap > 150 && km < 3) {
        insights.push({
          id: `gap-${item.id}`,
          severity: 'suggestion',
          emoji: '✨',
          title: `Janela de ${Math.round(gap / 60)}h entre as duas`,
          message: `${place.name} e ${nextPlace?.name} são perto. Cabe mais uma experiência no meio.`,
          itemId: item.id,
        });
      }
    }
  });

  // 4. Dia sobrecarregado.
  const totalMin = items.reduce((sum, i) => sum + parseDuration(i.duration), 0);
  if (items.length > 4 || totalMin > 600) {
    insights.push({
      id: 'dense',
      severity: 'info',
      emoji: '⏱️',
      title: 'Dia bem cheio',
      message: `${items.length} experiências somando ~${Math.round(totalMin / 60)}h. Uma pausa entre os blocos ajuda.`,
    });
  }

  // 5. Arco emocional do dia — o DNA do roteiro precisa variar.
  const labels = items.flatMap((item) => topDnaTags(placeById[item.placeId]?.dna, 3).map((t) => t.id));
  const calm = labels.some((l) => ['tranquilo', 'zen', 'contemplativo', 'relaxante'].includes(l));
  const energy = labels.some((l) => ['energizante', 'animado', 'festivo', 'aventureiro'].includes(l));

  if (items.length >= 2 && energy && !calm) {
    insights.push({
      id: 'dna-balance',
      severity: 'info',
      emoji: '🧬',
      title: 'Roteiro só de alta energia',
      message: 'Um momento contemplativo no meio — parque, café, mirante — deixaria o dia mais memorável.',
    });
  }
  if (items.length >= 2 && calm && !energy) {
    insights.push({
      id: 'dna-energy',
      severity: 'info',
      emoji: '🧬',
      title: 'Roteiro inteiro em ritmo lento',
      message: 'Uma experiência mais social criaria contraste e fecharia melhor o dia.',
    });
  }

  const order = { critical: 0, warning: 1, suggestion: 2, info: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Agrupamento oficial da agenda — Cap. 15. */
export function groupAgenda(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = {
    hoje: { label: 'Hoje', items: [] },
    amanha: { label: 'Amanhã', items: [] },
    semana: { label: 'Esta semana', items: [] },
    mes: { label: 'Este mês', items: [] },
    depois: { label: 'Mais adiante', items: [] },
    'sem-data': { label: 'Sem data', items: [] },
  };

  for (const item of items) {
    if (!item.date) {
      buckets['sem-data'].items.push(item);
      continue;
    }
    const date = new Date(`${item.date}T00:00:00`);
    const diffDays = Math.round((date - today) / 86_400_000);

    if (diffDays <= 0) buckets.hoje.items.push(item);
    else if (diffDays === 1) buckets.amanha.items.push(item);
    else if (diffDays <= 7) buckets.semana.items.push(item);
    else if (diffDays <= 31) buckets.mes.items.push(item);
    else buckets.depois.items.push(item);
  }

  for (const bucket of Object.values(buckets)) {
    bucket.items.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }

  return Object.entries(buckets)
    .map(([id, bucket]) => ({ id, ...bucket }))
    .filter((bucket) => bucket.items.length > 0);
}
