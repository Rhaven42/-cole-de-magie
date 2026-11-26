import { COURSES, type CourseId } from './courses';

/**
 * Mobilier spécial de chaque salle de cours (sprites pixel art SpriteCook).
 * - `cost` absent : présent dès la construction (décor).
 * - `cost` présent : à débloquer depuis la fiche de la salle ; donne un bonus
 *   d'Éclats (`coinBonus`, additif) sur les cours de cette salle.
 * Positions en cases d'une salle « 8 × 8 » (multipliées par ROOM_SCALE au rendu),
 * hors des places des élèves.
 */
export interface RoomPropDef {
  id: string;
  sprite: string;
  name: string;
  x: number;
  y: number;
  width: number;
  cost?: number;
  coinBonus?: number;
}

/** Emplacements libres d'une salle de cours (mur du fond et coin avant droit). */
const A = { x: 3.0, y: 0.8 };
const B = { x: 6.6, y: 0.8 };
const C = { x: 7.35, y: 7.0 };

/** Prix des deux meubles à débloquer, d'après le prix de la salle. */
function prices(id: CourseId): [number, number] {
  const p = COURSES[id].price;
  return [Math.round(400 + p * 0.5), Math.round(2500 + p * 1.5)];
}

function set(
  id: CourseId,
  free: [string, string, number],
  first: [string, string, number],
  second: [string, string, number],
  extra: RoomPropDef[] = [],
): RoomPropDef[] {
  const [c1, c2] = prices(id);
  return [
    { id: free[0], sprite: free[0], name: free[1], width: free[2], ...A },
    {
      id: first[0],
      sprite: first[0],
      name: first[1],
      width: first[2],
      ...B,
      cost: c1,
      coinBonus: 0.06,
    },
    {
      id: second[0],
      sprite: second[0],
      name: second[1],
      width: second[2],
      ...C,
      cost: c2,
      coinBonus: 0.1,
    },
    ...extra,
  ];
}

export const COURSE_PROPS: Record<CourseId, RoomPropDef[]> = {
  potions: set(
    'potions',
    ['herbRack', 'Séchoir à herbes', 34],
    ['alembic', 'Alambic de cuivre', 32],
    ['ingredients', 'Réserve d’ingrédients', 34],
  ),
  botany: set(
    'botany',
    ['toolRack', 'Râtelier de jardinier', 32],
    ['snapPlant', 'Plante carnivore', 30],
    ['glowCloche', 'Cloche lumineuse', 26],
    [
      {
        id: 'pottingBench',
        sprite: 'pottingBench',
        name: 'Établi de rempotage',
        x: 0.8,
        y: 4.4,
        width: 32,
      },
    ],
  ),
  history: set(
    'history',
    ['worldMap', 'Carte du Vieux Monde', 36],
    ['relicCase', 'Vitrine des reliques', 30],
    ['runeTablet', 'Tablette runique', 28],
    [
      {
        id: 'scrollTable',
        sprite: 'scrollTable',
        name: 'Table aux parchemins',
        x: 0.8,
        y: 4.4,
        width: 30,
      },
    ],
  ),
  charms: set(
    'charms',
    ['floatCandles', 'Bougies flottantes', 22],
    ['spellLectern', 'Grand grimoire', 28],
    ['lanternPost', 'Lanterne sculptée', 20],
  ),
  astronomy: set(
    'astronomy',
    ['armillary', 'Sphère armillaire', 24],
    ['orrery', 'Planétaire', 32],
    ['starChart', 'Carte du ciel', 28],
  ),
  // Terrain extérieur (grand) : emplacements propres.
  flying: [
    { id: 'broomRack', sprite: 'broomRack', name: 'Râtelier à balais', x: 1.0, y: 0.8, width: 30 },
    { id: 'bleachers', sprite: 'bleachers', name: 'Gradins', x: 9.5, y: 1.2, width: 40 },
    { id: 'flyMarker', sprite: 'flyMarker', name: 'Cercle d’envol', x: 11.5, y: 4.6, width: 40 },
    { id: 'gearBench', sprite: 'gearBench', name: 'Banc d’équipement', x: 14.6, y: 1.2, width: 32 },
    {
      id: 'flyRing',
      sprite: 'flyRing',
      name: 'Anneaux d’entraînement',
      x: 13.8,
      y: 4.2,
      width: 22,
      cost: prices('flying')[0],
      coinBonus: 0.06,
    },
    {
      id: 'windSock',
      sprite: 'windSock',
      name: 'Manche à air',
      x: 16.6,
      y: 7.0,
      width: 28,
      cost: prices('flying')[1],
      coinBonus: 0.1,
    },
  ],
  divination: set(
    'divination',
    ['teaTable', 'Table à thé', 28],
    ['cardTable', 'Table des cartes', 30],
    ['mistMirror', 'Miroir des brumes', 24],
    [{ id: 'incense', sprite: 'incense', name: 'Brûle-encens', x: 0.8, y: 4.4, width: 18 }],
  ),
  duel: set(
    'duel',
    ['wandRack', 'Râtelier à baguettes', 32],
    ['shieldTarget', 'Bouclier-cible', 26],
    ['duelBanner', 'Bannière des champions', 22],
  ),
  transfiguration: set(
    'transfiguration',
    ['owlCage', 'Cage de la chouette', 22],
    ['teapotTortoise', 'Théière-tortue', 24],
    ['creatureJars', 'Bocaux de spécimens', 32],
  ),
  defense: set(
    'defense',
    ['runePillar', 'Pilier de protection', 20],
    ['chainedCrate', 'Caisse enchaînée', 30],
    ['armorStand', 'Armure enchantée', 24],
  ),
};

export function propDef(courseId: CourseId, propId: string): RoomPropDef | undefined {
  return COURSE_PROPS[courseId]?.find((p) => p.id === propId);
}
