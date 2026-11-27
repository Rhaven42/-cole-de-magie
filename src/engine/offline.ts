import { tick } from './tick';
import type { GameState } from './types';

/** Durée max de rattrapage hors-ligne (s). Une amélioration J7 l'étendra. */
export const OFFLINE_MAX_SECONDS = 2 * 3600;
/** Pas de simulation pendant le rattrapage (plus grossier que le tick temps réel). */
export const OFFLINE_STEP = 1;

export interface OfflineSummary {
  seconds: number;
  coins: number;
  courses: number;
  arrived: number;
  left: number;
}

/** Secondes écoulées depuis la dernière sauvegarde, protégées contre une horloge reculée. */
export function elapsedSince(state: GameState, nowMs: number): number {
  const delta = (nowMs - state.lastSavedAt) / 1000;
  if (!Number.isFinite(delta) || delta <= 0) return 0;
  return Math.min(delta, OFFLINE_MAX_SECONDS);
}

export function catchUp(state: GameState, seconds: number): OfflineSummary {
  const before = { ...state.totals };
  const pendingOf = () => Object.values(state.stations).reduce((a, st) => a + st.pending, 0);
  const coinsBefore = state.totals.coinsEarned + pendingOf();
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(OFFLINE_STEP, remaining);
    tick(state, dt);
    remaining -= dt;
  }
  return {
    seconds,
    coins: Math.round(state.totals.coinsEarned + pendingOf() - coinsBefore),
    courses: state.totals.coursesPassed - before.coursesPassed,
    arrived: state.totals.arrived - before.arrived,
    left: state.totals.left - before.left,
  };
}
