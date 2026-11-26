import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import type { SpriteName } from '../assets';
import { ENVIRONMENTS, type EnvDef } from '../data/environments';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import { FLOOR_TEXTURE, GARDENS, ISO, PLOT, PLOTS, ROOM_DECOR } from '../data/layout';
import type { Station } from '../engine';
import { floorPoly, GRID_X, GRID_Y, iso, MAP_H, MAP_W, plotOrigin, poly, type Pt } from './iso';
import { Box, Furniture, shade, Sprite, tiered, WallQuad } from './isoArt';
import { TexFloor, TexWall, WallShadow, WindowLight } from './isoTex';

const S = PLOT.size;
const H = ISO.wallH;
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
      return <Decor name="planterTree" p={p} width={34 * s} />;
  }
}

function Ground({ env }: { env: EnvDef }) {
  const school0 = plotOrigin(0, 0);
  const w = PLOT.cols * (S + PLOT.gap) - PLOT.gap;
  const h = PLOT.rows * (S + PLOT.gap) - PLOT.gap;
  const pad = PLOT.gap / 2;
  const tinted = env.id !== 'manor';
  const rec = plotOrigin(PLOTS.reception.px, PLOTS.reception.py);
  const pathX = rec.x + S + pad;
  const gateY = GRID_Y - 2.4;
  const x0 = school0.x - pad;
  const y0 = school0.y - pad;
  const x1 = school0.x + w + pad;
  const y1 = school0.y + h + pad;
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
      {/* Allée d'entrée et portail (à gauche) */}
      <TexFloor
        id="path"
        gx={pathX - 1.1}
        gy={y1}
        w={2.2}
        h={GRID_Y - y1}
        tex="stone"
        tile={2}
        tint={env.path}
        tintOpacity={tinted ? 0.4 : 0}
      />
      <Decor name="barrel" p={iso(pathX + 1.7, y1 + 1.6)} width={22} />
      <Decor name="planterTree" p={iso(pathX - 1.8, y1 + 1.4)} width={30} />
      <Decor name="cat" p={iso(pathX + 1.6, gateY - 1.4)} width={16} />
      <Sprite name="gate" p={iso(pathX, gateY + 0.6)} width={92} lift={8} />
      {[
        [2, 3],
        [3, 12],
        [2, 26],
        [12, 2],
        [26, 2.5],
        [GRID_X - 3, 8],
        [GRID_X - 3, GRID_Y - 4],
        [10, GRID_Y - 2.5],
        [GRID_X - 6, GRID_Y - 2],
      ].map(([x, y], i) => (
        <Deco key={i} p={iso(x, y)} s={1.1} env={env} />
      ))}
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
      <TexFloor id={`gpath1-${k}`} gx={o.x + 3.4} gy={o.y} w={1.2} h={S} tex="stone" tile={2} />
      <TexFloor id={`gpath2-${k}`} gx={o.x} gy={o.y + 3.4} w={S} h={1.2} tex="stone" tile={2} />
      <Ellipse cx={c.x} cy={c.y + 4} rx={38} ry={19} fill="#000" opacity={0.2} />
      <Ellipse cx={c.x} cy={c.y} rx={34} ry={17} fill="#9AA5A8" />
      <Ellipse cx={c.x} cy={c.y - 2} rx={28} ry={13} fill="#5FA9CF" />
      <Ellipse cx={c.x - 6} cy={c.y - 4} rx={10} ry={4} fill="#BFE6FF" opacity={0.6} />
      <Line x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y - 18} stroke="#8A9497" strokeWidth={5} />
      <Ellipse cx={c.x} cy={c.y - 18} rx={8} ry={3.5} fill="#9AA5A8" />
      <Decor name="owl" p={iso(o.x + 1.2, o.y + 6.8)} width={20} />
      <Deco p={iso(o.x + 1.3, o.y + 1.3)} env={env} />
      <Deco p={iso(o.x + 6.6, o.y + 1.4)} s={0.9} env={env} />
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

/** Fenêtre à meneaux avec rebord et rideaux. */
function Window({ axis, ox, oy, t }: { axis: 'x' | 'y'; ox: number; oy: number; t: number }) {
  return (
    <G>
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t - 0.08}
        t2={t + 1.18}
        h1={20}
        h2={46}
        fill="#4A3522"
      />
      <WallQuad axis={axis} ox={ox} oy={oy} t1={t} t2={t + 1.1} h1={22} h2={44} fill="#8FB8D8" />
      <WallQuad axis={axis} ox={ox} oy={oy} t1={t} t2={t + 1.1} h1={33} h2={44} fill="#B9D6EA" />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t + 0.52}
        t2={t + 0.58}
        h1={22}
        h2={44}
        fill="#4A3522"
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t}
        t2={t + 1.1}
        h1={32.5}
        h2={33.5}
        fill="#4A3522"
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t - 0.32}
        t2={t - 0.02}
        h1={18}
        h2={47}
        fill="#6B2E2E"
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t + 1.12}
        t2={t + 1.42}
        h1={18}
        h2={47}
        fill="#6B2E2E"
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t - 0.15}
        t2={t + 1.25}
        h1={18}
        h2={20.5}
        fill="#B5A58C"
      />
    </G>
  );
}

/** Tableau noir encadré (mur de gauche) avec quelques traits de craie. */
function Blackboard({ ox, oy }: { ox: number; oy: number }) {
  return (
    <G>
      <WallQuad axis="y" ox={ox} oy={oy} t1={2.1} t2={5.9} h1={20} h2={46} fill="#5A3A22" />
      <WallQuad axis="y" ox={ox} oy={oy} t1={2.25} t2={5.75} h1={22} h2={44} fill="#2F4A3A" />
      <WallQuad axis="y" ox={ox} oy={oy} t1={2.7} t2={4.2} h1={38} h2={38.8} fill="#E8E4D8" />
      <WallQuad axis="y" ox={ox} oy={oy} t1={2.7} t2={3.8} h1={33} h2={33.8} fill="#E8E4D8" />
      <WallQuad axis="y" ox={ox} oy={oy} t1={4.4} t2={5.3} h1={29} h2={29.8} fill="#E8E4D8" />
      <WallQuad axis="y" ox={ox} oy={oy} t1={2.2} t2={5.8} h1={19} h2={21} fill="#7A5A3A" />
    </G>
  );
}

/** Applique murale (bougie). */
function Sconce({ axis, ox, oy, t }: { axis: 'x' | 'y'; ox: number; oy: number; t: number }) {
  const b = axis === 'x' ? iso(ox + t, oy) : iso(ox, oy + t);
  const p = { x: b.x, y: b.y - 36 };
  return (
    <G>
      <Circle cx={p.x} cy={p.y - 4} r={9} fill="#FFD27A" opacity={0.18} />
      <Path
        d={`M${p.x - 3} ${p.y + 4} L${p.x + 3} ${p.y + 4} L${p.x} ${p.y + 8} Z`}
        fill="#3A3A40"
      />
      <Line x1={p.x} y1={p.y + 4} x2={p.x} y2={p.y - 2} stroke="#EFE6D2" strokeWidth={2.5} />
      <Circle cx={p.x} cy={p.y - 4} r={1.8} fill="#FFB347" />
    </G>
  );
}

/** Tableau (peinture de paysage) encadré. */
function Painting({
  axis,
  ox,
  oy,
  t,
  color,
}: {
  axis: 'x' | 'y';
  ox: number;
  oy: number;
  t: number;
  color: string;
}) {
  return (
    <G>
      <WallQuad axis={axis} ox={ox} oy={oy} t1={t} t2={t + 0.9} h1={26} h2={44} fill="#6B4A28" />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t + 0.08}
        t2={t + 0.82}
        h1={28}
        h2={42}
        fill={color}
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t + 0.08}
        t2={t + 0.82}
        h1={28}
        h2={33}
        fill="#3E5A3A"
      />
    </G>
  );
}

/** Murs épais : faces texturées, chapeau de mur, extrémités, corniche. */
function Walls({ id, ox, oy, env }: { id: string; ox: number; oy: number; env: EnvDef }) {
  const tinted = env.id !== 'manor';
  const cap = shade(env.wood, 0.75);
  return (
    <G>
      <TexWall
        id={`${id}-wx`}
        axis="x"
        ox={ox}
        oy={oy}
        len={S}
        height={H}
        shadeOpacity={0.14}
        tint={env.plaster}
        tintOpacity={tinted ? 0.35 : 0}
      />
      <TexWall
        id={`${id}-wy`}
        axis="y"
        ox={ox}
        oy={oy}
        len={S}
        height={H}
        shadeOpacity={0}
        tint={env.plaster}
        tintOpacity={tinted ? 0.35 : 0}
      />
      <Polygon
        points={poly([
          lift(iso(ox - WALL_T, oy - WALL_T), H),
          lift(iso(ox + S, oy - WALL_T), H),
          lift(iso(ox + S, oy), H),
          lift(iso(ox, oy), H),
        ])}
        fill={cap}
      />
      <Polygon
        points={poly([
          lift(iso(ox - WALL_T, oy - WALL_T), H),
          lift(iso(ox, oy), H),
          lift(iso(ox, oy + S), H),
          lift(iso(ox - WALL_T, oy + S), H),
        ])}
        fill={shade(cap, 1.1)}
      />
      <Polygon
        points={poly([
          iso(ox + S, oy - WALL_T),
          iso(ox + S, oy),
          lift(iso(ox + S, oy), H),
          lift(iso(ox + S, oy - WALL_T), H),
        ])}
        fill={shade(cap, 0.8)}
      />
      <Polygon
        points={poly([
          iso(ox - WALL_T, oy + S),
          iso(ox, oy + S),
          lift(iso(ox, oy + S), H),
          lift(iso(ox - WALL_T, oy + S), H),
        ])}
        fill={shade(cap, 0.95)}
      />
      <WallQuad axis="x" ox={ox} oy={oy} t1={0} t2={S} h1={H - 4} h2={H} fill={shade(cap, 0.9)} />
      <WallQuad axis="y" ox={ox} oy={oy} t1={0} t2={S} h1={H - 4} h2={H} fill={cap} />
    </G>
  );
}

/** Sol surélevé : tranche de pierre à l'avant + texture de sol. */
function RoomFloor({
  id,
  kind,
  ox,
  oy,
  tintColor,
  env,
}: {
  id: string;
  kind: string;
  ox: number;
  oy: number;
  tintColor: string;
  env: EnvDef;
}) {
  const ft = FLOOR_TEXTURE[kind] ?? FLOOR_TEXTURE.course;
  const a = iso(ox + S, oy);
  const b = iso(ox + S, oy + S);
  const c = iso(ox, oy + S);
  const stone = '#7C7267';
  return (
    <G>
      <Polygon points={poly([a, b, drop(b, PLINTH), drop(a, PLINTH)])} fill={shade(stone, 0.75)} />
      <Polygon points={poly([c, b, drop(b, PLINTH), drop(c, PLINTH)])} fill={stone} />
      <TexFloor
        id={`${id}-floor`}
        gx={ox}
        gy={oy}
        w={S}
        h={S}
        tex={ft.tex}
        tile={ft.tile}
        tint={tintColor}
        tintOpacity={env.id !== 'manor' ? 0.3 : 0.12}
      />
    </G>
  );
}

/** Murets avant bas (vue « maison de poupée »), avec l'ouverture de la porte. */
function FrontLips({ ox, oy }: { ox: number; oy: number }) {
  const door = S / 2;
  const c = '#8A7F72';
  return (
    <G>
      <Box gx={ox + S - 0.18} gy={oy} w={0.18} d={door - 0.75} h={11} color={c} />
      <Box gx={ox + S - 0.18} gy={oy + door + 0.75} w={0.18} d={door - 0.75} h={11} color={c} />
      <Box gx={ox} gy={oy + S - 0.18} w={S} d={0.18} h={11} color={c} />
    </G>
  );
}

function Room({ r, env }: { r: RoomSnapshot; env: EnvDef }) {
  const def = PLOTS[r.id];
  const o = plotOrigin(def.px, def.py);
  const t = tier(r.level);
  const kind = r.kind === 'course' ? r.courseId! : r.kind;
  const isCourse = r.kind === 'course';

  const wall: ReactElement[] = [];
  const objects: { order: number; el: ReactElement }[] = [];
  const add = (gx: number, gy: number, el: ReactElement) => objects.push({ order: gx + gy, el });
  const decor = (key: string, name: SpriteName, gx: number, gy: number, width: number) =>
    add(gx, gy, <Decor key={key} name={name} p={iso(gx, gy)} width={width} />);

  if (isCourse) {
    wall.push(<Blackboard key="bb" ox={o.x} oy={o.y} />);
    if (r.courseId === 'astronomy') {
      wall.push(
        <WallQuad
          key="sky"
          axis="x"
          ox={o.x}
          oy={o.y}
          t1={1.6}
          t2={6.4}
          h1={16}
          h2={47}
          fill="#1B2350"
          stroke="#5A3A22"
        />,
      );
    } else {
      wall.push(
        <Window key="w1" axis="x" ox={o.x} oy={o.y} t={1.9} />,
        <Window key="w2" axis="x" ox={o.x} oy={o.y} t={5.0} />,
      );
    }
    wall.push(
      <Sconce key="s1" axis="y" ox={o.x} oy={o.y} t={1.3} />,
      <Sconce key="s2" axis="y" ox={o.x} oy={o.y} t={6.7} />,
    );
    if (t >= 1) wall.push(<Painting key="p1" axis="x" ox={o.x} oy={o.y} t={3.6} color="#8FB0C8" />);
    // Bureau du professeur devant le tableau, tourné vers les élèves.
    decor('desk', tiered('teacherDeskM' as SpriteName, t), o.x + 1.25, o.y + 4.0, 50);
    decor('shelf', tiered('bookshelf', t), o.x + 0.55, o.y + 1.2, 30);
  } else if (r.kind === 'dorm') {
    wall.push(
      <Window key="w1" axis="x" ox={o.x} oy={o.y} t={2.1} />,
      <Window key="w2" axis="x" ox={o.x} oy={o.y} t={5.1} />,
      <Window key="w3" axis="y" ox={o.x} oy={o.y} t={3.4} />,
    );
    wall.push(
      <Sconce key="s1" axis="y" ox={o.x} oy={o.y} t={1.4} />,
      <Sconce key="s2" axis="y" ox={o.x} oy={o.y} t={6.6} />,
    );
  } else if (r.kind === 'hall') {
    HOUSE_IDS.forEach((h, i) =>
      wall.push(
        <WallQuad
          key={h}
          axis="x"
          ox={o.x}
          oy={o.y}
          t1={0.9 + i * 1.8}
          t2={1.7 + i * 1.8}
          h1={12}
          h2={47}
          fill={HOUSES[h].color}
          stroke="#3B2414"
        />,
      ),
    );
    wall.push(
      <Window key="w" axis="y" ox={o.x} oy={o.y} t={1.4} />,
      <Window key="w2" axis="y" ox={o.x} oy={o.y} t={6.0} />,
    );
    decor('fire', 'fireplace', o.x + 0.6, o.y + 4.3, 46);
    [0, 1, 2, 3, 4].forEach((row) =>
      [2.2, 5.7].forEach((gy) =>
        decor(`t${row}-${gy}`, tiered('table', t), o.x + 1.26 + row * 1.35, o.y + gy + 1.2, 66),
      ),
    );
  } else if (r.kind === 'reception') {
    wall.push(
      <Window key="w" axis="x" ox={o.x} oy={o.y} t={2.4} />,
      <Painting key="p" axis="x" ox={o.x} oy={o.y} t={5.6} color="#C9A27A" />,
    );
    decor('b1', tiered('bookshelf', t), o.x + 0.55, o.y + 2.2, 30);
    decor('b2', tiered('bookshelf', t), o.x + 0.55, o.y + 6.2, 30);
  } else if (r.kind === 'sorting') {
    HOUSE_IDS.forEach((h, i) =>
      wall.push(
        <WallQuad
          key={h}
          axis={i < 2 ? 'x' : 'y'}
          ox={o.x}
          oy={o.y}
          t1={1.5 + (i % 2) * 3.5}
          t2={2.5 + (i % 2) * 3.5}
          h1={12}
          h2={47}
          fill={HOUSES[h].color}
          stroke="#3B2414"
        />,
      ),
    );
  }

  for (const d of ROOM_DECOR[kind] ?? [])
    decor(`d-${d.sprite}-${d.x}-${d.y}`, d.sprite as SpriteName, o.x + d.x, o.y + d.y, d.width);
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

  const center = iso(o.x + S / 2, o.y + S / 2);
  return (
    <G>
      <Walls id={r.id} ox={o.x} oy={o.y} env={env} />
      <RoomFloor
        id={r.id}
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
          <Box gx={o.x + 3.6} gy={o.y + 3.6} w={0.8} d={0.8} h={12} color="#6B4A30" />
        </G>
      ) : null}
      {r.kind === 'dorm' || r.kind === 'reception' ? (
        <Polygon points={floorPoly(o.x + 2.6, o.y + 2.6, 2.8, 2.8)} fill="#7A2E34" opacity={0.55} />
      ) : null}
      <WallShadow id={`${r.id}-shx`} axis="x" ox={o.x} oy={o.y} len={S} />
      <WallShadow id={`${r.id}-shy`} axis="y" ox={o.x} oy={o.y} len={S} />
      {r.kind !== 'sorting' && r.courseId !== 'astronomy' ? (
        <WindowLight axis="x" ox={o.x} oy={o.y} t={r.kind === 'reception' ? 2.4 : 1.9} />
      ) : null}
      {wall}
      {objects.map((x) => x.el)}
      <FrontLips ox={o.x} oy={o.y} />
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
