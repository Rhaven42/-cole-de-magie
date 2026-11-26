import { propDef } from '../data/roomProps';
import { ENROLLMENT , YEARS } from '../data/progression';
import { COURSES } from '../data/courses';
import { ECONOMY, NEEDS, POPULATION } from '../data/economy';
import { applyTime, comfortReduction } from '../data/formulas';
import { HOUSES } from '../data/houses';
import { SERVICES, type UpgradeEffect } from '../data/stations';
import { TRAITS } from '../data/traits';
import { EVENT_RULES } from '../data/events';
import { RELIC_BONUS, RELIC_SETS, RELICS } from '../data/collection';
import { PRESTIGE } from '../data/environments';
import type { GameState, Station, Student } from './types';

/** Durée de base du service d'un lieu. */
export function baseDuration(st: Station): number {
  return st.kind === 'course' ? COURSES[st.courseId!].duration : SERVICES[st.kind].duration;
}

/** Somme des effets d'un type donné sur les pistes d'aménagement du lieu. */
export function trackSum(st: Station, type: UpgradeEffect['type']): number {
  if (st.kind === 'course') return 0;
  let sum = 0;
  for (const tr of SERVICES[st.kind].tracks) {
    const lvl = st.tracks[tr.id] ?? 0;
    if (tr.effect.type === type) sum += tr.effect.perLevel * lvl;
  }
  return sum;
}

export function comfortOf(st: Station): number {
  return trackSum(st, 'comfort');
}

export function levelTimeMult(level: number): number {
  return Math.pow(1 - ECONOMY.level.timePerLevel, level - 1);
}

export function levelCoinMult(level: number): number {
  return 1 + ECONOMY.level.coinPerLevel * (level - 1);
}

export function seatTimeMult(seatLevel: number): number {
  return 1 - ECONOMY.seatUpgrade.timePerLevel * (seatLevel - 1);
}

/** Multiplicateurs liés à l'élève (Maison, trait, faim). */
export function studentTimeMult(st: Station, s: Student | undefined): number {
  if (!s) return 1;
  let m = 1;
  if (st.kind === 'course') {
    const houseMods = s.house ? HOUSES[s.house].bonus.courseTimeMult : undefined;
    m *= houseMods?.[st.courseId!] ?? 1;
    m *= TRAITS[s.trait]?.courseTimeMult ?? 1;
    if (s.hunger >= NEEDS.starvingHunger) m *= NEEDS.starvingTimeMult;
    if (s.year >= YEARS.max) m *= YEARS.advanced.timeMult;
  }
  return m;
}

/** Effets globaux liés à l'état (événements, managers). */
function stateTimeMult(state: GameState | undefined, st: Station): number {
  if (!state) return 1;
  let m = state.managers[st.id] ? 0.95 : 1;
  if (st.kind === 'hall' && state.events.some((e) => e.id === 'banquet' && e.until > state.time)) {
    m *= EVENT_RULES.banquetHallTimeMult;
  }
  return m;
}

/**
 * Temps de traitement réel :
 * base × niveauSalle × place × confort × aménagements × élève, plancher 25 %.
 */
export function serviceTime(
  st: Station,
  seatIndex: number,
  s?: Student,
  state?: GameState,
): number {
  const base = baseDuration(st);
  const seat = st.seats[seatIndex];
  const mults = [
    levelTimeMult(st.level),
    seatTimeMult(seat ? seat.level : 1),
    1 - comfortReduction(comfortOf(st)),
    Math.max(1 - trackSum(st, 'time'), 0),
    studentTimeMult(st, s),
    stateTimeMult(state, st),
  ];
  return applyTime(base, mults);
}

export function receptionPatience(state: GameState): number {
  return POPULATION.receptionPatience + trackSum(state.stations.reception, 'patience');
}

/** Gain d'Éclats pour un cours validé. */
/** Palier visuel d'un objet (0 = de base, 1 = amélioré, 2 = légendaire). */
export function seatTier(level: number): 0 | 1 | 2 {
  if (level >= ECONOMY.seatTiers.legendary) return 2;
  if (level >= ECONOMY.seatTiers.improved) return 1;
  return 0;
}

export function seatCoinMult(seatLevel: number): number {
  return 1 + ECONOMY.seatUpgrade.coinPerLevel * (seatLevel - 1);
}

/** Bonus d'Éclats du mobilier spécial débloqué dans la salle. */
export function propCoinMult(st: Station): number {
  if (!st.courseId || !st.props?.length) return 1;
  return 1 + st.props.reduce((a, id) => a + (propDef(st.courseId!, id)?.coinBonus ?? 0), 0);
}

export function courseReward(
  st: Station,
  s: Pick<Student, 'house' | 'mood'> & { year?: number },
  state?: GameState,
  seatIndex?: number,
): number {
  const def = COURSES[st.courseId!];
  let r = def.reward * levelCoinMult(st.level);
  if (seatIndex !== undefined && st.seats[seatIndex]) r *= seatCoinMult(st.seats[seatIndex].level);
  r *= propCoinMult(st);
  if ((s.year ?? 1) >= YEARS.max) r *= YEARS.advanced.rewardMult;
  if (state) {
    r *= metaMult(state);
    const stars = state.events.some((e) => e.id === 'shootingStars' && e.until > state.time);
    if (stars && (st.courseId === 'astronomy' || st.courseId === 'divination'))
      r *= EVENT_RULES.shootingStarsMult;
  }
  if (s.house) r *= HOUSES[s.house].bonus.coinMult ?? 1;
  if (s.mood < NEEDS.lowMood) r *= NEEDS.lowMoodCoinMult;
  return Math.max(1, Math.round(r));
}

export function failChance(st: Station, seatIndex: number): number {
  const def = COURSES[st.courseId!];
  const seat = st.seats[seatIndex];
  return Math.max(0, def.failRate - ECONOMY.seatUpgrade.failPerLevel * ((seat?.level ?? 1) - 1));
}

export function populationCap(state: GameState): number {
  let beds = 0;
  let courseSeats = 0;
  for (const st of Object.values(state.stations)) {
    if (st.kind === 'dorm') beds += st.seats.length;
    if (st.kind === 'course') courseSeats += st.seats.length;
  }
  return Math.floor(
    POPULATION.baseCap + beds * POPULATION.perBed + courseSeats * POPULATION.perCourseSeat,
  );
}

export function arrivalInterval(state: GameState): number {
  return Math.max(
    POPULATION.minArrivalInterval,
    POPULATION.arrivalInterval /
      (1 + state.reputation * POPULATION.arrivalPerRep) /
      // Un Accueil amélioré fait venir plus d'élèves.
      (1 + ENROLLMENT.arrivalPerLevel * ((state.stations.reception?.level ?? 1) - 1)),
  );
}

export function reputationStars(rep: number): number {
  let stars = 0;
  POPULATION.starThresholds.forEach((th, i) => {
    if (rep >= th) stars = i;
  });
  return stars;
}

/** Attente estimée pour un nouvel arrivant dans la file (s). */
export function estimatedWait(st: Station): number {
  const busy = st.seats.filter((x) => x.occupant !== null).length;
  const free = st.seats.length - busy;
  const ahead = st.queue.length - free + 1;
  if (ahead <= 0) return 0;
  const svc = st.stats.avgService || serviceTime(st, 0);
  return (ahead / Math.max(st.seats.length, 1)) * svc;
}

/** Bonus permanent d'Éclats : reliques + prestige. */
export function metaMult(state: GameState): number {
  const owned = (id: string) => (state.meta.relics[id] ?? 0) > 0;
  const relics = RELICS.filter((r) => owned(r.id)).length;
  const sets = RELIC_SETS.filter((set) =>
    RELICS.filter((r) => r.set === set).every((r) => owned(r.id)),
  ).length;
  return (
    (1 + relics * RELIC_BONUS.perRelic + sets * RELIC_BONUS.perSet) *
    (1 + state.meta.prestige * PRESTIGE.coinBonusPerLevel)
  );
}
