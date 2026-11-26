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

function tier(level: number): number {
  return level >= 8 ? 2 : level >= 4 ? 1 : 0;
}

const lift = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
const drop = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y + h });

/** Ombre douce sous un objet. */
function Shadow({ p, w }: { p: Pt; w: number }) {
  return <Ellipse cx={p.x} cy={p.y + 1} rx={w * 0.42} ry={w * 0.2} fill="#000" opacity={0.22} />;
}

/** Sprite de décor avec son ombre. */
function Decor({ name, p, width }: { name: SpriteName; p: Pt; width: number }) {
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

/** Arbres autour de l'école (le décor change selon l'environnement). */
function Perimeter({ env }: { env: EnvDef }) {
  const pts: [number, number][] = [];
  for (let x = 2; x < GRID_X - PLOT.front; x += 5.5) pts.push([x, 2 + ((x * 7) % 3)]);
  for (let y = 7; y < GRID_Y - PLOT.front; y += 5.5) pts.push([2 + ((y * 5) % 3), y]);
  const els = pts.map(([x, y], i) =>
    env.deco === 'tree' ? (
      <Decor
        key={i}
        name={i % 3 === 0 ? 'pine' : 'oak'}
        p={iso(x, y)}
        width={i % 3 === 0 ? 46 : 64}
      />
    ) : (
      <Deco key={i} p={iso(x, y)} s={1.2} env={env} />
    ),
  );
  return <G>{els}</G>;
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
    // côté droit de l'allée (entre l'école et le portail)
    { name: 'statue', x: pathX - 5.5, y: y1 + 3.2, w: 40 },
    { name: 'flowerBed', x: pathX + 11.5, y: y1 + 3.5, w: 46 },
    { name: 'parkBench', x: pathX + 3.6, y: y1 + 10, w: 34 },
    { name: 'birdbath', x: x1 + 8.5, y: y1 + 2.5, w: 22 },
    { name: 'well', x: x1 + 9.5, y: y0 + h * 0.75, w: 44 },
    { name: 'picnic', x: x1 + 6.5, y: y0 + h * 0.55, w: 46 },
    { name: 'oak', x: x1 + 10, y: y0 + h * 0.4, w: 70 },
    { name: 'oak', x: x1 + 9, y: y0 + h * 0.15, w: 64 },
    { name: 'pumpkins', x: x1 + 5, y: y0 + h * 0.3, w: 40 },
    { name: 'wheelbarrow', x: x1 + 6.5, y: y0 + h * 0.36, w: 34 },
    { name: 'bush', x: x1 + 4, y: y0 + h * 0.85, w: 30 },

    { name: 'flowerBed', x: pathX - 3.6, y: gateY - 3.5, w: 36 },
    { name: 'flowerBed', x: pathX + 3.6, y: gateY - 3.5, w: 36 },
    { name: 'owlPost', x: pathX + 3, y: gateY - 0.8, w: 22 },
    { name: 'signpost', x: pathX - 3, y: gateY - 1.2, w: 28 },
    { name: 'hedge', x: pathX - 5.5, y: gateY - 0.5, w: 40 },
    { name: 'hedge', x: pathX + 5.5, y: gateY - 0.5, w: 40 },

    // côté gauche de l'allée
    { name: 'hedge', x: pathX - 3.4, y: y1 + 7, w: 40 },
    { name: 'hedge', x: pathX - 3.4, y: y1 + 10, w: 40 },
    { name: 'bush', x: pathX - 6, y: y1 + 4.5, w: 32 },
    { name: 'pine', x: pathX - 9, y: y1 + 7, w: 48 },
    { name: 'rocks', x: pathX - 13, y: y1 + 5, w: 36 },
    { name: 'oak', x: pathX - 18, y: y1 + 7.5, w: 70 },
    { name: 'pine', x: pathX - 24, y: y1 + 6, w: 46 },
    { name: 'pumpkins', x: pathX - 28, y: y1 + 3.5, w: 38 },
    { name: 'oak', x: pathX - 34, y: y1 + 7, w: 66 },
    { name: 'bush', x: pathX - 40, y: y1 + 4, w: 30 },
    { name: 'pine', x: pathX - 45, y: y1 + 7.5, w: 46 },
    { name: 'parkBench', x: pathX - 21, y: y1 + 3, w: 34 },
    { name: 'flowerBed', x: pathX - 31, y: y1 + 3.2, w: 42 },
  );
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
        gx={pathX - 1.1}
        gy={y1}
        w={2.2}
        h={gateY + 1.1 - y1}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
      />
      <ExamCorridor env={env} />
      <Perimeter env={env} />
      {yardEls}
      <Fountain p={iso(fountainPoint().x, fountainPoint().y)} />
      <Sprite name="gate" p={iso(gateX, gateY + 0.9)} width={100} lift={8} />
    </G>
  );
}

function Garden({ px, py, env }: { px: number; py: number; env: EnvDef }) {
  const o = plotOrigin(px, py);
  const c = iso(o.x + S / 2, o.y + S / 2);
  const k = `${px}-${py}`;
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
      <Ellipse cx={c.x} cy={c.y + 4} rx={38} ry={19} fill="#000" opacity={0.2} />
      <Ellipse cx={c.x} cy={c.y} rx={34} ry={17} fill="#9AA5A8" />
      <Ellipse cx={c.x} cy={c.y - 2} rx={28} ry={13} fill="#5FA9CF" />
      <Ellipse cx={c.x - 6} cy={c.y - 4} rx={10} ry={4} fill="#BFE6FF" opacity={0.6} />
      <Line x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y - 18} stroke="#8A9497" strokeWidth={5} />
      <Ellipse cx={c.x} cy={c.y - 18} rx={8} ry={3.5} fill="#9AA5A8" />
      <Decor name="owl" p={iso(o.x + 1.2 * R, o.y + 6.8 * R)} width={20} />
      <Deco p={iso(o.x + 1.3 * R, o.y + 1.3 * R)} env={env} />
      <Deco p={iso(o.x + 6.6 * R, o.y + 1.4 * R)} s={0.9} env={env} />
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
  const gap = 0.75;
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
  const cx = ox + w / 2;
  const y = oy + h;
  const stone = '#B8AE9C';
  const top = 46;
  const a = iso(cx - 1.6, y + 0.9);
  const b = iso(cx + 1.6, y + 0.9);
  return (
    <G>
      {/* marches */}
      <Box gx={cx - 1.9} gy={y + 0.1} w={3.8} d={1.6} h={3} color="#9C9384" />
      <Box gx={cx - 1.7} gy={y + 0.1} w={3.4} d={1.1} h={6} color="#A89F8F" />
      {/* colonnes */}
      {[-1.5, -0.6, 0.6, 1.5].map((dx) => (
        <Box key={dx} gx={cx + dx - 0.15} gy={y + 0.75} w={0.3} d={0.3} h={top} color={stone} />
      ))}
      {/* entablement et fronton */}
      <Box gx={cx - 1.8} gy={y + 0.6} w={3.6} d={0.55} h={6} color="#A39883" />
      <Polygon
        points={poly([
          lift(iso(cx - 1.8, y + 1.15), top + 6),
          lift(iso(cx + 1.8, y + 1.15), top + 6),
          { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - top - 26 },
        ])}
        fill="#C9BFAD"
        stroke="#7C7262"
        strokeWidth={1}
      />
      <Polygon
        points={poly([
          lift(iso(cx - 1.8, y + 0.6), top + 6),
          lift(iso(cx - 1.8, y + 1.15), top + 6),
          { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - top - 26 },
        ])}
        fill="#A89E8B"
      />
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
    items.push({ order: g.px + g.py, el: <Garden key={`g${i}`} px={g.px} py={g.py} env={env} /> }),
  );
  items.sort((a, b) => a.order - b.order);
  return (
    <Svg width={MAP_W} height={MAP_H}>
      <Ground env={env} />
      {items.map((x) => x.el)}
    </Svg>
  );
}

/** Carte statique : redessinée seulement quand le plan change (achat, niveau, places). */
export const MapArt = memo(MapArtBase, (a, b) => JSON.stringify(a) === JSON.stringify(b));

export const ISO_WALL = ISO.wallH;
