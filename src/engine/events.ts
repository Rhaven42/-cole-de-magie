import { EVENT_RULES, EVENTS, TIMED_EVENTS, type EventId } from '../data/events';
import { random, randInt, weightedIndex } from './rng';
import type { GameEvent, GameState, Station } from './types';

export function isActive(state: GameState, id: EventId, stationId?: string): boolean {
  return state.events.some(
    (e) =>
      e.id === id && e.until > state.time && (stationId === undefined || e.stationId === stationId),
  );
}

export function startEvent(
  state: GameState,
  id: EventId,
  events: GameEvent[],
  stationId?: string,
): void {
  const def = EVENTS[id];
  if (def.duration > 0) state.events.push({ id, until: state.time + def.duration, stationId });
  let value: number | undefined;
  switch (id) {
    case 'banquet': {
      const students = Object.values(state.students).filter((s) => s.house);
      for (const s of students) s.mood = Math.min(100, s.mood + EVENT_RULES.banquetMood);
      value = students.length * EVENT_RULES.banquetCoinsPerStudent;
      state.coins += value;
      state.totals.coinsEarned += value;
      break;
    }
    case 'ghost': {
      const rooms = Object.values(state.stations).filter((s) => s.kind === 'course');
      const room = rooms[randInt(state, rooms.length)];
      stationId = room.id;
      state.events[state.events.length - 1].stationId = room.id;
      for (const seat of room.seats) {
        const s = seat.occupant !== null ? state.students[seat.occupant] : undefined;
        if (s) s.mood = Math.max(0, s.mood + EVENT_RULES.ghostMood);
      }
      break;
    }
    case 'owl':
      state.gems += EVENT_RULES.owlGems;
      value = EVENT_RULES.owlGems;
      break;
    case 'inspection': {
      const good = state.stations.reception.queue.length <= EVENT_RULES.inspectionMaxQueue;
      value = good ? EVENT_RULES.inspectionGood : EVENT_RULES.inspectionBad;
      state.reputation = Math.max(0, state.reputation + value);
      break;
    }
    case 'explosion': {
      const st = stationId ? state.stations[stationId] : undefined;
      if (st) st.closedUntil = state.time + def.duration;
      break;
    }
    default:
      break;
  }
  events.push({ type: 'event', id, stationId, value });
}

/** Planifie et déclenche les événements périodiques ; purge les effets expirés. */
export function handleEvents(state: GameState, events: GameEvent[]): void {
  state.events = state.events.filter((e) => e.until > state.time);
  if (state.time < state.nextEventAt) return;
  const weights = TIMED_EVENTS.map((id) => EVENTS[id].weight ?? 1);
  startEvent(state, TIMED_EVENTS[weightedIndex(state, weights)], events);
  const span = EVENT_RULES.maxInterval - EVENT_RULES.minInterval;
  state.nextEventAt = state.time + EVENT_RULES.minInterval + random(state) * span;
}

export function isClosed(state: GameState, st: Station): boolean {
  return st.closedUntil > state.time;
}
