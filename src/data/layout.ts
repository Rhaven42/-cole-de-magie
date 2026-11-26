/**
 * Plan isométrique de l'école (vue de dessus 3/4).
 * Organisation : entrée à l'avant (Accueil, Salon des Destinées, Grande Salle au centre),
 * aile des cours à gauche rangée par année (de l'avant vers le fond),
 * aile des dortoirs à droite et au fond. Grand Accueil sur 2 parcelles avec porche,
 * relié au portail par une allée droite dans la cour d'entrée (fontaine, jardin).
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

/** front : profondeur de la cour d'entrée devant l'école (portail, allée, jardin). */
export const PLOT = { size: 10, gap: 2, cols: 5, rows: 4, margin: 5, front: 13, top: 18 };

/** Échelle des aménagements intérieurs (conçus pour une salle de 8 cases). */
export const ROOM_SCALE = PLOT.size / 8;

export interface PlotDef {
  px: number;
  py: number;
  /** Nombre de parcelles occupées le long de x (grande salle sur 2 parcelles). */
  spanX?: number;
  /** Décalage (cases) de la salle par rapport à sa parcelle. */
  shiftX?: number;
  shiftY?: number;
  /** Côté de la porte : 'x' = face avant droite (défaut), 'y' = face avant gauche (entrée). */
  door?: 'x' | 'y';
  /** Couleur du sol (tapis / dalles). */
  floor: string;
  floorAlt: string;
}

/** Emplacement de chaque lieu (id de Station) ou décor. */
export const PLOTS: Record<string, PlotDef> = {
  reception: { px: 3, py: 3, spanX: 2, door: 'y', floor: '#C9A27A', floorAlt: '#BD946B' },
  sorting: { px: 2, py: 3, floor: '#5B4A86', floorAlt: '#52417A' },
  hall: { px: 4, py: 2, floor: '#A2553C', floorAlt: '#954C35' },
  'course-potions': { px: 1, py: 3, floor: '#4E7F6A', floorAlt: '#46735F' },
  'course-botany': { px: 0, py: 3, floor: '#6E9A4B', floorAlt: '#638C43' },
  'course-history': { px: 0, py: 2, floor: '#9C6B44', floorAlt: '#8F613D' },
  'course-charms': { px: 3, py: 2, floor: '#4D78A8', floorAlt: '#456D99' },
  'course-astronomy': { px: 2, py: 2, floor: '#33406E', floorAlt: '#2C3862' },
  'course-flying': { px: 1, py: 2, floor: '#7FB069', floorAlt: '#75A35F' },
  'course-divination': { px: 0, py: 1, floor: '#7E4A86', floorAlt: '#72427A' },
  'course-transfiguration': { px: 2, py: 1, floor: '#5E7C82', floorAlt: '#557177' },
  'course-defense': { px: 0, py: 0, floor: '#6B3A3A', floorAlt: '#603434' },
  'course-duel': { px: 1, py: 1, floor: '#7A4B3A', floorAlt: '#6C4233' },
  // Tout en haut : la Salle des Examens, au bout d'un long couloir (centrée sur un axe de couloir).
  exam: { px: 0, py: -1, shiftX: 6, shiftY: -6, door: 'y', floor: '#6E6250', floorAlt: '#625746' },
  'dorm-0': { px: 4, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-1': { px: 3, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-2': { px: 4, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-3': { px: 3, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-4': { px: 2, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-5': { px: 1, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
};

/** Parcelles de jardin (décor). */
export const GARDENS: { px: number; py: number }[] = [];

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
    { sprite: 'bookshelf', x: 0.6, y: 1.5, width: 30 },
    { sprite: 'bookshelf', x: 0.6, y: 3.6, width: 30 },
    { sprite: 'clock', x: 0.6, y: 6.2, width: 22 },
    { sprite: 'noticeBoard', x: 3.5, y: 0.7, width: 30 },
    { sprite: 'bookshelf', x: 6.0, y: 0.5, width: 30 },
    { sprite: 'statue', x: 11, y: 1.2, width: 34 },
    { sprite: 'bookshelf', x: 16.0, y: 0.5, width: 30 },
    { sprite: 'jarShelf', x: 18.5, y: 0.5, width: 30 },
    { sprite: 'coatStand', x: 21.0, y: 1.0, width: 24 },
    { sprite: 'armchair', x: 3.0, y: 8.0, width: 32 },
    { sprite: 'armchair', x: 5.0, y: 8.6, width: 32 },
    { sprite: 'planterTree', x: 8.2, y: 9.0, width: 30 },
    { sprite: 'planterTree', x: 13.8, y: 9.0, width: 30 },
    { sprite: 'parkBench', x: 17.5, y: 8.4, width: 32 },
    { sprite: 'candelabra', x: 21.0, y: 8.8, width: 22 },
    { sprite: 'globe', x: 21.0, y: 5.0, width: 26 },
    { sprite: 'candelabra', x: 1.2, y: 9.0, width: 22 },
  ],
  exam: [
    { sprite: 'clock', x: 0.6, y: 1.2, width: 22 },
    { sprite: 'bookshelf', x: 0.6, y: 6.8, width: 30 },
    { sprite: 'candelabra', x: 7.3, y: 0.8, width: 22 },
    { sprite: 'candelabra', x: 7.3, y: 7.2, width: 22 },
    { sprite: 'books', x: 1.2, y: 7.4, width: 26 },
    { sprite: 'owl', x: 3.0, y: 0.6, width: 20 },
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
  exam: { tex: 'stone', tile: 4 },
};
