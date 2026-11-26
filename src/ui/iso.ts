import { ISO, PLOT, PLOTS } from '../data/layout';

/** Taille de la grille complète, en tuiles. */
export const GRID_X = PLOT.margin * 2 + PLOT.cols * (PLOT.size + PLOT.gap);
export const GRID_Y = PLOT.margin * 2 + PLOT.rows * (PLOT.size + PLOT.gap);

const OFFSET_X = GRID_Y * (ISO.tileW / 2);
const OFFSET_Y = ISO.wallH + 30;

export const MAP_W = (GRID_X + GRID_Y) * (ISO.tileW / 2);
export const MAP_H = (GRID_X + GRID_Y) * (ISO.tileH / 2) + OFFSET_Y + 20;

export interface Pt {
  x: number;
  y: number;
}

/** Projection grille → écran (px dans la carte). */
export function iso(gx: number, gy: number): Pt {
  return {
    x: (gx - gy) * (ISO.tileW / 2) + OFFSET_X,
    y: (gx + gy) * (ISO.tileH / 2) + OFFSET_Y,
  };
}

/** Projection inverse écran → grille (sol). */
export function unIso(x: number, y: number): Pt {
  const a = (x - OFFSET_X) / (ISO.tileW / 2);
  const b = (y - OFFSET_Y) / (ISO.tileH / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

export function plotOrigin(px: number, py: number): Pt {
  return {
    x: PLOT.margin + px * (PLOT.size + PLOT.gap),
    y: PLOT.margin + py * (PLOT.size + PLOT.gap),
  };
}

export function stationOrigin(id: string): Pt | null {
  const p = PLOTS[id];
  return p ? plotOrigin(p.px, p.py) : null;
}

export function poly(pts: Pt[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/** Losange au sol d'un rectangle de grille. */
export function floorPoly(gx: number, gy: number, w: number, h: number): string {
  return poly([iso(gx, gy), iso(gx + w, gy), iso(gx + w, gy + h), iso(gx, gy + h)]);
}

/** Lieu (id) situé sous un point de la grille, ou null. */
export function hitPlot(g: Pt): string | null {
  for (const [id, p] of Object.entries(PLOTS)) {
    const o = plotOrigin(p.px, p.py);
    if (g.x >= o.x && g.x <= o.x + PLOT.size && g.y >= o.y && g.y <= o.y + PLOT.size) return id;
  }
  return null;
}

/** Position (grille, relative à la salle) de chaque place selon le type de lieu. */
export function seatSpot(kind: string, i: number): Pt {
  switch (kind) {
    case 'dorm':
      return { x: 1.4 + Math.floor(i / 4) * 1.75, y: 1.3 + (i % 4) * 1.75 };
    case 'hall':
      return { x: 1.5 + Math.floor(i / 8) * 1.35, y: 0.9 + (i % 8) * 0.85 };
    case 'reception':
      return { x: 3.4, y: 1.4 + i * 1.05 };
    case 'sorting': {
      const spots = [
        { x: 5.2, y: 4 },
        { x: 4, y: 5.4 },
        { x: 5.2, y: 2.6 },
        { x: 4, y: 2.6 },
      ];
      return spots[i] ?? { x: 5.5, y: 5.5 };
    }
    default:
      // salles de cours : 4 colonnes, rangées vers l'avant
      return { x: 2.6 + Math.floor(i / 4) * 1.6, y: 1.5 + (i % 4) * 1.65 };
  }
}

/** Emplacement de la k-ième personne dans la file, dans le couloir devant la porte. */
export function queueSpot(k: number): Pt {
  const col = Math.floor(k / 10);
  const row = k % 10;
  return { x: PLOT.size + 0.45 + col * 0.55, y: 0.6 + row * 0.7 };
}

// ─── Déplacements : couloirs et portes ───────────────────────────────────────

/** Point d'ancrage d'un élève : position (grille absolue) et salle éventuelle. */
export interface Anchor {
  g: Pt;
  room: string | null;
}

const HALF_GAP = PLOT.gap / 2;

/** Axes des couloirs (le long de y, à x fixe) et (le long de x, à y fixe). */
export const CORRIDOR_X = [
  PLOT.margin - HALF_GAP,
  ...Array.from({ length: PLOT.cols }, (_, p) => plotOrigin(p, 0).x + PLOT.size + HALF_GAP),
];
export const CORRIDOR_Y = [
  PLOT.margin - HALF_GAP,
  ...Array.from({ length: PLOT.rows }, (_, q) => plotOrigin(0, q).y + PLOT.size + HALF_GAP),
];

/** Porte d'une salle : au milieu du mur avant droit. */
export function doorOf(id: string): { inside: Pt; outside: Pt } | null {
  const o = stationOrigin(id);
  if (!o) return null;
  const y = o.y + PLOT.size / 2;
  return { inside: { x: o.x + PLOT.size - 0.7, y }, outside: { x: o.x + PLOT.size + HALF_GAP, y } };
}

/** Grille d'entrée de l'école. */
export function gatePoint(): Pt {
  const rec = plotOrigin(PLOTS.reception.px, PLOTS.reception.py);
  return { x: GRID_X - 1.2, y: rec.y + PLOT.size / 2 };
}

function nearest(values: number[], v: number): number {
  return values.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

/**
 * Chemin (points de grille) d'un ancrage à un autre, en passant par les portes
 * et en suivant les couloirs (déplacements en « L » sur le réseau de couloirs).
 */
export function route(from: Anchor, to: Anchor): Pt[] {
  const pts: Pt[] = [];
  const fromDoor = from.room ? doorOf(from.room) : null;
  const toDoor = to.room ? doorOf(to.room) : null;
  // Même salle : déplacement direct à l'intérieur.
  if (from.room && from.room === to.room) return [to.g];

  let c1: Pt;
  if (fromDoor) {
    pts.push(fromDoor.inside, fromDoor.outside);
    c1 = fromDoor.outside;
  } else {
    c1 = { x: nearest(CORRIDOR_X, from.g.x), y: from.g.y };
    pts.push(c1);
  }
  const c2: Pt = toDoor ? toDoor.outside : { x: nearest(CORRIDOR_X, to.g.x), y: to.g.y };
  if (Math.abs(c1.x - c2.x) > 0.01) {
    const yLine = CORRIDOR_Y.reduce((best, y) =>
      Math.abs(c1.y - y) + Math.abs(c2.y - y) < Math.abs(c1.y - best) + Math.abs(c2.y - best)
        ? y
        : best,
    );
    pts.push({ x: c1.x, y: yLine }, { x: c2.x, y: yLine });
  }
  pts.push(c2);
  if (toDoor) pts.push(toDoor.inside);
  pts.push(to.g);
  // Retire les points consécutifs identiques.
  return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.01);
}

/** Position d'une place : personnalisée (réaménagement) ou par défaut. */
export function seatPos(kind: string, i: number, custom?: Pt): Pt {
  return custom ?? seatSpot(kind, i);
}
