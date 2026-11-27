/**
 * Lieux « de service » génériques (§5 bis) : Accueil, Salon des Destinées,
 * Grande Salle, Dortoirs. Les salles de cours utilisent `courses.ts`.
 */
export type ServiceKind = 'reception' | 'sorting' | 'hall' | 'dorm' | 'exam';

/** Effets possibles d'une piste d'amélioration spécifique. */
export type UpgradeEffect =
  | { type: 'patience'; perLevel: number } // secondes de patience en plus
  | { type: 'time'; perLevel: number } // réduction de durée par niveau (0.05 = −5 %)
  | { type: 'mood'; perLevel: number } // humeur gagnée en sortant du lieu
  | { type: 'comfort'; perLevel: number }; // points de Confort (décoration)

export interface UpgradeTrack {
  id: string;
  icon: string;
  maxLevel: number;
  costBase: number;
  costGrowth: number;
  effect: UpgradeEffect;
}

export interface ServiceDef {
  kind: ServiceKind;
  icon: string;
  seatKey: string;
  seats: number;
  maxSeats: number;
  /** Durée de base du service (secondes). */
  duration: number;
  upgradeBase: number;
  /** Prix d'une place supplémentaire (× seatGrowth^placesAchetées). */
  seatPrice: number;
  wall: string;
  tracks: UpgradeTrack[];
}

export const SERVICES: Record<ServiceKind, ServiceDef> = {
  reception: {
    kind: 'reception',
    icon: '🛎️',
    seatKey: 'desk',
    seats: 1,
    maxSeats: 6,
    duration: 8,
    upgradeBase: 30,
    seatPrice: 90,
    wall: '#8A6A4A',
    tracks: [
      {
        id: 'waitingRoom',
        icon: '🪑',
        maxLevel: 5,
        costBase: 60,
        costGrowth: 1.8,
        effect: { type: 'patience', perLevel: 15 },
      },
      {
        id: 'autoScrolls',
        icon: '📜',
        maxLevel: 5,
        costBase: 150,
        costGrowth: 2,
        effect: { type: 'time', perLevel: 0.08 },
      },
      {
        id: 'signpost',
        icon: '🪧',
        maxLevel: 3,
        costBase: 100,
        costGrowth: 2.2,
        effect: { type: 'mood', perLevel: 5 },
      },
    ],
  },
  sorting: {
    kind: 'sorting',
    icon: '🎩',
    seatKey: 'stool',
    seats: 1,
    maxSeats: 4,
    duration: 10,
    upgradeBase: 45,
    seatPrice: 180,
    wall: '#4B3B5E',
    tracks: [
      {
        id: 'tapestries',
        icon: '🖼️',
        maxLevel: 5,
        costBase: 80,
        costGrowth: 1.9,
        effect: { type: 'comfort', perLevel: 3 },
      },
      {
        id: 'benches',
        icon: '🛋️',
        maxLevel: 5,
        costBase: 70,
        costGrowth: 1.8,
        effect: { type: 'mood', perLevel: 3 },
      },
    ],
  },
  hall: {
    kind: 'hall',
    icon: '🍲',
    seatKey: 'tableSeat',
    seats: 6,
    maxSeats: 40,
    duration: 15,
    upgradeBase: 50,
    seatPrice: 60,
    wall: '#7A4A2E',
    tracks: [
      {
        id: 'kitchen',
        icon: '🔥',
        maxLevel: 5,
        costBase: 120,
        costGrowth: 1.9,
        effect: { type: 'time', perLevel: 0.07 },
      },
      {
        id: 'starryCeiling',
        icon: '🌌',
        maxLevel: 5,
        costBase: 150,
        costGrowth: 2,
        effect: { type: 'comfort', perLevel: 4 },
      },
      {
        id: 'houseTables',
        icon: '🏳️',
        maxLevel: 4,
        costBase: 200,
        costGrowth: 2,
        effect: { type: 'mood', perLevel: 4 },
      },
    ],
  },
  /** Salle des Examens : examen final des 7e années, qui décide de leur métier. */
  exam: {
    kind: 'exam',
    icon: '📝',
    seatKey: 'examDesk',
    seats: 4,
    maxSeats: 12,
    duration: 30,
    upgradeBase: 400,
    seatPrice: 600,
    wall: '#5A4A3A',
    tracks: [
      {
        id: 'proctors',
        icon: '🧐',
        maxLevel: 5,
        costBase: 800,
        costGrowth: 2,
        effect: { type: 'time', perLevel: 0.08 },
      },
      {
        id: 'silence',
        icon: '🤫',
        maxLevel: 5,
        costBase: 600,
        costGrowth: 1.9,
        effect: { type: 'comfort', perLevel: 3 },
      },
    ],
  },
  dorm: {
    kind: 'dorm',
    icon: '🛏️',
    seatKey: 'bed',
    seats: 4,
    maxSeats: 16,
    duration: 40,
    upgradeBase: 40,
    seatPrice: 70,
    wall: '#3E4A6B',
    tracks: [
      {
        id: 'rugs',
        icon: '🧶',
        maxLevel: 5,
        costBase: 60,
        costGrowth: 1.8,
        effect: { type: 'comfort', perLevel: 3 },
      },
      {
        id: 'fireplace',
        icon: '🔥',
        maxLevel: 5,
        costBase: 140,
        costGrowth: 2,
        effect: { type: 'comfort', perLevel: 5 },
      },
    ],
  },
};

/** Prix d'un nouveau dortoir (× growth^dortoirsAchetés). */
export const DORM_PURCHASE = { base: 300, growth: 2.2, max: 4 };
