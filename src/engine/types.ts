import type { CourseId } from '../data/courses';
import type { HouseId } from '../data/houses';
import type { TraitId } from '../data/traits';

export type StationKind = 'reception' | 'sorting' | 'hall' | 'dorm' | 'course';

export interface Seat {
  /** Qualité de la place, 1→5. */
  level: number;
  occupant: number | null;
  /** Temps restant (s) pour l'occupant. */
  remaining: number;
  /** Durée totale calculée à l'installation de l'occupant. */
  total: number;
}

/** Système générique « file + places + temps de traitement + modificateurs » (§5 bis). */
export interface Station {
  id: string;
  kind: StationKind;
  courseId?: CourseId;
  /** Numéro de dortoir (0, 1, …). */
  index?: number;
  level: number;
  seats: Seat[];
  /** Nombre de places achetées (sert au prix des suivantes). */
  boughtSeats: number;
  queue: number[];
  /** Niveaux des pistes d'aménagement (salle d'attente, cheminée…). */
  tracks: Record<string, number>;
  stats: StationStats;
}

export interface StationStats {
  served: number;
  left: number;
  /** Moyenne glissante du temps d'attente (s). */
  avgWait: number;
  /** Moyenne glissante du temps de traitement (s). */
  avgService: number;
}

export interface Look {
  skin: number;
  hair: number;
  hairStyle: number;
}

export type Activity =
  | { mode: 'queue'; stationId: string; since: number }
  | { mode: 'seat'; stationId: string; seat: number; since: number }
  | { mode: 'free'; since: number };

export interface Student {
  id: number;
  name: string;
  look: Look;
  house: HouseId | null;
  year: number;
  coursesPassed: number;
  xp: number;
  fatigue: number;
  hunger: number;
  mood: number;
  trait: TraitId;
  arrivedAt: number;
  activity: Activity;
}

export interface HouseCup {
  season: number;
  seasonStart: number;
  points: Record<HouseId, number>;
  lastWinner: HouseId | null;
}

export interface Totals {
  coinsEarned: number;
  coursesPassed: number;
  coursesFailed: number;
  arrived: number;
  left: number;
  sorted: number;
}

export interface GameState {
  schemaVersion: number;
  /** Temps de simulation écoulé (s). */
  time: number;
  coins: number;
  gems: number;
  reputation: number;
  rng: number;
  nextStudentId: number;
  arrivalTimer: number;
  students: Record<number, Student>;
  stations: Record<string, Station>;
  /** Ordre d'affichage des lieux. */
  stationOrder: string[];
  cup: HouseCup;
  /** Orientation forcée du Chapeau (niveau 5+). */
  sortingBias: HouseId | null;
  totals: Totals;
  /** Horodatage réel (ms) de la dernière sauvegarde, pour le hors-ligne. */
  lastSavedAt: number;
}

export type GameEvent =
  | { type: 'coins'; stationId: string; amount: number; studentId: number }
  | { type: 'fail'; stationId: string; studentId: number }
  | { type: 'arrived'; studentId: number }
  | { type: 'left'; studentId: number; name: string }
  | { type: 'sorted'; studentId: number; name: string; house: HouseId; line: number }
  | { type: 'cupWon'; house: HouseId; coins: number };
