/**
 * Les 4 Maisons d'Arcanum Academy. Les identifiants internes restent stables
 * (sauvegardes) : pyrraxe = Griffebraise, sylvaine = Renardombre,
 * aurelis = Cerfronce, azurea = Corvencre.
 */
export type HouseId = 'pyrraxe' | 'sylvaine' | 'aurelis' | 'azurea';

export const HOUSE_IDS: HouseId[] = ['pyrraxe', 'sylvaine', 'aurelis', 'azurea'];

export interface HouseBonus {
  /** Multiplicateur de durée par cours (id de cours → multiplicateur). */
  courseTimeMult?: Record<string, number>;
  /** Multiplicateur de pièces gagnées par cours validé. */
  coinMult?: number;
  /** Multiplicateur de fatigue gagnée. */
  fatigueMult?: number;
  /** Multiplicateur d'XP gagnée. */
  xpMult?: number;
}

export interface HouseDef {
  id: HouseId;
  color: string;
  /** Couleur claire pour fonds / uniformes. */
  light: string;
  emblem: 'griffin' | 'fox' | 'stag' | 'raven';
  bonus: HouseBonus;
}

export const HOUSES: Record<HouseId, HouseDef> = {
  pyrraxe: {
    id: 'pyrraxe',
    color: '#C0392B',
    light: '#F2C4BE',
    emblem: 'griffin',
    bonus: { courseTimeMult: { defense: 0.92, flying: 0.92, duel: 0.92 } },
  },
  sylvaine: {
    id: 'sylvaine',
    color: '#1E8449',
    light: '#BFE3CC',
    emblem: 'fox',
    bonus: { coinMult: 1.08 },
  },
  aurelis: {
    id: 'aurelis',
    color: '#D9A21E',
    light: '#F6E3B0',
    emblem: 'stag',
    bonus: { fatigueMult: 0.9 },
  },
  azurea: {
    id: 'azurea',
    color: '#2471A3',
    light: '#BFD8EA',
    emblem: 'raven',
    bonus: { courseTimeMult: { history: 0.92, divination: 0.92, astronomy: 0.92 }, xpMult: 1.1 },
  },
};

/** Coupe des Maisons. */
export const HOUSE_CUP = {
  /** Points gagnés par cours validé. */
  pointsPerCourse: 10,
  /** Durée d'une saison (secondes de jeu). */
  seasonSeconds: 30 * 60,
  /** Récompense en Éclats pour chaque élève de la Maison gagnante présent à l'école. */
  winnerCoinsPerStudent: 15,
  /** Gemmes offertes à la fin de chaque saison. */
  seasonGems: 1,
};
