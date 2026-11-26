import { DAILY_REWARDS } from '../../data/daily';
import { RELICS } from '../../data/collection';
import {
  canClaimDaily,
  canPrestige,
  claimDaily,
  collect,
  collectAll,
  dayNumber,
  deposit,
  grantRelic,
  hireManager,
  managerCost,
  metaCoinMult,
  nextDailyIndex,
  prestige,
  prestigeRequirement,
  storageCap,
} from '../meta';
import { moveSeat } from '../actions';
import { createGame } from '../state';
import { tick } from '../tick';
import { addStudent, quietGame, run } from './helpers';
import type { GameEvent } from '../types';

describe('coffres et récolte', () => {
  it('stocke jusqu’à la capacité puis se récolte', () => {
    const g = createGame();
    const st = g.stations['course-potions'];
    const cap = storageCap(st);
    expect(deposit(st, 50)).toBe(50);
    expect(deposit(st, cap)).toBe(cap - 50);
    expect(st.pending).toBe(cap);
    const coins = g.coins;
    expect(collect(g, st.id)).toBe(cap);
    expect(g.coins).toBe(coins + cap);
    expect(collect(g, st.id)).toBe(0);
    expect(collect(g, 'nope')).toBe(0);
    expect(storageCap(g.stations.hall)).toBe(0);
    deposit(st, 10);
    expect(collectAll(g)).toBe(10);
  });

  it('un manager récolte automatiquement et accélère la salle', () => {
    const g = quietGame();
    const id = 'course-potions';
    g.coins = 0;
    expect(hireManager(g, id)).toBe(false);
    g.coins = 1e6;
    expect(managerCost(g, 'hall')).toBeNull();
    expect(hireManager(g, id)).toBe(true);
    expect(managerCost(g, id)).toBeNull();
    g.stations[id].pending = 40;
    const coins = g.coins;
    tick(g);
    expect(g.stations[id].pending).toBe(0);
    expect(g.coins).toBe(coins + 40);
  });
});

describe('collection et récompense quotidienne', () => {
  it('les reliques augmentent le bonus d’Éclats, les collections complètes encore plus', () => {
    const g = createGame();
    expect(metaCoinMult(g)).toBe(1);
    grantRelic(g, []);
    expect(metaCoinMult(g)).toBeCloseTo(1.01);
    for (const r of RELICS.filter((x) => x.set === 'founders')) g.meta.relics[r.id] = 1;
    expect(metaCoinMult(g)).toBeGreaterThan(1.05);
  });

  it('récompense quotidienne : une fois par jour, série de 7 jours', () => {
    const g = createGame();
    const day = dayNumber(Date.UTC(2026, 10, 26));
    expect(canClaimDaily(g, day)).toBe(true);
    expect(claimDaily(g, day)).toBe(true);
    expect(claimDaily(g, day)).toBe(false);
    for (let d = 1; d < 7; d++) {
      expect(nextDailyIndex(g, day + d)).toBe(d);
      const events: GameEvent[] = [];
      claimDaily(g, day + d, events);
      if (DAILY_REWARDS[d].relic) expect(events.some((e) => e.type === 'relic')).toBe(true);
    }
    expect(nextDailyIndex(g, day + 7)).toBe(0); // le cycle recommence
    expect(nextDailyIndex(g, day + 9)).toBe(0); // série cassée
  });
});

describe('prestige : nouvel environnement', () => {
  it('exige des diplômé·es puis repart de zéro en gardant gemmes et reliques', () => {
    const g = createGame(3);
    expect(canPrestige(g)).toBe(false);
    expect(prestige(g, 1, 0)).toBeNull();
    g.totals.graduated = prestigeRequirement(g);
    g.meta.relics.quill = 2;
    g.gems = 7;
    g.coins = 99999;
    const n = prestige(g, 4, 1000)!;
    expect(n.meta.prestige).toBe(1);
    expect(n.meta.env).toBe(1); // sous-marin
    expect(n.meta.relics.quill).toBe(2);
    expect(n.gems).toBe(17);
    expect(n.coins).toBeLessThan(1000);
    expect(metaCoinMult(n)).toBeCloseTo(1.01 * 1.25);
    expect(prestigeRequirement(n)).toBe(55);
  });
});

describe('événements', () => {
  it('déclenche des événements périodiques', () => {
    const g = quietGame(21);
    g.nextEventAt = 1;
    const events = run(g, 2);
    expect(events.some((e) => e.type === 'event')).toBe(true);
    expect(g.nextEventAt).toBeGreaterThan(g.time);
  });

  it('chaque événement périodique a un effet', () => {
    const { startEvent, isActive } = jest.requireActual('../events');
    const g = quietGame(5);
    const s = addStudent(g, { house: 'azurea', mood: 50 });
    g.stations['course-potions'].seats[0].occupant = s.id;
    const ev: GameEvent[] = [];
    const coins = g.coins;
    startEvent(g, 'banquet', ev);
    expect(s.mood).toBe(60);
    expect(g.coins).toBeGreaterThan(coins);
    expect(isActive(g, 'banquet')).toBe(true);
    startEvent(g, 'ghost', ev);
    expect(s.mood).toBe(50);
    const gems = g.gems;
    startEvent(g, 'owl', ev);
    expect(g.gems).toBe(gems + 1);
    startEvent(g, 'inspection', ev);
    expect(g.reputation).toBe(3);
    g.stations.reception.queue = [1, 2, 3, 4, 5];
    startEvent(g, 'inspection', ev);
    expect(g.reputation).toBe(2);
    startEvent(g, 'shootingStars', ev);
    startEvent(g, 'explosion', ev, 'course-potions');
    expect(g.stations['course-potions'].closedUntil).toBeGreaterThan(g.time);
    expect(ev).toHaveLength(7);
  });

  it('une salle fermée (explosion) suspend ses cours', () => {
    const g = quietGame();
    const s = addStudent(g, { house: 'aurelis' });
    g.stations.reception.queue = [];
    s.activity = { mode: 'free', since: 0 };
    tick(g);
    const seat = g.stations['course-potions'].seats[0];
    const before = seat.remaining;
    g.stations['course-potions'].closedUntil = g.time + 5;
    run(g, 2);
    expect(seat.remaining).toBe(before);
  });
});

describe('réaménagement des places', () => {
  it('déplace une place dans la zone, refuse hors zone ou chevauchement', () => {
    const g = createGame();
    const def = (i: number) => ({ x: 2 + i, y: 2 });
    expect(moveSeat(g, 'course-potions', 0, 6, 6, def)).toBe(true);
    expect(g.stations['course-potions'].seats[0].pos).toEqual({ x: 6, y: 6 });
    expect(moveSeat(g, 'course-potions', 1, 9, 2, def)).toBe(false);
    expect(moveSeat(g, 'course-potions', 1, 6.2, 6.1, def)).toBe(false);
    expect(moveSeat(g, 'course-potions', 99, 3, 3, def)).toBe(false);
    expect(moveSeat(g, 'nope', 0, 3, 3, def)).toBe(false);
  });
});
