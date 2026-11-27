import { ECONOMY } from '../../data/economy';
import { applyTime, comfortReduction, expCost, TIME_FLOOR } from '../../data/formulas';
import { createGame } from '../state';
import {
  serviceTime,
  levelTimeMult,
  reputationStars,
  populationCap,
  arrivalInterval,
  estimatedWait,
} from '../modifiers';

describe('formules', () => {
  it('plafonne la réduction de confort à 50 %', () => {
    expect(comfortReduction(10)).toBeCloseTo(0.2);
    expect(comfortReduction(1000)).toBe(0.5);
    expect(comfortReduction(-5)).toBe(0);
  });

  it('applique un plancher de 25 % du temps de base', () => {
    expect(applyTime(100, [0.5, 0.9])).toBeCloseTo(45);
    expect(applyTime(100, [0.1, 0.1])).toBe(100 * TIME_FLOOR);
  });

  it('coût exponentiel', () => {
    expect(expCost(100, 1.55, 0)).toBe(100);
    expect(expCost(100, 1.55, 2)).toBe(240);
  });

  it('le niveau de salle réduit le temps de 4 % par niveau', () => {
    expect(levelTimeMult(1)).toBe(1);
    expect(levelTimeMult(2)).toBeCloseTo(0.96);
  });

  it('temps de service de base pour Potions = 20 s', () => {
    const g = createGame();
    expect(serviceTime(g.stations['course-potions'], 0)).toBeCloseTo(20);
    expect(serviceTime(g.stations.reception, 0)).toBeCloseTo(8);
  });

  it('place améliorée et confort réduisent le temps', () => {
    const g = createGame();
    const dorm = g.stations['dorm-0'];
    dorm.seats[0].level = 3;
    dorm.tracks.fireplace = 2; // +10 confort → −20 %
    expect(serviceTime(dorm, 0)).toBeCloseTo(40 * (1 - 2 * ECONOMY.seatUpgrade.timePerLevel) * 0.8);
  });

  it('étoiles de réputation, population et cadence', () => {
    expect(reputationStars(0)).toBe(0);
    expect(reputationStars(25)).toBe(2);
    const g = createGame();
    expect(populationCap(g)).toBe(Math.floor(4 + 4 * 2 + 1 * 0.5));
    const slow = arrivalInterval(g);
    g.reputation = 100;
    expect(arrivalInterval(g)).toBeLessThan(slow);
  });

  it('attente estimée nulle si une place est libre', () => {
    const g = createGame();
    expect(estimatedWait(g.stations['course-potions'])).toBe(0);
    g.stations.reception.queue = [1, 2, 3];
    expect(estimatedWait(g.stations.reception)).toBeGreaterThan(0);
  });
});

describe('évolution des objets (places)', () => {
  it('change de palier visuel aux niveaux 3 et 5', () => {
    const { seatTier } = jest.requireActual('../modifiers');
    expect([1, 19, 20, 39, 40, 50].map(seatTier)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('une place améliorée rapporte plus d’Éclats et va plus vite', () => {
    const { courseReward } = jest.requireActual('../modifiers');
    const g = createGame();
    const st = g.stations['course-potions'];
    const who = { house: null, mood: 80 };
    const base = courseReward(st, who, undefined, 0);
    st.seats[0].level = 5;
    expect(courseReward(st, who, undefined, 0)).toBeGreaterThan(base);
    expect(serviceTime(st, 0)).toBeLessThan(serviceTime(st, 1));
  });
});
