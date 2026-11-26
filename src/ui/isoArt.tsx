/**
 * Primitives de dessin isométrique (SVG) : boîtes, murs, meubles.
 * Tout est dessiné en code — placeholders cohérents en attendant les sprites.
 */
import { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { ISO } from '../data/layout';
import { iso, poly, type Pt } from './iso';

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const up = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });

/** Boîte isométrique : (gx,gy) coin arrière, w le long de x, d le long de y, h en px. */
export function Box({
  gx,
  gy,
  w,
  d,
  h,
  color,
  k,
}: {
  gx: number;
  gy: number;
  w: number;
  d: number;
  h: number;
  color: string;
  k?: string;
}) {
  const a = iso(gx, gy);
  const b = iso(gx + w, gy);
  const c = iso(gx + w, gy + d);
  const e = iso(gx, gy + d);
  return (
    <G key={k}>
      <Polygon points={poly([e, c, up(c, h), up(e, h)])} fill={shade(color, 0.78)} />
      <Polygon points={poly([b, c, up(c, h), up(b, h)])} fill={shade(color, 0.62)} />
      <Polygon
        points={poly([up(a, h), up(b, h), up(c, h), up(e, h)])}
        fill={color}
        stroke={shade(color, 0.5)}
        strokeWidth={0.6}
      />
    </G>
  );
}

/** Quadrilatère posé sur un mur arrière. axis 'x' : mur le long de x (à gy fixe) ; 'y' : le long de y. */
export function WallQuad({
  axis,
  ox,
  oy,
  t1,
  t2,
  h1,
  h2,
  fill,
  stroke,
}: {
  axis: 'x' | 'y';
  ox: number;
  oy: number;
  t1: number;
  t2: number;
  h1: number;
  h2: number;
  fill: string;
  stroke?: string;
}) {
  const p1 = axis === 'x' ? iso(ox + t1, oy) : iso(ox, oy + t1);
  const p2 = axis === 'x' ? iso(ox + t2, oy) : iso(ox, oy + t2);
  return (
    <Polygon
      points={poly([up(p1, h1), up(p2, h1), up(p2, h2), up(p1, h2)])}
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke ? 1 : 0}
    />
  );
}

/** Les deux murs arrière d'une salle, avec lambris et chapeau de mur. */
export function BackWalls({
  ox,
  oy,
  size,
  plaster,
  wood,
}: {
  ox: number;
  oy: number;
  size: number;
  plaster: string;
  wood: string;
}) {
  const H = ISO.wallH;
  return (
    <G>
      <WallQuad
        axis="x"
        ox={ox}
        oy={oy}
        t1={0}
        t2={size}
        h1={0}
        h2={H}
        fill={shade(plaster, 0.86)}
      />
      <WallQuad axis="y" ox={ox} oy={oy} t1={0} t2={size} h1={0} h2={H} fill={plaster} />
      <WallQuad axis="x" ox={ox} oy={oy} t1={0} t2={size} h1={0} h2={12} fill={shade(wood, 0.85)} />
      <WallQuad axis="y" ox={ox} oy={oy} t1={0} t2={size} h1={0} h2={12} fill={wood} />
      <WallQuad
        axis="x"
        ox={ox}
        oy={oy}
        t1={0}
        t2={size}
        h1={H - 3}
        h2={H}
        fill={shade(wood, 0.6)}
      />
      <WallQuad
        axis="y"
        ox={ox}
        oy={oy}
        t1={0}
        t2={size}
        h1={H - 3}
        h2={H}
        fill={shade(wood, 0.7)}
      />
    </G>
  );
}

/** Murets avant (coupe) : simple rebord pour délimiter la salle. */
export function FrontLips({
  ox,
  oy,
  size,
  wood,
}: {
  ox: number;
  oy: number;
  size: number;
  wood: string;
}) {
  const door = size / 2;
  return (
    <G>
      <Box gx={ox + size - 0.15} gy={oy} w={0.15} d={door - 0.7} h={6} color={wood} />
      <Box gx={ox + size - 0.15} gy={oy + door + 0.7} w={0.15} d={door - 0.7} h={6} color={wood} />
      <Box gx={ox} gy={oy + size - 0.15} w={size} d={0.15} h={6} color={wood} />
    </G>
  );
}

export function Window({
  axis,
  ox,
  oy,
  t,
}: {
  axis: 'x' | 'y';
  ox: number;
  oy: number;
  t: number;
}) {
  return (
    <G>
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t}
        t2={t + 1.1}
        h1={16}
        h2={33}
        fill="#9FC9E8"
        stroke="#5A3A22"
      />
      <WallQuad
        axis={axis}
        ox={ox}
        oy={oy}
        t1={t + 0.52}
        t2={t + 0.58}
        h1={16}
        h2={33}
        fill="#5A3A22"
      />
    </G>
  );
}

export function Candle({ p }: { p: Pt }) {
  return (
    <G>
      <Circle cx={p.x} cy={p.y - 4} r={6} fill="#FFD86B" opacity={0.25} />
      <Line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 5} stroke="#F6E9CC" strokeWidth={2} />
      <Circle cx={p.x} cy={p.y - 6} r={1.6} fill="#FFB347" />
    </G>
  );
}

export function Tree({ p, s = 1 }: { p: Pt; s?: number }) {
  return (
    <G>
      <Ellipse cx={p.x} cy={p.y} rx={10 * s} ry={5 * s} fill="rgba(0,0,0,0.18)" />
      <Path
        d={`M${p.x - 2 * s} ${p.y} L${p.x - 2 * s} ${p.y - 14 * s} L${p.x + 2 * s} ${p.y - 14 * s} L${p.x + 2 * s} ${p.y} Z`}
        fill="#6B4423"
      />
      <Circle cx={p.x} cy={p.y - 24 * s} r={13 * s} fill="#3F7D3A" />
      <Circle cx={p.x - 6 * s} cy={p.y - 20 * s} r={8 * s} fill="#4E9446" />
      <Circle cx={p.x + 6 * s} cy={p.y - 28 * s} r={6 * s} fill="#5FA857" />
    </G>
  );
}

/** Meuble associé à une place, selon le type de lieu / matière. */
export function Furniture({
  kind,
  at,
  gx,
  gy,
  blanket,
}: {
  kind: string;
  at: Pt;
  gx: number;
  gy: number;
  blanket: string;
}) {
  const p = at;
  switch (kind) {
    case 'potions':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y + 2} rx={9} ry={4} fill="#E8742E" opacity={0.6} />
          <Path
            d={`M${p.x - 10} ${p.y - 8} Q${p.x - 11} ${p.y + 4} ${p.x} ${p.y + 4} Q${p.x + 11} ${p.y + 4} ${p.x + 10} ${p.y - 8} Z`}
            fill="#2D2B36"
          />
          <Ellipse cx={p.x} cy={p.y - 8} rx={10} ry={4.5} fill="#3B3946" />
          <Ellipse cx={p.x} cy={p.y - 8} rx={8} ry={3.2} fill="#7EE08F" />
          <Circle cx={p.x + 3} cy={p.y - 12} r={2} fill="#B8F5C1" opacity={0.8} />
        </G>
      );
    case 'botany':
      return (
        <G>
          <Box gx={gx - 0.3} gy={gy - 0.3} w={0.6} d={0.6} h={8} color="#C0673A" />
          <Circle cx={p.x} cy={p.y - 14} r={7} fill="#3E8E41" />
          <Circle cx={p.x - 5} cy={p.y - 11} r={4.5} fill="#56A95A" />
          <Circle cx={p.x + 4} cy={p.y - 17} r={3.5} fill="#F28DB2" />
        </G>
      );
    case 'charms':
      return (
        <G>
          <Ellipse
            cx={p.x}
            cy={p.y}
            rx={14}
            ry={7}
            fill="#7E5BB5"
            stroke="#F2B83B"
            strokeWidth={1.5}
          />
          <Ellipse cx={p.x} cy={p.y - 2} rx={9} ry={4.5} fill="#9A7AD0" />
        </G>
      );
    case 'astronomy':
      return (
        <G>
          <Line
            x1={p.x - 5}
            y1={p.y + 2}
            x2={p.x}
            y2={p.y - 8}
            stroke="#5A3A22"
            strokeWidth={1.5}
          />
          <Line
            x1={p.x + 5}
            y1={p.y + 2}
            x2={p.x}
            y2={p.y - 8}
            stroke="#5A3A22"
            strokeWidth={1.5}
          />
          <Line
            x1={p.x - 6}
            y1={p.y - 4}
            x2={p.x + 9}
            y2={p.y - 16}
            stroke="#C9A227"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </G>
      );
    case 'flying':
      return (
        <G>
          <Line
            x1={p.x - 10}
            y1={p.y - 6}
            x2={p.x + 6}
            y2={p.y - 12}
            stroke="#8A5A34"
            strokeWidth={2.5}
          />
          <Path
            d={`M${p.x + 5} ${p.y - 12} L${p.x + 14} ${p.y - 18} L${p.x + 15} ${p.y - 10} Z`}
            fill="#D9B45A"
          />
          <Ellipse cx={p.x} cy={p.y + 1} rx={8} ry={3} fill="rgba(0,0,0,0.15)" />
        </G>
      );
    case 'divination':
      return (
        <G>
          <Box gx={gx - 0.35} gy={gy - 0.35} w={0.7} d={0.7} h={9} color="#6B3E6B" />
          <Circle cx={p.x} cy={p.y - 15} r={5} fill="#BFE6FF" stroke="#FFFFFF" strokeWidth={1} />
          <Circle cx={p.x - 1.5} cy={p.y - 16.5} r={1.5} fill="#FFFFFF" />
        </G>
      );
    case 'transfiguration':
      return <Box gx={gx - 0.4} gy={gy - 0.4} w={0.8} d={0.8} h={10} color="#9AA5A8" />;
    case 'defense':
      return (
        <G>
          <Ellipse cx={p.x} cy={p.y} rx={14} ry={7} fill="none" stroke="#E0553B" strokeWidth={2} />
          <Ellipse
            cx={p.x}
            cy={p.y}
            rx={9}
            ry={4.5}
            fill="none"
            stroke="#F2B83B"
            strokeWidth={1.2}
            strokeDasharray="2 2"
          />
        </G>
      );
    case 'dorm':
      return (
        <G>
          <Box gx={gx - 0.65} gy={gy - 0.45} w={1.3} d={0.9} h={7} color="#7A4E2D" />
          <Polygon
            points={poly(
              [
                iso(gx - 0.25, gy - 0.45),
                iso(gx + 0.65, gy - 0.45),
                iso(gx + 0.65, gy + 0.45),
                iso(gx - 0.25, gy + 0.45),
              ].map((q) => ({ x: q.x, y: q.y - 8 })),
            )}
            fill={blanket}
          />
          <Box gx={gx - 0.6} gy={gy - 0.35} w={0.32} d={0.7} h={10} color="#F6F1E4" />
        </G>
      );
    case 'reception':
      return (
        <G>
          <Box gx={gx - 1.1} gy={gy - 0.45} w={0.55} d={0.9} h={14} color="#8A5A34" />
          <Circle cx={iso(gx - 0.8, gy).x} cy={iso(gx - 0.8, gy).y - 16} r={2} fill="#F2B83B" />
        </G>
      );
    case 'sorting':
      return <Box gx={gx - 0.25} gy={gy - 0.25} w={0.5} d={0.5} h={6} color="#8A5A34" />;
    case 'hall':
      return null;
    case 'history':
    default:
      return (
        <G>
          <Box gx={gx - 0.65} gy={gy - 0.4} w={0.5} d={0.8} h={10} color="#9C6B44" />
          <Polygon
            points={poly(
              [
                iso(gx - 0.55, gy - 0.25),
                iso(gx - 0.3, gy - 0.25),
                iso(gx - 0.3, gy + 0.2),
                iso(gx - 0.55, gy + 0.2),
              ].map((q) => ({ x: q.x, y: q.y - 10.5 })),
            )}
            fill="#FFF6E0"
          />
        </G>
      );
  }
}
