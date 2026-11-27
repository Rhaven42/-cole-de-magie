import { ADS } from '../data/ads';
import { GEM_BONUS, GEM_ITEMS, OFFLINE_BASE, TREE, type GemItemId } from '../data/gemShop';
import { courseReward, serviceTime } from './modifiers';
import type { GameState } from './types';

/** Éclats gagnés par minute (estimation à partir des salles de cours). */
export function incomePerMinute(state: GameState): number {
  let perMin = 0;
  for (const st of Object.values(state.stations)) {
    if (st.kind !== 'course') continue;
    const r = courseReward(st, { house: null, mood: 100 }, state);
    perMin += (r * st.seats.length * 60) / Math.max(1, serviceTime(st, 0, undefined, state));
  }
  return perMin;
}

export function gemLevel(state: GameState, id: GemItemId): number {
  return state.gemShop?.[id] ?? 0;
}

/** Prix en Diamants du prochain achat, ou null si niveau max. */
export function gemItemCost(state: GameState, id: GemItemId): number | null {
  const it = GEM_ITEMS.find((x) => x.id === id);
  if (!it) return null;
  const lvl = gemLevel(state, id);
  if (it.max > 0 && lvl >= it.max) return null;
  return it.cost + it.costStep * (it.max > 0 ? lvl : 0);
}

export function buyGemItem(state: GameState, id: GemItemId): boolean {
  const cost = gemItemCost(state, id);
  if (cost === null || state.gems < cost) return false;
  state.gems -= cost;
  const it = GEM_ITEMS.find((x) => x.id === id)!;
  if (it.max > 0) {
    state.gemShop = { ...state.gemShop, [id]: gemLevel(state, id) + 1 };
    return true;
  }
  if (id === 'fortune') {
    state.boostUntil = Math.max(state.boostUntil ?? 0, state.time) + GEM_BONUS.fortuneSeconds;
  }
  if (id === 'treasure') {
    const n = Math.max(
      ADS.coinsMin,
      Math.round(incomePerMinute(state) * GEM_BONUS.treasureMinutes),
    );
    state.coins += n;
    state.totals.coinsEarned += n;
  }
  return true;
}

/** Éclats du Coffre du Trésorier (pour l'affichage). */
export function treasureCoins(state: GameState): number {
  return Math.max(ADS.coinsMin, Math.round(incomePerMinute(state) * GEM_BONUS.treasureMinutes));
}

/** Plafond des gains hors-ligne (s). */
export function offlineCap(state: GameState): number {
  return OFFLINE_BASE.seconds + OFFLINE_BASE.perLevel * gemLevel(state, 'hourglass');
}

// ── Arbre enchanté ──────────────────────────────────────────────────────────

export function treeEvery(state: GameState): number {
  return gemLevel(state, 'fertilizer') > 0 ? TREE.every / 2 : TREE.every;
}

/** Secondes réelles avant le prochain fruit (0 = prêt). */
export function treeWait(state: GameState, nowMs: number): number {
  const ready = state.treeReadyAt ?? 0;
  return Math.max(0, Math.ceil((ready - nowMs) / 1000));
}

export function treeCoins(state: GameState): number {
  return Math.max(TREE.coinsMin, Math.round(incomePerMinute(state) * TREE.coinsMinutes));
}

/** Cueille le fruit (avec la pub : +Diamant). Renvoie false s'il n'est pas mûr. */
export function harvestTree(state: GameState, nowMs: number, withAd: boolean): boolean {
  if (treeWait(state, nowMs) > 0) return false;
  const n = treeCoins(state);
  state.coins += n;
  state.totals.coinsEarned += n;
  if (withAd) state.gems += TREE.adGems;
  state.treeReadyAt = nowMs + treeEvery(state) * 1000;
  return true;
}
