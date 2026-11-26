import type { CourseId } from './courses';

/** Années scolaires (§4). Cours à valider dans chaque année avant de passer à la suivante. */
export const YEARS = {
  max: 7,
  /** Index = année − 1. */
  coursesPerYear: [8, 10, 12, 14, 16, 18, 20],
  /** Bonus d'Éclats à la cérémonie de passage : base × année. */
  yearUpBonus: 25,
  /** Cours « Avancé » des 7e années : récompense ×2, durée ×1,5. */
  advanced: { rewardMult: 2, timeMult: 1.5 },
};

/** Diplôme : gros bonus, réputation, métier. */
export const GRADUATION = {
  coins: 600,
  reputation: 3,
  /** Probabilité de recevoir une relique. */
  relicChance: 0.3,
};

export type CareerId =
  | 'guardian'
  | 'alchemist'
  | 'herbalist'
  | 'archivist'
  | 'enchanter'
  | 'starCartographer'
  | 'skyCourier'
  | 'oracle'
  | 'shapeshifter'
  | 'duelist';

export interface CareerDef {
  id: CareerId;
  icon: string;
  /** Matière qui oriente vers ce métier. */
  course: CourseId;
  /** Dons envoyés à l'école par chaque ancien élève exerçant ce métier (Éclats/min). */
  donationPerMin: number;
}

/** Métiers originaux des diplômé·es. */
export const CAREERS: Record<CareerId, CareerDef> = {
  guardian: { id: 'guardian', icon: '🛡️', course: 'defense', donationPerMin: 6 },
  alchemist: { id: 'alchemist', icon: '⚗️', course: 'potions', donationPerMin: 2 },
  herbalist: { id: 'herbalist', icon: '🌿', course: 'botany', donationPerMin: 2 },
  archivist: { id: 'archivist', icon: '📚', course: 'history', donationPerMin: 2.5 },
  enchanter: { id: 'enchanter', icon: '✨', course: 'charms', donationPerMin: 3 },
  starCartographer: {
    id: 'starCartographer',
    icon: '🔭',
    course: 'astronomy',
    donationPerMin: 3.5,
  },
  skyCourier: { id: 'skyCourier', icon: '🧹', course: 'flying', donationPerMin: 4 },
  oracle: { id: 'oracle', icon: '🔮', course: 'divination', donationPerMin: 4.5 },
  shapeshifter: { id: 'shapeshifter', icon: '🐇', course: 'transfiguration', donationPerMin: 5 },
  duelist: { id: 'duelist', icon: '⚔️', course: 'duel', donationPerMin: 4.8 },
};

export const CAREER_IDS = Object.keys(CAREERS) as CareerId[];
