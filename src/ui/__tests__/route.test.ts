import { PLOT } from '../../data/layout';
import { CORRIDOR_X, CORRIDOR_Y, doorOf, gatePoint, route, stationOrigin } from '../iso';

/** Un point est « dans une salle » s'il est strictement à l'intérieur d'une parcelle. */
function insideSomeRoom(p: { x: number; y: number }, except: string[]): boolean {
  for (const id of ['reception', 'sorting', 'hall', 'course-potions', 'course-botany', 'dorm-0']) {
    if (except.includes(id)) continue;
    const o = stationOrigin(id)!;
    if (
      p.x > o.x + 0.05 &&
      p.x < o.x + PLOT.size - 0.05 &&
      p.y > o.y + 0.05 &&
      p.y < o.y + PLOT.size - 0.05
    )
      return true;
  }
  return false;
}

describe('déplacements par les couloirs', () => {
  it('passe par la porte de départ puis celle d’arrivée', () => {
    const a = stationOrigin('course-potions')!;
    const b = stationOrigin('dorm-0')!;
    const pts = route(
      { g: { x: a.x + 3, y: a.y + 3 }, room: 'course-potions' },
      { g: { x: b.x + 2, y: b.y + 2 }, room: 'dorm-0' },
    );
    const d1 = doorOf('course-potions')!;
    const d2 = doorOf('dorm-0')!;
    expect(pts[0]).toEqual(d1.inside);
    expect(pts[1]).toEqual(d1.outside);
    expect(pts).toContainEqual(d2.outside);
    expect(pts[pts.length - 2]).toEqual(d2.inside);
    // Chaque segment de couloir est axial (pas de diagonale à travers les salles)
    const corridor = pts.slice(1, pts.length - 2);
    for (let i = 1; i < corridor.length; i++) {
      const p = corridor[i - 1];
      const q = corridor[i];
      expect(Math.abs(p.x - q.x) < 0.01 || Math.abs(p.y - q.y) < 0.01).toBe(true);
    }
    // Les points de couloir sont sur les axes des couloirs
    for (const p of corridor)
      expect(CORRIDOR_X.includes(p.x) || CORRIDOR_Y.includes(p.y)).toBe(true);
    // Les points intermédiaires ne sont dans aucune autre salle
    for (const p of corridor) expect(insideSomeRoom(p, ['course-potions', 'dorm-0'])).toBe(false);
  });

  it('dans une même salle : déplacement direct', () => {
    const o = stationOrigin('hall')!;
    expect(
      route(
        { g: { x: o.x + 1, y: o.y + 1 }, room: 'hall' },
        { g: { x: o.x + 2, y: o.y + 2 }, room: 'hall' },
      ),
    ).toHaveLength(1);
  });

  it('depuis la grille d’entrée jusqu’à la file de l’Accueil', () => {
    const d = doorOf('reception')!;
    const pts = route(
      { g: gatePoint(), room: null },
      { g: { x: d.outside.x, y: d.outside.y + 1 }, room: null },
    );
    expect(pts.length).toBeGreaterThan(0);
    expect(pts[pts.length - 1]).toEqual({ x: d.outside.x, y: d.outside.y + 1 });
  });

  it('de l’Accueil au Chaporacle : passage direct par la porte du fond', () => {
    const r = stationOrigin('reception')!;
    const so = stationOrigin('sorting')!;
    const target = { x: so.x + 5, y: so.y + 4 };
    const pts = route(
      { g: { x: r.x + 17, y: r.y + 5 }, room: 'reception' },
      { g: target, room: 'sorting' },
    );
    expect(pts.length).toBeLessThanOrEqual(4);
    expect(pts.every((p, i) => i === pts.length - 1 || Math.abs(p.x - pts[0].x) < 0.01)).toBe(true);
    expect(pts[pts.length - 1]).toEqual(target);
  });
});
