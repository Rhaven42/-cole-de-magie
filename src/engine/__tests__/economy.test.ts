import { COURSE_IDS, COURSES } from '../../data/courses';
import { createGame } from '../state';
import {
  addSeat,
  addSeatCost,
  buyCourse,
  buyDorm,
  courseCost,
  dormCost,
  levelUp,
  levelUpCost,
  seatUpgradeCost,
  setSortingBias,
  trackCost,
  upgradeSeat,
  upgradeTrack,
} from '../actions';
import {
  applyPurchase,
  bottleneck,
  globalTarget,
  optimizeStation,
  stationPurchases,
} from '../advisor';

describe('économie et achats', () => {
  it('refuse un achat trop cher sans rien modifier', () => {
    const g = createGame();
    g.coins = 0;
    expect(levelUp(g, 'course-potions')).toBe(false);
    expect(g.stations['course-potions'].level).toBe(1);
    expect(levelUp(g, 'inexistant')).toBe(false);
  });

  it('améliorer une salle coûte base × 1.55^niveau, sans ajouter de place', () => {
    const g = createGame();
    g.coins = 1e6;
    const st = g.stations['course-potions'];
    expect(levelUpCost(st)).toBe(Math.round(40 * 1.55));
    // Une salle qui ouvre n'a qu'une place ; le niveau n'en ajoute pas.
    expect(st.seats.length).toBe(1);
    levelUp(g, st.id);
    expect(st.seats.length).toBe(1);
    levelUp(g, st.id);
    expect(st.level).toBe(3);
    expect(st.seats.length).toBe(1);
    for (let i = 0; i < 20; i++) levelUp(g, st.id);
    expect(st.level).toBe(10);
    expect(levelUpCost(st)).toBeNull();
  });

  it('places supplémentaires au prix croissant, jusqu’au maximum', () => {
    const g = createGame();
    g.coins = 1e9;
    const rec = g.stations.reception;
    const first = addSeatCost(rec)!;
    expect(addSeat(g, 'reception')).toBe(true);
    expect(addSeatCost(rec)!).toBeGreaterThan(first);
    while (addSeat(g, 'reception'));
    expect(rec.seats.length).toBe(6);
    expect(addSeatCost(rec)).toBeNull();
  });

  it('amélioration place par place jusqu’au niveau 5', () => {
    const g = createGame();
    g.coins = 1e9;
    const st = g.stations['course-potions'];
    const c1 = seatUpgradeCost(st, 0)!;
    expect(upgradeSeat(g, st.id, 0)).toBe(true);
    expect(seatUpgradeCost(st, 0)!).toBeGreaterThan(c1);
    while (upgradeSeat(g, st.id, 0));
    expect(st.seats[0].level).toBe(5);
    expect(seatUpgradeCost(st, 99)).toBeNull();
  });

  it('pistes d’aménagement', () => {
    const g = createGame();
    g.coins = 1e9;
    expect(upgradeTrack(g, 'reception', 'waitingRoom')).toBe(true);
    expect(g.stations.reception.tracks.waitingRoom).toBe(1);
    expect(trackCost(g.stations.reception, 'nope')).toBeNull();
    expect(trackCost(g.stations['course-potions'], 'x')).toBeNull();
    while (upgradeTrack(g, 'reception', 'signpost'));
    expect(g.stations.reception.tracks.signpost).toBe(3);
  });

  it('acheter une salle de cours et un dortoir', () => {
    const g = createGame();
    g.coins = 1e9;
    expect(courseCost(g, 'botany')).toBe(120);
    expect(courseCost(g, 'defense')).toBe(COURSES.defense.price);
    expect(buyCourse(g, 'botany')).toBe(true);
    expect(buyCourse(g, 'botany')).toBe(false);
    expect(g.stationOrder.indexOf('course-botany')).toBeLessThan(g.stationOrder.indexOf('hall'));
    const d = dormCost(g)!;
    expect(buyDorm(g)).toBe(true);
    expect(g.stations['dorm-1']).toBeDefined();
    expect(dormCost(g)!).toBeGreaterThan(d);
    while (buyDorm(g));
    expect(dormCost(g)).toBeNull();
  });

  it('orientation du Chapeau seulement au niveau 5', () => {
    const g = createGame();
    expect(setSortingBias(g, 'azurea')).toBe(false);
    g.stations.sorting.level = 5;
    expect(setSortingBias(g, 'azurea')).toBe(true);
    expect(setSortingBias(g, null)).toBe(true);
  });

  it('« Optimiser » propose un achat abordable', () => {
    const g = createGame();
    g.coins = 0;
    expect(optimizeStation(g, g.stations.reception)).toBeNull();
    g.coins = 1000;
    g.stations.reception.queue = [1, 2, 3, 4];
    const p = optimizeStation(g, g.stations.reception)!;
    expect(p.cost).toBeLessThanOrEqual(1000);
    expect(applyPurchase(g, p)).toBe(true);
    expect(stationPurchases(g.stations.hall).length).toBeGreaterThan(0);
  });

  it('le bot cible d’abord les salles, puis le goulot', () => {
    const g = createGame();
    expect(globalTarget(g)).toMatchObject({ kind: 'course', courseId: 'botany' });
    g.coins = 1e8;
    for (const c of COURSE_IDS) buyCourse(g, c);
    g.coins = 1e6;
    g.stations['dorm-0'].queue = Array.from({ length: 40 }, (_, i) => i + 1);
    expect(bottleneck(g).id).toBe('dorm-0');
    const t = globalTarget(g)!;
    expect(['addSeat', 'levelUp', 'dorm']).toContain(t.kind);
    expect(applyPurchase(g, t)).toBe(true);
    g.stations['dorm-0'].queue = [];
    expect(globalTarget(g)).not.toBeNull();
    for (const p of [
      { kind: 'seat' as const, stationId: 'hall', seat: 0, cost: 0 },
      { kind: 'track' as const, stationId: 'hall', trackId: 'kitchen', cost: 0 },
      { kind: 'dorm' as const, cost: 0 },
      { kind: 'addSeat' as const, stationId: 'hall', cost: 0 },
      { kind: 'levelUp' as const, stationId: 'hall', cost: 0 },
    ]) {
      expect(applyPurchase(g, p)).toBe(true);
    }
  });
});
