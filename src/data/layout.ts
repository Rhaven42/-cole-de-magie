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
/** gap : largeur des couloirs (larges, avec tapis). */
export const PLOT = { size: 10, gap: 4, cols: 5, rows: 5, margin: 5, front: 13, top: 18 };

/** Échelle des aménagements intérieurs (conçus pour une salle de 8 cases). */
export const ROOM_SCALE = PLOT.size / 8;

export interface PlotDef {
  px: number;
  py: number;
  /** Nombre de parcelles occupées le long de x (grande salle sur 2 parcelles). */
  spanX?: number;
  /** Nombre de parcelles occupées le long de y (la cantine, sur 2 × 2 parcelles). */
  spanY?: number;
  /** Décalage (cases) de la salle par rapport à sa parcelle. */
  shiftX?: number;
  shiftY?: number;
  /**
   * Côté de la porte : 'x' = face avant droite (défaut), 'y' = face avant gauche (entrée),
   * 'back' = mur du fond (côté y minimal).
   */
  door?: 'x' | 'y' | 'back';
  /** Lieu situé à l'intérieur d'une autre salle (le Chaporacle dans l'Accueil). */
  hostedIn?: string;
  /** Terrain en plein air (pas de murs) : le terrain de Balais volants. */
  outdoor?: boolean;
  /** Couleur du sol (tapis / dalles). */
  floor: string;
  floorAlt: string;
}

/** Emplacement de chaque lieu (id de Station) ou décor. */
export const PLOTS: Record<string, PlotDef> = {
  reception: { px: 1, py: 4, spanX: 3, door: 'y', floor: '#C9A27A', floorAlt: '#BD946B' },
  // Le Chaporacle trône dans la partie droite du grand Accueil ; sortie par une porte au fond.
  sorting: {
    px: 3,
    py: 4,
    hostedIn: 'reception',
    door: 'back',
    floor: '#5B4A86',
    floorAlt: '#52417A',
  },
  // Cantine : grande salle sur 2 parcelles, juste derrière l'Accueil.
  hall: { px: 2, py: 2, spanX: 2, spanY: 2, floor: '#A2553C', floorAlt: '#954C35' },
  // Salle des professeurs (amélioration des profs).
  staff: { px: 2, py: 0, floor: '#6B4E3A', floorAlt: '#5F4433' },
  'course-potions': { px: 1, py: 3, floor: '#4E7F6A', floorAlt: '#46735F' },
  'course-botany': { px: 0, py: 3, floor: '#6E9A4B', floorAlt: '#638C43' },
  'course-history': { px: 4, py: 3, door: 'y', floor: '#9C6B44', floorAlt: '#8F613D' },
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
  'course-divination': { px: 3, py: 1, floor: '#7E4A86', floorAlt: '#72427A' },
  'course-transfiguration': { px: 1, py: 1, floor: '#5E7C82', floorAlt: '#557177' },
  'course-defense': { px: 2, py: 1, floor: '#6B3A3A', floorAlt: '#603434' },
  'course-duel': { px: 0, py: 1, floor: '#7A4B3A', floorAlt: '#6C4233' },
  // Tout en haut : la Salle des Examens, au bout d'un long couloir (centrée sur un axe de couloir).
  exam: { px: 0, py: -1, shiftY: -6, spanX: 2, door: 'y', floor: '#6E6250', floorAlt: '#625746' },
  // Aile des dortoirs (colonne de droite : portes côté intérieur de l'école).
  'dorm-0': { px: 4, py: 2, door: 'y', floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-1': { px: 4, py: 1, door: 'y', floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-2': { px: 4, py: 0, door: 'y', floor: '#4A5A8C', floorAlt: '#42517F' },
  'dorm-3': { px: 3, py: 0, floor: '#4A5A8C', floorAlt: '#42517F' },
};

/** Cantine : lignes des 4 tables de Maison (y, en cases), début des tables, table des profs. */
export const HALL_ROWS = [4.5, 9.5, 14.5, 19.5];
export const HALL_X0 = 2.2;
/** Longueur des tables des Maisons (cases). */
export const HALL_TABLE_LEN = 15;
export const HALL_PROF_X = 20.2;
/** Table des profs : début (y) et espace par prof. */
export const PROF_TABLE_Y = 3;
export const PROF_SEAT_GAP = 1.9;

/** Parcelles de jardin (décor). */
/** Jardins : petits jardins de chaque côté de l'Accueil, grand jardin au fond (2 parcelles). */
export const GARDENS: { px: number; py: number; spanX?: number }[] = [
  { px: 0, py: 4 },
  { px: 4, py: 4 },
  { px: 0, py: 0, spanX: 2 },
];

/** Décor d'une salle : sprite posé à une position de grille relative à la salle. */
export interface DecorItem {
  sprite: string;
  x: number;
  y: number;
  width: number;
  mirror?: boolean;
}

/** Objet placé en cases réelles (converties dans l'unité des décors, ÷ ROOM_SCALE). */
function at(sprite: string, x: number, y: number, width: number): DecorItem {
  return { sprite, x: x / ROOM_SCALE, y: y / ROOM_SCALE, width };
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
  // Positions en cases réelles converties (÷ ROOM_SCALE) : voir `at`.
  hall: [
    at('candelabra', 0.5, 0.5, 22),
    at('fireplace', 11.0, 0.7, 50),
    at('clock', 23.3, 0.6, 22),
    at('jarShelf', 6.0, 0.5, 30),
    at('jarShelf', 16.0, 0.5, 30),
    at('planterTree', 23.3, 23.2, 28),
    at('planterTree', 0.7, 23.2, 28),
    at('candelabra', 0.5, 12.0, 22),
    at('candelabra', 23.4, 12.0, 22),
  ],
  // Accueil : guichets à gauche, coin d'attente, le Chaporacle à droite (zone violette).
  reception: [
    at('bookshelf', 0.8, 0.6, 30),
    at('jarShelf', 3.2, 0.5, 30),
    at('bookshelf', 6.0, 0.6, 30),
    at('clock', 8.6, 0.6, 22),
    at('noticeBoard', 11.2, 0.6, 30),
    at('bookshelf', 14.0, 0.6, 30),
    at('planterTree', 17.0, 0.8, 30),
    at('coatStand', 20.0, 0.8, 24),
    at('bookshelf', 23.0, 0.6, 30),
    at('candelabra', 26.0, 0.7, 22),
    at('globe', 0.8, 3.0, 26),
    at('planterTree', 0.8, 9.1, 28),
    at('armchair', 3.0, 8.6, 32),
    at('armchair', 5.4, 9.0, 32),
    at('books', 7.6, 9.2, 24),
    at('planterTree', 13.0, 9.1, 28),
    at('planterTree', 25.0, 9.1, 28),
    at('statue', 37.0, 1.2, 36),
    at('candelabra', 37.2, 8.9, 22),
    at('candelabra', 28.6, 8.9, 22),
  ],
  // Salle des professeurs : coin cheminée, fauteuils, bibliothèques.
  staff: [
    at('fireplace', 1.0, 4.8, 46),
    at('armchair', 3.2, 3.2, 32),
    at('armchair', 3.4, 6.4, 32),
    at('stool', 4.2, 4.9, 18),
    at('bookshelf', 4.0, 0.6, 30),
    at('bookshelf', 6.4, 0.6, 30),
    at('clock', 8.8, 0.6, 22),
    at('globe', 8.8, 3.2, 26),
    at('table', 7.0, 6.0, 60),
    at('candelabra', 9.2, 9.1, 22),
    at('coatStand', 0.7, 9.0, 24),
    at('planterTree', 0.7, 0.8, 28),
    at('books', 6.0, 9.2, 24),
  ],
  exam: [
    at('clock', 0.7, 1.0, 22),
    at('bookshelf', 0.7, 8.8, 30),
    at('candelabra', 6.0, 0.6, 22),
    at('owl', 9.0, 0.6, 20),
    at('statue', 12.0, 0.9, 34),
    at('candelabra', 16.0, 0.6, 22),
    at('noticeBoard', 19.5, 0.7, 30),
    at('candelabra', 23.2, 4.5, 22),
    at('books', 23.0, 9.1, 26),
    at('chest', 2.0, 9.2, 26),
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
