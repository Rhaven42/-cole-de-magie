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
