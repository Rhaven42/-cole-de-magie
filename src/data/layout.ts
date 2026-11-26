/**
 * Plan isométrique de l'école (vue de dessus 3/4).
 * Organisation : à l'avant, seul, le grand Accueil (3 parcelles, porche) entre deux jardins,
 * relié au portail par une allée droite. Derrière lui : le Salon des Destinées (dans l'axe),
 * les cours rangés par année de l'avant vers le fond, la Grande Salle et l'aile des dortoirs
 * à droite. Tout en haut, la grande Salle des Examens au bout de son couloir.
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
export const PLOT = { size: 10, gap: 2, cols: 5, rows: 5, margin: 5, front: 13, top: 18 };

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
  /** Terrain en plein air (pas de murs) : le terrain de Balais volants. */
  outdoor?: boolean;
  /** Couleur du sol (tapis / dalles). */
  floor: string;
  floorAlt: string;
}

/** Emplacement de chaque lieu (id de Station) ou décor. */
export const PLOTS: Record<string, PlotDef> = {
  reception: { px: 1, py: 4, spanX: 3, door: 'y', floor: '#C9A27A', floorAlt: '#BD946B' },
  sorting: { px: 2, py: 3, floor: '#5B4A86', floorAlt: '#52417A' },
  hall: { px: 4, py: 3, floor: '#A2553C', floorAlt: '#954C35' },
  'course-potions': { px: 1, py: 3, floor: '#4E7F6A', floorAlt: '#46735F' },
  'course-botany': { px: 0, py: 3, floor: '#6E9A4B', floorAlt: '#638C43' },
  'course-history': { px: 3, py: 3, floor: '#9C6B44', floorAlt: '#8F613D' },
  'course-charms': { px: 0, py: 2, floor: '#4D78A8', floorAlt: '#456D99' },
  'course-astronomy': { px: 1, py: 2, floor: '#33406E', floorAlt: '#2C3862' },
  // Balais volants : grand terrain en plein air, au fond de l'école (à droite des Examens).
  'course-flying': {
    px: 3,
    py: -1,
    shiftY: -6,
    spanX: 2,
    door: 'y',
    outdoor: true,
    floor: '#7FB069',
    floorAlt: '#75A35F',
  },
  'course-divination': { px: 3, py: 2, floor: '#7E4A86', floorAlt: '#72427A' },
  'course-transfiguration': { px: 1, py: 1, floor: '#5E7C82', floorAlt: '#557177' },
  'course-defense': { px: 2, py: 1, floor: '#6B3A3A', floorAlt: '#603434' },
  'course-duel': { px: 0, py: 1, floor: '#7A4B3A', floorAlt: '#6C4233' },
  // Tout en haut : la Salle des Examens, au bout d'un long couloir (centrée sur un axe de couloir).
  exam: { px: 0, py: -1, shiftY: -6, spanX: 2, door: 'y', floor: '#6E6250', floorAlt: '#625746' },
  'dorm-0': { px: 4, py: 2, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-1': { px: 4, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-2': { px: 3, py: 1, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-3': { px: 4, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-4': { px: 3, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-5': { px: 2, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
};

/** Parcelles de jardin (décor). */
/** Jardins : petits jardins de chaque côté de l'Accueil, grand jardin au fond (2 parcelles). */
export const GARDENS: { px: number; py: number; spanX?: number }[] = [
  { px: 0, py: 4 },
  { px: 4, py: 4 },
  { px: 0, py: 0, spanX: 2 },
  // Cour intérieure (ancienne salle de Balais volants, partie dehors).
  { px: 2, py: 2 },
];

/** Décor d'une salle : sprite posé à une position de grille relative à la salle. */
export interface DecorItem {
  sprite: string;
  x: number;
  y: number;
  width: number;
  mirror?: boolean;
}

const COURSE_COMMON: DecorItem[] = [
  { sprite: 'candelabra', x: 0.8, y: 7.3, width: 22 },
  { sprite: 'books', x: 4.6, y: 7.55, width: 24 },
  { sprite: 'planterTree', x: 7.45, y: 6.1, width: 24 },
  { sprite: 'chest', x: 2.6, y: 7.55, width: 24 },
];

/** Décorations par type de salle (matière ou lieu). Positions hors des places. */
export const ROOM_DECOR: Record<string, DecorItem[]> = {
  potions: COURSE_COMMON,
  botany: COURSE_COMMON,
  history: COURSE_COMMON,
  charms: COURSE_COMMON,
  astronomy: COURSE_COMMON,
  flying: [
    { sprite: 'lamp', x: 0.6, y: 7.4, width: 18 },
    { sprite: 'haystack', x: 16.8, y: 1.4, width: 36 },
    { sprite: 'barrel', x: 0.7, y: 3.2, width: 20 },
  ],
  divination: COURSE_COMMON,
  transfiguration: COURSE_COMMON,
  defense: COURSE_COMMON,
  duel: COURSE_COMMON,
  dorm: [
    { sprite: 'coatStand', x: 7.4, y: 0.7, width: 24 },
    { sprite: 'planterTree', x: 0.8, y: 7.3, width: 28 },
    { sprite: 'chest', x: 7.4, y: 7.3, width: 26 },
    { sprite: 'candelabra', x: 0.6, y: 0.7, width: 20 },
    { sprite: 'armchair', x: 4.0, y: 7.6, width: 28 },
    { sprite: 'books', x: 0.7, y: 4.0, width: 22 },
  ],
  hall: [
    { sprite: 'candelabra', x: 0.7, y: 0.8, width: 22 },
    { sprite: 'clock', x: 7.4, y: 0.6, width: 22 },
    { sprite: 'planterTree', x: 0.8, y: 7.4, width: 28 },
    { sprite: 'barrel', x: 0.7, y: 2.2, width: 20 },
    { sprite: 'crates', x: 0.7, y: 6.2, width: 26 },
    { sprite: 'candelabra', x: 7.4, y: 7.5, width: 22 },
  ],
  reception: [
    { sprite: 'bookshelf', x: 0.6, y: 1.5, width: 30 },
    { sprite: 'bookshelf', x: 0.6, y: 3.6, width: 30 },
    { sprite: 'clock', x: 0.6, y: 6.2, width: 22 },
    { sprite: 'candelabra', x: 1.2, y: 9.0, width: 22 },
    { sprite: 'noticeBoard', x: 4.0, y: 0.7, width: 30 },
    { sprite: 'bookshelf', x: 7.5, y: 0.5, width: 30 },
    { sprite: 'planterTree', x: 10.5, y: 0.8, width: 30 },
    { sprite: 'statue', x: 17.0, y: 1.0, width: 36 },
    { sprite: 'planterTree', x: 23.5, y: 0.8, width: 30 },
    { sprite: 'bookshelf', x: 26.5, y: 0.5, width: 30 },
    { sprite: 'jarShelf', x: 29.0, y: 0.5, width: 30 },
    { sprite: 'coatStand', x: 32.8, y: 1.0, width: 24 },
    { sprite: 'globe', x: 32.8, y: 5.0, width: 26 },
    { sprite: 'candelabra', x: 32.8, y: 8.8, width: 22 },
    { sprite: 'armchair', x: 3.0, y: 8.0, width: 32 },
    { sprite: 'armchair', x: 5.2, y: 8.6, width: 32 },
    { sprite: 'planterTree', x: 13.8, y: 9.0, width: 30 },
    { sprite: 'planterTree', x: 20.2, y: 9.0, width: 30 },
    { sprite: 'parkBench', x: 25.5, y: 8.4, width: 32 },
    { sprite: 'armchair', x: 29.0, y: 8.2, width: 32 },
    { sprite: 'books', x: 31.0, y: 8.9, width: 26 },
  ],
  exam: [
    { sprite: 'clock', x: 0.6, y: 1.0, width: 22 },
    { sprite: 'bookshelf', x: 0.6, y: 8.6, width: 30 },
    { sprite: 'candelabra', x: 6.0, y: 0.7, width: 22 },
    { sprite: 'owl', x: 9.0, y: 0.6, width: 20 },
    { sprite: 'statue', x: 12.0, y: 0.9, width: 34 },
    { sprite: 'candelabra', x: 16.0, y: 0.7, width: 22 },
    { sprite: 'noticeBoard', x: 19.0, y: 0.7, width: 30 },
    { sprite: 'candelabra', x: 21.0, y: 4.5, width: 22 },
    { sprite: 'books', x: 21.0, y: 9.0, width: 26 },
    { sprite: 'chest', x: 1.4, y: 9.2, width: 26 },
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
