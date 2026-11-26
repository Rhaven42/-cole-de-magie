import type { CourseId } from '../data/courses';
import { ECONOMY } from '../data/economy';
import { HOUSE_CUP } from '../data/houses';
import { EVENT_RULES } from '../data/events';
import { SERVICES, type ServiceKind } from '../data/stations';
import type { GameState, Meta, Seat, Station, StationKind } from './types';

export const SCHEMA_VERSION = 3;

export function makeSeat(level = 1): Seat {
  return { level, occupant: null, remaining: 0, total: 0 };
}

function makeStation(
  id: string,
  kind: StationKind,
  seats: number,
  extra: Partial<Station> = {},
): Station {
  return {
    id,
    kind,
    level: 1,
    seats: Array.from({ length: seats }, () => makeSeat()),
    boughtSeats: 0,
    queue: [],
    tracks: {},
    stats: { served: 0, left: 0, avgWait: 0, avgService: 0, earned: 0 },
    pending: 0,
    closedUntil: 0,
    ...extra,
  };
}

export function makeServiceStation(kind: ServiceKind, index = 0): Station {
  const def = SERVICES[kind];
  const id = kind === 'dorm' ? `dorm-${index}` : kind;
  return makeStation(id, kind, def.seats, kind === 'dorm' ? { index } : {});
}

export function makeCourseStation(courseId: CourseId): Station {
  // Une salle qui ouvre commence avec une seule place de travail.
  return makeStation(`course-${courseId}`, 'course', 1, { courseId });
}

export function defaultMeta(): Meta {
  return { prestige: 0, env: 0, relics: {}, dailyDay: null, dailyStreak: 0, lifetimeGraduates: 0 };
}

/** Nouvelle partie : manoir délabré avec Accueil, Salon, Grande Salle, 1 dortoir et Potions. */
export function createGame(seed = 1, now = 0, meta: Meta = defaultMeta()): GameState {
  const stations = [
    makeServiceStation('reception'),
    makeServiceStation('sorting'),
    makeCourseStation('potions'),
    makeServiceStation('hall'),
    makeServiceStation('dorm', 0),
  ];
  return {
    schemaVersion: SCHEMA_VERSION,
    time: 0,
    coins: ECONOMY.startCoins,
    gems: ECONOMY.startGems,
    reputation: 0,
    rng: seed | 0,
    nextStudentId: 1,
    arrivalTimer: 0,
    students: {},
    stations: Object.fromEntries(stations.map((s) => [s.id, s])),
    stationOrder: stations.map((s) => s.id),
    cup: {
      season: 1,
      seasonStart: 0,
      points: { pyrraxe: 0, sylvaine: 0, aurelis: 0, azurea: 0 },
      lastWinner: null,
    },
    sortingBias: null,
    totals: {
      coinsEarned: 0,
      coursesPassed: 0,
      coursesFailed: 0,
      arrived: 0,
      left: 0,
      sorted: 0,
      graduated: 0,
      yearUps: 0,
    },
    managers: {},
    careers: {},
    alumni: [],
    events: [],
    nextEventAt: EVENT_RULES.minInterval,
    donationAcc: 0,
    meta,
    lastSavedAt: now,
  };
}

export const HOUSE_CUP_SEASON = HOUSE_CUP.seasonSeconds;
