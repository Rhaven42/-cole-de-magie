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

describe('professeur·es', () => {
  it('améliorer un prof : plus rapide, plus rentable, coût croissant, niveau max', () => {
    const { profUpgradeCost, upgradeProf } = jest.requireActual('../actions');
    const { serviceTime } = jest.requireActual('../modifiers');
    const g = createGame();
    const st = g.stations['course-potions'];
    const who = { house: null, mood: 100 };
    const t1 = serviceTime(st, 0, undefined, g);
    const r1 = courseReward(st, who, g);
    expect(profUpgradeCost(g, 'charms')).toBeNull(); // salle non construite
    g.coins = 1e12;
    const c1 = profUpgradeCost(g, 'potions');
    expect(upgradeProf(g, 'potions')).toBe(true);
    expect(profUpgradeCost(g, 'potions')).toBeGreaterThan(c1);
    expect(serviceTime(st, 0, undefined, g)).toBeLessThan(t1);
    expect(courseReward(st, who, g)).toBeGreaterThanOrEqual(r1);
    while (upgradeProf(g, 'potions'));
    expect(g.profLevels?.potions).toBe(10);
    expect(profUpgradeCost(g, 'potions')).toBeNull();
  });
});

describe('pause repas', () => {
  it('toutes les 20 min, les cours s’arrêtent pendant que les profs mangent', () => {
    const { isMealBreak, MEAL_BREAK } = jest.requireActual('../../data/progression');
    expect(isMealBreak(0)).toBe(false);
    expect(isMealBreak(MEAL_BREAK.every - 10)).toBe(true);
    expect(isMealBreak(MEAL_BREAK.every + 10)).toBe(false);
    const { tick } = jest.requireActual('../tick');
    const g = createGame();
    g.arrivalTimer = -1e9;
    const st = g.stations['course-potions'];
    st.seats[0].occupant = -5;
    st.seats[0].remaining = 50;
    g.time = MEAL_BREAK.every - MEAL_BREAK.duration + 1;
    tick(g, 1);
    expect(st.seats[0].remaining).toBe(50);
  });
});
