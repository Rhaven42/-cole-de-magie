import { COURSE_IDS, type CourseId } from '../data/courses';
import { SERVICES } from '../data/stations';
import {
  addSeat,
  addSeatCost,
  buyCourse,
  buyDorm,
  courseCost,
  dormCost,
  levelUp,
  levelUpCost,
  seatUpgradeCost,
  trackCost,
  upgradeSeat,
  upgradeTrack,
} from './actions';
import { estimatedWait } from './modifiers';
import type { GameState, Station } from './types';

export type Purchase =
  | { kind: 'levelUp'; stationId: string; cost: number }
  | { kind: 'addSeat'; stationId: string; cost: number }
  | { kind: 'seat'; stationId: string; seat: number; cost: number }
  | { kind: 'track'; stationId: string; trackId: string; cost: number }
  | { kind: 'course'; courseId: CourseId; cost: number }
  | { kind: 'dorm'; cost: number };

/** Achats possibles pour un lieu (indépendamment du solde). */
export function stationPurchases(st: Station): Purchase[] {
  const out: Purchase[] = [];
  const lv = levelUpCost(st);
  if (lv !== null) out.push({ kind: 'levelUp', stationId: st.id, cost: lv });
  const add = addSeatCost(st);
  if (add !== null) out.push({ kind: 'addSeat', stationId: st.id, cost: add });
  let cheapestSeat = -1;
  let cheapestCost = Infinity;
  st.seats.forEach((_, i) => {
    const c = seatUpgradeCost(st, i);
    if (c !== null && c < cheapestCost) {
      cheapestCost = c;
      cheapestSeat = i;
    }
  });
  if (cheapestSeat >= 0)
    out.push({ kind: 'seat', stationId: st.id, seat: cheapestSeat, cost: cheapestCost });
  if (st.kind !== 'course') {
    for (const tr of SERVICES[st.kind].tracks) {
      const c = trackCost(st, tr.id);
      if (c !== null) out.push({ kind: 'track', stationId: st.id, trackId: tr.id, cost: c });
    }
  }
  return out;
}

/**
 * Valeur relative d'un achat pour un lieu : on favorise les places quand la file
 * est longue, la vitesse sinon. Heuristique simple, utilisée par « Optimiser » et le bot.
 */
function purchaseValue(st: Station, p: Purchase): number {
  const crowded = st.queue.length >= st.seats.length;
  switch (p.kind) {
    case 'addSeat':
      return crowded ? 3 : 1;
    case 'levelUp':
      return crowded ? 2 : 1.5;
    case 'seat':
      return 1;
    case 'track':
      return 0.8;
    default:
      return 1;
  }
}

/** Meilleur achat abordable pour un lieu (bouton « Optimiser »). */
export function optimizeStation(state: GameState, st: Station): Purchase | null {
  const options = stationPurchases(st).filter((p) => p.cost <= state.coins);
  let best: Purchase | null = null;
  let bestScore = -Infinity;
  for (const p of options) {
    const score = purchaseValue(st, p) / p.cost;
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

/** Lieu le plus engorgé (attente estimée la plus longue). */
export function bottleneck(state: GameState): Station {
  return Object.values(state.stations).reduce((a, b) =>
    estimatedWait(b) > estimatedWait(a) ? b : a,
  );
}

/** Prochain achat global visé (pour le bot d'équilibrage). */
export function globalTarget(state: GameState): Purchase | null {
  // 1. La prochaine salle, dès qu'elle est abordable.
  let next: Purchase | null = null;
  for (const id of COURSE_IDS) {
    const c = courseCost(state, id);
    if (c !== null) {
      next = { kind: 'course', courseId: id, cost: c };
      break;
    }
  }
  if (next && next.cost <= state.coins) return next;
  // En attendant, on n'achète que ce qui coûte moins de 25 % de la prochaine salle.
  const budget = next ? next.cost * 0.25 : Infinity;
  const within = (p: Purchase | null) => (p && p.cost <= budget ? p : null);

  // 2. Le goulot d'étranglement.
  const neck = bottleneck(state);
  if (estimatedWait(neck) > 20) {
    if (neck.kind === 'dorm' && addSeatCost(neck) === null) {
      const d = dormCost(state);
      if (d !== null && d <= budget) return { kind: 'dorm', cost: d };
    }
    const opts = stationPurchases(neck).filter((p) => p.kind === 'addSeat' || p.kind === 'levelUp');
    const cheapest = opts.length ? opts.reduce((a, b) => (b.cost < a.cost ? b : a)) : null;
    if (within(cheapest)) return cheapest;
  }
  // 3. Sinon : l'amélioration de cours la moins chère.
  const all = Object.values(state.stations)
    .filter((s) => s.kind === 'course')
    .flatMap(stationPurchases);
  const cheapest = all.length ? all.reduce((a, b) => (b.cost < a.cost ? b : a)) : null;
  return within(cheapest) ?? next;
}

export function applyPurchase(state: GameState, p: Purchase): boolean {
  switch (p.kind) {
    case 'levelUp':
      return levelUp(state, p.stationId);
    case 'addSeat':
      return addSeat(state, p.stationId);
    case 'seat':
      return upgradeSeat(state, p.stationId, p.seat);
    case 'track':
      return upgradeTrack(state, p.stationId, p.trackId);
    case 'course':
      return buyCourse(state, p.courseId);
    case 'dorm':
      return buyDorm(state);
  }
}
