import type { CourseId } from './courses';

/** Managers : récoltent automatiquement les Éclats d'une salle et l'accélèrent un peu. */
export interface ManagerDef {
  course: CourseId;
  /** Nom original. */
  name: string;
  /** Coût d'embauche = prix de la salle × factor + base. */
  speedBonus: number;
}

export const MANAGER_RULES = { priceFactor: 1.5, priceBase: 100, speedBonus: 0.05 };

export const MANAGERS: Record<CourseId, string> = {
  potions: 'Ermeline Brûlechaudron',
  botany: 'Fulbert Racinebelle',
  history: 'Grégoire Plumepoussière',
  charms: 'Iséa Tintelune',
  astronomy: 'Orion Ciel-de-Lin',
  flying: 'Rosalba Ventvif',
  divination: 'Madame Brumiel',
  transfiguration: 'Ambroise Changeforme',
  duel: 'Ondine Flamberge',
  defense: 'Capitaine Ysolde Fermeroc',
};

/** Coffre de salle : Éclats non récoltés. Capacité = récompense × (base + perLevel × niveau). */
export const STORAGE = { base: 15, perLevel: 5 };
