/**
 * Textures projetées en isométrique (sols et murs) et effets de relief :
 * ombres portées, occlusion au pied des murs, lumière des fenêtres.
 */
import type { ReactElement } from 'react';
import {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Polygon,
  Stop,
} from 'react-native-svg';
import { TEXTURES, type TextureName } from '../assets';
import { ISO } from '../data/layout';
import { floorPoly, iso, OFFSET_X, OFFSET_Y, poly, type Pt } from './iso';

const TW = ISO.tileW / 2;
const TH = ISO.tileH / 2;

/** Sol texturé : rectangle de grille (gx, gy, w, h) rempli de tuiles de texture. */
export function TexFloor({
  id,
  gx,
  gy,
  w,
  h,
  tex,
  tile,
  tint,
  tintOpacity = 0,
}: {
  id: string;
  gx: number;
  gy: number;
  w: number;
  h: number;
  tex: TextureName;
  tile: number;
  tint?: string;
  tintOpacity?: number;
}) {
  const imgs: ReactElement[] = [];
  const u0 = Math.floor(gx / tile) * tile;
  const v0 = Math.floor(gy / tile) * tile;
  for (let u = u0; u < gx + w; u += tile)
    for (let v = v0; v < gy + h; v += tile)
      imgs.push(
        <SvgImage
          key={`${u}-${v}`}
          href={TEXTURES[tex].src}
          x={u}
          y={v}
          width={tile + 0.03}
          height={tile + 0.03}
          preserveAspectRatio="none"
        />,
      );
  const pts = floorPoly(gx, gy, w, h);
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Polygon points={pts} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <G transform={`matrix(${TW} ${TH} ${-TW} ${TH} ${OFFSET_X} ${OFFSET_Y})`}>{imgs}</G>
        {tint && tintOpacity > 0 ? (
          <Polygon points={pts} fill={tint} opacity={tintOpacity} />
        ) : null}
      </G>
    </G>
  );
}

/**
 * Mur texturé. axis 'x' : mur le long de x à y = oy (côté droit, face au bas-gauche) ;
 * axis 'y' : le long de y à x = ox (côté gauche, face au bas-droit).
 */
export function TexWall({
  id,
  axis,
  ox,
  oy,
  len,
  height,
  texHeight,
  shadeOpacity,
  tint,
  tintOpacity = 0,
}: {
  id: string;
  axis: 'x' | 'y';
  ox: number;
  oy: number;
  len: number;
  height: number;
  /** Hauteur réelle de la texture (le mur bas n'en montre que le bas : le lambris). */
  texHeight?: number;
  shadeOpacity: number;
  tint?: string;
  tintOpacity?: number;
}) {
  const a = iso(ox, oy);
  const b = axis === 'x' ? iso(ox + len, oy) : iso(ox, oy + len);
  const pts = poly([a, b, { x: b.x, y: b.y - height }, { x: a.x, y: a.y - height }]);
  const matrix =
    axis === 'x'
      ? `matrix(${TW} ${TH} 0 1 ${OFFSET_X - oy * TW} ${OFFSET_Y + oy * TH})`
      : `matrix(${-TW} ${TH} 0 1 ${OFFSET_X + ox * TW} ${OFFSET_Y + ox * TH})`;
  const start = axis === 'x' ? ox : oy;
  // Largeur d'une tuile de mur (en cases) pour garder la texture à peu près carrée.
  const th = texHeight ?? height;
  const L = th / Math.hypot(TW, TH);
  const imgs: ReactElement[] = [];
  for (let u = start; u < start + len; u += L)
    imgs.push(
      <SvgImage
        key={u}
        href={TEXTURES.wall.src}
        x={u}
        y={-th}
        width={L + 0.02}
        height={th}
        preserveAspectRatio="none"
      />,
    );
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Polygon points={pts} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        <G transform={matrix}>{imgs}</G>
        {tint && tintOpacity > 0 ? (
          <Polygon points={pts} fill={tint} opacity={tintOpacity} />
        ) : null}
        <Polygon points={pts} fill="#000" opacity={shadeOpacity} />
      </G>
    </G>
  );
}

/** Bande d'ombre (occlusion) sur le sol au pied d'un mur arrière. */
export function WallShadow({
  id,
  axis,
  ox,
  oy,
  len,
  depth = 1.3,
}: {
  id: string;
  axis: 'x' | 'y';
  ox: number;
  oy: number;
  len: number;
  depth?: number;
}) {
  const quad =
    axis === 'x'
      ? [iso(ox, oy), iso(ox + len, oy), iso(ox + len, oy + depth), iso(ox, oy + depth)]
      : [iso(ox, oy), iso(ox + depth, oy), iso(ox + depth, oy + len), iso(ox, oy + len)];
  const from = iso(ox, oy);
  const to = axis === 'x' ? iso(ox, oy + depth) : iso(ox + depth, oy);
  return (
    <G>
      <Defs>
        <LinearGradient
          id={id}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#000" stopOpacity={0.38} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Polygon points={poly(quad)} fill={`url(#${id})`} />
    </G>
  );
}

/** Tache de lumière au sol devant une fenêtre (mur 'x' ou 'y', à la position t). */
export function WindowLight({
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
  const q: Pt[] =
    axis === 'x'
      ? [
          iso(ox + t, oy),
          iso(ox + t + 1.1, oy),
          iso(ox + t + 1.9, oy + 2.4),
          iso(ox + t + 0.8, oy + 2.4),
        ]
      : [
          iso(ox, oy + t),
          iso(ox, oy + t + 1.1),
          iso(ox + 2.4, oy + t + 1.9),
          iso(ox + 2.4, oy + t + 0.8),
        ];
  return <Polygon points={poly(q)} fill="#FFF4D6" opacity={0.16} />;
}
