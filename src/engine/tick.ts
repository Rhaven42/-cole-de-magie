import { COURSES } from '../data/courses';
import { COURSE_AI, NEEDS, POPULATION } from '../data/economy';
import { HOUSE_CUP, HOUSE_IDS, HOUSES, type HouseId } from '../data/houses';
import { FIRST_NAMES, LAST_NAMES } from '../data/names';
import { TRAIT_IDS, TRAITS } from '../data/traits';
import { HAT_LINES_FR } from '../i18n/fr';
import { EVENT_RULES } from '../data/events';
import { handleEvents, isClosed, startEvent } from './events';
import { deposit } from './meta';
import { COURSE_PATIENCE, ENROLLMENT, isMealBreak } from '../data/progression';
import { advanceYear, distinctCourses, graduate, handleDonations } from './progression';
import {
  arrivalInterval,
  courseReward,
  estimatedWait,
  failChance,
  populationCap,
  receptionPatience,
  serviceTime,
  trackSum,
} from './modifiers';
import { pick, random, randInt, weightedIndex } from './rng';
import type { GameEvent, GameState, Station, Student } from './types';

export const TICK_SECONDS = 0.25;
const EMA = 0.2;

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, v));
}

export function studentCount(state: GameState): number {
  return Object.keys(state.students).length;
}

// ─── Arrivées ────────────────────────────────────────────────────────────────

export function spawnStudent(state: GameState, events: GameEvent[]): Student {
  const id = state.nextStudentId++;
  const s: Student = {
    id,
    name: `${pick(state, FIRST_NAMES)} ${pick(state, LAST_NAMES)}`,
    look: { skin: randInt(state, 6), hair: randInt(state, 8), hairStyle: randInt(state, 4) },
    house: null,
    year: 1,
    yearPassed: 0,
    coursesPassed: 0,
    passedBy: {},
    xp: 0,
    fatigue: randInt(state, 20),
    hunger: randInt(state, 20),
    mood: NEEDS.startMood,
    trait: pick(state, TRAIT_IDS),
    arrivedAt: state.time,
    activity: { mode: 'free', since: state.time },
  };
  state.students[id] = s;
  state.totals.arrived++;
  joinQueue(state, s, state.stations.reception);
  events.push({ type: 'arrived', studentId: id });
  return s;
}

function handleArrivals(state: GameState, dt: number, events: GameEvent[]): void {
  const interval = arrivalInterval(state);
  state.arrivalTimer += dt;
  while (state.arrivalTimer >= interval) {
    if (studentCount(state) >= populationCap(state)) {
      state.arrivalTimer = Math.min(state.arrivalTimer, interval);
      return;
    }
    state.arrivalTimer -= interval;
    spawnStudent(state, events);
  }
}

// ─── Files d'attente ─────────────────────────────────────────────────────────

export function joinQueue(state: GameState, s: Student, st: Station): void {
  st.queue.push(s.id);
  s.activity = { mode: 'queue', stationId: st.id, since: state.time };
}

function removeStudent(state: GameState, s: Student): void {
  delete state.students[s.id];
}

/** Départ définitif d'un élève (attente trop longue, ou plus rien à apprendre ici). */
function leaveSchool(
  state: GameState,
  s: Student,
  events: GameEvent[],
  reason: 'wait' | 'done',
): void {
  state.totals.left++;
  if (reason === 'wait') state.reputation = Math.max(0, state.reputation + POPULATION.repOnLeave);
  events.push({ type: 'left', studentId: s.id, name: s.name, reason });
  removeStudent(state, s);
}

/** Frais d'inscription versés à l'Accueil (augmentent avec son niveau). */
export function enrollmentFee(state: GameState): number {
  const lvl = state.stations.reception.level;
  return Math.round(ENROLLMENT.fee * (1 + ENROLLMENT.feePerLevel * (lvl - 1)));
}

/** Patience : départ à l'Accueil, perte d'humeur au Salon des Destinées. */
function handlePatience(state: GameState, dt: number, events: GameEvent[]): void {
  const reception = state.stations.reception;
  const patience = receptionPatience(state);
  reception.queue = reception.queue.filter((id) => {
    const s = state.students[id];
    if (!s || s.activity.mode !== 'queue') return false;
    if (state.time - s.activity.since > patience) {
      reception.stats.left++;
      state.totals.left++;
      state.reputation = Math.max(0, state.reputation + POPULATION.repOnLeave);
      events.push({ type: 'left', studentId: id, name: s.name });
      removeStudent(state, s);
      return false;
    }
    return true;
  });

  // Attente trop longue devant une salle de cours : l'élève quitte l'école.
  for (const st of Object.values(state.stations)) {
    if (st.kind !== 'course' || isMealBreak(state.time)) continue;
    st.queue = st.queue.filter((id) => {
      const s = state.students[id];
      if (!s || s.activity.mode !== 'queue') return false;
      if (state.time - s.activity.since <= COURSE_PATIENCE) return true;
      st.stats.left++;
      leaveSchool(state, s, events, 'wait');
      return false;
    });
  }

  const sorting = state.stations.sorting;
  const sortingPatience = POPULATION.sortingPatience + trackSum(sorting, 'patience');
  for (const id of sorting.queue) {
    const s = state.students[id];
    if (s && s.activity.mode === 'queue' && state.time - s.activity.since > sortingPatience) {
      s.mood = clamp(s.mood - POPULATION.sortingMoodLossPerSec * dt);
    }
  }
}

// ─── Répartition (le Chaporacle) ───────────────────────────────────────────

export function chooseHouse(state: GameState, s: Student): HouseId {
  const counts: Record<HouseId, number> = { pyrraxe: 0, sylvaine: 0, aurelis: 0, azurea: 0 };
  for (const o of Object.values(state.students)) if (o.house) counts[o.house]++;
  const avg = HOUSE_IDS.reduce((a, h) => a + counts[h], 0) / HOUSE_IDS.length;
  const affinity = TRAITS[s.trait].houseAffinity;
  const biasActive = state.sortingBias !== null && state.stations.sorting.level >= 5;
  const weights = HOUSE_IDS.map((h) => {
    let w = 1 + (affinity[h] ?? 0);
    w *= (avg + 1) / (counts[h] + 1); // rééquilibrage doux
    if (biasActive && state.sortingBias === h) w *= 4;
    return w;
  });
  return HOUSE_IDS[weightedIndex(state, weights)];
}

// ─── Décisions des élèves libres ─────────────────────────────────────────────

function bestOf(stations: Station[], score: (st: Station) => number): Station | null {
  let best: Station | null = null;
  let bestScore = -Infinity;
  for (const st of stations) {
    const sc = score(st);
    if (sc > bestScore) {
      best = st;
      bestScore = sc;
    }
  }
  return best;
}

export function chooseCourse(state: GameState, s: Student): Station | null {
  const options = Object.values(state.stations).filter((st) => st.kind === 'course');
  return bestOf(options, (st) => {
    const def = COURSES[st.courseId!];
    const time = serviceTime(st, 0, s, state) + estimatedWait(st) + (isClosed(state, st) ? 30 : 0);
    const noise = 1 + (random(state) * 2 - 1) * COURSE_AI.randomness;
    // Les élèves cherchent d'abord les matières qu'ils n'ont pas encore suivies.
    const fresh = (s.passedBy[st.courseId!] ?? 0) === 0 ? 4 : 1;
    return (def.reward / time) * noise * fresh;
  });
}

/**
 * Fin de scolarité : dès une matière suivie, l'élève peut tenter l'examen (plus il en a
 * suivi, plus il est tenté — et meilleur sera son grade). S'il a suivi toutes les
 * matières proposées par l'école, il passe l'examen, ou part s'il n'y en a pas.
 * Renvoie true si l'élève a quitté l'école.
 */
function endOfStudies(state: GameState, s: Student, events: GameEvent[]): Station | 'left' | null {
  const done = distinctCourses(s);
  if (done === 0) return null;
  const offered = Object.values(state.stations).filter((st) => st.kind === 'course').length;
  const exam = state.stations.exam ?? null;
  if (done >= offered) {
    if (exam) return exam;
    leaveSchool(state, s, events, 'done');
    return 'left';
  }
  if (exam && random(state) < 0.25 * (done / Math.max(1, offered))) return exam;
  return null;
}

function decide(state: GameState, s: Student, events: GameEvent[]): void {
  let target: Station | null;
  const end = s.activity.mode === 'free' && s.house ? endOfStudies(state, s, events) : null;
  if (end === 'left') return;
  if (end) {
    target = end;
  } else if (s.graduating && state.stations.exam) {
    target = state.stations.exam;
  } else if (s.fatigue >= NEEDS.fatigueThreshold) {
    const dorms = Object.values(state.stations).filter((st) => st.kind === 'dorm');
    target = bestOf(dorms, (st) => -estimatedWait(st));
  } else if (s.hunger >= NEEDS.hungerThreshold) {
    target = state.stations.hall;
  } else {
    target = chooseCourse(state, s);
  }
  if (target) joinQueue(state, s, target);
}

// ─── Fin de service ──────────────────────────────────────────────────────────

function complete(
  state: GameState,
  st: Station,
  seatIndex: number,
  s: Student,
  events: GameEvent[],
): void {
  st.stats.served++;
  const moodBonus = trackSum(st, 'mood');
  s.mood = clamp(s.mood + moodBonus);

  switch (st.kind) {
    case 'reception': {
      state.reputation += POPULATION.repOnEnroll;
      const fee = enrollmentFee(state);
      state.coins += fee;
      state.totals.coinsEarned += fee;
      events.push({ type: 'coins', stationId: st.id, amount: fee, studentId: s.id });
      joinQueue(state, s, state.stations.sorting);
      return;
    }
    case 'sorting': {
      const house = chooseHouse(state, s);
      s.house = house;
      state.totals.sorted++;
      events.push({
        type: 'sorted',
        studentId: s.id,
        name: s.name,
        house,
        line: randInt(state, HAT_LINES_FR.length),
      });
      break;
    }
    case 'exam':
      // Examen réussi : diplôme et métier, l'élève quitte l'école.
      graduate(state, s, events);
      return;
    case 'hall':
      s.hunger = 0;
      s.mood = clamp(s.mood + NEEDS.moodOnMeal);
      break;
    case 'dorm':
      s.fatigue = 0;
      s.mood = clamp(s.mood + NEEDS.moodOnSleep);
      break;
    case 'course': {
      const def = COURSES[st.courseId!];
      const house = s.house ? HOUSES[s.house].bonus : {};
      const trait = TRAITS[s.trait] ?? {};
      const failed = random(state) < failChance(st, seatIndex);
      const xpMult = (house.xpMult ?? 1) * (trait.xpMult ?? 1) * (failed ? 0.3 : 1);
      s.xp += Math.round(def.xp * xpMult);
      s.fatigue = clamp(
        s.fatigue + def.fatigue * (house.fatigueMult ?? 1) * (trait.fatigueMult ?? 1),
      );
      s.hunger = clamp(s.hunger + def.hunger, 0, 150);
      s.mood = clamp(s.mood + (trait.moodPerCourse ?? 0));
      if (s.hunger >= NEEDS.starvingHunger) s.mood = clamp(s.mood - NEEDS.starvingMoodLoss);
      if (failed) {
        state.totals.coursesFailed++;
        events.push({ type: 'fail', stationId: st.id, studentId: s.id });
        if (st.courseId === 'potions' && random(state) < EVENT_RULES.explosionChance) {
          startEvent(state, 'explosion', events, st.id);
        }
        if (st.courseId === 'flying') {
          s.fatigue = clamp(s.fatigue + EVENT_RULES.broomFallFatigue);
          startEvent(state, 'broomFall', events, st.id);
        }
      } else {
        const amount = courseReward(st, s, state, seatIndex);
        const stored = deposit(st, amount);
        st.stats.earned += stored;
        state.totals.coursesPassed++;
        s.coursesPassed++;
        s.passedBy[st.courseId!] = (s.passedBy[st.courseId!] ?? 0) + 1;
        state.reputation += POPULATION.repOnCourse;
        if (s.house) state.cup.points[s.house] += HOUSE_CUP.pointsPerCourse;
        events.push({ type: 'coins', stationId: st.id, amount: stored, studentId: s.id });
        if (advanceYear(state, s, events)) return; // diplômé·e : quitte l'école
      }
      break;
    }
  }
  s.activity = { mode: 'free', since: state.time };
}

function advanceSeats(state: GameState, st: Station, dt: number, events: GameEvent[]): void {
  if (isClosed(state, st)) return;
  // Pause repas : les profs sont à la cantine, les cours attendent leur retour.
  if (st.kind === 'course' && isMealBreak(state.time)) return;
  st.seats.forEach((seat, i) => {
    if (seat.occupant === null) return;
    seat.remaining -= dt;
    if (seat.remaining > 0) return;
    const s = state.students[seat.occupant];
    seat.occupant = null;
    seat.remaining = 0;
    if (s) complete(state, st, i, s, events);
  });
}

function fillSeats(state: GameState, st: Station): void {
  if (isClosed(state, st)) return;
  if (st.kind === 'course' && isMealBreak(state.time)) return;
  for (let i = 0; i < st.seats.length && st.queue.length > 0; i++) {
    const seat = st.seats[i];
    if (seat.occupant !== null) continue;
    const id = st.queue.shift()!;
    const s = state.students[id];
    if (!s) {
      i--;
      continue;
    }
    const since = s.activity.since;
    const wait = state.time - since;
    const dur = serviceTime(st, i, s, state);
    seat.occupant = id;
    seat.total = dur;
    seat.remaining = dur;
    st.stats.avgWait = st.stats.avgWait === 0 ? wait : st.stats.avgWait * (1 - EMA) + wait * EMA;
    st.stats.avgService =
      st.stats.avgService === 0 ? dur : st.stats.avgService * (1 - EMA) + dur * EMA;
    s.activity = { mode: 'seat', stationId: st.id, seat: i, since: state.time };
  }
}

// ─── Coupe des Maisons ───────────────────────────────────────────────────────

function handleCup(state: GameState, events: GameEvent[]): void {
  if (state.time - state.cup.seasonStart < HOUSE_CUP.seasonSeconds) return;
  const pts = state.cup.points;
  const winner = HOUSE_IDS.reduce((a, b) => (pts[b] > pts[a] ? b : a));
  let coins = 0;
  if (pts[winner] > 0) {
    const members = Object.values(state.students).filter((s) => s.house === winner).length;
    coins = members * HOUSE_CUP.winnerCoinsPerStudent;
    state.coins += coins;
    state.totals.coinsEarned += coins;
    state.gems += HOUSE_CUP.seasonGems;
    state.cup.lastWinner = winner;
    events.push({ type: 'cupWon', house: winner, coins });
  }
  state.cup = {
    season: state.cup.season + 1,
    seasonStart: state.time,
    points: { pyrraxe: 0, sylvaine: 0, aurelis: 0, azurea: 0 },
    lastWinner: state.cup.lastWinner,
  };
}

// ─── Tick ────────────────────────────────────────────────────────────────────

/** Avance la simulation de `dt` secondes. Modifie l'état, renvoie les événements. */
export function tick(state: GameState, dt: number = TICK_SECONDS): GameEvent[] {
  const events: GameEvent[] = [];
  state.time += dt;
  handleArrivals(state, dt, events);
  handlePatience(state, dt, events);
  const stations = state.stationOrder.map((id) => state.stations[id]);
  for (const st of stations) advanceSeats(state, st, dt, events);
  for (const s of Object.values(state.students)) {
    if (s.activity.mode === 'free') decide(state, s, events);
  }
  for (const st of stations) fillSeats(state, st);
  // Managers : récolte automatique des coffres
  for (const id of Object.keys(state.managers)) {
    const st = state.stations[id];
    if (st && st.pending >= 1) {
      const n = Math.floor(st.pending);
      st.pending -= n;
      state.coins += n;
      state.totals.coinsEarned += n;
    }
  }
  handleDonations(state, dt);
  handleEvents(state, events);
  handleCup(state, events);
  return events;
}
