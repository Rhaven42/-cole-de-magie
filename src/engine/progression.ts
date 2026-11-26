import { CAREER_IDS, CAREERS, GRADUATION, YEARS, type CareerId } from '../data/progression';
import { POPULATION } from '../data/economy';
import { grantRelic } from './meta';
import { random } from './rng';
import type { GameEvent, GameState, Student } from './types';

/** Cours à valider pour terminer l'année en cours. */
export function coursesForYear(year: number): number {
  return YEARS.coursesPerYear[Math.min(year, YEARS.max) - 1];
}

/** Métier : la matière la plus validée (égalité → la plus prestigieuse). */
export function chooseCareer(s: Student): CareerId {
  let best: CareerId = 'alchemist';
  let bestN = -1;
  for (const id of CAREER_IDS) {
    const n = s.passedBy[CAREERS[id].course] ?? 0;
    if (n >= bestN) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

/** Après un cours validé : passage d'année ou diplôme. Renvoie true si l'élève a quitté l'école. */
export function advanceYear(state: GameState, s: Student, events: GameEvent[]): boolean {
  s.yearPassed++;
  if (s.yearPassed < coursesForYear(s.year)) return false;
  if (s.year < YEARS.max) {
    s.year++;
    s.yearPassed = 0;
    const coins = YEARS.yearUpBonus * s.year;
    state.coins += coins;
    state.totals.coinsEarned += coins;
    state.totals.yearUps++;
    events.push({ type: 'yearUp', studentId: s.id, name: s.name, year: s.year, coins });
    return false;
  }
  graduate(state, s, events);
  return true;
}

export function graduate(state: GameState, s: Student, events: GameEvent[]): void {
  const career = chooseCareer(s);
  state.coins += GRADUATION.coins;
  state.totals.coinsEarned += GRADUATION.coins;
  state.reputation += GRADUATION.reputation;
  state.totals.graduated++;
  state.meta.lifetimeGraduates++;
  state.careers[career] = (state.careers[career] ?? 0) + 1;
  state.alumni.unshift({ name: s.name, house: s.house, career, at: state.time });
  state.alumni = state.alumni.slice(0, 20);
  const relic = random(state) < GRADUATION.relicChance ? grantRelic(state, events) : null;
  events.push({
    type: 'graduated',
    name: s.name,
    house: s.house,
    career,
    coins: GRADUATION.coins,
    relic,
  });
  delete state.students[s.id];
}

/** Dons réguliers des anciens élèves (Éclats/min selon le métier). */
export function donationsPerMin(state: GameState): number {
  return CAREER_IDS.reduce(
    (sum, id) => sum + (state.careers[id] ?? 0) * CAREERS[id].donationPerMin,
    0,
  );
}

export function handleDonations(state: GameState, dt: number): void {
  state.donationAcc += (donationsPerMin(state) / 60) * dt;
  if (state.donationAcc >= 1) {
    const n = Math.floor(state.donationAcc);
    state.donationAcc -= n;
    state.coins += n;
    state.totals.coinsEarned += n;
  }
}

export { POPULATION };
