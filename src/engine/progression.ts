import { CAREER_IDS, CAREERS, GRADES, GRADUATION, YEARS, type CareerId } from '../data/progression';
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
  // 7e année terminée : direction la Salle des Examens (le métier se décide à l'examen).
  s.graduating = true;
  return false;
}

/** Nombre de matières différentes suivies au moins une fois. */
export function distinctCourses(s: Student): number {
  return Object.values(s.passedBy).filter((n) => (n ?? 0) > 0).length;
}

/** Grade selon le nombre de matières suivies. */
export function gradeOf(s: Student) {
  const n = distinctCourses(s);
  let g: (typeof GRADES)[number] = GRADES[0];
  for (const x of GRADES) if (n >= x.min) g = x;
  return g;
}

export function graduate(state: GameState, s: Student, events: GameEvent[]): void {
  const career = chooseCareer(s);
  const grade = gradeOf(s);
  const coins = Math.round(GRADUATION.coins * grade.coinMult);
  state.coins += coins;
  state.totals.coinsEarned += coins;
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
    grade: grade.id,
    coins,
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
