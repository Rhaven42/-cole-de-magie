/**
 * Plan isométrique de l'école (vue de dessus 3/4).
 * Grille de « parcelles » : chaque lieu occupe une parcelle carrée.
 * px/py = coordonnées de parcelle ; (4,3) est le coin avant (entrée).
 */
export const ISO = {
  /** Largeur / hauteur d'une tuile losange (px). */
  tileW: 40,
  tileH: 20,
  /** Hauteur des murs (px). */
  wallH: 52,
};

export const PLOT = { size: 8, gap: 1.6, cols: 5, rows: 4, margin: 5 };

export interface PlotDef {
  px: number;
  py: number;
  /** Couleur du sol (tapis / dalles). */
  floor: string;
  floorAlt: string;
}

/** Emplacement de chaque lieu (id de Station) ou décor. */
export const PLOTS: Record<string, PlotDef> = {
  reception: { px: 4, py: 3, floor: '#C9A27A', floorAlt: '#BD946B' },
  sorting: { px: 3, py: 3, floor: '#5B4A86', floorAlt: '#52417A' },
  hall: { px: 4, py: 2, floor: '#A2553C', floorAlt: '#954C35' },
  'course-potions': { px: 2, py: 3, floor: '#4E7F6A', floorAlt: '#46735F' },
  'course-botany': { px: 3, py: 2, floor: '#6E9A4B', floorAlt: '#638C43' },
  'course-history': { px: 4, py: 1, floor: '#9C6B44', floorAlt: '#8F613D' },
  'course-charms': { px: 1, py: 3, floor: '#4D78A8', floorAlt: '#456D99' },
  'course-astronomy': { px: 2, py: 2, floor: '#33406E', floorAlt: '#2C3862' },
  'course-flying': { px: 3, py: 1, floor: '#7FB069', floorAlt: '#75A35F' },
  'course-divination': { px: 4, py: 0, floor: '#7E4A86', floorAlt: '#72427A' },
  'course-transfiguration': { px: 0, py: 3, floor: '#5E7C82', floorAlt: '#557177' },
  'course-defense': { px: 1, py: 2, floor: '#6B3A3A', floorAlt: '#603434' },
  'course-duel': { px: 1, py: 0, floor: '#7A4B3A', floorAlt: '#6C4233' },
  'dorm-0': { px: 2, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-1': { px: 3, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-2': { px: 0, py: 2, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-3': { px: 1, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-4': { px: 2, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-5': { px: 0, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
};

/** Parcelles de jardin (décor). */
export const GARDENS: { px: number; py: number }[] = [{ px: 0, py: 0 }];

/** Décor d'une salle : sprite posé à une position de grille relative à la salle. */
export interface DecorItem {
  sprite: string;
  x: number;
  y: number;
  width: number;
  mirror?: boolean;
}

const COURSE_COMMON: DecorItem[] = [{ sprite: 'candelabra', x: 0.8, y: 7.3, width: 22 }];

/** Décorations par type de salle (matière ou lieu). Positions hors des places. */
export const ROOM_DECOR: Record<string, DecorItem[]> = {
  potions: [
    ...COURSE_COMMON,
    { sprite: 'jarShelf', x: 3.2, y: 0.55, width: 34 },
    { sprite: 'barrel', x: 6.6, y: 0.8, width: 24 },
    { sprite: 'crates', x: 7.35, y: 1.9, width: 30 },
  ],
  botany: [
    ...COURSE_COMMON,
    { sprite: 'planterTree', x: 3.0, y: 0.8, width: 34 },
    { sprite: 'planterTree', x: 6.5, y: 0.8, width: 30 },
    { sprite: 'barrel', x: 7.35, y: 2.0, width: 22 },
  ],
  history: [
    ...COURSE_COMMON,
    { sprite: 'clock', x: 3.0, y: 0.5, width: 22 },
    { sprite: 'globe', x: 6.6, y: 0.9, width: 28 },
    { sprite: 'books', x: 7.3, y: 7.1, width: 28 },
  ],
  charms: [
    ...COURSE_COMMON,
    { sprite: 'books', x: 3.2, y: 0.8, width: 28 },
    { sprite: 'easel', x: 6.6, y: 0.8, width: 28 },
    { sprite: 'armchair', x: 7.2, y: 7.0, width: 32 },
  ],
  astronomy: [
    ...COURSE_COMMON,
    { sprite: 'globe', x: 3.0, y: 0.8, width: 28 },
    { sprite: 'chest', x: 6.6, y: 0.8, width: 30 },
    { sprite: 'owl', x: 7.35, y: 7.2, width: 20 },
  ],
  flying: [
    ...COURSE_COMMON,
    { sprite: 'coatStand', x: 3.0, y: 0.7, width: 24 },
    { sprite: 'chest', x: 6.6, y: 0.8, width: 30 },
    { sprite: 'barrel', x: 7.35, y: 7.1, width: 22 },
  ],
  divination: [
    ...COURSE_COMMON,
    { sprite: 'easel', x: 3.0, y: 0.8, width: 28 },
    { sprite: 'armchair', x: 6.6, y: 0.9, width: 32 },
    { sprite: 'owl', x: 7.35, y: 7.2, width: 20 },
  ],
  transfiguration: [
    ...COURSE_COMMON,
    { sprite: 'cat', x: 3.2, y: 0.9, width: 20 },
    { sprite: 'chest', x: 6.6, y: 0.8, width: 30 },
    { sprite: 'jarShelf', x: 7.4, y: 6.9, width: 30 },
  ],
  defense: [
    ...COURSE_COMMON,
    { sprite: 'chest', x: 3.1, y: 0.8, width: 30 },
    { sprite: 'noticeBoard', x: 6.6, y: 0.8, width: 30 },
    { sprite: 'candelabra', x: 7.35, y: 7.2, width: 22 },
  ],
  duel: [
    ...COURSE_COMMON,
    { sprite: 'candelabra', x: 3.0, y: 0.7, width: 22 },
    { sprite: 'noticeBoard', x: 6.6, y: 0.8, width: 30 },
    { sprite: 'chest', x: 7.35, y: 7.1, width: 28 },
  ],
  dorm: [
    { sprite: 'coatStand', x: 7.4, y: 0.7, width: 24 },
    { sprite: 'planterTree', x: 0.8, y: 7.3, width: 28 },
    { sprite: 'chest', x: 7.4, y: 7.3, width: 26 },
  ],
  hall: [
    { sprite: 'candelabra', x: 0.7, y: 0.8, width: 22 },
    { sprite: 'clock', x: 7.4, y: 0.6, width: 22 },
    { sprite: 'planterTree', x: 0.8, y: 7.4, width: 28 },
  ],
  reception: [
    { sprite: 'noticeBoard', x: 6.6, y: 0.7, width: 30 },
    { sprite: 'clock', x: 4.6, y: 0.5, width: 22 },
    { sprite: 'coatStand', x: 5.6, y: 0.6, width: 24 },
    { sprite: 'armchair', x: 6.4, y: 6.8, width: 32 },
    { sprite: 'planterTree', x: 7.3, y: 7.4, width: 28 },
  ],
  sorting: [
    { sprite: 'candelabra', x: 1.0, y: 1.0, width: 22 },
    { sprite: 'candelabra', x: 1.0, y: 7.0, width: 22 },
    { sprite: 'candelabra', x: 7.0, y: 1.0, width: 22 },
    { sprite: 'books', x: 6.9, y: 6.9, width: 26 },
    { sprite: 'cat', x: 2.4, y: 6.4, width: 18 },
  ],
};

/** Texture de sol par type de lieu (taille d'une tuile de texture, en cases). */
export const FLOOR_TEXTURE: Record<string, { tex: 'wood' | 'stone' | 'carpet'; tile: number }> = {
  course: { tex: 'wood', tile: 3 },
  dorm: { tex: 'wood', tile: 3 },
  hall: { tex: 'stone', tile: 4 },
  reception: { tex: 'stone', tile: 4 },
  sorting: { tex: 'carpet', tile: 3 },
};
