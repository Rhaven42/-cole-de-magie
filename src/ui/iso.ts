import { ISO, PLOT, PLOTS, ROOM_SCALE } from '../data/layout';

/** Taille de la grille complète, en tuiles. */
export const GRID_X = PLOT.margin + PLOT.front + PLOT.cols * (PLOT.size + PLOT.gap);
export const GRID_Y = PLOT.margin + PLOT.top + PLOT.front + PLOT.rows * (PLOT.size + PLOT.gap);

export const OFFSET_X = GRID_Y * (ISO.tileW / 2);
export const OFFSET_Y = ISO.wallH + 30;

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
    y: PLOT.margin + PLOT.top + py * (PLOT.size + PLOT.gap),
  };
}

/** Origine d'une salle : sa parcelle, plus un éventuel décalage. */
export function roomOrigin(p: { px: number; py: number; shiftX?: number; shiftY?: number }): Pt {
  const o = plotOrigin(p.px, p.py);
  return { x: o.x + (p.shiftX ?? 0), y: o.y + (p.shiftY ?? 0) };
}

export function stationOrigin(id: string): Pt | null {
  const p = PLOTS[id];
  return p ? roomOrigin(p) : null;
}

/** Couloir qui monte du fond de l'école vers un lieu du dernier rang (Examens, terrain de Balais). */
export function backCorridor(id: string): { x: number; y0: number; y1: number } | null {
  if (!PLOTS[id] || PLOTS[id].py >= 0) return null;
  const d = doorOf(id);
  if (!d) return null;
  return { x: d.outside.x, y0: d.outside.y - PLOT.gap / 2, y1: plotOrigin(0, 0).y - PLOT.gap / 2 };
}

/** Couloir de la Salle des Examens (compatibilité). */
export function examCorridor() {
  return backCorridor('exam');
}

/** Taille d'une salle en cases (les grandes salles occupent plusieurs parcelles). */
export function roomSize(id: string): { w: number; h: number } {
  const span = PLOTS[id]?.spanX ?? 1;
  return { w: span * PLOT.size + (span - 1) * PLOT.gap, h: PLOT.size };
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
    const o = roomOrigin(p);
    const { w, h } = roomSize(id);
    if (g.x >= o.x && g.x <= o.x + w && g.y >= o.y && g.y <= o.y + h) return id;
  }
  return null;
}

/** Position (grille, relative à la salle) de chaque place selon le type de lieu. */
export function seatSpot(kind: string, i: number): Pt {
  // Grand Accueil (2 parcelles) : guichets alignés au centre, face à l'entrée.
  if (kind === 'reception') return { x: roomSize('reception').w / 2 - 3.5 + i * 1.4, y: 5.6 };
  // Grande Salle des Examens : tables en 2 rangées de 6, face à l'examinateur.
  if (kind === 'exam') return { x: 3.4 + (i % 6) * 3.0, y: 2.6 + Math.floor(i / 6) * 2.8 };
  const p = baseSeatSpot(kind, i);
  return { x: p.x * ROOM_SCALE, y: p.y * ROOM_SCALE };
}

function baseSeatSpot(kind: string, i: number): Pt {
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
  const perCol = Math.floor((PLOT.size - 1) / 0.7);
  const col = Math.floor(k / perCol);
  const row = k % perCol;
  return { x: PLOT.size + 0.5 + col * 0.55, y: 0.6 + row * 0.7 };
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
export function doorOf(id: string): { inside: Pt; outside: Pt; axis: 'x' | 'y' } | null {
  const o = stationOrigin(id);
  if (!o) return null;
  const { w, h } = roomSize(id);
  if (PLOTS[id].door === 'y') {
    const x = o.x + w / 2;
    return { inside: { x, y: o.y + h - 0.7 }, outside: { x, y: o.y + h + HALF_GAP }, axis: 'y' };
  }
  const y = o.y + h / 2;
  return { inside: { x: o.x + w - 0.7, y }, outside: { x: o.x + w + HALF_GAP, y }, axis: 'x' };
}

/** Axes de couloir « x » libres (pas sous une grande salle) pour rejoindre le réseau. */
function freeCorridorX(): number[] {
  return CORRIDOR_X.filter((x) =>
    Object.entries(PLOTS).every(([id, p]) => {
      if ((p.spanX ?? 1) < 2 || p.py < 0) return true;
      const o = plotOrigin(p.px, p.py);
      return !(x > o.x && x < o.x + roomSize(id).w);
    }),
  );
}

/** Grille d'entrée de l'école. */
/**
 * Cour d'entrée : le portail est à la pointe avant de la carte ; une allée en « L »
 * remonte vers l'école (axe x = pathX) jusqu'au couloir de l'Accueil.
 */
export function courtyard() {
  const d = doorOf('reception')!;
  const rec = plotOrigin(PLOTS.reception.px, PLOTS.reception.py);
  const schoolFrontY = rec.y + PLOT.size + PLOT.gap / 2;
  return { pathX: d.outside.x, schoolFrontY, gateX: d.outside.x, gateY: GRID_Y - 3 };
}

/** Grille d'entrée de l'école (les nouveaux élèves arrivent par là). */
export function gatePoint(): Pt {
  const c = courtyard();
  return { x: c.gateX, y: c.gateY };
}

function nearest(values: number[], v: number): number {
  return values.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

/**
 * Chemin (points de grille) d'un ancrage à un autre, en passant par les portes
 * et en suivant les couloirs (déplacements en « L » sur le réseau de couloirs).
 */
export function route(from: Anchor, to: Anchor): Pt[] {
  const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
  const clean = (pts: Pt[]) =>
    pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.01);
  const fromDoor = from.room ? doorOf(from.room) : null;
  const toDoor = to.room ? doorOf(to.room) : null;
  // Même salle : déplacement direct à l'intérieur.
  if (from.room && from.room === to.room) return [to.g];
  // Deux points de couloir alignés (allée, file d'attente) : ligne droite.
  if (!from.room && !to.room && (near(from.g.x, to.g.x) || near(from.g.y, to.g.y))) return [to.g];
  // Sur l'allée qui mène à une porte « y » (l'entrée) : tout droit jusqu'à la porte.
  if (!from.room && toDoor?.axis === 'y' && near(from.g.x, toDoor.outside.x))
    return clean([toDoor.outside, toDoor.inside, to.g]);
  if (!to.room && fromDoor?.axis === 'y' && near(to.g.x, fromDoor.outside.x))
    return clean([fromDoor.inside, fromDoor.outside, to.g]);

  const pts: Pt[] = [];
  let c1: Pt;
  if (fromDoor) {
    pts.push(fromDoor.inside, fromDoor.outside);
    c1 = fromDoor.outside;
    if (fromDoor.axis === 'y') {
      c1 = { x: nearest(freeCorridorX(), c1.x), y: c1.y };
      pts.push(c1);
    }
  } else {
    c1 = { x: nearest(CORRIDOR_X, from.g.x), y: from.g.y };
    pts.push(c1);
  }
  let c2: Pt;
  const tail: Pt[] = [];
  if (toDoor && toDoor.axis === 'y') {
    c2 = { x: nearest(freeCorridorX(), toDoor.outside.x), y: toDoor.outside.y };
    tail.push(toDoor.outside, toDoor.inside);
  } else if (toDoor) {
    c2 = toDoor.outside;
    tail.push(toDoor.inside);
  } else {
    c2 = { x: nearest(CORRIDOR_X, to.g.x), y: to.g.y };
  }
  if (Math.abs(c1.x - c2.x) > 0.01) {
    const yLine = CORRIDOR_Y.reduce((best, y) =>
      Math.abs(c1.y - y) + Math.abs(c2.y - y) < Math.abs(c1.y - best) + Math.abs(c2.y - best)
        ? y
        : best,
    );
    pts.push({ x: c1.x, y: yLine }, { x: c2.x, y: yLine });
  }
  pts.push(c2, ...tail, to.g);
  return clean(pts);
}

/** Position d'une place : personnalisée (réaménagement) ou par défaut. */
export function seatPos(kind: string, i: number, custom?: Pt): Pt {
  return custom ?? seatSpot(kind, i);
}

/** Lampadaires de l'allée d'entrée (grille absolue). */
export function courtyardLamps(): Pt[] {
  const { pathX, schoolFrontY, gateY } = courtyard();
  const out: Pt[] = [];
  for (let y = schoolFrontY + 2; y < gateY - 1.5; y += 3.4)
    out.push({ x: pathX - 3.5, y }, { x: pathX + 3.5, y });
  return out;
}

/** Fontaine de la cour d'entrée (grille absolue). */
export function fountainPoint(): Pt {
  const { pathX, schoolFrontY } = courtyard();
  return { x: pathX + 11, y: schoolFrontY + 7 };
}

/** File d'attente d'un lieu : le long de l'allée pour l'entrée, sinon dans le couloir. */
export function queueSpotFor(id: string, k: number): Pt {
  if (PLOTS[id]?.door === 'y') {
    const { w, h } = roomSize(id);
    return { x: w / 2, y: h + 1.4 + k * 0.75 };
  }
  return queueSpot(k);
}
