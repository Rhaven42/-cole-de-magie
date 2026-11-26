import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import type { SpriteName } from '../assets';
import { ENVIRONMENTS, type EnvDef } from '../data/environments';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import { FLOOR_TEXTURE, GARDENS, ISO, PLOT, PLOTS, ROOM_DECOR, ROOM_SCALE } from '../data/layout';
import type { Station } from '../engine';
import {
  courtyard,
  courtyardLamps,
  examCorridor,
  floorPoly,
  fountainPoint,
  GRID_X,
  GRID_Y,
  iso,
  MAP_H,
  MAP_W,
  plotOrigin,
  roomOrigin,
  poly,
  roomSize,
  type Pt,
} from './iso';
import { Box, Furniture, shade, Sprite, tiered, WallQuad } from './isoArt';
import { TexFloor, TexWall, WallShadow } from './isoTex';

const S = PLOT.size;
/** Échelle des positions intérieures (aménagements conçus pour 8 cases). */
const R = ROOM_SCALE;
/** Murs bas (murets) : on voit les élèves marcher dans les couloirs derrière. */
const H = 22;
/** Épaisseur des murs (cases) et hauteur de la tranche du sol surélevé (px). */
const WALL_T = 0.28;
const PLINTH = 7;
/** Demi-largeur de la grande allée d'entrée (cases). */
const PATH_HALF = 3;

export interface RoomSnapshot {
  id: string;
  kind: Station['kind'];
  courseId?: string;
  level: number;
  /** Position (grille relative) de chaque place. */
  seats: Pt[];
  /** Palier visuel de chaque place (0, 1, 2). */
  seatTiers: number[];
}

/** Tapis des salles de cours (teintes sourdes, une par matière). */
const RUGS: Record<string, string> = {
  potions: '#3E5A48',
  botany: '#5A6B3A',
  history: '#6B4A2E',
  charms: '#3A4A6B',
  astronomy: '#2A2F5A',
  flying: '#5A6B4A',
  divination: '#5A3A5E',
  duel: '#6B2E2E',
  transfiguration: '#3E5458',
  defense: '#4A2A2A',
  exam: '#4A3A2A',
};

function tier(level: number): number {
  return level >= 8 ? 2 : level >= 4 ? 1 : 0;
}

const lift = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
const drop = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y + h });

/** Ombre douce sous un objet. */
function Shadow({ p, w }: { p: Pt; w: number }) {
  return <Ellipse cx={p.x} cy={p.y + 1} rx={w * 0.42} ry={w * 0.2} fill="#000" opacity={0.22} />;
}

const FLOWER_CLUMPS: SpriteName[] = [
  'lavender',
  'poppies',
  'roseBush',
  'hydrangea',
  'tulips',
  'foxgloves',
];

/**
 * Remplace les anciens massifs « en bloc » (bordures de pierre, haies carrées)
 * par des fleurs naturelles, variées selon la position (stable d'un rendu à l'autre).
 */
function naturalize(name: SpriteName, p: Pt, width: number): [SpriteName, number] {
  const h = Math.abs(Math.round(p.x * 7.3 + p.y * 13.1));
  switch (name) {
    case 'flowerBed':
      return [FLOWER_CLUMPS[h % FLOWER_CLUMPS.length], width * 0.95];
    case 'flowerBorder':
      return ['flowerStrip', width * 0.62];
    case 'flowerBorderM':
      return ['flowerStripM', width * 0.62];
    case 'hedge':
    case 'hedgeM':
      return [h % 2 ? 'whiteShrub' : 'roseBush', width * 0.85];
    default:
      return [name, width];
  }
}

/** Sprite de décor avec son ombre. */
function Decor({ name: raw, p, width: w0 }: { name: SpriteName; p: Pt; width: number }) {
  const [name, width] = naturalize(raw, p, w0);
  return (
    <G>
      <Shadow p={p} w={width} />
      <Sprite name={name} p={p} width={width} lift={3} />
    </G>
  );
}

/** Élément de décor extérieur selon l'environnement. */
function Deco({ p, s = 1, env }: { p: Pt; s?: number; env: EnvDef }) {
  switch (env.deco) {
    case 'coral':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y} rx={10 * s} ry={5 * s} fill="rgba(0,0,0,0.18)" />
          <Path
            d={`M${p.x} ${p.y} C${p.x - 12 * s} ${p.y - 10 * s} ${p.x - 4 * s} ${p.y - 22 * s} ${p.x - 9 * s} ${p.y - 30 * s} M${p.x} ${p.y} C${p.x + 2 * s} ${p.y - 14 * s} ${p.x + 12 * s} ${p.y - 18 * s} ${p.x + 8 * s} ${p.y - 28 * s}`}
            stroke="#E97A98"
            strokeWidth={5 * s}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={p.x + 12 * s} cy={p.y - 40 * s} r={3 * s} fill="#DFF6FF" opacity={0.7} />
          <Circle cx={p.x + 8 * s} cy={p.y - 50 * s} r={2 * s} fill="#DFF6FF" opacity={0.6} />
        </G>
      );
    case 'cloud':
      return (
        <G>
          <Circle cx={p.x - 10 * s} cy={p.y - 8 * s} r={10 * s} fill="#FFFFFF" />
          <Circle cx={p.x + 4 * s} cy={p.y - 14 * s} r={13 * s} fill="#FFFFFF" />
          <Circle cx={p.x + 16 * s} cy={p.y - 6 * s} r={9 * s} fill="#F2F7FF" />
        </G>
      );
    case 'mushroom':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y} rx={10 * s} ry={5 * s} fill="rgba(0,0,0,0.2)" />
          <Path
            d={`M${p.x - 3 * s} ${p.y} L${p.x - 3 * s} ${p.y - 16 * s} L${p.x + 3 * s} ${p.y - 16 * s} L${p.x + 3 * s} ${p.y} Z`}
            fill="#EDE2C6"
          />
          <Path
            d={`M${p.x - 16 * s} ${p.y - 14 * s} Q${p.x} ${p.y - 40 * s} ${p.x + 16 * s} ${p.y - 14 * s} Z`}
            fill="#A8392E"
          />
          <Circle cx={p.x - 5 * s} cy={p.y - 22 * s} r={2.5 * s} fill="#FFFFFF" />
          <Circle cx={p.x + 6 * s} cy={p.y - 20 * s} r={2 * s} fill="#FFFFFF" />
        </G>
      );
    case 'crater':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y} rx={18 * s} ry={9 * s} fill="#6E6E84" />
          <Ellipse cx={p.x} cy={p.y + 1} rx={13 * s} ry={6 * s} fill="#5A5A70" />
        </G>
      );
    default:
      return <Decor name="oak" p={p} width={58 * s} />;
  }
}

/** Objet posé dehors : position de grille absolue. */
interface Outdoor {
  name: SpriteName;
  x: number;
  y: number;
  w: number;
}

/** Long couloir qui monte du fond de l'école jusqu'à la Salle des Examens. */
function ExamCorridor({ env }: { env: EnvDef }) {
  const c = examCorridor();
  if (!c) return null;
  const tinted = env.id !== 'manor';
  const lamps: ReactElement[] = [];
  for (let y = c.y0 + 1.2; y < c.y1 - 0.8; y += 2.6) {
    lamps.push(
      <Decor key={`a${y}`} name="candelabra" p={iso(c.x - 1.5, y)} width={20} />,
      <Decor key={`b${y}`} name="candelabra" p={iso(c.x + 1.5, y + 1.3)} width={20} />,
    );
  }
  return (
    <G>
      <Polygon
        points={poly([
          iso(c.x + 1.3, c.y0),
          iso(c.x + 1.3, c.y1),
          drop(iso(c.x + 1.3, c.y1), 8),
          drop(iso(c.x + 1.3, c.y0), 8),
        ])}
        fill="#585046"
      />
      <TexFloor
        id="examCorridor"
        gx={c.x - 1.3}
        gy={c.y0}
        w={2.6}
        h={c.y1 - c.y0}
        tex="wood"
        tile={2.5}
        tint={tinted ? env.corridor : '#2B1A0E'}
        tintOpacity={tinted ? 0.45 : 0.18}
      />
      <Polygon points={floorPoly(c.x - 0.5, c.y0, 1, c.y1 - c.y0)} fill="#6B1F2A" opacity={0.7} />
      {lamps}
    </G>
  );
}

interface Placed {
  name: SpriteName;
  x: number;
  y: number;
  w: number;
}

/** Fontaine de la cour d'entrée. */
function Fountain({ p }: { p: Pt }) {
  return (
    <G>
      <Ellipse cx={p.x} cy={p.y + 4} rx={46} ry={23} fill="#000" opacity={0.2} />
      <Ellipse cx={p.x} cy={p.y} rx={42} ry={21} fill="#8F9A9D" />
      <Ellipse cx={p.x} cy={p.y - 2} rx={35} ry={16} fill="#5FA9CF" />
      <Ellipse cx={p.x - 8} cy={p.y - 5} rx={12} ry={4} fill="#BFE6FF" opacity={0.6} />
      <Line x1={p.x} y1={p.y - 4} x2={p.x} y2={p.y - 24} stroke="#8A9497" strokeWidth={6} />
      <Ellipse cx={p.x} cy={p.y - 24} rx={10} ry={4.5} fill="#9AA5A8" />
      <Ellipse cx={p.x} cy={p.y - 27} rx={5} ry={2.5} fill="#BFE6FF" />
    </G>
  );
}

/**
 * Paysage dessiné à la main autour de l'école (positions en cases).
 * Des « lieux » cohérents plutôt qu'un semis : prairie du fond, coin de l'étang,
 * potager et serre, bosquets, bordures fleuries le long des murs.
 */
/** Lisière boisée : bosquets en grappes irrégulières, avec des clairières. */
function forestEdge(): Placed[] {
  const out: Placed[] = [];
  const kinds: [SpriteName, number][] = [
    ['grove', 116],
    ['flowerBed', 46],
    ['bush', 32],
    ['pine', 50],
    ['wildGrass', 40],
    ['flowerBed', 42],
    ['oak', 66],
    ['bush', 30],
    ['flowerBorder', 54],
  ];
  const jitter = [0.4, -0.6, 0.9, -0.2, 0.7, -0.9, 0.1, 0.5, -0.4, 0.8];
  const step = [7, 5.5, 8.5, 6, 9.5, 6.5, 7.5];
  let k = 0;
  const line = (
    from: number,
    to: number,
    at: (t: number, j: number) => [number, number],
    skip?: (t: number) => boolean,
  ) => {
    for (let t = from; t < to; t += step[k % step.length]) {
      if (skip && skip(t)) {
        k++;
        continue;
      }
      const [x, y] = at(t, jitter[k % jitter.length]);
      const [name, w] = kinds[k % kinds.length];
      out.push({ name, x, y, w });
      k++;
    }
  };
  // bords du fond (haut gauche et haut droit), bord droit et bord avant
  line(30, GRID_X - 2, (t, j) => [t, 1.4 + j * 0.6]);
  line(24, GRID_Y - 2, (t, j) => [1.4 + j * 0.5, t]);
  line(24, GRID_Y - 4, (t, j) => [GRID_X - 1.8 + j * 0.5, t]);
  line(
    2,
    GRID_X - 6,
    (t, j) => [t, GRID_Y - 1.6 + j * 0.4],
    (t) => Math.abs(t - 34) < 8,
  );
  return out;
}

const LANDSCAPE: Placed[] = [
  // Prairie du fond : volière, feu de camp, meule et charrette, cibles d'entraînement
  { name: 'flowerBed', x: 10, y: 2.5, w: 46 },
  { name: 'oak', x: 14.5, y: 2.2, w: 70 },
  { name: 'bush', x: 20, y: 2.8, w: 32 },
  { name: 'grove', x: 25, y: 2.2, w: 110 },
  { name: 'grove', x: 2.6, y: 18.5, w: 104 },
  { name: 'owlery', x: 33, y: 10, w: 80 },
  { name: 'wildGrass', x: 36.5, y: 14.5, w: 40 },
  { name: 'campfire', x: 46.5, y: 12, w: 88 },
  { name: 'targets', x: 55, y: 18, w: 76 },
  { name: 'fenceM', x: 58.5, y: 13.4, w: 60 },
  { name: 'fenceM', x: 64.5, y: 13.4, w: 60 },
  { name: 'haystack', x: 63, y: 8.5, w: 82 },
  { name: 'swingOak', x: 72.5, y: 17.5, w: 100 },
  // Côté droit : serre et potager, kiosque, bordures fleuries le long du mur
  { name: 'flowerBorder', x: 65.9, y: 30, w: 66 },
  { name: 'greenhouse', x: 71.5, y: 28, w: 104 },
  { name: 'flowerBorder', x: 65.9, y: 42, w: 66 },
  { name: 'vegGarden', x: 71, y: 39.5, w: 110 },
  { name: 'flowerBorder', x: 65.9, y: 55, w: 66 },
  { name: 'gazebo', x: 71, y: 55, w: 96 },
  { name: 'roseArch', x: 67.5, y: 61, w: 54 },
  { name: 'flowerBorder', x: 65.9, y: 68, w: 66 },
  { name: 'willow', x: 72.5, y: 68, w: 96 },
  // Pelouse avant droite : l'étang, sa passerelle et son saule
  { name: 'pond', x: 58, y: 89.5, w: 130 },
  { name: 'footbridge', x: 51.5, y: 88.5, w: 64 },
  { name: 'willow', x: 63.5, y: 86.5, w: 100 },
  { name: 'wildGrass', x: 53.5, y: 92.5, w: 40 },
  { name: 'swingOak', x: 70.5, y: 88, w: 96 },
  // Avant : bordures fleuries le long de la façade, arche de roses sur l'allée
  { name: 'flowerBorderM', x: 8, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 15, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 22, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 28.5, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 40.5, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 47.5, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 54.5, y: 83.8, w: 66 },
  { name: 'flowerBorderM', x: 61, y: 83.8, w: 66 },
  { name: 'roseArch', x: 34 - PATH_HALF - 1.6, y: 85.4, w: 54 },
  { name: 'roseArch', x: 34 + PATH_HALF + 1.6, y: 85.4, w: 54 },
  // Pelouse avant gauche : un coin de verger, un feu de veillée
  { name: 'grove', x: 9, y: 90, w: 116 },
  { name: 'oak', x: 18.5, y: 88.5, w: 70 },
  { name: 'wildGrass', x: 14, y: 93, w: 40 },
  { name: 'flowerBed', x: 24.5, y: 92, w: 46 },
  // touches de fleurs autour des lieux
  { name: 'flowerBed', x: 53.5, y: 86.5, w: 42 },
  { name: 'bush', x: 61, y: 93.5, w: 30 },
  { name: 'flowerBed', x: 66.5, y: 93, w: 40 },
  { name: 'flowerBed', x: 75.5, y: 59.5, w: 42 },
  { name: 'bush', x: 67.5, y: 51, w: 30 },
  { name: 'flowerBed', x: 76, y: 33.5, w: 40 },
  { name: 'flowerBed', x: 41.5, y: 6.5, w: 42 },
  { name: 'bush', x: 29, y: 15.5, w: 30 },
  { name: 'flowerBed', x: 12.5, y: 94, w: 42 },
  { name: 'pumpkins', x: 67.5, y: 44.5, w: 36 },
  ...forestEdge(),
];

/** Paysage : couche arrière (avant les bâtiments) ou avant (devant la façade). */
function Landscape({ env, front }: { env: EnvDef; front: boolean }) {
  const school0 = plotOrigin(0, 0);
  const x1 = school0.x + PLOT.cols * (S + PLOT.gap) - PLOT.gap / 2;
  const y1 = school0.y + PLOT.rows * (S + PLOT.gap) - PLOT.gap / 2;
  const items = LANDSCAPE.filter((o) => (o.x > x1 || o.y > y1) === front).sort(
    (a, b) => a.x + a.y - (b.x + b.y),
  );
  const natural = env.deco === 'tree';
  return (
    <G>
      {items.map((o, i) =>
        natural ||
        ![
          'oak',
          'pine',
          'grove',
          'willow',
          'swingOak',
          'wildGrass',
          'vegGarden',
          'haystack',
        ].includes(o.name) ? (
          <Decor key={i} name={o.name} p={iso(o.x, o.y)} width={o.w} />
        ) : (
          <Deco key={i} p={iso(o.x, o.y)} s={1.2} env={env} />
        ),
      )}
    </G>
  );
}

function Ground({ env }: { env: EnvDef }) {
  const school0 = plotOrigin(0, 0);
  const w = PLOT.cols * (S + PLOT.gap) - PLOT.gap;
  const h = PLOT.rows * (S + PLOT.gap) - PLOT.gap;
  const pad = PLOT.gap / 2;
  const tinted = env.id !== 'manor';
  const { pathX, gateX, gateY } = courtyard();
  const x0 = school0.x - pad;
  const y0 = school0.y - pad;
  const x1 = school0.x + w + pad;
  const y1 = school0.y + h + pad;
  const isManor = env.deco === 'tree';

  // Cour d'entrée : allée bordée de lampadaires et de haies, jardin d'accueil.
  const yard: Outdoor[] = [];
  for (const l of courtyardLamps()) yard.push({ name: 'lamp', x: l.x, y: l.y, w: 22 });
  yard.push(
    { name: 'statue', x: pathX - PATH_HALF - 4, y: y1 + 3.4, w: 44 },
    { name: 'statue', x: pathX + PATH_HALF + 4, y: y1 + 3.4, w: 44 },
    { name: 'parkBench', x: pathX - PATH_HALF - 2.4, y: y1 + 7.5, w: 34 },
    { name: 'parkBench', x: pathX + PATH_HALF + 2.4, y: y1 + 7.5, w: 34 },
    { name: 'flowerBed', x: pathX + PATH_HALF + 9, y: y1 + 7, w: 46 },
    { name: 'flowerBed', x: pathX - PATH_HALF - 3, y: gateY - 3.5, w: 40 },
    { name: 'flowerBed', x: pathX + PATH_HALF + 3, y: gateY - 3.5, w: 40 },
    { name: 'owlPost', x: pathX + PATH_HALF + 2.2, y: gateY - 0.8, w: 22 },
    { name: 'signpost', x: pathX - PATH_HALF - 2.2, y: gateY - 1.2, w: 28 },
    { name: 'hedge', x: pathX - PATH_HALF - 5, y: gateY - 0.5, w: 46 },
    { name: 'hedge', x: pathX + PATH_HALF + 5, y: gateY - 0.5, w: 46 },
  );
  // bordures fleuries le long de la grande allée
  for (let y = y1 + 2.5; y < gateY - 5; y += 3.4) {
    yard.push(
      { name: 'flowerBorder', x: pathX - PATH_HALF - 0.9, y, w: 52 },
      { name: 'flowerBorder', x: pathX + PATH_HALF + 0.9, y: y + 1.7, w: 52 },
    );
  }
  const yardEls = yard
    .filter((o) => isManor || !['oak', 'pine', 'bush', 'pumpkins'].includes(o.name))
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .map((o, i) => <Decor key={`y${i}`} name={o.name} p={iso(o.x, o.y)} width={o.w} />);

  return (
    <G>
      <TexFloor
        id="grass"
        gx={0}
        gy={0}
        w={GRID_X}
        h={GRID_Y}
        tex="grass"
        tile={6}
        tint={env.ground}
        tintOpacity={tinted ? 0.6 : 0}
      />
      {/* Fondations de l'école : tranche de pierre sous le parquet */}
      <Polygon
        points={poly([iso(x0, y1), iso(x1, y1), drop(iso(x1, y1), 10), drop(iso(x0, y1), 10)])}
        fill="#6E6457"
      />
      <Polygon
        points={poly([iso(x1, y0), iso(x1, y1), drop(iso(x1, y1), 10), drop(iso(x1, y0), 10)])}
        fill="#585046"
      />
      <TexFloor
        id="corridor"
        gx={x0}
        gy={y0}
        w={x1 - x0}
        h={y1 - y0}
        tex="wood"
        tile={2.5}
        tint={tinted ? env.corridor : '#2B1A0E'}
        tintOpacity={tinted ? 0.45 : 0.18}
      />
      {/* Allée pavée en « L » : du couloir de l'Accueil jusqu'au portail */}
      <TexFloor
        id="pathA"
        gx={pathX - PATH_HALF}
        gy={y1}
        w={2 * PATH_HALF}
        h={gateY + 1.1 - y1}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
      />
      {/* bordures de pierre de la grande allée */}
      <Polygon
        points={floorPoly(pathX - PATH_HALF - 0.25, y1, 0.25, gateY + 1.1 - y1)}
        fill="#7C7262"
      />
      <Polygon points={floorPoly(pathX + PATH_HALF, y1, 0.25, gateY + 1.1 - y1)} fill="#7C7262" />
      <ExamCorridor env={env} />
      <Landscape env={env} front={false} />
      {yardEls}
      <Fountain p={iso(fountainPoint().x, fountainPoint().y)} />
      <Sprite name="gate" p={iso(gateX, gateY + 1.2)} width={190} lift={14} />
    </G>
  );
}

/**
 * Grand jardin sur plusieurs parcelles (le couloir entre elles devient l'allée centrale,
 * dans le prolongement du couloir de la Salle des Examens).
 */
function BigGarden({ px, py, span, env }: { px: number; py: number; span: number; env: EnvDef }) {
  const o = plotOrigin(px, py);
  const W = span * S + (span - 1) * PLOT.gap;
  const k = `big-${px}-${py}`;
  const cx = o.x + W / 2;
  const cy = o.y + S / 2;
  const at = (x: number, y: number) => iso(o.x + x, o.y + y);
  const trees = env.deco === 'tree';
  const tinted = env.id !== 'manor';
  const placed: { name: SpriteName; x: number; y: number; w: number }[] = [
    // bordures de haies au fond
    { name: 'hedgeM', x: 3, y: 0.8, w: 46 },
    { name: 'hedgeM', x: 7.5, y: 0.8, w: 46 },
    { name: 'hedgeM', x: W - 7.5, y: 0.8, w: 46 },
    { name: 'hedgeM', x: W - 3, y: 0.8, w: 46 },
    // arbres dans les coins
    { name: trees ? 'oak' : 'flowerBed', x: 2, y: 2.4, w: trees ? 70 : 40 },
    { name: trees ? 'oak' : 'flowerBed', x: W - 2, y: 2.4, w: trees ? 66 : 40 },
    { name: trees ? 'grove' : 'flowerBed', x: 2.4, y: S - 2, w: trees ? 104 : 40 },
    { name: trees ? 'swingOak' : 'flowerBed', x: W - 2.4, y: S - 2, w: trees ? 92 : 40 },
    // massifs le long de l'allée centrale
    { name: 'flowerBorder', x: cx - 2.4, y: 2.4, w: 60 },
    { name: 'flowerBorder', x: cx + 2.4, y: 2.4, w: 60 },
    { name: 'flowerBorder', x: cx - 2.4, y: S - 2.4, w: 60 },
    { name: 'flowerBorder', x: cx + 2.4, y: S - 2.4, w: 60 },
    // parterres de chaque côté de l'allée transversale
    { name: 'flowerBed', x: 6, y: cy - o.y - 2.2, w: 46 },
    { name: 'flowerBed', x: W - 6, y: cy - o.y - 2.2, w: 46 },
    { name: 'parkBench', x: 6.2, y: cy - o.y + 2.2, w: 34 },
    { name: 'parkBench', x: W - 6.2, y: cy - o.y + 2.2, w: 34 },
    { name: 'wildGrass', x: 3.6, y: cy - o.y + 2.6, w: 36 },
    { name: 'wildGrass', x: W - 3.6, y: cy - o.y + 2.6, w: 36 },
    // arches de roses à l'entrée de l'allée transversale
    { name: 'roseArch', x: 1.2, y: S / 2, w: 50 },
    { name: 'roseArch', x: W - 1.2, y: S / 2, w: 50 },
  ];
  placed.sort((a, b) => a.x + a.y - (b.x + b.y));
  const c = iso(cx, cy);
  return (
    <G>
      <TexFloor
        id={`garden-${k}`}
        gx={o.x}
        gy={o.y}
        w={W}
        h={S}
        tex="grass"
        tile={4}
        tint={env.groundAlt}
        tintOpacity={tinted ? 0.55 : 0}
      />
      {/* allée centrale (prolonge le couloir) et allée transversale */}
      <TexFloor
        id={`gpathC-${k}`}
        gx={cx - 1.1}
        gy={o.y - PLOT.gap / 2}
        w={2.2}
        h={S + PLOT.gap}
        tex="stone"
        tile={2}
      />
      <TexFloor id={`gpathT-${k}`} gx={o.x} gy={cy - 0.6} w={W} h={1.2} tex="stone" tile={2} />
      {/* rond-point central avec vasque */}
      <Ellipse cx={c.x} cy={c.y} rx={46} ry={23} fill="#B8AE9C" />
      <Ellipse cx={c.x} cy={c.y} rx={38} ry={19} fill="#7DA35C" />
      {placed.map((d, i) => (
        <Decor key={i} name={d.name} p={at(d.x, d.y)} width={d.w} />
      ))}
      <Decor name="birdbath" p={c} width={28} />
    </G>
  );
}

function Garden({ px, py, env }: { px: number; py: number; env: EnvDef }) {
  const o = plotOrigin(px, py);
  const k = `${px}-${py}`;
  const at = (x: number, y: number) => iso(o.x + x, o.y + y);
  const trees = env.deco === 'tree';
  return (
    <G>
      <TexFloor
        id={`garden-${k}`}
        gx={o.x}
        gy={o.y}
        w={S}
        h={S}
        tex="grass"
        tile={4}
        tint={env.groundAlt}
        tintOpacity={env.id !== 'manor' ? 0.55 : 0}
      />
      <TexFloor
        id={`gpath1-${k}`}
        gx={o.x + S / 2 - 0.6}
        gy={o.y}
        w={1.2}
        h={S}
        tex="stone"
        tile={2}
      />
      <TexFloor
        id={`gpath2-${k}`}
        gx={o.x}
        gy={o.y + S / 2 - 0.6}
        w={S}
        h={1.2}
        tex="stone"
        tile={2}
      />
      {trees ? (
        <Decor name="oak" p={at(2.2, 2.2)} width={60} />
      ) : (
        <Deco p={at(2.2, 2.2)} env={env} />
      )}
      <Decor name="flowerBed" p={at(7.6, 2.4)} width={40} />
      <Decor name="hedge" p={at(2.4, 7.6)} width={40} />
      <Decor name="birdbath" p={at(S / 2, S / 2)} width={22} />
      <Decor name="parkBench" p={at(6.2, 4.0)} width={32} />
      <Decor name="flowerBed" p={at(7.6, 7.6)} width={40} />
      {trees ? <Decor name="bush" p={at(3.8, 4.0)} width={26} /> : null}
    </G>
  );
}

function ConstructionPlot({ px, py, available }: { px: number; py: number; available: boolean }) {
  const o = plotOrigin(px, py);
  return (
    <G opacity={available ? 1 : 0.6}>
      <TexFloor
        id={`plot-${px}-${py}`}
        gx={o.x}
        gy={o.y}
        w={S}
        h={S}
        tex="grass"
        tile={4}
        tint="#8A7350"
        tintOpacity={0.35}
      />
      <Polygon
        points={floorPoly(o.x, o.y, S, S)}
        fill="none"
        stroke={available ? '#E0B04A' : '#5E7A48'}
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      {available ? (
        <G>
          <Decor name="crates" p={iso(o.x + 2.2, o.y + 2.4)} width={30} />
          <Decor name="barrel" p={iso(o.x + 2.4, o.y + 4.0)} width={20} />
        </G>
      ) : null}
    </G>
  );
}

/** Murs épais : faces texturées, chapeau de mur, extrémités, corniche. */
function Walls({
  id,
  ox,
  oy,
  w,
  h,
  env,
}: {
  id: string;
  ox: number;
  oy: number;
  w: number;
  h: number;
  env: EnvDef;
}) {
  const tinted = env.id !== 'manor';
  const cap = shade(env.wood, 0.75);
  return (
    <G>
      <TexWall
        id={`${id}-wx`}
        axis="x"
        ox={ox}
        oy={oy}
        len={w}
        height={H}
        texHeight={ISO.wallH}
        shadeOpacity={0.14}
        tint={env.plaster}
        tintOpacity={tinted ? 0.35 : 0}
      />
      <TexWall
        id={`${id}-wy`}
        axis="y"
        ox={ox}
        oy={oy}
        len={h}
        height={H}
        texHeight={ISO.wallH}
        shadeOpacity={0}
        tint={env.plaster}
        tintOpacity={tinted ? 0.35 : 0}
      />
      <Polygon
        points={poly([
          lift(iso(ox - WALL_T, oy - WALL_T), H),
          lift(iso(ox + w, oy - WALL_T), H),
          lift(iso(ox + w, oy), H),
          lift(iso(ox, oy), H),
        ])}
        fill={cap}
      />
      <Polygon
        points={poly([
          lift(iso(ox - WALL_T, oy - WALL_T), H),
          lift(iso(ox, oy), H),
          lift(iso(ox, oy + h), H),
          lift(iso(ox - WALL_T, oy + h), H),
        ])}
        fill={shade(cap, 1.1)}
      />
      <Polygon
        points={poly([
          iso(ox + w, oy - WALL_T),
          iso(ox + w, oy),
          lift(iso(ox + w, oy), H),
          lift(iso(ox + w, oy - WALL_T), H),
        ])}
        fill={shade(cap, 0.8)}
      />
      <Polygon
        points={poly([
          iso(ox - WALL_T, oy + h),
          iso(ox, oy + h),
          lift(iso(ox, oy + h), H),
          lift(iso(ox - WALL_T, oy + h), H),
        ])}
        fill={shade(cap, 0.95)}
      />
      <WallQuad axis="x" ox={ox} oy={oy} t1={0} t2={w} h1={H - 4} h2={H} fill={shade(cap, 0.9)} />
      <WallQuad axis="y" ox={ox} oy={oy} t1={0} t2={h} h1={H - 4} h2={H} fill={cap} />
    </G>
  );
}

/** Sol surélevé : tranche de pierre à l'avant + texture de sol. */
function RoomFloor({
  id,
  kind,
  ox,
  oy,
  w,
  h,
  tintColor,
  env,
}: {
  w: number;
  h: number;
  id: string;
  kind: string;
  ox: number;
  oy: number;
  tintColor: string;
  env: EnvDef;
}) {
  const ft = FLOOR_TEXTURE[kind] ?? FLOOR_TEXTURE.course;
  const a = iso(ox + w, oy);
  const b = iso(ox + w, oy + h);
  const c = iso(ox, oy + h);
  const stone = '#7C7267';
  return (
    <G>
      <Polygon points={poly([a, b, drop(b, PLINTH), drop(a, PLINTH)])} fill={shade(stone, 0.75)} />
      <Polygon points={poly([c, b, drop(b, PLINTH), drop(c, PLINTH)])} fill={stone} />
      <TexFloor
        id={`${id}-floor`}
        gx={ox}
        gy={oy}
        w={w}
        h={h}
        tex={ft.tex}
        tile={ft.tile}
        tint={tintColor}
        tintOpacity={env.id !== 'manor' ? 0.3 : 0.12}
      />
    </G>
  );
}

/** Murets avant bas (vue « maison de poupée »), avec l'ouverture de la porte. */
function FrontLips({
  ox,
  oy,
  w,
  h,
  door,
}: {
  ox: number;
  oy: number;
  w: number;
  h: number;
  door: 'x' | 'y';
}) {
  const c = '#8A7F72';
  const gap = door === 'y' ? 3.2 : 0.75;
  if (door === 'y') {
    return (
      <G>
        <Box gx={ox + w - 0.18} gy={oy} w={0.18} d={h} h={11} color={c} />
        <Box gx={ox} gy={oy + h - 0.18} w={w / 2 - gap} d={0.18} h={11} color={c} />
        <Box gx={ox + w / 2 + gap} gy={oy + h - 0.18} w={w / 2 - gap} d={0.18} h={11} color={c} />
      </G>
    );
  }
  return (
    <G>
      <Box gx={ox + w - 0.18} gy={oy} w={0.18} d={h / 2 - gap} h={11} color={c} />
      <Box gx={ox + w - 0.18} gy={oy + h / 2 + gap} w={0.18} d={h / 2 - gap} h={11} color={c} />
      <Box gx={ox} gy={oy + h - 0.18} w={w} d={0.18} h={11} color={c} />
    </G>
  );
}

/** Porche d'entrée à colonnes et fronton, sur la face avant gauche (porte « y »). */
function Porch({ ox, oy, w, h }: { ox: number; oy: number; w: number; h: number }) {
  // Portail gothique en pixel art (SpriteCook), centré sur la porte du mur avant.
  const c = iso(ox + w / 2, oy + h + 1.2);
  return (
    <G>
      <Ellipse cx={c.x} cy={c.y - 4} rx={58} ry={22} fill="#000" opacity={0.18} />
      <Sprite name="porch" p={{ x: c.x + 2, y: c.y + 14 }} width={128} />
    </G>
  );
}

function Room({ r, env }: { r: RoomSnapshot; env: EnvDef }) {
  const def = PLOTS[r.id];
  const o = roomOrigin(def);
  const { w: RW, h: RH } = roomSize(r.id);
  const doorSide = def.door ?? 'x';
  const t = tier(r.level);
  const kind = r.kind === 'course' ? r.courseId! : r.kind;
  const isCourse = r.kind === 'course';

  const wall: ReactElement[] = [];
  const objects: { order: number; el: ReactElement }[] = [];
  const add = (gx: number, gy: number, el: ReactElement) => objects.push({ order: gx + gy, el });
  const decor = (key: string, name: SpriteName, gx: number, gy: number, width: number) =>
    add(gx, gy, <Decor key={key} name={name} p={iso(gx, gy)} width={width} />);

  /** Tentures aux couleurs des Maisons sur le muret. */
  const tapestries = (axisOf: (i: number) => 'x' | 'y', at: (i: number) => number) =>
    HOUSE_IDS.forEach((h, i) =>
      wall.push(
        <WallQuad
          key={h}
          axis={axisOf(i)}
          ox={o.x}
          oy={o.y}
          t1={at(i) * R}
          t2={at(i) * R + 0.8}
          h1={3}
          h2={H - 3}
          fill={HOUSES[h].color}
          stroke="#3B2414"
        />,
      ),
    );

  if (isCourse || r.kind === 'exam') {
    // Tableau sur chevalet et bureau du professeur, tournés vers les élèves.
    decor('board', 'easel', o.x + 0.9 * R, o.y + 2.4 * R, 34);
    decor('desk', tiered('teacherDeskM' as SpriteName, t), o.x + 1.25 * R, o.y + 4.2 * R, 50);
    decor('shelf', tiered('bookshelf', t), o.x + 0.55 * R, o.y + 1.0 * R, 30);
  } else if (r.kind === 'hall') {
    tapestries(
      () => 'x',
      (i) => 0.9 + i * 1.8,
    );
    decor('fire', 'fireplace', o.x + 0.6 * R, o.y + 4.3 * R, 46);
    [0, 1, 2, 3, 4].forEach((row) =>
      [2.2, 5.7].forEach((gy) =>
        decor(
          `t${row}-${gy}`,
          tiered('table', t),
          o.x + (1.26 + row * 1.35) * R,
          o.y + (gy + 1.2) * R,
          66,
        ),
      ),
    );
  } else if (r.kind === 'reception') {
  } else if (r.kind === 'sorting') {
    tapestries(
      (i) => (i < 2 ? 'x' : 'y'),
      (i) => 1.5 + (i % 2) * 3.5,
    );
  }

  for (const d of ROOM_DECOR[kind] ?? [])
    decor(
      `d-${d.sprite}-${d.x}-${d.y}`,
      d.sprite as SpriteName,
      o.x + d.x * R,
      o.y + d.y * R,
      d.width,
    );
  r.seats.forEach((sp, i) => {
    const gx = o.x + sp.x;
    const gy = o.y + sp.y;
    add(
      gx,
      gy,
      <G key={`seat-${i}`}>
        <Shadow p={iso(gx, gy)} w={26} />
        <Furniture kind={kind} at={iso(gx, gy)} gx={gx} gy={gy} tier={r.seatTiers[i] ?? 0} />
      </G>,
    );
  });
  objects.sort((a, b) => a.order - b.order);

  const center = iso(o.x + RW / 2, o.y + RH / 2);
  return (
    <G>
      <Walls id={r.id} ox={o.x} oy={o.y} w={RW} h={RH} env={env} />
      <RoomFloor
        id={r.id}
        w={RW}
        h={RH}
        kind={isCourse ? 'course' : r.kind}
        ox={o.x}
        oy={o.y}
        tintColor={def.floor}
        env={env}
      />
      {r.kind === 'sorting' ? (
        <G>
          <Ellipse cx={center.x} cy={center.y} rx={50} ry={25} fill="#4B3B6E" opacity={0.85} />
          <Ellipse
            cx={center.x}
            cy={center.y}
            rx={46}
            ry={23}
            fill="none"
            stroke="#B89A5A"
            strokeWidth={1.5}
          />
          <Box
            gx={o.x + S / 2 - 0.4}
            gy={o.y + S / 2 - 0.4}
            w={0.8}
            d={0.8}
            h={12}
            color="#6B4A30"
          />
        </G>
      ) : null}
      {isCourse || r.kind === 'exam' ? (
        <G>
          <Polygon
            points={floorPoly(o.x + 2.1 * R, o.y + 0.9 * R, RW - 3.4 * R, RH - 2.1 * R)}
            fill={RUGS[r.courseId ?? 'exam'] ?? '#4A3A5A'}
            opacity={0.55}
            stroke="#C9A25A"
            strokeWidth={1}
          />
          <Polygon
            points={floorPoly(o.x + 2.4 * R, o.y + 1.2 * R, RW - 4.0 * R, RH - 2.7 * R)}
            fill="none"
            stroke="#E8D9B0"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        </G>
      ) : null}
      {r.kind === 'reception' ? (
        <G>
          <Polygon
            points={floorPoly(o.x + 5.5, o.y + 3.2, RW - 11, 4.2)}
            fill="#7A2E34"
            opacity={0.6}
          />
          <Polygon
            points={floorPoly(o.x + RW / 2 - 1.2, o.y + 6.5, 2.4, RH - 6.5)}
            fill="#7A2E34"
            opacity={0.6}
          />
        </G>
      ) : null}
      {r.kind === 'dorm' ? (
        <Polygon
          points={floorPoly(o.x + 2.6 * R, o.y + 2.6 * R, 2.8 * R, 2.8 * R)}
          fill="#7A2E34"
          opacity={0.55}
        />
      ) : null}
      <WallShadow id={`${r.id}-shx`} axis="x" ox={o.x} oy={o.y} len={RW} />
      <WallShadow id={`${r.id}-shy`} axis="y" ox={o.x} oy={o.y} len={RH} />
      {wall}
      {objects.map((x) => x.el)}
      <FrontLips ox={o.x} oy={o.y} w={RW} h={RH} door={doorSide} />
      {doorSide === 'y' ? <Porch ox={o.x} oy={o.y} w={RW} h={RH} /> : null}
    </G>
  );
}

interface Props {
  env: number;
  rooms: RoomSnapshot[];
  /** Parcelles de construction proposées (id → achetable maintenant). */
  plots: { id: string; available: boolean }[];
}

function MapArtBase({ rooms, plots, env: envIndex }: Props) {
  const env = ENVIRONMENTS[envIndex] ?? ENVIRONMENTS[0];
  const items: { order: number; el: ReactElement }[] = [];
  for (const r of rooms) {
    const p = PLOTS[r.id];
    if (p) items.push({ order: p.px + p.py, el: <Room key={r.id} r={r} env={env} /> });
  }
  for (const pl of plots) {
    const p = PLOTS[pl.id];
    if (p)
      items.push({
        order: p.px + p.py,
        el: <ConstructionPlot key={pl.id} px={p.px} py={p.py} available={pl.available} />,
      });
  }
  GARDENS.forEach((g, i) =>
    items.push({
      order: g.px + g.py,
      el:
        g.spanX && g.spanX > 1 ? (
          <BigGarden key={`g${i}`} px={g.px} py={g.py} span={g.spanX} env={env} />
        ) : (
          <Garden key={`g${i}`} px={g.px} py={g.py} env={env} />
        ),
    }),
  );
  items.sort((a, b) => a.order - b.order);
  return (
    <Svg width={MAP_W} height={MAP_H}>
      <Ground env={env} />
      {items.map((x) => x.el)}
      <Landscape env={env} front />
    </Svg>
  );
}

/** Carte statique : redessinée seulement quand le plan change (achat, niveau, places). */
export const MapArt = memo(MapArtBase, (a, b) => JSON.stringify(a) === JSON.stringify(b));

export const ISO_WALL = ISO.wallH;
