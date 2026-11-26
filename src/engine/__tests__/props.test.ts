import { COURSE_PROPS } from '../../data/roomProps';
import { buyProp, propCost } from '../actions';
import { courseReward, propCoinMult } from '../modifiers';
import { createGame } from '../state';

describe('mobilier spécial des salles', () => {
  it('le décor de base est gratuit, les meubles à débloquer coûtent des Éclats', () => {
    const g = createGame();
    const st = g.stations['course-potions'];
    const [free, first] = COURSE_PROPS.potions;
    expect(propCost(st, free.id)).toBeNull();
    expect(propCost(st, first.id)).toBe(first.cost);
  });

  it('achat : débite, installe une seule fois et augmente les gains de la salle', () => {
    const g = createGame();
    const st = g.stations['course-potions'];
    const prop = COURSE_PROPS.potions[1];
    const student = { house: null, mood: 100 };
    const before = courseReward(st, student);
    g.coins = 0;
    expect(buyProp(g, st.id, prop.id)).toBe(false);
    g.coins = prop.cost!;
    expect(buyProp(g, st.id, prop.id)).toBe(true);
    expect(g.coins).toBe(0);
    expect(st.props).toEqual([prop.id]);
    expect(propCost(st, prop.id)).toBeNull();
    g.coins = 1e9;
    expect(buyProp(g, st.id, prop.id)).toBe(false);
    expect(propCoinMult(st)).toBeCloseTo(1 + prop.coinBonus!);
    expect(courseReward(st, student)).toBeGreaterThanOrEqual(before);
  });

  it('chaque matière a du décor et deux meubles à débloquer', () => {
    for (const list of Object.values(COURSE_PROPS)) {
      expect(list.some((p) => !p.cost)).toBe(true);
      expect(list.filter((p) => p.cost).length).toBe(2);
    }
  });
});
