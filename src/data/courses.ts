/** Les 9 matières (§5). Valeurs calées avec `npm run simulate` (docs/BALANCE.md). */
export type CourseId =
  | 'potions'
  | 'botany'
  | 'history'
  | 'charms'
  | 'astronomy'
  | 'flying'
  | 'divination'
  | 'transfiguration'
  | 'defense';

export interface CourseDef {
  id: CourseId;
  icon: string;
  /** Nom de la « place » (chaudron, pupitre…) pour l'i18n. */
  seatKey: string;
  seats: number;
  /** Durée de base d'un cours, en secondes. */
  duration: number;
  reward: number;
  yearMin: number;
  /** Prix d'achat de la salle. */
  price: number;
  /** Prix de base des améliorations de niveau (× 1.55^niveau). */
  upgradeBase: number;
  /** Probabilité d'échec (0 pièce, XP réduite). */
  failRate: number;
  fatigue: number;
  hunger: number;
  xp: number;
  /** Couleur de fond de la salle dans la vue en coupe. */
  wall: string;
}

export const COURSES: Record<CourseId, CourseDef> = {
  potions: {
    id: 'potions',
    icon: '⚗️',
    seatKey: 'cauldron',
    seats: 4,
    duration: 20,
    reward: 10,
    yearMin: 1,
    price: 0,
    upgradeBase: 40,
    failRate: 0.12,
    fatigue: 14,
    hunger: 15,
    xp: 10,
    wall: '#5B4A6B',
  },
  botany: {
    id: 'botany',
    icon: '🌱',
    seatKey: 'plant',
    seats: 5,
    duration: 25,
    reward: 12,
    yearMin: 1,
    price: 120,
    upgradeBase: 60,
    failRate: 0.05,
    fatigue: 12,
    hunger: 18,
    xp: 12,
    wall: '#4F6B3F',
  },
  history: {
    id: 'history',
    icon: '📜',
    seatKey: 'desk',
    seats: 8,
    duration: 30,
    reward: 14,
    yearMin: 1,
    price: 650,
    upgradeBase: 90,
    failRate: 0.04,
    fatigue: 22,
    hunger: 12,
    xp: 14,
    wall: '#7A5C3E',
  },
  charms: {
    id: 'charms',
    icon: '✨',
    seatKey: 'stage',
    seats: 5,
    duration: 35,
    reward: 22,
    yearMin: 2,
    price: 2500,
    upgradeBase: 200,
    failRate: 0.08,
    fatigue: 16,
    hunger: 15,
    xp: 18,
    wall: '#3E5C7A',
  },
  astronomy: {
    id: 'astronomy',
    icon: '🔭',
    seatKey: 'telescope',
    seats: 4,
    duration: 40,
    reward: 26,
    yearMin: 2,
    price: 6000,
    upgradeBase: 400,
    failRate: 0.06,
    fatigue: 18,
    hunger: 15,
    xp: 20,
    wall: '#262B4F',
  },
  flying: {
    id: 'flying',
    icon: '🧹',
    seatKey: 'broom',
    seats: 3,
    duration: 45,
    reward: 35,
    yearMin: 3,
    price: 15000,
    upgradeBase: 900,
    failRate: 0.1,
    fatigue: 26,
    hunger: 22,
    xp: 22,
    wall: '#6B8FB0',
  },
  divination: {
    id: 'divination',
    icon: '🔮',
    seatKey: 'crystal',
    seats: 4,
    duration: 50,
    reward: 42,
    yearMin: 4,
    price: 40000,
    upgradeBase: 2000,
    failRate: 0.08,
    fatigue: 16,
    hunger: 14,
    xp: 26,
    wall: '#6B3E6B',
  },
  transfiguration: {
    id: 'transfiguration',
    icon: '🐇',
    seatKey: 'podium',
    seats: 3,
    duration: 60,
    reward: 60,
    yearMin: 5,
    price: 100000,
    upgradeBase: 5000,
    failRate: 0.1,
    fatigue: 20,
    hunger: 18,
    xp: 32,
    wall: '#4A5A5A',
  },
  defense: {
    id: 'defense',
    icon: '🛡️',
    seatKey: 'circle',
    seats: 3,
    duration: 75,
    reward: 90,
    yearMin: 6,
    price: 250000,
    upgradeBase: 12000,
    failRate: 0.12,
    fatigue: 30,
    hunger: 20,
    xp: 40,
    wall: '#3B2A2A',
  },
};

export const COURSE_IDS = Object.keys(COURSES) as CourseId[];

/**
 * Matières achetables à ce stade du développement.
 * J4 ajoutera le système d'années qui rendra les 9 matières accessibles.
 */
export const UNLOCKED_COURSES: CourseId[] = ['potions', 'botany', 'history'];
