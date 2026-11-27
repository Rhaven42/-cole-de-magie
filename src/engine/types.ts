import type { AdKind } from '../data/ads';
import type { CourseId } from '../data/courses';
import type { HouseId } from '../data/houses';
import type { TraitId } from '../data/traits';
import type { CareerId } from '../data/progression';
import type { EventId, TimedEventId } from '../data/events';

export type StationKind = 'reception' | 'sorting' | 'hall' | 'dorm' | 'course' | 'exam';

export interface Seat {
  /** Qualité de la place, 1→5. */
  level: number;
  occupant: number | null;
  /** Temps restant (s) pour l'occupant. */
  remaining: number;
  /** Durée totale calculée à l'installation de l'occupant. */
  total: number;
  /** Position personnalisée dans la salle (grille relative), sinon emplacement par défaut. */
  pos?: { x: number; y: number };
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
  /** Éclats produits, en attente de récolte (coffre de la salle). */
  pending: number;
  /** Fin de l'arrêt de la salle (explosion…), en temps de jeu. */
  closedUntil: number;
  /** Mobilier spécial débloqué (ids de `COURSE_PROPS`). Absent = aucun. */
  props?: string[];
}

export interface StationStats {
  served: number;
  left: number;
  /** Moyenne glissante du temps d'attente (s). */
  avgWait: number;
  /** Moyenne glissante du temps de traitement (s). */
  avgService: number;
  /** Éclats produits au total. */
  earned: number;
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
  /** Cours validés dans l'année en cours. */
  yearPassed: number;
  coursesPassed: number;
  /** Cours validés par matière (oriente le métier). */
  passedBy: Partial<Record<string, number>>;
  xp: number;
  fatigue: number;
  hunger: number;
  mood: number;
  trait: TraitId;
  arrivedAt: number;
  /** Numéro du dernier grand repas pris (voir MEAL_BREAK). */
  ateMeal?: number;
  /** 7e année terminée : doit passer l'examen final avant le diplôme. */
  graduating?: boolean;
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
  graduated: number;
  yearUps: number;
}

export interface ActiveEvent {
  id: EventId;
  until: number;
  stationId?: string;
}

export interface Alumnus {
  name: string;
  house: HouseId | null;
  career: CareerId;
  at: number;
}

export interface Meta {
  /** Niveau de prestige (nombre de reconstructions). */
  prestige: number;
  /** Index de l'environnement actuel. */
  env: number;
  /** Reliques possédées (id → nombre). */
  relics: Record<string, number>;
  /** Jour (numéro de jour UTC) de la dernière récompense quotidienne. */
  dailyDay: number | null;
  dailyStreak: number;
  /** Diplômé·es au total, toutes reconstructions confondues. */
  lifetimeGraduates: number;
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
  /** Niveau de chaque professeur·e (salle des profs). Absent = niveau 1. */
  profLevels?: Partial<Record<CourseId, number>>;
  /** Prochaine offre « pub » (temps de jeu) et sa nature. */
  ad?: { nextAt: number; kind: AdKind };
  /** Fin du bonus Éclats ×2 (temps de jeu). */
  boostUntil?: number;
  /** Horodatage réel (ms) du prochain fruit de l'Arbre enchanté (absent = mûr). */
  treeReadyAt?: number;
  /** Achats de la boutique de Diamants (id → niveau). */
  gemShop?: Partial<Record<string, number>>;
  totals: Totals;
  /** Salles avec un manager (récolte automatique). */
  managers: Record<string, boolean>;
  /** Anciens élèves par métier (dons réguliers). */
  careers: Partial<Record<CareerId, number>>;
  /** Derniers diplômé·es (20 max). */
  alumni: Alumnus[];
  events: ActiveEvent[];
  nextEventAt: number;
  /** Accumulateur des dons des anciens élèves (fraction d'Éclat). */
  donationAcc: number;
  meta: Meta;
  /** Horodatage réel (ms) de la dernière sauvegarde, pour le hors-ligne. */
  lastSavedAt: number;
}

export type GameEvent =
  | { type: 'coins'; stationId: string; amount: number; studentId: number }
  | { type: 'fail'; stationId: string; studentId: number }
  | { type: 'arrived'; studentId: number }
  | { type: 'left'; studentId: number; name: string; reason?: 'wait' | 'done' }
  | { type: 'sorted'; studentId: number; name: string; house: HouseId; line: number }
  | { type: 'cupWon'; house: HouseId; coins: number }
  | { type: 'yearUp'; studentId: number; name: string; year: number; coins: number }
  | {
      type: 'graduated';
      name: string;
      house: HouseId | null;
      career: CareerId;
      /** Grade obtenu (id de GRADES). */
      grade: string;
      coins: number;
      relic: string | null;
    }
  | { type: 'event'; id: EventId; stationId?: string; value?: number }
  | { type: 'relic'; id: string };

export type { TimedEventId };
