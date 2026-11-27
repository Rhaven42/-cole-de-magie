/**
 * Arbre enchanté de la cour (fruit toutes les heures) et boutique de Diamants.
 * Les Diamants ne s'achètent pas avec de l'argent réel : ils se gagnent en jeu
 * (pubs simulées, arbre, cadeau du jour, Coupe des Maisons…).
 */
export const TREE = {
  /** Délai entre deux fruits (s réelles). */
  every: 3600,
  /** Éclats du fruit : N minutes de gains estimés (minimum `coinsMin`). */
  coinsMinutes: 10,
  coinsMin: 300,
  /** Diamants en plus si on regarde la pub. */
  adGems: 1,
} as const;

/** Durée hors-ligne de base (s) ; le Sablier du Gardien l'allonge. */
export const OFFLINE_BASE = { seconds: 2 * 3600, perLevel: 2 * 3600 } as const;

export type GemItemId =
  'hourglass' | 'philosopher' | 'chrono' | 'fertilizer' | 'fortune' | 'treasure';

export interface GemItem {
  id: GemItemId;
  icon: string;
  sprite: string;
  name: string;
  desc: string;
  /** Prix du niveau 1, puis +`costStep` par niveau. */
  cost: number;
  costStep: number;
  /** Niveau max (amélioration permanente) ; 0 = objet à usage unique, rachetable. */
  max: number;
}

export const GEM_ITEMS: GemItem[] = [
  {
    id: 'philosopher',
    icon: '🔮',
    sprite: 'diamond',
    name: 'Pierre philosophale',
    desc: '+25 % d’Éclats dans toute l’école, pour toujours.',
    cost: 30,
    costStep: 20,
    max: 5,
  },
  {
    id: 'chrono',
    icon: '⏳',
    sprite: 'hourglass',
    name: 'Sablier de Chronos',
    desc: 'Tous les cours durent 8 % de moins, pour toujours.',
    cost: 25,
    costStep: 15,
    max: 5,
  },
  {
    id: 'hourglass',
    icon: '🌙',
    sprite: 'violetCandelabra',
    name: 'Veilleuse du Gardien',
    desc: '+2 h de gains quand tu es déconnecté·e (max 12 h).',
    cost: 15,
    costStep: 10,
    max: 5,
  },
  {
    id: 'fertilizer',
    icon: '🌳',
    sprite: 'magicFruit',
    name: 'Engrais enchanté',
    desc: 'L’Arbre enchanté donne un fruit toutes les 30 min.',
    cost: 40,
    costStep: 0,
    max: 1,
  },
  {
    id: 'fortune',
    icon: '⚡',
    sprite: 'greenPotion',
    name: 'Potion de Fortune',
    desc: 'Éclats ×2 pendant 30 minutes.',
    cost: 8,
    costStep: 0,
    max: 0,
  },
  {
    id: 'treasure',
    icon: '💰',
    sprite: 'goldChest',
    name: 'Coffre du Trésorier',
    desc: 'Une heure de gains de l’école, tout de suite.',
    cost: 10,
    costStep: 0,
    max: 0,
  },
];

export const GEM_BONUS = {
  philosopherCoin: 0.25,
  chronoTime: 0.08,
  fortuneSeconds: 1800,
  treasureMinutes: 60,
} as const;
