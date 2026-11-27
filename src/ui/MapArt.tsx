import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import type { SpriteName } from '../assets';
import { ENVIRONMENTS, type EnvDef } from '../data/environments';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import {
  FLOOR_TEXTURE,
  GARDENS,
  HALL_PROF_X,
  PROF_SEAT_GAP,
  PROF_TABLE_Y,
  HALL_ROWS,
  HALL_TABLE_LEN,
  HALL_X0,
  ISO,
  PLOT,
  PLOTS,
  ROOM_DECOR,
  ROOM_SCALE,
} from '../data/layout';
import { COURSE_PROPS } from '../data/roomProps';
import type { CourseId } from '../data/courses';
import type { Station } from '../engine';
import {
  courtyard,
  courtyardLamps,
  backCorridor,
  clearH,
  clearV,
  CORRIDOR_X,
  CORRIDOR_Y,
  doorOf,
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
  /** Mobilier spécial débloqué. */
  props: string[];
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
/** Pente d'un mur isométrique (tuiles 2:1) : façades plaquées contre les murs. */
const WALL_SKEW = (Math.atan(0.5) * 180) / Math.PI;
/** Meubles qui se posent contre un mur (armoires, horloges, cheminées, tableaux…). */
const WALL_FURNITURE =
  /^(bookshelf|jarShelf|clock|fireplace|noticeBoard|coatStand|wandRack|herbRack|broomRack|worldMap|creatureJars|duelBanner|starChart|mistMirror|toolRack|easel|counter|letterRack|recordShelf)/;

/** Grandes constructions posées au sol : pas d'ombre portée (elles sembleraient flotter). */
const NO_SHADOW = new Set<string>([
  'owlery',
  'greenhouse',
  'gazebo',
  'vegGarden',
  'pond',
  'well',
  'footbridge',
  'campfire',
  'haystack',
  'targets',
  'picnic',
  'gate',
  'porch',
  'roseArch',
  'roseArchM',
  'flowerStrip',
  'flowerStripM',
]);

function Decor({
  name: raw,
  p,
  width: w0,
  mirror = false,
  skew = 0,
}: {
  name: SpriteName;
  p: Pt;
  width: number;
  mirror?: boolean;
  skew?: number;
}) {
  const [name, width] = naturalize(raw, p, w0);
  return (
    <G>
      <Sprite
        name={name}
        p={p}
        width={width}
        lift={NO_SHADOW.has(name) ? 0 : 2}
        mirror={mirror}
        skew={skew}
      />
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

/** Long couloir qui monte du fond de l'école jusqu'à un lieu du dernier rang. */
function BackCorridor({ id, env }: { id: string; env: EnvDef }) {
  const c = backCorridor(id);
  if (!c) return null;
  const tinted = env.id !== 'manor';
  // Allée extérieure : pavés, bordures de pierre, lampadaires et fleurs.
  const posts: ReactElement[] = [];
  for (let y = c.y0 + 1.5; y < c.y1 - 1; y += 3.2) {
    posts.push(
      <Decor key={`a${y}`} name="lamp" p={iso(c.x - 1.9, y)} width={22} />,
      <Decor
        key={`b${y}`}
        name={y % 2 > 1 ? 'lavender' : 'tulips'}
        p={iso(c.x + 1.9, y + 1.6)}
        width={24}
      />,
    );
  }
  return (
    <G>
      <TexFloor
        id={`${id}-path`}
        gx={c.x - 1.3}
        gy={c.y0}
        w={2.6}
        h={c.y1 - c.y0}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
      />
      <Polygon points={floorPoly(c.x - 1.55, c.y0, 0.25, c.y1 - c.y0)} fill="#7C7262" />
      <Polygon points={floorPoly(c.x + 1.3, c.y0, 0.25, c.y1 - c.y0)} fill="#7C7262" />
      {posts}
    </G>
  );
}

interface Placed {
  name: SpriteName;
  x: number;
  y: number;
  w: number;
  /** Retourné pour faire face à l'école. */
  mirror?: boolean;
}

/** Rangée régulière d'arbres (lisière ordonnée, pas de semis au hasard). */
function treeRow(
  name: SpriteName,
  w: number,
  from: number,
  to: number,
  step: number,
  at: (t: number) => [number, number],
): Placed[] {
  const out: Placed[] = [];
  for (let t = from; t <= to; t += step) {
    const [x, y] = at(t);
    out.push({ name, x, y, w });
  }
  return out;
}

/** Bords de l'école (cases) : tout l'extérieur est placé par rapport à eux. */
const SX0 = PLOT.margin;
const SY0 = PLOT.margin + PLOT.top;
const SX1 = PLOT.margin + PLOT.cols * (PLOT.size + PLOT.gap) - PLOT.gap;
const SY1 = SY0 + PLOT.rows * (PLOT.size + PLOT.gap) - PLOT.gap;

/*
 * Extérieur composé : à gauche, le jardin botanique (bâtiments tournés vers l'école,
 * le long d'une allée) ; au fond, verger et volière ; à droite, le pré des sports ;
 * devant, la grande cour d'honneur symétrique (dessinée dans Ground).
 */
const LANDSCAPE: Placed[] = [
  ...treeRow('pine', 50, 3, GRID_X - 3, 5, (t) => [t, 1.2]),
  ...treeRow('pine', 50, SY0, GRID_Y - 8, 6, (t) => [GRID_X - 1.6, t]),
  ...treeRow('oak', 64, SY0 + 4, SY1, 9, (t) => [1.6, t]),
  ...treeRow('oak', 62, 8, SX0 + 2, 8, (t) => [t, 9]),
  { name: 'owlery', x: SX0 - 9, y: SY0 - 8, w: 190 },
  { name: 'lavender', x: SX0 - 13, y: SY0 - 3, w: 32 },
  { name: 'lavender', x: SX0 - 5, y: SY0 - 3, w: 32 },
  { name: 'greenhouse', x: SX0 - 9, y: SY0 + 10, w: 230 },
  { name: 'vegGarden', x: SX0 - 9, y: SY0 + 25, w: 170 },
  { name: 'gazebo', x: SX0 - 9, y: SY0 + 40, w: 200 },
  { name: 'pond', x: SX0 - 9, y: SY0 + 55, w: 140 },
  ...[SY0 + 17.5, SY0 + 32.5, SY0 + 47.5].map((y, i): Placed => ({
    name: i % 2 ? 'hydrangea' : 'roseBush',
    x: SX0 - 4,
    y,
    w: 32,
  })),
  { name: 'targets', x: SX1 + 9, y: SY0 - 14, w: 76 },
  { name: 'haystack', x: SX1 + 9, y: SY0 - 5, w: 70 },
  { name: 'picnic', x: SX1 + 9, y: SY0 + 20, w: 60 },
  { name: 'willow', x: SX1 + 10, y: SY0 + 40, w: 96 },
  { name: 'swingOak', x: SX1 + 10, y: SY0 + 58, w: 96 },
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
          <Decor key={i} name={o.name} p={iso(o.x, o.y)} width={o.w} mirror={o.mirror} />
        ) : (
          <Deco key={i} p={iso(o.x, o.y)} s={1.2} env={env} />
        ),
      )}
    </G>
  );
}

/** Longs tapis rouges bordés d'or au milieu de chaque couloir (là où il n'y a pas de salle). */
function CorridorRunners({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const out: ReactElement[] = [];
  const W = 1.7;
  const xs = CORRIDOR_X.filter((x) => x >= x0 - 0.01 && x <= x1 + 0.01);
  const ys = CORRIDOR_Y.filter((y) => y >= y0 - 0.01 && y <= y1 + 0.01);
  const runner = (key: string, gx: number, gy: number, w: number, h: number) => {
    out.push(
      <G key={key}>
        <Polygon points={floorPoly(gx, gy, w, h)} fill="#C9A25A" opacity={0.9} />
        <Polygon
          points={floorPoly(
            gx + (w > h ? 0 : 0.18),
            gy + (w > h ? 0.18 : 0),
            w > h ? w : w - 0.36,
            w > h ? h - 0.36 : h,
          )}
          fill="#7A2430"
        />
        <Polygon
          points={floorPoly(
            gx + (w > h ? 0 : w / 2 - 0.05),
            gy + (w > h ? h / 2 - 0.05 : 0),
            w > h ? w : 0.1,
            w > h ? 0.1 : h,
          )}
          fill="#C9A25A"
          opacity={0.5}
        />
      </G>,
    );
  };
  // Les tapis courent jusqu'au bord de l'école (même sans couloir extérieur).
  const ysAll = [y0, ...ys, y1];
  const xsAll = [x0, ...xs, x1];
  for (const x of xs)
    for (let i = 1; i < ysAll.length; i++)
      if (clearV(x, ysAll[i - 1], ysAll[i]))
        runner(`v${x}-${i}`, x - W / 2, ysAll[i - 1], W, ysAll[i] - ysAll[i - 1]);
  for (const y of ys)
    for (let i = 1; i < xsAll.length; i++)
      if (clearH(y, xsAll[i - 1], xsAll[i]))
        runner(`h${y}-${i}`, xsAll[i - 1], y - W / 2, xsAll[i] - xsAll[i - 1], W);
  return <G>{out}</G>;
}

function Ground({ env }: { env: EnvDef }) {
  const school0 = plotOrigin(0, 0);
  const w = PLOT.cols * (S + PLOT.gap) - PLOT.gap;
  const h = PLOT.rows * (S + PLOT.gap) - PLOT.gap;
  // Pas de couloir tout autour : le parquet s'arrête aux murs des salles.
  const pad = 0;
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
  // Cour d'honneur symétrique : statues de mages, cadran solaire et fontaine, topiaires,
  // bannières le long de l'allée, obélisques au portail, calèche et bagages des nouveaux.
  const L = (dx: number) => pathX - dx;
  const Rr = (dx: number) => pathX + dx;
  yard.push(
    { name: 'wizardStatue', x: L(6.5), y: y1 + 3, w: 62 },
    { name: 'wizardStatue', x: Rr(6.5), y: y1 + 3, w: 62 },
    { name: 'sundialBed', x: L(11), y: y1 + 7, w: 70 },
    { name: 'kiosk', x: L(17), y: y1 + 3.5, w: 64 },
    { name: 'wisteriaBench', x: L(14), y: y1 + 11, w: 64 },
    { name: 'wisteriaBench', x: Rr(14), y: y1 + 11, w: 64 },
    { name: 'topiaryOwl', x: L(7), y: y1 + 12, w: 52 },
    { name: 'topiaryStag', x: Rr(7), y: y1 + 12, w: 52 },
    { name: 'skyLanterns', x: L(9), y: gateY - 5, w: 54 },
    { name: 'luggagePile', x: Rr(6), y: gateY - 3, w: 46 },
    { name: 'carriage', x: Rr(11), y: gateY - 3.5, w: 92 },
    { name: 'obelisk', x: L(5), y: gateY - 1, w: 40 },
    { name: 'obelisk', x: Rr(5), y: gateY - 1, w: 40 },
    { name: 'owlPost', x: Rr(3.2), y: gateY - 0.8, w: 22 },
    { name: 'tulips', x: L(16), y: y1 + 15, w: 30 },
    { name: 'tulips', x: Rr(16), y: y1 + 15, w: 30 },
    { name: 'roseBush', x: L(19), y: y1 + 8, w: 30 },
    { name: 'roseBush', x: Rr(19), y: y1 + 8, w: 30 },
  );
  for (let y = y1 + 4.2; y < gateY - 6; y += 6.8) {
    yard.push(
      { name: 'flagBanner', x: L(PATH_HALF + 0.8), y, w: 40 },
      { name: 'flagBanner', x: Rr(PATH_HALF + 0.8), y: y + 0.4, w: 40 },
    );
  }
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
      <CorridorRunners x0={x0} y0={y0} x1={x1} y1={y1} />
      {/* Allée du jardin botanique, le long de l'aile gauche */}
      <TexFloor
        id="gardenPath"
        gx={SX0 - 4.2}
        gy={SY0 + 2}
        w={1.8}
        h={SY1 - SY0 - 4}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
      />
      {/* Cour d'honneur pavée devant l'Accueil */}
      <TexFloor
        id="plaza"
        gx={pathX - 13}
        gy={y1 + 1}
        w={26}
        h={7}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
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
      <BackCorridor id="exam" env={env} />
      <BackCorridor id="course-flying" env={env} />
      <Landscape env={env} front={false} />
      {yardEls}
      <Decor name="grandFountain" p={iso(fountainPoint().x, fountainPoint().y)} width={96} />
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
    { name: 'flowerBed', x: 6, y: cy - o.y + 2.4, w: 46 },
    { name: 'flowerBed', x: W - 6, y: cy - o.y + 2.4, w: 46 },
    { name: 'parkBench', x: 6.2, y: cy - o.y - 1.8, w: 34 },
    { name: 'parkBench', x: W - 6.2, y: cy - o.y - 1.8, w: 34 },
    { name: 'wildGrass', x: 3.6, y: cy - o.y + 2.6, w: 36 },
    { name: 'wildGrass', x: W - 3.6, y: cy - o.y + 2.6, w: 36 },
    // arches de roses à l'entrée de l'allée transversale
    { name: 'roseArchM', x: 1.2, y: S / 2, w: 50 },
    { name: 'roseArchM', x: W - 1.2, y: S / 2, w: 50 },
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
      {/* rond-point pavé autour de la fontaine */}
      <Ellipse cx={c.x} cy={c.y} rx={58} ry={29} fill="#9C9384" />
      <Ellipse cx={c.x} cy={c.y} rx={54} ry={27} fill="#B8AE9C" />
      {placed.map((d, i) => (
        <Decor key={i} name={d.name} p={at(d.x, d.y)} width={d.w} />
      ))}
      <Decor name="grandFountain" p={{ x: c.x, y: c.y + 14 }} width={92} />
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

function ConstructionPlot({ id, available, env }: { id: string; available: boolean; env: EnvDef }) {
  const o = roomOrigin(PLOTS[id]);
  const { w: W, h: H } = roomSize(id);
  if (!PLOTS[id].outdoor)
    // Salle à construire : murs déjà là, sol de terre battue, rondins et cailloux.
    return (
      <G>
        <Walls id={`plot-${id}`} ox={o.x} oy={o.y} w={W} h={H} env={env} />
        <Polygon points={floorPoly(o.x, o.y, W, H)} fill="#5E4A36" />
        <Polygon points={floorPoly(o.x + 0.4, o.y + 0.4, W - 0.8, H - 0.8)} fill="#6B5640" />
        <WallShadow id={`plot-${id}-shx`} axis="x" ox={o.x} oy={o.y} len={W} />
        <WallShadow id={`plot-${id}-shy`} axis="y" ox={o.x} oy={o.y} len={H} />
        <Decor name="rocks" p={iso(o.x + W * 0.3, o.y + H * 0.35)} width={26} />
        <Decor name="crates" p={iso(o.x + W * 0.65, o.y + H * 0.3)} width={28} />
        <Decor name="barrel" p={iso(o.x + W * 0.35, o.y + H * 0.7)} width={18} />
        <FrontLips ox={o.x} oy={o.y} w={W} h={H} door={PLOTS[id].door === 'y' ? 'y' : 'x'} />
      </G>
    );
  return (
    <G opacity={available ? 1 : 0.6}>
      <TexFloor
        id={`plot-${id}`}
        gx={o.x}
        gy={o.y}
        w={W}
        h={H}
        tex="grass"
        tile={4}
        tint="#8A7350"
        tintOpacity={0.35}
      />
      <Polygon
        points={floorPoly(o.x, o.y, W, H)}
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
  back = false,
}: {
  ox: number;
  oy: number;
  w: number;
  h: number;
  door: 'x' | 'y';
  back?: boolean;
}) {
  const c = '#8A7F72';
  const gap = door === 'y' ? 3.2 : 0.75;
  if (back) {
    // Salon des Destinées : ouverture au milieu du muret avant (passage depuis l'Accueil).
    const g = 1.4;
    return (
      <G>
        <Box gx={ox + w - 0.18} gy={oy} w={0.18} d={h / 2 - gap} h={11} color={c} />
        <Box gx={ox + w - 0.18} gy={oy + h / 2 + gap} w={0.18} d={h / 2 - gap} h={11} color={c} />
        <Box gx={ox} gy={oy + h - 0.18} w={w / 2 - g} d={0.18} h={11} color={c} />
        <Box gx={ox + w / 2 + g} gy={oy + h - 0.18} w={w / 2 - g} d={0.18} h={11} color={c} />
      </G>
    );
  }
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

/** Porte au fond de l'Accueil, derrière le Chaporacle : sortie vers le couloir de l'école. */
function BackDoorway({ ox, oy }: { ox: number; oy: number }) {
  const d = doorOf('sorting');
  if (!d || PLOTS.sorting.hostedIn !== 'reception') return null;
  const t = d.inside.x - ox;
  return (
    <G>
      <WallQuad
        axis="x"
        ox={ox}
        oy={oy}
        t1={t - 1.4}
        t2={t + 1.4}
        h1={0}
        h2={H - 4}
        fill="#5A3A22"
      />
      <WallQuad
        axis="x"
        ox={ox}
        oy={oy}
        t1={t - 1.1}
        t2={t + 1.1}
        h1={0}
        h2={H - 7}
        fill="#1C120B"
      />
    </G>
  );
}

const FOODS: SpriteName[] = [
  'foodChicken',
  'foodBread',
  'foodJug',
  'foodFruit',
  'foodCandles',
  'foodPie',
  'foodGoblets',
  'foodStew',
  'foodCheese',
  'foodSausage',
  'foodFlowers',
  'foodCake',
];

/** Longue table « à plat » (boîte isométrique) avec chemin de table, assiettes et bougies. */
function LongTable({
  gx,
  gy,
  len,
  along = 'x',
  runner,
}: {
  gx: number;
  gy: number;
  len: number;
  along?: 'x' | 'y';
  runner: string;
}) {
  const h = 8;
  const w = along === 'x' ? len : 1.4;
  const d = along === 'x' ? 1.2 : len;
  const top = (x: number, y: number) => lift(iso(x, y), h);
  const items: ReactElement[] = [];
  for (let t = 1; t < len - 0.5; t += 1.5) {
    for (const side of [0.28, 0.92]) {
      const p = along === 'x' ? top(gx + t, gy + side * d) : top(gx + side * w, gy + t);
      items.push(
        <G key={`p${t}-${side}`}>
          <Ellipse
            cx={p.x}
            cy={p.y}
            rx={3.2}
            ry={1.6}
            fill="#EDE6D6"
            stroke="#B8AE9C"
            strokeWidth={0.5}
          />
          {/* gobelet doré à côté de chaque assiette */}
          <Path d={`M${p.x + 3.4} ${p.y - 0.6} l1.6 0 l-0.3 -3 l-1 0 z`} fill="#D9A23A" />
          <Ellipse
            cx={p.x + 4.2}
            cy={p.y - 3.6}
            rx={1.5}
            ry={0.7}
            fill="#7A1F2A"
            stroke="#C9A25A"
            strokeWidth={0.4}
          />
        </G>,
      );
    }
  }
  // Plats, cruches et bougies au milieu de la table.
  let k = Math.round(gx * 3 + gy * 7);
  for (let t = 1.1; t < len - 0.6; t += 1.55) {
    const p = along === 'x' ? top(gx + t, gy + d / 2) : top(gx + w / 2, gy + t);
    const food = FOODS[k++ % FOODS.length];
    items.push(<Sprite key={`f${t}`} name={food} p={{ x: p.x, y: p.y + 3 }} width={15} />);
  }
  const r0 =
    along === 'x' ? [gx, gy + d * 0.38, len, d * 0.24] : [gx + w * 0.38, gy, w * 0.24, len];
  return (
    <G>
      <Box gx={gx} gy={gy} w={w} d={d} h={h} color="#7A4A28" />
      <Polygon
        points={poly([
          top(r0[0], r0[1]),
          top(r0[0] + r0[2], r0[1]),
          top(r0[0] + r0[2], r0[1] + r0[3]),
          top(r0[0], r0[1] + r0[3]),
        ])}
        fill={runner}
        opacity={0.9}
      />
      {items}
    </G>
  );
}

/** Tapis aux couleurs des Maisons sous les tables de la cantine, et sol enchanté. */
function HallRugs({ ox, oy }: { ox: number; oy: number }) {
  const r = rand(29);
  const motes: ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const p = iso(ox + 1 + r() * 22, oy + 1 + r() * 22);
    motes.push(
      <Circle
        key={i}
        cx={p.x}
        cy={p.y - r() * 30}
        r={0.6 + r()}
        fill="#FFE7A0"
        opacity={0.35 + r() * 0.5}
      />,
    );
  }
  const c = iso(ox + 12, oy + 12);
  return (
    <G>
      <Ellipse cx={c.x} cy={c.y} rx={230} ry={115} fill="#6B4FA0" opacity={0.16} />
      <Ellipse cx={c.x} cy={c.y} rx={150} ry={75} fill="#FFD27A" opacity={0.1} />
      {motes}
      {HALL_ROWS.map((row, i) => (
        <Polygon
          key={i}
          points={floorPoly(ox + HALL_X0 - 0.6, oy + row - 2.0, HALL_TABLE_LEN + 1.2, 4.0)}
          fill={HOUSES[HOUSE_IDS[i]].color}
          opacity={0.28}
        />
      ))}
    </G>
  );
}

/** Salle des professeurs (fixe, toujours présente). */
const STAFF_ROOM: RoomSnapshot = {
  id: 'staff',
  kind: 'staff' as Station['kind'],
  level: 1,
  seats: [],
  seatTiers: [],
  props: [],
};

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

/** Petit générateur pseudo-aléatoire stable (étoiles, herbe). */
function rand(seed: number) {
  let t = seed;
  return () => {
    t = (t * 9301 + 49297) % 233280;
    return t / 233280;
  };
}

/** Terrain de Balais volants : pelouse tondue en bandes, ligne blanche, clôture basse. */
function OutdoorField({
  id,
  ox,
  oy,
  w,
  h,
}: {
  id: string;
  ox: number;
  oy: number;
  w: number;
  h: number;
}) {
  const stripes: ReactElement[] = [];
  for (let i = 0; i < w; i += 2)
    stripes.push(
      <Polygon
        key={i}
        points={floorPoly(ox + i, oy, Math.min(1, w - i), h)}
        fill="#FFFFFF"
        opacity={0.06}
      />,
    );
  const posts: ReactElement[] = [];
  for (let x = 0; x <= w; x += 2.2)
    posts.push(
      <Box key={`a${x}`} gx={ox + x - 0.1} gy={oy - 0.1} w={0.2} d={0.2} h={9} color="#6B4A30" />,
    );
  for (let y = 2.2; y <= h; y += 2.2)
    posts.push(
      <Box key={`b${y}`} gx={ox - 0.1} gy={oy + y - 0.1} w={0.2} d={0.2} h={9} color="#6B4A30" />,
    );
  return (
    <G>
      <TexFloor
        id={`${id}-grass`}
        gx={ox}
        gy={oy}
        w={w}
        h={h}
        tex="grass"
        tile={3}
        tint="#7FB069"
        tintOpacity={0.25}
      />
      {stripes}
      <Polygon
        points={floorPoly(ox + 1, oy + 1, w - 2, h - 2)}
        fill="none"
        stroke="#F4F1E6"
        strokeOpacity={0.7}
        strokeWidth={1.5}
      />
      <Line
        x1={iso(ox + w / 2, oy + 1).x}
        y1={iso(ox + w / 2, oy + 1).y}
        x2={iso(ox + w / 2, oy + h - 1).x}
        y2={iso(ox + w / 2, oy + h - 1).y}
        stroke="#F4F1E6"
        strokeOpacity={0.6}
        strokeWidth={1.2}
      />
      {/* clôture basse au fond (rails + poteaux) */}
      <Line
        x1={iso(ox, oy).x}
        y1={iso(ox, oy).y - 6}
        x2={iso(ox + w, oy).x}
        y2={iso(ox + w, oy).y - 6}
        stroke="#7A5434"
        strokeWidth={2}
      />
      <Line
        x1={iso(ox, oy).x}
        y1={iso(ox, oy).y - 6}
        x2={iso(ox, oy + h).x}
        y2={iso(ox, oy + h).y - 6}
        stroke="#7A5434"
        strokeWidth={2}
      />
      {posts}
    </G>
  );
}

/** Salle d'Astronomie : sol en ciel étoilé lumineux (voûte peinte), étoiles scintillantes. */
function StarryFloor({ ox, oy, w, h }: { ox: number; oy: number; w: number; h: number }) {
  const r = rand(17);
  const stars: ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const p = iso(ox + 0.4 + r() * (w - 0.8), oy + 0.4 + r() * (h - 0.8));
    const big = r() > 0.85;
    stars.push(
      <Circle
        key={i}
        cx={p.x}
        cy={p.y}
        r={big ? 1.6 : 0.8}
        fill={big ? '#FFF6D0' : '#DDE8FF'}
        opacity={0.55 + r() * 0.45}
      />,
    );
  }
  const c = iso(ox + w * 0.55, oy + h * 0.5);
  return (
    <G>
      <Polygon points={floorPoly(ox, oy, w, h)} fill="#1F3D7A" opacity={0.72} />
      <Ellipse cx={c.x} cy={c.y} rx={95} ry={45} fill="#5C8DE0" opacity={0.25} />
      <Ellipse cx={c.x - 30} cy={c.y - 8} rx={60} ry={18} fill="#B9A6F0" opacity={0.14} />
      {stars}
      {/* constellation */}
      <Path
        d={`M${c.x - 40} ${c.y - 10} L${c.x - 15} ${c.y - 20} L${c.x + 10} ${c.y - 6} L${c.x + 35} ${c.y - 18}`}
        stroke="#EAF0FF"
        strokeOpacity={0.45}
        strokeWidth={0.8}
        fill="none"
      />
    </G>
  );
}

/** Salle de Potions : pénombre, avec les lueurs vertes des chaudrons. */
function DimRoom({
  ox,
  oy,
  w,
  h,
  seats,
}: {
  ox: number;
  oy: number;
  w: number;
  h: number;
  seats: Pt[];
}) {
  return (
    <G>
      <Polygon points={floorPoly(ox, oy, w, h)} fill="#0A0E12" opacity={0.38} />
      {seats.map((sp, i) => {
        const p = iso(ox + sp.x, oy + sp.y);
        return (
          <Ellipse key={i} cx={p.x} cy={p.y - 6} rx={22} ry={11} fill="#7CFF8A" opacity={0.12} />
        );
      })}
    </G>
  );
}

function Room({ r, env, guests = [] }: { r: RoomSnapshot; env: EnvDef; guests?: RoomSnapshot[] }) {
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
  // Dos au mur : les meubles muraux sont plaqués contre le mur le plus proche (façade
  // inclinée comme le mur) ; contre le mur de gauche, ils sont aussi retournés.
  const decor = (key: string, name: SpriteName, gx: number, gy: number, width: number) => {
    const dx = gx - o.x;
    const dy = gy - o.y;
    const wallish = WALL_FURNITURE.test(String(name));
    const left = dx < 1.8 && dx < dy && !String(name).startsWith('teacherDesk');
    const back = !left && dy < 1.8;
    const skew = wallish ? (left ? -WALL_SKEW : back ? WALL_SKEW : 0) : 0;
    add(
      gx,
      gy,
      <Decor key={key} name={name} p={iso(gx, gy)} width={width} mirror={left} skew={skew} />,
    );
  };

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
    // Cantine : une longue table par Maison (en ligne), la table des professeurs au bout.
    tapestries(
      () => 'x',
      (i) => [2.2, 5.6, 17.6, 21.0][i] / R,
    );
    HALL_ROWS.forEach((row, hi) => {
      const gx = o.x + HALL_X0;
      const gy = o.y + row;
      add(
        gx,
        gy - 1.4,
        <Box
          key={`bb${hi}`}
          gx={gx}
          gy={gy - 1.4}
          w={HALL_TABLE_LEN}
          d={0.45}
          h={5}
          color="#5E3A20"
        />,
      );
      add(
        gx,
        gy - 0.6,
        <LongTable
          key={`t${hi}`}
          gx={gx}
          gy={gy - 0.6}
          len={HALL_TABLE_LEN}
          runner={HOUSES[HOUSE_IDS[hi]].color}
        />,
      );
      add(
        gx,
        gy + 0.95,
        <Box
          key={`bf${hi}`}
          gx={gx}
          gy={gy + 0.95}
          w={HALL_TABLE_LEN}
          d={0.45}
          h={5}
          color="#5E3A20"
        />,
      );
    });
    // Table des professeurs, en travers au bout de la salle : une chaise par prof.
    // Dix professeur·es : dix places, toujours.
    const n = 10;
    const len = n * PROF_SEAT_GAP + 0.6;
    add(
      o.x + HALL_PROF_X - 0.7,
      o.y + PROF_TABLE_Y,
      <LongTable
        key="prof"
        gx={o.x + HALL_PROF_X - 0.7}
        gy={o.y + PROF_TABLE_Y}
        len={len}
        along="y"
        runner="#C9A25A"
      />,
    );
    // Chaises côté mur, dossier contre le mur : les profs font face aux élèves.
    for (let k = 0; k < n; k++) {
      const cy = o.y + PROF_TABLE_Y + 0.3 + PROF_SEAT_GAP * (k + 0.5) - 0.35;
      add(
        o.x + HALL_PROF_X - 1.6,
        cy,
        <G key={`chair${k}`}>
          <Box gx={o.x + HALL_PROF_X - 1.75} gy={cy} w={0.15} d={0.7} h={16} color="#5A3420" />
          <Box gx={o.x + HALL_PROF_X - 1.6} gy={cy} w={0.7} d={0.7} h={5} color="#7A2430" />
        </G>,
      );
    }
    // Grande cheminée au centre du mur du fond, bougies flottantes au-dessus des tables.
    add(
      o.x + 12.5,
      o.y + 0.9,
      <Decor key="bigFire" name="grandFire" p={iso(o.x + 12.5, o.y + 1.4)} width={150} />,
    );
    [7, 12, 17].forEach((y) =>
      [9, 15].forEach((x) => decor(`fc-${x}-${y}`, 'floatCandles', o.x + x, o.y + y, 24)),
    );
  }

  // Accueil : le personnel derrière chaque guichet, face à l'entrée.
  if (r.kind === 'reception')
    r.seats.forEach((sp, i) => {
      const gx = o.x + sp.x;
      const gy = o.y + sp.y - 2.3;
      decor(`staff-${i}`, `staff${i % 4}` as SpriteName, gx, gy, 24);
    });

  // Lieux situés dans cette salle (le Chaporacle dans l'Accueil) : tentures, places.
  for (const gst of guests) {
    const go = roomOrigin(PLOTS[gst.id]);
    HOUSE_IDS.forEach((h, i) =>
      wall.push(
        <WallQuad
          key={`gt-${h}`}
          axis="x"
          ox={o.x}
          oy={o.y}
          t1={go.x - o.x + 1.2 + i * 2.2}
          t2={go.x - o.x + 2.0 + i * 2.2}
          h1={3}
          h2={H - 3}
          fill={HOUSES[h].color}
          stroke="#3B2414"
        />,
      ),
    );
    gst.seats.forEach((sp, i) => {
      const gx = go.x + sp.x;
      const gy = go.y + sp.y;
      add(
        gx,
        gy,
        <G key={`gseat-${gst.id}-${i}`}>
          <Furniture kind="sorting" at={iso(gx, gy)} gx={gx} gy={gy} tier={gst.seatTiers[i] ?? 0} />
        </G>,
      );
    });
  }

  for (const d of ROOM_DECOR[kind] ?? [])
    decor(
      `d-${d.sprite}-${d.x}-${d.y}`,
      d.sprite as SpriteName,
      o.x + d.x * R,
      o.y + d.y * R,
      d.width,
    );
  if (r.courseId)
    for (const p of COURSE_PROPS[r.courseId as CourseId] ?? [])
      if (!p.cost || r.props.includes(p.id))
        decor(`p-${p.id}`, p.sprite as SpriteName, o.x + p.x * R, o.y + p.y * R, p.width);
  if (r.kind !== 'hall')
    r.seats.forEach((sp, i) => {
      const gx = o.x + sp.x;
      const gy = o.y + sp.y;
      add(
        gx,
        gy,
        <G key={`seat-${i}`}>
          <Furniture kind={kind} at={iso(gx, gy)} gx={gx} gy={gy} tier={r.seatTiers[i] ?? 0} />
        </G>,
      );
    });
  objects.sort((a, b) => a.order - b.order);

  if (def.outdoor)
    return (
      <G>
        <OutdoorField id={r.id} ox={o.x} oy={o.y} w={RW} h={RH} />
        {objects.map((x) => x.el)}
      </G>
    );
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
      {r.courseId === 'astronomy' ? <StarryFloor ox={o.x} oy={o.y} w={RW} h={RH} /> : null}
      {guests.map((gst) => {
        const go = roomOrigin(PLOTS[gst.id]);
        const c = iso(go.x + S / 2, go.y + S / 2);
        return (
          <G key={`hat-${gst.id}`}>
            <Polygon
              points={floorPoly(go.x + 0.3, go.y + 0.3, S - 0.6, S - 0.6)}
              fill="#3E2F5E"
              opacity={0.75}
            />
            <Ellipse cx={c.x} cy={c.y} rx={58} ry={29} fill="#4B3B6E" opacity={0.9} />
            <Ellipse
              cx={c.x}
              cy={c.y}
              rx={54}
              ry={27}
              fill="none"
              stroke="#B89A5A"
              strokeWidth={1.5}
            />
            <Sprite name="hatPedestal" p={iso(go.x + S / 2, go.y + S / 2)} width={40} />
          </G>
        );
      })}
      {r.kind === 'hall' ? <HallRugs ox={o.x} oy={o.y} /> : null}
      {(isCourse && r.courseId !== 'astronomy') || r.kind === 'exam' ? (
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
          {/* tapis de l'entrée (porte au milieu) vers les guichets à gauche et vers le Chaporacle à droite */}
          <Polygon
            points={floorPoly(o.x + 2.5, o.y + 6.2, RW - 9, 1.8)}
            fill="#7A2E34"
            opacity={0.6}
          />
          <Polygon
            points={floorPoly(o.x + RW / 2 - 1.2, o.y + 6.2, 2.4, RH - 6.2)}
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
      {r.kind === 'reception' ? <BackDoorway ox={o.x} oy={o.y} /> : null}
      <WallShadow id={`${r.id}-shx`} axis="x" ox={o.x} oy={o.y} len={RW} />
      <WallShadow id={`${r.id}-shy`} axis="y" ox={o.x} oy={o.y} len={RH} />
      {wall}
      {objects.map((x) => x.el)}
      {r.courseId === 'potions' ? (
        <DimRoom ox={o.x} oy={o.y} w={RW} h={RH} seats={r.seats} />
      ) : null}
      <FrontLips ox={o.x} oy={o.y} w={RW} h={RH} door={doorSide === 'back' ? 'x' : doorSide} />
      {r.kind === 'reception' ? <Porch ox={o.x} oy={o.y} w={RW} h={RH} /> : null}
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
  const all = [...rooms, STAFF_ROOM];
  for (const r of all) {
    const p = PLOTS[r.id];
    if (!p || p.hostedIn) continue;
    const guests = all.filter((g) => PLOTS[g.id]?.hostedIn === r.id);
    items.push({
      order: p.px + p.py,
      el: <Room key={r.id} r={r} env={env} guests={guests} />,
    });
  }
  for (const pl of plots) {
    const p = PLOTS[pl.id];
    if (p)
      items.push({
        order: p.px + p.py,
        el: <ConstructionPlot key={pl.id} id={pl.id} available={pl.available} env={env} />,
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
