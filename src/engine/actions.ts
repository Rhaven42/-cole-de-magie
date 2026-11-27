import { PROF_UPGRADE } from '../data/professors';
import { profLevel } from './modifiers';
import { propDef } from '../data/roomProps';
import { EXAM_PRICE } from '../data/progression';
import { COURSES, type CourseId } from '../data/courses';
import { ECONOMY } from '../data/economy';
import { expCost } from '../data/formulas';
import type { HouseId } from '../data/houses';
import { DORM_PURCHASE, SERVICES } from '../data/stations';
import { PLOT } from '../data/layout';
import { makeCourseStation, makeSeat, makeServiceStation } from './state';
import type { GameState, Station } from './types';

/** Prix « unitaire » d'un lieu, base des améliorations de place. */
function unitPrice(st: Station): number {
  return st.kind === 'course' ? COURSES[st.courseId!].reward : SERVICES[st.kind].seatPrice / 6;
}

function maxSeats(st: Station): number {
  return st.kind === 'course' ? ECONOMY.courseMaxSeats : SERVICES[st.kind].maxSeats;
}

// ─── Coûts (null = impossible / maximum atteint) ─────────────────────────────

export function levelUpCost(st: Station): number | null {
  if (st.level >= ECONOMY.maxLevel) return null;
  const base =
    st.kind === 'course' ? COURSES[st.courseId!].upgradeBase : SERVICES[st.kind].upgradeBase;
  return expCost(base, ECONOMY.levelGrowth, st.level);
}

export function addSeatCost(st: Station): number | null {
  if (st.seats.length >= maxSeats(st)) return null;
  const base =
    st.kind === 'course'
      ? COURSES[st.courseId!].reward * ECONOMY.courseSeatPriceFactor
      : SERVICES[st.kind].seatPrice;
  return expCost(base, ECONOMY.seatGrowth, st.boughtSeats);
}

export function seatUpgradeCost(st: Station, seatIndex: number): number | null {
  const seat = st.seats[seatIndex];
  if (!seat || seat.level >= ECONOMY.seatUpgrade.maxLevel) return null;
  return expCost(
    unitPrice(st) * ECONOMY.seatUpgrade.base,
    ECONOMY.seatUpgrade.growth,
    seat.level - 1,
  );
}

export function trackCost(st: Station, trackId: string): number | null {
  if (st.kind === 'course') return null;
  const tr = SERVICES[st.kind].tracks.find((x) => x.id === trackId);
  if (!tr) return null;
  const lvl = st.tracks[trackId] ?? 0;
  if (lvl >= tr.maxLevel) return null;
  return expCost(tr.costBase, tr.costGrowth, lvl);
}

export function dormCount(state: GameState): number {
  return Object.values(state.stations).filter((s) => s.kind === 'dorm').length;
}

export function dormCost(state: GameState): number | null {
  const n = dormCount(state);
  if (n >= DORM_PURCHASE.max) return null;
  return expCost(DORM_PURCHASE.base, DORM_PURCHASE.growth, n - 1);
}

export function courseCost(state: GameState, id: CourseId): number | null {
  if (state.stations[`course-${id}`]) return null;
  return COURSES[id].price;
}

// ─── Achats ──────────────────────────────────────────────────────────────────

function pay(state: GameState, cost: number | null): boolean {
  if (cost === null || state.coins < cost) return false;
  state.coins -= cost;
  return true;
}

export function levelUp(state: GameState, stationId: string): boolean {
  const st = state.stations[stationId];
  if (!st || !pay(state, levelUpCost(st))) return false;
  st.level++;
  // +1 place tous les N niveaux (dans la limite du maximum)
  if (st.level % ECONOMY.level.seatEveryLevels === 1 && st.seats.length < maxSeats(st)) {
    st.seats.push(makeSeat());
  }
  return true;
}

export function addSeat(state: GameState, stationId: string): boolean {
  const st = state.stations[stationId];
  if (!st || !pay(state, addSeatCost(st))) return false;
  st.seats.push(makeSeat());
  st.boughtSeats++;
  return true;
}

export function upgradeSeat(state: GameState, stationId: string, seatIndex: number): boolean {
  const st = state.stations[stationId];
  if (!st || !pay(state, seatUpgradeCost(st, seatIndex))) return false;
  st.seats[seatIndex].level++;
  return true;
}

export function upgradeTrack(state: GameState, stationId: string, trackId: string): boolean {
  const st = state.stations[stationId];
  if (!st || !pay(state, trackCost(st, trackId))) return false;
  st.tracks[trackId] = (st.tracks[trackId] ?? 0) + 1;
  return true;
}

/** Prix d'un meuble spécial, ou null s'il est déjà là / gratuit / inconnu. */
export function propCost(st: Station, propId: string): number | null {
  if (!st.courseId) return null;
  const def = propDef(st.courseId, propId);
  if (!def?.cost || st.props?.includes(propId)) return null;
  return def.cost;
}

export function buyProp(state: GameState, stationId: string, propId: string): boolean {
  const st = state.stations[stationId];
  if (!st || !pay(state, propCost(st, propId))) return false;
  st.props = [...(st.props ?? []), propId];
  return true;
}

/** Prix du prochain niveau d'un·e professeur·e (null : salle non construite ou niveau max). */
export function profUpgradeCost(state: GameState, courseId: CourseId): number | null {
  if (!state.stations[`course-${courseId}`]) return null;
  const lvl = profLevel(state, courseId);
  if (lvl >= PROF_UPGRADE.maxLevel) return null;
  const base = PROF_UPGRADE.base + COURSES[courseId].price * PROF_UPGRADE.priceShare;
  return Math.round(base * PROF_UPGRADE.growth ** (lvl - 1));
}

export function upgradeProf(state: GameState, courseId: CourseId): boolean {
  if (!pay(state, profUpgradeCost(state, courseId))) return false;
  state.profLevels = { ...(state.profLevels ?? {}), [courseId]: profLevel(state, courseId) + 1 };
  return true;
}

/** Prix de la Salle des Examens (null si déjà construite). */
export function examCost(state: GameState): number | null {
  return state.stations.exam ? null : EXAM_PRICE;
}

export function buyExam(state: GameState): boolean {
  if (!pay(state, examCost(state))) return false;
  const st = makeServiceStation('exam');
  st.seats = [st.seats[0]];
  state.stations.exam = st;
  state.stationOrder.push(st.id);
  return true;
}

export function buyCourse(state: GameState, id: CourseId): boolean {
  if (!pay(state, courseCost(state, id))) return false;
  const st = makeCourseStation(id);
  state.stations[st.id] = st;
  // Les salles de cours se placent avant la Grande Salle.
  const hallIdx = state.stationOrder.indexOf('hall');
  state.stationOrder.splice(hallIdx, 0, st.id);
  return true;
}

export function buyDorm(state: GameState): boolean {
  if (!pay(state, dormCost(state))) return false;
  const st = makeServiceStation('dorm', dormCount(state));
  state.stations[st.id] = st;
  state.stationOrder.push(st.id);
  return true;
}

/** Orientation du Chapeau (effective au niveau 5+). */
export function setSortingBias(state: GameState, house: HouseId | null): boolean {
  if (house !== null && state.stations.sorting.level < 5) return false;
  state.sortingBias = house;
  return true;
}

// ─── Réaménagement : déplacer une place dans la zone de la salle ─────────────

/** Zone utilisable d'une salle (coordonnées de grille relatives à la salle). */
export const ROOM_ZONE = { min: 0.9, max: PLOT.size - 0.9, minSpacing: 0.95 };

/**
 * Déplace une place. Elle doit rester dans la zone de la salle et ne pas
 * chevaucher une autre place. `defaults` donne la position des places non déplacées.
 */
export function moveSeat(
  state: GameState,
  stationId: string,
  seatIndex: number,
  x: number,
  y: number,
  defaults: (i: number) => { x: number; y: number },
): boolean {
  const st = state.stations[stationId];
  const seat = st?.seats[seatIndex];
  if (!st || !seat) return false;
  if (x < ROOM_ZONE.min || x > ROOM_ZONE.max || y < ROOM_ZONE.min || y > ROOM_ZONE.max)
    return false;
  const clash = st.seats.some((o, i) => {
    if (i === seatIndex) return false;
    const p = o.pos ?? defaults(i);
    return Math.hypot(p.x - x, p.y - y) < ROOM_ZONE.minSpacing;
  });
  if (clash) return false;
  seat.pos = { x, y };
  return true;
}
