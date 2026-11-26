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
  wallH: 38,
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
