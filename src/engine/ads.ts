import { ADS, AD_KINDS, type AdKind } from '../data/ads';
import { courseReward, serviceTime } from './modifiers';
import { randInt } from './rng';
import type { GameState } from './types';

/** Offre « pub » disponible maintenant (ou null). */
export function adOffer(state: GameState): AdKind | null {
  const ad = state.ad ?? { nextAt: ADS.firstAt, kind: 'double' as AdKind };
  return state.time >= ad.nextAt ? ad.kind : null;
}

/** Bonus ×2 actif ? */
export function boostActive(state: GameState): boolean {
  return (state.boostUntil ?? 0) > state.time;
}

/** Éclats d'une bourse : quelques minutes de gains estimés des salles de cours. */
export function adCoins(state: GameState): number {
  let perMin = 0;
  for (const st of Object.values(state.stations)) {
    if (st.kind !== 'course') continue;
    const r = courseReward(st, { house: null, mood: 100 }, state);
    perMin += (r * st.seats.length * 60) / Math.max(1, serviceTime(st, 0, undefined, state));
  }
  return Math.max(ADS.coinsMin, Math.round(perMin * ADS.coinsMinutes));
}

function scheduleNext(state: GameState): void {
  state.ad = { nextAt: state.time + ADS.cooldown, kind: AD_KINDS[randInt(state, AD_KINDS.length)] };
}

/** Récompense après la vidéo. Renvoie false s'il n'y avait pas d'offre. */
export function claimAd(state: GameState): boolean {
  const kind = adOffer(state);
  if (!kind) return false;
  if (kind === 'double') state.boostUntil = state.time + ADS.doubleSeconds;
  if (kind === 'coins') {
    const n = adCoins(state);
    state.coins += n;
    state.totals.coinsEarned += n;
  }
  if (kind === 'gems') state.gems += ADS.gems;
  scheduleNext(state);
  return true;
}

/** Offre refusée : elle reviendra après le temps de recharge. */
export function dismissAd(state: GameState): void {
  if (adOffer(state)) scheduleNext(state);
}
