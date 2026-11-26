import { COURSES, type CourseId } from '../data/courses';
import { RELIC_SETS, RELICS } from '../data/collection';
import { DAILY_COIN_SCALE, DAILY_REWARDS } from '../data/daily';
import { ENVIRONMENTS, PRESTIGE } from '../data/environments';
import { MANAGER_RULES, STORAGE } from '../data/managers';
import { pick } from './rng';
import { createGame } from './state';
import type { GameEvent, GameState, Station } from './types';

// ─── Coffres et récolte ──────────────────────────────────────────────────────

export function storageCap(st: Station): number {
  if (st.kind !== 'course') return 0;
  return Math.round(COURSES[st.courseId!].reward * (STORAGE.base + STORAGE.perLevel * st.level));
}

/** Dépose des Éclats dans le coffre de la salle (plafonné). Renvoie le montant réellement stocké. */
export function deposit(st: Station, amount: number): number {
  const room = Math.max(0, storageCap(st) - st.pending);
  const put = Math.min(room, amount);
  st.pending += put;
  return put;
}

export function collect(state: GameState, stationId: string): number {
  const st = state.stations[stationId];
  if (!st || st.pending <= 0) return 0;
  const n = Math.floor(st.pending);
  st.pending -= n;
  state.coins += n;
  state.totals.coinsEarned += n;
  return n;
}

export function collectAll(state: GameState): number {
  return Object.keys(state.stations).reduce((sum, id) => sum + collect(state, id), 0);
}

// ─── Managers ────────────────────────────────────────────────────────────────

export function managerCost(state: GameState, stationId: string): number | null {
  const st = state.stations[stationId];
  if (!st || st.kind !== 'course' || state.managers[stationId]) return null;
  return Math.round(
    COURSES[st.courseId!].price * MANAGER_RULES.priceFactor + MANAGER_RULES.priceBase,
  );
}

export function hireManager(state: GameState, stationId: string): boolean {
  const cost = managerCost(state, stationId);
  if (cost === null || state.coins < cost) return false;
  state.coins -= cost;
  state.managers[stationId] = true;
  return true;
}

export function managerTimeMult(state: GameState, st: Station): number {
  return state.managers[st.id] ? 1 - MANAGER_RULES.speedBonus : 1;
}

// ─── Reliques ────────────────────────────────────────────────────────────────

export function grantRelic(state: GameState, events: GameEvent[]): string {
  const r = pick(state, RELICS);
  state.meta.relics[r.id] = (state.meta.relics[r.id] ?? 0) + 1;
  events.push({ type: 'relic', id: r.id });
  return r.id;
}

export function relicCount(state: GameState): number {
  return RELICS.filter((r) => (state.meta.relics[r.id] ?? 0) > 0).length;
}

export function completeSets(state: GameState): number {
  return RELIC_SETS.filter((set) =>
    RELICS.filter((r) => r.set === set).every((r) => (state.meta.relics[r.id] ?? 0) > 0),
  ).length;
}

export { metaMult as metaCoinMult } from './modifiers';

// ─── Récompense quotidienne ──────────────────────────────────────────────────

/** Numéro de jour (UTC) d'un horodatage en ms. */
export function dayNumber(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

export function canClaimDaily(state: GameState, day: number): boolean {
  return state.meta.dailyDay === null || day > state.meta.dailyDay;
}

/** Jour du cycle (0–6) qui serait réclamé aujourd'hui. */
export function nextDailyIndex(state: GameState, day: number): number {
  const consecutive = state.meta.dailyDay !== null && day === state.meta.dailyDay + 1;
  return consecutive ? state.meta.dailyStreak % DAILY_REWARDS.length : 0;
}

export function dailyCoins(state: GameState, base: number): number {
  const rooms = Object.values(state.stations).filter((s) => s.kind === 'course').length;
  return Math.round(base * (1 + rooms * DAILY_COIN_SCALE));
}

export function claimDaily(state: GameState, day: number, events: GameEvent[] = []): boolean {
  if (!canClaimDaily(state, day)) return false;
  const idx = nextDailyIndex(state, day);
  const r = DAILY_REWARDS[idx];
  if (r.coins) {
    const c = dailyCoins(state, r.coins);
    state.coins += c;
    state.totals.coinsEarned += c;
  }
  if (r.gems) state.gems += r.gems;
  if (r.relic) grantRelic(state, events);
  state.meta.dailyStreak = idx + 1;
  state.meta.dailyDay = day;
  return true;
}

// ─── Prestige : reconstruire dans un nouvel environnement ───────────────────

export function prestigeRequirement(state: GameState): number {
  return PRESTIGE.graduatesBase + PRESTIGE.graduatesPerLevel * state.meta.prestige;
}

export function canPrestige(state: GameState): boolean {
  return state.totals.graduated >= prestigeRequirement(state);
}

export function nextEnvironment(state: GameState): number {
  return (state.meta.env + 1) % ENVIRONMENTS.length;
}

/**
 * Repart de zéro dans l'environnement suivant. Conserve : gemmes, reliques,
 * récompense quotidienne, niveau de prestige (+1). Renvoie la nouvelle partie.
 */
export function prestige(state: GameState, seed: number, now: number): GameState | null {
  if (!canPrestige(state)) return null;
  const meta = {
    ...state.meta,
    relics: { ...state.meta.relics },
    prestige: state.meta.prestige + 1,
    env: nextEnvironment(state),
  };
  const g = createGame(seed, now, meta);
  g.gems = state.gems + PRESTIGE.gems;
  return g;
}

export type { CourseId };
