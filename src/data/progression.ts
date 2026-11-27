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
/**
 * Grade obtenu à l'examen selon le nombre de matières différentes suivies
 * (au moins une fois). Plus l'élève a suivi de cours, plus son grade est haut.
 */
export const GRADES = [
  { min: 1, id: 'apprentice', label: 'Apprenti·e', coinMult: 0.5 },
  { min: 3, id: 'journeyman', label: 'Compagnon', coinMult: 1 },
  { min: 5, id: 'adept', label: 'Adepte', coinMult: 1.8 },
  { min: 7, id: 'master', label: 'Maître', coinMult: 3 },
  { min: 9, id: 'grandmaster', label: 'Grand·e Maître', coinMult: 5 },
] as const;

/** Pause repas des professeur·es : toutes les 20 min de jeu, les cours s'arrêtent un moment. */
export const MEAL_BREAK = { every: 20 * 60, duration: 90 };

/** Vrai pendant la pause repas (les profs mangent à la cantine). */
export function isMealBreak(time: number): boolean {
  const t = time % MEAL_BREAK.every;
  return t >= MEAL_BREAK.every - MEAL_BREAK.duration;
}

/** Prix d'ouverture de la Salle des Examens (la plus chère de l'école). */
export const EXAM_PRICE = 8_000_000;
/** Valeurs modifiables depuis l'interface d'administration. */
export const RULES = { examPrice: EXAM_PRICE, coursePatience: 150 };

/** Attente maximale dans la file d'une salle de cours avant de quitter l'école (s). */
export const COURSE_PATIENCE = 150;

/** Inscription : frais payés à l'Accueil par chaque nouvel élève. */
export const ENROLLMENT = { fee: 6, feePerLevel: 0.1, arrivalPerLevel: 0.12 };

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
