import { memo, type ReactElement } from 'react';
import Svg, { Ellipse, G, Line, Polygon } from 'react-native-svg';
import { HOUSE_IDS, HOUSES } from '../data/houses';
import { GARDENS, ISO, PLOT, PLOTS } from '../data/layout';
import type { Station } from '../engine';
import {
  BackWalls,
  Box,
  Candle,
  Furniture,
  FrontLips,
  shade,
  Tree,
  Window,
  WallQuad,
} from './isoArt';
import { floorPoly, GRID_X, GRID_Y, iso, MAP_H, MAP_W, plotOrigin, seatSpot } from './iso';

const S = PLOT.size;
const BLANKETS = ['#C0392B', '#1E8449', '#F4C430', '#2471A3'];

export interface RoomSnapshot {
  id: string;
  kind: Station['kind'];
  courseId?: string;
  level: number;
  seats: number;
}

function tier(level: number): number {
  return level >= 8 ? 2 : level >= 4 ? 1 : 0;
}

function Ground() {
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
      <Line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9A6B3F" strokeWidth={0.6} />,
    );
  }
  // Chemin d'entrée vers la grille
  const rec = plotOrigin(4, 3);
  return (
    <G>
      <Polygon points={floorPoly(0, 0, GRID_X, GRID_Y)} fill="#6FA552" />
      <Polygon
        points={floorPoly(
          school0.x - pad - 0.4,
          school0.y - pad - 0.4,
          w + 2 * pad + 0.8,
          h + 2 * pad + 0.8,
        )}
        fill="#7A4A2A"
      />
      <Polygon
        points={floorPoly(school0.x - pad, school0.y - pad, w + 2 * pad, h + 2 * pad)}
        fill="#B07A4A"
      />
      {lines}
      <Polygon
        points={floorPoly(rec.x + S + pad, rec.y + 1, GRID_X - rec.x - S - pad, 3)}
        fill="#CDB892"
      />
      <Polygon
        points={floorPoly(rec.x + S + pad, rec.y + 1.4, GRID_X - rec.x - S - pad, 2.2)}
        fill="#D9C7A3"
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
        <Tree key={i} p={iso(x, y)} s={1.1} />
      ))}
    </G>
  );
}

function Garden({ px, py, fountain }: { px: number; py: number; fountain: boolean }) {
  const o = plotOrigin(px, py);
  const c = iso(o.x + S / 2, o.y + S / 2);
  return (
    <G>
      <Polygon points={floorPoly(o.x, o.y, S, S)} fill="#7DB35C" />
      <Polygon points={floorPoly(o.x + 3.4, o.y, 1.2, S)} fill="#D9C7A3" />
      <Polygon points={floorPoly(o.x, o.y + 3.4, S, 1.2)} fill="#D9C7A3" />
      {fountain ? (
        <G>
          <Ellipse cx={c.x} cy={c.y} rx={34} ry={17} fill="#9AA5A8" />
          <Ellipse cx={c.x} cy={c.y - 2} rx={28} ry={13} fill="#6EC3E8" />
          <Ellipse cx={c.x} cy={c.y - 14} rx={6} ry={3} fill="#BFE6FF" />
          <Line x1={c.x} y1={c.y - 4} x2={c.x} y2={c.y - 16} stroke="#9AA5A8" strokeWidth={4} />
        </G>
      ) : (
        <G>
          <Tree p={iso(o.x + 1.6, o.y + 1.6)} />
          <Tree p={iso(o.x + 6.2, o.y + 1.8)} s={0.9} />
          <Tree p={iso(o.x + 1.8, o.y + 6.3)} s={0.8} />
        </G>
      )}
    </G>
  );
}

function ConstructionPlot({ px, py, available }: { px: number; py: number; available: boolean }) {
  const o = plotOrigin(px, py);
  return (
    <G opacity={available ? 1 : 0.55}>
      <Polygon
        points={floorPoly(o.x, o.y, S, S)}
        fill="#8FB36E"
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
  items.push(<Box key="desk" gx={ox + 0.9} gy={oy + 3.1} w={0.8} d={1.8} h={12} color="#7A4E2D" />);
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
      <Box key="shelf" gx={ox + 0.1} gy={oy + 6.4} w={0.6} d={1.4} h={30} color="#5A3A22" />,
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

function Room({ r }: { r: RoomSnapshot }) {
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

  const plaster = t === 2 ? '#F3E3C3' : t === 1 ? '#E9D6B0' : '#D8C49C';
  const wood = '#6B4423';
  const kind = r.kind === 'course' ? r.courseId! : r.kind;
  const furniture = Array.from({ length: r.seats }, (_, i) => {
    const sp = seatSpot(r.kind, i);
    return { i, gx: o.x + sp.x, gy: o.y + sp.y };
  }).sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

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
          <WallQuad
            axis="y"
            ox={o.x}
            oy={o.y}
            t1={3}
            t2={5}
            h1={0}
            h2={22}
            fill="#3B2414"
            stroke="#8A5A34"
          />
          <WallQuad axis="y" ox={o.x} oy={o.y} t1={3.3} t2={4.7} h1={2} h2={12} fill="#FF8C3A" />
          {[0, 1, 2, 3, 4].map((row) => (
            <Box
              key={row}
              gx={o.x + 1.05 + row * 1.35}
              gy={o.y + 0.5}
              w={0.42}
              d={7}
              h={9}
              color="#8A5A34"
            />
          ))}
        </G>
      ) : null}
      {r.kind === 'reception' ? (
        <G>
          <Box gx={o.x + 0.1} gy={o.y + 1} w={0.7} d={6} h={30} color="#5A3A22" />
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
          blanket={BLANKETS[f.i % 4]}
        />
      ))}
      <FrontLips ox={o.x} oy={o.y} size={S} wood={shade(wood, 1.1)} />
    </G>
  );
}

interface Props {
  rooms: RoomSnapshot[];
  /** Parcelles de construction proposées (id → achetable maintenant). */
  plots: { id: string; available: boolean }[];
}

function MapArtBase({ rooms, plots }: Props) {
  const items: { order: number; el: ReactElement }[] = [];
  for (const r of rooms) {
    const p = PLOTS[r.id];
    if (p) items.push({ order: p.px + p.py, el: <Room key={r.id} r={r} /> });
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
      el: <Garden key={`g${i}`} px={g.px} py={g.py} fountain={i === 0} />,
    }),
  );
  items.sort((a, b) => a.order - b.order);
  return (
    <Svg width={MAP_W} height={MAP_H}>
      <Ground />
      {items.map((x) => x.el)}
    </Svg>
  );
}

/** Carte statique : redessinée seulement quand le plan change (achat, niveau, places). */
export const MapArt = memo(MapArtBase, (a, b) => JSON.stringify(a) === JSON.stringify(b));

export const ISO_WALL = ISO.wallH;
