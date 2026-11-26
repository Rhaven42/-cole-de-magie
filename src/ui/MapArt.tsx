import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import { GARDENS, ISO, PLOT, PLOTS } from '../data/layout';
import { ENVIRONMENTS, type EnvDef } from '../data/environments';
import type { Station } from '../engine';
import {
  BackWalls,
  Box,
  Candle,
  Furniture,
  FrontLips,
  shade,
  Sprite,
  tiered,
  Tree,
  Window,
  WallQuad,
} from './isoArt';
import { floorPoly, GRID_X, GRID_Y, iso, MAP_H, MAP_W, plotOrigin, type Pt } from './iso';

const S = PLOT.size;

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

/** Élément de décor extérieur selon l'environnement. */
function Deco({ p, s = 1, env }: { p: Pt; s?: number; env: EnvDef }) {
  switch (env.deco) {
    case 'coral':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y} rx={10 * s} ry={5 * s} fill="rgba(0,0,0,0.18)" />
          <Path
            d={`M${p.x} ${p.y} C${p.x - 12 * s} ${p.y - 10 * s} ${p.x - 4 * s} ${p.y - 22 * s} ${p.x - 9 * s} ${p.y - 30 * s} M${p.x} ${p.y} C${p.x + 2 * s} ${p.y - 14 * s} ${p.x + 12 * s} ${p.y - 18 * s} ${p.x + 8 * s} ${p.y - 28 * s}`}
            stroke="#F2789F"
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
            fill="#F3E6C8"
          />
          <Path
            d={`M${p.x - 16 * s} ${p.y - 14 * s} Q${p.x} ${p.y - 40 * s} ${p.x + 16 * s} ${p.y - 14 * s} Z`}
            fill="#C0392B"
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
      return <Tree p={p} s={s} />;
  }
}

function Ground({ env }: { env: EnvDef }) {
  const school0 = plotOrigin(0, 0);
  const w = PLOT.cols * (S + PLOT.gap) - PLOT.gap;
  const h = PLOT.rows * (S + PLOT.gap) - PLOT.gap;
  const pad = 0.8;
  const lines: ReactElement[] = [];
  // Lames de parquet du couloir
  for (let i = 0; i <= w + 2 * pad; i += 1) {
    const a = iso(school0.x - pad + i, school0.y - pad);
    const b = iso(school0.x - pad + i, school0.y + h + pad);
    lines.push(
      <Line
        key={`l${i}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={env.corridorLine}
        strokeWidth={0.6}
      />,
    );
  }
  // Chemin d'entrée vers la grille
  const rec = plotOrigin(4, 3);
  return (
    <G>
      <Polygon points={floorPoly(0, 0, GRID_X, GRID_Y)} fill={env.ground} />
      <Polygon
        points={floorPoly(
          school0.x - pad - 0.4,
          school0.y - pad - 0.4,
          w + 2 * pad + 0.8,
          h + 2 * pad + 0.8,
        )}
        fill={env.border}
      />
      <Polygon
        points={floorPoly(school0.x - pad, school0.y - pad, w + 2 * pad, h + 2 * pad)}
        fill={env.corridor}
      />
      {lines}
      <Polygon
        points={floorPoly(rec.x + S + pad, rec.y + 1, GRID_X - rec.x - S - pad, 3)}
        fill="#CDB892"
      />
      <Polygon
        points={floorPoly(rec.x + S + pad, rec.y + 1.4, GRID_X - rec.x - S - pad, 2.2)}
        fill={env.path}
      />
      <Box gx={GRID_X - 2} gy={rec.y + 0.2} w={0.5} d={0.5} h={34} color="#6B6B78" />
      <Box gx={GRID_X - 2} gy={rec.y + 4.3} w={0.5} d={0.5} h={34} color="#6B6B78" />
      {[0.8, 1.6, 2.4, 3.2, 4.0].map((t) => (
        <Line
          key={t}
          x1={iso(GRID_X - 1.8, rec.y + t).x}
          y1={iso(GRID_X - 1.8, rec.y + t).y - 4}
          x2={iso(GRID_X - 1.8, rec.y + t).x}
          y2={iso(GRID_X - 1.8, rec.y + t).y - 28}
          stroke="#2E2E36"
          strokeWidth={2}
        />
      ))}
      {[
        [2, 3],
        [3, 12],
        [2, 26],
        [12, 2],
        [26, 2.5],
        [GRID_X - 3, 8],
        [GRID_X - 3, GRID_Y - 4],
        [10, GRID_Y - 2.5],
        [28, GRID_Y - 2.5],
      ].map(([x, y], i) => (
        <Deco key={i} p={iso(x, y)} s={1.1} env={env} />
      ))}
    </G>
  );
}

function Garden({
  px,
  py,
  fountain,
  env,
}: {
  px: number;
  py: number;
  fountain: boolean;
  env: EnvDef;
}) {
  const o = plotOrigin(px, py);
  const c = iso(o.x + S / 2, o.y + S / 2);
  return (
    <G>
      <Polygon points={floorPoly(o.x, o.y, S, S)} fill={env.groundAlt} />
      <Polygon points={floorPoly(o.x + 3.4, o.y, 1.2, S)} fill={env.path} />
      <Polygon points={floorPoly(o.x, o.y + 3.4, S, 1.2)} fill={env.path} />
      {fountain ? (
        <G>
          <Ellipse cx={c.x} cy={c.y} rx={34} ry={17} fill="#9AA5A8" />
          <Ellipse cx={c.x} cy={c.y - 2} rx={28} ry={13} fill="#6EC3E8" />
          <Ellipse cx={c.x} cy={c.y - 14} rx={6} ry={3} fill="#BFE6FF" />
          <Line x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y - 16} stroke="#9AA5A8" strokeWidth={4} />
        </G>
      ) : (
        <G>
          <Deco p={iso(o.x + 1.6, o.y + 1.6)} env={env} />
          <Deco p={iso(o.x + 6.2, o.y + 1.8)} s={0.9} env={env} />
          <Deco p={iso(o.x + 1.8, o.y + 6.3)} s={0.8} env={env} />
        </G>
      )}
    </G>
  );
}

function ConstructionPlot({
  px,
  py,
  available,
  env,
}: {
  px: number;
  py: number;
  available: boolean;
  env: EnvDef;
}) {
  const o = plotOrigin(px, py);
  return (
    <G opacity={available ? 1 : 0.55}>
      <Polygon
        points={floorPoly(o.x, o.y, S, S)}
        fill={env.groundAlt}
        stroke={available ? '#F2B83B' : '#5E7A48'}
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      <Polygon points={floorPoly(o.x + 1, o.y + 1, S - 2, S - 2)} fill="#A89068" opacity={0.45} />
      {available ? (
        <G>
          <Box gx={o.x + 2} gy={o.y + 2} w={0.8} d={0.8} h={8} color="#C9A27A" />
          <Box gx={o.x + 2.2} gy={o.y + 3.2} w={0.6} d={1.2} h={5} color="#A07A50" />
        </G>
      ) : null}
    </G>
  );
}

function CourseDecor({
  courseId,
  ox,
  oy,
  t,
}: {
  courseId: string;
  ox: number;
  oy: number;
  t: number;
}) {
  const items: ReactElement[] = [];
  // tableau noir + bureau du professeur
  items.push(
    <WallQuad
      key="bb"
      axis="y"
      ox={ox}
      oy={oy}
      t1={2.2}
      t2={5.8}
      h1={14}
      h2={32}
      fill="#2F4A3A"
      stroke="#6B4423"
    />,
  );
  items.push(
    <Sprite
      key="desk"
      name={tiered('teacherDesk', t)}
      p={iso(ox + 1.3, oy + 4)}
      width={50}
      lift={10}
    />,
  );
  if (courseId === 'astronomy') {
    items.push(
      <WallQuad
        key="sky"
        axis="x"
        ox={ox}
        oy={oy}
        t1={1}
        t2={7}
        h1={12}
        h2={35}
        fill="#1B2350"
        stroke="#F2B83B"
      />,
    );
  } else {
    items.push(<Window key="w1" axis="x" ox={ox} oy={oy} t={1.6} />);
    items.push(<Window key="w2" axis="x" ox={ox} oy={oy} t={5.2} />);
  }
  if (t >= 1) {
    items.push(
      <Sprite
        key="shelf"
        name={tiered('bookshelf', t)}
        p={iso(ox + 0.5, oy + 7)}
        width={30}
        lift={4}
      />,
    );
    items.push(<Candle key="c1" p={iso(ox + 1.2, oy + 1)} />);
  }
  if (t >= 2) {
    items.push(
      <WallQuad
        key="ban"
        axis="x"
        ox={ox}
        oy={oy}
        t1={3.4}
        t2={4.3}
        h1={10}
        h2={34}
        fill="#C0392B"
        stroke="#F2B83B"
      />,
    );
    items.push(<Candle key="c2" p={iso(ox + 7, oy + 0.8)} />);
  }
  return <G>{items}</G>;
}

function Room({ r, env }: { r: RoomSnapshot; env: EnvDef }) {
  const def = PLOTS[r.id];
  const o = plotOrigin(def.px, def.py);
  const t = tier(r.level);
  const tiles: ReactElement[] = [];
  for (let i = 0; i < S; i += 2)
    for (let j = 0; j < S; j += 2)
      if (((i + j) / 2) % 2 === 0)
        tiles.push(
          <Polygon
            key={`${i}-${j}`}
            points={floorPoly(o.x + i, o.y + j, 2, 2)}
            fill={def.floorAlt}
          />,
        );

  const plaster = shade(env.plaster, t === 2 ? 1.12 : t === 1 ? 1.06 : 1);
  const wood = env.wood;
  const kind = r.kind === 'course' ? r.courseId! : r.kind;
  const furniture = r.seats
    .map((sp, i) => ({ i, gx: o.x + sp.x, gy: o.y + sp.y }))
    .sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

  return (
    <G>
      <BackWalls ox={o.x} oy={o.y} size={S} plaster={plaster} wood={wood} />
      <Polygon points={floorPoly(o.x, o.y, S, S)} fill={def.floor} />
      {tiles}
      {r.kind === 'course' ? <CourseDecor courseId={r.courseId!} ox={o.x} oy={o.y} t={t} /> : null}
      {r.kind === 'dorm' ? (
        <G>
          <Window axis="x" ox={o.x} oy={o.y} t={2} />
          <Window axis="x" ox={o.x} oy={o.y} t={5} />
          <Window axis="y" ox={o.x} oy={o.y} t={3.4} />
          {t >= 1 ? (
            <Polygon points={floorPoly(o.x + 2.5, o.y + 2.5, 3, 3)} fill="#B5524A" opacity={0.7} />
          ) : null}
        </G>
      ) : null}
      {r.kind === 'hall' ? (
        <G>
          {HOUSE_IDS.map((h, i) => (
            <WallQuad
              key={h}
              axis="x"
              ox={o.x}
              oy={o.y}
              t1={0.8 + i * 1.8}
              t2={1.7 + i * 1.8}
              h1={8}
              h2={34}
              fill={HOUSES[h].color}
              stroke="#F2B83B"
            />
          ))}
          <Sprite name="fireplace" p={iso(o.x + 0.6, o.y + 4.3)} width={44} lift={6} />
          {[0, 1, 2, 3, 4].flatMap((row) =>
            [2.2, 5.7].map((gy) => (
              <Sprite
                key={`${row}-${gy}`}
                name={tiered('table', t)}
                p={iso(o.x + 1.26 + row * 1.35, o.y + gy + 1.2)}
                width={66}
                lift={8}
              />
            )),
          )}
        </G>
      ) : null}
      {r.kind === 'reception' ? (
        <G>
          <Sprite name={tiered('bookshelf', t)} p={iso(o.x + 0.5, o.y + 2.2)} width={30} lift={4} />
          <Sprite name={tiered('bookshelf', t)} p={iso(o.x + 0.5, o.y + 6.2)} width={30} lift={4} />
          <Window axis="x" ox={o.x} oy={o.y} t={3} />
          <Polygon points={floorPoly(o.x + 4.4, o.y + 2.5, 3, 3)} fill="#8C2F39" opacity={0.75} />
        </G>
      ) : null}
      {r.kind === 'sorting' ? (
        <G>
          {HOUSE_IDS.map((h, i) => (
            <WallQuad
              key={h}
              axis={i < 2 ? 'x' : 'y'}
              ox={o.x}
              oy={o.y}
              t1={1.5 + (i % 2) * 3.5}
              t2={2.6 + (i % 2) * 3.5}
              h1={8}
              h2={34}
              fill={HOUSES[h].color}
              stroke="#F2B83B"
            />
          ))}
          <Ellipse
            cx={iso(o.x + 4, o.y + 4).x}
            cy={iso(o.x + 4, o.y + 4).y}
            rx={46}
            ry={23}
            fill="#7A63B0"
            stroke="#F2B83B"
            strokeWidth={2}
          />
          <Box gx={o.x + 3.6} gy={o.y + 3.6} w={0.8} d={0.8} h={10} color="#8A5A34" />
          <Candle p={iso(o.x + 1, o.y + 1)} />
          <Candle p={iso(o.x + 1, o.y + 7)} />
          <Candle p={iso(o.x + 7, o.y + 1)} />
        </G>
      ) : null}
      {furniture.map((f) => (
        <Furniture
          key={f.i}
          kind={kind}
          at={iso(f.gx, f.gy)}
          gx={f.gx}
          gy={f.gy}
          tier={r.seatTiers[f.i] ?? 0}
        />
      ))}
      <FrontLips ox={o.x} oy={o.y} size={S} wood={shade(wood, 1.1)} />
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
        el: <ConstructionPlot key={pl.id} px={p.px} py={p.py} available={pl.available} env={env} />,
      });
  }
  GARDENS.forEach((g, i) =>
    items.push({
      order: g.px + g.py,
      el: <Garden key={`g${i}`} px={g.px} py={g.py} fountain={i === 0} env={env} />,
    }),
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
