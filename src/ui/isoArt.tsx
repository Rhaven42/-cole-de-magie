/**
 * Primitives de dessin isométrique (SVG) : boîtes, murs, meubles.
 * Tout est dessiné en code — placeholders cohérents en attendant les sprites.
 */
import { Circle, Ellipse, G, Image as SvgImage, Line, Path, Polygon } from 'react-native-svg';
import { SPRITES, type SpriteName } from '../assets';
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

/** Variante d'un sprite selon le palier d'évolution (0 de base, 1 amélioré, 2 légendaire). */
export function tiered(name: SpriteName, tier: number): SpriteName {
  if (tier <= 0) return name;
  const v = `${name}-${tier + 1}` as SpriteName;
  return v in SPRITES ? v : name;
}

/** Sprite posé au sol : (p) = point au sol, ancré en bas au centre. */
export function Sprite({
  name,
  p,
  width,
  lift = 0,
}: {
  name: SpriteName;
  p: Pt;
  width: number;
  lift?: number;
}) {
  const d = SPRITES[name];
  const h = (width * d.h) / d.w;
  return <SvgImage href={d.src} x={p.x - width / 2} y={p.y - h + lift} width={width} height={h} />;
}

/** Meuble (sprite) associé à une place, selon le type de lieu / matière. */
const SEAT_SPRITES: Record<string, { name: SpriteName; width: number; lift: number }> = {
  potions: { name: 'cauldron', width: 34, lift: 6 },
  botany: { name: 'plant', width: 26, lift: 4 },
  history: { name: 'desk', width: 40, lift: 8 },
  charms: { name: 'stage', width: 44, lift: 9 },
  astronomy: { name: 'telescope', width: 30, lift: 4 },
  flying: { name: 'broom', width: 46, lift: 6 },
  divination: { name: 'crystal', width: 32, lift: 6 },
  transfiguration: { name: 'podium', width: 26, lift: 6 },
  defense: { name: 'dummy', width: 30, lift: 6 },
  duel: { name: 'duelCircle', width: 54, lift: 12 },
  dorm: { name: 'bed', width: 46, lift: 12 },
  reception: { name: 'counter', width: 44, lift: 10 },
  sorting: { name: 'stool', width: 18, lift: 4 },
  exam: { name: 'desk', width: 40, lift: 8 },
};

export function Furniture({
  kind,
  at,
  gx,
  gy,
  tier = 0,
}: {
  kind: string;
  at: Pt;
  gx: number;
  gy: number;
  tier?: number;
}) {
  const sp = SEAT_SPRITES[kind];
  if (!sp) return null;
  // Le comptoir de l'Accueil est devant l'élève (côté mur arrière).
  // Le comptoir de l'Accueil est derrière l'élève, côté fond de la salle.
  const p = kind === 'reception' ? iso(gx, gy - 1.1) : kind === 'dorm' ? iso(gx, gy) : at;
  return <Sprite name={tiered(sp.name, tier)} p={p} width={sp.width} lift={sp.lift} />;
}
