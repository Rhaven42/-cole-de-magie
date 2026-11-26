import type { HouseId } from './houses';

/** Traits mineurs des élèves (§4). Un seul par élève. */
export type TraitId =
  'studious' | 'sleepy' | 'partygoer' | 'distracted' | 'brave' | 'cunning' | 'loyal' | 'curious';

export interface TraitDef {
  id: TraitId;
  xpMult?: number;
  fatigueMult?: number;
  /** Variation d'humeur par cours validé. */
  moodPerCourse?: number;
  courseTimeMult?: number;
  /** Affinité de Maison : poids supplémentaire au Salon des Destinées. */
  houseAffinity: Partial<Record<HouseId, number>>;
}

export const TRAITS: Record<TraitId, TraitDef> = {
  studious: { id: 'studious', xpMult: 1.2, houseAffinity: { azurea: 2, aurelis: 1 } },
  sleepy: { id: 'sleepy', fatigueMult: 1.2, houseAffinity: { aurelis: 1.5 } },
  partygoer: { id: 'partygoer', moodPerCourse: -2, houseAffinity: { pyrraxe: 1.5, sylvaine: 1 } },
  distracted: { id: 'distracted', courseTimeMult: 1.1, houseAffinity: { azurea: 1, pyrraxe: 1 } },
  brave: { id: 'brave', houseAffinity: { pyrraxe: 3 } },
  cunning: { id: 'cunning', houseAffinity: { sylvaine: 3 } },
  loyal: { id: 'loyal', houseAffinity: { aurelis: 3 } },
  curious: { id: 'curious', xpMult: 1.1, houseAffinity: { azurea: 3 } },
};

export const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];
